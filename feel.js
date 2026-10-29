// Frame-rate helpers for Story Mode. Pure functions so a playtest
// regression can be checked without a browser or a WebGL context.

// How many characters should be visible after elapsedMs at a fixed
// characters-per-second rate. A slow frame catches up. It does not
// reveal one character per paint.
export function typedCount(elapsedMs, length, cps){
  const n = Math.max(0, length | 0);
  const rate = Number(cps) || 0;
  if (!n || rate <= 0) return 0;
  const ms = Math.max(0, Number(elapsedMs) || 0);
  return Math.min(n, Math.floor(ms / 1000 * rate));
}

// Pointer lock recenters the cursor and reports that jump as movementX.
// Swallow the lock moment, and a late oversized spike, so the camera
// stays where the player was looking.
export function swallowLook(sinceLockMs, movementX, movementY){
  const t = Number(sinceLockMs) || 0;
  if (t < 90) return true;
  const mag = Math.hypot(Number(movementX) || 0, Number(movementY) || 0);
  if (t < 200 && mag > 70) return true;
  return false;
}

// keySecs are seconds the keys were actually down during this frame,
// including a tap that went down and up between paints.
// analog is a stick or pad rate, about -1 to 1.
// frameSec is the real frame length. cap stops a stalled tab from flinging
// the player, without throwing away a short tap inside a long frame.
export function integrateMove(keySecs, analog, frameSec, cap){
  const frame = Math.max(0, Number(frameSec) || 0);
  const limit = Math.min(frame, Math.max(0, Number(cap) || 0));
  let kx = Number(keySecs && keySecs.x) || 0;
  let kz = Number(keySecs && keySecs.z) || 0;
  const kmag = Math.hypot(kx, kz);
  if (limit > 0 && kmag > limit){
    const s = limit / kmag;
    kx *= s; kz *= s;
  }
  let ax = Number(analog && analog.x) || 0;
  let az = Number(analog && analog.z) || 0;
  const amag = Math.hypot(ax, az);
  if (amag > 1){ ax /= amag; az /= amag; }
  let x = kx + ax * limit;
  let z = kz + az * limit;
  const mag = Math.hypot(x, z);
  if (limit > 0 && mag > limit){
    const s = limit / mag;
    x *= s; z *= s;
  }
  return { x, z };
}

// A saved place is valid when it names a real chapter and a position.
// A different chapter means switch, then resume. Same chapter means resume.
export function resumePlan(mid, hereId, chapters){
  const known = !!(chapters && mid && mid.chapter && Object.prototype.hasOwnProperty.call(chapters, mid.chapter));
  const nums = !!(mid && typeof mid.x === 'number' && typeof mid.z === 'number' && Number.isFinite(mid.x) && Number.isFinite(mid.z));
  if (!known || !nums) return { ok:false, reason:'empty' };
  if (mid.chapter !== hereId) return { ok:true, action:'switch', chapter:mid.chapter };
  return { ok:true, action:'resume', chapter:mid.chapter };
}

// Rifle pickup is horizontal. Eye height must not shrink the reach to a
// sliver above the gravel, and walking past the rifle still counts.
// use is the use key while the prompt is up.
export function riflePickup(px, pz, rx, rz, use){
  const h = Math.hypot((Number(px) || 0) - (Number(rx) || 0), (Number(pz) || 0) - (Number(rz) || 0));
  if (h <= 2.2) return true;
  if (use && h <= 4) return true;
  const z = Number(pz) || 0;
  const rzN = Number(rz) || 0;
  if (z < rzN - 0.5 && z > rzN - 8 && Math.abs((Number(px) || 0) - (Number(rx) || 0)) <= 3.1) return true;
  return false;
}

// 'start' may open the ending. 'wait' means the player is in the car but
// the mode cannot take the handoff, so the escape must stay armed.
// 'no' means do not touch the escape flag.
export function trainFinale(s){
  s = s || {};
  if (!s.train || !s.planted || s.finaleStarted) return 'no';
  if (s.ambush === 'live') return 'no';
  // A chapter exit fight has to finish before the train ending.
  // Dying there keeps the escape armed.
  if (s.exitFight && s.ambush !== 'ended' && s.ambush !== 'ending') return 'no';
  if (!(Number(s.z) > Number(s.exitZ))) return 'no';
  if (s.mode !== 'play') return 'wait';
  return 'start';
}

