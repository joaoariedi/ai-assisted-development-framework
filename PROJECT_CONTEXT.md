# AI Development Framework - Project Context

## Project Overview
**Purpose**: Comprehensive AI-assisted development framework for systematic software engineering with spec-driven development
**Version**: 4.0.0
**Last Updated**: 2026-02-23
**Maintainer**: joaoariedi@gmail.com

## Tech Stack
- **Language**: Markdown documentation + shell scripts (hooks)
- **Version Control**: Git with semantic commits
- **Configuration Management**: GNU Stow (dotfiles symlinks)
- **AI Tools**: Claude Code with custom agents, hooks, skills, and spec-kit pipeline
- **MCP Integration**: GitHub server for PR/Issue automation

## Architecture Overview

The framework follows a 4-phase, 18-step systematic approach with spec-driven development integration:

1. **Phase 1: Planning & Context (Steps 1-4)**
   - Context preparation via `/context` command or `Explore` agent
   - Specification writing via spec-kit pipeline (`/speckit.specify`)
   - Plan generation with constitution compliance (`/speckit.plan`)
   - Task breakdown with dependencies (`/speckit.tasks`)

2. **Phase 2: Implementation (Steps 5-10)**
   - TDD execution via `/speckit.implement` (red-green cycle)
   - Automated quality gates via hooks (lint, test, file protection)
   - Task tracking via TaskCreate/TaskUpdate API
   - Code quality enforcement (functions <50 lines, files <500 lines)

3. **Phase 3: Review & Integration (Steps 11-16)**
   - Quality validation via `quality-guardian` agent
   - PR creation via `review-coordinator` agent
   - Security scanning via `/security-scan` command
   - Git integration with semantic commits

4. **Phase 4: Post-Implementation (Steps 17-18) - Optional**
   - Retrospective and lessons learned in auto-memory

## Key Components

### Custom Agents (4)
- `test-specialist` — comprehensive test suites
- `quality-guardian` — lint, types, security, performance
- `review-coordinator` — PR descriptions, review workflow
- `forensic-specialist` — threat hunting, IOC generation

### Slash Commands (14)
- 5 standard: `/agent`, `/context`, `/quality`, `/security-scan`, `/pr-summary`
- 9 spec-kit: `/speckit.init`, `.constitution`, `.specify`, `.plan`, `.tasks`, `.implement`, `.analyze`, `.clarify`, `.checklist`

### Rules (4)
- `code-quality.md` — size limits, testing, documentation
- `git-workflow.md` — commits, branches, staging
- `agent-workflow.md` — 18-step workflow with SDD integration
- `quality-tooling.md` — per-language tool detection

### Skills (4 internal)
- `context-analysis` — project structure analysis
- `security-review` — security checklist
- `performance-audit` — bottleneck detection
- `spec-template` — Given/When/Then patterns

### Hooks (4 shell scripts)
- `quality-before-commit.sh` — lint gate on commit
- `block-sensitive-files.sh` — file protection
- `run-tests-after-edit.sh` — auto-test after edits
- `stop-quality-check.sh` — test run reminder

## Coding Conventions

### File Naming
- Framework docs: `UPPERCASE_WITH_UNDERSCORES.md`
- Configuration: `.claude/CLAUDE.md`
- Rules: `.claude/rules/<name>.md`
- Commands: `.claude/commands/<name>.md`
- Agents: `.claude/agents/<name>.md`

### Quality Standards
- Functions: <50 lines
- Files: <500 lines
- Cyclomatic complexity: <10
- No hardcoded secrets
- Follow existing project patterns

### Git Workflow
- Commit format: `<type>: <description>` + Co-Authored-By
- Types: feat, fix, refactor, test, docs, style, perf
- Branch naming: `feature/*`, `fix/*`, `refactor/*`

## Dependencies
- Git (version control)
- GitHub CLI (optional, for PR automation)
- GNU Stow (configuration management)
- Claude Code with sub-agent support

## Support
- **Primary**: joaoariedi@gmail.com
- **Issues**: GitHub Issues
- **Documentation**: This repository

---

*This context file should be updated after any significant framework changes*
