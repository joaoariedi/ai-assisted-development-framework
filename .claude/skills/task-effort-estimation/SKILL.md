---
name: "Task Effort Estimation"
description: |
  Use when estimating the effort, complexity, or risk of a proposed code change
  or an existing diff ("how big is this?", "how long will this take?", "size this
  ticket"). Computes a deterministic Contribution Complexity score from
  version-control metadata, then flags AI-native risk. Read-only analysis.
allowed-tools: Read, Grep, Glob, Bash
---

# Task Effort Estimation Skill

Size a code change using deterministic properties of the codebase delta rather than
gut feel or SLOC-as-a-proxy-for-keyboard-time.

**The premise this skill is built on:** in AI-assisted workflows the bottleneck has moved
from construction to *verification*. 84.3% of frequent AI users report that AI did **not**
reduce time spent on code review — they simply conduct more reviews to verify generated
output. Estimating "how long to write this" is therefore the wrong question. Estimate
**how much integration and verification burden this change imposes**.

## The Bimodal Trap (read this first)

Effort in AI-assisted work is **not** monotonic in apparent complexity:

- Up to **78%** of *high*-complexity, well-specified, isolated features are resolved by an
  LLM in **under 25%** of expected human effort.
- About **22%** of *low*-complexity tasks that require **non-local context** demand **over
  180%** of anticipated effort — from integration friction, subtle hallucinations, and
  compounding validation cycles.

So the dangerous change is the one that *looks* trivial but reaches across boundaries.
A small diff in a high-coupling or high-volatility file is the single most under-estimated
shape of work, and Step 5 exists specifically to catch it. Never report a low complexity
score without running that check.

## Mode Selection

| Mode | When | How the delta is obtained |
|---|---|---|
| **Actual** | A diff exists (working tree, branch, PR) | Measured directly from git. Fully deterministic. |
| **Projected** | Task not yet implemented | You must *project* the delta first: identify the files, then estimate lines added/removed, hunks, and methods touched per file. Everything downstream is deterministic; the uncertainty lives entirely in the projection. |

In **Projected** mode, scope the change with Grep/Glob/Read *before* estimating, and state
your projected per-file numbers explicitly so the reader can challenge them. An estimate
built on an unstated projection is not reviewable.

## Step 1 — Compute Contribution Complexity (Pfeiffer's algorithm)

This is the deterministic core. Write the script below to the scratchpad and run it.
It requires only `git` and `awk`.

```bash
#!/usr/bin/env bash
# Pfeiffer Contribution Complexity (c_contrib) — deterministic, zero-dependency.
# Usage: cc.sh [<git-range>]   e.g. "main...HEAD", "HEAD~3..HEAD", or omit for working tree.
set -uo pipefail
RANGE="${1:-}"

sl() {  # line-modification thresholds -> 1..5
  local l=$1
  if   [ "$l" -le 15 ]; then echo 1
  elif [ "$l" -le 30 ]; then echo 2
  elif [ "$l" -le 60 ]; then echo 3
  elif [ "$l" -le 90 ]; then echo 4
  else echo 5; fi
}
sc() {  # count thresholds (hunks, methods) -> 1..5
  local n=$1
  if   [ "$n" -le 2 ]; then echo 1
  elif [ "$n" -le 5 ]; then echo 2
  elif [ "$n" -le 7 ]; then echo 3
  elif [ "$n" -le 9 ]; then echo 4
  else echo 5; fi
}
sam() { # aggregate-modification scale boundaries -> 1..5
  awk -v n="$1" 'BEGIN{
    if      (n <= 195)  print 1
    else if (n <= 390)  print 2
    else if (n <= 781)  print 3
    else if (n <= 1562) print 4
    else                print 5 }'
}

declare -A HIST=([1]=0 [2]=0 [3]=0 [4]=0 [5]=0)
n_files=0; n_lines=0
printf "%-52s %5s %5s %5s %5s  %s\n" FILE ADD DEL HUNK METH LEVEL

while IFS=$'\t' read -r add del path; do
  if [ "$add" = "-" ]; then continue; fi          # binary file: no line metrics
  hunks=$(git diff -U0 $RANGE -- "$path" | grep -c '^@@')
  meths=$(git diff -U0 $RANGE -- "$path" | grep '^@@' \
          | sed 's/^@@[^@]*@@//' | sed 's/^[[:space:]]*//' \
          | grep -v '^$' | sort -u | wc -l)
  s1=$(sl "$add"); s2=$(sl "$del"); s3=$(sc "$hunks"); s4=$(sc "$meths")
  lvl=$(awk -v a="$s1" -v b="$s2" -v c="$s3" -v d="$s4" \
        'BEGIN{ m=(a+b+c+d)/4; v=int(m+0.5); if (v<1) v=1; print v }')
  HIST[$lvl]=$(( HIST[$lvl] + 1 ))
  n_files=$(( n_files + 1 ))
  n_lines=$(( n_lines + add + del ))
  printf "%-52s %5s %5s %5s %5s  %s\n" "$path" "$add" "$del" "$hunks" "$meths" "$lvl"
done < <(git diff --numstat --no-renames $RANGE)   # --no-renames: keep real paths; git's
                                                  # "{old => new}" rename form is not a
                                                  # resolvable path and would zero the
                                                  # hunk/method lookups below.

if [ "$n_files" -eq 0 ]; then echo "No text-file changes in range."; exit 0; fi

# Exponential aggregation: weights i^i = 1, 4, 27, 256, 3125
c_mod_all=$(awk -v h1="${HIST[1]}" -v h2="${HIST[2]}" -v h3="${HIST[3]}" \
                -v h4="${HIST[4]}" -v h5="${HIST[5]}" \
  'BEGIN{ printf "%.2f", (1*h1 + 4*h2 + 27*h3 + 256*h4 + 3125*h5) / 5 }')

n_mk=$(git diff --name-status $RANGE | cut -c1 | sort -u | grep -c .)   # A/D/R/C/M cardinality
if [ "$n_mk" -gt 5 ]; then n_mk=5; fi
lpf=$(awk -v l="$n_lines" -v f="$n_files" 'BEGIN{ printf "%d", int(l/f + 0.5) }')

c_f=$(sl "$n_files"); c_lf=$(sl "$lpf"); c_am=$(sam "$c_mod_all")
c_contrib=$(awk -v a="$c_f" -v b="$c_lf" -v c="$n_mk" -v d="$c_am" \
  'BEGIN{ printf "%.2f", (a+b+c+d)/4 }')
label=$(awk -v s="$c_contrib" 'BEGIN{
  v=int(s+0.5); split("low moderate medium elevated high", L, " "); print L[v] }')

cat <<EOF

Histogram of per-file levels : 1=${HIST[1]}  2=${HIST[2]}  3=${HIST[3]}  4=${HIST[4]}  5=${HIST[5]}
c_mod_all (exponential agg)  : $c_mod_all      -> c_∀m  = $c_am
n_files=$n_files             -> c_|f| = $c_f
lines/file=$lpf              -> c_l/f = $c_lf
change kinds=$n_mk           -> c_mk  = $n_mk
-----------------------------------------------
CONTRIBUTION COMPLEXITY      : $c_contrib  ($label)
EOF
```

### The scoring tables (for Projected mode, or to verify by hand)

**Line-modification thresholds** — apply to lines added (`cl+`) and lines removed (`cl-`),
and to the file count and lines-per-file terms of the final formula:

| Score | Label | Condition |
|---|---|---|
| 1 | low | `0 <= l <= 15` |
| 2 | moderate | `15 < l <= 30` |
| 3 | medium | `30 < l <= 60` |
| 4 | elevated | `60 < l <= 90` |
| 5 | high | `l > 90` |

**Count thresholds** — apply to modified hunks (`ch`) and modified methods (`cmth`):

| Score | Label | Condition |
|---|---|---|
| 1 | low | `0 <= n <= 2` |
| 2 | moderate | `2 < n <= 5` |
| 3 | medium | `5 < n <= 7` |
| 4 | elevated | `7 < n <= 9` |
| 5 | high | `n > 9` |

**Per-file complexity:** `c_mod(m) = mean(cl+, cl-, ch, cmth)`

**Aggregate** with exponential weights `i^i` over the histogram of per-file levels
(1→1, 2→4, 3→27, 4→256, 5→3125): `c_mod_all = (1/5) · Σ i^i · j`.
The exponential weighting is the point — one level-5 file (3125) outweighs a hundred
level-1 files (100). Complex modifications scale integration burden non-linearly.

**Aggregate scale boundaries** (`c_∀m`): `≤195`→1, `≤390`→2, `≤781`→3, `≤1562`→4, `>1562`→5

**Final:** `c_contrib = mean( c_|f|(n_files), c_l/f(n_lines/n_files), c_mk, c_∀m(c_mod_all) )`
where `c_mk` is the cardinality of distinct change kinds (added / deleted / renamed /
copied / modified), mapped directly to 1–5. Round to the nearest integer for the label.

> Two faithfulness notes on the source algorithm. It specifies that the *file count* and
> *lines-per-file* terms reuse the **line** thresholds — so 15 files scores 1. That is what
> the source says; it is reproduced rather than "corrected." The source also does not state
> how fractional `c_mod(m)` values are binned into the histogram; this skill rounds
> half-up. Both choices are implementation decisions, not findings — say so if a reader
> leans hard on a borderline score.

## Step 2 — Test burden (deterministic)

**Cyclomatic Complexity Number is a direct, deterministic proxy for the minimum number of
test cases needed for branch coverage.** Each linearly independent path is one scenario
that must be validated.

```bash
command -v lizard >/dev/null 2>&1 && lizard <changed-paths> || echo "lizard unavailable — estimate CCN by reading control flow"
```

Report cumulative CCN across the changed functions as **the floor on test count**, not a
target.

## Step 3 — Edge-case density

**92%** of catastrophic production failures come from incorrect handling of non-fatal
errors that the software explicitly signalled — and **~77%** of those failures are
reproducible by a standard unit test. Happy-path code is what LLMs generate well; error
paths are what they skip.

Grep the changed files for exception handlers, boundary checks, and null-safety assertions.
High density means high-risk area: scale the verification estimate up, and say which error
paths need tests.

## Step 4 — Volatility hotspots

Files with high change frequency are architecturally unstable; an AI edit there carries
elevated regression probability, so even a trivial line change demands a real regression
safety net.

```bash
# Preferred, if git-extras is installed:
command -v git-effort >/dev/null 2>&1 && git effort -- <paths>

# Zero-dependency fallback — commit count per changed file:
git log --format= --name-only -- <paths> | sort | uniq -c | sort -rn | head -20
```

Flag any changed file with **> 100 commits** as a hotspot.

## Step 5 — The Non-Local Context Check (never skip)

This is where the 180%-overrun cases are caught. Assess coupling for the changed files:

- **Coupling Between Objects (CBO)** — count unique imports, external type references,
  parameter types, base classes, and direct instantiations. High CBO across a service
  boundary means changes propagate non-locally.
- **Cross-service reach** — does the change touch more than one deployable unit, a shared
  schema, or a serialized contract?

Then apply the rule:

| Pfeiffer score | Coupling / hotspot | Verdict |
|---|---|---|
| Low–moderate | Low | Genuinely cheap. AI does this well. |
| **Low–moderate** | **High** | **DANGER — the 22% case.** Effort is dominated by integration and regression, not by the diff. Estimate *up*, loudly. |
| High | Low | Often *cheaper* than it looks — the 78% case. Well-specified isolated work is where AI wins. |
| High | High | Expensive and honest about it. Decompose before starting. |

The diagonal is what matters: **a small diff with high coupling is more expensive than a
large diff with none.** If you report a low score without stating the coupling, the
estimate is not trustworthy.

## Step 6 — Synthesis

Optional enhancers, when present:

- `scc` — Unique/Logical Lines of Code (discounts boilerplate, blank, and generated lines),
  plus **LOCOMO** generation-cost modelling.
- **Epoch** MCP server — PERT, COCOMO II (AI-adjusted), Monte Carlo, reference-class
  forecasting against a bundled database of 126,223 real-world task data points. Its
  `ai_native` correction defaults to on (a 100 person-month COCOMO II estimate becomes
  ~9 person-months).

## Output Format

```
TASK EFFORT ESTIMATE
====================
Mode:            Actual <range> | Projected (assumptions stated below)
Scope:           N files, +A/-D lines, K change kinds

Contribution Complexity:  c_contrib = X.XX  (label)
  per-file histogram:     1:_ 2:_ 3:_ 4:_ 5:_
  driven by:              <which term dominated, e.g. "one level-5 file at weight 3125">

Test floor (CCN):         N test cases minimum for branch coverage
Edge-case density:        <low|medium|high> — <which error paths are unguarded>
Volatility hotspots:      <files with >100 commits, or "none">
Coupling / non-local:     <low|high> — <which boundaries are crossed>

NON-LOCAL CONTEXT CHECK:  <SAFE | DANGER — small diff, high coupling (the 22% case)>

Effort band:              <calibrated band, or "UNCALIBRATED — see below">
Dominant cost:            <construction | verification | integration>
Confidence:               <high|medium|low> + what would raise it
```

## Calibration — and the rule against inventing hours

**The source model does not define a mapping from `c_contrib` to hours, and neither does
this skill.** Three quantities are named but never given values in the research:
`f(Complexity)` in LOCOMO, tokens-per-second, average review rate, and the automation
ratio α. Do not fabricate them, and do not launder a guess into false precision by
reporting "roughly 6.5 hours" when nothing in the pipeline produces a unit of time.

What is legitimate:

1. **Report the deterministic score and the risk flags.** These stand on their own and are
   the actual product of this skill.
2. **If `.claude/effort-calibration.json` exists**, use it. It maps observed `c_contrib`
   values to actual recorded durations for *this* project. Report a band from it and name
   the sample size.
3. **If it does not exist**, say `UNCALIBRATED` and give a three-point (PERT) judgement
   clearly labelled as judgement, not measurement. Then log the actual once known —
   calibration is the only honest path from a complexity score to a duration, and it is
   exactly what Epoch's self-improvement engine does when it recalibrates in `~/.epoch/`.

Traditional activity metrics do not capture AI-assisted productivity: a study of 26,317
commits across 703 repositories found **no statistically significant change** in
commit-based activity after Copilot adoption, even as developers reported feeling faster.
Estimate the verification burden. That is where the work actually went.
