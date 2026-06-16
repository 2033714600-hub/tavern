/** 迫降线四名核心具名 NPC 的 canonical 种族（与角色档案一致，禁止 AI 写成兔耳等错族） */
export const CORE_WRECK_NPC_RACE: Record<string, string> = {
  春: '黑狼娘(食肉系)',
  白: '羊角娘(食草系)',
  林: '猫耳娘(杂食系)',
  菊: '猫耳娘(食肉系)',
};

export function canonicalizeCoreNpcRace(name: string, race: string): string {
  const canonical = CORE_WRECK_NPC_RACE[name];
  if (!canonical) {
    return race;
  }
  const trimmed = race.trim();
  if (!trimmed || trimmed !== canonical) {
    if (trimmed && trimmed !== canonical) {
      console.warn(`[核心NPC] ${name} 种族修正: ${trimmed} → ${canonical}`);
    }
    return canonical;
  }
  return trimmed;
}
