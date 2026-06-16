import type { Schema } from '../../schema';

type Stat = Schema;
type Squad = Schema['探索编队'][string];
type NamedNpc = Schema['具名NPC'][string];

const OUTBOUND_TASK_RE = /探索|狩猎|采集|外出|带队|搜寻|追踪|出队/;
const RETURN_SIGNAL_RE = /睡眠|休息|待命|打呼噜|安置|返回|休整|放松|满足|清点|照顾|火塘|长屋/;

function member_indicates_outbound(npc: NamedNpc | undefined): boolean {
  if (!npc) return false;
  const task = npc.当前任务 ?? '';
  const state = npc.状态 ?? '';
  return OUTBOUND_TASK_RE.test(`${task}${state}`);
}

function member_indicates_return(npc: NamedNpc | undefined): boolean {
  if (!npc) return true;
  if (member_indicates_outbound(npc)) return false;
  const task = npc.当前任务 ?? '';
  const state = npc.状态 ?? '';
  const location = npc.当前位置 ?? '';
  if (RETURN_SIGNAL_RE.test(`${task}${state}`)) return true;
  if (/营地|长屋|火塘|聚落|残骸|营帐|窝棚/.test(location)) return true;
  return false;
}

function is_empty_squad(squad: Squad): boolean {
  return squad.具名成员.length === 0 && squad.无名队员数 <= 0;
}

/** 剧情推断自动生成的编队名（如「白·采集队」），玩家自定义名称不在此列 */
export function is_auto_inferred_squad_name(name: string): boolean {
  return /^.+·(采集|狩猎|探索)队$/.test(name);
}

/** AI 未把「探索中」改回「待命」时，据具名成员当前任务/状态推断是否已归营 */
export function should_squad_return_idle(squad: Squad, stat: Stat): boolean {
  if (squad.状态 === '待命') return false;
  if (is_empty_squad(squad)) return true;
  if (squad.具名成员.some(name => member_indicates_outbound(stat.具名NPC[name]))) {
    return false;
  }
  return squad.具名成员.every(name => member_indicates_return(stat.具名NPC[name]));
}

/**
 * 校正探索编队：归来后改待命；删除 AI 误 insert 的空编队。
 * @returns 是否发生了变更
 */
export function reconcile_exploration_squads(stat: Stat): boolean {
  let changed = false;
  const squads = stat.探索编队;

  for (const squad of _.values(squads)) {
    if (squad.状态 !== '待命' && should_squad_return_idle(squad, stat)) {
      squad.状态 = '待命';
      changed = true;
      console.info('[探索编队] 成员已归营，状态改为待命');
    }
  }

  for (const name of _.keys(squads)) {
    const squad = squads[name];
    if (squad.状态 === '待命' && is_empty_squad(squad) && is_auto_inferred_squad_name(name)) {
      delete squads[name];
      changed = true;
      console.info('[探索编队] 已移除空编队:', name);
    }
  }

  return changed;
}

type SquadKind = '采集' | '狩猎' | '探索';

function squad_kind_from_squad(name: string, squad: Squad): SquadKind | null {
  if (squad.状态 === '采集中') return '采集';
  if (squad.状态 === '狩猎中') return '狩猎';
  if (squad.状态 === '探索中') return '探索';
  const m = name.match(/·(采集|狩猎|探索)队$/);
  return m ? (m[1] as SquadKind) : null;
}

/** 据 NPC 当前任务判断应属哪类外出编队；留守/巡逻返回 null */
export function npc_preferred_squad_kind(npc: NamedNpc | undefined): SquadKind | null {
  if (!npc) return null;
  const task = (npc.当前任务 ?? '').trim();
  if (!task || task === '待指派' || /营地巡逻|守营|留守|看守|守夜/.test(task)) {
    return null;
  }
  if (/巡逻/.test(task) && !/外出/.test(task)) {
    return null;
  }
  if (/带领采集|外出采集|采集中|采集队/.test(task)) return '采集';
  if (/带领狩猎|外出狩猎|狩猎中|狩猎队/.test(task)) return '狩猎';
  if (/带领探索|外出探索|探索中|探索队/.test(task)) return '探索';
  return null;
}

/**
 * 具名成员不可重复占用多支队伍；移除非外出任务成员及任务类型不符的成员。
 */
export function reconcile_squad_member_exclusivity(stat: Stat): boolean {
  let changed = false;
  const squads = stat.探索编队;

  for (const [squadName, squad] of Object.entries(squads)) {
    for (const member of [...squad.具名成员]) {
      const npc = stat.具名NPC[member];
      const preferred = npc_preferred_squad_kind(npc);
      const squadKind = squad_kind_from_squad(squadName, squad);

      if (preferred === null) {
        if (squad.状态 !== '待命') {
          squad.具名成员 = squad.具名成员.filter(m => m !== member);
          changed = true;
          console.info('[探索编队] 移除非外出成员:', member, '←', squadName);
        }
        continue;
      }
      if (squadKind && squadKind !== preferred) {
        squad.具名成员 = squad.具名成员.filter(m => m !== member);
        changed = true;
        console.info('[探索编队] 成员任务与编队类型不符，移除:', member, squadName);
      }
    }
  }

  const memberSquads = new Map<string, string[]>();
  for (const [squadName, squad] of Object.entries(squads)) {
    for (const member of squad.具名成员) {
      const list = memberSquads.get(member) ?? [];
      list.push(squadName);
      memberSquads.set(member, list);
    }
  }

  for (const [member, squadNames] of memberSquads) {
    if (squadNames.length <= 1) continue;
    const preferred = npc_preferred_squad_kind(stat.具名NPC[member]);
    let keep = squadNames[0];
    for (const sn of squadNames) {
      const k = squad_kind_from_squad(sn, squads[sn]);
      if (k === preferred) {
        keep = sn;
        break;
      }
    }
    for (const sn of squadNames) {
      if (sn === keep) continue;
      const squad = squads[sn];
      if (squad.具名成员.includes(member)) {
        squad.具名成员 = squad.具名成员.filter(m => m !== member);
        changed = true;
        console.info('[探索编队] 具名成员不可重复，从', sn, '移除', member);
      }
    }
  }

  return changed;
}

/** 出发时同步更新具名成员的外出状态，避免与编队状态不一致 */
export function mark_squad_members_departed(
  stat: Stat,
  squad: Squad,
  mode: '探索' | '狩猎' | '采集',
  target_area: string,
): void {
  const task_label =
    mode === '探索' ? `探索：${target_area}` : mode === '狩猎' ? `外出狩猎：${target_area}` : `外出采集：${target_area}`;
  for (const name of squad.具名成员) {
    const npc = stat.具名NPC[name];
    if (!npc) continue;
    npc.当前任务 = task_label;
    npc.当前位置 = target_area;
    npc.状态 = '外出';
  }
}
