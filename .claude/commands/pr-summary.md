---
description: "Generate PR summary from current branch"
---

Generate a comprehensive pull request summary from the data below.

## Live Branch Data

### Commits on this branch
!`~/.claude/hooks/speckit-helper.sh pr-commits`

### Files changed
!`~/.claude/hooks/speckit-helper.sh pr-files`

### Diff stats
!`~/.claude/hooks/speckit-helper.sh pr-stats`

## Output Format

```markdown
## Summary
[1-3 bullet points describing the change]

## Changes
- feat: [feature description]
- fix: [fix description]

## Files Changed
- `path/to/file` - [change description]

## Breaking Changes
- [None / list of breaking changes]

## Test Plan
- [ ] [Test scenario 1]
- [ ] [Test scenario 2]

Generated with Claude Code
```
