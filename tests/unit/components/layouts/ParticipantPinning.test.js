import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { useMeetingsStore } from '@/storage/meetings.js';
import { useParticipantsStore } from '@/storage/participants.js';
import VideoLayout from '@components/video/VideoLayout.vue';

describe('VideoLayout - Participant Pinning', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  const mountComponent = (props) => {
    return mount(VideoLayout, {
      props: props,
    });
  };

  const mockPanes = [
    {
      id: 'pane-1',
      stream: new MediaStream(),
      memberId: 'participant-123',
      sourceState: 'live',
    },
  ];

  it('should render in normal mode when no participant is pinned', () => {
    const wrapper = mountComponent({
      panes: [],
      layout: 'AllEqual',
    });

    // Check for normal grid layout
    expect(wrapper.find('.grid').exists()).toBe(true);
    expect(wrapper.find('.flex.w-full.h-full').exists()).toBe(true);
  });

  it('should display pinned participant in main area', async () => {
    const participantsStore = useParticipantsStore();

    // Add participant to store
    participantsStore.addParticipant({
      id: 'participant-123',
      name: 'John Doe',
      status: 'IN_MEETING',
    });

    const wrapper = mountComponent({
      panes: mockPanes,
      layout: 'AllEqual',
    });

    participantsStore.pinParticipant('participant-123');
    await wrapper.vm.$nextTick();

    // Find the main area (flex-1)
    const mainArea = wrapper.find('.flex-1');
    expect(mainArea.exists()).toBe(true);
  });

  it('should switch back to normal mode when unpinning', async () => {
    const participantsStore = useParticipantsStore();

    const wrapper = mount(VideoLayout, {
      props: {
        panes: mockPanes,
        layout: 'AllEqual',
      },
    });

    // Pin
    participantsStore.pinParticipant('participant-123');
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.flex.w-full.h-full').exists()).toBe(true);

    // Unpin
    participantsStore.unpinParticipant();
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.grid').exists()).toBe(true);
    expect(wrapper.find('.flex.w-full.h-full').exists()).toBe(true);
  });

  it('should filter out panes with no source', async () => {
    const mockPanes = [
      {
        id: 'pane-1',
        stream: new MediaStream(),
        memberId: 'participant-123',
        sourceState: 'live',
      },
      {
        id: 'pane-2',
        stream: null,
        memberId: 'participant-456',
        sourceState: 'no source',
      },
    ];

    const wrapper = mount(VideoLayout, {
      props: {
        panes: mockPanes,
        layout: 'AllEqual',
      },
    });

    // Should only show 1 pane (the one with source)
    const videoPanes = wrapper.findAllComponents({ name: 'VideoPane' });
    expect(videoPanes.length).toBe(1);
  });

  it('should apply correct grid classes for AllEqual layout', () => {
    const wrapper = mount(VideoLayout, {
      props: {
        panes: [],
        layout: 'AllEqual',
      },
    });

    const grid = wrapper.find('.grid');
    expect(grid.classes()).toContain('grid-cols-1');
    expect(grid.classes()).toContain('grid-rows-1');
  });

  it('should handle pin events from VideoPane', async () => {
    const meetingsStore = useMeetingsStore();
    const participantsStore = useParticipantsStore();

    // Set moderator status to allow pinning
    meetingsStore.setModerator(true);

    const wrapper = mount(VideoLayout, {
      props: {
        panes: mockPanes,
        layout: 'AllEqual',
      },
    });

    // Trigger pin event
    const videoPane = wrapper.findComponent({ name: 'VideoPane' });
    await videoPane.vm.$emit('pin', 'participant-123');
    await wrapper.vm.$nextTick();

    expect(participantsStore.pinnedParticipantId).toBe('participant-123');
  });

  it('should handle unpin events from VideoPane', async () => {
    const meetingsStore = useMeetingsStore();
    const participantsStore = useParticipantsStore();

    // Set moderator status to allow unpinning
    meetingsStore.setModerator(true);

    const wrapper = mount(VideoLayout, {
      props: {
        panes: mockPanes,
        layout: 'AllEqual',
      },
    });

    // First pin
    participantsStore.pinParticipant('participant-123');
    await wrapper.vm.$nextTick();

    // Then unpin
    const videoPane = wrapper.findComponent({ name: 'VideoPane' });
    await videoPane.vm.$emit('unpin');
    await wrapper.vm.$nextTick();

    expect(participantsStore.pinnedParticipantId).toBe(null);
  });
});
