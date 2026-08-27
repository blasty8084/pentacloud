const { Router } = require('express');
const db = require('../db/init.js').default;
const b2Service = require('../services/b2.js');
const { authMiddleware } = require('../middleware/auth.js');

const router = Router();
router.use(authMiddleware);

router.get('/stats', (req, res) => {
  const stats = b2Service.getStorageStats();
  const totalUsed = stats.reduce((sum, s) => sum + s.used, 0);
  const totalMax = stats.reduce((sum, s) => sum + s.max, 0);
  res.json({
    total: { used: totalUsed, max: totalMax, free: totalMax - totalUsed, percentage: totalMax > 0 ? Math.round((totalUsed / totalMax) * 100) : 0 },
    accounts: stats,
  });
});

module.exports = router;