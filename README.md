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

Each path has its own palette, enemy mix, radio script, mid-chapter
choice, and a final choice with **two endings** — 8 Chapter Two endings
plus Episode One's 4 = **12 endings** tracked across runs. Endings you
reach unlock their path on the title screen ("CHAPTER TWO PATHS
UNLOCKED: n / 4"), so replaying Episode One differently is how you see
the whole tree.

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
