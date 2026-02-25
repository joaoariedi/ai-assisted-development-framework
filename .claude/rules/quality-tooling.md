# Quality Tooling by Language

## Tool Detection
- Use Glob to find config files: `**/.eslintrc*`, `**/pyproject.toml`, etc.
- Check `package.json` scripts section for available commands
- Look for common patterns: `lint`, `test`, `typecheck`, `format`
- Ask user for commands if not obvious

## JavaScript/TypeScript
- Config files: `package.json`, `.eslintrc*`, `tsconfig.json`
- Lint: `npm run lint`
- Type check: `npm run typecheck`
- Format: `npm run format`
- Test: `npm test`
- Tools: Prettier, ESLint, Jest, Vitest

## Python
- Config files: `pyproject.toml`, `requirements.txt`, `setup.py`
- Lint: `ruff check .`
- Type check: `mypy .`
- Format: `ruff format .` or `black .`
- Test: `pytest`
- Virtual environment detection

## Rust
- Config files: `Cargo.toml`, `Cargo.lock`
- Lint: `cargo clippy`
- Format: `cargo fmt`
- Test: `cargo test`
- Check workspace configuration

## Go
- Config files: `go.mod`, `go.sum`, `Makefile`
- Lint: `go vet ./...`
- Format: `go fmt ./...`
- Test: `go test ./...`
- Check module structure and build tools

## Other Languages
- Examine project files to understand toolchain
- Ask user for specific quality commands if unclear
- Adapt patterns to match existing project structure
