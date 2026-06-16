import {
  CUSTOM_OPTION_ID,
  CUSTOM_START_SECTIONS,
  type CustomStartNotes,
  type CustomStartSelections,
  get_option_label,
} from '../constants/customStartOptions';

const PLAYER_OPENING_NAME = '玩家开局';

function get_char_worldbook_name(): string {
  const { primary } = getCharWorldbookNames('current');
  if (!primary) {
    throw new Error('未找到当前角色卡绑定的世界书，无法写入玩家开局设定');
  }
  return primary;
}

function resolve_section_value(
  section_id: string,
  selections: CustomStartSelections,
  custom_notes: CustomStartNotes,
): string {
  const section = CUSTOM_START_SECTIONS.find(s => s.id === section_id);
  if (!section) {
    return '';
  }
  const option_id = selections[section_id];
  if (option_id === CUSTOM_OPTION_ID) {
    return custom_notes[section_id]?.trim() || '（玩家未填写）';
  }
  const label = get_option_label(section_id, option_id);
  const option = section.options.find(o => o.id === option_id);
  if (option?.detail && option.id !== CUSTOM_OPTION_ID) {
    return `${label}：${option.detail}`;
  }
  return label;
}

/** 按 1. 2. 3. 4. 5. 排列玩家开局五项 */
export function format_numbered_opening_list(
  selections: CustomStartSelections,
  custom_notes: CustomStartNotes,
): string {
  return CUSTOM_START_SECTIONS.map((section, index) => {
    const value = resolve_section_value(section.id, selections, custom_notes);
    return `${index + 1}. ${section.title}：${value}`;
  }).join('\n');
}

function build_opening_entry_template(content: string): TypeFest.PartialDeep<WorldbookEntry> {
  return {
    name: PLAYER_OPENING_NAME,
    enabled: true,
    strategy: {
      type: 'constant',
      keys: [],
      keys_secondary: { logic: 'and_any', keys: [] },
      scan_depth: 'same_as_global',
    },
    position: {
      type: 'at_depth',
      role: 'system',
      depth: 4,
      order: 100,
    },
    content,
    probability: 100,
    recursion: {
      prevent_incoming: true,
      prevent_outgoing: true,
      delay_until: null,
    },
    effect: {
      sticky: null,
      cooldown: null,
      delay: null,
    },
  };
}

export function format_custom_opening_content(
  selections: CustomStartSelections,
  custom_notes: CustomStartNotes,
): string {
  const numbered = format_numbered_opening_list(selections, custom_notes);
  return `<玩家开局设定>\n${numbered}\n</玩家开局设定>`;
}

/** 在角色卡绑定的世界书中创建或替换「玩家开局」条目 */
export async function upsert_player_opening_entry(
  selections: CustomStartSelections,
  custom_notes: CustomStartNotes,
): Promise<void> {
  const worldbook_name = get_char_worldbook_name();
  const content = format_custom_opening_content(selections, custom_notes);
  const worldbook = await getWorldbook(worldbook_name);
  const existing = worldbook.find(entry => entry.name === PLAYER_OPENING_NAME);

  if (existing) {
    await updateWorldbookWith(worldbook_name, entries =>
      entries.map(entry =>
        entry.name === PLAYER_OPENING_NAME ? { ...entry, ...build_opening_entry_template(content) } : entry,
      ),
    );
    return;
  }

  await createWorldbookEntries(worldbook_name, [build_opening_entry_template(content)]);
}
