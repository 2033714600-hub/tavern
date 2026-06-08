<template>
  <div class="progress-bar-bg" :class="size">
    <div class="progress-bar-fill" :class="tone" :style="{ width: `${clamped}%` }" />
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    value: number;
    max?: number;
    min?: number;
    size?: 'tall' | 'short';
    toneOverride?: 'green' | 'orange' | 'red' | 'amber';
  }>(),
  {
    max: 100,
    min: 0,
    size: 'tall',
  },
);

const clamped = computed(() => _.clamp(props.value, props.min, props.max));

const tone = computed(() => {
  if (props.toneOverride) {
    return props.toneOverride;
  }
  const percent = ((clamped.value - props.min) / (props.max - props.min)) * 100;
  if (percent < 30) return 'red';
  if (percent < 60) return 'amber';
  return 'green';
});
</script>
