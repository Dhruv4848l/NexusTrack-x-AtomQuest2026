const express = require('express');
const router = express.Router();
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { protect, requireRole } = require('../middleware/auth');

const logAudit = (actorId, action, entityId, details = {}) =>
  AuditLog.create({ actor_id: actorId, entity: 'user', entity_id: entityId?.toString(), action, details });

// GET /api/users — list all users (admin + manager + dba)
router.get('/', protect, requireRole('admin', 'manager', 'database_admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password').populate('manager_id', 'first_name last_name email');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/:id — get single user
router.get('/:id', protect, requireRole('admin', 'manager', 'database_admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').populate('manager_id', 'first_name last_name email');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/users/:id — update profile (admin/dba only)
router.patch('/:id', protect, requireRole('admin', 'database_admin'), async (req, res) => {
  try {
    const { first_name, last_name, department, manager_id, avatar_color, employee_id, phone_number, dob } = req.body;
    const updates = {};
    if (first_name !== undefined) updates.first_name = first_name;
    if (last_name !== undefined) updates.last_name = last_name;
    if (department !== undefined) updates.department = department;
    if (manager_id !== undefined) updates.manager_id = manager_id || null;
    if (avatar_color !== undefined) updates.avatar_color = avatar_color;
    if (employee_id !== undefined) updates.employee_id = employee_id;
    if (phone_number !== undefined) updates.phone_number = phone_number;
    if (dob !== undefined) updates.dob = dob;

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    await logAudit(req.user._id, 'profile_updated', user._id, updates);
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/users/:id/roles — set roles (admin/dba only)
router.patch('/:id/roles', protect, requireRole('admin', 'database_admin'), async (req, res) => {
  try {
    const { roles } = req.body;
    if (!Array.isArray(roles)) return res.status(400).json({ message: 'roles must be an array' });
    const validRoles = ['employee', 'manager', 'admin', 'database_admin'];
    if (!roles.every((r) => validRoles.includes(r)))
      return res.status(400).json({ message: 'Invalid role value' });

    const user = await User.findByIdAndUpdate(req.params.id, { roles }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    await logAudit(req.user._id, 'roles_updated', user._id, { roles });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/team/my — get direct reports for logged-in manager
router.get('/team/my', protect, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const team = await User.find({ manager_id: req.user._id }).select('-password');
    res.json(team);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
