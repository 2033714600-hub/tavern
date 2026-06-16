export const NPC_GRADES = ['初学', '入门', '熟练', '精通'] as const;
export type NpcGrade = (typeof NPC_GRADES)[number];

export type NpcSkillsLike = {
  狩猎?: number;
  战斗?: number;
  采集?: number;
  后勤?: number;
};

const GRADE_SET = new Set<string>(NPC_GRADES);

/** 狩猎/战斗/采集/后勤四项中的最高值 */
export function max_skill_value(skills: NpcSkillsLike | undefined | null): number {
  if (!skills) {
    return 0;
  }
  return Math.max(skills.狩猎 ?? 0, skills.战斗 ?? 0, skills.采集 ?? 0, skills.后勤 ?? 0);
}

/** 任意一项技能达标即取最高档（21~40初学 41~60入门 61~80熟练 81+精通） */
export function infer_npc_grade_from_skills(skills: NpcSkillsLike | undefined | null): NpcGrade {
  const max = max_skill_value(skills);
  if (max >= 81) {
    return '精通';
  }
  if (max >= 61) {
    return '熟练';
  }
  if (max >= 41) {
    return '入门';
  }
  return '初学';
}

export function normalize_npc_grade(value: string | undefined): NpcGrade {
  if (value && GRADE_SET.has(value)) {
    return value as NpcGrade;
  }
  return '初学';
}

/** 展示与写入均以技能最高值为准；stored 仅作缺技能时的兜底 */
export function resolve_npc_grade(
  stored: string | undefined,
  skills: NpcSkillsLike | undefined | null,
): NpcGrade {
  if (skills && max_skill_value(skills) > 0) {
    return infer_npc_grade_from_skills(skills);
  }
  return normalize_npc_grade(stored);
}

export function parse_skills_from_panel_text(text: string): NpcSkillsLike {
  const skills: NpcSkillsLike = {};
  const re = /(狩猎|战斗|采集|后勤):(\d+)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const key = match[1] as keyof NpcSkillsLike;
    skills[key] = Number(match[2]);
  }
  return skills;
}

export function npc_grade_class(grade: string | undefined): string {
  const normalized = normalize_npc_grade(grade);
  return {
    初学: 'grade-beginner',
    入门: 'grade-entry',
    熟练: 'grade-skilled',
    精通: 'grade-master',
  }[normalized];
}
