import gsap from 'gsap';

export const DRAWER_HOST_ATTR = 'data-zhuixing-side-drawer';
export const DRAWER_CHAT_ATTR = 'data-zhuixing-chat-id';
export const DRAWER_COLLAPSED_PX = 48;
export const DRAWER_COLLAPSED_WIDTH = `${DRAWER_COLLAPSED_PX}px`;
/** 与 screen-shell / 状态栏卡片设计宽度一致，避免侧栏内布局被压缩 */
export const DRAWER_EXPANDED_WIDTH = 'min(680px, 94vw)';
export const DRAWER_EXPANDED_PX = 680;

function resolve_viewport_width(): number {
  try {
    if (window.parent && window.parent !== window) {
      return window.parent.innerWidth;
    }
  } catch {
    /* cross-origin */
  }
  return window.innerWidth;
}

function resolve_expanded_px(): number {
  const viewport = resolve_viewport_width();
  if (!Number.isFinite(viewport) || viewport <= 0) {
    return DRAWER_EXPANDED_PX;
  }
  return Math.min(DRAWER_EXPANDED_PX, Math.round(viewport * 0.94));
}

function find_drawer_iframe(): HTMLIFrameElement | null {
  const candidates: (HTMLIFrameElement | null | undefined)[] = [];
  try {
    const frame = window.frameElement as HTMLIFrameElement | null;
    if (frame?.hasAttribute(DRAWER_HOST_ATTR)) {
      candidates.push(frame);
    }
  } catch {
    /* ignore */
  }
  try {
    candidates.push(
      window.parent.document.querySelector(`iframe[${DRAWER_HOST_ATTR}]`) as HTMLIFrameElement | null,
    );
  } catch {
    /* ignore */
  }
  return candidates.find(Boolean) ?? null;
}

let width_tween: gsap.core.Tween | null = null;

export function sync_drawer_iframe_width_px(width_px: number, animate = true) {
  const iframe = find_drawer_iframe();
  if (!iframe) {
    return;
  }

  const target = width_px > 0 ? width_px : DRAWER_COLLAPSED_PX;
  width_tween?.kill();

  if (!animate) {
    iframe.style.width = `${target}px`;
    return;
  }

  iframe.style.transition = 'none';
  width_tween = gsap.to(iframe, {
    width: target,
    duration: 0.46,
    ease: 'power3.inOut',
    overwrite: true,
    onComplete: () => {
      iframe.style.width = `${target}px`;
    },
  });
}

export function sync_drawer_iframe_width(open: boolean, animate = true) {
  const target = open ? resolve_expanded_px() : DRAWER_COLLAPSED_PX;
  sync_drawer_iframe_width_px(target, animate);
}
