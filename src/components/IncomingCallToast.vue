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
                        <font-awesome-icon
                            icon="phone"
                            class="w-6 h-6 text-blue-500"
                        />
                    </div>
                    <div>
                        <h3
                            class="text-sm font-semibold text-gray-900 dark:text-white"
                        >
                            Incoming Call
                        </h3>
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                            {{ callerName || 'Unknown' }}
                        </p>
                    </div>
                </div>
            </div>

            <div
                v-if="meetingDetails"
                class="mb-4 p-2 bg-gray-50 dark:bg-gray-900 rounded text-xs"
            >
                <p class="text-gray-600 dark:text-gray-300 truncate">
                    {{ meetingDetails }}
                </p>
            </div>

            <div class="flex gap-2">
                <button
                    class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors duration-200"
                    @click="handleAnswer"
                >
                    <font-awesome-icon icon="phone" class="w-4 h-4" />
                    Answer
                </button>
                <button
                    class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors duration-200"
                    @click="handleDecline"
                >
                    <font-awesome-icon icon="phone-slash" class="w-4 h-4" />
                    Decline
                </button>
            </div>

            <div
                v-if="showTimer"
                class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700"
            >
                <div
                    class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400"
                >
                    <span>Auto-decline in</span>
                    <span class="font-mono font-semibold"
                        >{{ remainingTime }}s</span
                    >
                </div>
                <div
                    class="mt-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1"
                >
                    <div
                        class="bg-red-500 h-1 rounded-full transition-all duration-1000"
                        :style="{
                            width: `${(remainingTime / autoDeclineTime) * 100}%`,
                        }"
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
        default: false,
    },
    callerName: {
        type: String,
        default: '',
    },
    meetingDetails: {
        type: String,
        default: '',
    },
    meetingId: {
        type: String,
        default: '',
    },
    autoDeclineTime: {
        type: Number,
        default: 30, // 30 seconds
    },
    showTimer: {
        type: Boolean,
        default: true,
    },
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
watch(
    () => props.isVisible,
    (visible) => {
        if (visible) {
            startTimer();
        } else {
            stopTimer();
        }
    },
    { immediate: true }
);

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
