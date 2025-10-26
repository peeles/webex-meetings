<template>
    <div
        class="relative aspect-video bg-black rounded-lg overflow-hidden group"
        :class="containerClasses"
    >
        <video
            ref="videoEl"
            autoplay
            playsinline
            :muted="isLocal"
            class="w-full h-full object-cover"
        />

        <div
            v-if="sourceState !== 'live'"
            class="absolute inset-0 flex items-center justify-center bg-black/60"
        >
            <p class="text-white text-sm">
                {{ getStateLabel(sourceState) }}
            </p>
        </div>

        <div
            class="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-white text-sm"
        >
            {{ participantName }}
        </div>

        <!-- Pin/Unpin Button (only show for remote participants AND moderators) -->
        <button
            v-if="!isLocal && memberId && isModerator"
            class="absolute top-2 right-2 bg-black/70 hover:bg-black/90 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            :title="isPinned ? 'Unpin participant' : 'Pin participant'"
            @click.stop="handlePinToggle"
        >
            <font-awesome-icon
                :icon="isPinned ? 'bookmark' : ['far', 'bookmark']"
                :class="
                    isPinned ? 'h-5 w-5 text-blue-400' : 'h-5 w-5 text-white'
                "
            />
        </button>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useMeetingsStore } from '@/storage/meetings.js';
import { getStateLabel } from '@/utils/helpers.js';
import { PANE_SIZES, SOURCE_STATES } from '@/dicts/constants.js';

const meetingsStore = useMeetingsStore();

const props = defineProps({
    stream: {
        type: MediaStream,
        default: null,
    },
    participantName: {
        type: String,
        default: 'Participant',
    },
    sourceState: {
        type: String,
        default: 'live',
        validator: (val) => Object.values(SOURCE_STATES).includes(val),
    },
    isLocal: {
        type: Boolean,
        default: false,
    },
    size: {
        type: String,
        default: 'medium',
        validator: (val) => Object.values(PANE_SIZES).includes(val),
    },
    memberId: {
        type: String,
        default: null,
    },
    isPinned: {
        type: Boolean,
        default: false,
    },
});

const emit = defineEmits(['pin', 'unpin']);
const videoEl = ref(null);

const isModerator = computed(() => meetingsStore.isModerator);

const containerClasses = computed(() => {
    const sizes = {
        small: 'w-32',
        medium: 'w-full',
        large: 'w-full h-full',
    };

    return sizes[props.size] || sizes.medium;
});

// Set initial stream on mount
onMounted(() => {
    if (videoEl.value && props.stream) {
        videoEl.value.srcObject = props.stream;
    }
});

// Watch for stream changes
watch(
    () => props.stream,
    (newStream) => {
        if (videoEl.value) {
            // Set new stream or clear srcObject if null
            videoEl.value.srcObject = newStream;
        }
    }
);

// Clean up video element before unmounting
onBeforeUnmount(() => {
    if (videoEl.value) {
        videoEl.value.srcObject = null;
    }
});

const handlePinToggle = () => {
    if (props.isPinned) {
        emit('unpin', props.memberId);
    } else {
        emit('pin', props.memberId);
    }
};
</script>
