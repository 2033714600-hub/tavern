<template>
  <div class="screen-shell wide">
    <div ref="card_ref" class="screen-card custom-card parchment-panel">
      <div class="corner corner-tl" aria-hidden="true" />
      <div class="corner corner-br" aria-hidden="true" />

      <div class="custom-head">
        <ScrollText class="head-icon" :size="28" :stroke-width="2.25" />
        <div>
          <p class="custom-eyebrow">自定义 · 序章</p>
          <h2 class="custom-title">自定义开局</h2>
        </div>
      </div>

      <div class="sections scroll-area">
        <section v-for="section in sections" :key="section.id" class="section-block">
          <div class="section-head">
            <h3 class="section-title">{{ section.title }}</h3>
            <p class="section-hint">{{ section.hint }}</p>
          </div>
          <div class="option-grid">
            <button
              v-for="option in section.options"
              :key="option.id"
              class="option-chip"
              type="button"
              :class="{ selected: selections[section.id] === option.id }"
              @click="select_option(section.id, option.id)"
            >
              <span class="chip-label">
                {{ option.label }}
                <span v-if="option.difficulty" class="chip-diff">{{ option.difficulty }}</span>
              </span>
              <span class="chip-detail">{{ option.detail }}</span>
            </button>
          </div>
          <label v-if="selections[section.id] === CUSTOM_OPTION_ID" class="custom-field">
            <span class="field-label">自定义 {{ section.title }}</span>
            <textarea
              v-model="custom_notes[section.id]"
              class="custom-input"
              rows="3"
              :placeholder="`描述你的${section.title}设定……`"
            />
          </label>
        </section>
      </div>

      <div class="custom-actions">
        <button class="ghost-btn" type="button" @click="emit('back')">
          <ArrowLeft :size="18" :stroke-width="2.25" />
          返回路线
        </button>
        <button class="enter-btn custom-enter-btn" type="button" :disabled="saving" @click="on_enter">
          {{ saving ? '正在生成开局……' : '进入部落' }}
          <ChevronRight :size="18" :stroke-width="2.5" />
        </button>
      </div>

      <p v-if="error" class="error-text">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import gsap from 'gsap';
import { ArrowLeft, ChevronRight, ScrollText } from 'lucide-vue-next';
import {
  create_default_custom_notes,
  CUSTOM_OPTION_ID,
  CUSTOM_START_SECTIONS,
  DEFAULT_CUSTOM_SELECTIONS,
  type CustomStartNotes,
  type CustomStartSelections,
} from '../constants/customStartOptions';
import { generate_custom_opening } from '../util/customStartGenerate';

const emit = defineEmits<{ back: []; enter: [] }>();

const sections = CUSTOM_START_SECTIONS;
const selections = reactive<CustomStartSelections>({ ...DEFAULT_CUSTOM_SELECTIONS });
const custom_notes = reactive<CustomStartNotes>(create_default_custom_notes());
const card_ref = ref<HTMLElement | null>(null);
const saving = ref(false);
const error = ref('');

function select_option(section_id: string, option_id: string) {
  selections[section_id] = option_id;
}

function validate_custom_notes(): string | null {
  for (const section of sections) {
    if (selections[section.id] === CUSTOM_OPTION_ID && !custom_notes[section.id]?.trim()) {
      return `请填写「${section.title}」的自定义内容`;
    }
  }
  return null;
}

async function on_enter() {
  if (saving.value) {
    return;
  }
  const validation_error = validate_custom_notes();
  if (validation_error) {
    error.value = validation_error;
    toastr.warning(validation_error);
    return;
  }

  saving.value = true;
  error.value = '';
  try {
    await generate_custom_opening({ ...selections }, { ...custom_notes });
    const card = card_ref.value;
    if (card) {
      await gsap.to(card, { opacity: 0, y: 10, duration: 0.3, ease: 'power2.in' });
    }
    emit('enter');
  } catch (e) {
    error.value = e instanceof Error ? e.message : '写入世界书失败，请稍后重试';
    toastr.error(error.value);
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  const card = card_ref.value;
  if (!card) {
    return;
  }
  gsap.from(card, { opacity: 0, y: 20, duration: 0.5, ease: 'power3.out' });
});
</script>

