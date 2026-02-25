---
name: "Performance Audit"
description: |
  Use when analyzing performance bottlenecks or
  optimizing critical code paths. Read-only analysis
  with optional benchmarking via Bash.
allowed-tools: Read, Grep, Glob, Bash
---

# Performance Audit Skill

Analyze codebase for performance issues and optimization opportunities.

## Analysis Steps

1. **N+1 Query Detection**
   - Search for loops containing database calls
   - Identify missing eager loading patterns
   - Check for batch vs single-record operations

2. **Blocking Operations**
   - Find synchronous I/O in async contexts
   - Identify missing concurrency patterns
   - Check for sequential operations that could parallelize

3. **Memory Leak Patterns**
   - Look for unbounded caches or collections
   - Identify missing cleanup in event listeners
   - Check for circular references preventing GC

4. **Caching Analysis**
   - Review existing cache implementations
   - Identify cache-worthy operations (expensive, repeated)
   - Check cache invalidation strategies

5. **Algorithm Complexity**
   - Review nested loops for O(n²) patterns
   - Check for unnecessary repeated computations
   - Identify opportunities for memoization

## Benchmark Commands

```bash
# Node.js profiling
node --prof app.js && node --prof-process isolate-*.log

# Python profiling
python -m cProfile -s cumulative script.py

# Go benchmarks
go test -bench=. -benchmem ./...

# Rust benchmarks
cargo bench
```

## Output Format

Report findings with impact assessment:
- **Critical**: >100ms latency impact
- **High**: 10-100ms latency impact
- **Medium**: Measurable but < 10ms
- **Low**: Micro-optimization opportunity
