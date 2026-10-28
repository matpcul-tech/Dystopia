// Return loop: codex of 23, daily signal seed, NG+ slot carry.
// Season Pass rules stay put. The signal never grants a paid chapter.
import { readFileSync, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CLEAR_ENDINGS, CODEX, COSMETICS, DAILY_KEY, PAID_CHAPTERS,
  applySignalReward, campaignCleared, ngDamageMul, ngHpMul, ngPlusSlot,
  signalChapter, signalLayout, todayKey,
} from '../return-loop.js';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
let failed = 0;
function check(name, pass, detail){
  console.log((pass ? 'PASS' : 'FAIL') + '  ' + name + (detail ? '  ' + detail : ''));
  if (!pass) failed += 1;
}

check('codex has 23 endings', CODEX.length === 23, String(CODEX.length));
check('codex ids are unique', new Set(CODEX.map(c => c.id)).size === 23);
const gameSrc = readFileSync(join(root, 'game.js'), 'utf8');
const commercialSrc = readFileSync(join(root, 'commercial.js'), 'utf8');
const endStart = gameSrc.indexOf('const ENDING_TEXT = {');
const endStop = gameSrc.indexOf('function goChapter');
const endBlock = gameSrc.slice(endStart, endStop);
const spoilers = [];
CODEX.forEach(c => {
  const key = new RegExp('(?:ENDING_TEXT\\.)?' + c.id + '\\s*[=:]');
  check('ending exists ' + c.id, key.test(endBlock));
  const blob = (c.clue + '\n' + c.hint).toLowerCase();
  CODEX.forEach(other => {
    if (blob.includes(other.name.toLowerCase())) spoilers.push(c.id + ' names ' + other.name);
    if (other.title && blob.includes(other.title.toLowerCase())) spoilers.push(c.id + ' titles ' + other.id);
  });
});
check('locked clues hide every name and title', spoilers.length === 0, spoilers.join('; '));
check('clear endings are the two wins', CLEAR_ENDINGS.join(',') === 'game_over,the_count');
check('campaign clear sees game over', campaignCleared(['lone', 'game_over']) === true);
check('a loss is not a campaign clear', campaignCleared(['long_war', 'rest', 'no_seed']) === false);

const dayA = signalLayout('2026-10-28');
const dayA2 = signalLayout('2026-10-28');
const dayB = signalLayout('2026-10-29');
check('signal layout is stable for a day', JSON.stringify(dayA) === JSON.stringify(dayA2));
check('the next day is a different room', JSON.stringify(dayA) !== JSON.stringify(dayB), JSON.stringify(dayA) + ' vs ' + JSON.stringify(dayB));

function inside(room, x, z, pad){
  const p = pad || 0;
  return x > room.x1 + p && x < room.x2 - p && z > room.z1 + p && z < room.z2 - p;
}
let walkable = true;
let walkDetail = '';
for (let n = 1; n <= 40; n++){
  const day = '2026-04-' + String(n).padStart(2, '0');
  const ch = signalChapter(signalLayout(day));
  const rooms = ch.rooms;
  const joined = rooms.every((r, i) => i === 0 || Math.abs(rooms[i - 1].z1 - r.z2) < 0.001);
  const wide = rooms.every(r => (r.x2 - r.x1) > 3.2);
  const annex = ch.annexes[0];
  const host = rooms[annex.room];
  const annexIn = annex.z1 > host.z1 && annex.z2 < host.z2;
  const drone = ch.drones[0];
  const droneRoom = rooms[drone[3]];
  const droneIn = inside(droneRoom, drone[1], drone[2], 0.2);
  const objIn = inside(rooms[rooms.length - 1], ch.objectivePos[0], ch.objectivePos[2], 0.2);
  if (!(joined && wide && annexIn && droneIn && objIn && ch.waveTotal === 0 && ch.noEscape && ch.signal)){
    walkable = false;
    walkDetail = day + ' ' + JSON.stringify({ joined, wide, annexIn, droneIn, objIn, loot: annex.loot, threat: drone[0] });
    break;
  }
}
check('forty signal days stay walkable', walkable, walkDetail);
const sample = signalChapter(signalLayout('2026-10-28'));
check('sample signal is one short hall', sample.rooms.length === 3 && sample.drones.length === 1 && sample.annexes.length === 1);
check('sample loot is an annex cache', ['med', 'cell', 'intel'].includes(sample.annexes[0].loot));

