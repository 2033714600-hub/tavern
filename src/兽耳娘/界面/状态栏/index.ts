import App from './App.vue';
import './global.css';
import { backfillNpcPanelsIfEmpty } from '../../util/npcPanelSync';
import { waitUntil } from 'async-wait-until';

function showStandaloneHint() {
  const root = document.getElementById('app');
  if (!root) {
    return;
  }
  root.innerHTML = dedent`
    <div style="max-width:520px;margin:24px auto;padding:16px 18px;border:2px solid #dcd1be;border-radius:14px;background:#f9f5ed;color:#5c4738;font-family:'Microsoft YaHei',sans-serif;line-height:1.6">
      <div style="font-weight:900;font-size:1rem;margin-bottom:8px">兽耳娘状态栏</div>
      <p style="margin:0;font-size:0.9rem">
        请在 SillyTavern 含 <code style="background:#efe6d8;padding:0 4px;border-radius:4px">&lt;StatusPlaceHolderImpl/&gt;</code> 的消息楼层中打开。
      </p>
    </div>
  `;
}

$(async () => {
  if (typeof getVariables !== 'function') {
    showStandaloneHint();
    return;
  }

  await waitGlobalInitialized('Mvu');
  await waitUntil(() => {
    const variables = getVariables({ type: 'message', message_id: 'latest' });
    return _.has(variables, 'stat_data') && variables.stat_data != null;
  });
  await errorCatched(backfillNpcPanelsIfEmpty)();

  errorCatched(() => {
    createApp(App).use(createPinia()).mount('#app');
  })();
});
