# Ethos AI — Project Context for Coding Agents

> **Purpose of this document**: This is a standalone context/spec file intended to be loaded into an
> agentic coding tool (e.g. Antigravity, Claude Code, Cursor) at the start of a build session. It gives
> the agent everything needed to understand the product, architecture, data model, and priorities without
> further back-and-forth. Treat every section below as authoritative unless the human developer overrides it.

---

## 1. Project Summary

**Name:** Ethos AI — "The Future of Study-Abroad Consulting"
**One-liner:** A trust-and-payments platform that protects Bangladeshi students and parents from
fraudulent study-abroad consultancies through verification, transparent pricing, escrow-based
milestone payments, and AI-powered document/agreement fraud detection.

**Target users:**
- **Students** applying to study abroad (primary user, mobile-first)
- **Parents** who often fund and co-manage the process, need Bangla-language support
- **Consultancy agencies** (B2B side — verified partners, subscription customers)
- **Platform admins** — verification review, dispute resolution, compliance

**Core problem being solved:** Bangladesh has no mandatory licensing regime for overseas-education
agents. 70,000–90,000 students/year are exposed to fraud risk (fake offer letters, hidden fees, no
recourse). A 2025 case saw a single agency scam students out of Tk 18.29 crore using forged offer
letters. Ethos AI closes this gap with verification, escrow, and AI-based fraud detection.

---

## 2. Product Pillars

1. **Trust Layer** — verified consultancy directory, ratings, transparent pricing/refund policy.
2. **Financial Protection** — milestone/escrow-based payments instead of lump-sum upfront payment.
3. **AI Fraud Detection** — fake offer letter detection, agreement clause analysis, scam-claim flagging.
4. **Accessibility** — Bangla-language AI assistant and status summaries for parents.
5. **Accountability** — full audit trail: chats, receipts, document versions, dispute system.

---

## 3. Tech Stack (decided — do not deviate without discussion)

| Layer | Choice | Notes |
|---|---|---|
| Web frontend | **React.js** (Vite or Next.js — prefer Next.js for SSR/SEO on the directory pages) | Student/parent web dashboard, agency web portal |
| Mobile frontend | **Flutter** | Student/parent mobile app (Android-first, given BD market) |
| Backend API | **Node.js (NestJS/Express)** for core CRUD + **FastAPI (Python)** for AI/ML services | Split: business-logic API vs AI microservice |
| Database | **PostgreSQL** | Primary relational store (users, agencies, applications, payments) |
| Cache/Queue | **Redis** | Session cache, rate limiting, background job queue (BullMQ or Celery) |
| Document OCR | **Tesseract** (self-hosted) with fallback to **Google Vision API** | Offer letter / receipt text extraction |
| AI/LLM | LLM-based clause extraction & summarization (OpenAI/Anthropic/local model — pluggable) | Agreement analysis, Bangla summaries, AI Counselor chatbot |
| Payments | **SSLCommerz**, **bKash**, **Nagad** | Local payment gateways; abstracted behind a `PaymentProvider` interface |
| Storage | S3-compatible object storage (e.g. AWS S3 / DigitalOcean Spaces) | Encrypted document storage |
| CI/CD | **Docker** + **GitHub Actions** | Containerized services, automated build/test/deploy |
| Auth | JWT + refresh tokens, OTP (email & SMS) for verification | Role-based access control (Student, Parent, Agency, Admin) |

**Architecture style:** Modular monolith to start (faster to ship for a course/MVP timeline), with the
AI/OCR/LLM workloads split into a separate FastAPI service from day one so they can be scaled or
swapped independently. Communicate between Node service and FastAPI service via internal REST or a
message queue for async jobs (document scanning, clause analysis).

---

## 4. Suggested Repository Layout

```
ethos-ai/
├── apps/
│   ├── web/                 # React/Next.js frontend (student, parent, agency portal)
│   ├── mobile/               # Flutter app
│   ├── api/                  # Node.js/NestJS core backend (auth, directory, escrow, tracking, chat)
│   └── ai-service/           # FastAPI service (OCR, fraud detection, clause analysis, AI counselor)
├── packages/
│   ├── shared-types/         # Shared TS types/DTOs between web, mobile (via codegen), api
│   └── ui/                   # Shared design system components (web)
├── infra/
│   ├── docker/                # Dockerfiles per service
│   ├── docker-compose.yml     # Local dev orchestration (postgres, redis, api, ai-service, web)
│   └── github-actions/        # CI/CD workflows
├── docs/
│   └── ETHOS_AI_CONTEXT.md   # this file
└── README.md
```

