<template>
  <div class="screen-shell">
    <div ref="card_ref" class="screen-card route-card parchment-panel">
      <div class="corner corner-tl" aria-hidden="true" />
      <div class="corner corner-br" aria-hidden="true" />

      <div class="route-head">
        <Map class="head-icon" :size="28" :stroke-width="2.25" />
        <div>
          <p class="route-eyebrow">新部落 · 序章</p>
          <h2 class="route-title">选择路线</h2>
        </div>
      </div>

      <div class="route-grid">
        <button
          class="route-option active"
          type="button"
          :class="{ selected: selected_id === crash_route.id }"
          @click="selected_id = crash_route.id"
        >
          <div class="option-top">
            <span class="option-badge">{{ crash_route.badge }}</span>
            <Leaf class="option-icon" :size="20" :stroke-width="2" />
          </div>
          <h3 class="option-name">{{ crash_route.name }}</h3>
          <div class="option-block">
            <span class="block-label">描述</span>
            <ul class="block-list">
              <li v-for="(line, i) in crash_route.description" :key="i">{{ line }}</li>
            </ul>
          </div>
          <div class="option-block">
            <span class="block-label">资源</span>
            <ul class="block-list resource">
              <li v-for="(line, i) in crash_route.resources" :key="i">{{ line }}</li>
            </ul>
          </div>
        </button>

        <div v-for="route in placeholder_routes" :key="route.id" class="route-option locked">
          <div class="option-top">
            <Lock class="option-icon muted" :size="20" :stroke-width="2" />
          </div>
          <h3 class="option-name">{{ route.name }}</h3>
          <p class="locked-text">{{ route.placeholder }}</p>
        </div>
      </div>

      <div class="route-actions">
        <button class="ghost-btn" type="button" @click="emit('back')">
          <ArrowLeft :size="18" :stroke-width="2.25" />
          返回标题
        </button>
        <button class="outline-btn" type="button" @click="emit('custom')">
          <SlidersHorizontal :size="18" :stroke-width="2.25" />
          自定义开局
        </button>
        <button class="tribal-button continue-btn" type="button" :disabled="entering" @click="on_enter">
          {{ entering ? '正在进入……' : '进入部落' }}
          <ChevronRight :size="18" :stroke-width="2.5" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import gsap from 'gsap';
import { ArrowLeft, ChevronRight, Leaf, Lock, Map, SlidersHorizontal } from 'lucide-vue-next';
import { CRASH_LANDING_ROUTE, PLACEHOLDER_ROUTES } from '../constants/openingRoutes';
import { push_crash_landing_story } from '../util/crashLandingStory';

const emit = defineEmits<{ back: []; custom: []; enter: [] }>();

const crash_route = CRASH_LANDING_ROUTE;
const placeholder_routes = PLACEHOLDER_ROUTES;
const selected_id = ref(crash_route.id);
const card_ref = ref<HTMLElement | null>(null);
const entering = ref(false);

async function on_enter() {
  if (entering.value || selected_id.value !== crash_route.id) {
    return;
  }
  entering.value = true;
  try {
    await push_crash_landing_story();
    const card = card_ref.value;
    if (card) {
      await gsap.to(card, {
        opacity: 0,
        y: 12,
        duration: 0.32,
        ease: 'power2.in',
      });
    }
    emit('enter');
  } catch (e) {
    const message = e instanceof Error ? e.message : '推送迫降线剧情失败';
    toastr.error(message);
  } finally {
    entering.value = false;
  }
}

onMounted(() => {
  const card = card_ref.value;
  if (!card) {
    return;
  }
  gsap.from(card, { opacity: 0, y: 24, duration: 0.55, ease: 'power3.out' });
  gsap.from(card.querySelectorAll('.route-option'), {
    opacity: 0,
    y: 16,
    duration: 0.45,
    stagger: 0.1,
    delay: 0.15,
    ease: 'power2.out',
  });
});
</script>

<style lang="scss" scoped>
.route-card {
  padding: 28px 24px 24px;
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

.route-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
  padding-bottom: 14px;
  border-bottom: 2px dashed #e4d4ba;
}

.head-icon {
  color: #c8955c;
  flex-shrink: 0;
}

.route-eyebrow {
  margin: 0 0 4px;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  color: #a88a6d;
}

.route-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 900;
  color: #4a3b32;
  letter-spacing: 0.06em;
}

.route-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
}

.route-option {
  text-align: left;
  padding: 14px 14px 12px;
  border: 2px dashed #c8955c;
  border-radius: 14px;
  background: #fffdf8;
  min-width: 0;

  &.active {
    cursor: pointer;
    font-family: inherit;
    transition: border-color 0.15s, box-shadow 0.15s;

    &:hover,
    &.selected {
      border-color: #7ca982;
      box-shadow: 0 0 0 2px rgba(124, 169, 130, 0.2);
    }
  }

  &.locked {
    border-style: dashed;
    border-color: #e4d4ba;
    background: #faf6ee;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 220px;
  }
}

.option-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.option-badge {
  font-size: 0.62rem;
  font-weight: 800;
  color: #6b4c3a;
  background: #e4d4ba;
  padding: 2px 8px;
  border-radius: 999px;
}

.option-icon {
  color: #7ca982;

  &.muted {
    color: #c4b59e;
  }
}

.option-name {
  margin: 0 0 10px;
  font-size: 1rem;
  font-weight: 900;
  color: #4a3b32;
}

.option-block {
  margin-bottom: 10px;

  &:last-child {
    margin-bottom: 0;
  }
}

.block-label {
  display: block;
  font-size: 0.72rem;
  font-weight: 900;
  color: #c8955c;
  margin-bottom: 4px;
}

.block-list {
  list-style: none;
  margin: 0;
  padding: 0;

  li {
    position: relative;
    padding: 4px 0 4px 14px;
    font-size: 0.72rem;
    font-weight: 700;
    color: #6b4c3a;
    line-height: 1.5;
    border-bottom: 1px dotted #ebe4d8;

    &:last-child {
      border-bottom: none;
    }

    &::before {
      content: '·';
      position: absolute;
      left: 2px;
      color: #c8955c;
      font-weight: 900;
    }
  }

  &.resource li {
    font-size: 0.68rem;
  }
}

.locked-text {
  margin: 8px 0 0;
  font-size: 0.88rem;
  font-weight: 800;
  color: #b5a389;
  letter-spacing: 0.12em;
}

.route-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.ghost-btn,
.outline-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 11px 14px;
  border-radius: 12px;
  font-size: 0.82rem;
  font-weight: 800;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s ease;
}

.ghost-btn {
  border: 2px solid #e4d4ba;
  background: #fcf8f0;
  color: #8c7462;

  &:hover {
    border-color: #d4c2a4;
    color: #5c4738;
  }
}

.outline-btn {
  border: 2px solid #c8955c;
  background: #fffdf8;
  color: #6b4c3a;

  &:hover {
    background: #f4ecdb;
  }
}

.continue-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 12px 18px;
  font-size: 0.9rem;
  margin-left: auto;
}
</style>
