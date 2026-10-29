// Phone-sized playthrough of every chapter, with model loads stalled and
// the CPU throttled. Fails if an objective cannot reach its ending.
// Run: node tools/full-run.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const PORT = 8871;
const DEBUG = 9341;
const CHAPTERS = ['ep1','ch_taken','ch_ghost','ch_together','ch_lone','ch_counting','ch_conduits','ch_harvest','ch_steel'];
const LIMIT_MS = 75000;
const HOLD = {
  ch_conduits: true,
  ch_steel: true,
};

const types = {
  '.html':'text/html', '.js':'text/javascript', '.mjs':'text/javascript',
  '.css':'text/css', '.json':'application/json', '.webmanifest':'application/manifest+json',
  '.jpg':'image/jpeg', '.png':'image/png', '.woff2':'font/woff2', '.mp4':'video/mp4',
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  let p = path.normalize(path.join(ROOT, decodeURIComponent(url.pathname)));
  if (p.endsWith(path.sep)) p = path.join(p, 'index.html');
  if (!p.startsWith(ROOT)){ res.writeHead(403); res.end(); return; }
  fs.readFile(p, (err, buf) => {
    if (err){ res.writeHead(404); res.end('missing'); return; }
    res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream', 'cache-control':'no-store' });
    res.end(buf);
  });
});
await new Promise(r => server.listen(PORT, '127.0.0.1', r));

const chrome = spawn('google-chrome', [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage',
  '--autoplay-policy=no-user-gesture-required',
  `--remote-debugging-port=${DEBUG}`, `--user-data-dir=/tmp/latm-fullrun-${DEBUG}`,
  'about:blank',
], { stdio: 'ignore' });

const sleep = ms => new Promise(r => setTimeout(r, ms));
let version;
for (let i = 0; i < 50; i++){
  try { version = await (await fetch(`http://127.0.0.1:${DEBUG}/json/version`)).json(); break; }
  catch { await sleep(100); }
}
if (!version) throw new Error('chrome did not open');

