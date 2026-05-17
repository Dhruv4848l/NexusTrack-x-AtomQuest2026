const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const { protect, requireRole } = require('../middleware/auth');

// GET /api/audit — get audit log (admin only)
router.get('/', protect, requireRole('admin'), async (req, res) => {
  try {
    const { entity, limit = 100, skip = 0 } = req.query;
    const filter = entity ? { entity } : {};
    const logs = await AuditLog.find(filter)
      .populate('actor_id', 'full_name email')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(Number(skip));
    const total = await AuditLog.countDocuments(filter);
    res.json({ logs, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
