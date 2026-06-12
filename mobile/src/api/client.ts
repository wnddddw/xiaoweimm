import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { secureStore } from '../utils/secureStore';
import { API_BASE_URL } from '../utils/constants';

// Track network state
let isNetworkAvailable = true;

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - attach JWT
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  if (!isNetworkAvailable) {
    return Promise.reject(new AxiosError('No network connection', 'NETWORK_OFFLINE', config));
  }
  const token = await secureStore.getToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle 401, network errors, offline
api.interceptors.response.use(
  (response: AxiosResponse) => {
    isNetworkAvailable = true;
    return response;
  },
  async (error: AxiosError) => {
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED' || error.message?.includes('Network Error')) {
      isNetworkAvailable = false;
      (error as any).friendlyMessage = '网络连接失败，请检查网络后重试';
    }
    if (error.response?.status === 401) {
      await secureStore.clear();
    }
    return Promise.reject(error);
  }
);

/** Call to manually reset network state (e.g., from NetInfo listener) */
export function setNetworkAvailable(available: boolean) {
  isNetworkAvailable = available;
}

export { isNetworkAvailable };
export default api;
