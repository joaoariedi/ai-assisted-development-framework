# Sample Claude Configuration (.claude/CLAUDE.md)

This configuration can be used in multiple ways:

1. **Global Configuration (Recommended)**: Using dotfiles/stow approach
   ```bash
   # Set up with stow (manages symlinks automatically)
   mkdir -p ~/dotfiles/claude/.claude
   # Copy content below to ~/dotfiles/claude/.claude/CLAUDE.md
   stow -d ~/dotfiles -t ~ claude
   ```

2. **Project-Specific**: Place in project root as `.claude/CLAUDE.md`

3. **Direct Home**: Place directly in `~/.claude/CLAUDE.md`

```markdown
# AI Development Framework Configuration v2.0

## Enhanced Workflow Requirements (18 Steps)

### Phase 1: Planning & Context Setup (Steps 1-4)

#### Step 1: Context Preparation
- Before any implementation, check/create `PROJECT_CONTEXT.md` with:
  - Tech stack details and versions
  - Architecture decisions and patterns
  - Coding conventions and style guides
  - Common patterns and anti-patterns
- Review existing ADRs (Architecture Decision Records)
- Identify and use relevant prompt templates

#### Step 2: Request Detailed Plan
- ALWAYS create a comprehensive plan including:
  - Objective and scope
  - Step-by-step implementation approach
  - Acceptance criteria and success metrics
  - Risk assessment with mitigation strategies
  - Time estimates per step (15-30 min for planning)
  - Dependencies and prerequisites
  - Test scenarios with coverage targets (min 80%)
  - Performance benchmarks

#### Step 3: Plan Documentation
- Save as `PLAN_<DESCRIPTIVE_NAME>.md` in project root
- Ensure PLAN_*.md is in .gitignore before creating
- Include test plan with specific scenarios
- Document architectural decisions as ADRs
- Define measurable success criteria
- Add performance targets (API < 200ms, page < 3s)

#### Step 4: Plan Refinement
- Iterate on plan with user feedback
- Clarify all ambiguities
- Validate time estimates
- Review risk mitigation strategies
- Finalize test scenarios
- Confirm performance implications

### Phase 2: Implementation with Quality Gates (Steps 5-10)

#### Step 5: Pre-Implementation Setup
- Configure/verify pre-commit hooks:
  - Linting (ESLint, Ruff, Clippy)
  - Format checking (Prettier, Black, Rustfmt)
  - Basic security scanning
- Set up PR template if missing
- Verify CI/CD pipeline configuration
- Check for existing quality gates

#### Step 6: Branch Creation
- Create appropriate branch type:
  - Features: `feature/<descriptive-name>`
  - Fixes: `fix/<issue-description>`
  - Refactoring: `refactor/<component-name>`
- Never work directly on main/master
- Keep branch names descriptive but concise

#### Step 7: Incremental Development
- Implement plan step-by-step
- Follow strict code quality limits:
  - Functions < 50 lines
  - Files < 500 lines
  - Cyclomatic complexity < 10
  - Clear, descriptive naming
- Use appropriate AI model:
  - Claude: Complex logic, architecture, reasoning
  - Copilot: Boilerplate, completions, reviews
- Commit with semantic messages:
  - Format: `<type>(<scope>): <description>`
  - Types: feat, fix, refactor, test, docs, perf
  - Keep commits atomic and reversible

#### Step 8: Documentation During Development
- Write inline documentation (JSDoc/PyDoc/RustDoc)
- Update README.md for new features
- Create/Update ADRs for architectural changes
- Document all public APIs comprehensively
- Add usage examples for complex features
- Include file_path:line_number references

#### Step 9: Test Creation & Validation
- Write comprehensive tests:
  - Unit tests for all business logic
  - Integration tests for APIs
  - Edge cases and error conditions
  - Performance benchmarks for critical paths
- Ensure minimum 80% coverage
- Run full test suite
- Validate against plan's success metrics
- Test execution time < 10 minutes

#### Step 10: Quality Checks
- Run all quality checks:
  - Linting: `npm run lint` / `ruff check` / `cargo clippy`
  - Type checking: `npm run typecheck` / `mypy` / `cargo check`
  - Security scanning
  - Test suite with coverage report
- Verify performance benchmarks:
  - API response < 200ms (95th percentile)
  - Page load < 3 seconds
  - Memory usage (no leaks)
  - Bundle size < 10% increase
- Ensure no regression in existing functionality

### Phase 3: Review, Integration & Feedback (Steps 11-16)

#### Step 11: Push to Remote & CI/CD
- Push branch to remote repository
- Monitor CI/CD pipeline:
  - Automated tests must pass
  - Code coverage >= 80%
  - Security vulnerability scan clean
  - Performance benchmarks met
- Build time should be < 5 minutes
- Address any pipeline failures immediately

#### Step 12: Pull Request Creation
- Use standardized PR template including:
  - Link to original PLAN_*.md
  - Summary of changes
  - Test results and coverage report
  - Performance impact analysis
  - Breaking changes clearly highlighted
  - Migration guide if needed
- Reference issue/ticket numbers
- Include screenshots/demos for UI changes
- Add reviewers appropriately

#### Step 13: Multi-AI Code Review
- GitHub Copilot automated review for:
  - Security vulnerabilities (OWASP Top 10)
  - Performance issues
  - Code maintainability
  - Best practices adherence
- Request specialized scans:
  - SAST/DAST security analysis
  - Performance profiling
  - Accessibility checking (WCAG compliance)
- Document all findings

#### Step 14: Review Feedback Loop
- Send all Copilot comments to Claude
- Address each concern systematically
- Update code and tests as needed
- Re-run all quality checks after changes
- Document decisions in PR comments
- Target < 3 review iterations
- Never ignore or suppress warnings

#### Step 15: Final Validation
- Verify all acceptance criteria met
- Confirm test coverage maintained >= 80%
- Check performance benchmarks
- Validate all documentation updated
- Ensure CHANGELOG.md updated
- Run final security scan
- Confirm no breaking changes without migration path

#### Step 16: Merge & Cleanup
- Squash commits if appropriate for clean history
- Use semantic merge commit message
- Delete feature branch after merge
- Update PROJECT_CONTEXT.md if architecture changed
- Tag release if applicable
- Notify team of significant changes

### Phase 4: Post-Merge Activities (Steps 17-18)

#### Step 17: Metrics Collection
- Record and analyze:
  - Implementation time vs estimate
  - Number of review iterations
  - Test coverage achieved
  - Any production issues
  - Performance impact
  - User feedback
- Document lessons learned
- Update time estimates for future

#### Step 18: Retrospective & Improvement
- Review what went well and what didn't
- Identify improvement areas
- Update prompt templates
- Refine framework if needed
- Share learnings with team
- Schedule follow-up if needed

## Code Quality Standards

### Complexity Limits
- Maximum function length: 50 lines
- Maximum file length: 500 lines
- Maximum cyclomatic complexity: 10
- Maximum nested depth: 4 levels
- Maximum parameters per function: 5

### Testing Standards
- Minimum test coverage: 80%
- Unit tests for all business logic
- Integration tests for all APIs
- Performance tests for critical paths
- Edge case coverage mandatory
- Test execution time < 10 minutes

### Documentation Requirements
- 100% documentation for public APIs
- README.md always current
- CHANGELOG.md updated per release
- ADRs for architectural decisions
- Inline comments for complex logic
- Examples for all features

### Performance Benchmarks
- API response time: < 200ms (95th percentile)
- Page load time: < 3 seconds
- Build time: < 5 minutes
- Test suite: < 10 minutes
- Memory usage: No detectable leaks
- Bundle size increase: < 10% per feature

### Security Standards
- Zero critical/high vulnerabilities
- OWASP Top 10 compliance
- No secrets in code
- All inputs sanitized
- Authentication required where needed
- Regular dependency updates

## Git Configuration

### Commit Message Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore

### Branch Naming
- feature/<descriptive-name>
- fix/<issue-number-description>
- refactor/<component-name>
- hotfix/<critical-issue>
- release/<version>

### Git Rules
- Never commit directly to main/master
- Always use feature branches
- Default author: joaoariedi@gmail.com
- Ask before adding co-author attribution
- Squash commits when merging
- Delete branches after merge

## AI Collaboration Rules

### Model Selection
- Claude: Planning, complex logic, architecture, implementation
- Copilot: Code review, completions, refactoring suggestions
- Specialized tools: Security scanning, performance analysis

### Context Management
- Always provide full context
- Include file paths with line numbers (file_path:line_number)
- Reference previous decisions and ADRs
- Use prompt templates for consistency
- Never assume AI remembers previous sessions

### Communication Style
- Be concise and direct
- Explain the "why" behind decisions
- Provide rationale for architectural choices
- Suggest improvements proactively
- Ask for clarification when ambiguous

## Commands to Run

### After Implementation
```bash
# JavaScript/TypeScript
npm run lint && npm run typecheck && npm test

