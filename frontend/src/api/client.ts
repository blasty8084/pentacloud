import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  signup: (data: { email: string; password: string; name?: string }) =>
    api.post('/auth/signup', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

export const filesApi = {
  list: (params?: { folderId?: string; search?: string }) =>
    api.get('/files', { params }),
  upload: (file: File, folderId?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) formData.append('folderId', folderId);
    return api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          return percent;
        }
      },
    });
  },
  download: (id: string) =>
    api.get(`/files/${id}/download`, { responseType: 'blob' }),
  update: (id: string, data: { name?: string; folderId?: string | null }) =>
    api.patch(`/files/${id}`, data),
  delete: (id: string) => api.delete(`/files/${id}`),
};

export const foldersApi = {
  list: () => api.get('/folders'),
  tree: () => api.get('/folders/tree'),
  create: (data: { name: string; parentId?: string }) => api.post('/folders', data),
  update: (id: string, data: { name?: string; parentId?: string | null }) =>
    api.patch(`/folders/${id}`, data),
  delete: (id: string) => api.delete(`/folders/${id}`),
};

export const storageApi = {
  stats: () => api.get('/storage/stats'),
};

export const sharesApi = {
  create: (data: { fileId: string; expiresInHours?: number }) => api.post('/shares', data),
  download: (token: string) => api.get(`/shares/${token}`, { responseType: 'blob' }),
  delete: (token: string) => api.delete(`/shares/${token}`),
};

export const settingsApi = {
  getB2Accounts: () => api.get('/settings/b2-accounts'),
  addB2Account: (data: {
    name: string;
    keyId: string;
    applicationKey: string;
    bucketId: string;
    bucketName: string;
    bucketRegion?: string;
    maxSizeGb?: number;
  }) => api.post('/settings/b2-accounts', data),
  deleteB2Account: (id: string) => api.delete(`/settings/b2-accounts/${id}`),
};