# Claude Code Configuration Reference v4.0

Complete reference of all configuration files deployed via the dotfiles stow package. These are the actual files that get symlinked to `~/.claude/`.

## Setup

```bash
# Recommended: via dotfiles + stow
cd ~/dotfiles && stow claude

# Create machine-local settings (not managed by stow)
# See DOTFILES_SETUP.md for the full settings.json content
```

---

## Directory Structure

```
~/.claude/
├── CLAUDE.md               # core config (system prompt)
├── mcp.json                # MCP servers
├── agents/                 # 4 custom agents
│   ├── test-specialist.md
│   ├── quality-guardian.md
│   ├── review-coordinator.md
│   └── forensic-specialist.md
├── commands/               # 14 slash commands
│   ├── agent.md
│   ├── context.md
│   ├── pr-summary.md
│   ├── quality.md
│   ├── security-scan.md
│   ├── speckit.init.md
│   ├── speckit.constitution.md
│   ├── speckit.specify.md
│   ├── speckit.plan.md
│   ├── speckit.tasks.md
│   ├── speckit.implement.md
│   ├── speckit.analyze.md
│   ├── speckit.clarify.md
│   └── speckit.checklist.md
├── hooks/                  # 4 shell script hooks
│   ├── quality-before-commit.sh
│   ├── block-sensitive-files.sh
│   ├── run-tests-after-edit.sh
│   └── stop-quality-check.sh
├── rules/                  # 4 modular policy files
│   ├── code-quality.md
│   ├── git-workflow.md
│   ├── agent-workflow.md
│   └── quality-tooling.md
└── skills/                 # 4 internal skills
    ├── context-analysis.md
    ├── security-review.md
    ├── performance-audit.md
    └── spec-template.md
```

---

## CLAUDE.md

The core configuration loaded into every Claude Code session:

```markdown
# AI Development Framework v3.1 - Agent-Enhanced

## Custom Agents

| Agent | Role | When to Use |
|-------|------|-------------|
| **test-specialist** | Testing | After implementation, comprehensive tests |
| **quality-guardian** | QA | Before any commit, PR, or merge |
| **review-coordinator** | PR management | Creating PRs, managing review workflows |
| **forensic-specialist** | Security | Security audits, suspicious patterns |

For general tasks, use built-in agents: `Explore` (codebase search), `Plan` (architecture), `general-purpose` (implementation).

## Task Management API
- **TaskCreate**: Use for any task with >2 steps (MANDATORY)
- **TaskUpdate**: Mark exactly ONE task "in_progress" at a time; mark "completed" immediately after
- **TaskGet**: Read full task details before starting work
- **TaskList**: Check progress and find next available tasks

## Core Rules
1. Do what has been asked; nothing more, nothing less
2. NEVER create files unless absolutely necessary for achieving the goal
3. ALWAYS prefer editing existing files over creating new ones
4. NEVER proactively create documentation files (*.md) unless explicitly requested
5. Only commit when explicitly requested by the user
6. Follow existing project patterns rather than imposing new conventions
7. Keep responses concise and focused on the task
8. Use `git -C <directory>` instead of `cd <directory> && git` to avoid zoxide conflicts
9. Version declaration is deprecated in docker compose, do not add it

## Tool Usage
- Use Read to understand existing code before suggesting modifications
- Use Grep to find similar implementations
- Use Glob to discover project structure
- Use Bash only for system commands and terminal operations
- Use EnterPlanMode/ExitPlanMode for complex features requiring user approval
- For spec-driven development (SDD), use `/speckit.init` to bootstrap, then: specify -> plan -> tasks -> implement

See `.claude/rules/` for detailed policies on code quality, git workflow, agent coordination, and language-specific tooling.
```

---

