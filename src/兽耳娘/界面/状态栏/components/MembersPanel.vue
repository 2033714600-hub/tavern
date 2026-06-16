<template>
  <div class="panel-page">
    <div class="member-sub-tabs">
      <button
        class="sub-tab"
        :class="{ active: member_tab === 'camp' }"
        type="button"
        @click="member_tab = 'camp'"
      >
        营地
      </button>
      <button
        class="sub-tab cubs-tab"
        :class="{ active: member_tab === 'cubs' }"
        type="button"
        @click="member_tab = 'cubs'"
      >
        幼崽
      </button>
      <button
        class="sub-tab"
        :class="{ active: member_tab === 'unrecruited' }"
        type="button"
        @click="member_tab = 'unrecruited'"
      >
        未收入
      </button>
    </div>

    <div v-if="member_tab === 'cubs'" class="cub-rule-banner">
      <p class="cub-rule-label">团宠守则</p>
      <p class="cub-rule-text">{{ formatUserText(CUB_GROUP_PET_RULE) }}</p>
    </div>

    <div v-if="list_empty" class="empty-hint">{{ empty_hint }}</div>
    <div v-else class="members-layout parchment-panel">
      <aside class="member-sidebar scroll-area">
        <button
          v-for="name in sorted_names"
          :key="name"
          class="sidebar-item"
          :class="{ active: selected_name === name }"
          type="button"
          @click="selected_name = name"
        >
          <div class="sidebar-avatar">
            <img v-if="get_member_avatar(name)" :src="get_member_avatar(name)" class="avatar-img" :alt="name" />
            <template v-else>
              <Footprints class="avatar-bg-icon" :size="28" />
              <span class="avatar-letter">{{ name.charAt(0) }}</span>
            </template>
          </div>
          <div class="sidebar-meta">
            <span class="sidebar-name">{{ name }}</span>
            <span v-if="sidebar_npc(name)?.种族" class="sidebar-race">{{ sidebar_npc(name)?.种族 }}</span>
            <div v-if="member_tab === 'camp' && camp_npc(name)" class="sidebar-stats">
              <span class="loyal" title="忠诚度（-100~100）">
                <Heart :size="14" />
                <span class="stat-label">忠诚</span>
                {{ camp_npc(name)!.忠诚度 }}
              </span>
              <span class="mood" title="好感度">
                <Smile :size="14" />
                <span class="stat-label">好感</span>
                {{ camp_npc(name)!.好感度 }}
              </span>
            </div>
            <div v-else-if="member_tab === 'cubs' && cub_entry(name)" class="sidebar-stats cubs-sidebar-stats">
              <span class="cub-mother" title="母亲">
                <Heart :size="14" />
                {{ cub_entry(name)!.母亲 || '未知' }}
              </span>
              <span class="cub-age" title="年龄（生存天数）">{{ cub_age_label(cub_entry(name)!) }}</span>
            </div>
            <div v-else-if="member_tab === 'unrecruited' && unrecruited_npc(name)" class="sidebar-stats">
              <span class="mood" title="好感度">
                <Smile :size="14" />
                <span class="stat-label">好感</span>
                {{ unrecruited_npc(name)!.好感度 }}
              </span>
            </div>
          </div>
        </button>
      </aside>

      <main v-if="member_tab === 'camp' && selected_camp_npc" class="member-detail scroll-area">
        <button class="expel-btn" type="button" title="驱逐出部落" @click="expelMember(selected_name)">
          <LogOut :size="20" />
        </button>

        <div class="detail-head">
          <label class="avatar-label group-avatar">
            <img
              v-if="get_member_avatar(selected_name)"
              :src="get_member_avatar(selected_name)"
              class="avatar-img"
              :alt="selected_name"
            />
            <template v-else>
              <Footprints class="avatar-bg-icon" :size="48" />
              <span class="avatar-letter lg">{{ selected_name.charAt(0) }}</span>
            </template>
            <span class="avatar-hover">更换</span>
            <input type="file" accept="image/*" class="hidden-input" @change="onMemberAvatar(selected_name, $event)" />
          </label>
          <div class="detail-meta">
            <h3 class="npc-name">
              {{ selected_name }}
              <span v-if="selected_camp_npc.种族" class="npc-race">{{ selected_camp_npc.种族 }}</span>
            </h3>
            <div class="npc-role-row">
              <p v-if="selected_camp_npc.职务" class="npc-role">{{ selected_camp_npc.职务 }}</p>
              <span
                class="npc-grade"
                :class="npc_grade_class(resolve_npc_grade(selected_camp_npc.档位, selected_camp_npc.技能))"
              >
                {{ resolve_npc_grade(selected_camp_npc.档位, selected_camp_npc.技能) }}
              </span>
              <p v-if="pregnancy_label(selected_camp_npc)" class="npc-pregnancy">{{ pregnancy_label(selected_camp_npc) }}</p>
            </div>
            <div class="npc-stats">
              <span class="loyal" title="忠诚度（-100~100）">
                <Heart :size="16" />
                <span class="stat-label">忠诚</span>
                {{ selected_camp_npc.忠诚度 }}
              </span>
              <span class="mood" title="好感度">
                <Smile :size="16" />
                <span class="stat-label">好感</span>
                {{ selected_camp_npc.好感度 }}/100
              </span>
              <span class="stamina" title="体力">
                <Zap :size="16" />
                <span class="stat-label">体力</span>
                {{ selected_camp_npc.体力 }}/100
              </span>
            </div>
          </div>
        </div>

        <div class="npc-info">
          <div class="info-line">
            <MapPin :size="18" class="info-icon" />
            <span>{{ formatUserText(selected_camp_npc.当前位置) }}</span>
          </div>
          <div class="info-line">
            <Bone :size="18" class="info-icon" />
            <span>{{ selected_camp_npc.当前任务 || '待命' }}</span>
          </div>
          <div class="info-line">
            <Activity :size="18" class="info-icon" />
            <span>{{ selected_camp_npc.状态 }} · {{ selected_camp_npc.心情 }}</span>
          </div>
        </div>

        <div class="skill-section">
          <p class="skill-section-title">技能点数</p>
          <div v-for="key in SKILL_KEYS" :key="key" class="skill-row">
            <component :is="skill_icon(key)" class="skill-icon" :size="16" />
            <span class="skill-label">{{ key }}</span>
            <div class="skill-bar-track">
              <div class="skill-bar-fill" :class="'skill-' + key" :style="{ width: skill_value(selected_camp_npc, key, selected_name) + '%' }" />
            </div>
            <span class="skill-value" :title="skill_bonus_hint(key, skill_value(selected_camp_npc, key, selected_name))">
              {{ skill_value(selected_camp_npc, key, selected_name) }}
            </span>
          </div>
        </div>

        <div class="thought-box">
          <p class="thought-box-label">剧情心里话</p>
          <MessageCircle :size="20" class="thought-bubble" />
          <p class="thought-text">"{{ plot_thought_text(selected_camp_npc.当前想法) }}"</p>
        </div>

        <button class="tribal-button interact-btn" type="button" @click="openInteract(selected_name)">
          <PawPrint :size="18" />
          与兽耳娘互动
        </button>
      </main>

      <main v-else-if="member_tab === 'cubs' && selected_cub" class="member-detail scroll-area cubs-detail">
        <div class="detail-head">
          <div class="cub-avatar-placeholder">
            <Baby :size="48" class="cub-avatar-icon" />
            <span class="avatar-letter lg">{{ selected_name.charAt(0) }}</span>
          </div>
          <div class="detail-meta">
            <h3 class="npc-name cubs-name">
              {{ selected_name }}
              <span v-if="selected_cub.种族" class="npc-race cub-race">{{ selected_cub.种族 }}</span>
            </h3>
            <p class="npc-role cub-tag">营地共同的希望</p>
            <div class="npc-stats">
              <span class="cub-stat-pink" title="母亲">
                <Heart :size="16" />
                <span class="stat-label">母亲</span>
                {{ selected_cub.母亲 || '未记录' }}
              </span>
              <span class="cub-stat-pink" title="年龄">
                <Calendar :size="16" />
                <span class="stat-label">年龄</span>
                {{ cub_age_label(selected_cub) }}
              </span>
              <span class="cub-stat-pink" title="健康状态">
                <Activity :size="16" />
                <span class="stat-label">状态</span>
                {{ selected_cub.状态 || '健康' }}
              </span>
            </div>
          </div>
        </div>

        <div class="npc-info">
          <div class="info-line">
            <MapPin :size="18" class="info-icon" />
            <span>火塘边 / 窝棚内（全营地共育看护）</span>
          </div>
          <div class="info-line">
            <Baby :size="18" class="info-icon cubs-icon" />
            <span>{{ cub_growth_hint(selected_cub.年龄) }}</span>
          </div>
        </div>

        <div class="cub-growth-box">
          <p class="cub-growth-label">生长状态</p>
          <p class="cub-growth-text">{{ cub_growth_status_text(selected_cub) }}</p>
        </div>
      </main>

      <main v-else-if="member_tab === 'unrecruited' && selected_unrecruited_npc" class="member-detail scroll-area">
        <div class="detail-head">
          <div class="avatar-label group-avatar readonly-avatar">
            <img
              v-if="get_member_avatar(selected_name)"
              :src="get_member_avatar(selected_name)"
              class="avatar-img"
              :alt="selected_name"
            />
            <template v-else>
              <Footprints class="avatar-bg-icon" :size="48" />
              <span class="avatar-letter lg">{{ selected_name.charAt(0) }}</span>
            </template>
          </div>
          <div class="detail-meta">
            <h3 class="npc-name">
              {{ selected_name }}
              <span v-if="selected_unrecruited_npc.种族" class="npc-race">{{ selected_unrecruited_npc.种族 }}</span>
            </h3>
            <div class="npc-role-row">
              <p class="npc-role muted">尚未加入营地</p>
              <span
                class="npc-grade"
                :class="npc_grade_class(resolve_npc_grade(selected_unrecruited_npc.档位, selected_unrecruited_npc.技能))"
              >
                {{ resolve_npc_grade(selected_unrecruited_npc.档位, selected_unrecruited_npc.技能) }}
              </span>
            </div>
            <div class="npc-stats">
              <span class="mood" title="好感度">
                <Smile :size="16" />
                <span class="stat-label">好感</span>
                {{ selected_unrecruited_npc.好感度 }}/100
              </span>
            </div>
          </div>
        </div>

        <div class="npc-info">
          <div class="info-line">
            <MapPin :size="18" class="info-icon" />
            <span>{{ formatUserText(selected_unrecruited_npc.当前位置) }}</span>
          </div>
          <div class="info-line">
            <Activity :size="18" class="info-icon" />
            <span>{{ selected_unrecruited_npc.状态 }} · {{ selected_unrecruited_npc.心情 }}</span>
          </div>
        </div>

        <div class="skill-section">
          <p class="skill-section-title">技能点数</p>
          <div v-for="key in SKILL_KEYS" :key="key" class="skill-row">
            <component :is="skill_icon(key)" class="skill-icon" :size="16" />
            <span class="skill-label">{{ key }}</span>
            <div class="skill-bar-track">
              <div class="skill-bar-fill" :class="'skill-' + key" :style="{ width: skill_value(selected_unrecruited_npc, key, selected_name) + '%' }" />
            </div>
            <span class="skill-value" :title="skill_bonus_hint(key, skill_value(selected_unrecruited_npc, key, selected_name))">
              {{ skill_value(selected_unrecruited_npc, key, selected_name) }}
            </span>
          </div>
        </div>

        <div class="thought-box">
          <p class="thought-box-label">剧情心里话</p>
          <MessageCircle :size="20" class="thought-bubble" />
          <p class="thought-text">"{{ plot_thought_text(selected_unrecruited_npc.当前想法) }}"</p>
        </div>

        <button class="tribal-button interact-btn" type="button" @click="inviteMember(selected_name)">
          <PawPrint :size="18" />
          邀请入营
        </button>
      </main>
    </div>

    <div v-if="show_interact && active_npc" class="modal-overlay" @click.self="closeInteract">
      <div class="parchment-panel modal-panel interact-modal">
        <ModalClose @click="closeInteract" />
        <div class="interact-head">
          <label class="interact-avatar-label group-avatar">
            <img
              v-if="get_member_avatar(active_name)"
              :src="get_member_avatar(active_name)"
              class="interact-avatar-img"
              :alt="active_name"
            />
            <div v-else class="interact-avatar-placeholder">
              <Footprints :size="60" class="placeholder-icon" />
              <span>{{ active_name.charAt(0) }}</span>
            </div>
            <span class="avatar-hover">更换</span>
            <input type="file" accept="image/*" class="hidden-input" @change="onMemberAvatar(active_name, $event)" />
          </label>
          <h3>互动: {{ active_name }}</h3>
          <p class="interact-race">{{ active_npc.种族 }}</p>

          <div class="interact-panel">
            <div class="gaze-box">
              <div class="gaze-row">
                <span class="gaze-label">动作</span>
                <span class="gaze-text">{{ gaze_field_text(active_npc?.对视时?.动作, active_npc) }}</span>
              </div>
              <div class="gaze-row">
                <span class="gaze-label">表情</span>
                <span class="gaze-text">{{ gaze_field_text(active_npc?.对视时?.表情, active_npc) }}</span>
              </div>
              <div class="gaze-thought">
                <span class="gaze-thought-label">注视心声</span>
                <span class="gaze-quote-mark">"</span>
                <p>{{ gaze_thought_text(active_npc) }}</p>
                <span class="gaze-quote-mark end">"</span>
              </div>
            </div>
            <div class="interact-grid">
              <button class="tribal-button" type="button" @click="doInteract('梳毛')">梳毛</button>
              <button class="tribal-button-alt" type="button" @click="doInteract('抱抱')">抱抱</button>
              <button class="tribal-button-belly" type="button" @click="doInteract('摸肚皮')">摸肚皮</button>
              <button class="tribal-button" type="button" @click="openFeedModal">投喂</button>
              <button class="breed-btn" type="button" @click="doInteract('请求繁衍')">
                <span class="heart-badge">
                  <Heart class="heart-icon" :size="18" fill="currentColor" :stroke-width="2" />
                </span>
                请求繁衍
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="show_feed_modal" class="modal-overlay feed-overlay" @click.self="show_feed_modal = false">
      <div class="parchment-panel modal-panel feed-modal">
        <ModalClose @click="show_feed_modal = false" />
        <div class="modal-head">
          <Package :size="28" class="accent green" />
          <h3>选择食物</h3>
        </div>
        <p class="feed-hint">从部落储物仓选取食物，投喂给 {{ active_name }}</p>
        <div v-if="feed_items.length === 0" class="empty-hint">储物仓里没有可投喂的食物</div>
        <div v-else class="feed-list">
          <button
            v-for="item in feed_items"
            :key="item.name"
            class="feed-item-btn"
            type="button"
            @click="confirmFeed(item.name)"
          >
            <span class="feed-item-name">{{ item.name }}</span>
            <span class="feed-item-meta">×{{ item.qty }}</span>
            <span v-if="item.desc" class="feed-item-desc">{{ item.desc }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import _ from 'lodash';
import {
  Activity,
  Baby,
  Bone,
  Calendar,
  Footprints,
  Heart,
  LogOut,
  MapPin,
  MessageCircle,
  PawPrint,
  Package,
  Smile,
  Swords,
  Target,
  Leaf,
  Zap,
} from 'lucide-vue-next';
import type { Schema } from '../../../schema';
import { CORE_NPC_SKILLS } from '../../../constants/coreNpcSkills';
import { pregnancy_display_label } from '../constants/pregnancy';
import {
  SKILL_KEYS,
  skill_bonus_hint,
  type SkillKey,
} from '../constants/npcSkills';
import { useConfirm } from '../composables/useConfirm';
import { runUserAction } from '../composables/useGameActions';
import { useTavernUser } from '../composables/useTavernUser';
import { read_image_file, useUiStore } from '../composables/useUiStore';
import { useDataStore } from '../store';
import {
  CUB_GROUP_PET_RULE,
  cubGrowthStatus,
  cubRaceMatchesMother,
  inferCubRaceFromMother,
} from '../util/cubGrowth';
import { expel_named_npc } from '../util/campVariableSync';
import { format_beast_calendar } from '../util/beastCalendar';
import { listFeedableWarehouseItems } from '../util/feedFood';
import { npc_grade_class, resolve_npc_grade } from '../util/npcGrade';
import ModalClose from './ModalClose.vue';

const store = useDataStore();
const { confirm } = useConfirm();
const { user_name } = useTavernUser();
const { get_member_avatar, set_member_avatar } = useUiStore();

const NAMED_ORDER = ['林', '白', '春', '菊'] as const;

type MemberTab = 'camp' | 'cubs' | 'unrecruited';

const member_tab = ref<MemberTab>('camp');
const selected_name = ref('');
const show_interact = ref(false);
const show_feed_modal = ref(false);
const active_name = ref('');

const feed_items = computed(() => listFeedableWarehouseItems(store.data.营地.物品栏));

function sort_npc_names(names: string[]) {
  return [...names].sort((a, b) => {
    const ia = NAMED_ORDER.indexOf(a as (typeof NAMED_ORDER)[number]);
    const ib = NAMED_ORDER.indexOf(b as (typeof NAMED_ORDER)[number]);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b, 'zh');
  });
}

