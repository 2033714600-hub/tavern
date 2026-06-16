<template>
  <div v-if="state.open" class="modal-overlay confirm-overlay" @click.self="resolveConfirm(false)">
    <div class="parchment-panel confirm-panel" role="alertdialog">
      <h3 class="confirm-title">{{ state.title }}</h3>
      <p class="confirm-message">{{ state.message }}</p>
      <div class="confirm-actions">
        <button class="tribal-button-alt" type="button" @click="resolveConfirm(false)">
          {{ state.cancelText }}
        </button>
        <button
          class="confirm-ok"
          :class="{ danger: state.danger }"
          type="button"
          @click="resolveConfirm(true)"
        >
          {{ state.confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useConfirm } from '../composables/useConfirm';

const { state, resolveConfirm } = useConfirm();
</script>

<style lang="scss" scoped>
.confirm-overlay {
  z-index: 21000;
  pointer-events: auto;
}

.confirm-panel {
  width: min(100%, 360px);
  padding: 24px;
  text-align: center;
}

.confirm-title {
  margin: 0 0 12px;
  font-size: 1.15rem;
  font-weight: 900;
  color: #4a3b32;
}

.confirm-message {
  margin: 0 0 20px;
  font-size: 0.92rem;
  font-weight: 700;
  color: #6b4c3a;
  line-height: 1.55;
  white-space: pre-wrap;
}

.confirm-actions {
  display: flex;
  gap: 10px;
}

.confirm-actions .tribal-button-alt,
.confirm-ok {
  flex: 1;
  min-width: 0;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 0.88rem;
  font-weight: 900;
  font-family: inherit;
  cursor: pointer;
}

.confirm-ok {
  border: 2px solid #7ca982;
  background: #7ca982;
  color: #fff;

  &.danger {
    border-color: #d9776c;
    background: #d9776c;
  }
}
</style>
