# DYSTOPIA: The Waking

Play it: [https://matpcul-tech.github.io/Dystopia/](https://matpcul-tech.github.io/Dystopia/)

A first-person story shooter with timed choices. It is a companion to the novel **Dystopia: Life After The Machines** by Matthew Culwell. You fight, then you choose. If the timer runs out, silence is the answer.

GitHub Pages serves this folder from `main`. There is no build step for the web game.

## What you can play

**Episode One: The Waking.** Marcus comes to under a blood sky, takes a rifle, and fights through the street, the hardware district, and the depot. The episode has four endings: Together, Runner, Ghost, and Taken.

**Chapter Two** follows the ending you earned. Each path is its own level:

| Episode One ending | Chapter Two |
|---|---|
| Together | The Convoy |
| Runner | The Long Road |
| Ghost | The Listening Dark |
| Taken | Inside the Hive |

**Chapters 3 to 6** continue the book: The Counting House (stealth, no rifle), The Conduits, The Harvest, and Fire and Steel (the hunter in the laboratory yard).

**Story Mode** softens hits and shortens the hunter. On a phone, a shot that is already close to a target gets a small nudge. Mouse and keyboard do not lock onto enemies. **Action Mode** is the harder fight. The title screen shows which one you are in. Settings can switch it. A phone starts in Story Mode. A desktop starts in Action Mode.

**23 endings** are listed in `CODEX` in `return-loop.js`: 4 from Episode One, 8 from the Chapter Two paths (two each), 2 from the Counting House, 2 from the Conduits, 2 from the Harvest, and 5 from Fire and Steel. The Ending Codex on the title screen uses that same list.

## Coming back

Three save slots live in this browser (`latm_save_v1`).

**Ending Codex.** A locked card is a silhouette and a clue, not the name. An unlocked card shows the name and a short line. Reached endings stay on the slot.

**Daily Hive Signal.** A short free room for the calendar day. The reward is progress toward a cosmetic, or a clue on a locked card. The cosmetics are a brass title line (Signal Band), a cool crosshair (Ash Visor), and green vitals (Pod Glass). Each one fills after three signals. The signal does not open a paid chapter and it does not overwrite the campaign checkpoint. The day is stored as `latm_daily_v1`.

**New Game+.** Clear Chapter Six with Game Over or The Count. Book flags, unlocked paths, and endings stay on that slot. The slot is marked NG+. Action Mode hits harder. Story Mode takes a smaller bump. Each Chapter Two path gains one new mid-chapter beat.

## What is free, and what is paid

**Free.** Episode One. The daily signal. The one Chapter Two path that matches the ending you earned. The other Chapter Two paths, and Chapters 3 to 6, stay locked.

**Three book trailers.** Watching all three opens the locked chapter you asked for, for this visit only. Reload the page and the trailers are required again. That visit is not the Season Pass. The files are local (`ads/dystopia.mp4`, `ads/borrowed-heartbeat.mp4`, `ads/ailt.mp4`). A link after a trailer is not a charge. A missing file shows an error and does not count a view.

**Season Pass, $6.99.** The button opens a Stripe Payment Link in this same tab. The game grants the pass only after `https://waking-season-pass.matpcul.workers.dev` answers `{ "pass": true }` for the return link or, on Restore, for the email on the Stripe receipt. A flag in the address does not unlock anything. The pass is stored in this browser as `latm_season_pass_v1` and on every save slot. There is no Stripe secret in the game. Steps for the worker are in `cloud/SEASON_PASS_WORKER.md`.

**Owner preview.** `?preview=1` does nothing. A long code, checked by that same worker, can unlock the tab you opened for 12 hours. It never writes `latm_season_pass_v1`. Until you set the worker secret, the page fails closed. Setup and the stream steps are below.

**Not done.** `mobile/purchases.js` is a stub. RevenueCat is not connected, and that module does not charge or unlock anything. The Steam folder is an Electron scaffold, not a shipped app (`steam/README.md`). The $2.99 Remove Ads price is kept in code, and the button stays hidden. The public choice-percent counter stays off while `COMMERCE.STATS_URL` is empty.

## Owner preview

Strangers who know `?preview=1` do not get the paid chapters. You do, after a one-time secret on the worker.

1. Pages has to be serving this client from `main`. On that client, `?preview=1` does nothing, even before the secret exists.
2. From `cloud/`, with the `wrangler.toml` you already use for `waking-season-pass` (that file stays out of the repo):

```
openssl rand -hex 32
npx wrangler secret put PREVIEW_CODE
npx wrangler deploy
```

Paste the hex code when Wrangler asks. Keep the code private. Do not commit it.

3. Before a stream, in the browser you will capture, open:

`https://matpcul-tech.github.io/Dystopia/?preview=` followed by the code, with no space.

4. Wait until the address bar no longer shows `preview`, and the title hint says `REVIEW UNLOCK IS ON.` Then go live. The clean address does not unlock viewers.
5. The unlock stays in this tab for 12 hours, including a refresh, while the worker answers. Close the tab and it is gone. A new tab does not have it. It is not a Season Pass.
6. If the code leaks, set a new `PREVIEW_CODE` and deploy again. Old tickets stop working.

The same steps are how a reviewer gets in. Send them the code in private.

## Controls

- Keyboard and mouse: WASD moves. W is forward along the look, S is back. Mouse looks (click the picture to lock). Click or Space fires. E uses. Escape opens pause in one press, and releases the mouse if it was locked. Space advances a line. 1, 2, and 3 pick a choice.
- Touch: the left stick moves. Up is forward along the look, down is back, left and right strafe with the look. The right side of the screen looks. FIRE shoots. Tap advances a line and picks a choice.
- Gamepad: the left stick moves, the right stick looks, the right trigger fires, the bottom face button uses (and picks the first choice in a story beat), the left and top face buttons pick the next choices, and Start pauses. Settings can turn the gamepad off.

## Tech

**Three.js r160** is vendored under `vendor/`, with the title fonts, so a chapter loads with no CDN.

**People** are drawn in code by `humans.js` (one skinned mesh, a painted face, a mouth that moves while a line shows). Dialogue cards show the speaker's name and the line. The bust stays hidden until real portrait art is turned on.

**Machines and the rifle** also load GLB files: `models/crawler.glb`, `models/sentry.glb`, `models/warden.glb`, and `models/rifle.glb`. They load after the title is up. If a file or the loader fails, the code-built model stays. On the potato tier, enemies stay code-built and the rifle file still loads. `models/pod.glb` is in the folder and is not loaded. `people.js` is not loaded by `index.html`. Comments in `game.js` call the GLB files author-generated. This repo does not prove how those files were made.

**Speech** uses the browser `speechSynthesis` voices in `voices.js`. There are no recorded voice files and no API key. The same speaker keeps the same pitch and rate. Music and sound effects are generated in code.

**Cutscenes.** Seven Book One shorts live in `media/shorts/` (`rsa_ep01_720p.mp4` through `rsa_ep07_720p.mp4`). ARCHIVE on the title screen can play a full file. A level plays a short game clip from `media/shorts/game/`, about 8 to 20 seconds, then you play. Skip with SKIP, a tap, or Esc. If a game file is missing, play continues. These gallery rows have no file yet: Inside the Hive, The Listening Dark, The Convoy, The Long Road, The Counting House, and Chapter Six (kept as a hook). Older clips in `cinematics/` are not what a level plays. The room map is `CINEMATIC_PLAN.md`.

**Checks** in `tools/`:

| Command | What it covers |
|---|---|
| `node tools/check-season.mjs` | Season Pass, restore, and the preview rules, including that bare `?preview=1` does not unlock |
| `node tools/check-return.mjs` | Codex, daily signal, New Game+ |
| `node tools/check-cinematics.mjs` | Beat clips and archive rows |
| `node tools/check-dashes.mjs` | No em dashes or en dashes in game text |
| `node tools/check-offline.mjs` | Files the offline shell needs |
| `node tools/check-aim.mjs` | Aim assist |
| `node tools/check-exits.mjs` | Chapter exits |
| `node tools/check-feel.mjs` | Movement and input feel |
| `node tools/check-train.mjs` | The train beat |
| `node tools/full-run.mjs` | A throttled phone-sized run of every chapter |
| `node tools/shot.mjs` | Screenshot pass of title, choices, openers, and the pay sheet |

`npm run check:full` is the full-run script. `npm run build:www` copies a `www/` folder for the Capacitor shells. See `docs/capacitor.md`.

Graphics tiers are potato, low, med, and high. Software WebGL starts on potato. Phones start on low. Override with `?q=potato` (also `ultralow`), `?q=low`, `?q=med`, `?q=high`, or the GRAPHICS button on the title screen.

## Status

Playable in the browser from Episode One through Chapter Six, with Story and Action modes, the 23-ending codex, the daily signal, New Game+, three save slots, local book trailers, and Stripe Season Pass behind the verify worker.

## Roadmap

- Keep the Pages site on `main` as the live build.
- Set `PREVIEW_CODE` and redeploy the worker when you want the owner unlock. Until then it stays off on purpose.
- Connect phone-store billing only when a real SDK is wired. Do not treat `mobile/purchases.js` as a charge.
- Steam waits on a depot, the content survey, and a build. Notes are in `steam/README.md` and `store/steam/CONTENT_SURVEY.md`.
- Add the missing gallery films, or leave those rows as titles until the files exist.
- Turn on dialogue portraits when the art exists.
- Point `COMMERCE.STATS_URL` at a deployed counter if the public choice percents should show. The stub is `cloud/choice-stats-worker.js`.

## Author config

- `COMMERCE.SEASON_URL`, the Stripe Payment Link.
- `COMMERCE.SEASON_VERIFY_URL`, the worker. Empty fails closed.
- `COMMERCE.SEASON_PRICE`, shown on the button.
- Chapter data and story beats live in `game.js`.
- The codex, daily scripts, and cosmetics live in `return-loop.js`.
