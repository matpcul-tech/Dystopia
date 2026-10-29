// Closed-test Play builds flip this in the www copy only.
// GitHub Pages serves this file with the flag off, so the $2.99
// Stripe Season Pass stays on the website. tools/build-www.mjs
// writes true when PLAY_BUILD=1, then strips payment URLs from
// that www copy. This is not a URL parameter.
export const PLAY_BUILD = false;
