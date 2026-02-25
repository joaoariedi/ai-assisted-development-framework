# AI Development Framework v4.0

> A systematic Claude Code configuration for **spec-driven development (SDD)** with quality gates, custom agents, automated hooks, and a full specification pipeline.

---

## Quick Start

### 1. Install via Dotfiles

```bash
# Clone the dotfiles repo (or your own fork)
git clone git@github.com:joaoariedi/dotfiles.git ~/dotfiles

# Symlink Claude Code config into ~/.claude/
cd ~/dotfiles && stow claude

# Verify symlinks
ls -la ~/.claude/
# CLAUDE.md → ../dotfiles/claude/.claude/CLAUDE.md
# commands/ → ../dotfiles/claude/.claude/commands/
# agents/   → ../dotfiles/claude/.claude/agents/
# hooks/    → ../dotfiles/claude/.claude/hooks/
# skills/   → ../dotfiles/claude/.claude/skills/
# rules/    → ../dotfiles/claude/.claude/rules/
# mcp.json  → ../dotfiles/claude/.claude/mcp.json
```

### 2. Create Machine-Local Settings

`settings.json` contains hooks and env vars. It's machine-specific and **not managed by stow**:

```bash
cat > ~/.claude/settings.json << 'EOF'
{
  "permissions": {
    "allow": [
      "Bash($HOME/.claude/hooks/speckit-helper.sh:*)"
    ]
  },
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  },
  "hooks": {
    "PreToolUse": [
      { "matcher": "Bash", "hooks": [{ "type": "command", "command": "~/.claude/hooks/quality-before-commit.sh", "timeout": 120 }] },
      { "matcher": "Edit|Write", "hooks": [{ "type": "command", "command": "~/.claude/hooks/block-sensitive-files.sh" }] }
    ],
    "PostToolUse": [
      { "matcher": "Edit|Write", "hooks": [{ "type": "command", "command": "~/.claude/hooks/run-tests-after-edit.sh", "timeout": 30 }] }
    ],
    "Stop": [
      { "matcher": "", "hooks": [{ "type": "command", "command": "~/.claude/hooks/stop-quality-check.sh", "timeout": 10 }] }
    ]
  }
}
EOF
```

> **Important**: The `speckit-helper.sh` permission is required for all spec-kit commands to work. Claude Code blocks `$()`, `||`, and `|` operators in pre-flight commands, so all logic is routed through the helper script.

### 3. Verify Installation

```bash
cd ~/any-project
claude
> /context          # should detect tech stack and structure
> /speckit.init     # bootstraps .specify/ for spec-driven dev
```

After `stow claude`, every new Claude Code session loads the rules, agents, commands, and skills automatically. See [dotfiles-setup.md](dotfiles-setup.md) for troubleshooting, management commands, and the full stow package structure.

---

## Core Principles

### 1. Spec-Driven Development
Begin features with a formal specification (user scenarios, functional requirements, success criteria). Specifications live in `.specify/` and are committed to version control. A constitution defines project-level governance principles.

### 2. Isolated Development
Each feature is developed in a dedicated branch. Spec-kit auto-generates branch names from specifications. Clean rollback via branch deletion if needed.

### 3. Test-Driven Implementation
Tests written before implementation code (Red-Green cycle). Failing test first, then minimum code to pass. Full suite must pass with no regressions after each task.

### 4. Automated Quality Gates
4 hooks enforce quality automatically (lint, file protection, test runs, reminders). `quality-guardian` agent validates before commit/PR/merge. Code quality limits enforced: functions <50 lines, files <500 lines, complexity <10.

### 5. Minimal Configuration
4 custom agents (down from 9 in v3.1) — only where built-in agents fall short. Built-in agents handle planning, exploration, and general implementation. TaskCreate/TaskUpdate for tracking. Rules and skills auto-loaded via dotfiles symlinks.

---

## Feature Development Cycle

The recommended workflow for building a feature from scratch using the spec-kit pipeline.

