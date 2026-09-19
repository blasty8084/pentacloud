import { Router } from 'express';
import db from '../db/init.js';
import b2Service from '../services/b2.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/stats', async (req, res) => {
  try {
    const stats = await b2Service.getStorageStats();
    const totalUsed = stats.reduce((sum, s) => sum + s.used, 0);
    const totalMax = stats.reduce((sum, s) => sum + s.max, 0);
    res.json({
      total: { used: totalUsed, max: totalMax, free: totalMax - totalUsed, percentage: totalMax > 0 ? Math.round((totalUsed / totalMax) * 100) : 0 },
      accounts: stats,
    });
  } catch (err) {
    console.error('Storage stats error:', err);
    res.json({
      total: { used: 0, max: 0, free: 0, percentage: 0 },
      accounts: []
    });
  }
});

export default router;