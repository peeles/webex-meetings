<template>
    <div
        class="flex items-center justify-center gap-4 px-6 py-4 bg-white rounded-tl-3xl rounded-tr-3xl shadow-2xl border-2 border-stone-300"
    >
        <BaseButton
            :variant="audioMuted ? 'danger' : 'secondary'"
            class="!h-auto !p-3 rounded-full"
            @click="$emit('toggleAudio')"
        >
            <font-awesome-icon
                :icon="audioMuted ? 'microphone-slash' : 'microphone'"
                class="w-5 h-5"
            />
        </BaseButton>

        <BaseButton
            :variant="videoMuted ? 'danger' : 'secondary'"
            class="!h-auto !p-3 rounded-full"
            @click="$emit('toggleVideo')"
        >
            <font-awesome-icon
                :icon="videoMuted ? 'video-slash' : 'video'"
                class="w-5 h-5"
            />
        </BaseButton>

        <BaseButton
            v-if="isModerator"
            variant="secondary"
            class="!h-auto !p-3 rounded-full"
            @click="$emit('toggleLock')"
        >
            <font-awesome-icon
                :icon="meetingLocked ? 'lock' : 'unlock'"
                class="w-5 h-5"
            />
        </BaseButton>

        <BaseButton
            variant="secondary"
            class="!h-auto !p-3 rounded-full"
            @click="$emit('toggleParticipants')"
        >
            <font-awesome-icon icon="users" class="w-5 h-5" />
        </BaseButton>

        <BaseButton
            :class="'!rounded-full !py-1.5 text-nowrap'"
            variant="danger"
            @click="$emit('leave')"
        >
            {{ isModerator ? 'End Meeting' : 'Leave' }}
        </BaseButton>
    </div>
</template>

<script setup>
import BaseButton from '@/components/base/BaseButton.vue';

defineProps({
    audioMuted: {
        type: Boolean,
        default: false,
    },
    videoMuted: {
        type: Boolean,
        default: false,
    },
    meetingLocked: {
        type: Boolean,
        default: false,
    },
    isModerator: {
        type: Boolean,
        default: false,
    },
});

defineEmits([
    'toggleAudio',
    'toggleVideo',
    'toggleLock',
    'toggleParticipants',
    'leave',
]);
</script>
