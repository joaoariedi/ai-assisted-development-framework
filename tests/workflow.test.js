// Behaviour tests for workflows/speckit-workflow.js.
//
// Run: node --test tests/
// No package.json, no npm install, no lockfile. `node --test` is built into node >=18, and
// ubuntu-latest ships node — so this stays inside constitution principle 4, which forbids the
// INSTALL STEP, not the runtime.
//
// ---------------------------------------------------------------------------------------------
// WHY THIS FILE LOADS THE WORKFLOW BY TEXT REWRITE
//
// speckit-workflow.js is executed by the Claude Code Workflow harness, which requires a script
// exporting `meta` and injects agent/parallel/phase/log/args as GLOBALS. It cannot be imported:
// there is nothing to import from, and its top-level `return` statements (at the "no tasks" guard,
// the halt sites, and the final return) are illegal in an ES module but legal in a function body.
// That is exactly why wrapping it in `new Function` works, and it is the only way to drive the
// SHIPPED file rather than a copy of its logic.
//
// A copy would be worse than nothing. This repo's constitution (principle 3) records why: an
// end-to-end assertion on helper DATA once went green against a completely broken plugin, because
// when the helper was permission-blocked the model just ran plain `git log` and produced identical
// output. Test the artifact that ships, and assert at the tool-call level.
//
// ---------------------------------------------------------------------------------------------
// KNOWN FIDELITY LIMITS — stated, not implied:
//
//  1. THE LOADER IS STUBBED. Nothing here tests that a real model parses tasks.md correctly. These
//     tests prove the script CONSUMES a parsed task graph correctly; detection is untested.
//  2. THE STUBS ARE OUR IMITATION of the real harness. A comment cannot detect drift. The defence
//     is `bothParallelContracts` below: run resilience tests against BOTH plausible parallel()
//     contracts, so "which one is real?" stops mattering. Only a live SMOKE_LIVE probe could
//     confirm the real one, and it cannot run in CI.
//  3. THE HARNESS'S THROW TYPE IS NOT PINNED. We pin parallel()'s contract (quoted below) and not
//     the type of value a failing schema'd agent throws — which is exactly the gap that let
//     `throw null` kill a run through `e.message`. `e?.message ?? String(e)` is the hedge.
// ---------------------------------------------------------------------------------------------

import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const WF_PATH = path.join(REPO, 'workflows', 'speckit-workflow.js')

// --- the loader ------------------------------------------------------------------------------

/**
 * Wrap workflow source so it can be driven with stub globals.
 *
 * ONE makeRun, used by BOTH the real load and the strict-mode fixture. Two wrappers would mean the
 * `'use strict'` mutation has two sites: the test would prove the TEST's wrapper is strict while the
 * real load silently lost it and stayed green. (SC-007)
 *
 * `'use strict'` is load-bearing. A `new Function` body is SLOPPY by default, but the shipped file is
 * an ES module and therefore always strict. Without this line the harness runs different semantics
 * from production: an assignment to an undeclared identifier — an ordinary typo — passes green here
 * and throws ReferenceError on the first real run. (FR-008)
 */
export function makeRun(src) {
  return new Function(
    'agent', 'parallel', 'phase', 'log', 'args',
    `'use strict'; return (async () => {\n${src}\n})()`,
  )
}

/** Read the shipped workflow and rewrite its export so `new Function` will accept it. */
export function loadWorkflowSource() {
  const raw = fs.readFileSync(WF_PATH, 'utf8')
  const src = raw.replace('export const meta', 'const meta')
  // If this rewrite ever matches nothing, the harness would test a stale shape — or nothing at all.
  // `new Function` also throws on an unreplaced `export`, so this fails loudly twice over. (SC-006)
  assert.notStrictEqual(src, raw, 'the `export const meta` rewrite matched nothing — speckit-workflow.js changed shape and this harness would be testing a stale assumption')
  return src
}

