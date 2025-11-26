# AI-Assisted Development Framework v3.1

## Overview
This framework establishes a systematic approach to AI-assisted software development, optimizing for collaboration between human developers and AI models while maintaining code quality, readability, and maintainability.

## What's New in v3.1

### Hooks System
Automated quality gates and file protection:
- **Pre-Edit Hooks**: Block edits to sensitive files (`.env*`, `*.key`, `*.pem`, `credentials*`)
- **Pre-Commit Hooks**: Auto-format, lint, and test on commit

### Skills System
Read-only analysis modes with tool restrictions:
- **security-review**: Security audits and vulnerability scanning
- **context-analysis**: Project structure and pattern discovery
- **performance-audit**: Bottleneck detection and optimization

### Slash Commands
Quick access to framework workflows:
- `/agent <task>`: Full 18-step workflow
- `/context`: Project analysis
- `/quality`: Run quality checks
- `/security-scan`: Security audit
- `/pr-summary`: Generate PR summary

### MCP Integration
Model Context Protocol servers for enhanced capabilities:
- **GitHub**: PR/Issue automation via `gh` CLI
- **Filesystem**: Enhanced file operations
- **Memory**: Cross-session context persistence

### Proactive Agent Triggers
Agents now activate automatically based on context:
- **MUST BE USED**: Required for specific scenarios
- **Use PROACTIVELY**: Recommended automatic activation

## Core Principles

### 1. **Plan-First Development**
- Always begin with comprehensive planning before implementation
- Plans serve as contracts between human and AI
- Iterative refinement ensures alignment before execution
- Include risk assessment and success metrics upfront

### 2. **Isolated Development**
- Each feature/fix developed in dedicated branches
- Prevents pollution of main branch
- Enables clean rollback if needed
- Maintain feature flags for gradual rollout

### 3. **Test-Driven Validation**
- Define test scenarios during planning phase
- Tests created after implementation to validate requirements
- Minimum 80% coverage with performance benchmarks
- Creates regression safety net

### 4. **Agent-Based Orchestration**
- 9 specialized agents with clear responsibilities
- Proactive activation based on context
- Hybrid model assignment (Opus for strategic, Sonnet for execution)
- Quality gates enforced by dedicated quality-guardian agent

### 5. **Continuous Improvement**
- Collect metrics on every iteration
- Regular retrospectives and framework updates
- Documentation as code philosophy
- Feedback loops at every phase

## Agent Hierarchy (v3.1)

### Model Assignments

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

### Inter-Agent Communication Protocol

1. **Handoff Format**: JSON with task_id, status, findings, next_steps
2. **Quality Gate Signals**: PASS/FAIL/WARN with specific violations listed
3. **Escalation Path**: Any agent → quality-guardian → framework-orchestrator
4. **Metrics Reporting**: All agents report timing + outcome to metrics-collector
5. **Context Sharing**: Agents pass relevant file paths and patterns discovered

### Agent Coordination Rules

- Only framework-orchestrator can initiate TodoWrite workflows
- Each specialist agent reports back to orchestrator
- Quality gates must be approved by quality-guardian
- All phases must be completed in sequence
- Metrics must be collected by metrics-collector

## Enhanced Workflow Steps

### Phase 1: Planning & Context Setup

#### 1. **Context Preparation**
   - Create/Update `PROJECT_CONTEXT.md` with:
     - Tech stack details
     - Architecture decisions  
     - Coding conventions
     - Common patterns used
   - Review existing ADRs (Architecture Decision Records)
   - Identify relevant prompt templates

#### 2. **Request Detailed Plan**
   - Use prompt templates for consistency
   - Ask Claude for comprehensive implementation plan including:
     - Objective and scope
     - Step-by-step implementation approach
     - Acceptance criteria and success metrics
     - Risk assessment with mitigation strategies
     - Time estimates per step
     - Dependencies and prerequisites
     - Test scenarios and coverage targets
     - Performance benchmarks

#### 3. **Plan Documentation**
   - Save as `PLAN_<DESCRIPTIVE_NAME>.md`
   - Automatically gitignored to keep repository clean
   - Include test plan with coverage targets
   - Document architectural decisions as ADRs
   - Define measurable success criteria

#### 4. **Plan Refinement**
   - Discuss and iterate on plan with Claude
   - Clarify ambiguities
   - Add missing requirements
   - Validate time estimates
   - Consider performance implications
   - Review risk mitigation strategies
   - Finalize test scenarios

### Phase 2: Implementation with Quality Gates

