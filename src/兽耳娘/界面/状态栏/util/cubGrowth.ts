import { CORE_NPC_RACES } from '../../../constants/coreNpcRaces';
import type { Schema } from '../../../schema';

/** 幼崽种族须继承母亲族系；核心 NPC 以世界书规范种族为准 */
export function inferCubRaceFromMother(mother_name: string, npcs: Schema['具名NPC']): string {
  const canonical = CORE_NPC_RACES[mother_name];
  if (canonical) {
    return canonical;
  }
  const mother = npcs[mother_name];
  if (!mother?.种族?.trim()) {
    return '';
  }
  return mother.种族.trim();
}

export function cubRaceMatchesMother(
  cub_race: string,
  mother_name: string,
  npcs: Schema['具名NPC'],
): boolean {
  const expected = inferCubRaceFromMother(mother_name, npcs);
  if (!expected) {
    return true;
  }
  const actual = cub_race.trim();
  if (!actual) {
    return false;
  }
  const mother_kind = raceKind(expected);
  const cub_kind = raceKind(actual);
  return mother_kind !== '' && mother_kind === cub_kind;
}

function raceKind(race: string): string {
  if (/羊角|盘羊|山羊/.test(race)) return '羊角';
  if (/猫耳|猫娘/.test(race)) return '猫耳';
  if (/兔耳|兔娘/.test(race)) return '兔耳';
  if (/狐|赤狐/.test(race)) return '狐';
  if (/虎|华南虎/.test(race)) return '虎';
  if (/熊|熊猫/.test(race)) return '熊';
  if (/狼|犬/.test(race)) return '犬狼';
  if (/狮/.test(race)) return '狮';
  if (/食草/.test(race)) return '食草';
  if (/食肉/.test(race)) return '食肉';
  if (/杂食/.test(race)) return '杂食';
  return race.replace(/\(.*\)/, '').trim();
}

/** 按年龄与可选变量字段生成幼崽具体生长状态 */
export function cubGrowthStatus(cub: Schema['幼崽'][string], survival_days = 1): string {
  const custom = cub.生长状态?.trim();
  if (custom) {
    return custom;
  }

  const age = cub.年龄 ?? 0;
  const status = cub.状态?.trim() || '健康';

  if (age <= 0) {
    return `新生期（约第 ${survival_days} 生存日）：依赖母乳与全营地共育，体温与饱食须持续看护。当前健康：${status}。`;
  }
  if (age < 30) {
    return `哺乳期（约 ${age} 天）：四肢渐有力，开始辨认营火与主要照料者；仍需频繁哺乳与保暖。当前：${status}。`;
  }
  if (age < 365) {
    const months = Math.max(1, Math.floor(age / 30));
    return `快速成长期（约 ${months} 月）：异星血脉加速发育，正学习辨认气味与简单词汇；全营地轮流教导基础生存。当前：${status}。`;
  }
  if (age < 365 * 3) {
    const years = (age / 365).toFixed(1);
    return `幼年期（约 ${years} 岁体格）：已达同龄原住民数倍体格，智力快速提升中。当前：${status}。`;
  }
  if (age < 365 * 12) {
    return `少年期：体格与智力远超纯血原住民同龄者，可参与轻度营地劳动。当前：${status}。`;
  }
  return `接近成熟期：异星血脉优势显著。当前：${status}。`;
}

export const CUB_GROUP_PET_RULE =
  '幼崽是营地共同的宝物。成员会轮流照看、递送清水与食物；{{user}}拥有随时抱起幼崽的绝对权利。绝不允许幼崽受到伤害。';
