import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { LendStatus } from '../types';

// web (browser) → localhost | Android emulator → 10.0.2.2 | physical device → your LAN IP
const API_BASE_URL =
  Platform.OS === 'web'
    ? 'http://localhost:8080'
    : 'http://10.0.2.2:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Attach JWT token to every request
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log(`Adding token to ${config.method?.toUpperCase()} ${config.url}`);
      } else {
        console.log(`No token found for ${config.method?.toUpperCase()} ${config.url}`);
      }
    } catch (error) {
      console.error('Error getting token from AsyncStorage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 403 errors (token expired/invalid)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 403 || error.response?.status === 401) {
      console.error(`${error.response.status} error for ${error.config?.url}:`, error.response?.data);
      // Token is invalid, clear it
      try {
        await AsyncStorage.multiRemove(['token', 'user_name', 'user_email']);
        console.log('Cleared invalid auth data');
      } catch (e) {
        console.error('Error clearing auth data:', e);
      }
    }
    return Promise.reject(error);
  }
);

// ── Types ────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  token: string;
  name: string;
  email: string;
}

export interface StoredUser {
  name: string;
  email: string;
}

export interface UserSearchResult {
  id: number;
  name: string;
  email: string;
}

export interface ContactResponse {
  id: number;
  name: string;
  phone?: string;
  email: string;
  linkedUserId?: number;
  createdAt: string;
}

export interface RepaymentResponse {
  id: number;
  amountPaid: number;
  paidAt: string;
  note?: string;
}

export interface LendResponse {
  id: number;
  contact: string;        // borrower name (lender view) or lender name (borrower view)
  contactId: number;
  lenderName: string;
  lenderEmail: string;
  amount: number;
  paid: number;
  remainingBalance: number;
  due: string;
  note?: string;
  status: LendStatus;
  type: string;           // "LENT" or "BORROWED"
  progressPercent: number;
  createdAt: string;
  repayments: RepaymentResponse[];
}

export interface DashboardSummary {
  totalLent: number;
  totalBorrowed: number;
  outstanding: number;
  overdue: number;
}

export interface DueSoonLend {
  id: number;
  contact: string;
  contactId: number;
  amount: number;
  paid: number;
  remainingBalance: number;
  due: string;
  status: LendStatus;
  type: string;   // "LENT" or "BORROWED"
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function loginApi(email: string, password: string): Promise<AuthResponse> {
  console.log('Attempting login for:', email);
  const res = await api.post<AuthResponse>('/api/auth/login', { email, password });
  console.log('Login successful, storing token...');
  
  await AsyncStorage.multiSet([
    ['token', res.data.token],
    ['user_name', res.data.name],
    ['user_email', res.data.email],
  ]);
  
  console.log('Token stored successfully');
  return res.data;
}

export async function registerApi(
  name: string,
  email: string,
  password: string,
  phone?: string,
): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>('/api/auth/register', { name, email, password, phone });
  await AsyncStorage.multiSet([
    ['token', res.data.token],
    ['user_name', res.data.name],
    ['user_email', res.data.email],
  ]);
  return res.data;
}

export async function logoutApi(): Promise<void> {
  await AsyncStorage.multiRemove(['token', 'user_name', 'user_email']);
}

export async function getCurrentUser(): Promise<StoredUser | null> {
  const results = await AsyncStorage.multiGet(['user_name', 'user_email']);
  const name = results[0][1];
  const email = results[1][1];
  if (!name || !email) return null;
  return { name, email };
}

// ── Users ─────────────────────────────────────────────────────────────────────

export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  const res = await api.get<UserSearchResult[]>('/api/users/search', { params: { q: query } });
  return res.data;
}

// ── Contacts ─────────────────────────────────────────────────────────────────

export async function getContacts(): Promise<ContactResponse[]> {
  const res = await api.get<ContactResponse[]>('/api/contacts');
  return res.data;
}

