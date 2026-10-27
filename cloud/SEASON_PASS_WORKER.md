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
