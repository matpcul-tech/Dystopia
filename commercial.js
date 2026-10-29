// Commercial shell: settings, 3 save slots, entitlements, choice counts.
// Three book trailers open the chapter you asked for during this visit.
// They do not set Season Pass. Season Pass is the only permanent unlock
// (every chapter, and no trailers). The button opens COMMERCE.SEASON_URL
// in this same tab.
// A return never grants from a cs_ session id by itself. The page posts
// { session_id } to COMMERCE.SEASON_VERIFY_URL and grants only when the
// JSON says { pass: true }. Restore posts { email } or { session_id }
// the same way. An empty URL fails closed.
// After a real grant, the id is stored in this browser so the same URL
// does not grant twice here.
// The pass is stored for every save slot in this browser, plus a
// separate key that survives a slot switch. ?preview=1 unlocks this
// tab without writing the pass.
// A missing trailer file shows an error and does not count a view.
// There is no Stripe secret in this file. SEASON_VERIFY_URL is the
// deployed worker. See cloud/SEASON_PASS_WORKER.md.

import { resumePlan } from './feel.js';
import { PASS_KEY, USED_KEY, askSeasonVerify, judgeRestore, judgeReturn, plausibleSessionId } from './season-pass.js';
import {
  CODEX, COSMETICS,
  applySignalReward, campaignCleared, ngPlusSlot, readDaily, slotTag, todayKey, writeDaily,
} from './return-loop.js';

const SAVE_KEY = 'latm_save_v1';
const CH2 = { together:'ch_together', lone:'ch_lone', ghost:'ch_ghost', taken:'ch_taken' };
const CH2_IDS = Object.values(CH2);
const PAID = ['ch_counting', 'ch_conduits', 'ch_harvest', 'ch_steel'];

export const COMMERCE = {
  STATS_URL: '',
  ANALYTICS_URL: '',
  SEASON_URL: 'https://buy.stripe.com/bJe14pfBe0XNfJz0Xk3wQ00',
  // Live Season Pass verify worker. See cloud/SEASON_PASS_WORKER.md.
  // Empty fails closed: a cs_ session id never grants Season Pass.
  SEASON_VERIFY_URL: 'https://waking-season-pass.matpcul.workers.dev',
  SEASON_PRICE: '$6.99',
  // Price kept for a future real charge. The button stays hidden until then.
  REMOVE_ADS_PRICE: '$2.99',
  STEAM_PRICE: '$7.99',
  AD_VIEWS: 3,
};

// Trailer progress for this visit lives in sessionStorage.
// slot.ads stays in the save shape and does not unlock chapters.
// Replace an mp4, keep the path.
const TRAILERS = [
  {
    id: 'dystopia',
    title: 'Dystopia: Life After The Machines',
    src: 'ads/dystopia.mp4',
    cta: 'OPEN ON AMAZON',
    url: 'https://www.amazon.com/dp/B0H2SGHFNN',
  },
  {
    id: 'borrowed-heartbeat',
    title: 'Borrowed Heartbeat',
    src: 'ads/borrowed-heartbeat.mp4',
    cta: 'OPEN ON AMAZON',
    url: 'https://www.amazon.com/dp/B0GXP6KYBN',
  },
  {
    id: 'ailt',
    title: 'Adaptive Inclusive Leadership Theory (AILT)',
    src: 'ads/ailt.mp4',
    cta: 'OPEN AUTHOR HUB',
    url: 'https://matthew-culwell-author-page.vercel.app',
  },
];

let trailerToken = 0;
let trailerSettled = false;
let activeVideo = null;

let memory = null;
let api = null;
let pausedFrom = null;
let panels = {};

function defaultSettings(){
  return {
    volume: 0.8,
    voices: 'on',
    textSize: 'md',
    textSpeed: 1,
    timer: 'on',
    motion: 'full',
    quality: 'auto',
    mode: 'action',
    // Portrait default lives here. New saves, and any save with no
    // portraits key, get cards (applySettings and portraitMode also
    // fall back to cards when the key is missing). A stored value,
    // including blocks, is kept. Settings can still switch it.
    portraits: 'cards',
    gamepad: true,
    _init: 0,
  };
}
function emptySlot(i){
  return {
    name: 'SLOT ' + (i + 1),
    updated: 0,
    mid: null,
    book: {},
    carry: {},
    unlocked: [],
    endings: [],
    ads: {},
    pass: false,
    noAds: false,
    choices: {},
    ngPlus: 0,
    cosmetics: [],
    codexHints: [],
    signalMarks: {},
    lastSignal: '',
  };
}
function ensureReturnSlot(s){
  if (!s) return s;
  if (!Array.isArray(s.cosmetics)) s.cosmetics = [];
  if (!Array.isArray(s.codexHints)) s.codexHints = [];
  if (!s.signalMarks || typeof s.signalMarks !== 'object') s.signalMarks = {};
  if (!s.ngPlus) s.ngPlus = 0;
  if (!s.lastSignal) s.lastSignal = '';
  return s;
}
function loadFile(){
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const file = JSON.parse(raw);
    if (!file || file.v !== 1 || !Array.isArray(file.slots) || file.slots.length !== 3) return null;
    return file;
  } catch (e) { return null; }
}
function migrate(){
  const file = { v:1, active:0, slots:[emptySlot(0), emptySlot(1), emptySlot(2)], settings:defaultSettings(), analytics:[], world:{} };
  const s = file.slots[0];
  try { s.book = JSON.parse(localStorage.getItem('latm_book')) || {}; } catch (e) {}
  try { s.carry = JSON.parse(localStorage.getItem('latm_carry')) || {}; } catch (e) {}
  try { s.unlocked = JSON.parse(localStorage.getItem('latm_unlocked')) || []; } catch (e) {}
  try { s.endings = JSON.parse(localStorage.getItem('latm_hybrid_endings')) || []; } catch (e) {}
  if (s.unlocked.length || s.endings.length || Object.keys(s.book).length) s.updated = Date.now();
  const touch = (typeof navigator !== 'undefined') && (('ontouchstart' in window) || navigator.maxTouchPoints > 0);
  file.settings.mode = touch ? 'story' : 'action';
  file.settings._init = 1;
  return file;
}
function persist(){
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(memory)); } catch (e) {}
}
function slot(){ return memory.slots[memory.active] || memory.slots[0]; }
function writeLegacy(s){
  try {
    localStorage.setItem('latm_book', JSON.stringify(s.book || {}));
    localStorage.setItem('latm_carry', JSON.stringify(s.carry || {}));
    localStorage.setItem('latm_unlocked', JSON.stringify(s.unlocked || []));
    localStorage.setItem('latm_hybrid_endings', JSON.stringify(s.endings || []));
  } catch (e) {}
}
function pullLegacy(s){
  try { s.book = JSON.parse(localStorage.getItem('latm_book')) || {}; } catch (e) {}
  try { s.carry = JSON.parse(localStorage.getItem('latm_carry')) || {}; } catch (e) {}
  try { s.unlocked = JSON.parse(localStorage.getItem('latm_unlocked')) || []; } catch (e) {}
  try { s.endings = JSON.parse(localStorage.getItem('latm_hybrid_endings')) || []; } catch (e) {}
  s.updated = Date.now();
}
function applySettings(){
  const st = memory.settings;
  const root = document.documentElement;
  root.dataset.text = st.textSize || 'md';
  root.dataset.motion = st.motion || 'full';
  root.dataset.mode = st.mode || 'action';
  root.dataset.portraits = st.portraits || 'cards';
  if (api && api.setVolume) api.setVolume(st.volume);
  // ?q= on the URL is the playtest override. Do not let a saved
  // settings tier clobber it after the world has already been built.
  var urlQ = '';
  try { urlQ = new URLSearchParams(location.search).get('q') || ''; } catch (e) {}
  if (api && api.applyQuality && st.quality && st.quality !== 'auto' && !urlQ) api.applyQuality(st.quality);
  const line = typeof document !== 'undefined' && document.getElementById('modeLine');
  if (line){
    const ng = slotTag(slot());
    line.textContent = (st.mode === 'story' ? 'STORY MODE' : 'ACTION MODE') + (ng ? '  ' + ng.trim() : '');
  }
  applyCosmetics();
}
function applyCosmetics(){
  if (typeof document === 'undefined') return;
  const owned = (slot() && slot().cosmetics) || [];
  document.documentElement.dataset.cosmetics = owned.join(' ');
}
function endingIds(){
  const s = slot();
  const fromSlot = s && Array.isArray(s.endings) ? s.endings : [];
  let fromLegacy = [];
  try { fromLegacy = JSON.parse(localStorage.getItem('latm_hybrid_endings')) || []; } catch (e) {}
  return Array.from(new Set(fromSlot.concat(fromLegacy)));
}
function readPassRecord(){
  try {
    const raw = localStorage.getItem(PASS_KEY);
    const data = raw ? JSON.parse(raw) : null;
    if (data && data.pass === true) return data;
  } catch (e) {}
  if (memory && memory.season && memory.season.pass === true) return memory.season;
  return null;
}
function hasDevicePass(){
  return !!readPassRecord();
}
function hasPass(){
  try { if (sessionStorage.getItem('latm_preview') === '1') return true; } catch (e) {}
  if (hasDevicePass()) return true;
  return !!(memory && memory.slots && memory.slots.some(s => s && s.pass));
}
function readUsed(){
  try {
    const raw = localStorage.getItem(USED_KEY);
    const list = raw ? JSON.parse(raw) : null;
    if (Array.isArray(list)) return list.filter(id => typeof id === 'string');
  } catch (e) {}
  if (memory && Array.isArray(memory.usedSessions)) return memory.usedSessions.filter(id => typeof id === 'string');
  return [];
}
function rememberSession(id){
  if (!plausibleSessionId(id)) return;
  const list = readUsed();
  if (list.indexOf(id) < 0) list.push(id);
  const trimmed = list.slice(-40);
  memory.usedSessions = trimmed;
  try { localStorage.setItem(USED_KEY, JSON.stringify(trimmed)); } catch (e) {}
}
function mirrorPass(rec){
  memory.season = rec;
  memory.slots.forEach(s => {
    if (!s) return;
    s.pass = true;
    s.noAds = true;
  });
}
// A pass bought on one slot, or stored only in the save file, becomes
// the browser entitlement so a slot switch cannot drop it.
function promotePass(){
  let rec = null;
  try {
    const raw = localStorage.getItem(PASS_KEY);
    const data = raw ? JSON.parse(raw) : null;
    if (data && data.pass === true) rec = data;
  } catch (e) {}
  if (!rec && memory.season && memory.season.pass === true) rec = memory.season;
  if (!rec && memory.slots.some(s => s && s.pass)) {
    rec = { v: 1, pass: true, at: Date.now(), session: '' };
  }
  if (!rec) {
    if (!memory.season || memory.season.pass !== true) memory.season = { v: 1, pass: false };
    return;
  }
  try { localStorage.setItem(PASS_KEY, JSON.stringify(rec)); } catch (e) {}
  mirrorPass(rec);
}
// The old Remove Ads control set noAds without a charge and then hid
// the trailers. Clear that flag unless Season Pass is really held.
function clearFreeNoAds(){
  if (memory.season && memory.season.pass === true) return;
  memory.slots.forEach(s => {
    if (s && s.noAds) s.noAds = false;
  });
}
function previewOn(){
  try { return sessionStorage.getItem('latm_preview') === '1'; } catch (e) { return false; }
}
// Permanent Season Pass: every paid chapter and no trailers.
// Called only after the purchase check returns { pass: true }.
// Trailers and the pay button do not call this.
// ?preview=1 unlocks the tab through hasPass() without this function.
function grantSeason(sessionId){
  const rec = { v: 1, pass: true, at: Date.now(), session: sessionId || '' };
  try { localStorage.setItem(PASS_KEY, JSON.stringify(rec)); } catch (e) {}
  mirrorPass(rec);
  memory.slots.forEach(s => {
    if (!s) return;
    if (!s.unlocked) s.unlocked = [];
    CH2_IDS.concat(PAID).forEach(id => {
      if (s.unlocked.indexOf(id) < 0) s.unlocked.push(id);
    });
  });
  writeLegacy(slot());
  persist();
  rememberSession(sessionId);
  track('season_unlock', {});
}