---

## 5. Core Feature Modules

Each module below should be treated as a discrete, independently testable slice. Build in the order
listed under **Section 9 (Roadmap)** — don't try to build everything in parallel.

### 5.1 User Authentication & Profile
- Email + phone registration, OTP verification (both channels)
- Roles: `student`, `parent`, `agency`, `admin`
- Parent accounts can be **linked** to one or more student accounts (guardian relationship), with
  read access to that student's application status and documents
- Role-based dashboard routing
- Profile fields: name, contact, target countries, education background (for student); linked
  student(s) (for parent); agency license/registration docs (for agency, pending verification)

### 5.2 Verified Consultancy Directory
- Agency profile: name, license status (`verified` / `pending` / `rejected`), founded year, countries
  served, universities partnered, success rate, service catalogue
- Rating & review system (only students with a completed/active application with that agency can review)
- Filters: country, target university, price range, success rate, rating
- Verification badge logic driven by admin review + document checks (business registration, past
  complaint history)

### 5.3 Consultancy Comparison Tool
- Select 2–4 agencies → side-by-side table: fees, refund policy summary, success rate, services
  included, response time, rating
- Should reuse the same `AgencyProfile` DTO used in the directory — no separate data model

### 5.4 Transparent Pricing & Policy View
- Structured (not free-text-only) fee breakdown per agency: `serviceName`, `amount`, `whenCharged`
  (milestone-linked), `refundable` (bool), `conditions`
- Refund policy stored as structured clauses (see AI Agreement Analyzer, 5.9) plus raw document
- "Hidden charge" flag: any fee not disclosed in the structured breakdown but found in the uploaded
  agreement by the AI analyzer gets auto-flagged for admin + user review

### 5.5 Document Management System
- Upload types: offer letter, payment receipt, signed agreement, passport/ID, academic transcripts
- Store in encrypted object storage; DB stores metadata + pointer, never raw file blobs in Postgres
- Versioning: re-uploads create a new version, keep history
- Access control: student/parent owner + linked agency (if application is active) + admin (audit only)

### 5.6 Application Tracking System
- Stage machine per application: `submitted` → `under_review` → `offer_received` →
  `payment_pending` → `visa_processing` → `visa_approved`/`visa_rejected` → `completed`
- Each stage transition timestamped, actor-logged (who changed it), optional note/document attached
- Real-time updates via WebSocket or polling to student/parent dashboard

### 5.7 Milestone Payment System ⭐ (key differentiator)
- Payments held in **escrow** (via partner/PSP or an internal ledger + payment gateway hold), released
  per milestone (e.g. 30% on offer letter confirmed, 40% on visa filing, 30% on visa approval)
- Milestone schema: `applicationId`, `milestoneName`, `amount`, `releaseCondition`, `status`
  (`held`/`released`/`disputed`/`refunded`)
- Full payment history log, immutable (append-only ledger table)
- Integration layer: `PaymentProvider` interface implemented by `SSLCommerzProvider`, `BkashProvider`,
  `NagadProvider` — swap/add providers without touching business logic

### 5.8 Fake Document Detection (AI)
- Input: uploaded offer letter (image/PDF)
- Pipeline: OCR (Tesseract, fallback Google Vision) → text extraction → structural/format checks
  against known-good templates per university → LLM cross-check of extracted claims (university name,
  program, dates) against public university data where feasible
- Email authenticity check: verify sender domain matches official university domain patterns, check
  for spoofing indicators
- Output: `riskScore` (0–100), `flags[]` (e.g. "font mismatch", "domain not university-owned",
  "no matching program found"), `verdict` (`likely_genuine` / `needs_review` / `likely_fake`)

