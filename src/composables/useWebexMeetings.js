import { useMeetingsStore } from '@/storage/meetings';
import { useParticipantsStore } from '@/storage/participants';
import { useMediaStore } from '@/storage/media';
import { useWebex } from './useWebex';
import { useWebexMultistream } from './useWebexMultistream';
import { MEETING_STATES, PARTICIPANT_STATUS } from '../dicts/constants';

let localMedia = {
    microphoneStream: undefined,
    cameraStream: undefined,
    screenShare: {
        video: undefined,
        audio: undefined,
    },
};

/**
 * Cleanup local media streams and tracks
 * Stops both the Webex SDK wrapper and the outputStream tracks
 */
const cleanupLocalMedia = () => {
    console.log('[CleanupMedia] Stopping all local media streams...');

    // Stop microphone stream
    if (localMedia.microphoneStream) {
        // Stop wrapper tracks
        if (localMedia.microphoneStream.getTracks) {
            localMedia.microphoneStream.getTracks().forEach(track => track.stop());
        }
        // Stop outputStream tracks
        if (localMedia.microphoneStream.outputStream?.getTracks) {
            localMedia.microphoneStream.outputStream.getTracks().forEach(track => track.stop());
        }
        localMedia.microphoneStream = undefined;
    }

    // Stop camera stream
    if (localMedia.cameraStream) {
        // Stop wrapper tracks
        if (localMedia.cameraStream.getTracks) {
            localMedia.cameraStream.getTracks().forEach(track => track.stop());
        }
        // Stop outputStream tracks
        if (localMedia.cameraStream.outputStream?.getTracks) {
            localMedia.cameraStream.outputStream.getTracks().forEach(track => track.stop());
        }
        localMedia.cameraStream = undefined;
    }

    // Stop screen share streams
    if (localMedia.screenShare.video) {
        if (localMedia.screenShare.video.getTracks) {
            localMedia.screenShare.video.getTracks().forEach(track => track.stop());
        }
        if (localMedia.screenShare.video.outputStream?.getTracks) {
            localMedia.screenShare.video.outputStream.getTracks().forEach(track => track.stop());
        }
        localMedia.screenShare.video = undefined;
    }

    if (localMedia.screenShare.audio) {
        if (localMedia.screenShare.audio.getTracks) {
            localMedia.screenShare.audio.getTracks().forEach(track => track.stop());
        }
        if (localMedia.screenShare.audio.outputStream?.getTracks) {
            localMedia.screenShare.audio.outputStream.getTracks().forEach(track => track.stop());
        }
        localMedia.screenShare.audio = undefined;
    }

    console.log('[CleanupMedia] All local media stopped');
};

/**
 * Expose localMedia for useWebexMedia to populate
 */
export const getLocalMedia = () => localMedia;

