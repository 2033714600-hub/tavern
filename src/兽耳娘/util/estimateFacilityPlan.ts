import _ from 'lodash';

export type FacilityCategory = '生存维生' | '生产加工' | '防御警戒' | '居住舒适' | '通用';
export type BuildingScale = '小型' | '中型' | '大型';

export type FacilityEstimate = {
  类别: FacilityCategory;
  规模: BuildingScale;
  所需材料: Record<string, number>;
  所需工时: number;
};

type Recipe = {
  pattern: RegExp;
  类别: FacilityCategory;
  材料: Record<string, number>;
  工时: number;
};

/** 按名称/描述优先匹配具体建筑配方（越靠前越优先） */
const BUILDING_RECIPES: Recipe[] = [
  {
    pattern: /温泉|浴池|汤池|澡堂|洗浴池/,
    类别: '居住舒适',
    材料: { 石料: 100, 黏土: 60, 坚固木材: 30, 藤蔓: 18 },
    工时: 60,
  },
  {
    pattern: /瓦房|瓦屋|茅瓦|砖房|石屋|木屋|民居|住宅|加固窝棚|聚落居所/,
    类别: '居住舒适',
    材料: { 坚固木材: 60, 瓦片: 120, 石料: 40, 黏土: 45, 藤蔓: 25 },
    工时: 48,
  },
  {
    pattern: /帐篷|兽皮棚|窝棚|草棚|铺盖|寝屋/,
    类别: '居住舒适',
    材料: { 坚固木材: 28, 藤蔓: 16, 黏土: 8 },
    工时: 14,
  },
  {
    pattern: /火塘|火堆|篝火|公共火/,
    类别: '生存维生',
    材料: { 石料: 25, 黏土: 15, 坚固木材: 18, 藤蔓: 10 },
    工时: 12,
  },
  {
    pattern: /储水|陶缸|水缸|蓄水池|沥水|沟渠/,
    类别: '生存维生',
    材料: { 黏土: 40, 石料: 20, 藤蔓: 12 },
    工时: 22,
  },
  {
    pattern: /熏肉|制革|石器打磨|作坊|工坊|加工台/,
    类别: '生产加工',
    材料: { 坚固木材: 45, 石料: 25, 藤蔓: 22, 黏土: 15 },
    工时: 32,
  },
  {
    pattern: /瞭望|哨塔|警戒塔/,
    类别: '防御警戒',
    材料: { 坚固木材: 55, 石料: 35, 藤蔓: 28 },
    工时: 36,
  },
  {
    pattern: /拒马|尖刺|木栅|壁垒|掩体/,
    类别: '防御警戒',
    材料: { 坚固木材: 50, 石料: 30, 藤蔓: 35 },
    工时: 28,
  },
];

const CATEGORY_FALLBACK: Record<FacilityCategory, { 材料: Record<string, number>; 工时: number }> = {
  生存维生: { 材料: { 坚固木材: 22, 藤蔓: 12, 石料: 15, 黏土: 10 }, 工时: 16 },
  生产加工: { 材料: { 坚固木材: 38, 藤蔓: 20, 石料: 18, 黏土: 12 }, 工时: 28 },
  防御警戒: { 材料: { 坚固木材: 48, 石料: 28, 藤蔓: 25 }, 工时: 30 },
  居住舒适: { 材料: { 坚固木材: 35, 藤蔓: 18, 黏土: 20, 石料: 15 }, 工时: 20 },
  通用: { 材料: { 坚固木材: 30, 藤蔓: 15, 石料: 12 }, 工时: 18 },
};

const CATEGORY_KEYWORDS: Record<Exclude<FacilityCategory, '通用'>, string[]> = {
  生存维生: ['维生', '取暖', '照明', '净水', '泉水', '御寒'],
  生产加工: ['生产', '加工', '架', '台', '转化', '保存'],
  防御警戒: ['防御', '警戒', '预警', '护卫'],
  居住舒适: ['居住', '舒适', '洗浴', '防风', '避雨', '休息', '清洗', '环境'],
};

const SCALE_FACTOR: Record<BuildingScale, number> = {
  小型: 0.55,
  中型: 1,
  大型: 1.7,
};

function detectScale(text: string): BuildingScale {
  if (/简易|初级|小型|临时|破旧|简陋/.test(text)) return '小型';
  if (/大型|高级|双层|扩建|复合|堡垒|旗舰|巨型|舰城|石砌聚落/.test(text)) return '大型';
  return '中型';
}

function detectCategory(text: string): FacilityCategory {
  let best: FacilityCategory = '通用';
  let best_score = 0;
  for (const [category, keywords] of _.entries(CATEGORY_KEYWORDS)) {
    const score = keywords.filter(kw => text.includes(kw)).length;
    if (score > best_score) {
      best_score = score;
      best = category;
    }
  }
  return best;
}

function matchRecipe(text: string): Recipe | null {
  return BUILDING_RECIPES.find(r => r.pattern.test(text)) ?? null;
}

function scaleRecipe(
  材料: Record<string, number>,
  工时: number,
  scale: BuildingScale,
): { 所需材料: Record<string, number>; 所需工时: number } {
  const factor = SCALE_FACTOR[scale];
  const 所需材料 = _.mapValues(材料, v => Math.max(1, Math.round(v * factor)));
  const 所需工时 = Math.max(4, Math.round(工时 * factor));
  return { 所需材料, 所需工时 };
}

/** 根据自定义规划内容估算材料消耗与建造工时（小时） */
export function estimateFacilityPlan(name: string, desc: string, func: string): FacilityEstimate {
  const text = `${name} ${desc} ${func}`;
  const scale = detectScale(text);
  const recipe = matchRecipe(text);

  if (recipe) {
    const scaled = scaleRecipe(recipe.材料, recipe.工时, scale);
    return { 类别: recipe.类别, 规模: scale, ...scaled };
  }

  const category = detectCategory(text);
  const fallback = CATEGORY_FALLBACK[category];
  const scaled = scaleRecipe(fallback.材料, fallback.工时, scale);
  return { 类别: category, 规模: scale, ...scaled };
}

export function formatMaterials(materials: Record<string, number>): string {
  return _.entries(materials)
    .map(([name, qty]) => `${name} ${qty}`)
    .join('、');
}

export function warehouseHasMaterials(
  materials: Record<string, number>,
  warehouse: Record<string, { 当前: number; 上限: number }>,
): boolean {
  return _.every(materials, (need, name) => (warehouse[name]?.当前 ?? 0) >= need);
}
