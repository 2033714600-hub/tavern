import App from './App.vue';
import './global.css';

function showStandaloneHint() {
  const root = document.getElementById('app');
  if (!root) {
    return;
  }
  root.innerHTML = dedent`
    <div style="max-width:520px;margin:24px auto;padding:16px 18px;border:2px solid #dcd1be;border-radius:14px;background:#f9f5ed;color:#5c4738;font-family:'Microsoft YaHei',sans-serif;line-height:1.6">
      <div style="font-weight:900;font-size:1rem;margin-bottom:8px">兽耳娘状态栏 · 本地预览页</div>
      <p style="margin:0 0 8px;font-size:0.9rem">
        静态服务已正常工作（你能打开这个地址就说明 <code style="background:#efe6d8;padding:0 4px;border-radius:4px">5500</code> 没问题）。
      </p>
      <p style="margin:0;font-size:0.9rem">
        但状态栏必须在 <strong>SillyTavern 消息楼层 iframe</strong> 中运行，才能读取 <code style="background:#efe6d8;padding:0 4px;border-radius:4px">Mvu</code> 与楼层变量。
        请回到酒馆中查看含 <code style="background:#efe6d8;padding:0 4px;border-radius:4px">&lt;StatusPlaceHolderImpl/&gt;</code> 的开场楼层。
      </p>
    </div>
  `;
}

$(() => {
  if (typeof getVariables !== 'function') {
    showStandaloneHint();
    return;
  }

  errorCatched(() => {
    createApp(App).use(createPinia()).mount('#app');
  })();
});
