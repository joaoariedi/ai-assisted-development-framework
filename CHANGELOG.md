# Changelog

All notable changes to the AI Development Framework will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.3.0] - 2026-03-31

### Added
- **`verification-before-completion` skill**: Evidence-first completion gate with Iron Law ("NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE"), rationalization prevention table, and fresh-evidence requirements. Auto-invoked before task completion.
- **`systematic-debugging` skill**: 4-phase root cause investigation (read errors → reproduce → gather evidence → fix) with Iron Law ("NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST"), defense-in-depth pattern, and anti-pattern guidance.
- **`code-reviewer` agent**: Two-stage pre-PR review specialist. Stage 1 validates spec compliance against plan/spec artifacts. Stage 2 checks SOLID principles, architecture, error handling, security, and naming. Produces structured review report with verdict.
- **`/speckit.brainstorm` command**: Socratic design exploration before specification. Uses a hard gate (no code until design is approved), structured clarifying questions (one per message, multiple-choice preferred), proposes 2-3 approaches with trade-offs, writes a design document, and includes inline self-review. Inspired by obra/superpowers brainstorming skill.
- **`/speckit.fix` command**: Quick-fix bypass for trivial changes (typos, config, style) that skip the full SDD pipeline. Includes triviality gate with explicit criteria to prevent misuse.
- **`/speckit.review` command**: Read-only plan review gate that challenges scope, architecture, design, tests, performance, and constitution compliance before task generation. Slots between `/speckit.plan` and `/speckit.tasks`.
- **`/speckit.baseline` command**: Reverse-engineer specs from existing code for brownfield projects. Analyzes source files, extracts behaviors, generates spec.md with coverage gap analysis and source file references.
- **Development Lifecycle section** in README with three workflow paths: Quick Fix, Standard SDD, and Brownfield
- **The Four Balances** philosophy: security + performance + maintainability + efficacy as framework design principles
- **Iron Law enforcement pattern**: Non-negotiable rules in skills with rationalization prevention tables (inspired by obra/superpowers)

### Enhanced
- **`code-quality.md`**: Added verification-before-completion requirement, security-specific test files recommendation (`*_security_test.*` convention), Iron Law enforcement pattern
- **`quality-tooling.md`**: Added lefthook recommendation as structured hook alternative (YAML, parallel execution, staged-files-only), pre-commit vs pre-push separation strategy, CI/CD best practices (cancel-in-progress, fail-fast:false, screenshot artifacts, Dependabot for github-actions, smart cache keys)
- **`agent-workflow.md`**: Added CLAUDE.md template guidance for cross-cutting change maps, "What NOT to change" guardrails, trust boundary documentation, and security posture statements (patterns from production repos)
- **`speckit-helper.sh`**: Added helper functions for new commands: `check-plan-review`, `detect-existing-code`, `trivial-change-check`
- **`CLAUDE.md`**: Updated agent table to include code-reviewer (5 agents), added speckit.fix/review/baseline to SDD workflow, version bump to v4.3
- **`README.md`**: Major restructure with Development Lifecycle (3 paths), Four Balances table, updated component counts (5 agents, 6 skills, 17 commands), Iron Laws integration

---

## [4.1.0] - 2026-03-30

### Added
- **Pipeline Security Rules** (`pipeline-security.md`): New rules file with managed ASPM service catalog (Snyk, Aikido, Checkmarx, Veracode, Corgea, Cycode), open-source tool reference (Semgrep, OWASP ZAP, Gitleaks, TruffleHog, Knip, deadcode), and strategic selection guide by team size/budget and pipeline tier
- **Java Ecosystem Support**: Full tooling across all quality files — Checkstyle, PMD, SpotBugs, Spotless (pre-commit), Error Prone (compile-time), FindSecBugs, SonarQube
- **Universal Security Tools**: Gitleaks secrets detection, Semgrep cross-language SAST, Syft/Grype SBOM generation, Trivy all-in-one scanning
- **Tiered Validation Strategy**: 3-tier approach in quality-tooling.md — Tier 1 pre-commit (<5s), Tier 2 PR/CI (deep semantic), Tier 3 release (compliance/SBOM)
- **Mandatory Secrets Detection**: quality-guardian now requires gitleaks scan as first step before all other checks
- **Supply Chain Checks**: Language-specific SCA in quality-guardian and security-review — govulncheck (Go reachability), npm audit, pip-audit, cargo audit, OWASP Dependency-Check (Java)

