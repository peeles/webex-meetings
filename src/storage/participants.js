import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { PARTICIPANT_STATUS } from '@/dicts/constants';

export const useParticipantsStore = defineStore('participants', () => {
    const participants = ref(new Map());
    const pinnedParticipantId = ref(null);

    const participantsList = computed(() => {
        return Array.from(participants.value.values());
    });

    const inMeetingParticipants = computed(() => {
        return participantsList.value.filter(
            (p) => p.status === PARTICIPANT_STATUS.IN_MEETING
        );
    });

    const lobbyParticipants = computed(() => {
        return participantsList.value.filter(
            (p) => p.status === PARTICIPANT_STATUS.IN_LOBBY
        );
    });

    const addParticipant = (participant) => {
        participants.value.set(participant.id, {
            id: participant.id,
            name: participant.name,
            isAudioMuted: participant.isAudioMuted || false,
            isVideoMuted: participant.isVideoMuted || false,
            status: participant.status || PARTICIPANT_STATUS.NOT_IN_MEETING,
            isSelf: participant.isSelf || false,
        });
    };

    const updateParticipant = (participantId, updates) => {
        const participant = participants.value.get(participantId);
        if (participant) {
            Object.assign(participant, updates);
        }
    };

    const removeParticipant = (participantId) => {
        participants.value.delete(participantId);
    };

    const clearParticipants = () => {
        participants.value.clear();
    };

    const getParticipantsByStatus = (status) => {
        return participantsList.value.filter((p) => p.status === status);
    };

    const pinParticipant = (memberId) => {
        pinnedParticipantId.value = memberId;
    };

    const unpinParticipant = () => {
        pinnedParticipantId.value = null;
    };

    const togglePinParticipant = (memberId) => {
        if (pinnedParticipantId.value === memberId) {
            unpinParticipant();
        } else {
            pinParticipant(memberId);
        }
    };

    return {
        participants,
        participantsList,
        pinnedParticipantId,
        inMeetingParticipants,
        lobbyParticipants,
        addParticipant,
        updateParticipant,
        removeParticipant,
        clearParticipants,
        getParticipantsByStatus,
        pinParticipant,
        unpinParticipant,
        togglePinParticipant,
    };
});