// --- pinned harness contract -----------------------------------------------------------------

// PINNED from the Workflow tool contract, quoted verbatim 2026-07-16 (Claude Code, Opus 4.8):
//   "parallel(items, ...): run tasks concurrently. ... A thunk that throws (or whose agent errors)
//    resolves to `null` in the result array — the call itself never rejects"
// Re-check this at every Claude Code upgrade. It is the reason :320's `.filter(Boolean)` silently
// DELETED a crashed task instead of crashing, and the reason the fix is an index-mapped fallback.
export const parallelThrowToNull = async ts =>
  Promise.all(ts.map(async t => { try { return await t() } catch { return null } }))

// The contract we do NOT believe is real, tested anyway. If the harness ever propagates instead of
// nulling, the resilience fix must STILL produce an explicit rejection. Running both makes the
// question moot rather than load-bearing.
export const parallelPropagate = async ts => Promise.all(ts.map(t => t()))

export const bothParallelContracts = [
  ['parallel: throw->null (pinned contract)', parallelThrowToNull],
  ['parallel: propagating (hedge)', parallelPropagate],
]

// --- the stub kit ----------------------------------------------------------------------------

/**
 * Build a stub `agent` plus the recorders the assertions read.
 *
 * THE STUB MUST AWAIT. `return canned(label)` un-awaited makes a `finally` block run BEFORE the
 * returned promise settles — so any in-flight counter reads 1 forever, no matter what the code does.
 * That defect gave an earlier revision of this work a test that could not fail: deleting the entire
 * feature under test left it green. It reads 1 even when canned() is itself async.
 *
 * Counters are PER LABEL, not global: the retry loop lives INSIDE agentTyped, so a retry-on-null
 * mutation is only observable at the stub, and a global total is muddied by the other agents in the
 * fixture. (SC-003, SC-015)
 */
export function makeAgentStub(canned) {
  const spawned = []
  const calls = new Map()
  const agent = async (prompt, opts = {}) => {
    const label = opts.label ?? '(unlabelled)'
    spawned.push(label)
    calls.set(label, (calls.get(label) ?? 0) + 1)
    await new Promise(r => setImmediate(r))   // yield — see the note above
    const r = canned(label, opts)
    if (typeof r === 'function') return r()    // let a fixture throw from inside the await
    return r
  }
  return {
    agent,
    spawned,
    callsFor: label => calls.get(label) ?? 0,
    // [...spawned].sort(), never spawned.sort(): the in-place sort destroys spawn order for any
    // later order-sensitive assertion.
    labels: () => [...spawned].sort(),
  }
}

/** Drive the shipped workflow with a stub kit. Returns the workflow's own return value. */
export async function drive({ canned, parallel = parallelThrowToNull, args = { featureDir: '/f' }, src }) {
  const kit = makeAgentStub(canned)
  const run = makeRun(src ?? loadWorkflowSource())
  const result = await run(kit.agent, parallel, () => {}, () => {}, args)
  return { result, ...kit }
}

// --- fixtures --------------------------------------------------------------------------------
//
// Every requirement below was EARNED: each is a case where the mutation provably does NOT fire
// without it. They are not style notes.

/** Build a `load-artifacts` payload. */
export const graph = (phases, extra = {}) => ({
  featureDir: '/f', projectRoot: '/r', testCommand: 'pytest', testCommandStatus: 'detected', phases, ...extra,
})

export const task = (id, o = {}) => ({
  id, description: `do ${id}`, parallel: o.parallel ?? false,
  files: o.files ?? [`${id}.py`], done: o.done ?? false, ...o,
})

/** Default happy answers for every label the workflow spawns. */
export const baseCanned = (loadPayload) => (label) => {
  if (label === 'load-artifacts') return loadPayload
  if (label.startsWith('impl:')) return { id: label.slice(5), succeeded: true, summary: 's', redConfirmed: true, greenConfirmed: true }
  if (label.startsWith('verify:')) return { refuted: false, reason: 'ok' }
  if (label.startsWith('gate:')) return { passed: true, summary: 'green' }
  return 'report text'
}

