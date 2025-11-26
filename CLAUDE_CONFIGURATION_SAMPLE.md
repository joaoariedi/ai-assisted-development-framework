# Claude Code Configuration Sample v3.1

Complete configuration for the AI Development Framework with hooks, skills, MCP integration, and proactive agent triggers.

## Setup Options

### 1. Global Configuration (Recommended)
```bash
# Create dotfiles structure
mkdir -p ~/dotfiles/claude/.claude/{agents,commands,hooks,skills}

# Copy configurations
cp -r .claude/* ~/dotfiles/claude/.claude/

# Symlink via stow
stow -d ~/dotfiles -t ~ claude

# Verify symlinks
ls -la ~/.claude/
```

### 2. Project-Specific
Place files in `.claude/` directory of your project.

### 3. Direct Global
Place files directly in `~/.claude/`

---

## Directory Structure

```
~/.claude/
├── CLAUDE.md              # Main configuration
├── settings.json          # Permissions
├── mcp.json              # MCP servers
├── commands/
│   ├── agent.md          # /agent command
│   ├── context.md        # /context command
│   ├── quality.md        # /quality command
│   ├── security-scan.md  # /security-scan command
│   └── pr-summary.md     # /pr-summary command
├── hooks/
│   ├── pre-edit.json     # File protection
│   └── pre-commit.json   # Quality gates
├── skills/
│   ├── security-review.md
│   ├── context-analysis.md
│   └── performance-audit.md
└── agents/
    ├── framework-orchestrator.md
    ├── context-analyst.md
    ├── plan-architect.md
    ├── implementation-engineer.md
    ├── test-specialist.md
    ├── quality-guardian.md
    ├── review-coordinator.md
    ├── metrics-collector.md
    └── forensic-specialist.md
```

---

## CLAUDE.md Configuration