export function bootSaves(){
  if (typeof localStorage === 'undefined') {
    memory = migrate();
    settleTrailerSession();
    claimSeasonReturn();
    return;
  }
  const params = new URLSearchParams(location.search);
  if (params.get('preview') === '1') {
    try { sessionStorage.setItem('latm_preview', '1'); } catch (e) {}
  }
  memory = loadFile() || migrate();
  memory.slots.forEach(ensureReturnSlot);
  memory.settings = Object.assign(defaultSettings(), memory.settings || {});
  if (!memory.settings._init) {
    const touch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    memory.settings.mode = touch ? 'story' : 'action';
    memory.settings._init = 1;
  }
  if (!memory.world) memory.world = {};
  if (!memory.analytics) memory.analytics = [];
  if (!Array.isArray(memory.usedSessions)) memory.usedSessions = readUsed();
  promotePass();
  clearFreeNoAds();
  writeLegacy(slot());
  persist();
  if (typeof document !== 'undefined') applySettings();
  settleTrailerSession();
  claimSeasonReturn();
}

// Strip the return query either way, so a refresh is not a second try.
// Grant only after the worker says { pass: true }.
async function claimSeasonReturn(){
  if (typeof location === 'undefined') return;
  let params;
  try { params = new URLSearchParams(location.search); } catch (e) { return; }
  if (params.get('season_pass') !== '1') return;
  const verdict = judgeReturn(params.get('season_pass'), params.get('session_id'), readUsed(), hasDevicePass());
  params.delete('season_pass');
  params.delete('session_id');
  const q = params.toString();
  const next = location.pathname + (q ? '?' + q : '') + (location.hash || '');
  try { history.replaceState(history.state, '', next); } catch (e) {}
  if (verdict.action !== 'verify') {
    showSeasonNote(seasonMessage(verdict.action, 'return'));
    return;
  }
  showSeasonNote('Checking the purchase.');
  const result = await askSeasonVerify(COMMERCE.SEASON_VERIFY_URL, { session_id: verdict.id });
  if (result.pass === true) {
    grantSeason(verdict.id);
    showSeasonNote(seasonMessage('granted', 'return'));
    return;
  }
  showSeasonNote(seasonFailureNote(result, 'return'));
}
function seasonMessage(action, source){
  if (action === 'granted' || action === 'already') return 'Season Pass is active on this browser, on every save slot.';
  if (action === 'replay') return 'That checkout id was already used in this browser. Season Pass was not granted again.';
  if (hasDevicePass()) return 'Season Pass is active on this browser, on every save slot.';
  if (action === 'verify') return 'Season Pass was not granted. The purchase check is not connected yet.';
  if (source === 'restore') return 'That is not an email or a return link. Enter the email from your Stripe receipt.';
  return 'Season Pass was not granted. The return link did not include a checkout id.';
}
function seasonFailureNote(result, source){
  if (!result || result.reason === 'unconfigured') {
    return 'Season Pass was not granted. The purchase check is not connected yet.';
  }
  if (result.reason === 'network') {
    return 'Season Pass was not granted. The purchase check did not respond.';
  }
  if (result.reason === 'used' || result.status === 409) {
    return 'That checkout was already used. Season Pass was not granted again.';
  }
  if (source === 'restore') {
    return 'Season Pass was not granted. The purchase check did not confirm that email or return link.';
  }
  return 'Season Pass was not granted. The purchase check did not confirm this checkout.';
}
function showSeasonNote(text){
  if (typeof document === 'undefined' || !document.body) return;
  let note = document.getElementById('seasonNote');
  if (!note) {
    note = document.createElement('p');
    note.id = 'seasonNote';
    note.className = 'modeLine';
    const start = document.getElementById('startScreen');
    const hint = document.getElementById('startHint');
    if (start && hint && hint.parentNode === start) hint.insertAdjacentElement('afterend', note);
    else if (start) start.appendChild(note);
    else document.body.appendChild(note);
  }
  note.textContent = text;
}
async function applyRestore(raw){
  if (hasDevicePass()) return seasonMessage('already', 'restore');
  const verdict = judgeRestore(raw, readUsed(), false);
  if (verdict.action !== 'verify') return seasonMessage(verdict.action, 'restore');
  const body = verdict.email ? { email: verdict.email } : { session_id: verdict.id };
  const result = await askSeasonVerify(COMMERCE.SEASON_VERIFY_URL, body);
  if (result.pass === true) {
    grantSeason(verdict.id || '');
    return seasonMessage('granted', 'restore');
  }
  return seasonFailureNote(result, 'restore');
}
function openSeasonCheckout(){
  const note = document.getElementById('payNote');
  if (note) note.textContent = 'Opening Stripe checkout in this tab. When you return, Season Pass is stored in this browser for every save slot after the purchase check confirms it.';
  location.assign(COMMERCE.SEASON_URL);
}

