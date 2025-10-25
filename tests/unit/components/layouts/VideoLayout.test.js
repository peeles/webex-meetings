import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import VideoLayout from '@components/video/VideoLayout.vue';
import { useMeetingsStore } from '@/storage/meetings.js';
import { useParticipantsStore } from '@/storage/participants.js';
import VideoPane from '@components/video/VideoPane.vue';

describe('VideoLayout', () => {
    let meetingsStore;
    let participantsStore;

    beforeEach(() => {
        setActivePinia(createPinia());
        meetingsStore = useMeetingsStore();
        participantsStore = useParticipantsStore();
    });

    const mountComponent = (props) => {
        return mount(VideoLayout, {
            props: props
        })
    };

    it('renders correctly with no panes', () => {
        const wrapper = mountComponent({
            panes: [],
            localStream: null,
            activeSpeakerId: null,
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

        const wrapper = mountComponent({
            panes,
            localStream: new MediaStream(),
            activeSpeakerId: 'user-1',
        });

        const videos = wrapper.findAll('video');
        expect(videos.length).toBeGreaterThan(0);
    });

    it('limits the remote grid to eight panes and uses an overflow tile when needed', () => {
        const panes = Array.from({ length: 10 }, (_, index) => ({
            id: `pane-${index + 1}`,
            stream: new MediaStream(),
            memberId: `user-${index + 1}`,
            sourceState: 'live'
        }));

        const wrapper = mountComponent({
            panes,
            localStream: new MediaStream(),
            layout: 'AllEqual'
        });

        const grid = wrapper.find('[data-testid="video-grid"]');
        const gridVideoPanes = grid.findAllComponents(VideoPane);
        const overflowTile = grid.find('[data-testid="overflow-count-tile"]');
        const localPreview = wrapper.find('[data-testid="local-preview"]');

        expect(gridVideoPanes).toHaveLength(8);
        expect(gridVideoPanes.at(-1)?.props('memberId')).toBe('user-8');
        expect(overflowTile.exists()).toBe(true);
        expect(overflowTile.text()).toBe('+2');
        expect(localPreview.exists()).toBe(true);
    });

    it('renders at most nine remote tiles when no local stream is present', () => {
        const panes = Array.from({ length: 12 }, (_, index) => ({
            id: `pane-${index + 1}`,
            stream: new MediaStream(),
            memberId: `user-${index + 1}`,
            sourceState: 'live'
        }));

        const wrapper = mountComponent({
            panes,
            localStream: null,
            layout: 'AllEqual'
        });

        const grid = wrapper.find('[data-testid="video-grid"]');
        const gridVideoPanes = grid.findAllComponents(VideoPane);
        const overflowTile = grid.find('[data-testid="overflow-count-tile"]');

        expect(gridVideoPanes).toHaveLength(8);
        expect(gridVideoPanes.at(-1)?.props('memberId')).toBe('user-8');
        expect(overflowTile.exists()).toBe(true);
        expect(overflowTile.text()).toBe('+4');
    });

    it('does not show overflow tile when eight or fewer participants are present', () => {
        const panes = Array.from({ length: 8 }, (_, index) => ({
            id: `pane-${index + 1}`,
            stream: new MediaStream(),
            memberId: `user-${index + 1}`,
            sourceState: 'live'
        }));

        const wrapper = mountComponent({
            panes,
            localStream: null,
            layout: 'AllEqual'
        });

        const grid = wrapper.find('[data-testid="video-grid"]');
        const gridVideoPanes = grid.findAllComponents(VideoPane);
        const overflowTile = grid.find('[data-testid="overflow-count-tile"]');

        expect(gridVideoPanes).toHaveLength(8);
        expect(overflowTile.exists()).toBe(false);
    });

    it('allows the local preview to be hidden and shown again', async () => {
        const panes = Array.from({ length: 3 }, (_, index) => ({
            id: `pane-${index + 1}`,
            stream: new MediaStream(),
            memberId: `user-${index + 1}`,
            sourceState: 'live'
        }));

        const wrapper = mountComponent({
            panes,
            localStream: new MediaStream(),
            layout: 'AllEqual'
        });

        const hideButton = wrapper.get('[data-testid="hide-local-preview"]');
        await hideButton.trigger('click');

        expect(wrapper.find('[data-testid="local-preview"]').exists()).toBe(false);

        const showButton = wrapper.get('[data-testid="show-local-preview"]');
        await showButton.trigger('click');

        expect(wrapper.find('[data-testid="local-preview"]').exists()).toBe(true);
    });

    it('applies layout-specific grid classes', async () => {
        const wrapper = mountComponent({
            panes: [],
            localStream: null,
            layout: 'AllEqual'
        });

        const grid = wrapper.find('.grid');
        expect(grid.classes()).toContain('grid-cols-1');
        expect(grid.classes()).toContain('grid-rows-1');
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

        const wrapper = mountComponent({
            panes,
            localStream: new MediaStream(),
            activeSpeakerId: 'user-1',
        });

        // Check that the participant name is rendered
        expect(wrapper.html()).toContain('Active Speaker');
    });
});
