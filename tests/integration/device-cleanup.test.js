import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { resetWebexInstance } from '@/composables/useWebex.js';
import { MEETING_STATES } from '@/dicts/constants.js';

describe('Device Cleanup on Meeting End', () => {
    let originalWebex;
    let mockMeeting;
    let micTrack;
    let camTrack;
    let micStream;
    let camStream;

    beforeEach(() => {
        setActivePinia(createPinia());
        resetWebexInstance();

        // Create mock MediaStreamTrack objects for wrapper
        micTrack = {
            stop: vi.fn(),
            kind: 'audio',
            enabled: true,
            readyState: 'live',
        };

        camTrack = {
            stop: vi.fn(),
            kind: 'video',
            enabled: true,
            readyState: 'live',
        };

        // Create mock outputStream tracks (the actual rendered tracks)
        const micOutputTrack = {
            stop: vi.fn(),
            kind: 'audio',
            enabled: true,
            readyState: 'live',
        };

        const camOutputTrack = {
            stop: vi.fn(),
            kind: 'video',
            enabled: true,
            readyState: 'live',
        };

        // Create mock Webex SDK stream objects with outputStream property
        micStream = {
            getTracks: vi.fn(() => [micTrack]),
            getAudioTracks: vi.fn(() => [micTrack]),
            getVideoTracks: vi.fn(() => []),
            outputStream: {
                getTracks: vi.fn(() => [micOutputTrack]),
                getAudioTracks: vi.fn(() => [micOutputTrack]),
                getVideoTracks: vi.fn(() => []),
            },
            setUserMuted: vi.fn(),
            userMuted: false,
        };

        camStream = {
            getTracks: vi.fn(() => [camTrack]),
            getAudioTracks: vi.fn(() => []),
            getVideoTracks: vi.fn(() => [camTrack]),
            outputStream: {
                getTracks: vi.fn(() => [camOutputTrack]),
                getAudioTracks: vi.fn(() => []),
                getVideoTracks: vi.fn(() => [camOutputTrack]),
            },
            setUserMuted: vi.fn(),
            userMuted: false,
        };

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
                        createMicrophoneStream: vi
                            .fn()
                            .mockResolvedValue(micStream),
                        createCameraStream: vi
                            .fn()
                            .mockResolvedValue(camStream),
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

    it('should stop all media tracks when leaving a meeting', async () => {
        const { useWebex } = await import('@/composables/useWebex.js');
        const { useWebexMeetings } = await import(
            '@/composables/useWebexMeetings.js'
        );
        const { useWebexMedia } = await import(
            '@/composables/useWebexMedia.js'
        );
        const { useMeetingsStore } = await import('@/storage/meetings.js');
        const { useMediaStore } = await import('@/storage/media.js');

        const { initWebex } = useWebex();
        const { leaveMeeting } = useWebexMeetings();
        const { createMicrophoneStream, createCameraStream } = useWebexMedia();
        const meetingsStore = useMeetingsStore();
        const mediaStore = useMediaStore();

        // Setup: Initialize Webex and create meeting
        await initWebex('test-token');
        meetingsStore.addMeeting(mockMeeting);
        meetingsStore.setCurrentMeeting('meeting-123');

        // Create media streams
        await createMicrophoneStream();
        await createCameraStream();

        // Verify streams were created and tracks are live
        expect(mediaStore.localStreams.microphone).toBeTruthy();
        expect(mediaStore.localStreams.camera).toBeTruthy();
        expect(micTrack.readyState).toBe('live');
        expect(camTrack.readyState).toBe('live');

        // Act: Leave the meeting
        await leaveMeeting('meeting-123');

        // Assert: Verify all tracks were stopped
        expect(micTrack.stop).toHaveBeenCalledTimes(1);
        expect(camTrack.stop).toHaveBeenCalledTimes(1);

        // Verify getTracks was called to retrieve tracks for stopping
        expect(micStream.getTracks).toHaveBeenCalled();
        expect(camStream.getTracks).toHaveBeenCalled();

        // Verify streams are cleared from store
        expect(mediaStore.localStreams.microphone).toBeNull();
        expect(mediaStore.localStreams.camera).toBeNull();
    });

    it('should stop tracks before calling meeting.leave()', async () => {
        const { useWebex } = await import('@/composables/useWebex.js');
        const { useWebexMeetings } = await import(
            '@/composables/useWebexMeetings.js'
        );
        const { useWebexMedia } = await import(
            '@/composables/useWebexMedia.js'
        );
        const { useMeetingsStore } = await import('@/storage/meetings.js');

        const { initWebex } = useWebex();
        const { leaveMeeting } = useWebexMeetings();
        const { createMicrophoneStream, createCameraStream } = useWebexMedia();
        const meetingsStore = useMeetingsStore();

        // Track call order
        const callOrder = [];
        micTrack.stop.mockImplementation(() => callOrder.push('micTrack.stop'));
        camTrack.stop.mockImplementation(() => callOrder.push('camTrack.stop'));
        mockMeeting.leave.mockImplementation(() => {
            callOrder.push('meeting.leave');
            return Promise.resolve();
        });

        await initWebex('test-token');
        meetingsStore.addMeeting(mockMeeting);
        await createMicrophoneStream();
        await createCameraStream();

        // Act: Leave the meeting
        await leaveMeeting('meeting-123');

        // Assert: Verify tracks are stopped before meeting.leave() is called
        expect(callOrder).toEqual([
            'micTrack.stop',
            'camTrack.stop',
            'meeting.leave',
        ]);
    });

    it('should handle streams without getTracks method gracefully', async () => {
        const { useWebex } = await import('@/composables/useWebex.js');
        const { useWebexMeetings } = await import(
            '@/composables/useWebexMeetings.js'
        );
        const { useMeetingsStore } = await import('@/storage/meetings.js');
        const { useMediaStore } = await import('@/storage/media.js');

        const { initWebex } = useWebex();
        const { leaveMeeting } = useWebexMeetings();
        const meetingsStore = useMeetingsStore();
        const mediaStore = useMediaStore();

        await initWebex('test-token');
        meetingsStore.addMeeting(mockMeeting);

        // Create streams without getTracks method (edge case)
        mediaStore.setLocalStream('microphone', { invalid: 'stream' });
        mediaStore.setLocalStream('camera', null);

        // Should not throw
        await expect(leaveMeeting('meeting-123')).resolves.not.toThrow();

        // Streams should be cleared
        expect(mediaStore.localStreams.microphone).toBeNull();
        expect(mediaStore.localStreams.camera).toBeNull();
    });

    it('should cleanup all resources in correct order', async () => {
        const { useWebex } = await import('@/composables/useWebex.js');
        const { useWebexMeetings } = await import(
            '@/composables/useWebexMeetings.js'
        );
        const { useWebexMedia } = await import(
            '@/composables/useWebexMedia.js'
        );
        const { useMeetingsStore } = await import('@/storage/meetings.js');
        const { useMediaStore } = await import('@/storage/media.js');
        const { useParticipantsStore } = await import(
            '@/storage/participants.js'
        );

        const { initWebex } = useWebex();
        const { leaveMeeting } = useWebexMeetings();
        const { createMicrophoneStream, createCameraStream } = useWebexMedia();
        const meetingsStore = useMeetingsStore();
        const mediaStore = useMediaStore();
        const participantsStore = useParticipantsStore();

        // Setup complete meeting state
        await initWebex('test-token');
        meetingsStore.addMeeting(mockMeeting);
        meetingsStore.setCurrentMeeting('meeting-123');
        meetingsStore.setModerator(true);

        await createMicrophoneStream();
        await createCameraStream();

        mediaStore.addRemotePane({ id: 'remote-1', stream: {} });
        mediaStore.setMediaState('audioMuted', true);
        mediaStore.setMediaState('videoMuted', true);

        participantsStore.addParticipant({
            id: 'user-1',
            name: 'Test User',
            status: 'IN_MEETING',
        });

        // Track cleanup order
        const cleanupOrder = [];

        const originalClearLocalStreams = mediaStore.clearLocalStreams;
        mediaStore.clearLocalStreams = () => {
            cleanupOrder.push('clearLocalStreams');
            originalClearLocalStreams.call(mediaStore);
        };

        const originalMeetingLeave = mockMeeting.leave;
        mockMeeting.leave = () => {
            cleanupOrder.push('meeting.leave');
            return originalMeetingLeave();
        };

        const originalClearRemotePanes = mediaStore.clearRemotePanes;
        mediaStore.clearRemotePanes = () => {
            cleanupOrder.push('clearRemotePanes');
            originalClearRemotePanes.call(mediaStore);
        };

        const originalClearParticipants = participantsStore.clearParticipants;
        participantsStore.clearParticipants = () => {
            cleanupOrder.push('clearParticipants');
            originalClearParticipants.call(participantsStore);
        };

        // Act: Leave meeting
        await leaveMeeting('meeting-123');

        // Assert: Verify cleanup order is correct
        expect(cleanupOrder).toEqual([
            'clearLocalStreams',
            'meeting.leave',
            'clearRemotePanes',
            'clearParticipants',
        ]);

        // Verify all state is reset
        expect(mediaStore.localStreams.microphone).toBeNull();
        expect(mediaStore.localStreams.camera).toBeNull();
        expect(mediaStore.remotePanes).toHaveLength(0);
        expect(mediaStore.mediaStates.audioMuted).toBe(false);
        expect(mediaStore.mediaStates.videoMuted).toBe(false);
        expect(meetingsStore.currentMeetingId).toBeNull();
        expect(meetingsStore.isModerator).toBe(false);
        expect(participantsStore.participants.size).toBe(0);
    });

    it('should release device access after stopping tracks', async () => {
        const { useWebex } = await import('@/composables/useWebex.js');
        const { useWebexMeetings } = await import(
            '@/composables/useWebexMeetings.js'
        );
        const { useWebexMedia } = await import(
            '@/composables/useWebexMedia.js'
        );
        const { useMeetingsStore } = await import('@/storage/meetings.js');

        const { initWebex } = useWebex();
        const { leaveMeeting } = useWebexMeetings();
        const { createMicrophoneStream, createCameraStream } = useWebexMedia();
        const meetingsStore = useMeetingsStore();

        await initWebex('test-token');
        meetingsStore.addMeeting(mockMeeting);

        await createMicrophoneStream();
        await createCameraStream();

        // Simulate tracks being live before leaving
        micTrack.readyState = 'live';
        camTrack.readyState = 'live';

        // Mock track state change after stop
        micTrack.stop.mockImplementation(() => {
            micTrack.readyState = 'ended';
        });
        camTrack.stop.mockImplementation(() => {
            camTrack.readyState = 'ended';
        });

        await leaveMeeting('meeting-123');

        // Verify tracks were stopped and are now ended
        expect(micTrack.readyState).toBe('ended');
        expect(camTrack.readyState).toBe('ended');
    });

    it('should stop outputStream tracks when leaving meeting', async () => {
        const { useWebex } = await import('@/composables/useWebex.js');
        const { useWebexMeetings } = await import(
            '@/composables/useWebexMeetings.js'
        );
        const { useWebexMedia } = await import(
            '@/composables/useWebexMedia.js'
        );
        const { useMeetingsStore } = await import('@/storage/meetings.js');
        const { useMediaStore } = await import('@/storage/media.js');

        const { initWebex } = useWebex();
        const { leaveMeeting } = useWebexMeetings();
        const { createMicrophoneStream, createCameraStream } = useWebexMedia();
        const meetingsStore = useMeetingsStore();
        const mediaStore = useMediaStore();

        await initWebex('test-token');
        meetingsStore.addMeeting(mockMeeting);

        await createMicrophoneStream();
        await createCameraStream();

        // Get references to the outputStream tracks
        const micOutputTracks =
            mediaStore.localStreams.microphone.outputStream.getTracks();
        const camOutputTracks =
            mediaStore.localStreams.camera.outputStream.getTracks();

        // Verify outputStream tracks exist
        expect(micOutputTracks).toHaveLength(1);
        expect(camOutputTracks).toHaveLength(1);

        // Leave the meeting
        await leaveMeeting('meeting-123');

        // Verify outputStream tracks were stopped
        expect(micOutputTracks[0].stop).toHaveBeenCalled();
        expect(camOutputTracks[0].stop).toHaveBeenCalled();

        // Verify getTracks was called on outputStream
        expect(mediaStore.localStreams.microphone).toBeNull();
        expect(mediaStore.localStreams.camera).toBeNull();
    });
});
