import { CRASH_LANDING_STORY_MARKER } from './crashLandingStory';
import { OPENING_REQUEST_MARKER } from './openingGenerate';

/** 是否已开始游玩（已有开局请求、旧版静态迫降正文，或楼层数大于 0） */
export function has_game_started(): boolean {
  if (typeof getChatMessages !== 'function') {
    return false;
  }
  const msgs = getChatMessages('0-{{lastMessageId}}');
  if (msgs.length > 1) {
    return true;
  }
  return msgs.some(
    msg =>
      msg.message.includes(OPENING_REQUEST_MARKER) ||
      msg.message.includes(CRASH_LANDING_STORY_MARKER),
  );
}
