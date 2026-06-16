<template>
  <div
    class="catalog-card"
    :class="{
      selected,
      locked,
      ready: ready && !selected,
    }"
    role="button"
    tabindex="0"
    @click="emit('click')"
    @keydown.enter="emit('click')"
  >
    <div class="catalog-thumb">素材</div>
    <div class="catalog-meta">
      <p class="catalog-name">名称：{{ name }}</p>
      <p v-if="description">描述：{{ description }}</p>
      <p v-if="effect">效果：{{ effect }}</p>
      <p>材料：{{ materials }}</p>
      <p v-if="hours != null">工时：{{ hours }} 小时</p>
      <p v-if="ready && readyText" class="catalog-ready">{{ readyText }}</p>
      <p v-else-if="locked && lockText" class="catalog-lock">🔒 {{ lockText }}</p>
      <p v-else-if="shortageText" class="catalog-lock shortage">{{ shortageText }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    name: string;
    description?: string;
    effect?: string;
    materials: string;
    hours?: number;
    selected?: boolean;
    locked?: boolean;
    ready?: boolean;
    lockText?: string;
    shortageText?: string;
    readyText?: string;
  }>(),
  { readyText: '可立即添加' },
);

const emit = defineEmits<{ click: [] }>();
</script>

<style lang="scss" scoped>
.catalog-card {
  display: flex;
  gap: 8px;
  padding: 10px;
  border: 2px solid #e4d4ba;
  border-radius: 12px;
  background: #fffdf8;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  transition: border-color 0.15s, background 0.15s;

  &:hover:not(.locked) {
    border-color: #c8955c;
    background: #fcf8f0;
  }

  &.selected {
    border-color: #4a7c59;
    background: #f0f7f2;
  }

  &.ready {
    border-color: #4a7c59;
    background: #f0f7f2;
  }

  &.locked {
    opacity: 0.5;
    cursor: not-allowed;
    background: #f5f0e8;
  }

  p {
    margin: 0 0 4px;
    font-size: 0.72rem;
    font-weight: 700;
    color: #6b4c3a;
    line-height: 1.35;
  }
}

.catalog-thumb {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  border: 2px solid #e6b981;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  font-weight: 900;
  color: #a8543f;
  background: #fdf6e8;
}

.catalog-name {
  font-weight: 900 !important;
}

.catalog-ready {
  color: #4a7c59 !important;
  font-weight: 900 !important;
}

.catalog-lock {
  color: #8c7462 !important;
  font-weight: 900 !important;

  &.shortage {
    color: #d9776c !important;
  }
}
</style>
