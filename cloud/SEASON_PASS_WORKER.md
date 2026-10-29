# Season Pass worker

`cloud/season-pass-worker.js` checks a Stripe Checkout Session and answers `{ "pass": true }` only when that session is paid, complete, and from the Season Pass Payment Link. The static site never holds a Stripe secret.

`COMMERCE.SEASON_VERIFY_URL` in `commercial.js` is `https://waking-season-pass.matpcul.workers.dev`. An empty value fails closed: a `cs_` session id does not grant Season Pass.

## Deploy

1. Install Wrangler and log in: `npx wrangler login`
2. Create the KV namespace and copy its id:
   `npx wrangler kv namespace create SEASON`
3. From `cloud/`, add a `wrangler.toml`. Do not put the Stripe secret in this file or in the repo.

```toml
name = "waking-season-pass"
main = "season-pass-worker.js"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "SEASON"
id = "PASTE_KV_NAMESPACE_ID"
```

The binding name must be `SEASON`. The worker reads `env.SEASON` and `env.STRIPE_SECRET_KEY`.

4. Set the secret on Cloudflare. This stays out of the Pages bundle:
   `npx wrangler secret put STRIPE_SECRET_KEY`
5. Deploy from `cloud/`:
   `npx wrangler deploy`
6. `COMMERCE.SEASON_VERIFY_URL` in `commercial.js` is the live worker, with no trailing slash:
   `https://waking-season-pass.matpcul.workers.dev`
7. Publish the static site again so GitHub Pages picks up that constant.

CORS in the worker already allows `https://matpcul-tech.github.io` and local dev. The page posts `{ "session_id" }` for a return, and `{ "email" }` to restore from the receipt email. A Stripe receipt does not include a `cs_` id.

## Owner preview

`?preview=1` does not unlock chapters. A long code is checked here against the secret `PREVIEW_CODE`. That secret is not in the repo and not in the Pages bundle. Until the secret is set and this worker is deployed with the preview check, the page fails closed.

The worker answers `{ "preview": true, "ticket": "..." }` only when the code matches. The ticket is stored in KV under a `preview:` key for 12 hours. It is not a Season Pass. The worker does not write `used:` or `email:` for a preview, and the JSON does not say `{ "pass": true }`. A later POST of `{ "preview_ticket" }` keeps that same tab until the ticket expires. Rotating `PREVIEW_CODE` makes old tickets fail.

The code must be 20 to 128 characters, using only letters, numbers, `_`, and `-`. `openssl rand -hex 32` fits.

### One-time setup

Do this after `main` is serving the new client. The new client already ignores `?preview=1`. The owner unlock stays off until these steps succeed.

1. Make a code and keep it private. Do not commit it, paste it into a public issue, or leave it in a shell history you share.

```
openssl rand -hex 32
```

2. From `cloud/`, use the same `wrangler.toml` that deployed `waking-season-pass`. That file stays out of the repo. The binding name is still `SEASON`.

```
npx wrangler secret put PREVIEW_CODE
```

Paste the code when Wrangler asks. This stores it on Cloudflare. It does not write the code into a file.

3. Deploy the worker so the preview check is live:

```
npx wrangler deploy
```

4. `COMMERCE.SEASON_VERIFY_URL` stays `https://waking-season-pass.matpcul.workers.dev` with no trailing slash. Publish `main` if Pages is not already serving this client.

### How to unlock a tab

1. Before a stream, in the browser you will capture, open this address with your code on the end and no space:

`https://matpcul-tech.github.io/Dystopia/?preview=` plus the code.

2. Wait until the address bar no longer shows `preview`, and the title hint says `REVIEW UNLOCK IS ON.`

3. Then go live. Anyone who opens the clean address does not get the unlock.

4. The unlock lasts in this tab for 12 hours, including a refresh, while the worker answers. Closing the tab ends it. A new tab does not have it. It is not written to `latm_season_pass_v1`.

5. If the code leaks, run `npx wrangler secret put PREVIEW_CODE` with a new code and deploy again. Old tickets stop working.
