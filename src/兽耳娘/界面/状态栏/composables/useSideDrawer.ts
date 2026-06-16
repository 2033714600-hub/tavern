const drawer_open = ref(false);
const drawer_locked = ref(false);

export function useSideDrawer() {
  function open_drawer() {
    if (drawer_locked.value) {
      return;
    }
    drawer_open.value = true;
  }

  function close_drawer() {
    if (drawer_locked.value) {
      return;
    }
    drawer_open.value = false;
  }

  function toggle_drawer() {
    if (drawer_locked.value) {
      return;
    }
    drawer_open.value = !drawer_open.value;
  }

  function collapse_for_opening_generation() {
    drawer_locked.value = true;
    drawer_open.value = false;
  }

  function unlock_drawer() {
    drawer_locked.value = false;
  }

  return {
    drawer_open,
    drawer_locked,
    open_drawer,
    close_drawer,
    toggle_drawer,
    collapse_for_opening_generation,
    unlock_drawer,
  };
}
