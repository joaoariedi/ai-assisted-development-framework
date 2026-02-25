---
description: "Execute TDD implementation from spec-kit artifacts with quality gates"
---

# Spec-Kit: Implement

Execute the implementation plan using strict TDD cycles with quality gates.

## Pre-Flight

### Current branch
!`$HOME/.claude/hooks/speckit-helper.sh branch`

### Load artifacts
!`$HOME/.claude/hooks/speckit-helper.sh check-artifacts`

### Constitution
!`$HOME/.claude/hooks/speckit-helper.sh constitution`

### Checklists
!`$HOME/.claude/hooks/speckit-helper.sh checklists`

### Test framework detection
!`$HOME/.claude/hooks/speckit-helper.sh detect-test-framework`

## Instructions

**Required inputs**: `tasks.md`, `plan.md`, and `spec.md` must all exist. If any are missing, tell the user which command to run first.

### Pre-Implementation Gate

1. **Checklist validation**: if checklists exist in `.specify/specs/<branch>/checklists/`, scan for unchecked items:
   - If CRITICAL unchecked items exist → **pause and ask user** whether to proceed or resolve first
   - If only MEDIUM/LOW unchecked items → warn but continue

2. **Load all artifacts**:
   - `tasks.md` — the task list to execute
   - `plan.md` — design decisions and affected files
   - `spec.md` — requirements and success criteria
   - `constitution.md` — governance principles
   - `data-model.md`, `contracts/` — if they exist

### Phase-by-Phase TDD Execution

3. **For each task in tasks.md** (in order, respecting phase boundaries):

   **a. Mark task in progress**
   - Update `tasks.md`: change `- [ ]` to `- [~]` for current task
   - Use TaskUpdate to set status `in_progress` in the Claude Code tracker

   **b. Write failing test** (Red phase)
   - Use `test-specialist` agent patterns to identify test location and conventions
   - Write a test that validates the task's acceptance criteria
   - Test MUST fail at this point (implementation doesn't exist yet)
   - Run the test to confirm failure

   **c. Verify failure**
   - Execute the specific test
   - Confirm it fails for the expected reason (not a syntax error or import issue)
   - If it passes unexpectedly, the test isn't testing new behavior — revise it

   **d. Implement** (Green phase)
   - Write minimum code to make the failing test pass
   - Follow code quality limits from `.claude/rules/code-quality.md`:
     - Functions < 50 lines
     - Files < 500 lines
     - Cyclomatic complexity < 10
   - Follow patterns identified in `plan.md`

   **e. Verify pass**
   - Run the specific test — it must now pass
   - Run the full test suite — no regressions allowed
   - If any test fails, fix the implementation (never modify the test to make it pass)

   **f. Mark task complete**
   - Update `tasks.md`: change `- [~]` to `- [x]`
   - Use TaskUpdate to set status `completed` in the Claude Code tracker

4. **Between phases**: run quality checks using `quality-guardian` patterns:
   - Linting, type checking, formatting
   - Full test suite
   - Fix any issues before proceeding to the next phase

### Completion

5. **Final quality gate**:
   - Run all quality checks (lint, types, format, tests)
   - Verify all tasks in `tasks.md` are `[x]`
   - Verify all TaskUpdate entries are `completed`

6. **Generate completion report**:
   ```
   IMPLEMENTATION REPORT
   =====================
   Tasks completed: X/Y
   Tests written:   N
   Tests passing:   N/N
   Quality checks:  PASS/FAIL
   Files modified:  N
   Files created:   N

   Coverage mapping:
   FR-001 → T001, T002 → PASS
   FR-002 → T003       → PASS
   SC-001 → verified via T001

   Constitution compliance: ALL PRINCIPLES MET
   ```

7. **Suggest next steps**:
   - `/speckit.analyze` for cross-artifact consistency check
   - Commit and create PR when ready
