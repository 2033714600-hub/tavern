import type { Schema } from '../schema';
import { OPENING_REQUEST_MARKER } from './openingStatus';

type Stat = Schema;
type Squad = Schema['探索编队'][string];
type SquadKind = '采集' | '狩猎' | '探索';

type SquadDraft = {
  name: string;
  具名成员: string[];
  无名队员数: number;
  目标区域: string;
  状态: Squad['状态'];
  计划时长: number;
};

const CAMP_LOCATION_RE = /营地|窝棚|火塘|长屋|聚落|营帐|残骸周边|乱石滩营地/;

function extractStory(text: string): string {
  const m = text.match(/(?:<|&lt;)story(?:>|&gt;)([\s\S]*?)(?:<|&lt;)\/story(?:>|&gt;)/i);
  return m?.[1] ?? text;
}

const CN_NUM: Record<string, number> = {
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
};

function parseUnnamedCount(seg: string): number {
  const digit = seg.match(/(\d+)\s*个?\s*(族人|无名|同行)/);
  if (digit) return parseInt(digit[1], 10);
  const cn = seg.match(/([一二两三四五六七八九十]+)\s*名?\s*(族人|无名|同行|拿着)/);
  if (cn) return CN_NUM[cn[1]] ?? 0;
  return 0;
}

function taskKind(task: string): SquadKind | null {
  const t = task.trim();
  if (/带领采集|采集队|外出采集|野果|菌子|采集中/.test(t)) return '采集';
  if (/带领狩猎|狩猎队|外出狩猎|猎物|猎杀|狩猎中/.test(t)) return '狩猎';
  if (/带领探索|探索队|外出探索|勘探|探索中/.test(t)) return '探索';
  return null;
}

function isSquadRelatedTask(task: string): boolean {
  return /带领.*队|外出(采集|狩猎|探索)|队.*外出/.test(task.trim());
}

function squadStatusFromMembers(members: string[], kind: SquadKind, stat: Stat): Squad['状态'] {
  const outbound = members.some(name => {
    const npc = stat.具名NPC[name];
    if (!npc) return false;
    if (npc.状态 === '外出') return true;
    if (/外出|带领/.test(npc.当前任务 ?? '')) return true;
    const loc = npc.当前位置 ?? '';
    return loc.length > 0 && !CAMP_LOCATION_RE.test(loc);
  });
  if (!outbound) return '待命';
  if (kind === '采集') return '采集中';
  if (kind === '狩猎') return '狩猎中';
  return '探索中';
}

function inferTargetArea(members: string[], stat: Stat): string {
  for (const name of members) {
    const loc = stat.具名NPC[name]?.当前位置 ?? '';
    if (!loc || CAMP_LOCATION_RE.test(loc)) continue;
    for (const areaName of Object.keys(stat.探索区域)) {
      if (loc.includes(areaName) || areaName.includes(loc)) return areaName;
    }
    return loc;
  }
  return '';
}

function squadNameFromMembers(members: string[], kind: SquadKind): string {
  return `${[...members].sort().join('')}·${kind}队`;
}

