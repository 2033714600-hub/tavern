<template>
  <div class="tabs-shell" :class="{ 'can-scroll-left': can_left, 'can-scroll-right': can_right }">
    <button
      v-show="can_left"
      class="scroll-btn scroll-left"
      type="button"
      aria-label="向左滑动"
      @click="scrollBy(-120)"
    >
      <ChevronLeft :size="18" />
    </button>

    <nav ref="tabs_el" class="tabs" @scroll="updateScrollState">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :ref="el => setTabRef(tab.id, el)"
        class="tab-button"
        :class="{ active: model === tab.id }"
        type="button"
        @click.prevent="selectTab(tab.id)"
      >
        <component :is="tab.icon" class="tab-svg" :class="{ pulse: model === tab.id }" :size="20" :stroke-width="2.25" />
        <span class="tab-label">{{ tab.label }}</span>
      </button>
    </nav>

    <button
      v-show="can_right"
      class="scroll-btn scroll-right"
      type="button"
      aria-label="向右滑动"
      @click="scrollBy(120)"
    >
      <ChevronRight :size="18" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
import type { ComponentPublicInstance, FunctionalComponent } from 'vue';

const props = defineProps<{
  tabs: { id: string; label: string; icon: FunctionalComponent }[];
}>();

const model = defineModel<string>({ required: true });

const tabs_el = ref<HTMLElement | null>(null);
const tab_refs = new Map<string, HTMLElement>();
const can_left = ref(false);
const can_right = ref(false);

function setTabRef(id: string, el: Element | ComponentPublicInstance | null) {
  if (el instanceof HTMLElement) {
    tab_refs.set(id, el);
  }
}

function updateScrollState() {
  const el = tabs_el.value;
  if (!el) {
    can_left.value = false;
    can_right.value = false;
    return;
  }
  const max = el.scrollWidth - el.clientWidth;
  can_left.value = el.scrollLeft > 4;
  can_right.value = max > 4 && el.scrollLeft < max - 4;
}

function scrollBy(delta: number) {
  tabs_el.value?.scrollBy({ left: delta, behavior: 'smooth' });
}

/** 仅在标签栏容器内横向滚动，避免 scrollIntoView 带动酒馆聊天楼层跳动 */
function scrollTabIntoView(id: string) {
  const tab = tab_refs.get(id);
  const container = tabs_el.value;
  if (!tab || !container) return;

  const tab_rect = tab.getBoundingClientRect();
  const container_rect = container.getBoundingClientRect();
  const padding = 8;

  if (tab_rect.left < container_rect.left) {
    container.scrollLeft -= container_rect.left - tab_rect.left + padding;
  } else if (tab_rect.right > container_rect.right) {
    container.scrollLeft += tab_rect.right - container_rect.right + padding;
  }
}

function selectTab(id: string) {
  model.value = id;
  nextTick(() => {
    scrollTabIntoView(id);
    updateScrollState();
  });
}

watch(model, id => {
  nextTick(() => {
    scrollTabIntoView(id);
    updateScrollState();
  });
});

onMounted(() => {
  nextTick(() => {
    scrollTabIntoView(model.value);
    updateScrollState();
  });
  window.addEventListener('resize', updateScrollState);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateScrollState);
});

watch(
  () => props.tabs.length,
  () => nextTick(updateScrollState),
);
</script>

<style lang="scss" scoped>
.tabs-shell {
  position: relative;
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 2px;

  &.can-scroll-left .tabs {
    mask-image: linear-gradient(90deg, transparent 0, #000 28px, #000 calc(100% - 28px), transparent 100%);
  }

  &.can-scroll-right:not(.can-scroll-left) .tabs {
    mask-image: linear-gradient(90deg, #000 0, #000 calc(100% - 28px), transparent 100%);
  }
}

.tabs {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  align-items: center;
  gap: 4px;
  flex-wrap: nowrap;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding: 2px 4px;

  &::-webkit-scrollbar {
    display: none;
  }
}

.scroll-btn {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border: 1px solid #d4c2a4;
  border-radius: 8px;
  background: #fcf8f0;
  color: #8c7462;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  transition: background 0.15s;

  &:hover {
    background: #e4d4ba;
    color: #5c4738;
  }
}

.tab-button {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  padding: 10px 14px;
  border: 2px solid transparent;
  border-radius: 12px;
  background: transparent;
  color: #8c7462;
  font-family: inherit;
  font-size: 0.84rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.tab-button:hover {
  background: #e4d4ba;
  color: #6b4c3a;
}

.tab-button.active {
  background: #7ca982;
  color: #fff;
  border-color: #5b8266;
  box-shadow: 0 3px 8px rgba(91, 130, 102, 0.35);
  transform: scale(1.02);
}

.tab-svg {
  margin-right: 8px;
  flex-shrink: 0;
}

.tab-svg.pulse {
  animation: iconPulse 2s ease-in-out infinite;
}

.tab-label {
  line-height: 1;
}

@keyframes iconPulse {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.65;
  }
}

@media (max-width: 520px) {
  .tab-button {
    padding: 8px 10px;
    font-size: 0.76rem;
  }

  .tab-svg {
    margin-right: 5px;
  }

  .scroll-btn {
    width: 24px;
    height: 24px;
  }
}
</style>
