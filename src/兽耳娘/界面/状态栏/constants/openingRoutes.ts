export type OpeningRoute = {
  id: string;
  name: string;
  badge?: string;
  description: string[];
  resources: string[];
  available: boolean;
  placeholder?: string;
};

/** 与当前角色卡开场（初至残骸 / initvar）对齐的迫降路线 */
export const CRASH_LANDING_ROUTE: OpeningRoute = {
  id: 'crash_landing',
  name: '迫降路线',
  badge: '默认',
  available: true,
  description: [
    '春在坠星盆地针叶林边的破降舱轨迹尽头发现昏迷的你，将你作为罕见「无耳族雄性」扛回乱石滩营地。',
    '十四人微型营地公共火塘已熄灭三天，初秋傍晚冷风灌入漏风兽皮窝棚，全员挨饿受冻。',
    '苏醒后菊持骨刀审视、白坦言养不活外人；你以随身高压缩能量棒破局，先递给林再让白切碎分给众人。',
    '族人态度随之转变，但身份仍被视为瘦弱废品雄性，需靠长期物资与分配逐步建立威望。',
  ],
  resources: [
    '人口 14 · 具名兽耳娘 4（菊/春/白/林）+ 无名族人 10',
    '温饱度 15 · 栖居度 10 · 向心力 5',
    '篝火燃料 0 · 食物储备极度匮乏',
    '随身：军用能量棒/口粮（少量，开局将消耗部分）',
    '破降舱在营地附近针叶林 · 仓库木材/藤蔓/石料/清水/黏土均为 0',
    '建筑：简易火塘、漏风兽皮窝棚（乱石滩营地）',
  ],
};

export const PLACEHOLDER_ROUTES: OpeningRoute[] = [
  {
    id: 'more_routes',
    name: '更多路线',
    available: false,
    placeholder: '正在路上',
    description: [],
    resources: [],
  },
];
