<template>
  <div class="panel-page">
    <PanelTitle>
      <template #icon>
        <Map class="title-icon map" :size="32" :stroke-width="2.25" />
      </template>
      广阔大地
    </PanelTitle>

    <section class="parchment-panel section">
      <div class="section-head between">
        <div class="section-head">
          <Users :size="28" class="section-icon" />
          <h3>探索编队</h3>
        </div>
        <button class="tribal-button-alt new-squad-btn" type="button" @click="show_new = true">
          <Plus :size="16" /> 新建队伍
        </button>
      </div>

      <div v-if="_.isEmpty(store.data.探索编队)" class="empty-hint">暂无编队，点击右上角新建队伍</div>
      <div v-else class="squad-grid">
        <article v-for="(squad, name) in store.data.探索编队" :key="name" class="squad-card">
          <div class="squad-head">
            <h4>{{ name }}</h4>
            <div class="squad-status-row">
              <span class="status-badge" :class="statusClass(squad.状态)">{{ statusLabel(squad.状态) }}</span>
              <button
                v-if="squad.状态 === '待命'"
                class="disband-btn"
                type="button"
                title="解散队伍"
                @click="disbandSquad(name)"
              >
                <X :size="16" />
              </button>
            </div>
          </div>
          <div class="member-box">
            <div class="member-tags">
              <span v-for="m in squad.具名成员" :key="m" class="member-tag">
                {{ m }}
                <button
                  type="button"
                  class="tag-remove"
                  :disabled="squad.状态 !== '待命' || squad.具名成员.length <= 1"
                  @click="removeMember(name, m)"
                >
                  <X :size="12" />
                </button>
              </span>
              <button
                v-if="squad.状态 === '待命'"
                class="add-member"
                type="button"
                @click="openAddMember(name)"
              >
                <Plus :size="12" /> 具名兽耳娘
              </button>
            </div>
            <div class="stepper-row">
              <span>同行兽耳娘数量: <strong>{{ squad.无名队员数 }}</strong> 人</span>
              <div class="stepper-btns">
                <button type="button" :disabled="squad.状态 !== '待命' || squad.无名队员数 <= 0" @click="adjustUnnamed(name, -1)">
                  <Minus :size="14" />
                </button>
                <button
                  type="button"
                  :disabled="squad.状态 !== '待命' || squad.无名队员数 >= max_unnamed_for_squad(name)"
                  @click="adjustUnnamed(name, 1)"
                >
                  <Plus :size="14" />
                </button>
              </div>
            </div>
            <div class="stepper-row">
              <span>出队时长: <strong>{{ squad.计划时长 }}</strong> 小时</span>
              <Stepper
                v-model="squad.计划时长"
                :min="2"
                :max="8"
                :disabled="squad.状态 !== '待命'"
                class="duration-stepper"
              />
            </div>
            <div class="squad-foot">
              具名 {{ squad.具名成员.length }} 人 · 同行 {{ squad.无名队员数 }} 人
              <span class="pool-hint">（可协同族人 {{ unnamed_pool }} 人，具名不计入同行增减）</span>
            </div>
          </div>
          <div class="squad-actions">
            <button class="dispatch-explore" type="button" :disabled="squad.状态 !== '待命'" @click="dispatch(name, '探索中', '出发探索')">
              出发探索
            </button>
            <button class="dispatch-gather" type="button" :disabled="squad.状态 !== '待命'" @click="dispatch(name, '采集中', '外出采集')">
              外出采集
            </button>
          </div>
        </article>
      </div>
    </section>

    <section class="parchment-panel section">
      <div class="section-head border-b">
        <Map :size="28" class="section-icon muted" />
        <h3>区域内容</h3>
      </div>
      <div v-if="visible_areas.length === 0" class="empty-hint">暂无待探索的区域新情报。</div>
      <div v-else class="area-grid">
        <article
          v-for="[name, area] in visible_areas"
          :key="name"
          class="parchment-panel area-card"
          :class="areaBorder(area.危险度)"
          @click="openArea(name, area)"
        >
          <div class="area-head">
            <Trees v-if="!area.危险度.includes('高')" :size="24" class="area-icon safe" />
            <Map v-else :size="24" class="area-icon danger" />
            <h4>{{ name }}</h4>
          </div>
          <p>{{ area.描述 }}</p>
          <div class="area-foot">
            <span>路程: {{ area.路程 }}</span>
            <ChevronRight :size="18" />
          </div>
        </article>
      </div>
    </section>

    <section v-if="!_.isEmpty(store.data.大地见闻)" class="parchment-panel section">
      <div class="section-head border-b">
        <ScrollText :size="28" class="section-icon muted" />
        <h3>大地见闻录</h3>
      </div>
      <article
        v-for="(journal, title) in store.data.大地见闻"
        :key="title"
        class="journal-card"
        :class="{ handled: journal.已处理, expanded: expanded_journal === title }"
        @click="toggleJournal(title, journal.已处理)"
      >
        <div class="journal-head">
          <div>
            <span class="journal-title">
              <Check v-if="journal.已处理" :size="18" class="check-icon" />
              {{ title }}
            </span>
            <div class="journal-meta">来源: {{ journal.来源 }} · <span class="time">{{ journal.时间 }}</span></div>
          </div>
          <span v-if="journal.已处理" class="handled-badge">已处理</span>
          <ChevronRight v-else :size="20" class="chevron" :class="{ open: expanded_journal === title }" />
        </div>
        <div v-if="expanded_journal === title && !journal.已处理" class="journal-body" @click.stop>
          <p>{{ journal.内容 }}</p>
          <button class="tribal-button archive-btn" type="button" @click="archiveJournal(title)">处理并归档</button>
        </div>
      </article>
    </section>

    <!-- 新建队伍 -->
    <div v-if="show_new" class="modal-overlay" @click.self="show_new = false">
      <div class="parchment-panel modal-panel">
        <ModalClose @click="show_new = false" />
        <div class="modal-head"><Plus :size="32" class="accent" /><h3>新建编队</h3></div>
        <div class="form-field">
          <label class="form-label">队伍名称</label>
          <input v-model="new_name" class="form-input" placeholder="输入队名..." />
        </div>
        <div class="form-field">
          <label class="form-label">选择队长角色 (具名兽耳娘)</label>
          <select v-model="new_leader" class="form-select">
            <option value="">点击选择...</option>
            <option v-for="n in _.keys(store.data.具名NPC)" :key="n" :value="n">{{ n }} - {{ store.data.具名NPC[n].种族 }}</option>
          </select>
        </div>
        <button class="tribal-button w-full" type="button" :disabled="!new_name || !new_leader" @click="createSquad">创建队伍</button>
      </div>
    </div>

    <!-- 指派成员 -->
    <div v-if="add_squad" class="modal-overlay" @click.self="add_squad = ''">
      <div class="parchment-panel modal-panel">
        <ModalClose @click="add_squad = ''" />
        <div class="modal-head"><Users :size="32" class="accent" /><h3>指派具名兽耳娘</h3></div>
        <div class="pick-list scroll-area">
          <div v-for="n in availableMembers" :key="n" class="pick-row">
            <div>
              <span class="pick-name">{{ n }}</span>
              <span class="pick-race">{{ store.data.具名NPC[n]?.种族 }}</span>
            </div>
            <button class="tribal-button-alt pick-btn" type="button" @click="pickMember(n)">选择</button>
          </div>
          <p v-if="availableMembers.length === 0" class="empty-hint">没有可添加的成员</p>
        </div>
      </div>
    </div>

    <!-- 区域派遣 -->
    <div v-if="selected_area" class="modal-overlay" @click.self="closeArea">
      <div class="parchment-panel modal-panel">
        <ModalClose @click="closeArea" />
        <div class="modal-head"><Map :size="32" class="accent" /><h3>探索区域：{{ selected_area }}</h3></div>
        <div class="area-desc-box">{{ selected_area_data?.描述 }}</div>
        <div class="form-field">
          <label class="form-label">选择在营小队</label>
          <select v-model="dispatch_squad" class="form-select">
            <option value="">点击选择待命队伍...</option>
            <option v-for="(s, n) in idleSquads" :key="n" :value="n">
              {{ n }} (具名{{ s.具名成员.length }}·同行{{ s.无名队员数 }}·{{ s.计划时长 }}h)
            </option>
          </select>
        </div>
        <div class="area-actions">
          <button class="tribal-button" type="button" :disabled="!dispatch_squad" @click="areaDispatch('探索')">进行探索</button>
          <button class="tribal-button-alt" type="button" :disabled="!dispatch_squad" @click="areaDispatch('采集')">进行采集</button>
          <button class="ignore-area-btn" type="button" @click="ignoreArea">忽略该区域</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import _ from 'lodash';
