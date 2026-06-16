/** 从酒馆助手 iframe 名称解析所在楼层，如 TH-message--0--0 → 0 */
export function get_host_message_id(): number | null {
  if (typeof getIframeName !== 'function') {
    return null;
  }
  const match = getIframeName().match(/^TH-message--(\d+)--/);
  if (!match) {
    return null;
  }
  const id = Number(match[1]);
  return Number.isFinite(id) ? id : null;
}
