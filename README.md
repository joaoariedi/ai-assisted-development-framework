# 🤖 AI Development Framework v5.0

> A Claude Code plugin for **spec-driven development**: write the spec, then the plan, then the
> code — with quality gates that are enforced by hooks rather than by good intentions.

---

## 🎯 What it is

Claude Code will happily write code from a one-line prompt. That works until the change is big
enough that "what were we building?" stops having an obvious answer — and then it fails quietly,
by building the wrong thing well.

This framework adds the missing middle. A feature goes **idea → spec → plan → tasks → code**, with
a human gate at each seam, and the pipeline refuses to skip ahead. Around that sit six specialist
agents, nine hooks, and a set of rules that load into every session.

The parts that matter are the ones you cannot talk your way past:

- ✅ **A `TaskCompleted` hook blocks a task from being marked done while the tests fail.** Not a
  reminder — a hook that exits non-zero and refuses.
- 🔐 **A pre-commit hook runs secrets detection and linting**, and blocks the commit if they fail.
- 🚧 **A plan-phase hook blocks edits outside `.specify/`** while a plan is being written, so the
  agent cannot start coding "just to check something."

Everything else — the agents, the skills, the research corpus — is support for that spine.

---

## 📦 Install

**Hand `SETUP.md` to an agent.** It is a runbook written for Claude Code to execute: it clones,
installs, configures the permission rule, verifies the result, and tells you what it did.

```bash
cd ~/some-project && claude
```

> Fetch https://raw.githubusercontent.com/joaoariedi/ai-assisted-development-framework/main/SETUP.md
> and follow it to install the AI Development Framework on this machine.

Or do it yourself — it is three commands:

```bash
git clone https://github.com/joaoariedi/ai-assisted-development-framework.git ~/.claude-framework
claude plugin marketplace add ~/.claude-framework
claude plugin install ai-development-framework@ai-development-framework
```

Then **restart Claude Code** and run `/adf.context` in any git repository. It should print a
project summary. If it prints nothing, the permission rule is missing or wrong — that is the
single most common failure, and [`docs/install.md`](docs/install.md) explains exactly why.

⚠️ **One thing the plugin cannot ship:** `rules/` and `CLAUDE.md` are not plugin components, so
installing does *not* give you the framework's global rules. Copy them yourself, and re-copy after
an upgrade — see [`docs/install.md`](docs/install.md).

---

## 🗂️ Structure

| Directory | What lives there |
|---|---|
| 🛠️ `commands/` | The 18 slash commands. All namespaced (`adf.*`, `speckit.*`) so no built-in can shadow them. |
| 🕵️ `agents/` | Six specialist subagents — testing, quality, review, security, PR coordination, recon. |
| ⚙️ `hooks/` | Nine hooks, plus `speckit-helper.sh` (34 subcommands) that the commands call for live git data. |
| 🧠 `skills/` | Systematic debugging, effort estimation, performance audit. |
| 🔁 `workflows/` | `speckit-workflow.js` — executes a task list as a deterministic Workflow. |
| 📏 `.claude/rules/` | The rules loaded into every session. **Not shipped by the plugin** — copy them yourself. |
| 🧪 `tests/` | `smoke.sh` — the plugin's own test suite: 38 checks in CI, 42 with the live and end-to-end tiers. |
| 📚 `docs/` | Everything below. |

---

## 🚀 Using it

The pipeline is not all-or-nothing. Pick the path that matches the change.

### 🌱 1. A new project, from scratch

Full spec-driven development. Every gate, in order.

```bash
/speckit.init                        # bootstrap .specify/ — once per project
/speckit.constitution                # optional: project governance principles

/speckit.brainstorm  <idea>          # Socratic exploration — refine before committing
/speckit.specify     <feature>       # → spec: scenarios, requirements, success criteria
/speckit.clarify                     # ← HUMAN GATE: answers ambiguities in the spec
/speckit.plan                        # → implementation plan (writes blocked outside .specify/)
/speckit.review                      # ← HUMAN GATE: sign off on the plan
/speckit.tasks                       # → phased, dependency-ordered task list
/speckit.checklist                   # ← HUMAN GATE: requirement quality
/speckit.analyze                     # optional: cross-artifact consistency

/speckit.implement                   # TDD execution, red-green, one task at a time
/adf.quality                         # lint, types, secrets, SOLID — before you commit
```

