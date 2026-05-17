<div align="center">

<img src="https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/bf236d89-c41c-44ed-9e95-41b0b5dfdf46/id-preview-0ed6c756--bc9695a4-99d7-4e19-89cc-8ce38441da02.lovable.app-1778893575352.png" alt="AtomQuest GoalPortal" width="100%" style="border-radius:12px" />

# AtomQuest GoalPortal

**In-house Goal Setting & Tracking Portal — Built for Atomberg's AtomQuest Hackathon 1.0**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/atlas)
[![TanStack](https://img.shields.io/badge/TanStack-Router%20%2B%20Query-FF4154?style=flat-square)](https://tanstack.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

</div>

---

## 📖 Overview

AtomQuest GoalPortal is a **production-grade, full-stack MERN web application** that replaces spreadsheets, email chains, and offline review cycles for Atomberg's internal performance management workflow. The portal enables employees to draft quarterly goal sheets with weighted thrust areas, managers to review and lock them, and admins to maintain org-wide governance — all in a single, real-time platform.

> **Hackathon Context:** Built for the Atomberg in-house hackathon challenge to digitize the goal-setting and quarterly check-in process across all departments.

---

## ✨ Features

### 👤 Employee
- Draft goal sheets with up to **8 goals** per cycle, validated to sum to **exactly 100% weightage**
- Each goal must hold **≥ 10%** weightage and belong to a defined thrust area (Sales, Tech, Operations, etc.)
- Submit for manager review; receive **email notifications** on approval/return
- Update quarterly actuals (Q1–Q4) with auto-computed UoM-based progress scores
- Request post-lock edits with justification; tracked via audit log
- **First-login password change** enforcement

### 👔 Manager
- Review submitted goal sheets from direct reports
- **Approve**, **return with comments** (min 20 chars), or **approve with inline edits** to targets/weightages
- Approve edit requests from locked sheets
- View team completion dashboard and quarterly check-in status
- Receives email notification on goal sheet submission and edit requests

### 🛡️ Admin
- Org-wide completion dashboard — see every employee's sheet status
- Manage quarterly **Cycle windows** (Phase 1 lock dates, Q1–Q4 check-in windows)
- Force-unlock any sheet (admin override)
- **User directory** — assign/revoke `employee` and `manager` roles
- **Shared goals** management (cascade goals across teams)
- Immutable **audit log** — every approval, return, lock, and edit is recorded

### 🗄️ Database Admin
- Separate role with access to the user directory only
- Read-only org view for IT/ops compliance

---

## 🏗️ Architecture

```
AtomQuest GoalPortal
├── frontend/           ← TanStack Start + React 19 + Tailwind CSS v4
│   ├── src/routes/     ← File-based routing (login, dashboard, goals, checkins, reports, admin/*)
│   ├── src/components/ ← AppShell, NeuCard, StatusPill, ProgressBar, PageHeader
│   ├── src/lib/        ← Axios API client, JWT auth context, scoring engine
│   └── src/styles.css  ← Neumorphic design system with CSS custom properties
│
└── backend/            ← Express.js + MongoDB Atlas
    ├── routes/         ← auth, users, cycles, sheets, goals, achievements, audit
    ├── models/         ← User, GoalSheet, Goal, Achievement, Cycle, AuditLog, Comment
    ├── middleware/      ← JWT protect, requireRole RBAC
    └── utils/          ← Notification service (Resend API / mock fallback)
```

### Data Flow

```
Browser (React) ──[JWT Bearer]──▶ Express API ──▶ MongoDB Atlas
                                       │
                                       └──▶ Resend API (Email Notifications)
                                                  ↕ [Azure — planned]
```

---

## 🛠️ Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend Framework | TanStack Start (SSR-capable React) | 1.167.x |
| UI Rendering | React | 19.x |
| Routing | TanStack Router (file-based) | 1.168.x |
| State / Data Fetching | TanStack Query | 5.x |
| Styling | Tailwind CSS v4 + custom neumorphic theme | 4.2.x |
| Animations | Framer Motion | 12.x |
| Charts | Recharts | 2.x |
| Form Handling | React Hook Form + Zod | 7.x / 3.x |
| Icons | Lucide React | 0.575.x |
| Backend | Express.js | 4.x |
| Database | MongoDB Atlas (Mongoose ODM) | 8.x |
| Auth | JSON Web Tokens (bcryptjs) | 9.x |
| Email | Resend API (mock fallback if no key) | — |
| Build Tool | Vite | 7.x |
| Package Manager | npm | — |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- A **MongoDB Atlas** cluster (free tier is sufficient)
- *(Optional)* A **Resend** API key for email notifications

---

### 1. Clone the Repository

```bash
git clone https://github.com/<your-org>/atomquest-goalportal.git
cd atomquest-goalportal
```

---

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/atomquest?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development

# Optional — email notifications (leave blank to use console mock)
RESEND_API_KEY=re_xxxxxxxxxxxxxx
FRONTEND_URL=http://localhost:8080
```

Install dependencies and start the backend:

```bash
npm install
npm run dev       # development (nodemon)
# or
npm start         # production
```

The API will be available at **`http://localhost:5000`**  
Health check: `GET http://localhost:5000/api/health`

---

### 3. Frontend Setup

From the project root:

```bash
# (in the project root, not backend/)
npm install
npm run dev
```

The frontend will be available at **`http://localhost:8080`**

---

### 4. First Run — Create an Admin Account

Use the **demo persona** buttons on the login page, or register manually via the API:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Riya",
    "last_name": "Mehta",
    "email": "admin@atomquest.app",
    "password": "Atom!2026",
    "roles": ["employee", "manager", "admin"]
  }'
```

> **Password policy:** Minimum 8 characters, at least one uppercase, one lowercase, one number, one special character.

---

## 🔌 API Reference

All endpoints are prefixed with `/api`. Protected routes require `Authorization: Bearer <token>`.

### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/register` | Public | Register a new user |
| `POST` | `/login` | Public | Login; returns JWT + user |
| `GET` | `/me` | 🔒 | Get current user profile |
| `PATCH` | `/me` | 🔒 | Update profile (dept, avatar, phone, DOB) |
| `POST` | `/change-password` | 🔒 | Change password (first-login enforcement) |
| `POST` | `/forgot-password/request` | Public | Send OTP to email/phone |
| `POST` | `/forgot-password/verify` | Public | Verify OTP and reset password |

### Users — `/api/users`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/` | 🔒 Admin | List all users |
| `GET` | `/my-team` | 🔒 Manager | List direct reports |
| `PATCH` | `/:id/roles` | 🔒 Admin | Set roles for a user |

### Cycles — `/api/cycles`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/active` | 🔒 | Get the currently active cycle |
| `GET` | `/` | 🔒 Admin | List all cycles |
| `POST` | `/` | 🔒 Admin | Create a new cycle |
| `PATCH` | `/:id` | 🔒 Admin | Update cycle dates/windows |

### Goal Sheets — `/api/sheets`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/` | 🔒 | List sheets (scoped by role) |
| `GET` | `/my?cycleId=` | 🔒 | Get own sheet for a cycle |
| `GET` | `/:id` | 🔒 | Get sheet + goals |
| `POST` | `/save` | 🔒 | Save draft or submit sheet |
| `POST` | `/:id/approve` | 🔒 Mgr/Admin | Approve and lock sheet |
| `POST` | `/:id/approve-with-edits` | 🔒 Mgr/Admin | Approve with inline goal edits |
| `POST` | `/:id/return` | 🔒 Mgr/Admin | Return sheet with mandatory comment |
| `POST` | `/:id/unlock` | 🔒 Admin | Admin force-unlock any sheet |
| `PATCH` | `/:id/request-edit` | 🔒 | Employee requests edit on locked sheet |
| `POST` | `/:id/approve-edit` | 🔒 Mgr/Admin | Approve employee's edit request |
| `GET` | `/:id/comments` | 🔒 | Get return comments for a sheet |

### Achievements / Check-ins — `/api/achievements`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/sheet/:sheetId` | 🔒 | Get all achievements for a sheet |
| `POST` | `/upsert` | 🔒 | Save/update quarterly actuals (auto-scores via UoM engine) |

### Audit — `/api/audit`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/` | 🔒 Admin | Get immutable audit trail |

---

## 🧮 Scoring Engine

Progress is auto-computed using the **Unit of Measurement (UoM)** formula:

| UoM Type | Formula |
|---|---|
| `percentage` | `(actual / target) × 100` |
| `number` | `(actual / target) × 100` |
| `currency` | `(actual / target) × 100` |
| `boolean` | `actual == true ? 100 : 0` |
| `rating` | `(actual / 5) × 100` |

**Composite weighted score:**
```
composite = Σ (goal_weightage × goal_score) / 100
```

Scores are clamped to `[0, 120]` to allow stretch-goal overachievement up to 20%.

---

## 📧 Email Notifications

Notifications are sent via the **Resend API** at the following lifecycle events:

| Event | Recipients |
|---|---|
| Goal sheet submitted | Manager |
| Goal sheet approved | Employee |
| Goal sheet approved with edits | Employee |
| Goal sheet returned for rework | Employee |
| Edit request submitted | Manager |
| Edit request approved (sheet unlocked) | Employee |

> If `RESEND_API_KEY` is not set, all emails are **mocked to the server console** — no emails are lost, the app continues to function normally in development.

---

## ☁️ Azure Integration (Planned — Pre-Go-Live)

The following Azure services are architected into the codebase and will be activated before production deployment:

| Service | Purpose | Status |
|---|---|---|
| **Azure App Service** | Backend (Express.js) hosting | 🔧 Ready to connect |
| **Azure Static Web Apps** | Frontend (React/Vite) hosting | 🔧 Ready to connect |
| **Azure Cosmos DB for MongoDB** | Production database (MongoDB-compatible wire protocol) | 🔧 Swap `MONGODB_URI` |
| **Azure Communication Services** | Email delivery (replace Resend) | 🔧 Hook in `notificationService.js` |
| **Azure Key Vault** | Secrets management (`JWT_SECRET`, API keys) | 🔧 Replace `.env` references |
| **Azure Monitor / App Insights** | Logging, error tracking, performance | 🔧 Add SDK |

To switch to Azure Cosmos DB, simply update `MONGODB_URI` in the backend `.env` — Mongoose is fully compatible with the MongoDB wire protocol.

---

## 🔐 Security

- **JWT Authentication** — tokens signed with `HS256`, 7-day expiry
- **Role-Based Access Control (RBAC)** — `requireRole()` middleware enforces `employee | manager | admin | database_admin` on all sensitive routes
- **Role Isolation** — login enforces that the requested role exists on the user's account
- **Password Policy** — bcryptjs hashing with salt rounds; complexity validated server-side
- **First-Login Enforcement** — new users are forced to change their password before accessing the portal
- **Audit Trail** — every sheet state change is immutably logged with actor, action, and timestamp

---

## 📁 Project Structure

```
AtomBerg Hackathon/
├── backend/
│   ├── config/
│   │   └── db.js                    # MongoDB Atlas connection
│   ├── middleware/
│   │   └── auth.js                  # JWT protect + requireRole
│   ├── models/
│   │   ├── User.js
│   │   ├── GoalSheet.js
│   │   ├── Goal.js
│   │   ├── Achievement.js
│   │   ├── Cycle.js
│   │   ├── AuditLog.js
│   │   └── Comment.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── cycles.js
│   │   ├── sheets.js                # Core workflow (submit/approve/return/lock)
│   │   ├── goals.js
│   │   ├── achievements.js          # Quarterly check-ins + UoM scoring
│   │   └── audit.js
│   ├── utils/
│   │   ├── notificationService.js   # Resend API / console mock
│   │   └── validation.js
│   ├── server.js
│   ├── .env.example
│   └── package.json
│
├── src/
│   ├── routes/
│   │   ├── __root.tsx               # Root layout + auth provider
│   │   ├── index.tsx                # Public landing page
│   │   ├── login.tsx                # Split-pane login + typewriter animation
│   │   ├── first-login.tsx          # Password change gate
│   │   └── _app/
│   │       ├── dashboard.tsx        # Stats + Recharts + goal list
│   │       ├── goals.tsx            # Goal sheet editor
│   │       ├── goals_.review.tsx    # Manager approval queue
│   │       ├── checkins.tsx         # Quarterly check-ins (employee)
│   │       ├── checkins_.team.tsx   # Team check-ins (manager)
│   │       ├── reports.tsx          # Analytics + CSV export
│   │       ├── profile.tsx          # User profile
│   │       └── admin/
│   │           ├── completion.tsx   # Org-wide completion dashboard
│   │           ├── users.tsx        # User directory + role management
│   │           ├── cycles.tsx       # Cycle management
│   │           ├── audit.tsx        # Audit log viewer
│   │           └── shared-goals.tsx # Shared goals management
│   ├── components/
│   │   └── app/
│   │       ├── AppShell.tsx         # Sidebar navigation + mobile drawer
│   │       ├── ui.tsx               # NeuCard, Stat, StatusPill, ProgressBar
│   │       └── EmptyState.tsx
│   ├── lib/
│   │   ├── api.ts                   # Axios client → localhost:5000
│   │   ├── auth-context.tsx         # JWT auth context (localStorage)
│   │   └── scoring.ts              # Frontend UoM score computation
│   └── styles.css                   # Neumorphic design system (CSS vars)
│
├── vite.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 🚢 Deploying to GitHub (Pre-Production)

### Step 1 — Prepare `.gitignore`

Ensure the following are excluded:

```gitignore
# Dependencies
node_modules/
backend/node_modules/

# Environment files (NEVER commit secrets)
.env
backend/.env

# Build artifacts
dist/
.tanstack/
.wrangler/

# Lovable scaffold (safe to exclude)
.lovable/
```

### Step 2 — Initialize & Push

```bash
git init
git add .
git commit -m "feat: initial AtomQuest GoalPortal — Atomberg Hackathon 1.0"
git branch -M main
git remote add origin https://github.com/<your-org>/atomquest-goalportal.git
git push -u origin main
```

### Step 3 — Before Going Live

- [ ] Set all `backend/.env` secrets in your hosting provider (Azure App Service → Configuration)
- [ ] Set `MONGODB_URI` to your Atlas production cluster (or Azure Cosmos DB)
- [ ] Set `RESEND_API_KEY` with a verified sender domain
- [ ] Set `FRONTEND_URL` to the production domain (for email CTA links)
- [ ] Set `NODE_ENV=production` on the backend
- [ ] Update CORS origins in `backend/server.js` to the production frontend URL
- [ ] Run `npm run build` for the frontend and serve the `dist/` folder

---

## 🤝 Contributing

This project was built as part of **Atomberg's AtomQuest Hackathon 1.0**. For internal contributions:

1. Branch from `main` using `feature/<your-feature>` or `fix/<issue>`
2. Keep PRs focused — one feature or fix per PR
3. Ensure backend API changes are reflected in `src/lib/api.ts`
4. Test all three roles (employee, manager, admin) before submitting

---

## 📄 License

MIT © 2026 Atomberg GoalPortal Team

---

<div align="center">
  <sub>Built with ❤️ for Atomberg · AtomQuest Hackathon 1.0</sub>
</div>
