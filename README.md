# DYSTOPIA, Episode One: The Waking

Play it: [https://matpcul-tech.github.io/Dystopia/](https://matpcul-tech.github.io/Dystopia/)

A free playable 3D episode set in the world of **Life After The Machines**
by Matthew Culwell. You fight in first person and choose like a story.
Every path funnels to Book One.

## Play it

**Story Mode** softens hits and shortens the hunter. On a phone, a shot that is already close to a target gets a small nudge. Mouse and keyboard do not lock onto enemies. **Action Mode** is the harder fight. The title screen shows which one you are in. Settings can switch it.

**What is free.** Episode One is free. The ending you earn keeps one Chapter Two path free. Three book trailers can open one locked chapter for this visit only. Reload the page and those trailers are required again. That visit is not the Season Pass.

**Season Pass** is $6.99 and opens the paid chapters for good, on every save slot in this browser. Checkout is Stripe. The game grants the pass only after the purchase check at `waking-season-pass.matpcul.workers.dev` confirms the checkout: the email on the receipt, or the return link. A link flag by itself does not unlock anything. There is no Stripe secret in the game.

**Controls.**

- Keyboard and mouse: WASD moves. W is forward along the look, S is back. Mouse looks (click the picture to lock). Click or Space fires. E uses. Escape opens pause in one press, and releases the mouse if it was locked. Space advances a line. 1, 2, and 3 pick a choice.
- Touch: the left virtual stick moves. Up is forward along the look, down is back, left and right strafe with the look and do not mirror after you turn. The right side of the screen looks. FIRE shoots. Tap advances a line and picks a choice.

**Coming back.** The title screen has three loops on the same save slots. **Ending Codex** lists the endings you have reached. A locked card is a silhouette and a clue, not the name. **Daily Hive Signal** is a short free room for the calendar day. The reward is a cosmetic mark or a codex clue. It does not open a paid chapter and it does not overwrite the campaign checkpoint. **New Game+** appears after a Chapter Six clear (Game Over or The Count). Book flags, paths, and endings stay on the slot. Action Mode hits harder. Story Mode takes a smaller bump. Four Chapter Two paths each gain one new mid-chapter beat.

Dialogue cards show the speaker's name and the line. Stand-in faces stay hidden until real portrait art ships.

Recent live fixes, on `main`: [#31](https://github.com/matpcul-tech/Dystopia/pull/31) pulled a player who had stepped outside the hardware district back into the room, brought audio back on silent cutscenes, and stopped a spoken line from being cancelled in the same turn it starts. [#32](https://github.com/matpcul-tech/Dystopia/pull/32) opens pause on the same Escape that releases the mouse, and walks W forward along the look. This tree keeps the virtual stick on that same forward: up matches W, and a turn does not mirror strafe.

## What it is

**You fight like a shooter and choose like a story.** Marcus comes to
under a blood sky with no memory. A twenty foot machine finds him. He
dives into an abandoned rail car and goes still. A short game opener
(the locked Shorts Marcus clip when `media/shorts/game/game_ep1_origin_v2.mp4`
is present, otherwise two lines) hands back control in that car, then a
timed choice: the vestibule door, or the side hatch. The vestibule stays
quiet. The hatch is one machine face scare, then the line
`HATCH OPENED. THEY HEARD YOU.` The scar
(`hatchScar`) is what Reyes remembers, and it puts an extra crawler on the
street. He takes the dead man's rifle and fights crawlers, sentries, and
a warden through the ruined street, the hardware district, and the rail
bridge to the depot, where pulling the ledger of taken names springs the trap.

Between combat segments the game drops into **cinematic story beats**:
letterboxed, timed choices with a draining timer, freeze and your
silence is the answer. Choices have teeth:

- **The train**: open the vestibule (quiet, on toward the rifle, no scare) or kick
  the side hatch (one hunter face in the hatch, then `HATCH OPENED. THEY HEARD YOU.`
  A scar: lower vitals, an extra crawler, Reyes changes
  her radio lines, and the depot net remembers it).
- **The cache**: rig the weapon (more damage), field-dress your wounds
  (faster regen), or take everything (both, but slower).
- **Reyes on the radio**: help her (*"◆ REYES WILL REMEMBER THAT."*,
  unlocks the Together ending) or move faster alone.
- **The dead man's radio**: a hidden pickup in the hardware district
  that unlocks the Ghost ending. Miss it and that door stays locked.
- **The finale**: run, hide, or walk into the light. **Four endings**
  (Together, Runner, Ghost, Taken), a per-run choice summary, and a
  persistent endings tracker on the end card.

## The story trees out: Chapter Two

Your Episode One ending decides which **Chapter Two** you get, and the
end card offers CONTINUE straight into it (your perks, Reyes's trust,
and the radio carry over):

| Episode One ending | Chapter Two path |
|---|---|
| Together | **The Convoy**: you and Reyes crack a pod carrier |
| Runner | **The Long Road**: follow a resistance beacon; meet KARA |
| Ghost | **The Listening Dark**: tap the hive's trunk line |
| Taken | **Inside the Hive**: wake in a pod, burn your way out |

Each path is **its own world**, not a re-skin: Inside the Hive is tall
wide pod-lined chambers pinched by a narrow throat; The Listening Dark
is cramped low tunnels; The Convoy and The Long Road play **outdoors
under the blood sky**, an open staging yard with long sightlines, and
a stretched highway climb. Each has its own palette, enemy mix, radio
script, mid-chapter choice, and a final choice with **two endings**, 8 Chapter Two endings
plus Episode One's 4 = 12 endings. Endings you reach unlock their path
on the title screen, so replaying Episode One differently is how you
see the whole tree.

## Chapter Three: The Counting House (stealth)

Finishing **any** Chapter Two path unlocks the converging finale, and
it plays by completely different rules. **No rifle. Noise is a
confession.** The Counting House is where every copy of the ledger is
made permanent, and you go in unarmed:

- Watchers sweep **visible vision cones** across the floor, green
  while scanning, red the instant they see you. Sentries rotate like
  lighthouses; crawlers and wardens pace patrol lanes.
- Being seen fills the red **DETECTION** meter (it replaces VITALS).
  Break line of sight behind the shelf stacks and it drains. Hit 100%
  and you are collected, rewind to the last checkpoint.
- Slip through the records hall, the reading room, and the stack vault
  to the master archive, erase every name ever taken, then walk out
  unseen. A mid-chapter choice (erase your own name from the visitor
  ledger, or leave it) and a final choice, burn the Counting House or
  leave it hollow, give the finale **2 endings**, for **14 endings**
  total across the tree.

## Book One: Chapters Four to Six and the final battle

Either Counting House ending now continues into three chapters adapted
from *Dystopia* Book One (chapters 2 to 14). Each chapter carries your
earlier Book choices forward (saved in `latm_book`).

| Chapter | Book chapters | Rules | Choices | Endings |
|---|---|---|---|---|
| **Four: The Conduits** (`#ch_conduits`) | 2 to 5 | Stealth, unarmed, no comms. Through the maintenance conduits under Omega-7 to the six-way junction | Volunteer for the infiltration, Elena's used adapter, go deeper or key the one-shot transmitter | THE PULSE, ONE TRANSMISSION |
| **Five: The Harvest** (`#ch_harvest`) | 6 to 7 | Combat. Catwalks over the suspension cylinders, download the protocols while OMEGA-7 studies you | Burn the chamber or walk past Angela M., answer the facility's intelligence, split from the convoy or turn back | THE BASE IS GONE, THE SMOKE COLUMN |
| **Six: Fire and Steel** (`#ch_steel`) | 8 to 14 | Combat north through the pass, then the **final battle** in the laboratory yard | Kara's kill package, her offer of two more years, the one conditional, the offer of rest, and the last question about which layer is real | THE LONG WAR, NO SEED, REST (losses with a retry), GAME OVER, THE COUNT |

**The hunter.** A twenty foot machine modeled on the Dystopia Shorts
design: scarred dark gunmetal, a hunched broad chest, a cluster of red
sensors set low between the shoulders, and long arms ending in ribbed
multi-barrel cannons with belt-fed under-mounts. It blows in the yard
wall and fights in phases:

1. **Sensor cluster.** Shoot the red optics. Armor elsewhere pings off.
   Arm cannons fire big shots after a one second telegraph (sensors
   flare white, the muzzle glows); belt bursts spray; get close and it
   stomps (red ring telegraph, knockback).
2. **Arm cannons.** The sensor shutters slam down. A timed choice: draw
   its fire off Kara's barricade (cannons weakened) or stay in cover.
   Destroy both cannons while crawler reinforcements arrive.
3. **The vents.** Its armor seals. Lure it onto a glowing geothermal
   grate and hold E (or VENT) at the valve. Steam locks its joints and
   pins it for 16 seconds; miss and the tap needs 7 seconds to recover.
4. **Pinned.** Run to Thomas's chair and hold E (or UPLOAD). Shooting
   its sensors while it is pinned buys extra seconds. If it rises, vent
   it again; upload progress is kept, even through death.

Then the upload reaches the central layer, the book's ending plays out
as story beats (the conditional, the dimming hunters, the offer of
rest, Lagos, Vera, the converted hunter, and the simulation reveal),
ending on the Book Two hook. Losing endings offer **TRY AGAIN: THE
LABORATORY YARD**, which reloads straight into the boss fight.

## Coming back

Three loops live on the title screen, on the same save slots.

**Ending Codex.** ENDING CODEX opens all 23 endings. A locked card is a silhouette and a clue, with no name. An unlocked card shows the name, a short line, and SHARE, using the same ending card the end screen already draws. The list is `latm_hybrid_endings` on the active slot.

**Daily Hive Signal.** DAILY HIVE SIGNAL is a short free run. The room, the side-room cache, and the one timed choice follow the calendar day. The reward is progress toward a cosmetic (a brass title line, a cool crosshair, or green vitals), or a clue on a locked codex card. It does not open a paid chapter and it does not need Season Pass. The day is stored in this browser as `latm_daily_v1`. Tomorrow's room is a different seed. The run does not overwrite the campaign checkpoint.

**New Game+.** Clear Chapter Six with Game Over or The Count. NEW GAME+ stays on that save slot. Book flags, unlocked paths, and endings stay. The slot button is marked NG+. Action Mode hits harder. Story Mode takes a smaller bump. Inside the Hive, The Listening Dark, The Convoy, and The Long Road each gain a new mid-chapter beat, so a second clear is not the same conversation. Autosave, the three slots, and backup codes keep the NG+ mark with the slot.

## Cinematics: the Dystopia Shorts episodes

All seven Book One Shorts live in `media/shorts/`. ARCHIVE on the title screen plays a full file. A level only plays an 8 to 20 second cue, then control comes back. Skip with the SKIP button, a tap, or Esc. Every chapter open uses a game short under `media/shorts/game/` (origin, street, depot, highway, toll, beacon, pods, trunk, ridge, records hall, dry river, core, pass). Book files stay in the gallery. If a game mp4 is missing, play continues. On the train open, the two origin lines still play. The map is `CINEMATIC_PLAN.md`.

The older `cinematics/` files and `episodes.json` are the previous full-episode intros. The level does not play those.

## Choices change the game, visibly

- **Help Reyes in Episode One and she is THERE**: a companion who runs
  the escape at your shoulder, firing visible tracer shots at anything
  that engages you, and who fights the whole Convoy chapter beside you.
  Leave her behind and you run alone.
- **Loud choices spawn enemies**: hit the convoy checkpoint head-on
  and the noise pulls crawlers in on the spot; abandon Reyes in Episode
  One and the lenses send hunters to the bridge.
- **Free the sleepers in the hive** and during the escape you see them
  running past you to daylight, and the pursuit is halved, because the
  hive divides its attention.
- **Answer the ledger in the tunnels** and every machine in the chapter
  visibly *hesitates* in rhythm, it is thinking about you.
- A **perks HUD** (top right) shows what your choices did: DMG +35%,
  MEDIC, SWIFT, HEAVY, REYES, RADIO, LIBERATOR, SPOKE TO IT.

## No more one-way corridors

Two structural changes to every chapter:

- **Annex side-rooms**: optional rooms off the main path with glowing
  loot caches: field caches (full vitals + faster recovery), power
  cells (+damage), and intel fragments (calmer suspicion decay in the
  Counting House). Explore or miss them.
- **The escape run**: completing the objective no longer ends the
  chapter. The objective flips to getting back out: you fight (or, in
  the Counting House, sneak past alerted watchers) back through the
  whole level while pursuit waves flood in behind you. The final story
  choice happens at the gate you entered through.

Health regen, checkpoints at segment doors, wave defense at the ledger.

## Graphics (shared with Hive Infiltration)

The renderer uses the same modern, gritty look as
[LATM: Hive Infiltration](https://matpcul-tech.github.io/Dystopiabook1/):

- **Materials:** procedural PBR sets generated on a canvas at load (albedo,
  normal map from a painted height map, packed roughness and metalness,
  emissive): cast concrete, armor plate, louvered vents with light leaking
  through, hazard bands, wet floor patches, bolts. World-space ambient
  occlusion and tiling breakup in shader.
- **Lighting:** cold ambient, a shadow-casting helmet flashlight (high tier),
  an omni headlamp, one practical light that hops between wall fixtures,
  muzzle flash and the objective glow. Light shafts, drifting dust, glow
  halos, flowing conduits.
- **Reflections:** `sky.jpg` plus the fixture lights baked into a PMREM
  environment map.
- **Post:** ACES filmic tone mapping, bloom, FXAA, split-tone grade,
  vignette, film grain, chromatic aberration on hits, desaturation at low health.
- **Opening cinematic:** a pinch-free sky shader (the photo is a cylindrical
  horizon band, the overhead smoke is procedural), textured ruined towers
  with broken crowns, girders and burning windows, rubble, fires and ash.

### Quality tiers

| Tier | Intended for | What it does |
|------|--------------|--------------|
| potato | software WebGL (SwiftShader, llvmpipe, softpipe, Microsoft Basic Render Driver) | direct render, pixel ratio hard-capped at 0.65 (governor can scale to 0.4), no shadows, no post, no ash, dust, or light shafts, decorative meshes hidden, Lambert materials, tiniest human LOD |
| low  | phones, weak GPUs | direct render (no post), pixel ratio capped at 1.15, no shadows, 256px textures |
| med  | mid laptops | bloom + color grade, pixel ratio 1.35, no shadows |
| high | desktops | shadow-casting flashlight, FXAA, pixel ratio up to 1.75, full particles |

Software renderers start on **potato**. Touch phones start on **low**. A governor steps down on poor frame rate, and a low tier that is still under the floor drops into potato. It promotes a coasting phone one tier, once. Override with `?q=potato` (alias `?q=ultralow`), `?q=low|med|high`, or the GRAPHICS button on the title screen (AUTO, POTATO / ULTRA LOW, LOW, MED, HIGH).

### Loading

Nothing heavy sits on the path to gameplay: post-processing modules load only
for tiers that use them, the GLB models and the Book One cover load in idle
time, and every shader (level, viewmodel, cinematic) is compiled while the
title is showing, so ENTER and SKIP never hitch on first draw.

Chapter openers are short beat clips, 8 to 20 seconds, then you play.
A full Red Sky Archive episode is never dumped at the start of a level.
The title screen ARCHIVE can list a full short or a montage of openers.
See `CINEMATIC_PLAN.md` for the room by room map.

## Characters (humans.js)

Everyone who speaks or stands in the world is a procedural human built at
load time by `humans.js`, matched to the series bible:

- **Marcus:** short dark hair, stubble, charcoal thermal shirt, canvas pants,
  the cut at his right temple and the neural adapter disk on his belt.
- **Kara:** green eyes, tight dark braid, dirt and war paint streaks, the thin
  hooked scar at her left temple, torn olive field jacket over a gray shirt
  with the sleeves rolled twice, two short lines on the inner left forearm.
- **Thomas:** early sixties, close-cropped gray hair, gray stubble, weathered
  face, worn dark field jacket.
- **David Chen:** gray threading through a dark beard, brown canvas jacket,
  right arm ending at the elbow with the sleeve folded and pinned with wire.
- **Elena:** pale, dark hair in a low bun, small comms headset, a data pad
  held together with hose clamps.
- **Vera:** dark skin, short silver hair, pale gray high-collared clothes.
- **Reyes:** olive jacket, red scarf, ponytail.
- **Omega-7, Ledger, the Hunter:** graphite machine bodies with faceless
  heads and glowing optical sensors.

**How they are built.** One skinned mesh per body (vertex colours, a
17-bone skeleton, a single draw call), plus a head with a painted face
texture: skin variation, lips, brows, stubble or beard, scars and paint.
The head has a real mouth seam, so the jaw opens; eyes with irises, blinking
lids and small saccades; 3D brows that move with expressions (neutral,
stern, grim, worried, warm). While a line shows, the speaker talks: jaw
syllables with natural pauses, head nods and tilts, brow lifts. At rest
everyone breathes and shifts weight.

**Speaker portrait.** The bust code is in the build, but `PORTRAIT_ART` is
off. Dialogue cards show the name and the line only. Stand-in faces stay
hidden until real portrait art ships. When that flag is on, the bust is
drawn by the main renderer into a small offscreen target only while someone
is speaking, with no second WebGL context.

**Suspension tubes.** Every tube holds a suspended sleeper in a thin gray
garment, eyes closed, drifting slowly with floating hair, wired to the cap
by cables, in amber fluid with rising bubbles and a name plate (Angela M.
lit amber). All tubes in a hall share a handful of draw calls: merged
hardware, one glass mesh, one fluid shader mesh, one GPU-animated bubble
cloud, one name plate atlas. Sleepers beyond 26 m are hidden and only near
ones animate their limbs.

**Lighting.** The headlamp and flashlight are tuned for dark metal, so every
human material has a soft highlight shoulder: anything lit above 0.7 rolls
off smoothly instead of burning to white when a person stands at arm's
length. Sleepers are also tinted by the amber fluid, and the tube glass has a
black albedo so it only reflects.

| Tier | Speaker portrait | People in the world | Tube sleepers |
|------|------------------|---------------------|---------------|
| low  | medium detail head (512 px face) | low detail: painted eyes, 256 px face | low detail, 9 bubbles per tube |
| med  | full detail head (1024 px face) | low detail | low detail, 16 bubbles |
| high | full detail, 4x MSAA | medium detail: modelled eyes, lids, brows, shadows | medium detail, 26 bubbles |

**Credits and licences.** The characters use no third-party models,
textures or animations. Geometry, face paint, hair and motion are generated
in code in `humans.js`, which is part of this project and carries no
separate licence terms. (The older `people.js` and `models/pod.glb` remain in
the repo but are no longer loaded.)

## Play

No build step. GitHub Pages serves this folder from `main` at
[https://matpcul-tech.github.io/Dystopia/](https://matpcul-tech.github.io/Dystopia/).
Three.js r160 and the title fonts are vendored under `vendor/`, so a
chapter loads with no CDN.

- **Desktop:** WASD moves. W is forward along the look. Mouse looks after you click to lock. Click or Space fires. E uses. Escape opens pause once. During story beats, Space advances and 1 to 3 picks.
- **Touch:** left stick moves. Up is forward along the look, down is back, left and right follow the look. Right-side drag looks. FIRE shoots. Tap advances a line and picks a choice.

## iOS and Android

GitHub Pages still serves this folder with no build step. The store shells
are Capacitor projects in `android/` and `ios/`. They load a generated
`www/` copy of this game, including the vendored Three.js build and fonts,
so core play does not need a network. See `docs/capacitor.md` for sync,
Android Studio, Xcode, and signing. Season Pass, ads, and Steam are not
part of that shell.

## Author config

- `COMMERCE.SEASON_VERIFY_URL` in `commercial.js` is `https://waking-season-pass.matpcul.workers.dev`. An empty value does not grant from a checkout session id. Steps are in `cloud/SEASON_PASS_WORKER.md`.
- `CONFIG.BOOK1_URL`, the Kindle store URL for Book One.
- `CONFIG.COVER_URL`, the Book One cover on the end card (`book1-cover.jpg`).
- Chapter data (`CHAPTERS.ep1`): rooms, enemies, radio script, palette.
- Story beats: `SHELTER_BEATS`, `VOICE_BEATS`, `FINALE_BEATS`, and
  `ENDING_TEXT` near the bottom of the script, plain data, easy to edit.
