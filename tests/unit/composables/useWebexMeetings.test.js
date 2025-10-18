import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { resetWebexInstance } from '@/composables/useWebex';
import { MEETING_STATES } from '@/dicts/constants';

describe('useWebexMeetings - leaveMeeting', () => {
    let originalWebex;
    let mockMeeting;

    beforeEach(() => {
        setActivePinia(createPinia());
        resetWebexInstance();

        // Create mock meeting object
        mockMeeting = {
            id: 'meeting-123',
            sipUri: 'test@example.com',
            destination: 'test@example.com',
            state: MEETING_STATES.JOINED,
            leave: vi.fn().mockResolvedValue(),
            members: {
                on: vi.fn(),
            },
            on: vi.fn(),
        };

        // Mock Webex SDK
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
                    create: vi.fn().mockResolvedValue(mockMeeting),
                    syncMeetings: vi.fn().mockResolvedValue(),
                    getAllMeetings: vi.fn().mockReturnValue({}),
                    mediaHelpers: {
                        createMicrophoneStream: vi.fn().mockResolvedValue({
                            getTracks: () => [{ stop: vi.fn() }],
                        }),
                        createCameraStream: vi.fn().mockResolvedValue({
                            getTracks: () => [{ stop: vi.fn() }],
                        }),
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

    it('should properly clean up all resources when leaving a meeting', async () => {
        // Import modules after mocking
        const { useWebex } = await import('@/composables/useWebex');
        const { useWebexMeetings } = await import('@/composables/useWebexMeetings');
        const { useMeetingsStore } = await import('@/storage/meetings');
        const { useMediaStore } = await import('@/storage/media');
        const { useParticipantsStore } = await import('@/storage/participants');

        const { initWebex } = useWebex();
        const { leaveMeeting } = useWebexMeetings();
        const meetingsStore = useMeetingsStore();
        const mediaStore = useMediaStore();
        const participantsStore = useParticipantsStore();

        // Setup: Initialize Webex and add meeting
        await initWebex('test-token');
        meetingsStore.addMeeting(mockMeeting);
        meetingsStore.setCurrentMeeting('meeting-123');
        meetingsStore.setModerator(true);

        // Add some test data to stores
        mediaStore.setLocalStream('microphone', {
            getTracks: () => [{ stop: vi.fn() }],
        });
        mediaStore.setLocalStream('camera', {
            getTracks: () => [{ stop: vi.fn() }],
        });
        mediaStore.addRemotePane({ id: 'pane-1', stream: {} });
        mediaStore.setMediaState('audioMuted', true);
        mediaStore.setMediaState('videoMuted', true);
        participantsStore.addParticipant({
            id: 'user-1',
            name: 'Test User',
            status: 'IN_MEETING',
        });

        // Spy on cleanup methods
        const clearLocalStreamsSpy = vi.spyOn(mediaStore, 'clearLocalStreams');
        const clearRemotePanesSpy = vi.spyOn(mediaStore, 'clearRemotePanes');
        const clearParticipantsSpy = vi.spyOn(participantsStore, 'clearParticipants');

        // Act: Leave the meeting
        await leaveMeeting('meeting-123');

        // Assert: Verify all cleanup happened
        expect(clearLocalStreamsSpy).toHaveBeenCalled();
        expect(mockMeeting.leave).toHaveBeenCalled();
        expect(clearRemotePanesSpy).toHaveBeenCalled();
        expect(clearParticipantsSpy).toHaveBeenCalled();

        // Verify meeting state updated
        const meetingData = meetingsStore.getMeetingById('meeting-123');
        expect(meetingData.state).toBe(MEETING_STATES.LEFT);

        // Verify current meeting cleared
        expect(meetingsStore.currentMeetingId).toBeNull();

        // Verify moderator status reset
        expect(meetingsStore.isModerator).toBe(false);

        // Verify media states reset
        expect(mediaStore.mediaStates.audioMuted).toBe(false);
        expect(mediaStore.mediaStates.videoMuted).toBe(false);

        // Verify remote panes cleared
        expect(mediaStore.remotePanes).toHaveLength(0);

        // Verify participants cleared
        expect(participantsStore.participants.size).toBe(0);
    });

    it('should stop local media streams before leaving meeting', async () => {
        const { useWebex } = await import('@/composables/useWebex');
        const { useWebexMeetings, getLocalMedia } = await import('@/composables/useWebexMeetings');
        const { useMeetingsStore } = await import('@/storage/meetings');
        const { useMediaStore } = await import('@/storage/media');

        const { initWebex } = useWebex();
        const { leaveMeeting } = useWebexMeetings();
        const meetingsStore = useMeetingsStore();
        const mediaStore = useMediaStore();

        await initWebex('test-token');
        meetingsStore.addMeeting(mockMeeting);

        // Create mock streams with track.stop() method
        const micTrack = { stop: vi.fn() };
        const camTrack = { stop: vi.fn() };
        const micStream = {
            getTracks: vi.fn(() => [micTrack]),
            outputStream: {
                getTracks: vi.fn(() => [])
            }
        };
        const camStream = {
            getTracks: vi.fn(() => [camTrack]),
            outputStream: {
                getTracks: vi.fn(() => [])
            }
        };

        // Set streams in both store and localMedia
        mediaStore.setLocalStream('microphone', micStream);
        mediaStore.setLocalStream('camera', camStream);

        const localMedia = getLocalMedia();
        localMedia.microphoneStream = micStream;
        localMedia.cameraStream = camStream;

        await leaveMeeting('meeting-123');

        // Verify tracks were stopped
        expect(micTrack.stop).toHaveBeenCalled();
        expect(camTrack.stop).toHaveBeenCalled();

        // Verify streams cleared from store
        expect(mediaStore.localStreams.microphone).toBeNull();
        expect(mediaStore.localStreams.camera).toBeNull();
    });

    it('should handle leaving when no meeting exists gracefully', async () => {
        const { useWebex } = await import('@/composables/useWebex');
        const { useWebexMeetings } = await import('@/composables/useWebexMeetings');

        const { initWebex } = useWebex();
        const { leaveMeeting } = useWebexMeetings();

        await initWebex('test-token');

        // Should not throw when leaving non-existent meeting
        await expect(leaveMeeting('non-existent')).resolves.not.toThrow();
    });
});