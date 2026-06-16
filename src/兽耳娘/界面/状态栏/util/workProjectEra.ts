import _ from 'lodash';
import type { WorkProject } from '../constants/workProjectCatalog';
import { isProjectUnlocked } from '../constants/workUnlock';
import { parseMaterialString, warehouseHasMaterials } from './materials';

export type GameEra = '一' | '二' | '三';

export const ERA_ORDER: GameEra[] = ['一', '二', '三'];

export const ERA_LABEL: Record<GameEra, string> = {
  一: '时代一',
  二: '时代二',
  三: '时代三',
};

export function eraUnlocked(current: GameEra, section: GameEra): boolean {
  return ERA_ORDER.indexOf(current) >= ERA_ORDER.indexOf(section);
}

export function projectReady(
  project: WorkProject,
  unlockedTech: string[],
  warehouse: Record<string, { 当前: number; 上限: number }>,
): boolean {
  if (!isProjectUnlocked(project, unlockedTech)) {
    return false;
  }
  const mats = parseMaterialString(project.materials);
  return warehouseHasMaterials(mats, warehouse);
}

export function sortProjectsForDisplay(
  projects: WorkProject[],
  unlockedTech: string[],
  warehouse: Record<string, { 当前: number; 上限: number }>,
): WorkProject[] {
  return _.sortBy(projects, p => {
    const ready = projectReady(p, unlockedTech, warehouse);
    const unlocked = isProjectUnlocked(p, unlockedTech);
    return [ready ? 0 : unlocked ? 1 : 2, p.name];
  });
}

export type EraProjectSection = {
  era: GameEra;
  label: string;
  locked: boolean;
  projects: WorkProject[];
};

export function groupProjectsByEra(
  projects: WorkProject[],
  currentEra: GameEra,
  unlockedTech: string[],
  warehouse: Record<string, { 当前: number; 上限: number }>,
): EraProjectSection[] {
  return ERA_ORDER.map(era => ({
    era,
    label: ERA_LABEL[era],
    locked: !eraUnlocked(currentEra, era),
    projects: sortProjectsForDisplay(
      projects.filter(p => p.era === era),
      unlockedTech,
      warehouse,
    ),
  }));
}
