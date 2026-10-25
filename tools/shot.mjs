import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let puppeteer;
try { puppeteer = require('puppeteer-core'); }
catch (e) { puppeteer = createRequire('/tmp/shotdeps/package.json')('puppeteer-core'); }
import { mkdirSync, writeFileSync } from 'fs';

const CHROME = '/usr/local/bin/google-chrome';
const BASE = 'http://127.0.0.1:8765/';
const OUT = '/opt/cursor/artifacts/screenshots';
const COPY = '/workspace/shots';
mkdirSync(OUT, { recursive: true });
mkdirSync(COPY, { recursive: true });

const report = { ok: true, checks: [], shots: [], console: [] };

function check(name, pass, detail){
  report.checks.push({ name, pass, detail: detail || '' });
  if (!pass) report.ok = false;
  console.log((pass ? 'PASS' : 'FAIL') + '  ' + name + (detail ? '  ' + detail : ''));
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader'],
});

function watch(page){
  const bad = [];
  const errors = [];
  page.on('request', req => {
    try {
      const host = new URL(req.url()).host;
      if (/jsdelivr|fonts\.googleapis|fonts\.gstatic/.test(host)) bad.push(req.url());
    } catch (e) {}
  });
  page.on('pageerror', err => errors.push(String(err)));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return { bad, errors };
}

async function shot(page, name){
  const file = name + '.png';
  await page.screenshot({ path: OUT + '/' + file });
  await page.screenshot({ path: COPY + '/' + file });
  report.shots.push(file);
}

async function boot(path, w, h){
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  const bag = watch(page);
  await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => window.__LATM && window.__LATM.G && window.__LATM.G.mode === 'title', { timeout: 45000 });
  await new Promise(r => setTimeout(r, 400));
  return { page, bag };
}

async function toChoice(page){
  await page.click('#startBtn');
  await page.waitForFunction(() => {
    const m = window.__LATM.G.mode;
    return m === 'cinematic' || m === 'beatclip' || m === 'play';
  }, { timeout: 20000 });
  await new Promise(r => setTimeout(r, 250));
  page._opener = await page.evaluate(() => {
    const v = document.getElementById('beatVideo');
    const log = (window.__LATM.clipLog || [])[0] || {};
    return { mode: window.__LATM.G.mode, max: log.max, id: log.id, src: v ? (v.currentSrc || v.src || '') : '' };
  });
  await page.evaluate(() => window.__LATM && window.__LATM.G && (window.__skip = true));
  await page.keyboard.press('Space');
  await page.waitForFunction(() => window.__LATM.G.mode === 'play', { timeout: 15000 });
  await page.evaluate(() => window.__LATM.Story.start(window.__LATM.SHELTER_BEATS));
  for (let i = 0; i < 10; i++){
    const on = await page.evaluate(() => getComputedStyle(document.getElementById('sChoice')).display !== 'none');
    if (on) return;
    await page.evaluate(() => window.__LATM.Story.advance());
    await new Promise(r => setTimeout(r, 40));
  }
}

