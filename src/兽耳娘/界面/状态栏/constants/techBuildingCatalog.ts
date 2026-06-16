import _ from 'lodash';
import type { BuildingScale } from '../../../util/estimateFacilityPlan';
import { SCALE_FACTOR } from '../../../util/estimateFacilityPlan';

export type TechBuilding = {
  name: string;
  description: string;
  effect: string;
  materials: Record<string, number>;
  hours: number;
  /** 须已写入【已解锁科技】；null 表示开局可用 */
  unlockTech: string | null;
  prerequisite?: string;
  defaultScale?: BuildingScale;
};

export const TECH_BUILDING_CATALOG: TechBuilding[] = [
  {
    name: '石砌防风火塘',
    description: '石块垒边、挡风半封闭的火塘，可稳定燃烧取暖。',
    effect: '提升栖居度与温饱度；减少夜间受寒事件',
    materials: { 石料: 8, 普通木柴: 5 },
    hours: 3,
    unlockTech: '火塘与避风',
    prerequisite: '需先完成研发「火塘与避风」',
  },
  {
    name: '加固兽皮窝棚',
    description: '以硬木支架与兽皮覆顶，改善漏风窝棚的避风与保温。',
    effect: '提升栖居度与舒适度；加快体力恢复',
    materials: { 坚固木材: 4, 藤蔓: 4, 兽皮碎料: 2 },
    hours: 4,
    unlockTech: '火塘与避风',
    prerequisite: '需先完成研发「火塘与避风」',
  },
  {
    name: '削尖木桩护栏',
    description: '营地外围削尖木桩与藤蔓绑扎的预警护栏。',
    effect: '提升防御等级与预警范围',
    materials: { 坚固木材: 10, 藤蔓: 5 },
    hours: 8,
    unlockTech: '火塘与避风',
    prerequisite: '需先完成研发「火塘与避风」',
  },
  {
    name: '烟熏肉架',
    description: '高架木架配合烟熏，延长肉食保存期。',
    effect: '解锁烟熏肉生产；降低食物腐烂损耗',
    materials: { 坚固木材: 4, 藤蔓: 3 },
    hours: 2,
    unlockTech: '火源与热加工',
    prerequisite: '需先完成研发「火源与热加工」',
  },
  {
    name: '垫木物资棚',
    description: '离地垫木搭建的简易物资棚，减少受潮损耗。',
    effect: '提升仓库有效上限；降低露天堆叠损耗',
    materials: { 坚固木材: 6, 藤蔓: 3 },
    hours: 5,
    unlockTech: '纤维与编织',
    prerequisite: '需先完成研发「纤维与编织」',
  },
  {
    name: '公共篝火广场',
    description: '石砌火塘与开阔活动区，供族人聚集与分食。',
    effect: '提升向心力；解锁公平分食相关事件',
    materials: { 石料: 10, 坚固木材: 6 },
    hours: 6,
    unlockTech: '公平分食制',
    prerequisite: '需先完成学习「公平分食制」',
  },
];

export function scaleBuildingMaterials(
  materials: Record<string, number>,
  hours: number,
  scale: BuildingScale,
): { materials: Record<string, number>; hours: number } {
  const factor = SCALE_FACTOR[scale];
  return {
    materials: _.mapValues(materials, v => Math.max(1, Math.round(v * factor))),
    hours: Math.max(1, Math.round(hours * factor * 10) / 10),
  };
}

export function isTechBuildingUnlocked(building: TechBuilding, unlocked: string[]): boolean {
  if (!building.unlockTech) {
    return true;
  }
  return unlocked.includes(building.unlockTech);
}

export function techBuildingPrerequisite(building: TechBuilding): string {
  return building.prerequisite ?? `需先解锁「${building.unlockTech}」`;
}
