# 🤖 AI Development Framework v4.0

> A systematic Claude Code configuration for **spec-driven development (SDD)** with quality gates, custom agents, automated hooks, and a full specification pipeline.

---

## ⚡ Quick Start

### 1️⃣ Install via Dotfiles

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

### 2️⃣ Create Machine-Local Settings

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

> ⚠️ **Important**: The `speckit-helper.sh` permission is required for all spec-kit commands to work. Claude Code blocks `$()`, `||`, and `|` operators in pre-flight commands, so all logic is routed through the helper script.

### 3️⃣ Verify Installation

```bash
cd ~/any-project
claude
> /context          # should detect tech stack and structure
> /speckit.init     # bootstraps .specify/ for spec-driven dev
```

After `stow claude`, every new Claude Code session loads the rules, agents, commands, and skills automatically.

---

## 🔄 Feature Development Cycle

The recommended workflow for building a feature from scratch using the spec-kit pipeline.

### 🧭 Step 1 — Orient

```
> /context
```

Outputs tech stack, architecture, test framework, build tools, key dependencies, recent git activity.

### 🏗️ Step 2 — Bootstrap Spec-Kit *(once per project)*

```
> /speckit.init
```

Creates `.specify/` directory with templates and a skeleton constitution.

```
> git add .specify/ && git commit -m "chore: initialize spec-kit scaffolding"
```

### 📜 Step 3 — Define Project Principles *(once per project)*

```
> /speckit.constitution
```

Reads README, config files, and `.claude/rules/` to propose governance principles (tech stack, architecture, testing philosophy).

### ✍️ Step 4 — Write the Specification

```
> /speckit.specify add user authentication with OAuth2
```

What happens:
1. Generates a branch name (e.g., `003-user-auth-oauth2`)
2. Creates `.specify/specs/003-user-auth-oauth2/spec.md` with user scenarios, functional requirements, and success criteria
3. Auto-generates `checklists/requirements.md`
4. Creates git branch `feature/003-user-auth-oauth2`

### 🔍 Step 5 — Resolve Ambiguities *(optional)*

```
> /speckit.clarify
```

Scans spec against 9 categories (scope, error handling, security, edge cases...) and asks up to 5 targeted multiple-choice questions.

### 📐 Step 6 — Create the Plan

```
> /speckit.plan
```

Identifies affected files, designs data model and API contracts, verifies constitution compliance. Writes `plan.md`.

### 📋 Step 7 — Generate the Task List

```
> /speckit.tasks
```

Generates phased tasks (Setup → Foundational → User Stories → Polish), marks parallelizable tasks with `[P]`, creates entries in Claude Code task tracker.

### ✅ Step 8 — Validate *(optional)*

```
> /speckit.checklist    # requirement quality checklists
> /speckit.analyze      # read-only consistency analysis
```

### 🧪 Step 9 — Implement with TDD

```
> /speckit.implement
```

For each task: write failing test → verify fail → implement → verify pass → check regressions. Quality gate between phases.

### 🚀 Step 10 — Ship

```
> /quality              # lint + types + format + tests
> /security-scan        # scan staged changes
> commit this           # Claude commits with semantic message
> push it
> /pr-summary           # generates PR description
```

### 📊 Pipeline at a Glance

```
/context                              → 🧭 orient
/speckit.init                         → 🏗️ bootstrap (once)
/speckit.constitution                 → 📜 principles (once)
/speckit.specify <feature>            → ✍️ write spec
/speckit.clarify                      → 🔍 resolve ambiguities
/speckit.plan                         → 📐 design
/speckit.tasks                        → 📋 break down work
/speckit.checklist                    → ✅ pre-impl gate
/speckit.analyze                      → 🔬 consistency check
/speckit.implement                    → 🧪 TDD execution
/quality                              → 🛡️ final quality gate
```

---

## 🛠️ All Slash Commands

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

## 🕵️ Custom Agents

Four specialized agents with no built-in equivalent:

| Agent | Role | When to Use |
|-------|------|-------------|
| 🧪 `test-specialist` | Testing | After implementation — creates comprehensive test suites |
| 🛡️ `quality-guardian` | QA | Before any commit/PR/merge — lint, types, security, perf |
| 📝 `review-coordinator` | PR Mgmt | PR creation, review workflow, merge management |
| 🔒 `forensic-specialist` | Security | Incident response, threat hunting, IOC generation |

> For general tasks, Claude Code uses built-in agents: `Explore` (codebase search), `Plan` (architecture), `general-purpose` (implementation).

---

## ⚙️ Hooks (Automatic)

Shell-script hooks run automatically via `settings.json`:

