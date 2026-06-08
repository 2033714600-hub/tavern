<template>
  <div class="panel-page">
    <PanelTitle>
      <template #icon>
        <Tent class="title-icon" :size="32" :stroke-width="2.25" />
      </template>
      部落建设
    </PanelTitle>

    <div class="stat-grid">
      <StatCard label="部落族人" :value="`${store.data.营地.人口}`" tone="people">
        <Users :size="24" class="icon-people" />
      </StatCard>
      <StatCard label="温饱度" :value="`${store.data.营地.生存指标.温饱度}%`" tone="food">
        <Drumstick :size="24" class="icon-food" />
      </StatCard>
      <StatCard label="栖居度" :value="`${store.data.营地.生存指标.栖居度}%`" tone="shelter">
        <Tent :size="24" class="icon-shelter" />
      </StatCard>
      <StatCard label="向心力" :value="`${store.data.营地.向心力}%`" tone="cohesion">
        <HandHeart :size="24" class="icon-cohesion" />
      </StatCard>
    </div>

    <div class="camp-layout">
      <section class="parchment-panel section">
        <div class="section-head">
          <Boxes :size="28" class="section-icon" />
          <h3>仓库储备</h3>
        </div>
        <div v-for="(res, name) in warehouse_display" :key="name" class="resource-row">
          <div class="stat-row">
            <span class="stat-label">{{ name }}</span>
            <span class="stat-value">{{ res.当前 }} / {{ res.上限 }}</span>
          </div>
          <ProgressBar :value="res.上限 > 0 ? (res.当前 / res.上限) * 100 : 0" size="mid" :tone-override="resourceTone(name)" />
        </div>
        <div class="warehouse-footer">
          <p class="warehouse-lv">储物等级 Lv. {{ store.data.营地.仓库等级 }}</p>
          <p class="warehouse-cost" :class="{ enough: can_upgrade_warehouse, maxed: warehouse_maxed }">
            <template v-if="warehouse_maxed">仓库已达最高等级</template>
            <template v-else>扩建需 {{ warehouse_upgrade_cost_text }}</template>
          </p>
          <div class="warehouse-btn-wrap">
            <button
              class="tribal-button warehouse-upgrade-btn"
              type="button"
              :disabled="!can_upgrade_warehouse"
              :title="warehouse_upgrade_title"
              @click="upgradeWarehouse"
            >
              <ArrowUpFromLine :size="18" />
              升级仓库
            </button>
            <button class="warehouse-btn" type="button" @click="show_warehouse = true">
              <PackageOpen :size="20" />
              打开仓库详单
            </button>
          </div>
        </div>
      </section>

      <div class="camp-side">
        <section class="parchment-panel section defense-card">
          <div class="defense-row">
            <div class="defense-info">
              <Shield :size="32" class="defense-icon" />
              <div>
                <p class="stat-label">木栅栏防御稳固度</p>
                <p class="defense-lv">Lv. {{ store.data.营地.防御等级 }}</p>
                <p class="defense-cost" :class="{ enough: can_reinforce_fence }">
                  加固需木材 {{ defense_wood_cost }}（{{ wood_available }}）
                  <template v-if="defense_vine_cost > 0"> · 藤蔓 {{ defense_vine_cost }}（{{ vine_available }}）</template>
                </p>
              </div>
            </div>
            <button
              class="tribal-button defense-btn"
              type="button"
              :disabled="!can_reinforce_fence"
              :title="can_reinforce_fence ? '消耗木材加固木栅栏' : '坚固木材不足，无法加固'"
              @click="reinforceFence"
            >
              加固栅栏
            </button>
          </div>
        </section>

        <section class="parchment-panel section">
          <div class="section-head">
            <Home :size="28" class="section-icon" />
            <h3>营地建筑</h3>
          </div>
          <div class="building-tags">
            <span v-for="name in _.keys(store.data.营地.当前建筑)" :key="name" class="building-tag">{{ name }}</span>
          </div>
          <div class="btn-row">
            <button class="tribal-button" type="button" @click="show_plan = true">规划新设施</button>
            <button class="tribal-button-alt" type="button" @click="openFacility">
              <Settings :size="18" />
              设施管理
            </button>
          </div>
        </section>
      </div>
    </div>

    <!-- 仓库弹窗：仅预览，不发消息 -->
    <div v-if="show_warehouse" class="modal-overlay" @click.self="show_warehouse = false">
      <div class="parchment-panel modal-panel wide">
        <ModalClose @click="show_warehouse = false" />
        <div class="modal-head">
          <PackageOpen :size="32" class="accent" />
          <h3>部落内部储物仓</h3>
        </div>
        <div v-if="_.isEmpty(store.data.营地.物品栏)" class="empty-hint">储物仓空空如也</div>
        <div v-else class="item-grid">
          <div v-for="(item, name) in store.data.营地.物品栏" :key="name" class="item-card">
            <span class="item-icon">{{ itemIcon(name) }}</span>
            <span class="item-name">{{ name }}</span>
            <span class="item-qty">数量: {{ item.数量 }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 规划弹窗 -->
    <div v-if="show_plan" class="modal-overlay" @click.self="show_plan = false">
      <div class="parchment-panel modal-panel">
        <ModalClose @click="show_plan = false" />
        <div class="modal-head">
          <Hammer :size="32" class="accent" />
          <h3>自定义建筑模块</h3>
        </div>
        <div class="form-field">
          <label class="form-label">建筑名称</label>
          <input v-model="plan_name" class="form-input" placeholder="例如：高级兽皮帐篷" />
        </div>
        <div class="form-field">
          <label class="form-label">描述</label>
          <textarea v-model="plan_desc" class="form-textarea" rows="3" placeholder="描述这个建筑的外观和特点..." />
        </div>
        <div class="form-field">
          <label class="form-label">功能</label>
          <input v-model="plan_func" class="form-input" placeholder="例如：提升少许向心力" />
        </div>
        <div v-if="plan_estimate" class="plan-preview">
          <p class="plan-preview-title">预算估算 · {{ plan_estimate.类别 }} · {{ plan_estimate.规模 }}</p>
          <p class="plan-preview-row">
            <span class="plan-preview-label">材料</span>
            <span>{{ formatMaterials(plan_estimate.所需材料) }}</span>
          </p>
          <p class="plan-preview-row">
            <span class="plan-preview-label">工时</span>
            <span>{{ plan_estimate.所需工时 }}</span>
          </p>
          <p class="plan-preview-hint" :class="{ shortage: plan_material_shortage }">
            {{ plan_material_shortage ? '仓库材料不足，确认后将进入缺料停工' : '材料充足时可立即开工' }}
          </p>
        </div>
        <button class="tribal-button w-full" type="button" @click="confirmPlan">确认规划</button>
      </div>
    </div>

    <!-- 设施管理 -->
    <div v-if="show_facility" class="modal-overlay" @click.self="closeFacility">
      <div class="parchment-panel modal-panel facility-modal">
        <ModalClose @click="closeFacility" />
        <div class="facility-layout">
          <div class="facility-list scroll-area">
            <h3>
              <Home :size="28" class="accent" />
              所有设施
            </h3>
            <button
              v-for="name in _.keys(store.data.营地.当前建筑)"
              :key="name"
              class="facility-item"
              :class="{ active: selected === name }"
              type="button"
              @click="selected = name"
            >
              {{ name }}
            </button>
          </div>
          <div v-if="selected_data" class="facility-detail">
            <h4>{{ selected }}</h4>
            <div class="detail-box">
              <p>{{ selected_data.描述 }}</p>
              <div v-if="selected_data.功能" class="effect-box">
                <span class="effect-label">建筑功效</span>
                <span>{{ selected_data.功能 }}</span>
              </div>
              <div v-if="!_.isEmpty(selected_data.所需材料)" class="effect-box materials-box">
                <span class="effect-label">所需材料</span>
                <span>{{ formatMaterials(selected_data.所需材料) }}</span>
              </div>
              <div v-if="selected_data.所需工时" class="effect-box hours-box">
                <span class="effect-label">建造工时</span>
                <span>{{ selected_data.所需工时 }}</span>
              </div>
            </div>
            <div class="facility-actions">
              <span class="actions-label">设施管理选项</span>
              <button class="tribal-button" type="button" @click="facilityAction('升级设施')">升级设施</button>
              <button class="tribal-button-alt" type="button" @click="facilityAction('日常修缮')">日常修缮</button>
              <button class="tribal-button-danger" type="button" @click="facilityAction('拆毁建筑')">拆毁建筑</button>
            </div>
          </div>
          <div v-else class="facility-empty">
            <Home :size="64" class="empty-icon" />
            <p>在左侧选择一个设施以查看并管理详情</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import _ from 'lodash';
import {
  ArrowUpFromLine,
  Boxes,
  Drumstick,
  Hammer,
  HandHeart,
  Home,
  PackageOpen,
  Settings,
  Shield,
  Tent,
  Users,
} from 'lucide-vue-next';
import { sendUserAction } from '../composables/useGameActions';
import { useDataStore } from '../store';
import {
  estimateFacilityPlan,
  formatMaterials,
  warehouseHasMaterials,
} from '../../../util/estimateFacilityPlan';
import ModalClose from './ModalClose.vue';
import PanelTitle from './PanelTitle.vue';
import ProgressBar from './ProgressBar.vue';
import StatCard from './StatCard.vue';

const store = useDataStore();

const show_warehouse = ref(false);
const show_plan = ref(false);
const show_facility = ref(false);
const selected = ref('');
const plan_name = ref('');
const plan_desc = ref('');
const plan_func = ref('');

const plan_estimate = computed(() => {
  const name = plan_name.value.trim();
  if (!name && !plan_desc.value.trim() && !plan_func.value.trim()) return null;
  return estimateFacilityPlan(name || '新设施', plan_desc.value.trim(), plan_func.value.trim());
});

const plan_material_shortage = computed(() => {
  if (!plan_estimate.value) return false;
  return !warehouseHasMaterials(plan_estimate.value.所需材料, store.data.营地.仓库储备);
});

const DEFAULT_WAREHOUSE = {
  坚固木材: { 当前: 0, 上限: 500 },
  藤蔓: { 当前: 0, 上限: 200 },
  石料: { 当前: 0, 上限: 300 },
  清水: { 当前: 0, 上限: 200 },
  黏土: { 当前: 0, 上限: 250 },
} as const;

const warehouse_display = computed(() => {
  const reserve = store.data.营地.仓库储备;
  if (_.isEmpty(reserve)) return { ...DEFAULT_WAREHOUSE };
  return _.merge({}, DEFAULT_WAREHOUSE, reserve);
});

function reserveAvailable(name: string) {
  return store.data.营地.仓库储备[name]?.当前 ?? 0;
}

function canAfford(cost: Record<string, number>) {
  return _.every(cost, (need, name) => reserveAvailable(name) >= need);
}

const warehouse_upgrade_cost = computed(
  () => store.data.营地.仓库设施?.扩建消耗 ?? { 坚固木材: 30, 藤蔓: 12 },
);

const warehouse_maxed = computed(() => store.data.营地.仓库等级 >= 5);

const can_upgrade_warehouse = computed(
  () => !warehouse_maxed.value && canAfford(warehouse_upgrade_cost.value),
);

const warehouse_upgrade_cost_text = computed(() =>
  _.entries(warehouse_upgrade_cost.value)
    .map(([name, need]) => `${name} ${need}（${reserveAvailable(name)}）`)
    .join(' · '),
);

const warehouse_upgrade_title = computed(() => {
  if (warehouse_maxed.value) return '仓库已达最高等级';
  if (can_upgrade_warehouse.value) return '消耗材料扩建仓库，提升各资源储备上限';
  return '材料不足，无法扩建仓库';
});

const selected_data = computed(() => (selected.value ? store.data.营地.当前建筑[selected.value] : null));

const defense_wood_cost = computed(
  () => store.data.营地.防御工事?.加固消耗?.坚固木材 ?? 20 + store.data.营地.防御等级 * 15,
);

const defense_vine_cost = computed(() => store.data.营地.防御工事?.加固消耗?.藤蔓 ?? 0);

const wood_available = computed(() => {
  const reserve = store.data.营地.仓库储备['坚固木材'];
  if (reserve) return reserve.当前;
  return store.data.营地.篝火燃料.当前;
});

const vine_available = computed(() => store.data.营地.仓库储备['藤蔓']?.当前 ?? 0);

const can_reinforce_fence = computed(
  () => wood_available.value >= defense_wood_cost.value && vine_available.value >= defense_vine_cost.value,
);

async function reinforceFence() {
  if (!can_reinforce_fence.value) return;
  await sendUserAction(`[加固栅栏] 消耗坚固木材 ${defense_wood_cost.value}`);
}

async function upgradeWarehouse() {
  if (!can_upgrade_warehouse.value) return;
  const cost_text = formatMaterials(warehouse_upgrade_cost.value);
  await sendUserAction(`[升级仓库] 消耗${cost_text}`);
}

function resourceTone(name: string): 'green' | 'orange' | 'red' | 'amber' {
  if (name.includes('肉')) return 'red';
  if (name.includes('木')) return 'amber';
  if (name.includes('石')) return 'orange';
  if (name.includes('水')) return 'green';
  if (name.includes('黏') || name.includes('土')) return 'amber';
  return 'green';
}

function itemIcon(name: string) {
  if (name.includes('肉')) return '🍖';
  if (name.includes('木')) return '🪵';
  if (name.includes('菇')) return '🍄';
  if (name.includes('浆果')) return '🫐';
  if (name.includes('石')) return '🪨';
  return '📦';
}

function openFacility() {
  selected.value = _.keys(store.data.营地.当前建筑)[0] ?? '';
  show_facility.value = true;
}

function closeFacility() {
  show_facility.value = false;
  selected.value = '';
}

async function confirmPlan() {
  const name = plan_name.value.trim() || '新设施';
  const desc = plan_desc.value.trim() || '由首领规划的新设施';
  const func = plan_func.value.trim();
  const estimate = estimateFacilityPlan(name, desc, func);
  const material_text = formatMaterials(estimate.所需材料);
  const enough = warehouseHasMaterials(estimate.所需材料, store.data.营地.仓库储备);

  store.data.营地.当前建筑[name] = {
    状态: '蓝图/待建',
    描述: desc,
    功能: func,
    建筑阶段: '蓝图',
    所需材料: { ...estimate.所需材料 },
    所需工时: estimate.所需工时,
  };
  store.data.工作队列[name] = {
    类型: '建造',
    进度: 0,
    状态: enough ? '进行中' : '缺料停工',
    具名指派: [],
    协同兽耳娘数: 0,
    效率加成: 0,
    负责人: '',
    所需工时: estimate.所需工时,
    优先级: 5,
  };

  const parts = [name, desc, func].filter(Boolean);
  await sendUserAction(
    `[规划新设施] ${parts.join(' · ')} · 材料：${material_text} · 工时：${estimate.所需工时}`,
  );
  plan_name.value = '';
  plan_desc.value = '';
  plan_func.value = '';
  show_plan.value = false;
}

async function facilityAction(action: string) {
  if (!selected.value) return;
  await sendUserAction(`[设施管理·${action}] ${selected.value}`);
  if (action === '拆毁建筑') {
    closeFacility();
  }
}
</script>

<style lang="scss" scoped>
.panel-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-bottom: 16px;
}

