# Environment Variables

Complete reference for all `process.env` variables used by the backend.

---

## Server

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `4000` | Server port |
| `NODE_ENV` | No | `development` | `production` enables secure cookies, stricter CORS |
| `FRONTEND_URL` | Yes (prod) | - | Vercel frontend URL for CORS + share links (e.g., `https://pentacloud.vercel.app`) |

---

## Authentication / JWT

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | Yes | `pentacloud-secret-change-in-production` | **Must change in production!** HS256 signing key for access tokens |
| `REFRESH_SECRET` | No | `JWT_SECRET + '-refresh'` | Separate key for refresh tokens (recommended to set explicitly) |
| `ACCESS_TOKEN_EXPIRY` | No | `15m` | Access token lifetime (e.g., `15m`, `30m`, `1h`) |
| `REFRESH_TOKEN_EXPIRY` | No | `7d` | Refresh token lifetime (e.g., `7d`, `30d`) |

**Cookie Behavior** (from `middleware/auth.js`):
- Production: `secure=true`, `sameSite='none'`
- Development: `secure=false`, `sameSite='lax'`
- `httpOnly: true` always
- Access token cookie: 15 min maxAge
- Refresh token cookie: 7 days maxAge

---

## Database (Neon PostgreSQL)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEON_DATABASE_URL` | **Yes** | Full PostgreSQL connection string from Neon dashboard. Format: `postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=require` |

**Connection** (`db/index.js`):
```javascript
const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
```

**BIGINT Parser** (auto-converts BIGINT to JS numbers):
```javascript
pg.types.setTypeParser(20, (val) => parseInt(val, 10));
```

---

## Default Admin (Optional)

| Variable | Required | Description |
|----------|----------|-------------|
| `DEFAULT_ADMIN_EMAIL` | No | Email for auto-created admin on startup |
| `DEFAULT_ADMIN_PASSWORD` | No | Password for default admin |

**Behavior** (`db/seed.js`):
- Runs on startup via `seedDefaultAdmin()`
- Creates user with `role: 'admin'` if not exists
- Logs warning if not set

---

## Backblaze B2 Accounts (5 Accounts)

**Required per account** (repeat for `B2_1` through `B2_5`):

| Variable | Required | Description |
|----------|----------|-------------|
| `B2_1_NAME` | Yes | Display name (e.g., `Account 1`) |
| `B2_1_KEY_ID` | Yes | Application Key ID from B2 |
| `B2_1_APP_KEY` | Yes | Application Key from B2 |
| `B2_1_BUCKET_NAME` | Yes | Bucket name |
| `B2_1_BUCKET_ENDPOINT` | Yes | **Full S3 endpoint** (e.g., `s3.us-east-005.backblazeb2.com`) |
| `B2_1_MAX_SIZE_GB` | No (default 10) | Max size in GB (1-100) |

**Repeat for B2_2 through B2_5**

**Seeding** (`db/seed.js`):
- Runs on startup via `seedB2Accounts()`
- Upserts by `key_id` (unique)
- Updates `app_key`, `bucket_name`, `bucket_endpoint`, `max_size_gb` on conflict

---

## B2 Account Setup Guide

1. In Backblaze B2 console: **App Keys** → **Add New Application Key**
2. Name: `pentacloud-account-1`
3. Permissions: **Read and Write** (or custom: `listBuckets`, `listFiles`, `readFiles`, `writeFiles`, `deleteFiles`)
4. Bucket: Select or create bucket (e.g., `pentacloud-1`)
5. Copy **keyID** → `B2_1_KEY_ID`
6. Copy **applicationKey** → `B2_1_APP_KEY`
7. Bucket name → `B2_1_BUCKET_NAME`
7. Endpoint from bucket settings → `B2_1_BUCKET_ENDPOINT` (format: `s3.region.backblazeb2.com`)
8. Set `B2_1_MAX_SIZE_GB=10` (or your quota)

---

## Logging

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LOG_LEVEL` | No | `info` | `debug`, `info`, `warn`, `error` |

Current logging uses `console.log` / `console.error` with structured prefixes:
- `[B2 INIT]`, `[B2 UPLOAD]`, `[B2 DOWNLOAD]`, `[B2 FAILOVER]`, `[B2 HEALTH]`
- `[UPLOAD]`, `[DOWNLOAD]`, `[LIST FILES]`, `[GLOBAL ERROR]`

---

## Complete .env.example

```env
# Server
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Auth
JWT_SECRET=your-super-secret-change-in-production
REFRESH_SECRET=your-refresh-secret-different-from-jwt
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Database (Neon)
NEON_DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=require

# Default Admin (optional)
DEFAULT_ADMIN_EMAIL=admin@example.com
DEFAULT_ADMIN_PASSWORD=securepassword

