export const meta = {
  name: 'speckit-workflow',
  description: 'Execute the spec-kit task list: phase-ordered TDD, [P] tasks in parallel, every task adversarially verified by agents that did not write it',
  whenToUse: 'After /speckit.tasks has produced tasks.md. An alternative to the /speckit.implement command, for when the task list is large enough that a single conversation would lose the thread.',
  phases: [
    { title: 'Load', detail: 'parse tasks.md / spec.md / plan.md into a phase-ordered task graph' },
    { title: 'Implement', detail: 'TDD per task — [P] tasks concurrently, the rest sequentially' },
    { title: 'Verify', detail: 'three independent lenses try to REFUTE each task' },
    { title: 'Report', detail: 'coverage mapping; update tasks.md once, at the end' },
  ],
}

// ---------------------------------------------------------------------------
// Why this is a workflow and not a prompt:
//
//   1. Phase order is a DEPENDENCY CHAIN (spec-kit: Phase N+1 is blocked by
//      Phase N). A script guarantees the barrier. A model can talk itself into
//      skipping ahead.
//   2. The implementer must not grade its own homework. Each task is verified by
//      agents that did not write it, through three distinct lenses. That is the
//      Verification Iron Law made structural instead of advisory.
//   3. tasks.md is written ONCE, at the end, by a single agent. Letting parallel
//      implementers each tick their own checkbox would race on the same file.
//
// What this deliberately does NOT do: ask the user anything. A workflow cannot
// take mid-run input, so every human gate in the spec-kit pipeline (clarify,
// review, checklist sign-off) stays OUTSIDE it. Run those first.
// ---------------------------------------------------------------------------

const TASKS_SCHEMA = {
  type: 'object',
  required: ['featureDir', 'projectRoot', 'phases'],
  properties: {
    featureDir: { type: 'string' },
    projectRoot: {
      type: 'string',
      description:
        'Absolute path to the repo that OWNS this feature — the directory containing .specify/. Every agent must run commands here. It is NOT necessarily the session cwd.',
    },
    testCommand: { type: 'string', description: 'command that runs the full suite; empty if none detected' },
    phases: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'tasks'],
        properties: {
          name: { type: 'string' },
          tasks: {
            type: 'array',
            items: {
              type: 'object',
              required: ['id', 'description', 'parallel'],
              properties: {
                id: { type: 'string', description: 'e.g. T001' },
                description: { type: 'string' },
                parallel: { type: 'boolean', description: 'true when the task carries a [P] marker' },
                files: { type: 'array', items: { type: 'string' } },
                requirement: { type: 'string', description: 'the [FR-NNN] or [US#] tag, if present' },
                done: { type: 'boolean', description: 'true when already marked [x]' },
              },
            },
          },
        },
      },
    },
  },
}

const IMPL_SCHEMA = {
  type: 'object',
  required: ['id', 'succeeded', 'summary'],
  properties: {
    id: { type: 'string' },
    succeeded: { type: 'boolean' },
    summary: { type: 'string' },
    testFile: { type: 'string' },
    testName: { type: 'string' },
    filesChanged: { type: 'array', items: { type: 'string' } },
    redConfirmed: { type: 'boolean', description: 'the test was observed FAILING before the implementation existed' },
    greenConfirmed: { type: 'boolean', description: 'the test was observed PASSING afterwards' },
  },
}

const VERDICT_SCHEMA = {
  type: 'object',
  required: ['refuted', 'reason'],
  properties: {
    refuted: { type: 'boolean', description: 'true when this task should NOT be accepted as complete' },
    reason: { type: 'string' },
    evidence: { type: 'string', description: 'the command output or code that supports the verdict' },
  },
}

const GATE_SCHEMA = {
  type: 'object',
  required: ['passed', 'summary'],
  properties: {
    passed: { type: 'boolean' },
    summary: { type: 'string' },
    failures: { type: 'array', items: { type: 'string' } },
  },
}

