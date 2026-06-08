<template>
  <button
    :class="[toneClass, { 'w-full': block }]"
    :disabled="disabled"
    :type="htmlType"
    @click="$emit('click')"
  >
    <span v-if="icon" class="btn-icon">{{ icon }}</span>
    <span><slot>{{ label }}</slot></span>
  </button>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    label?: string;
    icon?: string;
    tone?: 'green' | 'tan' | 'orange' | 'red' | 'belly';
    disabled?: boolean;
    htmlType?: 'button' | 'submit';
    block?: boolean;
  }>(),
  {
    tone: 'green',
    disabled: false,
    htmlType: 'button',
    block: true,
  },
);

defineEmits<{ click: [] }>();

const toneClass = computed(() => {
  switch (props.tone) {
    case 'tan':
      return 'tribal-button-alt';
    case 'red':
      return 'tribal-button-danger';
    case 'belly':
      return 'tribal-button-belly';
    case 'orange':
      return 'tribal-button-alt';
    default:
      return 'tribal-button';
  }
});
</script>

<style lang="scss" scoped>
button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  font-size: 0.95rem;
}

.w-full {
  width: 100%;
}

.btn-icon {
  font-size: 1rem;
}
</style>
