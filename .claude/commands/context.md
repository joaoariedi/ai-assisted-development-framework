---
description: "Refresh project context analysis"
---

Perform a comprehensive project context analysis using the `context-analysis` skill methodology plus the live data below.

## Live Project Data

### Recent commits
!`$HOME/.claude/hooks/speckit-helper.sh recent-commits`

### Active branch
!`$HOME/.claude/hooks/speckit-helper.sh branch`

### Directory structure (top 2 levels)
!`$HOME/.claude/hooks/speckit-helper.sh project-files`

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
