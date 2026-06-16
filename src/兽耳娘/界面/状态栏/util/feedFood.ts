import type { Schema } from '../../../schema';

const FOOD_HINTS = [
  '肉',
  '粮',
  '果',
  '食',
  '鱼',
  '蜜',
  '浆',
  '饼',
  '汤',
  '饮',
  '奶',
  '蛋',
  '菜',
  '菇',
  '薯',
  '麦',
  '谷',
  '干',
  '熏',
  '嚼',
  '棒',
  '块',
  '酒',
  '粥',
  '面',
  '豆',
  '米',
  '饭',
  '籽',
  '根',
  '草',
  '鸟',
  '猎',
  '能',
  '口粮',
  '野',
  '熟',
  '生',
  '脆',
  '甜',
  '咸',
  '油',
  '盐',
  '糖',
  '饼',
  '糕',
];

export type FeedableItem = {
  name: string;
  qty: number;
  desc: string;
};

function looksLikeFood(name: string, desc: string): boolean {
  const text = `${name}${desc}`;
  return FOOD_HINTS.some(hint => text.includes(hint));
}

/** 从营地储物仓筛选可投喂的食物；若无明显食物标签则列出全部存货供选择 */
export function listFeedableWarehouseItems(物品栏: Schema['营地']['物品栏']): FeedableItem[] {
  const stocked = _.toPairs(物品栏)
    .filter(([, item]) => item.数量 > 0)
    .map(([name, item]) => ({
      name,
      qty: item.数量,
      desc: item.描述,
    }));
  const food = stocked.filter(item => looksLikeFood(item.name, item.desc));
  return (food.length ? food : stocked).sort((a, b) => a.name.localeCompare(b.name, 'zh'));
}
