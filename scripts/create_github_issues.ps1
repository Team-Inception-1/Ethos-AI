# ==============================================================================
# Ethos AI — GitHub Kanban Board Sync Script (PowerShell)
# Target Repo: Team-Inception-1/Ethos-AI
#
# NOTE: Issues K-01 .. K-24 already exist in the repository (created during
# earlier sprints). This script no longer *creates* the original issue set —
# re-running the old "create" calls would just duplicate them. Instead it is
# a thin reference/audit helper: it prints the live Kanban state (open
# issues, assignee, labels) straight from GitHub so anyone can sanity-check
# that docs/KANBAN.md still matches reality.
#
# Usage:
#   gh auth login                     # once, if not already authenticated
#   .\scripts\create_github_issues.ps1
# ==============================================================================

param (
    [string]$Repo = "Team-Inception-1/Ethos-AI"
)

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "📋 Ethos AI: Kanban Board Audit" -ForegroundColor Cyan
Write-Host "📦 Target Repository: $Repo" -ForegroundColor Yellow
Write-Host "=====================================================" -ForegroundColor Cyan

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "ℹ️ GitHub CLI (gh) not detected. Refer to docs/KANBAN.md for the full task board." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Current open issues, assignee, and labels (K-01 .. K-24):" -ForegroundColor Green
Write-Host "-----------------------------------------------------"

gh issue list --repo $Repo --state all --limit 100 `
    --json number,title,assignees,labels,state `
    --template '{{range .}}#{{.number}}	{{.state}}	{{range .assignees}}{{.login}} {{end}}	{{range .labels}}{{.name}} {{end}}	{{.title}}
{{end}}'

Write-Host ""
Write-Host "See docs/KANBAN.md for full task descriptions, Definitions of Done," -ForegroundColor Cyan
Write-Host "and the current AI/ML (Tasin + Sourav) vs. Backend/Frontend/QA" -ForegroundColor Cyan
Write-Host "(Sudiip, Jannat, Taha) ownership split." -ForegroundColor Cyan
