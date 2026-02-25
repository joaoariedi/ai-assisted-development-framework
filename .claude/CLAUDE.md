# AI Development Framework v3.1 - Agent-Enhanced

## Custom Agents

| Agent | Role | When to Use |
|-------|------|-------------|
| **test-specialist** | Testing | After implementation, comprehensive tests |
| **quality-guardian** | QA | Before any commit, PR, or merge |
| **review-coordinator** | PR management | Creating PRs, managing review workflows |
| **forensic-specialist** | Security | Security audits, suspicious patterns |

For general tasks, use built-in agents: `Explore` (codebase search), `Plan` (architecture), `general-purpose` (implementation).

## Task Management API
- **TaskCreate**: Use for any task with >2 steps (MANDATORY)
- **TaskUpdate**: Mark exactly ONE task "in_progress" at a time; mark "completed" immediately after
- **TaskGet**: Read full task details before starting work
- **TaskList**: Check progress and find next available tasks

## Core Rules
1. Do what has been asked; nothing more, nothing less
2. NEVER create files unless absolutely necessary for achieving the goal
3. ALWAYS prefer editing existing files over creating new ones
4. NEVER proactively create documentation files (*.md) unless explicitly requested
5. Only commit when explicitly requested by the user
6. Follow existing project patterns rather than imposing new conventions
7. Keep responses concise and focused on the task
8. Use `git -C <directory>` instead of `cd <directory> && git` to avoid zoxide conflicts
9. Version declaration is deprecated in docker compose, do not add it

## Tool Usage
- Use Read to understand existing code before suggesting modifications
- Use Grep to find similar implementations
- Use Glob to discover project structure
- Use Bash only for system commands and terminal operations
- Use EnterPlanMode/ExitPlanMode for complex features requiring user approval
- For spec-driven development (SDD), use `/speckit.init` to bootstrap, then: specify → plan → tasks → implement

See `.claude/rules/` for detailed policies on code quality, git workflow, agent coordination, and language-specific tooling.
