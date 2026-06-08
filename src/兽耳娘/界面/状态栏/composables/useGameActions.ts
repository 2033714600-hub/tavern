/**
 * 将交互文本填入酒馆当前聊天输入框，由玩家自行发送，不直接写入楼层、不触发 AI。
 */
export async function sendUserAction(message: string) {
  const text = message.trim();
  if (!text) {
    return;
  }

  const $textarea = findChatTextarea();
  if ($textarea?.length) {
    $textarea.val(text).trigger('input').trigger('change');
    ($textarea[0] as HTMLTextAreaElement | undefined)?.focus({ preventScroll: true });
    return;
  }

  if (typeof triggerSlash === 'function') {
    await triggerSlash(`/setinput ${text}`);
    return;
  }

  console.info('[兽耳娘]', text);
}

function findChatTextarea() {
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
