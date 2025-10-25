import { useMediaStore } from '@/storage/media';
import { useMeetingsStore } from '@/storage/meetings';

export const useWebexMultistream = () => {
  const mediaStore = useMediaStore();
  const meetingsStore = useMeetingsStore();

  const setupMultistreamListeners = (meeting) => {
    if (!meeting) {
      return;
    }

    meeting.on('media:remoteAudio:created', (audioGroup) => {
      handleRemoteAudio(audioGroup);
    });

    meeting.on('media:remoteVideo:layoutChanged', (payload) => {
      handleLayoutChanged(payload);
    });
  };

  const handleRemoteAudio = (audioGroup) => {
    if (!audioGroup || typeof audioGroup.getRemoteMedia !== 'function') {
      return;
    }

    mediaStore.remoteAudioElements.forEach((el) => {
      el.pause();
      el.srcObject = null;
    });
    mediaStore.remoteAudioElements.length = 0;

    audioGroup.getRemoteMedia().forEach((media) => {
      if (!media?.isActive?.()) {
        return;
      }

      const audio = new Audio();
      audio.autoplay = true;
      audio.srcObject = media.stream;
      mediaStore.remoteAudioElements.push(audio);

      if (typeof media.on === 'function') {
        media.on('sourceUpdate', ({ state }) => {
          if (state === 'inactive') {
            const index = mediaStore.remoteAudioElements.findIndex(
              (el) => el.srcObject === media.stream
            );
            if (index !== -1) {
              mediaStore.remoteAudioElements[index].pause();
              mediaStore.remoteAudioElements[index].srcObject = null;
              mediaStore.remoteAudioElements.splice(index, 1);
            }
          }
        });
      }
    });
  };

  const handleLayoutChanged = ({
    layoutId,
    activeSpeakerVideoPanes,
    memberVideoPanes,
  }) => {
    console.log('[Layout Changed]', layoutId);

    mediaStore.clearRemotePanes();

    const processPane = (remoteMedia, prefix = 'pane') => {
      if (!remoteMedia || !remoteMedia.stream) {
        return;
      }

      const pane = {
        id: `${prefix}-${remoteMedia.id || remoteMedia.csi}`,
        stream: remoteMedia.stream,
        memberId: remoteMedia.memberId || 'unknown',
        mediaType: remoteMedia.mediaType,
        sourceState: remoteMedia.sourceState,
        _rm: remoteMedia,
      };

      mediaStore.addRemotePane(pane);

      if (!remoteMedia._hasListener && typeof remoteMedia.on === 'function') {
        remoteMedia._hasListener = true;
        remoteMedia.on('sourceUpdate', ({ state, memberId }) => {
          const existing = mediaStore.remotePanes.find((p) => p.id === pane.id);
          if (existing) {
            if (state) {
              existing.sourceState = state;
            }
            if (memberId) {
              existing.memberId = memberId;
            }
          }
        });
      }
    };

    for (const [groupId, group] of Object.entries(
      activeSpeakerVideoPanes || {}
    )) {
      const mediaArray = group?.getRemoteMedia?.() || [];
      mediaArray.forEach((rm, index) => {
        processPane(rm, `as-${groupId}-${index}`);
      });
    }

    for (const [paneId, remoteMedia] of Object.entries(
      memberVideoPanes || {}
    )) {
      processPane(remoteMedia, `member-${paneId}`);
    }
  };

  const changeLayout = async (layoutId) => {
    const meeting = meetingsStore.currentMeeting;
    if (!meeting || !meeting.meeting) {
      throw new Error('No active meeting');
    }

    // Wait for remoteMediaManager to be ready
    const rmm = meeting.meeting.remoteMediaManager;
    if (!rmm) {
      console.warn('remoteMediaManager not ready yet, waiting...');

      // Wait up to 5 seconds for it to initialize
      let attempts = 0;
      while (!meeting.meeting.remoteMediaManager && attempts < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }

      if (!meeting.meeting.remoteMediaManager) {
        throw new Error('remoteMediaManager failed to initialize');
      }
    }

    try {
      console.log('[changeLayout] Setting layout to:', layoutId);
      await meeting.meeting.remoteMediaManager.setLayout(layoutId);
      meetingsStore.setLayout(layoutId);
      console.log('[changeLayout] Layout changed successfully');
    } catch (err) {
      console.error('Failed to change layout:', err);
      throw err;
    }
  };

  return {
    setupMultistreamListeners,
    changeLayout,
  };
};
