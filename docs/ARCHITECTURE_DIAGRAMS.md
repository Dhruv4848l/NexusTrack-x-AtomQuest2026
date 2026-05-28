# Section 2: Architecture Diagrams — NexusTrack (AtomQuest GoalPortal)

> **Project:** NexusTrack GoalPortal · **Stack:** React + TanStack Router (Vite) · Node.js/Express · MongoDB Atlas  
> **Date:** May 19, 2026

---

## 2.1 Class Diagram

```mermaid
classDiagram
    class User {
        +ObjectId _id
        +String first_name
        +String last_name
        +String email
        +String password
        +String employee_id
        +String phone_number
        +Date dob
        +String department
        +String avatar_color
        +String profile_image
        +ObjectId manager_id
        +String[] roles
        +Boolean is_first_login
        +String otp_code
        +Date otp_expires
        +String personal_email
        +full_name() String
        +matchPassword(pwd) Boolean
        +toJSON() Object
    }

    class Cycle {
        +ObjectId _id
        +String name
        +Boolean is_active
        +Date phase1_open
        +Date phase1_close
        +Date q1_open / q1_close
        +Date q2_open / q2_close
        +Date q3_open / q3_close
        +Date q4_open / q4_close
    }

    class GoalSheet {
        +ObjectId _id
        +ObjectId owner_id
        +ObjectId cycle_id
        +String status
        +Date submitted_at
        +Date approved_at
        +ObjectId approved_by
        +Boolean is_edit_requested
        +String edit_request_reason
    }

    class Goal {
        +ObjectId _id
        +ObjectId sheet_id
        +ObjectId shared_parent_id
        +String thrust_area
        +String title
        +String description
        +String uom_type
        +Number target
        +Date target_date
        +Number weightage
        +Number position
    }

    class Achievement {
        +ObjectId _id
        +ObjectId goal_id
        +String quarter
        +Number actual_value
        +Date actual_date
        +String status
        +Number computed_score
        +String notes
        +String proof_url
        +String proof_name
    }

    class Comment {
        +ObjectId _id
        +String type
        +ObjectId manager_id
        +ObjectId sheet_id
        +ObjectId goal_id
        +String quarter
        +String comment
    }

    class AuditLog {
        +ObjectId _id
        +ObjectId actor_id
        +String entity
        +String entity_id
        +String action
        +Mixed details
    }

    class Escalation {
        +ObjectId _id
        +ObjectId sheet_id
        +ObjectId employee_id
        +ObjectId manager_id
        +String reason
        +String status
        +Date resolved_at
        +ObjectId resolved_by
    }

    User "1" --> "0..*" GoalSheet : owns
    User "1" --> "0..*" User : manages
    Cycle "1" --> "0..*" GoalSheet : contains
    GoalSheet "1" --> "1..8" Goal : has
    Goal "1" --> "0..4" Achievement : tracks
    Goal "0..1" --> "0..*" Goal : shared_parent
    User "1" --> "0..*" Comment : writes
    GoalSheet "1" --> "0..*" Comment : receives
    Goal "1" --> "0..*" Comment : receives
    User "1" --> "0..*" AuditLog : performs
    GoalSheet "1" --> "0..*" Escalation : escalated
    User "1" --> "0..*" Escalation : raised_by
```

---

## 2.2 Component Diagram

```mermaid
graph TB
    subgraph "Frontend - React SPA"
        LP[Login Page]
        FLP[First Login Page]
        DB[Dashboard]
        GE[Goal Editor]
        CI[Check-ins Page]
        PR[Profile Page]
        RP[Reports Page]
        AQ[Approval Queue]
        AP[Admin Panel]
        AS[AppShell Layout]
    end

    subgraph "API Client Layer"
        AX[Axios Instance]
        AC[Auth Context]
        APIS[API Modules]
    end

    subgraph "Backend - Express API"
        AR[Auth Routes]
        UR[User Routes]
        SR[Sheet Routes]
        GR[Goal Routes]
        ACR[Achievement Routes]
        CR[Cycle Routes]
        AUR[Audit Routes]
        ER[Entra SSO Routes]
    end

    subgraph "Middleware"
        JWT[JWT Auth Middleware]
        RBAC[Role Guard]
        RL[Rate Limiter]
        ML[Multer Upload]
    end

    subgraph "Business Logic"
        SE[Score Engine]
        NS[Notification Service]
        VL[Validation Utils]
    end

    subgraph "Data Layer"
        MG[(MongoDB Atlas)]
        CL[(Cloudinary CDN)]
        GM[Gmail SMTP]
    end

    LP --> AX
    DB --> AX
    AX --> AR
    AX --> SR
    AR --> JWT --> RBAC
    SR --> JWT --> RBAC
    ACR --> SE
    SR --> NS --> GM
    AR --> ML --> CL
    AR --> MG
    SR --> MG
```

