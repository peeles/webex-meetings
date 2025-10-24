<template>
    <RouterView />

    <!-- Incoming Call Toast -->
    <IncomingCallToast
        :is-visible="!!meetingsStore.incomingCall"
        :caller-name="meetingsStore.incomingCall?.callerName"
        :meeting-details="meetingsStore.incomingCall?.meetingDetails"
        :meeting-id="meetingsStore.incomingCall?.meetingId"
        @answer="handleAnswerCall"
        @decline="handleDeclineCall"
        @timeout="handleDeclineCall"
    />
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/storage/auth';
import { useMeetingsStore } from '@/storage/meetings';
import { useWebexAuth } from '@/composables/useWebexAuth';
import { useWebexMeetings } from '@/composables/useWebexMeetings';
import IncomingCallToast from '@/components/IncomingCallToast.vue';

const router = useRouter();
const authStore = useAuthStore();
const meetingsStore = useMeetingsStore();
const { initialiseWithToken } = useWebexAuth();
const { setupGlobalMeetingListeners, answerIncomingCall, declineIncomingCall } = useWebexMeetings();

onMounted(async () => {
    const hasToken = authStore.loadStoredToken();
    if (hasToken) {
        await initialiseWithToken(authStore.accessToken);
        setupGlobalMeetingListeners();
    }
});

const handleAnswerCall = async (meetingId) => {
    try {
        await answerIncomingCall(meetingId);
        router.push(`/meeting/${meetingId}`);
    } catch (err) {
        console.error('Failed to answer call:', err);
    }
};

const handleDeclineCall = async (meetingId) => {
    await declineIncomingCall(meetingId);
};
</script>
