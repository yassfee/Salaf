import { Alert, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showSuccessToast, showErrorToast, showClipboardSuccess } from './toast';

const API_BASE_URL = Platform.OS === 'web' ? 'http://localhost:8080' : 'http://192.168.0.205:8080';

export interface DownloadOptions {
  showSuccessAlert?: boolean;
  allowShare?: boolean;
}

/**
 * Download a PDF receipt for web platform
 */
async function downloadReceiptWeb(lendId: number, options: DownloadOptions): Promise<string | null> {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      Alert.alert('Error', 'Authentication required');
      return null;
    }

    const pdfUrl = `${API_BASE_URL}/api/pdf/receipt/${lendId}`;
    const receiptNo = `RCP-${String(lendId).padStart(5, '0')}`;
    const fileName = `receipt-${receiptNo}.pdf`;


    // Fetch the PDF with authentication
    const response = await fetch(pdfUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
    }

    // Create blob and download link
    const blob = await response.blob();
    
    // Check if we're in a browser environment
    if (typeof window !== 'undefined' && window.document) {
      const url = window.URL.createObjectURL(blob);
      
      // Create temporary download link
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      setTimeout(() => window.URL.revokeObjectURL(url), 100);

      if (options.showSuccessAlert) {
        showSuccessToast(`Receipt downloaded successfully!\nSaved as: ${fileName}`);
      }

      return url;
    } else {
      // Fallback for non-browser environments
      throw new Error('Download not supported in this environment');
    }
  } catch (error: any) {
    console.error('Web PDF download error:', error);
    showErrorToast(`Failed to download PDF receipt: ${error?.message || 'Unknown error'}`);
    return null;
  }
}

/**
 * Download a PDF receipt for mobile platforms
 */
async function downloadReceiptMobile(lendId: number, options: DownloadOptions): Promise<string | null> {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      Alert.alert('Error', 'Authentication required');
      return null;
    }

    const pdfUrl = `${API_BASE_URL}/api/pdf/receipt/${lendId}`;
    const receiptNo = `RCP-${String(lendId).padStart(5, '0')}`;
    const fileName = `receipt-${receiptNo}.pdf`;
    
    const downloadResult = await FileSystem.downloadAsync(
      pdfUrl,
      FileSystem.cacheDirectory + fileName,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (downloadResult.status === 200) {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Save Receipt',
          UTI: 'com.adobe.pdf',
        });
      }
      return downloadResult.uri;
    } else {
      throw new Error('Download failed');
    }
  } catch (error: any) {
    console.error('Mobile PDF download error:', error);
    showErrorToast('Failed to download PDF receipt');
    return null;
  }
}

/**
 * Download a PDF receipt (cross-platform)
 */
export async function downloadReceipt(
  lendId: number, 
  options: DownloadOptions = { showSuccessAlert: true, allowShare: true }
): Promise<string | null> {
  if (Platform.OS === 'web') {
    return downloadReceiptWeb(lendId, options);
  } else {
    return downloadReceiptMobile(lendId, options);
  }
}

/**
 * Share a PDF receipt for web platform
 */
async function shareReceiptWeb(lendId: number, showSuccessAlert: boolean): Promise<boolean> {
  
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      showErrorToast('Authentication required');
      return false;
    }

    const pdfUrl = `${API_BASE_URL}/api/pdf/receipt/${lendId}`;
    
    await Clipboard.setStringAsync(pdfUrl);
    
    if (showSuccessAlert) {
      showClipboardSuccess(pdfUrl);
    }
    return true;
  } catch (error: any) {
    console.error('Web PDF share error:', error);
    showErrorToast('Failed to copy receipt URL to clipboard');
    return false;
  }
}

/**
 * Share a PDF receipt for mobile platforms
 */
async function shareReceiptMobile(lendId: number, showSuccessAlert: boolean): Promise<boolean> {
  try {
    // Get authentication token
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      showErrorToast('Authentication required');
      return false;
    }

    const pdfUrl = `${API_BASE_URL}/api/pdf/receipt/${lendId}`;
    const receiptNo = `RCP-${String(lendId).padStart(5, '0')}`;
    const fileName = `receipt-${receiptNo}.pdf`;
    
    // Download to cache for sharing
    const downloadResult = await FileSystem.downloadAsync(
      pdfUrl,
      FileSystem.cacheDirectory + fileName,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (downloadResult.status === 200) {
      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Receipt',
        });
        return true;
      } else {
        // Fallback: copy URL to clipboard
        await Clipboard.setStringAsync(pdfUrl);
        if (showSuccessAlert) {
          showClipboardSuccess(pdfUrl);
        }
        return true;
      }
    } else {
      throw new Error('Download failed');
    }
  } catch (error: any) {
    console.error('Mobile PDF share error:', error);
    // Fallback: copy URL to clipboard
    try {
      const pdfUrl = `${API_BASE_URL}/api/pdf/receipt/${lendId}`;
      await Clipboard.setStringAsync(pdfUrl);
      if (showSuccessAlert) {
        showClipboardSuccess(pdfUrl);
      }
      return true;
    } catch (clipboardError) {
      showErrorToast('Failed to share receipt');
      return false;
    }
  }
}

/**
 * Share a PDF receipt (cross-platform)
 */
export async function shareReceipt(
  lendId: number, 
  showSuccessAlert: boolean = true
): Promise<boolean> {
  
  try {
    if (Platform.OS === 'web') {
      const result = await shareReceiptWeb(lendId, showSuccessAlert);
      return result;
    } else {
      const result = await shareReceiptMobile(lendId, showSuccessAlert);
      return result;
    }
  } catch (error: any) {
    console.error('shareReceipt error:', error);
    return false;
  }
}

/**
 * Get the direct URL for a receipt (with authentication)
 */
export async function getReceiptUrl(lendId: number): Promise<string | null> {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      return null;
    }
    
    return `${API_BASE_URL}/api/pdf/receipt/${lendId}`;
  } catch (error: any) {
    console.error('Error getting receipt URL:', error);
    return null;
  }
}