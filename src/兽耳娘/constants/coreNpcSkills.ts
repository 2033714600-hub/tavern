import type { SkillKey } from '../界面/状态栏/constants/npcSkills';

/** 湖畔营地核心四人技能基准（与角色档案、世界书、MVU 规则一致） */
export const CORE_NPC_SKILLS: Record<string, Record<SkillKey, number>> = {
  春: { 狩猎: 72, 战斗: 68, 采集: 28, 后勤: 22 },
  白: { 狩猎: 12, 战斗: 18, 采集: 52, 后勤: 82 },
  林: { 狩猎: 25, 战斗: 22, 采集: 48, 后勤: 55 },
  菊: { 狩猎: 58, 战斗: 62, 采集: 38, 后勤: 45 },
};

export const CORE_NPC_NAMES = ['林', '白', '春', '菊'] as const;
