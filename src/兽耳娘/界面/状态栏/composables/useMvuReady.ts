export function useMvuReady() {
  const ready = ref(false);
  const error = ref('');

  onMounted(async () => {
    if (typeof getVariables !== 'function') {
      error.value = '请在 SillyTavern 消息楼层中打开状态栏';
      return;
    }
    try {
      await waitGlobalInitialized('Mvu');
      ready.value = true;
    } catch {
      error.value = 'Mvu 框架初始化失败，请刷新页面';
    }
  });

  return { ready, error };
}
