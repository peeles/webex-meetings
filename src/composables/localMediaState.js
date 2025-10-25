const createInitialLocalMediaState = () => ({
    microphoneStream: undefined,
    cameraStream: undefined,
    screenShare: {
        video: undefined,
        audio: undefined,
    },
});

const localMedia = createInitialLocalMediaState();

const stopStreamTracks = (stream) => {
    if (!stream) {
        return;
    }

    if (typeof stream.getTracks === 'function') {
        stream.getTracks().forEach(track => track.stop());
    }

    const outputTracks = stream.outputStream?.getTracks?.();
    if (Array.isArray(outputTracks)) {
        outputTracks.forEach(track => track.stop());
    }
};

export const getLocalMedia = () => localMedia;

export const cleanupLocalMedia = () => {
    console.log('[CleanupMedia] Stopping all local media streams...');

    stopStreamTracks(localMedia.microphoneStream);
    stopStreamTracks(localMedia.cameraStream);
    stopStreamTracks(localMedia.screenShare.video);
    stopStreamTracks(localMedia.screenShare.audio);

    localMedia.microphoneStream = undefined;
    localMedia.cameraStream = undefined;
    localMedia.screenShare.video = undefined;
    localMedia.screenShare.audio = undefined;

    console.log('[CleanupMedia] All local media stopped');
};
