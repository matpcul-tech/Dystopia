// Prove the Capacitor www bundle can boot with no CDN and no other hosts.
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const www = join(root, 'www');
const fail = [];

function bad(msg){ fail.push(msg); }

function walk(dir, out){
  for (const name of readdirSync(dir)){
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

if (!existsSync(join(www, 'index.html'))){
  const { spawnSync } = await import('node:child_process');
  const built = spawnSync(process.execPath, ['tools/build-www.mjs'], { cwd: root, stdio: 'inherit' });
  if (built.status !== 0) process.exit(built.status || 1);
}

const pagesHtml = readFileSync(join(root, 'index.html'), 'utf8');
if (pagesHtml.includes('native-shell.js')) bad('Pages index.html must not load native-shell.js');
if (/jsdelivr|fonts\.googleapis|fonts\.gstatic|unpkg\.com/.test(pagesHtml)){
  bad('Pages index.html still points at a CDN');
}

const html = readFileSync(join(www, 'index.html'), 'utf8');
if (!html.includes('native-shell.js')) bad('www/index.html is missing native-shell.js');
if (!html.includes('vendor/fonts/fonts.css')) bad('www/index.html is missing local fonts');
if (!html.includes('./vendor/three/build/three.module.js')) bad('www import map is not the local Three.js build');

const three = readFileSync(join(www, 'vendor/three/build/three.module.js'), 'utf8');
if (!three.includes("const REVISION = '160'")) bad('vendored Three.js is not r160');

const required = [
  'native-shell.js',
  'game.js',
  'style.css',
  'sky.jpg',
  'book1-cover.jpg',
  'models/rifle.glb',
  'models/crawler.glb',
  'models/sentry.glb',
  'models/warden.glb',
  'media/shorts/game/game_ep1_origin_v2.mp4',
  'vendor/fonts/fonts.css',
  'vendor/three/examples/jsm/loaders/GLTFLoader.js',
  'vendor/three/examples/jsm/postprocessing/EffectComposer.js',
];
for (const rel of required){
  if (!existsSync(join(www, rel))) bad('missing ' + rel);
}

const fontCss = readFileSync(join(www, 'vendor/fonts/fonts.css'), 'utf8');
const fontUrls = [...fontCss.matchAll(/url\(([^)]+)\)/g)].map(m => m[1].replace(/['"]/g, ''));
if (!fontUrls.length) bad('fonts.css has no font files');
for (const url of fontUrls){
  if (/^https?:/.test(url)) bad('font url is remote: ' + url);
  else if (!existsSync(join(www, 'vendor/fonts', url))) bad('missing font file ' + url);
}
if (!fontCss.includes("font-family: 'Cormorant Garamond'")) bad('Cormorant Garamond is not in fonts.css');
if (!fontCss.includes("font-family: 'Outfit'")) bad('Outfit is not in fonts.css');

const jsFiles = walk(join(www, 'vendor/three'), []).filter(p => p.endsWith('.js'));
for (const file of jsFiles){
  const text = readFileSync(file, 'utf8');
  if (/cdn\.jsdelivr|fonts\.googleapis|fonts\.gstatic|unpkg\.com/.test(text)) bad('CDN url inside ' + file);
  const specs = [];
  for (const line of text.split('\n')){
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) continue;
    const match = trimmed.match(/^(?:import|export)\b.*\bfrom\s+['"]([^'"]+)['"]/)
      || trimmed.match(/^}\s*from\s+['"]([^'"]+)['"]/);
    if (match) specs.push(match[1]);
  }
  for (const spec of specs){
    if (spec === 'three' || spec.startsWith('three/')) continue;
    if (!spec.startsWith('.')) bad('unexpected import ' + spec + ' in ' + file);
    else if (!existsSync(join(dirname(file), spec))) bad('broken import ' + spec + ' in ' + file);
  }
}

const banned = /cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com|unpkg\.com/;
for (const file of walk(www, []).filter(p => /\.(html|css|js|mjs)$/.test(p))){
  if (banned.test(readFileSync(file, 'utf8'))) bad('CDN host in ' + file.replace(www + '/', ''));
}

if (fail.length){
  console.error(fail.join('\n'));
  process.exit(1);
}

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
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
  if (rel.split('/').includes('..')){ res.writeHead(400); res.end('bad path'); return; }
  const path = normalize(join(www, rel));
  if (!path.startsWith(www + '/') || !existsSync(path) || statSync(path).isDirectory()){
    res.writeHead(404); res.end('missing'); return;
  }
  res.writeHead(200, { 'content-type': types[extname(path)] || 'application/octet-stream' });
  res.end(readFileSync(path));
});

