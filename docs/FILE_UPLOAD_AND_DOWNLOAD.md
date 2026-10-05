# File Upload & Download Contract

## Upload: POST /api/files/upload

### Request

**Content-Type**: `multipart/form-data`  
**CRITICAL**: Do **NOT** set `Content-Type` header manually. Browser must generate the boundary.

```javascript
// ✅ CORRECT - axios handles boundary automatically
const formData = new FormData();
formData.append('file', file);
formData.append('folderId', folderId); // optional
await api.post('/files/upload', formData, {
  onUploadProgress: (e) => {
    if (e.total) {
      const percent = Math.round((e.loaded * 100) / e.total);
      setProgress(percent);
    }
  },
});

// ❌ WRONG - breaks multipart boundary
await api.post('/files/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

**Fields**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | The file to upload |
| `folderId` | string (UUID) | No | Target folder (root if omitted) |

### Limits & Validation

| Limit | Value |
|-------|-------|
| Max file size | **5 GB** (5,368,709,120 bytes) |
| Rate limit | 100 req/hour per IP |
| Allowed MIME types | See [whitelist](#mime-type-whitelist) |

### Size-Based Behavior

| File Size | Backend Behavior |
|-----------|------------------|
| **< 100 MB** | Reads entire file into memory → single B2 `uploadFile` call |
| **≥ 100 MB** | Streams from disk → B2 Large File API (`startLargeFile` → `uploadPart` × N → `finishLargeFile`) |

**Threshold**: `100 MB` (104,857,600 bytes) — defined as `LARGE_FILE_THRESHOLD` in `files.js:15`

### Account Failover (Transparent to Frontend)

1. Backend atomically reserves space on account with most free space
2. If B2 upload fails (auth error, network, 5xx, 429):
   - Reservation rolled back on that account
   - Account marked degraded/unhealthy
   - Next account tried (max 3 attempts)
3. **Frontend sees single request** — failover is transparent

### Response

**Success (201 Created)**:
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

| Status | Error Message | Cause |
|--------|---------------|-------|
| 400 | No file provided | Missing `file` field |
| 400 | File type X not allowed | MIME not in whitelist |
| 400 | File exceeds the 5GB size limit | File > 5 GB |
| 404 | Folder not found | Invalid `folderId` |
| 507 | No B2 accounts configured or all full | No space on any account |
| 500 | Upload failed | B2 error, network, etc. |

### Progress Tracking

Frontend uses axios `onUploadProgress`:
```javascript
await api.post('/files/upload', formData, {
  onUploadProgress: (event) => {
    if (event.total) {
      const percent = Math.round((event.loaded * 100) / event.total);
      setProgress(percent); // 0-100
    }
  },
});
```

**Note**: For large files (≥100 MB), progress reflects total upload to backend (not per-chunk B2 progress).

---

## Download Bug Fix (Fixed)

### Issue
The `downloadFile()` function in `backend/src/services/b2.js` had a bug where the download authorization token was appended with `&Authorization=` for both the `b2FileId` branch (which already had `?fileId=...` in the URL) AND the `fileName` branch (which had NO query string). This created malformed URLs for the `fileName` branch:
```
/file/bucket/file.txt&Authorization=token   // INVALID - missing ?
```

This caused B2 to return a 400 error with message "required field fileNamePrefix is missing".

### Root Cause
The B2 download endpoints:
- `/b2api/v2/b2_download_file_by_id?fileId=...` — already has `?fileId=`
- `/file/{bucketName}/{fileName}` — NO query string

The code was appending `&Authorization=` to both, but the second URL needs `?Authorization=`.

### Fix Applied
**File**: `backend/src/services/b2.js` (line ~739)

```javascript
// Before (broken):
const urlWithAuth = `${downloadUrl}&Authorization=${encodeURIComponent(authToken)}`;

// After (fixed):
const urlWithAuth = b2FileId
  ? `${downloadUrl}&Authorization=${encodeURIComponent(authToken)}`  // has ?fileId=
  : `${downloadUrl}?Authorization=${encodeURIComponent(authToken)}`;  // needs ?
