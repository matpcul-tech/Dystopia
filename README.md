# DYSTOPIA, Episode One: The Waking

A free playable 3D episode set in the world of **Life After The Machines**
by Matthew Culwell, a hybrid of first-person action and Telltale-style
story choices, on the same engine as
[LATM: Hive Infiltration](https://github.com/matpcul-tech/Dystopiabook1).
Every path funnels to Book One.

## What it is

**You fight like a shooter and choose like a story.** Marcus comes to
under a blood sky with no memory. A twenty foot machine finds him. He
dives into an abandoned rail car and goes still. A short game opener
hands back control in that car, then a timed choice: the vestibule
door, or the side hatch. The hatch leaves a scar
(`hatchScar`) that Reyes remembers and that puts an extra crawler on the
street. He takes the dead man's rifle and fights crawlers, sentries, and
a warden through the ruined street, the hardware district, and the rail
bridge to the depot, where pulling the ledger of taken names springs the trap.

Between combat segments the game drops into **cinematic story beats**:
letterboxed, timed choices with a draining timer, freeze and your
silence is the answer. Choices have teeth:

- **The train**: open the vestibule (quiet, on toward the rifle) or kick
  the side hatch (a scar: lower vitals, an extra crawler, Reyes changes
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

## Cinematics: the Dystopia Shorts episodes

All seven Book One Shorts live in `media/shorts/`. ARCHIVE on the title screen plays a full file. A level only plays an 8 to 20 second cue, then control comes back. Skip with the SKIP button, a tap, or Esc. Episode One level openers use `media/shorts/game/` (origin, ruined street, depot). The book file for Episode One stays in the gallery. If a game mp4 is missing, play continues and the two origin lines still play. The map is `CINEMATIC_PLAN.md`.

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
| low  | phones, weak GPUs | direct render (no post), pixel ratio capped at 1.15, no shadows, 256px textures |
| med  | mid laptops | bloom + color grade, pixel ratio 1.35, no shadows |
| high | desktops | shadow-casting flashlight, FXAA, pixel ratio up to 1.75, full particles |

Touch phones start on **low**. A governor steps down on poor frame rate and
promotes a coasting phone one tier, once. Override with `?q=low|med|high` or
the GRAPHICS button on the title screen (AUTO, LOW, MED, HIGH).

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

**Speaker portrait.** The current speaker is lit as a bust (key, fill and a
rim light in the chapter's machine colour) behind the dialogue. It is drawn
by the main renderer into a small offscreen target only while someone is
speaking. There is no second WebGL context and no cost when nobody talks.

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

No build step. GitHub Pages serves this folder from `main`. Three.js r160
and the title fonts are vendored under `vendor/`, so a chapter loads with
no CDN.

- **Desktop:** WASD move · mouse look (click to lock) · click/Space fire
  · E interacts · during story beats: Space advances, 1 to 3 picks.
- **Mobile:** left stick to move · right side drag to look · FIRE button
  · tap to advance story, tap choices.

## Author config

- `CONFIG.BOOK1_URL`, the Kindle store URL for Book One.
- `CONFIG.COVER_URL`, the Book One cover on the end card (`book1-cover.jpg`).
- Chapter data (`CHAPTERS.ep1`): rooms, enemies, radio script, palette.
- Story beats: `SHELTER_BEATS`, `VOICE_BEATS`, `FINALE_BEATS`, and
  `ENDING_TEXT` near the bottom of the script, plain data, easy to edit.