function track(name, extra){
  const ev = Object.assign({ name, t: Date.now(), chapter: api ? api.chapterId() : '' }, extra || {});
  memory.analytics.push(ev);
  if (memory.analytics.length > 80) memory.analytics.splice(0, memory.analytics.length - 80);
  persist();
  if (COMMERCE.ANALYTICS_URL) {
    fetch(COMMERCE.ANALYTICS_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: ev.name, chapter: ev.chapter, segment: ev.segment || null }),
      keepalive: true,
    }).catch(() => {});
  }
}

function choiceKey(chapter, record, label){
  return chapter + '|' + record + '|' + String(label).replace(/[\[\]"“”]/g, '');
}

function worldLine(record, label, chapter){
  // Public counter only. Local tallies stay in the save and are not shown.
  // No line until STATS_URL has returned a real total for this option.
  const key = choiceKey(chapter, record, label);
  const bucket = memory.world[key];
  if (bucket && bucket.total > 0) {
    const pct = Math.round(100 * bucket.count / bucket.total);
    return pct + '% OF PLAYERS CHOSE THIS';
  }
  return '';
}

async function pushChoice(chapter, record, label){
  const key = choiceKey(chapter, record, label);
  const s = slot();
  s.choices[key] = (s.choices[key] || 0) + 1;
  persist();
  if (!COMMERCE.STATS_URL) return;
  try {
    const res = await fetch(COMMERCE.STATS_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chapter, choice: record, option: label }),
    });
    if (!res.ok) return;
    const data = await res.json();
    if (data && data.total) {
      memory.world[key] = { count: data.count || 0, total: data.total };
      persist();
    }
  } catch (e) {}
}

function drawShare(endingName, title, choices){
  const c = document.createElement('canvas');
  c.width = 1080; c.height = 1920;
  const g = c.getContext('2d');
  g.fillStyle = '#100c09';
  g.fillRect(0, 0, 1080, 1920);
  g.fillStyle = '#e7c98a';
  g.fillRect(0, 0, 1080, 18);
  g.font = '28px sans-serif';
  g.fillStyle = '#e7c98a';
  g.fillText('DYSTOPIA  ·  THE WAKING', 72, 160);
  g.font = '64px serif';
  g.fillStyle = '#f4ecdf';
  wrap(g, endingName || 'AN ENDING', 72, 280, 936, 78);
  g.font = '36px serif';
  g.fillStyle = '#cbbfa6';
  wrap(g, title || '', 72, 520, 936, 48);
  g.font = '28px sans-serif';
  g.fillStyle = '#f4ecdf';
  g.fillText('YOUR CHOICES', 72, 760);
  let y = 820;
  (choices || []).slice(0, 6).forEach(ch => {
    g.fillStyle = '#e7c98a';
    wrap(g, ch.a || '', 72, y, 936, 36);
    y += 48;
    const tally = worldLine(ch.q, ch.a, api ? api.chapterId() : '');
    if (!tally) return;
    g.fillStyle = '#9a907f';
    wrap(g, tally, 72, y, 936, 32);
    y += 56;
  });
  g.fillStyle = '#e7c98a';
  g.font = '26px sans-serif';
  g.fillText('BOOK ONE  ·  MATTHEW CULWELL', 72, 1780);
  return c;
}
function wrap(g, text, x, y, max, lh){
  const words = String(text).split(' ');
  let line = '';
  words.forEach(w => {
    const t = line ? line + ' ' + w : w;
    if (g.measureText(t).width > max) {
      g.fillText(line, x, y);
      y += lh;
      line = w;
    } else line = t;
  });
  if (line) g.fillText(line, x, y);
}

function el(tag, cls, text){
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text) n.textContent = text;
  return n;
}

function panel(id){
  const p = el('div', 'sheet');
  p.id = id;
  p.style.display = 'none';
  document.body.appendChild(p);
  panels[id] = p;
  return p;
}
function show(id){
  if (id !== 'trailerSheet') releaseTrailer();
  Object.keys(panels).forEach(k => { panels[k].style.display = k === id ? 'flex' : 'none'; });
}
function hideSheets(){
  releaseTrailer();
  Object.keys(panels).forEach(k => { panels[k].style.display = 'none'; });
}

function buildSettings(host){
  const st = memory.settings;
  const box = el('div', 'sheetBody');
  box.appendChild(el('h3', 'sheetTitle', 'SETTINGS'));
  const rows = [
    ['VOLUME', 'range', 'volume', 0, 1, 0.05],
    ['VOICES', 'select', 'voices', null, null, null, ['on', 'off']],
    ['TEXT SIZE', 'select', 'textSize', null, null, null, ['sm', 'md', 'lg']],
    ['TEXT SPEED', 'select', 'textSpeed', null, null, null, [0.6, 1, 1.6]],
    ['CHOICE TIMER', 'select', 'timer', null, null, null, ['on', 'long', 'off']],
    ['MOTION', 'select', 'motion', null, null, null, ['full', 'reduced']],
    ['QUALITY', 'select', 'quality', null, null, null, ['auto', 'potato', 'low', 'med', 'high']],
    ['MODE', 'select', 'mode', null, null, null, ['story', 'action']],
    ['PORTRAITS', 'select', 'portraits', null, null, null, ['cards', 'blocks']],
    ['GAMEPAD', 'select', 'gamepad', null, null, null, [true, false]],
  ];
  rows.forEach(([label, kind, key, min, max, step, opts]) => {
    const row = el('label', 'setRow');
    row.appendChild(el('span', '', label));
    let input;
    if (kind === 'range') {
      input = document.createElement('input');
      input.type = 'range'; input.min = min; input.max = max; input.step = step; input.value = st[key];
    } else {
      input = document.createElement('select');
      opts.forEach(o => {
        const op = document.createElement('option');
        op.value = String(o);
        op.textContent = key === 'mode'
          ? (String(o) === 'story' ? 'STORY MODE' : 'ACTION MODE')
          : (o === 'potato' ? 'POTATO / ULTRA LOW' : String(o).toUpperCase());
        if (String(st[key]) === String(o)) op.selected = true;
        input.appendChild(op);
      });
    }
    input.addEventListener('change', () => {
      let v = input.value;
      if (key === 'volume' || key === 'textSpeed') v = Number(v);
      if (key === 'gamepad') v = v === 'true';
      st[key] = v;
      persist();
      applySettings();
      if ((key === 'voices' && v === 'off') || (key === 'volume' && Number(v) <= 0)){
        if (api && api.stopVoices) api.stopVoices();
      }
      if (key === 'quality' && api && api.applyQuality) {
        api.applyQuality(v === 'auto' ? (api.Q && api.Q.auto) || 'low' : v);
      }
    });
    row.appendChild(input);
    box.appendChild(row);
  });
  box.appendChild(el('p', 'fine', 'Story Mode softens hits and shortens the hunter. On a phone, Story Mode nudges a shot that is already close to a target. Mouse and keyboard do not lock on. Action Mode is the desktop fight. Timer off keeps every option on screen until you choose. Dialogue cards show the name and the line. Stand-in faces stay hidden.'));
  box.appendChild(el('p', 'fine', 'Voices speak radio lines and story lines. Each person keeps one voice. Off leaves the text. Volume at zero stays silent.'));
  box.appendChild(el('p', 'fine', 'Choice counts and chapter events are anonymous. No account. No name is sent.'));
  const close = el('button', 'btn', 'CLOSE');
  close.type = 'button';
  close.addEventListener('click', () => { hideSheets(); if (pausedFrom) show('pauseSheet'); });
  box.appendChild(close);
  host.appendChild(box);
}