For a **large** task list, swap the implementation step for the workflow, which runs independent
tasks in parallel and has every task adversarially verified by agents that did not write it:

```
ai-development-framework:speckit-workflow
```

It must be called by that full name; a bare `speckit-workflow` does not resolve. Run it only
**after** the human gates — a workflow cannot pause to ask you a question.

### ✨ 2. A feature, in a project already set up

`.specify/` already exists. Skip the bootstrap and the constitution.

```bash
/adf.context                         # orient: stack, tools, structure, recent activity
/speckit.specify  <feature>
/speckit.clarify                     # ← HUMAN GATE
/speckit.plan
/speckit.review                      # ← HUMAN GATE
/speckit.tasks
/speckit.implement
/adf.quality
/adf.pr-summary                      # → PR description from the branch diff
```

### 🔧 3. A trivial fix

A typo, a config tweak, a one-line bug. The pipeline would cost more than the change.

```bash
/speckit.fix  <description>          # bypasses spec/plan/tasks entirely
/adf.quality
```

The hooks still apply. You cannot commit secrets or skip the tests just because you took the
short path.

### 🏚️ 4. Brownfield — existing code, no specs

Reverse-engineer the spec from what is already there, then proceed normally.

```bash
/adf.context                         # what is this codebase?
/speckit.init
/speckit.baseline  <module>          # → spec inferred from existing code
```

Read the generated spec before trusting it — it is inferred, not authoritative. Once you have
one, treat the module as scenario 2.

### 🧰 Also available, any time

| | |
|---|---|
| 🔒 `/adf.security-scan` | Secrets, SQLi, XSS in the staged changes. |
| 🤝 `/adf.agent <task>` | Full workflow with planning and task tracking, for open-ended work. |
| 🛡️ `/adf.quality` | The quality gate. Spawns `quality-guardian`. |

Full reference: [`docs/commands.md`](docs/commands.md).

---

## ⚙️ What happens without you asking

The hooks ship with the plugin — you do not register them:

- ✏️ **On every edit** — formatters run; tests fire for the touched code.
- 🔐 **On every `git commit`** — secrets detection and linting must pass, or the commit is blocked.
- ✅ **On task completion** — the task cannot be marked done while the test suite fails.
- 🚧 **During `/speckit.plan`** — edits outside `.specify/` are blocked.

[`docs/hooks.md`](docs/hooks.md) explains each, and how to opt out deliberately when you must.

---

## 📚 Documentation

| | |
|---|---|
| 📦 [Installing & Configuring](docs/install.md) | Install, the permission rule, verification, updating, what the plugin cannot ship. |
| 🛠️ [Commands](docs/commands.md) | All 18, with arguments. |
| 🕵️ [Agents & Parallelism](docs/agents.md) | The six agents; when to use a subagent vs. a team vs. a workflow. |
| ⚙️ [Hooks & Quality Gates](docs/hooks.md) | Every hook, the Iron Laws, and the security posture. |
| 🧬 [Spec-Driven Development](docs/spec-kit.md) | The lifecycle in depth, `.specify/` artifacts, task management. |
| 🏗️ [Architecture](docs/architecture.md) | Package structure, request flow, the five-layer stack, deployment topology. |
| 🧠 [Skills](docs/skills.md) · [Rules](docs/rules.md) · [MCP](docs/mcp.md) | Component reference. |
| ⚡ [Performance & Reasoning](docs/performance.md) | Ultrathink, model selection, context management. |
| 📖 [Research Corpus](docs/research.md) | The eleven reports the framework is built on, and acknowledgments. |

---

## 🧩 Requirements

`git`, the `claude` CLI. Optional: `rtk` (CLI output compression, auto-detected), `GITHUB_TOKEN`
(for the bundled GitHub MCP server).

## 📄 License

MIT — see [LICENSE](LICENSE).

---

**Framework Version**: 5.0.0 &nbsp;|&nbsp; **Last Updated**: 2026-07-13 &nbsp;|&nbsp; **Compatibility**: Claude Code with sub-agents, hooks, skills (`<name>/SKILL.md`), MCP, spec-kit, Agent Teams