/** Compose: override specific labels on top of the happy path. */
export const withOverrides = (base, overrides) => (label, opts) => {
  for (const [match, value] of overrides) {
    if (typeof match === 'string' ? label === match : match(label)) {
      return typeof value === 'function' ? value : () => value
    }
  }
  return base(label, opts)
}

/** A throw the fixture can hand back through the stub's await. */
export const throws = (v) => () => { throw v }

export const FIXTURES = {
  // 2 phases, a done:true task. SC-017 needs BOTH: with one phase `notAttempted` is [] and a
  // mutation returning [] stays green; without a done:true task, `!t.done` is undiscriminating.
  twoPhases: () => graph([
    { name: 'Phase 1', tasks: [task('T001', { parallel: true }), task('T002', { parallel: true, done: true })] },
    { name: 'Phase 2', tasks: [task('T003')] },
  ]),

  // Duplicate id across phases, AND the run must HALT before the second one's phase — otherwise
  // both T001s are attempted, notAttempted is [] under either keying, and the id-keyed mutation
  // goes GREEN. The halt is what makes SC-013's mutation fire.
  duplicateId: () => graph([
    { name: 'Phase 1', tasks: [task('T001')] },
    { name: 'Phase 2', tasks: [task('T001')] },
  ]),

  // Single [P] task per phase, two phases — for gate tests. Phase 1's task must PASS verification,
  // or the :329 task-rejection halt fires BEFORE the gate ever spawns and SC-004's mutation goes
  // green for the wrong reason.
  twoPhasesSequential: () => graph([
    { name: 'Phase 1', tasks: [task('T001')] },
    { name: 'Phase 2', tasks: [task('T002')] },
  ]),

  // Two [P] tasks, one phase — the silent-drop fixture.
  parallelPair: () => graph([
    { name: 'Phase 1', tasks: [task('T001', { parallel: true }), task('T002', { parallel: true })] },
  ]),
}

// --- meta ------------------------------------------------------------------------------------

test('harness: the shipped workflow loads and its meta rewrite still matches', () => {
  const src = loadWorkflowSource()
  assert.ok(src.includes('const meta'), 'meta declaration missing after rewrite')
  assert.ok(!/^export /m.test(src), 'an unrewritten `export` remains — new Function would throw')
})

test('harness: drives the SHIPPED file end to end', async () => {
  const { result, spawned } = await drive({ canned: baseCanned(FIXTURES.parallelPair()) })
  assert.equal(result.completed, 2, 'both tasks should be accepted on the happy path')
  assert.ok(spawned.includes('load-artifacts'), 'loader never ran')
  assert.ok(spawned.includes('gate:Phase 1'), 'phase gate never ran')
  // Spike 3's measured amplitude: 2 tasks => 12 agents (1 loader + 2 impl + 6 verify + 1 gate +
  // update-tasks-md + completion-report). If this number moves, the fan-out changed. (#29)
  assert.equal(spawned.length, 12, `expected 12 agents for 2 tasks, got ${spawned.length}: ${spawned.join(', ')}`)
})

// =============================================================================================
// THE HARNESS MUST BE ABLE TO FAIL.
//
// This suite is code, and unexecuted code is unreliable regardless of who wrote it — this repo has
// proved that three times: `pipefail` + `grep -q` blinded three shell guards while they "passed";
// an earlier stub here read peak=1 forever, so deleting the feature under test left it green; and
// a reviewer's own smoke guards shipped with a false-green. So: prove the mechanism fires before
// trusting it to pass. (constitution principle 3)
// =============================================================================================

