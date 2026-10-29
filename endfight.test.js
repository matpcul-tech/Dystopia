import test from 'node:test';
import assert from 'node:assert/strict';
import { armEscape, scheduleEscape, stepWave, pickSim, missingHomes } from './endfight.js';

function waveState(over){
  return Object.assign({
    alarm: true, planted: false, escape: false,
    waveCap: null, waveTotal: 14,
    waveSpawned: 0, waveDebt: 0, waveStall: 0, waveT: 0,
  }, over);
}

test('escape latch survives death and a throttled tab, then arms once', () => {
  const g = {
    time: 10, planted: true, escape: false, escapeArm: 0,
    waveSpawned: 3, waveDebt: 2, waveStall: 4, waveT: 1,
  };
  assert.equal(scheduleEscape(g, 2.6), true);
  assert.equal(scheduleEscape(g, 9), false);
  assert.equal(g.escapeArm, 12.6);
  g.time = 13;
  assert.equal(armEscape(g, 'dead'), false);
  assert.equal(armEscape(g, 'story'), false);
  assert.equal(g.escape, false);
  assert.equal(g.waveSpawned, 3);
  assert.equal(armEscape(g, 'play'), true);
  assert.equal(g.escape, true);
  assert.equal(g.waveSpawned, 0);
  assert.equal(g.waveDebt, 0);
  assert.equal(g.waveT, 0);
  assert.equal(armEscape(g, 'play'), false);
});

test('a planted chapter does not spawn the exit wave until escape arms', () => {
  const g = waveState({ planted: true, escape: false, waveT: 0 });
  assert.deepEqual(stepWave(g, 5, 0, 8), []);
  assert.equal(g.waveDebt, 0);
  assert.equal(g.waveSpawned, 0);
});

test('chapter with no exit wave (Counting House) never mints combat spawns', () => {
  const g = waveState({ waveTotal: 0, waveCap: null, escape: true, waveT: 0 });
  assert.deepEqual(stepWave(g, 10, 0, 8), []);
  assert.equal(g.waveSpawned, 0);
});

test('a full room owes spawns instead of dropping them, then the last two appear', () => {
  const g = waveState({ waveT: 0 });
  const got = [];
  for (let n = 0; n < 220; n++) got.push(...stepWave(g, 0.5, 8, 8));
  assert.equal(g.waveSpawned, 14);
  assert.equal(g.waveDebt, 0);
  const seen = new Array(14).fill(0);
  for (const i of got) seen[i] += 1;
  assert.deepEqual(seen, new Array(14).fill(1));
  assert.ok(got.includes(12) && got.includes(13));
});

test('open slots catch up without skipping the tail', () => {
  const g = waveState({ waveSpawned: 12, waveT: 0 });
  assert.deepEqual(stepWave(g, 0.05, 3, 8), [12]);
  assert.deepEqual(stepWave(g, 3, 3, 8), [13]);
  assert.deepEqual(stepWave(g, 5, 0, 8), []);
  assert.equal(g.waveSpawned, 14);
});

test('debt flushes at two per frame when the room has room', () => {
  const g = waveState({ waveDebt: 5, waveT: 3, waveStall: 1 });
  assert.deepEqual(stepWave(g, 0.1, 0, 8), [0, 1]);
  assert.equal(g.waveDebt, 3);
  assert.equal(g.waveSpawned, 2);
});

test('sim budget always keeps the end-room pair and rotates everyone else', () => {
  const crowd = [];
  for (let i = 0; i < 10; i++) crowd.push({ i, dist: 30 - i, endRoom: false });
  crowd.push({ i: 40, dist: 12, endRoom: true });
  crowd.push({ i: 41, dist: 18, endRoom: true });
  const seen = new Set();
  let cursor = 0;
  for (let n = 0; n < 8; n++){
    const pick = pickSim(crowd, 6, cursor);
    cursor = pick.nextCursor;
    assert.equal(pick.chosen.has(40), true);
    assert.equal(pick.chosen.has(41), true);
    for (const id of pick.chosen) seen.add(id);
  }
  for (let i = 0; i < 10; i++) assert.equal(seen.has(i), true, 'drone ' + i + ' never ticked');
});

test('closest threats stay pinned while the far tail still gets a turn', () => {
  const list = [];
  for (let i = 0; i < 9; i++) list.push({ i, dist: i + 1, endRoom: false });
  const first = pickSim(list, 6, 0);
  for (let i = 0; i < 4; i++) assert.equal(first.chosen.has(i), true);
  assert.equal(first.chosen.has(8), false);
  let cursor = 0;
  let farTicked = false;
  for (let n = 0; n < 6; n++){
    const pick = pickSim(list, 6, cursor);
    cursor = pick.nextCursor;
    if (pick.chosen.has(8)) farTicked = true;
  }
  assert.equal(farTicked, true);
});

test('Counting House archive pair is refilled only where the home is missing', () => {
  const authored = [
    { kind: 'sentry', x: -3, z: -108 },
    { kind: 'sentry', x: 3, z: -116 },
  ];
  assert.equal(missingHomes(authored, []).length, 2);
  const oneDown = missingHomes(authored, ['-3,-108']);
  assert.deepEqual(oneDown.map(d => d.z), [-116]);
  assert.deepEqual(missingHomes(authored, ['-3,-108', '3,-116']), []);
});
