# AI Development Framework v3.1 - Quick Reference

## Slash Commands (Use These!)

| Command | Description | When to Use |
|---------|-------------|-------------|
| `/agent <task>` | Full 18-step workflow | Any development task |
| `/context` | Analyze project | Before implementation |
| `/quality` | Run all checks | Before commit |
| `/security-scan` | Security audit | Before PR |
| `/pr-summary` | Generate PR summary | When creating PR |

## Agent Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                framework-orchestrator (opus)                │
│                   MUST BE USED >3 steps                     │
├─────────────────────────────────────────────────────────────┤
│  Phase 1          │  Phase 2          │  Phase 3    │  P4  │
├───────────────────┼───────────────────┼─────────────┼──────┤
│ context-analyst   │ impl-engineer     │ review-     │ met- │
│ (PROACTIVELY)     │ (plans)           │ coordinator │ rics │
├───────────────────┼───────────────────┼─────────────┤      │
│ plan-architect    │ test-specialist   │             │      │
│ (MUST BE USED)    │ (PROACTIVELY)     │             │      │
├───────────────────┼───────────────────┼─────────────┼──────┤
│          quality-guardian (MUST BE USED before commit)      │
├─────────────────────────────────────────────────────────────┤
│        forensic-specialist (PROACTIVELY security)           │
└─────────────────────────────────────────────────────────────┘
```

## 18-Step Workflow

```
Phase 1: Planning (5-15 min)
├── 1. Context Prep     → context-analyst
├── 2. Create Plan      → plan-architect
├── 3. Document Plan    → (optional >5 todos)
└── 4. Refine Plan      → iterate with user

Phase 2: Implementation (1-1.5 hours)
├── 5. Pre-Setup        → detect quality tools
├── 6. Branch           → feature/<name>
├── 7. Code             → implementation-engineer
├── 8. Document         → inline docs
├── 9. Test             → test-specialist (80%+)
└── 10. Quality Check   → quality-guardian

Phase 3: Review (30-45 min)
├── 11. Local Validation
├── 12. Git Integration
├── 13. Code Review
├── 14. Issue Resolution
├── 15. Final Validation
└── 16. Merge & Cleanup

Phase 4: Post-Merge (5 min)
├── 17. Metrics         → metrics-collector
└── 18. Retrospective
```

## Hooks (Automatic!)

### Pre-Edit Hook
Blocks edits to: `.env*`, `*.key`, `*.pem`, `credentials*`, `.git/*`

### Pre-Commit Hook (runs on `git commit`)
1. Auto-format code
2. Run linting
3. Run type checking
4. Run tests

## Skills (Read-Only Analysis)

| Skill | Purpose | Tools |
|-------|---------|-------|
| `security-review` | Security audits | Read, Grep, Glob |
| `context-analysis` | Project analysis | Read, Grep, Glob |
| `performance-audit` | Bottleneck detection | Read, Grep, Glob, Bash |

## Quality Standards

```
Functions: < 50 lines
Files:     < 500 lines
Complexity: < 10
Coverage:  >= 80%
```

## Model Assignments

| Agent | Model | Trigger |
|-------|-------|---------|
| framework-orchestrator | **opus** | Tasks >3 steps |
| plan-architect | **opus** | Architecture decisions |
| All others | sonnet | Execution tasks |

## Git Workflow

### Branch Naming
```bash
feature/<name>    # New features
fix/<issue>       # Bug fixes
refactor/<name>   # Code changes
```

### Commit Format
```
<type>: <description>

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `style`, `perf`

## Quick Tips

1. **Let agents work** - Don't micromanage
2. **Use `/context` first** - Understand before coding
3. **Trust hooks** - Auto-format on commit
4. **One task at a time** - ONE todo in_progress
5. **Quality before speed** - Run checks always

## Never Do This

- ❌ Skip `/context` for unfamiliar code
- ❌ Commit without quality checks
- ❌ Hardcode secrets
- ❌ Functions > 50 lines
- ❌ Skip tests
- ❌ Push to main directly

## Directory Structure

```
~/.claude/
├── CLAUDE.md           # Main config
├── settings.json       # Permissions
├── mcp.json           # MCP servers
├── commands/          # Slash commands
├── hooks/             # Automation hooks
├── skills/            # Analysis skills
└── agents/            # 9 agent definitions
```

## Performance Targets

| Metric | Target |
|--------|--------|
| Planning | 15-30 min |
| Implementation | < 2 hours |
| Review Cycles | < 3 |
| Test Coverage | >= 80% |
| API Response | < 200ms |

## Success Checklist

**Before Implementation:**
- [ ] `/context` run
- [ ] Plan created
- [ ] Todos defined

**Before Commit:**
- [ ] Quality checks pass
- [ ] Tests written (80%+)
- [ ] No secrets in code

**Before Merge:**
- [ ] `/security-scan` clean
- [ ] PR summary complete
- [ ] All feedback addressed

---

*Framework Version: 3.1.0*
*Last Updated: 2025-11-26*
