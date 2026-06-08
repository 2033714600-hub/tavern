<template>
  <div class="flow-root">
    <Transition name="screen-fade" mode="out-in">
      <TitleScreen v-if="phase === 'title'" key="title" @start="enter_tent" />
      <CreationScreen
        v-else-if="phase === 'route'"
        key="route"
        @back="back_to_title"
        @custom="open_custom"
        @enter="enter_game"
      />
      <CustomStartScreen v-else-if="phase === 'custom'" key="custom" @back="back_to_route" @enter="enter_game" />
      <GameScreen v-else key="game" />
    </Transition>
  </div>
</template>

<script setup lang="ts">
import CreationScreen from './components/CreationScreen.vue';
import CustomStartScreen from './components/CustomStartScreen.vue';
import GameScreen from './components/GameScreen.vue';
import TitleScreen from './components/TitleScreen.vue';
import { useGameFlow } from './composables/useGameFlow';

const { phase, enter_tent, open_custom, enter_game, back_to_title, back_to_route } = useGameFlow();
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
