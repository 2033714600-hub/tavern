<template>
  <div class="parchment-panel panel-title-box">
    <h2 class="panel-title">
      <slot name="icon" />
      <slot />
    </h2>
  </div>
</template>

<style lang="scss" scoped>
.panel-title-box {
  padding: 18px 22px;
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
