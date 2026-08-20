# ==============================================================================
# Ethos AI — GitHub Kanban Board & Issue Creation Script (PowerShell)
# Target Repo: Team-Inception-1/Ethos-AI
#
# Usage:
#   .\scripts\create_github_issues.ps1 -GitHubToken "YOUR_GITHUB_PERSONAL_ACCESS_TOKEN"
#   or if GitHub CLI (gh) is installed:
#   .\scripts\create_github_issues.ps1
# ==============================================================================

param (
    [string]$GitHubToken = $env:GITHUB_TOKEN,
    [string]$Repo = "Team-Inception-1/Ethos-AI"
)

$headers = @{
    "Accept" = "application/vnd.github+json"
    "User-Agent" = "Ethos-AI-Kanban-Setup"
}

if ($GitHubToken) {
    $headers["Authorization"] = "Bearer $GitHubToken"
}

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "🚀 Ethos AI: Initializing GitHub Kanban & Issues Setup" -ForegroundColor Cyan
Write-Host "📦 Target Repository: $Repo" -ForegroundColor Yellow
Write-Host "=====================================================" -ForegroundColor Cyan

# 1. Define Labels
$labels = @(
    @{ name = "criterion-1"; color = "b60205"; desc = "Criterion 1: Core Features Implemented" },
    @{ name = "criterion-2"; color = "d93f0b"; desc = "Criterion 2: Feature Integration & Workflow" },
    @{ name = "criterion-3"; color = "fbca04"; desc = "Criterion 3: Backend & Database Functionality" },
    @{ name = "criterion-4"; color = "0e8a16"; desc = "Criterion 4: Git & Team Collaboration" },
    @{ name = "criterion-5"; color = "006b75"; desc = "Criterion 5: Code Quality & SWE Practices" },
    @{ name = "criterion-7"; color = "1d76db"; desc = "Criterion 7: UI/UX & Usability" },
    @{ name = "criterion-8"; color = "5319e7"; desc = "Criterion 8: Project Org & Documentation" },
    @{ name = "backend"; color = "5319e7"; desc = "Backend & API tasks" },
    @{ name = "frontend"; color = "1d76db"; desc = "Frontend UI/UX tasks" },
    @{ name = "ai/ml"; color = "0052cc"; desc = "AI & ML Services" },
    @{ name = "auth"; color = "e99695"; desc = "Authentication & Authorization" },
    @{ name = "payments"; color = "0e8a16"; desc = "Escrow & Payment Gateway" },
    @{ name = "security"; color = "b60205"; desc = "Security & Verification" }
)