```markdown
# AI Development Framework Configuration v3.1 - Agent-Enhanced

## Agent-Based Workflow Activation

### Primary Agent: framework-orchestrator
- **Trigger**: Any development task requiring >3 steps
- **Purpose**: Master coordinator for 18-step workflow
- **Delegation**: Automatically delegates to specialized agents

### Agent Hierarchy (with Proactive Triggers)

| Agent | Model | Role | Proactive Trigger |
|-------|-------|------|-------------------|
| **framework-orchestrator** | opus | Master coordinator | MUST BE USED for any task >3 steps |
| **context-analyst** | sonnet | Phase 1: context analysis | Use PROACTIVELY before implementation |
| **plan-architect** | opus | Phase 1: planning | MUST BE USED for architectural decisions |
| **implementation-engineer** | sonnet | Phase 2: coding | Use when executing approved plans |
| **test-specialist** | sonnet | Phase 2: testing | Use PROACTIVELY after implementation |
| **quality-guardian** | sonnet | Phase 2-3: QA | MUST BE USED before commit/PR/merge |
| **review-coordinator** | sonnet | Phase 3: PR management | Use when creating PRs |
| **metrics-collector** | sonnet | Phase 4: metrics | Use after task completion |
| **forensic-specialist** | sonnet | Security: forensics | Use PROACTIVELY for security audits |

### Agent Coordination Rules
- Only framework-orchestrator can initiate TodoWrite workflows
- Each specialist agent reports back to orchestrator
- Quality gates must be approved by quality-guardian
- All phases must be completed in sequence
- Metrics must be collected by metrics-collector

### Inter-Agent Communication Protocol
1. **Handoff Format**: JSON with task_id, status, findings, next_steps
2. **Quality Gate Signals**: PASS/FAIL/WARN with specific violations listed
3. **Escalation Path**: Any agent → quality-guardian → framework-orchestrator
4. **Metrics Reporting**: All agents report timing + outcome to metrics-collector
5. **Context Sharing**: Agents pass relevant file paths and patterns discovered

### Phase 1: Planning & Context Setup (Steps 1-4)

#### Step 1: Context Preparation (context-analyst)
- Automated project structure analysis using Glob/Read tools
- Auto-detect tech stack from `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`
- Identify existing patterns, conventions, and quality tools
- Generate comprehensive project context report

#### Step 2: Create Todo List & Plan (plan-architect)
- **Automated TodoWrite** creation by framework-orchestrator
- AI-generated comprehensive task breakdown
- Uses ExitPlanMode for complex implementations

#### Step 3: Plan Documentation (Optional)
- For complex features (>5 todos), save as `PLAN_<DESCRIPTIVE_NAME>.md`
- Skip for simple tasks (<3 todos)

#### Step 4: Plan Refinement
- Iterate todos based on user feedback
- Clarify ambiguities before implementation

### Phase 2: Implementation with Quality Gates (Steps 5-10)

#### Step 5: Pre-Implementation Setup
- Check for existing quality tools using Grep/Glob
- Identify available lint/format/test commands

#### Step 6: Branch Creation (Git Projects Only)
- Features: `feature/<descriptive-name>`
- Fixes: `fix/<issue-description>`

#### Step 7: Incremental Development with TodoWrite
- Mark todo as "in_progress" before starting work
- Follow code quality limits (functions <50 lines, files <500 lines)
- Mark todo as "completed" immediately after finishing

#### Step 8: Documentation During Development
- Add inline documentation for complex functions
- Focus on code clarity over excessive documentation

#### Step 9: Test Creation & Validation
- Follow existing test patterns
- Focus on business logic and edge cases

#### Step 10: Quality Checks
- **ALWAYS run quality checks after implementation**
- Fix any issues before considering task complete

### Phase 3: Review & Integration (Steps 11-16)

#### Step 11-16: Local Validation → Git Integration → Review → Merge

### Phase 4: Post-Implementation (Steps 17-18)

#### Step 17-18: Metrics Collection → Retrospective

## Code Quality Standards

### Complexity Limits
- Maximum function length: 50 lines
- Maximum file length: 500 lines
- Maximum cyclomatic complexity: 10

### Quality Assurance
- Always run available quality tools before completing
- Fix linting and type errors immediately
- No hardcoded secrets or credentials

## Git Configuration

### Commit Message Format
<type>: <description>

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>

### Commit Types
feat, fix, refactor, test, docs, style, perf

## Important Reminders
1. Always use TodoWrite for task management
2. Run quality checks before completing tasks
3. Follow existing patterns
4. Only commit when explicitly requested
5. Use `git -C <directory>` instead of `cd && git`
```

---

## settings.json

```json
{
  "alwaysThinkingEnabled": true,
  "permissions": {
    "allow": [
      "Bash(git:*)",
      "Bash(npm:*)",
      "Bash(yarn:*)",
      "Bash(pnpm:*)",
      "Bash(pytest:*)",
      "Bash(cargo:*)",
      "Bash(go:*)",
      "Bash(make:*)",
      "Bash(docker:*)"
    ],
    "deny": []
  }
}
```

---

## Hooks Configuration

### hooks/pre-edit.json (File Protection)

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": {
          "tool": ["Edit", "Write"],
          "file_pattern": [
            ".env*",
            "*.key",
            "*.pem",
            "credentials*",
            ".git/*",
            "**/secrets/**"
          ]
        },
        "action": "block",
        "message": "Protected file - requires explicit user approval"
      }
    ]
  }
}
```

### hooks/pre-commit.json (Quality Gate)

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": {
          "tool": "Bash",
          "command_pattern": "git commit*"
        },
        "action": "run",
        "commands": [
          {
            "description": "Auto-format staged files",
            "js": "npm run format --if-present",
            "py": "black . && ruff check --fix . || true",
            "go": "go fmt ./...",
            "rs": "cargo fmt"
          },
          {
            "description": "Run linting",
            "js": "npm run lint --if-present",
            "py": "ruff check .",
            "go": "go vet ./...",
            "rs": "cargo clippy"
          },
          {
            "description": "Run tests",
            "js": "npm test --if-present || true",
            "py": "pytest -q || true",
            "go": "go test ./... || true",
            "rs": "cargo test || true"
          }
        ]
      }
    ]
  }
}
```