export async function createContact(linkedUserEmail: string): Promise<ContactResponse> {
  const res = await api.post<ContactResponse>('/api/contacts', { linkedUserEmail });
  return res.data;
}

export async function deleteContact(id: number): Promise<void> {
  await api.delete(`/api/contacts/${id}`);
}

// ── Lends ─────────────────────────────────────────────────────────────────────

export async function getLends(): Promise<LendResponse[]> {
  const res = await api.get<LendResponse[]>('/api/lends');
  return res.data;
}

export async function getIncomingLends(): Promise<LendResponse[]> {
  const res = await api.get<LendResponse[]>('/api/lends/incoming');
  return res.data;
}

export async function createLend(
  contactId: number,
  amount: number,
  dueDate: string,
  note?: string,
): Promise<LendResponse> {
  const res = await api.post<LendResponse>('/api/lends', { contactId, amount, dueDate, note });
  return res.data;
}

export async function getLendById(id: number): Promise<LendResponse> {
  const res = await api.get<LendResponse>(`/api/lends/${id}`);
  return res.data;
}

export async function getIncomingLendById(id: number): Promise<LendResponse> {
  const res = await api.get<LendResponse>(`/api/lends/incoming/${id}`);
  return res.data;
}

export async function acceptLend(id: number): Promise<LendResponse> {
  const res = await api.patch<LendResponse>(`/api/lends/${id}/accept`);
  return res.data;
}

export async function rejectLend(id: number): Promise<LendResponse> {
  const res = await api.patch<LendResponse>(`/api/lends/${id}/reject`);
  return res.data;
}

export async function cancelLend(id: number): Promise<LendResponse> {
  const res = await api.patch<LendResponse>(`/api/lends/${id}/cancel`);
  return res.data;
}

export async function createBorrowRequest(
  lenderContactId: number,
  amount: number,
  dueDate: string,
  note?: string,
): Promise<LendResponse> {
  const res = await api.post<LendResponse>('/api/lends/borrow-request', {
    lenderContactId,
    amount,
    dueDate,
    note,
  });
  return res.data;
}

export async function getBorrowRequests(): Promise<LendResponse[]> {
  const res = await api.get<LendResponse[]>('/api/lends/borrow-requests');
  return res.data;
}

export async function approveBorrowRequest(id: number): Promise<LendResponse> {
  const res = await api.patch<LendResponse>(`/api/lends/${id}/approve-borrow`);
  return res.data;
}

export async function declineBorrowRequest(id: number): Promise<LendResponse> {
  const res = await api.patch<LendResponse>(`/api/lends/${id}/decline-borrow`);
  return res.data;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const res = await api.get<DashboardSummary>('/api/dashboard/summary');
  return res.data;
}

export async function getDueSoon(): Promise<DueSoonLend[]> {
  const res = await api.get<DueSoonLend[]>('/api/dashboard/due-soon');
  return res.data;
}

// ── Notifications ─────────────────────────────────────────────────────────────

export interface NotificationItem {
  id: number;
  lendId: number;
  senderName: string;
  borrowerName: string;
  amount: number;
  amountPaid: number;
  remainingBalance: number;
  note?: string;
  type: 'LEND_REQUEST' | 'BORROW_REQUEST' | 'REMINDER';
  read: boolean;
  createdAt: string;
}

export async function sendNotification(lendId: number, note: string): Promise<NotificationItem> {
  const res = await api.post<NotificationItem>(`/api/notifications/lend/${lendId}`, { note });
  return res.data;
}

export async function getNotifications(): Promise<NotificationItem[]> {
  const res = await api.get<NotificationItem[]>('/api/notifications');
  return res.data;
}