#### 5. **Pre-Implementation Setup**
   - Configure pre-commit hooks:
     - Linting (ESLint, Ruff, Clippy)
     - Format checking (Prettier, Black, Rustfmt)
     - Basic security scanning
   - Set up PR template
   - Verify CI/CD pipeline configuration

#### 6. **Branch Creation**
   - Create feature branch: `feature/<task-name>`
   - Or bugfix branch: `fix/<issue-name>`
   - Or refactor branch: `refactor/<component-name>`
   - Keep branch names descriptive but concise

#### 7. **Incremental Development**
   - Implement plan step-by-step
   - Follow code complexity limits:
     - Functions < 50 lines
     - Cyclomatic complexity < 10
     - Clear, descriptive naming
   - Specialized agent coordination:
     - implementation-engineer: Complex logic, architecture
     - test-specialist: Test creation and validation
     - quality-guardian: Continuous quality monitoring
   - Commit frequently with semantic messages:
     - Format: `<type>(<scope>): <description>`
     - Types: feat, fix, refactor, test, docs, perf
   - Keep each commit atomic and reversible

#### 8. **Documentation During Development**
   - Write inline documentation (JSDoc/PyDoc)
   - Update README.md for new features
   - Create/Update ADRs for architectural changes
   - Document API changes comprehensively
   - Add examples for complex features

#### 9. **Test Creation & Validation**
   - Write comprehensive tests covering:
     - Unit tests for business logic
     - Integration tests for APIs
     - Edge cases and error conditions
     - Performance benchmarks for critical paths
   - Ensure minimum 80% coverage
   - Run full test suite
   - Validate against success metrics from plan

#### 10. **Quality Checks**
   - Run linting: `npm run lint` / `ruff check`
   - Run type checking: `npm run typecheck` / `mypy`
   - Run security scanning
   - Check performance benchmarks:
     - API response < 200ms (95th percentile)
     - Page load < 3 seconds
   - Verify no regression in existing tests

### Phase 3: Review, Integration & Feedback

#### 11. **Push to Remote & CI/CD**
   - Push branch to remote repository
   - Ensure CI/CD pipeline passes:
     - Automated tests
     - Code coverage reporting
     - Security vulnerability scanning
     - Performance benchmarks
   - Monitor build time (< 5 minutes target)

#### 12. **Pull Request Creation**
   - Use PR template with:
     - Link to original PLAN_*.md
     - Summary of changes
     - Test results and coverage report
     - Performance impact analysis
     - Breaking changes highlighted
     - Migration guide if needed
   - Reference issue/ticket numbers
   - Include screenshots/demos if UI changes

#### 13. **Multi-AI Code Review**
   - GitHub Copilot automated review focusing on:
     - Security vulnerabilities
     - Performance issues
     - Code maintainability
     - Best practices adherence
   - Request specialized scans:
     - Security analysis tools
     - Performance profiling
     - Accessibility checking

#### 14. **Review Feedback Loop**
   - Send Copilot comments to Claude
   - Address concerns systematically
   - Update code and tests as needed
   - Re-run quality checks after changes
   - Document decisions in PR comments
   - Target < 3 review iterations

#### 15. **Final Validation**
   - Verify all acceptance criteria met
   - Confirm test coverage maintained
   - Check performance benchmarks
   - Validate documentation updated
   - Ensure CHANGELOG.md updated
   - Run final security scan

#### 16. **Merge & Cleanup**
   - Squash commits if appropriate
   - Maintain clean git history
   - Use semantic merge commit message
   - Delete feature branch after merge
   - Update PROJECT_CONTEXT.md if needed
   - Tag release if applicable

### Phase 4: Post-Merge Activities

#### 17. **Metrics Collection**
   - Record implementation time vs estimate
   - Log number of review iterations
   - Track test coverage achieved
   - Note any production issues
   - Document lessons learned

#### 18. **Retrospective & Improvement**
   - Review what went well
   - Identify improvement areas
   - Update prompt templates
   - Refine time estimates
   - Adjust framework if needed
   - Share learnings with team

## Tool Integration

### Development Environment
```lua
-- Neovim + LazyVim recommended plugins
{
  "github/copilot.vim",
  "antropic/claude.nvim",
  "nvim-telescope/telescope.nvim",
  "nvim-treesitter/nvim-treesitter",
  "neovim/nvim-lspconfig",
  "folke/trouble.nvim",  -- Diagnostics
  "lewis6991/gitsigns.nvim",  -- Git integration
}
```