test('SC-007: makeRun executes in STRICT mode — a sloppy-mode escape would be a false green', async () => {
  // The shipped file is an ES module and therefore always strict. A `new Function` body is SLOPPY by
  // default. Without 'use strict' the harness runs DIFFERENT SEMANTICS from production: an
  // assignment to an undeclared identifier — an ordinary typo — passes green in CI and throws
  // ReferenceError on the first real run.
  //
  // NOTE `rejects`, not `throws`: the violation happens INSIDE the async arrow, so it rejects the
  // returned promise rather than throwing synchronously. Written with assert.throws this test fails
  // with "Missing expected exception" even though strict mode is working perfectly — which is how it
  // was first written here, and what running it immediately revealed.
  const strictOnlyBug = "undeclaredGlobal = 1; return 'reached'"

  await assert.rejects(
    () => makeRun(strictOnlyBug)(null, null, null, null, null),
    /undeclaredGlobal is not defined/,
    'makeRun must run strict — an undeclared assignment has to reject',
  )

  // ...and prove the mutation is REAL: without 'use strict' the same source RESOLVES, silently
  // swallowing the typo. If this half ever fails, the assertion above is decorative.
  const sloppy = new Function('agent', 'parallel', 'phase', 'log', 'args',
    `return (async () => {\n${strictOnlyBug}\n})()`)
  assert.equal(await sloppy(null, null, null, null, null), 'reached',
    'sloppy mode must silently PASS the typo — if it does not, SC-007 cannot tell strict from sloppy and is vacuous')
})

test('SC-006: the meta-rewrite assertion fires when the declaration is reworded', () => {
  // If `export const meta` is ever renamed, String.replace matches nothing and the harness would
  // test a stale shape — or nothing at all.
  const raw = 'export default const meta = {}\nreturn null'
  const src = raw.replace('export const meta', 'const meta')
  assert.equal(src, raw, 'precondition: this fixture must NOT match the rewrite')
  assert.throws(
    () => { assert.notStrictEqual(src, raw, 'rewrite matched nothing') },
    /rewrite matched nothing/,
    'the guard must fire when the rewrite is a no-op',
  )
})

test('SC-008: the label-multiset floor rejects a workflow that spawns nothing', async () => {
  // A ceiling with no floor passes MORE easily the more broken the file is: break the loader and the
  // workflow spawns one agent and quits, and any `<=` assertion sails through. Force the early
  // return and prove an exact-multiset assertion goes red instead.
  const { result, spawned } = await drive({
    canned: () => ({ featureDir: '/f', projectRoot: '/r', testCommand: '', phases: [] }),
  })
  assert.ok(result.error, 'precondition: an empty task graph must take the early-return path')
  assert.deepEqual(spawned, ['load-artifacts'], 'a broken loader spawns exactly one agent')
  assert.throws(
    () => assert.deepEqual([...spawned].sort(), ['load-artifacts', 'impl:T001', 'gate:Phase 1'].sort()),
    'an exact-multiset assertion must REJECT a run that did less — this is the floor',
  )
})

// =============================================================================================
// RESILIENCE — every test below MUST be RED against the unmodified file.
//
// A green test here is a test of nothing. Three of these were proven red by executed spikes
// before a line of the fix existed: the 1/1 silent drop, the 2/2 dead gates, the 3/3 unwritten
// tasks.md. That is this framework's own Iron Law applied to its own repair.
//
// ASSERT AT THE TOOL-CALL LEVEL — which labels spawned, how many invocations per label. Never on
// data an agent returned. (constitution principle 3)
// =============================================================================================

const SCHEMA_FAILURE = 'completed without calling StructuredOutput (after in-conversation nudge)'

