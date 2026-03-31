# 🤖 AI Development Framework v4.3

> A systematic Claude Code configuration for **spec-driven development (SDD)** with quality gates, custom agents, automated hooks, security guardrails, and a full specification pipeline. Balances **security**, **performance**, **maintainability**, and **efficacy** at every step.

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
      { "matcher": "Edit|Write", "hooks": [
        { "type": "command", "command": "~/.claude/hooks/format-after-edit.sh", "timeout": 15 },
        { "type": "command", "command": "~/.claude/hooks/run-tests-after-edit.sh", "timeout": 30 }
      ]}
    ],
    "Notification": [
      { "matcher": "", "hooks": [{ "type": "command", "command": "~/.claude/hooks/notify-on-block.sh", "timeout": 5 }] }
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

After `stow claude`, every new Claude Code session loads the rules, agents, commands, and skills automatically. See [dotfiles-setup.md](dotfiles-setup.md) for troubleshooting and stow management.

---

## 🧬 Development Lifecycle

The framework provides three workflow paths. Choose the one that matches your task:

### ⚡ Quick Fix Path (trivial changes)

For typos, config updates, formatting fixes, and dependency bumps:

```
/speckit.fix "fix typo in error message"   → apply fix → verify → commit
```

The triviality gate ensures only genuinely trivial changes bypass the full pipeline. If your change modifies logic, APIs, or schemas, you'll be redirected to the Standard path.

### 📋 Standard SDD Path (features, refactors, bug fixes)

The full spec-driven development pipeline from idea to implementation:

```
/context              → 🧭 orient (detect stack, tools, structure)
/speckit.init         → 🏗️ bootstrap (once per project)
/speckit.constitution → 📜 define principles (once per project)
/speckit.brainstorm   → 💡 Socratic design exploration (refine the idea) ← NEW
/speckit.specify      → ✍️ write spec (scenarios, requirements, criteria)
/speckit.clarify      → 🔍 resolve ambiguities (optional)
/speckit.plan         → 📐 design (affected files, data model, API contracts)
/speckit.review       → 🔎 challenge the plan (scope, architecture, tests) ← NEW
/speckit.tasks        → 📋 generate task list (phased, with dependencies)
/speckit.checklist    → ✅ pre-implementation gate (optional)
/speckit.analyze      → 🔬 consistency check (optional)
/speckit.implement    → 🧪 TDD execution (red-green cycle)
/quality              → 🛡️ final quality gate
```

Specifications live in `.specify/specs/<branch>/` and are committed to version control. A constitution in `.specify/memory/constitution.md` defines project-level governance principles that every plan is validated against.

### 🏗️ Brownfield Path (existing code)

For projects with existing code that lack formal specifications:

```
/speckit.baseline     → 📊 reverse-engineer spec from code ← NEW
/speckit.review       → 🔎 review the inferred spec/plan
/speckit.tasks        → 📋 generate tasks for enhancements
/speckit.implement    → 🧪 execute with quality gates
```

### ⚖️ The Four Balances

Every decision in the framework balances four concerns:

| Concern | How the Framework Addresses It |
|---------|-------------------------------|
| 🔒 **Security** | Hooks block sensitive files, gitleaks secrets scanning, OWASP LLM rules, forensic-specialist agent |
| ⚡ **Performance** | performance-audit skill, quality-guardian benchmarks, CI optimization (cancel-in-progress, staged-files-only lint) |
| 🏛️ **Maintainability** | SOLID principle checks, code quality limits, systematic-debugging skill, cross-cutting change maps |
| 🎯 **Efficacy** | Iron Laws prevent false completions, spec compliance gates, verification-before-completion skill |

---

## 🛡️ Automated Quality Gates

Seven hooks enforce quality automatically — no manual intervention needed:

- 🔍 **Pre-commit** — secrets detection (gitleaks) + language-specific linting blocks the commit on errors
- 🔒 **File protection** — writes to `.env`, `*.key`, `*.pem`, credentials, and `.git/` internals are blocked
- 🎨 **Auto-format** — formatters run after every edit (ruff, biome, gofmt, rustfmt)
- 🧪 **Auto-test** — test suite runs after source file edits (throttled 15s, non-blocking)
- 📊 **Reminders** — alerts if source files were edited but tests weren't run
- 🔔 **Notifications** — desktop alerts when the agent needs human input (Linux/macOS)

The `quality-guardian` agent validates before commit/PR/merge with secrets scanning, SAST, supply chain checks, SOLID architectural analysis, performance validation, and **Iron Law enforcement**.

### 🔐 Security Posture

The framework implements layered defenses against OWASP LLM vulnerabilities:

| Layer | Mechanism | Covers |
|-------|-----------|--------|
| **Enforcement** | Hooks | Sensitive file blocking, secrets detection, pre-commit quality |
| **Guidance** | Rules | OWASP LLM Top 10, MCP security, code quality, SOLID principles |
| **Analysis** | Skills & Agents | Security review, forensic investigation, quality gates |
| **Efficacy** | Iron Laws | Verification-before-completion, systematic-debugging |

MCP servers follow strict security posture — OAuth 2.1 for production, least privilege, input validation, and human-in-the-loop for high-impact actions.

---

## ⚡ Performance & Reasoning

### 🧠 Ultrathink

Type `ultrathink` in any prompt to bump that turn to **high reasoning effort**. Use it for:

- 🏗️ Complex architectural analysis or ambiguous requirements
- 🔒 Security-sensitive code reviews
- 🐛 Debugging race conditions or subtle bugs
- 🔄 Multi-file refactoring decisions

The effort boost reverts after the response — no persistent mode change needed.

### 🎛️ Model Selection

| Mode | How | Best For |
|------|-----|----------|
| 🔴 **Opus** (default) | Standard mode | Complex architecture, security reviews |
| ⚡ **Fast Mode** | Toggle with `/fast` | Quick iterations, bug fixes, exploration |
| 🧠 **Ultrathink** | Add `ultrathink` to prompt | Deep reasoning on single turn |
| 🟢 **Haiku** | Agent frontmatter `model: haiku` | Lightweight search, simple edits |
| 🟡 **Sonnet** | Agent frontmatter `model: sonnet` | Standard agent work |

Effort levels: `max` (via `/model` only) > `high` (ultrathink) > `medium` (default) > `low`

### 📦 Context Management

For long-running sessions, the framework uses the **Document & Clear** pattern:

1. 💾 **Checkpoint** — write session state to a progress file (decisions, files changed, next steps)
2. 🧹 **Clear** — run `/clear` to reset the context window
3. ▶️ **Resume** — read the progress file and continue from "Next steps"

See `context-management.md` rule for detailed guidance and project scaling strategies (small/medium/large).

### 🌐 Multi-Environment Workflows

- 📱 **Remote Control** — start work locally with `claude`, resume from any device via claude.ai/code
- 🚀 **Teleport** — pull cloud/web sessions into local terminal with `/teleport`
- 🔄 Sessions maintain full context across terminal, IDE, web, and mobile

---

## 🕵️ Agents

Five specialized agents with no built-in equivalent:

### 🧪 test-specialist

Creates comprehensive test suites after implementation. Analyzes existing test patterns, designs unit/integration/E2E tests, runs coverage analysis. Supports Jest, Vitest, pytest, cargo test, go test, and more.

**When to use**: After implementing a feature, when you need thorough test coverage.

### 🛡️ quality-guardian

The quality gate for all code changes. Runs a 7-step validation pipeline:

1. 🔧 Tool discovery and configuration
2. 🔑 Secrets detection (mandatory, blocks on findings)
3. 📝 Code quality validation (lint, types, formatting)
4. 🔒 Security assessment (delegates to `security-review` skill + LLM security rules)
5. ⚡ Performance validation (delegates to `performance-audit` skill)
6. 🏛️ **Architectural pattern validation** — SOLID principle checks with chain-of-thought for OCP and DIP
7. 🧪 Regression prevention (full test suite)

Enforces Iron Laws from `verification-before-completion` and `systematic-debugging` skills.

**When to use**: Before any commit, PR, or merge. Spawned automatically by `/quality`.

### 🔍 code-reviewer

Two-stage code review specialist. **Stage 1** validates spec compliance (implementation matches plan, all FRs addressed, no scope creep). **Stage 2** checks code quality (SOLID, architecture, error handling, security, naming, test coverage).

Produces a structured review report with `APPROVE` / `REQUEST_CHANGES` / `NEEDS_DISCUSSION` verdict.

**When to use**: Before PR creation, after implementation. Distinct from review-coordinator (which manages the PR lifecycle).

### 📝 review-coordinator

Manages the PR lifecycle — creation, review coordination, feedback integration, and merge. Generates comprehensive PR descriptions with quality metrics. Supports GitHub and GitLab.

**When to use**: When creating PRs or managing review workflows.

### 🔒 forensic-specialist

Cybersecurity specialist for defensive forensics. Handles incident response, threat hunting, malware analysis, IOC generation with STIX/TAXII format, and MITRE ATT&CK mapping. Maintains proper chain of custody documentation.

**When to use**: When a system may be compromised, for security audits, or proactive threat hunting.

> Built-in agents handle general tasks: `Explore` (codebase search), `Plan` (architecture), `general-purpose` (implementation).

### 🤝 Agent Teams (Experimental)

For parallel work across services or modules, Agent Teams provide peer-to-peer mesh orchestration:

```
TeamCreate → TaskCreate → spawn teammates → SendMessage → shutdown → TeamDelete
```

| Pattern | Use Case |
|---------|----------|
| **Parallel impl** | Multi-service feature (API + frontend + worker) |
| **Test-driven** | TDD with parallel test writing |
| **Full pipeline** | End-to-end: impl + tests + quality + review + PR |
| **Research + build** | Deep codebase research while implementing |

Requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` (included in settings.json above).

---

## 🧠 Skills

Six skills used by agents and commands internally:

| Skill | Purpose | Auto-invoked? |
|-------|---------|---------------|
| 🔎 `context-analysis` | Project structure detection, tech stack analysis | Yes — proactively on new codebases |
| 🔒 `security-review` | Code security checklist (secrets, SAST, SQLi, XSS, auth, supply chain SCA) | Yes — proactively on PRs |
| ✅ `verification-before-completion` | Evidence-first completion gate with Iron Law — must run proof commands before claiming done | Yes — proactively before completion |
| 🐛 `systematic-debugging` | 4-phase root cause investigation (read → reproduce → evidence → fix) with Iron Law | Yes — proactively on bugs |
| ⚡ `performance-audit` | N+1 queries, blocking I/O, memory leaks, algorithm complexity | No — explicit only |
| 📄 `spec-template` | Structured Given/When/Then specification generation | No — speckit pipeline only |

The two new skills enforce **Iron Laws** — non-negotiable rules that prevent false completion claims and shotgun debugging. Each includes a rationalization prevention table to counter common excuses.

---

## 🛠️ Slash Commands

| Command | Args | Description |
|---------|------|-------------|
| `/agent` | `<task>` | Start full development workflow with planning and task tracking |
| `/context` | — | Analyze project tech stack, tools, and structure |
| `/pr-summary` | — | Generate PR description from current branch diff |
| `/quality` | — | Run comprehensive quality checks (spawns quality-guardian) |
| `/security-scan` | — | Scan staged changes for secrets, SQLi, XSS |
| `/speckit.init` | — | Bootstrap `.specify/` directory in current project |
| `/speckit.constitution` | — | Create/update project governance principles |
| `/speckit.brainstorm` | `<idea>` | Socratic design exploration before specification |
| `/speckit.specify` | `<feature>` | Generate spec with scenarios, requirements, criteria |
| `/speckit.clarify` | — | Scan spec for ambiguities, ask targeted questions |
| `/speckit.plan` | — | Generate implementation plan from spec |
| `/speckit.review` | — | Read-only plan review gate (scope, architecture, tests) |
| `/speckit.tasks` | — | Generate phased task list from plan and spec |
| `/speckit.checklist` | — | Generate requirement quality checklists |
| `/speckit.analyze` | — | Read-only cross-artifact consistency analysis |
| `/speckit.implement` | — | Execute TDD implementation with quality gates |
| `/speckit.baseline` | `<module>` | Reverse-engineer spec from existing code (brownfield) |
| `/speckit.fix` | `<description>` | Quick-fix bypass for trivial changes |

---

## ⚙️ Hooks

Shell-script hooks run automatically via `settings.json`:

| Hook | Trigger | What It Does |
|------|---------|--------------|
| 🔍 `quality-before-commit.sh` | PreToolUse on `Bash` | Intercepts `git commit` — runs gitleaks + language-specific linters, blocks on errors |
| 🔒 `block-sensitive-files.sh` | PreToolUse on `Edit\|Write` | Blocks writes to `.env*`, `*.key`, `*.pem`, `credentials*`, `.git/*`, `secrets/` |
| 🎨 `format-after-edit.sh` | PostToolUse on `Edit\|Write` | Auto-formats edited files (ruff, biome/prettier, gofmt, rustfmt), 10s throttle |
| 🧪 `run-tests-after-edit.sh` | PostToolUse on `Edit\|Write` | Auto-runs test suite after source edits, 15s throttle, non-blocking |
| 🔔 `notify-on-block.sh` | Notification | Desktop alert when agent needs attention (notify-send / osascript) |
| 📊 `stop-quality-check.sh` | Stop event | Reminds if source files were edited but tests not run |
| 🔧 `speckit-helper.sh` | Pre-flight commands | Routes backtick logic to avoid Claude Code permission errors |

---

## 📏 Rules

Modular policies loaded into every session automatically:

| Rule | Covers |
|------|--------|
| 📝 `code-quality.md` | Function/file size limits, SOLID principles, testing, verification-before-completion, Iron Laws, security test files |
| 🔀 `git-workflow.md` | Commit format, branch naming, co-authoring, staging |
| 🔄 `agent-workflow.md` | 4-phase workflow, Agent Teams, CLAUDE.md template guidance (change maps, guardrails, trust boundaries) |
| 🔧 `quality-tooling.md` | Per-language tools, tiered validation, lefthook, pre-commit/pre-push separation, CI best practices |
| 🔐 `pipeline-security.md` | ASPM services, open-source security tools, strategic selection guide |
| 🛡️ `llm-security.md` | OWASP LLM Top 10 mitigations (prompt injection, excessive agency, data leakage, supply chain) |
| 🔌 `mcp-security.md` | MCP server auth, input validation, tool poisoning defense, server curation |
| 📦 `context-management.md` | Document & Clear pattern, compact context priorities, project scaling by size |

---

## 📊 Quality Standards

```
Functions:   < 50 lines
Files:       < 500 lines
Complexity:  < 10 (cyclomatic)
SOLID:       OCP + DIP violations flagged in changed code
Iron Laws:   verification-before-completion + systematic-debugging
```

Enforced by `code-quality.md` rule and `quality-guardian` agent. Test coverage follows project-configured thresholds.

---

## 📦 Spec-Kit Artifacts

Each feature generates artifacts in `.specify/specs/<branch>/`:

| Artifact | Generated By | Purpose |
|----------|-------------|---------|
| `spec.md` | `/speckit.specify` or `/speckit.baseline` | User scenarios, functional requirements, success criteria |
| `plan.md` | `/speckit.plan` | Design, affected files, constitution compliance |
| `tasks.md` | `/speckit.tasks` | Phased task list with IDs and dependencies |
| `research.md` | `/speckit.plan` | Resolved clarifications |
| `checklists/*.md` | `/speckit.checklist` | Requirement quality checklists |
| `data-model.md` | `/speckit.plan` | Schema changes (if applicable) |
| `contracts/` | `/speckit.plan` | API contracts (if applicable) |

### `.specify/` Directory Structure

```
.specify/
├── memory/
│   └── constitution.md         # project governance principles
├── templates/
│   ├── spec.md                 # specification template
│   ├── plan.md                 # plan template
│   ├── tasks.md                # task list template
│   └── checklist.md            # checklist template
└── specs/
    └── feature-name/           # one directory per feature (kebab-case)
        ├── spec.md
        ├── plan.md
        ├── tasks.md
        ├── research.md
        └── checklists/
```

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

Add security MCP servers only when CLI tools are insufficient — each server adds context overhead. See `mcp-security.md` rule for evaluation criteria.

---

## 📁 Dotfiles Package Structure

```
~/dotfiles/claude/
├── .claude/
│   ├── CLAUDE.md               # core config (loaded into system prompt)
│   ├── mcp.json                # MCP servers (GitHub)
│   ├── agents/                 # 5 custom agents
│   ├── commands/               # 18 slash commands (5 standard + 13 speckit)
│   ├── hooks/                  # 7 lifecycle hooks (shell scripts)
│   ├── rules/                  # 8 modular policy files
│   └── skills/                 # 6 internal skills
└── .stow-local-ignore          # excludes README from stow
```

---

## 🙏 Inspirations & Acknowledgments

This framework was shaped by patterns observed in several projects:

| Project | Author | Key Contributions |
|---------|--------|-------------------|
| [superpowers](https://github.com/obra/superpowers) | Jesse Vincent | Iron Laws, rationalization prevention tables, Socratic brainstorming with hard gate, verification-before-completion, systematic debugging methodology, evidence-first workflow |
| [spec-kit](https://github.com/github/spec-kit) | GitHub | Spec-driven development (SDD) pipeline — the specify → plan → tasks → implement workflow that forms the framework's core |
| [FrankYomik](https://github.com/akitaonrails/FrankYomik) | Fabio Akita | Cross-cutting change maps, trust boundary documentation, domain-first CLAUDE.md structure |
| [FrankSherlock](https://github.com/akitaonrails/FrankSherlock) | Fabio Akita | "What NOT to change" guardrails, architecture-as-constraints pattern, `_`-prefixed research directories |
| [FrankMD](https://github.com/akitaonrails/FrankMD) | Fabio Akita | AGENTS.md as tool-agnostic contributor guide, concise do/don't lists |
| [FrankMega](https://github.com/akitaonrails/FrankMega) | Fabio Akita | Lefthook parallel hooks, security-specific test files, pre-commit vs pre-push separation, staged-files-only linting |
| [speckit-agent-skills](https://github.com/dceoy/speckit-agent-skills) | dceoy | `speckit.baseline` concept — reverse-engineering specs from existing code |
| [speckit-wiggum-toolkit](https://github.com/leonardoFu/speckit-wiggum-toolkit) | leonardoFu | `speckit.research` and `speckit.reflect` concepts — formalized research and retrospective phases |

---

## 📄 License

MIT License — see [LICENSE](LICENSE)

---

**Framework Version**: 4.3.0 &nbsp;|&nbsp; **Last Updated**: 2026-03-31 &nbsp;|&nbsp; **Compatibility**: Claude Code with sub-agents, hooks, skills, MCP, spec-kit, Agent Teams
