<template>
    <div class="bg-white rounded-lg border border-stone-200 p-6">
        <h2 class="text-xl font-semibold mb-4">Authentication</h2>

        <form class="space-y-4" @submit.prevent="handleSubmit">
            <div>
                <label class="block text-sm font-medium text-stone-700 mb-2">
                    Access Token
                </label>
                <BaseInput
                    v-model="token"
                    type="text"
                    placeholder="Enter your Webex access token"
                    :disabled="authStore.isInitialising"
                />
            </div>

            <BaseButton
                type="submit"
                :disabled="!token || authStore.isInitialising"
                class="w-full"
            >
                {{
                    authStore.isInitialising
                        ? 'Initialising...'
                        : 'Initialise & Register'
                }}
            </BaseButton>

            <p v-if="authStore.error" class="text-sm text-red-600">
                {{ authStore.error }}
            </p>
        </form>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/storage/auth';
import { useWebexAuth } from '@/composables/useWebexAuth';
import { useWebexMeetings } from '@/composables/useWebexMeetings';
import BaseInput from '@/components/base/BaseInput.vue';
import BaseButton from '@/components/base/BaseButton.vue';

const authStore = useAuthStore();
const { initialiseWithToken } = useWebexAuth();
const { setupGlobalMeetingListeners } = useWebexMeetings();

const token = ref(authStore.accessToken || '');

const handleSubmit = async () => {
    try {
        const testReq = await fetch('https://webexapis.com/v1/people/me', {
            headers: { Authorization: `Bearer ${token.value}` },
        });

        if (!testReq.ok) {
            throw new Error(
                'Invalid token - please get a new one from developer.webex.com'
            );
        }

        await initialiseWithToken(token.value);

        // Set up global meeting listeners for incoming calls
        setupGlobalMeetingListeners();
    } catch (err) {
        alert(err.message);
    }
};
</script>
