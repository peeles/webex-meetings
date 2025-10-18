<template>
    <select
        :value="modelValue"
        :disabled="disabled"
        class="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
        @change="$emit('update:modelValue', $event.target.value)"
    >
        <option v-if="placeholder" value="" disabled>
            {{ placeholder }}
        </option>
        <slot />
    </select>
</template>

<script setup>
defineProps({
    modelValue: {
        type: [String, Number],
        default: ''
    },
    placeholder: {
        type: String,
        default: ''
    },
    disabled: {
        type: Boolean,
        default: false
    }
});

defineEmits(['update:modelValue']);
</script>
