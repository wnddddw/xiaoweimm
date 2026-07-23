import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { secureStore } from '../utils/secureStore';
import { API_BASE_URL } from '../utils/constants';

// Track network state
let isNetworkAvailable = true;

// 401 强制登出回调：API 层清 token 后同步通知 AuthContext 清 React 状态
let onUnauthorized: (() => void) | null = null;
export function setOnUnauthorized(callback: (() => void) | null) {
  onUnauthorized = callback;
}

const GENERIC_API_ERROR_MESSAGE = '操作失败，请稍后重试';
let refreshPromise: Promise<string | null> | null = null;

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - attach JWT
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
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
    if (!response.data || typeof response.data !== 'object') {
      response.data = {} as any;
    }
    return response;
  },
  async (error: AxiosError) => {
    const responseMessage = (error.response?.data as any)?.error || (error.response?.data as any)?.message;
    if (typeof responseMessage === 'string' && responseMessage.trim()) {
      (error as any).friendlyMessage = responseMessage;
    }

    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED' || error.message?.includes('Network Error')) {
      isNetworkAvailable = false;
      (error as any).friendlyMessage = '网络连接失败，请检查网络后重试';
    }
    if (error.response?.status === 401) {
      const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
      const requestUrl = originalRequest?.url || '';
      const isAuthRequest = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/login-sms') || requestUrl.includes('/auth/register') || requestUrl.includes('/auth/refresh');

      if (originalRequest && !originalRequest._retry && !isAuthRequest) {
        originalRequest._retry = true;
        const newToken = await refreshAccessToken();
        if (newToken && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      }

      await secureStore.clear();
      // 同步 AuthContext 的登录态，避免界面停留在已登录视图需重启才恢复
      try { onUnauthorized?.(); } catch { /* ignore */ }
      (error as any).friendlyMessage = getApiErrorMessage(error, '登录已过期，请重新登录');
    }
    if ((error as any).friendlyMessage) {
      error.message = (error as any).friendlyMessage;
    }
    return Promise.reject(error);
  }
);

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = await secureStore.getRefreshToken();
      if (!refreshToken) return null;
      try {
        const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refresh_token: refreshToken }, { timeout: 15000 });
        const token = res.data?.data?.token;
        if (typeof token !== 'string' || !token) return null;
        await secureStore.setToken(token);
        return token;
      } catch {
        return null;
      }
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export function getApiErrorMessage(error: any, fallback = GENERIC_API_ERROR_MESSAGE) {
  if (error?.friendlyMessage) return error.friendlyMessage;
  const responseMessage = error?.response?.data?.error || error?.response?.data?.message;
  if (typeof responseMessage === 'string' && responseMessage.trim()) return responseMessage;
  if (error?.response?.status === 401) return '登录已过期，请重新登录';
  if (error?.code === 'ERR_NETWORK' || error?.code === 'ECONNABORTED' || error?.message?.includes('Network Error')) {
    return '网络连接失败，请检查网络后重试';
  }
  return fallback;
}

/** Call to manually reset network state (e.g., from NetInfo listener) */
export function setNetworkAvailable(available: boolean) {
  isNetworkAvailable = available;
}

export { isNetworkAvailable };
export default api;
