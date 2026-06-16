<template>
  <div class="floor-zero-hint parchment-panel">
    <PawPrint class="hint-icon" :size="28" :stroke-width="2" />
    <p class="hint-title">正在生成开局……</p>
    <p class="hint-sub">部落档案与营地变量正在写入，请稍候</p>
    <p class="hint-tip">尽量 roll 到喜欢的开局，开局很重要</p>
  </div>
</template>

<script setup lang="ts">
import { PawPrint } from 'lucide-vue-next';
</script>

<style lang="scss" scoped>
.floor-zero-hint {
  max-width: 520px;
  margin: 12px auto;
  padding: 24px 20px;
  text-align: center;
  color: #6b4c3a;
}

.hint-icon {
  color: #8c7462;
  margin-bottom: 10px;
}

.hint-title {
  margin: 0 0 8px;
  font-size: 1rem;
  font-weight: 900;
  letter-spacing: 0.04em;
}

.hint-sub {
  margin: 0 0 10px;
  font-size: 0.82rem;
  color: #6b8f71;
  font-weight: 700;
}

.hint-tip {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.6;
  font-weight: 800;
  color: #c45c4a;
}
</style>
