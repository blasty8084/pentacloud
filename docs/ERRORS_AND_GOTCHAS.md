# Errors & Gotchas

## Standard Error Response

All API errors follow this shape:

```json
{ "error": "Human-readable message" }
```

Validation errors (express-validator):
```json
{
  "errors": [
    { "type": "field", "path": "email", "msg": "Valid email required", "location": "body" }
  ]
}
```

---

## HTTP Status Codes

| Code | When | Example Message |
|------|------|-----------------|
| 400 | Bad request / validation / Multer file size / disallowed MIME | `"File type application/x-msdownload not allowed"` |
| 401 | Missing/invalid/expired token, invalid credentials | `"Invalid or expired token"` |
| 403 | Forbidden (admin required, max users, not owner) | `"Admin only"` |
| 404 | Resource not found | `"File not found"` |
| 409 | Email already registered (signup) | `"Email already registered"` |
| 410 | Share link expired | `"Share link expired"` |
| 429 | Rate limited | `"Too many login attempts, please try again later"` |
| 500 | Internal server error | `"Internal server error"` |
| 507 | Insufficient storage | `"No B2 accounts configured or all full"` |

---

## Common Error Messages (Exact Strings)

From backend code — match these exactly in frontend error handling:

| Source | Message | HTTP | Context |
|--------|---------|------|---------|
| `auth.js` | `"Email and password required"` | 400 | Missing fields |
| `auth.js` | `"Invalid credentials"` | 401 | Wrong password |
| `auth.js` | `"Email already registered"` | 409 | Duplicate email |
| `auth.js` | `"Maximum 5 users allowed"` | 403 | User limit |
| `auth.js` | `"Refresh token required"` | 401 | No cookie/body |
| `auth.js` | `"Invalid or expired refresh token"` | 401 | Bad refresh |
| `auth.js` | `"User not found"` | 401 | Deleted user |
| `auth.js` | `"Signup failed"` / `"Login failed"` | 500 | Server error |
| `files.js` | `"No file provided"` | 400 | Missing file |
| `files.js` | `"File type X not allowed"` | 400 | Disallowed MIME |
| `files.js` | `"File exceeds the 5GB size limit"` | 400 | > 5 GB |
| `files.js` | `"Folder not found"` | 404 | Bad folderId |
| `files.js` | `"No B2 accounts configured or all full"` | 507 | No space |
| `files.js` | `"Upload failed"` | 500 | B2/network error |
| `files.js` | `"Download failed"` | 500 | Stream error |
| `files.js` | `"Delete failed"` | 500 | B2 delete error |
| `files.js` | `"Update failed"` | 500 | Rename/move error |
| `files.js` | `"Failed to list files"` | 500 | DB error |
| `shares.js` | `"File not found"` | 404 | Bad fileId |
| `shares.js` | `"Share not found"` | 404 | Bad token |
| `shares.js` | `"Share link expired"` | 410 | Expired |
| `shares.js` | `"Download failed"` | 500 | B2 stream error |
| `shares.js` | `"Not authorized"` | 403 | Not owner/admin |
| `storage.js` | `"Failed to fetch storage stats"` | 500 | B2/DB error |
| `settings.js` | `"Admin only"` | 403 | Non-admin |
| `settings.js` | `"Account not found"` | 404 | Bad account ID |
| `settings.js` | `"Cannot delete account with stored files"` | 400 | Non-empty |
| `global` | `"File exceeds the 5GB size limit"` | 400 | Multer LIMIT_FILE_SIZE |
| `global` | `"File type X not allowed"` | 400 | Multer fileFilter |
| `global` | `"Internal server error"` | 500 | Unhandled |

---

## Known Pitfalls (Frontend Checklist)

### 1. **Read `accessToken` not `token` from login response**
```javascript
// ✅ CORRECT
const { accessToken, user } = await api.post('/auth/login', credentials);

// ❌ WRONG - field doesn't exist
const { token, user } = await api.post('/auth/login', credentials);
```

