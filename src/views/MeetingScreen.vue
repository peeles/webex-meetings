<template>
    <MeetingLayout>
        <div class="relative w-full h-screen overflow-hidden">
            <div class="absolute inset-0">
                <VideoLayout
                    :panes="mediaStore.remotePanes"
                    :local-stream="mediaStore.localStreams.camera?.outputStream"
                    :layout="meetingsStore.currentLayout"
                />

                <ParticipantList
                    v-if="showParticipants"
                    :is-moderator="meetingsStore.isModerator"
                    class="absolute right-0 top-0 h-full w-80 z-10"
                    @close="showParticipants = false"
                    @admit="handleAdmitParticipant"
                    @mute-audio="handleMuteAudio"
                    @mute-video="handleMuteVideo"
                    @pin="handlePinParticipant"
                    @unpin="handleUnpinParticipant"
                    @remove="handleRemoveParticipant"
                />
            </div>

            <div
                class="absolute bottom-0 left-0 right-0 flex justify-center z-20 p-11"
            >
                <MeetingToolbar
                    :audio-muted="mediaStore.mediaStates.audioMuted"
                    :video-muted="mediaStore.mediaStates.videoMuted"
                    :meeting-locked="false"
                    :is-moderator="meetingsStore.isModerator"
                    @toggle-audio="toggleAudio"
                    @toggle-video="toggleVideo"
                    @toggle-participants="showParticipants = !showParticipants"
                    @leave="handleLeave"
                />
            </div>
        </div>
    </MeetingLayout>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMediaStore } from '@/storage/media';
import { useMeetingsStore } from '@/storage/meetings';
import { useParticipantsStore } from '@/storage/participants';
import { useWebexMeetings } from '@/composables/useWebexMeetings';
import { useWebexMedia } from '@/composables/useWebexMedia';
import MeetingLayout from '@components/layouts/MeetingLayout.vue';
import VideoLayout from '@components/video/VideoLayout.vue';
import MeetingToolbar from '@components/meeting/MeetingToolbar.vue';
import ParticipantList from '@components/participants/ParticipantList.vue';

const route = useRoute();
const router = useRouter();
const mediaStore = useMediaStore();
const meetingsStore = useMeetingsStore();
const participantsStore = useParticipantsStore();
const {
    joinMeeting,
    leaveMeeting,
    muteParticipant,
    removeParticipant,
    admitFromLobby,
    broadcastPinState,
} = useWebexMeetings();
const {
    createMicrophoneStream,
    createCameraStream,
    toggleMicrophone,
    toggleCamera,
} = useWebexMedia();

const showParticipants = ref(false);

onMounted(async () => {
    try {
        // Check if browser is HTTPS (required for media)
        if (
            window.location.protocol !== 'https:' &&
            window.location.hostname !== 'localhost'
        ) {
            console.error('HTTPS required for media access');
        }

        await createMicrophoneStream();
        await createCameraStream();
        await joinMeeting(route.params.id);
    } catch (err) {
        console.error('Failed to join meeting:', err);
        alert('Error: ' + err.message);
    }
});

onUnmounted(async () => {
    if (meetingsStore.currentMeetingId) {
        await leaveMeeting(meetingsStore.currentMeetingId);
    }
});

const toggleAudio = () => {
    toggleMicrophone();
};

const toggleVideo = () => {
    toggleCamera();
};

const handleLeave = async () => {
    await leaveMeeting(route.params.id);
    await router.push({ name: 'home' });
};

const handleAdmitParticipant = async (participantId) => {
    try {
        await admitFromLobby(meetingsStore.currentMeetingId, participantId);
    } catch (err) {
        console.error('Failed to admit participant:', err);
    }
};

const handleMuteAudio = async (participantId) => {
    try {
        await muteParticipant(meetingsStore.currentMeetingId, participantId, true);
    } catch (err) {
        console.error('Failed to mute participant audio:', err);
    }
};

const handleMuteVideo = async (participantId) => {
    try {
        // TODO: Implement video muting when SDK supports it
        console.warn('Video muting not yet implemented', participantId);
    } catch (err) {
        console.error('Failed to mute participant video:', err);
    }
};

const handlePinParticipant = async (participantId) => {
    try {
        participantsStore.pinParticipant(participantId);
        await broadcastPinState(meetingsStore.currentMeetingId, participantId);
    } catch (err) {
        console.error('Failed to pin participant:', err);
    }
};

const handleUnpinParticipant = async () => {
    try {
        participantsStore.unpinParticipant();
        await broadcastPinState(meetingsStore.currentMeetingId, null);
    } catch (err) {
        console.error('Failed to unpin participant:', err);
    }
};

const handleRemoveParticipant = async (participantId) => {
    try {
        await removeParticipant(meetingsStore.currentMeetingId, participantId);
    } catch (err) {
        console.error('Failed to remove participant:', err);
    }
};
</script>
