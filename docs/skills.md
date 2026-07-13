# Skills

[← back to README](../README.md)

## 🧠 Skills

A skill is a **directory containing `SKILL.md`**, never a bare `.md` file — a bare `foo.md` is silently ignored and never loads. This plugin ships them at `skills/<name>/SKILL.md`; in your own project they go under `.claude/skills/<name>/SKILL.md`. Verify with the `/` menu: a skill that does not appear there is not registered.

The framework ships only what Claude Code does **not** already do natively:

| Skill | Purpose | Auto-invoked? |
|-------|---------|---------------|
| 🐛 `systematic-debugging` | 4-phase root cause investigation (read → reproduce → evidence → fix) with Iron Law | Yes — proactively on bugs |
| 📐 `task-effort-estimation` | Deterministic change sizing — Pfeiffer Contribution Complexity from git metadata, plus AI-native risk flags | Yes — on "how big / how long is this?" |
| ⚡ `performance-audit` | N+1 queries, blocking I/O, memory leaks, algorithm complexity | No — explicit only |

**Deliberately NOT reimplemented.** A project skill *overrides* a bundled one of the same name, so shipping a `security-review` skill would shadow Claude Code's own — which is better. Use the built-ins:

| Instead of a custom skill | Use the built-in | Why |
|---|---|---|
| verification-before-completion | `/verify` | It builds and drives the real app rather than settling for a green typecheck. The **Iron Law** survives as a *rule* in `code-quality.md` — a rule is always in context, whereas a skill only loads when invoked. |
| security-review | `/security-review` | Full branch review. `/adf.security-scan` remains for the fast, diff-only pass. |
| context-analysis | `/adf.context` | The command already carries the methodology and injects live git data. |
| spec-template | `/speckit.specify` | The Given/When/Then patterns now live in the command itself. |

`task-effort-estimation` deliberately reports a **complexity score and risk flags, never an hour count**. Effort under AI assistance is bimodal — up to 78% of high-complexity *isolated* features land under a quarter of expected effort, while ~22% of *low*-complexity tasks needing non-local context exceed 180%. So it flags the small diff with high coupling, which is the shape of work a naive estimate waves through. Hours only appear once `.claude/effort-calibration.json` maps observed scores to real recorded durations for your project.

---

