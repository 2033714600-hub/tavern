export {
  isStatusBarLocalMutation,
  markStatusBarLocalMutation,
} from '@util/common';

export async function withStatusBarMutation<T>(fn: () => T | Promise<T>): Promise<T> {
  markStatusBarLocalMutation();
  try {
    return await fn();
  } finally {
    markStatusBarLocalMutation();
  }
}
