import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken })
          localStorage.setItem('accessToken', res.data.accessToken)
          localStorage.setItem('refreshToken', res.data.refreshToken)
          error.config.headers.Authorization = `Bearer ${res.data.accessToken}`
          return api.request(error.config)
        } catch {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          window.location.href = '/login'
        }
      } else {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
}

export const filesApi = {
  list: (params) => api.get('/files', { params }),
  upload: (file, folderId) => {
    const formData = new FormData()
    formData.append('file', file)
    if (folderId) formData.append('folderId', folderId)
    return api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  download: (id) => api.get(`/files/${id}/download`, { responseType: 'blob' }),
  update: (id, data) => api.patch(`/files/${id}`, data),
  delete: (id) => api.delete(`/files/${id}`),
  createShare: (fileId, expiresInHours) => api.post('/shares', { fileId, expiresInHours }),
}

export const foldersApi = {
  list: () => api.get('/folders'),
  tree: () => api.get('/folders/tree'),
  create: (data) => api.post('/folders', data),
  update: (id, data) => api.patch(`/folders/${id}`, data),
  delete: (id) => api.delete(`/folders/${id}`),
}

export const storageApi = {
  stats: () => api.get('/storage/stats'),
  refresh: () => api.post('/storage/stats/refresh'),
}

export const sharesApi = {
  create: (data) => api.post('/shares', data),
  download: (token) => api.get(`/shares/${token}`, { responseType: 'blob' }),
  delete: (token) => api.delete(`/shares/${token}`),
}