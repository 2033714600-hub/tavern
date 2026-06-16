import type { Schema } from '../../../schema';
import { CORE_NPC_SKILLS } from '../../../constants/coreNpcSkills';
import {
  compositeSquadSkill,
  SKILL_KEYS,
  squad_skill_tier,
  type SkillKey,
} from '../constants/npcSkills';

export type SkillTotals = Record<SkillKey, number>;

function npcSkill(npc: Schema['具名NPC'][string] | undefined, name: string, key: SkillKey) {
  const raw = npc?.技能?.[key];
  if (raw != null && raw > 0) return Math.min(100, raw);
  const fallback = CORE_NPC_SKILLS[name]?.[key];
  if (fallback != null) return Math.min(100, fallback);
  return Math.min(100, raw ?? 0);
}

/** 无名同行族人按营地基准效率折算为各技能参与值 */
function unnamedSkillValues(
  unnamedCount: number,
  baseline: number,
): Record<SkillKey, number[]> {
  const unit = Math.max(8, Math.round(baseline * 0.28));
  const bias: Record<SkillKey, number> = { 狩猎: 0.45, 战斗: 0.4, 采集: 1, 后勤: 0.65 };
  const out: Record<SkillKey, number[]> = { 狩猎: [], 战斗: [], 采集: [], 后勤: [] };
  for (let i = 0; i < unnamedCount; i++) {
    for (const key of SKILL_KEYS) {
      out[key].push(Math.round(unit * bias[key]));
    }
  }
  return out;
}

/**
 * 编队综合技能（0~150）：最高值 + 其余成员×15%
 * 具名取真实技能，无名同行按无名族人基准效率折算后加入核算
 */
export function aggregateSquadSkills(
  members: string[],
  unnamedCount: number,
  npcs: Schema['具名NPC'],
  unnamedBaseline = 40,
): SkillTotals {
  const unnamed = unnamedSkillValues(unnamedCount, unnamedBaseline);
  const totals = {} as SkillTotals;
  for (const key of SKILL_KEYS) {
    const values = members.map(name => npcSkill(npcs[name], name, key));
    values.push(...unnamed[key]);
    totals[key] = compositeSquadSkill(values);
  }
  return totals;
}

export function squadCompositeSkillRows(
  members: string[],
  unnamedCount: number,
  npcs: Schema['具名NPC'],
  unnamedBaseline = 40,
) {
  const totals = aggregateSquadSkills(members, unnamedCount, npcs, unnamedBaseline);
  return SKILL_KEYS.map(key => ({
    key,
    total: totals[key],
    tier: squad_skill_tier(totals[key]),
  }));
}

export type PackSkillBonus = Partial<Record<SkillKey, number>>;

export function evaluateSquadAction(
  skills: SkillTotals,
  mode: '探索' | '采集',
  durationHours: number,
  packBonus: PackSkillBonus = {},
): string {
  const hoursFactor = durationHours >= 6 ? '长途' : durationHours <= 3 ? '短途' : '半日';
  const gearHint = (() => {
    const parts: string[] = [];
    if (packBonus.战斗) parts.push(`战斗+${packBonus.战斗}`);
    if (packBonus.后勤) parts.push(`后勤+${packBonus.后勤}`);
    if (packBonus.采集) parts.push(`采集+${packBonus.采集}`);
    if (packBonus.狩猎) parts.push(`狩猎+${packBonus.狩猎}`);
    return parts.length ? `（物资加成 ${parts.join(' ')}）` : '';
  })();

  if (mode === '探索') {
    const fight = Math.min(150, skills.战斗 + (packBonus.战斗 ?? 0));
    const logi = Math.min(150, skills.后勤 + (packBonus.后勤 ?? 0));
    if (fight < 35) {
      return `${hoursFactor}探索：战斗值偏低（${fight}/150）${gearHint}，深入未知区域遇袭伤残率高，难稳定带回情报见闻。`;
    }
    if (logi < 30) {
      return `${hoursFactor}探索：后勤值薄弱（${logi}/150）${gearHint}，长途勘察易因补给中断空手而归。`;
    }
    if (fight >= 70 && logi >= 50) {
      return `${hoursFactor}探索：适宜开荒测绘与收集见闻；次要可顺带少量基础材料。${gearHint}`;
    }
    if (fight >= 50 || logi >= 40) {
      return `${hoursFactor}探索：可推进边界外勘察，新区域情报产出较稳，罕见猎获勿作指望。${gearHint}`;
    }
    return `${hoursFactor}探索：仅建议在低危边缘试探，避免深入未掌握地带。${gearHint}`;
  }

  const gather = Math.min(150, skills.采集 + (packBonus.采集 ?? 0));
  const logi = Math.min(150, skills.后勤 + (packBonus.后勤 ?? 0));
  if (gather < 40) {
    return `${hoursFactor}采集：采集值不足（${gather}/150）${gearHint}，常用材料产量与稀有辨识成功率低。`;
  }
  if (logi < 35) {
    return `${hoursFactor}采集：后勤值偏低（${logi}/150）${gearHint}，长途搬运与保鲜效率差，珍贵产出更难保留。`;
  }
  if (gather >= 100 && logi >= 70) {
    return `${hoursFactor}采集：大量常用材料产出可期，小概率辨识稀有/药用植物乃至珍贵残骸。${gearHint}`;
  }
  if (gather >= 65) {
    return `${hoursFactor}采集：可稳定完成日常搬砖，留意毒物与污染水源。${gearHint}`;
  }
  return `${hoursFactor}采集：仅适合已掌握安全区短时作业，稀有与珍贵产出概率有限。${gearHint}`;
}

export function evaluateSquadHunt(
  skills: SkillTotals,
  durationHours: number,
  packBonus: { 狩猎: number; 战斗: number },
): string {
  const hunt = Math.min(150, skills.狩猎 + packBonus.狩猎);
  const fight = Math.min(150, skills.战斗 + packBonus.战斗);
  const hoursFactor = durationHours >= 6 ? '长途' : durationHours <= 3 ? '短途' : '半日';
  const gearHint =
    packBonus.狩猎 + packBonus.战斗 > 0
      ? `（装备加成 狩猎+${packBonus.狩猎} 战斗+${packBonus.战斗}）`
      : '';

  if (hunt < 40) {
    return `${hoursFactor}狩猎：狩猎值偏低（${hunt}/150）${gearHint}，建议补充武器或陷阱后再出发。`;
  }
  if (fight < 35 && hunt < 70) {
    return `${hoursFactor}狩猎：战斗值不足（${fight}/150），遇大型野兽时负伤风险高。${gearHint}`;
  }
  if (hunt >= 100 && fight >= 60) {
    return `${hoursFactor}狩猎：可稳定猎获肉食、皮毛、骨骼与兽脂；罕见或偶遇情报。${gearHint}`;
  }
  if (hunt >= 65) {
    return `${hoursFactor}狩猎：中小型猎物产出较稳，注意返程体力与解剖完整度。${gearHint}`;
  }
  return `${hoursFactor}狩猎：勉强可出猎，优先已掌握林缘，次要材料顺带即可。${gearHint}`;
}
