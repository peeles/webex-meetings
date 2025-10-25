<template>
  <div class="space-y-2">
    <label class="block text-sm font-medium text-gray-700">
      {{ label }}
    </label>
    <BaseSelect
      v-model="selected"
      @update:model-value="$emit('change', $event)"
    >
      <option
        v-for="device in devices"
        :key="device.deviceId"
        :value="device.deviceId"
      >
        {{ getDeviceLabel(device) }}
      </option>
    </BaseSelect>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { getDeviceLabel } from '@/utils/helpers.js';
import BaseSelect from '@/components/base/BaseSelect.vue';

const props = defineProps({
  label: { type: String, required: true },
  devices: { type: Array, default: () => [] },
  modelValue: { type: String, default: '' },
});

const emit = defineEmits(['change', 'update:modelValue']);

const selected = ref(props.modelValue);

watch(
  () => props.modelValue,
  (val) => {
    selected.value = val;
  }
);
watch(selected, (val) => emit('update:modelValue', val));
</script>
