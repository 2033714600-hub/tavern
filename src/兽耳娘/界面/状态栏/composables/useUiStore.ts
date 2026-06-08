import { klona } from 'klona';
import { DEFAULT_MEMBER_AVATARS } from '../constants/defaultAvatars';

const UI_KEY = '兽耳娘界面';

type UiState = {
  chief_avatar: string;
  member_avatars: Record<string, string>;
  hidden_areas: string[];
};

const default_ui = (): UiState => ({
  chief_avatar: '',
  member_avatars: {},
  hidden_areas: [],
});

function load_ui(): UiState {
  if (typeof getVariables !== 'function') {
    return default_ui();
  }
  const raw = getVariables({ type: 'chat' })[UI_KEY];
  return {
    ...default_ui(),
    ...(typeof raw === 'object' && raw !== null ? raw : {}),
  };
}

export function useUiStore() {
  const ui = ref<UiState>(load_ui());

  function persist() {
    if (typeof updateVariablesWith !== 'function') {
      return;
    }
    updateVariablesWith(variables => {
      variables[UI_KEY] = klona(ui.value);
      return variables;
    }, { type: 'chat' });
  }

  watch(ui, persist, { deep: true });

  function set_chief_avatar(data_url: string) {
    ui.value.chief_avatar = data_url;
  }

  function set_member_avatar(name: string, data_url: string) {
    ui.value.member_avatars[name] = data_url;
  }

  function get_member_avatar(name: string) {
    return ui.value.member_avatars[name] ?? DEFAULT_MEMBER_AVATARS[name] ?? '';
  }

  function hide_area(name: string) {
    if (!ui.value.hidden_areas.includes(name)) {
      ui.value.hidden_areas.push(name);
    }
  }

  return { ui, set_chief_avatar, set_member_avatar, get_member_avatar, hide_area };
}

export function read_image_file(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
