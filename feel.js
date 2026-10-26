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
