<template>
  <div class="bg-white rounded-lg border border-gray-200 p-6">
    <h2 class="text-xl font-semibold mb-4">Registration</h2>

    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium">Status:</span>
        <BaseBadge :variant="authStore.isRegistered ? 'success' : 'secondary'">
          {{ authStore.isRegistered ? 'Registered' : 'Not Registered' }}
        </BaseBadge>
      </div>

      <div class="flex gap-2">
        <BaseButton
          v-if="!authStore.isRegistered"
          :disabled="authStore.isInitialising"
          @click="handleRegister"
        >
          Register
        </BaseButton>
        <BaseButton
          v-else
          variant="danger"
          :disabled="authStore.isInitialising"
          @click="handleUnregister"
        >
          Unregister
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/storage/auth';
import { useWebexAuth } from '@/composables/useWebexAuth';
import BaseButton from '@/components/base/BaseButton.vue';
import BaseBadge from '@/components/base/BaseBadge.vue';

const authStore = useAuthStore();
const { register, unregister } = useWebexAuth();

const handleRegister = async () => {
  await register();
};

const handleUnregister = async () => {
  await unregister();
};
</script>
