import type { ToastMessage } from './components/Toast';

let toastId = 0;

export function createToast(type: ToastMessage['type'], message: string): ToastMessage {
  return {
    id: `toast-${++toastId}`,
    type,
    message,
  };
}
