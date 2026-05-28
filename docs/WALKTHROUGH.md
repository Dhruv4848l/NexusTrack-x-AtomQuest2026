# AtomQuest GoalPortal — Complete Application Walkthrough

> **Project:** AtomQuest GoalPortal (Atomberg Hackathon 2026)  
> **Stack:** React + TanStack Router (Vite) · Node.js/Express · MongoDB Atlas  
> **Date:** May 19, 2026

This document demonstrates the full end-to-end workflow of the AtomQuest GoalPortal — from account creation by a Database Admin to goal lifecycle management, quarterly check-ins, reporting, and profile management.

---

## Table of Contents

1. [DBA Admin Login](#1-dba-admin-login)
2. [Creating a New Employee Account](#2-creating-a-new-employee-account)
3. [Assigning a Manager to the Employee](#3-assigning-a-manager)
4. [Employee First-Time Login & Password Change](#4-employee-first-login--password-change)
5. [Employee Dashboard Overview](#5-employee-dashboard)
6. [Creating Goals & Submitting for Approval](#6-creating-goals--submitting-for-approval)
7. [Manager Reviews & Approves Goals](#7-manager-reviews--approves-goals)
8. [Employee Quarterly Check-ins (Progress Updates)](#8-employee-quarterly-check-ins)
9. [Employee Profile: Image Upload & Personal Email](#9-employee-profile-image-upload--personal-email)
10. [Manager Reports & CSV Export](#10-manager-reports--csv-export)

---

## 1. DBA Admin Login

The **Database Admin (DBA)** is a privileged role responsible for managing the organization's user accounts, roles, and system configuration.

### Step 1.1 — Login Page

The login page features a split-pane design with Atomberg branding on the left (including a dynamic typewriter animation) and the authentication form on the right. A **role selector pill** in the top-right corner allows users to specify their login role.

![Login Page](https://res.cloudinary.com/df8zddj1n/image/upload/v1779142896/atomquest_walkthrough/login_page_clean.png)

### Step 1.2 — DBA Credentials & Role Selection

The DBA selects **"Database Admin"** from the role dropdown and enters credentials:
- **Email:** `dba@atomberg.com`
- **Password:** `DbaPassword123!`

![DBA Login Filled](https://res.cloudinary.com/df8zddj1n/image/upload/v1779142898/atomquest_walkthrough/login_page_filled.png)

### Step 1.3 — DBA Dashboard (People Management)

After login, the DBA is redirected to the **People Management** page — the primary workspace for database administrators. This page displays all users in the organization with columns for Employee name, Department & ID, Assigned Manager, System Roles, and Actions.

![DBA Dashboard](https://res.cloudinary.com/df8zddj1n/image/upload/v1779142900/atomquest_walkthrough/dashboard_page.png)

---

## 2. Creating a New Employee Account

### Step 2.1 — Add User Modal (Empty)

Clicking the **"+ Add User"** button opens a modal form with fields for First Name, Last Name, Email Address, Initial Password, Department, and Employee ID.

![Empty Add User Form](https://res.cloudinary.com/df8zddj1n/image/upload/v1779142901/atomquest_walkthrough/empty_add_user_form.png)

### Step 2.2 — Filled User Form

The DBA fills in the new employee details:

| Field | Value |
|-------|-------|
| First Name | Neha |
| Last Name | Gupta |
| Email | neha.gupta@atomberg.com |
| Initial Password | Welcome@2026 |
| Department | Engineering |
| Employee ID | ENG-105 |

![Filled Add User Form](https://res.cloudinary.com/df8zddj1n/image/upload/v1779142902/atomquest_walkthrough/filled_add_user_form.png)

### Step 2.3 — User Created Successfully

After clicking **"Create Account"**, Neha Gupta appears at the bottom of the People list with the **Employee** role badge (teal) and **"No Manager"** assigned.

![New User In List](https://res.cloudinary.com/df8zddj1n/image/upload/v1779142903/atomquest_walkthrough/new_user_in_list.png)

---

## 3. Assigning a Manager

### Step 3.1 — Manager Dropdown Selection

The DBA uses the **"Assigned Manager"** dropdown next to Neha Gupta and selects **Vikram Desai (Engineering)** as her reporting manager.

### Step 3.2 — Manager Assigned

The list now shows Neha Gupta with **"Vikram Desai (Engineering)"** as her assigned manager. This establishes the reporting hierarchy used for goal approvals and team check-ins.

![Manager Assigned](https://res.cloudinary.com/df8zddj1n/image/upload/v1779142905/atomquest_walkthrough/neha_manager_assigned.png)

> **Important:** The manager assignment is critical for the approval workflow. Only the assigned manager can approve or return an employee's goal sheet.

---

## 4. Employee First Login & Password Change

### Step 4.1 — Employee Login

The DBA signs out. Neha logs in with the initial credentials provided by the DBA:
- **Email:** `neha.gupta@atomberg.com`
- **Password:** `Welcome@2026`

### Step 4.2 — First-Time Setup Screen

The system detects `is_first_login: true` and redirects Neha to the **First-time Setup** page. This security measure ensures every new employee sets a personal, secure password before accessing the portal.

The page displays:
- A personalized welcome message: *"Welcome, **Neha**"*
- Fields for Current Password, New Password, and Repeat New Password
- Password complexity requirements (8–30 chars, uppercase, lowercase, number, special character)

![First Login Page](https://res.cloudinary.com/df8zddj1n/image/upload/v1779142906/atomquest_walkthrough/first_login_empty.png)

### Step 4.3 — Password Change Form Filled

Neha enters:
- **Current Password:** `Welcome@2026`
- **New Password:** `Neha@Atom2026`
- **Repeat Password:** `Neha@Atom2026`

![First Login Filled](https://res.cloudinary.com/df8zddj1n/image/upload/v1779142907/atomquest_walkthrough/first_login_filled.png)

### Step 4.4 — Password Updated

After clicking **"Update Password & Continue"**, the password is updated and `is_first_login` is set to `false`. Neha is redirected to her dashboard.

---

## 5. Employee Dashboard

The employee dashboard provides a comprehensive snapshot of goal performance:

- **Active Goals:** 4 (Sheet status: approved locked)
- **Weighted Score:** 0% (no check-ins yet)
- **On-Track:** 0 updates total
- **Cycle:** FY 2026–27
- **Quarterly Progress** bar chart (Q1–Q4)
- **Composite Score** donut chart (weighted achievement)
- **Your Goals** list with status and progress bars

![Employee Dashboard](https://res.cloudinary.com/df8zddj1n/image/upload/v1779142908/atomquest_walkthrough/employee_dashboard.png)

---

## 6. Creating Goals & Submitting for Approval

### Step 6.1 — Empty Goal Sheet Editor

Clicking **"Create your goal sheet"** opens the goal editor. The page header shows the active cycle (FY 2026–27) and rules: *weightage must total 100%, max 8 goals, min 10% each*.

![Empty Goal Sheet](https://res.cloudinary.com/df8zddj1n/image/upload/v1779142909/atomquest_walkthrough/empty_goal_sheet.png)

### Step 6.2 — Goals Created (4 Goals, 100% Weightage)

Neha adds four goals across different thrust areas:

| # | Thrust Area | Goal Title | UOM | Target | Wt% |
|---|-------------|-----------|-----|--------|-----|
| 1 | Operational Excellence | Complete API integration for payment module | Timeline | 2026-09-30 | 35% |
| 2 | Quality & Compliance | Achieve 95% code coverage on unit tests | % (Higher is better) | 95 | 30% |
| 3 | Innovation | Implement automated CI/CD pipeline | Timeline | 2026-08-31 | 20% |
| 4 | People & Culture | Mentor 2 junior developers | Numeric (Higher is better) | 2 | 15% |

**Total weightage: 100% ✅**

![Goals Completed](https://res.cloudinary.com/df8zddj1n/image/upload/v1779142910/atomquest_walkthrough/goals_completed.png)

### Step 6.3 — Draft Saved

Neha clicks **"Save Draft"** to persist the goal sheet.

![Draft Saved](https://res.cloudinary.com/df8zddj1n/image/upload/v1779142911/atomquest_walkthrough/draft_saved.png)

### Step 6.4 — Submitted for Approval

Clicking **"Submit for Approval"** changes the sheet status to **"Submitted"**. The form becomes read-only. A **"Print PDF"** option is also available.

![Goals Submitted](https://res.cloudinary.com/df8zddj1n/image/upload/v1779142912/atomquest_walkthrough/goals_submitted.png)

> **Note:** Once submitted, the employee cannot edit goals until the manager either approves (locks) or returns the sheet with feedback.

---

## 7. Manager Reviews & Approves Goals

### Step 7.1 — Manager Login

Neha signs out. Manager **Vikram Desai** logs in:
- **Email:** `vikram.desai@atomberg.com`
- **Password:** `Atom@2026`
- **Role:** Manager

### Step 7.2 — Approval Queue

The manager's primary view is the **Approval Queue** — showing all submitted goal sheets pending review. Neha Gupta's sheet appears with status **"Submitted"**, displaying all 4 goals with their thrust areas, targets, and weightages.

The manager can:
- **✅ Approve & Lock** — approve the sheet as-is
- **✏️ Edit Inline** — make minor adjustments before approving
- **↩ Return** — send back with feedback (requires 20+ character reason)

![Manager Approval Queue](https://res.cloudinary.com/df8zddj1n/image/upload/v1779142913/atomquest_walkthrough/manager_dashboard.png)

### Step 7.3 — Goals Approved & Locked

After clicking **"Approve & Lock"**, the sheet status changes to **"Approved · Locked"** (green badge). The goals are now frozen and the employee can begin logging quarterly check-ins.

![Goals Approved](https://res.cloudinary.com/df8zddj1n/image/upload/v1779142915/atomquest_walkthrough/goals_approved_state.png)

---

## 8. Employee Quarterly Check-ins

### Step 8.1 — Employee Dashboard (Post-Approval)

Neha logs back in. Her dashboard now shows **4 Active Goals** with **"Sheet: approved locked"** status. All goals show **"Not started · 0%"**.

![Dashboard After Approval](https://res.cloudinary.com/df8zddj1n/image/upload/v1779142916/atomquest_walkthrough/employee_dashboard_approved_goals.png)

### Step 8.2 — Quarterly Check-ins Page

Navigating to **"My Check-ins"** shows all approved goals with Q1–Q4 quarter tabs. Each goal has fields for:
- **Actual Value/Date** — the measured result
- **Status** dropdown — Not started / On track / Completed
- **Notes** — free-text field for context
- **Computed Score** — auto-calculated based on UOM formula

![Check-in Saved](https://res.cloudinary.com/df8zddj1n/image/upload/v1779142917/atomquest_walkthrough/first_checkin_saved.png)

### Step 8.3 — Check-ins Recorded

Neha records Q1 progress:

**Goal 1 — API Integration:**
- Actual Date: 2026-05-19
- Status: On track
- Notes: *"Completed initial API schema design and started integration testing."*
- Computed Score: **100%**

**Goal 2 — Code Coverage:**
- Actual Value: 72 (target: 95)
- Status: On track
- Notes: *"Current coverage at 72%. Adding tests for auth and payment modules."*
- Computed Score: **76%**

![Updated Check-ins](https://res.cloudinary.com/df8zddj1n/image/upload/v1779142918/atomquest_walkthrough/updated_checkins_page_with_progress.png)

---

## 9. Employee Profile: Image Upload & Personal Email

### Step 9.1 — Profile Page

Clicking **"Profile"** in the top navigation opens the **My Profile** page with two sections:

**Left Panel — Personal Information:**
- Avatar with camera icon overlay (📷) for image upload
- Name, Email, Employee ID (read-only)
- Phone Number, Date of Birth (editable)
- Personal Email (for test delivery)
- **"Save Changes"** button

**Right Panel — Change Password:**
- Current, New, and Repeat password fields
- Password complexity requirements
- **"Update Security"** button

![Profile Page](https://res.cloudinary.com/df8zddj1n/image/upload/v1779142920/atomquest_walkthrough/neha_profile_initial.png)

### Step 9.2 — Personal Email Added

Neha enters her personal email: `neha.personal@gmail.com` in the **"Personal Email (For Test Delivery)"** field and clicks **"Save Changes"**.

A green toast notification confirms: **"✅ Profile updated"**

![Profile Saved](https://res.cloudinary.com/df8zddj1n/image/upload/v1779142921/atomquest_walkthrough/neha_profile_saved.png)

### Step 9.3 — Profile Image Upload

The camera icon (📷) below the avatar allows uploading a profile picture. Supported formats: JPG, PNG, JPEG, WebP (max 2MB). Images are stored via **Cloudinary** and automatically cropped to 500×500px.

![Upload Button](https://res.cloudinary.com/df8zddj1n/image/upload/v1779142922/atomquest_walkthrough/profile_upload_btn.png)

---

## 10. Manager Reports & CSV Export

### Step 10.1 — Achievement Report

The **Reports** page provides a comprehensive tabular view of all team goals across all quarters with columns for Employee, Goal, UOM, Target, Weightage, Quarter, Actual Value, Status, and Score.

The **"Export CSV"** button (top right, amber) downloads the entire report as a CSV file for offline analysis.

![Reports Page](https://res.cloudinary.com/df8zddj1n/image/upload/v1779142923/atomquest_walkthrough/manager_reports_page.png)

> **Tip:** The CSV export includes all employees' goals across all quarters — making it perfect for importing into Excel or Google Sheets for further analysis.

### Step 10.2 — Team Check-ins View

The **Team Check-ins** page shows each team member's goals with planned vs. actual values, progress bars, and the ability for managers to add check-in comments.

Neha Gupta's first goal shows **100% · On track** with the actual date recorded.

![Team Check-ins](https://res.cloudinary.com/df8zddj1n/image/upload/v1779142924/atomquest_walkthrough/manager_team_checkins_neha_progress.png)

### Step 10.3 — Completion Dashboard

The **Completion Dashboard** provides a bird's-eye view of goal submission and check-in completion rates across the team, with an **Employee × Quarter Matrix** for tracking coverage.

![Completion Dashboard](https://res.cloudinary.com/df8zddj1n/image/upload/v1779142925/atomquest_walkthrough/manager_completion_status.png)

---

## Summary — Complete Application Flow

```
DBA Admin Login
    ↓
Create Employee Account
    ↓
Assign Manager
    ↓
Employee First Login → Mandatory Password Change
    ↓
Employee Dashboard
    ↓
Create Goal Sheet → Save Draft → Submit for Approval
    ↓
Manager Reviews Goals → Approve & Lock
    ↓
Employee Check-ins (Quarterly Progress)
    ↓
Manager Reports → Export CSV
    ↓
Employee Profile (Upload Image + Personal Email)
```

### Roles & Permissions Matrix

| Feature | Employee | Manager | Admin | Database Admin |
|---------|----------|---------|-------|----------------|
| Create Users | ❌ | ❌ | ✅ | ✅ |
| Assign Managers | ❌ | ❌ | ✅ | ✅ |
| Set Roles | ❌ | ❌ | ✅ | ✅ |
| Create Goals | ✅ | ✅ | ✅ | ❌ |
| Submit Goals | ✅ | ✅ | ❌ | ❌ |
| Approve Goals | ❌ | ✅ | ✅ | ❌ |
| Check-ins | ✅ | ✅ | ❌ | ❌ |
| Team Check-ins | ❌ | ✅ | ❌ | ❌ |
| Reports / CSV | ❌ | ✅ | ✅ | ❌ |
| Profile Edit | ✅ | ✅ | ✅ | ✅ |

---

*Document generated on May 19, 2026 — AtomQuest GoalPortal v1.0*
