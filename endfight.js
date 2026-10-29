// End-of-chapter spawn latch and sim budget.
//
// These rules are shared by every chapter. They used to fail when the
// machine was busy (a phone encoding a livestream, a long hitch, a death
// in the objective room):
//
// 1. Leaving the level was armed by a one-shot wall-clock timer that
//    ran its body only when mode was already "play". Death, a story beat,
//    or a throttled tab dropped that callback forever. The leave objective
//    was already on screen, the exit wave never started, and the entrance
//    did nothing.
// 2. A full active cap skipped the spawn instead of owing it. Drones the
//    sim budget had frozen never died, so the cap never opened and the
//    tail of the wave (the last enemies of the end fight) never appeared.
// 3. The sim budget always walked the drone list from the front, so the
//    same end-of-list enemies lost every frame and never triggered.

export function scheduleEscape(g, delay){
  if (g.escape || g.escapeArm) return false;
  g.escapeArm = g.time + delay;
  return true;
}

// Latch the escape the first play frame on or after the deadline.
// A non-play mode does not consume the deadline.
export function armEscape(g, mode){
  if (g.escape || !g.planted || !g.escapeArm) return false;
  if (mode !== 'play') return false;
  if (g.time < g.escapeArm) return false;
  g.escape = true;
  g.waveSpawned = 0;
  g.waveDebt = 0;
  g.waveStall = 0;
  g.waveT = 0;
  return true;
}

function waveCapOf(g){
  if (g.waveCap !== undefined && g.waveCap !== null) return g.waveCap;
  return g.waveTotal || 0;
}

// Queue spawns on the game clock. If the room is full, remember the debt
// and drip it in, including over the cap once it has been wedged, so the
// last enemies cannot be skipped. Returns the wave indices to spawn now.
export function stepWave(g, dt, pressing, maxActive){
  const cap = waveCapOf(g);
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

// Who gets an AI tick this frame. End-room drones are never the ones
// dropped. Everyone else in range is distance-ordered, the closest stay
// pinned, and the remainder rotates so the tail still triggers.
export function pickSim(list, budget, cursor){
  const chosen = new Set();
  const flex = [];
  for (const item of list){
    if (item.endRoom) chosen.add(item.i);
    else flex.push(item);
  }
  flex.sort((a, b) => a.dist - b.dist);
  const slots = Math.max(0, budget - chosen.size);
  if (flex.length <= slots){
    for (const f of flex) chosen.add(f.i);
    return { chosen, nextCursor: 0 };
  }
  const pin = Math.min(4, slots);
  for (let i = 0; i < pin; i++) chosen.add(flex[i].i);
  const rot = flex.slice(pin);
  const rotSlots = Math.max(0, slots - pin);
  const share = rotSlots > 0 ? rotSlots : (rot.length ? 1 : 0);
  const start = rot.length ? ((cursor || 0) % rot.length) : 0;
  for (let n = 0; n < rot.length && n < share; n++){
    chosen.add(rot[(start + n) % rot.length].i);
  }
  const nextCursor = rot.length ? (start + Math.max(1, share)) % rot.length : 0;
  return { chosen, nextCursor };
}

// Authored homes that were never created. A killed drone still occupies
// its home, so this tops up a missed spawn without reviving the dead.
export function missingHomes(authored, existingKeys){
  const have = new Set(existingKeys);
  const miss = [];
  for (const a of authored){
    if (!have.has(a.x + ',' + a.z)) miss.push(a);
  }
  return miss;
}
