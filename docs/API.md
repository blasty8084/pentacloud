# PENTACLOUD API Reference

Base URL: `https://your-backend.onrender.com/api` (or `http://localhost:4000/api` locally)

All endpoints require `Authorization: Bearer <accessToken>` header unless marked **public**.
Refresh token is sent via httpOnly cookie (`refreshToken`) automatically by browser.

---

## Table of Contents

- [Health](#health)
- [Authentication](#authentication)
- [Files](#files)
- [Folders](#folders)
- [Shares](#shares)
- [Storage](#storage)
- [Settings (Admin)](#settings-admin)

---

## Health

### GET /api/health

**Purpose**: Liveness/readiness check  
**Auth**: public  
**Response**: `200 OK`

```json
{ "ok": true }
```

```bash
curl https://api.example.com/api/health
```

---

## Authentication

All auth endpoints are rate limited: **10 requests per 15 minutes** per IP.

### POST /api/auth/signup

**Purpose**: Register new user (first user becomes admin)  
**Auth**: public  
**Rate Limit**: 10/15min

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe"
}
```

**Validation**:
- `email`: valid email, normalized
- `password`: min 8 characters
- `name`: optional, max 100 chars

**Success**: `200 OK`
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "admin"
  }
}
```
*Also sets httpOnly cookies: `accessToken` (15 min), `refreshToken` (7 days)*

**Errors**:
- `400` - Missing email/password
- `409` - Email already registered
- `403` - Maximum 5 users reached
- `500` - Server error

```bash
curl -X POST https://api.example.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"securepassword123","name":"John"}'
```

### POST /api/auth/login

**Purpose**: Authenticate user, return tokens  
**Auth**: public  
**Rate Limit**: 10/15min

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Validation**:
- `email`: valid email
- `password`: required

**Success**: `200 OK`
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```
*Also sets httpOnly cookies*

**Errors**:
- `400` - Missing email/password
- `401` - Invalid credentials
- `500` - Server error

```bash
curl -X POST https://api.example.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"securepassword123"}'
```

### POST /api/auth/refresh

**Purpose**: Exchange refresh token for new access token (+ rotated refresh token)  
**Auth**: refresh token (cookie or body)

**Request**: Cookie `refreshToken` automatically sent, OR body `{ "refreshToken": "..." }`

**Success**: `200 OK`
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "uuid", "email": "...", "name": "...", "role": "user" }
}
```
*New cookies set: new accessToken + rotated refreshToken*

**Errors**:
- `401` - Refresh token required / invalid / expired / user not found
- `500` - Server error

### POST /api/auth/logout

**Purpose**: Clear auth cookies  
**Auth**: any (cookie cleared regardless)

**Success**: `200 OK`
```json
{ "success": true }
```

### GET /api/auth/me

**Purpose**: Get current user from access token  
**Auth**: required (Bearer token)

**Success**: `200 OK`
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

**Errors**: `401` - Invalid/expired token / user not found

---

## Files

All file endpoints: **Auth required** (Bearer token)  
Upload endpoint rate limited: **100 requests/hour** per IP

### GET /api/files

**Purpose**: List files in current folder (with optional search)  
**Query Params**:
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `folderId` | UUID | `null` (root) | Filter by folder |
| `search` | string | - | Case-insensitive name search |

**Validation**: `folderId` must be UUID if provided; `search` max 100 chars

**Success**: `200 OK`
```json
[
  {
    "id": "uuid",
    "name": "document.pdf",
    "original_name": "document.pdf",
    "mime_type": "application/pdf",
    "size": 1048576,
    "folder_id": "uuid",
    "user_id": "uuid",
    "b2_account_id": "uuid",
    "b2_file_id": "4_zb123...",
    "b2_file_name": "1701234567890-document.pdf",
    "created_at": 1701234567890,
    "updated_at": 1701234567890
  }
]
```

**Errors**: `400` validation, `500` server error

```bash
curl "https://api.example.com/api/files?folderId=uuid&search=pdf" \
  -H "Authorization: Bearer <token>"
```

### POST /api/files/upload

**Purpose**: Upload a file (small or large, with account failover)  
**Content-Type**: `multipart/form-data` (browser MUST set boundary, do NOT set manually)

**Form Fields**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | yes | The file to upload |
| `folderId` | UUID | no | Target folder (root if omitted) |

**Limits**:
- Max file size: **5 GB** (5368709120 bytes)
- Allowed MIME types: see [whitelist](#allowed-mime-types) below
- Rate limit: 100 req/hr per IP

**File Size Behavior**:
- **< 100 MB**: Simple upload (read into memory, single B2 `uploadFile`)
- **≥ 100 MB**: Large file multipart upload (streamed from disk, B2 `startLargeFile` → `uploadPart` × N → `finishLargeFile`)

**Failover**: If B2 account fails (auth error, network, 5xx), reservation rolled back, next account tried (max 3 accounts)

**Success**: `201 Created`
```json
{
  "id": "uuid",
  "name": "document.pdf",
  "original_name": "document.pdf",
  "mime_type": "application/pdf",
  "size": 1048576,
  "folder_id": "uuid",
  "user_id": "uuid",
  "b2_account_id": "uuid",
  "b2_file_id": "4_zb123...",
  "b2_file_name": "1701234567890-document.pdf",
  "created_at": 1701234567890,
  "updated_at": 1701234567890
}
```

**Errors**:
| Code | Message | Cause |
|------|---------|-------|
| 400 | No file provided | Missing `file` field |
| 400 | File type X not allowed | MIME not in whitelist |
| 400 | File exceeds the 5GB size limit | > 5 GB |
| 404 | Folder not found | Invalid `folderId` |
| 507 | No B2 accounts configured or all full | No space |
| 500 | Upload failed | B2 error, network, etc. |

**Progress Tracking** (frontend):
```js
// axios automatically provides onUploadProgress
await filesApi.upload(file, folderId, (percent) => {
  console.log(`${percent}% uploaded`);
});
```
**Critical**: Do NOT set `Content-Type: multipart/form-data` header manually. Browser must generate boundary.

```bash
curl -X POST https://api.example.com/api/files/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/file.pdf" \
  -F "folderId=uuid"
```

### Allowed MIME Types

```
Images:     image/jpeg, image/png, image/gif, image/webp, image/svg+xml,
            image/tiff, image/bmp, image/x-icon, image/heic, image/heif

Documents:  application/pdf,
            application/msword,
            application/vnd.openxmlformats-officedocument.wordprocessingml.document,  // .docx
            application/vnd.ms-excel,
            application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,       // .xlsx
            application/vnd.ms-powerpoint,
            application/vnd.openxmlformats-officedocument.presentationml.presentation, // .pptx
            application/vnd.oasis.opendocument.text,      // .odt
            application/vnd.oasis.opendocument.spreadsheet, // .ods
            application/vnd.oasis.opendocument.presentation, // .odp

Text/Code:  text/plain, text/csv, text/markdown, text/html, text/css, text/javascript,
            text/typescript, text/xml, text/yaml,
            application/json, application/xml, application/yaml

Archives:   application/zip, application/x-zip-compressed,
            application/x-rar-compressed,
            application/x-7z-compressed, application/x-tar, application/gzip

Video:      video/mp4, video/webm, video/quicktime, video/x-msvideo, video/x-matroska,
            video/ogg, video/3gpp, video/3gpp2

Audio:      audio/mpeg, audio/wav, audio/ogg, audio/flac, audio/mp4, audio/aac,
            audio/x-m4a, audio/webm

Fonts:      font/woff, font/woff2, font/ttf, font/otf

Fallback:   application/octet-stream
```

### GET /api/files/:id/download

**Purpose**: Stream file download (proxied through backend)  
**Path Param**: `id` (file UUID)

**Response**: Binary stream with headers:
```
Content-Disposition: attachment; filename="document.pdf"
Content-Type: application/pdf
Content-Length: 1048576
```

**Errors**: 
- `404` file not found / `file_not_present` in B2
- `401` / `403` download authorization failed / token expired
- `400` invalid download request
- `500` download failed

```bash
curl -L -o document.pdf "https://api.example.com/api/files/uuid/download" \
  -H "Authorization: Bearer <token>"
```

> **Fixed**: Previously, files without a `b2_file_id` (using fallback `downloadFileByName`) would fail with B2 400 error "required field fileNamePrefix is missing" due to malformed query string. Fixed by using correct query separator (`?` for fileName, `&` for fileId) when appending download authorization token. See [Download Bug Fix](#download-bug-fixed).

### PATCH /api/files/:id

**Purpose**: Rename or move file  
**Path Param**: `id` (file UUID)

**Request Body** (any combination):
```json
{
  "name": "new-name.pdf",
  "folderId": "uuid"  // or null for root
}
```

**Validation**: `name` 1-255 chars; `folderId` UUID or null

**Success**: `200 OK` (updated file object)

**Errors**: `400` validation, `404` not found, `500` server error

### DELETE /api/files/:id

**Purpose**: Delete file (also decrements `used_bytes` on B2 account)  
**Path Param**: `id` (file UUID)

**Success**: `200 OK`
```json
{ "success": true }
```

**Errors**: `404` not found, `500` server error

---

## Folders

All endpoints: **Auth required**

### GET /api/folders

**Purpose**: Flat list of user's folders  
**Success**: `200 OK`
```json
[
  { "id": "uuid", "name": "Documents", "parent_id": null, "user_id": "uuid", "created_at": 123, "updated_at": 123 }
]
```

### GET /api/folders/tree

**Purpose**: Nested folder tree (for sidebar)  
**Success**: `200 OK`
```json
[
  {
    "id": "uuid",
    "name": "Documents",
    "parent_id": null,
    "children": [
      { "id": "uuid", "name": "Work", "parent_id": "uuid", "children": [] }
    ]
  }
]
```

### POST /api/folders

**Purpose**: Create folder  
**Request Body**:
```json
{
  "name": "New Folder",
  "parentId": "uuid"  // optional
}
```
**Validation**: `name` 1-255 chars; `parentId` UUID if provided

**Success**: `201 Created` (folder object)

**Errors**: `400` validation, `404` parent not found, `500` server error

### PATCH /api/folders/:id

**Purpose**: Rename or move folder  
**Path Param**: `id` (folder UUID)

**Request Body** (any combination):
```json
{
  "name": "New Name",
  "parentId": "uuid"  // or null for root
}
```
**Validation**: Cannot move into itself or its own descendant

**Success**: `200 OK` (updated folder)

**Errors**: `400` validation (self/descendant move), `404` not found, `500`

### DELETE /api/folders/:id

**Purpose**: Delete folder (must be empty? UNVERIFIED - code doesn't check for child files/folders)  
**Path Param**: `id` (folder UUID)

**Success**: `200 OK` `{ "success": true }`

**Errors**: `404` not found, `500`

---

## Shares

### POST /api/shares

**Purpose**: Create shareable download link  
**Auth**: required  
**Request Body**:
```json
{
  "fileId": "uuid",
  "expiresInHours": 24  // optional, 1-8760 (1 year)
}
```
**Validation**: `fileId` UUID required; `expiresInHours` 1-8760

**Success**: `200 OK`
```json
{
  "token": "uuid",
  "shareUrl": "https://frontend.example.com/share/uuid",
  "expiresAt": "2025-01-15T12:00:00.000Z"
}
```

### GET /api/shares/:token

**Purpose**: Download file via share link (public or authenticated)  
**Auth**: optional (uses `optionalAuthMiddleware`)  
**Path Param**: `token` (share UUID)

**Response**: Binary stream (same headers as file download)

**Errors**:
- `404` share not found / file not found
- `410` share link expired
- `500` server error

### DELETE /api/shares/:token

**Purpose**: Delete share link  
**Auth**: required (owner or admin)  
**Path Param**: `token` (share UUID)

**Success**: `200 OK` `{ "success": true }`

**Errors**: `403` not owner/admin, `404` not found, `500`

---

## Storage

### GET /api/storage/stats

**Purpose**: Get cached storage usage (no live B2 calls)  
**Auth**: required

**Success**: `200 OK`
```json
{
  "total": {
    "used": 16171040,
    "max": 53687091200,
    "free": 53670920160,
    "percentage": 0
  },
  "accounts": [
    {
      "id": "uuid",
      "name": "Account 1",
      "bucketName": "bucket-1",
      "bucketEndpoint": "s3.us-east-005.backblazeb2.com",
      "used": 8085520,
      "max": 10737418240,
      "free": 10729332720,
      "percentage": 0,
      "health": "healthy",
      "consecutiveFailures": 0,
      "available": true
    }
  ]
}
```

**Note**: All size fields are **numbers** (not strings) - BIGINT parser converts them.  
**Fields**:
- `used` / `max` / `free` = bytes (number)
- `percentage` = integer 0-100
- `health`: `"healthy"` | `"degraded"` | `"unhealthy"`
- `consecutiveFailures`: integer
- `available`: boolean (false during unhealthy cooldown)

---

## Settings (Admin)

All endpoints: **Auth required + admin role** (403 if not admin)

### GET /api/settings/b2-accounts

**Purpose**: List B2 accounts (without secrets)  
**Success**: `200 OK`
```json
[
  {
    "id": "uuid",
    "name": "Account 1",
    "bucket_name": "bucket-1",
    "bucket_endpoint": "s3.us-east-005.backblazeb2.com",
    "max_size_gb": 10,
    "created_at": "2025-01-01T00:00:00.000Z"
  }
]
```

### POST /api/settings/b2-accounts

**Purpose**: Add B2 account (validates with B2, adds to service)  
**Request Body**:
```json
{
  "name": "Account 1",
  "keyId": "000000000000000000000001",
  "appKey": "K00000000000000000000000000000000000",
  "bucketName": "my-bucket",
  "bucketEndpoint": "s3.us-east-005.backblazeb2.com",
  "maxSizeGb": 10
}
```
**Validation**:
- `name`: 1-100 chars
- `keyId`: required
- `appKey`: required
- `bucketName`: required
- `bucketEndpoint`: required (format: `s3.region.backblazeb2.com`)
- `maxSizeGb`: optional, 1-100

**Success**: `201 Created` (account object without secrets)

**Errors**: `403` not admin, `500` B2 auth failed / DB error

### DELETE /api/settings/b2-accounts/:id

**Purpose**: Delete B2 account (must have zero files)  
**Path Param**: `id` (account UUID)

**Errors**: `403` not admin, `404` not found, `400` has files, `500`

### POST /api/settings/b2-accounts/reconcile

**Purpose**: Recalculate `used_bytes` from actual file sizes (admin only)  
**Success**: `200 OK`
```json
{
  "success": true,
  "accounts": [
    { "id": "uuid", "name": "Account 1", "used_bytes": 16171040 }
  ]
}
```

---

## Error Response Format

All errors follow this shape:
```json
{
  "error": "Human-readable message"
}
```
Validation errors (express-validator):
```json
{
  "errors": [
    { "type": "field", "path": "email", "msg": "Valid email required", "location": "body" }
  ]
}
```

| HTTP Code | When |
|-----------|------|
| 400 | Bad request / validation error / Multer file size / disallowed MIME |
| 401 | Missing/invalid/expired token, invalid credentials |
| 403 | Forbidden (admin required, max users, not owner) |
| 404 | Resource not found |
| 409 | Email already registered (signup) |
| 410 | Share link expired |
| 429 | Rate limited (login/signup/upload) |
| 500 | Internal server error (details logged server-side only) |
| 507 | Insufficient storage (no B2 space) |

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /api/auth/login` | 10 req | 15 min |
| `POST /api/auth/signup` | 10 req | 15 min |
| `POST /api/files/upload` | 100 req | 1 hour |
| Others | none | - |

Rate limit responses include `Retry-After` header and standard headers.

---

## Known Fixes

### Download Bug Fixed (Files without b2_file_id)

**Issue**: Files without a `b2_file_id` (fallback to `downloadFileByName`) failed with B2 400 error:
```
"message": "required field fileNamePrefix is missing", "code": "bad_request"
```

**Root Cause**: The download authorization token was appended with `&Authorization=` for both:
- `b2FileId` branch: URL already had `?fileId=...` → `&Authorization=` ✓ correct
- `fileName` branch: URL had NO query string → `&Authorization=` ✗ invalid (missing `?`)

**Fix**: Use correct query separator per branch:
```javascript
const urlWithAuth = b2FileId
  ? `${downloadUrl}&Authorization=${encodeURIComponent(authToken)}`  // has ?fileId=
  : `${downloadUrl}?Authorization=${encodeURIComponent(authToken)}`;  // needs ?
```

**Files Changed**:
- `backend/src/services/b2.js` — `downloadFile()` function
- `backend/src/routes/files.js` — `GET /api/files/:id/download`
- `backend/src/routes/shares.js` — `GET /api/shares/:token`

**Additional Improvements**:
- Full B2 error response logging for debugging
- Specific error handling: `404`/`file_not_present`, `401`/`403`, `400` mapped to appropriate HTTP status
- Direct axios calls with `axiosOverride.headers.Authorization` for download auth token

---

### Live Storage Dashboard (Auto-refresh)

The Storage Dashboard (`/api/storage/stats`) now supports automatic live updates:
- **Auto-refresh**: Enabled by default, polls every 30 seconds
- **Smart caching**: 30-second cache TTL prevents unnecessary API calls
- **Pause/Resume**: User can toggle auto-refresh on/off
- **Visual indicator**: Green "Live" badge with pulsing play icon when active
- **Frontend**: `StorageDashboard` component (`frontend/src/components/StorageDashboard.tsx`)
- **Backend**: Uses cached DB values (`used_bytes` column) — no live B2 API calls

**Configuration**:
```typescript
const CACHE_TTL = 30 * 1000;           // 30-second cache TTL
const AUTO_REFRESH_INTERVAL = 30 * 1000; // 30-second auto-refresh
```