### Step 1 — Orient

```
> /context
```

Scans the project to detect tech stack, test frameworks, build tools, linters, key dependencies, and recent git activity. Gives you (and Claude) a snapshot of the codebase before any work begins. Run once per project or when switching context.

### Step 2 — Bootstrap Spec-Kit *(once per project)*

```
> /speckit.init
```

Creates the `.specify/` directory with `memory/`, `templates/`, and `specs/` subdirectories. This is the scaffolding that all other speckit commands depend on. Run once per project, commit it so the team shares the same structure:

```
> git add .specify/ && git commit -m "chore: initialize spec-kit scaffolding"
```

### Step 3 — Define Project Principles *(once per project)*

```
> /speckit.constitution
```

Reads your README, config files, and `.claude/rules/` to propose 5-7 governance principles — tech stack decisions, architecture constraints, testing philosophy, dependency policy. Every plan is later validated against these.

### Step 4 — Write the Specification

```
> /speckit.specify add user authentication with OAuth2
```

Takes a feature description and generates a structured specification:

- **User scenarios** — Given/When/Then format with P1/P2/P3 priorities
- **Functional requirements** — FR-001, FR-002, etc.
- **Success criteria** — SC-001, SC-002, etc.
- **Requirements checklist** — auto-generated in `checklists/`

Creates a feature branch and a dedicated directory under `.specify/specs/<branch>/`.

### Step 5 — Resolve Ambiguities *(optional)*

```
> /speckit.clarify
```

Scans the spec against 9 categories: scope boundaries, user roles, data lifecycle, error handling, edge cases, performance, security, integration, and migration. Asks up to 5 targeted multiple-choice questions. Records answers as numbered clarifications (CLR-001+) and removes `[NEEDS CLARIFICATION]` markers from the spec.

### Step 6 — Create the Plan

```
> /speckit.plan
```

Researches the codebase to resolve any remaining unknowns, identifies affected files, designs data model changes and API contracts, and writes `plan.md`. Every decision is checked against the constitution. Outputs a risk/mitigation table and a quick-start section for implementation.

### Step 7 — Generate the Task List

```
> /speckit.tasks
```

Reads both `spec.md` and `plan.md` to generate phased tasks: **Setup > Foundational > User Stories (by priority) > Polish**. Each task references a requirement (FR/US), includes a target file path, and marks parallelizable tasks with `[P]`. Creates matching entries in the Claude Code task tracker with dependencies between phases.

### Step 8a — Pre-Implementation Gate *(optional)*

```
> /speckit.checklist
```

Generates requirement quality checklists that validate specs are well-formed *before* implementation starts. Checks completeness, consistency, testability, clarity, and feasibility. Also generates UX, API, and security checklists when relevant to the feature.

### Step 8b — Consistency Check *(optional)*

```
> /speckit.analyze
```

Read-only pass across all artifacts. Runs 6 detection passes: duplication, ambiguity, underspecification, constitution alignment, coverage gaps (every FR mapped to a task), and inconsistency detection. Outputs a severity-ranked findings report with a coverage mapping table.

### Step 9 — Implement with TDD

```
> /speckit.implement
```

Executes tasks in order using strict Red-Green cycles: write failing test > verify failure > implement minimum code > verify pass > check regressions. Runs quality checks between phases. Produces a completion report mapping every requirement to passing tests.

### Step 10 — Ship

```
> /quality              # spawns quality-guardian: lint, types, format, tests
> /security-scan        # scan staged changes for secrets, SQLi, XSS
> commit this           # Claude commits with semantic message
> push it
> /pr-summary           # generates PR description from branch diff
```

The `/quality` command spawns the quality-guardian agent to run all available checks: linting, type checking, formatting, full test suite, and complexity metrics. This is the last gate before committing.

### Pipeline at a Glance