for (const [contractName, parallel] of bothParallelContracts) {
  // Run the resilience suite against BOTH plausible parallel() contracts. With the fix in place the
  // thunk never rejects, so these agree — the discipline earns its keep against SC-002's PAIR
  // mutation, where the contract is what decides whether the task vanishes or the run dies.

  test(`SC-002 [${contractName}]: a crashed [P] implementer becomes an explicit rejection, never a silent drop`, async () => {
    const { result } = await drive({
      parallel,
      canned: withOverrides(baseCanned(FIXTURES.parallelPair()), [
        ['impl:T001', throws(new Error(SCHEMA_FAILURE))],
      ]),
    })
    // The bug: T001 vanishes, the gate runs green, and the run returns {"completed":1,"total":1} —
    // a PERFECT SCORE for a phase where the task never ran. Measured, Spike 2.
    assert.ok(result.halted, `the phase must halt; instead the run returned ${JSON.stringify(result)}`)
    const ids = (result.rejected ?? []).map(r => r.id)
    assert.ok(ids.includes('T001'), `T001 must appear in the halt's rejected list; got ${JSON.stringify(result.rejected)}`)
    assert.equal(result.total, 2, 'total must count the crashed task, not erase it from the denominator')
  })

  test(`SC-001 [${contractName}]: a persistently throwing sequential implementer halts the phase and does not kill the run`, async () => {
    const g = FIXTURES.twoPhasesSequential()
    const { result, callsFor } = await drive({
      parallel,
      canned: withOverrides(baseCanned(g), [['impl:T001', throws(new Error(SCHEMA_FAILURE))]]),
    })
    // Unfixed, the sequential path propagates the throw out of the script and the whole run dies.
    assert.ok(result.halted, 'the phase must halt cleanly rather than the run dying')
    assert.equal(callsFor('impl:T001'), 3, 'FR-001: bounded at 3 attempts (throw is retried)')
  })

  test(`SC-001b [${contractName}]: a NON-ERROR throw does not kill the run`, async () => {
    // `throw null` makes `e.message` in the catch throw a TypeError — the error handler becomes the
    // failure. Measured. Must be SEQUENTIAL: on the [P] path parallel swallows it and the
    // index-mapped fallback converts it to a rejection, so the same mutation goes green there.
    // That inversion — sequential dies, parallel is protected — is the opposite of this feature's
    // own thesis, which is why it gets its own test.
    const g = FIXTURES.twoPhasesSequential()
    const { result } = await drive({
      parallel,
      canned: withOverrides(baseCanned(g), [['impl:T001', throws(null)]]),
    })
    assert.ok(result.halted, 'a thrown null must halt cleanly, not escape as a TypeError')
  })
}

test('SC-003: a null-returning agent is invoked EXACTLY once — a terminal API error is never retried', async () => {
  const g = FIXTURES.twoPhasesSequential()
  const { callsFor } = await drive({
    canned: withOverrides(baseCanned(g), [['impl:T001', () => null]]),
  })
  // null means the harness ALREADY exhausted its own backoff. Retrying pours load onto an API that
  // is already refusing us — the exact overload #29 exists to shed. Counted on the STUB: the retry
  // loop lives inside agentTyped, so this mutation is invisible from outside it.
  assert.equal(callsFor('impl:T001'), 1, 'FR-002: a null must NOT be retried')
})

test('SC-015: a throwing agent is invoked EXACTLY 3 times — the retry is bounded', async () => {
  const g = FIXTURES.twoPhasesSequential()
  const { callsFor } = await drive({
    canned: withOverrides(baseCanned(g), [['impl:T001', throws(new Error(SCHEMA_FAILURE))]]),
  })
  // Nothing else pins FR-001's bound: set tries=10 and no other test notices, yet unbounded retry
  // against a hot API is the field report's own failure mode.
  assert.equal(callsFor('impl:T001'), 3, 'FR-001: 3 attempts total, not more')
})

