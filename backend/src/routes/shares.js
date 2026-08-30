const { Router } = require('express');
const db = require('../db/init.js').default;
const b2Service = require('../services/b2.js');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth.js');
const validators = require('../middleware/validate.js');

const router = Router();

router.post('/', authMiddleware, validators.createShare, (req, res) => {
  const { fileId, expiresInHours } = req.body;

  const file = db.prepare('SELECT * FROM files WHERE id = ? AND user_id = ?').get(fileId, req.user.id);
  if (!file) {
    return res.status(404).json({ error: 'File not found' });
  }

  const token = uuidv4();
  const expiresAt = expiresInHours ? Date.now() + expiresInHours * 60 * 60 * 1000 : null;

  db.prepare('INSERT INTO shares (id, file_id, token, expires_at) VALUES (?, ?, ?, ?)')
    .run(uuidv4(), fileId, token, expiresAt);

  const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/share/${token}`;
  res.json({ token, shareUrl, expiresAt });
});

router.get('/:token', optionalAuthMiddleware, validators.downloadShare, async (req, res) => {
  try {
    const share = db.prepare('SELECT * FROM shares WHERE token = ?').get(req.params.token);
    if (!share) {
      return res.status(404).json({ error: 'Share not found' });
    }

    if (share.expiresAt && share.expiresAt < Date.now()) {
      return res.status(410).json({ error: 'Share link expired' });
    }

    const file = db.prepare('SELECT * FROM files WHERE id = ?').get(share.file_id);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const stream = await b2Service.downloadFile(file.b2_account_id, file.b2_file_name);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.original_name)}"`);
    res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
    res.setHeader('Content-Length', file.size);
    stream.pipe(res);
  } catch (err) {
    console.error('Share download error:', err);
    res.status(500).json({ error: 'Download failed' });
  }
});

router.delete('/:token', authMiddleware, validators.downloadShare, (req, res) => {
  const share = db.prepare('SELECT * FROM shares WHERE token = ?').get(req.params.token);
  if (!share) {
    return res.status(404).json({ error: 'Share not found' });
  }

  const file = db.prepare('SELECT * FROM files WHERE id = ? AND user_id = ?').get(share.file_id, req.user.id);
  if (!file && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized' });
  }

  db.prepare('DELETE FROM shares WHERE token = ?').run(req.params.token);
  res.json({ success: true });
});

module.exports = router;