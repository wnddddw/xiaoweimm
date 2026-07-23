export { default as api, getApiErrorMessage } from './client';
export { authApi } from './auth';
export { projectsApi } from './projects';

// Additional API modules (inline for brevity)
import api from './client';
import { ApiResponse, Deal, DealEvent, Message, Payment } from '../types';

export const demandsApi = {
  getMy: () => api.get<ApiResponse<any>>('/demands/my'),
  save: (data: any) => api.post<ApiResponse<any>>('/demands', data),
  remove: () => api.delete<ApiResponse<null>>('/demands'),
  getFavorites: () => api.get<ApiResponse<any[]>>('/demands/favorites'),
  addFavorite: (projectId: string) => api.post<ApiResponse<null>>(`/demands/favorites/${projectId}`),
  removeFavorite: (projectId: string) => api.delete<ApiResponse<null>>(`/demands/favorites/${projectId}`),
  getApplications: () => api.get<ApiResponse<any[]>>('/demands/applications'),
  apply: (projectId: string, note?: string) => api.post<ApiResponse<null>>('/demands/applications', { project_id: projectId, note }),
};

export const dealsApi = {
  list: () => api.get<ApiResponse<Deal[]>>('/deals'),
  create: (data: any) => api.post<ApiResponse<Deal>>('/deals', data),
  getById: (id: string) => api.get<ApiResponse<Deal>>(`/deals/${id}`),
  advanceStage: (id: string, stage: string) => api.patch<ApiResponse<null>>(`/deals/${id}/stage`, { stage }),
  getTimeline: (id: string) => api.get<ApiResponse<DealEvent[]>>(`/deals/${id}/timeline`),
};

export const messagesApi = {
  list: (category?: string) => api.get<ApiResponse<Message[]>>('/messages', { params: category ? { category } : {} }),
  unreadCount: () => api.get<ApiResponse<Record<string, number>>>('/messages/unread-count'),
  markRead: (id: string) => api.put<ApiResponse<null>>(`/messages/${id}/read`),
  markAllRead: (category?: string) => api.put<ApiResponse<null>>('/messages/read-all', { category: category || 'all' }),
  remove: (id: string) => api.delete<ApiResponse<null>>(`/messages/${id}`),
};

export const membershipsApi = {
  get: () => api.get<ApiResponse<any>>('/memberships'),
  applyAdvanced: (reason: string, contact: string, idNote?: string) =>
    api.post<ApiResponse<any>>('/memberships/apply-advanced', { reason, contact, id_note: idNote }),
  getAdvancedStatus: () => api.get<ApiResponse<any>>('/memberships/apply-advanced/status'),
  getOrders: () => api.get<ApiResponse<any[]>>('/memberships/orders'),
};

export const paymentsApi = {
  getBalance: () => api.get<ApiResponse<{ balance: number }>>('/payments/balance'),
  recharge: (amount: number, payMethod?: string) => api.post<ApiResponse<{ balance: number }>>('/payments/recharge', { amount, pay_method: payMethod }),
  createOrder: (amount: number, channel: 'wechat_h5' | 'alipay_h5', subject?: string) =>
    api.post<ApiResponse<{ order_id: string; payment_url: string; dev_paid: boolean }>>('/payments/order', { amount, channel, subject }),
  queryOrder: (orderId: string) =>
    api.get<ApiResponse<{ id: string; channel: string; amount: number; status: string; created_at: string; paid_at: string }>>(`/payments/order/${orderId}`),
  getHistory: () => api.get<ApiResponse<Payment[]>>('/payments/history'),
  getBills: () => api.get<ApiResponse<any[]>>('/payments/bills'),
};

// RN FormData 文件对象（后端 multer multipart 解析）
export interface UploadFile {
  uri: string;
  name: string;
  type: string;
}

export const verifyApi = {
  // 后端返回单对象（最新一条认证记录）或 { status: 'none' }
  getStatus: () => api.get<ApiResponse<any>>('/verify/status'),
  // multipart 提交：字段对齐后端 multer（real_name/id_number/id_card、company_name/legal_person/license）
  submit: (formData: FormData) =>
    api.post<ApiResponse<any>>('/verify/submit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  resubmit: (formData: FormData) =>
    api.post<ApiResponse<any>>('/verify/resubmit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const matchingApi = {
  getRecommendations: () => api.get<ApiResponse<any[]>>('/matching/recommendations'),
};

export const adminApi = {
  getDashboard: () => api.get<ApiResponse<any>>('/admin/dashboard'),
  getProjects: (params?: any) => api.get<ApiResponse<any[]>>('/admin/projects', { params }),
  approveProject: (id: string) => api.patch<ApiResponse<null>>(`/admin/projects/${id}/approve`),
  rejectProject: (id: string) => api.patch<ApiResponse<null>>(`/admin/projects/${id}/reject`),
  getVerifications: () => api.get<ApiResponse<any[]>>('/admin/verifications'),
  approveVerification: (id: string) => api.patch<ApiResponse<null>>(`/admin/verifications/${id}/approve`),
  rejectVerification: (id: string, reason?: string) => api.patch<ApiResponse<null>>(`/admin/verifications/${id}/reject`, { reason }),
  getUsers: (params?: any) => api.get<ApiResponse<any[]>>('/admin/users', { params }),
  setUserStatus: (id: string, status: string) => api.patch<ApiResponse<null>>(`/admin/users/${id}/status`, { status }),
  getConfig: () => api.get<ApiResponse<any>>('/admin/config'),
  updateConfig: (data: any) => api.put<ApiResponse<null>>('/admin/config', data),
  getAnalytics: () => api.get<ApiResponse<any>>('/admin/analytics'),
};