---

## 2.3 Deployment Diagram

```mermaid
graph TB
    subgraph "Client Tier"
        BR[Web Browser]
    end

    subgraph "Vercel CDN"
        VR[React SPA - Vite Build]
        VR2[Static Assets]
    end

    subgraph "Render.com - Web Service"
        ND[Node.js Express Server]
        PM[Process Manager]
    end

    subgraph "Cloud Services"
        MA[(MongoDB Atlas Cluster)]
        CLD[Cloudinary CDN]
        MSFT[Microsoft Entra ID]
        GMAIL[Gmail SMTP]
    end

    BR -->|HTTPS| VR
    VR -->|API Calls| ND
    ND -->|Mongoose| MA
    ND -->|Image Upload| CLD
    ND -->|OAuth 2.0| MSFT
    ND -->|Nodemailer| GMAIL
    BR -->|Static| VR2
```

---

## 2.4 Object Diagram

```mermaid
graph TB
    subgraph "Runtime Object Instance Example"
        U1["neha : User
        email = neha.gupta@atomberg.com
        roles = [employee]
        department = Engineering
        manager_id = vikram._id"]

        U2["vikram : User
        email = vikram.desai@atomberg.com
        roles = [manager]
        department = Engineering"]

        C1["fy2026 : Cycle
        name = FY 2026-27
        is_active = true"]

        S1["sheet1 : GoalSheet
        status = approved_locked
        owner_id = neha._id
        cycle_id = fy2026._id"]

        G1["goal1 : Goal
        title = Complete API Integration
        uom_type = timeline
        weightage = 35"]

        A1["ach1 : Achievement
        quarter = Q1
        status = on_track
        computed_score = 100"]
    end

    U2 -->|manages| U1
    U1 -->|owns| S1
    C1 -->|contains| S1
    S1 -->|has| G1
    G1 -->|tracks| A1
    U2 -->|approved| S1
```

---

## 2.5 Package Diagram

```mermaid
graph TB
    subgraph "Frontend Package - src/"
        subgraph "routes/"
            R1[__root.tsx]
            R2[login.tsx]
            R3[first-login.tsx]
            R4[_app/dashboard.tsx]
            R5[_app/goals.tsx]
            R6[_app/checkins.tsx]
            R7[_app/profile.tsx]
            R8[_app/reports.tsx]
            R9[_app/goals_.review.tsx]
            R10[_app/admin/*]
        end
        subgraph "lib/"
            L1[api.ts]
            L2[auth-context.tsx]
            L3[scoring.ts]
            L4[goals.functions.ts]
            L5[admin.functions.ts]
            L6[cycles.functions.ts]
        end
        subgraph "components/"
            C1[app/AppShell.tsx]
            C2[app/EmptyState.tsx]
            C3[ui/*]
        end
    end

    subgraph "Backend Package - backend/"
        subgraph "models/"
            M1[User.js]
            M2[GoalSheet.js]
            M3[Goal.js]
            M4[Achievement.js]
            M5[Comment.js]
            M6[AuditLog.js]
            M7[Cycle.js]
            M8[Escalation.js]
        end
        subgraph "routes/"
            BR1[auth.js]
            BR2[users.js]
            BR3[sheets.js]
            BR4[goals.js]
            BR5[achievements.js]
            BR6[cycles.js]
            BR7[audit.js]
            BR8[entra.js]
        end
        subgraph "middleware/"
            MW1[auth.js - protect / requireRole]
        end
        subgraph "utils/"
            UT1[scoreEngine.js]
            UT2[notificationService.js]
            UT3[validation.js]
        end
        subgraph "config/"
            CF1[db.js]
        end
    end

    L1 --> BR1
    L1 --> BR3
    R4 --> L4
    BR3 --> M2
    BR3 --> UT2
    BR5 --> UT1
```

---

## 2.6 Composite Structure & Profile Diagram

