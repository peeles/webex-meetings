<template>
    <div
        v-if="pinnedParticipant"
        class="flex w-full h-full p-4 gap-4"
    >
        <div class="flex-1 flex items-center justify-center">
            <VideoPane
                :key="pinnedParticipant.id"
                :stream="pinnedParticipant.stream"
                :participant-name="getParticipantName(pinnedParticipant.memberId)"
                :source-state="pinnedParticipant.sourceState"
                :member-id="pinnedParticipant.memberId"
                :is-pinned="true"
                :is-local="false"
                size="large"
                @pin="handlePin"
                @unpin="handleUnpin"
            />
        </div>
    </div>

    <div
        v-else
        class="grid gap-2 p-4 w-full h-full"
        :class="gridClasses"
    >
        <VideoPane
            v-for="pane in visiblePanes"
            :key="pane.id"
            :stream="pane.stream"
            :participant-name="getParticipantName(pane.memberId)"
            :source-state="pane.sourceState"
            :member-id="pane.memberId"
            :is-pinned="false"
            :is-local="false"
            size="medium"
            @pin="handlePin"
            @unpin="handleUnpin"
        />

        <VideoPane
            v-if="localStream"
            :stream="localStream"
            participant-name="You"
            source-state="live"
            :is-local="true"
            size="medium"
        />
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { useParticipantsStore } from '@/storage/participants.js';
import { useMeetingsStore } from '@/storage/meetings.js';
import VideoPane from './VideoPane.vue';

const props = defineProps({
    panes: {
        type: Array,
        default: () => []
    },
    localStream: {
        type: MediaStream,
        default: null
    },
    layout: {
        type: String,
        default: 'AllEqual'
    }
});

const participantsStore = useParticipantsStore();
const meetingsStore = useMeetingsStore();

const gridClasses = computed(() => {
    return 'grid-cols-3 grid-rows-3'; // Always use AllEqual 3x3 grid
});

const visiblePanes = computed(() => {
    return props.panes.filter(p => p.sourceState !== 'no source');
});

const pinnedParticipant = computed(() => {
    if (!participantsStore.pinnedParticipantId) {
        return null;
    }
    return visiblePanes.value.find(p => p.memberId === participantsStore.pinnedParticipantId);
});

const unpinnedPanes = computed(() => {
    if (!participantsStore.pinnedParticipantId) {
        return visiblePanes.value;
    }
    return visiblePanes.value.filter(p => p.memberId !== participantsStore.pinnedParticipantId);
});

const getParticipantName = (memberId) => {
    const participant = participantsStore.participants.get(memberId);
    return participant?.name || 'Participant';
};

const handlePin = async (memberId) => {
    if (!meetingsStore.isModerator) {
        console.warn('Only moderators can pin participants');
        return;
    }

    participantsStore.pinParticipant(memberId);

    // Broadcast to all participants
    const { useWebexMeetings } = await import('../../composables/useWebexMeetings.js');
    const { broadcastPinState } = useWebexMeetings();

    if (meetingsStore.currentMeetingId) {
        await broadcastPinState(meetingsStore.currentMeetingId, memberId);
    }
};

const handleUnpin = async () => {
    if (!meetingsStore.isModerator) {
        console.warn('Only moderators can unpin participants');
        return;
    }

    participantsStore.unpinParticipant();

    // Broadcast to all participants
    const { useWebexMeetings } = await import('../../composables/useWebexMeetings.js');
    const { broadcastPinState } = useWebexMeetings();

    if (meetingsStore.currentMeetingId) {
        await broadcastPinState(meetingsStore.currentMeetingId, null);
    }
};
</script>
