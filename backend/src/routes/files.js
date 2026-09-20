import { Router } from 'express';
import multer from 'multer';
import { query } from '../db/index.js';
import b2Service from '../services/b2.js';
import { authMiddleware } from '../middleware/auth.js';
import validators from '../middleware/validate.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024;
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

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!validateFileType(file.mimetype)) {
      return cb(new Error(`File type ${file.mimetype} not allowed`), false);
    }
    cb(null, true);
  },
});

router.use(authMiddleware);

router.get('/', validators.listFiles, async (req, res) => {
  const { folderId, search } = req.query;
  let queryText = 'SELECT * FROM files WHERE user_id = $1';
  const params = [req.user.id];

  if (folderId) {
    queryText += ' AND folder_id = $2';
    params.push(folderId);
  } else {
    queryText += ' AND folder_id IS NULL';
  }

  if (search) {
    const paramIndex = params.length + 1;
    queryText += ` AND name LIKE $${paramIndex}`;
    params.push(`%${search}%`);
  }

  queryText += ' ORDER BY created_at DESC';
  const result = await query(queryText, params);
  res.json(result.rows);
});

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { folderId } = req.body;
    if (folderId) {
      const folder = await query('SELECT id FROM folders WHERE id = $1 AND user_id = $2', [folderId, req.user.id]);
      if (folder.rows.length === 0) {
        return res.status(404).json({ error: 'Folder not found' });
      }
    }

    // Atomically reserve space and get the selected account
    const account = await b2Service.reserveSpaceAndGetAccount(req.file.size);
    if (!account) {
      return res.status(507).json({ error: 'No B2 accounts configured or all full' });
    }

    const sanitizedName = sanitizeFileName(req.file.originalname);
    
    try {
      const { b2FileId, b2FileName } = await b2Service.uploadFile(
        account.id,
        sanitizedName,
        req.file.buffer,
        req.file.mimetype
      );

      const fileId = uuidv4();
      await query(
        `INSERT INTO files (id, name, original_name, mime_type, size, folder_id, user_id, b2_account_id, b2_file_id, b2_file_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [fileId, sanitizedName, sanitizedName, req.file.mimetype, req.file.size, folderId || null, req.user.id, account.id, b2FileId, b2FileName]
      );

      // Space was already reserved atomically, no need to increment again
      const fileResult = await query('SELECT * FROM files WHERE id = $1', [fileId]);
      res.status(201).json(fileResult.rows[0]);
    } catch (uploadErr) {
      // B2 upload failed - rollback the reserved space
      console.error('Upload to B2 failed, rolling back reserved space:', uploadErr);
      await b2Service.rollbackReservedSpace(account.id, req.file.size);
      throw uploadErr;
    }
  } catch (err) {
    if (err.message?.includes('not allowed')) {
      return res.status(400).json({ error: err.message });
    }
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

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
    console.error('Download error:', err);
    res.status(500).json({ error: 'Download failed' });
  }
});

router.patch('/:id', validators.updateFile, async (req, res) => {
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
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Delete failed' });
  }
});

export default router;