```
/context                              > orient
/speckit.init                         > bootstrap (once)
/speckit.constitution                 > principles (once)
/speckit.specify <feature>            > write spec
/speckit.clarify                      > resolve ambiguities
/speckit.plan                         > design
/speckit.tasks                        > break down work
/speckit.checklist                    > pre-impl gate
/speckit.analyze                      > consistency check
/speckit.implement                    > TDD execution
/quality                              > final quality gate
```

---

## Spec-Kit Artifacts

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

---

## All Slash Commands

| Command | Args | Description |
|---------|------|-------------|
| `/agent` | `<task>` | Start full development workflow with planning and task tracking |
| `/context` | — | Analyze project tech stack, tools, and structure |
| `/pr-summary` | — | Generate PR description from current branch diff |
| `/quality` | — | Run comprehensive quality checks (lint, types, tests) |
| `/security-scan` | — | Scan staged changes for security issues |
| `/speckit.init` | — | Bootstrap `.specify/` directory in current project |
| `/speckit.constitution` | — | Create/update project governance principles |
| `/speckit.specify` | `<feature>` | Generate spec with scenarios, requirements, success criteria |
| `/speckit.plan` | — | Generate implementation plan from spec |
| `/speckit.tasks` | — | Generate phased task list from plan and spec |
| `/speckit.implement` | — | Execute TDD implementation with quality gates |
| `/speckit.analyze` | — | Read-only cross-artifact consistency analysis |
| `/speckit.clarify` | — | Scan spec for ambiguities, ask targeted questions |
| `/speckit.checklist` | — | Generate requirement quality checklists |

---

## Custom Agents

Four specialized agents with no built-in equivalent:

| Agent | Role | When to Use |
|-------|------|-------------|
| `test-specialist` | Testing | After implementation — creates comprehensive test suites |
| `quality-guardian` | QA | Before any commit/PR/merge — lint, types, security, perf |
| `review-coordinator` | PR Mgmt | PR creation, review workflow, merge management |
| `forensic-specialist` | Security | Incident response, threat hunting, IOC generation |

For general tasks, Claude Code uses built-in agents: `Explore` (codebase search), `Plan` (architecture), `general-purpose` (implementation).

### Architecture Evolution (v3.1 > v4.0)

| v3.1 Agent | v4.0 Status | Replacement |
|-----------|-------------|-------------|
| framework-orchestrator | Removed | Claude Code handles orchestration natively |
| context-analyst | Removed | Built-in `Explore` agent + `/context` command |
| plan-architect | Removed | Built-in `Plan` agent + EnterPlanMode |
| implementation-engineer | Removed | Built-in `general-purpose` agent |
| metrics-collector | Removed | Auto-memory + TaskList for tracking |
| test-specialist | **Kept** | No built-in equivalent for test pattern analysis |
| quality-guardian | **Kept** | No built-in equivalent for multi-tool quality gates |
| review-coordinator | **Kept** | No built-in equivalent for PR workflow management |
| forensic-specialist | **Kept** | No built-in equivalent for security forensics |

### Agent + Spec-Kit Interaction

- **test-specialist**: Referenced by `/speckit.implement` for test patterns and conventions
- **quality-guardian**: Runs quality gate between implementation phases in `/speckit.implement`
- **review-coordinator**: Creates PR after implementation completes
- **forensic-specialist**: Can be triggered by `/speckit.analyze` if security concerns found

---

## Hooks (Automatic)

Shell-script hooks run automatically via `settings.json`:

| Hook | Trigger | What It Does |
|------|---------|--------------|
| `quality-before-commit.sh` | PreToolUse on `Bash` (intercepts `git commit`) | Runs language-specific linter (ESLint, ruff, clippy, go vet), blocks commit on errors |
| `block-sensitive-files.sh` | PreToolUse on `Edit\|Write` | Blocks writes to `.env*`, `*.key`, `*.pem`, `credentials*`, `.git/*` |
| `run-tests-after-edit.sh` | PostToolUse on `Edit\|Write` | Auto-runs test suite after source file edits (throttled 15s, non-blocking) |
| `stop-quality-check.sh` | Stop event | Reminds if source files were edited but tests not run (60s window) |
| `speckit-helper.sh` | Pre-flight commands | Routes all backtick logic to avoid Claude Code permission errors |