.title-icon {
  color: #c8955c;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

@media (min-width: 640px) {
  .stat-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.icon-people {
  color: #5c4738;
}

.icon-food {
  color: #e07a5f;
}

.icon-shelter {
  color: #7ca982;
}

.icon-cohesion {
  color: #d9776c;
}

.camp-layout {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 20px;
}

.camp-side {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section {
  padding: 22px;
}

.section-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 18px;

  h3 {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 900;
    color: #5c4738;
  }
}

.section-icon {
  color: #c8955c;
}

.resource-row {
  margin-bottom: 16px;
}

.warehouse-footer {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 2px dashed #e4d4ba;
}

.warehouse-lv {
  margin: 0 0 6px;
  font-size: 0.82rem;
  font-weight: 900;
  color: #5c4738;
}

.warehouse-cost {
  margin: 0 0 12px;
  font-size: 0.72rem;
  font-weight: 800;
  color: #d9776c;
  line-height: 1.45;

  &.enough {
    color: #4a7c59;
  }

  &.maxed {
    color: #8c7462;
  }
}

.warehouse-btn-wrap {
  display: flex;
  gap: 10px;
}

.warehouse-upgrade-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 10px;
  font-size: 0.88rem;
  white-space: nowrap;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    transform: none;
    box-shadow: 0 4px 0 #5b8266;
  }
}

