import api from './client';
import { ApiResponse, User } from '../types';

type AuthResponse = {
  id: string;
  phone: string;
  name: string;
  role: string;
  member_level?: string;
  verify_status?: string;
  token: string;
  refresh_token: string;
};

export const authApi = {
  requestSmsCode: (phone: string) =>
    api.post<ApiResponse<{ message: string }>>('/auth/sms-code', { phone }),

  register: (data: { phone: string; code: string; password: string; name?: string; role?: string }) =>
    api.post<ApiResponse<AuthResponse>>('/auth/register', data),

  login: (phone: string, password: string) =>
    api.post<ApiResponse<AuthResponse>>('/auth/login', { phone, password }),

  loginSms: (phone: string, code: string) =>
    api.post<ApiResponse<AuthResponse>>('/auth/login-sms', { phone, code }),

  refresh: (refreshToken: string) =>
    api.post<ApiResponse<{ token: string }>>('/auth/refresh', { refresh_token: refreshToken }),

  getMe: () =>
    api.get<ApiResponse<User>>('/auth/me'),
};
