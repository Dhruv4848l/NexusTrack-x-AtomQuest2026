const express = require('express');
const router = express.Router();
const Cycle = require('../models/Cycle');
const AuditLog = require('../models/AuditLog');
const { protect, requireRole } = require('../middleware/auth');

const logAudit = (actorId, action, entityId, details = {}) =>
  AuditLog.create({ actor_id: actorId, entity: 'cycle', entity_id: entityId?.toString(), action, details });

// GET /api/cycles — list all cycles
router.get('/', protect, async (req, res) => {
  try {
    const cycles = await Cycle.find().sort({ createdAt: -1 });
    res.json(cycles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/cycles/active — get the currently active cycle
router.get('/active', protect, async (req, res) => {
  try {
    const cycle = await Cycle.findOne({ is_active: true });
    res.json(cycle || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/cycles — create new cycle (admin only)
router.post('/', protect, requireRole('admin'), async (req, res) => {
  try {
    const cycle = await Cycle.create({ ...req.body });
    await logAudit(req.user._id, 'created', cycle._id, { name: cycle.name });
    res.status(201).json(cycle);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH /api/cycles/:id — update cycle (admin only)
router.patch('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const cycle = await Cycle.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!cycle) return res.status(404).json({ message: 'Cycle not found' });
    await logAudit(req.user._id, 'updated', cycle._id, req.body);
    res.json(cycle);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH /api/cycles/:id/activate — set active (admin only)
router.patch('/:id/activate', protect, requireRole('admin'), async (req, res) => {
  try {
    const { active } = req.body;
    if (active) {
      // Deactivate all others first
      await Cycle.updateMany({ _id: { $ne: req.params.id } }, { is_active: false });
    }
    const cycle = await Cycle.findByIdAndUpdate(req.params.id, { is_active: active }, { new: true });
    if (!cycle) return res.status(404).json({ message: 'Cycle not found' });
    await logAudit(req.user._id, active ? 'activated' : 'closed', cycle._id, {});
    res.json(cycle);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
