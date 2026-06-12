import api from './client';
import { ApiResponse, User } from '../types';

export const authApi = {
  requestSmsCode: (phone: string) =>
    api.post<ApiResponse<{ message: string }>>('/auth/sms-code', { phone }),

  register: (data: { phone: string; code: string; password: string; name?: string; role?: string }) =>
    api.post<ApiResponse<{ id: string; phone: string; name: string; role: string; token: string }>>('/auth/register', data),

  login: (phone: string, password: string) =>
    api.post<ApiResponse<{ id: string; phone: string; name: string; role: string; member_level: string; verify_status: string; token: string }>>('/auth/login', { phone, password }),

  loginSms: (phone: string, code: string) =>
    api.post<ApiResponse<{ id: string; phone: string; name: string; role: string; member_level: string; verify_status: string; token: string }>>('/auth/login-sms', { phone, code }),

  getMe: () =>
    api.get<ApiResponse<User>>('/auth/me'),
};