```

### Affected Endpoints
- `GET /api/files/:id/download` (`backend/src/routes/files.js`)
- `GET /api/shares/:token` (`backend/src/routes/shares.js`)

Both routes now correctly pass the `b2_file_id` from the database to `downloadFile()`, and the download authorization token is properly appended with the correct query separator.

### Additional Improvements
- **Full B2 error response logging** for debugging
- **Specific error handling** in routes:
  - `404` / `file_not_present` → `404 File not found in storage`
  - `401` / `403` → `401 Download authorization failed`
  - `400` → `400 Invalid download request`
- **Direct axios calls** with `axiosOverride.headers.Authorization` for download authorization token (bypassing library's ignored `authorization` parameter)

---

## MIME Type Whitelist

From `files.js:16-49`:

```javascript
const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'image/tiff', 'image/bmp', 'image/x-icon', 'image/heic', 'image/heif',
  // Documents - Office
  'application/pdf',
  'application/msword',                                    // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',  // .docx
  'application/vnd.ms-excel',                              // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',        // .xlsx
  'application/vnd.ms-powerpoint',                         // .ppt
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'application/vnd.oasis.opendocument.text',               // .odt
  'application/vnd.oasis.opendocument.spreadsheet',        // .ods
  'application/vnd.oasis.opendocument.presentation',       // .odp
  // Text & Code
  'text/plain', 'text/csv', 'text/markdown', 'text/html', 'text/css', 'text/javascript',
  'text/typescript', 'text/xml', 'text/yaml',
  'application/json', 'application/xml', 'application/yaml',
  // Archives
  'application/zip', 'application/x-zip-compressed',
  'application/x-rar-compressed',
  'application/x-7z-compressed', 'application/x-tar', 'application/gzip',
  // Video
  'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska',
  'video/ogg', 'video/3gpp', 'video/3gpp2',
  // Audio
  'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/mp4', 'audio/aac',
  'audio/x-m4a', 'audio/webm',
  // Fonts
  'font/woff', 'font/woff2', 'font/ttf', 'font/otf',
  // Generic binary (fallback)
  'application/octet-stream',
];
```

**Disallowed → 400**: `{ "error": "File type X not allowed" }`

---

## Download & Preview: GET /api/files/:id/download

### Contract

**Endpoint**: `GET /api/files/:id/download`  
**Auth**: Bearer token required  
**Path Param**: `id` (file UUID)

### Response

**Headers**:
```
Content-Disposition: attachment; filename="document.pdf"
Content-Type: application/pdf
Content-Length: 1048576
```

**Body**: Binary stream (proxied from B2 through backend)

### Frontend Usage

**Download (save to disk)**:
```javascript
const downloadFile = async (fileId, filename) => {
  const response = await api.get(`/files/${fileId}/download`, {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
};
```

**Preview (inline in browser)**:
```javascript
const previewFile = async (fileId, mimeType) => {
  const response = await api.get(`/files/${fileId}/download`, {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data], { type: mimeType }));
  // Open in new tab or modal <iframe src={url} />
  window.open(url, '_blank');
  // Remember to revoke: window.URL.revokeObjectURL(url);
};
```

**Important**: Backend streams from B2 → no direct browser→B2 connection needed. No B2 CORS configuration required.

---

## Rename/Move: PATCH /api/files/:id

**Request Body** (any combination):
```json
{
  "name": "new-name.pdf",
  "folderId": "uuid"  // or null for root
}
```

**Success**: `200 OK` (updated file object)

**Errors**: `400` validation, `404` not found, `500`

---

## Delete: DELETE /api/files/:id

**Behavior**: Deletes from B2 + DB, **decrements `used_bytes` on B2 account**

**Success**: `200 OK` `{ "success": true }`

---

## MIME Type Detection

Backend uses `req.file.mimetype` from multer (based on file extension + content sniffing).  
Frontend should **not** rely on extension alone — trust server validation.

---

## Large File Upload Timeouts (Render Free Tier)

| Phase | Timeout | Notes |
|-------|---------|-------|
| Backend cold start | 30-50 sec | First request after inactivity |
| Upload to backend | None (streaming) | Limited by client network |
| Backend→B2 multipart | ~5 min/GB | B2 part upload time |
| Total (1 GB) | ~2-5 min | Varies by network |

**Frontend Recommendations**:
```javascript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 300000, // 5 min for uploads
  withCredentials: true,
});

// Retry on network error (not 4xx/5xx)
api.interceptors.response.use(null, (error) => {
  if (!error.response && error.code === 'ECONNABORTED') {
    // Timeout - could retry once
  }
  return Promise.reject(error);
});
```

---

## Summary: Frontend Upload Checklist

- [ ] Use `FormData` with `file` + optional `folderId`
- [ ] **Do not** set `Content-Type` header
- [ ] Use `onUploadProgress` for progress bar
- [ ] Set axios timeout ≥ 5 min for large files
- [ ] Handle 400 (validation), 404 (folder), 507 (full), 500 (server)
- [ ] Single request per file — no duplicate uploads
- [ ] Background refresh after upload: `fetchFiles(true)` (no spinner)