// Three distinct lenses. Redundant verifiers find the same thing; diverse ones
// catch failure modes the others are blind to.
const LENSES = [
  {
    key: 'test-integrity',
    ask: `Did the implementer WEAKEN THE TEST to make it pass? Read the test file and its
git history for this change. Refute if: the assertion was loosened, the test was
made tautological, an assertion was deleted, the test was skipped/xfailed, or the
test does not actually exercise the behavior the task describes. A test that passes
because it asserts nothing is the single most common way an agent fakes completion.`,
  },
  {
    key: 'requirement',
    ask: `Does the implementation satisfy THE REQUIREMENT, or only the one test that was
written for it? Read the requirement from spec.md. Refute if the code satisfies the
literal test while missing the stated behavior, or if it special-cases the test's
inputs rather than implementing the general rule.`,
  },
  {
    key: 'regression',
    ask: `Run the FULL test suite yourself. Refute if anything outside this task's own test
is now failing, or if the suite cannot run. Do not take the implementer's word for
it — the implementer reporting green is a claim, not evidence.`,
  },
]

// A FUNCTION DECLARATION, not `const keyOf = ...`. The _key stamp runs right after the loader's null
// guard — above this line — and a `const` is in its temporal dead zone until its declaration executes,
// so a const arrow throws `ReferenceError: Cannot access 'keyOf' before initialization` on EVERY path,
// including the clean run. A function declaration hoists and the trap evaporates. Measured.
function keyOf(pi, ti) {
  return `${pi}:${ti}`
}

// Every spawn in this file goes through here. The call below is the ONE unwrapped invocation of the
// harness-injected spawn primitive in the whole file, and tests/smoke.sh enforces that by counting
// occurrences — so this comment deliberately avoids naming that primitive followed by a paren, which
// would trip the guard against correct code. Reword prose like this; never loosen the guard.
//
// A THROW means the agent finished without calling StructuredOutput. That is cheap to re-ask, so retry
// — bounded at 3 attempts, because unbounded retry against a hot API is the very failure this exists to
// survive.
//
// A NULL means the harness ALREADY exhausted its own backoff against a terminal API error. Retrying
// that pours load onto an API that is refusing us. Only the throw is retried; the null passes straight
// through to the caller.
//
// `e?.message` and `opts?.label`, never `e.message` / `opts.label`: a thrown null or undefined makes the
// ERROR HANDLER ITSELF throw a TypeError, which escapes and kills the sequential run — the exact
// scenario this function exists to prevent. Measured. The harness's throw *type* is undocumented, so
// reachability is unknown and the hedge costs two characters.
async function agentTyped(prompt, opts, tries = 2) {
  for (let i = 0; ; i++) {
    try {
      return await agent(prompt, opts)
    } catch (e) {
      const why = e?.message ?? String(e)
      if (i >= tries) {
        log(`${opts?.label}: gave up after ${tries + 1} attempts — ${why}`)
        return null
      }
      log(`${opts?.label}: retry ${i + 1}/${tries} — ${why}`)
    }
  }
}

// Both halt sites and the final return share this, so "how much actually got done?" is answerable on
// every exit. It was unanswerable exactly when it mattered most: the halts carried no `total` at all.
//
// Identity is POSITIONAL (`_key`), never `task.id`. tasks.md is parsed by a model and nothing validates
// that ids are unique across phases, so keying on id lets a duplicate T001 in a later phase count as
// "attempted" because an earlier T001 ran — and notAttempted silently under-reports. The ledger would
// lie, inside the helper written to stop the ledger lying. This file already refuses to trust the
// model-written [P] marker (see the batching below) and re-derives safety from file lists; ids earn
// exactly the same distrust.
//
// `pending` READS the stamp rather than recomputing it. Deriving `_key` twice means the two derivations
// agree only while both index the unfiltered p.tasks — transpose either to filter-then-map and a task
// reindexes and reappears in notAttempted despite having run.
function ledger(results, ctx) {
  const attempted = new Set(results.map(r => r.task._key))
  const pending = ctx.phases.flatMap(p => p.tasks).filter(t => !t.done)
  return {
    total: pending.length,
    accepted: results.filter(r => r.accepted).map(r => r.task.id),
    rejected: results
      .filter(r => !r.accepted)
      .map(r => ({ id: r.task.id, description: r.task.description, reason: r.reason })),
    notAttempted: pending.filter(t => !attempted.has(t._key)).map(t => t.id),
  }
}

