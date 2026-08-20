#!/usr/bin/env bash
# ==============================================================================
# Ethos AI — GitHub Kanban Board & Issue Creation Script (Bash)
# Target Repo: Team-Inception-1/Ethos-AI
#
# Usage:
#   export GITHUB_TOKEN="your_personal_access_token"
#   ./scripts/create_github_issues.sh
# ==============================================================================

REPO="Team-Inception-1/Ethos-AI"

echo "====================================================="
echo "🚀 Ethos AI: Initializing GitHub Kanban & Issues Setup"
echo "📦 Target Repository: $REPO"
echo "====================================================="

if command -v gh &> /dev/null; then
    echo "Using GitHub CLI (gh)..."
    gh issue create --repo "$REPO" --title "feat(auth): User Authentication & Role-Based Access Control (RBAC) API" --assignee "tasinofficial" --label "backend,auth,security,criterion-1,criterion-3" --body "Implement JWT authentication, bcrypt hashing, and guardian linking API."
    gh issue create --repo "$REPO" --title "feat(directory): Verified Consultancy Directory & Side-by-Side Comparison Tool" --assignee "prova" --label "frontend,backend,criterion-1,criterion-2,criterion-7" --body "Implement agency directory filters, search, and comparative matrix view."
    gh issue create --repo "$REPO" --title "feat(applications): Application Lifecycle Tracking System & Secure Document Vault" --assignee "tasinofficial" --label "fullstack,criterion-1,criterion-2,criterion-3" --body "Build multi-stage application state machine with document uploads."
    gh issue create --repo "$REPO" --title "feat(escrow): Milestone-Based Escrow Payment System & Immutable Ledger" --assignee "tasinofficial" --label "backend,payments,security,criterion-1,criterion-3" --body "Implement escrow status state machine and immutable ledger table."
    gh issue create --repo "$REPO" --title "feat(ai): Document Fraud Detection & Smart Agreement Analyzer Microservice" --assignee "tasinofficial" --label "ai/ml,criterion-1,criterion-3" --body "FastAPI OCR service for offer letter risk score calculation."
    gh issue create --repo "$REPO" --title "feat(workflow): End-to-End Integrated User Workflow (Golden Flow)" --assignee "prova" --label "frontend,backend,criterion-2" --body "Connect search, application, AI fraud check, and escrow into a single flow."
    gh issue create --repo "$REPO" --title "feat(db): PostgreSQL Relational Database Schema & Prisma Migrations" --assignee "tasinofficial" --label "backend,criterion-3" --body "Create Prisma schema and database seed scripts."
    gh issue create --repo "$REPO" --title "quality(swe): Code Architecture, DTOs & Error Boundary Hardening" --assignee "tasinofficial" --label "code-quality,criterion-5" --body "Enforce TypeScript types, DTOs, and error handling."
    gh issue create --repo "$REPO" --title "ui(usability): UI/UX Consistency, Glassmorphism Styling & Accessibility Audit" --assignee "prova" --label "frontend,ui/ux,criterion-7" --body "Audit dark/light theme, accessibility labels, and mobile navigation."
    gh issue create --repo "$REPO" --title "docs(project): Comprehensive Project Documentation, Setup Guide & Sprint Plan" --assignee "prova" --label "documentation,criterion-8" --body "Root README and KANBAN documentation."
    echo "✅ All GitHub issues created successfully!"
else
    echo "ℹ️ GitHub CLI (gh) not detected. All tasks are fully documented in docs/KANBAN.md."
fi