function parseUserSquadHints(text: string, knownNpcs: string[]): SquadDraft[] {
  const hints: SquadDraft[] = [];
  const segments = text
    .split(/[。；\n!?！？]/)
    .map(s => s.trim())
    .filter(Boolean);

  for (const seg of segments) {
    if (/\[(新建编队|解散编队|编队调整|工作队列|规划新设施|设施管理)/.test(seg)) {
      continue;
    }
    if (!/(队|采集|狩猎|探索|野果|材料|族人|无名|带领)/.test(seg)) continue;

    const kind: SquadKind = /狩猎|猎物|猎/.test(seg) ? '狩猎' : /探索/.test(seg) ? '探索' : '采集';
    const unnamed = parseUnnamedCount(seg);

    let members = knownNpcs.filter(n => seg.includes(n));
    if (/春.*菊|春菊/.test(seg)) members = _.uniq([...members, '春', '菊']);
    if (/林.*白/.test(seg)) members = _.uniq([...members, '林', '白']);
    members = members.filter(n => knownNpcs.includes(n));
    if (members.length === 0) continue;

    hints.push({
      name: squadNameFromMembers(members, kind),
      具名成员: members,
      无名队员数: unnamed,
      目标区域: '',
      状态: '待命',
      计划时长: 4,
    });
  }
  return hints;
}

function npc_is_idle_at_camp(npc: Stat['具名NPC'][string] | undefined): boolean {
  if (!npc) return true;
  if (npc.状态 === '外出') return false;
  const task = (npc.当前任务 ?? '').trim();
  if (/外出|带领.*队|采集中|狩猎中|探索中/.test(task)) return false;
  const location = npc.当前位置 ?? '';
  return !location || CAMP_LOCATION_RE.test(location);
}

function inferFromNpcTasks(stat: Stat): SquadDraft[] {
  const groups = new Map<SquadKind, string[]>();

  for (const [name, npc] of Object.entries(stat.具名NPC)) {
    if (npc_is_idle_at_camp(npc)) continue;
    const task = npc.当前任务 ?? '';
    const kind = taskKind(task);
    if (!kind || !isSquadRelatedTask(task)) continue;
    const list = groups.get(kind) ?? [];
    list.push(name);
    groups.set(kind, list);
  }

  const drafts: SquadDraft[] = [];
  for (const [kind, members] of groups) {
    const uniq = _.uniq(members);
    if (uniq.length === 0) continue;
    drafts.push({
      name: squadNameFromMembers(uniq, kind),
      具名成员: uniq,
      无名队员数: 0,
      目标区域: inferTargetArea(uniq, stat),
      状态: squadStatusFromMembers(uniq, kind, stat),
      计划时长: 4,
    });
  }
  return drafts;
}

function memberOverlap(a: string[], b: string[]): number {
  return a.filter(m => b.includes(m)).length;
}

function findExistingSquad(
  squads: Stat['探索编队'],
  members: string[],
): [string, Squad] | null {
  let best: [string, Squad] | null = null;
  let bestScore = 0;
  for (const [name, squad] of Object.entries(squads)) {
    const score = memberOverlap(members, squad.具名成员);
    if (score > bestScore) {
      bestScore = score;
      best = [name, squad];
    }
  }
  if (best && bestScore >= 1) return best;
  return null;
}

function mergeDrafts(npcDrafts: SquadDraft[], userDrafts: SquadDraft[]): SquadDraft[] {
  const merged = [...npcDrafts];

  for (const hint of userDrafts) {
    const idx = merged.findIndex(
      d =>
        d.name === hint.name ||
        (memberOverlap(d.具名成员, hint.具名成员) >= 1 &&
          draftKind(d) === draftKind(hint)),
    );
    if (idx >= 0) {
      merged[idx] = {
        ...merged[idx],
        具名成员: _.uniq([...merged[idx].具名成员, ...hint.具名成员]),
        无名队员数: Math.max(merged[idx].无名队员数, hint.无名队员数),
      };
    } else {
      merged.push(hint);
    }
  }
  return merged;
}

function draftKind(draft: SquadDraft): SquadKind {
  if (/·狩猎队/.test(draft.name)) return '狩猎';
  if (/·探索队/.test(draft.name)) return '探索';
  return '采集';
}

function filterDraftMembersByNpcTask(stat: Stat, draft: SquadDraft): SquadDraft {
  const kind = draftKind(draft);
  const members = draft.具名成员.filter(name => {
    const npc = stat.具名NPC[name];
    if (!npc) return true;
    const task = (npc.当前任务 ?? '').trim();
    if (!task || task === '待指派' || /营地巡逻|守营|留守|看守|守夜/.test(task)) {
      return false;
    }
    if (/巡逻/.test(task) && !/外出/.test(task)) {
      return false;
    }
    if (/外出狩猎|带领狩猎|狩猎队|狩猎中/.test(task)) return kind === '狩猎';
    if (/外出采集|带领采集|采集队|采集中/.test(task)) return kind === '采集';
    if (/外出探索|带领探索|探索队|探索中/.test(task)) return kind === '探索';
    return true;
  });
  return { ...draft, 具名成员: members };
}

function removeMemberFromOtherSquads(stat: Stat, member: string, keepSquad: string) {
  for (const [name, squad] of Object.entries(stat.探索编队)) {
    if (name === keepSquad) continue;
    if (squad.具名成员.includes(member)) {
      squad.具名成员 = squad.具名成员.filter(m => m !== member);
    }
  }
}

function getAssistantStoryContext(): string {
  if (typeof getChatMessages !== 'function') {
    return '';
  }
  const msgs = getChatMessages('0-{{lastMessageId}}');
  return msgs
    .filter(m => m.role === 'assistant')
    .slice(-4)
    .map(m => extractStory(m.message))
    .join('\n');
}

function applyDraft(stat: Stat, draft: SquadDraft, allowCreate: boolean): boolean {
  if (draft.具名成员.length === 0) return false;

  const existing = findExistingSquad(stat.探索编队, draft.具名成员);
  if (existing) {
    const [name, squad] = existing;
    let changed = false;
    if (allowCreate) {
      const nextMembers = _.uniq([...squad.具名成员, ...draft.具名成员]);
      if (!_.isEqual(nextMembers, squad.具名成员)) {
        squad.具名成员 = nextMembers;
        changed = true;
      }
      if (draft.无名队员数 > squad.无名队员数) {
        squad.无名队员数 = draft.无名队员数;
        changed = true;
      }
    }
    if (draft.目标区域 && !squad.目标区域) {
      squad.目标区域 = draft.目标区域;
      changed = true;
    }
    if (squad.状态 === '待命' && draft.状态 !== '待命') {
      squad.状态 = draft.状态;
      changed = true;
    }
    if (changed) {
      console.info('[探索编队] 从剧情同步更新:', name, squad.具名成员);
    }
    for (const member of squad.具名成员) {
      removeMemberFromOtherSquads(stat, member, name);
    }
    return changed;
  }

  if (Object.keys(stat.探索编队).some(n => stat.探索编队[n].具名成员.some(m => draft.具名成员.includes(m)))) {
    return false;
  }

  if (!allowCreate) {
    return false;
  }

  stat.探索编队[draft.name] = {
    状态: draft.状态,
    具名成员: draft.具名成员,
    无名队员数: draft.无名队员数,
    计划时长: draft.计划时长,
    目标区域: draft.目标区域,
    出行背包: {},
  };
  for (const member of draft.具名成员) {
    removeMemberFromOtherSquads(stat, member, draft.name);
  }
  console.info('[探索编队] 从剧情推断创建:', draft.name, draft.具名成员);
  return true;
}

/**
 * 开局阶段跳过推断：含 [开局生成] 且尚无开局 AI 回复之后的用户操作消息。
 * 避免开局正文中「狩猎队长」「采集」等词误触发编队创建。
 */
export function shouldSkipSquadInferDuringOpening(): boolean {
  if (typeof getChatMessages !== 'function') {
    return false;
  }
  const msgs = getChatMessages('0-{{lastMessageId}}');
  const openingUserIdx = msgs.findIndex(
    m => m.role === 'user' && m.message.includes(OPENING_REQUEST_MARKER),
  );
  if (openingUserIdx < 0) {
    return false;
  }
  const openingAssistant = msgs.slice(openingUserIdx + 1).find(m => m.role === 'assistant');
  if (!openingAssistant) {
    return true;
  }
  return !msgs.some(
    m =>
      m.role === 'user' &&
      m.message_id > openingAssistant.message_id &&
      !m.message.includes(OPENING_REQUEST_MARKER),
  );
}

/**
 * 当 AI 只更新了具名 NPC 任务/位置、未 insert 探索编队时，从对话与 NPC 状态推断编队并写入 stat_data。
 * 默认仅更新已有编队，不自动 insert（玩家/UI 新建的编队名不会被「白·采集队」类推断覆盖）。
 */
export function applySquadInferToStat(
  stat: Stat,
  options: { allowCreate?: boolean } = {},
): boolean {
  const allowCreate = options.allowCreate ?? false;
  if (shouldSkipSquadInferDuringOpening()) {
    return false;
  }
  const storyContext = getAssistantStoryContext();
  const knownNpcs = Object.keys(stat.具名NPC);

  const drafts = mergeDrafts(inferFromNpcTasks(stat), parseUserSquadHints(storyContext, knownNpcs));
  if (drafts.length === 0) return false;

  let changed = false;
  for (const draft of drafts) {
    const filtered = filterDraftMembersByNpcTask(stat, draft);
    if (filtered.具名成员.length === 0 && filtered.无名队员数 <= 0) continue;
    if (!filtered.目标区域) {
      filtered.目标区域 = inferTargetArea(filtered.具名成员, stat);
    }
    if (filtered.状态 === '待命') {
      filtered.状态 = squadStatusFromMembers(
        filtered.具名成员,
        draftKind(filtered),
        stat,
      );
    }
    if (applyDraft(stat, filtered, allowCreate)) changed = true;
  }
  return changed;
}
