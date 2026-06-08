import _ from 'lodash';
import { useDataStore } from '../store';

export function useMemberPool() {
  const store = useDataStore();

  const named_count = computed(() => _.keys(store.data.具名NPC).length);

  /** 营地中可充当「同行/协同」的无名族人上限（具名 NPC 不计入） */
  const unnamed_pool = computed(() => Math.max(0, store.data.营地.人口 - named_count.value));

  function squad_unnamed_used(exclude_squad?: string) {
    return _.sumBy(_.toPairs(store.data.探索编队), ([name, s]) =>
      name === exclude_squad ? 0 : s.无名队员数,
    );
  }

  function work_unnamed_used(exclude_work?: string) {
    return _.sumBy(_.toPairs(store.data.工作队列), ([name, w]) =>
      name === exclude_work ? 0 : w.协同兽耳娘数,
    );
  }

  function max_unnamed_for_squad(squad_name: string) {
    const used_elsewhere = squad_unnamed_used(squad_name) + work_unnamed_used();
    return Math.max(0, unnamed_pool.value - used_elsewhere);
  }

  function max_unnamed_for_work(work_name: string) {
    const used = squad_unnamed_used() + work_unnamed_used(work_name);
    return Math.max(0, unnamed_pool.value - used);
  }

  function assigned_named(exclude?: { kind: 'squad' | 'work'; name: string }) {
    const from_squads = _.flatMap(store.data.探索编队, (s, squad_name) =>
      exclude?.kind === 'squad' && exclude.name === squad_name ? [] : s.具名成员,
    );
    const from_work = _.flatMap(store.data.工作队列, (w, work_name) =>
      exclude?.kind === 'work' && exclude.name === work_name ? [] : w.具名指派,
    );
    return new Set([...from_squads, ...from_work]);
  }

  function available_named_for_squad(squad_name: string) {
    const squad = store.data.探索编队[squad_name];
    if (!squad) return [];
    const used = assigned_named({ kind: 'squad', name: squad_name });
    return _.keys(store.data.具名NPC).filter(n => squad.具名成员.includes(n) || !used.has(n));
  }

  function available_named_for_work(work_name: string) {
    const work = store.data.工作队列[work_name];
    if (!work) return [];
    const used = assigned_named({ kind: 'work', name: work_name });
    return _.keys(store.data.具名NPC).filter(n => work.具名指派.includes(n) || !used.has(n));
  }

  function work_efficiency_bonus(named: number, unnamed: number) {
    if (named <= 0 && unnamed <= 0) return 0;
    return _.clamp(named * 12 + unnamed * 6, 0, 80);
  }

  return {
    unnamed_pool,
    max_unnamed_for_squad,
    max_unnamed_for_work,
    available_named_for_squad,
    available_named_for_work,
    work_efficiency_bonus,
  };
}
