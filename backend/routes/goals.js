const express = require('express');
const router = express.Router();
const Goal = require('../models/Goal');
const GoalSheet = require('../models/GoalSheet');
const AuditLog = require('../models/AuditLog');
const { protect, requireRole } = require('../middleware/auth');

const logAudit = (actorId, action, entityId, details = {}) =>
  AuditLog.create({ actor_id: actorId, entity: 'goal', entity_id: entityId?.toString(), action, details });

// GET /api/goals?sheetId=... — get goals for a sheet
router.get('/', protect, async (req, res) => {
  try {
    const { sheetId } = req.query;
    if (!sheetId) return res.status(400).json({ message: 'sheetId query param required' });
    const goals = await Goal.find({ sheet_id: sheetId }).sort({ position: 1 });
    res.json(goals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/goals/push-shared — push shared goal to multiple employees (admin/manager)
router.post('/push-shared', protect, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { cycleId, ownerIds, thrust_area, title, description, uom_type, target, target_date, defaultWeightage } = req.body;
    if (!cycleId || !ownerIds?.length) return res.status(400).json({ message: 'cycleId and ownerIds required' });

    let pushed = 0;
    for (const ownerId of ownerIds) {
      // Find or create draft sheet for the employee
      let sheet = await GoalSheet.findOne({ owner_id: ownerId, cycle_id: cycleId });
      if (!sheet) {
        sheet = await GoalSheet.create({ owner_id: ownerId, cycle_id: cycleId, status: 'draft' });
      }
      if (sheet.status === 'approved_locked') continue;

      const count = await Goal.countDocuments({ sheet_id: sheet._id });
      if (count >= 8) continue;

      const newGoal = await Goal.create({
        sheet_id: sheet._id,
        thrust_area,
        title,
        description: description ?? null,
        uom_type,
        target: target ?? null,
        target_date: target_date ?? null,
        weightage: defaultWeightage || 10,
        position: count,
      });

      // Mark as shared goal — link back to itself as parent (manager can set actual parent_id later)
      // For now store the first created goal id as shared_parent_id for subsequent pushes
      if (pushed === 0) {
        await Goal.findByIdAndUpdate(newGoal._id, { shared_parent_id: newGoal._id });
      }
      pushed++;
    }

    await logAudit(req.user._id, 'shared_goal_pushed', null, { count: pushed, title });
    res.json({ pushed });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
