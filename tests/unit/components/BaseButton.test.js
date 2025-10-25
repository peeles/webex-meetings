import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BaseButton from '@components/base/BaseButton.vue';

describe('BaseButton', () => {
  const mountComponent = (props, slots) => {
    return mount(BaseButton, {
      props: props,
      slots: slots,
    });
  };

  it('renders with default props', () => {
    const wrapper = mountComponent(null, { default: 'Click me' });

    expect(wrapper.text()).toBe('Click me');
    expect(wrapper.attributes('type')).toBe('button');
  });

  it('emits click event', async () => {
    const wrapper = mountComponent();

    await wrapper.trigger('click');

    expect(wrapper.emitted('click')).toBeTruthy();
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('applies variant classes', () => {
    const wrapper = mountComponent({ variant: 'danger' });

    expect(wrapper.classes()).toContain('bg-red-600');
  });

  it('disables button when disabled prop is true', () => {
    const wrapper = mountComponent({ disabled: true });

    expect(wrapper.attributes('disabled')).toBeDefined();
  });
});