// Combat rooms behind the furthest door the player has already earned.
// The room they are still in is not cleared. Walking back must not rewind this.
export function segmentsToClear(furthest){
  const n = Math.max(0, Number(furthest) || 0);
  const out = [];
  for (let s = 2; s < n; s++) out.push(s);
  return out;
}

// Saved segment is how far the run got. The room under the body can be
// behind that once they turn around. Never drop the run back to the body.
export function resumeProgress(savedSegment, furthest, roomFromZ){
  const saved = Math.max(0, Number(savedSegment) || 0, Number(furthest) || 0);
  const room = Math.max(0, Number(roomFromZ) || 0);
  const progress = Math.max(saved, room);
  return { furthest: progress, segment: progress, room };
}

// A point is inside a room or an annex, with a small margin for the body.
// The hardware district is narrower than the street. A step that clears the
// thin door wall can land beside that room. That point is not inside.
export function inLevel(x, z, rooms, annexes, margin){
  const m = margin == null ? 0.4 : margin;
  const px = Number(x) || 0, pz = Number(z) || 0;
  for (const r of rooms || []){
    if (px >= r.x1 - m && px <= r.x2 + m && pz >= r.z1 - m && pz <= r.z2 + m) return true;
  }
  for (const a of annexes || []){
    const r = rooms && rooms[a.room];
    if (!r) continue;
    const inner = a.side === 'L' ? r.x1 : r.x2;
    const outer = a.side === 'L' ? inner - a.depth : inner + a.depth;
    const x1 = Math.min(inner, outer), x2 = Math.max(inner, outer);
    if (px >= x1 - m && px <= x2 + m && pz >= a.z1 - m && pz <= a.z2 + m) return true;
  }
  return false;
}

// Keep a resolved step only when it is still allowed. A hitch can move
// about a meter. Rejecting the landing stops the shove out of the level.
export function keptStep(prev, next, allowed){
  const from = prev || { x: 0, z: 0 };
  const to = next || from;
  if (allowed && allowed(to.x, to.z)) return { x: to.x, z: to.z, kept: true };
  return { x: from.x, z: from.z, kept: false };
}

// How many collision slices a move needs so it cannot skip a thin wall.
export function moveSlices(distance, maxStep){
  const d = Math.max(0, Number(distance) || 0);
  const step = Math.max(0.05, Number(maxStep) || 0.18);
  return Math.max(1, Math.ceil(d / step));
}

// Horizontal gap that keeps a machine body off the camera.
export function bodyGap(kind){
  if (kind === 'warden') return 1.7;
  if (kind === 'sentry') return 1.45;
  return 1.25;
}

// How long a spoken line stays before the next one. Reading time and
// speech time both count, so the line is not cut off mid-word.
export function lineHoldMs(text, speed){
  const n = String(text || '').length;
  const sp = Math.max(0.35, Number(speed) || 1);
  const read = Math.max(3400, n * 60);
  const speak = n * 78;
  return Math.min(14000, Math.max(read, speak) / sp);
}

// A beat clip owns the music bed only when its file is actually playing sound.
// A silent picture must leave music, heartbeat, and speech in place.
export function claimClipBed(fileHasAudio, muted){
  return !!fileHasAudio && !muted;
}

// One step for the keyboard and the virtual stick.
// Negative mvz is forward: W, and the stick pushed up (screen y decreases).
// Positive mvx is strafe right. After a turn, up still follows the look
// and right is not mirrored. Do not add this vector in world x/z.
export function lookDelta(yaw, mvx, mvz){
  const y = Number(yaw) || 0;
  const xIn = Number(mvx) || 0;
  const zIn = Number(mvz) || 0;
  const fwdX = -Math.sin(y);
  const fwdZ = -Math.cos(y);
  const rightX = Math.cos(y);
  const rightZ = -Math.sin(y);
  return {
    x: rightX * xIn + fwdX * (-zIn),
    z: rightZ * xIn + fwdZ * (-zIn),
  };
}

