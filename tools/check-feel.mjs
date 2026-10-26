// Locks the blind Story Mode fixes: time-based typing, time-based
// movement, the pointer-lock recenter swallow, and slot continue.
// Run: node tools/check-feel.mjs
import { readFileSync } from 'fs';
import { typedCount, swallowLook, integrateMove, resumePlan } from '../feel.js';

const fails = [];
function check(name, pass, detail){
  if (!pass) fails.push(name + (detail ? ': ' + detail : ''));
}

const line = 'The vestibule door is at the end of the car.';
check('one second at 42 cps shows 42 characters', typedCount(1000, 200, 42) === 42);
check('a slow frame catches up by time, not by one character', typedCount(500, line.length, 42) === Math.min(line.length, 21));
check('zero time shows nothing', typedCount(0, line.length, 42) === 0);
check('typing stops at the end of the line', typedCount(9000, line.length, 42) === line.length);
check('two frames or thirty frames are the same count at the same time',
  typedCount(320, 80, 42) === typedCount(320, 80, 42));

check('lock recenter is ignored', swallowLook(10, 240, -30) === true);
check('a late spike is ignored', swallowLook(120, 180, 0) === true);
check('later look is kept', swallowLook(240, 4, -2) === false);
check('a small move just after the grace is kept', swallowLook(110, 6, 1) === false);

const tap = integrateMove({ x:0, z:-0.04 }, { x:0, z:0 }, 0.25, 0.2);
check('a short W tap still moves inside a long frame', Math.abs(tap.z + 0.04) < 1e-9, String(tap.z));
const held = integrateMove({ x:0, z:-0.5 }, { x:0, z:0 }, 0.5, 0.2);
check('a stalled frame does not fling the player', Math.abs(held.z + 0.2) < 1e-9, String(held.z));
const diag = integrateMove({ x:0.1, z:-0.1 }, { x:0, z:0 }, 0.1, 0.2);
check('diagonal hold is not faster than straight', Math.hypot(diag.x, diag.z) <= 0.1 + 1e-9, Math.hypot(diag.x, diag.z).toFixed(4));
const stick = integrateMove({ x:0, z:0 }, { x:0, z:-1 }, 0.05, 0.2);
check('stick movement uses the real frame length', Math.abs(stick.z + 0.05) < 1e-9, String(stick.z));
const low = integrateMove({ x:0, z:-0.1 }, { x:0, z:0 }, 0.1, 0.2);
const high = integrateMove({ x:0, z:-0.1 }, { x:0, z:0 }, 0.1, 0.2);
check('same hold time moves the same distance at any fps', low.z === high.z);

const chapters = { ep1:{}, ch_lone:{} };
check('empty slot is not a resume', resumePlan(null, 'ep1', chapters).ok === false);
check('missing position is not a resume', resumePlan({ chapter:'ep1' }, 'ep1', chapters).ok === false);
check('unknown chapter is not a resume', resumePlan({ chapter:'nope', x:1, z:2 }, 'ep1', chapters).ok === false);
check('same chapter resumes in place', resumePlan({ chapter:'ep1', x:1, z:-20 }, 'ep1', chapters).action === 'resume');
check('other chapter switches first', resumePlan({ chapter:'ch_lone', x:0, z:-4 }, 'ep1', chapters).action === 'switch');

const game = readFileSync(new URL('../game.js', import.meta.url), 'utf8');
const commercial = readFileSync(new URL('../commercial.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
check('title offers new game', html.includes('>NEW GAME<'));
check('title names the mode', html.includes('id="modeLine"'));
check('continue plans a resume', commercial.includes('resumePlan('));
check('continue does not press new game', !commercial.includes('start.click()'));
check('a save is written before the next room', game.includes('maybeAutosave(true)'));
check('typing uses the clock', game.includes('typedCount('));
check('look swallows the lock spike', game.includes('swallowLook('));
check('movement uses held time', game.includes('integrateMove('));
check('train choice shows the control hint', game.includes('showPlayHint()'));
check('context restore does not reload straight to the title',
  !/webglcontextrestored[\s\S]{0,180}location\.reload/.test(game));
check('loading banner exists', game.includes('RESTORING YOUR PLACE') && game.includes('LOADING EPISODE'));

const dash = /[\u2013\u2014]/;
const added = [
  'NEW GAME',
  'STORY MODE',
  'ACTION MODE',
  'RESTORING YOUR PLACE',
  'LOADING EPISODE',
  'DISPLAY RESET. HOLD ON. PUTTING YOU BACK WHERE YOU WERE.',
  'SPACE OR CLICK FINISHES THE LINE',
  'SPACE OR CLICK TO CONTINUE',
  'WASD MOVES. MOUSE LOOKS. CLICK SHOOTS. E USES.',
  'LEFT SIDE MOVES. RIGHT SIDE LOOKS. FIRE SHOOTS.',
  'This slot is empty. New Game starts Episode One here.',
];
added.forEach(line => check('no dash in copy: ' + line.slice(0, 28), !dash.test(line)));

if (fails.length){
  console.error(fails.join('\n'));
  process.exit(1);
}
console.log('story feel checks passed');
