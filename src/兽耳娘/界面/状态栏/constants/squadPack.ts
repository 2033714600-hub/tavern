import type { SquadActionKey } from './squadActionMechanism';

/** 出行背包负重上限 */
export const SQUAD_PACK_MAX_WEIGHT = 15;

export type PackSkillBonus = Partial<Record<'狩猎' | '战斗' | '采集' | '后勤', number>>;

export type WarehousePackItem = {
  id: string;
  label: string;
  stock: number;
  weight: number;
  hint: string;
  bonus: PackSkillBonus;
};

/** 已知物资的负重与行动加成（未列出的仓库物品默认负重 1、无技能加成，仍可携带） */
const PACK_ITEM_META: Record<
  string,
  { weight: number; hint: string; bonus: Record<SquadActionKey, PackSkillBonus> }
> = {
  硬化长矛: {
    weight: 2,
    hint: '探索遇袭防身；狩猎追击刺击',
    bonus: { 探索: { 战斗: 3 }, 狩猎: { 狩猎: 8, 战斗: 3 }, 采集: {} },
  },
  投掷木枪: {
    weight: 1,
    hint: '远程骚扰与驱赶',
    bonus: { 探索: { 战斗: 1 }, 狩猎: { 狩猎: 6, 战斗: 1 }, 采集: {} },
  },
  防身短棒: {
    weight: 1,
    hint: '防身兼补刀',
    bonus: { 探索: { 战斗: 2 }, 狩猎: { 狩猎: 2, 战斗: 4 }, 采集: {} },
  },
  骨刀: {
    weight: 1,
    hint: '剥皮与切割效率更高',
    bonus: { 探索: { 后勤: 1 }, 狩猎: { 狩猎: 5, 战斗: 5 }, 采集: { 采集: 2 } },
  },
  骨刺长矛: {
    weight: 2,
    hint: '对中型猎物致命一击率提升',
    bonus: { 探索: { 战斗: 4 }, 狩猎: { 狩猎: 12, 战斗: 6 }, 采集: {} },
  },
  骨镖: {
    weight: 1,
    hint: '精准投掷',
    bonus: { 探索: { 战斗: 1 }, 狩猎: { 狩猎: 8, 战斗: 2 }, 采集: {} },
  },
  拒兽木叉: {
    weight: 2,
    hint: '顶住冲撞，降低反伤',
    bonus: { 探索: { 战斗: 3 }, 狩猎: { 狩猎: 3, 战斗: 5 }, 采集: {} },
  },
  打磨石斧: {
    weight: 3,
    hint: '破甲与肢解',
    bonus: { 探索: { 战斗: 4 }, 狩猎: { 狩猎: 4, 战斗: 9 }, 采集: { 采集: 3 } },
  },
  简易绳套陷阱: {
    weight: 2,
    hint: '布置陷阱，被动补获',
    bonus: { 探索: { 后勤: 2 }, 狩猎: { 狩猎: 11 }, 采集: {} },
  },
  韧化藤绳: {
    weight: 1,
    hint: '捆缚与陷阱辅助',
    bonus: { 探索: { 后勤: 2 }, 狩猎: { 狩猎: 3 }, 采集: { 采集: 2 } },
  },
  '引火物/干草': {
    weight: 1,
    hint: '生火与烟熏驱赶',
    bonus: { 探索: { 后勤: 3 }, 狩猎: { 狩猎: 2 }, 采集: {} },
  },
  引火物: {
    weight: 1,
    hint: '生火与烟熏驱赶',
    bonus: { 探索: { 后勤: 3 }, 狩猎: { 狩猎: 2 }, 采集: {} },
  },
  坚固木材: {
    weight: 2,
    hint: '扎营与标记路径',
    bonus: { 探索: { 后勤: 2 }, 狩猎: {}, 采集: { 采集: 4 } },
  },
  藤蔓: {
    weight: 1,
    hint: '捆扎与简易工具',
    bonus: { 探索: { 后勤: 1 }, 狩猎: { 狩猎: 1 }, 采集: { 采集: 3 } },
  },
  石料: {
    weight: 2,
    hint: '投掷与简易工位',
    bonus: { 探索: { 战斗: 1 }, 狩猎: { 战斗: 1 }, 采集: { 采集: 4 } },
  },
  清水: {
    weight: 1,
    hint: '补水与保鲜',
    bonus: { 探索: { 后勤: 4 }, 狩猎: { 后勤: 3 }, 采集: { 后勤: 3 } },
  },
  黏土: {
    weight: 2,
    hint: '标记与封存',
    bonus: { 探索: { 后勤: 1 }, 狩猎: {}, 采集: { 采集: 2 } },
  },
};

function defaultMeta(name: string) {
  return {
    weight: 1,
    hint: '携带备用物资',
    bonus: { 探索: {}, 狩猎: {}, 采集: {} } as Record<SquadActionKey, PackSkillBonus>,
  };
}

export function listWarehousePackItems(
  reserves: Record<string, { 当前: number; 上限: number }>,
  mode: SquadActionKey,
): WarehousePackItem[] {
  return Object.entries(reserves)
    .filter(([, r]) => r.当前 > 0)
    .map(([id, r]) => {
      const meta = PACK_ITEM_META[id] ?? defaultMeta(id);
      return {
        id,
        label: id,
        stock: r.当前,
        weight: meta.weight,
        hint: meta.hint,
        bonus: meta.bonus[mode],
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label, 'zh'));
}

export function getItemPackWeight(itemId: string): number {
  return (PACK_ITEM_META[itemId] ?? defaultMeta(itemId)).weight;
}

export function calcPackBonus(
  loadout: Record<string, number> | undefined,
  mode: SquadActionKey,
): PackSkillBonus & { weight: number } {
  const bonus = { 狩猎: 0, 战斗: 0, 采集: 0, 后勤: 0, weight: 0 };
  if (!loadout) return bonus;
  for (const [itemId, qty] of Object.entries(loadout)) {
    if (qty <= 0) continue;
    const meta = PACK_ITEM_META[itemId] ?? defaultMeta(itemId);
    const skill = meta.bonus[mode];
    bonus.weight += meta.weight * qty;
    for (const key of ['狩猎', '战斗', '采集', '后勤'] as const) {
      bonus[key] += (skill[key] ?? 0) * qty;
    }
  }
  return bonus;
}

export function formatPackLoadout(loadout: Record<string, number> | undefined): string {
  if (!loadout) return '无';
  const parts = Object.entries(loadout)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => `${id}×${qty}`);
  return parts.length ? parts.join('、') : '无';
}

export function formatPackBonusText(bonus: PackSkillBonus): string {
  const parts: string[] = [];
  if (bonus.狩猎) parts.push(`狩猎+${bonus.狩猎}`);
  if (bonus.战斗) parts.push(`战斗+${bonus.战斗}`);
  if (bonus.采集) parts.push(`采集+${bonus.采集}`);
  if (bonus.后勤) parts.push(`后勤+${bonus.后勤}`);
  return parts.length ? parts.join(' ') : '无额外加成';
}
