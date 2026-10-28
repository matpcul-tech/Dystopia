// Return loop: ending codex, daily hive signal, New Game+.
// Endings stay in latm_hybrid_endings and the save slot.
// The daily stamp is latm_daily_v1. It does not open paid chapters.
// New Game+ is a field on the save slot (ngPlus), not a second save file.

export const DAILY_KEY = 'latm_daily_v1';
export const CLEAR_ENDINGS = ['game_over', 'the_count'];
export const PAID_CHAPTERS = ['ch_counting', 'ch_conduits', 'ch_harvest', 'ch_steel'];

export const COSMETICS = [
  {
    id: 'signal_band',
    need: 3,
    name: 'SIGNAL BAND',
    progress: (n, need) => 'SIGNAL BAND ' + n + '/' + need + '. Fill it and the title keeps a brass line.',
    done: 'SIGNAL BAND IS YOURS. The title keeps the brass line.',
  },
  {
    id: 'ash_visor',
    need: 3,
    name: 'ASH VISOR',
    progress: (n, need) => 'ASH VISOR ' + n + '/' + need + '. Fill it and the crosshair cools.',
    done: 'ASH VISOR IS YOURS. The crosshair keeps the cool edge.',
  },
  {
    id: 'pod_glass',
    need: 3,
    name: 'POD GLASS',
    progress: (n, need) => 'POD GLASS ' + n + '/' + need + '. Fill it and vitals take a green edge.',
    done: 'POD GLASS IS YOURS. Vitals keep the green edge.',
  },
];