# 2. Define Issues
$issues = @(
    @{
        title = "feat(auth): User Authentication & Role-Based Access Control (RBAC) API"
        assignee = "tasinofficial"
        labels = @("backend", "auth", "security", "criterion-1", "criterion-3")
        body = @"
## 🎯 Objective
Replace client-side mock authentication with full JWT auth, bcrypt password hashing, role-based authorization middleware (`student`, `parent`, `agency`, `admin`), and OTP verification service.

## 📋 Evaluation Criteria Alignment
- **Criterion 1 (Core Features):** Core user authentication and guardian linking functionality.
- **Criterion 3 (Backend/DB):** Real API endpoints and database storage.

## 🛠️ Definition of Done (DoD)
- [ ] `POST /api/auth/register` creates user with hashed passwords and role validation.
- [ ] `POST /api/auth/login` issues signed JWT tokens in secure HTTP-only cookies.
- [ ] `POST /api/auth/link-guardian` links parent accounts to student records via unique link code.
- [ ] Role protection middleware enforces RBAC on sensitive dashboard endpoints.
- [ ] Unit tests verify login, token verification, and forbidden role access.

**Assigned to:** @tasinofficial  
**Branch:** `feature/auth-backend-api`
"@
    },
    @{
        title = "feat(directory): Verified Consultancy Directory & Side-by-Side Comparison Tool"
        assignee = "prova"
        labels = @("frontend", "backend", "criterion-1", "criterion-2", "criterion-7")
        body = @"
## 🎯 Objective
Implement dynamic agency directory search, multi-factor filtering (Country, Budget, Success Rate, Rating), and a side-by-side agency comparison engine.

## 📋 Evaluation Criteria Alignment
- **Criterion 1 (Core Features):** Search, filtering, and comparative analysis tools.
- **Criterion 7 (UI/UX):** Responsive cards, filters, and comparative modal layout.

## 🛠️ Definition of Done (DoD)
- [ ] Live search bar and filter controls update directory results dynamically.
- [ ] Agency profile card displays verified badge, license number, and breakdown of services.
- [ ] Compare page allows selecting 2–4 agencies and renders a side-by-side metric matrix.
- [ ] Direct 'Apply Now' CTA seamlessly initiates an application for the selected agency.

**Assigned to:** @prova  
**Branch:** `feature/directory-compare-module`
"@
    },
    @{
        title = "feat(applications): Application Lifecycle Tracking System & Secure Document Vault"
        assignee = "tasinofficial"
        labels = @("fullstack", "criterion-1", "criterion-2", "criterion-3")
        body = @"
## 🎯 Objective
Build a multi-stage application state machine (`submitted` -> `under_review` -> `offer_received` -> `payment_pending` -> `visa_processing` -> `completed`) with timestamped actor audit logging and document upload management.

## 📋 Evaluation Criteria Alignment
- **Criterion 1 (Core Features):** Full lifecycle tracking with state transitions.
- **Criterion 2 (Integration):** Links students, agencies, and parents.
- **Criterion 3 (Backend/DB):** Real relational persistence in PostgreSQL.

## 🛠️ Definition of Done (DoD)
- [ ] Student can submit applications to target universities with chosen agencies.
- [ ] Agency portal can update application stage with transition notes and offer letter uploads.
- [ ] Linked parent account can view the updated stage in real-time.
- [ ] Document vault stores offer letters, transcripts, and receipts with metadata pointers.

**Assigned to:** @tasinofficial  
**Branch:** `feature/application-tracking-docs`
"@
    },
    @{
        title = "feat(escrow): Milestone-Based Escrow Payment System & Immutable Ledger"
        assignee = "tasinofficial"
        labels = @("backend", "payments", "security", "criterion-1", "criterion-3")
        body = @"
## 🎯 Objective
Implement milestone-based escrow payments (`held` -> `released` -> `disputed` -> `refunded`), a generic `PaymentProvider` interface, poisha-level integer currency handling, and digital receipt generation.

## 📋 Evaluation Criteria Alignment
- **Criterion 1 (Core Features):** Escrow protection and milestone release logic.
- **Criterion 3 (Backend/DB):** Immutable transaction ledger table in PostgreSQL.

## 🛠️ Definition of Done (DoD)
- [ ] Escrow state machine enforces release conditions before funds can be withdrawn by an agency.
- [ ] Mock SSLCommerz/bKash payment gateway provider updates milestone status to `held`.
- [ ] Immutable `LedgerEntry` table logs every credit/debit with unique transaction hash.
- [ ] Digital transaction receipt view generated upon milestone release.

**Assigned to:** @tasinofficial  
**Branch:** `feature/escrow-milestone-ledger`
"@
    },
    @{
        title = "feat(ai): Document Fraud Detection & Smart Agreement Analyzer Microservice"
        assignee = "tasinofficial"
        labels = @("ai/ml", "criterion-1", "criterion-3")
        body = @"
## 🎯 Objective
Develop a FastAPI AI microservice with OCR (Tesseract / regex heuristics) to inspect uploaded offer letters, calculate risk scores (0–100), flag suspicious domains, and parse agreement fee clauses.

## 📋 Evaluation Criteria Alignment
- **Criterion 1 (Core Features):** Working AI-assisted document fraud analysis.
- **Criterion 3 (Backend/DB):** FastAPI backend service with structured JSON output.

## 🛠️ Definition of Done (DoD)
- [ ] `POST /api/ai/analyze-offer-letter` parses document text and returns `riskScore`, `verdict`, and `flags[]`.
- [ ] `POST /api/ai/analyze-agreement` parses clauses and flags hidden fee clauses.
- [ ] Frontend displays animated risk gauge, checkmarks, and warning badges.

**Assigned to:** @tasinofficial  
**Branch:** `feature/ai-fraud-service`
"@
    },
    @{
        title = "feat(workflow): End-to-End Integrated User Workflow (Golden Flow)"
        assignee = "prova"
        labels = @("frontend", "backend", "criterion-2")
        body = @"
## 🎯 Objective
Wire together all core modules into a single, cohesive end-to-end journey from user onboarding to final milestone release.

## 📋 Evaluation Criteria Alignment
- **Criterion 2 (Feature Integration & Workflow):** Complete end-to-end user journey across all roles.

## 🛠️ Definition of Done (DoD)
- [ ] Golden Flow execution:
  1. Student registers & links Parent account.
  2. Student searches & compares agencies in Directory.
  3. Student submits application.
  4. Offer letter uploaded and verified via AI Fraud Checker.
  5. Application moves to Payment Pending -> Escrow funded.
  6. Application updates to Visa Processing -> Parent Dashboard reflects real-time status.
- [ ] Flow executes seamlessly end-to-end without manual intervention or crashes.

**Assigned to:** @prova, @tasinofficial  
**Branch:** `feature/e2e-workflow-integration`
"@
    },
    @{
        title = "feat(db): PostgreSQL Relational Database Schema & Prisma Migrations"
        assignee = "tasinofficial"
        labels = @("backend", "criterion-3")
        body = @"
## 🎯 Objective
Set up PostgreSQL database schema with Prisma ORM migrations covering Users, Profiles, Agencies, Applications, Documents, Milestones, and Ledger Entries.

## 📋 Evaluation Criteria Alignment
- **Criterion 3 (Backend/Database):** Real relational persistence layer.

## 🛠️ Definition of Done (DoD)
- [ ] `schema.prisma` models all core entities with correct foreign keys and indexes.
- [ ] Migrations run cleanly on fresh PostgreSQL database.
- [ ] Seed script (`prisma/seed.ts`) populates realistic test data (agencies, applications, users).

**Assigned to:** @tasinofficial  
**Branch:** `feature/database-prisma-schema`
"@
    },
    @{
        title = "quality(swe): Code Architecture, DTOs & Error Boundary Hardening"
        assignee = "tasinofficial"
        labels = @("code-quality", "criterion-5")
        body = @"
## 🎯 Objective
Enforce strict TypeScript typing, shared DTO interfaces, modular service abstractions, and centralized error handling across web and backend layers.

## 📋 Evaluation Criteria Alignment
- **Criterion 5 (Code Quality & SWE Practices):** Modular structure, meaningful naming, separation of concerns, and error handling.

## 🛠️ Definition of Done (DoD)
- [ ] All API payloads typed with shared TypeScript interfaces (no `any`).
- [ ] Centralized API error handling with toast notifications.
- [ ] React Error Boundaries catch client runtime exceptions gracefully.

**Assigned to:** @tasinofficial  
**Branch:** `feature/code-quality-refactoring`
"@
    },
    @{
        title = "ui(usability): UI/UX Consistency, Glassmorphism Styling & Accessibility Audit"
        assignee = "prova"
        labels = @("frontend", "ui/ux", "criterion-7")
        body = @"
## 🎯 Objective
Ensure consistent visual design across all pages, verify Dark/Light mode theme contrast, add ARIA accessibility attributes, and provide responsive mobile layouts.

## 📋 Evaluation Criteria Alignment
- **Criterion 7 (UI/UX & Usability):** Consistent design system, working navigation, intuitive feedback.

## 🛠️ Definition of Done (DoD)
- [ ] Dark and Light themes render with WCAG AA compliant contrast.
- [ ] Mobile navigation drawer functions smoothly on all viewports.
- [ ] All interactive buttons and forms have descriptive `aria-label` attributes.

**Assigned to:** @prova  
**Branch:** `feature/ui-ux-accessibility`
"@
    },
    @{
        title = "docs(project): Comprehensive Project Documentation, Setup Guide & Sprint Plan"
        assignee = "prova"
        labels = @("documentation", "criterion-8")
        body = @"
## 🎯 Objective
Provide complete project documentation, setup guides, architectural diagrams, task distribution records, and sprint planning artifacts.

## 📋 Evaluation Criteria Alignment
- **Criterion 8 (Project Organization & Documentation):** Complete README, setup guide, task distribution.

## 🛠️ Definition of Done (DoD)
- [ ] Root `README.md` documents value proposition, architecture diagrams, setup instructions, and team roles.
- [ ] `docs/KANBAN.md` provides complete sprint task breakdown and assignment matrix.
- [ ] `docs/ETHOS_AI_CONTEXT.md` maintains system-level specifications.

**Assigned to:** @prova, @tasinofficial  
**Branch:** `docs/project-documentation`
"@
    }
)