const sorted_names = computed(() => {
  if (member_tab.value === 'camp') {
    return sort_npc_names(_.keys(store.data.具名NPC));
  }
  if (member_tab.value === 'cubs') {
    return sort_cub_names(_.keys(store.data.幼崽));
  }
  return sort_npc_names(_.keys(store.data.未收入兽耳娘));
});

const list_empty = computed(() => sorted_names.value.length === 0);

const empty_hint = computed(() => {
  if (member_tab.value === 'camp') {
    return '营地里还没有其他人呢';
  }
  if (member_tab.value === 'cubs') {
    return '还没有幼崽呢';
  }
  return '还没有遇到未收入的兽耳娘';
});

const selected_camp_npc = computed(() =>
  selected_name.value ? store.data.具名NPC[selected_name.value] : null,
);

const selected_unrecruited_npc = computed(() =>
  selected_name.value ? store.data.未收入兽耳娘[selected_name.value] : null,
);

const selected_cub = computed(() => (selected_name.value ? store.data.幼崽[selected_name.value] : null));

const active_npc = computed(() =>
  active_name.value ? store.data.具名NPC[active_name.value] : null,
);

function camp_npc(name: string) {
  return store.data.具名NPC[name];
}

function unrecruited_npc(name: string) {
  return store.data.未收入兽耳娘[name];
}