### Enhanced
- **quality-guardian agent**: Added secrets detection mandatory first step, Semgrep SAST, supply chain SCA per language, Java quality standards, Biome option for JS/TS, govulncheck reachability analysis, SBOM generation for releases
- **quality-tooling.md**: Added Universal section, Biome as JS/TS alternative (~35x faster), pyright as mypy alternative, ruff as unified Python toolchain, golangci-lint (50+ linters), govulncheck, deadcode, Java ecosystem, tiered strategy
- **security-review skill**: Added Semgrep SAST step, secrets tool recommendations (gitleaks/trufflehog), supply chain & dependency section with reachability analysis, refined severity definitions with examples
- **security-scan command**: Added automated tool checks section (gitleaks, Semgrep, govulncheck, npm audit, pip-audit, cargo audit), enhanced severity descriptions
- **quality command**: Added secrets detection step, security & supply chain step, Java support, Biome/pyright alternatives, updated report format with Secrets and Security rows
- **quality-before-commit.sh**: Added gitleaks secrets detection (mandatory, runs first), Java project support via Spotless (Maven/Gradle)

---

## [4.0.2] - 2026-03-10

### Added
- **Compact Instructions in CLAUDE.md**: Built-in keep/drop rules for context compaction — preserves architectural decisions, key paths, debugging insights, error patterns; drops raw output, code blocks, intermediate steps

---

## [4.0.0] - 2026-02-23

### Added
- **Spec-Kit SDD Pipeline**: 9 new `/speckit.*` slash commands for full spec-driven development
  - `/speckit.init`: Bootstrap `.specify/` directory with templates
  - `/speckit.constitution`: Define project governance principles
  - `/speckit.specify`: Generate specs with scenarios, requirements, success criteria
  - `/speckit.plan`: Generate implementation plans with constitution compliance
  - `/speckit.tasks`: Generate phased task lists with Claude Code tracker integration
  - `/speckit.implement`: TDD execution with quality gates (red-green cycle)
  - `/speckit.analyze`: Read-only cross-artifact consistency analysis
  - `/speckit.clarify`: Targeted clarification questions for ambiguous specs
  - `/speckit.checklist`: Requirement quality checklists
- **`spec-template` skill**: Internal skill for Given/When/Then pattern generation
- **`.specify/` directory structure**: Per-project spec artifacts committed to version control

### Changed
- **Agent count reduced from 9 to 4**: Removed framework-orchestrator, context-analyst, plan-architect, implementation-engineer, metrics-collector. These roles are now handled by Claude Code's built-in agents (Explore, Plan, general-purpose)
- **Task management**: Replaced TodoWrite with TaskCreate/TaskUpdate/TaskGet/TaskList API
- **Hooks**: Now implemented as shell scripts (`*.sh`) instead of JSON config files, configured via `settings.json`
- **MCP servers**: Simplified to GitHub only (removed filesystem and memory servers)
- **Rules system**: 4 modular policy files in `rules/` directory (code-quality, git-workflow, agent-workflow, quality-tooling)

### Removed
- **5 agents**: framework-orchestrator, context-analyst, plan-architect, implementation-engineer, metrics-collector
- **`/spec-driven` skill**: Replaced by `/speckit.implement` command
- **JSON hook files**: Replaced by shell script hooks
- **Filesystem MCP server**: Not needed with Claude Code's built-in file tools
- **Memory MCP server**: Replaced by Claude Code's auto-memory feature

### Enhanced
- **Agent workflow**: Updated to reference spec-kit pipeline for SDD
- **CLAUDE.md**: Simplified to focus on 4 custom agents + TaskCreate API + SDD reference
- **Quality tooling**: Comprehensive per-language tool detection (JS/TS, Python, Rust, Go)

## [3.1.0] - 2025-11-26

