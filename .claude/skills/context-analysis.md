---
name: "Context Analysis"
description: |
  Use PROACTIVELY when exploring new codebases or
  gathering project context before implementation.
  Read-only discovery and analysis.
allowed-tools: Read, Grep, Glob
---

# Context Analysis Skill

Generate comprehensive project context for development tasks.

## Analysis Steps

1. **Tech Stack Detection**
   - Check for: `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `Gemfile`
   - Identify framework: React, Vue, Django, FastAPI, Actix, Gin, Rails
   - Detect build tools: Webpack, Vite, Poetry, Cargo, Make

2. **Architecture Pattern Identification**
   - Analyze directory structure for patterns (MVC, hexagonal, clean arch)
   - Identify service boundaries in monorepos
   - Map component relationships

3. **Test Framework Discovery**
   - Find test directories: `tests/`, `__tests__/`, `spec/`
   - Identify test runners: Jest, pytest, cargo test, go test
   - Analyze test coverage configuration

4. **Quality Tool Detection**
   - Find linter configs: `.eslintrc*`, `ruff.toml`, `clippy.toml`
   - Check formatters: Prettier, Black, rustfmt, gofmt
   - Identify type checkers: TypeScript, mypy, rust-analyzer

5. **Dependency Analysis**
   - Map direct vs transitive dependencies
   - Identify core libraries and their purposes
   - Check for monorepo tooling (Nx, Turborepo, Lerna)

## Output Format

Generate structured context report:
```
PROJECT CONTEXT
===============
Tech Stack: [languages, frameworks]
Architecture: [pattern identified]
Testing: [framework, coverage %]
Quality Tools: [linters, formatters]
Key Dependencies: [list with purposes]
Entry Points: [main files/scripts]
```
