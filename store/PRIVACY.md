# Privacy policy

DYSTOPIA: The Waking, by Matthew Culwell.

This policy covers the game on the website and the Android app. It describes what this build actually does.

Last updated: 29 October 2026.

## What stays on your device

The game stores a save on the device you are playing on. The save includes the chapter, the position, settings, endings, the choices this device already picked, and a backup code until you copy it somewhere else. The save key is `latm_save_v1`.

The Android app does not upload that save. Cloud save is not connected. A public choice counter is not connected. A chapter start, a chapter complete, a drop off, or a crash is written into the local save only, because the analytics address in the app is empty. Nothing in that list is sent to the developer.

If you turn on Android backup, the system can include app data in your own Google account backup. The developer does not receive that backup.

## Mailing list

The title screen and the ending card have an optional form. The game does not require it. If you send the form, it posts your email and an optional first name to Kit at `https://app.kit.com/forms/10080648/subscriptions`. Kit stores that entry so the developer can send the free first chapter of the book and an occasional note. The post uses HTTPS. The developer can read the entry in Kit. It is not sold.

You can unsubscribe from a Kit email. To ask for a copy or deletion, use the contact email on the Google Play listing, or the unsubscribe link in a Kit email. Clearing the app storage deletes the local save. It does not delete a Kit entry by itself.

## Website Season Pass

On the website only, Season Pass checkout opens Stripe in the same tab. The site does not see the card number and it does not hold a Stripe secret. Stripe processes the payment. After you return, the page sends the checkout id to `https://waking-season-pass.matpcul.workers.dev` and stores the pass in that browser only if the check confirms the payment. Restore sends the email from the Stripe receipt, or a pasted return link, to that same checker. A receipt does not include a checkout id.

## Android closed test

The Android build for the Play closed test includes Season Pass and every chapter. That build does not contain a Stripe link, a buy link, or a buy on web prompt. It does not send a receipt email or a checkout id to the purchase checker. There is no in-app purchase in this build. The Remove Ads control stays hidden. AdMob is not in the app. The app does not use an advertising id.

Book trailers, if you open them, play from files in the app. They do not contact an ad network. The ending card can open the novel on Amazon, and a trailer can open Amazon or the author hub, only if you tap that link. Those links are not a purchase of the game.

## Children

This game is not directed at children.

## Contact

The developer is Matthew Culwell. For a privacy request, use the contact email on the Google Play listing, or the unsubscribe link in a Kit email.
