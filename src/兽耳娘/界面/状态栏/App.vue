<template>
  <div class="flow-root">
    <Transition v-if="show_title_flow" name="screen-fade" mode="out-in">
      <TitleScreen v-if="phase === 'title'" key="title" @start="enter_tent" />
      <CreationScreen
        v-else-if="phase === 'route'"
        key="route"
        @back="back_to_title"
        @custom="open_custom"
      />
      <CustomStartScreen v-else-if="phase === 'custom'" key="custom" @back="back_to_route" />
      <GameScreen v-else key="game" />
    </Transition>
    <GameScreen v-else key="game-main" />
  </div>
</template>

<script setup lang="ts">
import CreationScreen from './components/CreationScreen.vue';
import CustomStartScreen from './components/CustomStartScreen.vue';
import GameScreen from './components/GameScreen.vue';
import TitleScreen from './components/TitleScreen.vue';
import { useGameFlow } from './composables/useGameFlow';
import { useGameShellMode } from './composables/useGameShellMode';
import { has_game_started } from './util/gameStarted';

const { phase, enter_tent, open_custom, back_to_title, back_to_route } = useGameFlow();
const { opening_ready } = useGameShellMode();

/** 开局变量或具名 NPC 写入后切到 GameScreen（避免卡在「选择路线」） */
const show_title_flow = computed(() => {
  if (opening_ready.value) {
    return false;
  }
  if (has_game_started()) {
    return false;
  }
  return true;
});

watch(
  opening_ready,
  ready => {
    if (ready) {
      phase.value = 'game';
    }
  },
  { immediate: true },
);
</script>

<style lang="scss" scoped>
.flow-root {
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
}

.screen-fade-enter-active,
.screen-fade-leave-active {
  transition: opacity 0.35s ease, transform 0.35s ease;
}

.screen-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.screen-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
