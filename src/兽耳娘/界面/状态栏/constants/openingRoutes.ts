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
    '你在坠星盆地湖边醒来，随身装备电量耗尽，被一支由十四名流浪兽耳娘组成的微型营地发现。',
    '乱石滩上的公共火塘已熄灭三天，族人因失去火种与初秋凉风而蜷缩；温饱度与栖居度濒临崩溃。',
    '白邀请你回营避风并分食，随后你将引导全族迁往针叶林侧的飞船残骸，以金属曲面挡住西北风。',
    '身份被视作无战斗力的无耳族；需靠生火、造物与分配建立威望，熬过第一个寒夜。',
  ],
  resources: [
    '人口 14 · 具名兽耳娘 4 + 无名族人 10',
    '温饱度 15 · 栖居度 10 · 向心力 5',
    '篝火燃料 0 · 食物储备极度匮乏',
    '仓库木材/藤蔓/石料/清水/黏土均为 0',
    '飞船能源低功耗 · 残骸控制中枢微光闪烁',
    '建筑：熄灭的火堆、漏风简易窝棚（旧营地）',
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
