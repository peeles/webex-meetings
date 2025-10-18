<template>
    <div class="h-screen w-screen bg-gray-900 flex flex-col overflow-hidden">
        <header class="bg-gray-800 px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div class="flex items-center gap-4">
                <h2 class="text-white font-semibold">
                    {{ meetingTitle }}
                </h2>
            </div>

            <div class="flex items-center gap-2">
                <BaseBadge variant="success">Live</BaseBadge>
            </div>
        </header>

        <main class="flex-1 overflow-hidden">
            <slot />
        </main>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useMeetingsStore } from '@/storage/meetings.js';
import BaseBadge from '../base/BaseBadge.vue';

const meetingsStore = useMeetingsStore();

const selectedLayout = ref(meetingsStore.currentLayout);

const meetingTitle = computed(() => {
    const meeting = meetingsStore.currentMeeting;
    return meeting?.sipUri || meeting?.destination || 'Meeting';
});

watch(() => meetingsStore.currentLayout, (newLayout) => {
    selectedLayout.value = newLayout;
});

</script>
