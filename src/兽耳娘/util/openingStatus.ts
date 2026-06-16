export const OPENING_REQUEST_MARKER = '[开局生成]';

const BODY_TAG_RE = /<(?:story|content)>[\s\S]*?<\/(?:story|content)>/i;

const STATUS_PLACEHOLDER_TAG = '<StatusPlaceHolderImpl/>';

export function is_opening_stat_ready(stat_data: Record<string, unknown>): boolean {
  const npc_count = _.keys(_.get(stat_data, '具名NPC', {})).length;
  if (npc_count > 0) {
    return true;
  }
  const world = _.get(stat_data, '世界', {}) as Record<string, unknown>;
  const camp = _.get(stat_data, '营地', {}) as Record<string, unknown>;
  const location = String(world.当前位置 ?? '');
  const has_opening_world =
    Number(world.生存天数) >= 1 &&
    location.length > 0 &&
    location !== '中央大陆' &&
    !String(world.星历 ?? '').startsWith('2026年9月1日');
  const has_opening_camp = Number(_.get(camp, '向心力')) > 5 || Number(_.get(camp, '生存指标.温饱度')) !== 15;
  return has_opening_world && has_opening_camp;
}

export function is_opening_complete(): boolean {
  if (typeof getVariables !== 'function') {
    return false;
  }
  const stat_data = _.get(getVariables({ type: 'message', message_id: 'latest' }), 'stat_data', {}) as Record<
    string,
    unknown
  >;
  return is_opening_stat_ready(stat_data);
}

export function get_last_opening_user_message_id(): number | null {
  if (typeof getChatMessages !== 'function') {
    return null;
  }
  const msgs = getChatMessages('0-{{lastMessageId}}');
  for (let i = msgs.length - 1; i >= 0; i--) {
    const msg = msgs[i];
    if (msg.role === 'user' && msg.message.includes(OPENING_REQUEST_MARKER)) {
      return msg.message_id;
    }
  }
  return null;
}

/** 已发送 [开局生成] 但尚无完整开局 AI 回复或变量未就绪 */
export function is_opening_generating(): boolean {
  const opening_user_id = get_last_opening_user_message_id();
  if (opening_user_id === null) {
    return false;
  }
  if (typeof getChatMessages !== 'function') {
    return true;
  }
  const msgs = getChatMessages('0-{{lastMessageId}}').filter(m => m.message_id > opening_user_id);
  const has_opening_story = msgs.some(
    m => m.role === 'assistant' && BODY_TAG_RE.test(m.message),
  );
  if (!has_opening_story) {
    return true;
  }
  return !is_opening_complete();
}

export function is_floor_zero_opening_complete(): boolean {
  return is_opening_complete() && !is_opening_generating();
}

function chat_has_opening_request(): boolean {
  if (typeof getChatMessages !== 'function') {
    return false;
  }
  return getChatMessages('0-{{lastMessageId}}').some(
    m => m.role === 'user' && m.message.includes(OPENING_REQUEST_MARKER),
  );
}

/** AI 漏写状态栏占位时补到开局 assistant 楼层 */
export async function ensure_opening_status_placeholder(message_id?: number): Promise<boolean> {
  if (typeof getChatMessages !== 'function' || typeof setChatMessages !== 'function') {
    return false;
  }
  if (!chat_has_opening_request()) {
    return false;
  }
  const target_id =
    typeof message_id === 'number'
      ? message_id
      : getChatMessages(-1, { role: 'assistant' })[0]?.message_id;
  if (typeof target_id !== 'number') {
    return false;
  }
  const msg = getChatMessages(target_id)[0];
  if (!msg || msg.role !== 'assistant') {
    return false;
  }
  if (/StatusPlaceHolderImpl/i.test(msg.message)) {
    return false;
  }
  if (!BODY_TAG_RE.test(msg.message)) {
    return false;
  }
  await setChatMessages(
    [{ message_id: target_id, message: `${msg.message.trimEnd()}\n\n${STATUS_PLACEHOLDER_TAG}` }],
    { refresh: 'affected' },
  );
  console.info('[开局生成] 已补写 StatusPlaceHolderImpl 到楼层', target_id);
  return true;
}

/** 进入部落后清空第 0 层显示（标题 iframe 仍保留在楼层 0，聊天区不再占位） */
export async function hide_floor_zero_display(): Promise<boolean> {
  if (typeof getChatMessages !== 'function' || typeof setChatMessages !== 'function') {
    return false;
  }
  const floor0 = getChatMessages(0)[0];
  if (!floor0 || floor0.role !== 'assistant' || !floor0.message.trim()) {
    return false;
  }
  await setChatMessages([{ message_id: 0, message: '' }], { refresh: 'affected' });
  console.info('[开局生成] 已隐藏第 0 层显示');
  return true;
}
