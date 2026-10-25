// Phase 0 commercial shell: settings, 3 save slots, entitlements,
// anonymous choice counts, share card, light analytics.
// Purchases and live ads stay unwired until Matthew connects the stores.

const SAVE_KEY = 'latm_save_v1';
const CH2 = { together:'ch_together', lone:'ch_lone', ghost:'ch_ghost', taken:'ch_taken' };
const CH2_IDS = Object.values(CH2);
const PAID = ['ch_counting', 'ch_conduits', 'ch_harvest', 'ch_steel'];

export const COMMERCE = {
  STATS_URL: '',
  ANALYTICS_URL: '',
  SEASON_PRICE: '$6.99',
  REMOVE_ADS_PRICE: '$2.99',
  STEAM_PRICE: '$7.99',
  AD_VIEWS: 3,
};

let memory = null;
let api = null;
let pausedFrom = null;
let panels = {};

function defaultSettings(){
  return {
    volume: 0.8,
    textSize: 'md',
    textSpeed: 1,
    timer: 'on',
    motion: 'full',
    quality: 'auto',
    mode: 'action',
    portraits: 'blocks',
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
  };
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
  if (api && api.applyQuality && st.quality && st.quality !== 'auto') api.applyQuality(st.quality);
}
function hasPass(){
  try { if (sessionStorage.getItem('latm_preview') === '1') return true; } catch (e) {}
  return !!(slot() && slot().pass);
}
function previewOn(){
  try { return sessionStorage.getItem('latm_preview') === '1'; } catch (e) { return false; }
}

export function bootSaves(){
  if (typeof localStorage === 'undefined') {
    memory = migrate();
    return;
  }
  const params = new URLSearchParams(location.search);
  if (params.get('preview') === '1') {
    try { sessionStorage.setItem('latm_preview', '1'); } catch (e) {}
  }
  memory = loadFile() || migrate();
  memory.settings = Object.assign(defaultSettings(), memory.settings || {});
  if (!memory.settings._init) {
    const touch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    memory.settings.mode = touch ? 'story' : 'action';
    memory.settings._init = 1;
  }
  if (!memory.world) memory.world = {};
  if (!memory.analytics) memory.analytics = [];
  writeLegacy(slot());
  persist();
  if (typeof document !== 'undefined') applySettings();
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
  const key = choiceKey(chapter, record, label);
  const bucket = memory.world[key];
  if (bucket && bucket.total > 0) {
    const pct = Math.round(100 * bucket.count / bucket.total);
    return pct + '% OF PLAYERS CHOSE THIS';
  }
  const local = (slot().choices || {})[key] || 0;
  const group = Object.keys(slot().choices || {}).filter(k => k.indexOf(chapter + '|' + record + '|') === 0);
  const total = group.reduce((n, k) => n + (slot().choices[k] || 0), 0);
  if (total > 0) return 'ON THIS DEVICE: ' + local + ' OF ' + total;
  return 'WORLD TALLY OPENS WHEN THE PUBLIC COUNTER IS LIVE';
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
    y += 44;
    g.fillStyle = '#9a907f';
    wrap(g, worldLine(ch.q, ch.a, api ? api.chapterId() : ''), 72, y, 936, 32);
    y += 78;
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
function show(id){ Object.keys(panels).forEach(k => { panels[k].style.display = k === id ? 'flex' : 'none'; }); }
function hideSheets(){ Object.keys(panels).forEach(k => { panels[k].style.display = 'none'; }); }

function buildSettings(host){
  const st = memory.settings;
  const box = el('div', 'sheetBody');
  box.appendChild(el('h3', 'sheetTitle', 'SETTINGS'));
  const rows = [
    ['VOLUME', 'range', 'volume', 0, 1, 0.05],
    ['TEXT SIZE', 'select', 'textSize', null, null, null, ['sm', 'md', 'lg']],
    ['TEXT SPEED', 'select', 'textSpeed', null, null, null, [0.6, 1, 1.6]],
    ['CHOICE TIMER', 'select', 'timer', null, null, null, ['on', 'long', 'off']],
    ['MOTION', 'select', 'motion', null, null, null, ['full', 'reduced']],
    ['QUALITY', 'select', 'quality', null, null, null, ['auto', 'low', 'med', 'high']],
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
        op.textContent = String(o).toUpperCase();
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
      if (key === 'quality' && api && api.applyQuality) {
        api.applyQuality(v === 'auto' ? (api.Q && api.Q.auto) || 'low' : v);
      }
    });
    row.appendChild(input);
    box.appendChild(row);
  });
  box.appendChild(el('p', 'fine', 'Story Mode aims for you, softens hits, and shortens the hunter. Action Mode is the desktop fight. Timer off keeps every option on screen until you choose. Portrait cards are placeholders, not finished art.'));
  box.appendChild(el('p', 'fine', 'Choice counts and chapter events are anonymous. No account. No name is sent.'));
  const close = el('button', 'btn', 'CLOSE');
  close.type = 'button';
  close.addEventListener('click', () => { hideSheets(); if (pausedFrom) show('pauseSheet'); });
  box.appendChild(close);
  host.appendChild(box);
}

