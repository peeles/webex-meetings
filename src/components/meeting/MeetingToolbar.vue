<template>
    <div class="flex items-center justify-center gap-4 px-6 py-4 bg-white rounded-tl-3xl rounded-tr-3xl shadow-2xl border-2 border-gray-300">
        <IconButton
            :icon="audioMuted ? 'mic-off' : 'mic'"
            :variant="audioMuted ? 'danger' : 'secondary'"
            @click="$emit('toggleAudio')"
        />

        <IconButton
            :icon="videoMuted ? 'video-off' : 'video'"
            :variant="videoMuted ? 'danger' : 'secondary'"
            @click="$emit('toggleVideo')"
        />

        <IconButton
            v-if="isModerator"
            :icon="meetingLocked ? 'lock' : 'unlock'"
            variant="secondary"
            @click="$emit('toggleLock')"
        />

        <IconButton
            icon="users"
            variant="secondary"
            @click="$emit('toggleParticipants')"
        />

        <BaseButton
            :class="'!rounded-full !py-1.5'"
            variant="danger"
            @click="$emit('leave')"
        >
            {{ isModerator ? 'End Meeting' : 'Leave' }}
        </BaseButton>
    </div>
</template>

<script setup>
import BaseButton from '../base/BaseButton.vue';
import IconButton from '../base/IconButton.vue';

defineProps({
    audioMuted: {
        type: Boolean,
        default: false
    },
    videoMuted: {
        type: Boolean,
        default: false
    },
    meetingLocked: {
        type: Boolean,
        default: false
    },
    isModerator: {
        type: Boolean,
        default: false
    }
});

defineEmits(['toggleAudio', 'toggleVideo', 'toggleLock', 'toggleParticipants', 'leave']);
</script>
