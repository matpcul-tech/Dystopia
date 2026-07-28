# DYSTOPIA — Episode One: The Waking

A free playable 3D episode set in the world of **Life After The Machines**
by Matthew Culwell — a hybrid of first-person action and Telltale-style
story choices, on the same engine as
[LATM: Hive Infiltration](https://github.com/matpcul-tech/Dystopiabook1).
Every path funnels to Book One.

## What it is

**You fight like a shooter and choose like a story.** Marcus wakes under
the blood sky (the book's "Awakening in Rust" cinematic plays in-engine),
takes the dead man's rifle, and fights crawlers, sentries, and a warden
through the ruined street, the hardware district, and the rail bridge to
the depot — where pulling the ledger of taken names springs the trap.

Between combat segments the game drops into **cinematic story beats**:
letterboxed, timed choices with a draining timer — freeze and your
silence is the answer. Choices have teeth:

- **The cache** — rig the weapon (more damage), field-dress your wounds
  (faster regen), or take everything (both, but slower).
- **Reyes on the radio** — help her (*"◆ REYES WILL REMEMBER THAT."*,
  unlocks the Together ending) or move faster alone.
- **The dead man's radio** — a hidden pickup in the hardware district
  that unlocks the Ghost ending. Miss it and that door stays locked.
- **The finale** — run, hide, or walk into the light. **Four endings**
  (Together, Runner, Ghost, Taken), a per-run choice summary, and a
  persistent endings tracker on the end card.

## The story trees out — Chapter Two

Your Episode One ending decides which **Chapter Two** you get, and the
end card offers CONTINUE straight into it (your perks, Reyes's trust,
and the radio carry over):

| Episode One ending | Chapter Two path |
|---|---|
| Together | **The Convoy** — you and Reyes crack a pod carrier |
| Runner | **The Long Road** — follow a resistance beacon; meet KARA |
| Ghost | **The Listening Dark** — tap the hive's trunk line |
| Taken | **Inside the Hive** — wake in a pod, burn your way out |

Each path is **its own world**, not a re-skin: Inside the Hive is tall
wide pod-lined chambers pinched by a narrow throat; The Listening Dark
is cramped low tunnels; The Convoy and The Long Road play **outdoors
under the blood sky** — an open staging yard with long sightlines, and
a stretched highway climb. Each has its own palette, enemy mix, radio
script, mid-chapter choice, and a final choice with **two endings** — 8 Chapter Two endings
plus Episode One's 4 = 12 endings. Endings you reach unlock their path
on the title screen, so replaying Episode One differently is how you
see the whole tree.

## Chapter Three — The Counting House (stealth)

Finishing **any** Chapter Two path unlocks the converging finale — and
it plays by completely different rules. **No rifle. Noise is a
confession.** The Counting House is where every copy of the ledger is
made permanent, and you go in unarmed:

- Watchers sweep **visible vision cones** across the floor — green
  while scanning, red the instant they see you. Sentries rotate like
  lighthouses; crawlers and wardens pace patrol lanes.
- Being seen fills the red **DETECTION** meter (it replaces VITALS).
  Break line of sight behind the shelf stacks and it drains. Hit 100%
  and you are collected — rewind to the last checkpoint.
- Slip through the records hall, the reading room, and the stack vault
  to the master archive, erase every name ever taken, then walk out
  unseen. A mid-chapter choice (erase your own name from the visitor
  ledger, or leave it) and a final choice — burn the Counting House or
  leave it hollow — give the finale **2 endings**, for **14 endings**
  total across the tree.

## No more one-way corridors

Two structural changes to every chapter:

- **Annex side-rooms** — optional rooms off the main path with glowing
  loot caches: field caches (full vitals + faster recovery), power
  cells (+damage), and intel fragments (calmer suspicion decay in the
  Counting House). Explore or miss them.
- **The escape run** — completing the objective no longer ends the
  chapter. The objective flips to getting back out: you fight (or, in
  the Counting House, sneak past alerted watchers) back through the
  whole level while pursuit waves flood in behind you. The final story
  choice happens at the gate you entered through.

Graphics: bloom, filmic tone mapping, vignette + film grain post-fx
(with an FPS watchdog that sheds effects on weak devices), GLB machine
models, procedural textures, synthesized audio. Health regen, checkpoints
at segment doors, wave defense at the ledger.

## Play

Single file, no build step. Serve `index.html` from anywhere
(GitHub Pages works as-is). Three.js loads from the jsdelivr CDN.

- **Desktop:** WASD move · mouse look (click to lock) · click/Space fire
  · E interacts · during story beats: Space advances, 1–3 picks.
- **Mobile:** left stick to move · right side drag to look · FIRE button
  · tap to advance story, tap choices.

## Author config

- `CONFIG.BOOK1_URL` — the Kindle store URL for Book One.
- Chapter data (`CHAPTERS.ep1`): rooms, enemies, radio script, palette.
- Story beats: `SHELTER_BEATS`, `VOICE_BEATS`, `FINALE_BEATS`, and
  `ENDING_TEXT` near the bottom of the script — plain data, easy to edit.
