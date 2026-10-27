# Steam Content Survey notes

Honest notes for Matthew to submit. This build does not claim a survey was filed.

## What is in the game now

- Three.js r160 is vendored. It is a software library, not generated art.
- Title fonts Cormorant Garamond and Outfit are vendored for offline play. They are licensed typefaces, not generated in this repo.
- World surfaces, the rifle viewmodel extras, sky grade, music, and sound effects are procedural code written in the game. They are not samples from a generative image or audio model, and they are also not hand painted plates.
- Portrait cards are code placeholders. The card says PORTRAIT PLACEHOLDER and NOT FINAL ART. They are not finished character art.
- The opening of Episode One is an in engine scene, not a filmed short.
- Red Sky Archive full short URLs are empty. The gallery does not play a video file until one is linked.
- GLB props in `models/` are described in code comments as author generated. This repo does not prove they were made without generative tools. Do not answer the survey as if that were proven.
- `sky.jpg`, `cover.jpg`, and `book1-cover.jpg` ship as image files. Treat the book cover as the existing Book One cover. Do not claim the sky photo's origin beyond what is in the repo.

## What is not in this build

- No live ad creative.
- Season Pass checkout opens a Stripe Payment Link in this same tab. The button does not grant the pass. Returning with season_pass=1 does not grant unless the link also has a checkout session id. The pass is stored in this browser for every save slot. Three book trailers open only the chapter you asked for, for this visit, and do not set Season Pass. The Remove Ads button is hidden until a real purchase exists. RevenueCat is not connected. Trailer files are local. Links after a trailer are not a charge.
- No voice acting pass and no recorded score.
