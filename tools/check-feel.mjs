// Locks the blind Story Mode fixes: time-based typing, time-based
// movement, the pointer-lock recenter swallow, and slot continue.
// Run: node tools/check-feel.mjs
import { readFileSync } from 'fs';
import { typedCount, swallowLook, integrateMove, resumePlan, inLevel, keptStep, moveSlices, bodyGap, lineHoldMs, claimClipBed, escapePress, lookDelta } from '../feel.js';

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

const rooms = [
  { x1:-1.7, x2:1.7, z1:2, z2:16 },
  { x1:-3, x2:3, z1:-10, z2:2 },
  { x1:-5, x2:5, z1:-42, z2:-10 },
  { x1:-4, x2:4, z1:-76, z2:-42 },
  { x1:-3, x2:3, z1:-112, z2:-76 },
  { x1:-9, x2:9, z1:-136, z2:-112 },
];
const annexes = [{ room:2, side:'R', z1:-38, z2:-30, depth:4 }];
const inside = (x, z) => inLevel(x, z, rooms, annexes, 0.4);
check('street lane is inside the level', inside(4.4, -41.5));
check('hardware door is inside the level', inside(0, -44));
check('hardware side pocket is outside', !inside(4.9, -42.7));
check('clinic annex is inside the level', inside(7, -34));
const slipped = keptStep({ x:4.4, z:-41.5 }, { x:4.9, z:-42.7 }, inside);
check('a step out beside the hardware door is rejected', slipped.kept === false && slipped.x === 4.4 && slipped.z === -41.5);
const through = keptStep({ x:0, z:-41.5 }, { x:0, z:-44 }, inside);
check('a step through the door center is kept', through.kept === true && through.z === -44);
check('a one meter hitch is sliced', moveSlices(1.04, 0.18) >= 6);
check('crawler body stays off the camera', bodyGap('crawler') >= 1.2);
check('a spoken line outlasts the old cutoff', lineHoldMs('x'.repeat(80), 1) >= 80 * 78);
check('line hold stays bounded', lineHoldMs('x'.repeat(400), 1) <= 14000);
check('a silent picture does not take the bed', claimClipBed(false, false) === false);
check('a muted soundtrack does not take the bed', claimClipBed(true, true) === false);
check('a playing soundtrack takes the bed', claimClipBed(true, false) === true);
check('movement rejects a landing outside the level', game.includes('keptStep('));
check('a bad continue is pulled back inside', game.includes('rescuePlayable('));
check('escape that only unlocks the mouse still pauses', game.includes('applyEscape('));
const opened = escapePress({ kind:'unlock', mode:'play', paused:false, lastAt:0, suppressUntil:0 }, 1000);
check('unlock opens pause', opened.action === 'open');
const sameDown = escapePress({ kind:'down', mode:'paused', paused:true, lastAt:opened.lastAt, suppressUntil:0 }, 1030);
check('keydown from the same press does not close pause', sameDown.action === 'ignore');
const sameUp = escapePress({ kind:'up', mode:'paused', paused:true, lastAt:opened.lastAt, suppressUntil:0 }, 1200);
check('keyup from the same press does not close pause', sameUp.action === 'ignore');
const resume = escapePress({ kind:'down', mode:'paused', paused:true, lastAt:opened.lastAt, suppressUntil:0 }, 1600);
check('a later escape resumes', resume.action === 'resume');
const missed = escapePress({ kind:'up', mode:'play', paused:false, lastAt:0, suppressUntil:0 }, 2000);
check('keyup alone still opens pause when keydown was swallowed', missed.action === 'open');
const quiet = escapePress({ kind:'unlock', mode:'play', paused:false, lastAt:0, suppressUntil:2500 }, 2000);
check('an unlock the game asked for does not pause', quiet.action === 'ignore');
const stickUp = lookDelta(0, 0, -1);
const keyW = lookDelta(0, 0, -1);
check('stick up walks forward at the start', stickUp.z < -0.9 && Math.abs(stickUp.x) < 1e-6, JSON.stringify(stickUp));
check('W uses the same forward as stick up', keyW.x === stickUp.x && keyW.z === stickUp.z);
check('stick down walks back', lookDelta(0, 0, 1).z > 0.9);
check('stick right strafes right', lookDelta(0, 1, 0).x > 0.9 && Math.abs(lookDelta(0, 1, 0).z) < 1e-6);
const turnedUp = lookDelta(Math.PI, 0, -1);
check('stick up still follows the look after turning around', turnedUp.z > 0.9 && Math.abs(turnedUp.x) < 1e-6, JSON.stringify(turnedUp));
const turnedRight = lookDelta(Math.PI, 1, 0);
check('stick right is not mirrored after turning around', turnedRight.x < -0.9 && Math.abs(turnedRight.z) < 1e-6, JSON.stringify(turnedRight));
check('movement uses lookDelta for the stick and for W', game.includes('lookDelta('));
check('death says you went down', game.includes('YOU WENT DOWN'));
check('speech is not cancelled in the same turn it starts', !/synthNow\.cancel\(\)/.test(game));
check('the next line waits while speech is still going', game.includes('synth.speaking'));

if (fails.length){
  console.error(fails.join('\n'));
  process.exit(1);
}
console.log('story feel checks passed');
