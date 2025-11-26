# Claude Code Sub-Agents for AI Development Framework v3.1

This directory contains the 9 specialized Claude Code sub-agents that implement the agent-enhanced AI Development Framework.

## Agent Hierarchy with Model Assignments

| Agent | Model | Role | Proactive Trigger |
|-------|-------|------|-------------------|
| **framework-orchestrator** | **opus** | Master coordinator | MUST BE USED for any task >3 steps |
| **context-analyst** | sonnet | Phase 1: context | Use PROACTIVELY before implementation |
| **plan-architect** | **opus** | Phase 1: planning | MUST BE USED for architectural decisions |
| **implementation-engineer** | sonnet | Phase 2: coding | Use when executing approved plans |
| **test-specialist** | sonnet | Phase 2: testing | Use PROACTIVELY after implementation |
| **quality-guardian** | sonnet | Phase 2-3: QA | MUST BE USED before commit/PR/merge |
| **review-coordinator** | sonnet | Phase 3: PRs | Use when creating PRs |
| **metrics-collector** | sonnet | Phase 4: metrics | Use after task completion |
| **forensic-specialist** | sonnet | Security | Use PROACTIVELY for security audits |

## Usage

To use these agents with Claude Code CLI:

### 1. Copy agents to your ~/.claude/agents directory:
```bash
cp agents/*.md ~/.claude/agents/
```

### 2. Start any development task with the framework-orchestrator:
```bash
/agents framework-orchestrator "Add user authentication to my React app"
/agents framework-orchestrator "Refactor database layer and add caching"
/agents framework-orchestrator "Create comprehensive test suite for API endpoints"
```

### 3. The orchestrator will automatically coordinate all other agents:
- **context-analyst** analyzes your project structure and tech stack
- **plan-architect** creates comprehensive implementation plans with TodoWrite
- **implementation-engineer** implements code following quality standards (functions <50 lines)
- **test-specialist** creates comprehensive test suites with 80% minimum coverage
- **quality-guardian** enforces quality gates (linting, type checking, security)
- **review-coordinator** creates detailed PRs and manages review processes
- **metrics-collector** provides insights and retrospective data
- **forensic-specialist** performs security audits and threat analysis (defensive only)

## Framework Integration

These agents are designed to work with:
- **AI Development Framework v3.0** - Complete 18-step workflow
- **Multi-language support** - JavaScript/TypeScript, Python, Rust, Go
- **Quality standards** - Functions <50 lines, files <500 lines, 80% test coverage
- **Git workflow** - Semantic commits, feature branches, comprehensive PRs
- **TodoWrite integration** - Progress tracking throughout all phases

## Performance Targets

- **Planning**: 5-15 minutes (vs 15-30 minutes manual)
- **Implementation**: 1-1.5 hours (vs 2+ hours manual)
- **Review**: 30-45 minutes (vs 1+ hour manual)
- **Metrics**: 5 minutes (vs 10+ minutes manual)

## Quality Gates

All agents enforce:
- Code complexity limits (cyclomatic complexity <10)
- Test coverage requirements (>=80%)
- Security standards (no hardcoded secrets)
- Performance benchmarks (API <200ms, page load <3s)
- Documentation standards (inline docs for complex logic)

## Agent Coordination Rules

- Only framework-orchestrator initiates TodoWrite workflows
- Each specialist reports completion back to orchestrator
- Quality gates must be approved by quality-guardian
- All phases completed in sequence (1→4, 5→10, 11→16, 17→18)
- Metrics collected by metrics-collector before task closure

## Inter-Agent Communication Protocol

1. **Handoff Format**: JSON with task_id, status, findings, next_steps
2. **Quality Gate Signals**: PASS/FAIL/WARN with specific violations listed
3. **Escalation Path**: Any agent → quality-guardian → framework-orchestrator
4. **Metrics Reporting**: All agents report timing + outcome to metrics-collector
5. **Context Sharing**: Agents pass relevant file paths and patterns discovered

---

*Framework Version: 3.1 (Agent-Enhanced with Hooks & Skills)*
*Last Updated: 2025-11-26*
*Compatible with: Claude Code CLI Sub-Agents*