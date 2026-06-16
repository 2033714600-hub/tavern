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
            <p class="info-value calendar-line">{{ beast_calendar }}</p>
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
        <span class="highlight-amber fuel-time">{{ fuel_duration_text }}</span>
      </div>
      <ProgressBar :value="fuel_percent" size="tall" tone-override="orange" />
      <div class="fuel-foot">
        <p class="fuel-opinion">💬 {{ tribe_fire_opinion }}</p>
        <button class="tribal-button-alt add-fuel-btn" type="button" @click="show_add_fuel = true">
          添加燃料
        </button>
      </div>
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
            <span v-if="affair.剩余时间" class="affair-deadline">剩余：{{ affair.剩余时间 }}</span>
            <span v-if="affair.逃离原因" class="affair-reason">原因：{{ affair.逃离原因 }}</span>
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

    <div class="parchment-panel affairs-panel general-affairs-panel">
      <div class="affairs-title">
        <ClipboardList class="affairs-clipboard" :size="32" :stroke-width="2.25" />
        <h3>综合事物</h3>
      </div>
      <div v-if="_.isEmpty(store.data.综合事物)" class="empty-hint">暂无未分类事项</div>
      <article v-for="(item, name) in store.data.综合事物" :key="name" class="affair-card general">
        <div class="general-affair-head">
          <span class="affair-title">{{ name }}</span>
          <span class="general-status" :class="statusClass(item.状态)">{{ item.状态 }}</span>
        </div>
        <span class="affair-desc">{{ item.说明 }}</span>
        <div v-if="item.具名参与.length" class="general-members">
          <span v-for="m in item.具名参与" :key="m" class="member-chip">{{ m }}</span>
        </div>
      </article>
    </div>

    <!-- MVU 扩展区块：保持不动 -->
    <div class="parchment-panel mvu-panel">
      <h3 class="mvu-title">🌍 坠星大陆 · 营地概况</h3>
      <div class="info-grid compact three-cols">
        <div class="mvu-cell">
          <div class="stat-label">当前驻扎</div>
          <div class="stat-value">{{ store.data.世界.当前位置 }}</div>
        </div>
        <div class="mvu-cell highlight-cell">
          <div class="stat-label">生存天数</div>
          <div class="stat-value">第 {{ store.data.世界.生存天数 }} 天</div>
        </div>
        <div class="mvu-cell">
          <div class="stat-label">时代</div>
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

    <div v-if="show_add_fuel" class="modal-overlay" @click.self="show_add_fuel = false">
      <div class="parchment-panel modal-panel">
        <button class="modal-close" type="button" @click="show_add_fuel = false">×</button>
        <div class="modal-head">
          <Flame class="fuel-flame" :size="32" :stroke-width="2.25" />
          <h3>添加篝火燃料</h3>
        </div>
        <div class="form-field">
          <label class="form-label">燃料材料</label>
          <select v-model="fuel_material_id" class="form-select">
            <option v-for="m in FUEL_MATERIALS" :key="m.id" :value="m.id">{{ m.label }}</option>
          </select>
        </div>
        <div class="form-field">
          <label class="form-label">添加数量</label>
          <Stepper v-model="fuel_amount" :min="1" :max="max_fuel_amount" />
          <p class="fuel-stock-hint">仓库可用：{{ fuel_stock_available }} · 预计续火 {{ fuel_preview_text }}</p>
        </div>
        <button
          class="tribal-button w-full"
          type="button"
          :disabled="fuel_amount <= 0 || fuel_amount > fuel_stock_available"
          @click="confirmAddFuel"
        >
          投入火塘
        </button>
      </div>
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
import { ClipboardList, Crown, Flame, Sun, Trees } from 'lucide-vue-next';
import { ERA_INFO } from '../../../constants/era';
import { runUserAction } from '../composables/useGameActions';
import { useDataStore } from '../store';
import { format_beast_calendar } from '../util/beastCalendar';
import {
  dailyFuelBurn,
  formatFuelDuration,
  FUEL_MATERIALS,
  fuelHoursRemaining,
  previewFuelAddition,
  isFireLit,
  resolveFirepitKey,
  syncFirepitWithFuel,
  tribeFireOpinion,
} from '../util/campfire';
import PanelTitle from './PanelTitle.vue';
import ProgressBar from './ProgressBar.vue';
import Stepper from './Stepper.vue';

const store = useDataStore();
const beast_calendar = computed(() => format_beast_calendar(store.data.世界.星历));

const show_meeting = ref(false);
const show_add_fuel = ref(false);
const fuel_material_id = ref(FUEL_MATERIALS[0].id);
const fuel_amount = ref(1);
const meeting_name = ref('');
const meeting_content = ref('');
const meeting_level = ref<'主要' | '次要'>('主要');

const current_era = computed(() => ERA_INFO[store.data.世界.当前时代]);

const fuel = computed(() => store.data.营地.篝火燃料);

const daily_burn = computed(() => dailyFuelBurn(store.data.营地.当前建筑));

const fuel_hours = computed(() => fuelHoursRemaining(fuel.value.当前, daily_burn.value));