export const useWebexMeetings = () => {
    const meetingsStore = useMeetingsStore();
    const participantsStore = useParticipantsStore();
    const mediaStore = useMediaStore();
    const { getWebexInstance } = useWebex();
    const { setupMultistreamListeners } = useWebexMultistream();

    const syncMeetings = async () => {
        const webex = getWebexInstance();
        await webex.meetings.syncMeetings();

        const allMeetings = webex.meetings.getAllMeetings();
        Object.values(allMeetings).forEach(meeting => {
            meetingsStore.addMeeting(meeting);
        });
    };

    const createMeeting = async (destination, type = 'SIP_URI') => {
        const webex = getWebexInstance();
        const meeting = await webex.meetings.create(destination, type);

        // Setup listeners FIRST
        setupMeetingListeners(meeting);

        // Then store it
        meetingsStore.addMeeting(meeting);

        return meeting;
    };

    const joinMeeting = async (meetingId, options = {}) => {
        const meetingData = meetingsStore.getMeetingById(meetingId);
        if (!meetingData) {
            throw new Error('Meeting not found');
        }

        const meeting = meetingData.meeting;
        const micStream = mediaStore.localStreams.microphone;
        const camStream = mediaStore.localStreams.camera;

        if (!micStream || !camStream) {
            throw new Error('Local media streams not ready');
        }

        console.log('Joining meeting:', meetingId);

        setupMultistreamListeners(meeting);

        await meeting.joinWithMedia({
            joinOptions: {
                enableMultistream: true,
                moderator: options.moderator || false,
                locale: 'en_GB',
                ...options
            },
            mediaOptions: {
                allowMediaInLobby: true,
                localStreams: {
                    microphone: micStream,
                    camera: camStream
                }
            },
            remoteMediaManagerOptions: {
                video: {
                    initialLayoutId: 'AllEqual',
                    layouts: {
                        AllEqual: {
                            activeSpeakerVideoPaneGroups: [{
                                id: 'grid',
                                numPanes: 9,
                                size: 'best',
                                priority: 255
                            }]
                        }
                    }
                },
                audio: {
                    numOfActiveSpeakerStreams: 1,
                    numOfScreenShareStreams: 0
                }
            }
        });

        meetingsStore.setCurrentMeeting(meetingId);
        meetingsStore.updateMeetingState(meetingId, MEETING_STATES.JOINED);

        // Check moderator status immediately after joining
        if (meeting.members && meeting.members.selfId) {
            const selfMember = meeting.members.membersCollection?.members?.[meeting.members.selfId];
            if (selfMember) {
                console.log('Checking moderator status after join:', {
                    selfId: meeting.members.selfId,
                    isModerator: selfMember.isModerator,
                    isHost: selfMember.isHost,
                    isGuest: selfMember.isGuest
                });
                if (selfMember.isModerator) {
                    meetingsStore.setModerator(true);
                }
            }
        }

        console.log('Successfully joined meeting');
        return meeting;
    };

    const leaveMeeting = async (meetingId) => {
        const meetingData = meetingsStore.getMeetingById(meetingId);
        if (!meetingData) {
            return;
        }

        try {
            // Stop local media streams FIRST to ensure camera/mic turn off
            cleanupLocalMedia();

            // Also clear store references (for UI updates)
            mediaStore.clearLocalStreams();

            // Then leave the meeting
            console.log('[LeaveMeeting] Leaving meeting...');
            await meetingData.meeting.leave();

            // Update meeting state
            meetingsStore.updateMeetingState(meetingId, MEETING_STATES.LEFT);

            // Clear current meeting reference
            if (meetingsStore.currentMeetingId === meetingId) {
                meetingsStore.setCurrentMeeting(null);
            }

            // Reset moderator status
            meetingsStore.setModerator(false);

            // Clear remote resources
            mediaStore.clearRemotePanes();
            participantsStore.clearParticipants();

            // Reset media states
            mediaStore.setMediaState('audioMuted', false);
            mediaStore.setMediaState('videoMuted', false);

            console.log('[LeaveMeeting] Successfully left, all media cleaned up');
        } catch (err) {
            console.error('[LeaveMeeting] Error:', err);
            throw err;
        }
    };

    const destroyMeeting = async (meetingId) => {
        const meetingData = meetingsStore.getMeetingById(meetingId);
        if (!meetingData) {
            return;
        }

        const meeting = meetingData.meeting;
        console.log('[DestroyMeeting] Starting destruction for meeting:', meeting.id);

        try {
            // Stop local media first using cleanup function
            cleanupLocalMedia();

            // Also clear store references
            mediaStore.clearLocalStreams();

            // Leave meeting if not already left
            if (meeting.state !== 'LEFT' && meeting.state !== MEETING_STATES.LEFT) {
                console.log('[DestroyMeeting] Leaving meeting...');
                await meeting.leave();
            }

            // Stop remote media manager
            if (meeting.remoteMediaManager) {
                try {
                    console.log('[DestroyMeeting] Stopping remote media manager...');
                    await meeting.remoteMediaManager.stop();
                } catch (err) {
                    console.debug('[DestroyMeeting] remoteMediaManager.stop() failed (ignored):', err);
                }
            }

            // Remove all event listeners
            if (meeting.off) {
                meeting.off();
            }
            if (meeting.members?.off) {
                meeting.members.off();
            }

            // Unregister from SDK collection
            try {
                const webex = getWebexInstance();
                if (webex?.meetings?.unregisterMeeting) {
                    await webex.meetings.unregisterMeeting(meeting);
                    console.log('[DestroyMeeting] Meeting unregistered from SDK');
                }
            } catch (err) {
                console.warn('[DestroyMeeting] Failed to unregister meeting:', err);
            }

            // Clear all stores
            meetingsStore.updateMeetingState(meetingId, MEETING_STATES.LEFT);

            if (meetingsStore.currentMeetingId === meetingId) {
                meetingsStore.setCurrentMeeting(null);
            }

            meetingsStore.setModerator(false);
            mediaStore.clearRemotePanes();
            participantsStore.clearParticipants();
            mediaStore.setMediaState('audioMuted', false);
            mediaStore.setMediaState('videoMuted', false);

            console.log('[DestroyMeeting] Destruction complete');
        } catch (err) {
            console.error('[DestroyMeeting] Error:', err);
            throw err;
        }
    };

    const lockMeeting = async (meetingId) => {
        const meetingData = meetingsStore.getMeetingById(meetingId);
        if (meetingData) {
            await meetingData.meeting.lockMeeting();
        }
    };

    const unlockMeeting = async (meetingId) => {
        const meetingData = meetingsStore.getMeetingById(meetingId);
        if (meetingData) {
            await meetingData.meeting.unlockMeeting();
        }
    };

    const muteParticipant = async (meetingId, participantId, mute = true) => {
        const meetingData = meetingsStore.getMeetingById(meetingId);
        if (meetingData) {
            await meetingData.meeting.mute(participantId, mute);
        }
    };

    const removeParticipant = async (meetingId, participantId) => {
        const meetingData = meetingsStore.getMeetingById(meetingId);
        if (meetingData) {
            await meetingData.meeting.remove(participantId);
        }
    };

    const admitFromLobby = async (meetingId, participantId) => {
        const meetingData = meetingsStore.getMeetingById(meetingId);
        if (meetingData) {
            await meetingData.meeting.admit([participantId]);
        }
    };

    const admitAllFromLobby = async (meetingId) => {
        const meetingData = meetingsStore.getMeetingById(meetingId);
        if (!meetingData) {
            return;
        }

        try {
            // Get all participants in lobby
            const lobbyParticipants = participantsStore.getParticipantsByStatus(PARTICIPANT_STATUS.IN_LOBBY);

            if (lobbyParticipants.length === 0) {
                console.log('[AdmitAll] No participants in lobby');
                return;
            }

            const participantIds = lobbyParticipants.map(p => p.id);
            console.log(`[AdmitAll] Admitting ${participantIds.length} participants from lobby`);

            await meetingData.meeting.admit(participantIds);

            meetingsStore.addNotification({
                type: 'success',
                message: `Admitted ${participantIds.length} participants from lobby`
            });
        } catch (err) {
            console.error('[AdmitAll] Error:', err);
            meetingsStore.addNotification({
                type: 'error',
                message: 'Failed to admit participants from lobby'
            });
        }
    };

    const denyEntry = async (meetingId, participantId) => {
        const meetingData = meetingsStore.getMeetingById(meetingId);
        if (!meetingData) {
            return;
        }

        try {
            // The SDK might use 'remove' for denying entry from lobby
            await meetingData.meeting.remove(participantId);

            meetingsStore.addNotification({
                type: 'info',
                message: 'Denied entry to participant'
            });
        } catch (err) {
            console.error('[DenyEntry] Error:', err);
            meetingsStore.addNotification({
                type: 'error',
                message: 'Failed to deny entry'
            });
        }
    };

    const setupMeetingListeners = (meeting) => {
        if (!meeting || !meeting.members) {
            console.warn('Invalid meeting object for listeners');
            return;
        }

        // Listen for participant updates
        meeting.members.on('members:update', ({ delta }) => {
            try {
                if (delta.added) {
                    delta.added.forEach(member => {
                        if (!member || !member.id) {
                            return;
                        }

                        participantsStore.addParticipant({
                            id: member.id,
                            name: member.name || 'Unknown',
                            isAudioMuted: member.isAudioMuted || false,
                            isVideoMuted: member.isVideoMuted || false,
                            status: member.isInMeeting ? PARTICIPANT_STATUS.IN_MEETING :
                                member.isInLobby ? PARTICIPANT_STATUS.IN_LOBBY :
                                    PARTICIPANT_STATUS.NOT_IN_MEETING,
                            isSelf: member.isSelf || false,
                            isModerator: member.isModerator || false
                        });

                        // Update moderator status if this is us
                        if (member.isSelf) {
                            console.log('Self member detected:', {
                                name: member.name,
                                isModerator: member.isModerator,
                                id: member.id
                            });
                            meetingsStore.setModerator(member.isModerator || false);
                        }
                    });
                }

                if (delta.updated) {
                    delta.updated.forEach(member => {
                        if (!member || !member.id) {
                            return;
                        }

                        participantsStore.updateParticipant(member.id, {
                            isAudioMuted: member.isAudioMuted || false,
                            isVideoMuted: member.isVideoMuted || false,
                            status: member.isInMeeting ? PARTICIPANT_STATUS.IN_MEETING :
                                member.isInLobby ? PARTICIPANT_STATUS.IN_LOBBY :
                                    PARTICIPANT_STATUS.NOT_IN_MEETING,
                            isModerator: member.isModerator || false
                        });

                        // Update moderator status if this is us
                        if (member.isSelf && member.isModerator !== undefined) {
                            meetingsStore.setModerator(member.isModerator);
                        }
                    });
                }
            } catch (err) {
                console.error('Error in members:update handler:', err);
            }
        });

        // Listen for custom pin events from other participants
        meeting.on('meeting:receiveCustomEvent', (event) => {
            try {
                if (event.type === 'PIN_PARTICIPANT') {
                    console.log('Received pin event:', event.data);
                    if (event.data.memberId) {
                        meetingsStore.pinParticipant(event.data.memberId);
                    } else {
                        meetingsStore.unpinParticipant();
                    }
                }
            } catch (err) {
                console.error('Error handling custom event:', err);
            }
        });

        // Listen for meeting locked/unlocked
        meeting.on('meeting:locked', () => {
            console.log('[Meeting] Meeting locked');
            meetingsStore.setMeetingLocked(true);
            meetingsStore.addNotification({
                type: 'info',
                message: 'Meeting has been locked'
            });
        });

        meeting.on('meeting:unlocked', () => {
            console.log('[Meeting] Meeting unlocked');
            meetingsStore.setMeetingLocked(false);
            meetingsStore.addNotification({
                type: 'info',
                message: 'Meeting has been unlocked'
            });
        });

        // Listen for self being muted/unmuted by others
        meeting.on('meeting:self:mutedByOthers', () => {
            console.log('[Meeting] You were muted by moderator');
            mediaStore.setMediaState('audioMuted', true);
            meetingsStore.addNotification({
                type: 'warning',
                message: 'You were muted by the moderator'
            });
        });

        meeting.on('meeting:self:unmutedByOthers', () => {
            console.log('[Meeting] You were unmuted by moderator');
            mediaStore.setMediaState('audioMuted', false);
            meetingsStore.addNotification({
                type: 'info',
                message: 'You were unmuted by the moderator'
            });
        });

        meeting.on('meeting:self:requestedToUnmute', () => {
            console.log('[Meeting] Moderator requested you to unmute');
            meetingsStore.addNotification({
                type: 'info',
                message: 'Moderator has requested you to unmute'
            });
        });

        // Listen for meeting state changes
        meeting.on('meeting:stateChanged', (payload) => {
            console.log('[Meeting] State changed:', payload);
            if (payload.currentState) {
                meetingsStore.updateMeetingState(meeting.id, payload.currentState);
            }
        });

        // Network quality monitoring
        meeting.on('network:quality', (payload) => {
            console.log('[Network] Quality changed:', payload);
            // Payload typically includes: {downlinkQuality, uplinkQuality}
            // downlinkQuality/uplinkQuality can be: 'good', 'poor', 'unknown'

            let overallQuality = 'good';
            if (payload.downlinkQuality === 'poor' || payload.uplinkQuality === 'poor') {
                overallQuality = 'poor';
            } else if (payload.downlinkQuality === 'unknown' || payload.uplinkQuality === 'unknown') {
                overallQuality = 'unknown';
            }

            meetingsStore.setNetworkQuality(overallQuality);

            if (overallQuality === 'poor') {
                meetingsStore.addNotification({
                    type: 'warning',
                    message: 'Poor network quality detected'
                });
            }
        });
    };

    const broadcastPinState = async (meetingId, memberId = null) => {
        const meetingData = meetingsStore.getMeetingById(meetingId);
        if (!meetingData) {
            console.warn('[BroadcastPin] Meeting not found');
            return;
        }

        try {
            const meeting = meetingData.meeting;

            // SDK 3.9.0 supports reactions - try using that for custom data
            // Check if sendReaction is available
            if (typeof meeting.sendReaction === 'function') {
                console.log('[BroadcastPin] Using sendReaction for pin state');

                // Send pin state as a reaction with custom data
                await meeting.sendReaction({
                    type: 'PIN_PARTICIPANT',
                    data: {
                        memberId: memberId,
                        timestamp: Date.now()
                    }
                });

                console.log('[BroadcastPin] Pin state broadcasted:', memberId ? `pinned ${memberId}` : 'unpinned');
                return;
            }

            // Try data channel if available
            if (meeting.dataChannel && typeof meeting.dataChannel.send === 'function') {
                console.log('[BroadcastPin] Using dataChannel for pin state');

                await meeting.dataChannel.send({
                    type: 'PIN_PARTICIPANT',
                    data: {
                        memberId: memberId,
                        timestamp: Date.now()
                    }
                });

                console.log('[BroadcastPin] Pin state broadcasted via dataChannel');
                return;
            }

            // Fallback: Check for other broadcast methods
            const availableMethods = Object.keys(meeting).filter(key =>
                typeof meeting[key] === 'function' &&
                (key.includes('send') || key.includes('broadcast'))
            );

            console.warn('[BroadcastPin] No suitable broadcast method found. Available methods:', availableMethods);
            console.log('[BroadcastPin] Pin state updated locally only');

        } catch (err) {
            console.error('[BroadcastPin] Error:', err);
            // Don't throw - local pin state still works
        }
    };

    /**
     * Setup global meeting listeners for incoming calls
     * Call this once after SDK initialization
     */
    const setupGlobalMeetingListeners = () => {
        const webex = getWebexInstance();
        if (!webex || !webex.meetings) {
            console.warn('[IncomingCall] Webex not initialized');
            return;
        }

        // Listen for incoming meeting notifications
        webex.meetings.on('meeting:added', (event) => {
            const meeting = event.meeting;

            console.log('[IncomingCall] New meeting detected:', {
                id: meeting.id,
                sipUri: meeting.sipUri,
                state: meeting.state
            });

            // Check if this is an incoming call (not one we created)
            if (meeting.state === 'ACTIVE' || meeting.state === 'IDLE') {
                // Get caller information
                const callerName = meeting.partner?.name || meeting.sipUri || 'Unknown Caller';
                const meetingDetails = meeting.sipUri || meeting.destination;

                // Show incoming call toast
                meetingsStore.setIncomingCall({
                    meetingId: meeting.id,
                    callerName,
                    meetingDetails,
                    meeting // Store reference for answering
                });

                console.log('[IncomingCall] Incoming call from:', callerName);

                // Setup listeners for this meeting
                setupMeetingListeners(meeting);

                // Add to store
                meetingsStore.addMeeting(meeting);
            }
        });
    };

    /**
     * Answer an incoming call
     */
    const answerIncomingCall = async (meetingId) => {
        try {
            console.log('[IncomingCall] Answering call:', meetingId);

            // Clear the incoming call toast
            meetingsStore.clearIncomingCall();

            // Join the meeting
            await joinMeeting(meetingId);

            console.log('[IncomingCall] Call answered successfully');
        } catch (err) {
            console.error('[IncomingCall] Error answering call:', err);
            meetingsStore.addNotification({
                type: 'error',
                message: 'Failed to answer incoming call'
            });
            throw err;
        }
    };

    /**
     * Decline an incoming call
     */
    const declineIncomingCall = async (meetingId) => {
        try {
            console.log('[IncomingCall] Declining call:', meetingId);

            const meetingData = meetingsStore.getMeetingById(meetingId);
            if (meetingData) {
                // Leave/decline the meeting
                await meetingData.meeting.leave();

                // Remove from store
                meetingsStore.removeMeeting(meetingId);
            }

            // Clear the incoming call toast
            meetingsStore.clearIncomingCall();

            console.log('[IncomingCall] Call declined');
        } catch (err) {
            console.error('[IncomingCall] Error declining call:', err);
            // Still clear the toast even if decline fails
            meetingsStore.clearIncomingCall();
        }
    };

    return {
        syncMeetings,
        createMeeting,
        joinMeeting,
        leaveMeeting,
        destroyMeeting,
        lockMeeting,
        unlockMeeting,
        muteParticipant,
        removeParticipant,
        admitFromLobby,
        admitAllFromLobby,
        denyEntry,
        broadcastPinState,
        setupGlobalMeetingListeners,
        answerIncomingCall,
        declineIncomingCall
    };
};