```mermaid
graph TB
    subgraph "NexusTrack System"
        subgraph "AuthSubsystem"
            LOGIN[Login Handler]
            SSO[Microsoft Entra SSO]
            JWTM[JWT Manager]
            PWD[Password Manager]
            OTP[OTP Generator]
        end

        subgraph "GoalManagementSubsystem"
            SHEET[Sheet Controller]
            GOALC[Goal Controller]
            SHARED[Shared Goal Pusher]
            APPROVE[Approval Engine]
            RETURN[Return Handler]
        end

        subgraph "PerformanceSubsystem"
            CHECKIN[Check-in Controller]
            SCORE[Score Engine]
            PROOF[Proof Uploader]
            SYNC[Shared Goal Sync]
        end

        subgraph "NotificationSubsystem"
            EMAIL[Email Dispatcher]
            GMAIL2[Gmail Transport]
            TEMPLATE[HTML Templates]
        end

        subgraph "AdminSubsystem"
            USERMGMT[User Management]
            ROLEMGMT[Role Management]
            CYCLEMGMT[Cycle Management]
            AUDIT[Audit Logger]
        end
    end

    LOGIN --> JWTM
    SSO --> JWTM
    SHEET --> APPROVE
    APPROVE --> EMAIL
    CHECKIN --> SCORE
    CHECKIN --> SYNC
    EMAIL --> GMAIL2
    USERMGMT --> AUDIT
    SHEET --> AUDIT
```

---

## 2.7 Use Case Diagram

```mermaid
graph LR
    EMP((Employee))
    MGR((Manager))
    ADM((Admin))
    DBA((Database Admin))
    SYS((System))

    EMP -->|Login / Change Password| UC1[Authentication]
    EMP -->|Create Goal Sheet| UC2[Goal Creation]
    EMP -->|Save Draft| UC3[Draft Management]
    EMP -->|Submit for Approval| UC4[Sheet Submission]
    EMP -->|Log Quarterly Actuals| UC5[Check-in Entry]
    EMP -->|Upload Profile Image| UC6[Profile Management]
    EMP -->|Request Edit Access| UC7[Edit Request]
    EMP -->|Upload Proof Document| UC8[Proof Upload]

    MGR -->|Review Goal Sheets| UC9[Goal Review]
    MGR -->|Approve and Lock| UC10[Sheet Approval]
    MGR -->|Approve with Edits| UC11[Inline Edit Approval]
    MGR -->|Return with Comments| UC12[Sheet Return]
    MGR -->|View Team Check-ins| UC13[Team Monitoring]
    MGR -->|Export CSV Reports| UC14[Report Export]
    MGR -->|Add Check-in Comments| UC15[Check-in Feedback]
    MGR -->|Push Shared Goals| UC16[Shared Goals]

    ADM -->|Manage Users| UC17[User CRUD]
    ADM -->|Assign Roles| UC18[Role Assignment]
    ADM -->|Manage Cycles| UC19[Cycle Management]
    ADM -->|Unlock Sheets| UC20[Sheet Unlock]
    ADM -->|View Audit Logs| UC21[Audit Trail]
    ADM -->|View Completion Status| UC22[Completion Dashboard]

    DBA -->|Create User Accounts| UC17
    DBA -->|Assign Managers| UC23[Manager Assignment]
    DBA -->|Set User Roles| UC18

    SYS -->|Send Email Notifications| UC24[Email Dispatch]
    SYS -->|Compute Scores| UC25[Score Calculation]
    SYS -->|Enforce Time Windows| UC26[Time Gating]
    SYS -->|Log Audit Events| UC21
```

---

## 2.8 Activity Diagram

```mermaid
flowchart TD
    A([Start]) --> B[DBA Creates Employee Account]
    B --> C[DBA Assigns Manager]
    C --> D[Employee Logs In]
    D --> E{First Login?}
    E -->|Yes| F[Mandatory Password Change]
    F --> G[Redirect to Dashboard]
    E -->|No| G
    G --> H[Employee Creates Goal Sheet]
    H --> I[Add Goals - 1 to 8, total 100%]
    I --> J{Action?}
    J -->|Save| K[Save as Draft]
    K --> I
    J -->|Submit| L[Submit for Approval]
    L --> M[Manager Reviews Sheet]
    M --> N{Decision?}
    N -->|Approve| O[Lock Goal Sheet]
    N -->|Edit + Approve| P[Modify Targets] --> O
    N -->|Return| Q[Return with Feedback]
    Q --> H
    O --> R[Employee Logs Quarterly Check-ins]
    R --> S[System Computes Score]
    S --> T{More Quarters?}
    T -->|Yes| R
    T -->|No| U[Manager Exports Reports]
    U --> V([End])
```