import { Check, ChevronRight, Map, Minus, Plus, ScrollText, Trees, Users, X } from 'lucide-vue-next';
import type { Schema } from '../../../schema';
import { sendUserAction } from '../composables/useGameActions';
import { useMemberPool } from '../composables/useMemberPool';
import { useUiStore } from '../composables/useUiStore';
import { useDataStore } from '../store';
import ModalClose from './ModalClose.vue';
import PanelTitle from './PanelTitle.vue';
import Stepper from './Stepper.vue';

const store = useDataStore();
const { ui, hide_area } = useUiStore();
const { unnamed_pool, max_unnamed_for_squad, available_named_for_squad } = useMemberPool();

const show_new = ref(false);
const new_name = ref('');
const new_leader = ref('');
const add_squad = ref('');
const selected_area = ref('');
const selected_area_data = ref<Schema['探索区域'][string] | null>(null);
const dispatch_squad = ref('');
const expanded_journal = ref('');

const visible_areas = computed(() =>
  _.toPairs(store.data.探索区域).filter(([name]) => !ui.value.hidden_areas.includes(name)),
);

const idleSquads = computed(() => _.pickBy(store.data.探索编队, s => s.状态 === '待命'));

const availableMembers = computed(() => {
  if (!add_squad.value) return [];
  return available_named_for_squad(add_squad.value).filter(
    n => !store.data.探索编队[add_squad.value]?.具名成员.includes(n),
  );
});

