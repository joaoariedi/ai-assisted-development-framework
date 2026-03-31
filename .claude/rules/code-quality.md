# Code Quality Standards

## Complexity Limits
- Maximum function length: 50 lines
- Maximum file length: 500 lines
- Maximum cyclomatic complexity: 10
- Clear, descriptive naming always

## Testing Requirements
- Test existing patterns when framework present
- Focus on business logic and edge cases
- Use existing test structure and conventions
- Aim for reasonable coverage without obsessing over percentages
- Follow project-configured coverage thresholds if they exist

## Documentation Guidelines
- Inline documentation for complex logic only
- README updates only when explicitly requested
- Code should be self-documenting through clear naming
- Include `file_path:line_number` references in explanations
- NEVER proactively create documentation files (*.md) or README files

## Architectural Principles (SOLID)
- **SRP**: Each class or module should have one reason to change
- **OCP**: Extend behavior through composition or polymorphism, not modification of existing code
- **DIP**: Depend on abstractions, not concrete implementations — inject dependencies
- Focus on OCP and DIP violations — these cause the most maintenance burden
- Apply pragmatically: small scripts, prototypes, and one-off utilities are exempt
- The quality-guardian agent checks for violations in changed code during quality gates

## Quality Assurance
- ALWAYS run available quality tools before completing any task
- Fix linting and type errors immediately
- No hardcoded secrets or credentials
- Follow existing project conventions and patterns
- Prefer editing existing files over creating new ones

## Verification Before Completion
- NEVER claim a task is complete without running proof commands (tests, lint, build)
- Show actual output of verification commands — do not summarize or assume results
- If verification reveals failures, fix them before claiming completion
- Stale evidence (from a previous iteration) is not valid — re-run after every change
- The `verification-before-completion` skill defines the full protocol and Iron Law

## Security-Specific Test Files
- For features involving auth, authorization, or data protection, create dedicated security test files
- Naming: `*_security_test.*` or `*security*.test.*` (match project conventions)
- Cover: auth bypass, privilege escalation, input sanitization, rate limiting, session management
- Pattern: FrankMega maintains 5 dedicated security test files alongside standard tests

## Iron Law Enforcement
- Rules marked as "Iron Law" in skills are non-negotiable — cannot be overridden by convenience
- Two Iron Laws exist: `verification-before-completion` and `systematic-debugging`
- quality-guardian must enforce Iron Laws during quality gates
- Iron Laws include rationalization prevention tables to counter common excuses
