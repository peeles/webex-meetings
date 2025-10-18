<template>
    <div class="text-gray-700">
        <span class="text-gray-500">{{ event.timestamp }}</span>
        <span class="ml-2">{{ event.message }}</span>
    </div>
</template>

<script setup>
defineProps({
    event: {
        type: Object,
        required: true
    }
});
</script>
