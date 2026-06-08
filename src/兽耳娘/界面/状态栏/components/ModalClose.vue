<template>
  <button class="modal-close" type="button" aria-label="关闭" @click="$emit('click')">
    <X :size="24" />
  </button>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next';

defineEmits<{ click: [] }>();
</script>

<style lang="scss" scoped>
.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border: 1px solid #d4c2a4;
  border-radius: 50%;
  background: #fcf8f0;
  color: #a88a6d;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2;
  padding: 0;

  &:hover {
    color: #5c4738;
  }
}
</style>
