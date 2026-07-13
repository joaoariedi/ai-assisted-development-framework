---
description: "Refresh project context analysis"
---

Perform a comprehensive project context analysis, combining the methodology below with the live data.

## Analysis Steps

1. **Tech Stack Detection** — check for `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `Gemfile`. Identify the framework (React, Vue, Django, FastAPI, Actix, Gin, Rails) and build tools (Webpack, Vite, Poetry, Cargo, Make).
2. **Architecture Pattern** — read the directory structure for a pattern (MVC, hexagonal, clean architecture); identify service boundaries in monorepos.
3. **Test Framework** — find `tests/`, `__tests__/`, `spec/`; identify the runner (Jest, pytest, cargo test, go test) and coverage configuration.
4. **Quality Tooling** — find linter configs (`.eslintrc*`, `ruff.toml`, `clippy.toml`), formatters (Prettier, Black, rustfmt, gofmt), and type checkers (TypeScript, mypy).
5. **Dependencies** — separate direct from transitive; identify core libraries and their purpose; check for monorepo tooling (Nx, Turborepo, Lerna).

For deep or repository-wide search, delegate to the built-in `Explore` agent rather than reading files inline — it keeps this command's context small.

## Live Project Data

### Recent commits
!`${CLAUDE_PLUGIN_ROOT}/.claude/hooks/speckit-helper.sh recent-commits`

### Active branch
!`${CLAUDE_PLUGIN_ROOT}/.claude/hooks/speckit-helper.sh branch`

### Directory structure (top 2 levels)
!`${CLAUDE_PLUGIN_ROOT}/.claude/hooks/speckit-helper.sh project-files`

## Output Format

```
PROJECT CONTEXT
===============
Tech Stack: [languages, frameworks, versions]
Architecture: [pattern identified]
Testing: [framework, test command]
Quality Tools: [linters, formatters, type checkers with commands]
Build/Dev: [build system, dev server, CI/CD]
Key Dependencies: [list with purposes]
Entry Points: [main files/scripts]
Recent Activity: [active branches, recent changes]
Recommendations: [approach for upcoming work]
```