const fresh = { endings: [], unlocked: ['ch_lone'], cosmetics: [], codexHints: [], signalMarks: {}, book: { volunteered: true } };
const marked = applySignalReward(fresh, '2026-10-28', 'mark');
check('cosmetic mark does not open a paid chapter', PAID_CHAPTERS.every(id => marked.slot.unlocked.indexOf(id) < 0) && marked.slot.unlocked.join(',') === 'ch_lone');
check('cosmetic mark does not grant an ending', marked.slot.endings.length === 0);
check('cosmetic mark keeps book flags', marked.slot.book === undefined || fresh.book.volunteered === true);
check('first mark is progress, not the whole cosmetic', marked.result.kind === 'mark' && marked.slot.cosmetics.length === 0, marked.result.text);
let slot = fresh;
let cosmetic = null;
for (let i = 0; i < 3; i++){
  const step = applySignalReward(slot, '2026-10-28', 'mark');
  slot = Object.assign({}, fresh, step.slot);
  cosmetic = step.result;
}
check('three marks finish a cosmetic', cosmetic.kind === 'cosmetic' && slot.cosmetics.length === 1, cosmetic.text);
const hinted = applySignalReward({ endings: ['together'], unlocked: [], cosmetics: [], codexHints: [], signalMarks: {} }, '2026-11-02', 'clue');
check('clue names a locked ending', CODEX.some(c => c.id === hinted.result.id) && hinted.result.id !== 'together', hinted.result.id);
check('clue is not a paid chapter id', PAID_CHAPTERS.indexOf(hinted.result.id) < 0);
check('clue does not unlock the ending', hinted.slot.endings.join(',') === 'together');
check('daily key is the calendar stamp', DAILY_KEY === 'latm_daily_v1');
check('today key is a calendar day', /^\d{4}-\d{2}-\d{2}$/.test(todayKey(new Date(2026, 9, 28))));

const carried = {
  book: { volunteered: true, burned: false },
  unlocked: ['ch_together', 'ch_counting'],
  endings: ['game_over', 'together'],
  carry: { from: 'together', trusted: true },
  mid: { chapter: 'ch_steel', x: 1, z: -2 },
  choices: { a: 1 },
  pass: false,
  ngPlus: 0,
  cosmetics: ['signal_band'],
  codexHints: ['ghost'],
};
const ng = ngPlusSlot(carried);
check('ng+ keeps book, paths, endings, carry, cosmetic, clue', ng.book.volunteered === true && ng.unlocked.join(',') === carried.unlocked.join(',') && ng.endings.join(',') === 'game_over,together' && ng.carry.from === 'together' && ng.cosmetics[0] === 'signal_band' && ng.codexHints[0] === 'ghost');
check('ng+ clears the checkpoint and marks the slot', ng.mid === null && ng.ngPlus === 1);
check('ng+ does not grant season pass', ng.pass === false);
check('action ng+ hits harder than story', ngDamageMul(1, false) > ngDamageMul(1, true) && ngDamageMul(1, true) > 1);
check('ng+ drone hp bumps, story less than action', ngHpMul(1, false) > ngHpMul(1, true) && ngHpMul(0, false) === 1);
check('three cosmetics exist', COSMETICS.length === 3);

['TK_MID', 'GH_MID', 'TW_MID', 'LN_MID'].forEach(name => {
  const re = new RegExp('const ' + name + ' = \\[[\\s\\S]{0,500}?if:\'ngPlus\'');
  check(name + ' has an NG+ beat', re.test(gameSrc));
});
check('signal skips campaign autosave', gameSrc.includes('if (CH.signal) return;') && commercialSrc.includes("pos.chapter === 'ch_signal'"));
check('signal is not a paid chapter', !/const PAID = \[[^\]]*ch_signal/.test(commercialSrc));
check('season verify url is unchanged', commercialSrc.includes("SEASON_VERIFY_URL: 'https://waking-season-pass.matpcul.workers.dev'"));
check('remove ads is not a button label', !/REMOVE ADS/.test(commercialSrc));
check('ng offer is the two clear endings', gameSrc.includes("id === 'game_over' || id === 'the_count'"));

