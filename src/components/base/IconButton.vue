<template>
    <button
        :type="type"
        :disabled="disabled"
        :class="buttonClasses"
        :title="icon"
        @click="$emit('click', $event)"
    >
        <span class="sr-only">{{ icon }}</span>
        <font-awesome-icon :icon="faIcon" class="w-5 h-5" />
        <slot />
    </button>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    icon: {
        type: String,
        required: true,
    },
    variant: {
        type: String,
        default: 'secondary',
    },
    type: {
        type: String,
        default: 'button',
    },
    disabled: {
        type: Boolean,
        default: false,
    },
});

defineEmits(['click']);

// Map icon names to Font Awesome icons
const iconMap = {
    mic: 'microphone',
    'mic-off': 'microphone-slash',
    video: 'video',
    'video-off': 'video-slash',
    users: 'users',
    lock: 'lock',
    unlock: 'unlock',
    x: 'xmark',
    'user-x': 'user-xmark',
};

const faIcon = computed(() => iconMap[props.icon] || 'microphone');

const buttonClasses = computed(() => {
    const base =
        'inline-flex items-center justify-center rounded-full p-3 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

    const variants = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
        danger: 'bg-red-600 text-white hover:bg-red-700',
    };

    return `${base} ${variants[props.variant]}`;
});
</script>