const ws = new WebSocket(version.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let seq = 0;
const pending = new Map();
ws.onmessage = ev => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)){
    const p = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) p.reject(new Error(JSON.stringify(msg.error)));
    else p.resolve(msg.result);
  }
};
function cdp(method, params = {}, sessionId){
  const id = ++seq;
  const payload = { id, method, params };
  if (sessionId) payload.sessionId = sessionId;
  ws.send(JSON.stringify(payload));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

const { targetId } = await cdp('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await cdp('Target.attachToTarget', { targetId, flatten: true });
await cdp('Page.enable', {}, sessionId);
await cdp('Network.enable', {}, sessionId);
await cdp('Network.setBlockedURLs', { urls: ['*.glb', '*/*.glb'] }, sessionId);
await cdp('Emulation.setDeviceMetricsOverride', {
  width: 390, height: 844, deviceScaleFactor: 2, mobile: true,
}, sessionId);
await cdp('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 }, sessionId);
await cdp('Emulation.setCPUThrottlingRate', { rate: 4 }, sessionId);
// Headless playthrough only. Seeds a local pass so paid chapters can
// start. This is not the public preview URL, and it is not shipped
// as a way to unlock the site.
await cdp('Page.addScriptToEvaluateOnNewDocument', {
  source: "try{localStorage.setItem('latm_season_pass_v1', JSON.stringify({v:1,pass:true,at:1,session:''}))}catch(e){}",
}, sessionId);

async function evalPage(expression){
  const result = await cdp('Runtime.evaluate', {
    expression, awaitPromise: true, returnByValue: true,
  }, sessionId);
  if (result.exceptionDetails){
    const ex = result.exceptionDetails.exception;
    throw new Error(result.exceptionDetails.text + ' ' + (ex && ex.description ? ex.description : ''));
  }
  return result.result.value;
}

const STEP = `(() => {
  const L = window.__LATM;
  if (!L || !L.G) return { act:'boot' };
  window.__run = window.__run || { ambush:false, objs:[] };
  const R = window.__run;
  const objEl = document.getElementById('objective');
  const obj = objEl ? objEl.textContent : '';
  if (obj && R.objs[R.objs.length - 1] !== obj) R.objs.push(obj);
  if (L.G.ambush === 'live') R.ambush = true;
  const skip = document.getElementById('skipBtn');
  const skipOn = skip && parseFloat(getComputedStyle(skip).opacity) > 0.4;
  const snap = act => ({ act, mode:L.G.mode, obj, ambush:L.G.ambush || '', planted:!!L.G.planted, escape:!!L.G.escape, z:L.yawObj.position.z, seen:R.ambush, touch:!!L.isTouch });
  if (skipOn && (L.G.mode === 'beatclip' || L.G.mode === 'cinematic' || L.G.mode === 'intro' || L.G.mode === 'galleryclip')){
    skip.click();
    return snap('skip');
  }
  if (L.G.mode === 'story'){
    const opts = Array.from(document.querySelectorAll('#sOpts button.opt:not(.locked)'));
    const silent = opts.filter(o => o.classList.contains('silent'));
    const pick = silent.length ? silent[silent.length - 1] : opts[opts.length - 1];
    if (pick) pick.click();
    else {
      const wrap = document.getElementById('storyWrap');
      if (wrap) wrap.dispatchEvent(new PointerEvent('pointerdown', { bubbles:true }));
    }
    return snap('story');
  }
  if (L.G.mode === 'title'){
    const b = document.getElementById('startBtn');
    if (b) b.click();
    return snap('start');
  }
  if (L.G.mode !== 'play') return snap('wait');
  L.G.detect = 0;
  if (L.G.hp < 80) L.G.hp = 100;
  if (L.SFLAGS && L.SFLAGS.leftTrain && !L.G.hasRifle && L.pickupRifle) L.pickupRifle();
  for (const d of L.drones){
    if (!d.alive) continue;
    if (d.ambush || d.segment === L.G.currentSegment || d.segment === 9){
      try { L.damageDrone(d, 999); } catch (e) {}
    }
  }
  const rooms = L.ROOMS;
  const exitZ = rooms[0].z1 + 3;
  const core = L.coreXZ ? L.coreXZ() : { x:0, z: rooms[rooms.length - 1].z1 + 4 };
  const boss = L.Boss && L.Boss.H && L.Boss.H.active;
  if (boss && L.Boss.H.phase !== 'pinned' && L.Boss.H.phase !== 'done' && L.Boss.H.phase !== 'dim'){
    try { L.Boss._force('pinned'); } catch (e) {}
  }
  const hold = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code:'KeyE', key:'e', bubbles:true }));
    const plant = document.getElementById('plantBtn');
    if (plant && plant.style.display !== 'none'){
      plant.dispatchEvent(new PointerEvent('pointerdown', { bubbles:true, pointerId:1, pointerType:'touch', isPrimary:true }));
    }
  };
  const release = () => window.dispatchEvent(new KeyboardEvent('keyup', { code:'KeyE', key:'e', bubbles:true }));
  if (!L.G.planted){
    if (L.yawObj.position.z > core.z + 4){
      release();
      L.yawObj.position.z -= 5;
      L.yawObj.position.x = 0;
      L.G.yaw = 0;
    } else {
      L.yawObj.position.x = core.x;
      L.yawObj.position.z = core.z + 1.6;
      L.G.yaw = 0;
      hold();
    }
  } else if (L.G.ambush === 'live' || L.G.ambush === 'ending'){
    L.yawObj.position.z += 2;
  } else if (L.G.escape){
    if (L.yawObj.position.z < exitZ) L.yawObj.position.z += 6;
  }
  return snap('play');
})()`;

async function runChapter(id){
  const url = `http://127.0.0.1:${PORT}/index.html?t=${Date.now()}-${id}#${id}`;
  await cdp('Page.navigate', { url }, sessionId);
  const t0 = Date.now();
  let last = null;
  let booted = false;
  while (Date.now() - t0 < LIMIT_MS){
    await sleep(180);
    let s;
    try { s = await evalPage(STEP); }
    catch (e){ return { id, pass:false, detail:String(e.message || e).slice(0, 240) }; }
    last = s;
    if (s && s.mode) booted = true;
    if (!s || s.act === 'boot') continue;
    const finished = s.planted && (s.mode === 'end' || s.mode === 'extracting' || s.mode === 'story');
    if (finished){
      if (HOLD[id] && !s.seen) return { id, pass:false, detail:'finale without the exit pair', obj:s.obj, mode:s.mode };
      return { id, pass:true, ms:Date.now() - t0, obj:s.obj, mode:s.mode, ambush:s.seen, touch:s.touch };
    }
  }
  return { id, pass:false, detail: booted ? 'timed out' : 'did not boot', obj:last && last.obj, mode:last && last.mode, z:last && last.z, planted:last && last.planted, ambush:last && last.ambush };
}

const results = [];
for (const id of CHAPTERS){
  const row = await runChapter(id);
  results.push(row);
  console.log((row.pass ? 'PASS' : 'FAIL') + ' ' + id + ' ' + (row.detail || row.mode || '') + ' ' + (row.obj || '') + (row.ms ? ' ' + row.ms + 'ms' : ''));
}
ws.close();
chrome.kill('SIGKILL');
server.close();
const failed = results.filter(r => !r.pass);
if (failed.length){
  console.error(JSON.stringify(failed, null, 2));
  process.exit(1);
}
console.log('full run passed: ' + results.length + ' chapters');
