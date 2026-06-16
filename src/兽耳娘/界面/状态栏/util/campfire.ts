import type { Schema } from '../../../schema';

export type FuelMaterial = {
  id: string;
  label: string;
  fuelValue: number;
  hoursPerUnit: number;
};

/** 露天火塘每日约消耗 10 单位；石砌防风火塘约 4 单位 */
export const FUEL_MATERIALS: FuelMaterial[] = [
  { id: '普通木柴', label: '普通木柴', fuelValue: 1, hoursPerUnit: 2.4 },
  { id: '木炭', label: '木炭', fuelValue: 2, hoursPerUnit: 6 },
  { id: '坚固木材', label: '坚固木材（应急）', fuelValue: 0.8, hoursPerUnit: 1.8 },
  { id: '引火物', label: '引火物/干草', fuelValue: 0.3, hoursPerUnit: 0.6 },
];

export function hasWindproofFirepit(buildings: Schema['营地']['当前建筑']) {
  return Object.keys(buildings).some(
    name => name.includes('防风火塘') || (name.includes('石砌') && name.includes('火塘')),
  );
}

export function dailyFuelBurn(buildings: Schema['营地']['当前建筑']) {
  return hasWindproofFirepit(buildings) ? 4 : 10;
}

export function fuelHoursRemaining(fuelCurrent: number, dailyBurn: number) {
  if (fuelCurrent <= 0 || dailyBurn <= 0) return 0;
  return (fuelCurrent / dailyBurn) * 24;
}

export function formatFuelDuration(hours: number) {
  if (hours <= 0) return '已熄灭';
  if (hours < 1) return `约 ${Math.round(hours * 60)} 分钟`;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `约 ${h} 小时`;
  return `约 ${h} 小时 ${m} 分`;
}

export const LEGACY_FIREPIT_KEY = '熄灭的火堆';
export const FIREPIT_KEY = '简易火塘';

/** 兼容旧存档键名「熄灭的火堆」，统一读写「简易火塘」 */
export function resolveFirepitKey(buildings: Schema['营地']['当前建筑']): string | null {
  if (buildings[FIREPIT_KEY]) return FIREPIT_KEY;
  if (buildings[LEGACY_FIREPIT_KEY]) return LEGACY_FIREPIT_KEY;
  return null;
}

export function migrateFirepitBuildingName(buildings: Schema['营地']['当前建筑']) {
  if (buildings[LEGACY_FIREPIT_KEY] && !buildings[FIREPIT_KEY]) {
    buildings[FIREPIT_KEY] = buildings[LEGACY_FIREPIT_KEY];
    delete buildings[LEGACY_FIREPIT_KEY];
  }
}

const COLD_STATE_RE = /冰冷|熄灭|死灰|无火|冷灰/;
const LIT_STATE_RE = /燃烧|温火|点燃|稳定|微火|旺/;

/** 有燃料即视为可燃烧；建筑状态「冰冷」在燃料>0 时视为未及时更新的陈旧值 */
export function isFireLit(fuelCurrent: number, buildingState: string | undefined): boolean {
  if (fuelCurrent <= 0) return false;
  const state = String(buildingState ?? '');
  if (LIT_STATE_RE.test(state)) return true;
  if (COLD_STATE_RE.test(state)) return true;
  return true;
}

/** 按燃料余量同步简易火塘的状态与描述，避免 UI 与变量脱节 */
export function syncFirepitWithFuel(
  buildings: Schema['营地']['当前建筑'],
  fuel: Schema['营地']['篝火燃料'],
) {
  migrateFirepitBuildingName(buildings);
  const pile = buildings[FIREPIT_KEY];
  if (!pile) return;

  const fuelCurrent = fuel.当前;
  const fuelPercent = fuel.上限 > 0 ? (fuelCurrent / fuel.上限) * 100 : 0;

  if (fuelCurrent <= 0) {
    pile.状态 = '冰冷';
    pile.描述 = '只剩下灰烬的火塘，急需重新生火';
    return;
  }

  if (fuelPercent >= 70) {
    pile.状态 = '稳定燃烧';
    pile.描述 = '火焰稳定，族人围着火塘说笑取暖';
  } else if (fuelPercent >= 30) {
    pile.状态 = '温火';
    pile.描述 = '火舌缩短，但尚可驱散寒意';
  } else {
    pile.状态 = '微火';
    pile.描述 = '火苗忽明忽暗，需要尽快添柴';
  }
}

export function tribeFireOpinion(
  fuelPercent: number,
  cohesion: number,
  warmth: number,
  fireLit: boolean,
): string {
  if (!fireLit || fuelPercent <= 0) {
    return '族人们围在冷灰旁低声抱怨，夜里没人敢睡踏实。';
  }
  if (fuelPercent >= 70) {
    return cohesion >= 50
      ? '火光映着兽耳，族人们围坐说笑，觉得首领把火塘照顾得很好。'
      : '火还算旺，但不少人仍担心明天还有没有柴烧。';
  }
  if (fuelPercent >= 30) {
    return warmth < 30
      ? '火舌变短了，挨饿受冻的族人开始埋怨后勤没跟上。'
      : '大家还能靠近取暖，可都在悄悄议论要不要省着添柴。';
  }
  return '火苗忽明忽暗，孩子们往大人怀里缩，族人们明显焦躁不安。';
}

export function previewFuelAddition(material: FuelMaterial, amount: number, dailyBurn: number) {
  const addedFuel = material.fuelValue * amount;
  const addedHours = material.hoursPerUnit * amount;
  const equivalentDays = addedFuel / dailyBurn;
  return { addedFuel, addedHours, equivalentDays };
}

function extractStoryFromMessage(text: string): string {
  const m = text.match(/(?:<|&lt;)story(?:>|&gt;)([\s\S]*?)(?:<|&lt;)\/story(?:>|&gt;)/i);
  return m?.[1] ?? text;
}

function getLatestAssistantStoryText(): string {
  if (typeof getChatMessages !== 'function') {
    return '';
  }
  const msgs = getChatMessages('0-{{lastMessageId}}');
  const latestAssistant = [...msgs].reverse().find(m => m.role === 'assistant');
  if (!latestAssistant) {
    return '';
  }
  return extractStoryFromMessage(latestAssistant.message);
}

/** 剧情已描写生火成功，但 AI 未 update 篝火燃料时，补写初始燃料 */
const FIRE_LIT_STORY_RE =
  /将燃烧(?:的)?(?:干草|引火物)?(?:放|送|扔)?进火塘|火焰(?:已经|在).*?(?:窜起|燃起|燃烧|跳跃)|火塘.*?(?:重新|终于)(?:燃起|点燃|烧起来)|橙色火焰|火塘.*?亮起来|借着.*?生火/;

export function inferCampfireFuelFromStory(
  buildings: Schema['营地']['当前建筑'],
  fuel: Schema['营地']['篝火燃料'],
): boolean {
  if (fuel.当前 > 0) {
    return false;
  }
  const story = getLatestAssistantStoryText();
  if (!story || !FIRE_LIT_STORY_RE.test(story)) {
    return false;
  }
  fuel.当前 = 15;
  syncFirepitWithFuel(buildings, fuel);
  console.info('[篝火燃料] 剧情已生火，补写初始燃料:', fuel.当前);
  return true;
}
