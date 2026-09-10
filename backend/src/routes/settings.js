import { Router } from 'express';
import { query } from '../db/index.js';
import b2Service from '../services/b2.js';
import { authMiddleware } from '../middleware/auth.js';
import validators from '../middleware/validate.js';
import { v4 as uuidv4 } from 'uuid';
import B2 from 'backblaze-b2';

const router = Router();
router.use(authMiddleware);

router.get('/b2-accounts', async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  const accountsResult = await query('SELECT id, name, bucket_name, bucket_endpoint, max_size_gb, created_at FROM b2_accounts');
  res.json(accountsResult.rows);
});

router.post('/b2-accounts', validators.addB2Account, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  const { name, keyId, appKey, bucketName, bucketEndpoint, maxSizeGb } = req.body;

  const id = uuidv4();
  await query(
    `INSERT INTO b2_accounts (id, name, key_id, app_key, bucket_name, bucket_endpoint, max_size_gb)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, name, keyId, appKey, bucketName, bucketEndpoint, maxSizeGb || 10]
  );

  const b2 = new B2({ applicationKeyId: keyId, applicationKey: appKey });
  const authResponse = await b2.authorize();
  const bucketId = authResponse.data.allowed?.bucketId;
  
  b2Service.clients.set(id, { b2, account: { id, name, key_id: keyId, app_key: appKey, bucket_name: bucketName, bucket_endpoint: bucketEndpoint, bucket_id: bucketId, max_size_gb: maxSizeGb || 10 } });
  b2Service.accounts.push(b2Service.clients.get(id).account);

  const accountResult = await query('SELECT id, name, bucket_name, bucket_endpoint, max_size_gb, created_at FROM b2_accounts WHERE id = $1', [id]);
  res.status(201).json(accountResult.rows[0]);
});

router.delete('/b2-accounts/:id', validators.deleteB2Account, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  const accountResult = await query('SELECT * FROM b2_accounts WHERE id = $1', [req.params.id]);
  if (accountResult.rows.length === 0) {
    return res.status(404).json({ error: 'Account not found' });
  }

  const fileCountResult = await query('SELECT COUNT(*) as count FROM files WHERE b2_account_id = $1', [req.params.id]);
  if (parseInt(fileCountResult.rows[0].count) > 0) {
    return res.status(400).json({ error: 'Cannot delete account with stored files' });
  }

  b2Service.clients.delete(req.params.id);
  b2Service.accounts = b2Service.accounts.filter(a => a.id !== req.params.id);
  await query('DELETE FROM b2_accounts WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

export default router;