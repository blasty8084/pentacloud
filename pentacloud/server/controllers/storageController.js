// Storage controller - handles storage stats and dashboard
const { routerService } = require('../services/routerService');

function getStorageStats(req, res) {
  try {
    const stats = routerService.getTotalStats();
    res.json(stats);
  } catch (err) {
    console.error('Storage stats error:', err);
    res.status(500).json({ error: 'Failed to get storage stats' });
  }
}

function refreshStorageStats(req, res) {
  try {
    routerService.updateUsageStats().then(() => {
      const stats = routerService.getTotalStats();
      res.json(stats);
    });
  } catch (err) {
    console.error('Refresh storage stats error:', err);
    res.status(500).json({ error: 'Failed to refresh storage stats' });
  }
}

module.exports = { getStorageStats, refreshStorageStats };