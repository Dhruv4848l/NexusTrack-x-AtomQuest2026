/**
 * ======================================================================
 *  AtomQuest — Full Organization Seed Script
 * ======================================================================
 *
 *  This script:
 *    1. Wipes ALL records EXCEPT the admin (admin@atomberg.com),
 *       the DBA (dba@atomberg.com), and the three demo accounts.
 *    2. Creates a realistic Atomberg-style org with:
 *         - 2 Departments (Engineering, Product & Design)
 *         - 2 Managers (one per department)
 *         - 8 Employees (4 per manager)
 *    3. Creates an active FY 2026–27 Cycle
 *    4. Seeds Goal Sheets in various states:
 *         - 2 approved_locked, 2 submitted (pending approval),
 *           2 draft, 1 returned, 1 completed
 *    5. Seeds Goals under each sheet with realistic KPIs
 *    6. Seeds Q1 Achievements (check-ins) for approved/completed sheets
 *    7. Seeds a few Comments (return feedback, check-in notes)
 *    8. Seeds Audit Logs for key events
 *
 *  Run:  node scratch/seedOrganization.js
 * ======================================================================
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const Cycle = require('../models/Cycle');
const GoalSheet = require('../models/GoalSheet');
const Goal = require('../models/Goal');
const Achievement = require('../models/Achievement');
const Comment = require('../models/Comment');
const AuditLog = require('../models/AuditLog');
require('dotenv').config();

// ────────────────────────────────────────────────────────────
// All dummy users share this password: Atom@2026
// ────────────────────────────────────────────────────────────
const SHARED_PASSWORD = 'Atom@2026';

// Emails that are NEVER deleted
const PROTECTED_EMAILS = [
  'admin@atomberg.com',
  'dba@atomberg.com',
  'demo.employee@atomquest.app',
  'demo.manager@atomquest.app',
  'demo.admin@atomquest.app',
];

// ─── People ────────────────────────────────────────────────
const MANAGERS = [
  {
    first_name: 'Vikram',
    last_name: 'Desai',
    email: 'vikram.desai@atomberg.com',
    department: 'Engineering',
    employee_id: 'ENG-MGR-001',
    roles: ['manager'],
    phone_number: '+91 9876500001',
    dob: '1988-03-15',
  },
  {
    first_name: 'Ananya',
    last_name: 'Kapoor',
    email: 'ananya.kapoor@atomberg.com',
    department: 'Product & Design',
    employee_id: 'PD-MGR-001',
    roles: ['manager'],
    phone_number: '+91 9876500002',
    dob: '1990-07-22',
  },
];

const EMPLOYEES = [
  // ── Engineering (reports to Vikram) ──
  {
    first_name: 'Rahul',    last_name: 'Verma',
    email: 'rahul.verma@atomberg.com',
    department: 'Engineering', employee_id: 'ENG-101',
    phone_number: '+91 9876500101', dob: '1995-01-10',
    _managerIdx: 0,
  },
  {
    first_name: 'Sneha',    last_name: 'Patel',
    email: 'sneha.patel@atomberg.com',
    department: 'Engineering', employee_id: 'ENG-102',
    phone_number: '+91 9876500102', dob: '1996-05-18',
    _managerIdx: 0,
  },
  {
    first_name: 'Arjun',    last_name: 'Nair',
    email: 'arjun.nair@atomberg.com',
    department: 'Engineering', employee_id: 'ENG-103',
    phone_number: '+91 9876500103', dob: '1994-11-30',
    _managerIdx: 0,
  },
  {
    first_name: 'Priya',    last_name: 'Sharma',
    email: 'priya.sharma@atomberg.com',
    department: 'Engineering', employee_id: 'ENG-104',
    phone_number: '+91 9876500104', dob: '1997-08-25',
    _managerIdx: 0,
  },
  // ── Product & Design (reports to Ananya) ──
  {
    first_name: 'Karthik',  last_name: 'Iyer',
    email: 'karthik.iyer@atomberg.com',
    department: 'Product & Design', employee_id: 'PD-201',
    phone_number: '+91 9876500201', dob: '1993-02-14',
    _managerIdx: 1,
  },
  {
    first_name: 'Meera',    last_name: 'Joshi',
    email: 'meera.joshi@atomberg.com',
    department: 'Product & Design', employee_id: 'PD-202',
    phone_number: '+91 9876500202', dob: '1998-06-03',
    _managerIdx: 1,
  },
  {
    first_name: 'Aditya',   last_name: 'Reddy',
    email: 'aditya.reddy@atomberg.com',
    department: 'Product & Design', employee_id: 'PD-203',
    phone_number: '+91 9876500203', dob: '1995-12-20',
    _managerIdx: 1,
  },
  {
    first_name: 'Divya',    last_name: 'Menon',
    email: 'divya.menon@atomberg.com',
    department: 'Product & Design', employee_id: 'PD-204',
    phone_number: '+91 9876500204', dob: '1996-09-08',
    _managerIdx: 1,
  },
];

// ─── Goal templates ────────────────────────────────────────
const ENG_GOALS = [
  { thrust_area: 'Delivery',       title: 'Ship v2.0 firmware release',     uom_type: 'timeline',     target: null, target_date: '2026-09-30', weightage: 30, description: 'Complete firmware v2.0 with OTA update support and power optimization features.' },
  { thrust_area: 'Quality',        title: 'Reduce production defect rate',  uom_type: 'percent_min',  target: 95,   target_date: null,         weightage: 25, description: 'Achieve ≥ 95% pass rate on the first assembly-line quality check.' },
  { thrust_area: 'Innovation',     title: 'File 2 patent applications',     uom_type: 'numeric_min',  target: 2,    target_date: null,         weightage: 20, description: 'Submit patent applications for BLDC motor efficiency algorithm and smart sensor integration.' },
  { thrust_area: 'People',         title: 'Mentor 2 junior engineers',      uom_type: 'numeric_min',  target: 2,    target_date: null,         weightage: 15, description: 'Provide structured mentorship to at least 2 junior team members through code reviews and knowledge-sharing sessions.' },
  { thrust_area: 'Sustainability', title: 'Reduce lab energy consumption',  uom_type: 'percent_min',  target: 10,   target_date: null,         weightage: 10, description: 'Implement energy-saving protocols in the testing lab to reduce consumption by 10%.' },
];

const PD_GOALS = [
  { thrust_area: 'Delivery',       title: 'Launch redesigned mobile app',         uom_type: 'timeline',     target: null, target_date: '2026-08-15', weightage: 30, description: 'Ship the redesigned Atomberg mobile app with smart scheduling, device grouping, and usage analytics.' },
  { thrust_area: 'Quality',        title: 'Achieve NPS ≥ 70 for new app',         uom_type: 'numeric_min',  target: 70,   target_date: null,         weightage: 25, description: 'Run post-launch NPS survey and achieve a Net Promoter Score of at least 70.' },
  { thrust_area: 'Innovation',     title: 'Prototype voice-control integration',  uom_type: 'timeline',     target: null, target_date: '2026-10-31', weightage: 20, description: 'Build a working prototype for Alexa & Google Home voice control of all Atomberg appliances.' },
  { thrust_area: 'People',         title: 'Conduct 4 design workshops',           uom_type: 'numeric_min',  target: 4,    target_date: null,         weightage: 15, description: 'Organize and lead 4 internal design-thinking workshops for cross-functional teams.' },
  { thrust_area: 'Sustainability', title: 'Reduce packaging material by 15%',     uom_type: 'percent_min',  target: 15,   target_date: null,         weightage: 10, description: 'Redesign product packaging to reduce non-recyclable material by at least 15%.' },
];

// ─── Helpers ───────────────────────────────────────────────
const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6', '#f97316', '#84cc16'];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ────────────────────────────────────────────────────────────
async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // ── Step 1 — Clean up ───────────────────────────────────
    console.log('🗑  Deleting non-protected data…');

    // Delete non-protected users
    await User.deleteMany({ email: { $nin: PROTECTED_EMAILS } });

    // Wipe all transactional data
    await Cycle.deleteMany({});
    await GoalSheet.deleteMany({});
    await Goal.deleteMany({});
    await Achievement.deleteMany({});
    await Comment.deleteMany({});
    await AuditLog.deleteMany({});
    console.log('   Done.\n');

    // ── Step 2 — Update protected admin to new schema ───────
    const admin = await User.findOne({ email: 'admin@atomberg.com' });
    if (admin) {
      if (!admin.first_name) { admin.first_name = 'System'; admin.last_name = 'Admin'; }
      admin.is_first_login = false;
      await admin.save();
      console.log('✓ Admin account updated\n');
    }

    const dba = await User.findOne({ email: 'dba@atomberg.com' });
    if (dba) {
      dba.is_first_login = false;
      await dba.save();
    }

    // ── Step 3 — Create Managers ────────────────────────────
    console.log('👔 Creating managers…');
    const createdManagers = [];
    for (const m of MANAGERS) {
      const user = await User.create({
        ...m,
        password: SHARED_PASSWORD,
        avatar_color: pick(colors),
        is_first_login: false,
      });
      createdManagers.push(user);
      console.log(`   ✓ Manager: ${user.first_name} ${user.last_name} (${user.department})`);
    }

    // ── Step 4 — Create Employees ───────────────────────────
    console.log('\n👥 Creating employees…');
    const createdEmployees = [];
    for (const e of EMPLOYEES) {
      const mgr = createdManagers[e._managerIdx];
      const { _managerIdx, ...data } = e;
      const user = await User.create({
        ...data,
        password: SHARED_PASSWORD,
        roles: ['employee'],
        avatar_color: pick(colors),
        manager_id: mgr._id,
        is_first_login: false,
      });
      createdEmployees.push(user);
      console.log(`   ✓ ${user.first_name} ${user.last_name} → ${mgr.first_name} ${mgr.last_name}`);
    }

    // ── Step 5 — Create Cycle (FY 2026–27) ──────────────────
    console.log('\n📅 Creating goal cycle…');
    const cycle = await Cycle.create({
      name: 'FY 2026–27',
      is_active: true,
      phase1_open:  new Date('2026-04-01'),
      phase1_close: new Date('2026-05-31'),
      q1_open:      new Date('2026-04-01'),
      q1_close:     new Date('2026-06-30'),
      q2_open:      new Date('2026-07-01'),
      q2_close:     new Date('2026-09-30'),
      q3_open:      new Date('2026-10-01'),
      q3_close:     new Date('2026-12-31'),
      q4_open:      new Date('2027-01-01'),
      q4_close:     new Date('2027-03-31'),
    });
    console.log(`   ✓ Cycle: ${cycle.name}\n`);

    // ── Step 6 — Create Goal Sheets & Goals ─────────────────
    console.log('📋 Creating goal sheets, goals, and achievements…\n');

    // Sheet distribution plan:
    // Emp 0 (Rahul)   → approved_locked  (has Q1 check-ins)
    // Emp 1 (Sneha)   → approved_locked  (has Q1 check-ins, one goal completed)
    // Emp 2 (Arjun)   → submitted        (waiting for manager approval)
    // Emp 3 (Priya)   → returned         (manager sent feedback)
    // Emp 4 (Karthik) → approved_locked  (has Q1 check-ins, edit requested)
    // Emp 5 (Meera)   → submitted        (waiting for manager approval)
    // Emp 6 (Aditya)  → draft            (still editing)
    // Emp 7 (Divya)   → draft            (not started)

    const sheetConfigs = [
      { empIdx: 0, status: 'approved_locked', approvedBy: 0, hasCheckins: true,  editRequested: false },
      { empIdx: 1, status: 'approved_locked', approvedBy: 0, hasCheckins: true,  editRequested: false, completedGoal: 0 },
      { empIdx: 2, status: 'submitted',       approvedBy: null, hasCheckins: false, editRequested: false },
      { empIdx: 3, status: 'returned',        approvedBy: null, hasCheckins: false, editRequested: false },
      { empIdx: 4, status: 'approved_locked', approvedBy: 1, hasCheckins: true,  editRequested: true  },
      { empIdx: 5, status: 'submitted',       approvedBy: null, hasCheckins: false, editRequested: false },
      { empIdx: 6, status: 'draft',           approvedBy: null, hasCheckins: false, editRequested: false },
      { empIdx: 7, status: 'draft',           approvedBy: null, hasCheckins: false, editRequested: false },
    ];

    for (const cfg of sheetConfigs) {
      const emp = createdEmployees[cfg.empIdx];
      const isEng = emp.department === 'Engineering';
      const goalTemplates = isEng ? ENG_GOALS : PD_GOALS;
      const manager = createdManagers[isEng ? 0 : 1];

      // Create sheet
      const sheetData = {
        owner_id: emp._id,
        cycle_id: cycle._id,
        status: cfg.status,
        submitted_at: ['submitted', 'approved_locked', 'returned', 'completed'].includes(cfg.status) ? new Date('2026-05-10') : null,
        approved_at: cfg.status === 'approved_locked' ? new Date('2026-05-12') : null,
        approved_by: cfg.approvedBy !== null ? createdManagers[cfg.approvedBy]._id : null,
        is_edit_requested: cfg.editRequested || false,
        edit_request_reason: cfg.editRequested ? 'Target for patent applications needs revision based on updated R&D priorities.' : null,
      };
      const sheet = await GoalSheet.create(sheetData);

      // Create goals under this sheet
      const createdGoals = [];
      for (let i = 0; i < goalTemplates.length; i++) {
        const g = goalTemplates[i];
        const goal = await Goal.create({
          sheet_id: sheet._id,
          thrust_area: g.thrust_area,
          title: g.title,
          description: g.description,
          uom_type: g.uom_type,
          target: g.target,
          target_date: g.target_date ? new Date(g.target_date) : null,
          weightage: g.weightage,
          position: i,
        });
        createdGoals.push(goal);
      }

      // Create Q1 achievements for approved sheets
      if (cfg.hasCheckins) {
        for (let i = 0; i < createdGoals.length; i++) {
          const goal = createdGoals[i];
          const isCompleted = cfg.completedGoal === i;

          let achData = {
            goal_id: goal._id,
            quarter: 'Q1',
            status: isCompleted ? 'completed' : 'on_track',
            notes: null,
          };

          // Assign realistic actual values based on UOM
          if (goal.uom_type === 'timeline') {
            achData.actual_date = isCompleted ? new Date('2026-06-15') : null;
            achData.notes = isCompleted ? 'Delivered ahead of schedule.' : 'On track, beta testing in progress.';
          } else if (goal.uom_type.startsWith('numeric')) {
            achData.actual_value = isCompleted ? goal.target : Math.floor((goal.target || 2) * 0.4);
            achData.notes = isCompleted ? 'Target achieved in Q1 itself!' : `Progress: ${achData.actual_value}/${goal.target}`;
          } else if (goal.uom_type.startsWith('percent')) {
            achData.actual_value = isCompleted ? goal.target : Math.floor((goal.target || 10) * 0.5);
            achData.notes = isCompleted ? 'Metric exceeded expectations.' : `Currently at ${achData.actual_value}% against target of ${goal.target}%.`;
          }

          if (isCompleted) {
            achData.computed_score = 100;
          } else {
            achData.computed_score = Math.floor(Math.random() * 30 + 30); // 30–60 range for on_track
          }

          await Achievement.create(achData);
        }
      }

      // Create return comment for the "returned" sheet
      if (cfg.status === 'returned') {
        await Comment.create({
          type: 'return',
          manager_id: manager._id,
          sheet_id: sheet._id,
          comment: 'Please revise the weightages. The "Innovation" goal should carry at least 25% to align with our quarterly OKRs. Also, the target date for the firmware release seems too aggressive — consider extending it by 2 weeks.',
        });
      }

      // Audit log for submissions & approvals
      if (['submitted', 'approved_locked', 'returned', 'completed'].includes(cfg.status)) {
        await AuditLog.create({
          actor_id: emp._id,
          entity: 'goal_sheet',
          entity_id: sheet._id.toString(),
          action: 'submitted',
          details: { employee: `${emp.first_name} ${emp.last_name}` },
        });
      }
      if (cfg.status === 'approved_locked') {
        await AuditLog.create({
          actor_id: manager._id,
          entity: 'goal_sheet',
          entity_id: sheet._id.toString(),
          action: 'approved_locked',
          details: { approvedBy: `${manager.first_name} ${manager.last_name}` },
        });
      }
      if (cfg.status === 'returned') {
        await AuditLog.create({
          actor_id: manager._id,
          entity: 'goal_sheet',
          entity_id: sheet._id.toString(),
          action: 'returned',
          details: { reason: 'Weightage and timeline revisions needed.' },
        });
      }

      const statusEmoji = {
        draft: '📝', submitted: '📤', approved_locked: '✅', returned: '🔄', completed: '🏆',
      };
      console.log(`   ${statusEmoji[cfg.status]} ${emp.first_name} ${emp.last_name} — ${cfg.status}${cfg.editRequested ? ' (edit requested)' : ''}${cfg.hasCheckins ? ' + Q1 check-ins' : ''}`);
    }

    // ── Step 7 — Also create sheets for managers (their own goals) ──
    console.log('\n   Creating manager goal sheets…');
    for (let i = 0; i < createdManagers.length; i++) {
      const mgr = createdManagers[i];
      const otherMgr = createdManagers[1 - i]; // cross-approve
      const isEng = mgr.department === 'Engineering';

      const mgrGoals = isEng ? [
        { thrust_area: 'Delivery',   title: 'Ensure 100% on-time sprint delivery',          uom_type: 'percent_min', target: 95,  weightage: 30, description: 'Maintain sprint velocity and ensure all committed stories are delivered on time.' },
        { thrust_area: 'People',     title: 'Conduct bi-weekly 1-on-1s with all reports',    uom_type: 'numeric_min', target: 24,  weightage: 25, description: 'Regular check-ins to track career growth, blockers, and satisfaction.' },
        { thrust_area: 'Quality',    title: 'Achieve < 2% regression in release candidates', uom_type: 'percent_max', target: 2,   weightage: 25, description: 'Keep regression defects below 2% for all release candidates.' },
        { thrust_area: 'Innovation', title: 'Sponsor 1 hackathon project to production',     uom_type: 'numeric_min', target: 1,   weightage: 20, description: 'Identify and champion one hackathon idea into a production feature.' },
      ] : [
        { thrust_area: 'Delivery',   title: 'Ship app redesign on schedule',                 uom_type: 'timeline',    target: null, target_date: '2026-08-15', weightage: 30, description: 'Coordinate design, development, and QA to ship the app redesign by August 15.' },
        { thrust_area: 'People',     title: 'Grow design team from 4 to 6 members',          uom_type: 'numeric_min', target: 2,   weightage: 25, description: 'Recruit 2 senior designers with mobile experience.' },
        { thrust_area: 'Quality',    title: 'Establish design system v2 with 50+ components',uom_type: 'numeric_min', target: 50,  weightage: 25, description: 'Build and document a comprehensive design system for Atomberg digital products.' },
        { thrust_area: 'Innovation', title: 'Run 2 customer research sprints',                uom_type: 'numeric_min', target: 2,   weightage: 20, description: 'Conduct customer research sprints with usability testing and insight synthesis.' },
      ];

      const sheet = await GoalSheet.create({
        owner_id: mgr._id,
        cycle_id: cycle._id,
        status: 'approved_locked',
        submitted_at: new Date('2026-05-08'),
        approved_at: new Date('2026-05-11'),
        approved_by: admin ? admin._id : otherMgr._id,
      });

      for (let j = 0; j < mgrGoals.length; j++) {
        const g = mgrGoals[j];
        await Goal.create({
          sheet_id: sheet._id,
          thrust_area: g.thrust_area,
          title: g.title,
          description: g.description,
          uom_type: g.uom_type,
          target: g.target || null,
          target_date: g.target_date ? new Date(g.target_date) : null,
          weightage: g.weightage,
          position: j,
        });
      }
      console.log(`   ✅ ${mgr.first_name} ${mgr.last_name} — approved_locked (manager's own sheet)`);
    }

    // ── Summary ─────────────────────────────────────────────
    const userCount = await User.countDocuments();
    const sheetCount = await GoalSheet.countDocuments();
    const goalCount = await Goal.countDocuments();
    const achCount = await Achievement.countDocuments();

    console.log('\n' + '═'.repeat(58));
    console.log('  🎯 SEED COMPLETE');
    console.log('═'.repeat(58));
    console.log(`  Users:        ${userCount}`);
    console.log(`  Cycles:       1  (FY 2026–27)`);
    console.log(`  Goal Sheets:  ${sheetCount}`);
    console.log(`  Goals:        ${goalCount}`);
    console.log(`  Achievements: ${achCount}`);
    console.log('═'.repeat(58));
    console.log('\n  📌 All dummy accounts use password: Atom@2026');
    console.log('  📌 Protected accounts are untouched.\n');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();
