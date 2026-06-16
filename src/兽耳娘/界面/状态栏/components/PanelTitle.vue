<template>
  <div class="parchment-panel panel-title-box">
    <div class="panel-title-row">
      <h2 class="panel-title">
        <slot name="icon" />
        <slot />
      </h2>
      <div v-if="$slots.actions" class="panel-title-actions">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.panel-title-box {
  padding: 18px 22px;
}

.panel-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.panel-title-actions {
  flex-shrink: 0;
  position: relative;
  z-index: 2;
}

.panel-title {
  font-size: 1.75rem;
  font-weight: 900;
  color: #5c4738;
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  filter: drop-shadow(0 1px 1px rgba(92, 71, 56, 0.08));
}
</style>
