const { Router } = require('express');
const multer = require('multer');
const db = require('../db/init.js').default;
const b2Service = require('../services/b2.js');
const { authMiddleware } = require('../middleware/auth.js');
const validators = require('../middleware/validate.js');
const { v4: uuidv4 } = require('uuid');

const router = Router();

const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf',
  'text/plain', 'text/csv', 'text/markdown', 'text/html', 'text/css', 'text/javascript',
  'application/json',
  'application/zip', 'application/x-zip-compressed',
  'application/x-rar-compressed',
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

router.get('/', validators.listFiles, (req, res) => {
  const { folderId, search } = req.query;
  let query = 'SELECT * FROM files WHERE user_id = ?';
  const params = [req.user.id];

  if (folderId) {
    query += ' AND folder_id = ?';
    params.push(folderId);
  } else {
    query += ' AND folder_id IS NULL';
  }

  if (search) {
    query += ' AND name LIKE ?';
    params.push(`%${search}%`);
  }

  query += ' ORDER BY created_at DESC';
  const files = db.prepare(query).all(...params);
  res.json(files);
});

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { folderId } = req.body;
    if (folderId) {
      const folder = db.prepare('SELECT id FROM folders WHERE id = ? AND user_id = ?').get(folderId, req.user.id);
      if (!folder) {
        return res.status(404).json({ error: 'Folder not found' });
      }
    }

    const account = b2Service.getAccountWithMostSpace();
    if (!account) {
      return res.status(507).json({ error: 'No B2 accounts configured or all full' });
    }

    const usedResult = db.prepare('SELECT COALESCE(SUM(size), 0) as used FROM files WHERE b2_account_id = ?').get(account.id);
    const used = usedResult.used || 0;
    const maxBytes = account.max_size_gb * 1024 * 1024 * 1024;
    if (used + req.file.size > maxBytes) {
      return res.status(507).json({ error: 'Selected B2 account has insufficient space' });
    }

    const sanitizedName = sanitizeFileName(req.file.originalname);
    const { b2FileId, b2FileName } = await b2Service.uploadFile(
      account.id,
      sanitizedName,
      req.file.buffer,
      req.file.mimetype
    );

    const fileId = uuidv4();
    db.prepare(
      `INSERT INTO files (id, name, original_name, mime_type, size, folder_id, user_id, b2_account_id, b2_file_id, b2_file_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(fileId, sanitizedName, sanitizedName, req.file.mimetype, req.file.size, folderId || null, req.user.id, account.id, b2FileId, b2FileName);

    const file = db.prepare('SELECT * FROM files WHERE id = ?').get(fileId);
    res.status(201).json(file);
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
    const file = db.prepare('SELECT * FROM files WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

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

router.patch('/:id', validators.updateFile, (req, res) => {
  const file = db.prepare('SELECT * FROM files WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!file) {
    return res.status(404).json({ error: 'File not found' });
  }

  const { name, folderId } = req.body;
  const updates = [];
  const params = [];

  if (name !== undefined) {
    const sanitizedName = sanitizeFileName(name);
    updates.push('name = ?');
    params.push(sanitizedName);
  }
  if (folderId !== undefined) {
    if (folderId) {
      const folder = db.prepare('SELECT id FROM folders WHERE id = ? AND user_id = ?').get(folderId, req.user.id);
      if (!folder) {
        return res.status(404).json({ error: 'Target folder not found' });
      }
    }
    updates.push('folder_id = ?');
    params.push(folderId || null);
  }
  if (updates.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  updates.push('updated_at = ?');
  params.push(Date.now());
  params.push(req.params.id);

  db.prepare(`UPDATE files SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  const updated = db.prepare('SELECT * FROM files WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.delete('/:id', validators.deleteFile, async (req, res) => {
  try {
    const file = db.prepare('SELECT * FROM files WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    await b2Service.deleteFile(file.b2_account_id, file.b2_file_name, file.b2_file_id);
    db.prepare('DELETE FROM files WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;