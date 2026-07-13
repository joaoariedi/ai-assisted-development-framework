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

const ctx = await agent(
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

const pending = ctx.phases.flatMap(p => p.tasks.filter(t => !t.done))
log(`${ctx.featureDir}: ${pending.length} pending task(s) across ${ctx.phases.length} phase(s)`)
if (!ctx.testCommand) {
  log('WARNING: no test command detected. TDD cycles cannot be mechanically confirmed.')
}

async function implementAndVerify(task) {
  const impl = await agent(implPrompt(task, ctx), {
    label: `impl:${task.id}`,
    phase: 'Implement',
    schema: IMPL_SCHEMA,
  })
  if (!impl) return { task, accepted: false, reason: 'implementer died or was skipped' }
  if (!impl.succeeded) return { task, impl, accepted: false, reason: impl.summary }

  const verdicts = (
    await parallel(
      LENSES.map(lens => () =>
        agent(verifyPrompt(task, impl, lens, ctx), {
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
    const done = (await parallel(b.tasks.map(t => () => implementAndVerify(t)))).filter(Boolean)
    phaseResults.push(...done)
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
      rejected: rejected.map(r => ({ id: r.task.id, description: r.task.description, reason: r.reason })),
      accepted: results.filter(r => r.accepted).map(r => r.task.id),
    }
  }

  // Phase gate — the whole suite, between phases, exactly as speckit.implement requires.
  const gate = await agent(
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

  if (gate && !gate.passed) {
    log(`Phase gate FAILED after ${ph.name}`)
    return {
      halted: true,
      haltedAt: ph.name,
      reason: `Phase quality gate failed: ${gate.summary}`,
      failures: gate.failures || [],
      accepted: results.filter(r => r.accepted).map(r => r.task.id),
    }
  }
}

phase('Report')

const accepted = results.filter(r => r.accepted)

// tasks.md is written exactly once, by one agent, after everything is verified.
// Parallel implementers ticking their own boxes would race on this file.
await agent(
  `Mark these spec-kit tasks complete in ${ctx.featureDir}/tasks.md by changing "- [ ]" to
"- [x]" for exactly these task IDs, and nothing else:

${accepted.map(r => `  ${r.task.id} — ${r.task.description}`).join('\n')}

Do not alter any other line. Do not reword tasks. Do not tick a task not in this list.`,
  { label: 'update-tasks-md', phase: 'Report' },
)

const report = await agent(
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
  total: results.length,
  tasks: results.map(r => ({ id: r.task.id, accepted: r.accepted, reason: r.reason || undefined })),
  report,
}