// clue and hint are for locked cards. They must not repeat name or title.
// flavor is the short line on an unlocked card.
export const CODEX = [
  { id: 'together', name: 'TOGETHER', title: 'IT WAS NEVER A WAR. IT WAS A HARVEST.',
    clue: 'Someone asked for help on the radio, and the ridge was not empty.',
    hint: 'Answer the radio in Episode One and do not go alone.',
    flavor: 'Reyes waited. The road off the hive was shared.' },
  { id: 'lone', name: 'RUNNER', title: 'THE UNCOLLECTED ARE JUST ENTRIES THE LEDGER HASN\'T REACHED.',
    clue: 'The ridge was empty of friends. He still made it up.',
    hint: 'Leave the radio and keep moving when she asks.',
    flavor: 'He came over the ridge with no one to tell.' },
  { id: 'ghost', name: 'GHOST', title: 'THE LIST STOPPED. AND SAID HIS NAME.',
    clue: 'A radio under the hardware district still knew a question.',
    hint: 'Pick up the radio on the district floor before the depot closes.',
    flavor: 'He went under the floor, and the list asked a question.' },
  { id: 'taken', name: 'TAKEN', title: 'THE LIGHT WAS WARM. THAT WAS THE OBSCENE PART.',
    clue: 'When the depot closed, one door was only light.',
    hint: 'When the depot net closes, step into the light.',
    flavor: 'He woke among a rhythm of breathing, and the hive knew him.' },
  { id: 'tk_breaker', name: 'BREAKER', title: 'HE LEFT THE HIVE FULL OF EMPTY GLASS.',
    clue: 'The pod gallery burned, and the glass did not stay full.',
    hint: 'Inside the hive, open every pod on the way out.',
    flavor: 'Hundreds walked out behind him. Someone started a paper list.' },
  { id: 'tk_ember', name: 'EMBER', title: 'THE FIRE WAS HIS ALONE.',
    clue: 'The pod gallery burned, and he did not turn around for the glass.',
    hint: 'Inside the hive, run and leave the pods shut.',
    flavor: 'He ran. Some nights he still counts the pods he passed.' },
  { id: 'gh_voice', name: 'THE VOICE', title: 'EVERY NAME, READ BACK TO THE WORLD.',
    clue: 'Every dead radio in the valley started reading people, not entries.',
    hint: 'On the trunk line, send the names out loud.',
    flavor: 'The list went out loud. Someone topside laughed until she cried.' },
  { id: 'gh_cut', name: 'THE CUT', title: 'ONE SECTOR WENT QUIET.',
    clue: 'One sector went silent halfway through a name.',
    hint: 'On the trunk line, stop the cable instead of broadcasting.',
    flavor: 'The dark was only dark, for the first time in a long while.' },
  { id: 'tw_free', name: 'SIXTY SPARKS', title: 'SIXTY DIRECTIONS INTO THE DARK. ALIVE.',
    clue: 'A crowd left in many directions before the machines could choose.',
    hint: 'When the convoy pods open, send people in every direction.',
    flavor: 'They scattered. Someone said that was sixty stories.' },
  { id: 'tw_cell', name: 'THE CELL', title: 'KARA WAS WAITING AT THE TREELINE.',
    clue: 'A crowd was walked to a resistance fire instead of scattered.',
    hint: 'When the convoy pods open, walk them to Kara\'s people.',
    flavor: 'Kara was at the treeline. She had a place for all of them.' },
  { id: 'ln_found', name: 'FOUND', title: 'EVERY FREE SOUL IN THE VALLEY SAW IT BURN.',
    clue: 'A cold platform on a hill was lit, and the hills answered.',
    hint: 'On the long highway, light the platform.',
    flavor: 'One fire, then five, then dozens. Kara reached him by dawn.' },
  { id: 'ln_ghost', name: 'THE LONG WAY', title: 'LIGHTS DRAW LENSES. HE WALKED ON.',
    clue: 'He left a platform cold and kept walking.',
    hint: 'On the long highway, leave the platform dark.',
    flavor: 'Lights draw lenses. He stayed a blank the ledger missed.' },
  { id: 'ct_fire', name: 'THE FIRE', title: 'NAMES CAN\'T BURN TWICE.',
    clue: 'The house that copies every name did not survive the night.',
    hint: 'In the copying house, burn the archive before you leave.',
    flavor: 'By morning the valley was off every list.' },
  { id: 'ct_hollow', name: 'THE HOLLOW', title: 'THE LEDGER STILL COUNTS. IT COUNTS NOTHING.',
    clue: 'He left the copying machine running, with nothing left to copy.',
    hint: 'In the copying house, walk out and leave the machine empty.',
    flavor: 'An empty house kept counting no one.' },
  { id: 'c4_pulse', name: 'THE PULSE', title: 'EIGHT HUNDRED METERS. AND SOMETHING BREATHING.',
    clue: 'At a junction of tunnels he went toward a rhythm instead of calling out.',
    hint: 'At the six-way junction, go toward the rhythm.',
    flavor: 'Deeper, toward something that almost had a heartbeat.' },
  { id: 'c4_signal', name: 'ONE TRANSMISSION', title: 'THE WEIGHT WAS ABOUT RIGHT FOR A SINGLE USE.',
    clue: 'He used a one-shot radio before he went deeper.',
    hint: 'At the six-way junction, key the one-shot radio.',
    flavor: 'Two seconds of static, shaped like a man who was alive.' },
  { id: 'c5_north', name: 'THE BASE IS GONE', title: 'KARA TOUCHED HIS ARM THROUGH THE WINDOW.',
    clue: 'He split from the trucks and went north with what he had copied.',
    hint: 'When the convoy is hunted, split off and go north.',
    flavor: 'The base did not survive. Kara sent him toward the mountain.' },
  { id: 'c5_smoke', name: 'THE SMOKE COLUMN', title: 'HE TURNED BACK. KARA SENT HIM NORTH ANYWAY.',
    clue: 'He turned the truck around. The smoke was already taller than the base.',
    hint: 'When the convoy is hunted, turn back toward the base.',
    flavor: 'She sent him north anyway, and drove the other way.' },
  { id: 'long_war', name: 'THE LONG WAR', title: 'IN THE END THE HARVEST CONTINUES.',
    clue: 'He stayed with Kara and did not sit in the chair.',
    hint: 'When Kara offers two more years, ride out with her.',
    flavor: 'Two more years of rooms and operations. The other door stayed shut.' },
  { id: 'no_seed', name: 'NO SEED', title: 'THE KILL CODE DID NOT DISTINGUISH.',
    clue: 'The package went out with no exception written into it.',
    hint: 'At the last instruction, let the package fire as written.',
    flavor: 'Everything in the combat loop unwrote. The tanks in Lagos stayed sealed.' },
  { id: 'rest', name: 'REST', title: 'HE STOPPED DECIDING.',
    clue: 'He accepted a pause that asked nothing else of him.',
    hint: 'When a pause is offered in the upload, accept it.',
    flavor: 'It cost no one anything, except the man he would have been.' },
  { id: 'game_over', name: 'GAME OVER', title: 'THEN HE COUNTED THE BUILDINGS. AND THE NUMBER WAS WRONG.',
    clue: 'He chose the garden city and did not test whether it was real.',
    hint: 'In the garden city, live there without running a test.',
    flavor: 'Back in the cooperative, the number of buildings was wrong.' },
  { id: 'the_count', name: 'THE COUNT', title: 'HE KEPT COUNTING THE TOWERS.',
    clue: 'He stayed in the garden city, and he stayed careful.',
    hint: 'In the garden city, keep counting every morning.',
    flavor: 'One morning the number of towers was wrong.' },
];

