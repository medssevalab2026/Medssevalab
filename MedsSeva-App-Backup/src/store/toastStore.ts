export type ToastType = 'success' | 'error' | 'info';

interface ToastAction {
  label: string;
  onPress: () => void;
}

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
  action?: ToastAction;
  duration: number;
  toastId: number;
}

let state: ToastState = {
  visible: false,
  message: '',
  type: 'info',
  action: undefined,
  duration: 3000,
  toastId: 0,
};

type Listener = (s: ToastState) => void | boolean;
const listeners = new Set<Listener>();

const setState = (partial: Partial<ToastState>) => {
  state = { ...state, ...partial };
  listeners.forEach((l) => l(state));
};

export const toastStore = {
  getState: () => state,
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  showToast: (
    message: string,
    type: ToastType = 'info',
    options?: { action?: ToastAction; duration?: number }
  ) =>
    setState({
      visible: true,
      message,
      type,
      action: options?.action,
      duration: options?.duration ?? 3000,
      toastId: state.toastId + 1,
    }),
  hideToast: () => setState({ visible: false }),
};

export const showSuccess = (message: string, options?: { action?: ToastAction; duration?: number }) =>
  toastStore.showToast(message, 'success', options);

export const showError = (message: string, options?: { action?: ToastAction; duration?: number }) =>
  toastStore.showToast(message, 'error', options);

export const showInfo = (message: string, options?: { action?: ToastAction; duration?: number }) =>
  toastStore.showToast(message, 'info', options);