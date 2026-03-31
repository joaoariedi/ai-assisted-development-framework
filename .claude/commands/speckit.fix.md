---
description: "Quick-fix bypass for trivial changes that skip the full SDD workflow"
argument-hint: "<description of trivial change>"
---

# Spec-Kit: Fix

Apply a quick fix for: **$ARGUMENTS**

## Pre-Flight

### Current branch
!`$HOME/.claude/hooks/speckit-helper.sh branch`

### Change scope
!`$HOME/.claude/hooks/speckit-helper.sh trivial-change-check`

## Instructions

This command bypasses the full SDD pipeline (specify → plan → tasks → implement) for genuinely trivial changes. It includes a triviality gate to prevent misuse.

### Triviality Gate

A change qualifies as trivial ONLY if **ALL** of these are true:
- Fewer than 5 files changed
- No new files created
- No logic changes, no new features, no API changes, no schema changes
- Change is one of the types in the table below

| Trivial (use `/speckit.fix`) | Not Trivial (use `/speckit.specify`) |
|------------------------------|--------------------------------------|
| Fix typo in error message | Change error handling logic |
| Update dependency version | Add new dependency |
| Fix indentation/formatting | Refactor function structure |
| Update config value | Add new config option |
| Fix broken link in docs | Add new documentation section |
| Rename variable for clarity | Change function signature |
| Remove unused import | Remove unused module/feature |
| Update comment text | Change code behavior |

### If Trivial (passes the gate)

1. **Apply the fix** directly — no spec, no plan, no tasks needed
2. **Verify** using the `verification-before-completion` skill protocol:
   - Run tests: confirm all pass
   - Run lint: confirm clean
   - Show the actual output — do not assume or summarize
3. **Suggest commit message**:
   - Typo/style: `fix: <description>` or `style: <description>`
   - Config/deps: `chore: <description>`
   - Documentation: `docs: <description>`
4. **Remind user**: "This bypassed the SDD pipeline. For anything beyond trivial, use `/speckit.specify`."

### If NOT Trivial (fails the gate)

1. **Explain** why the change is not trivial (which criteria it fails)
2. **Redirect**: "This change modifies logic/APIs/schema. Use `/speckit.specify $ARGUMENTS` instead."
3. **Do NOT proceed** with the fix — the full pipeline exists for a reason

### When In Doubt

If you're unsure whether a change is trivial, it probably isn't. Default to `/speckit.specify` — the cost of a quick spec is low, but the cost of an unplanned change can be high.
