# Frontend Integration Guide

Quick-start checklist and copy-paste starter for building a PENTACLOUD frontend.

---

## Axios Client Setup

```typescript
// lib/api.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // e.g., "https://api.example.com/api"
  withCredentials: true, // REQUIRED for refresh token cookie
  timeout: 300000, // 5 min for large uploads
});

// Request interceptor: add access token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken; // from React state
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 → refresh → retry once
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token!);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken = res.data.accessToken;
        
        useAuthStore.getState().setAccessToken(newToken);
        processQueue(null, newToken);
        
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);
```

---

## Auth Store (Zustand Example)

```typescript
// stores/auth.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  setAuth: (token: string, user: User) => void;
  setAccessToken: (token: string) => void;
  logout: () => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      
      setAuth: (token, user) => set({ accessToken: token, user }),
      
      setAccessToken: (token) => set({ accessToken: token }),
      
      logout: () => set({ user: null, accessToken: null }),
      
      hydrate: async () => {
        try {
          const res = await api.get('/auth/me');
          set({ user: res.data.user });
        } catch {
          // Not logged in
        }
      },
    }),
    {
      name: 'pentacloud-auth',
      partialize: (state) => ({ accessToken: state.accessToken, user: state.user }),
    }
  )
);
```

---

## Typed API Layer

```typescript
// lib/api/files.ts
import { api } from './api';
import type { File, UploadResponse } from '../types';

export const filesApi = {
  list: (params?: { folderId?: string; search?: string }) =>
    api.get<File[]>('/files', { params }),

  upload: (file: File, folderId?: string, onProgress?: (percent: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) formData.append('folderId', folderId);
    
    return api.post<UploadResponse>('/files/upload', formData, {
      // Do NOT set Content-Type header
      onUploadProgress: (e) => {
        if (e.total && onProgress) {
          onProgress(Math.round((e.loaded * 100) / e.total));
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

// lib/api/folders.ts
export const foldersApi = {
  list: () => api.get<Folder[]>('/folders'),
  tree: () => api.get<Folder[]>('/folders/tree'),
  create: (data: { name: string; parentId?: string }) => api.post('/folders', data),
  update: (id: string, data: { name?: string; parentId?: string | null }) => api.patch(`/folders/${id}`, data),
  delete: (id: string) => api.delete(`/folders/${id}`),
};

// lib/api/shares.ts
export const sharesApi = {
  create: (fileId: string, expiresInHours?: number) =>
    api.post<{ token: string; shareUrl: string; expiresAt: string | null }>('/shares', { fileId, expiresInHours }),
  
  download: (token: string) =>
    api.get(`/shares/${token}`, { responseType: 'blob' }),
  
  delete: (token: string) => api.delete(`/shares/${token}`),
};

// lib/api/storage.ts
export const storageApi = {
  stats: () => api.get<StorageStats>('/storage/stats'),
};

// lib/api/settings.ts
export const settingsApi = {
  getB2Accounts: () => api.get<B2Account[]>('/settings/b2-accounts'),
  addB2Account: (data: {
    name: string;
    keyId: string;
    appKey: string;
    bucketName: string;
    bucketEndpoint: string;
    maxSizeGb?: number;
  }) => api.post('/settings/b2-accounts', data),
  
  deleteB2Account: (id: string) => api.delete(`/settings/b2-accounts/${id}`),
  
  reconcileStorage: () => api.post('/settings/b2-accounts/reconcile'),
};

// lib/api/auth.ts
export const authApi = {
  signup: (data: { email: string; password: string; name?: string }) =>
    api.post<{ accessToken: string; user: User }>('/auth/signup', data),
  
  login: (data: { email: string; password: string }) =>
    api.post<{ accessToken: string; user: User }>('/auth/login', data),
  
  refresh: () => api.post<{ accessToken: string; user: User }>('/auth/refresh'),
  
  logout: () => api.post('/auth/logout'),
  
  me: () => api.get<{ user: User }>('/auth/me'),
};
```

---

## Required Screens & Endpoints

| Screen | Endpoints Used |
|--------|----------------|
| **Login** | `POST /auth/login`, `GET /auth/me` (on load) |
| **Signup** | `POST /auth/signup` |
| **Dashboard / File Browser** | `GET /files`, `GET /folders/tree`, `GET /storage/stats` |
| **Upload Zone** | `POST /files/upload` (with progress) |
| **File Preview Modal** | `GET /files/:id/download` (stream) |
| **Share Modal** | `POST /shares`, `GET /shares/:token` (public) |
| **Storage Usage Page** | `GET /storage/stats` |
| **Settings (User)** | `GET /auth/me`, `PATCH /files/:id`, `DELETE /files/:id` |
| **Settings (Admin)** | `GET/POST/DELETE /settings/b2-accounts`, `POST /settings/b2-accounts/reconcile` |

