import { canonicalizeCoreNpcRace } from './coreNpcCanon';

type NpcPanelField = '姓名' | '种族' | '饱食度' | '忠诚度' | '技能' | '行为' | '动作' | '表情' | '心里话';

export type ParsedNpcPanel = {
  姓名: string;
  种族: string;
  饱食度: string;
  忠诚度: string;
  技能: string;
  行为: string;
  动作: string;
  表情: string;
  心里话: string;
};

type JsonPatchOp = {
  op: string;
  path: string;
  value?: unknown;
};

const LABELED_FIELDS = new Set<NpcPanelField>(['姓名', '种族', '饱食度', '忠诚度', '技能', '行为']);

function parsePanelFields(content: string): Partial<Record<NpcPanelField, string>> {
  const fields: Partial<Record<NpcPanelField, string>> = {};
  const fieldRe = /\[(姓名|种族|饱食度|忠诚度|技能|行为|动作|表情|心里话)\|([^\]]*)\]/g;
  let fieldMatch: RegExpExecArray | null;
  while ((fieldMatch = fieldRe.exec(content)) !== null) {
    fields[fieldMatch[1] as NpcPanelField] = fieldMatch[2].trim();
  }

  if (!fields.姓名) {
    const compactRe = /\[([^[\]|]+)\|([^\]]+)\]/;
    const compact = content.match(compactRe);
    const label = compact?.[1]?.trim() ?? '';
    if (compact && label && !LABELED_FIELDS.has(label as NpcPanelField)) {
      fields.姓名 = label;
      fields.种族 = compact[2].trim();
    }
  }

  return fields;
}

function extractLooseBracketPanels(message: string): ParsedNpcPanel[] {
  const storyMatch = message.match(/<story>([\s\S]*?)<\/story>/i);
  const text = storyMatch?.[1] ?? message;
  const lines = text.split(/\r?\n/);
  const panels: ParsedNpcPanel[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line.startsWith('[') || !line.endsWith(']')) {
      i++;
      continue;
    }
    const compact = line.match(/^\[([^[\]|]+)\|([^\]]+)\]$/);
    if (!compact) {
      i++;
      continue;
    }
    const label = compact[1].trim();
    if (LABELED_FIELDS.has(label as NpcPanelField)) {
      i++;
      continue;
    }
    const blockLines = [line];
    let j = i + 1;
    while (j < lines.length) {
      const next = lines[j].trim();
      if (!next.startsWith('[') || !next.endsWith(']')) {
        break;
      }
      blockLines.push(next);
      j++;
    }
    if (blockLines.length < 2) {
      i++;
      continue;
    }
    const fields = parsePanelFields(blockLines.join('\n'));
    const name = cleanNpcName(fields.姓名 ?? label);
    if (!name) {
      i = j > i + 1 ? j : i + 1;
      continue;
    }
    panels.push({
      姓名: name,
      种族: fields.种族 ?? compact[2].trim(),
      饱食度: fields.饱食度 ?? '',
      忠诚度: fields.忠诚度 ?? '',
      技能: fields.技能 ?? '',
      行为: fields.行为 ?? '',
      动作: fields.动作 ?? '',
      表情: fields.表情 ?? '',
      心里话: fields.心里话 ?? '',
    });
    i = j > i + 1 ? j : i + 1;
  }
  return panels;
}

export function extractNpcPanels(message: string): ParsedNpcPanel[] {
  const regex = /(?:<|&lt;)npc_panel(?:>|&gt;)([\s\S]*?)(?:<|&lt;)\/npc_panel(?:>|&gt;)/gi;
  const panels: ParsedNpcPanel[] = [];
  const seen = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = regex.exec(message)) !== null) {
    const fields = parsePanelFields(match[1]);
    const name = cleanNpcName(fields.姓名 ?? '');
    if (!name) {
      continue;
    }
    seen.add(name);
    panels.push({
      姓名: name,
      种族: fields.种族 ?? '',
      饱食度: fields.饱食度 ?? '',
      忠诚度: fields.忠诚度 ?? '',
      技能: fields.技能 ?? '',
      行为: fields.行为 ?? '',
      动作: fields.动作 ?? '',
      表情: fields.表情 ?? '',
      心里话: fields.心里话 ?? '',
    });
  }
  for (const panel of extractLooseBracketPanels(message)) {
    if (seen.has(panel.姓名)) {
      continue;
    }
    seen.add(panel.姓名);
    panels.push(panel);
  }
  return panels;
}

