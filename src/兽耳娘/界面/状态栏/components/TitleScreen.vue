<template>
  <div class="screen-shell">
    <div ref="card_ref" class="screen-card title-card parchment-panel">
      <div class="title-aura" aria-hidden="true" />
      <div class="corner corner-tl" aria-hidden="true" />
      <div class="corner corner-tr" aria-hidden="true" />
      <div class="corner corner-bl" aria-hidden="true" />
      <div class="corner corner-br" aria-hidden="true" />

      <div class="float-deco" aria-hidden="true">
        <Sparkles class="deco spark-1" :size="18" :stroke-width="2" />
        <Star class="deco star-1" :size="14" :stroke-width="2" />
        <PawPrint class="deco paw-1" :size="22" :stroke-width="1.6" />
        <PawPrint class="deco paw-2" :size="16" :stroke-width="1.6" />
      </div>

      <p ref="eyebrow_ref" class="title-eyebrow">坠 落 星 野 · 兽 耳 纪 元</p>

      <h1 ref="title_ref" class="game-title">
        <span v-for="(ch, i) in title_chars" :key="i" class="title-char">{{ ch }}</span>
      </h1>

      <div ref="divider_ref" class="title-divider">
        <span class="divider-gem" />
      </div>

      <p ref="tagline_ref" class="title-tagline">在残骸与篝火之间，带领兽耳娘们重建部落</p>

      <button
        ref="start_ref"
        class="start-btn"
        type="button"
        :disabled="starting"
        @click="on_start"
        @mouseenter="on_btn_enter"
        @mouseleave="on_btn_leave"
      >
        <span class="start-shine" aria-hidden="true" />
        <Tent class="start-icon" :size="22" :stroke-width="2.25" />
        <span class="start-text">{{ starting ? '正在进入……' : '进入营帐' }}</span>
        <ChevronRight class="start-arrow" :size="20" :stroke-width="2.5" />
      </button>

      <p ref="hint_ref" class="title-hint">点击按钮 · 新旅程将自部落篝火燃起</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import gsap from 'gsap';
import { ChevronRight, PawPrint, Sparkles, Star, Tent } from 'lucide-vue-next';

const emit = defineEmits<{ start: [] }>();

const title_chars = '坠星大陆'.split('');
const card_ref = ref<HTMLElement | null>(null);
const eyebrow_ref = ref<HTMLElement | null>(null);
const title_ref = ref<HTMLElement | null>(null);
const divider_ref = ref<HTMLElement | null>(null);
const tagline_ref = ref<HTMLElement | null>(null);
const start_ref = ref<HTMLButtonElement | null>(null);
const hint_ref = ref<HTMLElement | null>(null);
const starting = ref(false);

let float_tl: gsap.core.Timeline | null = null;
let pulse_tl: gsap.core.Tween | null = null;

function on_btn_enter() {
  if (!start_ref.value || starting.value) {
    return;
  }
  gsap.to(start_ref.value, { scale: 1.03, duration: 0.22, ease: 'power2.out' });
}

function on_btn_leave() {
  if (!start_ref.value || starting.value) {
    return;
  }
  gsap.to(start_ref.value, { scale: 1, duration: 0.25, ease: 'power2.out' });
}

async function on_start() {
  if (starting.value) {
    return;
  }
  starting.value = true;
  const btn = start_ref.value;
  const card = card_ref.value;
  if (btn) {
    await gsap.to(btn, { scale: 0.96, duration: 0.1, ease: 'power2.in' });
    await gsap.to(btn, { scale: 1.02, duration: 0.15, ease: 'power2.out' });
  }
  if (card) {
    await gsap.to(card, { opacity: 0, y: -16, duration: 0.38, ease: 'power2.in' });
  }
  emit('start');
}

onMounted(() => {
  const card = card_ref.value;
  const chars = title_ref.value?.querySelectorAll('.title-char');
  const decos = card?.querySelectorAll('.deco');

  gsap.set([eyebrow_ref.value, divider_ref.value, tagline_ref.value, start_ref.value, hint_ref.value], {
    opacity: 0,
    y: 18,
  });
  if (chars?.length) {
    gsap.set(chars, { opacity: 0, y: 28, rotateX: -40 });
  }
  if (decos?.length) {
    gsap.set(decos, { opacity: 0, scale: 0.6 });
  }

  const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
  intro.to(eyebrow_ref.value, { opacity: 1, y: 0, duration: 0.55 }, 0.1);
  if (chars?.length) {
    intro.to(chars, { opacity: 1, y: 0, rotateX: 0, duration: 0.65, stagger: 0.07 }, 0.25);
  }
  intro.to(divider_ref.value, { opacity: 1, y: 0, duration: 0.45, scaleX: 1 }, 0.75);
  intro.to(tagline_ref.value, { opacity: 1, y: 0, duration: 0.5 }, 0.9);
  intro.to(start_ref.value, { opacity: 1, y: 0, duration: 0.55 }, 1.05);
  intro.to(hint_ref.value, { opacity: 1, y: 0, duration: 0.45 }, 1.2);
  if (decos?.length) {
    intro.to(decos, { opacity: 1, scale: 1, duration: 0.5, stagger: 0.08 }, 0.5);
  }

  if (card) {
    float_tl = gsap.timeline({ repeat: -1, yoyo: true });
    float_tl.to(card.querySelector('.deco.spark-1'), { y: -6, rotate: 12, duration: 2.4, ease: 'sine.inOut' }, 0);
    float_tl.to(card.querySelector('.deco.star-1'), { y: 5, rotate: -10, duration: 2.8, ease: 'sine.inOut' }, 0);
    float_tl.to(card.querySelector('.deco.paw-1'), { y: -4, x: 3, rotate: 8, duration: 3.2, ease: 'sine.inOut' }, 0);
    float_tl.to(card.querySelector('.deco.paw-2'), { y: 6, x: -2, rotate: -6, duration: 2.6, ease: 'sine.inOut' }, 0);
  }

  if (start_ref.value) {
    pulse_tl = gsap.to(start_ref.value, {
      boxShadow: '0 6px 0 #5b8266, 0 0 24px rgba(124, 169, 130, 0.45)',
      duration: 1.6,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });
  }
});

