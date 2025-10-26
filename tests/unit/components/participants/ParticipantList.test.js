import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import ParticipantList from '@components/participants/ParticipantList.vue';
import { useParticipantsStore } from '@/storage/participants';
import { PARTICIPANT_STATUS } from '@/dicts/constants';

describe('ParticipantList', () => {
    let pinia;
    let participantsStore;

    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
        participantsStore = useParticipantsStore();
    });

    const mountComponent = (props = {}) => {
        return mount(ParticipantList, {
            props: {
                isModerator: false,
                ...props,
            },
            global: {
                plugins: [pinia],
                stubs: {
                    ParticipantCard: {
                        template:
                            '<div class="participant-card" :data-participant-id="participant.id"><slot name="actions" /></div>',
                        props: ['participant'],
                    },
                    BaseButton: {
                        template: '<button @click="$emit(\'click\')"><slot /></button>',
                    },
                },
            },
        });
    };

    describe('Participant sorting', () => {
        it('should display local participant at the top of the list', () => {
            // Add participants
            participantsStore.addParticipant({
                id: 'user-1',
                name: 'Alice',
                status: PARTICIPANT_STATUS.IN_MEETING,
                isSelf: false,
            });
            participantsStore.addParticipant({
                id: 'user-2',
                name: 'Bob',
                status: PARTICIPANT_STATUS.IN_MEETING,
                isSelf: true, // Local user
            });
            participantsStore.addParticipant({
                id: 'user-3',
                name: 'Charlie',
                status: PARTICIPANT_STATUS.IN_MEETING,
                isSelf: false,
            });

            const wrapper = mountComponent();

            const participantCards = wrapper.findAll('.participant-card');
            expect(participantCards.length).toBe(3);

            // Local participant (Bob) should be first
            expect(participantCards[0].attributes('data-participant-id')).toBe('user-2');
        });

        it('should sort non-local participants alphabetically by name (a-z)', () => {
            participantsStore.addParticipant({
                id: 'user-1',
                name: 'Zara',
                status: PARTICIPANT_STATUS.IN_MEETING,
                isSelf: false,
            });
            participantsStore.addParticipant({
                id: 'user-2',
                name: 'Alice',
                status: PARTICIPANT_STATUS.IN_MEETING,
                isSelf: false,
            });
            participantsStore.addParticipant({
                id: 'user-3',
                name: 'Mike',
                status: PARTICIPANT_STATUS.IN_MEETING,
                isSelf: false,
            });

            const wrapper = mountComponent();

            const participantCards = wrapper.findAll('.participant-card');
            expect(participantCards.length).toBe(3);

            // Should be: Alice, Mike, Zara
            expect(participantCards[0].attributes('data-participant-id')).toBe('user-2');
            expect(participantCards[1].attributes('data-participant-id')).toBe('user-3');
            expect(participantCards[2].attributes('data-participant-id')).toBe('user-1');
        });

        it('should keep local participant first regardless of name', () => {
            participantsStore.addParticipant({
                id: 'user-1',
                name: 'Alice',
                status: PARTICIPANT_STATUS.IN_MEETING,
                isSelf: false,
            });
            participantsStore.addParticipant({
                id: 'user-2',
                name: 'Zulu', // Would be last alphabetically
                status: PARTICIPANT_STATUS.IN_MEETING,
                isSelf: true,
            });
            participantsStore.addParticipant({
                id: 'user-3',
                name: 'Bob',
                status: PARTICIPANT_STATUS.IN_MEETING,
                isSelf: false,
            });

            const wrapper = mountComponent();

            const participantCards = wrapper.findAll('.participant-card');

            // Zulu (local) should be first, then Alice, then Bob
            expect(participantCards[0].attributes('data-participant-id')).toBe('user-2');
            expect(participantCards[1].attributes('data-participant-id')).toBe('user-1');
            expect(participantCards[2].attributes('data-participant-id')).toBe('user-3');
        });
    });

    describe('Moderator controls', () => {
        beforeEach(() => {
            participantsStore.addParticipant({
                id: 'user-self',
                name: 'Me',
                status: PARTICIPANT_STATUS.IN_MEETING,
                isSelf: true,
                isAudioMuted: false,
                isVideoMuted: false,
            });
            participantsStore.addParticipant({
                id: 'user-other',
                name: 'Other User',
                status: PARTICIPANT_STATUS.IN_MEETING,
                isSelf: false,
                isAudioMuted: false,
                isVideoMuted: false,
            });
        });

        it('should show action buttons for moderators on non-local participants', () => {
            const wrapper = mountComponent({ isModerator: true });

            // Check that actions slot is rendered for non-local participant
            const participantCards = wrapper.findAll('.participant-card');
            const otherUserCard = participantCards.find(
                (card) => card.attributes('data-participant-id') === 'user-other'
            );

            // Should contain action button icons (microphone-slash, video-slash, bookmark, user-xmark)
            expect(otherUserCard.html()).toContain('microphone-slash');
            expect(otherUserCard.html()).toContain('video-slash');
            expect(otherUserCard.html()).toContain('bookmark');
            expect(otherUserCard.html()).toContain('user-xmark');
        });

        it('should not show action buttons for non-moderators', () => {
            const wrapper = mountComponent({ isModerator: false });

            const buttons = wrapper.findAllComponents({ name: 'BaseButton' });
            // Only close button should exist
            expect(buttons.length).toBeLessThanOrEqual(1);
        });

        it('should not show action buttons for local participant even when moderator', () => {
            const wrapper = mountComponent({ isModerator: true });

            const participantCards = wrapper.findAll('.participant-card');
            const selfCard = participantCards.find(
                (card) => card.attributes('data-participant-id') === 'user-self'
            );

            // Self card should not have action buttons (check for icon names)
            expect(selfCard.html()).not.toContain('microphone-slash');
            expect(selfCard.html()).not.toContain('video-slash');
            expect(selfCard.html()).not.toContain('user-xmark');
        });

        it('should emit muteAudio event when audio mute button is clicked', async () => {
            const wrapper = mountComponent({ isModerator: true });

            // Find the mute audio button (microphone-slash icon)
            const buttons = wrapper.findAll('button');
            const muteAudioButton = buttons.find((btn) =>
                btn.html().includes('microphone-slash')
            );

            expect(muteAudioButton).toBeDefined();
            await muteAudioButton.trigger('click');

            expect(wrapper.emitted('muteAudio')).toBeTruthy();
            expect(wrapper.emitted('muteAudio')[0]).toEqual(['user-other']);
        });

        it('should emit muteVideo event when video mute button is clicked', async () => {
            const wrapper = mountComponent({ isModerator: true });

            const buttons = wrapper.findAll('button');
            const muteVideoButton = buttons.find((btn) =>
                btn.html().includes('video-slash')
            );

            expect(muteVideoButton).toBeDefined();
            await muteVideoButton.trigger('click');

            expect(wrapper.emitted('muteVideo')).toBeTruthy();
            expect(wrapper.emitted('muteVideo')[0]).toEqual(['user-other']);
        });

        it('should emit pin event when pin button is clicked', async () => {
            const wrapper = mountComponent({ isModerator: true });

            const buttons = wrapper.findAll('button');
            const pinButton = buttons.find((btn) => btn.html().includes('bookmark'));

            expect(pinButton).toBeDefined();
            await pinButton.trigger('click');

            expect(wrapper.emitted('pin')).toBeTruthy();
            expect(wrapper.emitted('pin')[0]).toEqual(['user-other']);
        });

        it('should emit unpin event when unpin button is clicked on pinned participant', async () => {
            // Pin the participant first
            participantsStore.pinParticipant('user-other');

            const wrapper = mountComponent({ isModerator: true });

            const buttons = wrapper.findAll('button');
            const unpinButton = buttons.find((btn) => btn.html().includes('bookmark'));

            expect(unpinButton).toBeDefined();
            await unpinButton.trigger('click');

            expect(wrapper.emitted('unpin')).toBeTruthy();
            expect(wrapper.emitted('unpin')[0]).toEqual(['user-other']);
        });

        it('should emit remove event when remove button is clicked', async () => {
            const wrapper = mountComponent({ isModerator: true });

            const buttons = wrapper.findAll('button');
            const removeButton = buttons.find((btn) => btn.html().includes('user-xmark'));

            expect(removeButton).toBeDefined();
            await removeButton.trigger('click');

            expect(wrapper.emitted('remove')).toBeTruthy();
            expect(wrapper.emitted('remove')[0]).toEqual(['user-other']);
        });

        it('should not show audio mute button when participant audio is already muted', () => {
            participantsStore.updateParticipant('user-other', { isAudioMuted: true });

            const wrapper = mountComponent({ isModerator: true });

            const buttons = wrapper.findAll('button');
            const muteAudioButton = buttons.find((btn) =>
                btn.html().includes('microphone-slash')
            );

            expect(muteAudioButton).toBeUndefined();
        });

        it('should not show video mute button when participant video is already muted', () => {
            participantsStore.updateParticipant('user-other', { isVideoMuted: true });

            const wrapper = mountComponent({ isModerator: true });

            const buttons = wrapper.findAll('button');
            const muteVideoButton = buttons.find((btn) =>
                btn.html().includes('video-slash')
            );

            expect(muteVideoButton).toBeUndefined();
        });
    });

    describe('Lobby participants', () => {
        it('should display lobby section when participants are in lobby and user is moderator', () => {
            participantsStore.addParticipant({
                id: 'lobby-1',
                name: 'Waiting User',
                status: PARTICIPANT_STATUS.IN_LOBBY,
                isSelf: false,
            });

            const wrapper = mountComponent({ isModerator: true });

            expect(wrapper.text()).toContain('In Lobby (1)');
            expect(wrapper.text()).toContain('Waiting User');
            expect(wrapper.text()).toContain('Admit');
        });

        it('should not display lobby section for non-moderators', () => {
            participantsStore.addParticipant({
                id: 'lobby-1',
                name: 'Waiting User',
                status: PARTICIPANT_STATUS.IN_LOBBY,
                isSelf: false,
            });

            const wrapper = mountComponent({ isModerator: false });

            expect(wrapper.text()).not.toContain('In Lobby');
        });

        it('should emit admit event when admit button is clicked', async () => {
            participantsStore.addParticipant({
                id: 'lobby-1',
                name: 'Waiting User',
                status: PARTICIPANT_STATUS.IN_LOBBY,
                isSelf: false,
            });

            const wrapper = mountComponent({ isModerator: true });

            const admitButton = wrapper.findAll('button').find((btn) => {
                return btn.text() === 'Admit';
            });

            expect(admitButton).toBeDefined();
            await admitButton.trigger('click');

            expect(wrapper.emitted('admit')).toBeTruthy();
            expect(wrapper.emitted('admit')[0]).toEqual(['lobby-1']);
        });
    });

    describe('Participant count', () => {
        it('should display correct total count including lobby participants', () => {
            participantsStore.addParticipant({
                id: 'user-1',
                name: 'User 1',
                status: PARTICIPANT_STATUS.IN_MEETING,
                isSelf: false,
            });
            participantsStore.addParticipant({
                id: 'user-2',
                name: 'User 2',
                status: PARTICIPANT_STATUS.IN_MEETING,
                isSelf: false,
            });
            participantsStore.addParticipant({
                id: 'lobby-1',
                name: 'Waiting',
                status: PARTICIPANT_STATUS.IN_LOBBY,
                isSelf: false,
            });

            const wrapper = mountComponent({ isModerator: true });

            expect(wrapper.text()).toContain('Participants (3)');
        });
    });

    describe('Close functionality', () => {
        it('should emit close event when close button is clicked', async () => {
            const wrapper = mountComponent();

            const closeButton = wrapper.findAll('button').find((btn) => {
                return btn.html().includes('xmark');
            });

            expect(closeButton).toBeDefined();
            await closeButton.trigger('click');

            expect(wrapper.emitted('close')).toBeTruthy();
        });
    });

    describe('Pin indicator', () => {
        it('should highlight pinned participant with blue color', () => {
            participantsStore.addParticipant({
                id: 'user-1',
                name: 'User 1',
                status: PARTICIPANT_STATUS.IN_MEETING,
                isSelf: false,
            });

            participantsStore.pinParticipant('user-1');

            const wrapper = mountComponent({ isModerator: true });

            const buttons = wrapper.findAll('button');
            const pinButton = buttons.find(
                (btn) =>
                    btn.html().includes('bookmark') && btn.classes().includes('text-blue-500')
            );

            expect(pinButton).toBeDefined();
        });
    });
});