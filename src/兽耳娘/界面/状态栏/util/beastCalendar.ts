/** 变量字段仍为「星历」，界面统一显示为兽历 */
export function format_beast_calendar(raw: string | undefined): string {
  const text = String(raw ?? '').trim();
  if (!text) {
    return '兽历2026年9月1日';
  }
  if (text.startsWith('兽历')) {
    return text;
  }
  if (text.startsWith('星历')) {
    return text.replace(/^星历/, '兽历');
  }
  return `兽历${text}`;
}

/** 写入 MVU 前规范化：去掉旧「星历」前缀，保留纯日期供 schema 存储 */
export function normalize_calendar_storage(raw: string | undefined): string {
  const text = String(raw ?? '').trim();
  if (!text) {
    return '2026年9月1日';
  }
  return text.replace(/^兽历/, '').replace(/^星历/, '');
}