---

## 2.9 State Machine Diagram

```mermaid
stateDiagram-v2
    [*] --> Draft : Employee creates sheet

    Draft --> Draft : Save Draft
    Draft --> Submitted : Submit for Approval

    Submitted --> ApprovedLocked : Manager Approves
    Submitted --> ApprovedLocked : Manager Approves with Edits
    Submitted --> Returned : Manager Returns

    Returned --> Draft : Employee Edits
    Returned --> Submitted : Employee Resubmits

    ApprovedLocked --> ApprovedLocked : Employee logs check-ins
    ApprovedLocked --> Returned : Manager Approves Edit Request
    ApprovedLocked --> ApprovedLocked : Manager Rejects Edit Request
    ApprovedLocked --> Draft : Admin Unlocks

    ApprovedLocked --> Completed : Cycle Ends

    Completed --> [*]

    state ApprovedLocked {
        [*] --> Q1Active
        Q1Active --> Q2Active : Q1 window closes
        Q2Active --> Q3Active : Q2 window closes
        Q3Active --> Q4Active : Q3 window closes
        Q4Active --> [*] : Q4 window closes
    }
```

---

## 2.10 Sequence Diagram

```mermaid
sequenceDiagram
    actor E as Employee
    actor M as Manager
    participant FE as React Frontend
    participant API as Express API
    participant MW as Auth Middleware
    participant DB as MongoDB Atlas
    participant EM as Gmail SMTP

    E->>FE: Enter credentials
    FE->>API: POST /api/auth/login
    API->>DB: Find user by email
    DB-->>API: User document
    API->>API: Verify password (bcrypt)
    API-->>FE: JWT token + user data
    FE->>FE: Store token in localStorage

    E->>FE: Create goals and submit
    FE->>API: POST /api/sheets/save (submit=true)
    API->>MW: Verify JWT
    MW->>DB: Find user by token ID
    MW-->>API: req.user attached
    API->>DB: Create/update GoalSheet
    API->>DB: Delete old goals, insert new
    API->>DB: Update status to "submitted"
    API->>DB: Create AuditLog entry
    API->>DB: Find manager
    API->>EM: Send notification email
    API-->>FE: { sheetId }

    M->>FE: Open Approval Queue
    FE->>API: GET /api/sheets
    API->>MW: Verify JWT + Role
    API->>DB: Find submitted sheets
    API-->>FE: Sheets list

    M->>FE: Approve and Lock
    FE->>API: POST /api/sheets/:id/approve
    API->>DB: Update status to "approved_locked"
    API->>DB: Create AuditLog
    API->>EM: Notify employee
    API-->>FE: { ok: true }
```

---

## 2.11 Communication Diagram

```mermaid
graph TB
    E[Employee Browser] -->|"1: POST /auth/login"| API[Express API Server]
    API -->|"2: findOne(email)"| DB[(MongoDB Atlas)]
    DB -->|"3: user doc"| API
    API -->|"4: JWT token"| E

    E -->|"5: POST /sheets/save"| API
    API -->|"6: verify JWT"| MW[Auth Middleware]
    MW -->|"7: req.user"| API
    API -->|"8: create sheet + goals"| DB
    API -->|"9: sendEmail()"| GM[Gmail SMTP]
    GM -->|"10: email delivered"| MGR[Manager Inbox]

    MGR2[Manager Browser] -->|"11: GET /sheets"| API
    API -->|"12: find submitted"| DB
    MGR2 -->|"13: POST /sheets/:id/approve"| API
    API -->|"14: update status"| DB
    API -->|"15: notify employee"| GM

    E -->|"16: POST /achievements/upsert"| API
    API -->|"17: computeScore()"| SE[Score Engine]
    SE -->|"18: score value"| API
    API -->|"19: upsert achievement"| DB

    E -->|"20: POST /auth/avatar"| API
    API -->|"21: upload image"| CL[Cloudinary CDN]
    CL -->|"22: image URL"| API
    API -->|"23: update profile_image"| DB
```

---

## 2.12 Timing Diagram