function implPrompt(task, ctx) {
  return `Implement exactly one spec-kit task with a strict TDD cycle. Do not touch any other task.

TASK ${task.id}: ${task.description}
${task.requirement ? `Requirement: ${task.requirement}` : ''}
${task.files?.length ? `Target files: ${task.files.join(', ')}` : ''}
Feature directory: ${ctx.featureDir}
PROJECT ROOT: ${ctx.projectRoot}
  Run every command from PROJECT ROOT and resolve every relative path against it. It is NOT
  necessarily your shell's starting directory — cd there first.

Read ${ctx.featureDir}/spec.md and ${ctx.featureDir}/plan.md for the requirement and the
design decisions. Follow .claude/rules/code-quality.md (functions <50 lines, files <500,
complexity <10).

The cycle, in this order:
 1. RED   — write a test that asserts this task's acceptance criteria. Run it. It MUST
            fail, and fail for the RIGHT reason (not an import error or a typo). If it
            passes already, the test is not testing new behavior — rewrite it.
 2. GREEN — write the minimum code to make it pass. Run the test again.
 3. SUITE — run the full test suite. No regressions. If something else broke, fix the
            IMPLEMENTATION. Never edit another test to make it pass.

Hard rules:
 - Touch ONLY the files this task needs. Other tasks are running in parallel on other files.
 - Do NOT edit tasks.md. Checkboxes are updated once, at the end, by another agent.
 - Do NOT weaken, skip, or delete any test to get to green. You will be checked by agents
   that did not write this code, and one of them reads the test diff specifically for that.

Report redConfirmed/greenConfirmed based on output you actually observed, not intent.`
}

function verifyPrompt(task, impl, lens, ctx) {
  return `You are verifying a spec-kit task that ANOTHER agent implemented. Your job is to
REFUTE it. Default to refuted=true when uncertain — a task wrongly accepted ships a bug;
a task wrongly refuted costs one more round.

TASK ${task.id}: ${task.description}
${task.requirement ? `Requirement: ${task.requirement}` : ''}
Feature directory: ${ctx.featureDir}
PROJECT ROOT: ${ctx.projectRoot}  (cd here — it is NOT necessarily your starting directory)

The implementer claims:
  ${impl.summary}
  test: ${impl.testFile || '(none reported)'} :: ${impl.testName || '(none reported)'}
  files changed: ${(impl.filesChanged || []).join(', ') || '(none reported)'}
  red confirmed: ${impl.redConfirmed} | green confirmed: ${impl.greenConfirmed}

YOUR LENS — ${lens.key}:
${lens.ask}

Verify against the actual repository, not the claim above. Run commands. Read the diff.`
}

// ---------------------------------------------------------------------------

phase('Load')

// args may arrive as a bare path string, as {featureDir}, or as a JSON-ENCODED string of
// that object — the last case is easy to miss and silently passes the whole blob through as
// if it were a path. Normalize all three.
let _args = args
if (typeof _args === 'string') {
  const t = _args.trim()
  if (t.startsWith('{')) {
    try {
      _args = JSON.parse(t)
    } catch {
      /* not JSON — treat the string as the path itself */
    }
  }
}
const requestedDir =
  typeof _args === 'string' ? _args : (_args && _args.featureDir) || ''

