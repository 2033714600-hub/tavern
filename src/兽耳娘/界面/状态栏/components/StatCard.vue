<template>
  <div class="parchment-panel stat-card">
    <div class="glow" :class="tone" />
    <div class="icon-wrap">
      <slot />
    </div>
    <div class="stat-value">{{ value }}</div>
    <div class="stat-label">{{ label }}</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  value: string;
  tone: 'food' | 'shelter' | 'cohesion' | 'comfort' | 'people';
}>();
</script>

<style lang="scss" scoped>
.stat-card {
  padding: 16px;
  text-align: center;
  overflow: hidden;
  position: relative;
}

.glow {
  position: absolute;
  top: -16px;
  right: -16px;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  opacity: 0.4;
  filter: blur(12px);
  transition: transform 0.3s;
}

.stat-card:hover .glow {
  transform: scale(1.5);
}

.glow.food {
  background: #f4d8d3;
}

.glow.shelter {
  background: #cde4d1;
}

.glow.cohesion {
  background: #f4d8d3;
}

.glow.comfort,
.glow.people {
  background: #f0c999;
}

.icon-wrap {
  margin-bottom: 10px;
  padding: 12px;
  background: #fdfbf7;
  border-radius: 12px;
  border: 1px solid #e4d4ba;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 900;
  color: #4a3b32;
  position: relative;
  z-index: 1;
}

.stat-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: #8c7462;
  letter-spacing: 0.04em;
  margin-top: 4px;
  position: relative;
  z-index: 1;
}
</style>