const fuel_duration_text = computed(() => formatFuelDuration(fuel_hours.value));

const fuel_percent = computed(() =>
  fuel.value.上限 > 0 ? (fuel.value.当前 / fuel.value.上限) * 100 : 0,
);

const fire_is_lit = computed(() => {
  const key = resolveFirepitKey(store.data.营地.当前建筑);
  const pile = key ? store.data.营地.当前建筑[key] : undefined;
  return isFireLit(fuel.value.当前, pile?.状态);
});

const tribe_fire_opinion = computed(() =>
  tribeFireOpinion(
    fuel_percent.value,
    store.data.营地.向心力,
    store.data.营地.生存指标.温饱度,
    fire_is_lit.value,
  ),
);

const selected_fuel_material = computed(
  () => FUEL_MATERIALS.find(m => m.id === fuel_material_id.value) ?? FUEL_MATERIALS[0],
);

const fuel_stock_available = computed(() => {
  const id = fuel_material_id.value;
  const reserve = store.data.营地.仓库储备[id];
  if (reserve) return reserve.当前;
  if (id === '普通木柴') {
    return store.data.营地.仓库储备['坚固木材']?.当前 ?? 0;
  }
  return 0;
});

const max_fuel_amount = computed(() => Math.max(1, fuel_stock_available.value));

const fuel_preview_text = computed(() => {
  const preview = previewFuelAddition(selected_fuel_material.value, fuel_amount.value, daily_burn.value);
  return formatFuelDuration(preview.addedHours);
});

async function confirmAddFuel() {
  const material = selected_fuel_material.value;
  const amount = fuel_amount.value;
  if (amount <= 0 || amount > fuel_stock_available.value) return;
  const preview = previewFuelAddition(material, amount, daily_burn.value);
  const actionText = `[添柴] 向篝火投入${material.label}×${amount}，预计续火${fuel_preview_text.value}`;
  await runUserAction(actionText, () => {
    const reserve = store.data.营地.仓库储备[material.id] ?? store.data.营地.仓库储备['坚固木材'];
    if (reserve) {
      reserve.当前 = Math.max(0, reserve.当前 - amount);
    }
    store.data.营地.篝火燃料.当前 = Math.min(
      store.data.营地.篝火燃料.上限,
      store.data.营地.篝火燃料.当前 + preview.addedFuel,
    );
  });
  fuel_amount.value = 1;
  show_add_fuel.value = false;
}

const primary_affairs = computed(() =>
  _.pickBy(store.data.部族事务, affair => affair.级别 === '主要'),
);

const secondary_affairs = computed(() =>
  _.pickBy(store.data.部族事务, affair => affair.级别 === '次要'),
);

function statusClass(status: string) {
  if (status === '进行中') return 'active';
  if (status === '已完成') return 'done';
  return 'pending';
}

function openMeeting() {
  show_meeting.value = true;
}

async function conveneMeeting() {
  const name = meeting_name.value.trim() || '部族会议';
  const content = meeting_content.value.trim();
  const text = content
    ? `[召开部族会议·${meeting_level.value}事务] ${name}：${content}`
    : `[召开部族会议·${meeting_level.value}事务] ${name}`;
  await runUserAction(text, () => {});
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

.calendar-line {
  font-size: 0.92rem;
  font-weight: 900;
  color: #8c7462;
  letter-spacing: 0.04em;
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

.fuel-time {
  font-weight: 900;
}

.fuel-foot {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-top: 14px;
  flex-wrap: wrap;
}

.fuel-opinion {
  flex: 1;
  min-width: 180px;
  margin: 0;
  font-size: 0.88rem;
  font-weight: 700;
  color: #6b4c3a;
  line-height: 1.5;
}

.add-fuel-btn {
  flex-shrink: 0;
  padding: 8px 14px;
  font-size: 0.85rem;
}

.fuel-stock-hint {
  margin: 8px 0 0;
  font-size: 0.75rem;
  font-weight: 700;
  color: #8c7462;
}

.info-grid.three-cols {
  grid-template-columns: repeat(3, 1fr);
}

.highlight-cell .stat-value {
  color: #a8543f;
}

@media (max-width: 560px) {
  .info-grid.three-cols {
    grid-template-columns: 1fr;
  }
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

.general-affairs-panel {
  margin-top: 0;
}

.affairs-clipboard {
  color: #7a9e7e;
  flex-shrink: 0;
}

.general-affair-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 6px;
}

.general-status {
  font-size: 0.72rem;
  font-weight: 900;
  padding: 3px 8px;
  border-radius: 999px;
  flex-shrink: 0;

  &.active {
    background: #e8f5e9;
    color: #4a7c59;
  }

  &.pending {
    background: #fff3e0;
    color: #b8860b;
  }

  &.done {
    background: #eceff1;
    color: #607d8b;
  }
}

.general-members {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.member-chip {
  font-size: 0.75rem;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.65);
  border: 1px dashed #d4c2a4;
  color: #6b4c3a;
}

.affair-card.general {
  border-left: 3px solid #7a9e7e;
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
