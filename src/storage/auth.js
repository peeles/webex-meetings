import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAuthStore = defineStore('auth', () => {
    const accessToken = ref('');
    const isRegistered = ref(false);
    const isInitialising = ref(false);
    const error = ref(null);

    const setAccessToken = (token) => {
        accessToken.value = token;
        if (token) {
            localStorage.setItem('webex-access-token', token);
            localStorage.setItem('webex-token-date', Date.now() + (12 * 60 * 60 * 1000));
        }
    };

    const loadStoredToken = () => {
        const stored = localStorage.getItem('webex-access-token');
        const expiry = localStorage.getItem('webex-token-date');

        if (stored && expiry && Date.now() < parseInt(expiry)) {
            accessToken.value = stored;
            return true;
        }

        localStorage.removeItem('webex-access-token');
        localStorage.removeItem('webex-token-date');
        return false;
    };

    const setRegistered = (value) => {
        isRegistered.value = value;
    };

    const setInitialising = (value) => {
        isInitialising.value = value;
    };

    const setError = (err) => {
        error.value = err;
    };

    const clearAuth = () => {
        accessToken.value = '';
        isRegistered.value = false;
        localStorage.removeItem('webex-access-token');
        localStorage.removeItem('webex-token-date');
    };

    return {
        accessToken,
        isRegistered,
        isInitialising,
        error,
        setAccessToken,
        loadStoredToken,
        setRegistered,
        setInitialising,
        setError,
        clearAuth
    };
});