test('SC-004: a DEAD phase gate halts — absence of confirmation is not confirmation', async () => {
  const g = FIXTURES.twoPhasesSequential()
  const { result, spawned } = await drive({
    canned: withOverrides(baseCanned(g), [[l => l.startsWith('gate:'), () => null]]),
  })
  // The bug: `if (gate && !gate.passed)` lets null through, phase 2 builds on ungated work, and the
  // run returns {"completed":2,"total":2} — 6 gate invocations, 0 confirmations. Measured, Spike 5.
  //
  // THREE POSITIVE FLOORS. The negative alone ("phase 2 never ran") is vacuous — it holds whenever
  // phase 2 doesn't run for ANY reason, including the :329 halt firing before the gate ever spawns.
  assert.ok(spawned.includes('gate:Phase 1'), 'FLOOR (a): the gate path must actually have been reached')
  assert.ok(result.halted, 'the phase must halt on a dead gate')
  assert.equal(result.haltedAt, 'Phase 1', 'FLOOR (c): must halt at the gate, not elsewhere')
  assert.match(result.reason, /gate agent died|never confirmed/i,
    `FLOOR (c): the reason must name the gate as DIED, not failed, and not a task rejection; got: ${result.reason}`)
  assert.ok(!spawned.some(l => l === 'impl:T002'), 'phase 2 must never run on an unconfirmed gate')
})

test('SC-016: a gate FAILURE still reports the failing tests', async () => {
  const g = FIXTURES.twoPhasesSequential()
  const { result } = await drive({
    canned: withOverrides(baseCanned(g), [
      ['gate:Phase 1', () => ({ passed: false, summary: '3 tests failed', failures: ['test_a', 'test_b'] })],
    ]),
  })
  // :364 carried `failures`. Dropping it loses the failing-test list at exactly the moment the gate
  // fails — the one moment the operator needs it.
  assert.ok(result.halted)
  assert.deepEqual(result.failures, ['test_a', 'test_b'], 'the failing-test list must survive the halt')
})

test('SC-012: a run whose tasks.md write died must NOT report clean', async () => {
  const g = FIXTURES.parallelPair()
  const { result } = await drive({
    canned: withOverrides(baseCanned(g), [['update-tasks-md', () => null]]),
  })
  // The bug: :376 discards its result, so the run returns {"completed":2,"total":2} with NO checkbox
  // written — a green run whose only persisted artifact never happened, and whose next invocation
  // re-implements every task.
  assert.ok(result.halted, `a dead tasks.md write must not report clean; got ${JSON.stringify(result)}`)
  assert.match(result.reason, /tasks\.md|checkbox/i, 'the reason must say the WRITE failed, not the work')
  assert.match(result.reason, /do not re-run|complete|on disk/i,
    'the reason must tell the operator the work IS done, or they re-run everything')
})

test('SC-005 + SC-013 + SC-017: the ledger balances and is not fooled by a duplicate model-authored id', async () => {
  const g = FIXTURES.duplicateId()
  // Halt in phase 1 so phase 2's duplicate T001 is never attempted. Without the halt both T001s run,
  // notAttempted is [] under either keying, and the id-keyed mutation goes GREEN.
  const { result } = await drive({
    canned: withOverrides(baseCanned(g), [
      [l => l.startsWith('verify:T001'), () => ({ refuted: true, reason: 'nope' })],
    ]),
  })
  assert.ok(result.halted)
  assert.equal(result.total, 2, 'both T001s are pending')
  const sum = (result.accepted?.length ?? 0) + (result.rejected?.length ?? 0) + (result.notAttempted?.length ?? 0)
  assert.equal(sum, result.total,
    `BALANCE: accepted+rejected+notAttempted must equal total; got ${sum} vs ${result.total} — ` +
    `a task vanished. Keying on the model-authored id does exactly this.`)
  assert.deepEqual(result.notAttempted, ['T001'], "phase 2's T001 was never attempted and must say so")
})

// =============================================================================================
// #31 — `testCommand: ""` conflated "this project has no tests" with "I could not detect them".
//
// Nothing distinguished them, and every consumer treated the second as the first: implementers
// could not confirm RED/GREEN, the lens had no suite, and the gate was TOLD to report passed:true
// for a project with no gate — so a DETECTION FAILURE produced a clean N/N run that verified
// nothing. This repo is that case: its suite is tests/smoke.sh, and the loader was told to look
// only for package.json/pytest/cargo/go.
// =============================================================================================

