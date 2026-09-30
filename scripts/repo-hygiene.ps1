# ==============================================================================
# Ethos AI - Repository Hygiene & Git Standards Verifier (PowerShell)
# Issue #2 (K-05): Base Scripts for Issue/Project Workflow & Repo Hygiene
# Assignee: @Taha-Mim-Tasfa
#
# Aligned with Criterion 4 (Git & SWE Practices) and KANBAN.md Sec 12.
#
# Usage:
#   .\scripts\repo-hygiene.ps1
#   .\scripts\repo-hygiene.ps1 -Branch "feature/10-escrow-milestone-ledger"
#   .\scripts\repo-hygiene.ps1 -CommitMsg "feat(escrow): implement milestone flow (#10)"
# ==============================================================================

param (
    [string]$Branch = "",
    [string]$CommitMsg = "",
    [string]$Path = "."
)

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "[HYGIENE] Ethos AI: Repository Hygiene & Git Standards Audit" -ForegroundColor Cyan
Write-Host "[OWNER] Auditor: @Taha-Mim-Tasfa (Backend & DevOps)" -ForegroundColor Yellow
Write-Host "=====================================================" -ForegroundColor Cyan

$TotalErrors = 0

# -----------------------------------------------------------------------------
# 1. Branch Naming Standard Check
# -----------------------------------------------------------------------------
if (-not $Branch) {
    if (Get-Command git -ErrorAction SilentlyContinue) {
        $Branch = (git branch --show-current 2>$null)
    }
}

if ($Branch -and $Branch -ne "main" -and $Branch -ne "HEAD") {
    $BranchPattern = '^(feature|feat|bugfix|fix|docs|chore|refactor|test)/[a-zA-Z0-9_.-]+$'
    if ($Branch -match $BranchPattern) {
        Write-Host "[PASS] Branch naming matches standard: '$Branch'" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Branch naming violation: '$Branch'" -ForegroundColor Red
        Write-Host "       Expected format: feature/<id>-<desc>, feat/<desc>, bugfix/<id>-<desc>, or docs/<desc>" -ForegroundColor Yellow
        $TotalErrors++
    }
} elseif ($Branch -eq "main") {
    Write-Host "[INFO] On main branch." -ForegroundColor DarkGray
}

# -----------------------------------------------------------------------------
# 2. Conventional Commit Pattern Check
# -----------------------------------------------------------------------------
if ($CommitMsg) {
    $CommitPattern = '^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-zA-Z0-9_-]+\))?:\s.+'
    if ($CommitMsg -match $CommitPattern) {
        Write-Host "[PASS] Commit message follows Conventional Commits: '$CommitMsg'" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Commit message does not follow Conventional Commits standard:" -ForegroundColor Red
        Write-Host "       Given: '$CommitMsg'" -ForegroundColor Yellow
        Write-Host "       Example: 'feat(escrow): implement milestone escrow flow (#10)'" -ForegroundColor Cyan
        $TotalErrors++
    }
}

# -----------------------------------------------------------------------------
# 3. Secret & Sensitive File Leak Check
# -----------------------------------------------------------------------------
Write-Host "`n[CHECK] Scanning for sensitive unignored files..." -ForegroundColor Cyan
$ForbiddenFiles = @(".env", ".env.local", ".env.production", "id_rsa", "id_rsa.pub")

$SensitiveFound = 0
foreach ($Pattern in $ForbiddenFiles) {
    $Matches = @(git -C $Path ls-files --cached --others --exclude-standard 2>$null) |
        Where-Object { (Split-Path $_ -Leaf) -eq $Pattern } |
        ForEach-Object { Get-Item -LiteralPath (Join-Path $Path $_) -ErrorAction SilentlyContinue }
    
    foreach ($File in $Matches) {
        Write-Host "[FAIL] Forbidden file detected: $($File.FullName)" -ForegroundColor Red
        $SensitiveFound++
        $TotalErrors++
    }
}

if ($SensitiveFound -eq 0) {
    Write-Host "[PASS] No committed secrets or forbidden environment files detected." -ForegroundColor Green
}

# -----------------------------------------------------------------------------
# 4. Merge Conflict Markers Check
# -----------------------------------------------------------------------------
Write-Host "`n[CHECK] Scanning for unresolved merge conflict markers..." -ForegroundColor Cyan
$TrackedSource = @(git -C $Path ls-files '*.ts' '*.tsx' '*.js' '*.json' '*.md' '*.py' 2>$null) |
    ForEach-Object { Join-Path $Path $_ }
$ConflictFiles = $TrackedSource | Select-String -Pattern '^(<<<<<<<|=======|>>>>>>>)' -List

if ($ConflictFiles) {
    foreach ($Match in $ConflictFiles) {
        Write-Host "[FAIL] Unresolved merge conflict in: $($Match.Path) on line $($Match.LineNumber)" -ForegroundColor Red
        $TotalErrors++
    }
} else {
    Write-Host "[PASS] No merge conflict markers found." -ForegroundColor Green
}

# -----------------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------------
Write-Host "`n=====================================================" -ForegroundColor Cyan
if ($TotalErrors -eq 0) {
    Write-Host "[SUCCESS] Repository Hygiene Check: ALL PASSED!" -ForegroundColor Green
    Write-Host "=====================================================" -ForegroundColor Cyan
    exit 0
} else {
    Write-Host "[WARN] Repository Hygiene Check: $TotalErrors violation(s) found." -ForegroundColor Red
    Write-Host "=====================================================" -ForegroundColor Cyan
    exit 1
}
