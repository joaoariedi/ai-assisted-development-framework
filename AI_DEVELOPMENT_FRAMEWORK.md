# AI-Assisted Development Framework v4.0

## Overview

This framework establishes a systematic approach to AI-assisted software development using Claude Code. It combines spec-driven development (SDD), automated quality gates, specialized agents, and a structured 18-step workflow to produce high-quality software efficiently.

## Core Principles

### 1. Spec-Driven Development
- Begin features with a formal specification (user scenarios, functional requirements, success criteria)
- Specifications are written in `.specify/` and committed to version control
- A constitution defines project-level governance principles
- The spec-kit pipeline guides the full cycle: specify, plan, tasks, implement

### 2. Isolated Development
- Each feature developed in a dedicated branch
- Spec-kit auto-generates branch names from specifications
- Clean rollback via branch deletion if needed

### 3. Test-Driven Implementation
- Tests written before implementation code (Red-Green cycle)
- Failing test first, then minimum code to pass
- Full suite must pass with no regressions after each task
- Quality gate runs between implementation phases

### 4. Automated Quality Gates
- 4 hooks enforce quality automatically (lint, file protection, test runs, reminders)
- `quality-guardian` agent validates before commit/PR/merge
- Code quality limits enforced: functions <50 lines, files <500 lines, complexity <10

### 5. Minimal Configuration
- 4 custom agents (down from 9) — only where built-in agents fall short
- Built-in agents handle planning, exploration, and general implementation
- TaskCreate/TaskUpdate for tracking (replaces TodoWrite)
- Rules and skills auto-loaded via dotfiles symlinks

## Agent Architecture

### Custom Agents (4)

| Agent | Phase | Purpose |
|-------|-------|---------|
| `test-specialist` | Phase 2 | Creates comprehensive test suites following existing patterns |
| `quality-guardian` | Phase 2-3 | Lint, type checks, security scans, performance validation |
| `review-coordinator` | Phase 3 | PR descriptions, review workflow, merge management |
| `forensic-specialist` | Security | Threat hunting, IOC generation, chain of custody |

### Built-in Agents (used automatically)

| Agent | Purpose |
|-------|---------|
| `Explore` | Fast codebase search and exploration |
| `Plan` | Architecture design and implementation planning |
| `general-purpose` | Multi-step implementation tasks |

### Agent Usage Rules
- Prefer built-in agents for general tasks
- Use custom agents only for their specialized capabilities
- `quality-guardian` is mandatory before any commit, PR, or merge
- `test-specialist` should be used proactively after implementation
- `forensic-specialist` activates proactively when suspicious patterns are detected

## Enhanced Workflow Steps

### Phase 1: Planning & Context Setup (Steps 1-4)

#### Step 1: Context Preparation
- Use `Explore` agent or `/context` command for project analysis
- Auto-detect tech stack from `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`
- Identify existing patterns, conventions, and quality tools

#### Step 2: Create Task List & Plan
- Use TaskCreate for comprehensive task breakdown with acceptance criteria
- Use EnterPlanMode/ExitPlanMode for complex implementations
- For spec-driven features, use `/speckit.specify` to write the specification first

#### Step 3: Plan Review (Optional for Simple Tasks)
- For complex features (>5 tasks), use EnterPlanMode for user approval
- For SDD features, `/speckit.plan` generates the design with constitution compliance
- Skip for simple tasks (<3 tasks)

#### Step 4: Plan Refinement
- Iterate tasks based on user feedback
- Use `/speckit.clarify` to resolve ambiguities in specifications
- Break down large tasks into smaller, manageable pieces

### Phase 2: Implementation with Quality Gates (Steps 5-10)

#### Step 5: Pre-Implementation Setup
- Detect existing quality tools using Grep/Glob
- Identify available lint, format, and test commands
- For SDD: run `/speckit.tasks` to generate phased task list with dependencies
- Optionally run `/speckit.checklist` for requirement quality validation

#### Step 6: Branch Creation (Git Projects Only)
- Features: `feature/<descriptive-name>`
- Fixes: `fix/<issue-description>`
- Refactoring: `refactor/<component-name>`
- Spec-kit auto-creates branches from spec names (e.g., `feature/003-user-auth`)

#### Step 7: Incremental Development with Task Tracking
- Use TaskUpdate to mark task as `in_progress` before starting work
- Follow code quality limits (functions <50 lines, files <500 lines)
- Use TaskUpdate to mark task as `completed` immediately after finishing
- Use semantic commit messages: `<type>: <description>`

#### Step 8: Documentation During Development
- Inline documentation for complex functions only
- Focus on code clarity over excessive documentation
- Code should be self-documenting through clear naming

#### Step 9: Test Creation & Validation
- For spec-driven development (SDD), use the spec-kit pipeline: `/speckit.specify` -> `/speckit.plan` -> `/speckit.tasks` -> `/speckit.implement`
- Use `test-specialist` agent for comprehensive test suites
- Find existing test patterns using Glob: `**/*test*`, `**/spec/**`
- Hook auto-runs tests after source file edits (throttled to 15s)

#### Step 10: Quality Checks
- Use `quality-guardian` agent before any commit or PR
- Always run quality checks after implementation
- Fix any issues before considering task complete

### Phase 3: Review & Integration (Steps 11-16)

#### Step 11: Local Validation
- Ensure all tasks are completed via TaskList
- Run full test suite, verify no regressions