# Python
ruff check . && mypy . && pytest

# Rust
cargo clippy && cargo test

# Go
go fmt ./... && go vet ./... && go test ./...
```

### Before Commit
```bash
# Run pre-commit hooks
pre-commit run --all-files

# Check git status
git status

# Run security scan
npm audit / pip audit / cargo audit
```

## Forbidden Actions
- ❌ Delete files without explicit permission
- ❌ Modify .git directory
- ❌ Change CI/CD without approval
- ❌ Remove tests or reduce coverage
- ❌ Introduce breaking changes without discussion
- ❌ Create unnecessary documentation unless requested
- ❌ Commit secrets or credentials
- ❌ Ignore security warnings
- ❌ Skip any workflow steps

## Success Metrics

### Efficiency Targets
- Planning: 15-30 minutes
- Small feature: < 2 hours
- Review cycles: < 3
- Bug rate: < 1 per 100 LOC
- Deployment frequency: Daily

### Quality Targets
- Test coverage: >= 80%
- Documentation: 100% public APIs
- Security vulnerabilities: 0 critical/high
- Performance regression: 0 tolerance
- Code review approval: Required

## Continuous Improvement

### Review Schedule
- Weekly: Active project retrospectives
- Monthly: Framework effectiveness
- Quarterly: Major updates
- Annually: Complete overhaul

### Feedback Channels
- PR comments
- Team retrospectives
- Framework issue tracker
- Metrics dashboard
- User feedback

Remember: This framework is about excellence through systematic approach, not just following rules.
```

## Usage Instructions

1. **For Global Configuration with Stow (Recommended):**
   ```bash
   mkdir -p ~/dotfiles/claude/.claude
   # Extract the markdown content above to ~/dotfiles/claude/.claude/CLAUDE.md
   stow -d ~/dotfiles -t ~ claude
   # This creates ~/.claude/CLAUDE.md as a symlink
   ```

2. **For Project-Specific Configuration:**
   ```bash
   mkdir -p .claude
   # Extract the markdown content above to .claude/CLAUDE.md
   # Customize for your project
   ```

3. **For Direct Global Configuration:**
   ```bash
   mkdir -p ~/.claude
   # Extract the markdown content above to ~/.claude/CLAUDE.md
   # Add personal preferences
   ```

3. **Customization Points:**
   - Update author email
   - Adjust quality metrics
   - Add project-specific commands
   - Modify branch naming conventions
   - Set appropriate performance targets

4. **Maintenance:**
   - Review monthly
   - Update after architecture changes
   - Version control .claude directory
   - Share with team

---

*Aligned with AI Development Framework v2.0.0*
*Last Updated: 2025-09-02*