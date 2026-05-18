const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const GoalSheet = require('../models/GoalSheet');
const Goal = require('../models/Goal');
const User = require('../models/User');
const Cycle = require('../models/Cycle');
const AuditLog = require('../models/AuditLog');
const Comment = require('../models/Comment');
const { protect, requireRole } = require('../middleware/auth');
const { sendNotification } = require('../utils/notificationService');

const logAudit = (actorId, action, entityId, details = {}) =>
  AuditLog.create({ actor_id: actorId, entity: 'goal_sheet', entity_id: entityId?.toString(), action, details });

// GET /api/sheets — get own sheets (or all for admin/manager)
router.get('/', protect, async (req, res) => {
  try {
    const isAdmin = req.user.roles.includes('admin');
    const isManager = req.user.roles.includes('manager');
    const isDBA = req.user.roles.includes('database_admin');

    let filter = {};
    if (isAdmin || isDBA) {
      filter = {}; // Admins see everything
    } else if (isManager) {
      // Managers see their own sheets + sheets of their team
      const team = await User.find({ manager_id: req.user._id }).select('_id');
      const teamIds = team.map((t) => t._id);
      filter = { $or: [{ owner_id: req.user._id }, { owner_id: { $in: teamIds } }] };
    } else {
      filter = { owner_id: req.user._id };
    }

    const sheets = await GoalSheet.find(filter)
      .populate('owner_id', 'first_name last_name email department manager_id')
      .populate('cycle_id', 'name is_active')
      .populate('approved_by', 'first_name last_name')
      .sort({ createdAt: -1 });
    res.json(sheets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/sheets/my?cycleId=... — get current user's sheet for a cycle
router.get('/my', protect, async (req, res) => {
  try {
    const { cycleId } = req.query;
    if (!cycleId) return res.status(400).json({ message: 'cycleId query param required' });
    const sheet = await GoalSheet.findOne({ owner_id: req.user._id, cycle_id: cycleId })
      .populate('cycle_id', 'name is_active phase1_open phase1_close q1_open q1_close q2_open q2_close q3_open q3_close q4_open q4_close')
      .populate('approved_by', 'first_name last_name');
    res.json(sheet || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/sheets/:id — get single sheet with goals
router.get('/:id', protect, async (req, res) => {
  try {
    const sheet = await GoalSheet.findById(req.params.id)
      .populate('owner_id', 'first_name last_name email department manager_id')
      .populate('cycle_id', 'name is_active phase1_open phase1_close q1_open q1_close q2_open q2_close q3_open q3_close q4_open q4_close')
      .populate('approved_by', 'first_name last_name');
    if (!sheet) return res.status(404).json({ message: 'Sheet not found' });
    // Only owner, manager, or admin can view
    const isOwner = sheet.owner_id._id.toString() === req.user._id.toString();
    const isPrivileged = req.user.roles.some((r) => ['admin', 'manager'].includes(r));
    if (!isOwner && !isPrivileged) return res.status(403).json({ message: 'Forbidden' });

    const goals = await Goal.find({ sheet_id: sheet._id }).sort({ position: 1 });
    res.json({ sheet, goals });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/sheets/save — save draft or submit
router.post('/save', protect, async (req, res) => {
  try {
    const { sheetId, cycleId, goals, submit } = req.body;
    if (!cycleId) return res.status(400).json({ message: 'cycleId is required' });

    // Find or create sheet
    let sheet = sheetId
      ? await GoalSheet.findById(sheetId)
      : await GoalSheet.findOne({ owner_id: req.user._id, cycle_id: cycleId });

    if (!sheet) {
      sheet = await GoalSheet.create({ owner_id: req.user._id, cycle_id: cycleId, status: 'draft' });
    }

    if (sheet.owner_id.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Forbidden' });
    if (sheet.status === 'approved_locked')
      return res.status(400).json({ message: 'Sheet is locked and cannot be edited' });

    // Validate on submit
    if (submit) {
      if (!goals || goals.length === 0 || goals.length > 8)
        return res.status(400).json({ message: 'Goal count must be between 1 and 8' });
      const total = goals.reduce((s, g) => s + Number(g.weightage || 0), 0);
      if (Math.abs(total - 100) > 0.01)
        return res.status(400).json({ message: `Total weightage must be 100% (currently ${total}%)` });
      if (goals.some((g) => Number(g.weightage) < 10))
        return res.status(400).json({ message: 'Each goal must be at least 10%' });
      if (goals.some((g) => !g.title?.trim()))
        return res.status(400).json({ message: 'Every goal must have a title' });
    }

    // Delete old goals and re-insert
    await Goal.deleteMany({ sheet_id: sheet._id });
    if (goals && goals.length > 0) {
      const rows = goals.map((g, i) => ({
        sheet_id: sheet._id,
        thrust_area: g.thrust_area,
        title: g.title,
        description: g.description ?? null,
        uom_type: g.uom_type,
        target: g.target ?? null,
        target_date: g.target_date ?? null,
        weightage: g.weightage,
        position: i,
        shared_parent_id: g.shared_parent_id ?? null,
      }));
      await Goal.insertMany(rows);
    }

    if (submit) {
      sheet.status = 'submitted';
      sheet.submitted_at = new Date();
      await sheet.save();
      await logAudit(req.user._id, 'submitted', sheet._id, { goalCount: goals.length });

      // Trigger Email Notification to Manager
      if (req.user.manager_id) {
        try {
          const manager = await User.findById(req.user.manager_id);
          const cycle = await Cycle.findById(cycleId);
          if (manager) {
            const subject = `🎯 Action Required: Goal Sheet Submitted by ${req.user.first_name} ${req.user.last_name}`;
            const html = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #333; border-bottom: 2px solid #ff6b00; padding-bottom: 10px;">Goal Sheet Submitted</h2>
                <p>Hello <strong>${manager.first_name} ${manager.last_name}</strong>,</p>
                <p>Your team member <strong>${req.user.first_name} ${req.user.last_name}</strong> has submitted their goal sheet for the cycle <strong>${cycle ? cycle.name : 'Active Cycle'}</strong>.</p>
                <p>Please review and approve their goals in the AtomQuest portal.</p>
                <div style="margin: 30px 0; text-align: center;">
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}/goals/review" style="background-color: #ff6b00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Review Goal Sheet</a>
                </div>
                <p style="font-size: 12px; color: #777; border-top: 1px solid #eaeaea; padding-top: 15px; margin-top: 30px;">This is a system generated notification. Please do not reply to this email.</p>
              </div>
            `;
            await sendNotification(manager, subject, html);
          }
        } catch (err) {
          console.error('[Email Notification Error]', err.message);
        }
      }
    } else {
      await logAudit(req.user._id, 'draft_saved', sheet._id, { goalCount: goals?.length ?? 0 });
    }

    res.json({ sheetId: sheet._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/sheets/:id/approve — manager/admin approves
router.post('/:id/approve', protect, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const sheet = await GoalSheet.findByIdAndUpdate(
      req.params.id,
      { status: 'approved_locked', approved_at: new Date(), approved_by: req.user._id },
      { new: true }
    );
    if (!sheet) return res.status(404).json({ message: 'Sheet not found' });
    await logAudit(req.user._id, 'approved_locked', sheet._id, {});

    // Trigger Email Notification to Employee
    try {
      const employee = await User.findById(sheet.owner_id);
      const cycle = await Cycle.findById(sheet.cycle_id);
      if (employee) {
        const subject = `🎉 Your Goal Sheet Has Been Approved!`;
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #2e7d32; border-bottom: 2px solid #2e7d32; padding-bottom: 10px;">Goal Sheet Approved</h2>
            <p>Hello <strong>${employee.first_name} ${employee.last_name}</strong>,</p>
            <p>Your goal sheet for <strong>${cycle ? cycle.name : 'Active Cycle'}</strong> has been approved by your manager <strong>${req.user.first_name} ${req.user.last_name}</strong> and is now locked.</p>
            <p>You can now check in and update your quarterly achievements for this cycle.</p>
            <div style="margin: 30px 0; text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}/goals" style="background-color: #2e7d32; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Approved Goals</a>
            </div>
            <p style="font-size: 12px; color: #777; border-top: 1px solid #eaeaea; padding-top: 15px; margin-top: 30px;">This is a system generated notification. Please do not reply to this email.</p>
          </div>
        `;
        await sendNotification(employee, subject, html);
      }
    } catch (err) {
      console.error('[Email Notification Error]', err.message);
    }

    res.json({ ok: true, sheet });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/sheets/:id/approve-with-edits — manager edits goals inline then locks
router.post('/:id/approve-with-edits', protect, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const sheet = await GoalSheet.findById(req.params.id);
    if (!sheet) return res.status(404).json({ message: 'Sheet not found' });
    if (sheet.status !== 'submitted')
      return res.status(400).json({ message: 'Only submitted sheets can be approved with edits' });

    const { edits } = req.body; // Array of { goalId, target?, target_date?, weightage? }
    if (!edits || !Array.isArray(edits))
      return res.status(400).json({ message: 'edits array is required' });

    // Apply each edit
    for (const e of edits) {
      const update = {};
      if (e.target !== undefined) update.target = e.target;
      if (e.target_date !== undefined) update.target_date = e.target_date;
      if (e.weightage !== undefined) update.weightage = e.weightage;
      if (Object.keys(update).length > 0) {
        await Goal.findByIdAndUpdate(e.goalId, update);
      }
    }

    // Validate totals after edits
    const goals = await Goal.find({ sheet_id: sheet._id });
    const total = goals.reduce((s, g) => s + Number(g.weightage), 0);
    if (Math.abs(total - 100) > 0.01)
      return res.status(400).json({ message: `Total weightage must be 100% after edits (currently ${total}%)` });
    if (goals.some(g => Number(g.weightage) < 10))
      return res.status(400).json({ message: 'Each goal must be at least 10%' });

    // Lock the sheet
    sheet.status = 'approved_locked';
    sheet.approved_at = new Date();
    sheet.approved_by = req.user._id;
    await sheet.save();

    await logAudit(req.user._id, 'approved_with_edits', sheet._id, { editCount: edits.length });

    // Trigger Email Notification to Employee
    try {
      const employee = await User.findById(sheet.owner_id);
      const cycle = await Cycle.findById(sheet.cycle_id);
      if (employee) {
        const subject = `📝 Your Goal Sheet Has Been Approved (With Edits)`;
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #ff6b00; border-bottom: 2px solid #ff6b00; padding-bottom: 10px;">Goal Sheet Approved with Edits</h2>
            <p>Hello <strong>${employee.first_name} ${employee.last_name}</strong>,</p>
            <p>Your manager <strong>${req.user.first_name} ${req.user.last_name}</strong> has approved and locked your goal sheet for <strong>${cycle ? cycle.name : 'Active Cycle'}</strong> after making some inline adjustments to targets/weightages.</p>
            <p>Please review the updated goals in the AtomQuest portal.</p>
            <div style="margin: 30px 0; text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}/goals" style="background-color: #ff6b00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Review Approved Goals</a>
            </div>
            <p style="font-size: 12px; color: #777; border-top: 1px solid #eaeaea; padding-top: 15px; margin-top: 30px;">This is a system generated notification. Please do not reply to this email.</p>
          </div>
        `;
        await sendNotification(employee, subject, html);
      }
    } catch (err) {
      console.error('[Email Notification Error]', err.message);
    }

    res.json({ ok: true, sheet });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/sheets/:id/return — manager/admin returns with comment
router.post('/:id/return', protect, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { comment } = req.body;
    if (!comment || comment.trim().length < 20)
      return res.status(400).json({ message: 'Return comment must be at least 20 characters' });

    const sheet = await GoalSheet.findByIdAndUpdate(req.params.id, { status: 'returned' }, { new: true });
    if (!sheet) return res.status(404).json({ message: 'Sheet not found' });

    await Comment.create({ type: 'return', manager_id: req.user._id, sheet_id: sheet._id, comment: comment.trim() });
    await logAudit(req.user._id, 'returned', sheet._id, { comment: comment.trim().slice(0, 80) });

    // Trigger Email Notification to Employee
    try {
      const employee = await User.findById(sheet.owner_id);
      const cycle = await Cycle.findById(sheet.cycle_id);
      if (employee) {
        const subject = `⚠️ Action Required: Goal Sheet Returned for Rework`;
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #d32f2f; border-bottom: 2px solid #d32f2f; padding-bottom: 10px;">Goal Sheet Returned</h2>
            <p>Hello <strong>${employee.first_name} ${employee.last_name}</strong>,</p>
            <p>Your goal sheet for <strong>${cycle ? cycle.name : 'Active Cycle'}</strong> has been returned for rework by your manager <strong>${req.user.first_name} ${req.user.last_name}</strong>.</p>
            <div style="background-color: #ffebee; border-left: 4px solid #d32f2f; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <strong>Manager Comments:</strong><br/>
              <p style="margin-top: 5px; font-style: italic; color: #c62828;">"${comment}"</p>
            </div>
            <p>Please make the required changes and resubmit your goals as soon as possible.</p>
            <div style="margin: 30px 0; text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}/goals" style="background-color: #d32f2f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Edit & Resubmit Sheet</a>
            </div>
            <p style="font-size: 12px; color: #777; border-top: 1px solid #eaeaea; padding-top: 15px; margin-top: 30px;">This is a system generated notification. Please do not reply to this email.</p>
          </div>
        `;
        await sendNotification(employee, subject, html);
      }
    } catch (err) {
      console.error('[Email Notification Error]', err.message);
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/sheets/:id/unlock — admin only
router.post('/:id/unlock', protect, requireRole('admin'), async (req, res) => {
  try {
    const sheet = await GoalSheet.findByIdAndUpdate(req.params.id, { status: 'draft' }, { new: true });
    if (!sheet) return res.status(404).json({ message: 'Sheet not found' });
    await logAudit(req.user._id, 'admin_unlocked', sheet._id, {});
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/sheets/:id/comments — get return comments
router.get('/:id/comments', protect, async (req, res) => {
  try {
    const comments = await Comment.find({ type: 'return', sheet_id: req.params.id })
      .populate('manager_id', 'first_name last_name')
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/sheets/:id/request-edit — employee requests edit
router.patch('/:id/request-edit', protect, async (req, res) => {
  try {
    const { reason } = req.body;
    const sheet = await GoalSheet.findById(req.params.id);
    if (!sheet) return res.status(404).json({ message: 'Sheet not found' });
    if (sheet.owner_id.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Only owner can request edit' });
    
    sheet.is_edit_requested = true;
    sheet.edit_request_reason = reason || 'No reason provided';
    await sheet.save();
    
    await logAudit(req.user._id, 'edit_requested', sheet._id, { reason });

    // Trigger Email Notification to Manager
    if (req.user.manager_id) {
      try {
        const manager = await User.findById(req.user.manager_id);
        const cycle = await Cycle.findById(sheet.cycle_id);
        if (manager) {
          const subject = `⚠️ Edit Access Requested: ${req.user.first_name} ${req.user.last_name}`;
          const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
              <h2 style="color: #e65100; border-bottom: 2px solid #e65100; padding-bottom: 10px;">Edit Request Received</h2>
              <p>Hello <strong>${manager.first_name} ${manager.last_name}</strong>,</p>
              <p>Your team member <strong>${req.user.first_name} ${req.user.last_name}</strong> has requested permission to edit their approved goal sheet for the cycle <strong>${cycle ? cycle.name : 'Active Cycle'}</strong>.</p>
              <div style="background-color: #fff3e0; border-left: 4px solid #ffb74d; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <strong>Reason Provided:</strong><br/>
                <p style="margin-top: 5px; font-style: italic; color: #e65100;">"${reason}"</p>
              </div>
              <p>Please approve or deny this request in the AtomQuest portal.</p>
              <div style="margin: 30px 0; text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}/goals/review" style="background-color: #e65100; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Review Edit Request</a>
              </div>
              <p style="font-size: 12px; color: #777; border-top: 1px solid #eaeaea; padding-top: 15px; margin-top: 30px;">This is a system generated notification. Please do not reply to this email.</p>
            </div>
          `;
          await sendNotification(manager, subject, html);
        }
      } catch (err) {
        console.error('[Email Notification Error]', err.message);
      }
    }

    res.json({ ok: true, sheet });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/sheets/:id/approve-edit — manager/admin approves edit request
router.post('/:id/approve-edit', protect, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const sheet = await GoalSheet.findById(req.params.id);
    if (!sheet) return res.status(404).json({ message: 'Sheet not found' });
    
    sheet.status = 'returned'; // Move back to returned so they can edit
    sheet.is_edit_requested = false;
    await sheet.save();
    
    await logAudit(req.user._id, 'edit_request_approved', sheet._id, {});

    // Trigger Email Notification to Employee
    try {
      const employee = await User.findById(sheet.owner_id);
      const cycle = await Cycle.findById(sheet.cycle_id);
      if (employee) {
        const subject = `🔓 Your Goal Sheet Has Been Unlocked for Editing`;
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #0288d1; border-bottom: 2px solid #0288d1; padding-bottom: 10px;">Goal Sheet Unlocked</h2>
            <p>Hello <strong>${employee.first_name} ${employee.last_name}</strong>,</p>
            <p>Your manager <strong>${req.user.first_name} ${req.user.last_name}</strong> has approved your request to edit your goal sheet for <strong>${cycle ? cycle.name : 'Active Cycle'}</strong>.</p>
            <p>The sheet is now unlocked and in rework status. You can update your targets and resubmit them for review.</p>
            <div style="margin: 30px 0; text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}/goals" style="background-color: #0288d1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Edit Goal Sheet Now</a>
            </div>
            <p style="font-size: 12px; color: #777; border-top: 1px solid #eaeaea; padding-top: 15px; margin-top: 30px;">This is a system generated notification. Please do not reply to this email.</p>
          </div>
        `;
        await sendNotification(employee, subject, html);
      }
    } catch (err) {
      console.error('[Email Notification Error]', err.message);
    }

    res.json({ ok: true, sheet });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/sheets/:id/reject-edit — manager/admin rejects edit request (must provide reason)
router.post('/:id/reject-edit', protect, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason || reason.trim().length < 10)
      return res.status(400).json({ message: 'A valid reason (at least 10 characters) is required to reject an edit request' });

    const sheet = await GoalSheet.findById(req.params.id);
    if (!sheet) return res.status(404).json({ message: 'Sheet not found' });

    sheet.is_edit_requested = false;
    sheet.edit_request_reason = null;
    await sheet.save();

    await logAudit(req.user._id, 'edit_request_rejected', sheet._id, { reason });

    // Trigger Email Notification to Employee
    try {
      const employee = await User.findById(sheet.owner_id);
      const cycle = await Cycle.findById(sheet.cycle_id);
      if (employee) {
        const subject = `❌ Edit Request Rejected by ${req.user.first_name} ${req.user.last_name}`;
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #d32f2f; border-bottom: 2px solid #d32f2f; padding-bottom: 10px;">Edit Request Rejected</h2>
            <p>Hello <strong>${employee.first_name} ${employee.last_name}</strong>,</p>
            <p>Your request to edit your goal sheet for <strong>${cycle ? cycle.name : 'Active Cycle'}</strong> has been <strong>rejected</strong> by your manager <strong>${req.user.first_name} ${req.user.last_name}</strong>.</p>
            <div style="background-color: #ffebee; border-left: 4px solid #d32f2f; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <strong>Reason for Rejection:</strong><br/>
              <p style="margin-top: 5px; font-style: italic; color: #c62828;">"${reason.trim()}"</p>
            </div>
            <p>Your goal sheet remains locked. If you have further concerns, please reach out to your manager directly.</p>
            <p style="font-size: 12px; color: #777; border-top: 1px solid #eaeaea; padding-top: 15px; margin-top: 30px;">This is a system generated notification. Please do not reply to this email.</p>
          </div>
        `;
        await sendNotification(employee, subject, html);
      }
    } catch (err) {
      console.error('[Email Notification Error]', err.message);
    }

    res.json({ ok: true, sheet });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
