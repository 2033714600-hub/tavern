<template>
  <div class="panel-page">
    <PanelTitle>
      <template #icon>
        <Pickaxe class="title-icon" :size="32" :stroke-width="2.25" />
      </template>
      工作队列
    </PanelTitle>

    <section v-for="group in queue_groups" :key="group.title" class="parchment-panel section">
      <h3 class="queue-title" :class="group.color">
        <component :is="group.icon" :size="24" class="queue-icon" />
        {{ group.title }}
      </h3>
      <div v-if="group.items.length === 0" class="empty-hint">当前队列空闲中...</div>
      <article v-for="item in group.items" :key="item.name" class="work-card">
        <div class="work-main">
          <div class="work-icon">
            <component :is="workIconComponent(item.data.类型)" :size="24" />
          </div>
          <div class="work-body">
            <div class="work-head">
              <span class="work-name">
                {{ item.name }}
                <span class="work-tag">{{ typeLabel(item.data.类型) }}</span>
                <span v-if="efficiency(item.data) > 0" class="efficiency-badge">效率 +{{ efficiency(item.data) }}%</span>
                <span v-if="item.data.所需工时" class="hours-badge">{{ item.data.所需工时 }}</span>
              </span>
              <span class="work-pct">{{ item.data.进度 }}%</span>
            </div>
            <ProgressBar
              :value="item.data.进度"
              size="short"
              :tone-override="item.data.状态 === '进行中' ? 'green' : 'amber'"
            />
          </div>
          <div class="work-ctrl">
            <button
              class="ctrl-btn"
              type="button"
              :title="item.data.状态 === '暂停' ? '继续' : '暂停'"
              @click="togglePause(item.name, item.data.状态)"
            >
              <Pause v-if="item.data.状态 !== '暂停'" :size="18" />
              <Play v-else :size="18" />
            </button>
            <button class="ctrl-btn stop" type="button" title="停止并放弃" @click="stopWork(item.name)">
              <Square :size="18" />
            </button>
          </div>
        </div>

        <div v-if="item.data.状态 !== '已停止'" class="staff-box">
          <div class="member-tags">
            <span v-for="m in item.data.具名指派" :key="m" class="member-tag">
              {{ m }}
              <button
                type="button"
                class="tag-remove"
                :disabled="item.data.状态 !== '进行中' && item.data.状态 !== '暂停'"
                @click="removeWorkNamed(item.name, m)"
              >
                <X :size="12" />
              </button>
            </span>
            <button
              class="add-member"
              type="button"
              :disabled="item.data.状态 === '已停止'"
              @click="openAddWorkMember(item.name)"
            >
              <Plus :size="12" /> 指派具名兽耳娘
            </button>
          </div>
          <div class="stepper-row">
            <span>协同兽耳娘: <strong>{{ item.data.协同兽耳娘数 }}</strong> 人</span>
            <div class="stepper-btns">
              <button
                type="button"
                :disabled="!can_edit_work(item.data) || item.data.协同兽耳娘数 <= 0"
                @click="adjustWorkUnnamed(item.name, -1)"
              >
                <Minus :size="14" />
              </button>
              <button
                type="button"
                :disabled="!can_edit_work(item.data) || item.data.协同兽耳娘数 >= max_unnamed_for_work(item.name)"
                @click="adjustWorkUnnamed(item.name, 1)"
              >
                <Plus :size="14" />
              </button>
            </div>
          </div>
          <p class="staff-hint">具名不计入协同增减 · 可协同族人 {{ unnamed_pool }} 人</p>
        </div>
      </article>
    </section>

    <div v-if="add_work" class="modal-overlay" @click.self="add_work = ''">
      <div class="parchment-panel modal-panel">
        <ModalClose @click="add_work = ''" />
        <div class="modal-head">
          <Users :size="28" class="accent" />
          <h3>指派具名兽耳娘</h3>
        </div>
        <div class="pick-list scroll-area">
          <div v-for="n in work_pick_list" :key="n" class="pick-row">
            <div>
              <span class="pick-name">{{ n }}</span>
              <span class="pick-race">{{ store.data.具名NPC[n]?.种族 }}</span>
            </div>
            <button class="tribal-button-alt pick-btn" type="button" @click="pickWorkMember(n)">选择</button>
          </div>
          <p v-if="work_pick_list.length === 0" class="empty-hint">没有可指派的人员</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import _ from 'lodash';
import { Hammer, Minus, Pause, Pickaxe, Play, Plus, ScrollText, Square, Tent, Users, X } from 'lucide-vue-next';
import type { Component } from 'vue';
import type { Schema } from '../../../schema';
import { sendUserAction } from '../composables/useGameActions';
import { useMemberPool } from '../composables/useMemberPool';
import { useDataStore } from '../store';
import ModalClose from './ModalClose.vue';
import PanelTitle from './PanelTitle.vue';
import ProgressBar from './ProgressBar.vue';

const store = useDataStore();
const {
  unnamed_pool,
  max_unnamed_for_work,
  available_named_for_work,
  work_efficiency_bonus,
} = useMemberPool();

const add_work = ref('');

const queue_groups = computed(() => {
  const entries = _.entries(store.data.工作队列).map(([name, data]) => ({ name, data }));
  return [
    {
      title: '生产队列',
      icon: Hammer,
      color: 'brown',
      items: entries.filter(e => ['生产', '建造'].includes(e.data.类型)),
    },
    {
      title: '学习队列',
      icon: ScrollText,
      color: 'amber',
      items: entries.filter(e => e.data.类型 === '学习'),
    },
    {
      title: '研发队列',
      icon: ScrollText,
      color: 'red',
      items: entries.filter(e => e.data.类型 === '研发'),
    },
  ];
});

