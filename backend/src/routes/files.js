import { Router } from 'express';
import multer from 'multer';
import { query } from '../db/index.js';
import b2Service from '../services/b2.js';
import { authMiddleware } from '../middleware/auth.js';
import validators from '../middleware/validate.js';
import { v4 as uuidv4 } from 'uuid';
import { sanitizeError } from '../utils/sanitizeError.js';
import fs from 'fs';
import path from 'path';

const router = Router();

const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024;
const LARGE_FILE_THRESHOLD = 100 * 1024 * 1024; // 100MB
const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'image/tiff', 'image/bmp', 'image/x-icon', 'image/heic', 'image/heif',
  // Documents - Office
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'application/vnd.oasis.opendocument.text', // .odt
  'application/vnd.oasis.opendocument.spreadsheet', // .ods
  'application/vnd.oasis.opendocument.presentation', // .odp
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

function sanitizeFileName(name) {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .replace(/^[\._]+|[\._]+$/g, '')
    .substring(0, 255);
}

function validateFileType(mimetype) {
  return ALLOWED_MIME_TYPES.includes(mimetype);
}

// Use disk storage for all files to handle large files without memory issues
const TEMP_UPLOAD_DIR = path.join(process.cwd(), 'tmp', 'uploads');
if (!fs.existsSync(TEMP_UPLOAD_DIR)) {
  fs.mkdirSync(TEMP_UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, TEMP_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${sanitizeFileName(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!validateFileType(file.mimetype)) {
      return cb(new Error(`File type ${file.mimetype} not allowed`), false);
    }
    cb(null, true);
  },
});

// Helper to clean up temp file
const cleanupTempFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error(`[UPLOAD] Failed to cleanup temp file ${filePath}:`, sanitizeError(err));
    }
  }
};

router.get('/:id/download', validators.deleteFile, async (req, res) => {
  try {
    const fileResult = await query('SELECT * FROM files WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (fileResult.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    const file = fileResult.rows[0];
    const stream = await b2Service.downloadFile(file.b2_account_id, file.b2_file_name);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.original_name)}"`);
    res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
    res.setHeader('Content-Length', file.size);
    stream.pipe(res);
  } catch (err) {
    const sanitizedMessage = sanitizeError(err);
    console.error(`[DOWNLOAD] Failed for file ${req.params.id}:`, sanitizedMessage);
    res.status(500).json({ error: 'Download failed' });
  }
});

router.patch('/:id', validators.updateFile, async (req, res) => {
  try {
    const fileResult = await query('SELECT * FROM files WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (fileResult.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    const { name, folderId } = req.body;
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (name !== undefined) {
      const sanitizedName = sanitizeFileName(name);
      updates.push(`name = $${paramIndex++}`);
      params.push(sanitizedName);
    }
    if (folderId !== undefined) {
      if (folderId) {
        const folder = await query('SELECT id FROM folders WHERE id = $1 AND user_id = $2', [folderId, req.user.id]);
        if (folder.rows.length === 0) {
          return res.status(404).json({ error: 'Target folder not found' });
        }
      }
      updates.push(`folder_id = $${paramIndex++}`);
      params.push(folderId || null);
    }
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates.push(`updated_at = NOW()`);
    params.push(req.params.id);

    await query(`UPDATE files SET ${updates.join(', ')} WHERE id = $${paramIndex}`, params);
    const updatedResult = await query('SELECT * FROM files WHERE id = $1', [req.params.id]);
    res.json(updatedResult.rows[0]);
  } catch (err) {
    const sanitizedMessage = sanitizeError(err);
    console.error(`[UPDATE] Failed for file ${req.params.id}:`, sanitizedMessage);
    res.status(500).json({ error: 'Update failed' });
  }
});

router.delete('/:id', validators.deleteFile, async (req, res) => {
  try {
    const fileResult = await query('SELECT * FROM files WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (fileResult.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    const file = fileResult.rows[0];
    await b2Service.deleteFile(file.b2_account_id, file.b2_file_name, file.b2_file_id);
    await query('DELETE FROM files WHERE id = $1', [req.params.id]);
    
    // Decrement used_bytes after successful delete
    await b2Service.decrementUsedBytes(file.b2_account_id, file.size);
    
    res.json({ success: true });
  } catch (err) {
    const sanitizedMessage = sanitizeError(err);
    console.error(`[DELETE] Failed for file ${req.params.id}:`, sanitizedMessage);
    res.status(500).json({ error: 'Delete failed' });
  }
});

export default router;