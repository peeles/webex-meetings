<template>
    <div
        class="bg-white rounded-lg border border-stone-200 p-4 flex items-center justify-between"
    >
        <div>
            <p class="font-medium">
                {{ meeting.sipUri || meeting.destination }}
            </p>
            <p class="text-sm text-stone-500">{{ meeting.id }}</p>
        </div>

        <BaseButton size="sm" @click="$emit('join', meeting.id)">
            Join
        </BaseButton>
    </div>
</template>

<script setup>
import BaseButton from '@/components/base/BaseButton.vue';

defineProps({
    meeting: {
        type: Object,
        required: true,
    },
});

defineEmits(['join']);
</script>