### Added
- **Hooks System**: Automated quality enforcement without manual intervention
  - `pre-edit.json`: Blocks edits to sensitive files (.env, *.key, credentials, .git/*)
  - `pre-commit.json`: Auto-runs format, lint, typecheck, and tests before commits
- **Skills System**: Specialized, tool-restricted analysis modes
  - `security-review.md`: Read-only security audits (secrets, SQL injection, XSS, auth)
  - `context-analysis.md`: Project structure and tech stack analysis
  - `performance-audit.md`: Performance bottleneck detection
- **Expanded Slash Commands**: Quick access to common workflows
  - `/security-scan`: Security audit of staged changes
  - `/pr-summary`: Generate PR summary from current branch
  - `/context`: Refresh project context analysis
  - `/quality`: Run comprehensive quality checks
- **MCP Integration**: Model Context Protocol server configuration
  - GitHub MCP for PR/Issue automation
  - Filesystem MCP for enhanced file operations
  - Memory MCP for cross-session context persistence
- **Proactive Agent Triggers**: Agents auto-delegate based on task patterns
  - `MUST BE USED` triggers for mandatory agent involvement
  - `Use PROACTIVELY` triggers for context-based auto-delegation
- **Inter-Agent Communication Protocol**: Standardized agent coordination
  - JSON handoff format (task_id, status, findings, next_steps)
  - Quality gate signals (PASS/FAIL/WARN)
  - Escalation path definition
- **9th Agent**: Added `forensic-specialist` for security forensics and threat analysis

### Changed
- **Model Assignments**: Hybrid approach for cost/performance optimization
  - Opus (claude-opus-4-5) for orchestrator and plan-architect
  - Sonnet (claude-sonnet-4-5) for all specialist agents
- **Settings Configuration**: Permissive permissions with hook-based protection
  - Removed restrictive sandbox in favor of pre-edit hooks
  - Added explicit allow rules for common dev tools
- **README.md**: Complete rewrite with comprehensive usage manual
  - Added hooks documentation with examples
  - Added skills usage guide
  - Added slash commands reference
  - Added 10 quick tips section
  - Updated directory structure diagram

### Enhanced
- **Agent Descriptions**: Added proactive trigger phrases to all agents
- **Quality Gates**: Now automated through pre-commit hooks
- **File Protection**: Sensitive files blocked by hooks instead of global restrictions

### Improved
- **Developer Experience**: Less manual quality checking, more automation
- **Security**: Automatic protection of sensitive files
- **Workflow Speed**: Hooks eliminate manual lint/format/test runs

## [3.0.0] - 2025-09-04

### Released
- **Complete Agent-Enhanced Framework**: All 8 Claude Code sub-agents operational
- **Production Ready**: Comprehensive documentation and samples included
- **Performance Validated**: All targets met for automated workflow execution

## [2.0.0] - 2025-09-02

### Added
- **18-Step Enhanced Workflow**: Expanded from 11 to 18 steps across 4 phases
- **Phase 1: Planning & Context Setup** (Steps 1-4)
  - Context Preparation with PROJECT_CONTEXT.md management
  - Risk assessment and time estimation in planning
  - Architecture Decision Records (ADRs) integration
  - Plan refinement with validation steps
- **Phase 2: Implementation with Quality Gates** (Steps 5-10)
  - Pre-implementation setup with quality gates
  - Documentation during development
  - Comprehensive test creation and validation
  - Enhanced quality checks with security scanning
- **Phase 3: Review, Integration & Feedback** (Steps 11-16)
  - CI/CD pipeline integration
  - Multi-AI code review process
  - Structured feedback loop with iteration limits
  - Final validation before merge
- **Phase 4: Post-Merge Activities** (Steps 17-18)
  - Metrics collection and analysis
  - Retrospective and continuous improvement

### Enhanced
- **Core Principles**: Added Continuous Improvement as 5th principle
- **Performance Benchmarks**: 
  - API response < 200ms (95th percentile)
  - Page load < 3 seconds
  - Build time < 5 minutes
  - Test suite < 10 minutes
- **Security Standards**: OWASP Top 10 compliance requirements
- **Quality Metrics**: Enhanced with specific targets and measurement criteria
- **Tool Integration**: Added pre-commit hooks, diagnostics, and git integration
- **Context Management**: Systematic approach to maintaining AI model context

### Updated
- **CLAUDE_CONFIGURATION_SAMPLE.md**: Complete rewrite to match 18-step workflow
- **QUICK_REFERENCE.md**: Visual workflow diagram and enhanced checklists
- **AI_DEVELOPMENT_FRAMEWORK.md**: Merged all improvements into workflow steps
- **File Structure**: Added ADRs directory, CHANGELOG.md, PROJECT_CONTEXT.md

### Fixed
- Inconsistencies between framework documentation and configuration
- Missing performance targets and success metrics
- Lack of systematic approach to context management
- Incomplete quality gate definitions

## [1.0.0] - 2025-09-02

### Added
- Initial AI Development Framework documentation
- Basic 11-step workflow (Planning → Implementation → Review)
- Core principles: Plan-First, Isolated Development, Test-Driven, Multi-AI Review
- Claude configuration sample
- Quick reference guide
- Git integration and tool recommendations
- Basic success metrics and benchmarks

### Created
- `AI_DEVELOPMENT_FRAMEWORK.md` - Core framework documentation
- `CLAUDE_CONFIGURATION_SAMPLE.md` - AI configuration template
- `QUICK_REFERENCE.md` - Daily use cheat sheet
- `PLAN_FRAMEWORK_DOCUMENTATION.md` - Planning document example
- `.gitignore` - Git ignore patterns for plan files

---

## Template for Future Releases

## [3.0.0] - 2025-09-04

### Added
- **Claude Code Sub-Agent Orchestration**: Complete automation of 18-step workflow through 8 specialized agents
- **Agent Hierarchy**: 
  - framework-orchestrator (master coordinator)
  - context-analyst (project analysis and tech stack detection)
  - plan-architect (comprehensive planning and architecture)
  - implementation-engineer (code implementation with quality standards)
  - test-specialist (testing and validation with 80% coverage)
  - quality-guardian (quality assurance and performance monitoring)
  - review-coordinator (PR management and review coordination)
  - metrics-collector (data collection and retrospective insights)
- **Go Language Support**: Added alongside JavaScript/TypeScript, Python, and Rust
- **Agent Samples**: Complete agent configurations in `/agents` folder
- **Enhanced GitIgnore**: Comprehensive *PLAN* file exclusion patterns

### Changed
- **Workflow Automation**: From manual TodoWrite to fully automated agent coordination
- **Performance Targets**: 
  - Planning time: 15-30min → 5-15min (automated analysis)
  - Implementation time: 2 hours → 1-1.5 hours (focused specialist work)  
  - Review cycles: 3 iterations → 1-2 iterations (higher initial quality)
  - Quality checks: 15-20min → 5min (automated execution)
- **User Interaction**: Simple task description triggers complete automated workflow
- **Framework Coordination**: Agent-to-agent communication replaces human coordination

### Enhanced
- **CLAUDE_CONFIGURATION_SAMPLE.md**: Added agent usage instructions and coordination workflows
- **README.md**: Updated for agent-enhanced approach with practical usage examples
- **AI_DEVELOPMENT_FRAMEWORK.md**: Integrated agent-specific workflow automation
- **QUICK_REFERENCE.md**: Added agent automation timing and coordination details

### Improved
- **Agent Specialization**: Each phase handled by dedicated expert agents
- **Quality Enforcement**: Continuous monitoring through quality-guardian agent
- **Context Analysis**: Automated project structure and tech stack detection
- **Documentation Generation**: Automated by implementation-engineer during development
- **Metrics Collection**: Comprehensive data gathering for continuous improvement

### Fixed
- **Workflow Bottlenecks**: Eliminated manual coordination delays through agent orchestration
- **Quality Consistency**: Standardized quality enforcement across all projects
- **Context Switching**: Reduced cognitive load through specialized agent delegation
- **Planning Overhead**: Automated comprehensive planning reduces setup time

## [Unreleased]

### Added
### Changed  
### Deprecated
### Removed
### Fixed
### Security

## [2.1.0] - 2025-01-09

### Added
- **Claude Code CLI Optimization**: Streamlined 18-step workflow specifically for Claude Code
- **TodoWrite Integration**: Mandatory task tracking with specific enforcement triggers
- **Project Detection**: Automatic tooling discovery for JavaScript/TypeScript, Python, Rust
- **Quality Command Discovery**: Dynamic detection of lint/test/typecheck commands via project files
- **Enforcement Triggers**: Clear integration points with Claude Code workflow

### Changed
- **Simplified Framework**: Removed team-specific requirements (PR templates, CI/CD pipelines)
- **Individual Development Focus**: Adapted workflow for solo development scenarios
- **Practical Implementation**: Emphasis on actionable steps over theoretical frameworks
- **Response Guidelines**: Added conciseness requirements for CLI usage
- **Git Integration**: Simplified commit process with co-authoring options

### Enhanced
- **CLAUDE_CONFIGURATION_SAMPLE.md**: Complete rewrite for Claude Code CLI
  - Focused on practical Claude Code tool integration
  - Streamlined 18 steps for individual development
  - Added project-specific tooling detection
  - Included enforcement triggers and forbidden actions
- **Quality Standards**: Simplified metrics focusing on tool availability rather than fixed targets
- **Documentation Guidelines**: Reduced emphasis on extensive documentation, focused on code clarity

### Improved
- **Task Granularity**: Better guidance on when to use TodoWrite vs direct implementation
- **Tool Discovery**: Specific patterns for finding configuration files and available commands
- **Branch Strategy**: Simplified for individual development workflows
- **Performance Expectations**: Realistic targets based on project tooling availability

### Fixed
- **Configuration Complexity**: Removed enterprise/team features not relevant to individual use
- **Tool Integration**: Better alignment with Claude Code's actual capabilities
- **Workflow Enforcement**: Clear triggers for when to use specific tools and practices

---

**Notes:**
- This changelog follows semantic versioning
- Breaking changes are clearly marked
- Each version includes migration guidance when needed
- Framework improvements are continuously integrated