# B2 Account 1
B2_1_NAME=Account 1
B2_1_KEY_ID=000000000000000000000001
B2_1_APP_KEY=K00000000000000000000000000000000000
B2_1_BUCKET_NAME=pentacloud-1
B2_1_BUCKET_ENDPOINT=s3.us-east-005.backblazeb2.com
B2_1_MAX_SIZE_GB=10

# B2 Account 2
B2_2_NAME=Account 2
B2_2_KEY_ID=000000000000000000000002
B2_2_APP_KEY=K00000000000000000000000000000000001
B2_2_BUCKET_NAME=pentacloud-2
B2_2_BUCKET_ENDPOINT=s3.us-west-001.backblazeb2.com
B2_2_MAX_SIZE_GB=10

# B2 Account 3
B2_3_NAME=Account 3
B2_3_KEY_ID=000000000000000000000003
B2_3_APP_KEY=K00000000000000000000000000000000002
B2_3_BUCKET_NAME=pentacloud-3
B2_3_BUCKET_ENDPOINT=s3.eu-central-003.backblazeb2.com
B2_3_MAX_SIZE_GB=10

# B2 Account 4
B2_4_NAME=Account 4
B2_4_KEY_ID=000000000000000000000004
B2_4_APP_KEY=K00000000000000000000000000000000003
B2_4_BUCKET_NAME=pentacloud-4
B2_4_BUCKET_ENDPOINT=s3.us-east-005.backblazeb2.com
B2_4_MAX_SIZE_GB=10

# B2 Account 5
B2_5_NAME=Account 5
B2_5_KEY_ID=000000000000000000000005
B2_5_APP_KEY=K00000000000000000000000000000000004
B2_5_BUCKET_NAME=pentacloud-5
B2_5_BUCKET_ENDPOINT=s3.us-west-001.backblazeb2.com
B2_5_MAX_SIZE_GB=10

# Logging
LOG_LEVEL=info
```

---

## Frontend Environment Variables (Vite)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | **Yes** | Full API base URL **including `/api`**. Must end with `/api`. |

**Example**:
```env
# Local
VITE_API_URL=http://localhost:4000/api

# Production (Vercel)
VITE_API_URL=https://pentacloud-backend.onrender.com/api
```

**Critical**: Vite env vars are **baked at build time**. After changing `VITE_API_URL`, you **must redeploy** Vercel (or rebuild locally).

---

## Local Development Setup

```bash
# 1. Clone & install
cd backend && bun install
cd ../frontend && bun install

# 2. Copy .env.example to .env and fill in values
cp backend/.env.example backend/.env
# Edit backend/.env with your values

# 3. Start backend (terminal 1)
cd backend && bun run dev
# Runs on http://localhost:4000

# 4. Start frontend (terminal 2)
cd frontend && bun run dev
# Runs on http://localhost:5173
```

---

## Render Deployment (Backend)

1. Create new **Web Service** on Render
2. Connect GitHub repo
3. Settings:
   - **Build Command**: `bun install`
   - **Start Command**: `bun run src/index.js`
   - **Node Version**: 20 (or specify in `.nvmrc`)
4. Environment Variables (add all from `.env.example`):
   - `NODE_ENV=production`
   - `FRONTEND_URL=https://your-frontend.vercel.app`
   - `NEON_DATABASE_URL=...`
   - `JWT_SECRET=<strong-random>`
   - `REFRESH_SECRET=<different-strong-random>`
   - All `B2_*` vars
   - `DEFAULT_ADMIN_EMAIL`, `DEFAULT_ADMIN_PASSWORD`
5. Deploy

**Health Check**: `GET /api/health` returns `{ "ok": true }`

---

## Vercel Deployment (Frontend)

1. Import GitHub repo in Vercel
2. Framework: **Vite** (auto-detected)
3. Build Command: `bun run build`
4. Output Directory: `dist`
4. Environment Variables:
   - `VITE_API_URL=https://your-backend.onrender.com/api`
5. Deploy

**Important**: After changing `VITE_API_URL`, **trigger a new deployment** (Vite bakes env at build time).

---

## Verification Checklist

### Backend
- [ ] `GET /api/health` returns `{ "ok": true }`
- [ ] `POST /api/auth/signup` creates user, returns `accessToken`
- [ ] `POST /api/auth/login` returns `accessToken` + sets cookies
- [ ] `POST /api/auth/refresh` rotates tokens
- [ ] `GET /api/auth/me` returns user
- [ ] `POST /api/files/upload` uploads file → returns file object
- [ ] `GET /api/files` lists files
- [ ] `GET /api/storage/stats` shows correct totals
- [ ] Admin: `GET /api/settings/b2-accounts` lists accounts
- [ ] Admin: `POST /api/settings/b2-accounts/reconcile` works

### Frontend
- [ ] Login redirects to dashboard
- [ ] File list loads on dashboard
- [ ] Upload shows progress bar
- [ ] Click file → preview modal opens
- [ ] Download works
- [ ] Theme toggle (light/dark/system) persists
- [ ] Sidebar collapses/expands