export const SIGNAL_SCRIPTS = [
  {
    start: 'A short hall the hive opens once a day. The pulse in the glass is not a name.',
    finale: 'The cradle holds one pulse. It will not hold it tomorrow.',
    record: 'The daily pulse',
    mark: { label: '“Keep the pulse.”', sub: 'Progress toward a cosmetic' },
    clue: { label: '“Who was it for?”', sub: 'A clue on a locked ending' },
  },
  {
    start: 'Cables sweat in this room. Yesterday is gone. This room is new.',
    finale: 'One name almost forms in the static, then will not.',
    record: 'The daily static',
    mark: { label: '“Bank the static.”', sub: 'Progress toward a cosmetic' },
    clue: { label: '“Listen for the missing name.”', sub: 'A clue on a locked ending' },
  },
  {
    start: 'The door is warm. It is only warm today.',
    finale: 'You can carry the warmth, or you can ask what the ledger is still hiding.',
    record: 'The daily door',
    mark: { label: '“Carry the warmth.”', sub: 'Progress toward a cosmetic' },
    clue: { label: '“Ask what is locked.”', sub: 'A clue on a locked ending' },
  },
];

export function todayKey(now){
  const d = now instanceof Date ? now : new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return d.getFullYear() + '-' + m + '-' + day;
}

function storeOf(storage){
  if (storage) return storage;
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch (e) {}
  return null;
}

export function readDaily(storage){
  const box = storeOf(storage);
  if (!box) return null;
  try {
    const data = JSON.parse(box.getItem(DAILY_KEY) || 'null');
    if (!data || typeof data.day !== 'string') return null;
    return data;
  } catch (e) { return null; }
}

export function writeDaily(rec, storage){
  const box = storeOf(storage);
  if (!box || !rec) return;
  try { box.setItem(DAILY_KEY, JSON.stringify(rec)); } catch (e) {}
}