function cub_entry(name: string) {
  return store.data.幼崽[name];
}

function sort_cub_names(names: string[]) {
  return [...names].sort((a, b) => {
    const age_a = store.data.幼崽[a]?.年龄 ?? 0;
    const age_b = store.data.幼崽[b]?.年龄 ?? 0;
    if (age_a !== age_b) {
      return age_b - age_a;
    }
    return a.localeCompare(b, 'zh');
  });
}

function cub_age_label(cub: Schema['幼崽'][string]) {
  const days = cub.年龄 ?? 0;
  if (days <= 0) {
    return '新生';
  }
  if (days < 30) {
    return `${days}天`;
  }
  if (days < 365) {
    return `约${Math.floor(days / 30)}月`;
  }
  const years = Math.floor(days / 365);
  return `约${years}岁`;
}

function cub_growth_hint(age_days: number) {
  if (age_days < 365) {
    return '异星血脉加速生长：约3年可达人类10岁体格与智力';
  }
  if (age_days < 365 * 12) {
    return '正处于快速成长期，全营地共同教导生存技能';
  }
  return '已接近成熟期，体格与智力远超纯血原住民同龄者';
}

function cub_growth_status_text(cub: Schema['幼崽'][string]) {
  return formatUserText(cubGrowthStatus(cub, store.data.世界.生存天数));
}

