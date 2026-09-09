import { Router } from 'express';
import { query } from '../db/index.js';
import b2Service from '../services/b2.js';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';
import validators from '../middleware/validate.js';

const router = Router();

router.post('/', authMiddleware, validators.createShare, async (req, res) => {
  const { fileId, expiresInHours } = req.body;

  const fileResult = await query('SELECT * FROM files WHERE id = $1 AND user_id = $2', [fileId, req.user.id]);
  if (fileResult.rows.length === 0) {
    return res.status(404).json({ error: 'File not found' });
  }

  const token = uuidv4();
  const expiresAt = expiresInHours ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000) : null;

  await query('INSERT INTO shares (id, file_id, token, expires_at) VALUES ($1, $2, $3, $4)', [uuidv4(), fileId, token, expiresAt]);

  const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/share/${token}`;
  res.json({ token, shareUrl, expiresAt });
});

router.get('/:token', optionalAuthMiddleware, validators.downloadShare, async (req, res) => {
  try {
    const shareResult = await query('SELECT * FROM shares WHERE token = $1', [req.params.token]);
    if (shareResult.rows.length === 0) {
      return res.status(404).json({ error: 'Share not found' });
    }

    const share = shareResult.rows[0];
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return res.status(410).json({ error: 'Share link expired' });
    }

    const fileResult = await query('SELECT * FROM files WHERE id = $1', [share.file_id]);
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
    console.error('Share download error:', err);
    res.status(500).json({ error: 'Download failed' });
  }
});

router.delete('/:token', authMiddleware, validators.downloadShare, async (req, res) => {
  const shareResult = await query('SELECT * FROM shares WHERE token = $1', [req.params.token]);
  if (shareResult.rows.length === 0) {
    return res.status(404).json({ error: 'Share not found' });
  }

  const share = shareResult.rows[0];
  const fileResult = await query('SELECT * FROM files WHERE id = $1 AND user_id = $2', [share.file_id, req.user.id]);
  if (fileResult.rows.length === 0 && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized' });
  }

  await query('DELETE FROM shares WHERE token = $1', [req.params.token]);
  res.json({ success: true });
});

export default router;