.warehouse-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #e6b981;
  color: #5c4738;
  border: 2px solid #c8955c;
  border-radius: 12px;
  font-weight: 900;
  font-family: inherit;
  padding: 12px 24px;
  cursor: pointer;
  box-shadow: 0 4px 0 #c8955c;
  transition: all 0.15s;

  &:hover {
    transform: translateY(2px);
    box-shadow: 0 2px 0 #c8955c;
  }

  &:active {
    transform: translateY(4px);
    box-shadow: none;
  }
}

.defense-card {
  display: flex;
  align-items: center;
}

.defense-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.defense-info {
  display: flex;
  align-items: center;
  gap: 14px;
}

.defense-icon {
  color: #8c7462;
  flex-shrink: 0;
}

.defense-lv {
  font-size: 1.5rem;
  font-weight: 900;
  color: #5c4738;
  margin: 4px 0 0;
}

.defense-cost {
  margin: 6px 0 0;
  font-size: 0.72rem;
  font-weight: 800;
  color: #d9776c;

  &.enough {
    color: #4a7c59;
  }
}

.defense-btn {
  padding: 10px 18px;
  white-space: nowrap;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    transform: none;
    box-shadow: 0 4px 0 #5b8266;
  }
}

.building-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}

.building-tag {
  background: #fdfbf7;
  border: 2px solid #d4c2a4;
  padding: 8px 14px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 900;
  color: #6b4c3a;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.btn-row {
  display: flex;
  gap: 10px;

  button {
    flex: 1;
    padding: 12px 8px;
    font-size: 0.88rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }
}