### 2. **Do NOT set Content-Type on FormData**
```javascript
// ✅ CORRECT - browser sets boundary
await api.post('/files/upload', formData);

// ❌ WRONG - breaks multipart boundary
await api.post('/files/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

### 3. **One upload request per file — no duplicates**
```javascript
// Bug: UploadZone was calling BOTH raw XHR AND axios
// Fix: Single axios call with onUploadProgress
await api.post('/files/upload', formData, {
  onUploadProgress: (e) => setProgress(Math.round(e.loaded * 100 / e.total))
});
```

### 4. **Validate list responses are arrays before mapping**
```javascript
// API can return non-array on error
const data = response.data;
const files = Array.isArray(data) ? data : [];
setFiles(files);
```

### 5. **Always clear loading in finally block**
```javascript
// Bug: setLoading(true) never cleared → infinite spinner
const fetchFiles = async () => {
  setLoading(true);
  try {
    const response = await api.get('/files');
    setFiles(response.data);
  } catch (err) {
    setFiles([]);
  } finally {
    setLoading(false); // ALWAYS runs
  }
};
```

### 6. **Format bytes with shared helper (never undefined/NaN)**
```javascript
// Bug: "79.22 undefined / 50 GB"
function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  if (bytes < 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const unit = sizes[Math.min(i, sizes.length - 1)] || 'B';
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + unit;
}
```

### 7. **Render free tier sleeps → first request 30-50 sec**
```javascript
// Set axios timeout ≥ 5 min for uploads
const api = axios.create({
  timeout: 300000, // 5 min
  withCredentials: true,
});
```

### 8. **BIGINT from DB returns as NUMBER (not string)**
```javascript
// After pg.types.setTypeParser(20, parseInt), size is already number
const sizeInGB = file.size / 1e9; // Works directly
// No need: Number(file.size) — but belt-and-suspenders OK
```

### 9. **Refresh token in httpOnly cookie — not in localStorage**
```javascript
// Axios must use withCredentials: true
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // Sends refreshToken cookie automatically
});
```

### 10. **Vite env vars baked at build time**
```bash
# After changing VITE_API_URL in Vercel:
# 1. Update Environment Variable in Vercel dashboard
# 2. Trigger NEW deployment (Settings → Deployments → Redeploy)
# Vite does NOT read env at runtime!
```

### 11. **CORS: withCredentials + allowed origin**
```javascript
// Backend allows specific origins only
// Frontend must use exact origin (no trailing slash mismatch)
// Vercel URL in backend .env: FRONTEND_URL=https://pentacloud.vercel.app
```

### 12. **Single click preview — not double-click**
```javascript
// FileGrid.tsx: onClick (not onDoubleClick)
<div onClick={() => onPreview(file)}>...</div>
```

### 13. **Background refresh should not flash spinner**
```javascript
// fetchFiles(true) = background, no spinner
fetchFiles(true);
// Only initial load shows spinner
fetchFiles(); // or fetchFiles(false)
```

### 14. **File size in bytes, format for display**
```javascript
// API returns size as number (bytes)
const displaySize = formatBytes(file.size); // "1.5 MB"
```

### 15. **Storage total: used/max are numbers, format with helper**
```javascript
// Bug: "79.22 undefined" — formatBytes returned "79.22 " (missing unit)
formatBytes(stats.total.used); // "15.4 MB"
```

---

## Debugging Tips

### Enable Debug Logs
```javascript
// Frontend: log all API calls
api.interceptors.request.use(config => {
  console.log('→', config.method?.toUpperCase(), config.url);
  return config;
});
api.interceptors.response.use(res => {
  console.log('←', res.status, res.config.url);
  return res;
});
```

### Check Network Tab
1. Look for `Authorization: Bearer` header on all requests
2. Check `Set-Cookie` headers on login (refreshToken)
3. Verify `withCredentials: true` sends cookies on refresh
4. Watch for duplicate `/files/upload` calls

### Common 500 Causes
1. B2 credentials wrong → check `B2_*_KEY_ID`, `B2_*_APP_KEY`
2. B2 bucket endpoint wrong → must be `s3.region.backblazeb2.com`
3. Neon DB URL wrong → check `NEON_DATABASE_URL` format
4. JWT secret missing → check `JWT_SECRET`
5. File > 5 GB → Multer rejects before handler

### Debug Storage "NaN undefined"
1. Check `getStorageStats()` returns numbers (not strings)
2. Verify pg BIGINT parser: `pg.types.setTypeParser(20, parseInt)`
3. Format with `formatBytes()` that handles `null/undefined/0`

---

## Testing Checklist Before Deploy

- [ ] Login → accessToken in JSON, cookies set
- [ ] Refresh → new accessToken + rotated refresh cookie
- [ ] Logout → cookies cleared
- [ ] Upload 1 MB file → progress bar → appears in list
- [ ] Upload 200 MB file → progress → appears (multipart)
- [ ] Click file → preview opens (image/PDF/video)
- [ ] Download → saves with correct filename
- [ ] Rename/move → updates in list
- [ ] Delete → removes from list + storage updates
- [ ] Create folder → appears in tree
- [ ] Move folder → tree updates
- [ ] Share link → downloads without auth
- [ ] Expired share → 410
- [ ] Storage stats → numbers not NaN
- [ ] Theme toggle → persists
- [ ] Sidebar collapse → works
- [ ] Mobile responsive → works