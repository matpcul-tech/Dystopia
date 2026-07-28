# DYSTOPIA — Episode One: The Waking

A cinematic, choice-driven episode (Telltale-style) set in the world of
**Life After The Machines** by Matthew Culwell, rendered in the same
Three.js visual style as [LATM: Hive Infiltration](https://github.com/matpcul-tech/Dystopiabook1)
and funneling players to Book One.

You don't control Marcus directly — you watch the episode play out in
staged 3D scenes with camera cuts, and you make his decisions:

- **Timed choices** — the Telltale signature. A timer drains while you
  decide; saying nothing is also a choice, and the story takes it.
- **Consequence toasts** — *"◆ REYES WILL REMEMBER THAT."* Choices set
  flags that change scenes, dialogue, and which endings you can reach.
- **Quick-time events** — hold your breath under the tarp, open fire on
  the patrol, cross the bridge between searchlight sweeps. Fail and the
  ledger collects you: a death card with **REWIND** back to the last
  checkpoint.
- **Choice summary** — the end card lists every decision you made this
  run, plus a persistent endings tracker (**4 endings**: Taken, Ghost,
  Together, Runner).

Eight 3D sets, all procedural in the engine's phosphor-and-ash style:
the gravel lot under the blood sky, the machine column herding people in
rows, the hardware store with the dead man's radio, the pharmacy
basement, the patrol street, the rail bridge, the depot with its
scrolling ledger of COLLECTED names, and the ridge above the harvest.
Machine models (sentry, warden, pod) are shared with Dystopiabook1.

## Play

Single file, no build step. Serve `index.html` from anywhere
(GitHub Pages works as-is). Three.js loads from the jsdelivr CDN.

- **Desktop:** click/Space advances dialogue · 1–4 or click picks a
  choice · Space answers quick-time events.
- **Mobile:** tap to advance · tap choices · tap during quick-time events.

## Author config

- `CONFIG.BOOK1_URL` — the Kindle store URL for Book One.
- `CONFIG.CHOICE_SECONDS` — default choice timer.
- The whole episode is data: the `B`/`label` script near the middle of
  the file is a list of beats (sets, camera shots, dialogue, choices,
  QTEs, branches, endings). Sets live in the `SETS` object. Adding a
  scene = adding beats.
