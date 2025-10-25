import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useMediaStore = defineStore('media', () => {
    const localStreams = ref({
        microphone: null,
        camera: null,
        screenShare: { video: null, audio: null },
    });

    const devices = ref({
        audioInputs: [],
        audioOutputs: [],
        videoInputs: [],
    });

    const selectedDevices = ref({
        audioInput: null,
        audioOutput: null,
        videoInput: null,
    });

    const mediaStates = ref({
        audioMuted: false,
        videoMuted: false,
        screenSharing: false,
    });

    const remotePanes = ref([]);
    const remoteAudioElements = ref([]);

    const setLocalStream = (type, stream) => {
        if (type === 'microphone' || type === 'camera') {
            localStreams.value[type] = stream;
        } else if (type === 'screenShare') {
            localStreams.value.screenShare = stream;
        }
    };

    const setDevices = (type, deviceList) => {
        if (devices.value[type]) {
            devices.value[type] = deviceList;
        }
    };

    const setSelectedDevice = (type, deviceId) => {
        if (selectedDevices.value[type] !== undefined) {
            selectedDevices.value[type] = deviceId;
        }
    };

    const setMediaState = (type, value) => {
        if (mediaStates.value[type] !== undefined) {
            mediaStates.value[type] = value;
        }
    };

    const addRemotePane = (pane) => {
        const exists = remotePanes.value.find((p) => p.id === pane.id);
        if (!exists) {
            remotePanes.value.push(pane);
        } else {
            Object.assign(exists, pane);
        }
    };

    const removeRemotePane = (paneId) => {
        const index = remotePanes.value.findIndex((p) => p.id === paneId);
        if (index !== -1) {
            remotePanes.value.splice(index, 1);
        }
    };

    const clearRemotePanes = () => {
        remotePanes.value = [];
        remoteAudioElements.value.forEach((el) => {
            el.pause();
            el.srcObject = null;
        });
        remoteAudioElements.value = [];
    };

    const clearLocalStreams = () => {
        // NOTE: Track stopping is now handled by cleanupLocalMedia() in useWebexMeetings
        // This function only clears the store references for UI updates
        localStreams.value = {
            microphone: null,
            camera: null,
            screenShare: { video: null, audio: null },
        };
    };

    return {
        localStreams,
        devices,
        selectedDevices,
        mediaStates,
        remotePanes,
        remoteAudioElements,
        setLocalStream,
        setDevices,
        setSelectedDevice,
        setMediaState,
        addRemotePane,
        removeRemotePane,
        clearRemotePanes,
        clearLocalStreams,
    };
});
