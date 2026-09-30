import axios, { type AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// Create axios instance with proper configuration
export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // REQUIRED for refresh token cookie
  timeout: 300000, // 5 minutes for large uploads
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token storage in memory (not localStorage)
let accessToken: string | null = null;

// Token management functions
export const tokenStorage = {
  getToken: () => accessToken,
  setToken: (token: string | null) => {
    accessToken = token;
  },
  clearToken: () => {
    accessToken = null;
  },
};

// Request interceptor: add access token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 -> refresh -> retry once
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken = res.data.accessToken;

        // Update token in memory
        tokenStorage.setToken(newToken);

        processQueue(null, newToken);

        // Retry original request
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Clear auth state and redirect to login
        tokenStorage.clearToken();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Error class for API errors
export class ApiError extends Error {
  public readonly status: number;
  public readonly data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }

  static fromAxiosError(error: AxiosError): ApiError {
    if (error.response) {
      const message = (error.response.data as { error?: string })?.error || error.message;
      return new ApiError(message, error.response.status, error.response.data);
    }
    return new ApiError(error.message, 0, null);
  }
}

// Helper to check if error is an ApiError
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

// Helper to extract error message
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred';
}

// Type for upload progress callback
export type UploadProgressCallback = (percent: number) => void;

// Typed API layer
export const authApi = {
  signup: (data: { email: string; password: string; name?: string }) =>
    api.post<{ accessToken: string; user: User }>('/auth/signup', data),
  login: (data: { email: string; password: string }) =>
    api.post<{ accessToken: string; user: User }>('/auth/login', data),
  me: () => api.get<{ user: User }>('/auth/me'),
  refresh: () => api.post<{ accessToken: string; user: User }>('/auth/refresh'),
  logout: () => api.post('/auth/logout'),
};

export const filesApi = {
  list: (params?: { folderId?: string; search?: string }) =>
    api.get<BackendFile[]>('/files', { params }),
  upload: (file: File, folderId?: string, onProgress?: UploadProgressCallback) => {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) formData.append('folderId', folderId);
    return api.post<BackendFile>('/files/upload', formData, {
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
  },
  download: (id: string) =>
    api.get(`/files/${id}/download`, { responseType: 'blob' }),
  update: (id: string, data: { name?: string; folderId?: string | null }) =>
    api.patch<BackendFile>(`/files/${id}`, data),
  delete: (id: string) => api.delete(`/files/${id}`),
};

export const foldersApi = {
  list: () => api.get<Folder[]>('/folders'),
  tree: () => api.get<Folder[]>('/folders/tree'),
  create: (data: { name: string; parentId?: string }) => api.post<Folder>('/folders', data),
  update: (id: string, data: { name?: string; parentId?: string | null }) =>
    api.patch<Folder>(`/folders/${id}`, data),
  delete: (id: string) => api.delete(`/folders/${id}`),
};

export const storageApi = {
  stats: () => api.get<StorageStats>('/storage/stats'),
};

export const sharesApi = {
  create: (data: { fileId: string; expiresInHours?: number }) =>
    api.post<{ token: string; shareUrl: string; expiresAt: string | null }>('/shares', data),
  download: (token: string) => api.get(`/shares/${token}`, { responseType: 'blob' }),
  delete: (token: string) => api.delete(`/shares/${token}`),
};

export const settingsApi = {
  getB2Accounts: () => api.get<B2Account[]>('/settings/b2-accounts'),
  addB2Account: (data: {
    name: string;
    keyId: string;
    appKey: string;
    bucketName: string;
    bucketEndpoint: string;
    maxSizeGb?: number;
  }) => api.post<B2Account>('/settings/b2-accounts', data),
  deleteB2Account: (id: string) => api.delete(`/settings/b2-accounts/${id}`),
  reconcileStorage: () => api.post<{ success: boolean; accounts: Array<{ id: string; name: string; used_bytes: number }> }>('/settings/b2-accounts/reconcile'),
};

// Type definitions (matching backend API)
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

export interface BackendFile {
  id: string;
  name: string;
  original_name: string;
  mime_type: string;
  size: number;
  folder_id: string | null;
  user_id: string;
  b2_account_id: string;
  b2_file_id: string;
  b2_file_name: string;
  created_at: number;
  updated_at: number;
}

export interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
  user_id: string;
  created_at: number;
  updated_at: number;
  children?: Folder[];
}

export interface StorageStats {
  total: {
    used: number;
    max: number;
    free: number;
    percentage: number;
  };
  accounts: Array<{
    id: string;
    name: string;
    bucketName: string;
    bucketEndpoint: string;
    used: number;
    max: number;
    free: number;
    percentage: number;
    health: 'healthy' | 'degraded' | 'unhealthy';
    consecutiveFailures: number;
    available: boolean;
  }>;
}

export interface B2Account {
  id: string;
  name: string;
  bucket_name: string;
  bucket_endpoint: string;
  max_size_gb: number;
  created_at: string;
}

export interface ShareLinkResponse {
  token: string;
  shareUrl: string;
  expiresAt: string | null;
}