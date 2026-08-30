#!/usr/bin/env bash
# ==============================================================================
# Ethos AI — GitHub Kanban Board Sync Script (Bash)
# Target Repo: Team-Inception-1/Ethos-AI
#
# NOTE: Issues K-01 .. K-24 already exist in the repository (created during
# earlier sprints). This script no longer *creates* the original issue set —
# re-running old "create" calls would just duplicate them. Instead it is a
# thin reference/audit helper: it prints the live Kanban state (open issues,
# assignee, labels) straight from GitHub so anyone can sanity-check that
# docs/KANBAN.md still matches reality.
#
# Usage:
#   gh auth login              # once, if not already authenticated
#   ./scripts/create_github_issues.sh
# ==============================================================================

REPO="Team-Inception-1/Ethos-AI"

echo "====================================================="
echo "📋 Ethos AI: Kanban Board Audit"
echo "📦 Target Repository: $REPO"
echo "====================================================="

if ! command -v gh &> /dev/null; then
    echo "ℹ️ GitHub CLI (gh) not detected. Refer to docs/KANBAN.md for the full task board."
    exit 0
fi

echo ""
echo "Current open issues, assignee, and labels (K-01 .. K-24):"
echo "-----------------------------------------------------"
gh issue list --repo "$REPO" --state all --limit 100 \
    --json number,title,assignees,labels,state \
    --template '{{range .}}#{{.number}}	{{.state}}	{{range .assignees}}{{.login}} {{end}}	{{range .labels}}{{.name}} {{end}}	{{.title}}
{{end}}'

echo ""
echo "See docs/KANBAN.md for full task descriptions, Definitions of Done,"
echo "and the current AI/ML (Tasin + Sourav) vs. Backend/Frontend/QA"
echo "(Sudiip, Jannat, Taha) ownership split."
