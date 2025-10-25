<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white border-b border-gray-200 px-6 py-4">
      <div class="flex items-center justify-between max-w-7xl mx-auto">
        <h1 class="text-xl font-bold text-blue-600">Webex Vue</h1>
        <div v-if="authStore.isRegistered" class="flex items-center gap-4">
          <BaseBadge variant="success">Registered</BaseBadge>
          <BaseButton variant="ghost" size="sm" @click="handleLogout">
            Logout
          </BaseButton>
        </div>
      </div>
    </header>

    <main>
      <slot />
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/storage/auth.js';
import { useWebexAuth } from '@/composables/useWebexAuth.js';
import BaseButton from '@/components/base/BaseButton.vue';
import BaseBadge from '@/components/base/BaseBadge.vue';

const router = useRouter();
const authStore = useAuthStore();
const { unregister } = useWebexAuth();

const handleLogout = async () => {
  await unregister();
  authStore.clearAuth();
  await router.push({ name: 'home' });
};
</script>
