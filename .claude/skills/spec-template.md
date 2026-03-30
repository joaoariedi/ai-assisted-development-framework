---
name: "spec-template"
description: |
  Generates structured acceptance criteria and test scenarios from a
  feature description. Use when you need to formalize requirements
  before implementation. Auto-invoked by spec-driven workflow.
user-invocable: false
disable-model-invocation: true
allowed-tools: Read, Grep, Glob
---

# Spec Template Generator

Generate structured specs for the requested feature.

## Context Gathering

1. **Identify affected code**
   - Find relevant source files using Grep/Glob
   - Read current implementation to understand existing behavior
   - Identify interfaces, types, and contracts involved

2. **Identify existing tests**
   - Find related test files
   - Understand test patterns and conventions used
   - Note test utilities and helpers available

## Spec Output Format

For each behavior, generate:

```
## Spec: <short description>

**Given** <precondition/initial state>
**When** <action/trigger>
**Then** <expected outcome/assertion>

### Test Scenario
- Happy path: <description>
- Edge case: <description>
- Error case: <description>

### Affected Files
- Source: <file_path>
- Test: <test_file_path>
```

## Categorization

Group specs by:
- **Must have**: Core functionality required by the feature
- **Should have**: Important but not blocking
- **Edge cases**: Boundary conditions and error handling

## Rules
- Specs must be testable (no vague criteria like "should be fast")
- Each spec maps to exactly one behavior
- Include negative cases (what should NOT happen)
- Reference existing code patterns for consistency