function chapterShort(id){
  const c = api && api.chapters && api.chapters[id];
  const s = (c && c.subtitle) || 'EPISODE';
  const i = s.indexOf(':');
  return (i > 0 ? s.slice(0, i) : s).trim();
}
function slotPlace(s){
  if (!s || !s.mid || !s.mid.chapter) return 'EMPTY';
  const where = s.mid.label ? String(s.mid.label) : 'CHECKPOINT';
  return chapterShort(s.mid.chapter) + '  ' + where;
}
function setSlotStatus(text){
  const n = document.getElementById('slotStatus');
  if (n) n.textContent = text;
}
function describeSlot(){
  const s = slot();
  const n = (memory.active || 0) + 1;
  const plan = resumePlan(s && s.mid, api ? api.chapterId() : 'ep1', (api && api.chapters) || {});
  const ng = slotTag(s);
  if (!plan.ok) return 'Slot ' + n + (ng ? '  ' + ng.trim() : '') + ' is empty. New Game starts Episode One here.';
  return 'Slot ' + n + '  ' + ng + slotPlace(s) + '. Continue resumes this place.';
}
function continueActive(){
  const mid = slot().mid;
  const here = api ? api.chapterId() : 'ep1';
  const plan = resumePlan(mid, here, (api && api.chapters) || {});
  if (!plan.ok){
    setSlotStatus('This slot is empty. New Game starts Episode One here.');
    return;
  }
  if (Waking.isLocked(plan.chapter)){ openPaywall(plan.chapter); return; }
  try { sessionStorage.setItem('latm_resume', JSON.stringify(mid)); } catch (e) {}
  if (plan.action === 'switch'){
    try { sessionStorage.setItem('latm_autoload', '1'); } catch (e) {}
    location.hash = '#' + plan.chapter;
    location.reload();
    return;
  }
  if (api && api.armResume) api.armResume(mid);
  if (api && api.startFromTitle) api.startFromTitle(true);
}
function buildSlots(host){
  const box = el('div', 'slotRow');
  memory.slots.forEach((s, i) => {
    const b = el('button', 'btn small slotBtn', '');
    b.type = 'button';
    b.textContent = 'SLOT ' + (i + 1) + '  ' + slotTag(s) + slotPlace(s);
    if (i === memory.active) b.classList.add('on');
    b.addEventListener('click', () => {
      if (i === memory.active){
        setSlotStatus(describeSlot());
        return;
      }
      pullLegacy(slot());
      memory.active = i;
      writeLegacy(slot());
      persist();
      try {
        sessionStorage.removeItem('latm_resume');
        sessionStorage.removeItem('latm_autoload');
      } catch (e) {}
      location.reload();
    });
    box.appendChild(b);
  });
  host.appendChild(box);
  const tools = el('div', 'slotTools');
  const exp = el('button', 'btn small', 'BACKUP CODE');
  exp.type = 'button';
  exp.addEventListener('click', () => openBackup());
  const cont = el('button', 'btn small', 'CONTINUE');
  cont.type = 'button';
  cont.id = 'continueBtn';
  cont.addEventListener('click', () => continueActive());
  tools.append(cont, exp);
  host.appendChild(tools);
  const status = el('p', 'slotNote', describeSlot());
  status.id = 'slotStatus';
  host.appendChild(status);
}

function openBackup(){
  pullLegacy(slot());
  persist();
  const code = btoa(unescape(encodeURIComponent(JSON.stringify(slot()))));
  show('backupSheet');
  const ta = document.getElementById('backupCode');
  if (ta) ta.value = code;
}
function importBackup(code){
  try {
    const s = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
    if (!s || typeof s !== 'object' || !s.choices) throw new Error('bad');
    memory.slots[memory.active] = ensureReturnSlot(Object.assign(emptySlot(memory.active), s, { name: 'SLOT ' + (memory.active + 1) }));
    writeLegacy(memory.slots[memory.active]);
    persist();
    location.reload();
  } catch (e) {
    const note = document.getElementById('backupNote');
    if (note) note.textContent = 'That code could not be read.';
  }
}

