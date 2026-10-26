// Locks the Episode One train soft-lock fixes.
// Run: node tools/check-train.mjs
import { readFileSync } from 'fs';
import { riflePickup, trainFinale, segmentsToClear, resumeProgress } from '../feel.js';

const fails = [];
function check(name, pass, detail){
  if (!pass) fails.push(name + (detail ? ': ' + detail : ''));
}

const rifle = { x: 0, z: -4 };

check('standing over the rifle counts', riflePickup(0, -4, rifle.x, rifle.z, false) === true);
check('a step away still counts', riflePickup(1.5, -4, rifle.x, rifle.z, false) === true);
check('eye height is not part of the reach', riflePickup(0, -4, rifle.x, rifle.z, false) === true);
check('just outside the touch radius waits for use', riflePickup(0, -1.6, rifle.x, rifle.z, false) === false);
check('use key reaches the prompt radius', riflePickup(0, -1.6, rifle.x, rifle.z, true) === true);
check('a step past the rifle toward the door counts', riflePickup(0, -6.4, rifle.x, rifle.z, false) === true);
check('use does not reach across the street', riflePickup(0, -20, rifle.x, rifle.z, true) === false);
check('walking the gravel wall past the rifle counts', riflePickup(3, -9.3, rifle.x, rifle.z, false) === true);
check('the far side of the gravel still counts', riflePickup(-3, -9.3, rifle.x, rifle.z, false) === true);
check('the rail car does not take the rifle', riflePickup(0, 10, rifle.x, rifle.z, false) === false);
check('beside the car does not take the rifle', riflePickup(3, -4, rifle.x, rifle.z, false) === false);

const back = { train: true, planted: true, finaleStarted: false, ambush: null, z: 8, exitZ: 2.15, mode: 'play' };
check('back on the train starts the ending', trainFinale(back) === 'start');
check('death in the doorway waits and keeps the escape', trainFinale({ ...back, mode: 'dead' }) === 'wait');
check('story mode waits and keeps the escape', trainFinale({ ...back, mode: 'story' }) === 'wait');
check('still on the gravel does not start it', trainFinale({ ...back, z: 1 }) === 'no');
check('a second start is refused', trainFinale({ ...back, finaleStarted: true }) === 'no');
check('a live ambush is not the train ending', trainFinale({ ...back, ambush: 'live' }) === 'no');
check('an unfinished exit fight is not the train ending', trainFinale({ ...back, exitFight: true, ambush: null }) === 'no');
check('a cleared exit fight can start the train ending', trainFinale({ ...back, exitFight: true, ambush: 'ended' }) === 'start');
check('an unpulled ledger does not end the chapter', trainFinale({ ...back, planted: false }) === 'no');
check('other chapters do not use the train gate', trainFinale({ ...back, train: false }) === 'no');

check('rooms behind the depot stay cleared', segmentsToClear(5).join(',') === '2,3,4');
check('the room you are in is not cleared', segmentsToClear(2).join(',') === '');
check('a bad furthest clears nothing', segmentsToClear(null).length === 0);

const kept = resumeProgress(5, 5, 0);
check('continue in the car keeps the depot progress', kept.segment === 5 && kept.furthest === 5 && kept.room === 0);
check('a farther body does not rewind', resumeProgress(2, 2, 4).segment === 4);
check('missing furthest still trusts the saved segment', resumeProgress(5, undefined, 0).segment === 5);

const game = readFileSync(new URL('../game.js', import.meta.url), 'utf8');
const commercial = readFileSync(new URL('../commercial.js', import.meta.url), 'utf8');
const feel = readFileSync(new URL('../feel.js', import.meta.url), 'utf8');

check('gate wait does not consume the escape', game.includes("if (gate !== 'start') return false"));
const loopAt = game.indexOf('function loop()');
const loop = game.slice(loopAt, loopAt + 1800);
const trainAt = loop.indexOf('tryTrainReturn()');
const dronesAt = loop.indexOf('updateDrones(');
check('the ending is offered before drones can kill you', trainAt !== -1 && dronesAt !== -1 && trainAt < dronesAt);

check('the car is safe once the ledger is pulled', game.includes('yawObj.position.z > trainCarLine()'));
check('finale and safety share one line', game.includes('exitZ: trainCarLine()'));
check('chapter six still refuses a live ambush', game.includes("G.ambush !== 'live'"));
check('chapter six still starts its finale', game.includes('if (CB.finale) Story.start(CB.finale)'));
check('ambush squad is unchanged',
  game.includes("['warden', 0.6, -99.5]") && game.includes("['crawler', -0.9, -95.5]"));
const aim = game.match(/angle:\s*([0-9.]+)/);
check('story aim angle stays 0.12', aim && aim[1] === '0.12', aim && aim[1]);

check('rifle prompt tells you to take it', game.includes('PRESS [E] TO TAKE THE RIFLE') && game.includes('TAKE THE RIFLE'));
check('hatch scare points at the real door', game.includes('THE VESTIBULE DOOR IS OPEN. THE RIFLE IS ON THE GRAVEL.'));
check('back on the train is named', game.includes('BACK ON THE TRAIN'));
check('hatch scare turns toward the vestibule', game.includes('G.yaw = 0') && game.includes('releaseTrain()'));
const hatchFn = game.slice(game.indexOf('function openHatchHole'), game.indexOf('function playHatchScare'));
check('the hatch is not a deleted wall', !hatchFn.includes('colliders'));

check('enemies spawn even if a model never arrives', game.includes('setTimeout(spawnAllInitial, 2500)'));
check('a drone inside a door can still be shot', game.includes('pointInSolid(d.mesh.position.x, d.mesh.position.z)'));
check('a lost drone is walked home', game.includes('inPlayable(m.x, m.z)'));
check('earned rooms stay clear on continue', game.includes('markSegmentsCleared(segmentsToClear'));
check('continue keeps the saved run', game.includes('resumeProgress(mid.segment, mid.furthest, room)'));
check('the ledger is written down', game.includes('planted: !!G.planted'));

check('pause can restart the episode', commercial.includes('RESTART EPISODE') && commercial.includes("setItem('latm_newgame', '1')"));
check('pause can return to the title', commercial.includes('RETURN TO TITLE'));
check('an ending clears the place', game.includes('Waking.clearPlace'));
check('restart is not written back by pagehide', commercial.includes("getItem('latm_newgame') === '1'"));
check('new game is still on the title', readFileSync(new URL('../index.html', import.meta.url), 'utf8').includes('>NEW GAME<'));
check('potato tier is still there', game.includes('potato:') && game.includes('Q.p.basic'));

const dash = /[\u2013\u2014]/;
const added = [
  'PRESS [E] TO TAKE THE RIFLE',
  'TAKE THE RIFLE',
  'THE VESTIBULE DOOR IS OPEN. THE RIFLE IS ON THE GRAVEL.',
  'BACK ON THE TRAIN',
  'RESTART EPISODE',
  'RETURN TO TITLE',
];
added.forEach(line => {
  check('copy is in the game: ' + line.slice(0, 24), game.includes(line) || commercial.includes(line));
  check('no dash in copy: ' + line.slice(0, 24), !dash.test(line));
});
check('helpers have no dash', !dash.test(feel));

if (fails.length){
  console.error(fails.join('\n'));
  process.exit(1);
}
console.log('episode one train checks passed');