await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
const pageUrl = `http://127.0.0.1:${port}/`;
const remoteHosts = [];
const exceptions = [];

const chrome = spawn('google-chrome', [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--disable-dev-shm-usage',
  '--remote-debugging-port=0',
  `--user-data-dir=/tmp/waking-offline-${port}`,
  '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1',
  pageUrl,
], { stdio: ['ignore', 'pipe', 'pipe'] });

let dbg = '';
chrome.stderr.on('data', chunk => {
  dbg += chunk.toString();
});

const deadline = Date.now() + 20000;
let devtools = null;
while (Date.now() < deadline){
  const match = dbg.match(/DevTools listening on (ws:\/\/\S+)/);
  if (match){ devtools = match[1]; break; }
  if (chrome.exitCode != null) break;
  await new Promise(r => setTimeout(r, 100));
}
if (!devtools){
  chrome.kill('SIGKILL');
  server.close();
  console.error(dbg.slice(-2000));
  console.error('Chrome did not open a DevTools port');
  process.exit(1);
}

// remote-debugging-port=0 prints a browser websocket, not an HTTP port. Parse the port from the ws url.
const httpPort = new URL(devtools.replace(/^ws:/, 'http:')).port;
const targets = await fetch(`http://127.0.0.1:${httpPort}/json/list`).then(r => r.json());
const page = targets.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
if (!page){
  chrome.kill('SIGKILL');
  server.close();
  console.error('no Chrome page target');
  process.exit(1);
}

const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve);
  ws.addEventListener('error', reject);
});

let nextId = 0;
const pending = new Map();
function send(method, params){
  const id = ++nextId;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
  });
}
ws.addEventListener('message', event => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)){
    const waiter = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) waiter.reject(new Error(msg.error.message));
    else waiter.resolve(msg.result);
  } else if (msg.method === 'Network.responseReceived'){
    const url = msg.params.response.url;
    if (url.startsWith('http') && !url.startsWith(pageUrl) && !url.startsWith('data:')){
      remoteHosts.push(url);
    }
  } else if (msg.method === 'Network.loadingFailed'){
    const url = msg.params.url || '';
    if (url && !url.startsWith(pageUrl)) remoteHosts.push('FAILED ' + url);
  } else if (msg.method === 'Runtime.exceptionThrown'){
    const details = msg.params.exceptionDetails;
    exceptions.push(details.exception?.description || details.text || 'exception');
  }
});

await send('Network.enable');
await send('Runtime.enable');
await send('Page.enable');

let probe = null;
const probeDeadline = Date.now() + 15000;
while (Date.now() < probeDeadline){
  const result = await send('Runtime.evaluate', {
    expression: `document.fonts.ready.then(() => ({
      three: window.THREE && window.THREE.REVISION,
      button: (document.getElementById('startBtn') || {}).textContent || '',
      cormorant: document.fonts.check('500 32px "Cormorant Garamond"'),
      outfit: document.fonts.check('16px Outfit'),
      speech: typeof window.speechSynthesis,
      canvas: !!document.querySelector('canvas'),
      webgl: !!(document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl'))
    }))`,
    awaitPromise: true,
    returnByValue: true,
  });
  probe = result.result?.value;
  if (probe && probe.three === '160' && probe.button.includes('NEW GAME')) break;
  await new Promise(r => setTimeout(r, 400));
}

chrome.kill('SIGKILL');
server.close();
ws.close();

if (!probe || probe.three !== '160') bad('Three.js r160 did not load. Got ' + JSON.stringify(probe));
if (!probe || !String(probe.button).includes('NEW GAME')) bad('title screen did not render');
if (!probe || !probe.cormorant) bad('Cormorant Garamond did not load from the local font files');
if (!probe || !probe.outfit) bad('Outfit did not load from the local font files');
if (remoteHosts.length) bad('request left the local server: ' + remoteHosts.join(', '));
const realErrors = exceptions.filter(line => !/speechSynthesis|NotAllowedError/.test(line));
if (realErrors.length) bad('page exception: ' + realErrors.join(' | '));

if (fail.length){
  console.error(fail.join('\n'));
  console.error(JSON.stringify({ probe, exceptions, remoteHosts }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  probe,
  note: 'Headless Chrome loaded the offline www bundle with external hosts blocked. This is not a device WebView test.',
}, null, 2));
