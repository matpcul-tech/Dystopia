// Locks the Story Mode aim nerf and the final-corridor ambush.
// Run: node tools/check-aim.mjs
import { readFileSync } from 'fs';
import { createContext, runInContext } from 'vm';

const src = readFileSync(new URL('../game.js', import.meta.url), 'utf8');
const commercial = readFileSync(new URL('../commercial.js', import.meta.url), 'utf8');
const fails = [];
function check(name, pass, detail){
  if (!pass) fails.push(name + (detail ? ': ' + detail : ''));
}

const aimDecl = src.match(/const STORY_AIM = \{[\s\S]*?\};/);
const fnDecl = src.match(/function aimAssistScale\(story, phoneFire, ang, dist\)\{[\s\S]*?\n\}/);
check('aim constants present', !!aimDecl && !!fnDecl);
const ctx = {};
runInContext(aimDecl[0] + '\n' + fnDecl[0] + '\nthis.STORY_AIM = STORY_AIM;\nthis.aimAssistScale = aimAssistScale;', createContext(ctx));
const A = ctx.STORY_AIM;
check('angle shrunk from 0.50', A.angle === 0.12, String(A.angle));
check('range shrunk from 28', A.max === 12 && A.min === 2, A.min + '..' + A.max);
check('pull is a nudge, not a snap', A.pull === 0.65, String(A.pull));

check('desktop story does not assist', ctx.aimAssistScale(true, false, 0.01, 8) === 0);
check('action mode does not assist', ctx.aimAssistScale(false, true, 0.01, 8) === 0);
check('wide phone shot does not assist', ctx.aimAssistScale(true, true, 0.12, 8) === 0);
check('far phone shot does not assist', ctx.aimAssistScale(true, true, 0.05, 12.01) === 0);
check('point blank phone shot does not assist', ctx.aimAssistScale(true, true, 0.05, 1.99) === 0);
check('close phone shot nudges', ctx.aimAssistScale(true, true, 0.05, 8) === A.pull);

// Old lock: 0.50 rad out to 28 m, full snap. New phone cone is a little over a metre.
const oldSlack = 28 * Math.sin(0.5);
const newSlack = A.max * Math.sin(A.angle);
const residual = A.max * Math.sin(A.angle * (1 - A.pull));
check('old cone was many metres wide', oldSlack > 13 && oldSlack < 14, oldSlack.toFixed(2));
check('new cone is about 1.4 m at max range', newSlack > 1.4 && newSlack < 1.5, newSlack.toFixed(2));
check('nudged shot still meets a crawler', residual < 0.55, residual.toFixed(3));

const storyFn = src.slice(src.indexOf('function storyAim'), src.indexOf('function pollGamepad'));
check('story aim uses the phone gate', storyFn.includes('phoneAiming()'));
check('story aim no longer hard locks', !storyFn.includes('dir.copy(best)') && storyFn.includes('dir.lerp'));
check('mouse path is not the phone gate', src.includes('touchFiring || (IS_TOUCH && G.padFire)'));

check('boss exit starts the ambush before a free finale',
  src.indexOf('if (CH.boss){ beginExitAmbush(); return; }') !== -1 &&
  src.indexOf('if (CH.boss){ beginExitAmbush(); return; }') < src.indexOf('if (CH.noEscape)'));
check('sprint to the entrance cannot skip a live ambush', src.includes("G.ambush !== 'live'"));
check('ambush is one warden and one crawler',
  src.includes("['warden', 0.6, -99.5]") && src.includes("['crawler', -0.9, -95.5]"));
check('corridor objective', src.includes("CUT THROUGH THE CORRIDOR"));
check('ambush radio', src.includes('Two frames in the sealed corridor. They never got the order. Cut through them.'));
check('finale still starts after the corridor', src.includes('if (CB.finale) Story.start(CB.finale)'));
check('settings no longer say story mode aims for you',
  !commercial.includes('aims for you') && commercial.includes('Mouse and keyboard do not lock on'));

const dash = /[\u2013\u2014]/;
const added = [
  'CUT THROUGH THE CORRIDOR',
  'TWO FRAMES IN THE EXIT CORRIDOR.',
  'CORRIDOR CLEAR.',
  'Two frames in the sealed corridor. They never got the order. Cut through them.',
  'Mouse and keyboard do not lock on',
];
added.forEach(line => check('no dash in copy: ' + line.slice(0, 24), !dash.test(line)));

if (fails.length){
  console.error(fails.join('\n'));
  process.exit(1);
}
console.log('aim nerf and exit ambush checks passed');
console.log('old lateral slack at 28 m: ' + oldSlack.toFixed(2) + ' m');
console.log('new lateral slack at 12 m: ' + newSlack.toFixed(2) + ' m');
console.log('residual after 0.65 pull: ' + residual.toFixed(3) + ' m');
