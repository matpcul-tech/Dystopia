# DYSTOPIA — Episode One: The Waking

A free playable 3D episode set in the world of
**Life After The Machines** by Matthew Culwell — built on the same engine
as [LATM: Hive Infiltration](https://github.com/matpcul-tech/Dystopiabook1),
funneling players to Book One.

**Episode One — The Waking**: Marcus wakes in the gravel under a sky the
wrong color, follows a dead man's radio — and Reyes's voice — through the
ruined streets and the hardware district, crosses the warden-guarded rail
bridge, and reaches the depot refuge across the river. The gate is open.
The cots are empty. The far wall is a screen, and the screen is a list of
names. Pull the ledger, survive the net, get out. This is where Book One
begins.

The episode plays through the book's opening in-engine: the "Awakening in
Rust" cinematic runs before the level starts.

## Play

Single file, no build step. Serve `index.html` from anywhere
(GitHub Pages works as-is). Three.js is loaded from the jsdelivr CDN.

- **Desktop:** WASD move, mouse look (click for pointer lock), click/Space
  fire, hold E to pull the ledger, M toggles music.
- **Mobile:** left side virtual stick to move, right side drag to look,
  FIRE button, hold PULL at the depot screen.

## Structure

The chapter is a pure data object (`CHAPTERS.ep1` in `index.html`):
rooms, enemy placements, radio script, palette, objectives. The engine —
shared with Dystopiabook1 — builds whatever the data describes. Adding
another episode = adding a data block.

- One weapon (pulse rifle, hitscan, infinite ammo, fire-rate cap)
- Three enemies: Crawler (melee rush), Sentry (telegraphed ranged), and
  Warden (heavy frame) with three-state AI and line-of-sight triggers
- 100 HP with regen after 5s out of combat; checkpoints at segment doors
- Wave defense at the depot while the ledger copies
- All audio synthesized (WebAudio); textures procedural; enemy/rifle
  GLB models in `models/`

## Author config

Everything an author should tweak lives in the `CONFIG` block and the
`CHAPTERS.ep1` data at the top of the `<script type="module">`:

- `BOOK1_URL` — the Kindle store URL for Book One.
- `radio` — all of Reyes's chatter lines, keyed by trigger.
- `introLines` — the awakening text; `endTitle` / `endSub` — the end card.
