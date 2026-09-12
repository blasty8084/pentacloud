# PENTACLOUD Deployment Guide

## Overview
- **Frontend**: React + Vite → Vercel
- **Backend**: Express/Node API → Render
- **Database**: PostgreSQL/Neon (serverless)
- **File Storage**: Backblaze B2 (5 accounts, 50GB total)

---

## 1. Repository Setup

Push your code to GitHub:
```bash
git add .
git commit -m "Add deployment configuration"
git push origin main
```

---

## 2. Backend Deployment (Render)

### 2.1 Create Render Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `pentacloud-api`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/index.js`

### 2.3 Environment Variables (Render Dashboard)

Go to **Environment** tab and add:

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | |
| `PORT` | `10000` | Render uses port 10000 |
| `JWT_SECRET` | `your-secure-random-string` | Generate: `openssl rand -base64 32` |
| `FRONTEND_URL` | `https://your-frontend.vercel.app` | Your Vercel URL |
| `B2_1_KEY_ID` | `your-key-id-1` | From B2 Console |
| `B2_1_APP_KEY` | `your-application-key-1` | From B2 Console |
| `B2_1_BUCKET_NAME` | `your-bucket-name-1` | From B2 Console |
| `B2_1_BUCKET_ENDPOINT` | `s3.us-east-005.backblazeb2.com` | Full S3 endpoint |
| `B2_2_KEY_ID` | `your-key-id-2` | |
| `B2_2_APP_KEY` | `your-application-key-2` | |
| `B2_2_BUCKET_NAME` | `your-bucket-name-2` | |
| `B2_2_BUCKET_ENDPOINT` | `s3.us-west-004.backblazeb2.com` | |
| `B2_3_KEY_ID` | `your-key-id-3` | |
| `B2_3_APP_KEY` | `your-application-key-3` | |
| `B2_3_BUCKET_NAME` | `your-bucket-name-3` | |
| `B2_3_BUCKET_ENDPOINT` | `s3.us-east-005.backblazeb2.com` | |
| `B2_4_KEY_ID` | `your-key-id-4` | |
| `B2_4_APP_KEY` | `your-application-key-4` | |
| `B2_4_BUCKET_NAME` | `your-bucket-name-4` | |
| `B2_4_BUCKET_ENDPOINT` | `s3.us-east-005.backblazeb2.com` | |
| `B2_5_KEY_ID` | `your-key-id-5` | |
| `B2_5_APP_KEY` | `your-application-key-5` | |
| `B2_5_BUCKET_NAME` | `your-bucket-name-5` | |
| `B2_5_BUCKET_ENDPOINT` | `s3.us-east-005.backblazeb2.com` | |
| `NEON_DATABASE_URL` | `postgresql://...` | From Neon Dashboard |
| `DEFAULT_ADMIN_EMAIL` | `admin@yourdomain.com` | |
| `DEFAULT_ADMIN_PASSWORD` | `strong-password-here` | |
| `LOG_LEVEL` | `info` | Optional |

---

## 3. Frontend Deployment (Vercel)

### 3.1 Create Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New...** → **Project**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `bun run build`
   - **Output Directory**: `dist`
   - **Install Command**: `bun install`

### 3.2 Environment Variables (Vercel Dashboard)

Go to **Settings** → **Environment Variables**:

| Variable | Value | Notes |
|----------|-------|-------|
| `VITE_API_URL` | `https://your-render-url.onrender.com/api` | Your Render backend URL |

---

## 2.3 Environment Variables Summary

