<template>
  <div class="panel-page">
    <PanelTitle>
      <template #icon>
        <Pickaxe class="title-icon" :size="32" :stroke-width="2.25" />
      </template>
      工作队列
      <template #actions>
        <button class="era-progress-btn" type="button" @click.stop="openEraProgress">
          <ScrollText :size="14" /> 时代演进表
        </button>
      </template>
    </PanelTitle>

    <section v-for="group in queue_groups" :key="group.title" class="parchment-panel section">
      <div class="queue-head">
        <h3 class="queue-title" :class="group.color">
          <component :is="group.icon" :size="24" class="queue-icon" />
          {{ group.title }}
        </h3>
        <button class="add-project-btn" type="button" @click.stop="openAddProject(group.title)">
          <Plus :size="14" /> 添加项目
        </button>
      </div>
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
                <span v-if="item.data.状态 === '待指派'" class="pending-badge">待指派</span>
                <span v-if="item.data.所需工时" class="hours-badge">{{ item.data.所需工时 }}</span>
              </span>
              <span class="work-pct">{{ item.data.进度 }}%</span>
            </div>
            <ProgressBar
              :value="item.data.进度"
              size="short"
              :tone-override="item.data.状态 === '进行中' ? 'green' : 'amber'"
            />
            <p v-if="item.data.状态 === '待指派'" class="assign-hint">须指派至少一名具名兽耳娘后方可开工</p>
          </div>
          <div class="work-ctrl">
            <button
              class="ctrl-btn"
              type="button"
              :disabled="item.data.状态 === '待指派'"
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

        <div v-if="item.data.状态 !== '已停止' && (item.data.具名指派.length || item.data.协同兽耳娘数)" class="staff-box readonly">
          <div class="member-tags">
            <span v-for="m in item.data.具名指派" :key="m" class="member-tag readonly-tag">{{ m }}</span>
            <span v-if="item.data.协同兽耳娘数 > 0" class="coop-tag">协同 {{ item.data.协同兽耳娘数 }} 人</span>
          </div>
        </div>
      </article>
    </section>

    <div v-if="add_project_queue" class="modal-overlay work-modal-overlay" @click.self="closeAddProject">
      <div class="parchment-panel modal-panel project-modal">
          <ModalClose @click="closeAddProject" />
          <div class="modal-head">
            <Hammer :size="28" class="accent" />
            <h3>项目 · {{ add_project_queue }}</h3>
          </div>
          <div class="project-list scroll-area">
            <section
              v-for="section in era_project_sections"
              :key="section.era"
              class="era-section"
              :class="{ locked: section.locked }"
            >
              <button
                class="era-head"
                type="button"
                :disabled="section.locked"
                @click="toggleEraSection(section.era)"
              >
                <ChevronDown v-if="!section.locked && era_expanded[section.era]" :size="16" />
                <ChevronRight v-else :size="16" />
                <span>{{ section.label }}</span>
                <span v-if="section.locked" class="era-lock-tag">未解锁</span>
                <span v-else class="era-count">{{ section.projects.length }} 项</span>
              </button>
              <div
                v-if="!section.locked && era_expanded[section.era]"
                class="project-grid"
              >
                <CatalogItemCard
                  v-for="project in section.projects"
                  :key="project.name"
                  :name="project.name"
                  :materials="project.materials"
                  :hours="project.hours"
                  :locked="!is_project_unlocked(project)"
                  :ready="is_project_ready(project)"
                  :lock-text="project_prerequisite(project)"
                  :shortage-text="is_project_unlocked(project) && !is_project_ready(project) ? '材料不足' : undefined"
                  @click="selectProject(project)"
                />
              </div>
            </section>
            <p v-if="era_project_sections.length === 0" class="empty-hint">该队列暂无预设项目</p>
          </div>
      </div>
    </div>

    <WorkStaffAssignModal
      v-model="show_assign_modal"
      :title="assign_modal_title"
      :subtitle="assign_modal_subtitle"
      pool_key="__new_work__"
      @confirm="onStaffAssignConfirm"
    />

    <EraProgressModal v-model="show_era_progress" />
  </div>
</template>

