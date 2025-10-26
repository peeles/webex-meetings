// tests/setup.js
import { vi } from 'vitest';
import { config } from '@vue/test-utils';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import {
    faMicrophone,
    faMicrophoneSlash,
    faVideo,
    faVideoSlash,
    faUsers,
    faLock,
    faUnlock,
    faXmark,
    faUserXmark,
    faBookmark as faBookmarkSolid,
    faPhone,
    faPhoneSlash,
} from '@fortawesome/free-solid-svg-icons';
import { faBookmark as faBookmarkRegular } from '@fortawesome/free-regular-svg-icons';

// Add Font Awesome icons to library
library.add(
    faMicrophone,
    faMicrophoneSlash,
    faVideo,
    faVideoSlash,
    faUsers,
    faLock,
    faUnlock,
    faXmark,
    faUserXmark,
    faBookmarkSolid,
    faBookmarkRegular,
    faPhone,
    faPhoneSlash
);

// Define MediaStream IMMEDIATELY - before any imports
if (!global.MediaStream) {
    global.MediaStream = class MediaStream {
        constructor(tracks = []) {
            this.active = true;
            this.id = `stream-${Math.random().toString(36).substr(2, 9)}`;
            this._tracks = tracks || [];
        }

        getTracks() {
            return this._tracks;
        }

        getAudioTracks() {
            return this._tracks.filter((t) => t.kind === 'audio');
        }

        getVideoTracks() {
            return this._tracks.filter((t) => t.kind === 'video');
        }

        addTrack(track) {
            this._tracks.push(track);
        }

        removeTrack(track) {
            const index = this._tracks.indexOf(track);
            if (index > -1) {
                this._tracks.splice(index, 1);
            }
        }
    };
}

if (!global.MediaStreamTrack) {
    global.MediaStreamTrack = class MediaStreamTrack {
        constructor(kind = 'video') {
            this.kind = kind;
            this.id = `track-${Math.random().toString(36).substr(2, 9)}`;
            this.label = `${kind} track`;
            this.enabled = true;
            this.muted = false;
            this.readyState = 'live';
        }

        stop() {
            this.readyState = 'ended';
        }
    };
}

// Also set on window for components that might check window.MediaStream
if (typeof window !== 'undefined') {
    window.MediaStream = global.MediaStream;
    window.MediaStreamTrack = global.MediaStreamTrack;
}

// Mock navigator.mediaDevices
global.navigator.mediaDevices = {
    getUserMedia: vi
        .fn()
        .mockResolvedValue(
            new global.MediaStream([
                new global.MediaStreamTrack('audio'),
                new global.MediaStreamTrack('video'),
            ])
        ),
    enumerateDevices: vi.fn().mockResolvedValue([
        {
            deviceId: 'audio-1',
            kind: 'audioinput',
            label: 'Microphone',
            groupId: 'group1',
        },
        {
            deviceId: 'video-1',
            kind: 'videoinput',
            label: 'Camera',
            groupId: 'group2',
        },
        {
            deviceId: 'audio-2',
            kind: 'audiooutput',
            label: 'Speaker',
            groupId: 'group3',
        },
    ]),
    getDisplayMedia: vi
        .fn()
        .mockResolvedValue(
            new global.MediaStream([new global.MediaStreamTrack('video')])
        ),
};

// Configure Vue Test Utils
config.global.stubs = {
    teleport: true,
};

// Register Font Awesome component globally for tests
config.global.components = {
    'font-awesome-icon': FontAwesomeIcon,
};

// Reset modules between tests
beforeEach(() => {
    vi.resetModules();
});
