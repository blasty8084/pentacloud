# PENTACLOUD Deployment Guide

## Overview
- **Frontend**: React + Vite → Vercel
- **Backend**: Express/Bun API → Render
- **Database**: SQLite (persistent disk on Render)
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
   - **Build Command**: `bun install`
   - **Start Command**: `bun src/index.js`

### 2.2 Add Persistent Disk (CRITICAL for SQLite)

1. In the service settings, go to **Disks**
2. Click **Add Disk**:
   - **Name**: `pentacloud-data`
   - **Mount Path**: `/app/backend/data`
   - **Size**: 1 GB (or more if needed)

### 2.3 Environment Variables (Render Dashboard)

Go to **Environment** tab and add:

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | |
| `PORT` | `10000` | Render uses port 10000 |
| `JWT_SECRET` | `your-secure-random-string` | Generate: `openssl rand -base64 32` |
| `FRONTEND_URL` | `https://your-frontend.vercel.app` | Your Vercel URL |
| `B2_1_KEY_ID` | `0058ac404bff8180000000001` | From B2 Console |
| `B2_1_APPLICATION_KEY` | `K005cniuoR6q/zwkty3xvm9RI5QsViQ` | From B2 Console |
| `B2_1_BUCKET_ID` | `b8ba6ca450842b2faf080118` | From B2 Console |
| `B2_1_BUCKET_NAME` | `pentacloudv1` | From B2 Console |
| `B2_1_BUCKET_REGION` | `us-east-005` | e.g., `us-east-005` |
| `B2_2_KEY_ID` | `004e19d00e1826c0000000003` | |
| `B2_2_APPLICATION_KEY` | `K004Ojbw8jxgB/63TV9bDM0VIjz7F38` | |
| `B2_2_BUCKET_ID` | `5ee1f96d60002e21a802061c` | |
| `B2_2_BUCKET_NAME` | `pentacloudv2` | |
| `B2_2_BUCKET_REGION` | `us-west-004` | |
| `B2_3_KEY_ID` | `005aa7e39f8efbd0000000001` | |
| `B2_3_APPLICATION_KEY` | `K0054CeXjCMbgMsHhmkFvqRY9r20S1g` | |
| `B2_3_BUCKET_ID` | `2a5a37de93492f28ae0f0b1d` | |
| `B2_3_BUCKET_NAME` | `pentacloudv3` | |
| `B2_3_BUCKET_REGION` | `us-east-005` | |
| `B2_4_KEY_ID` | `0053cd8bbccf0b70000000001` | |
| `B2_4_APPLICATION_KEY` | `K005Y/rrg/nmr+9ttaov4gdb2aQ43pl` | |
| `B2_4_BUCKET_ID` | `835ced089bcb2c2caf000b17` | |
| `B2_4_BUCKET_NAME` | `pentacloudv4` | |
| `B2_4_BUCKET_REGION` | `us-east-005` | |
| `B2_5_KEY_ID` | `00556e3646281b50000000001` | |
| `B2_5_APPLICATION_KEY` | `K005TKQoqc5TCG5OTAp/h/pGmyT4cEw` | |
| `B2_5_BUCKET_ID` | `0536be43a6142622a8010b15` | |
| `B2_5_BUCKET_NAME` | `pentacloudV5` | |
| `B2_5_BUCKET_REGION` | `us-east-005` | |
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

## 4. Environment Variables Summary

### Render (Backend) - Set in Render Dashboard
```
NODE_ENV=production
PORT=10000
JWT_SECRET=<generate with: openssl rand -base64 32>
FRONTEND_URL=https://your-frontend.vercel.app

# B2 Account 1
B2_1_KEY_ID=0058ac404bff8180000000001
B2_1_APPLICATION_KEY=K005cniuoR6q/zwkty3xvm9RI5QsViQ
B2_1_BUCKET_ID=b8ba6ca450842b2faf080118
B2_1_BUCKET_NAME=pentacloudv1
B2_1_BUCKET_REGION=us-east-005

# B2 Account 2
B2_2_KEY_ID=004e19d00e1826c0000000003
B2_2_APPLICATION_KEY=K004Ojbw8jxgB/63TV9bDM0VIjz7F38
B2_2_BUCKET_ID=5ee1f96d60002e21a802061c
B2_2_BUCKET_NAME=pentacloudv2
B2_2_BUCKET_REGION=us-west-004

# B2 Account 3
B2_3_KEY_ID=005aa7e39f8efbd0000000001
B2_3_APPLICATION_KEY=K0054CeXjCMbgMsHhmkFvqRY9r20S1g
B2_3_BUCKET_ID=2a5a37de93492f28ae0f0b1d
B2_3_BUCKET_NAME=pentacloudv3
B2_3_BUCKET_REGION=us-east-005

# B2 Account 4
B2_4_KEY_ID=0053cd8bbccf0b70000000001
B2_4_APPLICATION_KEY=K005Y/rrg/nmr+9ttaov4gdb2aQ43pl
B2_4_BUCKET_ID=835ced089bcb2c2caf000b17
B2_4_BUCKET_NAME=pentacloudv4
B2_4_BUCKET_REGION=us-east-005

# B2 Account 5
B2_5_KEY_ID=00556e3646281b50000000001
B2_5_APPLICATION_KEY=K005TKQoqc5TCG5OTAp/h/pGmyT4cEw
B2_5_BUCKET_ID=0536be43a6142622a8010b15
B2_5_BUCKET_NAME=pentacloudV5
B2_5_BUCKET_REGION=us-east-005
```

### Vercel (Frontend) - Set in Vercel Dashboard
```
VITE_API_URL=https://your-render-url.onrender.com/api
```

---

## 5. Deploy Steps

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

### 4.3 Deploy Frontend (Vercel)
1. Vercel will auto-detect on push
2. Add `VITE_API_URL` environment variable pointing to your Render URL
3. Wait for deployment
4. Note the Vercel URL (e.g., `https://pentacloud.vercel.app`)

### 4.4 Update CORS
1. Go back to Render → Environment Variables
2. Update `FRONTEND_URL` to your Vercel URL
4. Redeploy backend

---

## 6. Local Development (Unchanged)

```bash
# Terminal 1 - Backend
cd backend && bun run dev

# Terminal 2 - Frontend
cd frontend && bun run dev
```

---

## 7. Security Notes

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
| Database lost on deploy | Ensure persistent disk is mounted at `/app/backend/data` |
| Build fails on Render | Ensure `bun install` works (may need Node build instead) |