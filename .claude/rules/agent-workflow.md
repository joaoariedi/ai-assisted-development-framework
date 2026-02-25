# Development Workflow

## Phase 1: Planning & Context (Steps 1-4)

### Step 1: Context Preparation
- Use built-in `Explore` agent or `/context` command for project analysis
- Auto-detect tech stack from `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`
- Identify existing patterns, conventions, and quality tools

### Step 2: Create Task List & Plan
- Use TaskCreate for comprehensive task breakdown with acceptance criteria
- Use EnterPlanMode/ExitPlanMode for complex implementations

### Step 3: Plan Review (Optional for Simple Tasks)
- For complex features (>5 tasks), use EnterPlanMode for user approval
- Skip for simple tasks (<3 tasks)

### Step 4: Plan Refinement
- Iterate tasks based on user feedback
- Break down large tasks into smaller, manageable pieces

## Phase 2: Implementation with Quality Gates (Steps 5-10)

### Step 5: Pre-Implementation Setup
- Detect existing quality tools using Grep/Glob
- Identify available lint, format, and test commands

### Step 6: Branch Creation (Git Projects Only)
- Create feature branches with semantic naming
- Skip for non-git projects

### Step 7: Incremental Development with Task Tracking
- **Use TaskUpdate to mark task as "in_progress" before starting work**
- Follow code quality limits (functions <50 lines, files <500 lines)
- **Use TaskUpdate to mark task as "completed" immediately after finishing**
- Use semantic commit messages

### Step 8: Documentation During Development
- Inline documentation for complex functions only
- Focus on code clarity over excessive documentation

### Step 9: Test Creation & Validation
- For spec-driven development (SDD), use the spec-kit pipeline: `/speckit.specify` → `/speckit.plan` → `/speckit.tasks` → `/speckit.implement`
- Use `test-specialist` agent for comprehensive test suites
- Find existing test patterns using Glob: `**/*test*`, `**/spec/**`
- PostToolUse hook auto-runs tests after source file edits (throttled to 15s)

### Step 10: Quality Checks
- Use `quality-guardian` agent before any commit or PR
- ALWAYS run quality checks after implementation
- Fix any issues before considering task complete

## Phase 3: Review & Integration (Steps 11-16)

### Step 11: Local Validation
- Ensure all tasks are completed via TaskList
- Run full test suite, verify no regressions

### Step 12: Git Integration
- Stage relevant changes by name
- Create semantic commit with co-author option

### Step 13-14: Self-Review & Issue Resolution
- Review for security, performance, maintainability
- Fix quality check failures, re-run tests

### Step 15-16: Final Validation & Completion
- Verify all acceptance criteria met
- Use `review-coordinator` agent for PR creation if needed
- Only commit when user explicitly requests it

## Phase 4: Post-Implementation (Steps 17-18) - Optional

### Step 17-18: Retrospective
- Note lessons learned in auto-memory
- Record useful patterns discovered