function sync_cub_races() {
  for (const [name, cub] of _.toPairs(store.data.幼崽)) {
    const mother = cub.母亲?.trim();
    if (!mother) continue;
    const expected = inferCubRaceFromMother(mother, store.data.具名NPC);
    if (!expected) continue;
    if (!cubRaceMatchesMother(cub.种族, mother, store.data.具名NPC)) {
      cub.种族 = expected;
    }
  }
}

watch(() => [store.data.幼崽, store.data.具名NPC], sync_cub_races, { deep: true, immediate: true });

function sidebar_npc(name: string) {
  if (member_tab.value === 'camp') {
    return camp_npc(name);
  }
  if (member_tab.value === 'cubs') {
    return cub_entry(name);
  }
  return unrecruited_npc(name);
}

watch(
  [member_tab, sorted_names],
  ([, names]) => {
    if (!names.length) {
      selected_name.value = '';
      return;
    }
    if (!names.includes(selected_name.value)) {
      selected_name.value = names[0];
    }
  },
  { immediate: true },
);

type NpcWithSkills = { 技能?: Schema['具名NPC'][string]['技能'] };

function skill_value(npc: NpcWithSkills | null, key: SkillKey, name = '') {
  const raw = npc?.技能?.[key];
  if (raw != null && raw > 0) return _.clamp(raw, 0, 100);
  const fallback = name ? CORE_NPC_SKILLS[name]?.[key] : undefined;
  if (fallback != null) return _.clamp(fallback, 0, 100);
  return _.clamp(raw ?? 0, 0, 100);
}

