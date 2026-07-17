# Code Quality Standards

## Complexity Limits
- Maximum function length: 50 lines
- Maximum file length: 500 lines **of code** — comments and blank lines do not count
- Maximum cyclomatic complexity: 10
- Clear, descriptive naming always

> **Why the file limit counts code, not lines.** These are *complexity* limits — they sit beside
> cyclomatic complexity and function length because each is a proxy for how much a reader must hold in
> their head. A comment adds none of that; it *reduces* it. Counting raw lines would penalise exactly
> the practice this project mandates elsewhere: comments that state the trap and why the obvious fix is
> wrong. `workflows/speckit-workflow.js` is the case that forced the clarification — 372 lines of code
> and 104 of commentary, where every comment records a defect that was measured, not imagined, and where
> the Workflow harness offers no module system to extract into. A raw cap would have deleted the
> documentation and kept the complexity.
>
> This is a clarification of intent, not a relaxation. If the *code* exceeds 500 lines, split the file.

### The one exemption: `workflows/speckit-workflow.js`

The file limit's remedy is "split the file." For a Claude Code **Workflow script** that remedy does not
exist, so the limit is scoped to exclude this one file — deliberately, and with the reason on record.

The Workflow harness executes the script as a **function body**, injecting `agent`/`parallel`/`phase`/
`log`/`args` as globals. A static `import` is therefore a **compile error** — *"Cannot use import
statement outside a module"* — not a policy choice we could argue with. Verified, not assumed. `require`
is undefined (ESM context), and the harness documents no filesystem or Node API access, so dynamic
`import()` is not something the plugin's core may bet on either. There is no module to extract into.

The alternative was deleting comments to fit, and in this file that is the worst available trade: each
one records a defect that was *measured* — a `throw null` that killed the error handler, a `const` that
threw on every path, a `gate &&` that reported 2/2 across six dead gates. Deleting them keeps the
complexity and loses the only reason anyone would not reintroduce it.

**Every other file keeps the 500-line limit.** If a second file ever needs this exemption, that is a
signal the harness constraint has spread, and it deserves a fresh argument rather than a precedent.

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

## Surgical Changes
- Every changed line must trace directly to the user's request. If a line doesn't, either remove it or justify it in the PR description.
- Do NOT opportunistically clean up pre-existing dead code, reformat unrelated files, or refactor "while you're there." Scope creep dilutes the diff's signal and burns the reviewer's attention — the scarce resource in AI-assisted workflows.
- The ONLY cleanup permitted is removing orphans YOUR edits just created: an unused import after deleting a call site, a now-unreachable branch after changing a condition, a variable that's no longer read.
- If you notice a genuine bug or code smell outside the current task's scope, flag it to the user and wait for authorization rather than silently fixing it.
- This rule takes precedence over "leave the code better than you found it." Boy-scout cleanups belong in their own commits and their own PRs.

## Verification Before Completion (Iron Law)

**IRON LAW: NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE.**

- NEVER claim a task is complete without running proof commands (tests, lint, build)
- Show actual output of verification commands — do not summarize or assume results
- If verification reveals failures, fix them before claiming completion
- Stale evidence (from a previous iteration) is not valid — re-run after every change
- Prefer the built-in **`/verify`** skill: it builds and drives the actual app rather than
  settling for tests or a typecheck. Passing tests are evidence the tests pass, not evidence
  the change works.

**This law is mechanically enforced.** The `TaskCompleted` hook
(`hooks/verify-before-task-complete.sh`) exits 2 — which *blocks* the completion — if the
test suite fails while source files are changed. It is not advisory. Do not attempt to
route around it; if the failure is genuinely unrelated, say so explicitly and set
`CLAUDE_SKIP_VERIFY_GATE=1` deliberately.

Rationalization table — none of these excuses satisfy the Iron Law:

| Excuse | Reality |
|--------|---------|
| "The change is trivial" | Trivial changes break builds. Run the command. |
| "Tests passed last iteration" | Stale evidence is not evidence. Re-run. |
| "The typecheck is green" | A typecheck is not a behavior check. Drive the code path. |
| "It's obviously correct" | Then proving it costs one command. Run it. |
| "That failure is pre-existing" | Prove it on *this* tree, or fix it. Assertion is not proof. |

## Security-Specific Test Files
- For features involving auth, authorization, or data protection, create dedicated security test files
- Naming: `*_security_test.*` or `*security*.test.*` (match project conventions)
- Cover: auth bypass, privilege escalation, input sanitization, rate limiting, session management
- Pattern: FrankMega maintains 5 dedicated security test files alongside standard tests

## Iron Law Enforcement
- An Iron Law is non-negotiable — it cannot be overridden by convenience or time pressure
- Two Iron Laws exist:
  1. **Verification before completion** — stated above; enforced with the built-in `/verify`
  2. **No fixes without root-cause investigation first** — see the `systematic-debugging` skill
- Iron Laws live in this rules file, not only in a skill: a rule is always in context, whereas
  a skill loads only when invoked. The law must bind even when the skill never fires.
- quality-guardian must enforce both Iron Laws during quality gates
- Iron Laws include rationalization prevention tables to counter common excuses
