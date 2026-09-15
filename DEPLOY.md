# PENTACLOUD Deployment Guide

## Stack Summary (verified against actual code)

- **Backend**: Node.js + Express (runtime: node), deployed on Render (Web Service, free plan, Singapore region)
- **Frontend**: React 19 + Vite 8 + TypeScript + TailwindCSS 4, deployed on Vercel
- **Database**: Neon PostgreSQL (serverless, no local disk needed - uses pooled connection)
- **File Storage**: Backblaze B2 (5 accounts, 4-variable format: KEY_ID, APP_KEY, BUCKET_NAME, BUCKET_ENDPOINT)

---

## Prerequisites

- GitHub repo with the latest code pushed
- A Neon account with a project created ([neon.tech](https://neon.tech))
- A Backblaze B2 account with 5 buckets + 5 application keys created
- A Render account
- A Vercel account

---

## Step 1: Get Your Neon Connection String

1. Go to [Neon Console](https://console.neon.tech) and create a new project
2. Choose **Singapore** region (closest to Render's Singapore region for lowest latency)
3. After creation, go to **Connection Details**
4. Copy the **Pooled Connection String** (looks like: `postgresql://user:password@ep-xxx.ap-southeast-1.aws.neon.tech/dbname?sslmode=require`)
5. Save this - you'll need it for Render's `NEON_DATABASE_URL`

---

## Step 2: Deploy Backend to Render

### Using Render Blueprint (Recommended)

1. Go to Render Dashboard → **New** → **Blueprint Instance**
2. Connect your GitHub repository
3. Render will detect `render.yaml` at the repo root
4. Click **Apply** - Render will prompt for all environment variables

### Environment Variables to Fill in Render Dashboard

The Blueprint defines these variables. **All `sync: false` variables must be filled manually** in Render's dashboard after the Blueprint deploys.

#### ── Server ──
| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | Pre-filled |
| `PORT` | `10000` | Pre-filled (Render uses port 10000) |
| `LOG_LEVEL` | `info` | Pre-filled |

#### ── Auth ──
| Variable | Notes |
|----------|-------|
| `JWT_SECRET` | Generate: `openssl rand -base64 32` |
| `FRONTEND_URL` | Your Vercel URL (e.g., `https://pentacloud.vercel.app`) |
| `DEFAULT_ADMIN_EMAIL` | Admin email for first login |
| `DEFAULT_ADMIN_PASSWORD` | Strong password for admin account |

#### ── Database ──
| Variable | Notes |
|----------|-------|
| `NEON_DATABASE_URL` | **Required** - Pooled connection string from Neon (Step 1) |

#### ── B2 Storage (5 accounts × 4 vars each = 20 vars) ──
| Variable | Notes |
|----------|-------|
| `B2_1_KEY_ID` | Application Key ID from B2 Console |
| `B2_1_APP_KEY` | Application Key secret from B2 Console |
| `B2_1_BUCKET_NAME` | Exact bucket name from B2 Console |
| `B2_1_BUCKET_ENDPOINT` | Full S3 endpoint (e.g., `s3.us-east-005.backblazeb2.com`) |
| `B2_2_KEY_ID` | ... |
| `B2_2_APP_KEY` | ... |
| `B2_2_BUCKET_NAME` | ... |
| `B2_2_BUCKET_ENDPOINT` | Full S3 endpoint |
| `B2_3_KEY_ID` | ... |
| `B2_3_APP_KEY` | ... |
| `B2_3_BUCKET_NAME` | ... |
| `B2_3_BUCKET_ENDPOINT` | ... |
| `B2_4_KEY_ID` | ... |
| `B2_4_APP_KEY` | ... |
| `B2_4_BUCKET_NAME` | ... |
| `B2_4_BUCKET_ENDPOINT` | ... |
| `B2_5_KEY_ID` | ... |
| `B2_5_APP_KEY` | ... |
| `B2_5_BUCKET_NAME` | ... |
| `B2_5_BUCKET_ENDPOINT` | ... |

> **Important**: All B2 variables use `sync: false` - Render will prompt you for each. No disk configuration needed (SQLite removed, using Neon PostgreSQL).

### After Deployment
- Note the Render URL generated (e.g., `https://pentacloud-backend.onrender.com`)
- This will be used for the frontend's `VITE_API_URL`

---

## Step 3: Deploy Frontend to Vercel

1. Go to Vercel Dashboard → **Add New...** → **Project**
2. Import your GitHub repository
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `bun run build`
   - **Output Directory**: `dist`
   - **Install Command**: `bun install`

### Environment Variables (Vercel Dashboard)

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://your-render-url.onrender.com/api` |

> Replace `your-render-url.onrender.com` with the actual Render backend URL from Step 2.

---

## Step 4: Cross-Link Frontend and Backend

1. After both deployments succeed, copy your **Vercel frontend URL** (e.g., `https://pentacloud.vercel.app`)
2. Go to Render Dashboard → your backend service → **Environment**
3. Update `FRONTEND_URL` to your Vercel URL (e.g., `https://pentacloud.vercel.app`)
4. Click **Save Changes** → Render will automatically redeploy the backend
5. Wait for redeployment to complete

---

## Step 5: Verify Deployment

1. Visit your Vercel URL → confirm login page loads
2. Log in with `DEFAULT_ADMIN_EMAIL` / `DEFAULT_ADMIN_PASSWORD`
3. Upload a test file → confirm it succeeds
4. Navigate to **Storage Usage** page → confirm it loads without crash and shows real numbers
5. (Optional) As admin, go to Settings → add a new B2 account → confirm it saves correctly

---

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `ECONNREFUSED` on port 5432 | `NEON_DATABASE_URL` missing or wrong | Verify Neon pooled connection string is correct in Render env vars |
| B2 401 Unauthorized | Wrong B2 credentials | Verify `B2_X_BUCKET_ENDPOINT` is full S3 endpoint (e.g., `s3.us-east-005.backblazeb2.com`), not just region code |
| Login fails / 401 | `JWT_SECRET` not set or mismatch | Ensure `JWT_SECRET` is set in Render (same value for all deploys) |
| CORS errors | `FRONTEND_URL` mismatch | Ensure `FRONTEND_URL` in Render matches exact Vercel URL (including `https://`) |
| B2 upload fails | Bucket name/endpoint mismatch | Verify `BUCKET_NAME` and `BUCKET_ENDPOINT` match exactly what B2 Console shows |
| Service spins down | Free tier spins down after 15min inactivity | Expected on free plan - first request after wake takes ~30-50s |

---

## Local Development (Unchanged)

```bash
# Terminal 1 - Backend
cd backend
cp .env.example .env
# Edit .env with your local Neon URL and B2 credentials
bun run dev

# Terminal 2 - Frontend
cd frontend
bun run dev
```

---

## Security Notes

- **Never commit** `.env`, `.env.*` (except `.env.example`)
- All secrets stored in platform dashboards (Render/Vercel)
- `.gitignore` already excludes `.env` files
- Generate strong JWT_SECRET: `openssl rand -base64 32`

---

## Architecture Notes

- **Database**: PostgreSQL on Neon (serverless, no persistent disk needed)
- **File Storage**: Backblaze B2 (5 accounts × 10GB = 50GB total)
- **Auth**: JWT with refresh tokens, bcrypt password hashing
- **Frontend**: React 19 + Vite 8 + TailwindCSS 4, deployed to Vercel
- **Backend**: Express + Node.js, deployed to Render (free tier)