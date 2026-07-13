#!/bin/bash
# speckit-helper.sh - Pre-flight helper for speckit commands
# Centralizes all pre-flight shell logic to avoid Claude Code permission
# issues with $(), ||, &&, and | operators in !` ` commands.

BRANCH=$(git branch --show-current 2>/dev/null | sed 's|^feature/||')

case "$1" in
  # --- Branch & git ---
  branch)
    git branch --show-current 2>/dev/null || echo "NO_GIT"
    ;;
  check-git-root)
    git rev-parse --show-toplevel 2>/dev/null || echo "NOT_A_GIT_REPO"
    ;;

  # --- Spec artifacts (branch-scoped) ---
  spec)
    cat ".specify/specs/$BRANCH/spec.md" 2>/dev/null || echo "NO_SPEC"
    ;;
  plan)
    cat ".specify/specs/$BRANCH/plan.md" 2>/dev/null || echo "NO_PLAN"
    ;;
  check-spec)
    ls ".specify/specs/$BRANCH/spec.md" 2>/dev/null && echo "SPEC_FOUND: $BRANCH" || echo "NO_SPEC_FOR_BRANCH"
    ;;
  check-plan)
    test -f ".specify/specs/$BRANCH/plan.md" && echo "PLAN_FOUND: $BRANCH" || echo "NO_PLAN_FOR_BRANCH"
    ;;
  check-artifacts)
    for f in tasks.md plan.md spec.md; do
      test -f ".specify/specs/$BRANCH/$f" && echo "$f: FOUND" || echo "$f: MISSING"
    done
    ;;
  all-artifacts)
    for f in spec.md plan.md tasks.md; do
      echo "--- $f ---"
      cat ".specify/specs/$BRANCH/$f" 2>/dev/null || echo "MISSING"
    done
    ;;
  clarifications)
    grep -A 100 "## Clarifications" ".specify/specs/$BRANCH/spec.md" 2>/dev/null || echo "NO_CLARIFICATIONS_SECTION"
    ;;

  # --- Checklists (branch-scoped) ---
  checklists)
    ls ".specify/specs/$BRANCH/checklists/"*.md 2>/dev/null || echo "NO_CHECKLISTS"
    ;;
  checklists-dir)
    ls ".specify/specs/$BRANCH/checklists/" 2>/dev/null || echo "NO_CHECKLISTS_DIR"
    ;;
  checklists-content)
    found=0
    for f in ".specify/specs/$BRANCH/checklists/"*.md; do
      [ -f "$f" ] || continue
      found=1
      echo "--- $(basename "$f") ---"
      cat "$f"
    done
    [ "$found" -eq 0 ] && echo "NO_CHECKLISTS"
    ;;

  # --- Global spec-kit resources ---
  constitution)
    cat .specify/memory/constitution.md 2>/dev/null || echo "NO_CONSTITUTION"
    ;;
  list-specs)
    ls -d .specify/specs/*/ 2>/dev/null || echo "NO_SPECS"
    ;;
  list-specs-dir)
    ls .specify/specs/ 2>/dev/null || echo "NO_SPECS_DIR"
    ;;
  check-specify-dir)
    test -d .specify && echo "EXISTS" || echo "NOT_FOUND"
    ;;

  # --- Project detection ---
  detect-stack)
    find . -maxdepth 2 -type f \( -name "package.json" -o -name "pyproject.toml" -o -name "Cargo.toml" -o -name "go.mod" -o -name "Makefile" \) 2>/dev/null | head -10
    ;;
  detect-test-framework)
    ls package.json pyproject.toml Cargo.toml go.mod 2>/dev/null | head -1
    ;;
  list-config-files)
    ls package.json pyproject.toml Cargo.toml go.mod Makefile docker-compose.yml 2>/dev/null || echo "No config files found"
    ;;
  list-rules)
    ls .claude/rules/ 2>/dev/null || echo "No .claude/rules/ found"
    ;;
  readme-head)
    cat README.md 2>/dev/null | head -50 || echo "NO_README"
    ;;

  # --- Context & PR commands ---
  recent-commits)
    git log --oneline -10 2>/dev/null || echo "Not a git repository"
    ;;
  project-files)
    find . -maxdepth 2 -type f \( -name "package.json" -o -name "pyproject.toml" -o -name "Cargo.toml" -o -name "go.mod" -o -name "Makefile" -o -name "*.config.*" -o -name "tsconfig*" -o -name ".eslintrc*" -o -name "Dockerfile" \) 2>/dev/null | head -20
    ;;
  pr-commits)
    git log --oneline main..HEAD 2>/dev/null || git log --oneline -10
    ;;
  pr-files)
    git diff --name-status main...HEAD 2>/dev/null || git diff --name-status HEAD~1
    ;;
  pr-stats)
    git diff --stat main...HEAD 2>/dev/null || git diff --stat HEAD~1
    ;;

  # --- New commands for speckit.review, speckit.baseline, speckit.fix ---
  check-plan-review)
    test -f ".specify/specs/$BRANCH/plan.md" && echo "PLAN_EXISTS: $BRANCH" || echo "NO_PLAN"
    grep -q "^## Reviewed" ".specify/specs/$BRANCH/plan.md" 2>/dev/null && echo "PLAN_REVIEWED" || echo "PLAN_NOT_REVIEWED"
    ;;
  detect-existing-code)
    SRC_COUNT=$(find . -maxdepth 4 -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.py" -o -name "*.rs" -o -name "*.go" -o -name "*.java" -o -name "*.rb" -o -name "*.kt" -o -name "*.swift" -o -name "*.c" -o -name "*.cpp" \) ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/vendor/*" ! -path "*/target/*" 2>/dev/null | wc -l)
    echo "SOURCE_FILES: $SRC_COUNT"
    find . -maxdepth 2 -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.py" -o -name "*.rs" -o -name "*.go" -o -name "*.java" -o -name "*.rb" \) ! -path "*/node_modules/*" ! -path "*/.git/*" 2>/dev/null | sed 's|/[^/]*$||' | sort -u | head -10
    ;;
  trivial-change-check)
    STAGED=$(git diff --cached --name-only 2>/dev/null | wc -l)
    UNSTAGED=$(git diff --name-only 2>/dev/null | wc -l)
    TOTAL=$((STAGED + UNSTAGED))
    echo "STAGED_FILES: $STAGED"
    echo "UNSTAGED_FILES: $UNSTAGED"
    echo "TOTAL_CHANGED: $TOTAL"
    git diff --name-only 2>/dev/null | head -10
    git diff --cached --name-only 2>/dev/null | head -10
    ;;

  # --- Plan phase marker (RIPER-style write-block) ---
  # The marker file .specify/.plan-in-progress activates plan-phase-write-block.sh,
  # which mechanically blocks Edit/Write to paths outside .specify/ while the plan
  # is being generated. speckit.plan sets it in pre-flight and clears it after
  # plan.md is written.
  plan-phase-start)
    mkdir -p .specify
    touch .specify/.plan-in-progress
    echo "PLAN_PHASE_STARTED: write-block active for paths outside .specify/"
    ;;
  plan-phase-end)
    rm -f .specify/.plan-in-progress
    echo "PLAN_PHASE_ENDED: write-block cleared"
    ;;
  plan-phase-status)
    if [ -f .specify/.plan-in-progress ]; then
      echo "PLAN_PHASE_ACTIVE"
    else
      echo "PLAN_PHASE_INACTIVE"
    fi
    ;;

  # --- RTK CLI output compression (optional, auto-detected) ---
  rtk-available)
    # Prints RTK_AVAILABLE or RTK_MISSING; always exits 0 so callers can
    # branch on the output without tripping `set -e`.
    if command -v rtk >/dev/null 2>&1; then
      echo "RTK_AVAILABLE"
    else
      echo "RTK_MISSING"
    fi
    ;;
  rtk-run)
    # Run a command through rtk if available, otherwise run it plain.
    # Usage: speckit-helper.sh rtk-run <cmd> [args...]
    shift
    if [ "$#" -eq 0 ]; then
      echo "rtk-run: no command provided" >&2
      exit 2
    fi
    if command -v rtk >/dev/null 2>&1; then
      exec rtk "$@"
    else
      exec "$@"
    fi
    ;;

  *)
    echo "Unknown command: $1"
    echo "Usage: speckit-helper.sh <command>"
    echo "Commands: branch, check-git-root, spec, plan, check-spec, check-plan,"
    echo "  check-artifacts, all-artifacts, clarifications, checklists, checklists-dir,"
    echo "  checklists-content, constitution, list-specs, list-specs-dir, check-specify-dir,"
    echo "  detect-stack, detect-test-framework, list-config-files, list-rules, readme-head,"
    echo "  check-plan-review, detect-existing-code, trivial-change-check,"
    echo "  plan-phase-start, plan-phase-end, plan-phase-status,"
    echo "  rtk-available, rtk-run"
    exit 1
    ;;
esac
