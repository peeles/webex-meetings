<template>
    <RouterView />
</template>

<script setup>
import { onMounted } from 'vue';
import { useAuthStore } from '/src/storage/auth';
import { useWebexAuth } from '/src/composables/useWebexAuth';

const authStore = useAuthStore();
const { initialiseWithToken } = useWebexAuth();

onMounted(() => {
    const hasToken = authStore.loadStoredToken();
    if (hasToken) {
        initialiseWithToken(authStore.accessToken);
    }
});
</script>
