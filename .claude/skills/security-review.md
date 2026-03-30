---
name: "Security Review"
description: |
  Use when performing security audits, vulnerability scans,
  or reviewing code for security issues. Read-only analysis.
  Use PROACTIVELY when reviewing PRs or before merging code.
allowed-tools: Read, Grep, Glob, WebSearch
---

# Security Review Skill

Perform comprehensive security analysis on the codebase:

## Analysis Steps

1. **Secrets Detection**
   - Search for patterns: `API_KEY`, `PASSWORD`, `SECRET`, `TOKEN`, `PRIVATE_KEY`
   - Check `.env` files are properly gitignored
   - Look for base64 encoded secrets and high-entropy strings
   - **Tool recommendation**: `gitleaks detect` for automated scanning (150+ secret types, SARIF output)
   - **Tool recommendation**: `trufflehog` for live credential verification (confirms if detected keys are active)
   - Once a secret is committed, consider it compromised — rotation required

2. **Static Application Security Testing (SAST)**
   - Run `semgrep scan --config auto` for cross-language pattern-based analysis (30+ languages, millisecond speed)
   - Semgrep understands code semantics without requiring a full build
   - Custom YAML rules can enforce internal security policies across all languages

3. **SQL Injection Vulnerabilities**
   - Review database query builders for parameterized queries
   - Check for string concatenation in SQL statements (Go: gosec G201, Python: bandit/ruff S rules)
   - Identify raw query usage without sanitization

4. **XSS Risk Assessment**
   - Review template rendering for unescaped user input
   - Check for `dangerouslySetInnerHTML` or equivalent
   - Identify missing output encoding

5. **Authentication/Authorization**
   - Review auth middleware implementation
   - Check for proper session management
   - Verify role-based access controls

6. **Supply Chain & Dependency Vulnerabilities**
   - **Language-specific SCA tools**:
     - Go: `govulncheck ./...` — reachability-based analysis (only flags vulnerabilities in actually-called code, reduces noise)
     - JS/TS: `npm audit` for built-in checks, Snyk for deeper analysis
     - Python: `pip-audit` or `safety check`
     - Rust: `cargo audit`
     - Java: OWASP Dependency-Check or Snyk
   - **SBOM generation** (for release/compliance): `syft .` generates CycloneDX/SPDX inventory, `grype` matches against vulnerability DBs
   - **All-in-one alternative**: `trivy fs .` combines SCA, secrets, IaC scanning in one tool
   - Prefer reachability analysis over raw CVE lists — focus on exploitable vulnerabilities

## Output Format

Report findings with severity levels:
- **CRITICAL**: Immediate action required (active secrets, exploitable RCE, reachable CVE with public exploit)
- **HIGH**: Address before deployment (SQL injection, auth bypass, reachable dependency vulnerabilities)
- **MEDIUM**: Schedule for remediation (XSS, missing input validation, non-reachable but high-severity CVEs)
- **LOW**: Track for future improvement (informational findings, code quality security smells)