function skill_icon(key: SkillKey) {
  const icons = { 狩猎: Target, 战斗: Swords, 采集: Leaf, 后勤: Package };
  return icons[key];
}

function formatUserText(text: string) {
  return text.replace(/<user>/gi, user_name.value).replace(/\{\{user\}\}/gi, user_name.value);
}

/** 对视心声应为第二人称「你」，纠正 AI 误写的第三人称指玩家 */
function normalizeGazeVoice(text: string) {
  let t = formatUserText(text);
  t = t.replace(/(?<![这那哪对向跟和与把被让给])他(?=[要会想想怎为是在还么])/g, '你');
  t = t.replace(/(?<![这那哪对向跟和与把被让给])她(?=[要会想想怎为是在还么])/g, '你');
  return t;
}

function pregnancy_label(npc: Schema['具名NPC'][string] | null) {
  return pregnancy_display_label(npc?.孕期);
}

/** 详情页：当前剧情中的内心独白（【当前想法】） */
function plot_thought_text(thought: string | undefined) {
  const t = thought?.trim();
  if (!t || t === '无') {
    return '暂无记录——请由 AI 在剧情推进时写入【当前想法】';
  }
  return formatUserText(t);
}

/** 互动页：时间暂停态，读取【对视时】（与【当前想法】成对由 AI 写入） */
function gaze_thought_text(npc: Schema['具名NPC'][string] | null) {
  const t = npc?.对视时?.心里话?.trim();
  if (!t) {
    return '暂无记录——须与【当前想法】一同由 AI 在正文输出时写入【对视时.心里话】';
  }
  return normalizeGazeVoice(t);
}

function gaze_field_text(text: string | undefined, npc: Schema['具名NPC'][string] | null) {
  const t = text?.trim();
  if (t) {
    return normalizeGazeVoice(t);
  }
  if (npc?.对视时?.心里话?.trim()) {
    return '（未写入）';
  }
  return '（暂无）';
}

async function onMemberAvatar(name: string, e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  set_member_avatar(name, await read_image_file(file));
}

function openInteract(name: string) {
  active_name.value = name;
  show_interact.value = true;
}

function closeInteract() {
  show_interact.value = false;
  show_feed_modal.value = false;
}

function openFeedModal() {
  if (!feed_items.value.length) {
    toastr.warning('储物仓里没有可投喂的食物');
    return;
  }
  show_feed_modal.value = true;
}

async function confirmFeed(foodName: string) {
  await runUserAction(`[与${active_name.value}互动] 投喂·${foodName}`, () => {
    const item = store.data.营地.物品栏[foodName];
    if (!item || item.数量 <= 0) {
      return;
    }
    item.数量 -= 1;
    if (item.数量 <= 0) {
      delete store.data.营地.物品栏[foodName];
    }
  });
  show_feed_modal.value = false;
  closeInteract();
}

async function doInteract(action: string) {
  await runUserAction(`[与${active_name.value}互动] ${action}`, () => {});
  closeInteract();
}

async function expelMember(name: string) {
  const ok = await confirm({
    title: '驱逐族人',
    message: `确定将「${name}」驱逐出部落吗？\n此操作不可轻易撤销，其好感与忠诚将归零。`,
    confirmText: '确认驱逐',
    danger: true,
  });
  if (!ok) return;
  await runUserAction(`[驱逐族人] ${name}`, () => {
    if (!expel_named_npc(store.data, name)) {
      toastr.error('未找到该族人');
    }
  });
}

