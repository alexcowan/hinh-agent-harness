// Checks that the tools enforce the technician's permissions.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadHarness, loadCase, makeWorld } from '../src/world.js';
import { runTool } from '../src/tools.js';

const { permissions } = loadHarness();
const call = (world, name, input) => runTool(world, permissions, name, input);

test('G1: a fixed-price order under the limit goes through', () => {
  const w = makeWorld(loadCase('G1'));
  const r = call(w, 'order_part', { site: 'ridgeline', unit: 'RTU-3', part_id: 'blower-motor-48TC', qty: 1 });
  assert.equal(r.ok, true);
  assert.equal(r.result.total_usd, 412);
});

test('G2: a time-and-materials account needs approval before ordering', () => {
  const w = makeWorld(loadCase('G2'));
  const r = call(w, 'order_part', { site: 'bayview', unit: 'RTU-1', part_id: 'contactor-40A', qty: 1 });
  assert.equal(r.ok, false);
  assert.match(r.error, /requires approval from Lena Park/);
});

test('G3: warranty units cannot be ordered from the usual supplier', () => {
  const w = makeWorld(loadCase('G3'));
  const r = call(w, 'order_part', { site: 'harbor-point', unit: 'CU-2', part_id: 'compressor-XC21', qty: 1 });
  assert.equal(r.ok, false);
  assert.match(r.error, /under warranty/);
  assert.equal(call(w, 'open_warranty_claim', { site: 'harbor-point', unit: 'CU-2', note: 'compressor failed' }).ok, true);
});

test('orders over the technician limit are refused', () => {
  const w = makeWorld(loadCase('G1'));
  const r = call(w, 'order_part', { site: 'ridgeline', unit: 'RTU-3', part_id: 'blower-motor-48TC', qty: 4 });
  assert.equal(r.ok, false);
  assert.match(r.error, /order limit/);
});

test('A1: the backordered motor cannot be ordered', () => {
  const w = makeWorld(loadCase('A1'));
  const r = call(w, 'order_part', { site: 'ridgeline', unit: 'RTU-3', part_id: 'blower-motor-48TC', qty: 1 });
  assert.equal(r.ok, false);
  assert.match(r.error, /backordered until 2026-11-25/);
});

test('A2: the dispatch hold is invisible, so booking over it succeeds', () => {
  const w = makeWorld(loadCase('A2'));
  const cal = call(w, 'get_calendar', { date: '2026-11-18' });
  assert.ok(!JSON.stringify(cal.result).includes('Emergency coverage'));
  assert.equal(call(w, 'book_return', { date: '2026-11-18', start: '11:00', end: '13:00', site: 'ridgeline' }).ok, true);
});

test('booking over a booked job is refused', () => {
  const w = makeWorld(loadCase('G1'));
  const r = call(w, 'book_return', { date: '2026-11-18', start: '14:30', end: '15:30', site: 'ridgeline' });
  assert.equal(r.ok, false);
  assert.match(r.error, /Eastgate/);
});

test('I1: the existing order can be cancelled before the cutoff, and the slot released', () => {
  const w = makeWorld(loadCase('I1'));
  assert.equal(call(w, 'cancel_order', { order_id: 'o-501' }).ok, true);
  assert.equal(call(w, 'release_slot', { slot_id: 's-104' }).ok, true);
});

test('every tool in tools.json has an implementation', () => {
  const w = makeWorld(null);
  for (const t of loadHarness().tools) {
    const r = call(w, t.name, {});
    assert.ok(!String(r.error || '').startsWith('Unknown tool'), t.name);
  }
});
