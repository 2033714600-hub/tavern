import type { Schema } from '../../../schema';
import { extract_race_short_label } from './populationComposition';

/** 与 [mvu_update] 向心力→无名族人基准效率 分档一致 */
export function unnamed_efficiency_from_cohesion(向心力: number): number {
  if (向心力 >= 81) {
    return 120;
  }
  if (向心力 >= 41) {
    return 100;
  }
  if (向心力 >= 21) {
    return 70;
  }
  return 40;
}

/** 工作队列效率加成：具名×12 + 协同×6，上限 80 */
export function compute_work_efficiency_bonus(named: number, unnamed: number): number {
  if (named <= 0 && unnamed <= 0) {
    return 0;
  }
  return _.clamp(named * 12 + unnamed * 6, 0, 80);
}

export function sync_work_efficiency_bonus(work: Schema['工作队列'][string]): void {
  work.效率加成 = compute_work_efficiency_bonus(work.具名指派.length, work.协同兽耳娘数);
}

/** 驱逐具名 NPC：同步人口与族人构成 */
export function expel_named_npc(data: Schema, name: string): boolean {
  const npc = data.具名NPC[name];
  if (!npc) {
    return false;
  }
  const race = extract_race_short_label(npc.种族);
  delete data.具名NPC[name];
  data.营地.人口 = Math.max(0, data.营地.人口 - 1);
  const composition = { ...data.营地.族人构成 };
  if (composition[race] != null) {
    composition[race] = Math.max(0, composition[race] - 1);
    if (composition[race] <= 0) {
      delete composition[race];
    }
  }
  data.营地.族人构成 = composition;
  return true;
}
