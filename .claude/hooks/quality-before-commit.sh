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