async function inviteMember(name: string) {
  await runUserAction(`[邀请${name}入营]`, () => {});
}
</script>

<style lang="scss" scoped>
.panel-page {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
  width: 100%;
}

.title-icon.green {
  color: #7ca982;
}

.member-sub-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 4px;
}

.sub-tab {
  flex: 1;
  padding: 10px 16px;
  border: 2px solid #e4d4ba;
  border-radius: 12px;
  background: #fcf8f0;
  color: #6b5a42;
  font-family: inherit;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, color 0.15s;

  &:hover {
    background: #fffdf8;
    border-color: #d4c2a4;
  }

  &.active {
    background: #e8f0e4;
    border-color: #7ca982;
    color: #4a6b4f;
  }

  &.cubs-tab {
    color: #d46d8f;

    &:hover {
      border-color: #e8a0b8;
    }

    &.active {
      background: #fce8ef;
      border-color: #e8789a;
      color: #c94d73;
    }
  }
}

.cubs-sidebar-stats {
  color: #d46d8f;
  font-size: 0.68rem;
  font-weight: 800;
}

.cub-mother,
.cub-age {
  display: flex;
  align-items: center;
  gap: 4px;
}

.cubs-name {
  color: #c94d73;
}

.cub-race {
  background: #fce8ef;
  border-color: #e8a0b8;
  color: #b84a6a;
}

.cub-tag {
  color: #e8789a !important;
}

.cub-stat-pink {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #e8789a;
}

.cub-avatar-placeholder {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  border: 4px solid #e8789a;
  background: #fce8ef;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-shrink: 0;

  .cub-avatar-icon {
    position: absolute;
    color: #f0b8c8;
    opacity: 0.55;
  }

  .avatar-letter {
    z-index: 1;
    color: #c94d73;
  }
}

.cubs-icon {
  color: #e8789a;
}

.cub-rule-banner {
  margin: -8px 0 4px;
  padding: 12px 14px;
  border: 2px dashed #e8a0b8;
  border-radius: 14px;
  background: #fff8fa;
}

.cub-rule-label {
  margin: 0 0 6px;
  font-size: 0.72rem;
  font-weight: 900;
  color: #e8789a;
  letter-spacing: 0.06em;
}

.cub-rule-text {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 700;
  color: #8c5a6a;
  line-height: 1.55;
}

.cub-growth-box {
  margin-top: 16px;
  padding: 14px 16px;
  border: 2px dashed #e8a0b8;
  border-radius: 14px;
  background: #fff8fa;
}

.cub-growth-label {
  margin: 0 0 8px;
  font-size: 0.72rem;
  font-weight: 900;
  color: #e8789a;
  letter-spacing: 0.06em;
}

.cub-growth-text {
  margin: 0;
  font-size: 0.82rem;
  font-weight: 700;
  color: #8c5a6a;
  line-height: 1.55;
}

.readonly-avatar {
  cursor: default;
}

.npc-role.muted {
  color: #9a8b72;
  font-style: italic;
}

.skill-section {
  margin-top: 4px;
  padding: 12px;
  border: 2px dashed #e4d4ba;
  border-radius: 12px;
  background: #faf6ee;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skill-section-title {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: #6b5a42;
}

.skill-row {
  display: grid;
  grid-template-columns: 18px 36px 1fr 32px;
  align-items: center;
  gap: 6px;
}

.skill-icon {
  color: #8a7a62;
}

.skill-label {
  font-size: 13px;
  color: #5c4f3a;
  font-weight: 600;
}

.skill-bar-track {
  height: 8px;
  border-radius: 4px;
  background: #e8dcc8;
  overflow: hidden;
}

