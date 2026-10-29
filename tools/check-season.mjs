// Season Pass rules: a cs_ id never grants by itself. An empty verify
// URL fails closed. A stubbed purchase check grants only for { pass: true }.
// The pass survives a slot switch. The pay sheet stays opaque, with the
// short line and no Remove Ads button.
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { askPreviewVerify, askSeasonVerify, judgeRestore, judgeReturn, judgeSession, plausibleSessionId, previewCodeShape, previewTicketShape } from '../season-pass.js';
import worker from '../cloud/season-pass-worker.js';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const LIVE = 'cs_live_abcdefghijklmnopqrst';
const FAKE = 'cs_live_FAKEFAKEFAKEFAKE1';
const PAID_BROWSER = 'cs_live_browserpaidreturn1';
const RESTORE_ID = 'cs_live_restorepurchase1';
const SLOT_ID = 'cs_test_slotswitchslot01';
const LOCAL_REPLAY = 'cs_test_localreplay0001';
const PREVIEW_CODE = 'owner-preview-code-0123456789';
const PREVIEW_TICKET = 'a'.repeat(32);
const OLD_LINK = 'plink_1UV4C7Rc0DOFqzuBoEDJ5Aa7';
const NEW_LINK = 'plink_1UVspDRc0DOFqzuBbtCuM3MO';
const LINK = OLD_LINK;
const NEW_PRICE_ID = 'cs_live_newlinkseasonpas';
const SEASON_BUY_URL = 'https://buy.stripe.com/cNi00l9cQ0XNgND8pM3wQ01';
const VERIFY_URL = 'https://waking-season-pass.matpcul.workers.dev';
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
check('live id is only a verify', judgeReturn('1', LIVE, [], false).action === 'verify' && plausibleSessionId(LIVE));
check('test id is only a verify', judgeReturn('1', 'cs_test_abcdefghijklmnopqrst', [], false).action === 'verify');
check('fake live id is only a verify', judgeReturn('1', FAKE, [], false).action === 'verify');
check('used id does not grant again', judgeReturn('1', LIVE, [LIVE], false).action === 'replay');
check('used id on a pass holder stays already', judgeReturn('1', LIVE, [LIVE], true).action === 'already');
check('pasted return url is not a grant', judgeSession('https://matpcul-tech.github.io/Dystopia/?season_pass=1&session_id=' + LIVE, [], false).action === 'verify');
check('junk paste rejects', judgeSession('not a receipt', [], false).action === 'reject');
check('email restore is a verify', judgeRestore('Reader@Example.com', [], false).email === 'reader@example.com' && judgeRestore('Reader@Example.com', [], false).action === 'verify');
check('shape check never returns grant', [LIVE, FAKE, 'cs_test_abcdefghijklmnopqrst'].every(id => judgeReturn('1', id, [], false).action !== 'grant' && judgeSession(id, [], false).action !== 'grant'));

