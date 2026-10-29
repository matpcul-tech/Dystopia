# Play closed test

DYSTOPIA: The Waking. Owner steps for the closed track. The `.aab` is not in git.

| | |
|---|---|
| applicationId | `com.matthewculwell.thewaking` |
| versionName | 1.0.0 |
| versionCode | 1 |
| targetSdk | 36 (Android 16) |
| minSdk | 24 |
| App name | DYSTOPIA: The Waking |
| Privacy policy | https://matpcul-tech.github.io/Dystopia/store/PRIVACY.md |

Play requires new apps and updates to target Android 16 (API 36) as of 31 August 2026. This project already compiles and targets 36 (`android/variables.gradle`). An extension to 1 November 2026 exists in Play Console, and this build does not need it.

The privacy URL already serves `store/PRIVACY.md` from GitHub Pages. This pull request updates that file. Merge it to `main` before you paste the URL into Play Console, so the live page matches the policy below.

## What this Android build is

`play-build.js` in the repo is `export const PLAY_BUILD = false`. GitHub Pages keeps the $2.99 Stripe Season Pass. The flag is not a URL parameter.

`npm run build:www:play` (`PLAY_BUILD=1`) writes `www/` with the flag true, unlocks every chapter, and strips payment URLs from that copy. `npx cap sync android` then copies `www/` into the app. A release build refuses to package assets if the flag is off or if `buy.stripe.com`, `stripe.com`, `buy on web`, or `paypal.com` is still in the web assets.

In this build:

- Season Pass is included. Every chapter is open, including the Chapter Two paths and Chapters 3 to 6.
- There is no Stripe link, no `buy.stripe.com` URL, and no buy on web prompt.
- The hidden Remove Ads control stays hidden. `mobile/purchases.js` still does not charge anything.
- The ending card can still open the novel on Amazon, and a trailer can open Amazon or the author hub, only if the player taps it. Those are book links, not a purchase of the game.
- Stick direction, SKIP, pause, and cutscene timing are unchanged.

Rebuild from the repo root:

```bash
npm ci
npm run build:www:play
npx cap sync android
```

Release signing reads `android/keystore.properties`. That file is gitignored. See the upload key section.

## Upload key

The `.aab` is signed with an upload key generated for this closed test. Play App Signing holds the app signing key after you enroll. This keystore is only the upload key. Keep the keystore and the password file offline, outside the repo, and out of chat logs. If you lose the upload key you can ask Google to reset it, and you cannot upload an update until that reset finishes. Do not commit the keystore or the passwords.

- File name: `dystopia-upload.jks`
- Alias: `upload`
- Algorithm: RSA 2048
- Certificate SHA-256: `78:10:55:6B:09:CA:80:B5:2B:54:AD:BA:C8:17:67:4A:6C:D1:AD:7C:2B:CD:E8:82:37:FB:1A:27:4E:7C:58:43`
- Certificate SHA-1: `2D:7F:E8:11:C6:8B:FB:B3:A1:5C:EE:A5:83:CB:73:6B:0E:B1:84:82`
- The keystore and the passwords are agent artifacts for the run that built this, not files in git. Play Console should show this same SHA-256 on the upload certificate after the first `.aab` is accepted.

`android/keystore.properties` (do not commit) looks like this, with the real passwords:

```
storeFile=upload-keystore.jks
storePassword=REPLACE
keyAlias=upload
keyPassword=REPLACE
```

`storeFile` is relative to the `android/` folder. Put `dystopia-upload.jks` there as `upload-keystore.jks`, or point `storeFile` at the path where you keep it.

From `android/`, with the Android SDK installed:

```bash
./gradlew bundleRelease assembleRelease
```

`bundleRelease` writes the `.aab` Play accepts. `assembleRelease` writes a signed `.apk` for a sideload smoke test. The sideload does not count as a Play tester.

## Closed track

You do this in Play Console. A personal account created after 13 November 2023 cannot ship to production until a closed test has at least 12 testers opted in continuously for 14 days. Internal testing does not count. Open testing stays locked until you have production access.

1. Play Console, Create app. App name: `DYSTOPIA: The Waking`. Default language: English (United States). App or game: Game. Free.
2. Finish the dashboard setup tasks. Closed testing will not roll out until they are done. Use the sections below for data safety, ads, content rating, and the privacy URL.
3. App access: all functionality is available without special access. There is no account and no password. Say that testers do not need credentials.
4. Ads: No. AdMob is not in the app. The book trailers are local files, and this build does not require them to play.
5. Test and release, Testing, Closed testing. Create a closed track if you do not have one.
6. Create a new release. Upload the `.aab`. Release name: `1.0.0 (1)`. Notes can say: Closed test. Season Pass and all chapters are included. Nothing is sold in the app.
7. Countries: include every country your testers are in. A tester outside the country list cannot install.
8. When Play asks, enroll in Play App Signing and let this upload register the upload certificate. Do not send the keystore password to support.
9. Review and start the rollout to closed testing. The first review can take several days. The 14 days start when testers are opted in, not when you upload.

