const express = require('express');
const router = express.Router();
const auditService = require('../services/auditService');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Get all audit logs (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const logs = await auditService.getAllLogs(limit);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

module.exports = router;
