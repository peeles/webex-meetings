<template>
    <div class="relative w-full h-full">
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
            data-testid="video-grid"
        >
            <VideoPane
                v-for="pane in gridPanes"
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

            <div
                v-if="overflowCount"
                class="flex items-center justify-center bg-black/80 text-white text-xl font-semibold rounded-lg"
                data-testid="overflow-count-tile"
            >
                +{{ overflowCount }}
            </div>
        </div>

        <button
            v-if="localStream && !showLocalPreview"
            type="button"
            class="absolute top-4 right-4 z-20 bg-black/70 text-white text-sm px-3 py-1 rounded-md shadow-lg hover:bg-black/90"
            @click="showLocalPreviewAgain"
            data-testid="show-local-preview"
        >
            Show self view
        </button>

        <div
            v-if="localStream && showLocalPreview"
            class="absolute top-4 right-4 z-20 w-56"
            data-testid="local-preview"
        >
            <div class="relative">
                <VideoPane
                    :stream="localStream"
                    participant-name="You"
                    source-state="live"
                    :is-local="true"
                    size="small"
                    class="shadow-lg border border-white/10"
                />
                <button
                    type="button"
                    class="absolute -top-2 -right-2 bg-black text-white text-xs px-2 py-1 rounded-full shadow-lg hover:bg-black/80"
                    @click="hideLocalPreview"
                    data-testid="hide-local-preview"
                >
                    ✕
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
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

const MAX_GRID_TILES = 9;
const MAX_REMOTE_WITHOUT_OVERFLOW_TILE = MAX_GRID_TILES - 1;

const layoutClassMap = {
    AllEqual: 'grid-cols-3 grid-rows-3',
    Spotlight: 'grid-cols-1 grid-rows-1'
};

const gridClasses = computed(() => {
    return layoutClassMap[props.layout] || layoutClassMap.AllEqual;
});

const remotePanes = computed(() => {
    return props.panes.filter(pane => pane.sourceState !== 'no source');
});

const overflowCount = computed(() => {
    return Math.max(remotePanes.value.length - MAX_REMOTE_WITHOUT_OVERFLOW_TILE, 0);
});

const gridPanes = computed(() => {
    if (overflowCount.value > 0) {
        return remotePanes.value.slice(0, MAX_REMOTE_WITHOUT_OVERFLOW_TILE);
    }
    return remotePanes.value.slice(0, MAX_GRID_TILES);
});

const pinnedParticipant = computed(() => {
    if (!participantsStore.pinnedParticipantId) {
        return null;
    }
    return remotePanes.value.find(p => p.memberId === participantsStore.pinnedParticipantId);
});

const unpinnedPanes = computed(() => {
    if (!participantsStore.pinnedParticipantId) {
        return remotePanes.value;
    }
    return remotePanes.value.filter(p => p.memberId !== participantsStore.pinnedParticipantId);
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

const showLocalPreview = ref(true);

watch(() => props.localStream, (stream) => {
    showLocalPreview.value = stream;
});

const hideLocalPreview = () => {
    showLocalPreview.value = false;
};

const showLocalPreviewAgain = () => {
    showLocalPreview.value = true;
};
</script>