## Google Group, open to join

1. Sign in as the Play account owner at https://groups.google.com/ and create a group. A usable name is `dystopia-waking-testers`. The email will look like `dystopia-waking-testers@googlegroups.com`.
2. Group settings, Who can join the group: Anyone on the web. That is the open join setting. Invited users only will block testers from adding themselves.
3. Who can view conversations and who can post: group members is enough. Testers do not need to email the group.
4. Play Console, Closed testing, Testers. Choose Google Groups. Paste the group email. Save.
5. Copy the opt-in link on that testers page (Join on the web). Send testers both steps, in this order:
   - Join the Google Group.
   - Open the Play opt-in link and accept the test.
   - Install DYSTOPIA: The Waking from Play. The listing should say they are a tester.
6. You need at least 12 testers opted in at the same time, continuously, for 14 days. A tester who opts out before day 14 does not count. If they leave and come back, their 14 days start over. Tell them to stay opted in for the full 14 days. Invite more than 12 so one dropout does not reset you.
7. After 14 days with 12 still opted in, open the Play Console dashboard and apply for production. You will describe the test, who played, and what you changed. That application is later. This build is only the closed test.

## Data safety

Answer for the Android app, not for the website. Checked against `signup.js`, `index.html`, `commercial.js`, `mobile/ads.js`, `mobile/cloudsave.js`, and `mobile/purchases.js`.

The app does collect data, because the player can choose to send the mailing list form.

Collected:

- Email address. Optional. The title form and the ending form post to `https://app.kit.com/forms/10080648/subscriptions` when the player submits. Play does not require the form.
- Name. Optional first name on that same form.

Shared: yes, with Kit (`app.kit.com`), so you can send the free chapter and a note. You can read the entry in Kit. It is not sold. The form uses HTTPS, so answer yes to encrypted in transit.

Not collected. Nothing in this build sends these off the device:

- Location, financial info, photos, audio, files, calendar, contacts, messages, web browsing history, device ids, or an advertising id.
- App activity and crash lines. `COMMERCE.ANALYTICS_URL` and `COMMERCE.STATS_URL` are empty, so they stay in the local save.
- Cloud save. `mobile/cloudsave.js` returns without a network call.
- Purchase details. This build does not call the Season Pass worker and does not open Stripe.
- Ads data. `mobile/ads.js` does not play an ad. No AdMob SDK is in the Android project.

Other answers:

- Data is not required for the app to work. The player can ignore the form.
- Users can request deletion: yes. Point at the Kit unsubscribe link and the contact email on the store listing. Clearing app storage deletes the local save only.
- Designed for Families, or a target audience that includes children: no.

`android:allowBackup` is true, so the local save can sit in the player's own Android backup. You do not receive it. Do not declare that backup as data you collect.

## Content rating

Fill the IARC form in Play Console. These notes are from the game script and the play code. This repo cannot file the certificate for you.

- Violence: the player shoots machines with a rifle. A hunter machine is a fight. Dialogue includes death ("could kill you") and the word hell ("inside of hell itself"). The sky is described as the color of blood. Hits flash red. There is no gore system and no dismemberment in the code.
- Fear: the tone is dystopian. People are harvested by machines.
- Language: mild. hell appears in dialogue. A pass over the script did not find stronger slurs.
- Sexual content, nudity, drugs, alcohol, gambling: not in the game. A `sex` field on a character is a body type for the drawn person, not sexual content.
- User interaction: no chat, no public profile, no content other players can see. Choices stay on the device.
- Online: the optional mailing list, and book links the player taps. No multiplayer.
- In-app purchases: none in this build. Do not declare a Season Pass product. It is included.
- Target age: not children. Do not opt into Designed for Families. Do not tick an under-13 audience. Set the target age to match the certificate the form returns (likely teen). Do not hide the rifle, and do not tick violence the game does not have.

## What you still do by hand

Play will not publish from the `.aab` alone.

- Short description and full description. `store/steam/STORE_COPY.md` is a starting point. Remove the $2.99 line. This closed test does not sell a pass.
- A 512 icon, a 1024x500 feature graphic, and phone screenshots. `icons/` has the eye icon. Screenshots have to come from a device or an emulator.
- A contact email on the listing. The privacy policy tells players to use that address. The repo does not contain one.
- Privacy policy URL, after this file is on `main`: https://matpcul-tech.github.io/Dystopia/store/PRIVACY.md
- Data safety, content rating, ads (no), app access (no login), and the news declaration (this is not a news app).
- Countries, then roll out the closed release.
- Play App Signing, using this upload key. Keep the keystore. Google keeps the app signing key.