const work_pick_list = computed(() => {
  if (!add_work.value) return [];
  const work = store.data.工作队列[add_work.value];
  if (!work) return [];
  return available_named_for_work(add_work.value).filter(n => !work.具名指派.includes(n));
});

function workIconComponent(type: string): Component {
  if (type === '学习') return ScrollText;
  if (type === '研发') return ScrollText;
  if (type === '建造') return Tent;
  if (type === '生产') return Hammer;
  return Pickaxe;
}

function typeLabel(type: string) {
  const map: Record<string, string> = {
    生产: '生产',
    建造: '建造',
    学习: '学习',
    研发: '研发',
  };
  return map[type] ?? '工作';
}

function efficiency(work: Schema['工作队列'][string]) {
  return work_efficiency_bonus(work.具名指派.length, work.协同兽耳娘数);
}

function can_edit_work(work: Schema['工作队列'][string]) {
  return work.状态 === '进行中' || work.状态 === '暂停' || work.状态 === '缺料停工';
}

function openAddWorkMember(name: string) {
  add_work.value = name;
}

async function pickWorkMember(npc: string) {
  const work = store.data.工作队列[add_work.value];
  if (!work) return;
  await sendUserAction(`[工作队列·指派] ${add_work.value} 增派${npc}`);
  work.具名指派.push(npc);
  add_work.value = '';
}

async function removeWorkNamed(work_name: string, member: string) {
  const work = store.data.工作队列[work_name];
  if (!work || !can_edit_work(work)) return;
  work.具名指派 = work.具名指派.filter(m => m !== member);
}

function adjustWorkUnnamed(work_name: string, delta: number) {
  const work = store.data.工作队列[work_name];
  if (!work || !can_edit_work(work)) return;
  work.协同兽耳娘数 = _.clamp(work.协同兽耳娘数 + delta, 0, max_unnamed_for_work(work_name));
}

async function togglePause(name: string, status: string) {
  const action = status === '暂停' ? '继续' : '暂停';
  await sendUserAction(`[工作队列·${action}] ${name}`);
  const work = store.data.工作队列[name];
  if (work && work.状态 !== '已停止') {
    work.状态 = work.状态 === '暂停' ? '进行中' : '暂停';
  }
}

async function stopWork(name: string) {
  await sendUserAction(`[工作队列·停止] ${name}`);
  const work = store.data.工作队列[name];
  if (work) {
    work.状态 = '已停止';
  }
}
</script>

<style lang="scss" scoped>
.panel-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-bottom: 16px;
  min-width: 0;
  width: 100%;
}

.title-icon {
  color: #8c7462;
}

.section {
  padding: 22px;
}

.queue-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.15rem;
  font-weight: 900;
  margin: 0 0 16px;
  padding-bottom: 12px;
  border-bottom: 2px dashed #e4d4ba;

  &.brown {
    color: #5c4738;
  }

  &.amber {
    color: #b87a41;
  }

  &.red {
    color: #a8543f;
  }
}

.work-card {
  background: #fffdf8;
  border: 2px solid #e4d4ba;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 12px;
  transition: border-color 0.2s;

  &:hover {
    border-color: #c8955c;
  }

  &:last-child {
    margin-bottom: 0;
  }
}

.work-main {
  display: flex;
  align-items: center;
  gap: 14px;
}

.work-icon {
  width: 48px;
  height: 48px;
  background: #fcf8f0;
  border: 2px solid #e4d4ba;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.06);
  color: #5c4738;
}

.work-body {
  flex: 1;
  min-width: 0;
}

.work-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  gap: 8px;
}

.work-name {
  font-weight: 900;
  color: #4a3b32;
  font-size: 1rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.work-tag {
  font-size: 0.65rem;
  background: #e4d4ba;
  color: #6b4c3a;
  padding: 2px 6px;
  border-radius: 6px;
  font-weight: 800;
}

.efficiency-badge {
  font-size: 0.62rem;
  background: #eef5ef;
  color: #4a7c59;
  border: 1px solid #7ca982;
  padding: 2px 6px;
  border-radius: 6px;
  font-weight: 800;
}

.hours-badge {
  font-size: 0.62rem;
  background: #eef0f5;
  color: #5c4738;
  border: 1px solid #8c7462;
  padding: 2px 6px;
  border-radius: 6px;
  font-weight: 800;
}

.work-pct {
  font-size: 0.85rem;
  font-weight: 900;
  color: #8c7462;
  flex-shrink: 0;
}

.work-ctrl {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.ctrl-btn {
  width: 38px;
  height: 38px;
  border: 1px solid #e4d4ba;
  border-radius: 12px;
  background: #fdfbf7;
  color: #8c7462;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  transition: background 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #e4d4ba;
    color: #5c4738;
  }

  &.stop {
    color: #e07a5f;

    &:hover {
      background: #f4d8d3;
      color: #a8543f;
    }
  }
}

.staff-box {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 2px dashed #e4d4ba;
  background: #fdfbf7;
  border-radius: 12px;
  padding: 12px;
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

  &:hover:not(:disabled) {
    background: #e4d4ba;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.stepper-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.staff-hint {
  margin: 8px 0 0;
  font-size: 0.65rem;
  font-weight: 600;
  color: #a88a6d;
  text-align: right;
}

.modal-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;

  h3 {
    margin: 0;
    font-weight: 900;
    color: #5c4738;
  }

  .accent {
    color: #c8955c;
  }
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

.empty-hint {
  text-align: center;
  color: #8c7462;
  font-weight: 700;
  padding: 16px;
}
</style>
