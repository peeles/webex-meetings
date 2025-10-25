import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { resetWebexInstance } from '@/composables/useWebex';

describe('useWebex', () => {
    let originalWebex;

    beforeEach(async () => {
        resetWebexInstance();

        originalWebex = window.Webex;

        window.Webex = {
            init: vi.fn(() => ({
                once: vi.fn((event, callback) => {
                    if (event === 'ready') {
                        setTimeout(() => callback(), 0);
                    }
                }),
                meetings: {
                    register: vi.fn().mockResolvedValue(),
                    unregister: vi.fn().mockResolvedValue(),
                    create: vi.fn().mockResolvedValue({}),
                    syncMeetings: vi.fn().mockResolvedValue(),
                    getAllMeetings: vi.fn().mockReturnValue({}),
                    mediaHelpers: {
                        createMicrophoneStream: vi.fn().mockResolvedValue({}),
                        createCameraStream: vi.fn().mockResolvedValue({}),
                        getDevices: vi.fn().mockResolvedValue([]),
                    },
                },
            })),
        };
    });

    afterEach(() => {
        window.Webex = originalWebex;
        resetWebexInstance();
        vi.clearAllMocks();
    });

    it('returns existing instance on second init', async () => {
        const { useWebex } = await import('@/composables/useWebex');
        const { initWebex, getWebexInstance } = useWebex();

        await initWebex('test-token-1');
        const first = getWebexInstance();

        await initWebex('test-token-2');
        const second = getWebexInstance();

        expect(first).toBe(second);
        expect(window.Webex.init).toHaveBeenCalledTimes(1);
    });

    it('throws error if Webex SDK not loaded', async () => {
        delete window.Webex;

        const { useWebex } = await import('@/composables/useWebex');
        const { initWebex } = useWebex();

        await expect(initWebex('test-token')).rejects.toThrow(
            'Webex SDK not loaded'
        );
    });

    it('initializes with correct config', async () => {
        const { useWebex } = await import('@/composables/useWebex');
        const { initWebex } = useWebex();
        const token = 'test-access-token';

        await initWebex(token);

        expect(window.Webex.init).toHaveBeenCalledWith(
            expect.objectContaining({
                credentials: {
                    access_token: token,
                },
                config: expect.objectContaining({
                    meetings: expect.any(Object),
                }),
            })
        );
    });

    it('isReady returns true after initialization', async () => {
        const { useWebex } = await import('@/composables/useWebex');
        const { initWebex, isReady } = useWebex();

        expect(isReady()).toBe(false);

        await initWebex('test-token');

        expect(isReady()).toBe(true);
    });
});