export async function markNotificationRead(id: number): Promise<void> {
  await api.patch(`/api/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.patch('/api/notifications/read-all');
}

export async function deleteNotification(id: number): Promise<void> {
  await api.delete(`/api/notifications/${id}`);
}

export async function getUnreadNotificationCount(): Promise<number> {
  const res = await api.get<{ count: number }>('/api/notifications/unread-count');
  return res.data.count;
}

// ── Repayment Plan ────────────────────────────────────────────────────────────

export interface RepaymentPlanItem {
  rank: number;
  lendId: number;
  lenderName: string;
  totalAmount: number;
  amountPaid: number;
  remainingBalance: number;
  dueDate: string;
  status: string;
  suggestedPayment: number;
  priority: 'OVERDUE' | 'DUE_SOON' | 'UPCOMING' | 'LATER';
  reason: string;
  daysUntilDue: number;
}

export type RepaymentStrategy = 'urgency' | 'snowball' | 'avalanche';

export async function getRepaymentPlan(
  budget?: number,
  strategy: RepaymentStrategy = 'urgency',
): Promise<RepaymentPlanItem[]> {
  const params: Record<string, string> = { strategy };
  if (budget !== undefined && budget > 0) params.budget = budget.toString();
  const res = await api.get<RepaymentPlanItem[]>('/api/intelligence/repayment-plan', { params });
  return res.data;
}

// ── Repayments ────────────────────────────────────────────────────────────────

export async function recordRepayment(
  lendId: number,
  amountPaid: number,
  note?: string,
): Promise<{ message: string; amountPaid: number; remainingBalance: number; status: string }> {
  const res = await api.post(`/api/lends/${lendId}/repayments`, { amountPaid, note });
  return res.data;
}

export interface MyRepaymentItem {
  id: number;
  lendId: number;
  lenderName: string;
  totalAmount: number;
  amountPaid: number;
  note?: string;
  paidAt: string;
}

export async function getMyRepayments(): Promise<MyRepaymentItem[]> {
  const res = await api.get<MyRepaymentItem[]>('/api/repayments/mine');
  return res.data;
}

export async function deleteRepayment(repaymentId: number): Promise<void> {
  await api.delete(`/api/repayments/${repaymentId}`);
}

// ── Wallet ────────────────────────────────────────────────────────────────────

export interface WalletResponse {
  balance: number;
  last4: string | null;
  brand: string | null;
  cardholderName: string | null;
  expiryMonth: number | null;
  expiryYear: number | null;
  hasCard: boolean;
}

export async function getWallet(): Promise<WalletResponse> {
  const res = await api.get<WalletResponse>('/api/wallet');
  return res.data;
}

export async function saveWalletCard(data: {
  last4: string;
  brand: string;
  cardholderName: string;
  expiryMonth: number;
  expiryYear: number;
}): Promise<WalletResponse> {
  const res = await api.put<WalletResponse>('/api/wallet/card', data);
  return res.data;
}

export async function updateWalletBalance(balance: number): Promise<WalletResponse> {
  const res = await api.put<WalletResponse>('/api/wallet/balance', { balance });
  return res.data;
}

// Auth functions
export async function changePasswordApi(currentPassword: string, newPassword: string): Promise<void> {
  await api.put('/api/auth/change-password', { currentPassword, newPassword });
}

export async function deleteAccountApi(): Promise<void> {
  await api.delete('/api/auth/delete-account');
  await AsyncStorage.multiRemove(['token', 'user_name', 'user_email']);
}

// ── PDF Receipt ──────────────────────────────────────────────────────────────

export async function downloadReceiptPdf(lendId: number): Promise<string> {
  const token = await AsyncStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/api/pdf/receipt/${lendId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download receipt: ${response.status}`);
  }

  const blob = await response.blob();
  const reader = new FileReader();
  
  return new Promise((resolve, reject) => {
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function getReceiptUrl(lendId: number): Promise<string> {
  const token = await AsyncStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication required');
  }
  
  return `${API_BASE_URL}/api/pdf/receipt/${lendId}?token=${encodeURIComponent(token)}`;
}

export default api;
