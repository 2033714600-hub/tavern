<template>
  <div v-if="!ready" class="game-loading parchment-panel">
    <PawPrint class="loading-paw" :size="36" :stroke-width="2" />
    <p>{{ error || '正在同步部落档案……' }}</p>
  </div>
  <div v-else class="status-root">
    <div class="paw-layer" aria-hidden="true">
      <PawPrint class="paw paw-1" :size="140" :stroke-width="1.2" />
      <PawPrint class="paw paw-2" :size="90" :stroke-width="1.2" />
      <PawPrint class="paw paw-3" :size="120" :stroke-width="1.2" />
      <PawPrint class="paw paw-4" :size="70" :stroke-width="1.2" />
    </div>

    <div class="status-inner">
      <div class="status-card">
        <header class="top-bar parchment-panel">
          <TabNav v-model="active_tab" :tabs="tabs" />
          <WorldHeader class="top-user" />
        </header>

        <div class="content-area fade-in">
          <div class="content-wrap">
            <TerminalPanel v-if="active_tab === 'terminal'" />
            <MembersPanel v-else-if="active_tab === 'members'" />
            <CampPanel v-else-if="active_tab === 'camp'" />
            <DiplomacyPanel v-else-if="active_tab === 'world'" />
            <WorkQueuePanel v-else-if="active_tab === 'work'" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Flame, Map, PawPrint, Pickaxe, Tent, Users } from 'lucide-vue-next';
import type { FunctionalComponent } from 'vue';
import { useMvuReady } from '../composables/useMvuReady';
import CampPanel from './CampPanel.vue';
import DiplomacyPanel from './DiplomacyPanel.vue';
import MembersPanel from './MembersPanel.vue';
import TabNav from './TabNav.vue';
import TerminalPanel from './TerminalPanel.vue';
import WorkQueuePanel from './WorkQueuePanel.vue';
import WorldHeader from './WorldHeader.vue';

const { ready, error } = useMvuReady();

const tabs: { id: string; label: string; icon: FunctionalComponent }[] = [
  { id: 'terminal', label: '部落篝火', icon: Flame },
  { id: 'members', label: '兽耳娘', icon: Users },
  { id: 'camp', label: '部落建设', icon: Tent },
  { id: 'world', label: '广阔大地', icon: Map },
  { id: 'work', label: '工作队列', icon: Pickaxe },
];

const active_tab = useLocalStorage<string>('status_bar:兽耳娘:active_tab', 'terminal');
</script>

<style lang="scss" scoped>
.game-loading {
  width: 420px;
  margin: 32px auto;
  padding: 28px 24px;
  text-align: center;
  font-weight: 800;
  color: #6b4c3a;

  p {
    margin: 12px 0 0;
    font-size: 0.92rem;
  }
}

.loading-paw {
  color: #c8955c;
  animation: pawSpin 1.4s ease-in-out infinite;
}

@keyframes pawSpin {
  0%,
  100% {
    transform: rotate(-8deg) scale(1);
    opacity: 0.7;
  }

  50% {
    transform: rotate(8deg) scale(1.08);
    opacity: 1;
  }
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 10px 10px 12px;
  margin: 14px 14px 0;
  flex-wrap: nowrap;
  overflow: visible;
}

:deep(.top-user) {
  flex-shrink: 0;
}

.content-area {
  padding: 0 14px 22px;
}

.content-wrap {
  max-width: 56rem;
  margin: 0 auto;
  min-width: 0;
  width: 100%;
}

.paw-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  opacity: 0.1;
  z-index: 0;
  color: #5c4738;
}

.paw {
  position: absolute;
}

.paw-1 {
  top: -40px;
  left: -40px;
  transform: rotate(45deg);
  opacity: 0.5;
}

.paw-2 {
  top: 140px;
  left: 100px;
  transform: rotate(60deg);
  opacity: 0.4;
}

.paw-3 {
  bottom: 30px;
  right: 24px;
  transform: rotate(-12deg);
  opacity: 0.5;
}

.paw-4 {
  top: 28%;
  right: 22%;
  transform: rotate(80deg);
  opacity: 0.6;
}
</style>
