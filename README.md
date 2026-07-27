# DYSTOPIA: Life After The Machines — Episode One

A choice-driven interactive story set in the world of **Life After The Machines**
by Matthew Culwell. Episode One: *The Waking*.

The entire game lives in a single file: `index.html`. No build step, no
dependencies — open it in a browser and play.

## How to edit (no coding needed)

Open `index.html` and look for the `SCENES` section near the top of the script:

1. **Prose** — every scene has a `text` field. Replace the stub prose with your
   own. Keep `\n\n` where you want paragraph breaks.
2. **Art** — to add a still from the trailer, change `art: null` to
   `art: "img/scene01.jpg"` and put the image in an `img/` folder next to
   `index.html`.
3. **Book link** — set `BOOK_URL` (marked `// EDIT ME`) to your Amazon author
   page or the Book One page.

## How to publish (GitHub Pages)

Same pattern as Sovereign City:

1. Merge this branch into `main`.
2. On GitHub: **Settings → Pages → Source: Deploy from a branch**, pick
   `main` and `/ (root)`, save.
3. The game goes live at `https://<your-username>.github.io/Dystopia/`.

## How it plays

- Tap or press space/enter to finish the typewriter effect, then again to advance.
- Choices set flags (`armed`, `healed`, `trusted`, `seen`) that change later
  scenes and endings. The telemetry bar at the top shows what the hive has
  observed about you.
- Three endings: **Taken**, **Ghost**, and **Together**.
