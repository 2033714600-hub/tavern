<template>
  <div class="status-info">
    <div class="date-line">
      <Calendar :size="20" :stroke-width="2.25" />
      <span class="date-text">{{ store.data.世界.星历 }}</span>
    </div>
    <div class="chief-block">
      <label class="chief-avatar-label group">
        <img v-if="ui.chief_avatar" :src="ui.chief_avatar" class="chief-img" alt="" />
        <Footprints v-else :size="24" :stroke-width="2.25" class="chief-icon" />
        <span class="chief-hover">更换</span>
        <input type="file" accept="image/*" class="hidden-input" @change="onChiefAvatar" />
      </label>
      <div class="chief-text">
        <div class="chief-title">{{ user_name }}</div>
        <div class="chief-prestige">威望: {{ store.data.主角.威望 }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Calendar, Footprints } from 'lucide-vue-next';
import { read_image_file, useUiStore } from '../composables/useUiStore';
import { useTavernUser } from '../composables/useTavernUser';
import { useDataStore } from '../store';

const store = useDataStore();
const { user_name } = useTavernUser();
const { ui, set_chief_avatar } = useUiStore();

async function onChiefAvatar(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) {
    return;
  }
  set_chief_avatar(await read_image_file(file));
}
</script>

<style lang="scss" scoped>
.status-info {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 0 0 auto;
  padding-left: 8px;
}

.date-line {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #8c7462;
}

.date-text {
  font-weight: 900;
  font-size: 0.8rem;
  letter-spacing: 0.06em;
  white-space: nowrap;
}

.chief-block {
  display: flex;
  align-items: center;
  gap: 10px;
}

.chief-avatar-label {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #e6b981;
  border: 2px solid #c8955c;
  box-shadow: 0 2px 4px rgba(92, 71, 56, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  cursor: pointer;
  overflow: hidden;
  position: relative;
}

.chief-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.chief-icon {
  color: #634326;
}

.chief-hover {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  color: #fff;
  font-size: 0.62rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.group:hover .chief-hover {
  opacity: 1;
}

.hidden-input {
  display: none;
}

.chief-title {
  font-size: 0.88rem;
  font-weight: 900;
  color: #5c4738;
  line-height: 1.2;
  max-width: 6.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chief-prestige {
  font-size: 0.62rem;
  font-weight: 800;
  color: #e07a5f;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-top: 3px;
}

@media (max-width: 680px) {
  .date-line {
    display: none;
  }
}
</style>
