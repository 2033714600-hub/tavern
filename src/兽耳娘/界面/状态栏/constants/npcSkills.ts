export const SKILL_KEYS = ['狩猎', '战斗', '采集', '后勤'] as const;
export type SkillKey = (typeof SKILL_KEYS)[number];

export function skill_tier(value: number): string {
  const v = Math.max(0, Math.min(100, value));
  if (v >= 80) return '大师';
  if (v >= 60) return '精通';
  if (v >= 40) return '熟练';
  if (v >= 20) return '入门';
  return '生疏';
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
