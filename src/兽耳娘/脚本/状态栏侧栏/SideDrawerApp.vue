<template>
  <div class="side-drawer-root" :class="{ 'is-expanded': drawer_open, 'is-collapsed': !drawer_open }">
    <div v-show="drawer_open" class="drawer-backdrop" aria-hidden="true" @click="close_drawer" />

    <button
      v-show="!drawer_open"
      class="collapsed-bar"
      type="button"
      aria-label="打开部落状态栏"
      @click="toggle_drawer"
    >
      <div class="zhuixing-logo" aria-hidden="true">
        <span class="logo-glow" />
        <span class="logo-star">✦</span>
        <span class="logo-text">坠星</span>
      </div>

      <div class="bar-middle">
        <span v-if="generating" class="bar-stat bar-pulse" title="开局生成中">
          <LoaderCircle :size="14" :stroke-width="2.5" />
          <span class="bar-stat-num">…</span>
        </span>
        <template v-else-if="show_metrics">
          <div
            v-for="stat in bar_stats"
            :key="stat.key"
            class="bar-stat"
            :title="stat.title"
          >
            <component :is="stat.icon" :size="14" :stroke-width="2.5" />
            <span class="bar-stat-num">{{ stat.value }}</span>
          </div>
        </template>
        <span v-else class="bar-stat" title="新部落序章">
          <Sparkles :size="14" :stroke-width="2.5" />
          <span class="bar-stat-num">*</span>
        </span>
      </div>

      <span class="bar-expand-hint" aria-hidden="true">
        <ChevronLeft :size="16" :stroke-width="2.75" />
      </span>
    </button>

    <div v-show="drawer_open" ref="panel_ref" class="drawer-panel">
      <button class="drawer-close" type="button" aria-label="收起侧栏" @click="close_drawer">
        <ChevronRight :size="16" :stroke-width="2.5" />
        收起
      </button>
      <div class="drawer-body">
        <App />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import gsap from 'gsap';
import { ChevronLeft, ChevronRight, Clock, Heart, Home, LoaderCircle, Sparkles, Users } from 'lucide-vue-next';
import type { FunctionalComponent } from 'vue';
import App from '../../界面/状态栏/App.vue';
import { useSideDrawer } from '../../界面/状态栏/composables/useSideDrawer';
import { has_game_started } from '../../界面/状态栏/util/gameStarted';
import {
  DRAWER_COLLAPSED_PX,
  sync_drawer_iframe_width,
  sync_drawer_iframe_width_px,
} from '../../界面/状态栏/util/sideDrawerHost';
import { is_opening_generating } from '../../util/openingStatus';
import { useDataStore } from '../../界面/状态栏/store';

const { drawer_open, close_drawer, toggle_drawer } = useSideDrawer();
const store = useDataStore();
const panel_ref = ref<HTMLElement | null>(null);

const generating = computed(() => is_opening_generating());

const camp_has_data = computed(() => {
  const d = store.data;
  return (
    (d.世界?.生存天数 ?? 0) > 0 ||
    Object.keys(d.具名NPC ?? {}).length > 0 ||
    (d.营地?.人口 ?? 0) > 0
  );
});

const show_metrics = computed(() => camp_has_data.value && !generating.value);

const world_time = computed(() => store.data.世界.时间 || '—');
const population = computed(() => store.data.营地.人口);
const cohesion = computed(() => store.data.营地.向心力);
const shelter = computed(() => store.data.营地.生存指标.栖居度);

const bar_stats = computed(() => {
  const stats: { key: string; icon: FunctionalComponent; value: string | number; title: string }[] = [
    { key: 'time', icon: Clock, value: world_time.value, title: `当前时间 ${world_time.value}` },
    { key: 'pop', icon: Users, value: population.value, title: `人口 ${population.value}` },
    { key: 'cohesion', icon: Heart, value: cohesion.value, title: `向心力 ${cohesion.value}` },
    { key: 'shelter', icon: Home, value: shelter.value, title: `栖居度 ${shelter.value}` },
  ];
  return stats;
});

let panel_tween: gsap.core.Tween | null = null;

function animate_panel(open: boolean) {
  sync_drawer_iframe_width(open);
  const panel = panel_ref.value;
  if (!panel) {
    return;
  }
  panel_tween?.kill();
  if (open) {
    gsap.fromTo(
      panel,
      { x: '100%', opacity: 0.72 },
      { x: '0%', opacity: 1, duration: 0.46, ease: 'power3.out' },
    );
  } else {
    panel_tween = gsap.to(panel, {
      x: '100%',
      opacity: 0.72,
      duration: 0.34,
      ease: 'power2.in',
    });
  }
}

watch(
  drawer_open,
  (open, was_open) => {
    if (was_open === undefined && !open) {
      sync_drawer_iframe_width(false, false);
      return;
    }
    nextTick(() => animate_panel(open));
  },
  { immediate: true },
);

onMounted(() => {
  if (has_game_started() || camp_has_data.value) {
    drawer_open.value = false;
    sync_drawer_iframe_width_px(DRAWER_COLLAPSED_PX, false);
    return;
  }
  drawer_open.value = true;
});

