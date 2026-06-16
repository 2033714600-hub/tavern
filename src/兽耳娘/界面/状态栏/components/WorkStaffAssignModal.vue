<template>
  <div v-if="modelValue" class="modal-overlay assign-modal-overlay" @click.self="close">
      <div class="parchment-panel modal-panel assign-modal">
        <ModalClose @click="close" />
        <div class="modal-head">
          <Users :size="28" class="accent" />
          <div>
            <h3>{{ title }}</h3>
            <p v-if="subtitle" class="modal-subtitle">{{ subtitle }}</p>
          </div>
        </div>

        <div v-if="draft_named.length" class="member-tags">
          <span v-for="m in draft_named" :key="m" class="member-tag">
            {{ m }}
            <button type="button" class="tag-remove" @click="removeNamed(m)">
              <X :size="12" />
            </button>
          </span>
        </div>

        <div class="pick-list scroll-area">
          <div v-for="n in pick_list" :key="n" class="pick-row">
            <div>
              <span class="pick-name">{{ n }}</span>
              <span class="pick-race">{{ store.data.具名NPC[n]?.种族 }}</span>
            </div>
            <button class="tribal-button-alt pick-btn" type="button" @click="addNamed(n)">选择</button>
          </div>
          <p v-if="pick_list.length === 0" class="empty-hint">没有可指派的人员</p>
        </div>

        <div class="stepper-row">
          <span
            >协同兽耳娘: <strong>{{ draft_unnamed }}</strong> 人</span
          >
          <div class="stepper-btns">
            <button type="button" :disabled="draft_unnamed <= 0" @click="draft_unnamed--">
              <Minus :size="14" />
            </button>
            <button type="button" :disabled="draft_unnamed >= max_unnamed" @click="draft_unnamed++">
              <Plus :size="14" />
            </button>
          </div>
        </div>
        <p class="staff-hint">具名不计入协同增减 · 可协同族人 {{ unnamed_pool }} 人</p>

        <button
          class="tribal-button w-full confirm-btn"
          type="button"
          :disabled="draft_named.length === 0"
          @click="confirm"
        >
          确认加入队列
        </button>
      </div>
  </div>
</template>

<script setup lang="ts">
import { Minus, Plus, Users, X } from 'lucide-vue-next';
import { useMemberPool } from '../composables/useMemberPool';
import { useDataStore } from '../store';
import ModalClose from './ModalClose.vue';

const props = defineProps<{
  modelValue: boolean;
  title: string;
  subtitle?: string;
  /** 新建队列项时传入占位名，用于计算可指派人数 */
  pool_key?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [boolean];
  confirm: [payload: { named: string[]; unnamed: number }];
}>();

const store = useDataStore();
const { unnamed_pool, max_unnamed_for_work, available_named_for_work } = useMemberPool();

const draft_named = ref<string[]>([]);
const draft_unnamed = ref(0);

const pool_key = computed(() => props.pool_key ?? '__new_work__');

const pick_list = computed(() => {
  const key = pool_key.value;
  return available_named_for_work(key).filter(n => !draft_named.value.includes(n));
});

const max_unnamed = computed(() => max_unnamed_for_work(pool_key.value));

watch(
  () => props.modelValue,
  open => {
    if (!open) return;
    draft_named.value = [];
    draft_unnamed.value = 0;
  },
);

function addNamed(name: string) {
  if (!draft_named.value.includes(name)) {
    draft_named.value.push(name);
  }
}

function removeNamed(name: string) {
  draft_named.value = draft_named.value.filter(n => n !== name);
}

function close() {
  emit('update:modelValue', false);
}

function confirm() {
  if (draft_named.value.length === 0) {
    toastr.warning('请至少指派一名具名兽耳娘');
    return;
  }
  emit('confirm', { named: [...draft_named.value], unnamed: draft_unnamed.value });
  close();
}
</script>

<style lang="scss" scoped>
.assign-modal-overlay {
  z-index: 20000;
  pointer-events: auto;
}

.assign-modal {
  max-width: 440px;
  width: 100%;
  padding: 22px;
}

.modal-head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;

  h3 {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 900;
    color: #4a3b32;
  }
}

.modal-subtitle {
  margin: 4px 0 0;
  font-size: 0.78rem;
  font-weight: 700;
  color: #8c7462;
}

.accent {
  color: #c8955c;
  flex-shrink: 0;
}

.member-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.member-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #f4ecdb;
  border: 1px solid #c8955c;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 800;
  color: #5c4738;
}

.tag-remove {
  border: none;
  background: transparent;
  color: #a88a6d;
  cursor: pointer;
  padding: 0;
  display: flex;
}

.pick-list {
  max-height: 220px;
  margin-bottom: 14px;
}

.pick-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px dashed #e4d4ba;

  &:last-child {
    border-bottom: none;
  }
}

.pick-name {
  display: block;
  font-weight: 900;
  color: #4a3b32;
}

.pick-race {
  display: block;
  margin-top: 2px;
  font-size: 0.72rem;
  color: #8c7462;
  font-weight: 700;
}

.pick-btn {
  flex-shrink: 0;
  padding: 6px 14px;
  font-size: 0.82rem;
}

.stepper-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border: 2px dashed #e4d4ba;
  border-radius: 12px;
  background: #faf6ee;
  font-size: 0.85rem;
  font-weight: 700;
  color: #5c4738;

  strong {
    color: #c8955c;
    font-size: 1rem;
  }
}

.stepper-btns {
  display: flex;
  gap: 6px;

  button {
    width: 32px;
    height: 32px;
    border: 1px solid #e4d4ba;
    border-radius: 8px;
    background: #fffdf8;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #5c4738;

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    &:last-child {
      background: #eef5ef;
      border-color: #7ca982;
      color: #4a7c59;
    }
  }
}

.staff-hint {
  margin: 8px 0 14px;
  font-size: 0.68rem;
  font-weight: 700;
  color: #9a8b72;
  text-align: right;
}

.confirm-btn {
  width: 100%;
  padding: 12px;
}

.empty-hint {
  text-align: center;
  color: #8c7462;
  font-weight: 700;
  padding: 12px;
}
</style>