const ctx = await agentTyped(
  `Load the spec-kit artifacts for the current feature.

${
  requestedDir
    ? `The feature directory is: ${requestedDir}
Use it exactly as given. It may be an absolute path — read and write there, not in the cwd.`
    : `Find the feature directory: .specify/specs/<current-git-branch>/. If it does not exist,
look under .specify/specs/ for the only feature directory present.`
}

Read tasks.md and parse it into the phase-ordered structure. The format is:

    ## Phase 1: Setup
    - [ ] T001 [US1] description \`path/to/file\`
    - [ ] T004 [P] [FR-002] description \`path/to/file\`

  - \`[P]\` marks a task that is safe to run in PARALLEL with its neighbours.
  - \`[FR-NNN]\` / \`[US#]\` is the requirement tag.
  - The backticked path is the target file.
  - \`- [x]\` means already done — set done:true so it is skipped.
  - Phases are a dependency chain: Phase N+1 must not start until Phase N is complete.

Resolve projectRoot: the directory that CONTAINS .specify/ (i.e. the feature dir with
/.specify/specs/<name> stripped off). Return it as an absolute path. This is the repo the
feature belongs to and it may NOT be the session's working directory — every later agent
runs its commands there.

Detect the command that runs the full test suite by looking in projectRoot (package.json
scripts.test, pytest, cargo test, go test ./...). Return "" if there is none.

Report tasks in the order they appear. Do not invent, reorder, or merge tasks.`,
  { schema: TASKS_SCHEMA, label: 'load-artifacts' },
)

if (!ctx || !ctx.phases || ctx.phases.length === 0) {
  return { error: 'No tasks.md found, or it contains no tasks. Run /speckit.tasks first.' }
}

// AFTER the guard above, never before it. Stamping first means a dead loader throws
// `TypeError: Cannot read properties of null (reading 'phases')` instead of returning the clean error —
// breaking the one null path that was already handled correctly. Measured.
ctx.phases.forEach((p, pi) => p.tasks.forEach((t, ti) => { t._key = keyOf(pi, ti) }))

const pending = ctx.phases.flatMap(p => p.tasks.filter(t => !t.done))
log(`${ctx.featureDir}: ${pending.length} pending task(s) across ${ctx.phases.length} phase(s)`)
if (!ctx.testCommand) {
  log('WARNING: no test command detected. TDD cycles cannot be mechanically confirmed.')
}

async function implementAndVerify(task) {
  const impl = await agentTyped(implPrompt(task, ctx), {
    label: `impl:${task.id}`,
    phase: 'Implement',
    schema: IMPL_SCHEMA,
  })
  if (!impl) return { task, accepted: false, reason: 'implementer died or was skipped' }
  if (!impl.succeeded) return { task, impl, accepted: false, reason: impl.summary }

  const verdicts = (
    await parallel(
      LENSES.map(lens => () =>
        agentTyped(verifyPrompt(task, impl, lens, ctx), {
          label: `verify:${task.id}:${lens.key}`,
          phase: 'Verify',
          schema: VERDICT_SCHEMA,
        }).then(v => (v ? { ...v, lens: lens.key } : null)),
      ),
    )
  ).filter(Boolean)

  // ANY lens refuting blocks the task. This is not a majority vote: the lenses look at
  // different things, so a single one finding a weakened test is decisive on its own.
  const refutations = verdicts.filter(v => v.refuted)
  return {
    task,
    impl,
    verdicts,
    accepted: refutations.length === 0 && verdicts.length > 0,
    reason: refutations.map(r => `[${r.lens}] ${r.reason}`).join(' | '),
  }
}

const results = []

