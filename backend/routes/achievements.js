const express = require('express');
const router = express.Router();
const Achievement = require('../models/Achievement');
const Goal = require('../models/Goal');
const GoalSheet = require('../models/GoalSheet');
const Comment = require('../models/Comment');
const AuditLog = require('../models/AuditLog');
const { computeScore } = require('../utils/scoreEngine');
const { protect, requireRole } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.pdf' && ext !== '.docx') {
      return cb(new Error('Only .pdf and .docx are allowed'));
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

const logAudit = (actorId, action, entityId, details = {}) =>
  AuditLog.create({ actor_id: actorId, entity: 'achievement', entity_id: entityId?.toString(), action, details });

// GET /api/achievements?goalId=... — get achievements for a goal
router.get('/', protect, async (req, res) => {
  try {
    const { goalId } = req.query;
    if (!goalId) return res.status(400).json({ message: 'goalId query param required' });
    const achievements = await Achievement.find({ goal_id: goalId }).sort({ quarter: 1 });
    res.json(achievements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/achievements/sheet/:sheetId — get all achievements for all goals in a sheet
router.get('/sheet/:sheetId', protect, async (req, res) => {
  try {
    const goals = await Goal.find({ sheet_id: req.params.sheetId }).select('_id');
    const goalIds = goals.map((g) => g._id);
    const achievements = await Achievement.find({ goal_id: { $in: goalIds } });
    res.json(achievements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/achievements/upsert — employee logs actual for a quarter
router.post('/upsert', protect, async (req, res) => {
  try {
    const { goalId, quarter, actualValue, actualDate, status, notes } = req.body;
    if (!goalId || !quarter || !status)
      return res.status(400).json({ message: 'goalId, quarter, and status are required' });

    // Verify goal ownership and sheet status
    const goal = await Goal.findById(goalId).populate({ path: 'sheet_id', select: 'owner_id status cycle_id' });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    const sheet = goal.sheet_id;
    if (sheet.owner_id.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Forbidden — not your goal' });
    if (!['approved_locked', 'completed'].includes(sheet.status))
      return res.status(400).json({ message: 'Sheet must be approved before logging actuals' });

    // ── A2: Check-in window enforcement ──
    const Cycle = require('../models/Cycle');
    const cycle = await Cycle.findById(sheet.cycle_id);
    if (cycle) {
      const now = new Date();
      const windowMap = {
        Q1: { open: cycle.q1_open, close: cycle.q1_close },
        Q2: { open: cycle.q2_open, close: cycle.q2_close },
        Q3: { open: cycle.q3_open, close: cycle.q3_close },
        Q4: { open: cycle.q4_open, close: cycle.q4_close },
      };
      const window = windowMap[quarter];
      if (window) {
        const isAdmin = req.user.roles.includes('admin');
        if (!isAdmin && (now < new Date(window.open) || now > new Date(window.close))) {
          return res.status(400).json({
            message: `${quarter} check-in window is not active. Open: ${new Date(window.open).toLocaleDateString()} – ${new Date(window.close).toLocaleDateString()}`,
          });
        }
      }
    }

    const score = computeScore({
      uom: goal.uom_type,
      target: goal.target,
      targetDate: goal.target_date,
      actual: actualValue ?? null,
      actualDate: actualDate ?? null,
    });

    const achievement = await Achievement.findOneAndUpdate(
      { goal_id: goalId, quarter },
      {
        actual_value: actualValue ?? null,
        actual_date: actualDate ?? null,
        status,
        computed_score: score,
        notes: notes ?? null,
      },
      { upsert: true, new: true }
    );

    // ── A4: Shared goal achievement sync ──
    if (goal.shared_parent_id) {
      const siblingGoals = await Goal.find({
        shared_parent_id: goal.shared_parent_id,
        _id: { $ne: goal._id },
      });
      for (const sibling of siblingGoals) {
        const sibScore = computeScore({
          uom: sibling.uom_type,
          target: sibling.target,
          targetDate: sibling.target_date,
          actual: actualValue ?? null,
          actualDate: actualDate ?? null,
        });
        await Achievement.findOneAndUpdate(
          { goal_id: sibling._id, quarter },
          {
            actual_value: actualValue ?? null,
            actual_date: actualDate ?? null,
            status,
            computed_score: sibScore,
            notes: `Synced from shared goal owner`,
          },
          { upsert: true, new: true }
        );
      }
    }

    await logAudit(req.user._id, `actual_${quarter}`, goalId, { actual: actualValue, status, score });
    res.json({ achievement, score });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/achievements/comment — manager adds check-in comment
router.post('/comment', protect, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { goalId, quarter, comment } = req.body;
    if (!goalId || !quarter || !comment?.trim())
      return res.status(400).json({ message: 'goalId, quarter, and comment are required' });

    const newComment = await Comment.create({
      type: 'checkin',
      manager_id: req.user._id,
      goal_id: goalId,
      quarter,
      comment: comment.trim(),
    });
    res.status(201).json(newComment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/achievements/comments?goalId=...&quarter=... — get check-in comments
router.get('/comments', protect, async (req, res) => {
  try {
    const { goalId, quarter } = req.query;
    if (!goalId) return res.status(400).json({ message: 'goalId is required' });
    const filter = { type: 'checkin', goal_id: goalId };
    if (quarter) filter.quarter = quarter;
    const comments = await Comment.find(filter)
      .populate('manager_id', 'full_name')
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/achievements/:id/proof — upload proof
router.post('/:id/proof', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const ach = await Achievement.findById(req.params.id);
    if (!ach) return res.status(404).json({ message: 'Achievement entry not found' });
    
    ach.proof_url = `/uploads/${req.file.filename}`;
    ach.proof_name = req.file.originalname;
    await ach.save();
    
    await logAudit(req.user._id, 'proof_uploaded', ach.goal_id, { filename: req.file.originalname });
    res.json({ ok: true, achievement: ach });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
