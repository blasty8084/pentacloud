import { Router } from 'express';
import db from '../db/init.js';
import b2Service from '../services/b2.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/stats', async (req, res) => {
  try {
    const result = await b2Service.getStorageStats();
    res.json(result);
  } catch (err) {
    console.error('Storage stats error:', err);
    res.status(500).json({ error: 'Failed to fetch storage stats' });
  }
});

export default router;