watch(
  () => has_game_started(),
  (started, was_started) => {
    if (!started && was_started) {
      drawer_open.value = true;
      return;
    }
    if (started && !was_started && !generating.value) {
      drawer_open.value = false;
    }
  },
);

watch(generating, (active, was_active) => {
  if (active) {
    drawer_open.value = false;
  } else if (!active && was_active && (has_game_started() || camp_has_data.value)) {
    toastr.success('族人已入营，点击侧栏管理部落');
  }
});
</script>

<style lang="scss" scoped>
.side-drawer-root {
  position: relative;
  width: 100%;
  height: 100vh;
  z-index: 1;
  pointer-events: none;
}

.side-drawer-root.is-collapsed {
  width: 48px;
}

.side-drawer-root.is-expanded {
  width: min(680px, 94vw);
}

.drawer-backdrop {
  pointer-events: auto;
  position: fixed;
  inset: 0;
  background: linear-gradient(270deg, rgba(58, 45, 36, 0.22) 0%, rgba(58, 45, 36, 0) 42%);
  z-index: 1;
}

.collapsed-bar {
  pointer-events: auto;
  position: fixed;
  top: 0;
  right: 0;
  width: 48px;
  height: 100vh;
  border: 0;
  border-left: 2px solid #dcd1be;
  background: linear-gradient(180deg, #f9f5ed 0%, #efe6d8 100%);
  color: #5c4738;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px 4px 16px;
  cursor: pointer;
  box-shadow: -4px 0 18px rgba(92, 71, 56, 0.12);
  font-family: 'Nunito', 'Microsoft YaHei', ui-sans-serif, system-ui, sans-serif;
  z-index: 3;
  transition: background 0.25s ease, box-shadow 0.25s ease;

  &:hover {
    background: linear-gradient(180deg, #fffaf2 0%, #f3ebe0 100%);
    box-shadow: -6px 0 22px rgba(92, 71, 56, 0.18);

    .bar-expand-hint {
      color: #5c4738;
      transform: translateX(-2px);
    }
  }
}

.zhuixing-logo {
  position: relative;
  flex: 0 0 auto;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 2px solid #c8955c;
  background: linear-gradient(145deg, #fffaf2 0%, #f0dcc0 55%, #e6c89a 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0;
  box-shadow: 0 2px 6px rgba(92, 71, 56, 0.14);
  overflow: hidden;
}

.logo-glow {
  position: absolute;
  inset: -8px;
  background: radial-gradient(circle at 50% 20%, rgba(255, 220, 160, 0.55), transparent 62%);
  pointer-events: none;
}

.logo-star {
  position: relative;
  z-index: 1;
  font-size: 0.72rem;
  line-height: 1;
  color: #c8955c;
  text-shadow: 0 0 6px rgba(200, 149, 92, 0.45);
}

.logo-text {
  position: relative;
  z-index: 1;
  font-size: 0.52rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  color: #5c4738;
  line-height: 1.1;
  margin-top: 1px;
}

.bar-middle {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  min-height: 0;
  padding: 10px 0;
}

.bar-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  color: #8c7462;
  flex-shrink: 0;
}

.bar-stat-num {
  font-size: 0.62rem;
  font-weight: 900;
  line-height: 1;
  letter-spacing: 0.02em;
}

.bar-expand-hint {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1px dashed #c9b8a6;
  background: #fffaf2;
  color: #a88a6d;
  transition: color 0.2s ease, transform 0.2s ease;
}

.bar-pulse {
  animation: pulse 1.2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.45;
  }
}

.drawer-panel {
  pointer-events: auto;
  position: fixed;
  top: 0;
  right: 0;
  width: min(680px, 94vw);
  height: 100vh;
  background: #f9f5ed;
  border-left: 2px solid #dcd1be;
  box-shadow: -12px 0 40px rgba(92, 71, 56, 0.2);
  display: flex;
  flex-direction: column;
  z-index: 2;
  will-change: transform, opacity;
}

.drawer-close {
  position: absolute;
  top: 10px;
  right: 12px;
  z-index: 30;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 1px solid #c9b8a6;
  background: rgba(255, 250, 242, 0.96);
  color: #6b4c3a;
  border-radius: 999px;
  padding: 4px 12px;
  font-weight: 800;
  font-family: inherit;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(92, 71, 56, 0.12);
  transition: background 0.2s ease, transform 0.2s ease;

  &:hover {
    background: #f4ecdb;
    transform: translateX(2px);
  }
}

.drawer-body {
  flex: 1 1 auto;
  overflow: auto;
  overscroll-behavior: contain;
  width: 100%;
  height: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;

  :deep(.flow-root),
  :deep(.status-root),
  :deep(.status-inner) {
    flex: 1 1 auto;
    min-height: 100%;
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  :deep(.status-card) {
    flex: 1 1 auto;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    padding-top: 0;
    border-radius: 0;
  }

  :deep(.content-area) {
    flex: 1 1 auto;
  }

  :deep(.top-bar) {
    margin-top: 8px;
    margin-right: 78px;
  }

  :deep(.screen-shell) {
    flex: 1 1 auto;
    min-height: 100vh;
    padding-top: 12px;
    box-sizing: border-box;
  }
}
</style>