const TRAILER_VISIT_KEY = 'latm_trailer_visit';
function emptyTrailerVisit(){
  return { watched: {}, open: [], enter: '' };
}
function trailerVisit(){
  try {
    const raw = sessionStorage.getItem(TRAILER_VISIT_KEY);
    const data = raw ? JSON.parse(raw) : null;
    if (!data || typeof data !== 'object') return emptyTrailerVisit();
    return {
      watched: data.watched && typeof data.watched === 'object' ? data.watched : {},
      open: Array.isArray(data.open) ? data.open.filter(id => typeof id === 'string') : [],
      enter: typeof data.enter === 'string' ? data.enter : '',
    };
  } catch (e) {
    return emptyTrailerVisit();
  }
}
function saveTrailerVisit(data){
  try { sessionStorage.setItem(TRAILER_VISIT_KEY, JSON.stringify(data)); } catch (e) {}
}
function hashChapter(){
  try { return String(location.hash || '').replace(/^#/, ''); } catch (e) { return ''; }
}
// A finished set of trailers may survive the reload that enters that chapter.
// Any other load clears the visit, so a refresh asks for the trailers again.
function settleTrailerSession(){
  if (typeof sessionStorage === 'undefined') return;
  const data = trailerVisit();
  const hash = hashChapter();
  if (data.enter && hash && data.enter === hash) {
    data.open = [hash];
    data.watched = {};
    data.enter = '';
    saveTrailerVisit(data);
    return;
  }
  const dirty = data.enter || data.open.length || Object.keys(data.watched).length;
  if (dirty) saveTrailerVisit(emptyTrailerVisit());
}
function visitAllows(id){
  const data = trailerVisit();
  return data.open.indexOf(id) >= 0 || data.enter === id;
}
function trailersDone(){
  const watched = trailerVisit().watched;
  let n = 0;
  TRAILERS.forEach(t => { if (watched[t.id]) n += 1; });
  return n;
}
function nextTrailer(){
  const watched = trailerVisit().watched;
  for (let i = 0; i < TRAILERS.length; i++) {
    if (!watched[TRAILERS[i].id]) return TRAILERS[i];
  }
  return null;
}
function markTrailer(trailerId, chapterId){
  const data = trailerVisit();
  data.watched[trailerId] = 1;
  let opened = false;
  if (TRAILERS.every(t => data.watched[t.id])) {
    data.watched = {};
    data.enter = chapterId || '';
    if (chapterId && data.open.indexOf(chapterId) < 0) data.open.push(chapterId);
    opened = true;
  }
  saveTrailerVisit(data);
  return opened;
}
function fmtClock(t){
  if (!t || !isFinite(t)) return '0:00';
  const s = Math.floor(t);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m + ':' + (r < 10 ? '0' : '') + r;
}
function trailerBed(on){
  const api = window.__LATM;
  if (api && api.setBed) api.setBed('trailer', !!on);
}
function releaseTrailer(){
  trailerBed(false);
  if (!trailerSettled) trailerToken += 1;
  trailerSettled = false;
  const video = activeVideo;
  activeVideo = null;
  if (!video) return;
  try {
    video.pause();
    video.removeAttribute('src');
    video.load();
  } catch (e) {}
}
function payTitle(id){
  return (api && api.chapters && api.chapters[id] && api.chapters[id].subtitle) || id;
}
function enterChapter(id){
  location.hash = '#' + id;
  location.reload();
}

function openPaywall(id){
  const body = document.getElementById('payBody');
  if (!body) return;
  body.innerHTML = '';
  if (visitAllows(id) && !previewOn()) {
    body.appendChild(el('h3', 'sheetTitle', payTitle(id)));
    body.appendChild(el('p', 'deckLine', 'This chapter is open for this visit.'));
    const go = el('button', 'btn amber', 'ENTER CHAPTER');
    go.type = 'button';
    go.addEventListener('click', () => enterChapter(id));
    body.appendChild(go);
    const close = el('button', 'btn', 'CLOSE');
    close.type = 'button';
    close.addEventListener('click', hideSheets);
    body.appendChild(close);
    show('paySheet');
    return;
  }
  const done = trailersDone();
  body.appendChild(el('h3', 'sheetTitle', payTitle(id)));
  if (id === 'ch_counting') {
    body.appendChild(el('p', 'deckLine', 'Your story continues in Chapter Three.'));
  } else {
    body.appendChild(el('p', 'deckLine', 'This chapter is part of Book One.'));
  }
  body.appendChild(el('p', 'fine', 'Watch 3 trailers to play this chapter now, or get every chapter with Season Pass.'));
  const pass = el('button', 'btn amber', 'SEASON PASS  ' + COMMERCE.SEASON_PRICE);
  pass.type = 'button';
  pass.addEventListener('click', () => {
    if (previewOn()) {
      enterChapter(id);
      return;
    }
    openSeasonCheckout();
  });
  body.appendChild(pass);
  const ads = el('button', 'btn', 'WATCH BOOK TRAILERS  ' + done + ' / ' + COMMERCE.AD_VIEWS);
  ads.type = 'button';
  ads.addEventListener('click', () => playTrailer(id));
  body.appendChild(ads);
  const watched = trailerVisit().watched;
  TRAILERS.forEach((t, i) => {
    body.appendChild(el('p', 'fine', (i + 1) + '. ' + t.title + (watched[t.id] ? '  WATCHED' : '')));
  });
  const restore = el('button', 'btn', 'RESTORE PURCHASE');
  restore.type = 'button';
  restore.addEventListener('click', () => openRestore());
  body.appendChild(restore);
  const note = el('p', 'fine', '');
  note.id = 'payNote';
  body.appendChild(note);
  if (previewOn()) body.appendChild(el('p', 'fine', 'Review unlock is on for this tab, so Start will enter the chapter.'));
  const close = el('button', 'btn', 'CLOSE');
  close.type = 'button';
  close.addEventListener('click', hideSheets);
  body.appendChild(close);
  show('paySheet');
}

function openRestore(){
  const body = document.getElementById('payBody');
  if (!body) return;
  body.innerHTML = '';
  body.appendChild(el('h3', 'sheetTitle', 'RESTORE PURCHASE'));
  if (hasDevicePass()) {
    body.appendChild(el('p', 'deckLine', 'Season Pass is active on this browser, on every save slot.'));
  }
  body.appendChild(el('p', 'fine', 'Enter the email from your Stripe receipt. Season Pass stays on every save slot in this browser when the purchase check confirms it. A receipt does not show a checkout id. If you still have the return page, paste that address instead.'));
  const input = document.createElement('input');
  input.id = 'restoreSession';
  input.type = 'text';
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.placeholder = 'name@email.com';
  input.setAttribute('aria-label', 'Receipt email or return link');
  body.appendChild(input);
  const go = el('button', 'btn amber', 'RESTORE');
  go.type = 'button';
  let restorePending = false;
  go.addEventListener('click', () => {
    if (restorePending) return;
    restorePending = true;
    const note = document.getElementById('payNote');
    if (note) note.textContent = 'Checking the purchase.';
    applyRestore(input.value).then(message => {
      restorePending = false;
      if (note) note.textContent = message;
      if (hasDevicePass()) {
        const deck = body.querySelector('.deckLine');
        if (!deck) body.insertBefore(el('p', 'deckLine', 'Season Pass is active on this browser, on every save slot.'), body.querySelector('.fine'));
      }
    }).catch(() => {
      restorePending = false;
      if (note) note.textContent = 'Season Pass was not granted. The purchase check did not respond.';
    });
  });
  body.appendChild(go);
  const note = el('p', 'fine', '');
  note.id = 'payNote';
  body.appendChild(note);
  body.appendChild(el('p', 'fine', 'Checkout in another browser can be restored here with that receipt email. You can also open Backup Code there and restore this save slot.'));
  const close = el('button', 'btn', 'CLOSE');
  close.type = 'button';
  close.addEventListener('click', hideSheets);
  body.appendChild(close);
  show('paySheet');
}

function showTrailerDone(chapterId, trailer, opened){
  const body = document.getElementById('trailerBody');
  if (!body) return;
  body.innerHTML = '';
  const done = opened ? COMMERCE.AD_VIEWS : trailersDone();
  body.appendChild(el('h3', 'sheetTitle', 'TRAILER COMPLETE'));
  body.appendChild(el('p', 'deckLine', trailer.title));
  body.appendChild(el('p', 'fine', done + ' of ' + COMMERCE.AD_VIEWS + ' trailers finished.'));
  if (opened) {
    body.appendChild(el('p', 'fine', 'This chapter is open for this visit. Reload the page and the trailers are required again. This is not the Season Pass.'));
  }
  const link = document.createElement('a');
  link.className = 'btn amber';
  link.textContent = trailer.cta;
  link.href = trailer.url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  body.appendChild(link);
  if (opened) {
    const go = el('button', 'btn', 'ENTER CHAPTER');
    go.type = 'button';
    go.addEventListener('click', () => enterChapter(chapterId));
    body.appendChild(go);
  } else {
    const cont = el('button', 'btn', 'CONTINUE');
    cont.type = 'button';
    cont.addEventListener('click', () => openPaywall(chapterId));
    body.appendChild(cont);
  }
}

function playTrailer(chapterId){
  releaseTrailer();
  const trailer = nextTrailer();
  if (!trailer) {
    openPaywall(chapterId);
    return;
  }
  const token = ++trailerToken;
  trailerSettled = false;
  const body = document.getElementById('trailerBody');
  if (!body) return;
  body.innerHTML = '';
  body.appendChild(el('h3', 'sheetTitle', 'BOOK TRAILER  ' + (trailersDone() + 1) + ' / ' + COMMERCE.AD_VIEWS));
  body.appendChild(el('p', 'deckLine', trailer.title));
  body.appendChild(el('p', 'fine', 'Watch to the end. There is no skip. Close returns you to the pay sheet and does not count.'));

  const frame = el('div', 'trailerFrame');
  const video = document.createElement('video');
  video.id = 'trailerVideo';
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  video.preload = 'auto';
  video.controls = false;
  video.disablePictureInPicture = true;
  video.disableRemotePlayback = true;
  video.playbackRate = 1;
  video.defaultPlaybackRate = 1;
  video.tabIndex = -1;
  video.setAttribute('aria-label', trailer.title);
  try { video.volume = Math.max(0, Math.min(1, Number(memory.settings.volume) || 0)); } catch (e) {}
  frame.appendChild(video);
  body.appendChild(frame);

  const meter = el('div', 'trailerMeter');
  meter.setAttribute('aria-hidden', 'true');
  const fill = el('div', '');
  fill.id = 'trailerMeterFill';
  meter.appendChild(fill);
  body.appendChild(meter);

  const time = el('p', 'fine', '0:00 / 0:00');
  time.id = 'trailerTime';
  body.appendChild(time);
  const err = el('p', 'fine', '');
  err.id = 'trailerErr';
  body.appendChild(err);

  const row = el('div', 'trailerBtns');
  const play = el('button', 'btn', 'PLAY');
  play.type = 'button';
  const close = el('button', 'btn', 'CLOSE');
  close.type = 'button';
  row.append(play, close);
  body.appendChild(row);

  let watched = 0;
  let correcting = false;

  function alive(){ return token === trailerToken && !trailerSettled; }
  function paint(){
    const label = document.getElementById('trailerTime');
    const bar = document.getElementById('trailerMeterFill');
    const dur = video.duration;
    if (label) label.textContent = fmtClock(watched) + ' / ' + fmtClock(dur);
    if (bar) {
      const pct = dur && isFinite(dur) ? Math.max(0, Math.min(100, (watched / dur) * 100)) : 0;
      bar.style.width = pct + '%';
    }
  }
  function reached(){
    const dur = video.duration;
    if (!dur || !isFinite(dur) || dur < 0.5) return false;
    if (watched >= dur * 0.95) return true;
    if (video.ended && watched >= dur * 0.9) return true;
    return false;
  }
  function settle(){
    if (!alive() || !reached()) return;
    trailerSettled = true;
    try { video.pause(); } catch (e) {}
    activeVideo = null;
    const opened = markTrailer(trailer.id, chapterId);
    showTrailerDone(chapterId, trailer, opened);
  }
  function clampSeek(){
    if (!alive() || correcting) return;
    if (video.currentTime > watched + 0.25) {
      correcting = true;
      try { video.currentTime = watched; } catch (e) {}
      correcting = false;
    }
  }

  video.addEventListener('seeking', clampSeek);
  video.addEventListener('seeked', clampSeek);
  video.addEventListener('loadedmetadata', paint);
  video.addEventListener('ratechange', () => {
    if (video.playbackRate !== 1) video.playbackRate = 1;
  });
  video.addEventListener('timeupdate', () => {
    if (!alive() || video.seeking) return;
    const ahead = video.currentTime - watched;
    // Normal playback reports small steps. A scrub, or a currentTime
    // jump, is larger than a stalled frame and must not count.
    // Do not keep re-arming that snap, or playback can never catch up.
    if (ahead > 1) {
      clampSeek();
      return;
    }
    if (!video.paused && ahead > 0) watched = video.currentTime;
    paint();
    if (reached()) settle();
  });
  video.addEventListener('ended', () => { if (alive()) settle(); });
  video.addEventListener('error', () => {
    if (!alive()) return;
    video.style.visibility = 'hidden';
    const note = document.getElementById('trailerErr');
    if (note) note.textContent = 'This trailer did not load. Nothing was counted. Press retry, or close and come back.';
    play.textContent = 'RETRY';
    play.dataset.mode = 'retry';
  });
  video.addEventListener('contextmenu', (e) => e.preventDefault());

  function startPlay(){
    video.playbackRate = 1;
    trailerBed(true);
    const pending = video.play();
    if (pending && pending.then) {
      pending.then(() => {
        if (!alive()) return;
        play.textContent = 'PAUSE';
        play.dataset.mode = '';
      }).catch(() => {
        if (!alive()) return;
        const note = document.getElementById('trailerErr');
        if (note && !video.error) note.textContent = 'Playback did not start. Press play again.';
      });
    }
  }

  play.addEventListener('click', () => {
    if (!alive()) return;
    if (play.dataset.mode === 'retry' || video.error) {
      watched = 0;
      video.style.visibility = '';
      play.dataset.mode = '';
      play.textContent = 'PLAY';
      const note = document.getElementById('trailerErr');
      if (note) note.textContent = '';
      video.src = trailer.src + (trailer.src.indexOf('?') >= 0 ? '&' : '?') + 'retry=' + Date.now();
      video.load();
      startPlay();
      return;
    }
    if (video.paused) startPlay();
    else {
      video.pause();
      trailerBed(false);
      play.textContent = 'PLAY';
    }
  });
  close.addEventListener('click', () => {
    trailerBed(false);
    trailerToken += 1;
    try {
      video.pause();
      video.removeAttribute('src');
      video.load();
    } catch (e) {}
    activeVideo = null;
    openPaywall(chapterId);
  });

  video.src = trailer.src;
  activeVideo = video;
  show('trailerSheet');
}

function buildChapters(host){
  host.innerHTML = '';
  const box = el('div', 'sheetBody');
  box.appendChild(el('h3', 'sheetTitle', 'CHAPTERS'));
  box.appendChild(el('p', 'fine', 'Episode One is free. One Chapter Two path stays free with the ending you earned. Season Pass opens the rest for good. Three book trailers open one locked chapter for this visit only.'));
  const chapters = (api && api.chapters) || {};
  Object.keys(chapters).forEach(id => {
    const c = chapters[id];
    if (id === 'ch_signal' || (c && c.signal)) return;
    const locked = Waking.isLocked(id);
    const here = !locked && api && api.chapterId && api.chapterId() === id;
    const b = el('button', 'btn small beatRow', '');
    b.type = 'button';
    b.textContent = (locked ? 'LOCKED  ' : (here ? 'HERE  ' : 'OPEN  ')) + (c.subtitle || id);
    b.addEventListener('click', () => {
      if (Waking.isLocked(id)){ openPaywall(id); return; }
      if (here){ hideSheets(); return; }
      location.hash = '#' + id;
      location.reload();
    });
    box.appendChild(b);
  });
  const close = el('button', 'btn', 'CLOSE');
  close.type = 'button';
  close.addEventListener('click', hideSheets);
  box.appendChild(close);
  host.appendChild(box);
}

function buildArchive(host){
  host.innerHTML = '';
  const box = el('div', 'sheetBody');
  box.appendChild(el('h3', 'sheetTitle', 'RED SKY ARCHIVE'));
  box.appendChild(el('p', 'fine', 'Full episodes stay here. Inside a chapter you only get a short clip, 8 to 20 seconds, tied to a room, then you play. All seven Book One shorts are linked. Episode 9, Fire and Steel, stays a hook.'));
  const montage = el('button', 'btn', 'MONTAGE OF OPENERS');
  montage.type = 'button';
  montage.addEventListener('click', () => {
    if (!api || !api.beats) return;
    hideSheets();
    const opens = api.beats.filter(b => b.at === 'open');
    api.playMontage(opens);
  });
  box.appendChild(montage);
  (api.archive || []).forEach(ep => {
    const block = el('div', 'epBlock');
    const head = el('div', 'epHead', 'EP ' + ep.n + '  ' + ep.title + (ep.shortTitle ? '  ·  ' + ep.shortTitle : '') + (ep.status === 'hook' ? '  (HOOK)' : ''));
    block.appendChild(head);
    const pending = ep.status === 'pending';
    const full = el('button', 'btn small', pending ? 'GAME SHORT PENDING' : (ep.url ? 'PLAY FULL SHORT' : 'FULL SHORT NOT LINKED'));
    full.type = 'button';
    full.disabled = pending || !ep.url;
    full.addEventListener('click', () => { if (ep.url && api.playFull) api.playFull(ep); });
    block.appendChild(full);
    (api.beats || []).filter(b => b.episode === ep.id).forEach(b => {
      const row = el('button', 'btn small beatRow', '');
      row.type = 'button';
      const label = api.clipLabel ? api.clipLabel(b) : b.id;
      const where = b.at === 'open' ? 'OPEN' : 'ROOM ' + b.room;
      row.textContent = where + '  ·  ' + label + '  ·  ' + b.max + 's';
      row.addEventListener('click', () => {
        hideSheets();
        api.playClip(b, { then: 'gallery' });
      });
      block.appendChild(row);
    });
    box.appendChild(block);
  });
  const close = el('button', 'btn', 'CLOSE');
  close.type = 'button';
  close.addEventListener('click', hideSheets);
  box.appendChild(close);
  host.appendChild(box);
}

function syncPauseExtras(){
  const on = pausedFrom === 'play' || pausedFrom === 'story';
  const restart = document.getElementById('restartEpisodeBtn');
  const title = document.getElementById('titleReturnBtn');
  if (restart) restart.style.display = on ? '' : 'none';
  if (title) title.style.display = on ? '' : 'none';
}

function shareCard(name, title){
  const canvas = drawShare(name, title, []);
  canvas.toBlob(async (blob) => {
    if (!blob) return;
    const file = new File([blob], 'waking-ending.png', { type: 'image/png' });
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: 'The Waking', text: name + ' in Dystopia: The Waking' }); return; } catch (e) {}
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'waking-ending.png';
    a.click();
  }, 'image/png');
}
function openCodex(){
  const host = panels.codexSheet;
  if (!host) return;
  host.innerHTML = '';
  const box = el('div', 'sheetBody');
  const found = endingIds();
  const hints = (slot() && slot().codexHints) || [];
  box.appendChild(el('h3', 'sheetTitle', 'ENDING CODEX'));
  box.appendChild(el('p', 'fine', 'ENDINGS RECOVERED ' + found.length + ' / ' + CODEX.length + '. Locked cards stay nameless.'));
  CODEX.forEach((entry, i) => {
    const live = api && api.endings && api.endings[entry.id];
    const open = found.indexOf(entry.id) >= 0;
    const row = el('div', 'codexRow' + (open ? '' : ' locked'));
    if (open){
      const name = (live && live.name) || entry.name;
      const title = (live && live.title) || entry.title;
      row.appendChild(el('div', 'codexIndex', String(i + 1).padStart(2, '0')));
      const copy = el('div', 'codexCopy');
      copy.appendChild(el('div', 'codexName', name));
      copy.appendChild(el('p', 'fine', entry.flavor));
      const share = el('button', 'btn small codexShare', 'SHARE');
      share.type = 'button';
      share.addEventListener('click', () => shareCard(name, title));
      copy.appendChild(share);
      row.appendChild(copy);
    } else {
      const sil = el('div', 'codexSil', '');
      sil.setAttribute('aria-hidden', 'true');
      row.appendChild(sil);
      const copy = el('div', 'codexCopy');
      copy.appendChild(el('div', 'codexKicker', 'LOCKED'));
      copy.appendChild(el('p', 'fine', entry.clue));
      if (hints.indexOf(entry.id) >= 0) copy.appendChild(el('p', 'fine', 'HIVE SIGNAL. ' + entry.hint));
      row.appendChild(copy);
      row.setAttribute('aria-label', 'Locked ending');
    }
    box.appendChild(row);
  });
  const close = el('button', 'btn', 'CLOSE');
  close.type = 'button';
  close.addEventListener('click', hideSheets);
  box.appendChild(close);
  host.appendChild(box);
  show('codexSheet');
}
function cosmeticLine(){
  const owned = (slot() && slot().cosmetics) || [];
  if (!owned.length) return '';
  const names = owned.map(id => {
    const c = COSMETICS.find(x => x.id === id);
    return c ? c.name : id;
  });
  return 'COSMETICS. ' + names.join(', ') + '.';
}
function fillSignalSheet(title, lines){
  const host = panels.signalSheet;
  if (!host) return;
  host.innerHTML = '';
  const box = el('div', 'sheetBody');
  box.appendChild(el('h3', 'sheetTitle', title));
  lines.forEach(t => { if (t) box.appendChild(el('p', 'fine', t)); });
  const close = el('button', 'btn', 'BACK TO THE HUB');
  close.type = 'button';
  close.addEventListener('click', () => {
    hideSheets();
    if (api && api.chapterId && api.chapterId() === 'ch_signal'){
      try {
        sessionStorage.removeItem('latm_daily_run');
        sessionStorage.removeItem('latm_resume');
        sessionStorage.removeItem('latm_autoload');
      } catch (e) {}
      location.hash = '#ep1';
      location.reload();
    }
  });
  box.appendChild(close);
  host.appendChild(box);
  show('signalSheet');
}
function showSignalClosed(rec){
  fillSignalSheet('HIVE SIGNAL LOGGED', [
    'Come back tomorrow. The hive keeps a different room.',
    rec && rec.text ? rec.text : '',
    cosmeticLine(),
    'The signal is free. It does not open a paid chapter.',
  ]);
}
function openDaily(){
  const rec = readDaily();
  if (rec && rec.day === todayKey()){
    showSignalClosed(rec);
    return;
  }
  try { sessionStorage.setItem('latm_daily_run', '1'); } catch (e) {}
  location.hash = '#ch_signal';
  location.reload();
}
function finishSignal(pick){
  const s = ensureReturnSlot(slot());
  pullLegacy(s);
  const day = todayKey();
  const granted = applySignalReward(s, day, pick === 'clue' ? 'clue' : 'mark');
  s.cosmetics = granted.slot.cosmetics;
  s.signalMarks = granted.slot.signalMarks;
  s.codexHints = granted.slot.codexHints;
  s.lastSignal = day;
  s.updated = Date.now();
  const text = granted.result.text;
  writeDaily({ day, pick: pick === 'clue' ? 'clue' : 'mark', text });
  persist();
  applyCosmetics();
  if (window.__LATM && __LATM.dropPointerLock) __LATM.dropPointerLock();
  else if (document.pointerLockElement) document.exitPointerLock();
  fillSignalSheet('SIGNAL LOGGED', [
    text,
    cosmeticLine(),
    'Your campaign checkpoint was left where it was. Come back tomorrow.',
  ]);
}
function openNgSheet(){
  const host = panels.ngSheet;
  if (!host) return;
  host.innerHTML = '';
  const box = el('div', 'sheetBody');
  const level = (slot() && slot().ngPlus) || 0;
  box.appendChild(el('h3', 'sheetTitle', level ? 'NG+ AGAIN' : 'NEW GAME+'));
  box.appendChild(el('p', 'fine', 'Book flags, unlocked paths, and endings stay on this slot. The slot is marked NG+. Action Mode hits harder. Story Mode takes a smaller bump. Episode One starts again, and each Chapter Two path has a new mid-chapter beat.'));
  box.appendChild(el('p', 'fine', 'Inside the Hive, The Listening Dark, The Convoy, and The Long Road each gain one new beat. Paid chapters stay paid.'));
  const go = el('button', 'btn amber', level ? 'START NG+ AGAIN' : 'START NEW GAME+');
  go.type = 'button';
  go.addEventListener('click', () => beginNgPlus());
  box.appendChild(go);
  const close = el('button', 'btn', 'CLOSE');
  close.type = 'button';
  close.addEventListener('click', hideSheets);
  box.appendChild(close);
  host.appendChild(box);
  show('ngSheet');
}
function beginNgPlus(){
  const s = ensureReturnSlot(slot());
  pullLegacy(s);
  if (!campaignCleared(endingIds()) && !(s.ngPlus > 0)) return;
  const next = ngPlusSlot(s);
  Object.assign(s, next);
  ensureReturnSlot(s);
  persist();
  writeLegacy(s);
  try {
    sessionStorage.setItem('latm_newgame', '1');
    sessionStorage.removeItem('latm_resume');
    sessionStorage.removeItem('latm_autoload');
    sessionStorage.removeItem('latm_daily_run');
  } catch (e) {}
  if (api && api.setMode) api.setMode('end');
  location.hash = '#ep1';
  location.reload();
}
function refreshNgButton(){
  const b = document.getElementById('ngBtn');
  if (!b) return;
  const on = campaignCleared(endingIds()) || ((slot() && slot().ngPlus) || 0) > 0;
  b.style.display = on ? '' : 'none';
  b.textContent = ((slot() && slot().ngPlus) || 0) > 0 ? 'NG+ AGAIN' : 'NEW GAME+';
}
function dailyLabel(){
  const rec = readDaily();
  if (rec && rec.day === todayKey()) return 'SIGNAL LOGGED';
  return 'DAILY HIVE SIGNAL';
}

