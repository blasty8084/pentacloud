// Storage controller - handles storage stats and dashboard
import { routerService } from '../services/routerService.js';

export function getStorageStats(req, res) {
  try {
    const stats = routerService.getTotalStats();
    res.json(stats);
  } catch (err) {
    console.error('Storage stats error:', err);
    res.status(500).json({ error: 'Failed to get storage stats' });
  }
}

export async function refreshStorageStats(req, res) {
  try {
    await routerService.updateUsageStats();
    const stats = routerService.getTotalStats();
    res.json(stats);
  } catch (err) {
    console.error('Refresh storage stats error:', err);
    res.status(500).json({ error: 'Failed to refresh storage stats' });
  }
}