# Steam Content Survey notes

Honest notes for Matthew to submit. This build does not claim a survey was filed.

## What is in the game now

- Three.js r160 is vendored. It is a software library, not generated art.
- Title fonts Cormorant Garamond and Outfit are vendored for offline play. They are licensed typefaces, not generated in this repo.
- World surfaces, the rifle viewmodel extras, sky grade, music, and sound effects are procedural code written in the game. They are not samples from a generative image or audio model, and they are also not hand painted plates.
- Dialogue cards do not show a face. The drawn stand-in and the block bust stay hidden until real portrait art is added.
- Episode One opens on `media/shorts/game/game_ep1_origin_v2.mp4` when that file loads. If it does not load, two in-engine lines play instead.
- Seven Book One shorts are local files, `media/shorts/rsa_ep01_720p.mp4` through `rsa_ep07_720p.mp4`, and the gallery can play them. A level uses the short clips in `media/shorts/game/`, about 8 to 20 seconds, then you play. These gallery rows have an empty url: Inside the Hive, The Listening Dark, The Convoy, The Long Road, The Counting House, and Chapter Six (a hook, no file). Older files in `cinematics/` are not what a level plays.
- The game loads `models/crawler.glb`, `models/sentry.glb`, `models/warden.glb`, and `models/rifle.glb`. `models/pod.glb` is in the folder and is not loaded. Code comments call the loaded files author generated. This repo does not prove they were made without generative tools. Do not answer the survey as if that were proven.
- `sky.jpg`, `cover.jpg`, and `book1-cover.jpg` ship as image files. Treat the book cover as the existing Book One cover. Do not claim the sky photo's origin beyond what is in the repo.

## What is not in this build

- No live ad creative.
- Season Pass checkout opens a Stripe Payment Link in this same tab. The button does not grant the pass. Returning with season_pass=1 does not grant from a checkout session id alone. The page posts the id or the receipt email to `https://waking-season-pass.matpcul.workers.dev` and grants only when that check answers pass true. The pass is stored in this browser for every save slot. Three book trailers open only the chapter you asked for, for this visit, and do not set Season Pass. `?preview=1` does not unlock. Owner preview, after the worker secret is set, is a tab ticket and does not write the Season Pass record. The Remove Ads button is hidden until a real purchase exists. RevenueCat is not connected (`mobile/purchases.js` returns no charge). Trailer files are local. Links after a trailer are not a charge. Steam is a scaffold, not a shipped app.
- No recorded voice cast and no recorded score. Speech is the browser speechSynthesis API (`voices.js`). Music and effects are generated in code.
