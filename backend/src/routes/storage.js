import { Router } from 'express';
import db from '../db/init.js';
import b2Service from '../services/b2.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// Simple in-memory cache for storage stats (30 seconds TTL)
let storageStatsCache = {
  data: null,
  timestamp: 0,
};
const CACHE_TTL = 30 * 1000; // 30 seconds

router.get('/stats', async (req, res) => {
  const now = Date.now();
  
  // Return cached data if still valid
  if (storageStatsCache.data && (now - storageStatsCache.timestamp) < CACHE_TTL) {
    return res.json(storageStatsCache.data);
  }
  
  try {
    const stats = await b2Service.getStorageStats();
    const totalUsed = stats.reduce((sum, s) => sum + s.used, 0);
    const totalMax = stats.reduce((sum, s) => sum + s.max, 0);
    const response = {
      total: { used: totalUsed, max: totalMax, free: totalMax - totalUsed, percentage: totalMax > 0 ? Math.round((totalUsed / totalMax) * 100) : 0 },
      accounts: stats,
    };
    
    // Cache the response
    storageStatsCache.data = response;
    storageStatsCache.timestamp = now;
    
    res.json(response);
  } catch (err) {
    console.error('Storage stats error:', err);
    res.status(500).json({ error: 'Failed to fetch storage stats' });
  }
});

export default router;