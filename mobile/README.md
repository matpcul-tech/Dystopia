# Later mobile work

The Capacitor iOS and Android shell lives at the repo root. See `docs/capacitor.md`.

This folder is not that shell. `purchases.js`, `ads.js`, `achievements.js`, and `cloudsave.js` only document later calls. They do not grant a Season Pass, play an ad, or sync a cloud save.

Not built here:

- RevenueCat products (Season Pass, Remove Ads)
- AdMob rewarded ads, UMP, or the iOS tracking prompt
- Game Center or Play Games achievements
- Cloud save

Do not point Capacitor `webDir` at the repo root. The app build is `www/`, produced by `npm run build:www`.