function statusClass(s: string) {
  if (s === '待命') return 'idle';
  if (s === '采集中') return 'gather';
  return 'explore';
}

function statusLabel(s: string) {
  if (s === '待命') return '待命在营';
  if (s === '采集中') return '采集中...';
  return '探索中...';
}

function areaBorder(risk: string) {
  return risk.includes('高') ? 'danger' : 'safe';
}

function adjustUnnamed(name: string, delta: number) {
  const squad = store.data.探索编队[name];
  if (!squad || squad.状态 !== '待命') return;
  const next = squad.无名队员数 + delta;
  squad.无名队员数 = _.clamp(next, 0, max_unnamed_for_squad(name));
}

function openAddMember(name: string) {
  add_squad.value = name;
}

async function pickMember(npc: string) {
  const squad = store.data.探索编队[add_squad.value];
  if (!squad) return;
  await sendUserAction(`[编队调整] 将${npc}编入「${add_squad.value}」`);
  squad.具名成员.push(npc);
  add_squad.value = '';
}

async function removeMember(squadName: string, member: string) {
  const squad = store.data.探索编队[squadName];
  if (!squad || squad.状态 !== '待命' || squad.具名成员.length <= 1) return;
  await sendUserAction(`[编队调整] 将${member}移出「${squadName}」`);
  squad.具名成员 = squad.具名成员.filter(m => m !== member);
}

async function createSquad() {
  const name = new_name.value.trim();
  if (!name || !new_leader.value) return;
  await sendUserAction(`[新建编队] ${name}，队长：${new_leader.value}`);
  store.data.探索编队[name] = {
    状态: '待命',
    具名成员: [new_leader.value],
    无名队员数: 0,
    计划时长: 4,
  };
  new_name.value = '';
  new_leader.value = '';
  show_new.value = false;
}

async function disbandSquad(name: string) {
  const squad = store.data.探索编队[name];
  if (!squad || squad.状态 !== '待命') return;
  await sendUserAction(`[解散编队] ${name}`);
  delete store.data.探索编队[name];
}

async function dispatch(name: string, status: '探索中' | '采集中', action: string) {
  const squad = store.data.探索编队[name];
  if (!squad || squad.状态 !== '待命') return;
  const members = [...squad.具名成员, ...(squad.无名队员数 > 0 ? [`${squad.无名队员数}名同行族人`] : [])].join('、');
  await sendUserAction(
    `[${action}] 队伍「${name}」${members ? `，成员：${members}` : ''}，计划时长 ${squad.计划时长} 小时`,
  );
  squad.状态 = status;
}

function openArea(name: string, area: Schema['探索区域'][string]) {
  selected_area.value = name;
  selected_area_data.value = area;
}

function closeArea() {
  selected_area.value = '';
  selected_area_data.value = null;
  dispatch_squad.value = '';
}

