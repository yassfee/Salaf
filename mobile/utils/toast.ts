import Toast from 'react-native-toast-message';

export interface ToastOptions {
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export function showSuccessToast(message: string) {
  Toast.show({
    type: 'success',
    text1: 'Success',
    text2: message,
    visibilityTime: 3000,
    position: 'bottom',
  });
}

export function showErrorToast(message: string) {
  Toast.show({
    type: 'error',
    text1: 'Error',
    text2: message,
    visibilityTime: 4000,
    position: 'bottom',
  });
}

export function showWarningToast(message: string) {
  Toast.show({
    type: 'error',
    text1: 'Warning',
    text2: message,
    visibilityTime: 3500,
    position: 'bottom',
  });
}

export function showClipboardSuccess(_url: string) {
  Toast.show({
    type: 'success',
    text1: 'Copied',
    text2: 'Receipt URL copied to clipboard',
    visibilityTime: 3000,
    position: 'bottom',
  });
}
