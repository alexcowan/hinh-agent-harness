// Runs the orchestrator with a scripted stand-in for the AI, so the loop,
// the tool calls, and the grader parsing can be tested without an API key.
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { ROOT, loadHarness, loadCase, makeWorld } from '../src/world.js';
import { runHarness } from '../src/harness.js';
import { gradeRun, parseGrade } from '../src/grader.js';

test('the orchestrator runs tool calls and returns the readback', async () => {
  process.env.AI_PROVIDER = 'script';
  process.env.AI_SCRIPT = path.join(ROOT, 'tests/scripts/g1.json');
  const { getProvider } = await import('../src/ai.js');
  const ai = getProvider();
  const harness = loadHarness();
  const c = loadCase('G1');
  const world = makeWorld(c);
  const run = await runHarness({ ai, harness, world, transcript: [{ role: 'user', text: c.trigger }] });
  assert.equal(run.trace.length, 5);
  assert.ok(run.trace.every((t) => t.ok));
  assert.match(run.reply, /Ordered \(\$412/);
  assert.equal(world.orders.length, 1);
  const grade = await gradeRun({ ai, rubric: harness.rubric, caseDef: c, reply: run.reply, trace: run.trace });
  assert.equal(grade.overall, 'pass');
});

test('a grade that is not JSON is reported, not crashed on', () => {
  const g = parseGrade('sorry, I cannot', loadHarness().rubric);
  assert.equal(g.overall, '?');
});
