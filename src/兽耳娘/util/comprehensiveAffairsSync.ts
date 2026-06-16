import type { Schema } from '../schema';
import { WORK_PROJECT_CATALOG } from '../界面/状态栏/constants/workProjectCatalog';

type Stat = Schema;

const CATALOG_NAMES = new Set(WORK_PROJECT_CATALOG.map(p => p.name));

const NON_WORK_QUEUE_NAME_RE =
  /营地巡逻|外围巡逻|营地警戒|营地守卫|营地放哨|^(日常)?巡逻$|放哨|守夜|守营|留守|看守/;

const PATROL_TASK_RE = /营地巡逻|外围巡逻|放哨|守营|留守|看守|守夜|巡逻/;

/** 不属于生产/学习/研发/建造队列的营地勤务（巡逻、放哨等） */
export function should_not_be_in_work_queue(workName: string): boolean {
  if (NON_WORK_QUEUE_NAME_RE.test(workName)) {
    return true;
  }
  if (/巡逻|警戒|看守|守营|留守/.test(workName) && !CATALOG_NAMES.has(workName)) {
    return true;
  }
  return false;
}

function affairNameFromTask(task: string): string {
  if (/营地巡逻|巡逻/.test(task)) return '营地巡逻';
  if (/放哨|守夜/.test(task)) return '营地放哨';
  if (/守营|留守|看守/.test(task)) return '营地值守';
  return task;
}

/** 将误写入工作队列的巡逻/勤务项迁移至综合事物 */
export function migrate_misplaced_work_queue_items(stat: Stat): boolean {
  let changed = false;
  for (const name of Object.keys(stat.工作队列)) {
    if (!should_not_be_in_work_queue(name)) continue;
    const work = stat.工作队列[name];
    const existing = stat.综合事物[name];
    if (!existing) {
      stat.综合事物[name] = {
        说明: work.状态 === '进行中' ? `正在进行：${name}` : `待安排：${name}`,
        状态: work.状态 === '进行中' ? '进行中' : '待定',
        具名参与: [...work.具名指派],
        来源: '由工作队列校正',
      };
    } else {
      existing.具名参与 = _.uniq([...existing.具名参与, ...work.具名指派]);
      if (work.状态 === '进行中') {
        existing.状态 = '进行中';
      }
    }
    delete stat.工作队列[name];
    changed = true;
    console.info('[综合事物] 已从工作队列迁出:', name);
  }
  return changed;
}

/** 据具名 NPC 当前任务补写尚未分类的营地勤务 */
export function sync_comprehensive_affairs_from_npc_tasks(stat: Stat): boolean {
  let changed = false;
  for (const [name, npc] of Object.entries(stat.具名NPC)) {
    const task = (npc.当前任务 ?? '').trim();
    if (!task || !PATROL_TASK_RE.test(task)) continue;
    if (/外出|狩猎|采集|探索|带领/.test(task)) continue;

    const affairName = affairNameFromTask(task);
    const existing = stat.综合事物[affairName];
    if (!existing) {
      stat.综合事物[affairName] = {
        说明: `执行${task}，维持营地安全与秩序。`,
        状态: '进行中',
        具名参与: [name],
        来源: '剧情',
      };
      changed = true;
      console.info('[综合事物] 从 NPC 任务写入:', affairName, name);
      continue;
    }
    if (!existing.具名参与.includes(name)) {
      existing.具名参与 = _.uniq([...existing.具名参与, name]);
      existing.状态 = '进行中';
      changed = true;
    }
  }
  return changed;
}

export function sync_comprehensive_affairs(stat: Stat): boolean {
  return migrate_misplaced_work_queue_items(stat) || sync_comprehensive_affairs_from_npc_tasks(stat);
}
