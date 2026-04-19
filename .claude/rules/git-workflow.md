# Git Workflow

## Commit Message Format
```
<type>: <description>

<body (optional)>

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

## Commit Types
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `test`: Adding tests
- `docs`: Documentation updates
- `style`: Code formatting
- `perf`: Performance improvements

## Branch Naming
- Features: `feature/descriptive-name`
- Fixes: `fix/issue-description`
- Refactoring: `refactor/component-name`

## Staging and Committing
- Stage relevant changes by name (prefer specific files over `git add .`)
- Only commit when user explicitly requests it
- Ask user about co-authoring preference before committing
- Use `git -C <directory>` instead of `cd <directory> && git` to avoid zoxide conflicts
