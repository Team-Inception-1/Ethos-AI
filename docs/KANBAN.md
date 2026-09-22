# 📋 Ethos AI — Team Kanban Board & Sprint Task Distribution

> **Course / Project:** CSE Course Project — UIU (United International University)
> **Repository:** [`Team-Inception-1/Ethos-AI`](https://github.com/Team-Inception-1/Ethos-AI)
> **Board:** Tracked via [GitHub Issues](https://github.com/Team-Inception-1/Ethos-AI/issues) (`K-01`…`K-24`) + the org's GitHub Projects board.
> **Evaluation Rubric Alignment:** Evaluated against 7 core criteria (Core Features, Integration Workflow, Backend/DB, Git Collaboration, Code Quality, UI/UX, Documentation & Planning).
> **Last redistributed:** Sprint 2 kickoff — remaining work divided so **AI/ML is owned exclusively by Tasin & Sourav**, and Backend/Frontend/QA-Docs work is spread across Sudiip, Jannat, and Taha.

---

## 👥 Team Roles & Ownership Matrix

| Member | GitHub Handle | Specialization | Primary Ownership Area |
|---|---|---|---|
| **Tasin (Lead)** | [`@tasinofficial`](https://github.com/tasinofficial) | Full-Stack Architecture Lead + **AI/ML** | Project architecture, AI microservice integration, Scam-alert risk classifier, AI Agreement Analyzer, AI Tools ↔ Directory live wiring |
| **Sourav** | [`@Souravg223`](https://github.com/Souravg223) | **AI/ML** + Frontend | AI microservice scaffold, OCR fraud detection engine, AI Counselor recommendation engine, Bangla assistant, UI design system |
| **Sudiip** | [`@SudiipPaul`](https://github.com/SudiipPaul) | Backend & Frontend Integration | Auth/RBAC API, application tracking backend, directory & comparison frontend, live API client wiring |
| **Jannat** | [`@jannatferdo`](https://github.com/jannatferdo) | QA, Accessibility & Documentation | E2E workflow testing, code quality pass, accessibility audit, demo script, README |
| **Taha** | [`@Taha-Mim-Tasfa`](https://github.com/Taha-Mim-Tasfa) | Backend & DevOps | Database schema/migrations, escrow ledger engine, real-time chat, API reliability QA, CI/CD pipeline |

> **Note:** Only **Tasin** and **Sourav** are assigned AI/ML-labeled (`ai-ml`) issues — this is an explicit, intentional split so the two AI/ML-focused members carry that entire workstream between them. The other three members (Sudiip, Jannat, Taha) own the remaining backend, frontend, and QA/DevOps/documentation workload.

---

## 🎯 Evaluation Criteria Mapping

| Rubric Criterion | Target Deliverables & Milestones | Addressed by Issues |
|---|---|---|
| **1. Core Features Implemented** | Auth/RBAC, Verified Directory & Comparison, Application Tracking & Docs, Milestone Escrow, AI Fraud/Counselor Suite | `#6` `#7` `#8` `#10` `#16` `#22` `#23` `#24` |
| **2. Feature Integration & Workflow** | Seamless End-to-End student & parent flow: Search → Apply → AI Fraud Check → Escrow → Status | `#9` `#25` |
| **3. Backend / Database Functionality** | PostgreSQL/Prisma schema, real CRUD persistence, FastAPI AI microservice | `#6` `#7` `#10` `#14` `#22` |
| **4. Git & Team Collaboration** | Feature branch workflow, PR reviews, conventional commits, CI checks | `#2` `#20` |
| **5. Code Quality & SWE Practices** | TypeScript strictness, DTOs, centralized error handling, API reliability | `#12` `#13` `#25` |
| **6. UI/UX & Usability** | Neubrutalism design system, dark/light theme, accessibility, Bangla localization | `#1` `#15` `#19` |
| **7. Project Organization & Docs** | README, architecture docs, sprint Kanban, demo script | `#5` `#18` |

---

## 📌 Sprint Kanban Board

```
┌─────────────────────────┬─────────────────────────┬─────────────────────────┬─────────────────────────┬─────────────────────────┐
│       📥 BACKLOG        │        📝 TO DO         │     🚀 IN PROGRESS      │    🔍 REVIEW / QA       │        ✅ DONE          │
├─────────────────────────┼─────────────────────────┼─────────────────────────┼─────────────────────────┼─────────────────────────┤
│ • #23 AI Counselor      │ • #6  Auth/RBAC JWT API │ • #7  App Tracking &    │ • #13 Code Quality Pass │ • #1  UI Design System  │
│   Recommendation Engine │   (Sudiip)              │   Document Vault        │   (Jannat)              │   (Sourav)              │
│   (Sourav)              │ • #16 AI Agreement      │   (Sudiip)              │ • #15 Accessibility     │ • #2  Repo Hygiene &    │
│                         │   Clause Highlighter    │ • #8  Directory Filters │   Pass (Jannat)         │   Issue Scripts (Taha)  │
│                         │   (Tasin)               │   & Compare (Sudiip)    │                         │ • #3  Project Setup &   │
│                         │ • #22 AI Microservice   │                         │                         │   Context Doc (Tasin)   │
│                         │   Scaffold + OCR Fraud  │                         │                         │ • #4  Auth/Profile      │
│                         │   Detection (Sourav)    │                         │                         │   Shell (Sudiip)        │
│                         │ • #23 Scam Alert Risk   │                         │                         │ • #5  README (Jannat)   │
│                         │   Classifier (Tasin)    │                         │                         │ • #10 Escrow Milestone  │
│                         │ • #25 Wire AI Tools ↔   │                         │                         │   Ledger Engine (Taha)  │
│                         │   Live Microservice     │                         │                         │ • #11 API Reliability   │
│                         │   (Tasin)               │                         │                         │   & Edge-Case QA (Taha) │
│                         │ • #9  E2E Workflow Test │                         │                         │ • #14 Prisma Schema &   │
│                         │   (Jannat)              │                         │                         │   Seed Data (Taha)      │
│                         │ • #12 Frontend↔API      │                         │                         │ • #17 Real-Time Chat    │
│                         │   Client Wiring (Sudiip)│                         │                         │   (Taha)                │
│                         │ • #18 Demo Script       │                         │                         │ • #20 CI/CD Pipeline    │
│                         │   (Jannat)              │                         │                         │   Checks (Taha)         │
│                         │ • #19 Bangla Guardian   │                         │                         │                         │
│                         │   Assistant (Sourav)    │                         │                         │                         │
└─────────────────────────┴─────────────────────────┴─────────────────────────┴─────────────────────────┴─────────────────────────┘
```

---

## 📋 Detailed Task Breakdown & Work Distribution

### 🟢 Column: DONE (Sprint 0 / Foundation)

#### Issue #3 — K-01: Project Setup, Folder Structure & Architecture Context Document
- **Assignee:** [`@tasinofficial`](https://github.com/tasinofficial)
- **Labels:** `documentation`
- **Description:** Defined repository layout, data models, tech stack decisions, and security guidelines in `ETHOS_AI_CONTEXT.md`.

#### Issue #1 — K-03: UI Design System (Neubrutalism Components & Theming)
- **Assignee:** [`@Souravg223`](https://github.com/Souravg223)
- **Labels:** `frontend`
- **Description:** Owns the `GlassCard`, `Button`, `Badge`, `Navbar` component library and the dark/light theme token system (currently the **Neubrutalism** design system — thick borders, hard offset shadows, flat color).

#### Issue #4 — K-02: Initial Auth/Profile Shell & Role Switching Screens
- **Assignee:** [`@SudiipPaul`](https://github.com/SudiipPaul)
- **Labels:** `frontend`
- **Description:** Client-side `AuthContext`, demo role switcher (Student/Parent/Agency/Admin), OTP step simulation, Guardian code linking UI.

#### Issue #5 — K-04: Repository README with Setup & Module Overview
- **Assignee:** [`@jannatferdo`](https://github.com/jannatferdo)
- **Labels:** `documentation`

#### Issue #2 — K-05: Base Scripts for Issue/Project Workflow & Repo Hygiene
- **Assignee:** [`@Taha-Mim-Tasfa`](https://github.com/Taha-Mim-Tasfa)
- **Labels:** `qa-devops`

---

### 🚀 Column: IN PROGRESS (Sprint 1 — Core Features & Persistence)

#### Issue #7 — K-07: Application Stage Tracking & Secure Document Vault
- **Assignee:** [`@SudiipPaul`](https://github.com/SudiipPaul)
- **Labels:** `backend`
- **Objective:** Multi-stage application state machine (`submitted` → `under_review` → `offer_received` → `payment_pending` → `visa_processing` → `completed`) with timestamped actor logging and file uploads.
- **DoD:** student submits application; agency transitions stage with notes/attachments; parent sees read-only synced view; document endpoint returns versioned download links.

#### Issue #8 — K-08: Directory Filters & Agency Comparison Workflow
- **Assignee:** [`@SudiipPaul`](https://github.com/SudiipPaul)
- **Labels:** `frontend`
- **Objective:** Live filtering (country, success rate, budget, rating) and side-by-side comparison of 2–4 agencies.
- **DoD:** filter controls query live; compare table highlights hidden charges; "Apply Now" links into the application flow.

#### Issue #10 — K-10: Escrow Milestone Flow & Immutable Ledger
- **Assignee:** [`@Taha-Mim-Tasfa`](https://github.com/Taha-Mim-Tasfa)
- **Labels:** `backend`
- **Objective:** Escrow state machine (`held` → `released` → `disputed` → `refunded`), `PaymentProvider` interface, poisha integer arithmetic, append-only `LedgerEntry` table, digital receipts.
- **DoD:** illegal transitions blocked (e.g. release while disputed); sandbox gateway webhook triggers `held`; ledger is append-only with transaction hash; receipt view generated on release.
- **Status:** ✅ Implemented. Strict FSM in `apps/web/src/lib/escrowStateMachine.ts` with all invariants enforced; pluggable `PaymentProvider` interface for SSLCommerz, bKash, Nagad in `paymentProviders.ts`; SHA-256 chained immutable ledger in `db.ts`; REST endpoints `GET /api/escrow/milestones`, `POST /api/escrow/pay`, `POST /api/escrow/release`, `POST /api/escrow/dispute`, `POST /api/escrow/refund`, `POST /api/escrow/webhook`, `GET /api/escrow/ledger`, `GET /api/escrow/receipts/[id]`; live `PaymentsPage.tsx` wired to escrow client.

---

### 📝 Column: TO DO (Sprint 2 — AI Services, Backend Depth & Integration)

#### Issue #6 — K-06: JWT Auth + RBAC Middleware + Guardian Linking API
- **Assignee:** [`@SudiipPaul`](https://github.com/SudiipPaul)
- **Labels:** `backend`
- **Objective:** Replace client mock auth with real JWT auth, bcrypt hashing, RBAC middleware (`student`/`parent`/`agency`/`admin`), OTP verification service.
- **DoD:** `POST /api/auth/register`, `POST /api/auth/login` (HTTP-only cookie JWT + refresh), `POST /api/auth/link-guardian`, role-guard middleware returns `403` on violation.

#### Issue #14 — K-11: PostgreSQL Schema + Prisma Migrations + Seed Data
- **Assignee:** [`@Taha-Mim-Tasfa`](https://github.com/Taha-Mim-Tasfa)
- **Labels:** `backend`
- **Objective:** Full Prisma schema for `User`, `StudentProfile`, `Agency`, `Application`, `StageEvent`, `Document`, `Milestone`, `LedgerEntry` per `ETHOS_AI_CONTEXT.md` §6, plus realistic Bangladeshi-consultancy seed data.
- **Status:** ✅ Implemented (`prisma/schema.prisma`, `prisma/migrations/20250101000000_init/migration.sql`, `prisma/seedData.json`, `prisma/seed.ts`, `apps/web/src/lib/db.ts`). Full 19-entity relational model with Poisha-level integer currency arithmetic, DDL migration scripts, and seed data covering 6 Bangladeshi consultancies, student/parent guardian links, milestone escrows, and audit logs.

#### Issue #17 — K-16: Real-Time Chat Between Student and Agency
- **Assignee:** [`@Taha-Mim-Tasfa`](https://github.com/Taha-Mim-Tasfa)
- **Labels:** `backend`
- **Objective:** Encrypted-in-transit chat (Module 5.12), immutable history, exportable as dispute evidence, attachments reuse the Document Vault (#7).
- **Status:** ✅ Implemented (`apps/web/src/app/api/chat/**`, `apps/web/src/lib/chatClient.ts`, `apps/web/src/components/pages/ChatPage/**`). REST API for chat thread lifecycle, message streams with SHA-256 integrity hashes, Document Vault attachment previews, and one-click certified JSON/audit dispute transcript export tool.

#### Issue #12 — K-12: Connect Frontend Pages to Real API Client
- **Assignee:** [`@SudiipPaul`](https://github.com/SudiipPaul)
- **Labels:** `frontend`
- **Objective:** Replace local-state fixtures in `ApplicationsPage`, `DirectoryPage`, `PaymentsPage`, `DocumentsPage` with a centralized typed `apiClient`, token interceptor, loading skeletons, error toasts.

#### Issue #9 — K-09: End-to-End Workflow Test (Register → Apply → Escrow → Status)
- **Assignee:** [`@jannatferdo`](https://github.com/jannatferdo)
- **Labels:** `qa-devops`
- **Objective:** Validate the full golden-flow scenario end-to-end without manual DB patching; produce an automated test script or recorded walkthrough.

#### Issue #18 — K-19: Demo Script + Walkthrough Checklist for Evaluation
- **Assignee:** [`@jannatferdo`](https://github.com/jannatferdo)
- **Labels:** `qa-devops`

#### Issue #20 — K-20: Deployment Pipeline Checks (Lint/Test/Build) for PRs
- **Assignee:** [`@Taha-Mim-Tasfa`](https://github.com/Taha-Mim-Tasfa)
- **Labels:** `qa-devops`
- **Objective:** GitHub Actions workflow gating every PR on lint, typecheck, and build success.
- **Status:** ✅ Implemented. `.github/workflows/deploy-checks.yml` — three-job pipeline: (1) Web: ESLint + `tsc --noEmit` + `next build`, (2) Escrow QA: runs `scripts/test-escrow-api.ts` suite via Node native strip-types, (3) AI Service: Pytest offline suite. Triggers on push to `main` and all PRs targeting `main`.

---

### 🤖 AI / ML Workstream — Owned by Tasin & Sourav

> All four issues below carry the `ai-ml` label. This workstream is deliberately isolated to Tasin and Sourav so AI/ML ownership is unambiguous; no other team member is assigned `ai-ml` work this sprint.

#### Issue #22 — K-21: FastAPI AI Microservice Scaffold + Offer-Letter OCR Fraud Detection Engine
- **Assignee:** [`@Souravg223`](https://github.com/Souravg223)
- **Labels:** `ai-ml`
- **Module:** 5.8 (Fake Document Detection)
- **Objective:** Stand up `apps/ai-service` (FastAPI, isolated from the Node core API per `ETHOS_AI_CONTEXT.md` §10) with an offer-letter OCR pipeline (Tesseract, fallback Google Vision), template/structural consistency checks, sender-domain authenticity check, and 0–100 risk scoring.
- **DoD:** `apps/ai-service` scaffolded with Dockerfile + `/health`; `POST /api/ai/analyze-offer-letter` returns `{ riskScore, verdict, flags[] }`; domain check flags spoofed senders; unit tests over 3+ sample documents.

#### Issue #16 — K-17: AI Agreement Clause Highlighter for Refund Risks
- **Assignee:** [`@tasinofficial`](https://github.com/tasinofficial)
- **Labels:** `ai-ml`
- **Module:** 5.9 (Smart Agreement Analyzer)
- **Objective:** LLM-based clause extraction from uploaded agreements (fee, refund, cancellation, liability clauses) into structured JSON; compare extracted fees against declared structured pricing (5.4) to flag hidden-charge mismatches; plain-language explanation of ambiguous/contradictory refund language.
- **Status:** ✅ Implemented in `apps/ai-service` (FastAPI). Pluggable `AgreementLLM` provider abstraction (Gemini + offline `FakeAgreementLLM` fallback), `POST /api/ai/analyze-agreement` (multipart) and `/analyze-agreement/text` (JSON) endpoints, hidden-fee + ambiguous/contradictory-refund flag logic, 22 passing unit/API tests (fully offline). See `apps/ai-service/README.md` for the API contract consumed by #25.

#### Issue #23 — K-22: Scam Alert Risk Classifier for Agency Listings & Chat Content
- **Assignee:** [`@tasinofficial`](https://github.com/tasinofficial)
- **Labels:** `ai-ml`
- **Module:** 5.10 (Scam Alert System)
- **Objective:** Text-pattern + LLM classifier scanning agency marketing copy, chat, and agreement text for predatory claims (e.g. "100% visa guarantee"); rolling per-agency `riskScore` combining flags + complaint history + review sentiment.
- **DoD:** `POST /api/ai/scan-content` returns `{ flags[], severity }`; ≥10 rule-based predatory-phrase patterns pre-filter before LLM escalation; risk badge surfaces on the Directory/Agency profile UI.
- **Status:** ✅ Implemented in `apps/ai-service` (FastAPI). Two-tier detection: 14 regex predatory-phrase patterns (exceeds the ≥10 DoD) across guarantee-claim/urgency-pressure/unverifiable-credential/payment-pressure categories, always followed by pluggable `ScamLLM` escalation (Gemini + offline `FakeScamLLM` fallback) for subtler phrasing. `POST /api/ai/scan-content` returns `{ flags[], severity }`; optional `agency_id` folds flags into a rolling in-memory `AgencyRiskScore` exposed via `GET /api/ai/agencies/{id}/risk-score`; `POST /api/ai/agencies/{id}/risk-events` lets the core Node API push complaint/review-sentiment events into the same score. 32 passing unit/API tests (fully offline). Frontend risk-badge wiring is #25's job — this issue delivers the backend contract only.

#### Issue #24 — K-23: AI Counselor Chatbot — Recommendation Engine & Admission-Chance Heuristic
- **Assignee:** [`@Souravg223`](https://github.com/Souravg223)
- **Labels:** `ai-ml`
- **Module:** 5.18 (AI Counselor Chatbot) & 5.11 (Bangla AI Assistant)
- **Objective:** Country/university recommendations from student profile (grades, budget, target field, test scores); rule-based admission-chance heuristic (upgradeable to a trained model later); personalized roadmap generator feeding into the Application Tracker (#7).
- **Status:** ✅ Implemented in `apps/ai-service` (FastAPI) and `apps/web` (Next.js). Rule-based matching engine across 7 destination countries (USA, UK, Canada, Australia, Germany, Sweden, Malaysia), Dream/Target/Safe tier categorization with admission chance odds, bank solvency proof calculation in BDT Lakhs, study gap risk detection, 6-phase application roadmap generator, pluggable bilingual (English & Bangla) `CounselorLLM` provider (Gemini + offline `FakeCounselorProvider`), full Next.js UI at `/counselor` with Neubrutalism design system, profile auto-fill, and 9 passing unit/API tests (83 tests passing suite-wide).

#### Issue #25 — K-24: Wire AI Tools Page & Directory Risk Badges to the Live AI Microservice
- **Assignee:** [`@tasinofficial`](https://github.com/tasinofficial)
- **Labels:** `ai-ml`
- **Objective:** Replace mocked risk-gauge/flags/clauses in `AIToolsPage` and static risk badges in `DirectoryPage` with live calls to the endpoints delivered in #22, #16, #23 — following the same API-client pattern established in #12.
- **DoD:** live calls to `analyze-offer-letter` / `analyze-agreement`; Directory risk badges pull from #23's live `riskScore`; loading skeleton + error toast on latency/failure; zero mocked AI data left in committed code.

#### Issue #19 — K-18: Bangla Guardian Summary Cards & Voice Playback
- **Assignee:** [`@Souravg223`](https://github.com/Souravg223)
- **Labels:** `ai-ml`
- **Module:** 5.11 (Bangla AI Assistant)
- **Objective:** Bangla-first plain-language application-status summaries for the Parent Dashboard (reusing the same tracking data source as #7, no separate source of truth), with optional voice playback.

---

### 🔍 Column: REVIEW / QA

#### Issue #13 — K-14: Code Quality Pass (Strict Typing, Validation, Error Handling)
- **Assignee:** [`@jannatferdo`](https://github.com/jannatferdo)
- **Labels:** `qa-devops`
- **Description:** Strict TypeScript typing (no `any`), separation of UI components from business-logic hooks, input validation, error boundary verification.

#### Issue #15 — K-13: Accessibility Pass (Labels, Contrast, Keyboard Nav)
- **Assignee:** [`@jannatferdo`](https://github.com/jannatferdo)
- **Labels:** `frontend`
- **Description:** ARIA labels on all interactive controls, contrast ratios across dark/light Neubrutalism themes, mobile navigation drawer, feedback tooltips.

#### Issue #11 — K-15: Verify API Reliability & Edge-Case Behavior for Payment/Doc Flows
- **Assignee:** [`@Taha-Mim-Tasfa`](https://github.com/Taha-Mim-Tasfa)
- **Labels:** `qa-devops`
- **Status:** ✅ Implemented. `scripts/test-escrow-api.ts` — 31-test suite validating: all legal/illegal FSM transitions, Poisha precision integer arithmetic, `EscrowTransitionError` class, ledger type mapping, and edge cases (tamper detection, terminal state enforcement, idempotency invariants). Zero external dependencies; runs via Node 22/24 native strip-types.

---

## 🧮 Workload Summary (this sprint)

| Member | AI/ML Issues | Backend Issues | Frontend Issues | QA/DevOps/Docs Issues | Total Open |
|---|---:|---:|---:|---:|---:|
| **Tasin** | 3 (`#16` `#23` `#25`) | – | – | – | 3 |
| **Sourav** | 3 (`#19` `#22` `#24`) | – | – | – | 3 |
| **Sudiip** | 0 | 2 (`#6` `#7`) | 2 (`#8` `#12`) | – | 4 |
| **Jannat** | 0 | – | 1 (`#15`) | 3 (`#9` `#13` `#18`) | 4 |
| **Taha** | 0 | 0 ✅ (`#10` `#14` `#17` closed) | – | 0 ✅ (`#11` `#20` closed) | **0** |

> Foundation/DONE issues (`#1`–`#5`) are excluded from this table as they are already closed-out ownership records, not active workload.

---

## 🔄 Git Branching & Contribution Protocol (Criterion 4)

To guarantee high marks on **Criterion 4 (Git & Team Collaboration)**:
1. **Branch Naming Standard:**
   - Features: `feature/<issue-number>-<short-description>` (e.g. `feature/6-auth-jwt-api`)
   - Bug fixes: `bugfix/<issue-number>-<short-description>`
   - Documentation: `docs/<short-description>`
2. **Commit Message Format (Conventional Commits):**
   - `feat(auth): implement JWT login and password hashing (#6)`
   - `feat(directory): add side-by-side comparison modal (#8)`
   - `fix(escrow): prevent milestone release on disputed status (#10)`
   - `feat(ai): implement OCR fraud detection pipeline (#22)`
   - `docs(kanban): redistribute sprint 2 task ownership (#26)`
3. **Pull Request (PR) Policy:**
   - Every PR must reference its GitHub Issue (e.g. `Closes #6`).
   - Every PR requires at least **1 peer review approval** before merge.
   - PR must include a short summary of changes and before/after screenshots for UI changes.
   - AI/ML PRs (`#16` `#19` `#22` `#23` `#24` `#25`) should cross-review between Tasin ↔ Sourav since they own that full workstream together.
