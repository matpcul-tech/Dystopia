/* ============================================================
   Cinematics: the Dystopia Shorts episodes, played fullscreen as
   the intro of their matching game chapter, plus a title-screen
   gallery to rewatch the ones you have unlocked. Data lives in
   episodes.json; this file only knows how to show them.
   ============================================================ */
(function(){
  'use strict';
  const FALLBACK = [
    { id:'ep01', number:1, bookChapter:1, title:'Twenty Feet of Machine', chapter:'ep1', at:'start', src:'cinematics/ep01.mp4', poster:'cinematics/ep01_poster.jpg', blurb:'' },
    { id:'ep02', number:2, bookChapter:2, title:'Forty-Three Left', chapter:'ch_conduits', at:'start', src:'cinematics/ep02.mp4', poster:'cinematics/ep02_poster.jpg', blurb:'' },
  ];
  let list = null;
  const ready = fetch('episodes.json', { cache:'no-cache' })
    .then(r => r.ok ? r.json() : Promise.reject(r.status))
    .then(j => { list = (j.episodes || []).slice().sort((a,b) => a.number - b.number); })
    .catch(() => { list = FALLBACK; });
  const eps = () => list || FALLBACK;
  const store = (k, v) => { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || 'null'); localStorage.setItem(k, JSON.stringify(v)); } catch(e){ return null; } };
  const seen = () => store('waking_cine_seen') || [];
  const markSeen = id => { const s = seen(); if (!s.includes(id)){ s.push(id); store('waking_cine_seen', s); } };
  const sess = (k, v) => { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch(e){ return null; } };
  const label = ep => 'EPISODE ' + ep.number + '  \u00B7  ' + String(ep.title).toUpperCase();
  let muted = sess('waking_cine_muted') === '1';
  let active = null;

  function el(tag, cls, html){ const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  /* ---- fullscreen player ---- */
  function play(ep, opts){
    opts = opts || {};
    if (active) active.close(true);
    const root = el('div', 'cine'); root.id = 'cine';
    const v = document.createElement('video');
    v.setAttribute('playsinline', ''); v.setAttribute('webkit-playsinline', '');
    v.preload = 'auto'; v.poster = ep.poster || ''; v.muted = muted; v.src = ep.src;
    v.disablePictureInPicture = true; v.controls = false;
    const top = el('div', 'cineTop', '<div class="cineKick">DYSTOPIA SHORTS</div><div class="cineTitle"></div>');
    top.querySelector('.cineTitle').textContent = label(ep);
    const btns = el('div', 'cineBtns');
    const mute = el('button', 'cineBtn cineMute'); mute.type = 'button';
    const skip = el('button', 'cineBtn cineSkip', opts.gallery ? 'CLOSE \u25B8' : 'SKIP \u25B8'); skip.type = 'button';
    btns.append(mute, skip);
    const tap = el('button', 'cineTap', '<span class="cineTapIcon">\u25B6</span><span>TAP TO PLAY</span>'); tap.type = 'button';
    const bar = el('div', 'cineBar', '<i></i>');
    root.append(v, top, btns, tap, bar);
    document.body.appendChild(root);
    const setMute = () => { mute.textContent = v.muted ? 'SOUND OFF' : 'SOUND ON'; mute.classList.toggle('off', v.muted); };
    setMute();
    let done = false, started = false, watchdog = 0;
    const state = { ep, root, video: v, get started(){ return started; }, close };
    active = state;
    function close(silent){
      if (done) return; done = true;
      clearTimeout(watchdog);
      removeEventListener('keydown', onKey, true);
      try { v.pause(); } catch(e){}
      v.removeAttribute('src'); try { v.load(); } catch(e){}
      root.classList.add('out');
      setTimeout(() => root.remove(), 320);
      if (active === state) active = null;
      if (!silent && opts.onDone) opts.onDone();
    }
    function finish(){ markSeen(ep.id); close(false); }
    function onKey(e){
      if (e.key === 'Escape' || e.code === 'Escape'){ e.preventDefault(); e.stopPropagation(); finish(); return; }
      if (e.key === 'm' || e.key === 'M'){ e.stopPropagation(); mute.click(); return; }
      e.stopPropagation();
    }
    addEventListener('keydown', onKey, true);
    skip.addEventListener('click', e => { e.stopPropagation(); finish(); });
    mute.addEventListener('click', e => {
      e.stopPropagation();
      v.muted = !v.muted; muted = v.muted; sess('waking_cine_muted', muted ? '1' : '0'); setMute();
      if (v.paused && started) v.play().catch(() => {});
    });
    const showTap = () => { if (!done) root.classList.add('blocked'); };
    const tryPlay = () => {
      const p = v.play();
      if (p && p.catch) p.catch(() => showTap());
    };
    tap.addEventListener('click', e => { e.stopPropagation(); root.classList.remove('blocked'); tryPlay(); });
    v.addEventListener('click', () => { if (v.paused && !done) { root.classList.remove('blocked'); tryPlay(); } });
    v.addEventListener('playing', () => { started = true; root.classList.remove('blocked'); root.classList.add('playing'); clearTimeout(watchdog); });
    v.addEventListener('timeupdate', () => { if (v.duration) bar.firstChild.style.width = (v.currentTime / v.duration * 100).toFixed(2) + '%'; });
    v.addEventListener('ended', finish);
    // a missing or broken file never blocks the game
    v.addEventListener('error', () => { if (!done) close(false); });
    watchdog = setTimeout(() => { if (!started) showTap(); }, 6000);
    requestAnimationFrame(() => root.classList.add('in'));
    tryPlay();
    return state;
  }

  /* ---- automatic play at a chapter trigger (once per session) ---- */
  function find(chapter, at){ return eps().find(e => e.chapter === chapter && (e.at || 'start') === at) || null; }
  function auto(chapter, at){
    const ep = find(chapter, at);
    if (!ep) return null;
    if (sess('waking_cine_auto_' + ep.id)) return null;   // already shown this session (replays, retries)
    return ep;
  }
  function playAuto(ep, onDone){
    sess('waking_cine_auto_' + ep.id, '1');
    return play(ep, { onDone });
  }

  /* ---- title-screen gallery ---- */
  function gallery(){
    const s = seen();
    const root = el('div', 'cineGal'); root.id = 'cineGal';
    const head = el('div', 'cgHead', '<div class="cgKick">DYSTOPIA SHORTS</div><div class="cgTitle">CINEMATICS</div><div class="cgSub"></div>');
    head.querySelector('.cgSub').textContent = 'UNLOCKED ' + eps().filter(e => s.includes(e.id)).length + ' / ' + eps().length + '. EACH EPISODE ADAPTS ONE CHAPTER OF BOOK ONE.';
    const grid = el('div', 'cgGrid');
    const CH_NAME = { ep1:'EPISODE ONE', ch_conduits:'CHAPTER FOUR', ch_harvest:'CHAPTER FIVE', ch_steel:'CHAPTER SIX' };
    eps().forEach(ep => {
      const open = s.includes(ep.id);
      const card = el('button', 'cgCard' + (open ? '' : ' locked')); card.type = 'button';
      const img = el('div', 'cgPoster');
      const pic = el('div', 'cgImg'); pic.style.backgroundImage = 'url("' + ep.poster + '")'; img.appendChild(pic);
      if (!open) img.appendChild(el('div', 'cgLock', 'LOCKED'));
      const meta = el('div', 'cgMeta');
      meta.appendChild(el('div', 'cgEp', 'EPISODE ' + ep.number));
      const t = el('div', 'cgName'); t.textContent = String(ep.title).toUpperCase(); meta.appendChild(t);
      const b = el('div', 'cgBlurb'); b.textContent = open ? (ep.blurb || '') : 'PLAYS AT THE START OF ' + (CH_NAME[ep.chapter] || 'ITS CHAPTER') + '.'; meta.appendChild(b);
      card.append(img, meta);
      if (open) card.addEventListener('click', e => { e.stopPropagation(); root.remove(); play(ep, { gallery:true, onDone: gallery }); });
      grid.appendChild(card);
    });
    const close = el('button', 'btn small cgClose', 'BACK'); close.type = 'button';
    const shut = () => { removeEventListener('keydown', onKey, true); root.remove(); };
    function onKey(e){ if (e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); shut(); } else e.stopPropagation(); }
    close.addEventListener('click', e => { e.stopPropagation(); shut(); });
    addEventListener('keydown', onKey, true);
    root.append(head, grid, close);
    document.body.appendChild(root);
    return root;
  }

  window.WakingCinema = { ready, episodes: eps, play, auto, playAuto, find, gallery, seen, markSeen,
    isActive: () => !!active, active: () => active };
})();
