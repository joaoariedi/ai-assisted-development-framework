# Context Management

Strategies for managing the LLM context window across sessions and project scales.

## Document & Clear Pattern

Proactively externalize session state to prevent context degradation on long-running tasks.

### When to Checkpoint
- After completing a major task or development phase
- When context window is saturating (repeated context, slower responses, premature summarization)
- Before natural break points (waiting for user input, CI results, review feedback)
- Before starting a fundamentally different task within the same session

### What to Write

Write a progress file (`.claude/progress.md` or project-specific location) containing:

- **Current task and phase** — what was being worked on, which workflow phase
- **Key decisions made** — with rationale (why this approach, not just what)
- **Files changed** — brief descriptions of what was modified and why
- **Blockers and open questions** — anything unresolved
- **Next steps** — ordered, specific, actionable items
- **Environment state** — branch name, uncommitted changes, pending PRs

### When to Suggest /clear
- After writing a progress file
- When conversation exceeds ~50 turns on complex implementation
- After completing a multi-step implementation phase
- When switching between unrelated tasks in the same session

### How to Resume from a Progress File
1. Read the progress file first
2. Verify environment state (`git status`, current branch, uncommitted changes)
3. Review key files listed in progress
4. Resume from the "Next steps" section
5. Do NOT re-do work listed as completed

## Compact Context Priorities

When context is auto-compacted, prioritize keeping:
- Architectural decisions and rationale
- Key file paths and their roles
- Lessons learned and error patterns
- User preferences and feedback
- Task progress and remaining work

Drop: full code blocks, raw tool output, intermediate search results, verbose file contents.

## Context Scaling by Project Size

### Small Projects (<10 source files, single language)
- Single root-level `CLAUDE.md` is sufficient
- No subagents needed — use main conversation for everything
- Skip TaskCreate for tasks with <3 steps
- Quality checks via direct Bash commands, no quality-guardian agent needed
- Document & Clear unnecessary for typical session lengths

### Medium Projects (10-100 source files, 1-2 languages)
- Add directory-specific `CLAUDE.md` in complex subdirectories (e.g., `src/api/CLAUDE.md`)
- Use subagents (Explore) for research while implementing in main conversation
- TaskCreate recommended for all multi-step work
- Use quality-guardian agent before commits
- Document & Clear pattern for sessions exceeding ~30 turns

### Large Projects (100+ source files, monorepo or multi-service)
- Agent Teams for parallel work across services or modules
- Multiple MCP servers for different concerns (GitHub, security scanning)
- Formal specs via spec-kit pipeline (`/speckit.init` -> specify -> plan -> tasks -> implement)
- Per-service `CLAUDE.md` files with service-specific conventions
- Document & Clear mandatory — write progress after each phase completion
- Focused subagents (test-specialist, quality-guardian) to offload from main context

### Polyglot / Multi-Service Patterns
- Separate quality tooling configurations per service directory
- Agent Teams with language-specialized teammates
- Each service may have its own `CLAUDE.md` with service-specific build commands and conventions
