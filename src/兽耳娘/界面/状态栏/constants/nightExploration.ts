const NIGHT_KEYWORDS = ['深夜', '夜晚', '夜间', '入夜', '半夜', '子夜', '凌晨', '黄昏后', '夜里'];

export function isNightWorldTime(time: string | undefined): boolean {
  if (!time?.trim()) {
    return false;
  }
  return NIGHT_KEYWORDS.some(k => time.includes(k));
}

/** 入夜外出：基础成功率乘以该系数（降低 80% → 剩 20%） */
export const NIGHT_OUTING_SUCCESS_MULTIPLIER = 0.2;

/** 入夜外出：稀有材料几率倍率（大幅提高） */
export const NIGHT_RARE_MATERIAL_MULTIPLIER = 3.5;

export const NIGHT_EXPLORATION_HINT =
  '入夜外出（探索/狩猎/采集）基础成功率降至约 20%，但稀有材料几率显著提高。携带火把、篝火燃料等照明装备可部分抵消惩罚。';

export const LIGHTING_PACK_KEYWORDS = ['火把', '篝火', '照明', '灯', '火炬', '油脂灯', '荧光'];

export function packHasLighting(pack: Record<string, number> | undefined): boolean {
  if (!pack) return false;
  return Object.keys(pack).some(name => LIGHTING_PACK_KEYWORDS.some(k => name.includes(k)));
}