### 5.9 Smart Agreement Analyzer (AI)
- Input: uploaded agreement PDF/doc
- LLM-based clause extraction: pulls out fee clauses, refund clauses, cancellation terms, liability
  clauses into structured JSON
- Compares extracted fees against the agency's declared structured pricing (5.4) → flags mismatches
- Flags complex/ambiguous refund language (e.g. vague conditions, contradictory clauses) with a
  plain-language explanation

### 5.10 Scam Alert System (AI)
- Text-pattern + LLM classifier scanning agency marketing copy, chat messages, and agreement text for
  predatory claims (e.g. "100% visa guarantee", "guaranteed admission")
- Produces a `riskScore` per agency (rolling, based on flagged content + complaint history + review
  sentiment) shown on the agency's public profile

### 5.11 Bangla AI Assistant
- Chat-based assistant, Bangla-first, English fallback
- Two jobs: (a) explain application status in plain Bangla ("আপনার আবেদন এখন ভিসা প্রসেসিং ধাপে আছে"),
  (b) answer general process questions
- Should read from the same application/status data as the tracking system — no separate source of truth

### 5.12 Secure Chat System
- Encrypted (at least in transit, ideally at rest) chat between student/parent and agency
- Chat history immutable, exportable as evidence for disputes
- Attachments reuse the Document Management System (5.5)

### 5.13 Digital Receipt & Proof System
- Auto-generated PDF receipt on every payment/milestone release
- Transaction verification log: hash or reference ID tied to the payment gateway's transaction ID

### 5.14 Complaint & Dispute System
- Student/parent can file a complaint against an agency, tied to a specific application/payment
- Dispute states: `open` → `under_investigation` → `resolved` / `escalated`
- Escrow holds can be frozen automatically when a dispute is opened on a milestone payment
- Admin panel for dispute resolution with full evidence trail (chat, documents, payment history)

### 5.15 Verification Report (Paid — Tk 299)
- On-demand deep verification report for a given agency, generated from: license check, complaint
  history, AI risk scores (5.9, 5.10), review sentiment analysis
- Paywall: Tk 299 one-time purchase per report, delivered as PDF + in-app view

### 5.16 Agency Subscription Panel (B2B)
- Tiered subscription (e.g. Basic/Premium) for agencies: premium placement in directory search,
  analytics dashboard (profile views, inquiry conversion, comparison appearances)
- Billing via the same `PaymentProvider` abstraction

### 5.17 Transaction & Service Fees
- Small percentage or flat fee per escrow transaction release
- Application management fee (optional, per application, agency-side)

### 5.18 AI Counselor Chatbot
- Personalized guidance: country/university recommendations based on student profile
  (grades, budget, target field, English test scores)
- Admission-chance prediction (heuristic/ML model — start rule-based, upgrade to trained model later)
- Budget-based destination suggestions
- Visa readiness & risk analysis (checklist-driven initially)
- Personalized application roadmap generator (turns recommendations into tracked application stages,
  feeding into 5.6)

---

## 6. Core Data Model (initial entity sketch)

```
User            (id, role, name, email, phone, verified, createdAt)
StudentProfile  (userId, targetCountries[], education[], budgetRange, englishTestScores)
ParentLink      (parentUserId, studentUserId, relationship)
Agency          (id, ownerUserId, name, licenseStatus, countriesServed[], foundedYear, riskScore)
AgencyPricing   (agencyId, serviceName, amount, whenCharged, refundable, conditions)
Review          (id, studentId, agencyId, rating, text, createdAt)
Application     (id, studentId, agencyId, targetUniversity, targetProgram, stage, createdAt)
StageEvent      (applicationId, stage, actorId, note, documentId, timestamp)
Document        (id, ownerId, applicationId, type, storageKey, version, uploadedAt)
DocumentScan    (documentId, riskScore, flags[], verdict, modelVersion, scannedAt)
AgreementAnalysis (documentId, extractedClauses(json), flaggedIssues[], analyzedAt)
Milestone       (id, applicationId, name, amount, releaseCondition, status)
LedgerEntry     (id, milestoneId, type[hold|release|refund], amount, providerTxnId, timestamp)
Receipt         (id, ledgerEntryId, pdfStorageKey, generatedAt)
ChatThread      (id, applicationId, participantIds[])
ChatMessage     (threadId, senderId, body, attachmentDocId, sentAt)
Complaint       (id, applicationId, filedById, status, description, resolution)
VerificationReport (id, agencyId, purchasedById, pdfStorageKey, generatedAt)
Subscription    (id, agencyId, tier, status, renewsAt)
```