.skill-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.2s;

  &.skill-狩猎 {
    background: linear-gradient(90deg, #c47a4a, #e8a06a);
  }

  &.skill-战斗 {
    background: linear-gradient(90deg, #b54a4a, #e07070);
  }

  &.skill-采集 {
    background: linear-gradient(90deg, #5a9a5a, #7cb87c);
  }

  &.skill-后勤 {
    background: linear-gradient(90deg, #6a8ab5, #8aaed8);
  }
}

.skill-value {
  font-size: 12px;
  font-weight: 700;
  color: #5c4f3a;
  text-align: right;
  cursor: help;
}

.members-layout {
  display: flex;
  min-width: 0;
  width: 100%;
  min-height: 320px;
  overflow: hidden;
}

.member-sidebar {
  flex: 0 0 38%;
  max-width: 220px;
  min-width: 0;
  border-right: 2px dashed #e4d4ba;
  padding: 12px;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px;
  border: 2px solid #e4d4ba;
  border-radius: 14px;
  background: #fcf8f0;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: border-color 0.15s, background 0.15s;

  &:hover {
    background: #fffdf8;
    border-color: #d4c2a4;
  }

  &.active {
    background: #f4ecdb;
    border-color: #c8955c;
    box-shadow: 0 2px 6px rgba(200, 149, 92, 0.2);
  }
}

.sidebar-avatar {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #dcd1be;
  border: 2px solid #c8955c;
  flex-shrink: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.sidebar-meta {
  min-width: 0;
  flex: 1;
}

.sidebar-name {
  display: block;
  font-weight: 900;
  color: #4a3b32;
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-race {
  display: inline-block;
  margin-top: 2px;
  font-size: 0.62rem;
  background: #e4d4ba;
  color: #6b4c3a;
  padding: 1px 6px;
  border-radius: 999px;
  font-weight: 800;
}

.sidebar-stats {
  display: flex;
  gap: 10px;
  margin-top: 4px;
  font-size: 0.68rem;
  font-weight: 900;

  span {
    display: flex;
    align-items: center;
    gap: 3px;
  }
}

.member-detail {
  flex: 1 1 auto;
  min-width: 0;
  padding: 20px;
  position: relative;
  overflow-y: auto;
}

.expel-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  color: #d9776c;
  background: transparent;
  border: none;
  padding: 8px;
  border-radius: 12px;
  cursor: pointer;
  z-index: 2;

  &:hover {
    color: #a8543f;
    background: #f4d8d3;
  }
}

.detail-head {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  padding-right: 40px;
}

.avatar-label {
  width: 80px;
  height: 80px;
  border-radius: 16px;
  background: #dcd1be;
  border: 3px solid #c8955c;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  cursor: pointer;
  overflow: hidden;
  position: relative;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-bg-icon {
  position: absolute;
  color: #a88a6d;
  opacity: 0.3;
}

.avatar-letter {
  font-size: 1.4rem;
  font-weight: 900;
  color: #5c4738;
  z-index: 1;

  &.lg {
    font-size: 2rem;
  }
}

.avatar-hover {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  color: #fff;
  font-size: 0.7rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 2;
}

.group-avatar:hover .avatar-hover {
  opacity: 1;
}

.hidden-input {
  display: none;
}

.npc-name {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 900;
  color: #4a3b32;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.npc-race {
  font-size: 0.68rem;
  background: #e4d4ba;
  color: #6b4c3a;
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 800;
  border: 1px solid #d4c2a4;
}

.npc-role-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 4px;
}

.npc-role {
  margin: 0;
  font-size: 0.82rem;
  font-weight: 700;
  color: #8c7462;
}

.npc-grade {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  border: 1.5px solid currentColor;
}

.npc-grade.grade-beginner {
  color: #2e7d32;
  background: rgba(76, 175, 80, 0.12);
}

.npc-grade.grade-entry {
  color: #1565c0;
  background: rgba(33, 150, 243, 0.12);
}

.npc-grade.grade-skilled {
  color: #c62828;
  background: rgba(229, 57, 53, 0.12);
}

.npc-grade.grade-master {
  color: #f57f17;
  background: rgba(249, 168, 37, 0.16);
}

.npc-pregnancy {
  margin: 0;
  font-size: 0.82rem;
  font-weight: 800;
  color: #e8789a;
  letter-spacing: 0.04em;
}

.npc-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 10px;
  font-size: 0.78rem;
  font-weight: 900;

  span {
    display: flex;
    align-items: center;
    gap: 5px;
  }
}

.loyal {
  color: #d9776c;
}

.mood {
  color: #7ca982;
}

.stamina {
  color: #c8955c;
}

.stat-label {
  font-size: 0.72em;
  font-weight: 800;
  letter-spacing: 0.04em;
  opacity: 0.92;
}

.npc-info {
  padding-top: 14px;
  border-top: 2px dashed #e4d4ba;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-line {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.88rem;
  font-weight: 700;
  color: #6b4c3a;
  min-width: 0;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.info-icon {
  color: #a88a6d;
  flex-shrink: 0;
}

.thought-box {
  margin-top: 16px;
  background: #fcf8f0;
  padding: 20px 16px 16px;
  border-radius: 12px;
  border: 1px solid #dcd1be;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.04);
  position: relative;
}

.thought-box-label {
  margin: 0 0 8px;
  padding-left: 8px;
  font-size: 0.68rem;
  font-weight: 900;
  color: #c8955c;
  letter-spacing: 0.08em;
}

.thought-text {
  margin: 0;
  padding-left: 8px;
  font-size: 0.88rem;
  font-weight: 700;
  color: #5c4738;
  line-height: 1.55;
}

.thought-bubble {
  position: absolute;
  top: -12px;
  left: -8px;
  color: #c8955c;
  background: #f4ecdb;
  border-radius: 50%;
}

.interact-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  margin-top: 18px;
  font-size: 0.95rem;
}

.modal-panel.interact-modal {
  max-width: 420px;
  max-height: none;
  padding: 28px 24px 32px;
  text-align: center;
  overflow: visible;

  &::before {
    display: none;
  }
}

.interact-avatar-label {
  display: block;
  width: 96px;
  height: 96px;
  margin: 0 auto 14px;
  border-radius: 50%;
  border: 4px solid #c8955c;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

.interact-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.interact-avatar-placeholder {
  width: 100%;
  height: 100%;
  background: #dcd1be;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  span {
    font-size: 2.2rem;
    font-weight: 900;
    color: #5c4738;
    z-index: 1;
  }
}

.placeholder-icon {
  position: absolute;
  color: #a88a6d;
  opacity: 0.3;
}

.interact-head h3 {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 900;
  color: #4a3b32;
}

.interact-race {
  display: inline-block;
  margin-top: 6px;
  font-size: 0.78rem;
  font-weight: 700;
  color: #8c7462;
  background: #f4ecdb;
  padding: 4px 12px;
  border-radius: 999px;
}

.interact-panel {
  margin-top: 16px;
  text-align: left;
  background: #fffdf8;
  border: 2px dashed #c8955c;
  border-radius: 14px;
  padding: 14px 16px 20px;
  box-sizing: border-box;
  overflow: visible;
}

.gaze-box {
  min-width: 0;
}

.gaze-row {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  font-size: 0.82rem;
  line-height: 1.45;
}

.gaze-label {
  flex-shrink: 0;
  font-weight: 900;
  color: #c8955c;
  min-width: 2.2em;
}

.gaze-text {
  font-weight: 700;
  color: #5c4738;
  min-width: 0;
}

.gaze-thought-label {
  display: block;
  margin-bottom: 6px;
  font-size: 0.66rem;
  font-weight: 900;
  color: #c8955c;
  letter-spacing: 0.06em;
}

.gaze-thought {
  position: relative;
  margin-top: 12px;
  padding: 12px 14px 10px;
  background: #fcf8f0;
  border-radius: 10px;

  p {
    margin: 0;
    font-size: 0.85rem;
    font-weight: 700;
    color: #6b4c3a;
    line-height: 1.55;
    padding: 0 8px;
  }
}

.gaze-quote-mark {
  font-size: 1.6rem;
  font-weight: 900;
  color: #e4d4ba;
  line-height: 1;

  &.end {
    float: right;
    margin-top: -8px;
  }
}

.interact-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 14px;

  button:not(.breed-btn) {
    padding: 13px 8px;
    font-size: 1rem;
  }
}

.breed-btn {
  grid-column: 1 / -1;
  width: 100%;
  margin: 2px 0 0;
  padding: 14px 18px;
  box-sizing: border-box;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: linear-gradient(180deg, #f8b4c8 0%, #e889a3 55%, #d96b8a 100%);
  color: #fff;
  border: 2px solid #c94d6a;
  border-radius: 14px;
  box-shadow:
    0 4px 0 #b83d5e,
    inset 0 1px 0 rgba(255, 255, 255, 0.35);
  font-weight: 900;
  font-size: 1.05rem;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s ease;
  text-shadow: 0 1px 2px rgba(160, 50, 80, 0.35);

  &:hover {
    background: linear-gradient(180deg, #fcc0d2 0%, #ec96ae 55%, #e07895 100%);
    transform: translateY(2px);
    box-shadow:
      0 2px 0 #b83d5e,
      inset 0 1px 0 rgba(255, 255, 255, 0.35);
  }

  &:active {
    transform: translateY(4px);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }
}

.heart-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.22);
  border: 2px solid rgba(255, 255, 255, 0.5);
  box-shadow:
    inset 0 2px 4px rgba(255, 255, 255, 0.45),
    0 1px 3px rgba(180, 50, 80, 0.25);
}

.heart-icon {
  filter: drop-shadow(0 1px 1px rgba(180, 40, 70, 0.3));
}

.empty-hint {
  text-align: center;
  color: #8c7462;
  font-weight: 700;
  padding: 20px;
}

.feed-overlay {
  z-index: 350;
}

.feed-modal {
  width: min(100%, 380px);
  padding: 20px;
}

.feed-hint {
  margin: 0 0 12px;
  font-size: 0.85rem;
  color: #6b8f71;
  font-weight: 700;
  text-align: center;
}

.feed-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 280px;
  overflow-y: auto;
}

.feed-item-btn {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 4px 10px;
  width: 100%;
  padding: 12px 14px;
  text-align: left;
  border: 2px solid #d4c4a8;
  border-radius: 12px;
  background: #fcf8f0;
  color: #5c4738;
  font-family: inherit;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;

  &:hover {
    border-color: #7ca982;
    background: #f4faf4;
  }
}

.feed-item-name {
  font-weight: 900;
  font-size: 0.95rem;
}

.feed-item-meta {
  font-weight: 800;
  color: #6b8f71;
}

.feed-item-desc {
  grid-column: 1 / -1;
  font-size: 0.78rem;
  color: #8c7462;
  line-height: 1.4;
}

@media (max-width: 560px) {
  .members-layout {
    flex-direction: column;
  }

  .member-sidebar {
    flex: none;
    max-width: none;
    width: 100%;
    max-height: 160px;
    border-right: none;
    border-bottom: 2px dashed #e4d4ba;
    flex-direction: row;
    overflow-x: auto;
    overflow-y: hidden;
    flex-wrap: nowrap;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .sidebar-item {
    flex: 0 0 auto;
    min-width: 140px;
    max-width: 160px;
  }
}
</style>