test('#31: an UNDETECTABLE test command halts at load — before any work is spawned', async () => {
  const g = graph([{ name: 'Phase 1', tasks: [task('T001')] }],
    { testCommand: '', testCommandStatus: 'undetectable' })
  const { result, spawned } = await drive({ canned: baseCanned(g) })
  // Nothing downstream can verify anything, so refuse to start rather than burn a full run and
  // report clean. The file's own bias: a task wrongly refused costs one round; wrongly accepted
  // ships a bug.
  assert.ok(result.halted, `must halt; got ${JSON.stringify(result)}`)
  assert.equal(result.haltedAt, 'Load')
  assert.match(result.reason, /could not|undetectable|args\.testCommand/i,
    'the reason must name the remedy — the operator has to know to pass args.testCommand')
  assert.deepEqual(spawned, ['load-artifacts'], 'NO implementer may spawn — that is the point of halting at load')
})

test('#31: a project that genuinely has NO tests still runs — absence is not failure', async () => {
  const g = graph([{ name: 'Phase 1', tasks: [task('T001')] }],
    { testCommand: '', testCommandStatus: 'none-exist' })
  const { result, spawned } = await drive({ canned: baseCanned(g) })
  // The carve-out is CORRECT for the case it was written for. Halting over a project that never
  // had tests would be a false alarm — this is the regression guard for that.
  assert.ok(!result.halted, `a genuinely test-less project must still run; got ${JSON.stringify(result)}`)
  assert.equal(result.completed, 1)
  assert.ok(spawned.includes('gate:Phase 1'), 'the gate still runs — it just has no suite to assert')
})

test('#31: the gate is not asked to run a suite that does not exist', async () => {
  const g = graph([{ name: 'Phase 1', tasks: [task('T001')] }],
    { testCommand: '', testCommandStatus: 'none-exist' })
  let gatePrompt = ''
  const { } = await drive({
    canned: withOverrides(baseCanned(g), [
      ['gate:Phase 1', () => ({ passed: true, summary: 'no suite' })],
    ]),
    // capture the prompt the gate actually receives
    args: { featureDir: '/f' },
  })
  // Re-drive capturing the prompt text (the stub kit records labels, not prompts).
  const kit = makeAgentStub(baseCanned(g))
  const agent = async (p, o = {}) => { if (o.label?.startsWith('gate:')) gatePrompt = p; return kit.agent(p, o) }
  await makeRun(loadWorkflowSource())(agent, parallelThrowToNull, () => {}, () => {}, { featureDir: '/f' })
  assert.ok(!/Full test suite.*must be green/i.test(gatePrompt),
    'with no suite in existence the gate must NOT be told "Full test suite — must be green" with no command')
  assert.match(gatePrompt, /no automated test suite|has no tests/i,
    'the gate must be told plainly that this project has no suite')
  // The loader must not grade its own homework. "none-exist" is the one status that silently disables
  // every verification gate, and it is model-authored — so the gate agent, which is a DIFFERENT agent
  // standing in the repo, is told to refute it. A prompt asking the model nicely is not a mechanism;
  // an independent agent that can say "I found tests/" is.
  assert.match(gatePrompt, /CHECK THAT CLAIM|claim is false/i,
    'the gate must be told to REFUTE the no-tests claim, not take the loader\'s word for it')
  assert.match(gatePrompt, /passed:false/,
    'the gate must know what to do when it finds tests the loader missed')
})