async function areaDispatch(mode: string) {
  if (!dispatch_squad.value || !selected_area.value) return;
  const squad = store.data.探索编队[dispatch_squad.value];
  const hours = squad?.计划时长 ?? 4;
  await sendUserAction(`[${mode}] 队伍「${dispatch_squad.value}」前往「${selected_area.value}」，计划时长 ${hours} 小时`);
  if (squad) squad.状态 = mode === '采集' ? '采集中' : '探索中';
  closeArea();
}

async function ignoreArea() {
  if (!selected_area.value) return;
  await sendUserAction(`[忽略区域] ${selected_area.value}`);
  hide_area(selected_area.value);
  closeArea();
}

function toggleJournal(title: string, handled: boolean) {
  if (handled) return;
  expanded_journal.value = expanded_journal.value === title ? '' : title;
}

async function archiveJournal(title: string) {
  await sendUserAction(`[处理见闻] ${title}`);
  const journal = store.data.大地见闻[title];
  if (journal) journal.已处理 = true;
  expanded_journal.value = '';
}
</script>

<style lang="scss" scoped>
.panel-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-bottom: 16px;
}

.title-icon.map {
  color: #a88a6d;
}

.section {
  padding: 24px;
}

.section-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;

  h3 {
    margin: 0;
    font-size: 1.35rem;
    font-weight: 900;
    color: #5c4738;
  }

  &.between {
    justify-content: space-between;
  }

  &.border-b {
    padding-bottom: 14px;
    border-bottom: 2px dashed #e4d4ba;
    margin-bottom: 20px;
  }
}

.section-icon {
  color: #c8955c;

  &.muted {
    color: #a88a6d;
  }
}

.new-squad-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  font-size: 0.82rem;
}

.squad-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

.squad-card {
  background: #fcf8f0;
  border: 2px solid #e4d4ba;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  transition: border-color 0.2s;

  &:hover {
    border-color: #c8955c;
  }
}

.squad-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;

  h4 {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 900;
    color: #4a3b32;
  }
}

.squad-status-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.disband-btn {
  color: #d9776c;
  background: transparent;
  border: none;
  padding: 4px;
  border-radius: 6px;
  cursor: pointer;

  &:hover {
    color: #a8543f;
    background: #f4d8d3;
  }
}

.status-badge {
  font-size: 0.65rem;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 999px;
  border: 1px solid;

  &.idle {
    background: #eef5ef;
    color: #4a7c59;
    border-color: #7ca982;
  }

  &.gather {
    background: #f4ecdb;
    color: #b87a41;
    border-color: #e6b981;
  }

  &.explore {
    background: #f4d8d3;
    color: #a8543f;
    border-color: #d9776c;
  }
}

.member-box {
  background: #fdfbf7;
  border: 1px solid #e4d4ba;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 12px;
}

.member-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.member-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #e4d4ba;
  color: #5c4738;
  font-size: 0.75rem;
  font-weight: 800;
  padding: 4px 6px 4px 10px;
  border-radius: 8px;
}

.tag-remove {
  border: none;
  background: none;
  color: #8c7462;
  cursor: pointer;
  padding: 0;
  display: flex;

  &:hover:not(:disabled) {
    color: #a8543f;
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
}

.add-member {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 2px dashed #c8955c;
  background: transparent;
  color: #c8955c;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 4px 8px;
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;

  &:hover {
    background: #e4d4ba;
  }
}

.stepper-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
  border-top: 1px dashed #d4c2a4;
  font-size: 0.82rem;
  font-weight: 800;
  color: #6b4c3a;

  strong {
    color: #a8543f;
  }
}

.stepper-btns {
  display: flex;
  gap: 6px;

  button {
    width: 24px;
    height: 24px;
    border: none;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    &:first-child {
      background: #f4d8d3;
      color: #a8543f;
    }

    &:last-child {
      background: #cde4d1;
      color: #4a7c59;
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      background: #fcf8f0;
    }
  }
}

.squad-foot {
  font-size: 0.7rem;
  font-weight: 700;
  color: #8c7462;
  text-align: right;
  margin-top: 6px;
  line-height: 1.45;
}

.pool-hint {
  display: block;
  font-size: 0.62rem;
  font-weight: 600;
  color: #a88a6d;
  margin-top: 2px;
}

.duration-stepper {
  pointer-events: auto;

  &:has(button:disabled) {
    opacity: 1;
  }
}

.stepper-row:has(.duration-stepper) {
  .duration-stepper {
    opacity: 1;
  }
}

