---
description: "Quick security scan of current changes"
---

Perform a quick security review of the current changes using the `security-review` skill methodology.

## Scope
Focus on staged and unstaged changes:
1. Run `git diff --staged` and `git diff` to identify changed files
2. Apply the security-review skill checklist to those changes only

## Checklist
- [ ] No hardcoded secrets, API keys, or passwords in code
- [ ] No sensitive data in committed files
- [ ] SQL queries use parameterized statements
- [ ] User input is validated and output is encoded
- [ ] Auth/authz patterns follow existing project conventions
- [ ] New dependencies checked for known vulnerabilities

## Report Format
- **CRITICAL**: Block merge immediately
- **HIGH**: Require remediation before merge
- **MEDIUM**: Document and track
- **LOW**: Note for future improvement

Note: For full incident response, threat hunting, or forensic investigation, use the `forensic-specialist` agent instead.
