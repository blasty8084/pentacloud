// Storage routes
const { Router } = require('express');
const { getStorageStats, refreshStorageStats } = require('../controllers/storageController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = Router();

router.use(authMiddleware);

router.get('/stats', getStorageStats);
router.post('/stats/refresh', refreshStorageStats);

module.exports = router;