# Rules & Quality Standards

[← back to README](../README.md)

## 📏 Rules

Modular policies loaded into every session automatically:

| Rule | Covers |
|------|--------|
| 📝 `code-quality.md` | Function/file size limits, SOLID principles, testing, both Iron Laws (with rationalization tables), surgical changes, security test files |
| 🔀 `git-workflow.md` | Commit format, branch naming, co-authoring, staging |
| 🔄 `agent-workflow.md` | 4-phase development workflow + CLAUDE.md template guidance (change maps, guardrails, trust boundaries) |
| 🛡️ `llm-security.md` | OWASP LLM Top 10 mitigations (prompt injection, excessive agency, data leakage, supply chain) |
| 📦 `context-management.md` | Document & Clear pattern, compact context priorities, project scaling by size |

Reference guidance that isn't needed every session now loads on demand as **skills** (see [Skills](skills.md)): `quality-tooling`, `pipeline-security`, `mcp-security`, and `agent-collaboration` — only their one-line descriptions stay resident.

---

## 📊 Quality Standards

```
Functions:   < 50 lines
Files:       < 500 lines
Complexity:  < 10 (cyclomatic)
SOLID:       OCP + DIP violations flagged in changed code
Iron Laws:   verification before completion + root cause before fix
```

Enforced by `code-quality.md` rule and `quality-guardian` agent. Test coverage follows project-configured thresholds.

---

