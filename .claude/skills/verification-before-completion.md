---
name: "Verification Before Completion"
description: |
  Use PROACTIVELY before claiming any task is complete.
  Evidence-first gate: must run proof commands before
  reporting success. Prevents false completion claims.
allowed-tools: Read, Grep, Glob, Bash
---

# Verification Before Completion Skill

## Iron Law

**NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE.**

This rule is non-negotiable. It cannot be overridden by convenience, time pressure, or perceived simplicity of the change.

## Verification Protocol

Before claiming ANY task is complete, follow these four steps:

### Step 1: Identify What "Done" Means
- What tests must pass? (unit, integration, E2E)
- What quality checks must be clean? (lint, typecheck, format)
- What build must succeed? (compile, bundle, deploy)
- What behavior must be observable? (UI, API response, log output)

### Step 2: Run the Proof Commands
Execute the FULL verification command set — not a subset:
```bash
# Examples by stack
npm test && npm run lint && npm run typecheck     # JS/TS
pytest && ruff check . && mypy .                  # Python
cargo test && cargo clippy                        # Rust
go test -race ./... && golangci-lint run           # Go
mvn test && mvn checkstyle:check                  # Java
```

### Step 3: Show the Raw Output
- Display the actual command output — do not summarize, paraphrase, or assume
- Check the exit code: 0 = pass, non-zero = fail
- Count failures, warnings, and errors explicitly
- If output is long, show the summary line (e.g., "42 passed, 0 failed")

### Step 4: Mark Complete Only If ALL Pass
- Every test passes (0 failures)
- Lint is clean (0 errors, warnings acceptable only if pre-existing)
- Type checking passes
- Build succeeds
- If ANY check fails, fix the issue and return to Step 2

## Rationalization Prevention

| Thought | Why It Fails | Correct Action |
|---------|-------------|----------------|
| "I already ran the tests earlier" | Code changed since then — results are stale | Run tests again NOW |
| "This change is too small to break anything" | Small changes cause subtle regressions | Run tests — always |
| "The linter would have caught that" | Linters miss logic errors and edge cases | Run tests + lint together |
| "I can see from the code it works" | Visual inspection misses race conditions, edge cases | Run tests — trust evidence, not intuition |
| "The tests aren't set up for this project" | No excuse to skip verification entirely | At minimum: build, lint, manual check |

## What Counts as Fresh Evidence

- Test output from THIS iteration (after the last code change)
- Lint/typecheck output from AFTER the last edit
- Build output showing successful compilation
- Screenshot or URL showing the feature works (for UI changes)
- API response showing correct output (for backend changes)

**NOT valid evidence:**
- Output from a previous run before changes were made
- "It worked last time I checked"
- Inference from reading the code without executing it
- Partial test runs (only running one test file when the suite has many)

## Integration

- **quality-guardian**: Must invoke this protocol before marking any quality gate as PASS
- **speckit.implement**: Each task completion must follow this verification protocol
- **code-reviewer**: References this skill when validating implementation claims
- **Applies to ALL tasks**: implementation, docs, configs, refactors — everything needs verification
