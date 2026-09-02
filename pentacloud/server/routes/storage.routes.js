// Storage routes
import { Router } from 'express';
import { getStorageStats, refreshStorageStats } from '../controllers/storageController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/stats', getStorageStats);
router.post('/stats/refresh', refreshStorageStats);

export default router;