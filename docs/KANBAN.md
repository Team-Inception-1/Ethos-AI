# 📋 Ethos AI — Team Kanban Board & Sprint Task Distribution

> **Course / Project:** CSE Course Project — UIU (United International University)  
> **Repository:** [`Team-Inception-1/Ethos-AI`](https://github.com/Team-Inception-1/Ethos-AI)  
> **Evaluation Rubric Alignment:** Evaluated against 7 core criteria (Core Features, Integration Workflow, Backend/DB, Git Collaboration, Code Quality, UI/UX, Documentation & Planning).

---

## 👥 Team Roles & Ownership Matrix

| Member | Primary Handle | Core Specialization | Primary Feature Ownership |
|---|---|---|---|
| **Tasin (Lead)** | `@tasinofficial` (`mtasin223580@bscse.uiu.ac.bd`) | Backend Architecture & Full-Stack Lead | Core Backend API, Auth & RBAC, PostgreSQL/Prisma Schema, Milestone Escrow Engine |
| **Prova** | `@prova` (`prova@gmail.com`) | Frontend Lead, UI/UX & QA | React/Next.js Client, Verified Directory & Compare Tool, Parent-Student Dashboard, Design System |
| **AI / Microservice Dev** | `@tasinofficial` / Collaborator | AI & ML Services | FastAPI Service, OCR Offer Letter Fraud Detector, Agreement Clause Analyzer |
| **DevOps & Integration Dev** | `@prova` / Collaborator | Integration, CI/CD & Testing | E2E Integration Workflow, Docker Compose, Database Seeding, QA & Documentation |

---

## 🎯 Evaluation Criteria Mapping

| Rubric Criterion | Target Deliverables & Milestones | Addressed by Issues |
|---|---|---|
| **1. Core Features Implemented** | 4 working core features: (1) Auth/RBAC, (2) Verified Directory & Comparison, (3) Application Tracking & Docs, (4) Milestone Escrow System, (5) AI Fraud Analysis | `#1`, `#2`, `#3`, `#4`, `#5`, `#6` |
| **2. Feature Integration & Workflow** | Seamless End-to-End student & parent flow: Search agency → Apply → AI Fraud Check → Milestone Payment → Status Tracking | `#7`, `#8` |
| **3. Backend / Database Functionality** | PostgreSQL schema, Node/Express/NestJS API, real CRUD data persistence (no hardcoded state) | `#9`, `#10`, `#11` |
| **4. Git & Team Collaboration** | Feature branch workflow, PR reviews, conventional commits, distributed issues & PRs across all members | `#12`, `#13` |
| **5. Code Quality & SWE Practices** | Modular architecture, TypeScript interfaces/DTOs, centralized error handling, separation of concerns | `#14`, `#15` |
| **6. UI/UX & Usability** | Glassmorphism design system, dark/light theme, responsive mobile views, accessibility & feedback states | `#16`, `#17` |
| **7. Project Organization & Docs** | Comprehensive `README.md`, setup instructions, architecture docs, API specs, and sprint Kanban | `#18`, `#19` |

---

## 📌 Sprint Kanban Board

```
┌─────────────────────────┬─────────────────────────┬─────────────────────────┬─────────────────────────┬─────────────────────────┐
│       📥 BACKLOG        │        📝 TO DO         │     🚀 IN PROGRESS      │    🔍 REVIEW / QA       │        ✅ DONE          │
├─────────────────────────┼─────────────────────────┼─────────────────────────┼─────────────────────────┼─────────────────────────┤
│ • #6 Bangla AI Parent   │ • #9 PostgreSQL & Prisma│ • #1 Real Auth Backend  │ • #16 UI/UX Theme &     │ • #19 Project Scaffold &│
│   Voice Assistant       │   Database Integration  │   API & JWT Session     │   Accessibility Audit   │   Context Definition    │
│ • #8 Real-Time Chat     │ • #10 Express/NestJS    │ • #2 Directory & Search │ • #14 Shared TypeScript │ • #17 Glassmorphism     │
│   & Dispute Resolution  │   REST API Endpoints    │   Filters Live API      │   DTOs & Architecture   │   UI Design System      │
│ • #11 SSLCommerz Live   │ • #5 FastAPI OCR Fraud  │ • #3 Application Tracker│ • #18 Comprehensive     │ • #20 Auth & Profile    │
│   Gateway Sandbox       │   Detection Microservice│   & Document Vault      │   README & Setup Docs   │   Client Mock Skeleton  │
│                         │ • #7 End-to-End Workflow│ • #4 Milestone Escrow   │                         │                         │
│                         │   Integration Test Flow │   Ledger Engine         │                         │                         │
└─────────────────────────┴─────────────────────────┴─────────────────────────┴─────────────────────────┴─────────────────────────┘
```

---

## 📋 Detailed Task Breakdown & Work Distribution

### 🟢 Column: DONE (Sprint 0 / Foundation)

#### Issue #19: Project Context, Architecture Spec & Repository Structure
- **Assignee:** `@tasinofficial`
- **Labels:** `documentation`, `architecture`, `criterion-8`
- **Description:** Defined repository layout, data models, tech stack decisions, and security guidelines in `ETHOS_AI_CONTEXT.md`.
- **Status:** `DONE`

#### Issue #17: Modern Glassmorphism UI Design System & Component Library
- **Assignee:** `@prova`
- **Labels:** `frontend`, `ui/ux`, `criterion-7`
- **Description:** Built reusable `GlassCard`, `Button`, `Badge`, `Navbar`, and responsive layout styles supporting both Dark and Light themes with fluid CSS variables.
- **Status:** `DONE`

#### Issue #20: Client Authentication, Guardian-Student Linking & Profile UI Shell
- **Assignee:** `@tasinofficial`, `@prova`
- **Labels:** `frontend`, `auth`, `criterion-1`
- **Description:** Implemented client-side `AuthContext`, quick demo role switcher (Student, Parent, Agency, Admin), OTP verification step simulation, and Guardian code linking.
- **Status:** `DONE`

---

### 🟡 Column: IN PROGRESS (Sprint 1 — Core Features & Persistence)

#### Issue #1: User Authentication & Role-Based Access Control (RBAC) API
- **Assignee:** `@tasinofficial`
- **Labels:** `backend`, `auth`, `security`, `criterion-1`, `criterion-3`
- **Estimated Effort:** 5 Story Points
- **Branch:** `feature/auth-backend-api`
- **Objective:** Replace client mock auth with real JWT authentication, bcrypt password hashing, role-based authorization middleware (`student`, `parent`, `agency`, `admin`), and OTP verification service.
- **Definition of Done (DoD):**
  - [ ] `POST /api/auth/register` creates user in database with hashed credentials.
  - [ ] `POST /api/auth/login` returns signed JWT and refresh token in HTTP-only cookies.
  - [ ] `POST /api/auth/link-guardian` links parent account to student via unique referral/link code.
  - [ ] Role protection middleware blocks unauthorized role access with `403 Forbidden`.

#### Issue #2: Verified Consultancy Directory & Side-by-Side Comparison Tool
- **Assignee:** `@prova`
- **Labels:** `frontend`, `backend`, `criterion-1`, `criterion-2`, `criterion-7`
- **Estimated Effort:** 5 Story Points
- **Branch:** `feature/directory-compare-module`
- **Objective:** Implement full dynamic search, country/fee/rating filtering, agency detail view, and side-by-side comparison modal for 2–4 agencies.
- **Definition of Done (DoD):**
  - [ ] Filter controls (country, success rate, budget, rating) execute live query filtering.
  - [ ] Agency profile displays verified badge, structured pricing breakdown, and review metrics.
  - [ ] Compare page displays side-by-side table of selected agencies with highlight of hidden charges.
  - [ ] Direct "Apply Now" button links agency to new Application creation flow.

#### Issue #3: Application Lifecycle Tracking System & Secure Document Vault
- **Assignee:** `@tasinofficial`
- **Labels:** `fullstack`, `criterion-1`, `criterion-2`, `criterion-3`
- **Estimated Effort:** 8 Story Points
- **Branch:** `feature/application-tracking-docs`
- **Objective:** Multi-stage application state machine (`submitted` → `under_review` → `offer_received` → `payment_pending` → `visa_processing` → `completed`) with timestamped actor logging and file uploads.
- **Definition of Done (DoD):**
  - [ ] Student can submit application to a chosen agency with target university/program.
  - [ ] Agency can transition application stage with status update notes and document attachments.
  - [ ] Parent linked to student receives updated read-only view of stages in real-time.
  - [ ] Document upload endpoint stores metadata, versions, and provides download links.

#### Issue #4: Milestone-Based Escrow Payment System & Immutable Ledger
- **Assignee:** `@tasinofficial`
- **Labels:** `backend`, `payments`, `security`, `criterion-1`, `criterion-3`
- **Estimated Effort:** 8 Story Points
- **Branch:** `feature/escrow-milestone-ledger`
- **Objective:** Implement escrow payment state machine (`held` → `released` → `disputed` → `refunded`), `PaymentProvider` interface abstraction, poisha integer calculations, and digital receipt generation.
- **Definition of Done (DoD):**
  - [ ] Escrow state machine prevents illegal transitions (e.g. cannot release disputed funds without admin override).
  - [ ] Mock / Sandbox Payment gateway webhook triggers milestone transition to `held`.
  - [ ] Immutable `LedgerEntry` table logs all credits/debits with transaction hash.
  - [ ] Downloadable digital receipt summary view generated upon milestone release.

---

### 🔵 Column: TO DO (Sprint 2 — AI Services & Feature Integration)

#### Issue #5: AI Document Fraud Detection & Agreement Analyzer Microservice
- **Assignee:** `@tasinofficial`
- **Labels:** `ai/ml`, `fastapi`, `criterion-1`, `criterion-3`
- **Estimated Effort:** 8 Story Points
- **Branch:** `feature/ai-fraud-service`
- **Objective:** Stand up FastAPI service with OCR (Tesseract / regex heuristics) to inspect offer letters, compute risk scores (0–100), flag suspicious text, and extract agreement fee clauses.
- **Definition of Done (DoD):**
  - [ ] `POST /api/ai/analyze-offer-letter` receives file and returns `riskScore`, `verdict`, and `flags[]`.
  - [ ] `POST /api/ai/analyze-agreement` parses clauses and highlights hidden fee discrepancies.
  - [ ] Web frontend displays animated gauge score, checkmarks, and actionable warning badges.

#### Issue #7: End-to-End Integrated Workflow (Golden Flow Validation)
- **Assignee:** `@prova`, `@tasinofficial`
- **Labels:** `integration`, `workflow`, `criterion-2`
- **Estimated Effort:** 5 Story Points
- **Branch:** `feature/e2e-workflow-integration`
- **Objective:** Connect all 4 core modules into one seamless end-to-end user journey from registration to visa approval.
- **End-to-End Scenario:**
  1. Student registers & links Parent account.
  2. Student searches directory, compares 2 agencies, and applies to Global Edu BD.
  3. Student uploads received Offer Letter → AI tool scans and gives `LOW RISK (Score: 23)`.
  4. Agency confirms offer → Application moves to `Payment Pending`.
  5. Student/Parent deposits Milestone 1 fee into Escrow.
  6. Agency moves stage to `Visa Processing`.
  7. Parent views real-time status update in Bangla.
- **Definition of Done (DoD):**
  - [ ] Complete workflow executes smoothly without browser errors or manual DB patching.
  - [ ] Automated end-to-end test script or recorded browser walkthrough validates the entire flow.

#### Issue #9: Relational Database Schema & Migrations (PostgreSQL + Prisma)
- **Assignee:** `@tasinofficial`
- **Labels:** `backend`, `database`, `criterion-3`
- **Estimated Effort:** 5 Story Points
- **Branch:** `feature/database-prisma-schema`
- **Objective:** Create complete Prisma schema for `User`, `StudentProfile`, `Agency`, `Application`, `StageEvent`, `Document`, `Milestone`, and `LedgerEntry`. Provide seed script with realistic Bangladeshi consultancy data.
- **Definition of Done (DoD):**
  - [ ] `prisma migrate dev` executes cleanly.
  - [ ] `prisma/seed.ts` populates at least 5 verified agencies, 10 student/parent accounts, sample applications, and payment records.

#### Issue #10: REST API Integration Layer & Centralized HTTP Client
- **Assignee:** `@prova`
- **Labels:** `frontend`, `api-integration`, `criterion-3`, `criterion-5`
- **Estimated Effort:** 3 Story Points
- **Branch:** `feature/frontend-api-client`
- **Objective:** Replace local state fixtures in frontend components (`ApplicationsPage`, `DirectoryPage`, `PaymentsPage`, `DocumentsPage`) with typed API fetch calls, loading skeletons, and error toasts.
- **Definition of Done (DoD):**
  - [ ] Centralized `apiClient` with token interceptor and error normalization.
  - [ ] All table and list views display loading skeletons and graceful empty states.

---

### 🟣 Column: REVIEW & QA (Sprint Quality & SWE Standards)

#### Issue #14: Code Quality, DTO Architecture & Modular Layering
- **Assignee:** `@tasinofficial`
- **Labels:** `code-quality`, `refactoring`, `criterion-5`
- **Description:** Ensure strict TypeScript typing, avoid `any`, separate UI components from business logic hooks, add basic input validation, and verify error boundaries.

#### Issue #16: Accessibility, Responsive Layout & UI/UX Usability Polish
- **Assignee:** `@prova`
- **Labels:** `ui/ux`, `accessibility`, `criterion-7`
- **Description:** Verify ARIA labels on all interactive controls, contrast ratios across dark/light modes, seamless mobile navigation drawer, and intuitive feedback tooltips.

#### Issue #18: Project Documentation, Quickstart Guides & Evaluation Pitch
- **Assignee:** `@prova`, `@tasinofficial`
- **Labels:** `documentation`, `criterion-8`
- **Description:** Complete root `README.md` with installation steps, environment variables, architectural diagrams, API reference, team contribution log, and demo video links.

---

### ⚪ Column: BACKLOG (Future Enhancements / Post-MVP)

- **Issue #6:** Bangla AI Voice & Chat Assistant for Parents (`@prova`, `@tasinofficial`) — *Criterion 1*
- **Issue #8:** Real-time End-to-End Chat & Dispute Resolution Panel (`@tasinofficial`) — *Criterion 2*
- **Issue #11:** SSLCommerz & bKash Live Payment Gateway Webhook Integration (`@tasinofficial`) — *Criterion 3*
- **Issue #13:** Automated CI/CD GitHub Actions Workflow for Lint, Test & Docker Build (`@prova`) — *Criterion 4*

---

## 🔄 Git Branching & Contribution Protocol (Criterion 4)

To guarantee high marks on **Criterion 4 (Git & Team Collaboration)**:
1. **Branch Naming Standard:**
   - Features: `feature/<issue-number>-<short-description>` (e.g. `feature/1-auth-jwt-api`)
   - Bug fixes: `bugfix/<issue-number>-<short-description>`
   - Documentation: `docs/<short-description>`
2. **Commit Message Format (Conventional Commits):**
   - `feat(auth): implement JWT login and password hashing (#1)`
   - `feat(directory): add side-by-side comparison modal (#2)`
   - `fix(escrow): prevent milestone release on disputed status (#4)`
   - `docs(readme): add docker setup instructions and architecture diagram (#18)`
3. **Pull Request (PR) Policy:**
   - Every PR must reference its GitHub Issue (e.g. `Closes #1`).
   - Every PR requires at least **1 peer review approval** (Tasin reviews Prova's PRs, Prova reviews Tasin's PRs).
   - PR must include a short summary of changes and before/after screenshots for UI changes.