```mermaid
gantt
    title NexusTrack Goal Lifecycle - FY 2026-27
    dateFormat YYYY-MM-DD
    axisFormat %b %Y

    section Phase 1 - Goal Setting
    Goal Creation Window     :active, p1, 2026-04-01, 2026-05-31
    Employee Creates Goals   :eg, 2026-04-05, 2026-04-20
    Manager Reviews          :mr, 2026-04-21, 2026-05-05
    Approval and Lock        :al, 2026-05-06, 2026-05-15

    section Q1 Check-ins
    Q1 Window Open           :q1, 2026-06-15, 2026-07-15
    Employee Logs Actuals    :ea1, 2026-06-20, 2026-07-10

    section Q2 Check-ins
    Q2 Window Open           :q2, 2026-09-15, 2026-10-15
    Employee Logs Actuals    :ea2, 2026-09-20, 2026-10-10

    section Q3 Check-ins
    Q3 Window Open           :q3, 2026-12-15, 2027-01-15
    Employee Logs Actuals    :ea3, 2026-12-20, 2027-01-10

    section Q4 Check-ins
    Q4 Window Open           :q4, 2027-03-15, 2027-04-15
    Employee Logs Actuals    :ea4, 2027-03-20, 2027-04-10
    Final Reports and Export :fr, 2027-04-10, 2027-04-30
```

---

## 2.13 Application Logic Flowchart

```mermaid
flowchart TD
    START([HTTP Request]) --> CORS{CORS Check}
    CORS -->|Blocked| ERR1[403 CORS Error]
    CORS -->|Passed| RL{Rate Limit Check}
    RL -->|Exceeded| ERR2[429 Too Many Requests]
    RL -->|Passed| ROUTE{Route Match?}
    ROUTE -->|No| ERR3[404 Not Found]
    ROUTE -->|/api/auth/login| LOGIN
    ROUTE -->|Protected Route| AUTH

    LOGIN[Login Handler] --> FIND[Find User by Email]
    FIND --> MATCH{Password Match?}
    MATCH -->|No| ERR4[401 Unauthorized]
    MATCH -->|Yes| ROLE[Resolve Active Role]
    ROLE --> TOKEN[Sign JWT]
    TOKEN --> RES1[200 + Token + User]

    AUTH[JWT Middleware] --> VERIFY{Token Valid?}
    VERIFY -->|No| ERR5[401 Invalid Token]
    VERIFY -->|Yes| ATTACH[Attach req.user]
    ATTACH --> RBAC{Role Check?}
    RBAC -->|Forbidden| ERR6[403 Access Denied]
    RBAC -->|Allowed| HANDLER[Route Handler]

    HANDLER --> VALIDATE{Input Valid?}
    VALIDATE -->|No| ERR7[400 Bad Request]
    VALIDATE -->|Yes| BIZ[Business Logic]
    BIZ --> DBOP[MongoDB Operation]
    DBOP --> AUDIT[Log Audit Entry]
    AUDIT --> NOTIFY{Notify?}
    NOTIFY -->|Yes| EMAIL[Send Email via Gmail]
    NOTIFY -->|No| RESP
    EMAIL --> RESP[200 JSON Response]

    ERR1 --> END([Response Sent])
    ERR2 --> END
    ERR3 --> END
    ERR4 --> END
    ERR5 --> END
    ERR6 --> END
    ERR7 --> END
    RESP --> END
```

---

## 2.14 C4 Model

### Level 1 — System Context

```mermaid
graph TB
    EMP[/"👤 Employee\nCreates goals, logs check-ins"/]
    MGR[/"👤 Manager\nReviews, approves, monitors"/]
    ADM[/"👤 Admin / DBA\nManages users, cycles, roles"/]

    NT["🏢 NexusTrack GoalPortal\n(React SPA + Express API + MongoDB)"]

    MSFT["☁️ Microsoft Entra ID\n(SSO Provider)"]
    GMAIL["📧 Gmail SMTP\n(Email Notifications)"]
    CLOUD["🖼️ Cloudinary\n(Image CDN)"]

    EMP --> NT
    MGR --> NT
    ADM --> NT
    NT --> MSFT
    NT --> GMAIL
    NT --> CLOUD
```

### Level 2 — Container

