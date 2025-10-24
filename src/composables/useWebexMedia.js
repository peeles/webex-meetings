import { useMediaStore } from '@/storage/media';
import { useWebex } from './useWebex';
import { getLocalMedia } from './useWebexMeetings';

export const useWebexMedia = () => {
    const mediaStore = useMediaStore();
    const { getWebexInstance } = useWebex();
    const localMedia = getLocalMedia();

    const enumerateDevices = async () => {
        try {
            const webex = getWebexInstance();
            if (!webex) {
                return;
            }

            const devices = await webex.meetings.mediaHelpers.getDevices();

            const audioInputs = devices.filter(d => d.kind === 'audioinput');
            const audioOutputs = devices.filter(d => d.kind === 'audiooutput');
            const videoInputs = devices.filter(d => d.kind === 'videoinput');

            mediaStore.setDevices('audioInputs', audioInputs);
            mediaStore.setDevices('audioOutputs', audioOutputs);
            mediaStore.setDevices('videoInputs', videoInputs);

            if (audioInputs.length && !mediaStore.selectedDevices.audioInput) {
                mediaStore.setSelectedDevice('audioInput', audioInputs[0].deviceId);
            }
            if (videoInputs.length && !mediaStore.selectedDevices.videoInput) {
                mediaStore.setSelectedDevice('videoInput', videoInputs[0].deviceId);
            }
        } catch (err) {
            console.error('Failed to enumerate devices:', err);
            throw err;
        }
    };

    const createMicrophoneStream = async (constraints = {}) => {
        try {
            // Request browser permission first
            await navigator.mediaDevices.getUserMedia({ audio: true });

            const webex = getWebexInstance();
            if (!webex) {
                return;
            }

            const stream = await webex.meetings.mediaHelpers.createMicrophoneStream({
                echoCancellation: true,
                noiseSuppression: true,
                ...constraints
            });

            // Store in both localMedia (for cleanup) and store (for UI)
            localMedia.microphoneStream = stream;
            mediaStore.setLocalStream('microphone', stream);
            return stream;
        } catch (err) {
            console.error('Failed to create microphone stream:', err);
            throw err;
        }
    };

    const createCameraStream = async (constraints = {}) => {
        try {
            // Request browser permission first
            await navigator.mediaDevices.getUserMedia({ video: true });

            const webex = getWebexInstance();
            if (!webex) {
                return;
            }

            const stream = await webex.meetings.mediaHelpers.createCameraStream({
                width: 1280,
                height: 720,
                frameRate: 30,
                ...constraints
            });

            // Store in both localMedia (for cleanup) and store (for UI)
            localMedia.cameraStream = stream;
            mediaStore.setLocalStream('camera', stream);
            return stream;
        } catch (err) {
            console.error('Failed to create camera stream:', err);
            throw err;
        }
    };

    const toggleMicrophone = () => {
        const micStream = mediaStore.localStreams.microphone;
        if (micStream) {
            const newMuted = !micStream.userMuted;
            micStream.setUserMuted(newMuted);
            mediaStore.setMediaState('audioMuted', newMuted);
        }
    };

    const toggleCamera = () => {
        const camStream = mediaStore.localStreams.camera;
        if (camStream) {
            const newMuted = !camStream.userMuted;
            camStream.setUserMuted(newMuted);
            mediaStore.setMediaState('videoMuted', newMuted);
        }
    };

    const stopAllLocalStreams = () => {
        mediaStore.clearLocalStreams();
    };

    return {
        enumerateDevices,
        createMicrophoneStream,
        createCameraStream,
        toggleMicrophone,
        toggleCamera,
        stopAllLocalStreams
    };
};