function cleanNpcName(raw: string): string {
  const name = raw.trim();
  if (!name || /填入|代称|NPC名字/i.test(name)) {
    return '';
  }
  return name.replace(/^姓名[|:：]?/, '');
}

function parsePipeNumber(raw: string, fallback = 0): number {
  const head = raw.split('|')[0]?.trim() ?? '';
  const n = Number.parseInt(head.replace(/[^\d-]/g, ''), 10);
  return Number.isFinite(n) ? _.clamp(n, -100, 100) : fallback;
}

function parseSkills(raw: string) {
  const skills = { 狩猎: 0, 战斗: 0, 采集: 0, 后勤: 0 };
  for (const key of _.keys(skills) as (keyof typeof skills)[]) {
    const m = raw.match(new RegExp(`${key}\\s*[:：/]\\s*(\\d+)`));
    if (m) {
      skills[key] = _.clamp(Number.parseInt(m[1], 10), 0, 100);
    }
  }
  return skills;
}

function inferRaceType(race: string): '食草' | '食肉' | '杂食' | '未知' {
  if (race.includes('食草')) return '食草';
  if (race.includes('食肉')) return '食肉';
  if (race.includes('杂食')) return '杂食';
  return '未知';
}

function isUnrecruitedPanel(panel: ParsedNpcPanel): boolean {
  const loyalty = panel.忠诚度;
  return (
    loyalty.includes('尚未入营') ||
    loyalty.includes('未入营') ||
    loyalty.startsWith('—') ||
    loyalty.startsWith('-') ||
    /未收入|他族|外部/.test(panel.行为)
  );
}

export function isOpeningGenerationContext(): boolean {
  const msgs = getChatMessages(-20);
  return msgs.some(m => m.role === 'user' && m.message.includes('[开局生成]'));
}

function needsOpeningPatch(stat: Record<string, unknown>): boolean {
  const world = stat.世界 as Record<string, unknown> | undefined;
  const star = String(world?.星历 ?? '');
  return star.startsWith('2026年9月1日') || String(world?.当前位置 ?? '') === '中央大陆';
}

function buildGazeFromPanel(panel: ParsedNpcPanel) {
  return {
    动作: panel.动作.trim(),
    表情: panel.表情.trim(),
    心里话: panel.心里话.trim(),
  };
}

function buildCampNpc(panel: ParsedNpcPanel) {
  const loyalty = parsePipeNumber(panel.忠诚度, 10);
  const satiety = parsePipeNumber(panel.饱食度, 15);
  const mood = panel.忠诚度.split('|')[1]?.trim() || panel.饱食度.split('|')[1]?.trim() || '平静';
  const race = canonicalizeCoreNpcRace(panel.姓名, panel.种族);
  return {
    种族: race,
    职务: '',
    种族系: inferRaceType(race),
    忠诚度: loyalty,
    好感度: _.clamp(loyalty, 0, 100),
    体力: _.clamp(Math.round(satiety * 2.5), 10, 80),
    饱食度: _.clamp(satiety, 0, 100),
    心情: mood || '平静',
    状态: '正常',
    当前位置: '营地',
    当前任务: '待命',
    当前想法: panel.行为.trim(),
    互动状态: '无',
    孕期: '未孕',
    受孕日: 0,
    对视时: buildGazeFromPanel(panel),
    技能: parseSkills(panel.技能),
  };
}