---

## Rules

Modular policies loaded into the system prompt automatically:

| Rule | Covers |
|------|--------|
| `code-quality.md` | Function/file size limits, testing, documentation policy |
| `git-workflow.md` | Commit format (`<type>: <desc>`), branch naming, co-authoring |
| `agent-workflow.md` | 18-step development workflow with spec-kit integration |
| `quality-tooling.md` | Per-language tool detection (JS/TS, Python, Rust, Go) |

---

## Skills (Internal)

Used by agents and commands internally — not invoked directly:

| Skill | Purpose |
|-------|---------|
| `context-analysis` | Project structure analysis methodology |
| `security-review` | Code security checklist (secrets, SQLi, XSS, auth) |
| `performance-audit` | N+1 queries, blocking I/O, memory leaks detection |
| `spec-template` | Generates structured Given/When/Then specifications |

---

## Task Management

The framework uses Claude Code's built-in task tracker:

| Tool | Usage |
|------|-------|
| `TaskCreate` | Mandatory for any task with >2 steps |
| `TaskUpdate` | Mark ONE task `in_progress` at a time; `completed` immediately after |
| `TaskGet` | Read full task details before starting work |
| `TaskList` | Check progress and find next available tasks |

---

## MCP Integration

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

## Quality Standards

```
Functions:   < 50 lines
Files:       < 500 lines
Complexity:  < 10 (cyclomatic)
```

Enforced by `code-quality.md` rule and `quality-guardian` agent. Test coverage follows project-configured thresholds.

---

## `.specify/` Directory *(per project)*

Created by `/speckit.init`. Commit to version control.

```
.specify/
├── memory/
│   └── constitution.md         # project principles
├── templates/
│   ├── spec.md                 # specification template
│   ├── plan.md                 # plan template
│   ├── tasks.md                # task list template
│   └── checklist.md            # checklist template
└── specs/
    └── 003-feature-name/       # one directory per feature branch
        ├── spec.md             # specification
        ├── plan.md             # implementation plan
        ├── tasks.md            # phased task list
        ├── research.md         # resolved clarifications
        └── checklists/         # requirement quality checklists
```

---

## Dotfiles Package Structure

```
~/dotfiles/claude/
├── .claude/
│   ├── CLAUDE.md               # core config (loaded into system prompt)
│   ├── mcp.json                # MCP servers (GitHub)
│   ├── agents/                 # 4 custom agents
│   ├── commands/               # 14 slash commands (5 standard + 9 speckit)
│   ├── hooks/                  # 5 lifecycle hooks (shell scripts)
│   ├── rules/                  # 4 modular policy files
│   └── skills/                 # 4 internal skills
├── .stow-local-ignore          # excludes README from stow
└── README.md
```

---

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| **v4.0.1** | 2026-02-25 | Pre-flight helper script, all commands routed through `speckit-helper.sh` |
| **v4.0.0** | 2026-02-23 | Spec-kit SDD pipeline, simplified to 4 agents, TaskCreate API |
| **v3.1.0** | 2025-11-26 | Hooks, skills, expanded commands, MCP integration |
| **v3.0.0** | 2025-09-04 | Agent-enhanced with Claude Code sub-agents |
| **v2.0.0** | 2025-09-02 | Enhanced 18-step workflow |
| **v1.0.0** | 2025-09-02 | Initial 11-step framework |

See [CHANGELOG.md](CHANGELOG.md) for details.

---

## License

MIT License — see [LICENSE](LICENSE)

---

**Framework Version**: 4.0.1 | **Last Updated**: 2026-02-25 | **Compatibility**: Claude Code with sub-agents, hooks, skills, MCP, spec-kit
