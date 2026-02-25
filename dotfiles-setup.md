# 🔧 Dotfiles Setup Guide

## 📖 Overview

The AI Development Framework is managed via [GNU Stow](https://www.gnu.org/software/stow/) for clean symlink management. All configuration lives in `~/dotfiles/claude/.claude/` and gets symlinked to `~/.claude/` so every Claude Code session loads it automatically.

## 📋 Prerequisites

```bash
# Install stow
sudo pacman -S stow        # Arch/Manjaro
sudo apt install stow      # Ubuntu/Debian
sudo dnf install stow      # Fedora
brew install stow          # macOS
```

## 🚀 Setup

### 1️⃣ Clone Dotfiles

```bash
git clone git@github.com:joaoariedi/dotfiles.git ~/dotfiles
```

### 2️⃣ Apply Symlinks

```bash
cd ~/dotfiles
stow claude
```

This creates symlinks in `~/.claude/` pointing to the config files:

```
~/.claude/
├── CLAUDE.md       → ~/dotfiles/claude/.claude/CLAUDE.md
├── mcp.json        → ~/dotfiles/claude/.claude/mcp.json
├── agents/         → ~/dotfiles/claude/.claude/agents/
├── commands/       → ~/dotfiles/claude/.claude/commands/
├── hooks/          → ~/dotfiles/claude/.claude/hooks/
├── rules/          → ~/dotfiles/claude/.claude/rules/
└── skills/         → ~/dotfiles/claude/.claude/skills/
```

### 3️⃣ Create Machine-Local Settings

`settings.json` is machine-specific (hooks config, env vars) and is NOT managed by stow. Create it manually:

```bash
cat > ~/.claude/settings.json << 'EOF'
{
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

### 4️⃣ Verify

```bash
ls -la ~/.claude/CLAUDE.md          # should show symlink
claude                               # open Claude Code
> /context                           # should work
> /speckit.init                      # should work
```

## 📦 What Gets Installed

| Component | Count | Purpose |
|-----------|-------|---------|
| 🧠 **CLAUDE.md** | 1 | Core config loaded into system prompt |
| 📏 **Rules** | 4 | code-quality, git-workflow, agent-workflow, quality-tooling |
| 🛠️ **Commands** | 14 | 5 standard + 9 spec-kit pipeline |
| 🕵️ **Agents** | 4 | test-specialist, quality-guardian, review-coordinator, forensic-specialist |
| ⚙️ **Hooks** | 4 | Shell scripts for quality gates and file protection |
| 🧠 **Skills** | 4 | Internal analysis skills (context, security, performance, spec-template) |
| 🔌 **MCP** | 1 | GitHub server for PR/Issue automation |

## 🗂️ Stow Package Structure

```
~/dotfiles/claude/
├── .claude/
│   ├── CLAUDE.md
│   ├── mcp.json
│   ├── agents/
│   │   ├── test-specialist.md
│   │   ├── quality-guardian.md
│   │   ├── review-coordinator.md
│   │   └── forensic-specialist.md
│   ├── commands/
│   │   ├── agent.md
│   │   ├── context.md
│   │   ├── pr-summary.md
│   │   ├── quality.md
│   │   ├── security-scan.md
│   │   ├── speckit.init.md
│   │   ├── speckit.constitution.md
│   │   ├── speckit.specify.md
│   │   ├── speckit.plan.md
│   │   ├── speckit.tasks.md
│   │   ├── speckit.implement.md
│   │   ├── speckit.analyze.md
│   │   ├── speckit.clarify.md
│   │   └── speckit.checklist.md
│   ├── hooks/
│   │   ├── quality-before-commit.sh
│   │   ├── block-sensitive-files.sh
│   │   ├── run-tests-after-edit.sh
│   │   └── stop-quality-check.sh
│   ├── rules/
│   │   ├── code-quality.md
│   │   ├── git-workflow.md
│   │   ├── agent-workflow.md
│   │   └── quality-tooling.md
│   └── skills/
│       ├── context-analysis.md
│       ├── security-review.md
│       ├── performance-audit.md
│       └── spec-template.md
├── .stow-local-ignore
└── README.md
```

## 🔄 Management Commands

```bash
# ✏️ Update config (edit source, symlinks auto-reflect changes)
vim ~/dotfiles/claude/.claude/CLAUDE.md

# ❌ Remove symlinks
cd ~/dotfiles && stow -D claude

# 🔄 Reinstall symlinks (after adding new files)
cd ~/dotfiles && stow -R claude

# 💻 Setup on a new machine
git clone git@github.com:joaoariedi/dotfiles.git ~/dotfiles
cd ~/dotfiles && stow claude
# Then create settings.json manually (see step 3 above)
```

## 🎯 Project-Specific Overrides

Projects can override global config by placing files in their own `.claude/` directory. Project-specific configurations take precedence over global ones.

```bash
# In your project directory
mkdir -p .claude
echo "# Project-specific rules" > .claude/CLAUDE.md
```

## 🔥 Troubleshooting

### ⚠️ Existing Config Conflicts
```bash
# Backup existing config
mv ~/.claude ~/.claude.backup
# Then run stow
cd ~/dotfiles && stow claude
```

### 💥 Stow Conflicts
```bash
# Force restow (removes and recreates)
cd ~/dotfiles && stow -R claude
```

### 👻 New Files Not Showing
After adding new files to the dotfiles package, restow:
```bash
cd ~/dotfiles && stow -R claude
```

---

*Last Updated: 2026-02-25*