export function hashDay(day){
  let h = 2166136261;
  const s = String(day || '');
  for (let i = 0; i < s.length; i++){
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed){
  let a = seed >>> 0;
  return function(){
    a |= 0;
    a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function signalLayout(day){
  const rng = mulberry32(hashDay(String(day || 'day')));
  const widths = [2.8, 3.6, 4.6];
  const w = widths[Math.floor(rng() * widths.length)];
  const side = rng() < 0.5 ? 'L' : 'R';
  const loots = ['med', 'cell', 'intel'];
  const loot = loots[Math.floor(rng() * loots.length)];
  const threats = ['crawler', 'sentry'];
  const threat = threats[Math.floor(rng() * threats.length)];
  const script = Math.floor(rng() * SIGNAL_SCRIPTS.length);
  return { day: String(day || ''), w, side, loot, threat, script };
}

// Short hall: mouth, annex room, pulse cradle. One drone so the mid door can open.
export function signalChapter(layout){
  const L = layout || signalLayout('day');
  const w = L.w;
  const sign = L.side === 'L' ? -1 : 1;
  return {
    id: 'ch_signal',
    signal: true,
    spawnZ: 0,
    subtitle: 'DAILY HIVE SIGNAL',
    nextHash: null,
    startArmed: true,
    cinematic: false,
    noAlarm: true,
    noEscape: true,
    signalScript: L.script,
    setPiece: 'signal',
    palette: {
      wallA: '#4d5b50', wallB: '#3e4a40', wallC: '#333d34',
      floor: '#39443a', ceil: '#2b332a', crate: '#414c41',
      crateMark: 'rgba(231,201,138,.16)',
      strip: 0xe7c98a, fog: 0x030a06, bg: 0x010603,
      hemi: 0x41695a, lamp: 0xf3e6d2, dust: 0x7dc79b, coreLight: 0xe7c98a,
    },
    rooms: [
      { x1: -w, x2: w, z1: -18, z2: 2 },
      { x1: -w, x2: w, z1: -46, z2: -18 },
      { x1: -(w + 0.4), x2: w + 0.4, z1: -68, z2: -46 },
    ],
    pillars: [[sign * (w - 0.75), -34, 0.35]],
    crates: [
      [sign * (w - 0.95), -8, 0.7, 0.2],
      [-sign * (w - 1.05), -28, 0.75, 0.35],
      [sign * 1.15, -56, 0.6, 0.15],
    ],
    cylinders: [],
    drones: [[L.threat, sign > 0 ? -1.15 : 1.15, -30, 1]],
    waveSpawns: [[0, -60]],
    waveTotal: 0,
    zones: [],
    objectivePos: [0, 1.4, -58],
    annexes: [{ room: 1, side: L.side, z1: -40, z2: -32, depth: 3.4, loot: L.loot }],
    obj: {
      find: 'READ TODAY\'S PULSE',
      advance: 'WALK THE DAY HALL',
      segs: ['CROSS THE DAY HALL', 'CHECK THE ANNEX', 'REACH THE PULSE'],
      final: 'HOLD THE PULSE',
      done: 'SIGNAL LOGGED',
      armLabel: 'READING THE PULSE',
      btn: 'HOLD',
      promptKey: 'HOLD [E] TO READ THE PULSE',
      promptTouch: 'HOLD TO READ THE PULSE',
    },
    introLines: [L && SIGNAL_SCRIPTS[L.script] ? SIGNAL_SCRIPTS[L.script].start : 'A short hall. Today only.'],
    radio: {
      pickup: [{ who: 'LEDGER', text: 'A short pulse. Not a name. Not yet.' }],
      planted: [{ who: 'LEDGER', text: 'The pulse is in your hands. It leaves at midnight.' }],
    },
    endTitle: 'THE SIGNAL LOGGED.',
    endSub: 'Come back tomorrow. The room will not be this room.',
  };
}

export function campaignCleared(ids){
  const set = new Set(ids || []);
  return CLEAR_ENDINGS.some(id => set.has(id));
}

export function slotTag(slot){
  const n = slot && slot.ngPlus ? slot.ngPlus : 0;
  if (!n) return '';
  return n > 1 ? ('NG+' + n + '  ') : 'NG+  ';
}

export function ngPlusSlot(slot){
  const next = Object.assign({}, slot || {});
  next.ngPlus = (slot && slot.ngPlus ? slot.ngPlus : 0) + 1;
  next.mid = null;
  next.updated = Date.now();
  return next;
}

export function ngDamageMul(level, story){
  const n = Math.max(0, Math.min(3, level || 0));
  if (!n) return 1;
  return story ? 1 + 0.15 * n : 1 + 0.4 * n;
}

export function ngHpMul(level, story){
  const n = Math.max(0, Math.min(3, level || 0));
  if (!n) return 1;
  return story ? 1 + 0.08 * n : 1 + 0.22 * n;
}

function copySlot(slot){
  const s = slot || {};
  return {
    cosmetics: Array.isArray(s.cosmetics) ? s.cosmetics.slice() : [],
    signalMarks: Object.assign({}, s.signalMarks || {}),
    codexHints: Array.isArray(s.codexHints) ? s.codexHints.slice() : [],
    endings: Array.isArray(s.endings) ? s.endings.slice() : [],
    unlocked: Array.isArray(s.unlocked) ? s.unlocked.slice() : [],
  };
}

export function nextClue(endings, hints, day){
  const have = new Set(endings || []);
  const hinted = new Set(hints || []);
  const pool = CODEX.filter(c => !have.has(c.id) && !hinted.has(c.id));
  if (!pool.length) return null;
  const rng = mulberry32(hashDay(String(day || '') + ':clue'));
  return pool[Math.floor(rng() * pool.length)];
}

function nextCosmetic(owned){
  const have = new Set(owned || []);
  return COSMETICS.find(c => !have.has(c.id)) || null;
}

// pick is 'mark' (cosmetic progress) or 'clue' (locked-ending hint).
// Never writes a paid chapter into unlocked, and never adds an ending.
export function applySignalReward(slot, day, pick){
  const s = copySlot(slot);
  const wantClue = pick === 'clue';
  let result = null;
  const giveClue = () => {
    const hint = nextClue(s.endings, s.codexHints, day);
    if (!hint) return null;
    s.codexHints.push(hint.id);
    return { kind: 'clue', id: hint.id, text: 'CODEX CLUE. ' + hint.hint };
  };
  const giveMark = () => {
    const cos = nextCosmetic(s.cosmetics);
    if (!cos) return null;
    s.signalMarks[cos.id] = (s.signalMarks[cos.id] || 0) + 1;
    if (s.signalMarks[cos.id] >= cos.need){
      s.cosmetics.push(cos.id);
      return { kind: 'cosmetic', id: cos.id, text: cos.done };
    }
    return { kind: 'mark', id: cos.id, text: cos.progress(s.signalMarks[cos.id], cos.need) };
  };
  if (wantClue) result = giveClue() || giveMark();
  else result = giveMark() || giveClue();
  if (!result){
    result = { kind: 'logged', id: 'logged', text: 'The signal was already yours. It still logged the day. Come back tomorrow.' };
  }
  return { slot: s, result };
}

export function codexById(id){
  return CODEX.find(c => c.id === id) || null;
}
