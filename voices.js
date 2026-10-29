// Speaker voices for radio and story cut-ins.
// SpeechSynthesis in the browser. No audio files. No API key.
// The same name always gets the same pitch and rate. When the
// browser has more than one English voice, each speaker also
// keeps a distinct voice.

export const SPEAKER_VOICES = {
  REYES:     { pitch: 1.16, rate: 1.05, hint: ['samantha', 'victoria', 'zira', 'female'] },
  KARA:      { pitch: 1.02, rate: 0.98, hint: ['karen', 'moira', 'fiona', 'female'] },
  ELENA:     { pitch: 1.28, rate: 0.96, hint: ['tessa', 'serena', 'female'] },
  VERA:      { pitch: 0.90, rate: 0.86, hint: ['fiona', 'victoria', 'female'] },
  THOMAS:    { pitch: 0.78, rate: 0.90, hint: ['daniel', 'alex', 'david', 'male'] },
  MARCUS:    { pitch: 0.94, rate: 1.00, hint: ['aaron', 'arthur', 'fred', 'male'] },
  LEDGER:    { pitch: 0.52, rate: 0.80, hint: ['ralph', 'fred', 'male'] },
  'OMEGA-7': { pitch: 0.68, rate: 0.86, hint: ['google uk english female', 'female'] },
  HUNTER:    { pitch: 0.42, rate: 0.76, hint: ['daniel', 'male'] },
  NARRATOR:  { pitch: 0.86, rate: 0.93, hint: ['daniel', 'alex', 'male'] },
};

function hash(s){
  let h = 2166136261;
  const str = String(s);
  for (let i = 0; i < str.length; i++){
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function voiceProfile(who){
  const key = String(who || 'NARRATOR').toUpperCase();
  if (SPEAKER_VOICES[key]) return SPEAKER_VOICES[key];
  const h = hash(key);
  return { pitch: 0.80 + (h % 35) / 100, rate: 0.90 + (h % 15) / 100, hint: [] };
}

function voiceId(v){
  return String((v && (v.voiceURI || v.name)) || '');
}

function matches(v, hint){
  const n = String(v && v.name || '').toLowerCase();
  const h = String(hint || '').toLowerCase();
  if (!h) return false;
  if (h === 'male') return n.includes('male') && !n.includes('female');
  if (h === 'female') return n.includes('female');
  return n.includes(h);
}

// Stable assignment. English voices only, sorted by id.
// Each known speaker takes the first unused voice that matches
// a hint. Pitch and rate stay on the profile either way.
export function assignVoices(voices){
  const list = (voices || [])
    .filter(v => v && typeof v.lang === 'string' && v.lang.toLowerCase().startsWith('en'))
    .slice()
    .sort((a, b) => voiceId(a).localeCompare(voiceId(b)));
  const used = new Set();
  const map = {};
  Object.keys(SPEAKER_VOICES).forEach(name => {
    const spec = SPEAKER_VOICES[name];
    let pick = null;
    for (const hint of spec.hint){
      pick = list.find(v => !used.has(voiceId(v)) && matches(v, hint)) || null;
      if (pick) break;
    }
    if (!pick) pick = list.find(v => !used.has(voiceId(v))) || null;
    if (!pick && list.length) pick = list[hash(name) % list.length];
    if (pick) used.add(voiceId(pick));
    map[name] = {
      pitch: spec.pitch,
      rate: spec.rate,
      voiceURI: pick ? voiceId(pick) : '',
      name: pick ? pick.name : '',
    };
  });
  return map;
}

// Names stay names when a line is shouted in capitals.
const SPOKEN_NAMES = {
  marcus: 'Marcus',
  reyes: 'Reyes',
  kara: 'Kara',
  thomas: 'Thomas',
  elena: 'Elena',
  vera: 'Vera',
  david: 'David',
  angela: 'Angela',
  omega: 'Omega',
};

const DIGIT_WORD = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];

// Speech engines spell an all-caps word ("WHO" becomes W H O).
// The card keeps the written line. This is only the spoken copy.
function speakToken(token){
  if (token.length === 1){
    if (token === 'I') return 'I';
    if (token === 'A') return 'a';
    return token;
  }
  const lower = token.toLowerCase();
  return SPOKEN_NAMES[lower] || lower;
}

export function spokenLine(text){
  let s = String(text || '').replace(/^\([^)]*\)\s*/, '').replace(/\s+/g, ' ').trim();
  if (!s) return '';
  // M-1 is a subject code, not the letter M and a minus.
  s = s.replace(/\b([A-Za-z])-(\d)\b/g, (_, letter, digit) => {
    return letter.toUpperCase() + ' ' + DIGIT_WORD[Number(digit)];
  });
  s = s.replace(/\b[A-Z]+(?:['-][A-Z]+)*\b/g, speakToken);
  s = s.replace(/(^|[.?!]\s+)([a-z])/g, (_, lead, ch) => lead + ch.toUpperCase());
  return s;
}
