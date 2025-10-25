// tests/unit/components/VideoPane.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';

describe('VideoPane', () => {
    let mockStream;
    let VideoPane;

    beforeEach(async () => {
        // Set up Pinia for store access
        setActivePinia(createPinia());

        // Ensure MediaStream is available
        if (!global.MediaStream) {
            throw new Error('MediaStream not defined in test environment');
        }

        // Dynamic import after globals are set
        const module = await import('@components/video/VideoPane.vue');
        VideoPane = module.default;

        // Create a fresh MediaStream for each test
        mockStream = new MediaStream([new MediaStreamTrack()]);
    });

    it('renders correctly with live stream', () => {
        const wrapper = mount(VideoPane, {
            props: {
                stream: mockStream,
                memberId: 'user-123',
                sourceState: 'live',
            },
            global: {
                plugins: [createPinia()],
            },
        });

        expect(wrapper.find('video').exists()).toBe(true);
        expect(wrapper.find('.bg-black\\/60').exists()).toBe(false);
    });

    it('shows overlay when source is not live', () => {
        const wrapper = mount(VideoPane, {
            props: {
                stream: mockStream,
                memberId: 'user-123',
                sourceState: 'inactive',
            },
            global: {
                plugins: [createPinia()],
            },
        });

        expect(wrapper.find('.bg-black\\/60').exists()).toBe(true);
    });

    it('displays participant name', () => {
        const wrapper = mount(VideoPane, {
            props: {
                stream: mockStream,
                memberId: 'user-123',
                participantName: 'John Doe',
                sourceState: 'live',
            },
            global: {
                plugins: [createPinia()],
            },
        });

        expect(wrapper.text()).toContain('John Doe');
    });
});
