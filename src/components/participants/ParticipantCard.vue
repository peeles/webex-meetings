<template>
    <div class="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50">
        <div class="flex items-center gap-3">
            <BaseAvatar :name="participant.name" />
            <div>
                <p class="font-medium text-sm">
                    {{ participant.name }}
                    <span v-if="participant.isSelf" class="text-gray-500">(You)</span>
                </p>
                <p class="text-xs text-gray-500">{{ statusText }}</p>
            </div>
        </div>

        <div class="flex flex-col items-center gap-2">
            <BaseBadge :variant="participant.isAudioMuted ? 'danger' : 'success'">
                {{ participant.isAudioMuted ? 'Muted' : 'Audio' }}
            </BaseBadge>
            <BaseBadge :variant="participant.isVideoMuted ? 'secondary' : 'success'">
                {{ participant.isVideoMuted ? 'No Video' : 'Video' }}
            </BaseBadge>

            <slot name="actions" />
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import BaseAvatar from '../base/BaseAvatar.vue';
import BaseBadge from '../base/BaseBadge.vue';

const props = defineProps({
    participant: {
        type: Object,
        required: true
    }
});

const statusText = computed(() => {
    return props.participant.status.replace('_', ' ').toLowerCase();
});
</script>
