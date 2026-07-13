# Claude Code Harness Capabilities

What the Claude Code harness natively provides — skill loading rules, invocation control, subagent forking, lifecycle hooks, and the bundled skills — and where a custom framework should lean on it instead of reimplementing it. This file exists because the framework spent three releases hand-rolling behaviour the harness ships for free, and shipped a skills layer that never loaded.

This file does **not** cover the agent-topology *theory* (Skills vs Subagents vs Teams as architectural patterns) — see `03-agent-topology-orchestration.md`; nor MCP protocol mechanics — see `04-ai-protocol-stack.md`; nor which security checks to run — see `06-security-devsecops-for-agents.md`.

**Sources:** Official Claude Code documentation, [Skills reference](https://code.claude.com/docs/en/skills), verified July 2026. Unlike the rest of this corpus, the source here is vendor documentation rather than a research report — claims are checkable against a URL, not a citation number.
**Codified in:** The `.claude/skills/` layer itself, plus `rules/agent-workflow.md`.

## The Loading Rule That Bites

A skill is **a directory containing `SKILL.md`**. Nothing else registers.

| Scope | Path |
|---|---|
| Personal | `~/.claude/skills/<skill-name>/SKILL.md` |
| Project | `.claude/skills/<skill-name>/SKILL.md` |
| Plugin | `<plugin>/skills/<skill-name>/SKILL.md` |

A bare `.claude/skills/foo.md` is **silently ignored**. There is no warning, no error, no entry in `/`. The framework shipped seven skills in this dead format — including both Iron Law skills that `code-quality.md` called "non-negotiable" and that `quality-guardian` claimed to enforce. They had never loaded. The agents referenced them in prose, so the model improvised the behaviour from surrounding text instead of executing the skill.

**The command name comes from the directory name**, not the `name:` frontmatter field (which is only a display label). Skills hot-reload on file change; creating the top-level `skills/` directory for the first time requires a restart.

> **Verification is one glance.** If a skill does not appear in the `/` menu, it is not registered. Never assume a config file is live because its contents look correct — this is the same failure mode as an MCP server declared in a location the harness does not read.

## Precedence: Your Skill Shadows the Built-In

Enterprise overrides personal overrides project, and **a skill at any level overrides a bundled skill of the same name**. A project skill named `code-review` replaces the bundled `/code-review`. If a skill and a command share a name, the skill wins.

This inverts the usual instinct. Writing a `security-review` skill does not *add* a capability — it **replaces** Claude Code's own, which is almost certainly better maintained. Naming is therefore a load-bearing decision: pick a name that collides only if you intend to override.

## Bundled Skills Worth Not Reinventing

| Skill | What it does |
|---|---|
| `/verify` | Builds and runs the app to confirm a change works — explicitly *without* falling back to tests or typechecks |
| `/run` | Launches and drives the app |
| `/run-skill-generator` | Records the project's build/launch recipe as `.claude/skills/run-<name>/`, so `/run` and `/verify` stop rediscovering it |
| `/code-review` | Diff review with effort levels, `--fix`, `--comment`, and a multi-agent cloud mode |
| `/security-review` | Full security review of pending changes on the branch |
| `/debug` | Debugging workflow |

`/verify` is the important one. A framework Iron Law that says "run proof commands" is *weaker* than a bundled skill that drives the running application — passing tests are evidence the tests pass, not evidence the change works.

**The policy still belongs to the framework; the procedure does not.** An Iron Law stated in `rules/` is always in context. A skill loads only when invoked. So the law lives in the rule, and the rule points at `/verify` for execution.

## Frontmatter Reference

| Field | Purpose |
|---|---|
| `name` | Display label in listings. **Does not set the command name** — the directory does. |
| `description` | What it does and when to use it. This is how Claude decides to auto-invoke. |
| `when_to_use` | Extra trigger phrases / example requests. |
| `argument-hint`, `arguments` | Autocomplete hint; named positional args for `$name` substitution. |
| `disable-model-invocation` | `true` = Claude never auto-loads it; manual `/name` only. Also blocks preloading into subagents. |
| `user-invocable` | `false` = hidden from the `/` menu. |
| `allowed-tools` | Tools usable **without a permission prompt** while active. Does *not* restrict the tool pool. |
| `disallowed-tools` | Tools **removed** from the pool while active. This is the real read-only enforcement. |
| `model`, `effort` | Per-skill model and reasoning-effort override. |
| `context: fork` | **Run the skill in a forked subagent context.** |
| `agent` | Which subagent type to fork into when `context: fork`. |
| `hooks` | Hooks scoped to this skill's lifecycle. |
| `paths` | Glob patterns limiting when the skill activates. |
| `shell` | `bash` (default) or `powershell`. |

> **`user-invocable: false` + `disable-model-invocation: true` makes a skill unreachable.** Neither the human nor the model can trigger it. The framework's `spec-template` skill set both, while `/speckit.specify` instructed the agent to use it.

## The Three Capabilities the Framework Should Exploit

**1. `context: fork` + `agent:` — subagent isolation as a frontmatter line.**
The framework's entire "One-Shot Subagents" doctrine (`rules/agent-workflow.md`) exists to keep a noisy operation's context out of the main session. Two frontmatter fields now do that. A read-only analysis skill can fork into `Explore` and return only its conclusion, with no separate agent file and no digest contract to maintain.

**2. `` !`command` `` — shell output injected *before* the skill loads.**
The command output replaces the placeholder in the skill body, so live state arrives as data rather than as a tool call the model must decide to make. The framework already uses this in `/context` and `/quality`; it is under-used everywhere else.

```yaml
---
name: pr-summary
context: fork
agent: Explore
allowed-tools: Bash(gh *)
---
- PR diff: !`gh pr diff`
- Changed files: !`gh pr diff --name-only`
```

**3. `hooks:` in skill frontmatter — scoped lifecycle hooks.**
The framework's hooks must be hand-registered in a machine-local `settings.json`; the README carries a warning about this, and the v4.3.1 commit noted that "users on the distribution repo must register the new hook in their own settings.json." Skill-scoped hooks sidestep that entirely — they travel with the skill.

Substitutions available in a skill body: `$ARGUMENTS`, `$0`/`$1`, `${CLAUDE_PROJECT_DIR}`, `${CLAUDE_SKILL_DIR}`, `${CLAUDE_SESSION_ID}`, `${CLAUDE_EFFORT}`.

## Commands and Skills Have Merged

`.claude/commands/deploy.md` and `.claude/skills/deploy/SKILL.md` both produce `/deploy`. Existing `commands/` files keep working — they are not deprecated. Skills are the superset: they add a directory for supporting files (progressive disclosure via `references/`), invocation control, auto-loading by description, and everything in the frontmatter table above.

A command is the right choice when it is purely a human-triggered prompt. A skill is right when Claude should be able to *decide* to use it, when it needs supporting files, or when it needs tool/model/context control.

## Not Yet Adopted

- **`context: fork` on the read-only skills.** `performance-audit` and `task-effort-estimation` are both read-mostly and produce bounded output — textbook fork candidates. Neither uses it.
- **`disallowed-tools`.** The framework's skills declare `allowed-tools` believing it restricts them. It does not — it only pre-grants permission. Nothing is actually prevented from calling `Write`.
- **`paths:` gating.** No skill limits its activation by file glob, so every skill's description competes for the model's attention on every turn.
- **Skill-scoped `hooks:`.** All 7 hooks remain in machine-local `settings.json`, which is the framework's single largest installation friction.
- **`/run-skill-generator`.** Would let `/verify` and `/run` work reliably in consumer projects rather than re-inferring the launch each time.
- **Workflow tool vs Agent Teams.** `rules/agent-workflow.md` documents Agent Teams as the parallelism story and gates it behind `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`. A deterministic `Workflow` primitive now exists. Which supersedes which was **not verified against the docs** for this file — do not act on it without checking.