.squad-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.dispatch-explore,
.dispatch-gather {
  padding: 10px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 900;
  border: none;
  cursor: pointer;
  transition: background 0.2s;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.dispatch-explore {
  background: #7ca982;
  color: #fff;

  &:hover:not(:disabled) {
    background: #638568;
  }
}

.dispatch-gather {
  background: #e6b981;
  color: #634326;

  &:hover:not(:disabled) {
    background: #d4a86a;
  }
}

.area-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

.area-card {
  padding: 20px;
  cursor: pointer;
  border-left: 4px solid #7ca982;
  transition: background 0.2s;

  &.danger {
    border-left-color: #d9776c;
  }

  &:hover {
    background: #fffdf8;
  }

  h4 {
    margin: 0;
    font-weight: 900;
    color: #4a3b32;
    font-size: 1.05rem;
  }

  p {
    margin: 8px 0;
    font-size: 0.85rem;
    font-weight: 700;
    color: #8c7462;
    line-height: 1.45;
  }
}

.area-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.area-icon.safe {
  color: #7ca982;
}

.area-icon.danger {
  color: #d9776c;
}

.area-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  font-weight: 900;
  color: #7ca982;
}

.journal-card {
  border: 2px solid #c8955c;
  border-radius: 12px;
  background: #fffdf8;
  margin-bottom: 12px;
  cursor: pointer;
  transition: transform 0.2s;
  overflow: hidden;

  &:hover:not(.handled) {
    transform: translateY(-1px);
  }

  &.handled {
    border-color: #e4d4ba;
    opacity: 0.6;
    cursor: default;
  }
}

.journal-head {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.journal-title {
  font-weight: 900;
  color: #4a3b32;
  font-size: 1.05rem;
  display: flex;
  align-items: center;
  gap: 6px;
}

.check-icon {
  color: #7ca982;
}

.journal-meta {
  font-size: 0.72rem;
  font-weight: 700;
  color: #8c7462;
  margin-top: 4px;

  .time {
    color: #c8955c;
  }
}

.chevron {
  color: #c8955c;
  transition: transform 0.3s;

  &.open {
    transform: rotate(90deg);
  }
}

.journal-body {
  padding: 0 16px 16px;
  border-top: 1px dashed #e4d4ba;
  background: #fcf8f0;

  p {
    margin: 16px 0;
    font-size: 0.88rem;
    font-weight: 700;
    color: #5c4738;
    line-height: 1.5;
  }
}

.archive-btn {
  float: right;
  padding: 8px 20px;
  font-size: 0.85rem;
}

.handled-badge {
  font-size: 0.65rem;
  background: #e4d4ba;
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: 800;
  color: #8c7462;
}

.modal-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;

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

.w-full {
  width: 100%;
  padding: 14px;
  margin-top: 8px;
}

.pick-list {
  max-height: 50vh;
  overflow: auto;
}

.pick-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 2px solid #e4d4ba;
  border-radius: 12px;
  background: #fcf8f0;
  margin-bottom: 8px;
}

.pick-name {
  font-weight: 900;
  color: #4a3b32;
  display: block;
}

.pick-race {
  font-size: 0.72rem;
  font-weight: 700;
  color: #8c7462;
  background: #e4d4ba;
  padding: 2px 8px;
  border-radius: 999px;
  margin-top: 4px;
  display: inline-block;
}

.pick-btn {
  padding: 6px 12px;
  font-size: 0.82rem;
}

.area-desc-box {
  background: #fcf8f0;
  border: 2px solid #e4d4ba;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 16px;
  font-weight: 700;
  color: #8c7462;
  font-size: 0.88rem;
}

.area-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 16px;

  button {
    padding: 10px;
  }
}

.ignore-area-btn {
  grid-column: 1 / -1;
  margin-top: 4px;
  padding: 12px;
  background: #f4d8d3;
  color: #a8543f;
  border: 2px solid #d9776c;
  border-radius: 12px;
  box-shadow: 0 4px 0 #d9776c;
  font-weight: 900;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    transform: translateY(2px);
    box-shadow: 0 2px 0 #d9776c;
  }

  &:active {
    transform: translateY(4px);
    box-shadow: none;
  }
}

.empty-hint {
  text-align: center;
  color: #8c7462;
  font-weight: 700;
  padding: 16px;
}

@media (max-width: 640px) {
  .squad-grid,
  .area-grid {
    grid-template-columns: 1fr;
  }
}
</style>
