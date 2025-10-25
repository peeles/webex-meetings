<template>
    <Transition
        enter-active-class="transition ease-out duration-300"
        enter-from-class="translate-y-full opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="translate-y-full opacity-0"
    >
        <div
            v-if="isVisible"
            class="fixed bottom-6 right-6 z-50 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 w-86"
        >
            <div class="flex items-start justify-between mb-3">
                <div class="flex items-center gap-3">
                    <div class="animate-bounce">
                        <svg class="w-6 h-6 text-blue-500" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                    </div>
                    <div>
                        <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
                            Incoming Call
                        </h3>
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                            {{ callerName || 'Unknown' }}
                        </p>
                    </div>
                </div>
            </div>

            <div v-if="meetingDetails" class="mb-4 p-2 bg-gray-50 dark:bg-gray-900 rounded text-xs">
                <p class="text-gray-600 dark:text-gray-300 truncate">
                    {{ meetingDetails }}
                </p>
            </div>

            <div class="flex gap-2">
                <button
                    @click="handleAnswer"
                    class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors duration-200"
                >
                    <svg class="w-4 h-4" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Answer
                </button>
                <button
                    @click="handleDecline"
                    class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors duration-200"
                >
                    <svg class="w-4 h-4" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.516l2.257-1.13a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                    </svg>
                    Decline
                </button>
            </div>

            <div v-if="showTimer" class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>Auto-decline in</span>
                    <span class="font-mono font-semibold">{{ remainingTime }}s</span>
                </div>
                <div class="mt-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                    <div
                        class="bg-red-500 h-1 rounded-full transition-all duration-1000"
                        :style="{ width: `${(remainingTime / autoDeclineTime) * 100}%` }"
                    ></div>
                </div>
            </div>
        </div>
    </Transition>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue';

const props = defineProps({
    isVisible: {
        type: Boolean,
        default: false
    },
    callerName: {
        type: String,
        default: ''
    },
    meetingDetails: {
        type: String,
        default: ''
    },
    meetingId: {
        type: String,
        default: ''
    },
    autoDeclineTime: {
        type: Number,
        default: 30 // 30 seconds
    },
    showTimer: {
        type: Boolean,
        default: true
    }
});

const emit = defineEmits(['answer', 'decline', 'timeout']);

const remainingTime = ref(props.autoDeclineTime);
let timerInterval = null;

// Start countdown timer
const startTimer = () => {
    remainingTime.value = props.autoDeclineTime;

    if (timerInterval) {
        clearInterval(timerInterval);
    }

    timerInterval = setInterval(() => {
        remainingTime.value--;

        if (remainingTime.value <= 0) {
            clearInterval(timerInterval);
            emit('timeout', props.meetingId);
            handleDecline();
        }
    }, 1000);
};

// Stop timer
const stopTimer = () => {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
};

// Watch for visibility changes
watch(() => props.isVisible, (visible) => {
    if (visible) {
        startTimer();
    } else {
        stopTimer();
    }
}, { immediate: true });

// Cleanup on unmount
onUnmounted(() => {
    stopTimer();
});

const handleAnswer = () => {
    stopTimer();
    emit('answer', props.meetingId);
};

const handleDecline = () => {
    stopTimer();
    emit('decline', props.meetingId);
};
</script>
