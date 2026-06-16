import { ensure_opening_status_placeholder } from '../../util/openingStatus';
import { isStatusBarLocalMutation } from '@util/common';
import { backfillNpcPanelsIfEmpty, syncNpcPanelsFromMessage } from '../../util/npcPanelSync';
import { applySquadInferToStat } from '../../util/squadInferSync';
import { reconcile_squad_member_exclusivity } from '../../界面/状态栏/util/squadSync';
import { inferCampfireFuelFromStory, syncFirepitWithFuel } from '../../界面/状态栏/util/campfire';
import { sync_comprehensive_affairs } from '../../util/comprehensiveAffairsSync';

let syncing = false;

async function safeSync(message_id: number, options: { allowSquadCreate?: boolean } = {}) {
  if (syncing) {
    return;
  }
  syncing = true;
  try {
    await syncNpcPanelsFromMessage(message_id);
    await syncSquadsFromContext(message_id, options.allowSquadCreate ?? false);
  } catch (error) {
    console.error('[NPC面板同步] 失败', error);
  } finally {
    syncing = false;
  }
}

async function syncSquadsFromContext(message_id: number, allowCreate = false) {
  if (isStatusBarLocalMutation()) {
    return;
  }
  await waitGlobalInitialized('Mvu');
  const mvu_data = Mvu.getMvuData({ type: 'message', message_id });
  const stat = _.get(mvu_data, 'stat_data') as import('../../schema').Schema | undefined;
  if (!stat || typeof stat !== 'object') return;
  applySquadInferToStat(stat, { allowCreate });
  reconcile_squad_member_exclusivity(stat);
  sync_comprehensive_affairs(stat);
  inferCampfireFuelFromStory(stat.营地.当前建筑, stat.营地.篝火燃料);
  syncFirepitWithFuel(stat.营地.当前建筑, stat.营地.篝火燃料);
  _.set(mvu_data, 'stat_data', stat);
  await Mvu.replaceMvuData(mvu_data, { type: 'message', message_id });
}

$(() => {
  errorCatched(async () => {
    await waitGlobalInitialized('Mvu');

    eventOn(tavern_events.GENERATION_ENDED, (message_id: number) => {
      const msgs = getChatMessages(message_id);
      const msg = msgs[0];
      const story = msg?.message ?? '';
      const allowSquadCreate =
        msg?.role === 'assistant' &&
        /(出发|外出|带队|率领|派遣).{0,16}(队|采集|狩猎|探索)/.test(story);
      void safeSync(message_id, { allowSquadCreate });
      void ensure_opening_status_placeholder(message_id);
    });

    eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, () => {
      const id = getCurrentMessageId();
      if (typeof id === 'number') {
        void ensure_opening_status_placeholder(id);
      }
    });

    const runStartupSync = async () => {
      await backfillNpcPanelsIfEmpty();
      await ensure_opening_status_placeholder();
      const latest = getChatMessages(-1, { role: 'assistant' })[0];
      if (latest) {
        await safeSync(latest.message_id);
      }
    };
    void runStartupSync();
    setTimeout(() => void runStartupSync(), 1500);
    setTimeout(() => void runStartupSync(), 4000);

    console.info('[NPC面板同步] 已加载');
  })();
});