```mermaid
graph TB
    subgraph "NexusTrack System"
        SPA["⚛️ React SPA\n(Vite + TanStack Router)\nVercel"]
        API["🟢 Express REST API\n(Node.js)\nRender.com"]
        DB[("🍃 MongoDB Atlas\n(Document DB)")]
    end

    SPA -->|"HTTPS/JSON\nAxios + JWT"| API
    API -->|"Mongoose ODM"| DB
    API -->|"OAuth 2.0"| MSFT["Microsoft Entra ID"]
    API -->|"Nodemailer"| GMAIL["Gmail SMTP"]
    API -->|"Multer + SDK"| CLOUD["Cloudinary"]

    EMP[/"👤 Users"/] -->|"HTTPS"| SPA
```

### Level 3 — Component (API Server)

```mermaid
graph TB
    subgraph "Express API Server"
        subgraph "Middleware Layer"
            CORS2[CORS]
            RL2[Rate Limiter]
            BP[Body Parser]
            JWT2[JWT Auth]
            RG[Role Guard]
        end

        subgraph "Route Controllers"
            AUTH2[Auth Controller]
            USER2[User Controller]
            SHEET2[Sheet Controller]
            GOAL2[Goal Controller]
            ACH2[Achievement Controller]
            CYC2[Cycle Controller]
            AUD2[Audit Controller]
            SSO2[Entra SSO Controller]
        end

        subgraph "Services"
            SCR[Score Engine]
            NTF[Notification Service]
            VAL[Validation Utils]
        end

        subgraph "Data Access"
            USM[User Model]
            GSM[GoalSheet Model]
            GLM[Goal Model]
            ACM[Achievement Model]
            CMM[Comment Model]
            ALM[AuditLog Model]
            CYM[Cycle Model]
            ESM[Escalation Model]
        end
    end

    CORS2 --> RL2 --> BP --> JWT2 --> RG --> AUTH2
    AUTH2 --> USM
    SHEET2 --> GSM
    SHEET2 --> NTF
    ACH2 --> SCR
    ACH2 --> ACM
```

---

## 2.15 Architecture Pattern

```mermaid
graph TB
    subgraph "Architecture: 3-Tier + MVC + RBAC"
        subgraph "Presentation Tier"
            direction TB
            VIEW["View Layer\n(React Components + JSX)"]
            STATE["State Management\n(AuthContext + useState + useEffect)"]
            APICL["API Client\n(Axios + Interceptors)"]
        end

        subgraph "Application Tier"
            direction TB
            CTRL["Controllers\n(Express Route Handlers)"]
            MWL["Middleware Pipeline\n(CORS → Rate Limit → JWT → RBAC)"]
            SVC["Services\n(ScoreEngine, NotificationService)"]
        end

        subgraph "Data Tier"
            direction TB
            ODM["ODM Layer\n(Mongoose Schemas + Virtuals)"]
            DBMS[("MongoDB Atlas\n(Document Store)")]
        end
    end

    VIEW --> STATE --> APICL
    APICL -->|"REST API\nHTTPS + JWT Bearer"| MWL
    MWL --> CTRL --> SVC
    CTRL --> ODM --> DBMS

    subgraph "Cross-Cutting Concerns"
        LOG[Audit Logging]
        NOTIF[Email Notifications]
        VALID[Input Validation]
        ERRHNDL[Error Handling]
        RATELMT[Rate Limiting]
    end

    CTRL --> LOG
    CTRL --> NOTIF
    CTRL --> VALID
```

### Architecture Patterns Summary

| Pattern | Implementation |
|---------|---------------|
| **3-Tier Architecture** | React SPA → Express API → MongoDB Atlas |
| **MVC** | Models (Mongoose) · Views (React) · Controllers (Express Routes) |
| **RBAC** | 4 roles: Employee, Manager, Admin, Database Admin with middleware guards |
| **Repository Pattern** | Mongoose models abstract database access |
| **Middleware Pipeline** | CORS → Rate Limit → Body Parser → JWT Verify → Role Check → Handler |
| **Observer Pattern** | Email notifications triggered on state transitions (submit, approve, return) |
| **Strategy Pattern** | Score Engine uses different algorithms per UOM type (numeric, timeline, zero) |
| **Singleton** | Single Mongoose connection, single Axios instance with interceptors |
| **State Machine** | GoalSheet lifecycle: Draft → Submitted → Approved/Returned → Completed |
| **Time Gating** | Cycle-based quarter windows enforce check-in availability |
| **SSO Integration** | Microsoft Entra ID OAuth 2.0 Authorization Code flow |
| **CDN Offloading** | Profile images stored via Cloudinary with auto-transformation |

---

*Document generated on May 19, 2026 — NexusTrack GoalPortal v1.0*
