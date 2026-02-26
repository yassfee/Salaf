import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// web (browser) → localhost | Android emulator → 10.0.2.2 | physical device → your LAN IP
const API_BASE_URL =
  Platform.OS === 'web'
    ? 'http://localhost:8080'
    : 'http://10.0.2.2:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000, // fail fast after 10 s instead of hanging forever
});

// Attach JWT token to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auth helpers ────────────────────────────────────────────────────────────

export interface AuthResponse {
  token: string;
  name: string;
  email: string;
}

export async function loginApi(email: string, password: string): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>('/api/auth/login', { email, password });
  await AsyncStorage.setItem('token', res.data.token);
  return res.data;
}

export async function registerApi(
  name: string,
  email: string,
  password: string,
  phone?: string,
): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>('/api/auth/register', { name, email, password, phone });
  await AsyncStorage.setItem('token', res.data.token);
  return res.data;
}

export async function logoutApi(): Promise<void> {
  await AsyncStorage.removeItem('token');
}

export default api;
