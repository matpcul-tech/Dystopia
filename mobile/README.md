# Mobile scaffold

Not a store build. Capacitor, RevenueCat, and AdMob are not installed here
and nothing is signed.

Planned shell, matching the household plan:

- iOS and Android wrap the same `index.html` (offline vendor bundle).
- RevenueCat products: Season Pass $6.99, Remove Ads $2.99.
- AdMob rewarded only, plus UMP and ATT. Three completed views can unlock one locked chapter. No banners. No forced breaks.
- Story Mode is the phone default (auto aim, softer hits, shorter hunter).
- Achievements and cloud save are stubs until the accounts exist.
- If the WebGL context is lost, the game autosaves and reloads.

`purchases.js`, `ads.js`, `achievements.js`, and `cloudsave.js` document the calls. They do not grant a pass and they do not play a live ad.