### Render (Backend) - Set in Render Dashboard
```
NODE_ENV=production
PORT=10000
JWT_SECRET=<generate with: openssl rand -base64 32>
FRONTEND_URL=https://your-frontend.vercel.app

# B2 Account 1
B2_1_KEY_ID=your-key-id-1
B2_1_APP_KEY=your-application-key-1
B2_1_BUCKET_NAME=your-bucket-name-1
B2_1_BUCKET_ENDPOINT=s3.us-east-005.backblazeb2.com

# B2 Account 2
B2_2_KEY_ID=your-key-id-2
B2_2_APP_KEY=your-application-key-2
B2_2_BUCKET_NAME=your-bucket-name-2
B2_2_BUCKET_ENDPOINT=s3.us-west-004.backblazeb2.com

# B2 Account 3
B2_3_KEY_ID=your-key-id-3
B2_3_APP_KEY=your-application-key-3
B2_3_BUCKET_NAME=your-bucket-name-3
B2_3_BUCKET_ENDPOINT=s3.us-east-005.backblazeb2.com

# B2 Account 4
B2_4_KEY_ID=your-key-id-4
B2_4_APP_KEY=your-application-key-4
B2_4_BUCKET_NAME=your-bucket-name-4
B2_4_BUCKET_ENDPOINT=s3.us-east-005.backblazeb2.com

# B2 Account 5
B2_5_KEY_ID=your-key-id-5
B2_5_APP_KEY=your-application-key-5
B2_5_BUCKET_NAME=your-bucket-name-5
B2_5_BUCKET_ENDPOINT=s3.us-east-005.backblazeb2.com

NEON_DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/dbname?sslmode=require
DEFAULT_ADMIN_EMAIL=admin@yourdomain.com
DEFAULT_ADMIN_PASSWORD=strong-password-here
LOG_LEVEL=info
```

### Vercel (Frontend) - Set in Vercel Dashboard
```
VITE_API_URL=https://your-render-url.onrender.com/api
```

---

## 3. Frontend Deployment (Vercel)

### 3.1 Create Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New...** → **Project**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `bun run build`
   - **Output Directory**: `dist`
   - **Install Command**: `bun install`

### 3.2 Environment Variables (Vercel Dashboard)

Go to **Settings** → **Environment Variables**:

| Variable | Value | Notes |
|----------|-------|-------|
| `VITE_API_URL` | `https://your-render-url.onrender.com/api` | Your Render backend URL |

---

## 4. Deploy Steps

### 4.1 Push to GitHub
```bash
git add .
git commit -m "Add deployment configuration"
git push origin main
```

### 4.2 Deploy Backend (Render)
1. Render will auto-detect on push (if auto-deploy enabled) or click **Manual Deploy**
2. Wait for build to complete
3. Note the deployed URL (e.g., `https://pentacloud-api.onrender.com`)

### 4.2 Deploy Frontend (Vercel)
1. Vercel will auto-detect on push
2. Add `VITE_API_URL` environment variable pointing to your Render URL
3. Wait for deployment
4. Note the Vercel URL (e.g., `https://pentacloud.vercel.app`)

### 4.3 Update CORS
1. Go back to Render → Environment Variables
2. Update `FRONTEND_URL` to your Vercel URL
4. Redeploy backend

---

## 5. Local Development (Unchanged)

```bash
# Terminal 1 - Backend
cd backend && bun run dev

# Terminal 2 - Frontend
cd frontend && bun run dev
```

---

## 6. Security Notes

- **Never commit** `.env`, `.env.*` (except `.env.example`)
- All secrets stored in platform dashboards (Render/Vercel)
- `.gitignore` already excludes `.env` files
- Generate strong JWT_SECRET: `openssl rand -base64 32`

---

## 7. Troubleshooting

| Issue | Solution |
|-------|----------|
| B2 401 errors | Verify B2 credentials in Render dashboard |
| CORS errors | Check FRONTEND_URL matches Vercel URL exactly |
| Database lost on deploy | Using Neon PostgreSQL (serverless) - no disk needed |
| Build fails on Render | Ensure `npm install` works (uses Node runtime) |
| Service spins down | Free tier spins down after 15min inactivity, ~30-50s wake |

---

## 8. Architecture Notes

- **Database**: PostgreSQL on Neon (serverless, no persistent disk needed)
- **File Storage**: Backblaze B2 (5 accounts × 10GB = 50GB total)
- **Auth**: JWT with refresh tokens, bcrypt password hashing
- **Frontend**: React + Vite + Tailwind, deployed to Vercel
- **Backend**: Express + Node.js, deployed to Render (free tier)

---