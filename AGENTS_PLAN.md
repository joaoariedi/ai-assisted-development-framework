# AI Development Framework: Agent Architecture v4.0

## Executive Summary

The framework uses 4 specialized Claude Code custom agents complemented by Claude Code's built-in agents. Custom agents exist only where built-in agents lack specialized capabilities. This is a significant simplification from v3.1's 9-agent architecture.

## Architecture Evolution

### v3.1 (9 agents) -> v4.0 (4 agents)

| v3.1 Agent | v4.0 Status | Replacement |
|-----------|-------------|-------------|
| framework-orchestrator | **Removed** | Claude Code handles orchestration natively |
| context-analyst | **Removed** | Built-in `Explore` agent + `/context` command |
| plan-architect | **Removed** | Built-in `Plan` agent + EnterPlanMode |
| implementation-engineer | **Removed** | Built-in `general-purpose` agent |
| metrics-collector | **Removed** | Auto-memory + TaskList for tracking |
| test-specialist | **Kept** | No built-in equivalent for test pattern analysis |
| quality-guardian | **Kept** | No built-in equivalent for multi-tool quality gates |
| review-coordinator | **Kept** | No built-in equivalent for PR workflow management |
| forensic-specialist | **Kept** | No built-in equivalent for security forensics |

### Design Rationale

Claude Code's built-in agents (Explore, Plan, general-purpose) handle most development tasks effectively. Custom agents are justified only when:
1. The task requires a specialized system prompt with domain expertise
2. The built-in agents lack the specific workflow or checklist
3. The task needs tool restrictions for safety (e.g., read-only skills)

## Current Agent Definitions

### test-specialist
```yaml
Purpose: Comprehensive test suite creation following existing patterns
Trigger: Use PROACTIVELY after implementation
Capabilities:
  - Pattern analysis (discover existing test conventions)
  - Strategy design (unit, integration, E2E, performance)
  - Test implementation (follows AAA pattern)
  - Validation (coverage, independence, failure messages)
Languages: Jest, pytest, cargo test, go test
Quality: Business logic and edge cases focus, reasonable coverage
```

### quality-guardian
```yaml
Purpose: Quality assurance before commit, PR, or merge
Trigger: MUST BE USED before any commit, PR, or merge
Capabilities:
  - Linting (ESLint, ruff, cargo clippy, go vet)
  - Type checking (TypeScript, mypy, cargo check)
  - Formatting (Prettier, black/ruff format, cargo fmt, gofmt)
  - Security scanning (secrets, injection, XSS)
  - Performance validation (response times, complexity)
  - Regression detection (full test suite)
Limits: Functions <50 lines, files <500 lines, complexity <10
Decision: PASS/FAIL with specific violations
```

### review-coordinator
```yaml
Purpose: PR creation, review management, merge workflow
Trigger: When creating PRs or managing review workflows
Capabilities:
  - PR description generation with metrics
  - Review coordination and feedback integration
  - Merge strategy selection (merge, squash, rebase)
  - Post-merge cleanup
Standards: <3 review iterations, comprehensive descriptions
```

### forensic-specialist
```yaml
Purpose: Defensive security forensics and threat analysis
Trigger: Use PROACTIVELY for security audits or suspicious patterns
Capabilities:
  - Threat hunting and detection
  - Malware analysis (static and behavioral)
  - IOC (Indicator of Compromise) generation
  - Chain of custody documentation
  - Security audit and remediation guidance
Constraint: Defensive ONLY — never creates offensive tools
```

## Built-in Agents (used automatically)

| Agent | Purpose | When Used |
|-------|---------|-----------|
| `Explore` | Fast codebase search, file discovery | Searching code, finding patterns |
| `Plan` | Architecture design, implementation planning | Complex feature planning |
| `general-purpose` | Multi-step implementation, research | Code implementation, multi-file changes |

## Spec-Kit Integration

The spec-kit SDD pipeline replaces the old `/spec-driven` skill with 9 slash commands:

```
/speckit.init          → Bootstrap .specify/ directory
/speckit.constitution  → Define project principles
/speckit.specify       → Write specification (scenarios, FRs, SCs)
/speckit.clarify       → Resolve ambiguities
/speckit.plan          → Generate implementation plan
/speckit.tasks         → Generate phased task list
/speckit.checklist     → Requirement quality checklists
/speckit.analyze       → Cross-artifact consistency check
/speckit.implement     → TDD execution (red-green cycle)
```

### How Agents Interact with Spec-Kit

- **test-specialist**: Referenced by `/speckit.implement` for test patterns and conventions
- **quality-guardian**: Runs quality gate between implementation phases in `/speckit.implement`
- **review-coordinator**: Creates PR after implementation completes
- **forensic-specialist**: Can be triggered by `/speckit.analyze` if security concerns found

## Task Management

Replaced TodoWrite with Claude Code's TaskCreate/TaskUpdate API:

| Tool | Usage |
|------|-------|
| TaskCreate | Mandatory for >2 step tasks. Used by `/speckit.tasks` to create entries |
| TaskUpdate | Mark `in_progress` before work, `completed` after. ONE at a time |
| TaskGet | Read full details before starting |
| TaskList | Check progress, find next available |

## Hooks System

Shell script hooks in `~/.claude/hooks/`, configured via `settings.json`:

| Hook | Event | Action |
|------|-------|--------|
| `quality-before-commit.sh` | PreToolUse (Bash) | Block commit on lint errors |
| `block-sensitive-files.sh` | PreToolUse (Edit/Write) | Block writes to sensitive files |
| `run-tests-after-edit.sh` | PostToolUse (Edit/Write) | Auto-run tests (15s throttle) |
| `stop-quality-check.sh` | Stop | Remind if tests not run |

## Skills System

Read-only analysis skills (no Write/Edit access):

| Skill | Tools | Purpose |
|-------|-------|---------|
| `context-analysis` | Read, Grep, Glob | Project structure and tech stack analysis |
| `security-review` | Read, Grep, Glob, WebSearch | Security vulnerability scanning |
| `performance-audit` | Read, Grep, Glob, Bash | Performance bottleneck detection |
| `spec-template` | Read, Grep, Glob | Given/When/Then specification generation |

---

*Architecture Version: 4.0.0 | Last Updated: 2026-02-23*
