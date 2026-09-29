# PENTACLOUD Authentication Documentation

## Overview

PENTACLOUD uses **JWT access tokens** (15 min expiry) + **refresh tokens** (7 days, httpOnly cookie) for authentication. The frontend must handle token storage, automatic refresh on 401, and logout.

---

## Auth Flow

```
┌─────────────┐     POST /signup or /login      ┌──────────────────┐
│  Frontend   │ ──────────────────────────────► │     Backend      │
└─────────────┘ ◄────────────────────────────── │  Returns JSON +  │
       │                                     │  Sets Cookies    │
       │                                     └──────────────────┘
       │
       ▼
Store accessToken in memory (React state)
refreshToken stored automatically in httpOnly cookie

       │
       ▼
Every API request:
Authorization: Bearer <accessToken>
Credentials: 'include' (for refresh cookie)
```

---

## Token Details

### Access Token
- **Field in login/signup response**: `accessToken` (string)
- **Type**: JWT (HS256)
- **Expiry**: 15 minutes (configurable via `ACCESS_TOKEN_EXPIRY`)
- **Payload**:
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "role": "user",
  "type": "access",
  "iat": 1701234567,
  "exp": 1701235467
}
```
- **Sent by frontend**: `Authorization: Bearer <accessToken>` header
- **Storage**: In memory only (React state), never localStorage

### Refresh Token
- **Returned via**: httpOnly cookie `refreshToken` (NOT in JSON body)
- **Type**: JWT (HS256)
- **Expiry**: 7 days (configurable via `REFRESH_TOKEN_EXPIRY`)
- **Payload**:
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "type": "refresh",
  "iat": 1701234567,
  "exp": 1701839367
}
```
- **Cookie attributes**:
  - `httpOnly: true` (JavaScript cannot read)
  - `secure: true` in production (HTTPS only)
  - `sameSite: 'none'` (production) / `'lax'` (dev)
  - `path: '/'`
  - `maxAge: 7 days`
- **Rotation**: On every `/refresh`, new refresh token issued + cookie updated

---

## Login / Signup Response

### POST /api/auth/signup or /login

**Success Response (200)**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```

**Critical**: The access token field is **`accessToken`** (camelCase), NOT `token` or `access_token`.

### Cookie Headers Set
```
Set-Cookie: accessToken=eyJ...; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=900
Set-Cookie: refreshToken=eyJ...; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=604800
```

---

## Frontend Token Handling

### Axios Setup
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // e.g., "https://api.example.com/api"
  withCredentials: true, // REQUIRED for refresh cookie
});

// Request interceptor: add access token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken; // from React state
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: handle 401 → refresh → retry
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const res = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        const newToken = res.data.accessToken;
        useAuthStore.getState().setAccessToken(newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed → logout
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
```

### On 401 Response
1. Call `POST /api/auth/refresh` with `withCredentials: true`
2. On success: store new `accessToken`, retry original request
3. On failure: clear auth state, redirect to `/login`

---

## Logout Flow

### POST /api/auth/logout
- Clears both cookies (`accessToken`, `refreshToken`)
- Frontend clears in-memory `accessToken`
- Redirect to `/login`

```javascript
const logout = async () => {
  await api.post('/auth/logout');
  useAuthStore.getState().logout(); // clear state
  navigate('/login');
};
```

---

## Protected Route: GET /api/auth/me

Returns current user from valid access token (no DB lookup for token validity, but verifies user exists).

**Response**:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```

---

## Token Expiry Times

| Token | Expiry | Config Env Var | Default |
|-------|--------|----------------|---------|
| Access Token | 15 min | `ACCESS_TOKEN_EXPIRY` | `15m` |
| Refresh Token | 7 days | `REFRESH_TOKEN_EXPIRY` | `7d` |

Configure via `.env`:
```env
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
```

---

## Cookie Configuration

| Attribute | Production | Development |
|-----------|------------|-------------|
| `httpOnly` | true | true |
| `secure` | true | false (localhost HTTP) |
| `sameSite` | `none` | `lax` |
| `path` | `/` | `/` |
| `accessToken maxAge` | 900000 (15 min) | 900000 |
| `refreshToken maxAge` | 604800000 (7 days) | 604800000 |

**Frontend must use `withCredentials: true`** on all axios requests for cookies to be sent.

---

## Roles & Permissions

| Role | Capabilities |
|------|--------------|
| `admin` | All user actions + admin settings (B2 accounts, reconcile, max users config) |
| `user` | File/folder CRUD, shares, own storage view |

### First Signup = Admin
The **first user to sign up** automatically gets `role: 'admin'` (see `auth.js:36`).

### Max Users Limit
Default: **5 users** (hardcoded in `auth.js:30`). Admin can add B2 accounts but not users beyond limit.

### Default Admin Seeding
Set env vars to auto-create admin on startup:
```env
DEFAULT_ADMIN_EMAIL=admin@example.com
DEFAULT_ADMIN_PASSWORD=securepassword
```
Seeded on startup via `seedDefaultAdmin()` in `db/seed.js`.

---

## CORS Configuration

Allowed origins (from `index.js:34-38`):
- `http://localhost:5173` (Vite dev)
- `http://localhost:4000` (local backend preview)
- `process.env.FRONTEND_URL` (production Vercel URL)
- Any `http://localhost:*` in development

**Credentials**: `true` (cookies allowed)

**Frontend requirement**: `axios.create({ withCredentials: true })`

---

## Rate Limits

| Endpoint | Limit | Window | Headers |
|----------|-------|--------|---------|
| `POST /api/auth/login` | 10 | 15 min | `Retry-After`, `X-RateLimit-*` |
| `POST /api/auth/signup` | 10 | 15 min | `Retry-After`, `X-RateLimit-*` |
| `POST /api/files/upload` | 100 | 1 hour | `Retry-After`, `X-RateLimit-*` |

Rate limited endpoints return `429 Too Many Requests` with:
```json
{ "error": "Too many login attempts, please try again later" }
```

---

## Frontend Checklist

- [ ] Store `accessToken` in React state (not localStorage)
- [ ] `axios.create({ withCredentials: true })`
- [ ] Request interceptor adds `Authorization: Bearer <token>`
- [ ] Response interceptor catches 401 → calls `/auth/refresh` once → retries
- [ ] On refresh failure → clear state → redirect `/login`
- [ ] Login/signup reads `accessToken` from JSON response
- [ ] Logout calls `/auth/logout` and clears state
- [ ] `GET /api/auth/me` on app load to restore session
- [ ] Handle `429` with exponential backoff or user notification