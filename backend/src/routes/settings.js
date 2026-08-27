const { Router } = require('express');
const db = require('../db/init.js').default;
const b2Service = require('../services/b2.js');
const { authMiddleware } = require('../middleware/auth.js');
const { v4: uuidv4 } = require('uuid');
const B2 = require('backblaze-b2');

const router = Router();
router.use(authMiddleware);

router.get('/b2-accounts', (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  const accounts = db.prepare('SELECT id, name, bucket_name, bucket_region, max_size_gb, created_at FROM b2_accounts').all();
  res.json(accounts);
});

router.post('/b2-accounts', async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  const { name, keyId, applicationKey, bucketId, bucketName, bucketRegion, maxSizeGb } = req.body;
  if (!name || !keyId || !applicationKey || !bucketId || !bucketName) {
    return res.status(400).json({ error: 'All B2 credentials required' });
  }

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

router.delete('/b2-accounts/:id', (req, res) => {
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

module.exports = router;