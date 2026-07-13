# Agents & Parallelism

[← back to README](../README.md)

## 🕵️ Agents

Six specialized agents with no built-in equivalent:

### 🧪 test-specialist

Creates comprehensive test suites after implementation. Analyzes existing test patterns, designs unit/integration/E2E tests, runs coverage analysis. Supports Jest, Vitest, pytest, cargo test, go test, and more.

**When to use**: After implementing a feature, when you need thorough test coverage.

### 🛡️ quality-guardian

The quality gate for all code changes. Runs a 7-step validation pipeline:

1. 🔧 Tool discovery and configuration
2. 🔑 Secrets detection (mandatory, blocks on findings)
3. 📝 Code quality validation (lint, types, formatting)
4. 🔒 Security assessment (delegates to the built-in `/security-review` + LLM security rules)
5. ⚡ Performance validation (delegates to `performance-audit` skill)
6. 🏛️ **Architectural pattern validation** — SOLID principle checks with chain-of-thought for OCP and DIP
7. 🧪 Regression prevention (full test suite)

Enforces both Iron Laws from `rules/code-quality.md`: **verification before completion** (proved with `/verify`) and **no fixes without root-cause investigation** (the `systematic-debugging` skill).

**When to use**: Before any commit, PR, or merge. Spawned automatically by `/adf.quality`.

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

### 🔭 repo-scout

The framework's only **one-shot subagent**. Answers a single targeted question about a repository *other than* the current project, then returns a citation-backed `<repo-scout-digest>` — never raw file contents or a transcript. Its working context is discarded, so a foreign repo can be interrogated without bloating the main session.

Read-only by construction (`Read`, `Grep`, `Glob`, `Bash` only). It must never mutate the current project; if a change is needed it returns a *proposal* and the main agent executes it.

**When to use**: "How does upstream library X implement Y?" — not for the current project, where `Explore`/`Grep` are cheaper. See the One-Shot Subagents section of `rules/agent-workflow.md` for the design contract.

> Built-in agents handle general tasks: `Explore` (codebase search), `Plan` (architecture), `general-purpose` (implementation).

### 🤝 Parallelism: Three Primitives

They are not interchangeable, and none supersedes the others:

| | Subagents | Agent Teams | Workflows |
|---|---|---|---|
| **Communication** | Report to the caller only | Teammates message each other | None — a script wires the stages |
| **Determinism** | Model decides | Lead decides, turn by turn | **Code decides** |
| **Scale** | A few | 3–5 | Dozens to hundreds |
| **Best for** | Result-only tasks | Debate, challenge, competing hypotheses | Repeatable fan-out |

Reach for a **subagent** by default — you want an answer, not a colleague. Reach for an **Agent Team** when workers must *challenge each other*: five teammates trying to disprove each other's hypotheses beat sequential investigation, which anchors on the first plausible theory.

**`speckit-workflow`** (`workflows/speckit-workflow.js`) is the framework's workflow — invoked as `ai-development-framework:speckit-workflow` under a plugin install, since plugin components are namespaced. It is named distinctly from the `/speckit.implement` **command** on purpose: they are two ways to execute `tasks.md`, and a shared name invited picking the wrong one. It executes `tasks.md` with the orchestration moved into code:

- **Phase order is enforced, not trusted.** Spec-kit declares Phase N+1 blocked by Phase N. A script guarantees that barrier; a model can talk itself into skipping ahead.
- **The implementer never grades its own homework.** Every task is checked by three agents that did not write it, through *different* lenses — one reads the test diff hunting for a weakened assertion, one checks the requirement rather than the test, one runs the full suite itself. Any single refutation blocks the task. This is the Verification Iron Law made structural.
- **`[P]` is not trusted either.** The marker is model-written and nothing enforces it, so two `[P]` tasks in one phase can name the same file. The script batches them by *actual file disjointness*; a task declaring no files is serialized, because it cannot be proven safe.
- **`tasks.md` is written once, at the end**, by a single agent — parallel implementers ticking their own checkboxes would race on one file.

> **Why the whole pipeline is not one workflow.** A workflow cannot take mid-run input. But `/speckit.clarify` asks you questions, `/speckit.review` is a sign-off, and `/speckit.checklist` is a gate. Encoding the full pipeline as one workflow would silently delete every human gate and turn spec-*driven* development into fire-and-forget. Run the gated phases first; the workflow starts where the human sign-off ends.

**Agent Teams (Experimental)** — requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`.

```
spawn teammates → TaskCreate → TaskUpdate (assign or self-claim) → SendMessage → shutdown_request
```

> ⚠️ `TeamCreate` and `TeamDelete` **no longer exist** (removed in v2.1.178), and `team_name` on the Agent tool is accepted but **ignored**. A team forms when the first teammate spawns and is cleaned up automatically at session end — there is no setup or teardown step. Start with **3–5 teammates**, 5–6 tasks each.

| Pattern | Use Case |
|---------|----------|
| **Parallel impl** | Multi-service feature (API + frontend + worker) |
| **Test-driven** | TDD with parallel test writing |
| **Full pipeline** | End-to-end: impl + tests + quality + review + PR |
| **Research + build** | Deep codebase research while implementing |

Requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in `~/.claude/settings.json` — it is opt-in, and shown in step 2️⃣ above. A plugin cannot ship an env var.

---

