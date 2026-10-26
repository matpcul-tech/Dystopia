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
