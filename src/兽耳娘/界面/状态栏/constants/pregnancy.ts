/** 与 schema 具名NPC.孕期 枚举一致 */
export const PREGNANCY_STAGES = ['未孕', '受孕', '早孕', '安胎', '临盆', '哺乳'] as const;
export type PregnancyStage = (typeof PREGNANCY_STAGES)[number];

const DISPLAY_LABEL: Record<PregnancyStage, string | null> = {
  未孕: null,
  受孕: '受孕',
  早孕: '早孕',
  安胎: '安胎',
  临盆: '临盆',
  哺乳: '哺乳中',
};

export function pregnancy_display_label(stage?: string): string | null {
  if (!stage || stage === '未孕') {
    return null;
  }
  if (stage in DISPLAY_LABEL) {
    return DISPLAY_LABEL[stage as PregnancyStage];
  }
  return stage;
}
