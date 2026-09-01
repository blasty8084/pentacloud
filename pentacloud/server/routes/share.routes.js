// Share routes
const { Router } = require('express');
const { body, param, validationResult } = require('express-validator');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/authMiddleware');

const router = Router();

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

const { db, statements } = require('../db/db');
const { routerService } = require('../services/routerService');
const { v4: uuidv4 } = require('uuid');

router.post('/', authMiddleware, [
  body('fileId').isUUID().withMessage('Valid file ID required'),
  body('expiresInHours').optional().isInt({ min: 1, max: 8760 }).withMessage('Expiry must be 1-8760 hours'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { fileId, expiresInHours } = req.body;

  const file = statements.getFileForDownload.get(fileId, req.user.id);
  if (!file) {
    return res.status(404).json({ error: 'File not found' });
  }

  const token = uuidv4();
  const expiresAt = expiresInHours ? Date.now() + expiresInHours * 60 * 60 * 1000 : null;

  statements.createShare.run(uuidv4(), fileId, token, expiresAt);

  const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/share/${token}`;
  res.json({ token, shareUrl, expiresAt });
});

router.get('/:token', optionalAuthMiddleware, [
  param('token').isString().trim().isLength({ min: 1 }).withMessage('Token required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const share = statements.getShareByToken.get(req.params.token);
    if (!share) {
      return res.status(404).json({ error: 'Share not found' });
    }

    if (share.expiresAt && share.expiresAt < Date.now()) {
      return res.status(410).json({ error: 'Share link expired' });
    }

    const file = statements.getFileById.get(share.file_id);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const stream = await routerService.downloadFile(file.b2_account_index, file.b2_file_name);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.original_name)}"`);
    res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
    res.setHeader('Content-Length', file.size);
    stream.pipe(res);
  } catch (err) {
    console.error('Share download error:', err);
    res.status(500).json({ error: 'Download failed' });
  }
});

router.delete('/:token', authMiddleware, [
  param('token').isString().trim().isLength({ min: 1 }).withMessage('Token required'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const share = statements.getShareByToken.get(req.params.token);
  if (!share) {
    return res.status(404).json({ error: 'Share not found' });
  }

  const file = statements.getFileForDownload.get(share.file_id, req.user.id);
  if (!file && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized' });
  }

  statements.deleteShare.run(req.params.token);
  res.json({ success: true });
});

module.exports = router;