<template>
  <div v-if="modelValue" class="modal-overlay" @click.self="close">
    <div class="modal-panel parchment-panel" role="dialog">
      <header class="modal-header">
        <div class="modal-title">
          <span v-if="icon" class="modal-icon">{{ icon }}</span>
          <span>{{ title }}</span>
        </div>
        <button class="modal-close" type="button" aria-label="关闭" @click="close">×</button>
      </header>
      <div class="modal-body">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  icon?: string;
}>();

const modelValue = defineModel<boolean>({ required: true });

function close() {
  modelValue.value = false;
}
</script>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background: rgba(74, 59, 50, 0.35);
  backdrop-filter: blur(3px);
}

.modal-panel {
  width: 100%;
  max-width: 420px;
  max-height: 85%;
  overflow: auto;
  padding: 12px;
  animation: modalIn 0.25s ease;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.modal-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 900;
  font-size: 0.95rem;
  color: #4a3b32;
}

.modal-icon {
  font-size: 1.1rem;
}

.modal-close {
  width: 28px;
  height: 28px;
  border: 2px solid #dcd1be;
  border-radius: 8px;
  background: #fffdf8;
  color: #8c7462;
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
  font-weight: 900;
}

.modal-close:hover {
  background: #f4ecdb;
}

.modal-body {
  position: relative;
  z-index: 1;
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(6px);
  }

  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
