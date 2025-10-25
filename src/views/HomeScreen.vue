<template>
  <HomeLayout>
    <div class="max-w-4xl mx-auto p-6 space-y-6">
      <AuthForm v-if="!authStore.isRegistered" />

      <template v-else>
        <MeetingCreator @create="handleCreateMeeting" />

        <div v-if="meetingsStore.meetingsList.length" class="space-y-4">
          <h2 class="text-xl font-semibold">Available Meetings</h2>
          <MeetingListItem
            v-for="meeting in meetingsStore.meetingsList"
            :key="meeting.id"
            :meeting="meeting"
            @join="handleJoinMeeting"
          />
        </div>

        <EventsLog />
      </template>
    </div>
  </HomeLayout>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/storage/auth';
import { useMeetingsStore } from '@/storage/meetings';
import { useWebexMeetings } from '@/composables/useWebexMeetings';
import HomeLayout from '@components/layouts/HomeLayout.vue';
import AuthForm from '@components/AuthForm.vue';
import MeetingCreator from '@components/meeting/MeetingCreator.vue';
import MeetingListItem from '@components/meeting/MeetingListItem.vue';
import EventsLog from '@components/events/EventLog.vue';

const router = useRouter();
const authStore = useAuthStore();
const meetingsStore = useMeetingsStore();
const { syncMeetings, createMeeting } = useWebexMeetings();

onMounted(async () => {
  if (authStore.isRegistered) {
    await syncMeetings();
  }
});

const handleCreateMeeting = async (destination) => {
  const meeting = await createMeeting(destination);
  await router.push({ name: 'meeting', params: { id: meeting.id } });
};

const handleJoinMeeting = (meetingId) => {
  router.push({ name: 'meeting', params: { id: meetingId } });
};
</script>
