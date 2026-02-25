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

1. **Hardcoded Secrets Scan**
   - Search for patterns: `API_KEY`, `PASSWORD`, `SECRET`, `TOKEN`, `PRIVATE_KEY`
   - Check `.env` files are properly gitignored
   - Look for base64 encoded secrets

2. **SQL Injection Vulnerabilities**
   - Review database query builders for parameterized queries
   - Check for string concatenation in SQL statements
   - Identify raw query usage without sanitization

3. **XSS Risk Assessment**
   - Review template rendering for unescaped user input
   - Check for `dangerouslySetInnerHTML` or equivalent
   - Identify missing output encoding

4. **Authentication/Authorization**
   - Review auth middleware implementation
   - Check for proper session management
   - Verify role-based access controls

5. **Dependency Vulnerabilities**
   - Analyze package.json / pyproject.toml / Cargo.toml
   - Check for known vulnerable versions
   - Identify outdated dependencies

## Output Format

Report findings with severity levels:
- **CRITICAL**: Immediate action required
- **HIGH**: Address before deployment
- **MEDIUM**: Schedule for remediation
- **LOW**: Track for future improvement
