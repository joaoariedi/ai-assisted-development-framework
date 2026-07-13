#!/bin/bash
set -euo pipefail

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Only intercept git commit commands
if [[ "$COMMAND" != git\ commit* ]]; then
  exit 0
fi

CWD=$(echo "$INPUT" | jq -r '.cwd // empty')
if [ -z "$CWD" ]; then
  exit 0
fi

ERRORS=""

# Universal: Secrets detection (mandatory, runs first)
if command -v gitleaks &>/dev/null; then
  if ! gitleaks detect --staged --no-banner -q 2>/dev/null; then
    ERRORS="${ERRORS}Secrets detected in staged files! "
  fi
fi

# --- Universal: shell + markdown, on STAGED FILES ONLY ------------------------
#
# Every check below this block is gated behind a language manifest (package.json,
# pyproject.toml, Cargo.toml, go.mod, pom.xml). A repo made of shell scripts and
# markdown — like this framework itself — matches none of them, so the gate was a
# no-op against its own source. These two checks are manifest-free.
#
# Each has a ZERO-DEPENDENCY baseline that always runs, plus a real linter when one
# is installed. Guarding purely on `command -v` would have reproduced the original
# bug on any machine without the linter.
STAGED=$(git -C "$CWD" diff --cached --name-only --diff-filter=ACM 2>/dev/null || true)

# Shell: bash -n always; shellcheck when present.
SH_FILES=$(echo "$STAGED" | grep -E '\.(sh|bash)$' || true)
if [ -n "$SH_FILES" ]; then
  while IFS= read -r f; do
    [ -f "$CWD/$f" ] || continue
    if ! bash -n "$CWD/$f" 2>/dev/null; then
      ERRORS="${ERRORS}Shell syntax error in $f. "
    fi
  done <<< "$SH_FILES"

  if command -v shellcheck &>/dev/null; then
    # shellcheck is advisory below `error` severity; only errors block a commit.
    while IFS= read -r f; do
      [ -f "$CWD/$f" ] || continue
      if ! shellcheck -S error "$CWD/$f" >/dev/null 2>&1; then
        ERRORS="${ERRORS}shellcheck errors in $f. "
      fi
    done <<< "$SH_FILES"
  fi
fi

# Markdown: unclosed code fences always; markdownlint when present.
MD_FILES=$(echo "$STAGED" | grep -E '\.md$' || true)
if [ -n "$MD_FILES" ]; then
  while IFS= read -r f; do
    [ -f "$CWD/$f" ] || continue
    FENCES=$(grep -c '^```' "$CWD/$f" 2>/dev/null || true)
    FENCES=${FENCES:-0}
    if [ $((FENCES % 2)) -ne 0 ]; then
      ERRORS="${ERRORS}Unclosed code fence in $f. "
    fi
  done <<< "$MD_FILES"

  if command -v markdownlint-cli2 &>/dev/null; then
    while IFS= read -r f; do
      [ -f "$CWD/$f" ] || continue
      if ! markdownlint-cli2 "$CWD/$f" >/dev/null 2>&1; then
        ERRORS="${ERRORS}markdownlint issues in $f. "
      fi
    done <<< "$MD_FILES"
  fi
fi

# JavaScript/TypeScript projects
if [ -f "$CWD/package.json" ]; then
  if npm --prefix "$CWD" run lint --if-present 2>&1 | grep -q "error"; then
    ERRORS="${ERRORS}Lint errors found. "
  fi
  if npm --prefix "$CWD" run typecheck --if-present 2>&1 | grep -q "error"; then
    ERRORS="${ERRORS}Type errors found. "
  fi
fi

# Python projects
if [ -f "$CWD/pyproject.toml" ] || [ -f "$CWD/setup.py" ]; then
  if command -v ruff &>/dev/null; then
    if ! ruff check "$CWD" --quiet 2>/dev/null; then
      ERRORS="${ERRORS}Ruff lint errors found. "
    fi
  fi
fi

# Rust projects
if [ -f "$CWD/Cargo.toml" ]; then
  if command -v cargo &>/dev/null; then
    if ! cargo clippy --manifest-path "$CWD/Cargo.toml" --quiet 2>/dev/null; then
      ERRORS="${ERRORS}Clippy warnings found. "
    fi
  fi
fi

# Go projects
if [ -f "$CWD/go.mod" ]; then
  if command -v go &>/dev/null; then
    if ! (cd "$CWD" && go vet ./... 2>/dev/null); then
      ERRORS="${ERRORS}Go vet errors found. "
    fi
  fi
fi

# Java projects (Spotless is fast enough for pre-commit; skip full PMD/SpotBugs)
if [ -f "$CWD/pom.xml" ]; then
  if command -v mvn &>/dev/null; then
    if ! mvn -f "$CWD/pom.xml" spotless:check -q 2>/dev/null; then
      ERRORS="${ERRORS}Java formatting issues (run mvn spotless:apply). "
    fi
  fi
elif [ -f "$CWD/build.gradle" ] || [ -f "$CWD/build.gradle.kts" ]; then
  if [ -f "$CWD/gradlew" ]; then
    if ! "$CWD/gradlew" -p "$CWD" spotlessCheck -q 2>/dev/null; then
      ERRORS="${ERRORS}Java formatting issues (run ./gradlew spotlessApply). "
    fi
  fi
fi

if [ -n "$ERRORS" ]; then
  echo "Pre-commit quality checks failed: ${ERRORS}Fix issues before committing." >&2
  exit 2
fi

exit 0