## settings.json (machine-local, not stowed)

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{
          "type": "command",
          "command": "~/.claude/hooks/quality-before-commit.sh",
          "timeout": 120
        }]
      },
      {
        "matcher": "Edit|Write",
        "hooks": [{
          "type": "command",
          "command": "~/.claude/hooks/block-sensitive-files.sh"
        }]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [{
          "type": "command",
          "command": "~/.claude/hooks/run-tests-after-edit.sh",
          "timeout": 30
        }]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [{
          "type": "command",
          "command": "~/.claude/hooks/stop-quality-check.sh",
          "timeout": 10
        }]
      }
    ]
  }
}
```

---

## mcp.json

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

---

## Rules

### rules/code-quality.md
- Function length: <50 lines
- File length: <500 lines
- Cyclomatic complexity: <10
- Test existing patterns when framework present
- Focus on business logic and edge cases
- Inline documentation for complex logic only
- No hardcoded secrets or credentials

### rules/git-workflow.md
- Commit format: `<type>: <description>` + optional body + Co-Authored-By
- Types: feat, fix, refactor, test, docs, style, perf
- Branch naming: `feature/*`, `fix/*`, `refactor/*`
- Stage specific files (not `git add .`)
- Only commit when user explicitly requests

### rules/agent-workflow.md
- 18-step development workflow across 4 phases
- Phase 1: Planning (context, task list, plan review, refinement)
- Phase 2: Implementation (setup, branch, code, docs, tests, quality)
- Phase 3: Review (validation, git, self-review, final validation)
- Phase 4: Post-implementation (retrospective)
- SDD integration: spec-kit pipeline for test creation and validation

### rules/quality-tooling.md
- Auto-detect config files per language
- JS/TS: ESLint, Prettier, TypeScript, Jest/Vitest
- Python: ruff, mypy, black, pytest
- Rust: cargo clippy, rustfmt, cargo test
- Go: go vet, gofmt, go test

---

## Hooks

### hooks/quality-before-commit.sh
Intercepts `git commit` commands and runs language-specific linters. Blocks commit if linter fails. Detects language from config files (package.json, pyproject.toml, Cargo.toml, go.mod). Returns exit code 2 on failure.

### hooks/block-sensitive-files.sh
Blocks writes to `.env*`, `*.key`, `*.pem`, `*.p12`, `*.pfx`, `*.secret`, `credentials*`, `.git/*`, `*/secrets/*`. Returns exit code 2 for blocked files; requires explicit user approval to proceed.

### hooks/run-tests-after-edit.sh
Auto-detects test runner and executes tests after source file edits. Throttled to 15-second intervals per directory. Skips docs, configs, and test files. Non-blocking (always returns 0).

### hooks/stop-quality-check.sh
Checks if source files were edited recently but tests weren't run. Shows a reminder if tests are stale (60s window). Non-blocking.

---

## Agents

### agents/test-specialist.md
- **Trigger**: Use proactively after implementation
- **Expertise**: Jest, pytest, cargo test, go test
- **Workflow**: Pattern analysis, strategy design, test creation, validation
- **Standards**: Independent tests, clear failure messages, business logic focus

### agents/quality-guardian.md
- **Trigger**: Mandatory before any commit, PR, or merge
- **Checks**: Lint, types, format, security, performance, complexity
- **Languages**: JS/TS (ESLint, Prettier, TSC), Python (ruff, mypy), Rust (clippy), Go (vet)
- **Limits**: Functions <50 lines, files <500 lines, complexity <10

### agents/review-coordinator.md
- **Trigger**: When creating PRs or managing reviews
- **Capabilities**: PR descriptions with metrics, review coordination, merge management
- **Standards**: <3 review iterations, comprehensive descriptions

### agents/forensic-specialist.md
- **Trigger**: Security audits, suspected compromise
- **Capabilities**: Threat hunting, malware analysis, IOC generation
- **Constraint**: Defensive only — never creates offensive tools

---

## Skills

### skills/context-analysis.md
- **Tools**: Read, Grep, Glob (read-only)
- **Purpose**: Tech stack detection, architecture patterns, test framework discovery

### skills/security-review.md
- **Tools**: Read, Grep, Glob, WebSearch (read-only)
- **Purpose**: Hardcoded secrets, SQL injection, XSS, auth review, dependency vulnerabilities

### skills/performance-audit.md
- **Tools**: Read, Grep, Glob, Bash
- **Purpose**: N+1 queries, blocking I/O, memory leaks, caching, algorithm complexity

### skills/spec-template.md
- **Tools**: Read, Grep, Glob (read-only)
- **Purpose**: Generate Given/When/Then specifications, categorized as Must have/Should have/Edge cases

---

## Spec-Kit Commands

### commands/speckit.init.md
Bootstraps `.specify/` directory with templates (spec, plan, tasks, checklist) and a skeleton constitution. Creates `memory/`, `templates/`, and `specs/` subdirectories.

### commands/speckit.constitution.md
Reads project context (README, configs, tech stack) to propose 5 governance principles. Interactive confirmation. Semantic versioning with dates.

### commands/speckit.specify.md
Takes feature description as argument. Generates branch name, creates spec.md with user scenarios (Given/When/Then), functional requirements (FR-001+), success criteria (SC-001+). Auto-generates requirements checklist. Creates git branch.

### commands/speckit.plan.md
Loads spec + constitution. Phase 0: Research (resolve clarifications). Phase 1: Design (affected files, data model, contracts). Constitution compliance gate. Outputs plan.md.

### commands/speckit.tasks.md
Loads plan + spec. Generates phased tasks: Setup, Foundational, User Stories (by priority), Polish. `[P]` marks parallelizable tasks. Creates TaskCreate entries with dependencies.

### commands/speckit.implement.md
TDD execution: write failing test, verify fail, implement, verify pass, no regressions. Quality gate between phases. Completion report with coverage mapping.

### commands/speckit.analyze.md
Read-only analysis: duplication, ambiguity, underspecification, constitution alignment, coverage gaps, inconsistency. Severity levels: CRITICAL/HIGH/MEDIUM/LOW.

### commands/speckit.clarify.md
Scans spec against 9 taxonomy categories. Max 5 questions per session with recommended answers. Updates spec.md with `## Clarifications` section.

### commands/speckit.checklist.md
Generates requirement quality checklists (requirements.md always, plus ux.md, api.md, security.md as applicable). CHK001+ numbering with quality dimensions.

---

*Configuration Version: 4.0.0 | Last Updated: 2026-02-23*
