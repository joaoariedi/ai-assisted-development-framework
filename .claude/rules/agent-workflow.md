# Development Workflow

## Phase 0: Multi-Environment Setup (Optional)

### Remote Control
Continue local Claude Code sessions from any device:
- Start work locally in terminal: `claude`
- Resume the same session from phone/browser via claude.ai/code
- Context, files, and conversation history carry over across surfaces
- Useful for monitoring long-running tasks or reviewing results on the go

### Teleport
Move sessions between surfaces:
- Start a task on web (claude.ai/code) or mobile
- Pull into local terminal: `/teleport`
- Full context transfers — no re-explaining needed
- Ideal for starting tasks during commute, finishing at workstation

### When to Use
- Long-running implementations you want to monitor from mobile
- Starting research/planning on web, then implementing locally
- Reviewing PR feedback on mobile, then switching to terminal to fix

## Phase 1: Planning & Context (Steps 1-4)

### Step 1: Context Preparation
- Use built-in `Explore` agent or `/context` command for project analysis
- Auto-detect tech stack from `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`
- Identify existing patterns, conventions, and quality tools
- Use `ultrathink` for complex architectural analysis or ambiguous requirements

### Step 2: Create Task List & Plan
- Use TaskCreate for comprehensive task breakdown with acceptance criteria
- Use EnterPlanMode/ExitPlanMode for complex implementations

### Step 3: Plan Review (Optional for Simple Tasks)
- For complex features (>5 tasks), use EnterPlanMode for user approval
- Skip for simple tasks (<3 tasks)

### Step 4: Plan Refinement
- Iterate tasks based on user feedback
- Break down large tasks into smaller, manageable pieces

## Phase 2: Implementation with Quality Gates (Steps 5-10)

### Step 5: Pre-Implementation Setup
- Detect existing quality tools using Grep/Glob
- Identify available lint, format, and test commands

### Step 6: Branch Creation (Git Projects Only)
- Create feature branches with semantic naming
- Skip for non-git projects

### Step 7: Incremental Development with Task Tracking
- **Use TaskUpdate to mark task as "in_progress" before starting work**
- Follow code quality limits (functions <50 lines, files <500 lines)
- **Use TaskUpdate to mark task as "completed" immediately after finishing**
- Use semantic commit messages

### Step 8: Documentation During Development
- Inline documentation for complex functions only
- Focus on code clarity over excessive documentation

### Step 9: Test Creation & Validation
- For spec-driven development (SDD), use the spec-kit pipeline: `/speckit.specify` → `/speckit.plan` → `/speckit.tasks` → `/speckit.implement`
- Use `test-specialist` agent for comprehensive test suites
- Find existing test patterns using Glob: `**/*test*`, `**/spec/**`
- PostToolUse hook auto-runs tests after source file edits (throttled to 15s)

### Step 10: Quality Checks
- Use `quality-guardian` agent before any commit or PR
- ALWAYS run quality checks after implementation
- Fix any issues before considering task complete

## Phase 3: Review & Integration (Steps 11-16)

### Step 11: Local Validation
- Ensure all tasks are completed via TaskList
- Run full test suite, verify no regressions

### Step 12: Git Integration
- Stage relevant changes by name
- Create semantic commit with co-author option

### Step 13-14: Self-Review & Issue Resolution
- Review for security, performance, maintainability
- Use `ultrathink` for complex debugging, race conditions, or security-sensitive reviews
- Fix quality check failures, re-run tests

### Step 15-16: Final Validation & Completion
- Verify all acceptance criteria met
- Use `review-coordinator` agent for PR creation if needed
- Only commit when user explicitly requests it

## One-Shot Subagents (Context Reduction)

A one-shot subagent is dispatched for a single discrete operation — run a test, fetch a fact from another repo, triage a log — and returns **only a digest** to the main conversation. The subagent's full working context is thrown away; the main context sees a bounded summary. Done right, this is the single highest-leverage tool for staying in the "Smart Zone" (<40% context) on long sessions.

### When to Use

- The operation will produce large tool output (test suites, log files, foreign repos)
- The main agent only needs the *conclusion*, not the transcript
- The work is read-mostly and has a clean output contract
- The same information would bloat the main context if fetched inline

### When NOT to Use

- The operation is small (a single Grep, a single file Read) — just do it inline
- You need the intermediate state later in the same session — subagent context is discarded
- You need to negotiate / iterate — subagents are one-round by design
- The task requires mutations to the current project — one-shot subagents are read-only

### Design Rules (Non-Negotiable)