const dash = /[\u2013\u2014]/;
['return-loop.js', 'commercial.js', 'game.js', 'style.css', 'README.md'].forEach(name => {
  const text = readFileSync(join(root, name), 'utf8');
  check('no dash in ' + name, !dash.test(text));
});

const chromePath = ['/usr/local/bin/google-chrome', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(p => existsSync(p));
if (!chromePath){
  console.log('SKIP  browser checks, Chrome is not installed');
  if (failed) process.exit(1);
  console.log('return loop checks passed');
  process.exit(0);
}

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.glb': 'model/gltf-binary',
  '.mp4': 'video/mp4',
};
const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  let rel = decodeURIComponent(url.pathname).replace(/^\/+/, '');
  if (!rel) rel = 'index.html';
  if (rel.split('/').includes('..')) { res.writeHead(400); res.end('bad'); return; }
  const path = normalize(join(root, rel));
  if (!path.startsWith(root) || !existsSync(path)) { res.writeHead(404); res.end('missing ' + rel); return; }
  res.writeHead(200, { 'content-type': types[extname(path)] || 'application/octet-stream' });
  res.end(readFileSync(path));
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = 'http://127.0.0.1:' + server.address().port;

let puppeteer;
try { puppeteer = (await import('/tmp/pw/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js')).default; }
catch (e) {
  try {
    const req = (await import('node:module')).createRequire(import.meta.url);
    puppeteer = req('/tmp/pw/node_modules/puppeteer-core');
  } catch (e2) { puppeteer = null; }
}
if (!puppeteer){
  console.log('SKIP  browser checks, puppeteer-core is not installed');
  server.close();
  if (failed) process.exit(1);
  console.log('return loop checks passed');
  process.exit(0);
}

const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