onUnmounted(() => {
  float_tl?.kill();
  pulse_tl?.kill();
});
</script>

<style lang="scss" scoped>
.title-card {
  padding: 40px 28px 32px;
  text-align: center;
  overflow: hidden;
}

.title-aura {
  position: absolute;
  top: 72px;
  left: 50%;
  width: 280px;
  height: 140px;
  margin-left: -140px;
  background: radial-gradient(ellipse at center, rgba(200, 149, 92, 0.22) 0%, transparent 72%);
  pointer-events: none;
  animation: auraPulse 4s ease-in-out infinite;
}

@keyframes auraPulse {
  0%,
  100% {
    opacity: 0.55;
    transform: scale(1);
  }

  50% {
    opacity: 1;
    transform: scale(1.06);
  }
}

.corner {
  position: absolute;
  width: 24px;
  height: 24px;
  border: 2px solid rgba(200, 149, 92, 0.55);
  pointer-events: none;
}

.corner-tl {
  top: 12px;
  left: 12px;
  border-right: none;
  border-bottom: none;
  border-radius: 6px 0 0 0;
}

.corner-tr {
  top: 12px;
  right: 12px;
  border-left: none;
  border-bottom: none;
  border-radius: 0 6px 0 0;
}

.corner-bl {
  bottom: 12px;
  left: 12px;
  border-right: none;
  border-top: none;
  border-radius: 0 0 0 6px;
}

.corner-br {
  bottom: 12px;
  right: 12px;
  border-left: none;
  border-top: none;
  border-radius: 0 0 6px 0;
}

.float-deco {
  position: absolute;
  inset: 0;
  pointer-events: none;
  color: #c8955c;
}

.deco {
  position: absolute;
  opacity: 0.65;
}

.spark-1 {
  top: 48px;
  left: 36px;
}

.star-1 {
  top: 56px;
  right: 40px;
  color: #e6b981;
}

.paw-1 {
  bottom: 96px;
  left: 28px;
  opacity: 0.35;
}

.paw-2 {
  bottom: 108px;
  right: 32px;
  opacity: 0.3;
}

.title-eyebrow {
  margin: 0 0 10px;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.32em;
  color: #a88a6d;
}

.game-title {
  margin: 0;
  font-size: 2.6rem;
  font-weight: 900;
  line-height: 1.15;
  color: #4a3b32;
  letter-spacing: 0.1em;
  perspective: 400px;
}

.title-char {
  display: inline-block;
  text-shadow: 0 2px 0 rgba(255, 255, 255, 0.35), 0 4px 12px rgba(92, 71, 56, 0.15);
}

.title-divider {
  width: min(200px, 60%);
  height: 2px;
  margin: 16px auto 14px;
  background: linear-gradient(90deg, transparent, #d4c2a4 20%, #c8955c 50%, #d4c2a4 80%, transparent);
  transform: scaleX(0.4);
  position: relative;
}

.divider-gem {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 10px;
  height: 10px;
  margin: -5px 0 0 -5px;
  background: #e6b981;
  border: 2px solid #c8955c;
  border-radius: 2px;
  transform: rotate(45deg);
  box-shadow: 0 0 10px rgba(200, 149, 92, 0.4);
}

.title-tagline {
  margin: 0 0 24px;
  font-size: 0.84rem;
  font-weight: 700;
  color: #8c7462;
  line-height: 1.65;
  letter-spacing: 0.04em;
  padding: 0 8px;
}

.start-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  max-width: 100%;
  width: 260px;
  padding: 15px 24px;
  border: 2px solid #5b8266;
  border-radius: 16px;
  background: linear-gradient(180deg, #8dbd93 0%, #7ca982 45%, #6a9470 100%);
  color: #fdfbf7;
  font-size: 1.05rem;
  font-weight: 900;
  font-family: inherit;
  letter-spacing: 0.1em;
  cursor: pointer;
  overflow: hidden;
  box-shadow: 0 5px 0 #5b8266, inset 0 1px 0 rgba(255, 255, 255, 0.35);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
  transition: filter 0.2s ease;

  &:disabled {
    cursor: wait;
    filter: saturate(0.85);
  }

  &:active:not(:disabled) {
    transform: translateY(3px);
    box-shadow: 0 2px 0 #5b8266, inset 0 1px 0 rgba(255, 255, 255, 0.25);
  }
}

.start-shine {
  position: absolute;
  top: 0;
  left: -120px;
  width: 80px;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.35), transparent);
  transform: skewX(-18deg);
  animation: shineSweep 3.5s ease-in-out infinite;
}

@keyframes shineSweep {
  0%,
  55% {
    left: -120px;
  }

  100% {
    left: 320px;
  }
}

.start-icon {
  flex-shrink: 0;
}

.start-arrow {
  flex-shrink: 0;
  opacity: 0.85;
  transition: transform 0.2s ease;
}

.start-btn:hover:not(:disabled) .start-arrow {
  transform: translateX(3px);
}

.title-hint {
  margin: 14px 0 0;
  font-size: 0.7rem;
  font-weight: 700;
  color: #b5a389;
  letter-spacing: 0.06em;
}
</style>
