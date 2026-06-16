import { klona } from 'klona';
import _ from 'lodash';
import type { Schema } from '../../../schema';
import { useDataStore } from '../store';
import { removeInputLine } from './chatInput';

type UndoEntry = {
  data: Schema;
  inputLine?: string;
};

const undoStack = ref<UndoEntry[]>([]);

export const canUndo = computed(() => undoStack.value.length > 0);

/** 在修改 store 之前调用，记录可撤回快照 */
export function pushUndoSnapshot(inputLine?: string) {
  const store = useDataStore();
  undoStack.value.push({
    data: klona(store.data) as Schema,
    inputLine: inputLine?.trim() || undefined,
  });
}

function applySnapshot(snapshot: Schema) {
  const snap = klona(snapshot);
  const target = useDataStore().data as Schema;
  for (const key of _.keys(target)) {
    if (!(key in snap)) {
      delete (target as Record<string, unknown>)[key];
    }
  }
  for (const key of _.keys(snap) as (keyof Schema)[]) {
    target[key] = klona(snap[key]) as Schema[typeof key];
  }
}

export function undoLastAction() {
  const entry = undoStack.value.pop();
  if (!entry) {
    toastr.info('没有可撤回的操作');
    return;
  }
  applySnapshot(entry.data);
  if (entry.inputLine) {
    removeInputLine(entry.inputLine);
  }
  toastr.info('已撤回上一步操作');
}

export function clearUndoStack() {
  undoStack.value = [];
}
