import axios from 'axios';

const API_BASE_URL = 'http://10.0.2.2:8080'; // Android emulator → localhost
// Use your machine's IP for physical device: 'http://192.168.x.x:8080'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  // TODO: read token from AsyncStorage
  // const token = await AsyncStorage.getItem('token');
  // if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
