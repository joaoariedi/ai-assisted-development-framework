# Performance & Reasoning

[← back to README](../README.md)

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

