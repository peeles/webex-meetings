<template>
    <MeetingLayout>
        <div class="relative w-full h-screen overflow-hidden">
            <div class="absolute inset-0">
                <VideoGrid
                    :panes="mediaStore.remotePanes"
                    :local-stream="mediaStore.localStreams.camera?.outputStream"
                    :layout="meetingsStore.currentLayout"
                />

                <ParticipantList
                    v-if="showParticipants"
                    class="absolute right-0 top-0 h-full w-80 z-10"
                    @close="showParticipants = false"
                />
            </div>

            <div class="absolute bottom-0 left-0 right-0 flex justify-center z-20 p-11">
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
import { useMediaStore } from '../storage/media';
import { useMeetingsStore } from '../storage/meetings';
import { useWebexMeetings } from '../composables/useWebexMeetings';
import { useWebexMedia } from '../composables/useWebexMedia';
import MeetingLayout from '../components/layouts/MeetingLayout.vue';
import VideoGrid from '@components/video/VideoGrid.vue';
import MeetingToolbar from '@components/meeting/MeetingToolbar.vue';
import ParticipantList from '@components/participants/ParticipantList.vue';

const route = useRoute();
const router = useRouter();
const mediaStore = useMediaStore();
const meetingsStore = useMeetingsStore();
const { joinMeeting, leaveMeeting } = useWebexMeetings();
const { createMicrophoneStream, createCameraStream, toggleMicrophone, toggleCamera } = useWebexMedia();

const showParticipants = ref(false);

onMounted(async () => {
    try {
        // Check if browser is HTTPS (required for media)
        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
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
</script>
