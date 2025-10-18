import { useAuthStore } from '../storage/auth';
import { useWebex } from './useWebex';

export const useWebexAuth = () => {
    const authStore = useAuthStore();
    const { initWebex, getWebexInstance, isReady } = useWebex();

    const register = async () => {
        try {
            authStore.setInitialising(true);
            authStore.setError(null);

            if (!isReady()) {
                throw new Error('Webex not initialised');
            }

            const webex = getWebexInstance();
            await webex.meetings.register();
            authStore.setRegistered(true);
            console.log('Successfully registered with Webex');
        } catch (err) {
            console.error('Registration failed:', err);
            authStore.setError(err.message);
            throw err;
        } finally {
            authStore.setInitialising(false);
        }
    };

    const unregister = async () => {
        try {
            authStore.setInitialising(true);

            if (isReady()) {
                const webex = getWebexInstance();
                await webex.meetings.unregister();
            }

            authStore.setRegistered(false);
        } catch (err) {
            authStore.setError(err.message);
            throw err;
        } finally {
            authStore.setInitialising(false);
        }
    };

    const initialiseWithToken = async (token) => {
        try {
            authStore.setInitialising(true);
            authStore.setError(null);
            authStore.setAccessToken(token);

            await initWebex(token);
            await register();

            return true;
        } catch (err) {
            console.error('Initialisation failed:', err);
            authStore.setError(err.message);
            return false;
        } finally {
            authStore.setInitialising(false);
        }
    };

    return {
        register,
        unregister,
        initialiseWithToken
    };
};
