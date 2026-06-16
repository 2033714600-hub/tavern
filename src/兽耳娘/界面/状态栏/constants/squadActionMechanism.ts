/** 探索编队三种行动的侧重与产出逻辑（与世界书【探索编队行动机制】一致） */
export type SquadActionKey = '探索' | '狩猎' | '采集';

export type SquadActionDef = {
  label: string;
  command: string;
  focus: string;
  outputs: { tier: string; text: string }[];
};

export const SQUAD_ACTION_MECHANISM: Record<SquadActionKey, SquadActionDef> = {
  探索: {
    label: '出发探索',
    command: '出发探索',
    focus: '探索未知区域，绘制地形与收集见闻。',
    outputs: [
      { tier: '主要', text: '新区域情报、周边部落动态或特殊见闻' },
      { tier: '次要', text: '少量基础材料（普通木柴、普通石料、生藤蔓）' },
      { tier: '罕见', text: '极低概率猎杀野兽，极少量生肉与皮毛' },
    ],
  },
  狩猎: {
    label: '外出狩猎',
    command: '外出狩猎',
    focus: '追踪野兽痕迹，进行猎杀与解剖。',
    outputs: [
      { tier: '主要', text: '猎物生肉、皮毛、骨骼与兽脂（依遭遇体型）' },
      { tier: '次要', text: '少量基础材料' },
      { tier: '罕见', text: '极低概率特殊区域情报或流浪者' },
    ],
  },
  采集: {
    label: '外出采集',
    command: '外出采集',
    focus: '在已掌握的安全区域内搜集自然资源。',
    outputs: [
      { tier: '基础', text: '大量常用材料（坚固木材、木柴、杂草、石料）' },
      { tier: '稀有', text: '小概率燧石、块茎、药用植物' },
      { tier: '珍贵', text: '极低概率发光矿屑、异星残骸等时代珍贵物' },
    ],
  },
};

/** 写入出发指令，供 AI 按机制结算 */
export function formatActionSettlementHint(key: SquadActionKey): string {
  const def = SQUAD_ACTION_MECHANISM[key];
  const tiers = def.outputs.map(o => `${o.tier}：${o.text}`).join('；');
  return `行动侧重：${def.focus}结算参考——${tiers}`;
}
