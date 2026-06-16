import SideDrawerApp from './SideDrawerApp.vue';
import '../../界面/状态栏/global.css';
import { backfillNpcPanelsIfEmpty } from '../../util/npcPanelSync';
import {
  DRAWER_CHAT_ATTR,
  DRAWER_COLLAPSED_WIDTH,
  DRAWER_HOST_ATTR,
  sync_drawer_iframe_width_px,
} from '../../界面/状态栏/util/sideDrawerHost';
import { teleportStyle } from '@util/script';
import drawer_srcdoc from '@util/drawer_iframe_srcdoc.html';

const REMOUNT_DEBOUNCE_MS = 300;

let destroy_mount: (() => void) | undefined;
let booting = false;
let remount_timer: ReturnType<typeof setTimeout> | undefined;
let watch_bound = false;

function $drawer_iframe() {
  return $(`iframe[${DRAWER_HOST_ATTR}]`) as JQuery<HTMLIFrameElement>;
}

function get_current_chat_id(): string {
  return SillyTavern.getCurrentChatId?.() ?? '';
}

function create_drawer_iframe() {
  return $('<iframe>').attr({
    [DRAWER_HOST_ATTR]: '',
    frameborder: '0',
    srcdoc: drawer_srcdoc,
  }) as JQuery<HTMLIFrameElement>;
}

function ensure_drawer_iframe_shell(): JQuery<HTMLIFrameElement> {
  let $iframe = $drawer_iframe();
  if ($iframe.length === 0) {
    $iframe = create_drawer_iframe()
      .attr(DRAWER_CHAT_ATTR, get_current_chat_id())
      .css({
        position: 'fixed',
        top: '0',
        right: '0',
        width: DRAWER_COLLAPSED_WIDTH,
        height: '100vh',
        border: '0',
        zIndex: '10050',
        background: 'transparent',
        pointerEvents: 'auto',
      })
      .appendTo('body');
  }
  return $iframe;
}

function is_drawer_mounted(): boolean {
  const iframe = $drawer_iframe()[0];
  if (!iframe?.isConnected) {
    return false;
  }
  const app_root = iframe.contentDocument?.querySelector('#app[data-mounted]');
  return Boolean(app_root && app_root.childElementCount > 0);
}

function repair_drawer_iframe_width(): void {
  const iframe = $drawer_iframe()[0];
  if (!iframe) {
    return;
  }
  const width = Number.parseFloat(getComputedStyle(iframe).width);
  if (!Number.isFinite(width) || width <= 0) {
    sync_drawer_iframe_width_px(48, false);
  }
}

function reset_drawer_vue_mount(): void {
  destroy_mount?.();
  destroy_mount = undefined;
  const doc = $drawer_iframe()[0]?.contentDocument;
  doc?.querySelector('#app')?.remove();
}

function mount_side_drawer(): () => void {
  const $iframe = ensure_drawer_iframe_shell();
  $iframe.attr(DRAWER_CHAT_ATTR, get_current_chat_id());

  let app: ReturnType<typeof createApp> | undefined;
  let style_teleport: { destroy: () => void } | undefined;

  const mount_app = () => {
    const doc = $iframe[0]?.contentDocument;
    if (!doc || is_drawer_mounted()) {
      repair_drawer_iframe_width();
      return;
    }

    app?.unmount();
    style_teleport?.destroy();
    doc.querySelector('#app')?.remove();
    style_teleport = teleportStyle(doc.head);
    const $mount = $('<div id="app" data-mounted="">').appendTo(doc.body);
    app = createApp(SideDrawerApp).use(createPinia());
    errorCatched(() => {
      app!.mount($mount[0]);
      console.info('[状态栏侧栏] 已挂载');
      repair_drawer_iframe_width();
    })();
  };

  $iframe.off('load').one('load', mount_app);
  mount_app();

  return () => {
    app?.unmount();
    app = undefined;
    style_teleport?.destroy();
    style_teleport = undefined;
  };
}

function cleanup_stale_parent_modal_host(): void {
  try {
    window.parent?.document?.getElementById('zhuixing-modal-host')?.remove();
  } catch {
    // 父页面不可访问时忽略
  }
}

async function boot_side_drawer(force_remount = false): Promise<void> {
  if (typeof getVariables !== 'function') {
    console.warn('[状态栏侧栏] 非酒馆环境，跳过挂载');
    return;
  }
  if (booting) {
    return;
  }
  if (!force_remount && is_drawer_mounted()) {
    repair_drawer_iframe_width();
    return;
  }

  booting = true;
  try {
    cleanup_stale_parent_modal_host();
    await waitGlobalInitialized('Mvu');
    await errorCatched(backfillNpcPanelsIfEmpty)();
    if (force_remount) {
      reset_drawer_vue_mount();
    }
    destroy_mount?.();
    destroy_mount = mount_side_drawer();
  } catch (error) {
    console.error('[状态栏侧栏] 挂载失败', error);
  } finally {
    booting = false;
  }
}

async function ensure_side_drawer(): Promise<void> {
  if (typeof getVariables !== 'function') {
    return;
  }

  ensure_drawer_iframe_shell();
  const iframe = $drawer_iframe()[0];
  const chat_id = get_current_chat_id();
  const prev_chat = iframe?.getAttribute(DRAWER_CHAT_ATTR) ?? '';
  const chat_changed = Boolean(chat_id && prev_chat && prev_chat !== chat_id);

  if (chat_changed) {
    reset_drawer_vue_mount();
  }
  if (iframe && chat_id) {
    iframe.setAttribute(DRAWER_CHAT_ATTR, chat_id);
  }

  if (chat_changed || !is_drawer_mounted()) {
    await boot_side_drawer(chat_changed);
  } else {
    repair_drawer_iframe_width();
  }
}

function schedule_ensure_drawer() {
  if (remount_timer) {
    clearTimeout(remount_timer);
  }
  remount_timer = setTimeout(() => {
    remount_timer = undefined;
    void ensure_side_drawer();
  }, REMOUNT_DEBOUNCE_MS);
}

function watch_side_drawer() {
  if (watch_bound) {
    return;
  }
  watch_bound = true;

  eventOn(tavern_events.CHAT_CHANGED, () => {
    schedule_ensure_drawer();
  });
  eventOn(tavern_events.APP_READY, () => {
    schedule_ensure_drawer();
  });
}

$(async () => {
  await ensure_side_drawer();
  watch_side_drawer();
});