function buildUnrecruitedNpc(panel: ParsedNpcPanel) {
  const favor = parsePipeNumber(panel.忠诚度, 20);
  const mood = panel.忠诚度.split('|')[1]?.trim() || '警惕';
  return {
    种族: panel.种族,
    好感度: _.clamp(favor, 0, 100),
    心情: mood || '警惕',
    状态: '正常',
    当前位置: '营地外',
    当前想法: panel.行为.trim(),
    技能: parseSkills(panel.技能),
  };
}

function normalizeRaceType(raw: unknown): '食草' | '食肉' | '杂食' | '未知' {
  const s = String(raw ?? '');
  if (s === '食草' || s === '食肉' || s === '杂食' || s === '未知') {
    return s;
  }
  if (s.includes('食草')) {
    return '食草';
  }
  if (s.includes('食肉')) {
    return '食肉';
  }
  if (s.includes('杂食')) {
    return '杂食';
  }
  return '未知';
}

function normalizeNpcRecord(value: Record<string, unknown>, name?: string): Record<string, unknown> {
  const v = klona(value);
  if (name) {
    v.种族 = canonicalizeCoreNpcRace(name, String(v.种族 ?? ''));
  }
  v.种族系 = normalizeRaceType(v.种族系 ?? v.种族);
  v.孕期 = v.孕期 ?? '未孕';
  v.受孕日 = v.受孕日 ?? 0;
  v.对视时 = (v.对视时 as object) ?? { 动作: '', 表情: '', 心里话: '' };
  v.互动状态 = v.互动状态 ?? '无';
  return v;
}

function normalizeWorld(value: Record<string, unknown>): Record<string, unknown> {
  const v = klona(value);
  const era = String(v.当前时代 ?? '');
  if (era !== '一' && era !== '二' && era !== '三') {
    v.当前时代 = /三|III|时代三/.test(era) ? '三' : /二|II|时代二/.test(era) ? '二' : '一';
  }
  if (typeof v.飞船能源 === 'number') {
    v.飞船能源 = v.飞船能源 <= 0 ? '耗尽' : '低功耗';
  }
  return v;
}

function normalizeCampState(value: Record<string, unknown>): Record<string, unknown> {
  const fuel = value.篝火燃料;
  if (typeof fuel === 'number' && Number.isFinite(fuel)) {
    value.篝火燃料 = { 当前: fuel, 上限: 1000 };
  }

  const state = (value.营地状态 as Record<string, unknown>) ?? {};
  const defense = String(state.营地防御 ?? '');
  if (defense && defense !== '极弱' && defense !== '初具雏形' && defense !== '坚不可摧') {
    state.营地防御 = /几无|极弱|脆弱|无防/.test(defense)
      ? '极弱'
      : /坚不可摧|稳固|坚固/.test(defense)
        ? '坚不可摧'
        : '初具雏形';
  }
  const housing = String(state.住所等级 ?? '');
  if (housing && !['露宿', '简陋窝棚', '稳固聚落', '石砌聚落', '舰城生活区'].includes(housing)) {
    state.住所等级 = /露天|露宿|漏风/.test(housing)
      ? '露宿'
      : /简陋|窝棚/.test(housing)
        ? '简陋窝棚'
        : /石砌/.test(housing)
          ? '石砌聚落'
          : /舰城|生活区/.test(housing)
            ? '舰城生活区'
            : /稳固|聚落/.test(housing)
              ? '稳固聚落'
              : '露宿';
  }
  value.营地状态 = state;
  return value;
}

