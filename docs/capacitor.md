# iOS and Android shells

The store apps are a Capacitor 8 wrap of the same game GitHub Pages already serves. The Pages site is still the repo root, with no build step. The native apps load a generated `www/` folder so core play does not fetch Three.js or the title fonts.

App name: **DYSTOPIA: The Waking**

App id: `com.matthewculwell.thewaking`

## Offline bundle

`npm run build:www` copies the playable files into `www/`:

- Three.js r160 from `vendor/three` (the import map in `index.html`)
- Cormorant Garamond and Outfit from `vendor/fonts`
- The game scripts, `style.css`, icons, `sky.jpg`, the Book One cover, the glb models, and `media/shorts`
- `native/native-shell.js`, which only the app copy of `index.html` loads

`www/` is not committed. It repeats the shorts that already live in the repo. Run the build before `cap sync`.

The end card can still open Amazon, and the mailing list form still posts to Kit, when the device is online. Those are not required to play.

## Sync and open

From the repo root, after `npm install`:

```bash
npm run cap:sync
npx cap open android
npx cap open ios
```

`npm run cap:sync` is `npm run build:www` and then `npx cap sync`. Sync copies `www/` into the native projects and refreshes plugins. Do that before opening Android Studio or Xcode. The copied web assets are gitignored.

Android Studio opens `android/`. With the Android SDK installed, `cd android && ./gradlew assembleDebug` builds an unsigned debug APK. Android Studio uses its own debug keystore for that.

Xcode opens the iOS project from `ios/App`. This shell uses Swift Package Manager (`ios/App/CapApp-SPM`), which is what Capacitor 8 generates. On a Mac, Xcode fetches those packages the first time you build. You do not run `pod install` for this project.

## Orientation, splash, and safe area

Portrait and both landscapes are allowed on phones. iPad also allows upside down. The game already plays in either orientation.

The splash is the existing eye icon on the same near-black background as the title screen (`#07070b`), with the title set under it on the launch image. Android 12 and later show that icon on the dark splash color. The splash hides when the page loads.

The HUD already uses `viewport-fit=cover`. System bars stay visible, with light icons on the dark background. Android uses Capacitor SystemBars (`insetsHandling: css`, viewport-fit hint `cover`) so `env(safe-area-inset-*)` and the injected `--safe-area-inset-*` values keep the HUD off the status bar, the notch, and the home indicator. iOS keeps the web view content inset at `never` for the same CSS. `MainActivity` turns on edge-to-edge so older Android versions match.

## What you still have to do

Nothing in this repo is signed, and no store listing is created. The Play closed-test steps, the upload key, and the data safety notes are in `store/PLAY_CLOSED_TEST.md`. The upload keystore is not committed.

**Apple ($99 a year).** Join the Apple Developer Program. iOS signing needs a Mac with Xcode, plus a distribution certificate and a provisioning profile. This project can be generated on Linux. It cannot be compiled or uploaded from Linux. Open the Xcode workspace, select your team, and archive.

**Google ($25 once).** Join Play Console. Create an upload keystore in Android Studio and keep it outside the repo. A personal Play account created after 13 November 2023 has to run a closed test with at least 12 testers for 14 days before production.

Debug builds use the automatic debug keystore. A release build signs only when `android/keystore.properties` is present. That file is gitignored.

## Not in this shell

AdMob, rewarded ads, RevenueCat, and Steam are not part of this project. The notes in `mobile/` describe that later work. They do not charge a card and they do not play an ad.

The website Season Pass stays the $2.99 Stripe link. A Play closed-test bundle is a different copy: `PLAY_BUILD=1 npm run build:www` unlocks every chapter and strips payment URLs before `cap sync`. The committed `play-build.js` stays false, so GitHub Pages does not change. See `store/PLAY_CLOSED_TEST.md`.

`npm run check:offline` rebuilds `www` if needed, rejects a CDN script or font, and loads the bundle in headless Chrome with every other host blocked. A pass means the title screen, Three.js r160, and the local fonts came from this machine. It does not test an iPhone or Android WebView. Speech synthesis and WebGL on those WebViews still need a device pass. The game already calls `speechSynthesis` when it exists, and it already falls back when WebGL is weak.
