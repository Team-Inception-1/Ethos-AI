#!/usr/bin/env bash
# ==============================================================================
# Ethos AI — Repository Hygiene & Git Standards Verifier (Bash)
# Issue #2 (K-05): Base Scripts for Issue/Project Workflow & Repo Hygiene
# Assignee: @Taha-Mim-Tasfa
#
# Aligned with Criterion 4 (Git & SWE Practices) and KANBAN.md §12.
#
# Usage:
#   ./scripts/repo-hygiene.sh
#   ./scripts/repo-hygiene.sh --commit "feat(escrow): implement milestone flow (#10)"
# ==============================================================================

set -euo pipefail

COMMIT_MSG=""
TOTAL_ERRORS=0

while [[ $# -gt 0 ]]; do
    case "$1" in
        --commit)
            COMMIT_MSG="$2"
            shift 2
            ;;
        *)
            shift
            ;;
    esac
done

echo "====================================================="
echo "🛡️  Ethos AI: Repository Hygiene & Git Standards Audit"
echo "👤 Auditor: @Taha-Mim-Tasfa (Backend & DevOps)"
echo "====================================================="

# 1. Branch naming standard
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "")
if [[ -n "$CURRENT_BRANCH" && "$CURRENT_BRANCH" != "main" && "$CURRENT_BRANCH" != "HEAD" ]]; then
    if [[ "$CURRENT_BRANCH" =~ ^(feature|bugfix|docs|chore|refactor|test)/[a-zA-Z0-9_-]+$ ]]; then
        echo "✅ Branch naming matches standard: '$CURRENT_BRANCH'"
    else
        echo "❌ Branch naming violation: '$CURRENT_BRANCH'"
        echo "   Expected format: feature/<id>-<desc>, bugfix/<id>-<desc>, or docs/<desc>"
        TOTAL_ERRORS=$((TOTAL_ERRORS + 1))
    fi
fi

# 2. Conventional commit pattern
if [[ -n "$COMMIT_MSG" ]]; then
    CONVENTIONAL_PATTERN="^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-zA-Z0-9_-]+\))?:\s.+"
    if [[ "$COMMIT_MSG" =~ $CONVENTIONAL_PATTERN ]]; then
        echo "✅ Commit message follows Conventional Commits: '$COMMIT_MSG'"
    else
        echo "❌ Commit message does not follow Conventional Commits standard: '$COMMIT_MSG'"
        TOTAL_ERRORS=$((TOTAL_ERRORS + 1))
    fi
fi

# 3. Sensitive file leak check
echo ""
echo "🔍 Checking for sensitive unignored files..."
FORBIDDEN_FILES=(".env" ".env.local" ".env.production" "id_rsa" "id_rsa.pub")
SENSITIVE_FOUND=0
for pattern in "${FORBIDDEN_FILES[@]}"; do
    FOUND=$(find . -not -path '*/.*' -not -path './node_modules*' -name "$pattern" 2>/dev/null || true)
    if [[ -n "$FOUND" ]]; then
        echo "❌ Forbidden file detected: $FOUND"
        SENSITIVE_FOUND=$((SENSITIVE_FOUND + 1))
        TOTAL_ERRORS=$((TOTAL_ERRORS + 1))
    fi
done

if [[ $SENSITIVE_FOUND -eq 0 ]]; then
    echo "✅ No committed secrets or forbidden environment files detected."
fi

# 4. Merge conflict markers
echo ""
echo "🔍 Checking for unresolved merge conflict markers..."
if grep -rnE '^(<<<<<<<|=======|>>>>>>>)' --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.next . >/dev/null 2>&1; then
    echo "❌ Unresolved merge conflict markers detected in codebase."
    TOTAL_ERRORS=$((TOTAL_ERRORS + 1))
else
    echo "✅ No merge conflict markers found."
fi

echo ""
echo "====================================================="
if [[ $TOTAL_ERRORS -eq 0 ]]; then
    echo "🎉 Repository Hygiene Check: ALL PASSED!"
    echo "====================================================="
    exit 0
else
    echo "⚠️  Repository Hygiene Check: $TOTAL_ERRORS violation(s) found."
    echo "====================================================="
    exit 1
fi