<style lang="scss" scoped>
.custom-card {
  padding: 26px 22px 22px;
  position: relative;
}

.corner {
  position: absolute;
  width: 22px;
  height: 22px;
  border: 2px solid rgba(200, 149, 92, 0.5);
  pointer-events: none;
}

.corner-tl {
  top: 10px;
  left: 10px;
  border-right: none;
  border-bottom: none;
}

.corner-br {
  bottom: 10px;
  right: 10px;
  border-left: none;
  border-top: none;
}

.custom-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px dashed #e4d4ba;
}

.head-icon {
  color: #c8955c;
  flex-shrink: 0;
}

.custom-eyebrow {
  margin: 0 0 4px;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  color: #a88a6d;
}

.custom-title {
  margin: 0;
  font-size: 1.45rem;
  font-weight: 900;
  color: #4a3b32;
}

.sections {
  max-height: 420px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 4px;
  margin-bottom: 16px;
}

.section-block {
  margin-bottom: 18px;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-head {
  margin-bottom: 10px;
}

.section-title {
  margin: 0 0 4px;
  font-size: 0.92rem;
  font-weight: 900;
  color: #5c4738;
}

.section-hint {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 700;
  color: #a88a6d;
  line-height: 1.5;
}

.option-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-chip {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #e4d4ba;
  border-radius: 12px;
  background: #fffdf8;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s ease;

  &:hover {
    border-color: #d4c2a4;
  }

  &.selected {
    border-color: #7ca982;
    background: #f4faf5;
    box-shadow: 0 0 0 2px rgba(124, 169, 130, 0.18);
  }
}

.chip-label {
  font-size: 0.84rem;
  font-weight: 900;
  color: #4a3b32;
  display: flex;
  align-items: center;
  gap: 8px;
}

.chip-diff {
  font-size: 0.62rem;
  font-weight: 800;
  color: #8c7462;
  background: #f4ecdb;
  padding: 1px 6px;
  border-radius: 999px;
}

.chip-detail {
  font-size: 0.72rem;
  font-weight: 700;
  color: #8c7462;
  line-height: 1.45;
}

.custom-field {
  display: block;
  margin-top: 10px;
}

.field-label {
  display: block;
  margin-bottom: 6px;
  font-size: 0.72rem;
  font-weight: 800;
  color: #c8955c;
}

.custom-input {
  width: 100%;
  padding: 10px 12px;
  border: 2px dashed #c8955c;
  border-radius: 10px;
  background: #fffdf8;
  color: #5c4738;
  font-size: 0.82rem;
  font-weight: 700;
  font-family: inherit;
  line-height: 1.55;
  resize: vertical;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #7ca982;
    box-shadow: 0 0 0 2px rgba(124, 169, 130, 0.2);
  }

  &::placeholder {
    color: #b5a389;
    font-weight: 600;
  }
}

.custom-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 4px;
  border-top: 2px dashed #e4d4ba;
}

.ghost-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 11px 14px;
  border: 2px solid #e4d4ba;
  border-radius: 12px;
  background: #fcf8f0;
  color: #8c7462;
  font-size: 0.82rem;
  font-weight: 800;
  font-family: inherit;
  cursor: pointer;

  &:hover {
    border-color: #d4c2a4;
    color: #5c4738;
  }
}

.custom-enter-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 13px 22px;
  font-size: 0.92rem;
  font-weight: 900;
  font-family: inherit;
  border: 2px solid #c8955c;
  border-radius: 12px;
  background: linear-gradient(180deg, #f0c999 0%, #e6b981 45%, #d9a86a 100%);
  color: #634326;
  box-shadow: 0 4px 0 #c8955c, inset 0 1px 0 rgba(255, 255, 255, 0.35);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    background: linear-gradient(180deg, #f5d4a8 0%, #ecc18f 45%, #e0b075 100%);
    transform: translateY(2px);
    box-shadow: 0 2px 0 #c8955c, inset 0 1px 0 rgba(255, 255, 255, 0.35);
  }

  &:active:not(:disabled) {
    transform: translateY(4px);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }

  &:disabled {
    opacity: 0.75;
    cursor: wait;
  }
}

.error-text {
  margin: 10px 0 0;
  font-size: 0.78rem;
  font-weight: 700;
  color: #d9776c;
  text-align: center;
}
</style>
