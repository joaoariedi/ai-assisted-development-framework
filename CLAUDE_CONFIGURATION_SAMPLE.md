# Claude Code Configuration Sample

This configuration optimizes Claude Code for the 18-step AI development framework.

## Setup Options

1. **Global Configuration (Recommended)**: Using dotfiles/stow
   ```bash
   mkdir -p ~/dotfiles/claude/.claude
   # Copy content below to ~/dotfiles/claude/.claude/CLAUDE.md
   stow -d ~/dotfiles -t ~ claude
   ```

2. **Project-Specific**: Place in `.claude/CLAUDE.md`
3. **Direct Global**: Place in `~/.claude/CLAUDE.md`

---

## Claude Code Configuration

```markdown
# AI Development Framework Configuration v2.1

## 18-Step Claude Code Workflow

### Phase 1: Planning & Context (Steps 1-4)

#### Step 1: Context Preparation
- Examine project structure with Glob/Read tools
- Check `package.json`, `pyproject.toml`, `Cargo.toml` for:
  - Tech stack and versions
  - Available scripts (test, lint, build)
  - Existing patterns and conventions

#### Step 2: TodoWrite Planning
- **ALWAYS use TodoWrite** for task breakdown
- Include: objectives, implementation steps, quality checks, testing
- Use ExitPlanMode for complex features

#### Step 3: Plan Documentation (Complex Tasks Only)
- For >5 todos: create `PLAN_<NAME>.md`
- Ensure `PLAN_*.md` in `.gitignore`
- Skip for simple tasks (<3 todos)

#### Step 4: Plan Refinement
- Iterate todos based on feedback
- Break large tasks into manageable pieces
- Clarify ambiguities before implementation

### Phase 2: Implementation (Steps 5-10)

#### Step 5: Tool Discovery
- Use Grep/Glob to find quality tools:
  - `.pre-commit-config.yaml`
  - Scripts in `package.json`
- Identify: lint, format, test commands

#### Step 6: Branch Creation (Git Only)
- Create feature branches: `feature/<name>`
- Use: `git checkout -b feature/task-name`
- Skip for non-git projects

#### Step 7: Development with TodoWrite
- **Mark todo "in_progress" before work**
- Follow limits: functions <50 lines, files <500 lines
- **Mark "completed" immediately after finishing**
- Use semantic commits: `<type>: <description>`

#### Step 8: Documentation
- Inline docs for complex functions only
- README updates only if requested
- Include `file_path:line_number` references
- Focus on code clarity

#### Step 9: Testing
- Find test patterns: `**/*test*`, `**/spec/**`
- Follow existing structure
- Focus on business logic and edge cases
- Run available test suite

#### Step 10: Quality Checks
- **ALWAYS run before completion**:
  - Linting: `npm run lint` / `ruff check` / `cargo clippy`
  - Type check: `npm run typecheck` / `mypy` / `cargo check`
  - Tests if available
- Fix all issues before task completion

### Phase 3: Integration (Steps 11-16)

#### Step 11: Local Validation
- All todos completed
- All quality tools passing
- No regressions

#### Step 12: Git Integration
- Stage changes: `git add .`
- Ask about co-authoring preference
- Format: `type: description\n\n🤖 Generated with Claude Code\n\nCo-Authored-By: Claude <noreply@anthropic.com>`

#### Step 13: Self-Review
- Security (no hardcoded secrets)
- Performance implications
- Code maintainability
- Pattern adherence

#### Step 14: Issue Resolution
- Fix quality check failures
- Re-run tests after changes
- Update todos for new issues

#### Step 15: Final Validation
- Acceptance criteria met
- No breaking changes
- All quality tools pass
- Implementation matches requirements

#### Step 16: Completion
- All todos marked completed
- Only commit when explicitly requested
- Provide change summary

### Phase 4: Post-Implementation (Steps 17-18)

#### Step 17: Learning Capture
- Note lessons learned
- Document helpful tools
- Record discovered patterns

#### Step 18: Process Improvement
- Review what worked well
- Identify future improvements
- Update approach for project

## Claude Code Integration

### TodoWrite Rules
- **MANDATORY** for >2 step tasks
- Exactly ONE "in_progress" at a time
- Mark "completed" immediately
- Break complex tasks down

### Tool Usage
- **Read**: Understand existing patterns
- **Grep**: Find implementations
- **Glob**: Discover project structure
- **Bash**: Run quality checks

### Quality Standards
- Functions < 50 lines
- Files < 500 lines
- Clear, descriptive naming
- No hardcoded secrets
- Follow existing conventions

### Project Detection

#### JavaScript/TypeScript
- Files: `package.json`, `.eslintrc*`, `tsconfig.json`
- Commands: `npm run lint`, `npm run typecheck`, `npm test`

#### Python
- Files: `pyproject.toml`, `requirements.txt`
- Commands: `ruff check`, `mypy`, `pytest`

#### Rust
- Files: `Cargo.toml`
- Commands: `cargo clippy`, `cargo test`

### Git Configuration
```
<type>: <description>

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
```

Types: feat, fix, refactor, test, docs, perf

### Enforcement Triggers
1. **Before implementation**: Create TodoWrite
2. **During work**: Mark progress
3. **After changes**: Run quality checks
4. **Before completion**: All todos completed
5. **Git projects**: Ask about co-authoring, commit only when requested

### Forbidden Actions
- Delete files without permission
- Create docs unless requested
- Commit without explicit request
- Skip quality checks
- Ignore linting/type errors

## Key Reminders
1. Always use TodoWrite for task tracking
2. Run quality checks before completion
3. Follow existing project patterns
4. Only commit when requested
5. Ask about co-authoring
6. Keep responses concise
```

## Customization

- Update author email in Git section
- Adjust quality commands for your stack
- Add project-specific patterns
- Set appropriate complexity limits

## Maintenance

- Review effectiveness monthly
- Update for new project patterns
- Version control `.claude` directory

---

*Optimized for Claude Code CLI*
*Framework Version: 2.1.0*
*Last Updated: 2025-01-09*