---

## Copy-Paste Starter (App Entry)

```tsx
// main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './stores/auth';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </React.StrictMode>
  );

// AuthProvider.tsx
function AuthProvider({ children }: { children: React.ReactNode }) {
  const { hydrate, accessToken, setAccessToken } = useAuthStore();
  
  useEffect(() => {
    hydrate();
    // Set up axios interceptor after hydrate
    api.interceptors.request.use((config) => {
      const token = useAuthStore.getState().accessToken;
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
  }, [hydrate]);
  
  return <>{children}</>;
}
```

---

## Format Bytes Helper (Required)

```typescript
// utils/format.ts
export function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  if (bytes < 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const unit = sizes[Math.min(i, sizes.length - 1)] || 'B';
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + unit;
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
```

---

## Common UI Patterns

### File Preview Modal
```tsx
// Components/FilePreviewModal.tsx
const FilePreview = ({ file, onClose, onDownload }) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  
  useEffect(() => {
    const loadPreview = async () => {
      const res = await filesApi.download(file.id);
      setBlobUrl(URL.createObjectURL(new Blob([res.data], { type: file.mime_type })));
    };
    loadPreview();
    return () => blobUrl && URL.revokeObjectURL(blobUrl);
  }, [file.id]);
  
  const isImage = file.mime_type.startsWith('image/');
  const isVideo = file.mime_type.startsWith('video/');
  const isPDF = file.mime_type === 'application/pdf';
  
  return (
    <Modal isOpen onClose={onClose}>
      {isImage && <img src={blobUrl} alt={file.name} />}
      {isVideo && <video src={blobUrl} controls />}
      {isPDF && <iframe src={blobUrl} />}
      {!isImage && !isVideo && !isPDF && (
        <div>Preview not available - <button onClick={() => onDownload(file)}>Download</button></div>
      )}
    </Modal>
  );
};
```

### Upload Zone with Progress
```tsx
const UploadZone = ({ onUpload, folderId }) => {
  const [progress, setProgress] = useState<Record<string, number>>({});
  
  const handleDrop = async (files: FileList) => {
    for (const file of files) {
      const fileId = file.name + Date.now();
      setProgress(prev => ({ ...prev, [fileId]: 0 }));
      try {
        await filesApi.upload(file, folderId, (p) => setProgress(p => ({ ...p, [fileId]: p })));
        setProgress(p => ({ ...p, [fileId]: 100 }));
      } catch (err) {
        console.error('Upload failed:', err);
      }
    }
  };
  
  return (
    <div onDrop={handleDrop} className="border-2 border-dashed p-8">
      <input type="file" multiple onChange={e => handleDrop(e.target.files)} hidden />
      {Object.entries(progress).map(([id, p]) => (
        <div key={id}>
          <div className="progress-bar">
            <div style={{ width: `${p}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
};
```

---

## Deployment Checklist

- [ ] `VITE_API_URL` set in Vercel (with `/api` suffix)
- [ ] Redeploy Vercel after any `VITE_API_URL` change
- [ ] Backend `FRONTEND_URL` matches Vercel URL exactly
- [ ] Backend `JWT_SECRET` and `REFRESH_SECRET` are strong random strings
- [ ] All 5 `B2_*` account env vars set in Render
- [ ] `NEON_DATABASE_URL` is correct
- [ ] `DEFAULT_ADMIN_EMAIL/PASSWORD` set (optional)
- [ ] Health check: `GET /api/health` → `{ "ok": true }`
- [ ] Login → token in JSON + cookies set
- [ ] Refresh works → new token + rotated cookie
- [ ] Upload shows progress bar
- [ ] Preview opens for images/PDFs/videos
- [ ] Download saves file correctly
- [ ] Theme toggle (light/dark/system) persists
- [ ] Mobile responsive

---

## Debugging Quick Reference

```bash
# Check auth
curl -X POST https://api.example.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password"}' \
  -v  # -v shows Set-Cookie headers

# Test refresh
curl -X POST https://api.example.com/api/auth/refresh \
  -H "Content-Type: application/json" \
  -b "refreshToken=..." \
  -v

# Upload test
curl -X POST https://api.example.com/api/files/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@test.pdf" \
  -F "folderId=<uuid>"
```