.modal-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;

  h3 {
    margin: 0;
    font-weight: 900;
    font-size: 1.35rem;
    color: #5c4738;
  }

  .accent {
    color: #c8955c;
  }
}

.wide {
  max-width: 640px;
}

.item-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.item-card {
  background: #fcf8f0;
  border: 2px solid #e4d4ba;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  transition: all 0.2s;

  &:hover {
    border-color: #c8955c;
    transform: scale(1.03);
  }
}

.item-icon {
  font-size: 2.2rem;
  display: block;
  margin-bottom: 8px;
}

.item-name {
  font-weight: 900;
  font-size: 0.82rem;
  color: #5c4738;
  display: block;
}

.item-qty {
  font-size: 0.7rem;
  font-weight: 900;
  color: #a88a6d;
  background: #f4ecdb;
  padding: 2px 6px;
  border-radius: 4px;
  margin-top: 6px;
  display: inline-block;
}

.w-full {
  width: 100%;
  padding: 14px;
}

.plan-preview {
  background: #f4ecdb;
  border: 2px dashed #c8955c;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 16px;
}

.plan-preview-title {
  margin: 0 0 10px;
  font-size: 0.82rem;
  font-weight: 900;
  color: #5c4738;
}

.plan-preview-row {
  display: flex;
  gap: 10px;
  margin: 6px 0;
  font-size: 0.85rem;
  font-weight: 700;
  color: #6b4c3a;
}