function buildSlots(host){
  const box = el('div', 'slotRow');
  memory.slots.forEach((s, i) => {
    const b = el('button', 'btn small slotBtn', '');
    b.type = 'button';
    const mid = s && s.mid && s.mid.chapter ? s.mid.chapter : '';
    b.textContent = (s && s.name ? s.name : 'SLOT ' + (i + 1)) + (mid ? '  ' + mid : '');
    if (i === memory.active) b.classList.add('on');
    b.addEventListener('click', () => {
      pullLegacy(slot());
      memory.active = i;
      writeLegacy(slot());
      persist();
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
  cont.addEventListener('click', () => {
    const mid = slot().mid;
    if (!mid || mid.chapter !== api.chapterId()) return;
    try { sessionStorage.setItem('latm_resume', JSON.stringify(mid)); } catch (e) {}
    const start = document.getElementById('startBtn');
    if (start) start.click();
  });
  tools.append(cont, exp);
  host.appendChild(tools);
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
    memory.slots[memory.active] = Object.assign(emptySlot(memory.active), s, { name: 'SLOT ' + (memory.active + 1) });
    writeLegacy(memory.slots[memory.active]);
    persist();
    location.reload();
  } catch (e) {
    const note = document.getElementById('backupNote');
    if (note) note.textContent = 'That code could not be read.';
  }
}

function openPaywall(id){
  const s = slot();
  const views = (s.ads && s.ads[id]) || 0;
  const body = document.getElementById('payBody');
  if (!body) return;
  body.innerHTML = '';
  const title = (api && api.chapters && api.chapters[id] && api.chapters[id].subtitle) || id;
  body.appendChild(el('h3', 'sheetTitle', title));
  if (id === 'ch_counting') {
    body.appendChild(el('p', 'deckLine', 'Your story continues in Chapter Three.'));
  } else {
    body.appendChild(el('p', 'deckLine', 'This chapter is part of Book One.'));
  }
  body.appendChild(el('p', 'fine', 'Episode One and your chosen Chapter Two path stay free. Season Pass ' + COMMERCE.SEASON_PRICE + ' opens Chapters Three to Six, every Chapter Two path, the hunter, and the endings. It also removes ads.'));
  body.appendChild(el('p', 'fine', 'Season Pass and Remove Ads do not unlock anything in this build. Nothing is charged until RevenueCat and the store products exist.'));
  const pass = el('button', 'btn amber', 'SEASON PASS  ' + COMMERCE.SEASON_PRICE);
  pass.type = 'button';
  pass.addEventListener('click', () => {
    const note = document.getElementById('payNote');
    if (note) note.textContent = 'Purchase connects when RevenueCat and the store products exist. Nothing is charged in this build.';
  });
  body.appendChild(pass);
  const ads = el('button', 'btn', 'WATCH A SHORT VIEW  ' + views + ' / ' + COMMERCE.AD_VIEWS);
  ads.type = 'button';
  ads.addEventListener('click', () => playPlaceholderAd(id));
  body.appendChild(ads);
  body.appendChild(el('p', 'fine', 'Three completed views open this chapter. Views are optional. There are no banner ads and no forced breaks. The button below is a stand in until AdMob is connected. It still counts so the rule can be tested, and the card says so.'));
  const remove = el('button', 'btn', 'REMOVE ADS  ' + COMMERCE.REMOVE_ADS_PRICE);
  remove.type = 'button';
  remove.addEventListener('click', () => {
    const note = document.getElementById('payNote');
    if (note) note.textContent = hasPass()
      ? 'Season Pass already includes Remove Ads.'
      : 'Remove Ads connects with the store. Nothing is charged in this build.';
  });
  body.appendChild(remove);
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

function playPlaceholderAd(id){
  const note = document.getElementById('payNote');
  if (note) note.textContent = 'Stand in view. No live ad played. AdMob is not connected.';
  setTimeout(() => {
    const s = slot();
    s.ads[id] = (s.ads[id] || 0) + 1;
    persist();
    if (s.ads[id] >= COMMERCE.AD_VIEWS) {
      location.hash = '#' + id;
      location.reload();
      return;
    }
    openPaywall(id);
    const n2 = document.getElementById('payNote');
    if (n2) n2.textContent = 'Stand in view counted. ' + s.ads[id] + ' of ' + COMMERCE.AD_VIEWS + '.';
  }, 900);
}

function buildChapters(host){
  host.innerHTML = '';
  const box = el('div', 'sheetBody');
  box.appendChild(el('h3', 'sheetTitle', 'CHAPTERS'));
  box.appendChild(el('p', 'fine', 'Episode One is free. One Chapter Two path stays free with the ending you earned. The rest opens with the Season Pass, or with three optional views.'));
  const chapters = (api && api.chapters) || {};
  Object.keys(chapters).forEach(id => {
    const c = chapters[id];
    const locked = Waking.isLocked(id);
    const here = api && api.chapterId && api.chapterId() === id;
    const b = el('button', 'btn small beatRow', '');
    b.type = 'button';
    b.textContent = (here ? 'HERE  ' : (locked ? 'LOCKED  ' : 'OPEN  ')) + (c.subtitle || id);
    b.addEventListener('click', () => {
      if (here){ hideSheets(); return; }
      if (Waking.isLocked(id)){ openPaywall(id); return; }
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

export const Waking = window.Waking = {
  settings(){ return memory.settings; },
  storyMode(){ return memory.settings.mode === 'story'; },
  timerMode(){ return memory.settings.timer || 'on'; },
  textSpeed(){ return Number(memory.settings.textSpeed) || 1; },
  reducedMotion(){ return memory.settings.motion === 'reduced'; },
  portraitMode(){ return memory.settings.portraits || 'cards'; },
  gamepadOn(){ return memory.settings.gamepad !== false; },
  isLocked(id){
    if (!id || id === 'ep1') return false;
    if (hasPass()) return false;
    const s = slot();
    if (s && (s.ads[id] || 0) >= 3) return false;
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
      hideSheets();
      return;
    }
    if (mode === 'title' || mode === 'end') { hideSheets(); return; }
    if (mode !== 'play' && mode !== 'story') return;
    pausedFrom = mode;
    api.setMode('paused');
    show('pauseSheet');
  },
  onChoice(chapter, record, label){
    pushChoice(chapter, record, label);
    return worldLine(record, label, chapter);
  },
  worldLine,
  onChapterStart(id){ track('chapter_start', { chapter: id }); },
  onComplete(id){ track('chapter_complete', { chapter: id }); pullLegacy(slot()); persist(); },
  noteDrop(segment){ track('dropoff', { segment }); },
  autosave(pos){
    if (!pos) return;
    const s = slot();
    pullLegacy(s);
    s.mid = pos;
    persist();
  },
  onContextLost(){
    const s = slot();
    pullLegacy(s);
    if (api && api.getPos) s.mid = api.getPos();
    persist();
    let banner = document.getElementById('ctxBanner');
    if (!banner) {
      banner = el('div', 'ctxBanner', 'Display reset. Restoring your save.');
      banner.id = 'ctxBanner';
      document.body.appendChild(banner);
    }
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
    const settingsHost = el('div', '');
    buildSettings(settingsHost);
    pb.appendChild(settingsHost);
    pause.appendChild(pb);

    const pay = panel('paySheet');
    const payBody = el('div', 'sheetBody');
    payBody.id = 'payBody';
    pay.appendChild(payBody);

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
      bar.append(chb, arch, setb);
      start.appendChild(bar);
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
    if (endBtns) endBtns.appendChild(share);

    window.addEventListener('error', (e) => {
      track('crash', { message: String(e.message || 'error').slice(0, 180) });
    });
    window.addEventListener('unhandledrejection', (e) => {
      track('crash', { message: String(e.reason && e.reason.message || e.reason || 'rejection').slice(0, 180) });
    });
    window.addEventListener('pagehide', () => {
      if (api && api.getMode && api.getMode() === 'play' && api.getPos) Waking.noteDrop(api.getPos().segment);
    });
    if (previewOn()) {
      const hint = document.getElementById('startHint');
      if (hint) hint.textContent = (hint.textContent || '') + '  REVIEW UNLOCK IS ON.';
    }
  },
};

bootSaves();