function extractJsonPatch(message: string): JsonPatchOp[] | null {
  const match = message.match(/<JSONPatch>\s*([\s\S]*?)\s*<\/JSONPatch>/i);
  if (!match) {
    return null;
  }
  try {
    const parsed = JSON.parse(match[1]) as JsonPatchOp[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function applyPatchToStat(stat: Record<string, unknown>, patch: JsonPatchOp[], opening: boolean): string[] {
  const applied: string[] = [];

  for (const op of patch) {
    if (op.op === 'replace' && op.path.startsWith('/具名NPC/')) {
      const parts = op.path.split('/').filter(Boolean);
      if (parts.length >= 3 && parts[0] === '具名NPC') {
        const name = parts[1];
        const named = stat.具名NPC as Record<string, Record<string, unknown>> | undefined;
        const record = named?.[name];
        if (record) {
          if (parts.length === 3) {
            record[parts[2]] = op.value;
          } else if (parts.length === 4 && parts[2] === '对视时') {
            const gaze = (record.对视时 as Record<string, unknown>) ?? {};
            gaze[parts[3]] = op.value;
            record.对视时 = gaze;
          } else {
            _.set(record, parts.slice(2).join('.'), op.value);
          }
          applied.push(`replace:具名NPC/${parts.slice(1).join('/')}`);
        }
      }
      continue;
    }

    if (op.op === 'replace' && opening) {
      const path = op.path.replace(/^\//, '');
      if (['世界', '营地', '主角', '探索区域', '已解锁科技', '工作队列', '探索编队', '部族事务', '综合事物', '大地见闻'].includes(path)) {
        let value = op.value;
        if (path === '世界' && typeof value === 'object' && value !== null) {
          value = normalizeWorld(value as Record<string, unknown>);
        }
        if (path === '营地' && typeof value === 'object' && value !== null) {
          value = normalizeCampState(value as Record<string, unknown>);
        }
        _.set(stat, path, value);
        applied.push(`replace:${path}`);
      }
      continue;
    }

    if (op.op === 'insert' && op.path.startsWith('/具名NPC/')) {
      const name = op.path.split('/').pop();
      if (!name || typeof op.value !== 'object' || op.value === null) {
        continue;
      }
      const named = stat.具名NPC as Record<string, unknown> | undefined;
      if (named?.[name]) {
        continue;
      }
      assignNamedNpc(stat, name, normalizeNpcRecord(op.value as Record<string, unknown>, name));
      applied.push(`insert:具名NPC/${name}`);
    }
  }

  return applied;
}

function mergePanelsIntoStat(stat: Record<string, Record<string, unknown>>, message: string, opening: boolean): string[] {
  const panels = extractNpcPanels(message);
  if (panels.length === 0) {
    return [];
  }

  const inserted: string[] = [];
  for (const panel of panels) {
    const name = panel.姓名;
    const named = (stat.具名NPC as Record<string, unknown>) ?? {};
    const unrecruited = (stat.未收入兽耳娘 as Record<string, unknown>) ?? {};
    if (named[name] || unrecruited[name]) {
      if (named[name]) {
        const existing = named[name] as Record<string, unknown>;
        if (panel.行为.trim()) {
          existing.当前想法 = panel.行为.trim();
        }
        const gaze = (existing.对视时 as Record<string, string>) ?? {};
        if (panel.动作.trim()) {
          gaze.动作 = panel.动作.trim();
        }
        if (panel.表情.trim()) {
          gaze.表情 = panel.表情.trim();
        }
        if (panel.心里话.trim()) {
          gaze.心里话 = panel.心里话.trim();
        }
        if (panel.动作.trim() || panel.表情.trim() || panel.心里话.trim()) {
          existing.对视时 = gaze;
          inserted.push(`${name}→对视时`);
        }
      }
      continue;
    }

    const toUnrecruited = !opening && isUnrecruitedPanel(panel);
    if (toUnrecruited) {
      assignUnrecruitedNpc(stat, name, buildUnrecruitedNpc(panel));
    } else {
      assignNamedNpc(stat, name, buildCampNpc(panel));
    }
    inserted.push(`${name}→${toUnrecruited ? '未收入' : '营地'}`);
  }

  return inserted;
}

function getLatestMessageOption(): { type: 'message'; message_id: number } | null {
  try {
    const iframe_name = getIframeName();
    if (!iframe_name.startsWith('TH-message--')) {
      return null;
    }
    const message_id = getMessageId(iframe_name);
    if (typeof message_id !== 'number' || Number.isNaN(message_id)) {
      return null;
    }
    return { type: 'message', message_id };
  } catch {
    return null;
  }
}

function namedNpcCount(stat: Record<string, unknown> | undefined | null): number {
  if (!stat) {
    return 0;
  }
  return _.keys((stat.具名NPC as Record<string, unknown>) ?? {}).length;
}

/** MVU 在 schema 未注册或 insert 失败时会把 {} 锁死，须整体替换对象才能写入 */
function assignNamedNpc(stat: Record<string, unknown>, name: string, value: Record<string, unknown>) {
  const current = (stat.具名NPC as Record<string, unknown>) ?? {};
  stat.具名NPC = { ...current, [name]: value };
}

function assignUnrecruitedNpc(stat: Record<string, unknown>, name: string, value: Record<string, unknown>) {
  const current = (stat.未收入兽耳娘 as Record<string, unknown>) ?? {};
  stat.未收入兽耳娘 = { ...current, [name]: value };
}

/** 将单条消息中的 npc_panel / 开局 JSONPatch 合并进指定 stat_data */
export function mergeNpcDataFromMessageText(
  stat: Record<string, unknown>,
  message: string,
  opening: boolean,
): { patchApplied: string[]; panelsInserted: string[] } {
  const patch = extractJsonPatch(message);
  const patchApplied = patch && patch.length > 0 ? applyPatchToStat(stat, patch, opening) : [];
  const panelsInserted = mergePanelsIntoStat(stat as Record<string, Record<string, unknown>>, message, opening);
  return { patchApplied, panelsInserted };
}

export async function syncNpcPanelsFromMessage(message_id: number) {
  await waitGlobalInitialized('Mvu');
  const msgs = getChatMessages(message_id);
  const msg = msgs[0];
  if (!msg || msg.role !== 'assistant') {
    return;
  }

  const option = { type: 'message', message_id } as const;
  const mvu_data = Mvu.getMvuData(option);
  const stat = mvu_data?.stat_data as Record<string, unknown> | undefined;
  if (!stat) {
    return;
  }
  const opening = isOpeningGenerationContext() || needsOpeningPatch(stat);
  const hasNpcInsert = (extractJsonPatch(msg.message) ?? []).some(
    op => op.op === 'insert' && op.path.startsWith('/具名NPC/'),
  );

  if (!opening && !hasNpcInsert && extractNpcPanels(msg.message).length === 0) {
    return;
  }

  const { patchApplied, panelsInserted } = mergeNpcDataFromMessageText(stat, msg.message, opening);
  if (patchApplied.length === 0 && panelsInserted.length === 0) {
    return;
  }

  await Mvu.replaceMvuData(mvu_data, option);
  if (patchApplied.length > 0) {
    console.info('[NPC面板同步] 已从 JSONPatch 补写:', patchApplied.join('、'));
  }
  if (panelsInserted.length > 0) {
    console.info('[NPC面板同步] 已从 npc_panel 写入:', panelsInserted.join('、'));
  }
}

/** 当最新楼层 具名NPC 为空时，扫描全部 AI 楼层并从 npc_panel 回填 */
export async function backfillNpcPanelsIfEmpty() {
  await waitGlobalInitialized('Mvu');
  const option = getLatestMessageOption();
  if (!option) {
    return;
  }

  const mvu_data = Mvu.getMvuData(option);
  const stat = mvu_data?.stat_data as Record<string, unknown> | undefined;
  if (!stat || namedNpcCount(stat) > 0) {
    return;
  }

  const opening = isOpeningGenerationContext();
  const patchApplied: string[] = [];
  const panelsInserted: string[] = [];

  for (const msg of getChatMessages('0-{{lastMessageId}}')) {
    if (msg.role !== 'assistant') {
      continue;
    }
    const result = mergeNpcDataFromMessageText(stat, msg.message, opening);
    patchApplied.push(...result.patchApplied);
    panelsInserted.push(...result.panelsInserted);
  }

  if (patchApplied.length === 0 && panelsInserted.length === 0) {
    return;
  }

  await Mvu.replaceMvuData(mvu_data, option);
  console.info(
    '[NPC面板同步] 历史回填完成:',
    [...patchApplied, ...panelsInserted].join('、'),
  );
}
