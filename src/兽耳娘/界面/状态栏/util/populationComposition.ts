import type { Schema } from '../../../schema';

/** 从「猫耳娘(杂食系)」提取「猫耳娘」 */
export function extract_race_short_label(种族: string): string {
  const trimmed = 种族.trim();
  if (!trimmed) {
    return '未知';
  }
  const head = trimmed.split(/[(（]/)[0]?.trim();
  return head || trimmed;
}

function count_named_by_race(具名NPC: Schema['具名NPC']): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const npc of _.values(具名NPC)) {
    const label = extract_race_short_label(npc.种族);
    counts[label] = (counts[label] ?? 0) + 1;
  }
  return counts;
}

function infer_unnamed_race(named_counts: Record<string, number>): string {
  const top = _.maxBy(_.toPairs(named_counts), ([, count]) => count);
  return top?.[0] ?? '猫耳娘';
}

/** 解析营地人口构成（优先 stat_data.族人构成，否则由具名 NPC 与总人口推算） */
export function resolve_population_composition(
  人口: number,
  具名NPC: Schema['具名NPC'],
  族人构成: Schema['营地']['族人构成'],
): { label: string; count: number }[] {
  const named_counts = count_named_by_race(具名NPC);
  const named_total = _.sum(_.values(named_counts));
  const stored_sum = _.sum(_.values(族人构成 ?? {}));

  if (!_.isEmpty(族人构成) && stored_sum === 人口) {
    return _.sortBy(
      _.toPairs(族人构成).map(([label, count]) => ({ label, count })),
      row => -row.count,
    );
  }

  const counts = { ...named_counts };
  const unnamed = Math.max(0, 人口 - named_total);
  if (unnamed > 0) {
    const race = infer_unnamed_race(named_counts);
    counts[race] = (counts[race] ?? 0) + unnamed;
  }

  return _.sortBy(
    _.toPairs(counts).map(([label, count]) => ({ label, count: count ?? 0 })),
    row => -row.count,
  );
}

export function should_resync_population_composition(
  人口: number,
  具名NPC: Schema['具名NPC'],
  族人构成: Schema['营地']['族人构成'],
): boolean {
  if (_.isEmpty(族人构成)) {
    return true;
  }
  if (_.sum(_.values(族人构成)) !== 人口) {
    return true;
  }
  for (const [race, count] of _.toPairs(count_named_by_race(具名NPC))) {
    if ((族人构成[race] ?? 0) < count) {
      return true;
    }
  }
  return false;
}

export function build_population_composition_record(
  人口: number,
  具名NPC: Schema['具名NPC'],
): Record<string, number> {
  return Object.fromEntries(
    resolve_population_composition(人口, 具名NPC, {}).map(row => [row.label, row.count]),
  );
}
