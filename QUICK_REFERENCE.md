# AI Development Framework v4.0 - Quick Reference

## Slash Commands

### Standard Commands
| Command | Description |
|---------|-------------|
| `/agent <task>` | Full development workflow with planning |
| `/context` | Analyze project tech stack and structure |
| `/quality` | Run lint + types + format + tests |
| `/security-scan` | Scan staged changes for vulnerabilities |
| `/pr-summary` | Generate PR description from branch diff |

### Spec-Kit Pipeline
| Command | Description |
|---------|-------------|
| `/speckit.init` | Bootstrap `.specify/` (once per project) |
| `/speckit.constitution` | Define project principles (once per project) |
| `/speckit.specify <feature>` | Write spec with scenarios + requirements |
| `/speckit.clarify` | Resolve ambiguities in spec |
| `/speckit.plan` | Generate implementation plan |
| `/speckit.tasks` | Generate phased task list |
| `/speckit.checklist` | Requirement quality checklists |
| `/speckit.analyze` | Read-only consistency analysis |
| `/speckit.implement` | TDD execution with quality gates |

## SDD Pipeline Flow

```
/speckit.init          (once)
/speckit.constitution  (once)
       │
/speckit.specify ─── /speckit.clarify (if ambiguities)
       │
/speckit.plan
       │
/speckit.tasks
       │
/speckit.checklist ── /speckit.analyze (optional validation)
       │
/speckit.implement
       │
/quality ── /security-scan ── commit ── push ── /pr-summary
```

## Custom Agents

| Agent | When | Purpose |
|-------|------|---------|
| `test-specialist` | After implementation | Comprehensive test suites |
| `quality-guardian` | Before commit/PR/merge | Lint, types, security, performance |
| `review-coordinator` | PR creation | PR descriptions, review workflow |
| `forensic-specialist` | Security incidents | Threat hunting, IOC generation |

Built-in agents handle the rest: `Explore` (search), `Plan` (architecture), `general-purpose` (implementation).

## Hooks (Automatic)

| Hook | Trigger | Action |
|------|---------|--------|
| `quality-before-commit.sh` | `git commit` | Blocks on lint errors |
| `block-sensitive-files.sh` | Edit/Write | Blocks `.env`, `*.key`, `*.pem` |
| `run-tests-after-edit.sh` | Edit/Write | Auto-runs tests (15s throttle) |
| `stop-quality-check.sh` | Session stop | Reminds if tests not run |

## Task Tracking

```
TaskCreate   → any task with >2 steps (mandatory)
TaskUpdate   → mark in_progress BEFORE starting, completed AFTER
TaskGet      → read full details before working
TaskList     → check progress, find next task
```

One task `in_progress` at a time.

## Quality Standards

```
Functions:   < 50 lines
Files:       < 500 lines
Complexity:  < 10
```

## Git Workflow

### Branch Naming
```
feature/<name>    # new features
fix/<issue>       # bug fixes
refactor/<name>   # restructuring
```

### Commit Format
```
<type>: <description>

Co-Authored-By: Claude <noreply@anthropic.com>
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `style`, `perf`

## Rules (auto-loaded)

| Rule | Covers |
|------|--------|
| `code-quality.md` | Size limits, testing, documentation policy |
| `git-workflow.md` | Commits, branches, staging |
| `agent-workflow.md` | 18-step workflow with SDD integration |
| `quality-tooling.md` | Per-language tool detection (JS/TS, Python, Rust, Go) |

## Skills (internal, not directly invoked)

| Skill | Purpose |
|-------|---------|
| `context-analysis` | Project structure analysis |
| `security-review` | Security checklist |
| `performance-audit` | Bottleneck detection |
| `spec-template` | Given/When/Then patterns |

## Quick Tips

1. **Use `/context` first** when entering unfamiliar code
2. **Let agents work** — don't micromanage the process
3. **Trust the hooks** — auto-format and validate on commit
4. **One task at a time** — ONE TaskUpdate `in_progress` at a time
5. **Quality before speed** — run `/quality` before committing
6. **SDD for features** — use the spec-kit pipeline for non-trivial work
7. **Skills are read-only** — safe for exploration and analysis

## Directory Structure

```
~/.claude/
├── CLAUDE.md               # core config
├── mcp.json                # MCP servers (GitHub)
├── commands/               # 14 slash commands
├── agents/                 # 4 custom agents
├── hooks/                  # 4 shell script hooks
├── rules/                  # 4 policy files
└── skills/                 # 4 internal skills
```

## Success Checklist

**Before Implementation:**
- [ ] `/context` run
- [ ] Spec written (`/speckit.specify`)
- [ ] Plan created (`/speckit.plan`)
- [ ] Tasks generated (`/speckit.tasks`)

**Before Commit:**
- [ ] `/quality` passes
- [ ] Tests written and passing
- [ ] No secrets in code

**Before Merge:**
- [ ] `/security-scan` clean
- [ ] `/pr-summary` generated
- [ ] All feedback addressed

---

*Framework Version: 4.0.0 | Last Updated: 2026-02-23*