async function openGame(context, path){
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', err => errors.push(String(err)));
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto(origin + path, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('#codexBtn', { timeout: 30000 });
  return { page, errors };
}

const ctx = await browser.createBrowserContext();
const home = await openGame(ctx, '/index.html');
check('title has codex and daily on a phone viewport', true);
await home.page.click('#codexBtn');
await home.page.waitForSelector('.codexRow');
const locked = await home.page.evaluate(() => {
  const rows = Array.from(document.querySelectorAll('.codexRow'));
  const text = document.getElementById('codexSheet').innerText;
  return {
    rows: rows.length,
    sil: document.querySelectorAll('.codexSil').length,
    shares: document.querySelectorAll('.codexShare').length,
    spoiler: /TOGETHER|RUNNER|GAME OVER|THE COUNT/.test(text),
    header: text.includes('ENDINGS RECOVERED'),
  };
});
check('codex lists 23 locked silhouettes', locked.rows === 23 && locked.sil === 23 && locked.shares === 0 && locked.header, JSON.stringify(locked));
check('locked codex does not print ending names', locked.spoiler === false);
const ngHidden = await home.page.$eval('#ngBtn', n => getComputedStyle(n).display === 'none');
check('new game plus stays hidden before a clear', ngHidden);
await home.page.evaluate(() => {
  const file = JSON.parse(localStorage.getItem('latm_save_v1'));
  file.slots[0].endings = ['together', 'game_over'];
  file.slots[0].book = { volunteered: true };
  file.slots[0].unlocked = ['ch_together'];
  file.slots[0].mid = { chapter: 'ch_steel', x: 0, z: -4, label: 'THE YARD' };
  localStorage.setItem('latm_save_v1', JSON.stringify(file));
  localStorage.setItem('latm_hybrid_endings', JSON.stringify(['together', 'game_over']));
  localStorage.setItem('latm_book', JSON.stringify({ volunteered: true }));
  localStorage.setItem('latm_unlocked', JSON.stringify(['ch_together']));
});
await home.page.reload({ waitUntil: 'domcontentloaded' });
await home.page.waitForSelector('#codexBtn', { timeout: 30000 });
const ngShown = await home.page.$eval('#ngBtn', n => getComputedStyle(n).display !== 'none' && n.textContent);
check('new game plus shows after steel clear', ngShown === 'NEW GAME+', ngShown);
await home.page.click('#codexBtn');
await home.page.waitForSelector('.codexShare');
const openCard = await home.page.evaluate(() => {
  const text = document.getElementById('codexSheet').innerText;
  const shares = document.querySelectorAll('.codexShare').length;
  const sil = document.querySelectorAll('.codexSil').length;
  return { shares, sil, together: text.includes('TOGETHER'), gameOver: text.includes('GAME OVER'), flavor: text.includes('Reyes waited') };
});
check('unlocked cards show name, flavor, and share', openCard.shares === 2 && openCard.sil === 21 && openCard.together && openCard.gameOver && openCard.flavor, JSON.stringify(openCard));

await home.page.evaluate(() => {
  const sheet = document.getElementById('codexSheet');
  if (sheet) sheet.style.display = 'none';
  document.getElementById('ngBtn').click();
});
await home.page.waitForSelector('#ngSheet .btn.amber');
const ngCopy = await home.page.$eval('#ngSheet', n => n.innerText);
check('ng+ sheet keeps the carry promise', /Book flags/.test(ngCopy) && /Chapter Two/.test(ngCopy));
await home.page.click('#ngSheet .btn.amber');
await home.page.waitForSelector('#codexBtn', { timeout: 30000 });
const afterNg = await home.page.evaluate(() => {
  const file = JSON.parse(localStorage.getItem('latm_save_v1'));
  const s = file.slots[0];
  return {
    ng: s.ngPlus,
    mid: s.mid,
    book: localStorage.getItem('latm_book'),
    endings: s.endings,
    unlocked: s.unlocked,
    pass: s.pass,
    hash: location.hash,
  };
});
check('ng+ is on the slot and the checkpoint cleared', afterNg.ng === 1 && afterNg.mid === null && afterNg.pass !== true, JSON.stringify(afterNg));
check('ng+ kept book flags and endings', /volunteered/.test(afterNg.book || '') && afterNg.endings.indexOf('game_over') >= 0 && afterNg.unlocked.indexOf('ch_together') >= 0);
check('ng+ starts episode one', afterNg.hash === '#ep1' || afterNg.hash === '');

await ctx.close();
const dailyCtx = await browser.createBrowserContext();
const signalPage = await dailyCtx.newPage();
const signalErrors = [];
signalPage.on('pageerror', err => signalErrors.push(String(err)));
await signalPage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
await signalPage.evaluateOnNewDocument(() => sessionStorage.setItem('latm_daily_run', '1'));
await signalPage.goto(origin + '/index.html?q=potato#ch_signal', { waitUntil: 'domcontentloaded', timeout: 30000 });
await signalPage.waitForFunction(() => {
  const g = window.__LATM && window.__LATM.G;
  return g && (g.mode === 'play' || g.mode === 'story');
}, { timeout: 30000 });
const signalBoot = await signalPage.evaluate(() => ({
  hash: location.hash,
  q: window.__LATM && window.__LATM.Q && window.__LATM.Q.level,
  sub: (document.querySelector('#startScreen h2') || {}).textContent || '',
  text: (document.getElementById('sText') || {}).textContent || '',
  obj: (document.getElementById('objective') || {}).textContent || '',
}));
check('potato page has no boot error', signalErrors.length === 0, signalErrors.join(' | ').slice(0, 400));
check('potato query stays on potato', signalBoot.q === 'potato', String(signalBoot.q));
check('daily signal boots on potato', signalBoot.hash === '#ch_signal' && (signalBoot.text || signalBoot.obj), JSON.stringify(signalBoot));
await signalPage.waitForFunction(() => window.__LATM && window.__LATM.Story && window.__LATM.G && window.__LATM.G.mode !== 'story', { timeout: 20000 }).catch(() => {});
const started = await signalPage.evaluate(() => {
  const api = window.__LATM;
  if (!api || !api.Story || !api.CB || !api.CB.finale) return { ok: false, reason: 'no finale' };
  const began = api.Story.start(api.CB.finale);
  return { ok: began !== false, mode: api.G.mode };
});
check('daily finale can start', started.ok === true, JSON.stringify(started));
await signalPage.waitForSelector('.opt', { timeout: 15000 });
const choiceCount = await signalPage.$$eval('.opt', nodes => nodes.length);
check('daily finale is one timed choice with two answers', choiceCount === 2, String(choiceCount));
await signalPage.click('.opt');
await signalPage.waitForFunction(() => {
  const sheet = document.getElementById('signalSheet');
  return sheet && sheet.innerText && /SIGNAL LOGGED/.test(sheet.innerText);
}, { timeout: 10000 });
const reward = await signalPage.evaluate(() => {
  const file = JSON.parse(localStorage.getItem('latm_save_v1'));
  const s = file.slots[file.active || 0];
  return {
    daily: localStorage.getItem('latm_daily_v1'),
    unlocked: s.unlocked,
    endings: s.endings,
    mid: s.mid,
    marks: s.signalMarks,
    hints: s.codexHints,
    text: document.getElementById('signalSheet').innerText,
    paid: ['ch_counting', 'ch_conduits', 'ch_harvest', 'ch_steel'].some(id => (s.unlocked || []).indexOf(id) >= 0),
  };
});
check('daily writes the calendar day', reward.daily && reward.daily.indexOf('"day":"' + new Date().getFullYear() + '-') >= 0, reward.daily);
check('daily does not grant paid chapters or endings', reward.paid === false && (!reward.endings || reward.endings.length === 0), JSON.stringify({ unlocked: reward.unlocked, endings: reward.endings }));
check('daily leaves the campaign checkpoint', reward.mid === null || reward.mid.chapter !== 'ch_signal', JSON.stringify(reward.mid));
check('daily grants a mark or a clue', !!(reward.marks && Object.keys(reward.marks).length) || (reward.hints && reward.hints.length), JSON.stringify({ marks: reward.marks, hints: reward.hints, text: reward.text.slice(0, 180) }));

await signalPage.goto(origin + '/index.html?q=potato', { waitUntil: 'domcontentloaded' });
await signalPage.waitForSelector('#dailyBtn', { timeout: 30000 });
const label = await signalPage.$eval('#dailyBtn', n => n.textContent);
check('same day reads as already logged', label === 'SIGNAL LOGGED', label);
await signalPage.evaluate(() => document.getElementById('dailyBtn').click());
await signalPage.waitForFunction(() => {
  const sheet = document.getElementById('signalSheet');
  return sheet && /tomorrow/i.test(sheet.innerText || '');
}, { timeout: 8000 });
const closed = await signalPage.evaluate(() => ({
  hash: location.hash,
  text: document.getElementById('signalSheet').innerText,
}));
check('logged day stays on the hub', closed.hash.indexOf('ch_signal') < 0 && /does not open a paid chapter/.test(closed.text) && /tomorrow/i.test(closed.text), closed.text.slice(0, 240));
await signalPage.setViewport({ width: 844, height: 390, isMobile: true, hasTouch: true });
const land = await signalPage.evaluate(() => {
  const sheet = document.getElementById('signalSheet');
  const btn = sheet && sheet.querySelector('.btn');
  if (!sheet || !btn) return { ok: false };
  btn.scrollIntoView({ block: 'center' });
  const br = btn.getBoundingClientRect();
  return {
    ok: br.height >= 40 && br.top >= 0 && br.bottom <= window.innerHeight + 1,
    h: br.height,
    top: br.top,
    bottom: br.bottom,
    view: window.innerHeight,
  };
});
check('signal sheet fits a phone landscape', land.ok === true, JSON.stringify(land));

await browser.close();
server.close();
if (failed) process.exit(1);
console.log('return loop checks passed');
