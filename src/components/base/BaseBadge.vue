<template>
    <span :class="badgeClasses">
        <slot />
    </span>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    variant: {
        type: String,
        default: 'default',
        validator: (v) =>
            ['default', 'success', 'danger', 'warning', 'secondary'].includes(
                v
            ),
    },
});

const badgeClasses = computed(() => {
    const base =
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';

    const variants = {
        default: 'bg-stone-100 text-stone-800',
        success: 'bg-green-100 text-green-800',
        danger: 'bg-red-100 text-red-800',
        warning: 'bg-yellow-100 text-yellow-800',
        secondary: 'bg-blue-100 text-blue-800',
    };

    return `${base} ${variants[props.variant]}`;
});
</script>