1. **Narrow trigger in `description`** — specific verb + noun. "Run the failing tests and report" — not "help with testing." The description is the main agent's only signal for when to dispatch.
2. **Tool allowlist, not denylist** — set `tools:` frontmatter explicitly. Start with nothing, add only what the task needs. The default (all tools) is wrong for one-shot agents.
3. **No side effects on the current project** — one-shot agents must never `Write`, `Edit`, or `git commit` in the main repo. If a mutation is needed, return a *proposal* and let the main agent execute it.
4. **Output contract at the end of the system prompt** — a concrete template showing exactly what the agent must return. Every claim must carry a `path:line` citation. Example: the `<repo-scout-digest>` block in `.claude/agents/repo-scout.md`.
5. **Model tier matches cost** — `model: haiku` for cheap fetches, `model: sonnet` for analysis, `opus` reserved for architectural reasoning. Don't default to opus.
6. **Stop-early budget** — include a "if you're approaching your budget, return PARTIAL" instruction so the agent fails gracefully instead of truncating.
7. **Prefer `general-purpose` for truly one-off work** — only create a new agent file when the pattern will recur. Every agent file adds discoverability noise to the main agent's decision surface.

### Existing One-Shot Agents

| Agent | Purpose | Input | Digest |
|-------|---------|-------|--------|
| **repo-scout** | Answer a targeted question about a repo OTHER than the current project | repo identifier (path or URL) + question | `<repo-scout-digest>` block with answer + citations + verdict |

Add new one-shot agents to `.claude/agents/` following the `repo-scout.md` template. Reuse its output-contract discipline — that is where the context-reduction actually comes from.

### Common Anti-Patterns

- **Dumping raw tool output in the digest** — defeats the whole purpose. The digest must be distilled.
- **Wide `description`** — agents with vague descriptions get invoked accidentally, increasing cost without benefit.
- **Granting `Write`/`Edit` "just in case"** — one-shot agents are read-only. If you think you need mutation, use `general-purpose` or a team workflow instead.
- **Recursive subagents** — a one-shot agent that dispatches other agents reintroduces the context bloat it was meant to prevent.

## Agent Teams (Experimental)

Requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in settings.json (already enabled).

### When to Use Agent Teams
- Multi-service features requiring parallel work (API + frontend + worker)
- Large refactoring across many files with independent changes
- Parallel test creation across modules
- Research + implementation happening simultaneously

### Team Workflow
1. **TeamCreate** — create a named team with shared task list
2. **TaskCreate** — break work into tasks with clear ownership boundaries
3. **Task (spawn teammates)** — launch specialized agents with `team_name` parameter
4. **TaskUpdate** — assign tasks to teammates via `owner` field
5. **SendMessage** — coordinate between agents (DM or broadcast)
6. **SendMessage (shutdown_request)** — gracefully shut down teammates when done
7. **TeamDelete** — clean up team resources after completion

### Team Composition Patterns
| Pattern | Lead | Teammates | Use Case |
|---------|------|-----------|----------|
| **Parallel impl** | general-purpose | 2-3 general-purpose | Multi-service feature |
| **Test-driven** | general-purpose | test-specialist | TDD with parallel test writing |
| **Full pipeline** | general-purpose | test-specialist, quality-guardian, review-coordinator | End-to-end delivery |
| **Research + build** | general-purpose | Explore agent | Deep codebase research while implementing |

### Rules
- Teammates share a task list — use TaskList to check progress
- Prefer DMs (`type: "message"`) over broadcasts to reduce cost
- Teammates go idle between turns — this is normal, send a message to wake them
- Always shut down teammates gracefully before TeamDelete

## Phase 4: Post-Implementation (Steps 17-18) - Optional

### Step 17-18: Retrospective
- Note lessons learned in auto-memory
- Record useful patterns discovered

## CLAUDE.md Template Guidance

When creating or updating `CLAUDE.md` files for projects, include these sections as applicable:

### Cross-Cutting Change Maps
Document files that must change together to prevent partial updates:
```
If you change X, also update Y and Z:
- Cache paths: update both server/cache.go AND server/worker/page_cache.py
- Job payloads: update handlers.go, consumer.py, AND provider.dart
- API contracts: update schema.graphql AND generated types
```

### "What NOT to Change" Guardrails
Explicitly list things AI agents should never modify:
```
NEVER:
- Remove the FTS5 virtual table from the schema
- Change csp: null in tauri.conf.json
- Modify migration files that have already shipped
- Edit generated files under src/generated/
```

### Trust Boundary Documentation
List hostile input surfaces so agents apply proper validation:
```
Trust boundaries (sanitize all input from these sources):
- Image uploads to POST /api/v1/jobs (user-controlled content)
- Metadata fields (title, chapter) — sanitize before storage
- WebSocket clients — validate subscription requests
- Anything persisted under cache/ — treat as untrusted
```

### Security Posture Statement
Acknowledge what kind of app it is to calibrate security decisions:
```
This is a public-facing web app with user authentication.
Security posture: production-grade (rate limiting, CSP, CSRF, encrypted sessions).
```

These patterns are derived from production repos and significantly reduce AI agent errors in cross-cutting changes.