.plan-preview-label {
  flex-shrink: 0;
  font-weight: 900;
  color: #8c7462;
  min-width: 2.5em;
}

.plan-preview-hint {
  margin: 10px 0 0;
  font-size: 0.72rem;
  font-weight: 800;
  color: #4a7c59;

  &.shortage {
    color: #d9776c;
  }
}

.materials-box {
  background: #fdf6e8;
  border-color: #c8955c;
}

.hours-box {
  background: #eef0f5;
  border-color: #8c7462;
}

.facility-modal {
  max-width: 720px;
  position: relative;
  overflow: hidden;
  padding-top: 18px;
  padding-bottom: 18px;
}

.facility-layout {
  display: flex;
  align-items: stretch;
  max-height: 68vh;
  min-height: 260px;
  overflow: hidden;
}

.facility-list {
  width: 50%;
  padding-right: 14px;
  border-right: 2px dashed #e4d4ba;
  overflow-y: auto;

  h3 {
    font-size: 1.2rem;
    font-weight: 900;
    margin: 0 0 14px;
    color: #5c4738;
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.facility-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 14px;
  margin-bottom: 8px;
  border: 2px solid #d4c2a4;
  border-radius: 12px;
  background: #fcf8f0;
  font-family: inherit;
  font-weight: 900;
  color: #4a3b32;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: #fffdf8;
  }

  &.active {
    background: #f4ecdb;
    border-color: #c8955c;
  }
}

