# DYSTOPIA: Life After The Machines — Episode One

A top-down stealth survival game set in the world of
**Life After The Machines** by Matthew Culwell. Episode One: *The Waking*.

The entire game lives in a single file: `index.html`. No build step, no
dependencies — open it in a browser and play. Works with keyboard on desktop
and a touch joystick on phones.

## How it plays

You control Marcus directly, moving through three levels of the ruined city:

- **Act 1 — The Streets:** reach the pharmacy shelter. Patrol machines sweep
  vision cones; a drone circles overhead. Cover blocks (hatched squares)
  hide you. Find the dead man's **radio** and a **pistol**.
- **Act 2 — The Crossing:** reach the far bank. A searchlight walks the
  bridge in slow passes — cross between sweeps. Find **Reyes** and she
  joins you, unlocking an ending.
- **Act 3 — The Depot:** the refuge is a trap and the lights are advancing.
  Three exits, three fates: the **gate** (escape — Together with Reyes,
  Runner alone), the **hatch** (Ghost — needs the radio), or walk into the
  **light** (Taken).

**Systems:** INTEG (health) and DETECT meters in the HUD. Being seen fills
DETECT; at 100% the machines triangulate and collect you. Contact with a
machine costs health; at zero you flatline. Fail states offer a reboot from
the act checkpoint. The pistol destroys a machine but spikes detection.
Med kits and food restore health. Autosave lets you Continue from the title
screen, and the ledger permanently tracks which of the four endings you've
recovered.

**Controls:** WASD / arrow keys to move, Space or E to fire.
On phones: drag on the left side for the joystick, tap FIRE on the right.

## How to edit (no coding needed)

Open `index.html`:

1. **Story text** — all prose lives in the `CARDS` object near the top.
2. **Levels** — maps are ASCII art in `LEVELS`. `#` wall, `.` floor,
   `C` cover, `P` start, `X` exit, `r` radio, `m` med kit, `g` pistol,
   `f` food, `R` Reyes, `H` hatch, `B` gate, `L` the light.
3. **Book link** — set `BOOK_URL` (marked `// EDIT ME`).

## How to publish (GitHub Pages)

1. On GitHub: **Settings → Pages → Source: Deploy from a branch**, pick
   `main` and `/ (root)`, save.
2. The game goes live at `https://<your-username>.github.io/Dystopia/`.