export const Waking = window.Waking = {
  ngLevel(){ return (slot() && slot().ngPlus) || 0; },
  finishSignal,
  armNgOffer(){
    const host = document.getElementById('endBtns');
    if (!host || document.getElementById('ngEndBtn')) return;
    const b = el('button', 'btn', 'NEW GAME+');
    b.type = 'button';
    b.id = 'ngEndBtn';
    b.addEventListener('click', () => openNgSheet());
    host.appendChild(b);
  },
  settings(){ return memory.settings; },
  storyMode(){ return memory.settings.mode === 'story'; },
  timerMode(){ return memory.settings.timer || 'on'; },
  textSpeed(){ return Number(memory.settings.textSpeed) || 1; },
  reducedMotion(){ return memory.settings.motion === 'reduced'; },
  portraitMode(){ return memory.settings.portraits || 'cards'; },
  gamepadOn(){ return memory.settings.gamepad !== false; },
  isLocked(id){
    if (!id || id === 'ep1' || id === 'ch_signal') return false;
    if (hasPass()) return false;
    if (visitAllows(id)) return false;
    const s = slot();
    if (CH2_IDS.indexOf(id) >= 0) {
      const free = s && s.carry && CH2[s.carry.from];
      return id !== free;
    }
    return PAID.indexOf(id) >= 0;
  },
  openPaywall,
  isPaused(){ return pausedFrom !== null; },
  togglePause(){
    if (!api) return;
    const mode = api.getMode();
    if (mode === 'paused') {
      api.setMode(pausedFrom || 'play');
      pausedFrom = null;
      syncPauseExtras();
      hideSheets();
      return;
    }
    if (mode === 'title' || mode === 'end') { hideSheets(); return; }
    if (mode !== 'play' && mode !== 'story') return;
    pausedFrom = mode;
    api.setMode('paused');
    syncPauseExtras();
    show('pauseSheet');
  },
  onChoice(chapter, record, label){
    pushChoice(chapter, record, label);
    return worldLine(record, label, chapter);
  },
  worldLine,
  onChapterStart(id){ track('chapter_start', { chapter: id }); },
  onComplete(id){ track('chapter_complete', { chapter: id }); pullLegacy(slot()); persist(); },
  clearPlace(){
    const s = slot();
    if (!s) return;
    s.mid = null;
    persist();
  },
  noteDrop(segment){ track('dropoff', { segment }); },
  autosave(pos){
    if (!pos || pos.chapter === 'ch_signal') return;
    const s = slot();
    pullLegacy(s);
    s.mid = pos;
    persist();
  },
  onContextLost(){
    const mode = api && api.getMode && api.getMode();
    if (mode !== 'play' && mode !== 'story' && mode !== 'paused' && mode !== 'dead') return;
    const s = slot();
    pullLegacy(s);
    if (api && api.getPos) s.mid = api.getPos();
    persist();
  },
  onGalleryReturn(){ buildArchive(panels.archiveSheet); show('archiveSheet'); },
  mount(next){
    api = next;
    applySettings();
    const pause = panel('pauseSheet');
    const pb = el('div', 'sheetBody');
    pb.appendChild(el('h3', 'sheetTitle', 'PAUSED'));
    const resume = el('button', 'btn', 'RESUME');
    resume.type = 'button';
    resume.addEventListener('click', () => Waking.togglePause());
    pb.appendChild(resume);
    const restart = el('button', 'btn', 'RESTART EPISODE');
    restart.type = 'button';
    restart.id = 'restartEpisodeBtn';
    restart.style.display = 'none';
    restart.addEventListener('click', () => {
      if (api && api.chapterId && api.chapterId() === 'ch_signal'){
        try {
          sessionStorage.setItem('latm_daily_run', '1');
          sessionStorage.removeItem('latm_resume');
          sessionStorage.removeItem('latm_autoload');
        } catch (e) {}
        if (api.setMode) api.setMode('end');
        location.reload();
        return;
      }
      try {
        sessionStorage.setItem('latm_newgame', '1');
        sessionStorage.removeItem('latm_resume');
        sessionStorage.removeItem('latm_autoload');
      } catch (e) {}
      Waking.clearPlace();
      // pagehide saves play, story, paused, and dead. Leave that set so
      // the reload cannot write the cleared place back into the slot.
      if (api && api.setMode) api.setMode('end');
      location.reload();
    });
    pb.appendChild(restart);
    const toTitle = el('button', 'btn', 'RETURN TO TITLE');
    toTitle.type = 'button';
    toTitle.id = 'titleReturnBtn';
    toTitle.style.display = 'none';
    toTitle.addEventListener('click', () => {
      if (api && api.chapterId && api.chapterId() === 'ch_signal'){
        try {
          sessionStorage.removeItem('latm_daily_run');
          sessionStorage.removeItem('latm_resume');
          sessionStorage.removeItem('latm_autoload');
        } catch (e) {}
        location.hash = '#ep1';
        location.reload();
        return;
      }
      if (api && api.getPos) Waking.autosave(api.getPos());
      try {
        sessionStorage.removeItem('latm_resume');
        sessionStorage.removeItem('latm_autoload');
        sessionStorage.removeItem('latm_newgame');
      } catch (e) {}
      location.reload();
    });
    pb.appendChild(toTitle);
    const settingsHost = el('div', '');
    buildSettings(settingsHost);
    pb.appendChild(settingsHost);
    pause.appendChild(pb);

    const pay = panel('paySheet');
    const payBody = el('div', 'sheetBody');
    payBody.id = 'payBody';
    pay.appendChild(payBody);

    const trailer = panel('trailerSheet');
    const trailerBody = el('div', 'sheetBody');
    trailerBody.id = 'trailerBody';
    trailer.appendChild(trailerBody);
    window.addEventListener('keydown', (e) => {
      const sheet = document.getElementById('trailerSheet');
      if (!sheet || sheet.style.display === 'none') return;
      const block = e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown'
        || e.key === 'Home' || e.key === 'End' || e.key === 'MediaTrackNext' || e.key === 'MediaTrackPrevious'
        || e.key === 'MediaFastForward' || e.key === 'MediaRewind';
      if (!block) return;
      e.preventDefault();
      e.stopPropagation();
    }, true);

    const archive = panel('archiveSheet');
    buildArchive(archive);

    const backup = panel('backupSheet');
    const bb = el('div', 'sheetBody');
    bb.appendChild(el('h3', 'sheetTitle', 'BACKUP CODE'));
    bb.appendChild(el('p', 'fine', 'Copy this code somewhere safe. Paste it on another device to restore this slot.'));
    const ta = document.createElement('textarea');
    ta.id = 'backupCode';
    ta.rows = 5;
    bb.appendChild(ta);
    const im = el('button', 'btn', 'RESTORE THIS CODE');
    im.type = 'button';
    im.addEventListener('click', () => importBackup(ta.value));
    bb.appendChild(im);
    const bn = el('p', 'fine', '');
    bn.id = 'backupNote';
    bb.appendChild(bn);
    const bc = el('button', 'btn', 'CLOSE');
    bc.type = 'button';
    bc.addEventListener('click', hideSheets);
    bb.appendChild(bc);
    backup.appendChild(bb);

    const chapters = panel('chapterSheet');
    buildChapters(chapters);
    panel('codexSheet');
    panel('signalSheet');
    panel('ngSheet');

    const bar = el('div', 'titleTools');
    const start = document.getElementById('startScreen');
    if (start) {
      buildSlots(bar);
      const chb = el('button', 'btn small', 'CHAPTERS');
      chb.type = 'button';
      chb.id = 'chaptersBtn';
      chb.addEventListener('click', () => { buildChapters(chapters); show('chapterSheet'); });
      const arch = el('button', 'btn small', 'ARCHIVE');
      arch.type = 'button';
      arch.addEventListener('click', () => { buildArchive(archive); show('archiveSheet'); });
      const setb = el('button', 'btn small', 'SETTINGS');
      setb.type = 'button';
      setb.addEventListener('click', () => show('pauseSheet'));
      const restore = el('button', 'btn small', 'RESTORE PURCHASE');
      restore.type = 'button';
      restore.id = 'restoreBtn';
      restore.addEventListener('click', () => openRestore());
      const codex = el('button', 'btn small', 'ENDING CODEX');
      codex.type = 'button';
      codex.id = 'codexBtn';
      codex.addEventListener('click', () => openCodex());
      const daily = el('button', 'btn small', dailyLabel());
      daily.type = 'button';
      daily.id = 'dailyBtn';
      daily.addEventListener('click', () => openDaily());
      const ng = el('button', 'btn small', 'NEW GAME+');
      ng.type = 'button';
      ng.id = 'ngBtn';
      ng.style.display = 'none';
      ng.addEventListener('click', () => openNgSheet());
      const season = el('button', 'btn amber', 'SEASON PASS  ' + COMMERCE.SEASON_PRICE);
      season.type = 'button';
      season.id = 'seasonPassBtn';
      season.addEventListener('click', () => openSeasonCheckout());
      const nav = el('div', 'slotTools');
      nav.append(codex, daily, ng, chb, arch, setb, restore);
      bar.append(season, nav);
      start.appendChild(bar);
      refreshNgButton();
    }
    const pauseBtn = el('button', 'hudBtn', 'PAUSE');
    pauseBtn.type = 'button';
    pauseBtn.id = 'pauseBtn';
    pauseBtn.addEventListener('click', () => Waking.togglePause());
    document.body.appendChild(pauseBtn);

    const share = el('button', 'btn', 'SHARE');
    share.type = 'button';
    share.id = 'shareBtn';
    share.addEventListener('click', async () => {
      const canvas = drawShare(
        (document.getElementById('endName') || {}).textContent || '',
        (document.getElementById('endTitle') || {}).textContent || '',
        window.__LATM && window.__LATM.SCHOICES ? window.__LATM.SCHOICES : []
      );
      const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
      const file = new File([blob], 'waking-ending.png', { type: 'image/png' });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], title: 'The Waking', text: 'My ending in Dystopia: The Waking' }); return; } catch (e) {}
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'waking-ending.png';
      a.click();
    });
    const endBtns = document.getElementById('endBtns');
    if (endBtns){
      const codexEnd = el('button', 'btn', 'ENDING CODEX');
      codexEnd.type = 'button';
      codexEnd.id = 'codexEndBtn';
      codexEnd.addEventListener('click', () => openCodex());
      endBtns.appendChild(codexEnd);
      endBtns.appendChild(share);
    }

    window.addEventListener('error', (e) => {
      track('crash', { message: String(e.message || 'error').slice(0, 180) });
    });
    window.addEventListener('unhandledrejection', (e) => {
      track('crash', { message: String(e.reason && e.reason.message || e.reason || 'rejection').slice(0, 180) });
    });
    window.addEventListener('pagehide', () => {
      if (!api || !api.getMode || !api.getPos) return;
      try { if (sessionStorage.getItem('latm_newgame') === '1') return; } catch (e) {}
      const mode = api.getMode();
      if (mode !== 'play' && mode !== 'story' && mode !== 'paused' && mode !== 'dead') return;
      const pos = api.getPos();
      Waking.autosave(pos);
      if (mode === 'play') Waking.noteDrop(pos.segment);
    });
    if (previewOn()) {
      const hint = document.getElementById('startHint');
      if (hint) hint.textContent = (hint.textContent || '') + '  REVIEW UNLOCK IS ON.';
    }
  },
};

bootSaves();