---

## MCP Configuration

### mcp.json

```json
{
  "mcpServers": {
    "github": {
      "transport": "http",
      "url": "https://api.githubcopilot.com/mcp/v1",
      "scope": "user",
      "description": "GitHub PR/Issue automation"
    },
    "filesystem": {
      "transport": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem"],
      "scope": "local",
      "description": "Enhanced file operations"
    },
    "memory": {
      "transport": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "scope": "user",
      "description": "Cross-session context"
    }
  }
}
```

---

## Skills Configuration

### skills/security-review.md

```markdown
---
name: "Security Review"
description: |
  Use when performing security audits, vulnerability scans,
  or reviewing code for security issues. Read-only analysis.
allowed-tools: Read, Grep, Glob, WebSearch
---

Perform comprehensive security analysis:
1. Scan for hardcoded secrets (API_KEY, PASSWORD, SECRET, TOKEN)
2. Check for SQL injection vulnerabilities
3. Identify XSS risks in template rendering
4. Review authentication/authorization implementations
5. Check dependency vulnerabilities via package manifests
```

### skills/context-analysis.md

```markdown
---
name: "Context Analysis"
description: |
  Use PROACTIVELY when exploring new codebases or
  gathering project context. Read-only discovery.
allowed-tools: Read, Grep, Glob
---

Generate comprehensive project context:
1. Tech stack detection from config files
2. Architecture pattern identification
3. Test framework discovery
4. Quality tool detection
5. Dependency analysis
```

### skills/performance-audit.md

```markdown
---
name: "Performance Audit"
description: |
  Use when analyzing performance bottlenecks.
allowed-tools: Read, Grep, Glob, Bash
---

Analyze performance characteristics:
1. Identify N+1 query patterns
2. Find synchronous blocking operations
3. Detect memory leak patterns
4. Review caching implementations
```

---

## Slash Commands

### commands/agent.md

```markdown
---
description: "Quick access to framework-orchestrator agent"
model: sonnet
argument_hint: "development task description"
---

Use the framework-orchestrator agent to coordinate the complete 18-step workflow for: $ARGUMENTS
```

### commands/context.md

```markdown
---
description: "Refresh project context analysis"
---

Use context-analyst agent to:
1. Re-analyze project structure
2. Detect any new patterns or tools
3. Update mental model of codebase
4. Identify recent architectural changes
```

### commands/quality.md

```markdown
---
description: "Run comprehensive quality checks"
---

Use quality-guardian agent to:
1. Run all available linters
2. Execute type checking
3. Run test suite
4. Check code complexity metrics
5. Report any violations
```

### commands/security-scan.md

```markdown
---
description: "Quick security scan of current changes"
---

Use forensic-specialist agent to scan for:
- Hardcoded secrets in staged changes
- New dependencies with known vulnerabilities
- Security anti-patterns in modified code
```

### commands/pr-summary.md

```markdown
---
description: "Generate PR summary from current branch"
---

Analyze all commits since branching from main:
1. Summarize changes by category
2. List modified files with descriptions
3. Identify breaking changes
4. Generate test plan recommendations
```

---

## Quick Tips

1. **Let agents work proactively** - Don't micromanage
2. **Use slash commands** - `/quality`, `/context`, `/security-scan`
3. **Trust the hooks** - Auto-format and validate on commit
4. **Skills are read-only** - Safe for analysis
5. **TodoWrite discipline** - ONE task in_progress at a time
6. **Quality standards** - Functions <50 lines, Files <500 lines

---

*Framework Version: 3.1.0 (Agent-Enhanced with Hooks & Skills)*
*Last Updated: 2025-11-26*
