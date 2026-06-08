export const CUSTOM_OPTION_ID = 'custom';

export type CustomOption = {
  id: string;
  label: string;
  detail: string;
  difficulty?: string;
};

export type CustomStartSection = {
  id: string;
  title: string;
  hint: string;
  options: CustomOption[];
};

export type CustomStartSelections = Record<string, string>;

/** 各栏目选择「自定义」时玩家填写的文本 */
export type CustomStartNotes = Record<string, string>;

const CUSTOM_OPTION: CustomOption = {
  id: CUSTOM_OPTION_ID,
  label: '自定义',
  detail: '自行填写该项设定，写入「玩家开局」世界书条目。',
};

function with_custom_option(options: CustomOption[]): CustomOption[] {
  return [...options, CUSTOM_OPTION];
}

export const CUSTOM_START_SECTIONS: CustomStartSection[] = [
  {
    id: 'region',
    title: '降生区域',
    hint: '决定环境难度、周边资源与野兽类型，影响世界.当前位置与探索区域初始状态。',
    options: with_custom_option([
      { id: 'forest_edge', label: '中央大陆林缘', difficulty: '标准', detail: '气候相对温和，有基础果子与小型野兽，偶尔遭遇狼群。' },
      { id: 'frozen_north', label: '极北冻土边缘', difficulty: '困难', detail: '开局即面临极寒降温，须在两天内生火御寒，但周边或有稀有矿物。' },
      { id: 'sun_scorch', label: '烈日荒原', difficulty: '地狱', detail: '极度缺水，野兽凶猛，须立刻寻找水源，否则温饱与体力快速见底。' },
      { id: 'west_isles', label: '西部半岛群', difficulty: '简单', detail: '气候宜人，可捕鱼捡贝度过前期，但缺乏高级木材与金属残骸。' },
    ]),
  },
  {
    id: 'identity',
    title: '初始身份与种族认知',
    hint: '影响 NPC 初始好感、忠诚度与威望称号。',
    options: with_custom_option([
      { id: 'waste_male', label: '无耳族 / 废品雄性', detail: '被视为无战斗力与繁衍价值；初始忠诚度 0~20，须靠科技立威。' },
      { id: 'fallen_god', label: '坠星神明', detail: '降落伴随异象被迷信部族目击；初始威望高、忠诚度 40+，但神迹难续会遭反噬。' },
      { id: 'prisoner', label: '异族战俘', detail: '被强力纯血部落俘虏，装备被收走，强制劳作，须低向心力下寻逃脱或篡权。' },
    ]),
  },
  {
    id: 'camp',
    title: '初始营地状态',
    hint: '决定营地指标初始值与人口规模。',
    options: with_custom_option([
      { id: 'lone_wolf', label: '单人流浪者', detail: '无营地无同伴，须自建窝棚并在探索中收留族人。' },
      { id: 'lake_camp', label: '濒临解散的微型营地', detail: '接手温饱度 <20、向心力极低的烂摊子，如湖畔十四人营地。' },
      { id: 'small_tribe', label: '成型的小型部落', detail: '开局 10~20 人口，有火塘与漏风栅栏，但面临外部收编威胁。' },
    ]),
  },
  {
    id: 'gear',
    title: '随身装备与飞船遗物',
    hint: '决定科技降维打击力度与飞船能源状态。',
    options: with_custom_option([
      { id: 'gear_broken', label: '装备全损', detail: '仅一身破衣，一切科技从零手搓，连生火都需钻木取火。' },
      { id: 'backup_power', label: '备用电源尚存', detail: '终端可短暂扫描，或有少量弹药枪械/有电高周波铲，可强杀大型野兽立威。' },
      { id: 'cryo_pod', label: '迫降的休眠舱', detail: '自带恒温微电休眠舱为核心，但会引来周边部落觊觎。' },
    ]),
  },
  {
    id: 'season',
    title: '季节开局点',
    hint: '影响世界.季节与倒计时天灾事件。',
    options: with_custom_option([
      { id: 'spring', label: '初春', detail: '万物复苏，食物充足，适合慢慢种田发展。' },
      { id: 'summer', label: '盛夏', detail: '须面对特大雷暴天灾倒计时。' },
      { id: 'autumn', label: '初秋', detail: '距致命寒冬时日无多，前期节奏极快，生存压力拉满。' },
      { id: 'winter', label: '寒冬', detail: '开局即处凛冬，取暖与食物是生死线，任何失误都可能导致族人失温或饿死。' },
    ]),
  },
];

export const DEFAULT_CUSTOM_SELECTIONS: CustomStartSelections = {
  region: 'forest_edge',
  identity: 'waste_male',
  camp: 'lake_camp',
  gear: 'gear_broken',
  season: 'autumn',
};

export function create_default_custom_notes(): CustomStartNotes {
  return Object.fromEntries(CUSTOM_START_SECTIONS.map(s => [s.id, '']));
}

export function get_option_label(section_id: string, option_id: string): string {
  const section = CUSTOM_START_SECTIONS.find(s => s.id === section_id);
  if (option_id === CUSTOM_OPTION_ID) {
    return '自定义';
  }
  return section?.options.find(o => o.id === option_id)?.label ?? option_id;
}
