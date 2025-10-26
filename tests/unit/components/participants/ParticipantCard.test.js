import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ParticipantCard from '@components/participants/ParticipantCard.vue';

describe('ParticipantCard', () => {
    const mountComponent = (overrides = {}) => {
        return mount(ParticipantCard, {
            props: {
                participant: {
                    name: 'Sample User',
                    status: 'IN_MEETING_NOW',
                    isSelf: false,
                    isAudioMuted: false,
                    isVideoMuted: false,
                    ...overrides,
                },
            },
            global: {
                stubs: {
                    BaseAvatar: { template: '<div />' },
                    BaseBadge: { template: '<div><slot /></div>' },
                },
            },
        });
    };

    it('normalises multi-word status text by replacing underscores and lowercasing', () => {
        const wrapper = mountComponent();

        expect(wrapper.find('.text-xs.text-stone-500').text()).toBe(
            'in meeting now'
        );
    });

    it('returns empty string when status is missing', () => {
        const wrapper = mountComponent({ status: undefined });

        expect(wrapper.find('.text-xs.text-stone-500').text()).toBe('');
    });

    describe('Local participant styling', () => {
        it('should display pale green background for local participant', () => {
            const wrapper = mountComponent({ isSelf: true });

            const card = wrapper.find('[class*="bg-green-50"]');
            expect(card.exists()).toBe(true);
            expect(card.classes()).toContain('bg-green-50');
            expect(card.classes()).toContain('border-green-200');
        });

        it('should display white background for non-local participant', () => {
            const wrapper = mountComponent({ isSelf: false });

            const card = wrapper.find('[class*="bg-white"]');
            expect(card.exists()).toBe(true);
            expect(card.classes()).toContain('bg-white');
            expect(card.classes()).toContain('border-stone-200');
        });

        it('should display "(You)" label for local participant', () => {
            const wrapper = mountComponent({ isSelf: true, name: 'John Doe' });

            expect(wrapper.text()).toContain('John Doe');
            expect(wrapper.text()).toContain('(You)');
        });

        it('should not display "(You)" label for non-local participant', () => {
            const wrapper = mountComponent({ isSelf: false, name: 'Jane Smith' });

            expect(wrapper.text()).toContain('Jane Smith');
            expect(wrapper.text()).not.toContain('(You)');
        });
    });

    describe('Audio and Video status badges', () => {
        it('should display "Muted" badge when audio is muted', () => {
            const wrapper = mountComponent({ isAudioMuted: true });

            expect(wrapper.text()).toContain('Muted');
        });

        it('should display "Audio" badge when audio is not muted', () => {
            const wrapper = mountComponent({ isAudioMuted: false });

            expect(wrapper.text()).toContain('Audio');
        });

        it('should display "No Video" badge when video is muted', () => {
            const wrapper = mountComponent({ isVideoMuted: true });

            expect(wrapper.text()).toContain('No Video');
        });

        it('should display "Video" badge when video is not muted', () => {
            const wrapper = mountComponent({ isVideoMuted: false });

            expect(wrapper.text()).toContain('Video');
        });
    });
});
