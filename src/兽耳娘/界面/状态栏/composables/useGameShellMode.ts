import { useDataStore } from '../store';

function is_store_opening_ready(data: ReturnType<typeof useDataStore>['data']): boolean {
  if (Object.keys(data.具名NPC ?? {}).length > 0) {
    return true;
  }
  const world = data.世界;
  const camp = data.营地;
  const location = String(world?.当前位置 ?? '');
  const has_opening_world =
    Number(world?.生存天数) >= 1 &&
    location.length > 0 &&
    location !== '中央大陆' &&
    !String(world?.星历 ?? '').startsWith('2026年9月1日');
  const has_opening_camp = Number(camp?.向心力) > 5 || Number(camp?.生存指标?.温饱度) !== 15;
  return has_opening_world && has_opening_camp;
}

/** 开局变量是否已就绪（用于 App 流程切换） */
export function useGameShellMode() {
  const store = useDataStore();
  const opening_ready = computed(() => is_store_opening_ready(store.data));
  return { opening_ready };
}