<script setup lang="ts">
import _ from 'lodash';
import {
  ChevronDown,
  ChevronRight,
  Hammer,
  Pause,
  Pickaxe,
  Play,
  Plus,
  ScrollText,
  Square,
  Tent,
} from 'lucide-vue-next';
import type { Component } from 'vue';
import type { Schema } from '../../../schema';
import { QUEUE_GROUP_TYPES, WORK_PROJECT_CATALOG, type WorkProject } from '../constants/workProjectCatalog';
import {
  isProjectUnlocked,
  projectPrerequisite,
} from '../constants/workUnlock';
import { useConfirm } from '../composables/useConfirm';
import { runUserAction } from '../composables/useGameActions';
import { useMemberPool } from '../composables/useMemberPool';
import { useDataStore } from '../store';
import { syncWorkActivation } from '../util/workQueue';
import { should_not_be_in_work_queue } from '../../../util/comprehensiveAffairsSync';
import { sync_work_efficiency_bonus } from '../util/campVariableSync';
import WorkStaffAssignModal from './WorkStaffAssignModal.vue';
import {
  type GameEra,
  ERA_ORDER,
  groupProjectsByEra,
  projectReady,
} from '../util/workProjectEra';
import CatalogItemCard from './CatalogItemCard.vue';
import EraProgressModal from './EraProgressModal.vue';
import ModalClose from './ModalClose.vue';
import PanelTitle from './PanelTitle.vue';
import ProgressBar from './ProgressBar.vue';

const store = useDataStore();
const { work_efficiency_bonus } = useMemberPool();

const { confirm } = useConfirm();
const add_project_queue = ref('');
const era_expanded = ref<Record<GameEra, boolean>>({ 一: true, 二: false, 三: false });
const show_assign_modal = ref(false);
const show_era_progress = ref(false);

function openEraProgress() {
  show_era_progress.value = true;
}
const pending_project = ref<WorkProject | null>(null);
const assign_modal_title = computed(() =>
  pending_project.value ? `指派人员 · ${pending_project.value.name}` : '指派具名兽耳娘',
);
const assign_modal_subtitle = computed(() => {
  const p = pending_project.value;
  if (!p) return '';
  return `材料：${p.materials} · 工时：${p.hours} 小时`;
});