Write-Host "Creating GitHub Issues..." -ForegroundColor Green

foreach ($issue in $issues) {
    Write-Host "  -> Creating Issue: $($issue.title)" -ForegroundColor White
    
    # If GitHub CLI is available, prefer using gh
    if (Get-Command "gh" -ErrorAction SilentlyContinue) {
        $labelsArg = ($issue.labels -join ",")
        gh issue create --repo $Repo --title $issue.title --body $issue.body --assignee $issue.assignee --label $labelsArg
    }
    elseif ($GitHubToken) {
        $bodyJson = @{
            title = $issue.title
            body = $issue.body
            labels = $issue.labels
            assignees = @($issue.assignee)
        } | ConvertTo-Json -Depth 5

        try {
            $response = Invoke-RestMethod -Uri "https://api.github.com/repos/$Repo/issues" -Method Post -Headers $headers -Body $bodyJson -ContentType "application/json"
            Write-Host "     [SUCCESS] Created Issue #$($response.number): $($response.html_url)" -ForegroundColor Green
        }
        catch {
            Write-Host "     [WARNING] Could not create via REST API: $_" -ForegroundColor Red
        }
    }
    else {
        Write-Host "     [INFO] gh CLI not found and no GitHub token provided. Issue spec generated in docs/KANBAN.md." -ForegroundColor DarkGray
    }
}

Write-Host "`n✅ Setup script complete! Full task breakdown documented in docs/KANBAN.md" -ForegroundColor Green
