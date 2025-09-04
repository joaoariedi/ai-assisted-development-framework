# Claude Code Sub-Agents for AI Development Framework v3.0

This directory contains the 8 specialized Claude Code sub-agents that implement the agent-enhanced AI Development Framework.

## Agent Hierarchy

1. **framework-orchestrator** - Master coordinator for the complete 18-step workflow
2. **context-analyst** - Phase 1: Project analysis and tech stack detection
3. **plan-architect** - Phase 1: Planning and architecture design
4. **implementation-engineer** - Phase 2: Code implementation with quality standards
5. **test-specialist** - Phase 2: Testing and validation (80% coverage minimum)
6. **quality-guardian** - Phase 2-3: Quality assurance and performance monitoring
7. **review-coordinator** - Phase 3: PR management and review coordination
8. **metrics-collector** - Phase 4: Data collection and retrospective insights

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

---

*Framework Version: 3.0 (Agent-Enhanced)*  
*Last Updated: 2025-09-04*  
*Compatible with: Claude Code CLI Sub-Agents*