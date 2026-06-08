<template>
  <div class="stepper">
    <button class="step-btn" type="button" :disabled="disabled || model <= min" @click="decrement">−</button>
    <span class="step-value">{{ model }}</span>
    <button class="step-btn" type="button" :disabled="disabled || model >= max" @click="increment">+</button>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    min?: number;
    max?: number;
    disabled?: boolean;
  }>(),
  {
    min: 0,
    max: 99,
    disabled: false,
  },
);

const model = defineModel<number>({ required: true });

function decrement() {
  model.value = Math.max(props.min, model.value - 1);
}

function increment() {
  model.value = Math.min(props.max, model.value + 1);
}
</script>

<style lang="scss" scoped>
.stepper {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid #e4d4ba;
  border-radius: 8px;
  padding: 2px 4px;
}

.step-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 6px;
  background: #e4d4ba;
  color: #4a3b32;
  font-weight: 900;
  font-size: 0.9rem;
  cursor: pointer;
  line-height: 1;
}

.step-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.step-value {
  min-width: 20px;
  text-align: center;
  font-weight: 900;
  font-size: 0.82rem;
  color: #4a3b32;
}
</style>
