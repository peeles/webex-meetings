import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useParticipantsStore } from '../../../src/storage/participants';
import { useMeetingsStore } from '../../../src/storage/meetings';

describe('Participants Store - Participant Pinning', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('should initialize with no pinned participant', () => {
        const store = useParticipantsStore();
        expect(store.pinnedParticipantId).toBe(null);
    });

    it('should pin a participant by member ID', () => {
        const store = useParticipantsStore();
        const memberId = 'participant-123';

        store.pinParticipant(memberId);

        expect(store.pinnedParticipantId).toBe(memberId);
    });

    it('should unpin a participant', () => {
        const store = useParticipantsStore();
        const memberId = 'participant-123';

        store.pinParticipant(memberId);
        expect(store.pinnedParticipantId).toBe(memberId);

        store.unpinParticipant();
        expect(store.pinnedParticipantId).toBe(null);
    });

    it('should toggle pin state for a participant', () => {
        const store = useParticipantsStore();
        const memberId = 'participant-123';

        // First toggle: pin
        store.togglePinParticipant(memberId);
        expect(store.pinnedParticipantId).toBe(memberId);

        // Second toggle: unpin
        store.togglePinParticipant(memberId);
        expect(store.pinnedParticipantId).toBe(null);
    });

    it('should switch pinned participant when pinning a different one', () => {
        const store = useParticipantsStore();
        const memberId1 = 'participant-123';
        const memberId2 = 'participant-456';

        store.pinParticipant(memberId1);
        expect(store.pinnedParticipantId).toBe(memberId1);

        store.pinParticipant(memberId2);
        expect(store.pinnedParticipantId).toBe(memberId2);
    });

    it('should handle toggle with different participant IDs', () => {
        const store = useParticipantsStore();
        const memberId1 = 'participant-123';
        const memberId2 = 'participant-456';

        // Pin first participant
        store.togglePinParticipant(memberId1);
        expect(store.pinnedParticipantId).toBe(memberId1);

        // Toggle with different participant should pin the new one
        store.togglePinParticipant(memberId2);
        expect(store.pinnedParticipantId).toBe(memberId2);
    });

    it('should clear pinned participant when clearing participants', () => {
        const store = useParticipantsStore();
        const memberId = 'participant-123';

        store.pinParticipant(memberId);
        expect(store.pinnedParticipantId).toBe(memberId);

        // Unpinning should clear the pinned state
        store.unpinParticipant();

        expect(store.pinnedParticipantId).toBe(null);
    });

    it('should maintain pinned state across layout changes', () => {
        const participantsStore = useParticipantsStore();
        const meetingsStore = useMeetingsStore();
        const memberId = 'participant-123';

        participantsStore.pinParticipant(memberId);
        expect(participantsStore.pinnedParticipantId).toBe(memberId);

        // Layout changes shouldn't affect pin state
        meetingsStore.setLayout('Single');
        expect(participantsStore.pinnedParticipantId).toBe(memberId);

        meetingsStore.setLayout('AllEqual');
        expect(participantsStore.pinnedParticipantId).toBe(memberId);
    });
});