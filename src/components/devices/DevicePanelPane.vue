<template>
    <div class="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h2 class="text-xl font-semibold">Device Settings</h2>

        <DeviceSelector
            label="Microphone"
            :devices="mediaStore.devices.audioInputs"
            :model-value="mediaStore.selectedDevices.audioInput"
            @change="handleAudioInputChange"
        />

        <DeviceSelector
            label="Camera"
            :devices="mediaStore.devices.videoInputs"
            :model-value="mediaStore.selectedDevices.videoInput"
            @change="handleVideoInputChange"
        />

        <DeviceSelector
            label="Speaker"
            :devices="mediaStore.devices.audioOutputs"
            :model-value="mediaStore.selectedDevices.audioOutput"
            @change="handleAudioOutputChange"
        />
    </div>
</template>

<script setup>
import { useMediaStore } from '../../storage/media.js';
import DeviceSelector from './DeviceSelector.vue';

const mediaStore = useMediaStore();

const handleAudioInputChange = (deviceId) => {
    mediaStore.setSelectedDevice('audioInput', deviceId);
};

const handleVideoInputChange = (deviceId) => {
    mediaStore.setSelectedDevice('videoInput', deviceId);
};

const handleAudioOutputChange = (deviceId) => {
    mediaStore.setSelectedDevice('audioOutput', deviceId);
};
</script>