### Git Configuration
```bash
# Workflow aliases
git config --global alias.plan "checkout -b"
git config --global alias.publish "push -u origin HEAD"
git config --global alias.pr "!gh pr create"
git config --global alias.semantic "commit -m"
```

### Pre-commit Configuration
```yaml
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: lint
        name: Lint
        entry: npm run lint
        language: system
      - id: typecheck
        name: Type Check
        entry: npm run typecheck
        language: system
      - id: test
        name: Test
        entry: npm test
        language: system
```

## Best Practices for Human-AI Readability

### For Humans
1. **Clear Structure**: Consistent file organization with obvious entry points
2. **Meaningful Names**: Self-documenting variables, functions, and files
3. **Visual Hierarchy**: Strategic whitespace and formatting
4. **Progressive Disclosure**: Simple API, complex implementation
5. **Example-Driven**: Include usage examples in documentation

### For AI Models
1. **Explicit Context**: Never assume AI remembers previous conversations
2. **Complete Examples**: Provide full code samples with imports
3. **Type Annotations**: Use TypeScript/Python type hints everywhere
4. **Pattern Consistency**: Use same patterns throughout codebase
5. **Business Logic Comments**: Explain why, not what
6. **File Path References**: Include file_path:line_number format

## Success Metrics & Benchmarks

### Efficiency Metrics
- **Planning Time**: 15-30 minutes for small features
- **Plan to Implementation**: < 2 hours for small features
- **Review Cycles**: < 3 iterations
- **Build Time**: < 5 minutes
- **Test Suite**: < 10 minutes

### Quality Metrics
- **Test Coverage**: Minimum 80%
- **Code Complexity**: Cyclomatic complexity < 10
- **Function Length**: < 50 lines
- **Documentation Coverage**: 100% for public APIs
- **Bug Rate**: < 1 bug per 100 lines of new code

### Performance Benchmarks
- **API Response**: < 200ms (95th percentile)
- **Page Load**: < 3 seconds
- **Memory Usage**: No leaks detected
- **Bundle Size**: < 10% increase per feature

### Security Standards
- **Vulnerabilities**: 0 critical/high severity
- **Dependency Audit**: All dependencies current
- **Secret Scanning**: 0 exposed credentials
- **OWASP Compliance**: Top 10 mitigated

## Continuous Evolution

### Review Schedule
- **Weekly**: Team retrospectives on active projects
- **Monthly**: Framework effectiveness review
- **Quarterly**: Major framework updates
- **Annually**: Complete framework overhaul

### Evolution Triggers
- Technology stack changes
- AI model improvements
- Team size changes
- Project complexity increase
- Repeated pain points identified

### Feedback Channels
- PR comments and discussions
- Team retrospectives
- Framework issue tracker
- Metrics dashboard
- AI model performance logs

## Hooks System

### Pre-Edit Hook (File Protection)
Blocks edits to sensitive files:
- `.env*` - Environment files
- `*.key`, `*.pem` - Cryptographic keys
- `credentials*` - Credential files
- `.git/*` - Git internals
- `**/secrets/**` - Secret directories

### Pre-Commit Hook (Quality Gate)
Runs automatically on `git commit`:
1. Auto-format code (Prettier/Black/Rustfmt/Go fmt)
2. Run linting (ESLint/Ruff/Clippy/Go vet)
3. Run type checking (TypeScript/Mypy/Cargo check)
4. Run tests (Jest/Pytest/Cargo test/Go test)

## Skills System

### Available Skills

| Skill | Purpose | Allowed Tools |
|-------|---------|---------------|
| `security-review` | Security audits | Read, Grep, Glob, WebSearch |
| `context-analysis` | Project analysis | Read, Grep, Glob |
| `performance-audit` | Bottleneck detection | Read, Grep, Glob, Bash |

### Skill Characteristics
- **Read-only analysis**: No Write/Edit tools
- **Safe for exploration**: Can't modify code
- **Tool-restricted**: Only specified tools available

## Slash Commands

| Command | Description | Agent Used |
|---------|-------------|------------|
| `/agent <task>` | Full 18-step workflow | framework-orchestrator |
| `/context` | Refresh project analysis | context-analyst |
| `/quality` | Run all quality checks | quality-guardian |
| `/security-scan` | Quick security audit | forensic-specialist |
| `/pr-summary` | Generate PR summary | review-coordinator |

---

*Last Updated: 2025-11-26*
*Version: 3.1.0 (Agent-Enhanced with Hooks & Skills)*
*Next Review: 2026-02-26*