Use UUIDs for all primary keys. All monetary fields stored as integers in the smallest currency unit
(poisha) to avoid floating-point errors.

---

## 7. Non-Functional Requirements

- **Security:** encrypt documents at rest, TLS everywhere, role-based access control enforced at the
  API layer (never trust frontend role checks alone), rate-limit auth endpoints, OTP expiry.
- **Localization:** Bangla + English throughout the UI (not just the AI assistant); use an i18n library
  from the start (`react-i18next` for web, Flutter `intl` for mobile) rather than retrofitting later.
- **Auditability:** every payment, stage change, and document upload must be logged with actor + timestamp.
- **Scalability target for MVP:** doesn't need to be huge — design for correctness and clarity over
  premature optimization, since this is a course project / early-stage product, not production-scale yet.
- **Testability:** each backend module should have unit tests for business logic (especially the
  escrow/milestone state machine and AI risk-scoring logic) since correctness there is the core value
  proposition of the product.

---

## 8. Revenue Model (for reference — not build priority)

- Tk 299 per on-demand agency Verification Report
- B2B subscriptions for top-tier consultancies (tiered, recurring)
- Small transaction fee per escrow release + application management fee

---

## 9. Suggested Build Roadmap (for a coding agent working incrementally)

1. **Foundation:** repo scaffold, Docker Compose (Postgres + Redis + api + web), auth module (5.1),
   base role-based dashboard shells.
2. **Directory core:** Agency + AgencyPricing models, verified directory (5.2), comparison tool (5.3),
   transparent pricing view (5.4) — no AI yet, just structured data.
3. **Applications & documents:** Application/StageEvent model, tracking system (5.6), document upload
   + storage (5.5).
4. **Payments:** Milestone/LedgerEntry model, PaymentProvider abstraction, sandbox integration with
   one gateway first (e.g. SSLCommerz sandbox), receipts (5.13).
5. **Trust & safety basics:** reviews (part of 5.2), complaint/dispute system (5.14), chat (5.12).
6. **AI service (FastAPI):** stand up ai-service, wire OCR pipeline, implement fake-document detection
   (5.8) end-to-end on a small test set before polishing.
7. **AI agreement analysis + scam alerts** (5.9, 5.10), feeding flags back into the pricing/agency views.
8. **Bangla assistant + AI Counselor chatbot** (5.11, 5.18) — these can reuse the same LLM integration
   layer; build the counselor's recommendation logic as a rule-based system first, defer ML model
   training.
9. **Monetization:** paid verification reports (5.15), agency subscriptions (5.16), transaction fees (5.17).
10. **Mobile app (Flutter):** once web API is stable, build the Flutter client against the same API —
    avoid building web and mobile in parallel from day one to prevent API churn.

---

## 10. Instructions to the Coding Agent

- Confirm which module (from Section 9) is in scope for the current task before generating code; don't
  scaffold the entire system in one pass.
- Keep the AI/OCR/LLM logic isolated in `apps/ai-service` behind a clean internal API — the Node.js
  core API should never call Tesseract/LLM providers directly.
- Use the `PaymentProvider` interface pattern for all three payment gateways; do not hardcode SSLCommerz-
  or bKash-specific logic into the escrow/milestone business logic.
- All currency values: integers in poisha, never floats.
- Every new entity should get a migration file (not manual schema edits) — use an ORM/migration tool
  (e.g. Prisma or TypeORM for Node, Alembic for FastAPI/SQLAlchemy if used there).
- Write the escrow state machine (milestone status transitions) as an explicit, testable state machine
  — this is the most safety-critical piece of business logic in the product.
- Default to English + Bangla string externalization for any user-facing text from the first commit.
- Ask for clarification only when a decision would be genuinely ambiguous or costly to reverse (e.g.
  choice of escrow partner integration details); otherwise proceed with the defaults in this document.
