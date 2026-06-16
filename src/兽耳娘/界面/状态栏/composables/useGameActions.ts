import { appendInputLine } from './chatInput';
import { markStatusBarLocalMutation } from './useStatusBarMutation';
import { pushUndoSnapshot } from './useActionUndo';

/** 仅追加聊天输入栏文本，不记录撤回点 */
export async function sendUserAction(message: string) {
  await appendInputLine(message);
}

/**
 * 标准交互：先记录撤回点 → 修改 store → 追加输入栏（未发送前可点「撤回」还原）
 */
export async function runUserAction(message: string, mutate: () => void | Promise<void>) {
  const text = message.trim();
  pushUndoSnapshot(text || undefined);
  markStatusBarLocalMutation(10000);
  await mutate();
  if (text) {
    await appendInputLine(text);
  }
}

/** 仅修改 store、不写输入栏 */
export function runStoreAction(mutate: () => void) {
  pushUndoSnapshot();
  markStatusBarLocalMutation();
  mutate();
}

export { removeInputLine } from './chatInput';
