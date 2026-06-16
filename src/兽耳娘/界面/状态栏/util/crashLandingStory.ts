/** 旧版迫降线正文（迫降线.txt 废案）中曾出现的标记，用于识别旧存档 */
export const CRASH_LANDING_STORY_MARKER = '坠星盆地的湖水';

/** 聊天记录中是否仍含旧版迫降线静态正文 */
export function has_crash_landing_story(): boolean {
  if (typeof getChatMessages !== 'function') {
    return false;
  }
  return getChatMessages('0-{{lastMessageId}}').some(msg => msg.message.includes(CRASH_LANDING_STORY_MARKER));
}