#### Step 12: Git Integration
- Stage relevant changes by name (not `git add .`)
- Create semantic commit with Co-Authored-By

#### Step 13-14: Self-Review & Issue Resolution
- Review for security, performance, maintainability
- Fix quality check failures, re-run tests

#### Step 15-16: Final Validation & Completion
- Verify all acceptance criteria met
- Use `review-coordinator` agent for PR creation if needed
- Only commit when user explicitly requests it

### Phase 4: Post-Implementation (Steps 17-18) - Optional

#### Step 17-18: Retrospective
- Note lessons learned in auto-memory
- Record useful patterns discovered

## Spec-Kit Pipeline (SDD)

The spec-kit pipeline provides a structured approach to spec-driven development:

```
/speckit.init              Bootstrap .specify/ directory (once per project)
       |
/speckit.constitution      Define project principles (once per project)
       |
/speckit.specify <feat>    Write spec: scenarios, requirements, success criteria
       |
/speckit.clarify           Resolve ambiguities (optional)
       |
/speckit.plan              Design: research, affected files, constitution compliance
       |
/speckit.tasks             Break down: phased tasks with dependencies
       |
/speckit.checklist         Validate requirements quality (optional)
       |
/speckit.analyze           Cross-artifact consistency check (optional)
       |
/speckit.implement         TDD execution: red-green cycle per task
```

### Spec-Kit Artifacts

Each feature generates artifacts in `.specify/specs/<branch>/`:

| Artifact | Generated By | Purpose |
|----------|-------------|---------|
| `spec.md` | `/speckit.specify` | User scenarios, FRs, success criteria |
| `plan.md` | `/speckit.plan` | Design, affected files, constitution compliance |
| `tasks.md` | `/speckit.tasks` | Phased task list with IDs and dependencies |
| `research.md` | `/speckit.plan` | Resolved clarifications |
| `checklists/*.md` | `/speckit.checklist` | Requirement quality checklists |
| `data-model.md` | `/speckit.plan` | Schema changes (if applicable) |
| `contracts/` | `/speckit.plan` | API contracts (if applicable) |

## Hooks System

All hooks are shell scripts in `~/.claude/hooks/`, configured via `settings.json`:

### quality-before-commit.sh
- **Trigger**: PreToolUse on `Bash` (intercepts `git commit`)
- **Action**: Runs language-specific linter, blocks commit on errors
- **Languages**: ESLint/TypeScript, ruff, cargo clippy, go vet

### block-sensitive-files.sh
- **Trigger**: PreToolUse on `Edit|Write`
- **Action**: Blocks writes to `.env*`, `*.key`, `*.pem`, `credentials*`, `.git/*`
- **Override**: Requires explicit user approval

### run-tests-after-edit.sh
- **Trigger**: PostToolUse on `Edit|Write`
- **Action**: Auto-runs test suite after source file edits
- **Throttle**: 15 seconds between runs
- **Non-blocking**: Always returns 0

### stop-quality-check.sh
- **Trigger**: Stop event
- **Action**: Reminds if source files were edited but tests not run (60s window)
- **Non-blocking**: Always returns 0

## Quality Tooling by Language

### JavaScript/TypeScript
```bash
# Config detection: package.json, .eslintrc*, tsconfig.json
npm run lint          # ESLint
npm run typecheck     # TypeScript
npm run format        # Prettier
npm test              # Jest/Vitest
```

### Python
```bash
# Config detection: pyproject.toml, requirements.txt
ruff check .          # Linting
mypy .                # Type checking
ruff format .         # Formatting
pytest                # Testing
```

### Rust
```bash
# Config detection: Cargo.toml
cargo clippy          # Linting
cargo fmt             # Formatting
cargo test            # Testing
```

### Go
```bash
# Config detection: go.mod
go vet ./...          # Linting
go fmt ./...          # Formatting
go test ./...         # Testing
```

## Task Management

The framework uses Claude Code's TaskCreate/TaskUpdate API:

```
TaskCreate    → mandatory for any task with >2 steps
                subject, description, activeForm fields

TaskUpdate    → mark exactly ONE task "in_progress" at a time
                mark "completed" immediately after finishing

TaskGet       → read full task details before starting work

TaskList      → check progress, find next available tasks
```

Rules:
- Only ONE task `in_progress` at a time
- Mark `completed` immediately after finishing
- Use TaskCreate for any work with >2 steps

## MCP Integration

Single MCP server for GitHub automation:

```json
{
  "mcpServers": {
    "github": {
      "transport": "http",
      "url": "https://api.githubcopilot.com/mcp/v1",
      "scope": "user",
      "description": "GitHub PR/Issue automation for review-coordinator agent"
    }
  }
}
```

## Code Quality Standards

### Complexity Limits
- Maximum function length: 50 lines
- Maximum file length: 500 lines
- Maximum cyclomatic complexity: 10
- Clear, descriptive naming always

### Quality Assurance
- Always run available quality tools before completing any task
- Fix linting and type errors immediately
- No hardcoded secrets or credentials
- Follow existing project conventions and patterns

### Git Workflow
- Commit format: `<type>: <description>` with optional body and Co-Authored-By
- Types: feat, fix, refactor, test, docs, style, perf
- Branch naming: `feature/*`, `fix/*`, `refactor/*`
- Stage specific files (not `git add .`)
- Only commit when user explicitly requests it

---

*Framework Version: 4.0.0 | Last Updated: 2026-02-23*