| Hook | Trigger | What It Does |
|------|---------|--------------|
| 🔍 `quality-before-commit.sh` | Before `git commit` | Runs linter, blocks commit on errors |
| 🔒 `block-sensitive-files.sh` | Before editing files | Blocks writes to `.env`, `*.key`, `*.pem` |
| 🧪 `run-tests-after-edit.sh` | After editing source | Auto-runs tests (throttled 15s) |
| 📊 `stop-quality-check.sh` | Session stop | Reminds if tests haven't run recently |
| 🔧 `speckit-helper.sh` | Pre-flight commands | Routes all `!` backtick logic to avoid permission errors |

---

## 📏 Rules

Modular policies loaded into the system prompt automatically:

| Rule | Covers |
|------|--------|
| 📝 `code-quality.md` | Function/file size limits, testing, documentation policy |
| 🔀 `git-workflow.md` | Commit format (`<type>: <desc>`), branch naming, co-authoring |
| 🔄 `agent-workflow.md` | 18-step development workflow with spec-kit integration |
| 🔧 `quality-tooling.md` | Per-language tool detection (JS/TS, Python, Rust, Go) |

---

## 🧠 Skills (Internal)

Used by agents and commands internally — not invoked directly:

| Skill | Purpose |
|-------|---------|
| 🔎 `context-analysis` | Project structure analysis methodology |
| 🔒 `security-review` | Code security checklist (secrets, SQLi, XSS, auth) |
| ⚡ `performance-audit` | N+1 queries, blocking I/O, memory leaks detection |
| 📄 `spec-template` | Generates structured Given/When/Then specifications |

---

## 📋 Task Management

The framework uses Claude Code's built-in task tracker:

| Tool | Usage |
|------|-------|
| `TaskCreate` | Mandatory for any task with >2 steps |
| `TaskUpdate` | Mark ONE task `in_progress` at a time; `completed` immediately after |
| `TaskGet` | Read full task details before starting work |
| `TaskList` | Check progress and find next available tasks |

---

## 🔌 MCP Integration

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

## 📊 Quality Standards

```
Functions:   < 50 lines
Files:       < 500 lines
Complexity:  < 10 (cyclomatic)
```

Enforced by `code-quality.md` rule and `quality-guardian` agent. Test coverage follows project-configured thresholds.

---

## 📁 `.specify/` Directory *(per project)*

Created by `/speckit.init`. Commit to version control.

```
.specify/
├── memory/
│   └── constitution.md         # 📜 project principles
├── templates/
│   ├── spec.md                 # ✍️ specification template
│   ├── plan.md                 # 📐 plan template
│   ├── tasks.md                # 📋 task list template
│   └── checklist.md            # ✅ checklist template
└── specs/
    └── 003-feature-name/       # 🔀 one directory per feature branch
        ├── spec.md             # specification
        ├── plan.md             # implementation plan
        ├── tasks.md            # phased task list
        ├── research.md         # resolved clarifications
        └── checklists/         # requirement quality checklists
```

---

## 📦 Dotfiles Package Structure

```
~/dotfiles/claude/
├── .claude/
│   ├── CLAUDE.md               # 🧠 core config (loaded into system prompt)
│   ├── mcp.json                # 🔌 MCP servers (GitHub)
│   ├── agents/                 # 🕵️ 4 custom agents
│   ├── commands/               # 🛠️ 15 slash commands (5 standard + 9 speckit + agent)
│   ├── hooks/                  # ⚙️ 5 lifecycle hooks (shell scripts)
│   ├── rules/                  # 📏 4 modular policy files
│   └── skills/                 # 🧠 4 internal skills
├── .stow-local-ignore          # excludes README from stow
└── README.md
```

---

## 📚 Files Reference

| File | Purpose |
|------|---------|
| [AI_DEVELOPMENT_FRAMEWORK.md](AI_DEVELOPMENT_FRAMEWORK.md) | Complete workflow documentation |
| [QUICK_REFERENCE.md](QUICK_REFERENCE.md) | Daily cheat sheet |
| [CLAUDE_CONFIGURATION_SAMPLE.md](CLAUDE_CONFIGURATION_SAMPLE.md) | Complete configuration reference |
| [DOTFILES_SETUP.md](DOTFILES_SETUP.md) | Installation guide |
| [AGENTS_PLAN.md](AGENTS_PLAN.md) | Agent architecture |
| [CHANGELOG.md](CHANGELOG.md) | Version history |

---

## 📅 Version History

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

## 📄 License

MIT License — see [LICENSE](LICENSE)

---

**Framework Version**: 4.0.1 &nbsp;|&nbsp; **Last Updated**: 2026-02-25 &nbsp;|&nbsp; **Compatibility**: Claude Code with sub-agents, hooks, skills, MCP, spec-kit
