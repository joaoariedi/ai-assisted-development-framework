# Dotfiles Setup for AI Development Framework

This guide shows how to set up the AI Development Framework using the dotfiles/stow approach for clean configuration management.

## Overview

The dotfiles/stow approach provides:
- **Clean Management**: All configurations in one place
- **Version Control**: Track changes to your development setup
- **Portability**: Easy setup on new machines
- **Isolation**: No direct edits to home directory files

## Prerequisites

```bash
# Install stow (most Linux distributions)
sudo pacman -S stow        # Arch/Manjaro
sudo apt install stow      # Ubuntu/Debian
sudo dnf install stow      # Fedora
brew install stow          # macOS
```

## Setup Steps

### 1. Create Dotfiles Structure

```bash
# Create the dotfiles directory structure
mkdir -p ~/dotfiles/claude/.claude
```

### 2. Copy Framework Configuration

```bash
# Navigate to the framework repository
cd /path/to/ai-development-framework

# Extract the configuration content (everything between the markdown code blocks)
sed -n '/^```markdown$/,/^```$/p' CLAUDE_CONFIGURATION_SAMPLE.md | \
    head -n -1 | tail -n +2 > ~/dotfiles/claude/.claude/CLAUDE.md
```

### 3. Apply Configuration with Stow

```bash
# Create symlinks using stow
cd ~/dotfiles
stow claude

# Verify the symlink was created
ls -la ~/.claude/CLAUDE.md
# Should show: ~/.claude/CLAUDE.md -> ../dotfiles/claude/.claude/CLAUDE.md
```

### 4. Version Control Your Dotfiles

```bash
cd ~/dotfiles
git init
git add .
git commit -m "feat: add AI development framework configuration"

# Optional: push to remote repository
git remote add origin git@github.com:yourusername/dotfiles.git
git push -u origin main
```

## File Structure

After setup, your structure should look like:

```
~/dotfiles/
└── claude/
    └── .claude/
        └── CLAUDE.md          # Framework configuration

~/.claude/
└── CLAUDE.md -> ../dotfiles/claude/.claude/CLAUDE.md  # Symlink
```

## Management Commands

### Update Configuration
```bash
# Edit the source file
vim ~/dotfiles/claude/.claude/CLAUDE.md

# Changes are automatically reflected via symlink
# Commit changes to version control
cd ~/dotfiles
git add claude/.claude/CLAUDE.md
git commit -m "update: enhance claude configuration"
```

### Remove Configuration
```bash
cd ~/dotfiles
stow -D claude  # Removes symlinks
```

### Reinstall Configuration
```bash
cd ~/dotfiles
stow -R claude  # Remove and re-create symlinks
```

### Setup on New Machine
```bash
# Clone your dotfiles
git clone git@github.com:yourusername/dotfiles.git ~/dotfiles

# Apply all configurations
cd ~/dotfiles
stow claude

# The framework is now ready to use
```

## Integration with Framework

Once set up, the AI Development Framework will automatically use your global configuration for:

- **Workflow Requirements**: 18-step process enforcement
- **Quality Standards**: Code complexity and coverage limits  
- **Git Configuration**: Commit message format and branch naming
- **AI Collaboration**: Model selection and usage patterns
- **Performance Benchmarks**: Response time and coverage targets

## Customization

### Project-Specific Overrides

You can still override global settings per project:

```bash
# In your project directory
mkdir -p .claude
echo "# Project-specific overrides" > .claude/CLAUDE.md
# Add project-specific configurations
```

Project-specific configurations take precedence over global ones.

### Personal Customization

Edit your global configuration:

```bash
vim ~/dotfiles/claude/.claude/CLAUDE.md
```

Common customizations:
- Update author email: `joaoariedi@gmail.com` → `your-email@example.com`
- Adjust quality metrics (coverage %, complexity limits)
- Add project-specific commands
- Modify performance targets

## Troubleshooting

### Existing Configuration Conflicts

If you have existing `~/.claude/CLAUDE.md`:

```bash
# Backup existing configuration
mv ~/.claude/CLAUDE.md ~/.claude/CLAUDE.md.backup

# Then proceed with stow setup
cd ~/dotfiles
stow claude
```

### Symlink Issues

```bash
# Check for broken symlinks
ls -la ~/.claude/CLAUDE.md

# Recreate if needed
cd ~/dotfiles
stow -D claude  # Remove
stow claude     # Recreate
```

### Permission Issues

```bash
# Ensure proper permissions
chmod 644 ~/dotfiles/claude/.claude/CLAUDE.md
```

## Benefits

### For Individual Developers
- **Consistency**: Same configuration across all projects
- **Backup**: Configuration versioned and backed up
- **Portability**: Easy setup on new development machines

### For Teams
- **Standardization**: Share common configuration patterns
- **Onboarding**: New team members get consistent setup
- **Evolution**: Track and review configuration changes

---

*This setup approach follows dotfiles best practices and integrates seamlessly with the AI Development Framework workflow.*