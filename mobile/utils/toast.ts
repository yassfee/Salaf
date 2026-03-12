import { Alert } from 'react-native';

export interface ToastOptions {
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

/**
 * Show a success toast with golden styling
 */
export function showSuccessToast(message: string, options: ToastOptions = {}) {
  Alert.alert(
    'Success',
    message,
    [{ text: 'OK', style: 'default' }],
    { 
      cancelable: true,
      userInterfaceStyle: 'light'
    }
  );
}

/**
 * Show an error toast
 */
export function showErrorToast(message: string, options: ToastOptions = {}) {
  Alert.alert(
    'Error',
    message,
    [{ text: 'OK', style: 'destructive' }],
    { 
      cancelable: true,
      userInterfaceStyle: 'light'
    }
  );
}

/**
 * Show a warning toast
 */
export function showWarningToast(message: string, options: ToastOptions = {}) {
  Alert.alert(
    'Warning',
    message,
    [{ text: 'OK', style: 'default' }],
    { 
      cancelable: true,
      userInterfaceStyle: 'light'
    }
  );
}

/**
 * Show clipboard success specifically for URL copying
 */
export function showClipboardSuccess(url: string) {
  console.log('showClipboardSuccess called with URL:', url);
  
  // Try a simpler alert first
  Alert.alert(
    'Success',
    'Receipt URL copied to clipboard successfully!'
  );
}