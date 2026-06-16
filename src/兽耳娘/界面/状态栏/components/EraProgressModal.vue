<template>
  <div v-if="modelValue" class="modal-overlay era-progress-overlay" @click.self="close">
      <div class="parchment-panel modal-panel era-progress-modal">
        <ModalClose @click="close" />
        <div class="era-progress-container">
          <div class="era-ear-left" aria-hidden="true" />
          <div class="era-ear-right" aria-hidden="true" />
          <h3 class="era-title">{{ view.title }}</h3>

          <p v-if="view.categories.length === 0" class="era-empty">
            当前时代的演进表尚未配置，请留意后续更新。
          </p>

          <section v-for="category in view.categories" :key="category.title" class="era-category">
            <h4 class="era-category-title">{{ category.title }}</h4>
            <ul class="era-item-list">
              <li
                v-for="item in category.items"
                :key="item.key"
                class="era-item"
                :class="view.progress[item.key] ? 'era-done' : 'era-pending'"
              >
                <span class="era-icon" aria-hidden="true" />
                <span class="era-item-name">{{ item.name }}</span>
              </li>
            </ul>
          </section>

          <p v-if="view.categories.length > 0" class="era-footnote">
            根据营地变量自动判定；向心力/温饱等阈值与演进清单一致。
          </p>
        </div>
      </div>
  </div>
</template>

<script setup lang="ts">
import { getEraProgressView } from '../util/eraProgress';
import { useDataStore } from '../store';
import ModalClose from './ModalClose.vue';

const modelValue = defineModel<boolean>({ required: true });

const store = useDataStore();
const view = computed(() => getEraProgressView(store.data));

function close() {
  modelValue.value = false;
}
</script>

<style lang="scss" scoped>
.era-progress-overlay {
  z-index: 20000;
  pointer-events: auto;
}

.era-progress-modal {
  width: min(100%, 480px);
  max-height: 85vh;
  overflow: auto;
  padding: 20px;
}

.era-progress-container {
  position: relative;
  border: 3px solid #d4a373;
  border-radius: 16px;
  padding: 20px 18px 16px;
  background: #fff9f0;
  color: #5c4033;
}

.era-ear-left,
.era-ear-right {
  position: absolute;
  top: -20px;
  width: 0;
  height: 0;
  border-left: 15px solid transparent;
  border-right: 15px solid transparent;
  border-bottom: 25px solid #d4a373;

  &::after {
    content: '';
    position: absolute;
    top: 8px;
    left: -8px;
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-bottom: 15px solid #fae1dd;
  }
}

.era-ear-left {
  left: 30px;
  transform: rotate(-15deg);
}

.era-ear-right {
  right: 30px;
  transform: rotate(15deg);
}

.era-title {
  margin: 0 0 15px;
  text-align: center;
  font-size: 1.05rem;
  font-weight: 900;
  color: #8b5a2b;
  border-bottom: 2px dashed #d4a373;
  padding-bottom: 10px;
}

.era-empty {
  margin: 0;
  text-align: center;
  font-size: 0.88rem;
  font-weight: 700;
  color: #8c7462;
  line-height: 1.55;
}

.era-category {
  margin-bottom: 14px;

  &:last-of-type {
    margin-bottom: 8px;
  }
}

.era-category-title {
  margin: 0 0 8px;
  font-size: 0.88rem;
  font-weight: 900;
  color: #a0522d;
  display: flex;
  align-items: center;

  &::before {
    content: '🐾';
    margin-right: 6px;
    font-size: 0.82rem;
  }
}

.era-item-list {
  list-style: none;
  margin: 0;
  padding: 0 0 0 6px;
}

.era-item {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
  padding: 7px 10px;
  border-radius: 8px;
  background: #fefcfb;
}

.era-item.era-done {
  color: #4a7c59;
  border-left: 4px solid #8fc0a9;
}

.era-item.era-pending {
  color: #9a9088;
  border-left: 4px solid #e0e0e0;
  background: #f5f5f5;
}

.era-icon {
  width: 18px;
  margin-right: 8px;
  text-align: center;
  flex-shrink: 0;
}

.era-item.era-done .era-icon::before {
  content: '✅';
}

.era-item.era-pending .era-icon::before {
  content: '❌';
  filter: grayscale(100%) opacity(0.5);
}

.era-item-name {
  font-size: 0.84rem;
  font-weight: 700;
}

.era-footnote {
  margin: 10px 0 0;
  font-size: 0.68rem;
  font-weight: 700;
  color: #a88a6d;
  text-align: center;
  line-height: 1.45;
}
</style>
