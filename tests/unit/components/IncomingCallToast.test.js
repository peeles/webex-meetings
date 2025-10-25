import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import IncomingCallToast from '@/components/IncomingCallToast.vue';

describe('IncomingCallToast', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    const mountComponent = (props, slots) => {
        return mount(IncomingCallToast, {
            props: props,
            slots: slots,
        })
    };

    it('renders when visible', () => {
        const wrapper = mountComponent({
            isVisible: true,
            callerName: 'John Doe',
            meetingDetails: 'john@example.com',
            meetingId: 'meeting-123'
        });

        expect(wrapper.find('.fixed.bottom-6.right-6').exists()).toBe(true);
        expect(wrapper.text()).toContain('Incoming Call');
        expect(wrapper.text()).toContain('John Doe');
        expect(wrapper.text()).toContain('john@example.com');
    });

    it('does not render when not visible', () => {
        const wrapper = mountComponent({
            isVisible: false,
            callerName: 'John Doe',
            meetingDetails: 'john@example.com',
            meetingId: 'meeting-123'
        });

        expect(wrapper.find('.fixed.bottom-6.right-6').exists()).toBe(false);
    });

    it('emits answer event when answer button clicked', async () => {
        const wrapper = mountComponent({
            isVisible: true,
            callerName: 'John Doe',
            meetingDetails: 'john@example.com',
            meetingId: 'meeting-123'
        });

        const answerButton = wrapper.findAll('button').find(btn =>
            btn.text().includes('Answer')
        );

        await answerButton.trigger('click');

        expect(wrapper.emitted('answer')).toBeTruthy();
        expect(wrapper.emitted('answer')[0]).toEqual(['meeting-123']);
    });

    it('emits decline event when decline button clicked', async () => {
        const wrapper = mountComponent({
            isVisible: true,
            callerName: 'John Doe',
            meetingDetails: 'john@example.com',
            meetingId: 'meeting-123'
        });

        const declineButton = wrapper.findAll('button').find(btn =>
            btn.text().includes('Decline')
        );

        await declineButton.trigger('click');

        expect(wrapper.emitted('decline')).toBeTruthy();
        expect(wrapper.emitted('decline')[0]).toEqual(['meeting-123']);
    });

    it('shows countdown timer', () => {
        const wrapper = mountComponent({
            isVisible: true,
            callerName: 'John Doe',
            meetingDetails: 'john@example.com',
            meetingId: 'meeting-123',
            autoDeclineTime: 30,
            showTimer: true
        });

        expect(wrapper.text()).toContain('Auto-decline in');
        expect(wrapper.text()).toContain('30s');
    });

    it('hides timer when showTimer is false', () => {
        const wrapper = mountComponent({
            isVisible: true,
            callerName: 'John Doe',
            meetingDetails: 'john@example.com',
            meetingId: 'meeting-123',
            showTimer: false
        });

        expect(wrapper.text()).not.toContain('Auto-decline in');
    });

    it('counts down and emits timeout after autoDeclineTime', async () => {
        const wrapper = mountComponent({
            isVisible: true,
            callerName: 'John Doe',
            meetingDetails: 'john@example.com',
            meetingId: 'meeting-123',
            autoDeclineTime: 5,
        });

        // Initially shows 5 seconds
        expect(wrapper.text()).toContain('5s');

        // Advance 1 second
        await vi.advanceTimersByTimeAsync(1000);
        await wrapper.vm.$nextTick();
        expect(wrapper.text()).toContain('4s');

        // Advance 4 more seconds (total 5)
        await vi.advanceTimersByTimeAsync(4000);
        await wrapper.vm.$nextTick();

        // Should emit timeout and decline
        const timeoutEvents = wrapper.emitted('timeout') || [];
        const declineEvents = wrapper.emitted('decline') || [];

        expect(timeoutEvents).toHaveLength(1);
        expect(timeoutEvents[0]).toEqual(['meeting-123']);

        expect(declineEvents).toHaveLength(1);
        expect(declineEvents[0]).toEqual(['meeting-123']);
    });

    it('displays unknown caller when name is not provided', () => {
        const wrapper = mountComponent({
            isVisible: true,
            callerName: '',
            meetingDetails: '',
            meetingId: 'meeting-123',
        });

        expect(wrapper.text()).toContain('Unknown');
    });

    it('handles long caller names gracefully', () => {
        const longName = 'Very Long Name That Should Be Truncated Properly';
        const wrapper = mountComponent({
            isVisible: true,
            callerName: longName,
            meetingDetails: 'test@example.com',
            meetingId: 'meeting-123'
        });

        expect(wrapper.text()).toContain(longName);
        const nameElement = wrapper.find('.truncate');
        expect(nameElement.exists()).toBe(true);
    });

    it('stops timer when component unmounts', async () => {
        const wrapper = mountComponent({
            isVisible: true,
            callerName: 'John Doe',
            meetingDetails: 'john@example.com',
            meetingId: 'meeting-123',
            autoDeclineTime: 30,
        });

        // Timer should be running
        await vi.advanceTimersByTimeAsync(1000);
        await wrapper.vm.$nextTick();

        // Unmount component
        wrapper.unmount();

        // Advance time - should not emit since component is unmounted
        await vi.advanceTimersByTimeAsync(30000);

        // No additional events after unmount
        const emitCount = wrapper.emitted('timeout')?.length || 0;
        expect(emitCount).toBe(0);
    });

    it('restarts timer when becoming visible', async () => {
        const wrapper = mountComponent({
            isVisible: false,
            callerName: 'John Doe',
            meetingDetails: 'john@example.com',
            meetingId: 'meeting-123',
            autoDeclineTime: 5,
        });

        // Make visible
        await wrapper.setProps({ isVisible: true });
        await wrapper.vm.$nextTick();

        // Should show full time
        expect(wrapper.text()).toContain('5s');

        // Advance time
        await vi.advanceTimersByTimeAsync(2000);
        await wrapper.vm.$nextTick();
        expect(wrapper.text()).toContain('3s');

        // Hide
        await wrapper.setProps({ isVisible: false });
        await wrapper.vm.$nextTick();

        // Show again - should restart
        await wrapper.setProps({ isVisible: true });
        await wrapper.vm.$nextTick();
        expect(wrapper.text()).toContain('5s');
    });

    it('renders with correct CSS classes for styling', () => {
        const wrapper = mountComponent({
            isVisible: true,
            callerName: 'John Doe',
            meetingDetails: 'john@example.com',
            meetingId: 'meeting-123',
        });

        const container = wrapper.find('.fixed.bottom-6.right-6');
        expect(container.classes()).toContain('z-50');
        expect(container.classes()).toContain('bg-white');
        expect(container.classes()).toContain('rounded-lg');
        expect(container.classes()).toContain('shadow-2xl');
    });

    it('answer button has correct styling', () => {
        const wrapper = mountComponent({
            isVisible: true,
            callerName: 'John Doe',
            meetingDetails: 'john@example.com',
            meetingId: 'meeting-123'
        });

        const answerButton = wrapper.findAll('button').find(btn =>
            btn.text().includes('Answer')
        );

        expect(answerButton.classes()).toContain('bg-green-500');
        expect(answerButton.classes()).toContain('hover:bg-green-600');
    });

    it('decline button has correct styling', () => {
        const wrapper = mountComponent({
            isVisible: true,
            callerName: 'John Doe',
            meetingDetails: 'john@example.com',
            meetingId: 'meeting-123'
        });

        const declineButton = wrapper.findAll('button').find(btn =>
            btn.text().includes('Decline')
        );

        expect(declineButton.classes()).toContain('bg-red-500');
        expect(declineButton.classes()).toContain('hover:bg-red-600');
    });
});
