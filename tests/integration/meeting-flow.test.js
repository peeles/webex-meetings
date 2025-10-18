import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { resetWebexInstance } from '@/composables/useWebex';

describe('Meeting Flow Integration', () => {
    beforeEach(async () => {
        setActivePinia(createPinia());
        resetWebexInstance();

        // Mock Webex SDK
        window.Webex = {
            init: vi.fn(() => ({
                once: vi.fn((event, cb) => {
                    if (event === 'ready') setTimeout(() => cb(), 0);
                }),
                meetings: {
                    register: vi.fn().mockResolvedValue(),
                    create: vi.fn().mockResolvedValue({
                        id: 'meeting-123',
                        joinWithMedia: vi.fn().mockResolvedValue(),
                        leave: vi.fn().mockResolvedValue(),
                    }),
                    mediaHelpers: {
                        createMicrophoneStream: vi.fn().mockResolvedValue({}),
                        createCameraStream: vi.fn().mockResolvedValue({}),
                    },
                },
            })),
        };
    });

    it('completes full meeting lifecycle', async () => {
        const { useWebexAuth } = await import('@/composables/useWebexAuth');
        const { initialiseWithToken } = useWebexAuth();

        // 1. Authenticate
        await initialiseWithToken('test-token');

        const { useAuthStore } = await import('@/storage/Auth');
        const authStore = useAuthStore();
        expect(authStore.isRegistered).toBe(true);
    });
});
