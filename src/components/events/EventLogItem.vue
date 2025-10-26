<template>
    <div class="text-stone-700">
        <span class="text-stone-500">{{ event.timestamp }}</span>
        <span class="ml-2">{{ event.message }}</span>
    </div>
</template>

<script setup>
defineProps({
    event: {
        type: Object,
        required: true,
    },
});
</script>
