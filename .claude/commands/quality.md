---
description: "Run comprehensive quality checks"
---

Use the Task tool to spawn a quality-guardian agent with model: "sonnet" to run all available quality checks.

## Quality Checks

### 1. Linting
Detect and run available linters:
- **JavaScript/TypeScript**: `npm run lint` or `npx eslint .`
- **Python**: `ruff check .` or `pylint`
- **Rust**: `cargo clippy`
- **Go**: `go vet ./...` or `golangci-lint run`

### 2. Type Checking
Run type validation:
- **TypeScript**: `npm run typecheck` or `npx tsc --noEmit`
- **Python**: `mypy .`
- **Rust**: `cargo check`
- **Go**: Built into compilation

### 3. Formatting
Check code formatting:
- **JavaScript/TypeScript**: `npx prettier --check .`
- **Python**: `black --check .`
- **Rust**: `cargo fmt --check`
- **Go**: `gofmt -l .`

### 4. Tests
Run test suite:
- **JavaScript/TypeScript**: `npm test`
- **Python**: `pytest`
- **Rust**: `cargo test`
- **Go**: `go test ./...`

### 5. Complexity Metrics
Check code complexity:
- Functions > 50 lines
- Files > 500 lines
- Cyclomatic complexity > 10

## Report Format

```
QUALITY REPORT
==============
Linting:     [PASS/FAIL] - [issues found]
Types:       [PASS/FAIL] - [errors]
Formatting:  [PASS/FAIL] - [files to format]
Tests:       [PASS/FAIL] - [passed/failed/skipped]
Complexity:  [PASS/WARN] - [violations]

Overall:     [PASS/FAIL]
```
