# Claude Code Custom Agents for AI Development Framework v4.0

This directory contains documentation for the 4 specialized Claude Code custom agents used by the framework.

## Agent Overview

| Agent | When to Use |
|-------|-------------|
| **test-specialist** | After implementation — creates comprehensive test suites following existing patterns |
| **quality-guardian** | Before any commit/PR/merge — runs lint, type checks, security scans, performance validation |
| **review-coordinator** | PR creation — generates descriptions, manages review workflow |
| **forensic-specialist** | Security incidents — threat hunting, IOC generation, chain of custody |

## Why Only 4 Agents?

v3.1 had 9 agents. v4.0 reduced this to 4 because Claude Code's built-in agents now handle the roles previously filled by custom agents:

| Removed Agent | Replaced By |
|--------------|-------------|
| framework-orchestrator | Claude Code handles orchestration natively |
| context-analyst | Built-in `Explore` agent + `/context` command |
| plan-architect | Built-in `Plan` agent + EnterPlanMode |
| implementation-engineer | Built-in `general-purpose` agent |
| metrics-collector | Auto-memory + TaskList for tracking |

Custom agents are justified only when a specialized system prompt provides capabilities that built-in agents lack.

## Installation

These agents are deployed via the dotfiles stow package:

```bash
cd ~/dotfiles
stow claude
# Creates ~/.claude/agents/ symlink with all 4 agent definitions
```

## Usage

Agents are invoked automatically by Claude Code based on context, or referenced by slash commands:

- `/quality` spawns `quality-guardian`
- `/security-scan` uses `forensic-specialist` patterns
- `/speckit.implement` references `test-specialist` for test patterns and `quality-guardian` for quality gates

## Spec-Kit Integration

The spec-kit SDD pipeline works alongside agents:

```
/speckit.specify → /speckit.plan → /speckit.tasks → /speckit.implement
                                                          |
                                               test-specialist (test patterns)
                                               quality-guardian (quality gate)
```

After implementation: `review-coordinator` creates the PR.

---

*Framework Version: 4.0.0 | Last Updated: 2026-02-23*
