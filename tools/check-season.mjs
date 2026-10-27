// Season Pass rules: bare ?season_pass=1 must not grant, a plausible
// checkout id grants once per browser, the pass survives a slot switch,
// and the pay sheet is opaque with the short line and no Remove Ads button.
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { judgeReturn, judgeSession, plausibleSessionId } from '../season-pass.js';
import worker from '../cloud/season-pass-worker.js';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const LIVE = 'cs_live_abcdefghijklmnopqrst';
const LINK = 'plink_1UV4C7Rc0DOFqzuBoEDJ5Aa7';
const LINE = 'Watch 3 trailers to play this chapter now, or get every chapter with Season Pass.';
let failed = 0;

function check(name, pass, detail){
  console.log((pass ? 'PASS' : 'FAIL') + '  ' + name + (detail ? '  ' + detail : ''));
  if (!pass) failed += 1;
}

check('bare flag is not a grant', judgeReturn('1', '', [], false).action === 'reject');
check('short id is not a grant', judgeReturn('1', 'cs_live_short', [], false).action === 'reject');
check('template id is not a grant', judgeReturn('1', '{CHECKOUT_SESSION_ID}', [], false).action === 'reject');
check('missing flag is ignored', judgeReturn(null, LIVE, [], false).action === 'ignore');
check('live id grants', judgeReturn('1', LIVE, [], false).action === 'grant' && plausibleSessionId(LIVE));
check('test id grants', judgeReturn('1', 'cs_test_abcdefghijklmnopqrst', [], false).action === 'grant');
check('used id does not grant again', judgeReturn('1', LIVE, [LIVE], false).action === 'replay');
check('used id on a pass holder stays already', judgeReturn('1', LIVE, [LIVE], true).action === 'already');
check('pasted return url is the id', judgeSession('https://matpcul-tech.github.io/Dystopia/?season_pass=1&session_id=' + LIVE, [], false).action === 'grant');
check('junk paste rejects', judgeSession('not a receipt', [], false).action === 'reject');

const kv = new Map();
const env = {
  STRIPE_SECRET_KEY: 'sk_test_not_a_real_key',
  SEASON: {
    get(key){ return Promise.resolve(kv.has(key) ? kv.get(key) : null); },
    put(key, value){ kv.set(key, value); return Promise.resolve(); },
  },
};
const realFetch = globalThis.fetch;
globalThis.fetch = async (url) => {
  const id = String(url).split('/').pop();
  if (id === LIVE) {
    return { ok: true, json: async () => ({ payment_status: 'paid', status: 'complete', payment_link: LINK, customer_details: { email: 'Reader@Example.com' } }) };
  }
  if (id === 'cs_live_unpaidunpaidunp') {
    return { ok: true, json: async () => ({ payment_status: 'unpaid', status: 'open', payment_link: LINK }) };
  }
  if (id === 'cs_live_otherlinkotherli') {
    return { ok: true, json: async () => ({ payment_status: 'paid', status: 'complete', payment_link: 'plink_other' }) };
  }
  return { ok: false, json: async () => ({}) };
};

