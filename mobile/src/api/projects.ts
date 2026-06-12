import api from './client';
import { ApiResponse, Project } from '../types';

export const projectsApi = {
  list: (params?: { industry?: string; province?: string; budget?: string; sort?: string }) =>
    api.get<ApiResponse<Project[]>>('/projects', { params }),

  myProjects: () =>
    api.get<ApiResponse<Project[]>>('/projects/my'),

  create: (data: Partial<Project>) =>
    api.post<ApiResponse<Project>>('/projects', data),

  getById: (id: string) =>
    api.get<ApiResponse<Project>>(`/projects/${id}`),

  update: (id: string, data: Partial<Project>) =>
    api.put<ApiResponse<Project>>(`/projects/${id}`, data),

  toggleStatus: (id: string, status: 'online' | 'offline') =>
    api.patch<ApiResponse<null>>(`/projects/${id}/status`, { status }),

  refresh: (id: string) =>
    api.post<ApiResponse<null>>(`/projects/${id}/refresh`),

  top: (id: string) =>
    api.post<ApiResponse<null>>(`/projects/${id}/top`),
};
