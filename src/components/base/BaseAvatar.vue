<template>
    <div :class="avatarClasses">
        {{ initials }}
    </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    name: {
        type: String,
        required: true,
    },
    size: {
        type: String,
        default: 'md',
        validator: (v) => ['sm', 'md', 'lg'].includes(v),
    },
});

const initials = computed(() => {
    return props.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
});

const avatarClasses = computed(() => {
    const base =
        'inline-flex items-center justify-center rounded-full bg-blue-500 text-white font-semibold';
    const sizes = {
        sm: 'h-8 w-8 text-xs',
        md: 'h-10 w-10 text-sm',
        lg: 'h-12 w-12 text-base',
    };
    return `${base} ${sizes[props.size]}`;
});
</script>
