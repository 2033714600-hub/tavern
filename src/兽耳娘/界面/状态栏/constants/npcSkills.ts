export const SKILL_KEYS = ['狩猎', '战斗', '采集', '后勤'] as const;
export type SkillKey = (typeof SKILL_KEYS)[number];

/** 编队单项综合技能上限 */
export const SQUAD_SKILL_MAX = 150;

/** 编队核算：其余成员贡献系数 */
export const SQUAD_MEMBER_CONTRIBUTION_RATE = 0.15;

/** 个人技能等级（0~100） */
export function skill_tier(value: number): string {
  const v = Math.max(0, Math.min(100, value));
  if (v >= 100) return '传说';
  if (v >= 81) return '大师';
  if (v >= 61) return '精通';
  if (v >= 41) return '熟练';
  if (v >= 21) return '入门';
  return '生疏';
}

/** 编队综合技能等级（0~150，按个人阈值等比映射） */
export function squad_skill_tier(value: number): string {
  const v = Math.max(0, Math.min(SQUAD_SKILL_MAX, value));
  if (v >= SQUAD_SKILL_MAX) return '传说';
  if (v >= 122) return '大师';
  if (v >= 92) return '精通';
  if (v >= 62) return '熟练';
  if (v >= 32) return '入门';
  return '生疏';
}

/**
 * 编队单项技能总值 = 最高值 + 其余成员数值总和 × 15%，上限 150
 */
export function compositeSquadSkill(memberValues: number[]): number {
  if (!memberValues.length) return 0;
  const sorted = [...memberValues].sort((a, b) => b - a);
  const max = sorted[0];
  const restSum = sorted.slice(1).reduce((sum, v) => sum + v, 0);
  return Math.min(SQUAD_SKILL_MAX, Math.round(max + restSum * SQUAD_MEMBER_CONTRIBUTION_RATE));
}

/** 与 EJS / 世界书规则一致的当期效率加成（%） */
export function skill_primary_bonus(key: SkillKey, value: number): number {
  const v = Math.max(0, Math.min(100, value));
  const rate = { 狩猎: 0.4, 战斗: 0.8, 采集: 0.5, 后勤: 0.45 } as const;
  return Math.floor(v * rate[key]);
}

export function skill_bonus_hint(key: SkillKey, value: number): string {
  const tier = skill_tier(value);
  const bonus = skill_primary_bonus(key, value);
  const hints: Record<SkillKey, string> = {
    狩猎: `猎获量+${bonus}%`,
    战斗: `战力+${bonus}%`,
    采集: `采集量+${bonus}%`,
    后勤: `队列效率+${bonus}%`,
  };
  return `${tier} · ${hints[key]}`;
}

/** 编队综合技能在探索/采集中的用途简述（状态栏提示） */
export const SQUAD_SKILL_PURPOSES: Record<SkillKey, string> = {
  狩猎: '隐蔽、陷阱成功率与致命一击',
  战斗: '正面抗压与战损控制',
  采集: '稀有资源发现与辨毒滤水',
  后勤: '扎营速度、体温维持与伤员止血',
};
