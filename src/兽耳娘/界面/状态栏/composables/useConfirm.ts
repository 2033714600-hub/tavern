import { readonly, ref } from 'vue';

export type ConfirmOptions = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
};

type ConfirmState = {
  open: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  danger: boolean;
};

const state = ref<ConfirmState>({
  open: false,
  title: '请确认',
  message: '',
  confirmText: '确认',
  cancelText: '取消',
  danger: false,
});

let resolver: ((value: boolean) => void) | null = null;

export function useConfirm() {
  function confirm(options: ConfirmOptions): Promise<boolean> {
    if (resolver) {
      resolver(false);
      resolver = null;
    }
    state.value = {
      open: true,
      title: options.title ?? '请确认',
      message: options.message,
      confirmText: options.confirmText ?? '确认',
      cancelText: options.cancelText ?? '取消',
      danger: options.danger ?? false,
    };
    return new Promise<boolean>(resolve => {
      resolver = resolve;
    });
  }

  function resolveConfirm(ok: boolean) {
    state.value.open = false;
    resolver?.(ok);
    resolver = null;
  }

  return {
    state: readonly(state),
    confirm,
    resolveConfirm,
  };
}