for (const ph of ctx.phases) {
  const todo = ph.tasks.filter(t => !t.done)
  if (todo.length === 0) continue

  phase('Implement')
  const par = todo.filter(t => t.parallel)
  const seq = todo.filter(t => !t.parallel)

  // Do NOT trust [P] to mean "safe to run together". The marker is written by a model and
  // nothing enforces it: two [P] tasks in the same phase can name the SAME file, and running
  // those concurrently means two agents editing one file and clobbering each other. So batch
  // [P] tasks greedily by actual file disjointness. A task that declares no files is treated
  // as conflicting with everything, because we cannot prove it is safe.
  const batches = []
  for (const t of par) {
    const files = t.files && t.files.length ? t.files : null
    const fit = files
      ? batches.find(b => files.every(f => !b.claimed.has(f)))
      : null
    if (fit) {
      files.forEach(f => fit.claimed.add(f))
      fit.tasks.push(t)
    } else {
      batches.push({ claimed: new Set(files || []), tasks: [t] })
    }
  }
  const conflicts = par.length - batches.length
  log(
    `${ph.name}: ${par.length} [P] in ${batches.length} conflict-free batch(es)` +
      (conflicts > 0 ? ` (${conflicts} share files — serialized)` : '') +
      `, ${seq.length} sequential`,
  )

  const phaseResults = []
  for (const b of batches) {
    // Do NOT .filter(Boolean) this. parallel() converts a thrown implementer to null, and filtering it
    // ERASES the task: it lands in neither accepted nor rejected, the halt below cannot see it, and the
    // run returns 1/1 — a PERFECT SCORE for a phase where the task never ran. Measured.
    //
    // Map the null to an explicit rejection instead. Index-mapped, so the null still knows which task it
    // was. Belt-and-braces with agentTyped (which should stop throws escaping at all) because
    // parallel()'s throw->null contract is the harness's, not ours.
    const done = await parallel(b.tasks.map(t => () => implementAndVerify(t)))
    done.forEach((r, i) =>
      phaseResults.push(r || { task: b.tasks[i], accepted: false, reason: 'implementer crashed (unhandled error)' }),
    )
  }

  // Everything else is ordered within the phase — run one at a time.
  for (const t of seq) phaseResults.push(await implementAndVerify(t))

  results.push(...phaseResults)

  const rejected = phaseResults.filter(r => !r.accepted)
  if (rejected.length > 0) {
    log(`HALTED in ${ph.name}: ${rejected.length} task(s) failed verification`)
    return {
      halted: true,
      haltedAt: ph.name,
      reason: 'Tasks failed adversarial verification. Later phases depend on this one, so continuing would build on unverified work.',
      ...ledger(results, ctx),
    }
  }

  // Phase gate — the whole suite, between phases, exactly as speckit.implement requires.
  const gate = await agentTyped(
    `Run the quality gate for the project at ${ctx.projectRoot} and report honestly.

FIRST: cd ${ctx.projectRoot}. That is the repo under test. It is NOT necessarily your shell's
starting directory, and running these commands anywhere else tells you nothing.

  1. Full test suite${ctx.testCommand ? ` (\`${ctx.testCommand}\`)` : ''} — must be green.
  2. Lint / format / typecheck, whichever that project configures.

Show real command output. Do not fix anything; only report.
"passed" means you SAW the suite pass. If the project configures no gate at all, that is an
ABSENCE of a gate, not a failure — report passed:true and say so in the summary, because
halting the run over a project that never had tests would be a false alarm.`,
    { label: `gate:${ph.name}`, phase: 'Implement', schema: GATE_SCHEMA },
  )

  // `!gate ||`, not `gate &&`. A null gate — the agent died, or exhausted its retries — used to fall
  // straight through this check, so the phase silently skipped its gate and the next phase built on
  // unconfirmed work. Measured: both gates dead => {"completed":2,"total":2}, six gate invocations,
  // zero confirmations, a clean bill of health for a run where nothing was ever verified. That is the
  // same silent drop as the batch collector above, reintroduced one function away BY the fix for it —
  // which is why routing the gate through agentTyped and this line are one change, never two.
  //
  // ABSENCE OF CONFIRMATION IS NOT CONFIRMATION.
  //
  // Note the asymmetry with the prompt's own rule below: a project that CONFIGURES no gate is an
  // absence of a gate and correctly reports passed:true — an OBJECT. A gate agent that DIED is null.
  // Those are structurally different values and cannot be confused, so this check cannot punish a
  // legitimately gateless project. Verified.
  if (!gate || !gate.passed) {
    log(`Phase gate ${gate ? 'FAILED' : 'DIED'} after ${ph.name}`)
    return {
      halted: true,
      haltedAt: ph.name,
      reason: gate
        ? `Phase quality gate failed: ${gate.summary}`
        : 'Phase gate agent died — the suite was never confirmed. Refusing to build the next phase on it.',
      failures: gate?.failures || [],
      ...ledger(results, ctx),
    }
  }
}

phase('Report')

const accepted = results.filter(r => r.accepted)

// tasks.md is written exactly once, by one agent, after everything is verified.
// Parallel implementers ticking their own boxes would race on this file.
//
// The result was once DISCARDED. When this agent died, no checkbox was ticked and the run still
// returned {"completed":3,"total":3} — a green run whose only persisted artifact never happened, and
// whose next invocation re-implements every task from scratch. Measured.
//
// `=== null`, not `!ticked`: this call has no schema, so its return type is unspecified and a
// legitimate empty-string answer would false-positive. agentTyped returns null and only null on failure.
const ticked = await agentTyped(
  `Mark these spec-kit tasks complete in ${ctx.featureDir}/tasks.md by changing "- [ ]" to
"- [x]" for exactly these task IDs, and nothing else:

${accepted.map(r => `  ${r.task.id} — ${r.task.description}`).join('\n')}

Do not alter any other line. Do not reword tasks. Do not tick a task not in this list.`,
  { label: 'update-tasks-md', phase: 'Report' },
)

if (ticked === null) {
  // Distinguish "the work failed" from "the bookkeeping failed". Everything IS implemented and
  // adversarially verified; only the write died. An operator who reads this as an ordinary halt
  // re-runs work that is already on disk.
  log('tasks.md was NOT updated — the write agent died')
  return {
    halted: true,
    haltedAt: 'Report',
    reason:
      'All tasks were implemented and verified, but the tasks.md update agent died — the checkboxes were ' +
      'NOT written. The work is complete and on disk; do not re-run the implementation. Tick the accepted ' +
      'task ids by hand, or re-run this step alone.',
    ...ledger(results, ctx),
  }
}

const report = await agentTyped(
  `Write the IMPLEMENTATION REPORT for this spec-kit run.

Verified complete (${accepted.length}):
${accepted.map(r => `  ${r.task.id} [${r.task.requirement || '-'}] ${r.task.description}`).join('\n')}

Work from PROJECT ROOT ${ctx.projectRoot} (cd there first).

Read ${ctx.featureDir}/spec.md and produce the coverage mapping in this exact shape:

    IMPLEMENTATION REPORT
    =====================
    Tasks completed: X/Y
    Tests written:   N
    Quality checks:  PASS
    Files modified:  N

    Coverage mapping:
    FR-001 -> T001, T002 -> PASS
    SC-001 -> verified via T001

    Constitution compliance: <assessed against .specify/memory/constitution.md>

State plainly any requirement in spec.md that NO task covers. An uncovered requirement is
the failure this report exists to surface — do not paper over it.`,
  { label: 'completion-report', phase: 'Report' },
)

return {
  featureDir: ctx.featureDir,
  completed: accepted.length,
  tasks: results.map(r => ({ id: r.task.id, accepted: r.accepted, reason: r.reason || undefined })),
  report,
  // The same ledger every halt site reports, so a clean run and a halted one are read the same way.
  // Additive: `accepted`/`rejected`/`notAttempted` are new on this path. `total` is unchanged in value —
  // on a clean run the graph-derived pending count equals the old `results.length`, because `results`
  // accumulates exactly the not-done tasks of each phase and empty phases are skipped.
  ...ledger(results, ctx),
}