function callWorker(body){
  return worker.fetch(new Request('https://worker.test/season', {
    method: 'POST',
    headers: { origin: 'https://matpcul-tech.github.io', 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }), env);
}

const paid = await callWorker({ session_id: LIVE });
const paidBody = await paid.json();
check('worker grants a paid link session', paid.status === 200 && paidBody.pass === true, JSON.stringify(paidBody));
const again = await callWorker({ session_id: LIVE });
check('worker burns the id', again.status === 409 && (await again.json()).pass === false);
const unpaid = await callWorker({ session_id: 'cs_live_unpaidunpaidunp' });
check('worker rejects unpaid', unpaid.status === 402 && (await unpaid.json()).pass === false);
const other = await callWorker({ session_id: 'cs_live_otherlinkotherli' });
check('worker rejects a different payment link', other.status === 402);
const mail = await callWorker({ email: 'reader@example.com' });
check('worker restores by receipt email', mail.status === 200 && (await mail.json()).pass === true);
const stranger = await callWorker({ email: 'nope@example.com' });
check('worker does not invent an email pass', stranger.status === 404 && (await stranger.json()).pass === false);
const emptyBody = await callWorker({});
check('worker rejects an empty body', emptyBody.status === 400);
globalThis.fetch = realFetch;

const chromePath = ['/usr/local/bin/google-chrome', '/usr/bin/google-chrome'].find(p => existsSync(p));
if (!chromePath) {
  console.log('SKIP  browser checks, Chrome is not installed');
  if (failed) process.exit(1);
  console.log('season checks passed');
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
const harness = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><link rel="stylesheet" href="/style.css"></head>
<body>
<div class="screen" id="startScreen">
  <div class="kicker"><i></i>BOOK ONE<i></i></div>
  <h1>DYSTOPIA</h1>
  <button class="btn" id="startBtn" type="button">NEW GAME</button>
  <p id="modeLine" class="modeLine">STORY MODE</p>
  <div id="startHint"></div>
</div>
<div id="blank"></div>
<script type="module">
import { Waking } from '/commercial.js';
const api = {
  chapterId(){ return 'ep1'; },
  chapters: {
    ep1: { subtitle: 'EPISODE ONE: THE WAKING' },
    ch_counting: { subtitle: 'CHAPTER THREE: THE COUNTING HOUSE' },
    ch_lone: { subtitle: 'CHAPTER TWO: THE LONG ROAD' },
    ch_steel: { subtitle: 'CHAPTER SIX' },
    ch_taken: { subtitle: 'CHAPTER TWO: TAKEN' },
  },
  beats: [],
  archive: [],
  setVolume(){},
  applyQuality(){},
  getMode(){ return 'title'; },
  setMode(){},
  getPos(){ return null; },
};
Waking.mount(api);
window.__ready = true;
</script>
</body></html>`;

const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  if (url.pathname === '/harness.html') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(harness);
    return;
  }
  if (url.pathname === '/blank.html') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end('<!DOCTYPE html><html><body>blank</body></html>');
    return;
  }
  let rel = decodeURIComponent(url.pathname).replace(/^\/+/, '');
  if (!rel) rel = 'index.html';
  if (rel.split('/').includes('..')) { res.writeHead(400); res.end('bad'); return; }
  const path = normalize(join(root, rel));
  if (!path.startsWith(root) || !existsSync(path) || statSync(path).isDirectory()) {
    res.writeHead(404); res.end('missing ' + rel);
    return;
  }
  res.writeHead(200, { 'content-type': types[extname(path)] || 'application/octet-stream' });
  res.end(readFileSync(path));
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = 'http://127.0.0.1:' + server.address().port;

let puppeteer;
try { puppeteer = (await import('/tmp/pw/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js')).default; }
catch (e) {
  const req = (await import('node:module')).createRequire(import.meta.url);
  try { puppeteer = req('/tmp/pw/node_modules/puppeteer-core'); }
  catch (e2) { puppeteer = null; }
}
if (!puppeteer) {
  console.log('SKIP  browser checks, puppeteer-core is not installed in /tmp/pw');
  server.close();
  if (failed) process.exit(1);
  console.log('season checks passed');
  process.exit(0);
}

const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

async function open(context, path){
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', err => errors.push(String(err)));
  await page.goto(origin + path, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction(() => window.__ready === true, { timeout: 15000 });
  return { page, errors };
}
function locks(page){
  return page.evaluate(() => ({
    ep1: window.Waking.isLocked('ep1'),
    counting: window.Waking.isLocked('ch_counting'),
    lone: window.Waking.isLocked('ch_lone'),
    steel: window.Waking.isLocked('ch_steel'),
    url: location.search,
    note: (document.getElementById('seasonNote') || {}).textContent || '',
    passKey: localStorage.getItem('latm_season_pass_v1'),
    used: localStorage.getItem('latm_season_sessions_v1'),
    file: JSON.parse(localStorage.getItem('latm_save_v1') || '{}'),
  }));
}

const fresh = await browser.createBrowserContext();
const bare = await open(fresh, '/harness.html?season_pass=1');
const bareState = await locks(bare.page);
check('bare season_pass does not unlock chapter three', bareState.counting === true && bareState.ep1 === false && bareState.lone === true, JSON.stringify({ counting: bareState.counting, ep1: bareState.ep1 }));
check('bare season_pass stores nothing', !bareState.passKey && !(bareState.file.slots || []).some(s => s.pass), bareState.passKey || '');
check('bare return tells the player it was not granted', /was not granted/.test(bareState.note), bareState.note);
check('bare return strips the query', !/season_pass/.test(bareState.url), bareState.url);
check('harness had no page error', bare.errors.length === 0, bare.errors.join(' | '));

const paidCtx = await browser.createBrowserContext();
const granted = await open(paidCtx, '/harness.html?season_pass=1&session_id=' + LIVE);
const grantedState = await locks(granted.page);
const slots = grantedState.file.slots || [];
check('session id grants every chapter', grantedState.counting === false && grantedState.steel === false && grantedState.lone === false && grantedState.ep1 === false, JSON.stringify(grantedState));
check('pass is on every slot and the browser key', slots.length === 3 && slots.every(s => s.pass === true) && /"pass":true/.test(grantedState.passKey || ''), 'slots ' + slots.map(s => s.pass).join(','));
check('session id is consumed', (JSON.parse(grantedState.used || '[]')).indexOf(LIVE) >= 0);
check('granted note is active', /active on this browser/.test(grantedState.note), grantedState.note);
check('return query is stripped after grant', !/session_id|season_pass/.test(grantedState.url), grantedState.url);

await granted.page.evaluate(() => {
  const file = JSON.parse(localStorage.getItem('latm_save_v1'));
  file.active = 1;
  file.slots.forEach(s => { s.pass = false; });
  localStorage.setItem('latm_save_v1', JSON.stringify(file));
});
const kept = await open(paidCtx, '/harness.html');
const keptState = await locks(kept.page);
check('clearing slot flags does not drop the browser pass', keptState.counting === false && keptState.file.active === 1, JSON.stringify({ counting: keptState.counting, active: keptState.file.active }));

await kept.page.evaluate((id) => {
  localStorage.removeItem('latm_season_pass_v1');
  const file = JSON.parse(localStorage.getItem('latm_save_v1'));
  file.season = { v: 1, pass: false };
  file.slots.forEach(s => { s.pass = false; s.noAds = false; });
  file.usedSessions = [id];
  localStorage.setItem('latm_save_v1', JSON.stringify(file));
}, LIVE);
const replay = await open(paidCtx, '/harness.html?season_pass=1&session_id=' + LIVE);
const replayState = await locks(replay.page);
check('same session id does not grant twice', replayState.counting === true && !/"pass":true/.test(replayState.passKey || ''), replayState.note);

const slotCtx = await browser.createBrowserContext();
const slotPage = await open(slotCtx, '/harness.html?season_pass=1&session_id=cs_test_slotswitchslot01');
await Promise.all([
  slotPage.page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }),
  slotPage.page.evaluate(() => {
    const button = [...document.querySelectorAll('button')].find(n => n.textContent.indexOf('SLOT 2') === 0);
    if (button) button.click();
  }),
]);
await slotPage.page.waitForFunction(() => window.__ready === true, { timeout: 15000 });
const switched = await locks(slotPage.page);
check('slot button keeps chapter three open', switched.counting === false && switched.file.active === 1, JSON.stringify({ counting: switched.counting, active: switched.file.active }));

const legacyCtx = await browser.createBrowserContext();
const legacyBlank = await legacyCtx.newPage();
await legacyBlank.goto(origin + '/blank.html');
await legacyBlank.evaluate(() => {
  const slot = (i) => ({
    name: 'SLOT ' + (i + 1), updated: 1, mid: null, book: {}, carry: {}, unlocked: [],
    endings: [], ads: {}, pass: i === 0, noAds: false, choices: {},
  });
  localStorage.setItem('latm_save_v1', JSON.stringify({
    v: 1, active: 0, slots: [slot(0), slot(1), slot(2)], settings: { _init: 1, mode: 'story', portraits: 'cards' }, analytics: [], world: {},
  }));
});
const legacy = await open(legacyCtx, '/harness.html');
const legacyState = await locks(legacy.page);
check('old slot pass promotes to every slot', legacyState.counting === false && (legacyState.file.slots || []).every(s => s.pass), JSON.stringify((legacyState.file.slots || []).map(s => s.pass)));

const trapCtx = await browser.createBrowserContext();
const trapBlank = await trapCtx.newPage();
await trapBlank.goto(origin + '/blank.html');
await trapBlank.evaluate(() => {
  const slot = (i) => ({
    name: 'SLOT ' + (i + 1), updated: 0, mid: null, book: {}, carry: {}, unlocked: [],
    endings: [], ads: {}, pass: false, noAds: i === 0, choices: {},
  });
  localStorage.setItem('latm_save_v1', JSON.stringify({
    v: 1, active: 0, slots: [slot(0), slot(1), slot(2)], settings: { _init: 1, mode: 'story' }, analytics: [], world: {},
  }));
});
const trap = await open(trapCtx, '/harness.html');
const trapState = await locks(trap.page);
check('free remove-ads flag is cleared', trapState.counting === true && (trapState.file.slots || []).every(s => !s.noAds));

const restoreCtx = await browser.createBrowserContext();
const restore = await open(restoreCtx, '/harness.html');
await restore.page.click('#restoreBtn');
await restore.page.waitForSelector('#restoreSession');
const beforePaste = await restore.page.$eval('#paySheet', n => n.innerText);
check('restore copy does not offer email lookup as a working form', /cannot look up a purchase by email/.test(beforePaste) && !/REMOVE ADS/.test(beforePaste));
await restore.page.type('#restoreSession', 'https://example.test/back?session_id=cs_live_restorepurchase1');
await restore.page.click('#payBody button.amber');
await restore.page.waitForFunction(() => {
  const note = document.getElementById('payNote');
  return note && /active on this browser/.test(note.textContent || '');
});
const restored = await locks(restore.page);
check('pasted return url restores the pass', restored.counting === false);

await restore.page.evaluate(() => window.Waking.openPaywall('ch_counting'));
const sheet = await restore.page.evaluate((line) => {
  const node = document.getElementById('paySheet');
  const body = document.getElementById('payBody');
  const cs = getComputedStyle(node);
  const bs = getComputedStyle(body);
  const text = node.innerText;
  return {
    display: cs.display,
    background: cs.backgroundColor,
    bodyBackground: bs.backgroundColor,
    text,
    count: text.split(line).length - 1,
    remove: text.includes('REMOVE ADS') || text.includes('$2.99'),
    season: text.includes('SEASON PASS'),
    trailers: text.includes('WATCH BOOK TRAILERS'),
  };
}, LINE);
check('pay sheet is opaque', sheet.display === 'flex' && sheet.background === 'rgb(7, 7, 11)' && sheet.bodyBackground === 'rgb(7, 7, 11)', sheet.background + ' / ' + sheet.bodyBackground);
check('pay sheet uses the one line once', sheet.count === 1, String(sheet.count));
check('remove ads is not a button', sheet.remove === false && sheet.season === true && sheet.trailers === true, sheet.text.slice(0, 240));

const previewCtx = await browser.createBrowserContext();
const preview = await open(previewCtx, '/harness.html?preview=1&season_pass=1');
const previewState = await locks(preview.page);
check('preview plus bare flag does not store a pass', previewState.counting === false && !previewState.passKey);

mkdirSync('/opt/cursor/artifacts', { recursive: true });
const shotCtx = await browser.createBrowserContext();
const shot = await shotCtx.newPage();
const shotErrors = [];
shot.on('pageerror', err => shotErrors.push(String(err)));
await shot.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
await shot.goto(origin + '/?q=low#ch_counting', { waitUntil: 'domcontentloaded', timeout: 60000 });
await shot.waitForFunction(() => window.__LATM && window.__LATM.G && window.__LATM.G.mode === 'title', { timeout: 45000 });
await shot.click('#startBtn');
await shot.waitForFunction(() => {
  const node = document.getElementById('paySheet');
  return node && getComputedStyle(node).display !== 'none';
}, { timeout: 8000 });
const live = await shot.evaluate((line) => {
  const node = document.getElementById('paySheet');
  const text = node.innerText;
  return {
    background: getComputedStyle(node).backgroundColor,
    line: text.includes(line),
    remove: text.includes('REMOVE ADS') || text.includes('$2.99'),
    locked: window.Waking.isLocked('ch_counting'),
    mode: window.__LATM.G.mode,
  };
}, LINE);
check('title pay sheet is opaque and locked', live.background === 'rgb(7, 7, 11)' && live.line && !live.remove && live.locked === true && live.mode === 'title', JSON.stringify(live));
check('game page had no crash', shotErrors.filter(e => !/speechSynthesis|NotAllowedError/.test(e)).length === 0, shotErrors.join(' | ').slice(0, 400));
await shot.screenshot({ path: '/opt/cursor/artifacts/pay-sheet.png' });
await shot.evaluate(() => {
  const button = [...document.querySelectorAll('#payBody button')].find(n => n.textContent === 'RESTORE PURCHASE');
  if (button) button.click();
});
await shot.waitForSelector('#restoreSession');
await shot.screenshot({ path: '/opt/cursor/artifacts/restore-purchase.png' });

await browser.close();
server.close();
if (failed) process.exit(1);
console.log('season checks passed');
