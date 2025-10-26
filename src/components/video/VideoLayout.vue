<template>
    <div class="relative flex flex-1 flex-col items-center justify-center w-full h-full">
        <!-- Outer container with consistent bottom padding -->
        <div class="container-video-grid pb-8 flex flex-1 items-center justify-center w-full h-full mx-auto">

            <!-- PINNED LAYOUT -->
            <div
                v-if="pinnedParticipant"
                class="flex flex-col lg:flex-row w-full h-full p-2 lg:p-4 gap-3 lg:gap-6 items-center justify-center"
                data-testid="pinned-layout"
            >
                <div
                    class="relative flex-1 flex items-center justify-center min-h-[200px] max-h-full w-full lg:w-auto rounded-xl overflow-hidden"
                >
                    <VideoPane
                        :key="pinnedParticipant.id"
                        :stream="pinnedParticipant.stream"
                        :participant-name="getParticipantName(pinnedParticipant.memberId)"
                        :source-state="pinnedParticipant.sourceState"
                        :member-id="pinnedParticipant.memberId"
                        :is-pinned="true"
                        :is-local="false"
                        size="large"
                        class="w-full h-full object-cover"
                        @pin="handlePin"
                        @unpin="handleUnpin"
                    />
                </div>
            </div>

            <!-- GRID LAYOUT -->
            <div
                v-else
                class="grid w-full h-full p-2 lg:p-4 gap-3 lg:gap-5 place-content-center auto-rows-[minmax(120px,1fr)]"
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
                    class="rounded-xl overflow-hidden"
                    @pin="handlePin"
                    @unpin="handleUnpin"
                />

                <div
                    v-if="overflowCount"
                    class="flex items-center justify-center bg-black/80 text-white text-lg lg:text-xl font-semibold rounded-lg"
                    data-testid="overflow-count-tile"
                >
                    +{{ overflowCount }}
                </div>
            </div>
        </div>

        <!-- LOCAL PREVIEW BUTTON -->
        <button
            v-if="localStream && !showLocalPreview"
            type="button"
            class="absolute top-4 right-4 z-20 bg-black/70 text-white text-xs md:text-sm px-3 py-1 rounded-md shadow hover:bg-black/90"
            data-testid="show-local-preview"
            @click="showLocalPreviewAgain"
        >
            Show self view
        </button>

        <!-- LOCAL PREVIEW WINDOW -->
        <div
            v-if="localStream && showLocalPreview"
            class="absolute top-4 right-4 z-20 w-40 sm:w-56 rounded-lg overflow-hidden shadow-lg border border-white/10"
            data-testid="local-preview"
        >
            <div class="relative">
                <VideoPane
                    :stream="localStream"
                    participant-name="You"
                    source-state="live"
                    is-local
                    size="medium"
                    class="object-cover"
                />
                <button
                    type="button"
                    class="absolute -top-2 -right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full shadow hover:bg-black/90"
                    data-testid="hide-local-preview"
                    @click="hideLocalPreview"
                >
                    <FontAwesomeIcon icon="xmark" />
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
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

const props = defineProps({
    panes: {
        type: Array,
        default: () => [],
    },
    localStream: {
        type: MediaStream,
        default: null,
    },
    layout: {
        type: String,
        default: 'AllEqual',
    },
});

const participantsStore = useParticipantsStore();
const meetingsStore = useMeetingsStore();

const MAX_GRID_TILES = 9;
const MAX_REMOTE_WITHOUT_OVERFLOW_TILE = MAX_GRID_TILES - 1;

const gridClasses = computed(() => {
    switch (remotePanes.value.length) {
        case 2:
            return 'grid-cols-2 grid-rows-1';
        case 3:
        case 4:
            return 'grid-cols-2 grid-rows-2';
        case 5:
        case 6:
            return 'grid-cols-3 grid-rows-2';
        case 7:
        case 8:
        case 9:
            return 'grid-cols-3 grid-rows-3';
        default:
            return 'grid-cols-1 grid-rows-1';
    }
});

const remotePanes = computed(() => {
    return props.panes.filter((pane) => pane.sourceState !== 'no source');
});

const overflowCount = computed(() => {
    return Math.max(
        remotePanes.value.length - MAX_REMOTE_WITHOUT_OVERFLOW_TILE,
        0
    );
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
    return remotePanes.value.find(
        (p) => p.memberId === participantsStore.pinnedParticipantId
    );
});

const unpinnedPanes = computed(() => {
    if (!participantsStore.pinnedParticipantId) {
        return remotePanes.value;
    }
    return remotePanes.value.filter(
        (p) => p.memberId !== participantsStore.pinnedParticipantId
    );
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
    const { useWebexMeetings } = await import(
        '../../composables/useWebexMeetings.js'
    );
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
    const { useWebexMeetings } = await import(
        '../../composables/useWebexMeetings.js'
    );
    const { broadcastPinState } = useWebexMeetings();

    if (meetingsStore.currentMeetingId) {
        await broadcastPinState(meetingsStore.currentMeetingId, null);
    }
};

const showLocalPreview = ref(true);

watch(
    () => props.localStream,
    (stream) => {
        showLocalPreview.value = stream;
    }
);

const hideLocalPreview = () => {
    showLocalPreview.value = false;
};

const showLocalPreviewAgain = () => {
    showLocalPreview.value = true;
};
</script>
