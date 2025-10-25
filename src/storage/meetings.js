import { defineStore } from 'pinia';
import { ref, computed, reactive, markRaw } from 'vue';
import { LAYOUTS } from '@/dicts/constants';

const meetingsMap = new Map();

export const useMeetingsStore = defineStore('meetings', () => {
    const currentMeetingId = ref(null);
    const currentLayout = ref(LAYOUTS.ALL_EQUAL);
    const participants = reactive({});
    const isModerator = ref(false);
    const networkQuality = ref('good'); // 'good', 'poor', 'unknown'
    const meetingLocked = ref(false);
    const meetingNotifications = ref([]);
    const incomingCall = ref(null); // { meetingId, callerName, meetingDetails, timestamp }

    const currentMeeting = computed(() => {
        if (!currentMeetingId.value) {
            return null;
        }
        return meetingsMap.get(currentMeetingId.value);
    });

    const meetingsList = computed(() => {
        return Array.from(meetingsMap.values()).map((meeting) => ({
            id: meeting.id,
            sipUri: meeting.sipUri,
            destination: meeting.destination,
            state: meeting.state,
        }));
    });

    const addMeeting = (meeting) => {
        meetingsMap.set(meeting.id, {
            id: meeting.id,
            sipUri: meeting.sipUri,
            destination: meeting.destination,
            state: meeting.state,
            meeting: markRaw(meeting) // Preserve SDK instance methods
        });
    };

    const removeMeeting = (meetingId) => {
        meetingsMap.delete(meetingId);
        if (currentMeetingId.value === meetingId) {
            currentMeetingId.value = null;
        }
    };

    const setCurrentMeeting = (meetingId) => {
        currentMeetingId.value = meetingId;
    };

    const updateMeetingState = (meetingId, state) => {
        const meeting = meetingsMap.get(meetingId);
        if (meeting) {
            meeting.state = state;
        }
    };

    const setLayout = (layout) => {
        if (Object.values(LAYOUTS).includes(layout)) {
            currentLayout.value = layout;
        }
    };

    const setParticipant = (id, data) => {
        if (data === null) {
            removeParticipant(id);
            return;
        }

        if (participants[id]) {
            participants[id] = { ...participants[id], ...data };
        } else {
            participants[id] = { ...data };
        }
    };

    const getParticipant = (id) => {
        try {
            return participants[id];
        } catch (e) {
            return null;
        }
    };

    const removeParticipant = (id) => {
        delete participants[id];
    }

    const getMeetingById = (id) => {
        return meetingsMap.get(id);
    };

    const clearMeetings = () => {
        meetingsMap.clear();
        currentMeetingId.value = null;
        currentLayout.value = LAYOUTS.ALL_EQUAL;
        isModerator.value = false;
        networkQuality.value = 'good';
        meetingLocked.value = false;
        meetingNotifications.value = [];
    };

    const setModerator = (value) => {
        isModerator.value = value;
    };

    const setNetworkQuality = (quality) => {
        networkQuality.value = quality;
    };

    const setMeetingLocked = (locked) => {
        meetingLocked.value = locked;
    };

    const addNotification = (notification) => {
        const notif = {
            id: Date.now(),
            timestamp: new Date(),
            ...notification
        };
        meetingNotifications.value.push(notif);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            removeNotification(notif.id);
        }, 5000);
    };

    const removeNotification = (id) => {
        const index = meetingNotifications.value.findIndex(n => n.id === id);
        if (index !== -1) {
            meetingNotifications.value.splice(index, 1);
        }
    };

    const clearNotifications = () => {
        meetingNotifications.value = [];
    };

    const setIncomingCall = (callData) => {
        incomingCall.value = {
            ...callData,
            timestamp: Date.now()
        };
    };

    const clearIncomingCall = () => {
        incomingCall.value = null;
    };

    return {
        currentMeetingId,
        currentLayout,
        currentMeeting,
        meetingsList,
        isModerator,
        networkQuality,
        meetingLocked,
        meetingNotifications,
        incomingCall,
        addMeeting,
        removeMeeting,
        setCurrentMeeting,
        updateMeetingState,
        setLayout,
        clearMeetings,
        getMeetingById,
        setParticipant,
        getParticipant,
        removeParticipant,
        participants,
        setModerator,
        setNetworkQuality,
        setMeetingLocked,
        addNotification,
        removeNotification,
        clearNotifications,
        setIncomingCall,
        clearIncomingCall,
    };
});
