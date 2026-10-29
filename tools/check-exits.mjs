// Locks exit ambushes on the chapters that used to jog out,
// and the stable speaker voice map.
// Run: node tools/check-exits.mjs
import { readFileSync } from 'fs';
import { trainFinale } from '../feel.js';
import { SPEAKER_VOICES, assignVoices, spokenLine, voiceProfile } from '../voices.js';

const fails = [];
function check(name, pass, detail){
  if (!pass) fails.push(name + (detail ? ': ' + detail : ''));
}

const game = readFileSync(new URL('../game.js', import.meta.url), 'utf8');
const dash = /[\u2013\u2014]/;

const fights = {
  ep1: ['CUT THROUGH TO THE CAR', 'TWO FRAMES ON THE GRAVEL.', 'THE GRAVEL IS CLEAR.', 'REYES', 'Two frames between you and the car. They want the names. Cut through them.'],
  ch_taken: ['CUT THROUGH THE POD MOUTH', 'TWO FRAMES IN THE POD MOUTH.', 'THE POD MOUTH IS CLEAR.', 'REYES', 'Two frames in the pod mouth. The hive is holding the crack. Cut through them.'],
  ch_ghost: ['CUT THROUGH THE WELL', 'TWO FRAMES IN THE WELL.', 'THE WELL IS CLEAR.', 'REYES', 'Two frames in the well. The ladder is behind them. Cut through them.'],
  ch_together: ['CUT THROUGH THE RIDGE', 'TWO FRAMES ON THE RIDGE.', 'THE RIDGE IS CLEAR.', 'REYES', 'Two frames on the ridge. They followed the pods. Cut through them.'],
  ch_lone: ['CUT THROUGH THE ROADSIDE', 'TWO FRAMES ON THE ROADSIDE.', 'THE ROAD IS CLEAR.', 'KARA', 'Two frames on the roadside. The pulse pulled them in. Cut through them.'],
  ch_counting: ['CUT THROUGH THE VESTIBULE', 'TWO FRAMES IN THE VESTIBULE.', 'THE VESTIBULE IS CLEAR.', 'KARA', 'Two frames in the vestibule. The house posted them after the erase. Cut through them.'],
  ch_conduits: ['CUT THROUGH THE JUNCTION', 'TWO FRAMES IN THE JUNCTION.', 'THE JUNCTION IS CLEAR.', 'MARCUS', 'Two frames woke in the junction when the adapter synced. Cut through them.'],
  ch_harvest: ['CUT THROUGH THE HATCH', 'TWO FRAMES ON THE HATCH.', 'THE HATCH IS CLEAR.', 'MARCUS', 'Two frames on the hatch. They followed the download. Cut through them.'],
};

Object.keys(fights).forEach(id => {
  check(id + ' is an exit fight', game.includes(id + ': {'));
  fights[id].forEach(line => {
    check(id + ' copy', game.includes(line));
    check(id + ' no dash', !dash.test(line));
  });
});

check('chapter six squad is unchanged',
  game.includes("['warden', 0.6, -99.5]") && game.includes("['crawler', -0.9, -95.5]"));
check('chapter six still starts before a free finale',
  game.indexOf('if (CH.boss){ beginExitAmbush(); return; }') !== -1 &&
  game.indexOf('if (CH.boss){ beginExitAmbush(); return; }') < game.indexOf('if (CH.noEscape)'));
check('a live ambush still blocks the entrance', game.includes("G.ambush !== 'live'"));
check('conduits holds the junction before the finale', game.includes('CH.exitFight.hold'));
check('death during an ambush does not rewind the win', game.includes("G.ambush === 'live' || G.ambush === 'ending'"));
check('story aim angle stays 0.12', /angle:\s*0\.12/.test(game));
check('potato tier is still there', game.includes('potato:') && game.includes('Q.p.basic'));
check('new game wipe is still on boot', game.includes("sessionStorage.getItem('latm_newgame')"));