try {
  const desk = await boot('?q=low', 1280, 720);
  check('offline desktop', desk.bag.bad.length === 0, desk.bag.bad.join(' '));
  await shot(desk.page, 'desktop-title');
  await desk.page.click('#chaptersBtn');
  await desk.page.waitForSelector('#chapterSheet', { visible: true });
  await shot(desk.page, 'desktop-chapters');
  await desk.page.evaluate(() => document.querySelector('#chapterSheet .btn:last-of-type').click());
  await desk.page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(n => n.textContent === 'ARCHIVE');
    if (b) b.click();
  });
  await desk.page.waitForFunction(() => {
    const s = document.getElementById('archiveSheet');
    return s && getComputedStyle(s).display !== 'none';
  });
  await shot(desk.page, 'desktop-archive');
  const archiveText = await desk.page.$eval('#archiveSheet', n => n.innerText);
  check('archive lists beat rows', /ROOM|OPEN/.test(archiveText) && /8 to 20/.test(archiveText));
  const linked = (archiveText.match(/PLAY FULL SHORT/g) || []).length;
  const titles = ['TWENTY FEET OF MACHINE', 'FORTY-THREE LEFT', 'THEY ARE STEALING OUR MINDS', 'THE AFTERNOONS', 'EIGHT HUNDRED METERS', 'BATCH', 'THE BASE IS GONE'];
  check('seven shorts linked', linked >= 7 && titles.every(t => archiveText.includes(t)), 'linked=' + linked + ' missing=' + titles.filter(t => !archiveText.includes(t)).join(','));
  for (const [name, needle] of [['desktop-archive-minds', 'THEY ARE STEALING OUR MINDS'], ['desktop-archive-meters', 'EIGHT HUNDRED METERS'], ['desktop-archive-base', 'THE BASE IS GONE']]){
    await desk.page.evaluate((needle) => {
      const hit = [...document.querySelectorAll('#archiveSheet .epHead')].find(n => n.textContent.includes(needle));
      if (hit) hit.scrollIntoView({ block: 'center' });
    }, needle);
    await new Promise(r => setTimeout(r, 200));
    await shot(desk.page, name);
  }
  check('full short not linked', /FULL SHORT NOT LINKED/.test(archiveText));
  await desk.page.evaluate(() => {
    const b = [...document.querySelectorAll('#archiveSheet button')].find(n => n.textContent === 'CLOSE');
    if (b) b.click();
  });
  await desk.page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(n => n.textContent === 'SETTINGS');
    if (b) b.click();
  });
  await shot(desk.page, 'desktop-settings');
  await desk.page.evaluate(() => {
    const b = [...document.querySelectorAll('#pauseSheet button')].find(n => n.textContent === 'CLOSE');
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 200));

  await toChoice(desk.page);
  const opener = desk.page._opener || {};
  check('ep1 opener is a short cue', opener.mode === 'beatclip' && opener.id === 'ep1_wake' && opener.max <= 15 && opener.max >= 8 && /game_ep1_origin/.test(opener.src) && !/game_ep1_train/.test(opener.src) && !/rsa_ep01_720p/.test(opener.src), JSON.stringify(opener));
  const layout = await desk.page.evaluate(() => {
    const dlg = document.getElementById('storyDlg').getBoundingClientRect();
    const choice = document.getElementById('sChoice').getBoundingClientRect();
    return {
      dlgDisplay: getComputedStyle(document.getElementById('storyDlg')).display,
      choiceDisplay: getComputedStyle(document.getElementById('sChoice')).display,
      dlgBottom: dlg.bottom,
      choiceTop: choice.top,
      text: document.getElementById('sText').textContent,
      mode: window.__LATM.G.mode,
    };
  });
  check('choice keeps dialogue', layout.dlgDisplay !== 'none' && layout.text.length > 8, layout.text.slice(0, 60));
  check('choice does not cover dialogue', layout.choiceDisplay !== 'none' && layout.dlgBottom <= layout.choiceTop + 2,
    'dlgBottom ' + Math.round(layout.dlgBottom) + ' choiceTop ' + Math.round(layout.choiceTop));
  await shot(desk.page, 'desktop-choice');
  const mode = await desk.page.evaluate(() => window.__LATM.G.mode);
  check('desktop reached story', mode === 'story', mode);
  if (desk.bag.errors.length) report.console.push(...desk.bag.errors.map(e => 'desktop ' + e));

  const phone = await boot('?q=low', 390, 844);
  check('offline phone', phone.bag.bad.length === 0, phone.bag.bad.join(' '));
  await shot(phone.page, 'phone-title');
  await toChoice(phone.page);
  const phoneLayout = await phone.page.evaluate(() => {
    const dlg = document.getElementById('storyDlg').getBoundingClientRect();
    const choice = document.getElementById('sChoice').getBoundingClientRect();
    const opts = [...document.querySelectorAll('.opt')].map(o => o.getBoundingClientRect());
    let stacked = true;
    for (let i = 1; i < opts.length; i++) if (opts[i].top < opts[i - 1].bottom - 2) stacked = false;
    return {
      dlgBottom: dlg.bottom, choiceTop: choice.top,
      dlgDisplay: getComputedStyle(document.getElementById('storyDlg')).display,
      stacked, n: opts.length,
    };
  });
  check('phone choice does not cover dialogue', phoneLayout.dlgDisplay !== 'none' && phoneLayout.dlgBottom <= phoneLayout.choiceTop + 2,
    'dlgBottom ' + Math.round(phoneLayout.dlgBottom) + ' choiceTop ' + Math.round(phoneLayout.choiceTop));
  check('phone choices stack', phoneLayout.stacked && phoneLayout.n >= 2, 'n=' + phoneLayout.n);
  await shot(phone.page, 'phone-choice');
  if (phone.bag.errors.length) report.console.push(...phone.bag.errors.map(e => 'phone ' + e));

  const conduits = await boot('?preview=1&q=low#ch_conduits', 1280, 720);
  await conduits.page.click('#startBtn');
  await conduits.page.waitForFunction(() => window.__LATM.clipLog && window.__LATM.clipLog.length, { timeout: 15000 });
  const clip = await conduits.page.evaluate(() => {
    const c = window.__LATM.clipLog[0];
    return { id: c.id, lines: c.lines, max: c.max, mode: window.__LATM.G.mode };
  });
  check('conduits opener is the briefing', clip.id === 'conduits_brief' && clip.lines === 3 && clip.max <= 20 && clip.max >= 8,
    JSON.stringify(clip));
  check('conduits opener is a beat clip', clip.mode === 'beatclip', clip.mode);
  await shot(conduits.page, 'conduits-opener');
  await new Promise(r => setTimeout(r, 250));
  await conduits.page.keyboard.press('KeyS');
  await conduits.page.waitForFunction(() => window.__LATM.G.mode === 'play', { timeout: 10000 });
  const after = await conduits.page.evaluate(() => window.__LATM.G.mode);
  check('skip returns to play', after === 'play', after);
  await new Promise(r => setTimeout(r, 300));
  await shot(conduits.page, 'conduits-play');
  if (conduits.bag.errors.length) report.console.push(...conduits.bag.errors.map(e => 'conduits ' + e));

  const pay = await boot('?q=low#ch_counting', 1280, 720);
  await pay.page.click('#startBtn');
  await pay.page.waitForFunction(() => {
    const s = document.getElementById('paySheet');
    return s && getComputedStyle(s).display !== 'none';
  }, { timeout: 8000 });
  await new Promise(r => setTimeout(r, 200));
  const payText = await pay.page.$eval('#paySheet', n => n.textContent || '');
  check('paywall does not grant a pass', /Nothing is charged/.test(payText) && /RevenueCat/.test(payText));
  check('ad stand in is labeled', /stand in until AdMob is connected/.test(payText));
  await shot(pay.page, 'desktop-paywall');
  const stillTitle = await pay.page.evaluate(() => window.__LATM.G.mode);
  check('locked chapter stays on the title', stillTitle === 'title', stillTitle);

  const hard = report.console.filter(e => /ReferenceError|updateIntro|is not defined|SyntaxError/.test(e));
  check('no crash strings', hard.length === 0, hard.join(' | ').slice(0, 400));
  if (report.console.length) console.log('CONSOLE\n' + report.console.join('\n').slice(0, 2000));
} catch (err){
  report.ok = false;
  report.checks.push({ name: 'runner', pass: false, detail: String(err && err.stack || err) });
  console.error(err);
} finally {
  writeFileSync('/opt/cursor/artifacts/screenshots/report.json', JSON.stringify(report, null, 2));
  writeFileSync('/workspace/shots/report.json', JSON.stringify(report, null, 2));
  await browser.close();
}

if (!report.ok) process.exit(1);
