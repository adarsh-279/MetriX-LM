# MetriX-LM (NAWI-Verify) — Digital OIML R 76 Type-Evaluation Platform
### Smart India Hackathon 2026 — Problem Statement ID: 26035

> **A laboratory-oriented digital compliance platform that transforms Non-Automatic Weighing Instruments (NAWI) type-evaluation from manual spreadsheets into an auditable, deterministic, and explainable digital workflow.**

[![OIML R 76-1:2006 Compliant](https://img.shields.io/badge/Standard-OIML%20R%2076--1%3A2006-blue)](https://www.oiml.org/en/files/pdf_r/r076-1-e06.pdf)
[![OIML R 76-2:2007 Report](https://img.shields.io/badge/Format-OIML%20R%2076--2%3A2007-green)](https://www.oiml.org/en/files/pdf_r/r076-2-e07.pdf)
[![Architecture: 2-Tier Modular](https://img.shields.io/badge/Architecture-Frontend%20%2B%20Backend-teal)]()

---

## 🌟 Core Differentiators & Hackathon Features

| Feature | Description |
| :--- | :--- |
| ⚖️ **Deterministic OIML Engine** | Pure backend mathematical calculations implementing OIML R 76-1 Table 1 (Accuracy Classes I, II, III, IIII) and Table 3 Maximum Permissible Errors ($\pm 0.5e, \pm 1.0e, \pm 1.5e$). |
| 🔍 **Explainable PASS / FAIL** | Step-by-step breakdown displaying Observed Error, Permissible MPE, Excess Deviation, Standard Clause Reference, and plain-language regulatory decision. |
| 🪪 **Instrument Digital Passport** | Persistent lifecycle profile bringing together metrological parameters, historical evaluations, attached documents, and approval status. |
| 🔄 **Correction-Aware Workflow** | Multi-tier approval pipeline (`DRAFT` $\to$ `IN_PROGRESS` $\to$ `SUBMITTED` $\to$ `UNDER_REVIEW` $\to$ `APPROVED` (Locked) / `REJECTED` $\to$ `REVISION V2`), creating immutable revisions linked to predecessors. |
| 🔒 **Cryptographic Integrity Hash** | Evaluated test data is hashed with SHA-256 upon approval to ensure immutability and compliance integrity. |
| 📜 **Versioned Rules Catalogue** | OIML standards stored as versioned data sets (`OIML-R76-2006`, `LM-RULES-2011`) allowing future regulatory updates without code rewrites. |
| 🤖 **AI Spec Extractor Assistant** | Parses raw manufacturer datasheets to auto-populate instrument parameters with mandatory technician verification. |
| 📑 **Standardized R 76-2 Reports** | Official lab certificate layout with Print/PDF styling, CSV table export, and JSON certificate generation. |
| 🛡️ **Append-Only Audit Trail** | Chronological record of all observation edits, evidence attachments, approvals, and revisions with actor roles and timestamps. |

---

## 🏗️ Repository Architecture

The platform is structured into two clean folders: `frontend` and `backend`:

```
MetriX-LM/
├── package.json                   # Root orchestrator script (concurrently runs frontend & backend)
├── README.md                      # Complete SIH 2026 documentation & demo guide
├── .gitignore
├── backend/                       # Node.js + Express + TypeScript REST API
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│       ├── server.ts              # Express entrypoint, middleware, routes
│       ├── db/
│       │   ├── index.ts           # SQLite persistent database schema & ACID-like store
│       │   └── seed.ts            # Realistic seed data (instruments, test cases, users, audit logs)
│       ├── middleware/
│       │   ├── auth.ts            # JWT authentication & server-side RBAC
│       │   └── errorHandler.ts    # Centralized error handler
│       ├── services/
│       │   ├── oimlEngine.ts      # Deterministic OIML R 76-1 calculation & MPE engine
│       │   ├── auditService.ts    # Append-only audit logger
│       │   ├── aiService.ts       # AI specification extraction & test explanation
│       │   └── reportService.ts   # Standardized OIML R 76-2 report snapshot & exports
│       └── routes/
│           ├── auth.ts            # Login, logout, current user, role switching
│           ├── instruments.ts     # NAWI registration & Digital Passport
│           ├── cases.ts           # Evaluation cases, dynamic test execution & observations
│           ├── reviews.ts         # Reviewer submission, approval, rejection, and revisions
│           ├── evidence.ts        # Evidence upload, photo attachments & metadata
│           ├── equipment.ts       # Calibration equipment traceability master
│           ├── calculate.ts       # Real-time MPE calculation endpoints
│           ├── audit.ts           # Audit trail query and inspection
│           ├── rules.ts           # Versioned ruleset viewer & test applicability
│           ├── ai.ts              # AI spec extraction & test explanation endpoints
│           ├── stats.ts           # Dashboard analytics & pass/fail statistics
│          └── reports.ts         # Report snapshot, CSV, JSON export
│ 
└── frontend/                      # React 18 + TypeScript + Vite SPA
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts             # Proxying /api to backend:5000
    ├── index.html
    └── src/
        ├── App.tsx                # Master layout with navigation, active role badge & user switcher
        ├── main.tsx
        ├── index.css              # Styling with theme variables & print styles
        ├── lib/
        │   ├── api.ts             # Fully-typed REST API client
        │   ├── authContext.tsx    # Auth & role state management (Technician, Reviewer, Admin)
        │   └── oiml.ts            # Client-side validation & utilities
        ├── components/
        │   ├── Navbar.tsx         # Top bar with role switcher, quick stats, user info
        │   ├── Sidebar.tsx        # Navigation menu
        │   ├── ExplainableModal.tsx # Step-by-step metrological calculation explanation
        │   └── AISpecModal.tsx    # AI specification extraction modal
        └── pages/
            ├── Dashboard.tsx      # Comprehensive analytics, metrics, recent activities
            ├── Passport.tsx       # Instrument Digital Passport & history
            ├── Instruments.tsx    # NAWI registration & equipment master
            ├── EvaluationCases.tsx# Case management & workflow state tracker
            ├── CaseExecution.tsx  # Dynamic test execution wizard with real-time explainable MPE
            ├── ReviewWorkspace.tsx# Reviewer workbench with approval/rejection/revision controls
            ├── ReportView.tsx     # Standardized OIML R 76-2 certificate with PDF print, JSON & CSV
            ├── RulesCatalogue.tsx # Versioned OIML ruleset browser
            ├── EquipmentMaster.tsx# Calibration equipment traceability catalog
            └── AuditTrail.tsx     # System-wide audit inspection
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18 or higher (v24 recommended)
- **npm**: v9 or higher

### 1. Install Dependencies
From the project root, install the workspace dependencies once:
```bash
npm install
```

This project uses npm workspaces, so the root package manages both the frontend and backend dependencies together. You normally do not need to run `npm install` separately inside `frontend` or `backend`.

### 2. Start Frontend & Backend Concurrently
From the root directory:
```bash
npm run dev
```
- **Backend API**: `http://localhost:5000` (Health Check: `http://localhost:5000/api/health`)
- **Frontend SPA**: `http://localhost:5173`

> If you are starting the app for the first time, always run `npm install` at the root before `npm run dev`.

---

## 🎬 Recommended 5-Minute SIH Demonstration Walkthrough

1. **Dashboard & Role Persona**:
   - Open `http://localhost:5173`.
   - Observe the active compliance metrics, pass rate, failure category breakdown, and recent evaluations.
   - Point out the **Persona Switcher** in the top navigation bar (switching seamlessly between **Technician**, **Reviewer / Metrologist**, **Admin**, and **Lab Manager**).

2. **NAWI Registration & AI Spec Extraction**:
   - Navigate to **Instruments & Passport**.
   - Click **AI Spec Extractor**, load a sample brochure text, and click **Extract Parameters**.
   - Observe automatic extraction of Make, Model, Accuracy Class, Max Capacity, $e$, $d$, Min, and Tare limits.
   - Save the instrument and show the real-time **OIML R 76-1 Table 1** validation ($n = \text{Max}/e$ check).

3. **Digital Instrument Passport & Readiness Check**:
   - Click **Passport** on the newly registered scale.
   - Show the persistent metrological profile, historical evaluations, and the **Pre-Test Readiness Check** verifying parameters and traceable calibration equipment.

4. **Dynamic Test Execution & Explainable PASS**:
   - Click **Start Evaluation for this NAWI**.
   - In Step 1, configure environmental conditions (Temperature, Humidity, Pressure).
   - In Step 2 (Weighing Performance), click **Auto-Fill Standard Load Points** to generate OIML test steps ($0, \text{Min}, 500e, 1000e, 2000e, \text{Max}$).
   - Enter compliant readings and observe the green **PASS** badges and MPE limits.

5. **Trigger an Explainable FAIL**:
   - Navigate to Step 4 (Eccentricity Test) and enter a corner load reading that exceeds tolerance (e.g. $+1.5\text{ kg}$ on Back-Right when MPE is $\pm 0.5\text{ kg}$).
   - Click the **"Why?"** button on the FAIL result.
   - Show the **Metrological Decision Trace**: Observed Error, Permissible MPE, Excess Deviation, OIML R 76-1 Clause A.4.7 reference, and decision reasoning.

6. **Attach Evidence & Submit for Review**:
   - In Step 6, attach a test photograph (e.g. Rating plate photo).
   - Click **Submit for Review**. The case transitions to `UNDER_REVIEW`.

7. **Reviewer Workspace & Correction-Aware Revision**:
   - Switch persona to **Reviewer / Metrologist**.
   - Open **Reviewer Workspace** (`/review`).
   - Inspect the test observation tables and evidence.
   - Click **Reject & Return** and enter a reason: *"Eccentricity corner load exceeded MPE. Re-level and adjust corner trim potentiometer."*
   - Click **Create Revision (V2)**. Show that Revision V2 is created while Revision V1 is permanently preserved in the audit log.

8. **Approve & Lock Standardized OIML R 76-2 Certificate**:
   - On an approved case (e.g. `CASE-2026-001`), click **Approve & Lock Certificate**.
   - Show the generated **SHA-256 Cryptographic Hash** locking the record.
   - Click **View Report** to display the official certificate layout.
   - Test **Print / Save PDF**, **Export CSV**, and **JSON Certificate**.

9. **System Audit Trail & Rules Catalogue**:
   - Navigate to **Audit Trail** (`/audit`) to view the immutable append-only history of every observation edit, submission, and approval.
   - Navigate to **OIML Rules Catalogue** (`/rules`) to display the versioned rulesets (`OIML-R76-2006` and `LM-RULES-2011`).

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health and standard version metadata |
| `POST` | `/api/seed/reset` | Reseeds database with clean demo datasets |
| `POST` | `/api/auth/login` | JWT login authentication |
| `GET` | `/api/instruments` | List NAWIs with search and class filters |
| `GET` | `/api/instruments/:id/passport` | Digital Instrument Passport & history |
| `GET` | `/api/instruments/:id/readiness` | Pre-test readiness assessment |
| `POST` | `/api/instruments` | Register new NAWI with Table 1 validation |
| `GET` | `/api/cases` | List evaluation cases with status filters |
| `GET` | `/api/cases/:id` | Case details, test observations, evidence & audit history |
| `POST` | `/api/cases` | Initialize new evaluation workflow |
| `PUT` | `/api/cases/:id/observations` | Save test observations & run deterministic engine |
| `POST` | `/api/cases/:id/submit` | Submit case for reviewer inspection |
| `POST` | `/api/reviews/:id/approve` | Approve & lock case with SHA-256 hash |
| `POST` | `/api/reviews/:id/reject` | Reject case with mandatory justification |
| `POST` | `/api/reviews/:id/create-revision` | Create successor revision (V2, V3...) |
| `POST` | `/api/calculate/weighing` | Calculate error and MPE for weighing point |
| `POST` | `/api/calculate/repeatability` | Calculate range and std dev for repeatability |
| `POST` | `/api/calculate/eccentricity` | Calculate corner loading deviations vs center |
| `POST` | `/api/calculate/zero-tare` | Calculate tare net error vs MPE |
| `POST` | `/api/ai/extract-spec` | AI extraction from manufacturer datasheet text |
| `POST` | `/api/ai/explain-result` | Regulatory explanation generator for test results |
| `GET` | `/api/reports/:id` | Standardized OIML R 76-2 report snapshot |
| `GET` | `/api/reports/:id/csv` | Download CSV table data |
| `GET` | `/api/reports/:id/json` | Download JSON certificate |
| `GET` | `/api/audit` | Query immutable audit trail logs |
| `GET` | `/api/rules` | Browse versioned OIML rulesets |
| `GET` | `/api/stats` | Dashboard statistics & pass rate metrics |

---

## 📜 Regulatory Standards Basis

- **OIML R 76-1:2006**: *Non-automatic weighing instruments — Part 1: Metrological and technical requirements — Tests* (Clauses 3.1, 3.5, A.4.1, A.4.4, A.4.7, A.4.8, A.4.10, A.4.13).
- **OIML R 76-2:2007**: *Non-automatic weighing instruments — Part 2: Test report format*.
- **Department of Consumer Affairs, Government of India**: *Legal Metrology Act, 2009 & Legal Metrology (General) Rules, 2011*.

---

Developed for **Smart India Hackathon 2026** | **Problem Statement 26035**
