<template>
  <div class="panel-page">
    <PanelTitle>
      <template #icon>
        <Flame class="title-flame" :size="36" :stroke-width="2.25" />
      </template>
      部落篝火核心
    </PanelTitle>

    <div class="info-grid">
      <div class="parchment-panel info-card">
        <div class="info-row">
          <div class="icon-box">
            <Trees :size="28" :stroke-width="2.25" />
          </div>
          <div>
            <p class="stat-label">当前驻扎营地</p>
            <p class="info-value">{{ store.data.世界.当前位置 }}</p>
          </div>
        </div>
      </div>
      <div class="parchment-panel info-card">
        <div class="info-row">
          <div class="icon-box warm">
            <Sun :size="28" :stroke-width="2.25" />
          </div>
          <div>
            <p class="stat-label">当前天象时辰</p>
            <p class="info-value">{{ store.data.世界.季节 }} · {{ store.data.世界.时间 }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="parchment-panel fuel-panel">
      <div class="fuel-head">
        <div class="fuel-title">
          <Flame class="fuel-flame" :size="28" :stroke-width="2.25" />
          <span>篝火燃料储备</span>
        </div>
        <span class="highlight-amber">{{ fuel.当前 }} / {{ fuel.上限 }} 捆木材</span>
      </div>
      <ProgressBar :value="fuel_percent" size="tall" tone-override="orange" />
      <p class="fuel-hint">💡 {{ fuel_hint }}</p>
    </div>

    <div class="parchment-panel affairs-panel">
      <div class="affairs-title">
        <Crown class="affairs-crown" :size="32" :stroke-width="2.25" />
        <h3>部族事务</h3>
      </div>

      <div v-if="_.isEmpty(store.data.部族事务)" class="empty-hint">暂无进行中的部族事务</div>
      <template v-else>
        <div v-if="!_.isEmpty(primary_affairs)" class="affair-group">
          <h4 class="affair-level">
            <span class="level-dot primary" />主要事务
          </h4>
          <article v-for="(affair, name) in primary_affairs" :key="name" class="affair-card primary">
            <span class="affair-title">{{ name }}</span>
            <span class="affair-desc">{{ affair.说明 }}</span>
          </article>
        </div>
        <div v-if="!_.isEmpty(secondary_affairs)" class="affair-group">
          <h4 class="affair-level">
            <span class="level-dot secondary" />次要事务
          </h4>
          <article v-for="(affair, name) in secondary_affairs" :key="name" class="affair-card secondary">
            <span class="affair-title">{{ name }}</span>
            <span class="affair-desc">{{ affair.说明 }}</span>
          </article>
        </div>
      </template>

      <button class="tribal-button meeting-btn" type="button" @click="openMeeting">召开部族会议</button>
    </div>

    <!-- MVU 扩展区块：保持不动 -->
    <div class="parchment-panel mvu-panel">
      <h3 class="mvu-title">🌍 坠星大陆 · 营地概况</h3>
      <div class="info-grid compact">
        <div class="mvu-cell">
          <div class="stat-label">当前驻扎</div>
          <div class="stat-value">{{ store.data.世界.当前位置 }}</div>
        </div>
        <div class="mvu-cell">
          <div class="stat-label">殖民时代</div>
          <div class="stat-value">时代{{ store.data.世界.当前时代 }} · {{ current_era.名称 }}</div>
        </div>
      </div>
    </div>

    <div class="parchment-panel mvu-panel">
      <h3 class="mvu-title">🎒 随身装备</h3>
      <ul v-if="!_.isEmpty(store.data.主角.随身装备)" class="item-list">
        <li v-for="(equip, name) in store.data.主角.随身装备" :key="name">
          {{ name }}:
          <span class="highlight-blue">{{ equip.状态 }}</span>
          (弹/电: {{ equip.电量或弹药 }})
        </li>
      </ul>
      <p v-else class="empty-hint">无装备记录</p>
    </div>

    <div v-if="show_meeting" class="modal-overlay" @click.self="show_meeting = false">
      <div class="parchment-panel modal-panel">
        <button class="modal-close" type="button" @click="show_meeting = false">×</button>
        <div class="modal-head">
          <Crown class="affairs-crown" :size="32" :stroke-width="2.25" />
          <h3>召开部族会议</h3>
        </div>
        <div class="form-field">
          <label class="form-label">会议名称</label>
          <input v-model="meeting_name" class="form-input" placeholder="输入部族会议主题" />
        </div>
        <div class="form-field">
          <label class="form-label">会议内容 / 决议说明</label>
          <textarea
            v-model="meeting_content"
            class="form-textarea"
            rows="3"
            placeholder="阐述会议决定的具体事务细节..."
          />
        </div>
        <div class="form-field">
          <label class="form-label">事务级别</label>
          <div class="radio-row">
            <label class="radio-item">
              <input v-model="meeting_level" type="radio" value="主要" />
              <span class="radio-dot" :class="{ on: meeting_level === '主要', primary: true }" />
              主要事务
            </label>
            <label class="radio-item">
              <input v-model="meeting_level" type="radio" value="次要" />
              <span class="radio-dot" :class="{ on: meeting_level === '次要', secondary: true }" />
              次要事务
            </label>
          </div>
        </div>
        <button class="tribal-button w-full" type="button" @click="conveneMeeting">正式召开</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import _ from 'lodash';
import { Crown, Flame, Sun, Trees } from 'lucide-vue-next';
import { ERA_INFO } from '../../../constants/era';
import { sendUserAction } from '../composables/useGameActions';
import { useDataStore } from '../store';
import PanelTitle from './PanelTitle.vue';
import ProgressBar from './ProgressBar.vue';

const store = useDataStore();

const show_meeting = ref(false);
const meeting_name = ref('');
const meeting_content = ref('');
const meeting_level = ref<'主要' | '次要'>('主要');

const current_era = computed(() => ERA_INFO[store.data.世界.当前时代]);

const fuel = computed(() => {
  const wood = store.data.营地.仓库储备['坚固木材'];
  if (wood) {
    return { 当前: wood.当前, 上限: wood.上限 };
  }
  return store.data.营地.篝火燃料;
});

const fuel_percent = computed(() =>
  fuel.value.上限 > 0 ? (fuel.value.当前 / fuel.value.上限) * 100 : 0,
);

const fuel_hint = computed(() => {
  if (fuel_percent.value >= 70) return '火焰还在旺盛燃烧，族人们在黑夜中感到安心。';
  if (fuel_percent.value >= 30) return '篝火尚可维持，但需尽快补充燃料。';
  return '篝火微弱，族人们开始感到不安……';
});

const primary_affairs = computed(() =>
  _.pickBy(store.data.部族事务, affair => affair.级别 === '主要'),
);

const secondary_affairs = computed(() =>
  _.pickBy(store.data.部族事务, affair => affair.级别 === '次要'),
);

function openMeeting() {
  show_meeting.value = true;
}

async function conveneMeeting() {
  const name = meeting_name.value.trim() || '部族会议';
  const content = meeting_content.value.trim();
  const text = content
    ? `[召开部族会议·${meeting_level.value}事务] ${name}：${content}`
    : `[召开部族会议·${meeting_level.value}事务] ${name}`;
  await sendUserAction(text);
  meeting_name.value = '';
  meeting_content.value = '';
  meeting_level.value = '主要';
  show_meeting.value = false;
}
</script>

<style lang="scss" scoped>
.panel-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.title-flame {
  color: #e07a5f;
  flex-shrink: 0;
}

.fuel-flame {
  color: #d9776c;
}

.affairs-crown {
  color: #e6b981;
  flex-shrink: 0;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.info-grid.compact {
  gap: 12px;
}

.info-card {
  padding: 20px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.info-value {
  font-size: 1.15rem;
  font-weight: 800;
  color: #4a3b32;
  margin: 4px 0 0;
}

.fuel-panel {
  padding: 28px;
}

.fuel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.fuel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.15rem;
  font-weight: 900;
  color: #5c4738;
}

.fuel-hint {
  margin: 14px 0 0;
  font-size: 0.88rem;
  font-weight: 700;
  color: #8c7462;
}

.affairs-panel {
  padding: 28px;
}

.affairs-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  font-size: 1.4rem;

  h3 {
    margin: 0;
    font-size: 1.4rem;
    font-weight: 900;
    color: #5c4738;
  }
}

.affair-group {
  margin-bottom: 20px;
}

.affair-level {
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  font-weight: 900;
  color: #8c7462;
  margin: 0 0 10px;
}

.meeting-btn {
  width: 100%;
  margin-top: 24px;
  padding: 14px;
  font-size: 1.05rem;
}

.mvu-panel {
  padding: 20px;
}

.mvu-title {
  font-size: 0.95rem;
  font-weight: 900;
  color: #5c4738;
  margin: 0 0 12px;
}

.mvu-cell {
  background: rgba(255, 255, 255, 0.45);
  border: 1px solid #e4d4ba;
  border-radius: 12px;
  padding: 12px;
}

.empty-hint {
  text-align: center;
  color: #8c7462;
  font-weight: 700;
  font-size: 0.88rem;
}

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
  font-size: 1.2rem;
  font-weight: 900;
  cursor: pointer;
  z-index: 2;
}

.modal-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  font-size: 1.4rem;

  h3 {
    margin: 0;
    font-size: 1.4rem;
    font-weight: 900;
    color: #5c4738;
  }
}

.radio-row {
  display: flex;
  gap: 20px;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  color: #5c4738;
  cursor: pointer;

  input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }
}

.radio-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #d4c2a4;
  display: flex;
  align-items: center;
  justify-content: center;

  &.on.primary::after {
    content: '';
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #e07a5f;
  }

  &.on.secondary::after {
    content: '';
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #7ca982;
  }
}

.w-full {
  width: 100%;
  padding: 14px;
  font-size: 1.05rem;
  margin-top: 8px;
}

@media (max-width: 560px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
