import type { Schema } from '../../../schema';

export type EraProgressItem = { key: string; name: string };
export type EraProgressCategory = { title: string; items: EraProgressItem[] };

const ERA_ONE_PROGRESS: EraProgressCategory[] = [
  {
    title: '生存与人口维度',
    items: [
      { key: '温饱保障', name: '温饱度达60（可持续保障）' },
      { key: '食物储备', name: '拥有过冬/过夏储备' },
      { key: '向心力达标', name: '营地向心力超80' },
      { key: '人口规模', name: '人口规模超20人' },
    ],
  },
  {
    title: '基础设施维度',
    items: [
      { key: '防御体系', name: '防御等级达4级' },
      { key: '仓储体系', name: '仓库等级达3级' },
      { key: '核心火源', name: '建成石砌防风火塘' },
    ],
  },
  {
    title: '核心科技突破',
    items: [
      { key: '自主生火', name: '研发自主生火工具' },
      { key: '制陶技术', name: '烧制出实用陶器' },
      { key: '材料认知跨越', name: '解锁金属与黏土加工' },
    ],
  },
];

const ERA_PROGRESS_TITLES: Record<Schema['世界']['当前时代'], string> = {
  一: '时代一：原始求生 演进表',
  二: '时代二：聚落成型 演进表',
  三: '时代三：文明曙光 演进表',
};

function isBuildingBuilt(data: Schema, name: string): boolean {
  const building = data.营地.当前建筑[name];
  if (!building) {
    return false;
  }
  return building.建筑阶段 === '已建成' || building.建筑阶段 === '受损';
}

function hasInventoryMatch(data: Schema, pattern: RegExp): boolean {
  return Object.entries(data.营地.物品栏).some(
    ([name, item]) => pattern.test(name) && (item?.数量 ?? 0) > 0,
  );
}

function hasBuildingMatch(data: Schema, pattern: RegExp): boolean {
  return Object.keys(data.营地.当前建筑).some(
    name => pattern.test(name) && isBuildingBuilt(data, name),
  );
}

export function evaluateEraProgress(data: Schema): Record<string, boolean> {
  const { 营地: camp, 已解锁科技: unlocked } = data;

  return {
    温饱保障: camp.生存指标.温饱度 >= 60,
    食物储备: camp.营地状态.食物储备 === '储备充足',
    向心力达标: camp.向心力 >= 80,
    人口规模: camp.人口 >= 20,
    防御体系: camp.防御等级 >= 4,
    仓储体系: camp.仓库等级 >= 3,
    核心火源: isBuildingBuilt(data, '石砌防风火塘'),
    自主生火: unlocked.includes('火源与热加工') || isBuildingBuilt(data, '钻木取火套装'),
    制陶技术: hasInventoryMatch(data, /陶/) || hasBuildingMatch(data, /陶/),
    材料认知跨越: unlocked.includes('材料分级认知'),
  };
}

export function getEraProgressView(data: Schema): {
  title: string;
  categories: EraProgressCategory[];
  progress: Record<string, boolean>;
} {
  const era = data.世界.当前时代;
  const categories = era === '一' ? ERA_ONE_PROGRESS : [];

  return {
    title: ERA_PROGRESS_TITLES[era],
    categories,
    progress: era === '一' ? evaluateEraProgress(data) : {},
  };
}
