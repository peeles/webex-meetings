import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BaseButton from '@components/base/BaseButton.vue';

describe('BaseButton', () => {
    it('renders with default props', () => {
        const wrapper = mount(BaseButton, {
            slots: { default: 'Click me' }
        });

        expect(wrapper.text()).toBe('Click me');
        expect(wrapper.attributes('type')).toBe('button');
    });

    it('emits click event', async () => {
        const wrapper = mount(BaseButton);

        await wrapper.trigger('click');

        expect(wrapper.emitted('click')).toBeTruthy();
        expect(wrapper.emitted('click')).toHaveLength(1);
    });

    it('applies variant classes', () => {
        const wrapper = mount(BaseButton, {
            props: { variant: 'danger' }
        });

        expect(wrapper.classes()).toContain('bg-red-600');
    });

    it('disables button when disabled prop is true', () => {
        const wrapper = mount(BaseButton, {
            props: { disabled: true }
        });

        expect(wrapper.attributes('disabled')).toBeDefined();
    });
});
