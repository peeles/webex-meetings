import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useMeetingsStore } from '@/storage/meetings.js';
import { LAYOUTS } from '@/dicts/constants.js';

describe('Meetings Store', () => {
    let store;

    beforeEach(() => {
        setActivePinia(createPinia());
        store = useMeetingsStore();
    });

    it('initialises with correct defaults', () => {
        expect(store.currentMeetingId).toBeNull();
        expect(store.currentLayout).toBe(LAYOUTS.ALL_EQUAL);
        expect(store.meetingsList).toEqual([]);
    });

    it('adds a meeting', () => {
        const meeting = {
            id: 'meeting-123',
            sipUri: 'test@example.com',
            destination: 'test@example.com',
            state: 'IDLE'
        };

        store.addMeeting(meeting);

        expect(store.getMeetingById('meeting-123')).toBeTruthy();
        expect(store.meetingsList).toHaveLength(1);
        expect(store.meetingsList[0]).toEqual({
            id: 'meeting-123',
            sipUri: 'test@example.com',
            destination: 'test@example.com',
            state: 'IDLE',
        });
    });

    it('removes a meeting', () => {
        const meeting = { id: 'meeting-123', state: 'IDLE' };
        store.addMeeting(meeting);

        store.removeMeeting('meeting-123');

        expect(store.getMeetingById('meeting-123')).toBeUndefined();
        expect(store.meetingsList).toHaveLength(0);
    });

    it('sets current meeting', () => {
        const meeting = { id: 'meeting-123', state: 'IDLE' };
        store.addMeeting(meeting);

        store.setCurrentMeeting('meeting-123');

        expect(store.currentMeetingId).toBe('meeting-123');
        expect(store.currentMeeting).toBeTruthy();
    });

    it('updates meeting state', () => {
        const meeting = { id: 'meeting-123', state: 'IDLE' };
        store.addMeeting(meeting);

        store.updateMeetingState('meeting-123', 'JOINED');

        const updated = store.getMeetingById('meeting-123');
        expect(updated.state).toBe('JOINED');
    });

    it('rejects invalid layout', () => {
        store.setLayout('INVALID_LAYOUT');
        expect(store.currentLayout).toBe(LAYOUTS.ALL_EQUAL);
    });
});
