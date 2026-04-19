---
description: "Read-only plan review gate before task generation"
---

# Spec-Kit: Review

Review the implementation plan before generating tasks.

## Pre-Flight

### Current branch
!`~/.claude/hooks/speckit-helper.sh branch`

### Plan status
!`~/.claude/hooks/speckit-helper.sh check-plan-review`

### Load spec
!`~/.claude/hooks/speckit-helper.sh spec`

### Load plan
!`~/.claude/hooks/speckit-helper.sh plan`

### Constitution
!`~/.claude/hooks/speckit-helper.sh constitution`

## Instructions

**This command is strictly read-only. Do NOT modify any files.**

**Required inputs**: Both `spec.md` and `plan.md` must exist. If either is missing, tell the user which command to run first (`/speckit.specify` or `/speckit.plan`).

**Pipeline position**: This command slots between `/speckit.plan` and `/speckit.tasks`:
```
/speckit.specify → /speckit.plan → /speckit.review → /speckit.tasks → /speckit.implement
```

### Review Dimensions

Analyze the plan across six dimensions, challenging assumptions and checking for gaps:

1. **Scope Challenge**
   - Is the plan trying to do too much? Could it be split into smaller features?
   - Are there requirements that could be deferred to a later iteration?
   - Does every planned change map to a requirement in spec.md?

2. **Architecture Review**
   - Do the design decisions align with existing codebase patterns?
   - Are there simpler approaches that achieve the same result?
   - Does the file change list make sense for the scope?

3. **Design Fitness**
   - Does the data model fit the problem? Is it normalized appropriately?
   - Are API contracts clean, consistent, and following project conventions?
   - Are edge cases addressed in the design?

4. **Test Strategy**
   - Does the plan account for testing at each level (unit, integration, E2E)?
   - Are there hard-to-test areas that need design changes to become testable?
   - Are security-sensitive paths planned for dedicated security tests?

5. **Performance Implications**
   - Will the approach scale for expected load?
   - Any obvious N+1 patterns, missing indexes, or blocking I/O?
   - Are there caching opportunities the plan should address?

6. **Constitution Compliance**
   - Does every constitution principle get addressed?
   - Are any justifications weak or hand-wavy?
   - Does the plan conflict with any governance principles?

### Output Format

```
PLAN REVIEW
===========
Branch: <branch-name>
Spec: <file status>
Plan: <file status>
Date: YYYY-MM-DD

## Scope
- [OK/CONCERN] <assessment with specific references>

## Architecture
- [OK/CONCERN] <assessment with specific references>

## Design
- [OK/CONCERN] <assessment with specific references>

## Tests
- [OK/CONCERN] <assessment with specific references>

## Performance
- [OK/CONCERN] <assessment with specific references>

## Constitution
- [OK/CONCERN] <per-principle assessment>

## Verdict: APPROVE / REVISE_PLAN / NEEDS_DISCUSSION

## Suggested Changes (if REVISE_PLAN)
1. <specific, actionable change>
2. <specific, actionable change>

## Next Step
- If APPROVE: run `/speckit.tasks` to generate the task list
- If REVISE_PLAN: update plan.md, then re-run `/speckit.review`
- If NEEDS_DISCUSSION: discuss concerns with the user before proceeding
```
