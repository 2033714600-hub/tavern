import { has_crash_landing_story } from '../util/crashLandingStory';

export type GamePhase = 'title' | 'route' | 'custom' | 'game';

function resolve_initial_phase(): GamePhase {
  if (has_crash_landing_story()) {
    return 'game';
  }
  return get_latest_floor() === 0 ? 'title' : 'game';
}

const phase = ref<GamePhase>(resolve_initial_phase());

/** 获取当前聊天最新楼层号；无消息时视为 0 */
export function get_latest_floor(): number {
  if (typeof getChatMessages !== 'function') {
    return 0;
  }
  const latest = getChatMessages(-1)[0];
  return latest?.message_id ?? 0;
}

export function is_floor_zero(): boolean {
  return get_latest_floor() === 0;
}

export function useGameFlow() {
  function enter_tent() {
    if (has_crash_landing_story() || !is_floor_zero()) {
      phase.value = 'game';
      return;
    }
    phase.value = 'route';
  }

  function open_custom() {
    phase.value = 'custom';
  }

  function enter_game() {
    phase.value = 'game';
  }

  function back_to_title() {
    if (has_crash_landing_story() || !is_floor_zero()) {
      phase.value = 'game';
      return;
    }
    phase.value = 'title';
  }

  function back_to_route() {
    phase.value = 'route';
  }

  return { phase, enter_tent, open_custom, enter_game, back_to_title, back_to_route, is_floor_zero };
}