const queue_groups = computed(() => {
  const entries = _.entries(store.data.工作队列)
    .filter(([name]) => !should_not_be_in_work_queue(name))
    .map(([name, data]) => ({ name, data }));
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

const era_project_sections = computed(() => {
  if (!add_project_queue.value) return [];
  const types = QUEUE_GROUP_TYPES[add_project_queue.value] ?? [];
  const projects = WORK_PROJECT_CATALOG.filter(p => types.includes(p.type));
  return groupProjectsByEra(
    projects,
    store.data.世界.当前时代,
    store.data.已解锁科技,
    store.data.营地.仓库储备,
  );
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

function is_project_unlocked(project: WorkProject) {
  return isProjectUnlocked(project, store.data.已解锁科技);
}

function project_prerequisite(project: WorkProject) {
  return projectPrerequisite(project);
}

function is_project_ready(project: WorkProject) {
  return projectReady(project, store.data.已解锁科技, store.data.营地.仓库储备);
}

function toggleEraSection(era: GameEra) {
  era_expanded.value[era] = !era_expanded.value[era];
}

function syncEraExpanded() {
  const current = store.data.世界.当前时代;
  const idx = ERA_ORDER.indexOf(current);
  era_expanded.value = {
    一: idx >= 0,
    二: idx >= 1,
    三: idx >= 2,
  };
}

function sync_work_activation(work_name: string) {
  syncWorkActivation(
    work_name,
    store.data.工作队列,
    store.data.营地.当前建筑,
    store.data.营地.仓库储备,
  );
}

function openAddProject(queueTitle: string) {
  syncEraExpanded();
  add_project_queue.value = queueTitle;
}

function closeAddProject() {
  add_project_queue.value = '';
}

async function selectProject(project: WorkProject) {
  if (!is_project_unlocked(project)) {
    toastr.warning(project_prerequisite(project));
    return;
  }
  if (store.data.工作队列[project.name]) {
    toastr.warning(`「${project.name}」已在队列中`);
    return;
  }
  pending_project.value = project;
  closeAddProject();
  show_assign_modal.value = true;
}

async function onStaffAssignConfirm(payload: { named: string[]; unnamed: number }) {
  const project = pending_project.value;
  if (!project) return;
  const named_text = payload.named.join('、');
  await runUserAction(
    `[工作队列·添加] ${project.name}（${project.type}）材料：${project.materials} 工时：${project.hours}小时 · 指派：${named_text} · 协同${payload.unnamed}人`,
    () => {
      store.data.工作队列[project.name] = {
        类型: project.type,
        进度: 0,
        状态: '待指派',
        具名指派: [...payload.named],
        协同兽耳娘数: payload.unnamed,
        效率加成: 0,
        负责人: payload.named[0] ?? '',
        所需工时: project.hours,
        优先级: 5,
      };
      sync_work_efficiency_bonus(store.data.工作队列[project.name]);
      sync_work_activation(project.name);
    },
  );
  pending_project.value = null;
}

async function togglePause(name: string, status: string) {
  const action = status === '暂停' ? '继续' : '暂停';
  await runUserAction(`[工作队列·${action}] ${name}`, () => {
    const work = store.data.工作队列[name];
    if (work && work.状态 !== '已停止') {
      work.状态 = work.状态 === '暂停' ? '进行中' : '暂停';
    }
  });
}

async function stopWork(name: string) {
  const ok = await confirm({
    title: '停止工作',
    message: `确定停止并放弃「${name}」吗？\n已投入的材料与进度可能无法收回。`,
    confirmText: '停止并放弃',
    danger: true,
  });
  if (!ok) return;
  await runUserAction(`[工作队列·停止] ${name}`, () => {
    const work = store.data.工作队列[name];
    if (work) {
      work.状态 = '已停止';
    }
  });
}
</script>

<style lang="scss" scoped>
.panel-page {
  position: relative;
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

.queue-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px dashed #e4d4ba;
}

.queue-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.15rem;
  font-weight: 900;
  margin: 0;

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

  &.readonly-tag {
    padding: 4px 10px;
  }
}

.coop-tag {
  display: inline-flex;
  align-items: center;
  background: #eef5ef;
  color: #4a7c59;
  border: 1px solid #7ca982;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 8px;
}

.staff-box.readonly {
  .member-tags {
    margin-bottom: 0;
  }
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

.work-modal-overlay {
  z-index: 20000;
  pointer-events: auto;
}

.era-progress-btn {
  position: relative;
  z-index: 2;
  pointer-events: auto;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 2px dashed #c8955c;
  border-radius: 10px;
  background: #fffdf8;
  color: #c8955c;
  font-size: 0.78rem;
  font-weight: 800;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    background: #f4ecdb;
  }
}

.add-project-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 2px dashed #c8955c;
  border-radius: 10px;
  background: #fffdf8;
  color: #c8955c;
  font-size: 0.78rem;
  font-weight: 800;
  font-family: inherit;
  cursor: pointer;
  flex-shrink: 0;

  &:hover {
    background: #f4ecdb;
  }
}

.project-modal {
  max-width: 520px;
}

.project-list {
  max-height: 55vh;
  overflow: auto;
}

.era-section {
  margin-bottom: 10px;

  &.locked .era-head {
    opacity: 0.55;
    cursor: not-allowed;
  }
}

.era-head {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 12px;
  border: 2px dashed #c8955c;
  border-radius: 10px;
  background: #f4ecdb;
  font-weight: 900;
  font-size: 0.82rem;
  color: #5c4738;
  cursor: pointer;
  font-family: inherit;
  text-align: left;

  &:disabled {
    cursor: not-allowed;
  }
}

.era-lock-tag {
  margin-left: auto;
  font-size: 0.68rem;
  color: #d9776c;
}

.era-count {
  margin-left: auto;
  font-size: 0.68rem;
  color: #8c7462;
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-top: 8px;
}

.project-card {
  display: flex;
  gap: 8px;
  padding: 10px;
  border: 2px solid #e4d4ba;
  border-radius: 12px;
  background: #fffdf8;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  transition: border-color 0.15s;

  &:hover:not(.locked) {
    border-color: #c8955c;
    background: #fcf8f0;
  }

  &.locked {
    opacity: 0.5;
    cursor: not-allowed;
    background: #f5f0e8;
  }

  p {
    margin: 0 0 4px;
    font-size: 0.72rem;
    font-weight: 700;
    color: #6b4c3a;
    line-height: 1.35;
  }
}

.project-thumb {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  border: 2px solid #e6b981;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  font-weight: 900;
  color: #a8543f;
  background: #fdf6e8;
}

.project-lock {
  color: #8c7462 !important;
  font-weight: 900 !important;

  &.shortage {
    color: #d9776c !important;
  }
}

.project-ready {
  color: #4a7c59 !important;
  font-weight: 900 !important;
}

.project-card.ready {
  border-color: #4a7c59;
  background: #f0f7f2;
}

.pending-badge {
  font-size: 0.62rem;
  font-weight: 900;
  color: #fff;
  background: #8c7462;
  padding: 2px 6px;
  border-radius: 6px;
  margin-left: 4px;
}

.assign-hint {
  margin: 6px 0 0;
  font-size: 0.68rem;
  font-weight: 800;
  color: #8c7462;
}

.project-name {
  font-weight: 900 !important;
  color: #4a3b32 !important;
}

.project-meta {
  min-width: 0;
}

@media (max-width: 480px) {
  .project-grid {
    grid-template-columns: 1fr;
  }
}
</style>