.facility-detail {
  width: 50%;
  padding-left: 20px;
  overflow: hidden;

  h4 {
    font-size: 1.3rem;
    font-weight: 900;
    color: #4a3b32;
    margin: 0 0 10px;
    padding-top: 0;
  }
}

.detail-box {
  background: #fcf8f0;
  border: 2px solid #e4d4ba;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 12px;

  p {
    margin: 0;
    font-weight: 700;
    color: #8c7462;
    font-size: 0.88rem;
    line-height: 1.5;
  }
}

.effect-box {
  margin-top: 12px;
  background: #eef5ef;
  border: 1px solid #7ca982;
  border-radius: 8px;
  padding: 10px;
  font-weight: 700;
  font-size: 0.85rem;
  color: #5c4738;

  .effect-label {
    display: block;
    font-size: 0.68rem;
    font-weight: 900;
    color: #4a7c59;
    margin-bottom: 4px;
  }
}

.facility-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 10px;
  border-top: 2px dashed #e4d4ba;

  .actions-label {
    font-size: 0.82rem;
    font-weight: 900;
    color: #8c7462;
  }

  button {
    padding: 10px;
    font-size: 0.88rem;
  }
}

.facility-empty {
  width: 50%;
  padding-left: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #a88a6d;
  font-weight: 700;

  .empty-icon {
    opacity: 0.2;
    margin-bottom: 16px;
  }
}

.empty-hint {
  text-align: center;
  color: #8c7462;
  font-weight: 700;
  padding: 20px;
}

@media (max-width: 640px) {
  .camp-layout {
    grid-template-columns: 1fr;
  }

  .facility-layout {
    flex-direction: column;
  }

  .facility-list,
  .facility-detail,
  .facility-empty {
    width: 100%;
    border-right: none;
    padding: 0;
  }

  .facility-list {
    border-bottom: 2px dashed #e4d4ba;
    padding-bottom: 16px;
    margin-bottom: 16px;
  }
}
</style>