// One Escape press can show up as an unlock, a keydown, and a keyup.
// The first event opens pause. Later pieces of that same press must not
// close it. A later press, after the window, resumes.
// kind is 'down', 'up', or 'unlock'.
export function escapePress(s, now){
  const t = Number(now) || 0;
  const last = Number(s && s.lastAt) || 0;
  const mode = (s && s.mode) || '';
  const within = t - last < 400;
  const playing = mode === 'play' || mode === 'story';
  if (s && s.kind === 'up'){
    if (within || s.paused || !playing) return { action: 'ignore', lastAt: last };
    return { action: 'open', lastAt: t };
  }
  if (s && s.kind === 'unlock'){
    if (t < (Number(s.suppressUntil) || 0)) return { action: 'ignore', lastAt: last };
    if (within || s.paused || !playing) return { action: 'ignore', lastAt: last };
    return { action: 'open', lastAt: t };
  }
  if (within) return { action: 'ignore', lastAt: last };
  if (mode === 'paused') return { action: 'resume', lastAt: t };
  if (mode === 'title' || mode === 'end') return { action: 'toggle', lastAt: t };
  if (playing && !(s && s.paused)) return { action: 'open', lastAt: t };
  return { action: 'ignore', lastAt: last };
}

// Seconds of a held button that count this frame. A stalled paint still
// counts the time the finger was down, up to a cap, so a livestream hitch
// cannot freeze the objective bar. A backgrounded tab does not finish it.
export function holdSlice(frameSec, cap){
  const d = Math.max(0, Number(frameSec) || 0);
  const c = Math.max(0, Number(cap) || 0);
  if (!(c > 0)) return 0;
  return Math.min(d, c);
}

// Which subtitle belongs at this moment in a cue. The picture is the clock.
// A slow frame must not leave line 1 up while the shot has moved on.
export function cueLineIndex(videoT, cueStart, cueDur, count){
  const n = count | 0;
  if (n <= 0) return 0;
  const dur = Math.max(0.001, Number(cueDur) || 0);
  const u = ((Number(videoT) || 0) - (Number(cueStart) || 0)) / dur;
  if (u <= 0) return 0;
  if (u >= 1) return n - 1;
  return Math.min(n - 1, Math.floor(u * n));
}

// The leave-the-level beat is a deadline on the game object, not a timer
// that runs once. Death, pause, a story beat, or a throttled tab must not
// consume it. The first play frame at or after the deadline takes it.
export function scheduleHandoff(g, delaySec, nowMs){
  if (!g || g.handoffDone || g.handoffAt) return false;
  g.handoffAt = (Number(nowMs) || 0) + Math.max(0, Number(delaySec) || 0) * 1000;
  return true;
}
export function takeHandoff(g, mode, nowMs){
  if (!g || g.handoffDone || !g.planted || !g.handoffAt) return false;
  if (mode !== 'play') return false;
  if ((Number(nowMs) || 0) < g.handoffAt) return false;
  g.handoffDone = true;
  return true;
}

// Owed spawns wait. A full room used to skip the tick, and the last
// enemies of the wave never appeared. The final pair still drips in
// once the cap has been wedged.
export function stepWave(g, dt, pressing, maxActive){
  const cap = (g.waveCap !== undefined && g.waveCap !== null) ? g.waveCap : (g.waveTotal || 0);
  const spawned = [];
  if (!g.alarm || cap <= 0 || (g.planted && !g.escape)) return spawned;
  const spawnedCount = g.waveSpawned || 0;
  const debt = g.waveDebt || 0;
  if (spawnedCount + debt < cap){
    g.waveT = (g.waveT || 0) - dt;
    if (g.waveT <= 0){
      g.waveDebt = debt + 1;
      g.waveT = 3;
    }
  }
  if ((g.waveDebt || 0) > 0) g.waveStall = (g.waveStall || 0) + dt;
  else g.waveStall = 0;
  let guard = 0;
  let hot = pressing;
  while ((g.waveDebt || 0) > 0 && guard < 2){
    const wedged = hot >= maxActive && (g.waveStall || 0) > 6;
    if (hot >= maxActive && !wedged) break;
    const overtime = hot >= maxActive;
    spawned.push(g.waveSpawned || 0);
    g.waveSpawned = (g.waveSpawned || 0) + 1;
    g.waveDebt = (g.waveDebt || 0) - 1;
    guard += 1;
    hot += 1;
    if (g.waveDebt <= 0) g.waveStall = 0;
    if (overtime){ g.waveStall = 0; break; }
  }
  return spawned;
}