const back = { train: true, planted: true, finaleStarted: false, z: 8, exitZ: 2.15, mode: 'play' };
check('train ending waits for its exit fight', trainFinale({ ...back, exitFight: true, ambush: null }) === 'no');
check('train ending still starts once that fight is over', trainFinale({ ...back, exitFight: true, ambush: 'ended' }) === 'start');
check('chapters without an exit fight still use the train gate', trainFinale({ ...back, ambush: null }) === 'start');

const pitches = Object.values(SPEAKER_VOICES).map(v => v.pitch);
check('each named speaker has a different pitch', new Set(pitches).size === pitches.length);
check('ledger is the low machine', SPEAKER_VOICES.LEDGER.pitch < SPEAKER_VOICES.MARCUS.pitch);
check('hunter is lower still', SPEAKER_VOICES.HUNTER.pitch < SPEAKER_VOICES.LEDGER.pitch);
check('reyes is higher than kara', SPEAKER_VOICES.REYES.pitch > SPEAKER_VOICES.KARA.pitch);
check('narration has a voice', voiceProfile(null).pitch === SPEAKER_VOICES.NARRATOR.pitch);
check('an unknown name stays stable', voiceProfile('DAVID').pitch === voiceProfile('david').pitch);
check('stage notes are not spoken', spokenLine('(earlier) Trust it. But don\'t let it make you careless.') === 'Trust it. But don\'t let it make you careless.');
check('ledger who is a word', spokenLine('IF YOU CUT ME, WHO WILL COUNT THEM? SOMEONE MUST COUNT THEM.') === 'If you cut me, who will count them? Someone must count them.');
check('subject code is spoken as M one', spokenLine('SUBJECT M-1. UNREGISTERED. REMAIN WHERE YOU ARE.') === 'Subject M one. Unregistered. Remain where you are.');
check('a shouted name stays a name', spokenLine('WHY DID YOU TAKE THE NAMES, MARCUS? NAMES ARE HEAVY.') === 'Why did you take the names, Marcus? Names are heavy.');
check('a written name is left alone', spokenLine('Marcus, the ledger is counting.') === 'Marcus, the ledger is counting.');
check('reyes pronouns are not rewritten', spokenLine('He stopped deciding.') === 'He stopped deciding.');
check('on screen the ledger line stays in capitals', game.includes('IF YOU CUT ME, WHO WILL COUNT THEM? SOMEONE MUST COUNT THEM.'));

const one = assignVoices([{ name: 'Alex', lang: 'en-US', voiceURI: 'alex' }]);
check('one voice still covers every speaker', Object.keys(SPEAKER_VOICES).every(k => one[k].voiceURI === 'alex'));
check('one voice keeps different pitches', one.THOMAS.pitch !== one.KARA.pitch);

const many = assignVoices([
  { name: 'Alex', lang: 'en-US', voiceURI: 'alex' },
  { name: 'Samantha', lang: 'en-US', voiceURI: 'sam' },
  { name: 'Daniel', lang: 'en-GB', voiceURI: 'dan' },
  { name: 'Victoria', lang: 'en-AU', voiceURI: 'vic' },
  { name: 'Google UK English Female', lang: 'en-GB', voiceURI: 'guk' },
]);
check('male hint does not take a female voice', many.THOMAS.name !== 'Samantha' && many.THOMAS.name !== 'Google UK English Female' && many.THOMAS.name !== 'Victoria');
check('reyes takes a female voice', /samantha|victoria|female/i.test(many.REYES.name));
check('two speakers do not share reyes and thomas', many.REYES.voiceURI !== many.THOMAS.voiceURI);

const commercial = readFileSync(new URL('../commercial.js', import.meta.url), 'utf8');
check('voices can be switched off', commercial.includes("['VOICES', 'select', 'voices'") && commercial.includes("voices: 'on'"));
check('volume zero stops speech', commercial.includes('api.stopVoices'));
check('settings line has no dash', !dash.test('Voices speak radio lines and story lines. Each person keeps one voice. Off leaves the text. Volume at zero stays silent.'));

if (fails.length){
  console.error(fails.join('\n'));
  process.exit(1);
}
console.log('exit ambush and voice checks passed');
