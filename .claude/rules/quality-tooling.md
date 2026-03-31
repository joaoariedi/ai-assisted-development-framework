# Quality Tooling by Language

## Tool Detection
- Use Glob to find config files: `**/.eslintrc*`, `**/pyproject.toml`, `**/biome.json`, etc.
- Check `package.json` scripts section for available commands
- Look for common patterns: `lint`, `test`, `typecheck`, `format`
- Ask user for commands if not obvious

## Universal (Language-Agnostic)
- **Secrets detection**: `gitleaks detect` (pre-commit), `trufflehog filesystem .` (with live credential verification)
- **SAST**: `semgrep scan` — pattern-based static analysis across 30+ languages, runs in milliseconds
- **SBOM generation**: `syft .` (CycloneDX/SPDX), then `grype <sbom>` for vulnerability matching
- **All-in-one scanning**: `trivy fs .` — combines SCA, secrets, IaC, and SBOM in one tool
- Config files: `.gitleaks.toml`, `.semgrep.yml`, `.trivyignore`

## JavaScript/TypeScript
- Config files: `package.json`, `.eslintrc*`, `tsconfig.json`, `biome.json`
- Lint: `npm run lint` or `npx biome check .` (Biome: ~35x faster than ESLint+Prettier)
- Type check: `npm run typecheck`
- Format: `npm run format` or `npx biome format .`
- Test: `npm test`
- Security: `npm audit`, Snyk for deeper SCA
- Tools: ESLint, Prettier, Jest, Vitest — or **Biome** as unified lint+format replacement
- **Biome vs ESLint**: Prefer Biome for speed; use ESLint when plugin ecosystem needed (React hooks, specialized security rules)

## Python
- Config files: `pyproject.toml`, `requirements.txt`, `setup.py`
- Lint: `ruff check .` (replaces Flake8, isort, Bandit via `S` rules, pyupgrade)
- Type check: `mypy .` (deep analysis) or `pyright .` (faster, better IDE integration)
- Format: `ruff format .` (Black-compatible, 10-100x faster)
- Security: `ruff check --select S .` (Bandit rules) or `bandit -r .` for standalone
- Test: `pytest`
- Virtual environment detection

## Rust
- Config files: `Cargo.toml`, `Cargo.lock`
- Lint: `cargo clippy`
- Format: `cargo fmt`
- Security: `cargo audit`
- Test: `cargo test`
- Check workspace configuration

## Go
- Config files: `go.mod`, `go.sum`, `Makefile`
- Lint: `golangci-lint run` (preferred, orchestrates 50+ linters including staticcheck, errcheck, revive)
- Format: `go fmt ./...`
- Security: `gosec ./...` (AST-based SAST), `govulncheck ./...` (reachability-based SCA — only flags vulnerabilities in actually-called code)
- Dead code: `deadcode ./...` (traces call graph from main), `ineffassign ./...`
- Test: `go test -race ./...`
- Check module structure and build tools

## Java
- Config files: `pom.xml` (Maven), `build.gradle`/`build.gradle.kts` (Gradle)
- Lint: Checkstyle (style), PMD (code smells, dead code), SpotBugs (bytecode analysis)
- Format: `mvn spotless:apply` or `./gradlew spotlessApply` (fast, pre-commit friendly)
- Type safety: Error Prone (compile-time bug catching, zero overhead)
- Security: SpotBugs + FindSecBugs plugin, SonarQube
- Test: `mvn test` or `./gradlew test`
- **Note**: JVM startup makes full builds too slow for pre-commit; use Spotless for hooks, full suite in CI

## Other Languages
- Examine project files to understand toolchain
- Ask user for specific quality commands if unclear
- Adapt patterns to match existing project structure

## Tiered Validation Strategy

### Tier 1: Pre-commit (<5 seconds)
Block obvious mistakes before they reach the repository:
- Universal: `gitleaks detect --staged` for secrets
- Python: `ruff check`, `ruff format --check`
- Go: `gofmt`, `goimports`
- JS/TS: `biome check` or `eslint` + `prettier`
- Java: `spotlessApply`
- Rust: `cargo fmt --check`

### Tier 2: Pull Request (CI)
Deep semantic analysis on every PR:
- Python: `mypy`/`pyright`, `bandit`, `semgrep`
- Go: `golangci-lint` (full suite), `govulncheck`
- JS/TS: full ESLint suite, `npm audit`, Snyk
- Java: PMD, Checkstyle, SpotBugs
- Universal: `semgrep scan`, `trivy fs .`

### Tier 3: Release (Compliance)
Artifact integrity and supply chain verification:
- SBOM: `syft` for generation, `grype` for vulnerability matching
- Container: `trivy image <image>`
- Signing: Sigstore for artifact provenance
- Monitoring: Dependency-Track or SonarQube for continuous tracking

## Structured Hook Alternatives

### Lefthook (Recommended for Teams)
- Declarative YAML configuration (`lefthook.yml`) vs imperative bash scripts
- Parallel execution of independent checks at pre-commit
- `{staged_files}` variable for incremental, staged-files-only linting
- Glob filtering: only lint files matching `*.rb`, `*.py`, etc.
- Install: `npm install lefthook --save-dev` or `brew install lefthook`
- Example:
  ```yaml
  pre-commit:
    parallel: true
    commands:
      lint:
        run: bundle exec rubocop {staged_files}
        glob: "*.rb"
      secrets:
        run: gitleaks detect --staged
  pre-push:
    commands:
      tests:
        run: bundle exec rails test
  ```

### Pre-commit vs Pre-push Separation
- **Pre-commit** (< 5 seconds): formatting, staged-file linting, secrets detection
- **Pre-push** (thorough): full test suite, comprehensive lint, dependency audit
- Rationale: fast pre-commit reduces friction; thorough pre-push catches deeper issues

### Staged-Files-Only Linting
- At pre-commit, lint ONLY staged files — not the entire project
- Prevents slow pre-commit hooks that discourage frequent commits
- Most tools support file list input: `ruff check <files>`, `eslint <files>`, `rubocop <files>`

## CI/CD Best Practices
- **`cancel-in-progress` concurrency**: Cancel redundant CI runs when new commits push to same branch
- **`fail-fast: false`** for cross-platform matrices: ensures visibility into all platform failures
- **`continue-on-error`** for dependency freshness: non-blocking `bundle outdated` / `npm outdated`
- **Screenshot artifacts on test failure**: `actions/upload-artifact` with `if: failure()` for system tests
- **Dependabot for github-actions**: not just language packages — keep CI actions up to date
- **Smart cache keys**: hash config files + lockfiles for cache invalidation (e.g., rubocop config + Gemfile.lock)
