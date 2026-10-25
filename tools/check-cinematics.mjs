import { existsSync } from 'fs';
import { ARCHIVE, BEATS } from '../cinematics.js';

const chapters = ['ep1','ch_taken','ch_ghost','ch_together','ch_lone','ch_counting','ch_conduits','ch_harvest','ch_steel'];
const errors = [];
function fail(msg){ errors.push(msg); }

const ids = new Set();
for (const b of BEATS){
  if (ids.has(b.id)) fail('duplicate id ' + b.id);
  ids.add(b.id);
  if (b.kind === 'full') fail(b.id + ' is a full episode');
  if (!(b.max >= 8 && b.max <= 20)) fail(b.id + ' max ' + b.max + ' is outside 8 to 20');
  if (!b.cue || b.cue.length !== 2) fail(b.id + ' missing cue');
  else {
    const dur = b.cue[1] - b.cue[0];
    if (!(dur >= 8 && dur <= 20)) fail(b.id + ' cue length ' + dur);
    if (dur > b.max + 0.001) fail(b.id + ' cue longer than max');
  }
  if (b.at === 'room' && !(b.room >= 1)) fail(b.id + ' room beat must be room 1 or later');
  if (b.at === 'open' && b.intro && b.intro.length >= 5) fail(b.id + ' open clip dumps too many intro lines');
  if (!ARCHIVE.some(e => e.id === b.episode)) fail(b.id + ' episode missing');
  const openGame = b.at === 'open' && (b.chapter === 'ch_taken' || b.chapter === 'ch_ghost' || b.chapter === 'ch_counting');
  if (b.chapter === 'ep1' || b.chapter === 'ch_lone' || openGame){
    const ep = ARCHIVE.find(e => e.id === b.episode);
    if (ep && /rsa_ep\d+_720p\.mp4/.test(ep.url || '')) fail(b.id + ' still uses a book RSA short');
    if (!ep || !ep.game) fail(b.id + ' must use a game short');
  }
}

for (const id of chapters){
  const opens = BEATS.filter(b => b.chapter === id && b.at === 'open');
  if (opens.length !== 1) fail(id + ' open count ' + opens.length);
}

for (const ep of ARCHIVE){
  if (ep.url && ep.status !== 'pending' && !existsSync(new URL('../' + ep.url, import.meta.url))) fail(ep.id + ' missing ' + ep.url);
  if (!ep.url && ep.status === 'ready' && ep.id.indexOf('short') === 0) fail(ep.id + ' short has no file');
  const cues = BEATS.filter(b => b.episode === ep.id && !b.textOnly).map(b => b.cue);
  cues.sort((a, b) => a[0] - b[0]);
  for (let i = 1; i < cues.length; i++){
    if (cues[i][0] < cues[i - 1][1]) fail(ep.id + ' cues overlap');
  }
}

if (errors.length){
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('cinematics ok: ' + BEATS.length + ' beat clips, ' + ARCHIVE.length + ' episodes');
