/** 聊天输入栏读写（独立模块，避免 useGameActions ↔ useActionUndo 循环依赖） */

export function findChatTextarea() {
  const selectors = ['#send_textarea', '#send_textarea_holder textarea'];
  for (const selector of selectors) {
    const el = $(selector);
    if (el.length) {
      return el;
    }
  }
  try {
    const parent$ = (window.parent as Window & { $?: JQueryStatic }).$;
    if (parent$) {
      for (const selector of selectors) {
        const el = parent$(selector);
        if (el.length) {
          return el;
        }
      }
    }
  } catch {
    /* 跨域时忽略 */
  }
  return null;
}

export async function appendInputLine(message: string) {
  const text = message.trim();
  if (!text) {
    return;
  }

  const $textarea = findChatTextarea();
  if ($textarea?.length) {
    const current = String($textarea.val() ?? '').trimEnd();
    const next = current ? `${current}\n${text}` : text;
    $textarea.val(next).trigger('input').trigger('change');
    try {
      ($textarea[0] as HTMLTextAreaElement | undefined)?.focus({ preventScroll: true });
    } catch {
      /* 父页 AutoComplete 偶发 getBoundingClientRect 报错，不影响追加 */
    }
    return;
  }

  if (typeof triggerSlash === 'function') {
    await triggerSlash(`/setinput ${text}`);
    return;
  }

  console.info('[兽耳娘]', text);
}

export function removeInputLine(line: string) {
  const target = line.trim();
  if (!target) {
    return;
  }
  const $textarea = findChatTextarea();
  if (!$textarea?.length) {
    return;
  }
  const lines = String($textarea.val() ?? '').split('\n');
  const idx = _.findLastIndex(lines, l => l.trim() === target);
  if (idx < 0) {
    return;
  }
  lines.splice(idx, 1);
  $textarea
    .val(lines.join('\n').trimEnd())
    .trigger('input')
    .trigger('change');
}
