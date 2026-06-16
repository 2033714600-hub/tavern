import _ from 'lodash';
import type { Schema } from '../../../schema';
import { WORK_PROJECT_CATALOG } from '../constants/workProjectCatalog';
import { parseMaterialString, warehouseHasMaterials } from './materials';

export function syncWorkActivation(
  work_name: string,
  work_queue: Schema['工作队列'],
  buildings: Schema['营地']['当前建筑'],
  warehouse: Schema['营地']['仓库储备'],
) {
  const work = work_queue[work_name];
  if (!work) return;

  if (work.具名指派.length === 0) {
    work.状态 = '待指派';
    return;
  }

  const building = buildings[work_name];
  if (building?.所需材料 && !_.isEmpty(building.所需材料)) {
    work.状态 = warehouseHasMaterials(building.所需材料, warehouse) ? '进行中' : '缺料停工';
    return;
  }

  const project = WORK_PROJECT_CATALOG.find(p => p.name === work_name);
  if (project) {
    const mats = parseMaterialString(project.materials);
    work.状态 = warehouseHasMaterials(mats, warehouse) ? '进行中' : '缺料停工';
    return;
  }

  work.状态 = '进行中';
}
