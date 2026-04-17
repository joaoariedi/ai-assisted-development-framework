# Best Practices Analysis: AI-Assisted Development in Production Repos

> Cross-repository analysis of 4 polyglot projects by akitaonrails, focused on CI/CD, AI configuration, testing, security, and documentation patterns applicable to the AI Development Framework.

**Repositories analyzed** (2026-03-30):

| Repo | Stack | Description |
|------|-------|-------------|
| [FrankYomik](https://github.com/akitaonrails/FrankYomik) | Python + Go + Flutter | Manga/manhwa automated translator |
| [FrankSherlock](https://github.com/akitaonrails/FrankSherlock) | Rust + React/TS (Tauri v2) | AI-powered image cataloging and search |
| [FrankMD](https://github.com/akitaonrails/FrankMD) | Rails 8 + Stimulus + CodeMirror | Self-hosted markdown web editor |
| [FrankMega](https://github.com/akitaonrails/FrankMega) | Rails 8 + Stimulus | File download service for Docker home servers |

---

## 1. AI Configuration Files (CLAUDE.md / AGENTS.md)

### Summary

All four repos have substantial AI context files. The common structure across all of them prioritizes: **what to run**, **where things are**, **what patterns to follow**, and **what not to do**.

### FrankYomik (~250 lines) — Domain-First Approach

Structure: system overview → repo map → runtime flows → cache model → API surface → local dev → config → trust boundaries → security notes → versioning → debugging guide → editing guidance → job reliability.

Key patterns:
- Opens with "what the system does" and names the 3 pipelines
- **Repo map** lists every important file with a one-line purpose
- **Runtime flow narratives** walk through Kindle and Webtoon flows step by step
- **Trust boundaries section** explicitly lists hostile input surfaces (image uploads, metadata fields, websocket clients, WebView pages, cache paths)
- **Cross-cutting change maps**: "If you change cache paths, update both `server/cache.go` and `server/worker/page_cache.py`". "If you change the job payload, check `server/handlers.go`, `server/worker/consumer.py`, and `client/lib/providers/jobs_provider.dart`"
- **Security notes** document what was hardened and what still needs attention
- **Job reliability** section documents retry/recovery layers across the system

### FrankSherlock (~300 lines) — Architecture-Heavy Approach

Structure: overview → repo layout → tech stack → build/test → module table → architecture principles → coding conventions → important paths → testing → migration rules → release workflow → what NOT to change.

Key patterns:
- **Module table** with one-line purpose per Rust module
- **Architecture principles** as named constraints: read-only, incremental, move-aware, resilient, local-only, multi-OS
- **Coding conventions per language**: Rust error handling (`thiserror`, never `.unwrap()`), TS naming (camelCase matching Rust's `serde(rename_all)`)
- **Database migration rules**: never edit shipped migrations, append-only ALTERs, test fresh + existing DBs
- **Release workflow**: 3 platforms must pass, AUR auto-publish rules
- **"What NOT to change" section**: explicit guardrails like "never remove FTS5 virtual table", "keep `csp: null` in tauri.conf.json"

### FrankMD — Split CLAUDE.md + AGENTS.md

CLAUDE.md is 5 lines — just commands and critical gotchas. AGENTS.md (~200 lines) is the full contributor guide, marked "tool-agnostic" (works for Claude, Cursor, Copilot, or human contributors).

AGENTS.md structure: overview → commands → architecture (backend + frontend + tests) → do list → don't list → PR checklist.

Key patterns:
- **Do/Don't lists** are exceptionally clear and concise
- **Config pattern warning**: "Always use `Config.new.get('key')`, never read `ENV` directly"
- **Test patterns**: "Use Mocha stubs raising `Errno::EACCES`, not `chmod`"
- **PR Checklist** with concrete pass criteria (test counts, tool commands)

### FrankMega (~400 lines) — Most Comprehensive Single File

Structure: overview → commands → architecture (DB, auth, authz, storage, jobs, real-time) → coding conventions (models, controllers, routes, views, JS, tests, migrations, jobs, security) → env vars → pre-commit checklist.

Key patterns:
- **Model ordering convention**: associations → encryption → normalizations → validations → callbacks → scopes → public methods → private methods
- **Controller template**: auth config → before_actions → actions → private methods
- **Security section**: rate limiting (Rack::Attack), IP banning, headers (secure_headers), cookies, filename sanitization, Cloudflare proxying
- **"Never do" list**: expose internal IDs, allow unsafe-eval in CSP, skip CSRF, use params without strong parameters
- **9-item pre-commit checklist**: tests, rubocop, brakeman, bundler-audit, factories, controller tests, migrations, theme tokens, no hardcoded secrets

### Actionable Patterns for the Framework

1. **Cross-cutting change maps**: Template a CLAUDE.md section for "if you change X, also update Y and Z"
2. **"What NOT to change" guardrails**: Dedicated section for things AI agents should never touch
3. **Trust boundary documentation**: Explicit listing of hostile input surfaces
4. **AGENTS.md as tool-agnostic guide**: Recommend for teams using multiple AI tools
5. **Model/controller ordering conventions**: Language-specific code structure templates
6. **Pre-commit checklist in CLAUDE.md**: Concrete items AI agents can verify

---

## 2. CI/CD Actions

### FrankYomik — 2 Workflows

**ci.yml** (push/PR to master):
- `flutter-test`: checkout → flutter pub get → `flutter analyze` → `flutter test`
- `server-test`: checkout → Python venv + `pytest tests/unit/` → `go test -v .`
- Concurrency: `cancel-in-progress: true`

**release.yml** (tag push `v*` + manual dispatch):
- 4 parallel build jobs: Linux (AppImage), macOS (DMG), Windows (Inno Setup), Android (APK)
- GPG signing for Linux AppImage (optional — graceful skip if secrets missing)
- Apple codesign + notarize + staple for macOS (optional)
- Android: `fetch-depth: 0` for git-based versionCode
- `create-release` job: downloads all artifacts → creates draft GitHub Release
- Release notes loaded from `releases/vX.Y.Z.md`

### FrankSherlock — 3 Workflows

**ci.yml** (push/PR to master):
- Cross-platform matrix: `[ubuntu-22.04, macos-latest, windows-latest]`
- `fail-fast: false` — all platforms run even if one fails
- Each platform: `cargo test` → `cargo fmt --check` → `cargo clippy -- -D warnings` → `npm run build` → `npm run test`
- Linux-only: `cargo audit` (dependency vulnerability scan)
- Rust cache: `swatinem/rust-cache@v2`

**release.yml** (tag push `v*` + manual dispatch):
- Cross-platform matrix with Rust targets
- Tests run again in release pipeline
- Tauri action for building platform-specific installers
- Apple signing + notarization for macOS
- GPG signing for Linux AppImage
- Release notes from `releases/vX.Y.Z.md`
- Upload GPG signatures to release

**aur-publish.yml** (release published + manual dispatch):
- Downloads AppImage → computes SHA256
- Generates PKGBUILD dynamically
- Publishes to AUR via SSH

### FrankMD — 1 Workflow

**ci.yml** (push to master + PR):
- `scan_ruby`: `brakeman --no-pager` + `bundler-audit`
- `scan_js`: `importmap audit`
- `lint`: rubocop with smart cache (key = ruby-version + rubocop config + lockfile hash)
- No test job in CI (tests run locally via `bin/ci`)
- Dependabot for bundler + github-actions (weekly)

### FrankMega — 1 Workflow (Most Complete Rails Pipeline)

**ci.yml** (push to master + PR):
- `scan_ruby`: `brakeman --no-pager` + `bundler-audit`
- `outdated`: `bundle outdated --only-explicit` with `continue-on-error: true` (non-blocking visibility)
- `scan_js`: `importmap audit`
- `lint`: rubocop with smart cache
- `test`: `rails db:test:prepare test`
- `system-test`: `rails db:test:prepare test:system` + **screenshot artifacts on failure** (`actions/upload-artifact` with `if: failure()`)
- Dependabot for bundler + github-actions (weekly)

### Cross-Repo CI Pattern Matrix

| Pattern | Yomik | Sherlock | MD | Mega |
|---------|-------|---------|-----|------|
| Concurrency / cancel-in-progress | yes | yes | -- | -- |
| Multi-platform matrix | release only | CI + release | -- | -- |
| fail-fast: false | -- | yes | -- | -- |
| Security scanning (SAST) | -- | cargo audit | brakeman | brakeman |
| Dependency vulnerability scan | -- | cargo audit | bundler-audit | bundler-audit + outdated |
| JS dependency audit | -- | -- | importmap audit | importmap audit |
| Lint enforcement | flutter analyze | fmt + clippy -D warnings | rubocop | rubocop |
| Test in CI | pytest + go test + flutter test | cargo test + vitest | -- (local only) | minitest + system tests |
| Release signing (GPG) | yes | yes | -- | -- |
| Release signing (Apple) | yes | yes | -- | -- |
| Release notes from file | `releases/vX.Y.Z.md` | `releases/vX.Y.Z.md` | -- | -- |
| Package distribution | AppImage + DMG + MSI + APK | AppImage + DMG + MSI + AUR | -- | Docker (Kamal) |
| Dependabot | -- | -- | yes | yes |
| Artifact upload on failure | -- | -- | -- | screenshots |
| RuboCop cache optimization | -- | -- | yes | yes |
| Rust cache | -- | swatinem/rust-cache | -- | -- |

### Actionable Patterns for the Framework

1. **`cancel-in-progress` concurrency** — add to CI workflow templates
2. **`fail-fast: false`** for cross-platform matrices — ensures full visibility
3. **`continue-on-error` for outdated checks** — non-blocking dependency freshness monitoring
4. **Screenshot artifacts on system test failure** — document in CI best practices
5. **Release notes from `releases/vX.Y.Z.md`** — version-controlled release notes pattern
6. **Dependabot for github-actions ecosystem** — not just language packages
7. **Smart RuboCop cache key** — hash ruby-version + config + lockfile for cache invalidation
8. **GPG/Apple signing with graceful fallback** — skip signing when secrets not configured

---

## 3. Testing

### Test Coverage Comparison

| Repo | Frameworks | Unit Tests | Integration | System | Security-Specific |
|------|-----------|------------|-------------|--------|-------------------|
| FrankYomik | pytest + go test + flutter test | ~20 Python + Go + Flutter | 3 integration | -- | -- |
| FrankSherlock | cargo test + Vitest | 322 Rust + 299 frontend | -- | -- | -- |
| FrankMD | Minitest + Vitest | 420+ Ruby + 1370+ JS | Controllers | Capybara | -- |
| FrankMega | Minitest + FactoryBot + Shoulda + SimpleCov | Models + Jobs | Controllers | Capybara | 5 dedicated files |

### FrankYomik Testing

- Python unit tests organized in `server/tests/unit/` (19 test files covering cache, processors, translators, OCR, etc.)
- Integration tests in `server/tests/integration/` (bubble detector, full pipeline, webtoon scraper)
- Go tests alongside source (`server/handlers_test.go`)
- Flutter widget tests (`client/test/widget_test.dart`)
- CLAUDE.md documents useful test commands

### FrankSherlock Testing

- 322 Rust unit tests — every module has `#[cfg(test)] mod tests`
- 299 frontend tests (Vitest) covering components, hooks, and utilities
- Shared test fixtures in `src/__tests__/fixtures.ts`
- CI runs tests on all 3 platforms (Linux, macOS, Windows)
- Pre-commit script runs full test suite

### FrankMD Testing

- 420+ Ruby tests (controllers, models, services, system)
- 1370+ JavaScript tests (Vitest, mirrors `app/javascript/` structure)
- Test helpers with jsdom globals for browser API mocking
- Mocks for marked.js, requestjs, turbo-rails

### FrankMega Testing — Most Mature

- FactoryBot factories with traits (`:admin`, `:banned`, `:expired`, `:with_otp`)
- **5 dedicated security test files**:
  - `test/controllers/security_test.rb`
  - `test/models/ban_security_test.rb`
  - `test/models/user_security_test.rb`
  - `test/models/shared_file_security_test.rb`
  - `test/models/invitation_security_test.rb`
- SimpleCov for coverage tracking
- System tests with Capybara + screenshot preservation

### Actionable Patterns for the Framework

1. **Security-specific test files** — recommend as a testing pattern in code-quality.md
2. **Every new module must have tests** (FrankSherlock's `#[cfg(test)]` rule) — enforceable convention
3. **Factory traits for security states** (`:banned`, `:expired`) — pattern for auth-heavy apps
4. **Test fixture sharing** — centralized fixtures reduce duplication

---

## 4. Pre-commit Hooks & Local Quality Gates

### FrankSherlock — Shell Script

`scripts/pre-commit.sh`:
```bash
cargo fmt --check
cargo clippy -- -D warnings
cargo test
npx vitest run
```
Sequential execution, exits on first failure.

### FrankMega — Lefthook (Structured YAML)

`lefthook.yml`:
```yaml
pre-commit:
  parallel: true
  commands:
    rubocop:
      run: bundle exec rubocop --parallel {staged_files}
      glob: "*.rb"
    brakeman:
      run: bundle exec brakeman --no-pager --quiet
    bundle-audit:
      run: bundle exec bundler-audit check --update
pre-push:
  commands:
    tests:
      run: bundle exec rails test
```

Advantages over shell scripts:
- Parallel execution at pre-commit (faster)
- Glob filtering (only lint changed `.rb` files)
- `{staged_files}` variable for incremental checks
- Separate hooks for pre-commit (fast) vs pre-push (thorough)
- Declarative YAML vs imperative bash

### Actionable Patterns for the Framework

1. **Recommend lefthook** as a structured alternative to shell-script hooks
2. **Two-tier hook strategy**: fast checks at pre-commit, full tests at pre-push
3. **Staged-files-only linting** for speed at pre-commit
4. **Parallel hook execution** when checks are independent

---

## 5. Security Practices

### Trust Boundary Documentation (FrankYomik)

CLAUDE.md explicitly lists:
- Image uploads to `POST /api/v1/jobs`
- Metadata fields (title, chapter, page_number)
- WebSocket clients and subscription lists
- Web pages in the app WebView
- Fallback image URLs from page JS
- Anything persisted under `cache/`

Also notes the **security posture is different** for a token-gated bot vs a public web app.

### Security-First Architecture (FrankMega)

- **Rate limiting**: Rack::Attack with configurable multiplier (10x dev, 1x prod)
- **IP banning**: Ban model with auto-expiry, disabled in dev
- **Headers**: secure_headers gem (CSP, HSTS, X-Frame-Options)
- **Cookies**: Secure, HttpOnly, SameSite=Lax
- **Filename sanitization**: strips control chars, Windows-unsafe chars, reserved names, truncates to 255 bytes
- **Encrypted fields**: ActiveRecord Encryption for `otp_secret`
- **Cloudflare proxying**: manually configured trusted proxy IPs

### Security Scanning in CI

| Tool | Type | Repos Using |
|------|------|-------------|
| brakeman | Rails SAST | FrankMD, FrankMega |
| bundler-audit | Ruby dependency CVE scan | FrankMD, FrankMega |
| cargo audit | Rust dependency CVE scan | FrankSherlock |
| importmap audit | JS dependency scan | FrankMD, FrankMega |
| flutter analyze | Dart static analysis | FrankYomik |
| cargo clippy -D warnings | Rust lint (warnings = errors) | FrankSherlock |

### Actionable Patterns for the Framework

1. **Trust boundary section** in CLAUDE.md template — list hostile input surfaces per project
2. **Security posture statement** — acknowledge what kind of app it is (public web, internal tool, etc.)
3. **Security scanning as separate CI job** (not bundled with tests) — clearer failure signals
4. **Security-specific test files** — dedicated `*_security_test` files for auth, input validation, rate limiting

---

## 6. Documentation & Project Organization

### Release Notes Pattern (FrankYomik, FrankSherlock)

Both repos use `releases/vX.Y.Z.md` files loaded by CI:
```bash
TAG="${GITHUB_REF_NAME}"
NOTES_FILE="releases/${TAG}.md"
if [ -f "$NOTES_FILE" ]; then
  BODY=$(cat "$NOTES_FILE")
else
  BODY="Release ${TAG}"
fi
```

Benefits:
- Release notes are version-controlled and reviewable in PRs
- CI appends install instructions automatically
- Fallback to tag name if no notes file exists

### Research Documentation (FrankSherlock)

Uses `_`-prefixed directories for research that informed the final design:
- `_classification/` — Python classification PoC
- `_research_ab_test/` — A/B benchmark scripts with docs, ground truth, and results
- `_face_ab_test/` — Face detection/embedding benchmarks

Each research dir has its own README, requirements, and structured docs (BENCHMARK_CONFIG.json, GROUND_TRUTH.json, RESULTS.md).

### IDEA.md Pattern (FrankSherlock, FrankMega)

`docs/IDEA.md` files document the original concept and design rationale. FrankSherlock also has `IDEA2.md` for evolved thinking. These serve as architectural decision context.

### Actionable Patterns for the Framework

1. **`releases/` directory pattern** — standardize version-controlled release notes
2. **`_`-prefixed research directories** — convention for exploratory work that shouldn't ship
3. **IDEA.md** — lightweight ADR alternative for documenting design rationale

---

## 7. Containerization & Deployment

### FrankYomik — Multi-Container with Variants

- `Dockerfile.api` — Go API server
- `Dockerfile.worker` — Python worker (CUDA)
- `Dockerfile.worker-rocm` — Python worker (AMD ROCm variant)
- `docker-compose.yml` — standard deployment
- `docker-compose.prod.yml` — production overrides
- `docker-compose.rocm.yml` — AMD GPU variant
- `scripts/deploy.sh`, `scripts/push-images.sh` — deployment automation

### FrankMega — Kamal Deployment

- `.kamal/` directory with hook samples (pre-deploy, post-deploy, etc.)
- `config/deploy.yml` — Kamal deployment config
- `docker-compose.yml` — local development
- `bin/docker-entrypoint` — container entrypoint

### FrankMD — Docker with Desktop Wrapper

- `docker-compose.yml` — service definition
- `config/fed/fed.sh` — shell function for Docker-based desktop usage
- `install.sh` — installation script

---

## 8. Dependency Management

| Pattern | Yomik | Sherlock | MD | Mega |
|---------|-------|---------|-----|------|
| Lockfile committed | go.sum + pubspec.lock | Cargo.lock + package-lock.json | Gemfile.lock | Gemfile.lock |
| Dependabot | -- | -- | weekly (bundler + actions) | weekly (bundler + actions) |
| `bundle outdated` in CI | -- | -- | -- | yes (non-blocking) |
| `cargo audit` in CI | -- | yes | -- | -- |
| `bundler-audit` in CI | -- | -- | yes | yes |
| `.python-version` | -- | yes | -- | -- |
| `.ruby-version` | -- | -- | yes | yes |

---

## 9. Recommended Enhancements for the AI Development Framework

### High Priority (clear gaps)

| Enhancement | Source Repo | Where to Apply |
|---|---|---|
| Add "Cross-cutting change maps" section to CLAUDE.md template | FrankYomik | CLAUDE.md template / docs |
| Add "What NOT to change" guardrails section to CLAUDE.md template | FrankSherlock | CLAUDE.md template / docs |
| Add "Trust boundaries" section to CLAUDE.md template | FrankYomik | CLAUDE.md template / docs |
| Recommend lefthook as structured pre-commit alternative | FrankMega | quality-tooling.md |
| Document security-specific test files pattern | FrankMega | code-quality.md |
| Add Dependabot for `github-actions` ecosystem | FrankMD, FrankMega | pipeline-security.md |
| Add `cancel-in-progress` concurrency to CI templates | FrankYomik, FrankSherlock | agent-workflow.md / CI docs |

### Medium Priority (nice to have)

| Enhancement | Source Repo | Where to Apply |
|---|---|---|
| Recommend AGENTS.md for tool-agnostic contributor guides | FrankMD | CLAUDE.md docs |
| Document `releases/vX.Y.Z.md` pattern for release notes | FrankYomik, FrankSherlock | git-workflow.md |
| Add `continue-on-error` outdated check to CI tier | FrankMega | quality-tooling.md Tier 2 |
| Document screenshot artifacts on test failure | FrankMega | quality-tooling.md / CI docs |
| Add model/controller ordering conventions per language | FrankMega | code-quality.md |
| Document `_`-prefixed research directory convention | FrankSherlock | context-management.md |
| Add pre-commit (fast) vs pre-push (thorough) hook strategy | FrankMega | quality-tooling.md Tier 1 |

### Low Priority (niche but valuable)

| Enhancement | Source Repo | Where to Apply |
|---|---|---|
| GPG/Apple signing with graceful fallback in release CI | FrankYomik, FrankSherlock | pipeline-security.md |
| AUR auto-publish pattern | FrankSherlock | pipeline-security.md |
| Smart RuboCop cache key strategy | FrankMD, FrankMega | quality-tooling.md Ruby section |
| Git-based versionCode for Android | FrankYomik | Reference only |
| `fail-fast: false` for cross-platform CI | FrankSherlock | CI template docs |

---

## Appendix: Raw CLAUDE.md Content

The full content of each repository's CLAUDE.md and AGENTS.md is preserved in the analysis session (2026-03-30) and can be re-fetched via:

```bash
gh api repos/akitaonrails/FrankYomik/contents/CLAUDE.md --jq '.content' | base64 -d
gh api repos/akitaonrails/FrankSherlock/contents/CLAUDE.md --jq '.content' | base64 -d
gh api repos/akitaonrails/FrankMD/contents/CLAUDE.md --jq '.content' | base64 -d
gh api repos/akitaonrails/FrankMD/contents/AGENTS.md --jq '.content' | base64 -d
gh api repos/akitaonrails/FrankMega/contents/CLAUDE.md --jq '.content' | base64 -d
```
