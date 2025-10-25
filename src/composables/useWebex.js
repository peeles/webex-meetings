import { ref } from 'vue';

let webexInstance = null;
const isInitialised = ref(false);
const isRegistered = ref(false);

export function useWebex() {
  const initWebex = async (accessToken) => {
    if (!window.Webex) {
      throw new Error('Webex SDK not loaded');
    }

    if (webexInstance) {
      return webexInstance;
    }

    return new Promise((resolve, reject) => {
      try {
        webexInstance = window.Webex.init({
          credentials: {
            access_token: accessToken,
          },
          config: {
            meetings: {
              reconnection: {
                enabled: true,
              },
              enableRtx: true,
              experimental: {
                enableUnifiedMeetings: true,
                enableAdhocMeetings: true,
              },
            },
          },
        });

        webexInstance.once('ready', async () => {
          try {
            isInitialised.value = true;
            resolve(webexInstance);
          } catch (err) {
            reject(err);
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  };

  const getWebexInstance = () => {
    if (!webexInstance) {
      throw new Error('Webex not initialized. Call initWebex first.');
    }
    return webexInstance;
  };

  const isReady = () => {
    return isInitialised.value && webexInstance !== null;
  };

  const unregister = async () => {
    if (webexInstance && isRegistered.value) {
      await webexInstance.meetings.unregister();
      isRegistered.value = false;
    }
  };

  const reset = () => {
    webexInstance = null;
    isInitialised.value = false;
    isRegistered.value = false;
  };

  return {
    initWebex,
    getWebexInstance,
    isReady,
    unregister,
    reset,
    isInitialised,
    isRegistered,
  };
}

export function resetWebexInstance() {
  if (typeof webexInstance?.meetings?.unregister === 'function') {
    webexInstance.meetings.unregister().catch(() => {});
  }
  webexInstance = null;
  isInitialised.value = false;
  isRegistered.value = false;
}
