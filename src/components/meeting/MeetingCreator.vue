<template>
    <div class="bg-white rounded-lg border border-gray-200 p-6">
        <h2 class="text-xl font-semibold mb-4">Create Meeting</h2>

        <form @submit.prevent="handleSubmit" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                    Meeting Destination
                </label>
                <BaseInput
                    v-model="destination"
                    type="text"
                    placeholder="SIP URI, Meeting Link, or Meeting ID"
                />
            </div>

            <BaseButton type="submit" :disabled="!destination" class="w-full">
                Create Meeting
            </BaseButton>
        </form>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import BaseInput from '../base/BaseInput.vue';
import BaseButton from '../base/BaseButton.vue';

const emit = defineEmits(['create']);

const destination = ref('');

const handleSubmit = () => {
    if (destination.value) {
        emit('create', destination.value);
        destination.value = '';
    }
};
</script>
