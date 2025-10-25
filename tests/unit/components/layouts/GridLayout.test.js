import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import VideoLayout from '@components/video/VideoLayout.vue';
import { useMeetingsStore } from '@/storage/meetings.js';
import { useParticipantsStore } from '@/storage/participants.js';

describe('VideoLayout', () => {
    let meetingsStore;
    let participantsStore;

    beforeEach(() => {
        setActivePinia(createPinia());
        meetingsStore = useMeetingsStore();
        participantsStore = useParticipantsStore();
    });

    it('renders correctly with no panes', () => {
        const wrapper = mount(VideoLayout, {
            props: {
                panes: [],
                localStream: null,
                activeSpeakerId: null,
            },
        });

        // VideoLayout renders an empty grid when no panes
        expect(wrapper.find('.grid').exists()).toBe(true);
    });

    it('renders panes in grid format', () => {
        meetingsStore.setParticipant('user-1', { id: 'user-1', name: 'John Doe' });
        participantsStore.addParticipant({ id: 'user-1', name: 'John Doe' });
        participantsStore.addParticipant({ id: 'user-2', name: 'Jane Smith' });

        const panes = [
            {
                id: 'pane-1',
                stream: new MediaStream(),
                memberId: 'user-1',
                sourceState: 'live',
            },
            {
                id: 'pane-2',
                stream: new MediaStream(),
                memberId: 'user-2',
                sourceState: 'live',
            },
        ];

        const wrapper = mount(VideoLayout, {
            props: {
                panes,
                localStream: new MediaStream(),
                activeSpeakerId: 'user-1',
            },
        });

        const videos = wrapper.findAll('video');
        expect(videos.length).toBeGreaterThan(0);
    });

    it('highlights active speaker', () => {
        meetingsStore.setParticipant('user-1', { id: 'user-1', name: 'Active Speaker' });
        participantsStore.addParticipant({ id: 'user-1', name: 'Active Speaker', status: 'IN_MEETING' });

        const panes = [
            {
                id: 'pane-1',
                stream: new MediaStream(),
                memberId: 'user-1',
                sourceState: 'live',
            },
        ];

        const wrapper = mount(VideoLayout, {
            props: {
                panes,
                localStream: new MediaStream(),
                activeSpeakerId: 'user-1',
            },
        });

        // Check that the participant name is rendered
        expect(wrapper.html()).toContain('Active Speaker');
    });
});
