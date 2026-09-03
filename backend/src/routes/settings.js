import { Router } from 'express';
import db from '../db/init.js';
import b2Service from '../services/b2.js';
import { authMiddleware } from '../middleware/auth.js';
import validators from '../middleware/validate.js';
import { v4 as uuidv4 } from 'uuid';
import B2 from 'backblaze-b2';

const router = Router();
router.use(authMiddleware);

router.get('/b2-accounts', (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  const accounts = db.prepare('SELECT id, name, bucket_name, bucket_region, max_size_gb, created_at FROM b2_accounts').all();
  res.json(accounts);
});

router.post('/b2-accounts', validators.addB2Account, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  const { name, keyId, applicationKey, bucketId, bucketName, bucketRegion, maxSizeGb } = req.body;

  const id = uuidv4();
  db.prepare(
    `INSERT INTO b2_accounts (id, name, key_id, application_key, bucket_id, bucket_name, bucket_region, max_size_gb)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, name, keyId, applicationKey, bucketId, bucketName, bucketRegion || '', maxSizeGb || 10);

  const b2 = new B2({ applicationKeyId: keyId, applicationKey });
  await b2.authorize();
  b2Service.clients.set(id, { b2, account: { id, name, key_id: keyId, application_key: applicationKey, bucket_id: bucketId, bucket_name: bucketName, max_size_gb: maxSizeGb || 10 } });
  b2Service.accounts.push(b2Service.clients.get(id).account);

  const account = db.prepare('SELECT id, name, bucket_name, bucket_region, max_size_gb, created_at FROM b2_accounts WHERE id = ?').get(id);
  res.status(201).json(account);
});

router.delete('/b2-accounts/:id', validators.deleteB2Account, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  const account = db.prepare('SELECT * FROM b2_accounts WHERE id = ?').get(req.params.id);
  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }

  const fileCount = db.prepare('SELECT COUNT(*) as count FROM files WHERE b2_account_id = ?').get(req.params.id);
  if (fileCount.count > 0) {
    return res.status(400).json({ error: 'Cannot delete account with stored files' });
  }

  b2Service.clients.delete(req.params.id);
  b2Service.accounts = b2Service.accounts.filter(a => a.id !== req.params.id);
  db.prepare('DELETE FROM b2_accounts WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;