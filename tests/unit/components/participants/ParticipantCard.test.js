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
                    ...overrides
                }
            },
            global: {
                stubs: {
                    BaseAvatar: { template: '<div />' },
                    BaseBadge: { template: '<div><slot /></div>' }
                }
            }
        });
    };

    it('normalises multi-word status text by replacing underscores and lowercasing', () => {
        const wrapper = mountComponent();

        expect(wrapper.find('.text-xs.text-gray-500').text()).toBe('in meeting now');
    });

    it('returns empty string when status is missing', () => {
        const wrapper = mountComponent({ status: undefined });

        expect(wrapper.find('.text-xs.text-gray-500').text()).toBe('');
    });
});