const commercialSource = readFileSync(join(root, 'commercial.js'), 'utf8');
check('verify url is the live worker', commercialSource.includes("SEASON_VERIFY_URL: '" + VERIFY_URL + "'"));
check('buy button uses the current payment link', commercialSource.includes("SEASON_URL: '" + SEASON_BUY_URL + "'"));
check('season price is 2.99', commercialSource.includes("SEASON_PRICE: '$2.99'"));
const playSource = readFileSync(join(root, 'play-build.js'), 'utf8');
check('committed play flag is off', playSource.includes('export const PLAY_BUILD = false;'));
check('play gate is imported, not a url param', commercialSource.includes("from './play-build.js'") && commercialSource.includes('if (PLAY_BUILD)') && !/PLAY_BUILD[\s\S]{0,40}URLSearchParams/.test(commercialSource));
check('client has no shape grant', !/action === 'grant'/.test(commercialSource));
check('static site has no stripe secret', !/sk_(live|test)_/.test(commercialSource) && !/STRIPE_SECRET/.test(commercialSource));
check('old preview flag is not a client grant', !/getItem\('latm_preview'\)/.test(commercialSource) && !/setItem\('latm_preview'/.test(commercialSource));
const previewStart = commercialSource.indexOf('async function claimPreview');
const previewEnd = commercialSource.indexOf('function grantSeason');
const previewFn = commercialSource.slice(previewStart, previewEnd);
check('preview claim does not write the pass', previewStart > 0 && previewEnd > previewStart && !previewFn.includes('PASS_KEY') && !previewFn.includes('localStorage') && !previewFn.includes('grantSeason') && !previewFn.includes('latm_season_pass'));
check('bare preview shape is rejected', previewCodeShape('1') === false && previewCodeShape('') === false && previewCodeShape(PREVIEW_CODE) === true);
const workerSource = readFileSync(join(root, 'cloud/season-pass-worker.js'), 'utf8');
check('worker keeps the preview shape', workerSource.includes('/^[A-Za-z0-9_-]{20,128}$/'));
check('worker does not bake a preview code', !/PREVIEW_CODE\s*=\s*['"]/.test(workerSource));
check('worker lists both season links', workerSource.includes(OLD_LINK) && workerSource.includes(NEW_LINK));
const purchasesSource = readFileSync(join(root, 'mobile/purchases.js'), 'utf8');
check('mobile season price is 2.99', purchasesSource.includes("season: { id: 'season_pass_book_one', price: '$2.99' }"));

let fetches = 0;
const closed = await askSeasonVerify('', { session_id: FAKE }, async () => {
  fetches += 1;
  return { ok: true, status: 200, json: async () => ({ pass: true }) };
});
check('empty verify url fails closed', closed.pass === false && closed.reason === 'unconfigured' && fetches === 0);

const offline = await askSeasonVerify('https://verify.test/season', { session_id: LIVE }, async () => {
  throw new Error('offline');
});
check('network error fails closed', offline.pass === false && offline.reason === 'network');

const denied = await askSeasonVerify('https://verify.test/season', { session_id: FAKE }, async () => {
  return { ok: false, status: 402, json: async () => ({ pass: false }) };
});
check('402 does not grant', denied.pass === false && denied.reason === 'http');

const serverErr = await askSeasonVerify('https://verify.test/season', { session_id: LIVE }, async () => {
  return { ok: false, status: 500, json: async () => ({}) };
});
check('500 does not grant', serverErr.pass === false && serverErr.status === 500);

const lying = await askSeasonVerify('https://verify.test/season', { session_id: FAKE }, async () => {
  return { ok: false, status: 402, json: async () => ({ pass: true }) };
});
check('pass true on an error status does not grant', lying.pass === false);

const stringPass = await askSeasonVerify('https://verify.test/season', { session_id: LIVE }, async () => {
  return { ok: true, status: 200, json: async () => ({ pass: 'true' }) };
});
check('string pass is not a grant', stringPass.pass === false && stringPass.reason === 'denied');

const verified = await askSeasonVerify('https://verify.test/season', { session_id: LIVE }, async (url, opts) => {
  const body = JSON.parse(opts.body);
  check('verify posts the session id', opts.method === 'POST' && body.session_id === LIVE && !body.email, opts.body);
  return { ok: true, status: 200, json: async () => ({ pass: true }) };
});
check('verify success is pass true', verified.pass === true);

const burned = await askSeasonVerify('https://verify.test/season', { session_id: LIVE }, async () => {
  return { ok: false, status: 409, json: async () => ({ pass: false, reason: 'used' }) };
});
check('used checkout does not grant', burned.pass === false && burned.reason === 'used');

const mailed = await askSeasonVerify('https://verify.test/season', { email: 'reader@example.com' }, async (url, opts) => {
  const body = JSON.parse(opts.body);
  check('email restore posts only the email', body.email === 'reader@example.com' && !body.session_id, opts.body);
  return { ok: true, status: 200, json: async () => ({ pass: true }) };
});
check('email verify success is pass true', mailed.pass === true);

let previewFetches = 0;
const previewClosed = await askPreviewVerify('', { preview_code: PREVIEW_CODE }, async () => {
  previewFetches += 1;
  return { ok: true, status: 200, json: async () => ({ preview: true, ticket: PREVIEW_TICKET }) };
});
check('empty preview url fails closed', previewClosed.preview === false && previewClosed.reason === 'unconfigured' && previewFetches === 0);

const previewOffline = await askPreviewVerify('https://verify.test/season', { preview_code: PREVIEW_CODE }, async () => {
  throw new Error('offline');
});
check('preview network error fails closed', previewOffline.preview === false && previewOffline.reason === 'network');

const previewString = await askPreviewVerify('https://verify.test/season', { preview_code: PREVIEW_CODE }, async () => {
  return { ok: true, status: 200, json: async () => ({ preview: 'true', ticket: PREVIEW_TICKET }) };
});
check('string preview is not a grant', previewString.preview === false && previewString.reason === 'denied');

const previewPassOnly = await askPreviewVerify('https://verify.test/season', { preview_code: PREVIEW_CODE }, async () => {
  return { ok: true, status: 200, json: async () => ({ pass: true, ticket: PREVIEW_TICKET }) };
});
check('pass true is not a preview grant', previewPassOnly.preview === false && previewPassOnly.preview !== true);

const previewShort = await askPreviewVerify('https://verify.test/season', { preview_code: PREVIEW_CODE }, async () => {
  return { ok: true, status: 200, json: async () => ({ preview: true, ticket: 'short' }) };
});
check('short preview ticket is not a grant', previewShort.preview === false);

const previewOk = await askPreviewVerify('https://verify.test/season', { preview_code: PREVIEW_CODE }, async (url, opts) => {
  const body = JSON.parse(opts.body);
  check('preview posts only the code', opts.method === 'POST' && body.preview_code === PREVIEW_CODE && !body.session_id && !body.email, opts.body);
  return { ok: true, status: 200, json: async () => ({ preview: true, ticket: PREVIEW_TICKET }) };
});
check('preview success keeps the ticket', previewOk.preview === true && previewOk.ticket === PREVIEW_TICKET);

const kv = new Map();
const env = {
  STRIPE_SECRET_KEY: 'sk_test_not_a_real_key',
  SEASON: {
    get(key){ return Promise.resolve(kv.has(key) ? kv.get(key) : null); },
    put(key, value){ kv.set(key, value); return Promise.resolve(); },
  },
};
const realFetch = globalThis.fetch;
const PAID_IDS = new Set([LIVE, PAID_BROWSER, RESTORE_ID, SLOT_ID, LOCAL_REPLAY]);
function stripeFetch(url){
  const id = String(url).split('/').pop();
  if (id === NEW_PRICE_ID || PAID_IDS.has(id)) {
    const email = id === LIVE ? 'Reader@Example.com' : 'Paid@Browser.test';
    const payment_link = id === NEW_PRICE_ID ? NEW_LINK : LINK;
    return Promise.resolve({ ok: true, json: async () => ({ payment_status: 'paid', status: 'complete', payment_link, customer_details: { email } }) });
  }
  if (id === 'cs_live_unpaidunpaidunp') {
    return Promise.resolve({ ok: true, json: async () => ({ payment_status: 'unpaid', status: 'open', payment_link: LINK }) });
  }
  if (id === 'cs_live_otherlinkotherli') {
    return Promise.resolve({ ok: true, json: async () => ({ payment_status: 'paid', status: 'complete', payment_link: 'plink_other' }) });
  }
  return Promise.resolve({ ok: false, json: async () => ({}) });
}
globalThis.fetch = stripeFetch;

function callWorker(body){
  return worker.fetch(new Request('https://worker.test/season', {
    method: 'POST',
    headers: { origin: 'https://matpcul-tech.github.io', 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }), env);
}

const paid = await callWorker({ session_id: LIVE });
const paidBody = await paid.json();
check('worker grants the earlier payment link', paid.status === 200 && paidBody.pass === true, JSON.stringify(paidBody));
const current = await callWorker({ session_id: NEW_PRICE_ID });
const currentBody = await current.json();
check('worker grants the current payment link', current.status === 200 && currentBody.pass === true, JSON.stringify(currentBody));
const again = await callWorker({ session_id: LIVE });
check('worker burns the id', again.status === 409 && (await again.json()).pass === false);
const unpaid = await callWorker({ session_id: 'cs_live_unpaidunpaidunp' });
check('worker rejects unpaid', unpaid.status === 402 && (await unpaid.json()).pass === false);
const other = await callWorker({ session_id: 'cs_live_otherlinkotherli' });
check('worker rejects a foreign payment link', other.status === 402 && (await other.json()).pass === false);
const fakeWorker = await callWorker({ session_id: FAKE });
check('worker rejects a lookalike id', fakeWorker.status === 402 && (await fakeWorker.json()).pass === false);
const mail = await callWorker({ email: 'reader@example.com' });
check('worker restores by receipt email', mail.status === 200 && (await mail.json()).pass === true);
const strangerMail = await callWorker({ email: 'nope@example.com' });
check('worker does not invent an email pass', strangerMail.status === 404 && (await strangerMail.json()).pass === false);
const emptyBody = await callWorker({});
check('worker rejects an empty body', emptyBody.status === 400);

const beforePreviewKeys = [...kv.keys()];
let stripeDuringPreview = 0;
globalThis.fetch = (url) => {
  stripeDuringPreview += 1;
  return stripeFetch(url);
};
const previewMissing = await callWorker({ preview_code: PREVIEW_CODE });
const previewMissingBody = await previewMissing.json();
check('preview without secret fails closed', previewMissing.status === 503 && previewMissingBody.preview === false && previewMissingBody.pass !== true, JSON.stringify(previewMissingBody));
check('preview without secret does not call stripe', stripeDuringPreview === 0);
env.PREVIEW_CODE = PREVIEW_CODE;
const previewBare = await callWorker({ preview_code: '1' });
check('worker rejects bare preview 1', previewBare.status === 400 && (await previewBare.json()).preview !== true);
const previewWrong = await callWorker({ preview_code: 'wrong-code-but-long-enough' });
check('worker rejects a wrong preview code', previewWrong.status === 401 && (await previewWrong.json()).preview === false && stripeDuringPreview === 0);
const previewHit = await callWorker({ preview_code: PREVIEW_CODE });
const previewHitBody = await previewHit.json();
check('worker grants a preview ticket', previewHit.status === 200 && previewHitBody.preview === true && previewTicketShape(previewHitBody.ticket) && previewHitBody.pass !== true, JSON.stringify({ preview: previewHitBody.preview, pass: previewHitBody.pass, ticket: previewHitBody.ticket ? 'set' : '' }));
check('preview grant does not call stripe', stripeDuringPreview === 0);
const previewKeys = [...kv.keys()].filter(key => key.startsWith('preview:') && beforePreviewKeys.indexOf(key) < 0);
check('preview ticket is not a pass record', previewKeys.length === 1 && previewKeys[0].indexOf('used:') < 0 && previewKeys[0].indexOf('email:') < 0 && previewKeys[0].indexOf('preview:') === 0, 'count ' + previewKeys.length);
const previewAgain = await callWorker({ preview_ticket: previewHitBody.ticket });
const previewAgainBody = await previewAgain.json();
check('preview ticket renews without a pass', previewAgain.status === 200 && previewAgainBody.preview === true && previewAgainBody.ticket === previewHitBody.ticket && previewAgainBody.pass !== true);
env.PREVIEW_CODE = 'rotated-owner-code-0123456789ab';
const previewOld = await callWorker({ preview_ticket: previewHitBody.ticket });
check('rotated secret kills the old ticket', previewOld.status === 401 && (await previewOld.json()).preview !== true);
const previewFresh = await callWorker({ preview_code: env.PREVIEW_CODE });
const previewFreshBody = await previewFresh.json();
check('rotated secret still grants a new ticket', previewFresh.status === 200 && previewFreshBody.preview === true && previewFreshBody.pass !== true);
const freshKeys = [...kv.keys()].filter(key => key.startsWith('preview:') && previewKeys.indexOf(key) < 0);
check('rotated secret stores a new ticket', freshKeys.length === 1 && freshKeys[0].indexOf('preview:') === 0, 'count ' + freshKeys.length);
kv.set(freshKeys[0], String(Date.now() - 1000));
const previewStale = await callWorker({ preview_ticket: previewFreshBody.ticket });
check('expired preview ticket does not unlock', previewStale.status === 401 && (await previewStale.json()).preview === false);
const mixed = await callWorker({ preview_code: PREVIEW_CODE, session_id: LIVE });
check('mixed preview body still follows the season path', mixed.status === 409 && (await mixed.json()).pass === false);
env.PREVIEW_CODE = PREVIEW_CODE;
globalThis.fetch = realFetch;

const chromePath = ['/usr/local/bin/google-chrome', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(p => existsSync(p));
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
function harnessHtml(verify){
  const src = verify ? '/commercial.js?verify=1' : '/commercial.js';
  return `<!DOCTYPE html>
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
import { Waking } from '${src}';
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
}

const verifyHits = [];
const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  if (url.pathname === '/season-verify') {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', async () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      try {
        const request = new Request('https://worker.test/season', {
          method: 'POST',
          headers: { origin: 'https://matpcul-tech.github.io', 'content-type': 'application/json' },
          body: raw,
        });
        const previous = globalThis.fetch;
        globalThis.fetch = stripeFetch;
        let response;
        try { response = await worker.fetch(request, env); }
        finally { globalThis.fetch = previous; }
        const text = await response.text();
        verifyHits.push({ body: raw, status: response.status, text });
        res.writeHead(response.status, { 'content-type': 'application/json' });
        res.end(text);
      } catch (err) {
        res.writeHead(500, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ pass: false }));
      }
    });
    return;
  }
  if (url.pathname === '/harness.html' || url.pathname === '/harness-verify.html') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(harnessHtml(url.pathname === '/harness-verify.html'));
    return;
  }
  if (url.pathname === '/commercial.js') {
    let text = commercialSource;
    // Source points at the live worker. The plain harness keeps the empty
    // URL so a fake return fails closed without calling the network.
    // verify=1 points at the local stub instead.
    const live = "SEASON_VERIFY_URL: '" + VERIFY_URL + "'";
    const next = url.searchParams.get('verify') === '1'
      ? "SEASON_VERIFY_URL: '/season-verify'"
      : "SEASON_VERIFY_URL: ''";
    const replaced = text.replace(live, next);
    if (replaced === text) {
      res.writeHead(500, { 'content-type': 'text/plain' });
      res.end('SEASON_VERIFY_URL was not rewritten');
      return;
    }
    text = replaced;
    res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8' });
    res.end(text);
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
  const requests = [];
  page.on('pageerror', err => errors.push(String(err)));
  page.on('request', req => requests.push(req.url()));
  await page.goto(origin + path, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction(() => window.__ready === true, { timeout: 15000 });
  if (/[?&]season_pass=1/.test(path)) {
    await page.waitForFunction(() => {
      const note = document.getElementById('seasonNote');
      const text = note && note.textContent || '';
      return text && text !== 'Checking the purchase.';
    }, { timeout: 8000 });
  }
  if (/[?&]preview=/.test(path)) {
    await page.waitForFunction(() => window.__previewSettled === true, { timeout: 8000 });
  }
  return { page, errors, requests };
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
    previewFlag: sessionStorage.getItem('latm_preview'),
    previewTicket: sessionStorage.getItem('latm_preview_ticket'),
    localPreview: localStorage.getItem('latm_preview_ticket'),
    hint: (document.getElementById('startHint') || {}).textContent || '',
  }));
}
function postedSession(id){
  return verifyHits.some(hit => {
    try { return JSON.parse(hit.body).session_id === id; } catch (e) { return false; }
  });
}
function postedEmail(email){
  return verifyHits.some(hit => {
    try { return JSON.parse(hit.body).email === email; } catch (e) { return false; }
  });
}

const fresh = await browser.createBrowserContext();
const bare = await open(fresh, '/harness.html?season_pass=1');
const bareState = await locks(bare.page);
check('bare season_pass does not unlock chapter three', bareState.counting === true && bareState.ep1 === false && bareState.lone === true, JSON.stringify({ counting: bareState.counting, ep1: bareState.ep1 }));
check('bare season_pass stores nothing', !bareState.passKey && !(bareState.file.slots || []).some(s => s.pass), bareState.passKey || '');
check('bare return tells the player it was not granted', /was not granted/.test(bareState.note), bareState.note);
check('bare return strips the query', !/season_pass/.test(bareState.url), bareState.url);
check('harness had no page error', bare.errors.length === 0, bare.errors.join(' | '));

const fakeCtx = await browser.createBrowserContext();
const fake = await open(fakeCtx, '/harness.html?season_pass=1&session_id=' + FAKE);
const fakeState = await locks(fake.page);
check('fake session id does not unlock chapter three', fakeState.counting === true && fakeState.steel === true && fakeState.lone === true && fakeState.ep1 === false, JSON.stringify(fakeState));
check('fake session id stores nothing', !fakeState.passKey && !(fakeState.file.slots || []).some(s => s.pass), fakeState.passKey || '');
check('fake return says the check is not connected', /not connected yet/.test(fakeState.note), fakeState.note);
check('fake return strips the query', !/session_id|season_pass/.test(fakeState.url), fakeState.url);
check('fake return does not call the purchase check', fake.requests.every(u => u.indexOf('/season-verify') < 0));

await fake.page.click('#restoreBtn');
await fake.page.waitForSelector('#restoreSession');
const beforePaste = await fake.page.$eval('#paySheet', n => n.innerText);
check('restore copy asks for the receipt email', /email from your Stripe receipt/.test(beforePaste) && /does not show a checkout id/.test(beforePaste) && !/REMOVE ADS/.test(beforePaste), beforePaste.slice(0, 280));
check('restore copy does not ask for an id from the receipt', !/cannot look up a purchase by email/.test(beforePaste) && !/Paste the checkout id/.test(beforePaste) && !/starts with cs_live_/.test(beforePaste));
await fake.page.type('#restoreSession', FAKE);
await fake.page.click('#payBody button.amber');
await fake.page.waitForFunction(() => {
  const note = document.getElementById('payNote');
  return note && /not connected yet/.test(note.textContent || '');
}, { timeout: 8000 });
const pasted = await locks(fake.page);
check('fake restore paste does not unlock', pasted.counting === true && !pasted.passKey, pasted.note);

await fake.page.evaluate(() => window.Waking.openPaywall('ch_counting'));
const sheet = await fake.page.evaluate((line) => {
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
    remove: text.includes('REMOVE ADS'),
    season: text.includes('SEASON PASS') && text.includes('$2.99') && text.split('$2.99').length - 1 === 1,
    trailers: text.includes('WATCH BOOK TRAILERS'),
  };
}, LINE);
check('pay sheet is opaque', sheet.display === 'flex' && sheet.background === 'rgb(7, 7, 11)' && sheet.bodyBackground === 'rgb(7, 7, 11)', sheet.background + ' / ' + sheet.bodyBackground);
check('pay sheet uses the one line once', sheet.count === 1, String(sheet.count));
check('remove ads is not a button', sheet.remove === false && sheet.season === true && sheet.trailers === true, sheet.text.slice(0, 240));

const localCtx = await browser.createBrowserContext();
const seed = await localCtx.newPage();
await seed.goto(origin + '/blank.html');
await seed.evaluate((id) => {
  localStorage.setItem('latm_season_sessions_v1', JSON.stringify([id]));
}, LOCAL_REPLAY);
await seed.close();
const localReplay = await open(localCtx, '/harness-verify.html?season_pass=1&session_id=' + LOCAL_REPLAY);
const localState = await locks(localReplay.page);
check('local replay does not grant a fresh server pass', localState.counting === true && !/"pass":true/.test(localState.passKey || ''), localState.note);
check('local replay does not ask the worker', !postedSession(LOCAL_REPLAY));

const paidCtx = await browser.createBrowserContext();
const granted = await open(paidCtx, '/harness-verify.html?season_pass=1&session_id=' + PAID_BROWSER);
const grantedState = await locks(granted.page);
const slots = grantedState.file.slots || [];
check('verified session grants every chapter', grantedState.counting === false && grantedState.steel === false && grantedState.lone === false && grantedState.ep1 === false, JSON.stringify(grantedState));
check('pass is on every slot and the browser key', slots.length === 3 && slots.every(s => s.pass === true) && /"pass":true/.test(grantedState.passKey || ''), 'slots ' + slots.map(s => s.pass).join(','));
check('verified session id is consumed', (JSON.parse(grantedState.used || '[]')).indexOf(PAID_BROWSER) >= 0);
check('granted note is active', /active on this browser/.test(grantedState.note), grantedState.note);
check('return query is stripped after grant', !/session_id|season_pass/.test(grantedState.url), grantedState.url);
check('verified return posted the session', postedSession(PAID_BROWSER));
check('verified return had no page error', granted.errors.length === 0, granted.errors.join(' | '));

await granted.page.evaluate(() => {
  const file = JSON.parse(localStorage.getItem('latm_save_v1'));
  file.active = 1;
  file.slots.forEach(s => { s.pass = false; });
  localStorage.setItem('latm_save_v1', JSON.stringify(file));
});
const kept = await open(paidCtx, '/harness-verify.html');
const keptState = await locks(kept.page);
check('clearing slot flags does not drop the browser pass', keptState.counting === false && keptState.file.active === 1, JSON.stringify({ counting: keptState.counting, active: keptState.file.active }));

await kept.page.evaluate((id) => {
  localStorage.removeItem('latm_season_pass_v1');
  localStorage.setItem('latm_season_sessions_v1', '[]');
  const file = JSON.parse(localStorage.getItem('latm_save_v1'));
  file.season = { v: 1, pass: false };
  file.slots.forEach(s => { s.pass = false; s.noAds = false; });
  file.usedSessions = [];
  localStorage.setItem('latm_save_v1', JSON.stringify(file));
}, PAID_BROWSER);
const replay = await open(paidCtx, '/harness-verify.html?season_pass=1&session_id=' + PAID_BROWSER);
const replayState = await locks(replay.page);
check('burned session id does not grant twice', replayState.counting === true && !/"pass":true/.test(replayState.passKey || ''), replayState.note);
check('burned session tells the player it was used', /already used/.test(replayState.note), replayState.note);

const slotCtx = await browser.createBrowserContext();
const slotPage = await open(slotCtx, '/harness-verify.html?season_pass=1&session_id=' + SLOT_ID);
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

const emailCtx = await browser.createBrowserContext();
const email = await open(emailCtx, '/harness-verify.html');
await email.page.click('#restoreBtn');
await email.page.waitForSelector('#restoreSession');
await email.page.type('#restoreSession', 'reader@example.com');
await email.page.click('#payBody button.amber');
await email.page.waitForFunction(() => {
  const note = document.getElementById('payNote');
  return note && /active on this browser/.test(note.textContent || '');
}, { timeout: 8000 });
const emailed = await locks(email.page);
check('email restore unlocks when the worker has that email', emailed.counting === false && /"pass":true/.test(emailed.passKey || ''), emailed.note);
check('email restore posted the email', postedEmail('reader@example.com'));

const strangerCtx = await browser.createBrowserContext();
const stranger = await open(strangerCtx, '/harness-verify.html');
await stranger.page.click('#restoreBtn');
await stranger.page.waitForSelector('#restoreSession');
await stranger.page.type('#restoreSession', 'nope@example.com');
await stranger.page.click('#payBody button.amber');
await stranger.page.waitForFunction(() => {
  const note = document.getElementById('payNote');
  return note && /was not granted/.test(note.textContent || '');
}, { timeout: 8000 });
const strangerState = await locks(stranger.page);
check('unknown email does not unlock', strangerState.counting === true && !strangerState.passKey, strangerState.note);

const linkCtx = await browser.createBrowserContext();
const link = await open(linkCtx, '/harness-verify.html');
await link.page.click('#restoreBtn');
await link.page.waitForSelector('#restoreSession');
await link.page.type('#restoreSession', 'https://example.test/back?session_id=' + RESTORE_ID);
await link.page.click('#payBody button.amber');
await link.page.waitForFunction(() => {
  const note = document.getElementById('payNote');
  return note && /active on this browser/.test(note.textContent || '');
}, { timeout: 8000 });
const linked = await locks(link.page);
check('verified return link restores the pass', linked.counting === false && postedSession(RESTORE_ID), linked.note);

const denyCtx = await browser.createBrowserContext();
const deny = await open(denyCtx, '/harness-verify.html?season_pass=1&session_id=' + FAKE);
const denyState = await locks(deny.page);
check('worker rejection does not unlock a fake id', denyState.counting === true && !denyState.passKey, denyState.note);
check('worker rejection says it was not confirmed', /did not confirm/.test(denyState.note), denyState.note);

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

const previewCtx = await browser.createBrowserContext();
const preview = await open(previewCtx, '/harness.html?preview=1&season_pass=1');
const previewState = await locks(preview.page);
check('bare preview=1 does not unlock', previewState.counting === true && previewState.ep1 === false && previewState.lone === true && previewState.steel === true, JSON.stringify({ counting: previewState.counting, ep1: previewState.ep1 }));
check('bare preview=1 does not store a pass', !previewState.passKey && !(previewState.file.slots || []).some(s => s.pass) && previewState.localPreview == null);
check('bare preview=1 does not set the old flag', previewState.previewFlag !== '1' && !previewState.previewTicket);
check('bare preview=1 strips the query', !/preview|season_pass/.test(previewState.url), previewState.url);
check('bare preview=1 does not call the worker', preview.requests.every(u => u.indexOf('/season-verify') < 0));

const bareVerifyCtx = await browser.createBrowserContext();
const bareVerify = await open(bareVerifyCtx, '/harness-verify.html?preview=1');
const bareVerifyState = await locks(bareVerify.page);
check('bare preview=1 stays locked when the worker is live', bareVerifyState.counting === true && !bareVerifyState.passKey && bareVerifyState.previewFlag !== '1' && !bareVerifyState.previewTicket);
check('bare preview=1 does not ask the live worker', bareVerify.requests.every(u => u.indexOf('/season-verify') < 0));
check('bare preview=1 leaves the review hint off', !/REVIEW UNLOCK/.test(bareVerifyState.hint), bareVerifyState.hint);

const closedCtx = await browser.createBrowserContext();
const closedPreview = await open(closedCtx, '/harness.html?preview=' + PREVIEW_CODE);
const closedState = await locks(closedPreview.page);
check('preview code fails closed without a worker url', closedState.counting === true && !closedState.passKey && !closedState.previewTicket, closedState.note);
check('preview code without a worker url says it is not set up', /not set up yet/.test(closedState.note), closedState.note);
check('preview code without a worker url does not call out', closedPreview.requests.every(u => u.indexOf('/season-verify') < 0));

const savedPreviewCode = env.PREVIEW_CODE;
delete env.PREVIEW_CODE;
const unsetCtx = await browser.createBrowserContext();
const unset = await open(unsetCtx, '/harness-verify.html?preview=' + PREVIEW_CODE);
const unsetState = await locks(unset.page);
check('preview code fails closed until the secret is set', unsetState.counting === true && !unsetState.passKey && !unsetState.previewTicket, unsetState.note);
check('unset secret says the unlock is not set up', /not set up yet/.test(unsetState.note), unsetState.note);
env.PREVIEW_CODE = savedPreviewCode;

const wrongCtx = await browser.createBrowserContext();
const wrong = await open(wrongCtx, '/harness-verify.html?preview=wrong-code-but-long-enough');
const wrongState = await locks(wrong.page);
check('wrong preview code does not unlock', wrongState.counting === true && wrongState.steel === true && !wrongState.passKey && !wrongState.previewTicket, wrongState.note);
check('wrong preview code says it was not granted', /was not granted/.test(wrongState.note), wrongState.note);
check('wrong preview code strips the query', !/preview/.test(wrongState.url), wrongState.url);

const ownerCtx = await browser.createBrowserContext();
const owner = await open(ownerCtx, '/harness-verify.html?preview=' + PREVIEW_CODE);
const ownerState = await locks(owner.page);
check('owner code unlocks this tab', ownerState.counting === false && ownerState.steel === false && ownerState.lone === false && ownerState.ep1 === false, JSON.stringify({ counting: ownerState.counting, steel: ownerState.steel, lone: ownerState.lone }));
check('owner code does not write the pass', !ownerState.passKey && !(ownerState.file.slots || []).some(s => s && s.pass) && ownerState.file.season && ownerState.file.season.pass !== true && ownerState.localPreview == null);
check('owner code stores only a tab ticket', previewTicketShape(ownerState.previewTicket) && ownerState.previewFlag !== '1');
check('owner code strips the query', !/preview/.test(ownerState.url), ownerState.url);
check('owner code shows the review hint', /REVIEW UNLOCK IS ON/.test(ownerState.hint), ownerState.hint);
check('owner code had no page error', owner.errors.length === 0, owner.errors.join(' | '));

await owner.page.goto(origin + '/harness-verify.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
await owner.page.waitForFunction(() => window.__ready === true && window.__previewSettled === true, { timeout: 8000 });
const ownerKept = await locks(owner.page);
check('ticket keeps this tab unlocked', ownerKept.counting === false && ownerKept.lone === false && !ownerKept.passKey && previewTicketShape(ownerKept.previewTicket));

const forgedCtx = await browser.createBrowserContext();
const forgedPage = await forgedCtx.newPage();
await forgedPage.goto(origin + '/blank.html');
await forgedPage.evaluate((ticket) => sessionStorage.setItem('latm_preview_ticket', ticket), PREVIEW_TICKET);
await forgedPage.goto(origin + '/harness-verify.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
await forgedPage.waitForFunction(() => window.__ready === true && window.__previewSettled === true, { timeout: 8000 });
const forgedState = await locks(forgedPage);
check('forged preview ticket does not unlock', forgedState.counting === true && !forgedState.passKey && !forgedState.previewTicket, forgedState.note);

const legacyFlagCtx = await browser.createBrowserContext();
const legacyFlagBlank = await legacyFlagCtx.newPage();
await legacyFlagBlank.goto(origin + '/blank.html');
await legacyFlagBlank.evaluate(() => sessionStorage.setItem('latm_preview', '1'));
await legacyFlagBlank.goto(origin + '/harness-verify.html?preview=1', { waitUntil: 'domcontentloaded', timeout: 30000 });
await legacyFlagBlank.waitForFunction(() => window.__ready === true && window.__previewSettled === true, { timeout: 8000 });
const legacyFlagState = await locks(legacyFlagBlank);
check('old preview flag does not unlock', legacyFlagState.counting === true && !legacyFlagState.passKey && legacyFlagState.previewFlag !== '1');

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
    remove: text.includes('REMOVE ADS'),
    price: text.includes('$2.99') && text.split('$2.99').length - 1 === 1,
    locked: window.Waking.isLocked('ch_counting'),
    mode: window.__LATM.G.mode,
  };
}, LINE);
check('title pay sheet is opaque and locked', live.background === 'rgb(7, 7, 11)' && live.line && !live.remove && live.price && live.locked === true && live.mode === 'title', JSON.stringify(live));
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
