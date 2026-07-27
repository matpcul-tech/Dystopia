# DYSTOPIA: Life After The Machines — Episode One

A survival game set in the world of **Life After The Machines** by
Matthew Culwell. Episode One: *The Waking*.

The entire game lives in a single file: `index.html`. No build step, no
dependencies — open it in a browser and play.

## How it plays

This is a real game, not just a branching story:

- **INTEG (health)** — injuries, hunger, and failed escapes drain it. Hit
  zero and you flatline mid-story.
- **DETECT (detection)** — the hive is always watching. Loud choices raise
  it, careful ones lower it. Hit 100% and the machines converge on you.
- **Rations** — eat to recover strength; run out and your integrity starts
  falling.
- **Inventory** — the pistol, med kit, and radio unlock (or lock) choices
  later. What you carry decides what you can do.
- **Risk rolls** — dangerous moves show their odds up front, shaped by your
  health, detection level, and who's with you. They can fail.
- **Timing challenges** — hold your breath under the tarp, cross the bridge
  between searchlight sweeps. Mark the zone or pay for it.
- **Checkpoints** — fail states offer a reboot from the start of the
  current act.
- **Autosave + endings tracker** — the game saves as you play (Continue on
  the title screen) and remembers which of the **four endings** you've
  found: Taken, Ghost, Together, Runner.

Tap or press space/enter to finish the typewriter effect and advance.

## How to edit (no coding needed)

Open `index.html` and look for the `SCENES` section near the top of the script:

1. **Prose** — every scene has a `text` field. Replace the prose with your
   own. Keep `\n\n` where you want paragraph breaks.
2. **Art** — to add a still from the trailer, change `art: null` to
   `art: "img/scene01.jpg"` and put the image in an `img/` folder next to
   `index.html`.
3. **Book link** — set `BOOK_URL` (marked `// EDIT ME`) to your Amazon author
   page or the Book One page.
4. **Balance** — starting stats live in `START_STATS`. Choice costs use
   `effects: { health, detection, rations }`; risky choices use
   `risk: { base: <odds %> }`.

## How to publish (GitHub Pages)

Same pattern as Sovereign City:

1. Merge this branch into `main`.
2. On GitHub: **Settings → Pages → Source: Deploy from a branch**, pick
   `main` and `/ (root)`, save.
3. The game goes live at `https://<your-username>.github.io/Dystopia/`.