test('#31: args.testCommand overrides detection and makes an otherwise-undetectable repo runnable', async () => {
  // Without this, halt-on-undetectable has no remedy but editing the workflow. With it, THIS repo
  // can run its own workflow: args.testCommand = 'tests/smoke.sh'.
  const g = graph([{ name: 'Phase 1', tasks: [task('T001')] }],
    { testCommand: '', testCommandStatus: 'undetectable' })
  let gatePrompt = ''
  const kit = makeAgentStub(baseCanned(g))
  const agent = async (p, o = {}) => { if (o.label?.startsWith('gate:')) gatePrompt = p; return kit.agent(p, o) }
  const result = await makeRun(loadWorkflowSource())(
    agent, parallelThrowToNull, () => {}, () => {}, { featureDir: '/f', testCommand: 'tests/smoke.sh' })
  assert.ok(!result.halted, `an explicit testCommand must override an undetectable status; got ${JSON.stringify(result)}`)
  assert.match(gatePrompt, /tests\/smoke\.sh/, 'the gate must be given the operator-supplied command')
})

test('#31: a non-string or empty args.testCommand is rejected, not silently honoured', async () => {
  // A had no argument surface until now, so it inherits #29's lesson the moment it gains one:
  // `args` can arrive as a JSON blob, and a value that is not a usable command must not silently
  // become one. "" must not mean "detected an empty command".
  for (const bad of ['', '   ', 42, null, {}]) {
    const g = graph([{ name: 'Phase 1', tasks: [task('T001')] }],
      { testCommand: '', testCommandStatus: 'undetectable' })
    const result = await makeRun(loadWorkflowSource())(
      makeAgentStub(baseCanned(g)).agent, parallelThrowToNull, () => {}, () => {},
      { featureDir: '/f', testCommand: bad })
    assert.ok(result.halted,
      `args.testCommand=${JSON.stringify(bad)} is not a usable command and must NOT override the undetectable halt`)
  }
})

test('#31: an unrecognised testCommandStatus is treated as undetectable, never as fine', async () => {
  // The status is model-authored, so the model can return something outside the enum — a typo, a
  // hallucinated fourth state, or nothing at all if an older loader payload is replayed from cache.
  // The safe reading of a value we do not understand is "we do not know", never "everything is fine".
  // That is the whole of #31 in one line, so it gets a test: without one, deleting the fallback goes
  // unnoticed (verified — the mutation was green until this existed).
  for (const status of ['DETECTED', 'maybe', '', undefined, null, 42]) {
    const g = graph([{ name: 'Phase 1', tasks: [task('T001')] }],
      { testCommand: '', testCommandStatus: status })
    const { result } = await drive({ canned: baseCanned(g) })
    assert.ok(result.halted,
      `testCommandStatus=${JSON.stringify(status)} is not a status we understand and must halt, not proceed`)
    assert.equal(result.haltedAt, 'Load')
  }
})

test('#31: an incoherent loader answer (detected + empty command) is treated as undetectable', async () => {
  // The status is model-authored. `detected` with no command is self-contradictory, and this file
  // does not trust model-authored fields it can check — the [P] marker sets that precedent.
  const g = graph([{ name: 'Phase 1', tasks: [task('T001')] }],
    { testCommand: '', testCommandStatus: 'detected' })
  const { result } = await drive({ canned: baseCanned(g) })
  assert.ok(result.halted, 'a "detected" status with no command must not be believed')
})

test('SC-017: a done:true task is excluded from total, and an unreached phase is notAttempted', async () => {
  const g = FIXTURES.twoPhases()
  const { result } = await drive({
    canned: withOverrides(baseCanned(g), [
      [l => l.startsWith('verify:T001'), () => ({ refuted: true, reason: 'nope' })],
    ]),
  })
  assert.ok(result.halted)
  assert.equal(result.total, 2, 'T002 is done:true and must not count toward total')
  const sum = result.accepted.length + result.rejected.length + result.notAttempted.length
  assert.equal(sum, result.total, `balance ${sum} vs total ${result.total}`)
  assert.deepEqual(result.notAttempted, ['T003'], 'phase 2 never ran')
})
