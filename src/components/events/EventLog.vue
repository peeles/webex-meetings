<template>
    <div class="bg-white rounded-lg border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold">Events Log</h2>
            <BaseButton size="sm" variant="secondary" @click="clearLog">
                Clear
            </BaseButton>
        </div>

        <div class="h-64 overflow-y-auto space-y-1 font-mono text-sm">
            <EventLogItem
                v-for="(event, index) in events"
                :key="index"
                :event="event"
            />
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import BaseButton from '../base/BaseButton.vue';
import EventLogItem from './EventLogItem.vue';

const events = ref([]);

const clearLog = () => {
    events.value = [];
};

defineExpose({ events });
</script>
