<template>
  <section class="parchment-panel section">
    <h3 class="section-title">🏛️ 殖民时代 {{ store.data.世界.当前时代 }}</h3>
    <div class="era-banner" :class="`era-${store.data.世界.当前时代}`">
      <div class="era-name">{{ current_era.名称 }}</div>
      <div class="era-tag">时代 {{ store.data.世界.当前时代 }} / 共三阶段</div>
    </div>
    <div class="era-detail">
      <div class="detail-block">
        <span class="stat-label">时代目标</span>
        <p>{{ current_era.目标 }}</p>
      </div>
      <div class="detail-block">
        <span class="stat-label">主指标</span>
        <p>{{ current_era.主指标 }}</p>
      </div>
      <div class="detail-block">
        <span class="stat-label">通关条件</span>
        <p>{{ current_era.通关条件 }}</p>
      </div>
    </div>
    <div class="era-steps">
      <div
        v-for="era in era_list"
        :key="era.id"
        class="era-step"
        :class="{
          active: era.id === store.data.世界.当前时代,
          done: era_order.indexOf(era.id) < era_order.indexOf(store.data.世界.当前时代),
        }"
      >
        <span class="step-id">{{ era.id }}</span>
        <span class="step-name">{{ era.名称 }}</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ERA_INFO } from '../../../constants/era';
import { useDataStore } from '../store';

const store = useDataStore();

const era_order = ['一', '二', '三'] as const;

const current_era = computed(() => ERA_INFO[store.data.世界.当前时代]);

const era_list = computed(() =>
  (['一', '二', '三'] as const).map(id => ({
    id,
    名称: ERA_INFO[id].名称,
  })),
);
</script>

<style lang="scss" scoped>
.section {
  padding: 10px;
}

.section-title {
  font-size: 0.88rem;
  font-weight: 900;
  color: #5c4738;
  margin: 0 0 8px;
}

.era-banner {
  border-radius: 10px;
  padding: 10px;
  margin-bottom: 10px;
  border: 2px solid;
}

.era-banner.era-一 {
  background: rgba(224, 159, 94, 0.15);
  border-color: #e09f5e;
}

.era-banner.era-二 {
  background: rgba(124, 169, 130, 0.15);
  border-color: #7ca982;
}

.era-banner.era-三 {
  background: rgba(90, 122, 168, 0.15);
  border-color: #5a7aa8;
}

.era-name {
  font-size: 1rem;
  font-weight: 900;
  color: #4a3b32;
}

.era-tag {
  font-size: 0.72rem;
  color: #8c7462;
  font-weight: 700;
  margin-top: 4px;
}

.era-detail {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}

.detail-block p {
  margin: 4px 0 0;
  font-size: 0.78rem;
  color: #5c4738;
  font-weight: 600;
  line-height: 1.45;
}

.era-steps {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.era-step {
  text-align: center;
  padding: 8px 4px;
  border: 2px solid #e4d4ba;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.35);
  opacity: 0.55;
}

.era-step.active {
  opacity: 1;
  border-color: #7ca982;
  background: rgba(124, 169, 130, 0.12);
}

.era-step.done {
  opacity: 0.8;
  border-color: #c8955c;
}

.step-id {
  display: block;
  font-weight: 900;
  font-size: 0.9rem;
  color: #4a3b32;
}

.step-name {
  display: block;
  font-size: 0.65rem;
  color: #8c7462;
  font-weight: 700;
  margin-top: 2px;
}
</style>
