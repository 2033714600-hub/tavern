export function useTavernUser() {
  const user_name = ref('{{user}}');

  function refresh() {
    if (typeof SillyTavern !== 'undefined' && SillyTavern.name1) {
      user_name.value = SillyTavern.name1;
    }
  }

  refresh();
  if (typeof eventOn === 'function') {
    eventOn(tavern_events.CHAT_CHANGED, refresh);
    eventOn(tavern_events.CHARACTER_EDITED, refresh);
  }
  useIntervalFn(refresh, 2000);

  return { user_name };
}
