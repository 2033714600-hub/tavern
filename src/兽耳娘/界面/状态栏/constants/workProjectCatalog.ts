import type { GameEra } from '../util/workProjectEra';

export type WorkQueueType = '生产' | '建造' | '学习' | '研发';

export type WorkProject = {
  name: string;
  type: WorkQueueType;
  era: GameEra;
  materials: string;
  hours: number;
};

/** 与时代一科技简表对应，供工作队列「添加项目」选用 */
export const WORK_PROJECT_CATALOG: WorkProject[] = [
  // 生产 · 时代一
  { name: '硬化长矛', type: '生产', era: '一', materials: '坚固木材×1', hours: 0.5 },
  { name: '防身短棒', type: '生产', era: '一', materials: '普通木柴×1', hours: 0.2 },
  { name: '骨刀', type: '生产', era: '一', materials: '野兽骨骼×1, 藤蔓×1', hours: 1 },
  { name: '钻木取火套装', type: '生产', era: '一', materials: '坚固木材×1, 引火物×2', hours: 1 },
  { name: '韧化藤绳', type: '生产', era: '一', materials: '藤蔓×2', hours: 0.5 },
  { name: '缝合兽皮衣', type: '生产', era: '一', materials: '兽皮碎料×4, 藤蔓×1', hours: 3 },
  { name: '捣碎止血草糊', type: '生产', era: '一', materials: '止血草药×2', hours: 0.5 },
  { name: '简易绳套陷阱', type: '生产', era: '一', materials: '藤蔓×2, 普通木柴×1', hours: 0.5 },
  { name: '制备引火物', type: '生产', era: '一', materials: '杂草/树叶×3', hours: 0.2 },
  { name: '硬木背篓', type: '生产', era: '一', materials: '藤蔓×4, 坚固木材×1', hours: 1.5 },
  // 建造 · 时代一
  { name: '石砌防风火塘', type: '建造', era: '一', materials: '石料×8, 普通木柴×5', hours: 3 },
  { name: '加固兽皮窝棚', type: '建造', era: '一', materials: '坚固木材×4, 藤蔓×4, 兽皮×2', hours: 4 },
  { name: '削尖木桩护栏', type: '建造', era: '一', materials: '坚固木材×10, 藤蔓×5', hours: 8 },
  { name: '烟熏肉架', type: '建造', era: '一', materials: '坚固木材×4, 藤蔓×3', hours: 2 },
  { name: '垫木物资棚', type: '建造', era: '一', materials: '坚固木材×6, 藤蔓×3', hours: 5 },
  { name: '公共篝火广场', type: '建造', era: '一', materials: '石料×10, 坚固木材×6', hours: 6 },
  // 学习 · 时代一
  { name: '食物辨识', type: '学习', era: '一', materials: '未知野果/菌菇×10', hours: 6 },
  { name: '材料分级认知', type: '学习', era: '一', materials: '普通木柴×5, 杂草×5', hours: 2 },
  { name: '水源过滤认知', type: '学习', era: '一', materials: '清水×2', hours: 3 },
  { name: '公平分食制', type: '学习', era: '一', materials: '无（部族会议）', hours: 2 },
  // 研发 · 时代一
  { name: '木制武器阶段', type: '研发', era: '一', materials: '坚固木材×5', hours: 3 },
  { name: '骨质武器阶段', type: '研发', era: '一', materials: '野兽骨骼×4, 藤蔓×4', hours: 6 },
  { name: '石制武器阶段', type: '研发', era: '一', materials: '石料×8, 藤蔓×8', hours: 15 },
  { name: '火源与热加工', type: '研发', era: '一', materials: '普通木柴×3, 引火物×5', hours: 4 },
  { name: '纤维与编织', type: '研发', era: '一', materials: '藤蔓×10', hours: 5 },
  { name: '骨针与制皮', type: '研发', era: '一', materials: '野兽骨骼×2, 兽皮碎料×5', hours: 8 },
  { name: '火塘与避风', type: '研发', era: '一', materials: '石料×5, 坚固木材×2', hours: 5 },
  { name: '被动捕猎与陷阱', type: '研发', era: '一', materials: '藤蔓×5, 坚固木材×2', hours: 4 },
  { name: '基础负重', type: '研发', era: '一', materials: '藤蔓×5, 坚固木材×1', hours: 3 },
  { name: '自然辨识', type: '研发', era: '一', materials: '未知草药×10', hours: 6 },
];

export const QUEUE_GROUP_TYPES: Record<string, WorkQueueType[]> = {
  生产队列: ['生产', '建造'],
  学习队列: ['学习'],
  研发队列: ['研发'],
};
