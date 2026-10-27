// Cloudflare worker. Not deployed until the steps in
// cloud/SEASON_PASS_WORKER.md are run. The game calls it only when
// COMMERCE.SEASON_VERIFY_URL in commercial.js is that live URL.
// Until then the page fails closed and does not grant from a cs_ id.
//
// Secret: wrangler secret STRIPE_SECRET_KEY. Never put that key in the
// repo or in the Pages bundle.
// KV binding: SEASON
//
// POST { session_id } retrieves the Checkout Session. It grants only
// when the session is paid, complete, and created by the live Season
// Pass Payment Link. The id is stored once, so a shared return URL
// cannot grant a second browser.
// POST { email } restores a pass already recorded for that receipt
// email. It does not grant a session that was never paid.

const PAYMENT_LINK = 'plink_1UV4C7Rc0DOFqzuBoEDJ5Aa7';
const SESSION_RE = /^cs_(live|test)_[A-Za-z0-9]{14,}$/;

function corsHeaders(request){
  const origin = request.headers.get('origin') || '';
  const ok = origin === 'https://matpcul-tech.github.io'
    || /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin);
  return {
    'access-control-allow-origin': ok ? origin : 'https://matpcul-tech.github.io',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'content-type': 'application/json',
  };
}

function send(request, body, status){
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(request) });
}

export default {
  async fetch(request, env){
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) });
    if (request.method !== 'POST') return send(request, { pass: false }, 405);
    if (!env || !env.STRIPE_SECRET_KEY || !env.SEASON) return send(request, { pass: false, error: 'unconfigured' }, 503);
    let body;
    try { body = await request.json(); } catch (e) { return send(request, { pass: false }, 400); }

    const email = String(body.email || '').trim().toLowerCase();
    if (email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) return send(request, { pass: false }, 400);
      const hit = await env.SEASON.get('email:' + email);
      return send(request, { pass: hit === '1' }, hit === '1' ? 200 : 404);
    }

    const id = String(body.session_id || '');
    if (!SESSION_RE.test(id) || id.length > 200) return send(request, { pass: false }, 400);
    if (await env.SEASON.get('used:' + id)) return send(request, { pass: false, reason: 'used' }, 409);

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions/' + encodeURIComponent(id), {
      headers: { authorization: 'Bearer ' + env.STRIPE_SECRET_KEY },
    });
    if (!res.ok) return send(request, { pass: false }, 402);
    const session = await res.json();
    const paid = session.payment_status === 'paid' && session.status === 'complete' && session.payment_link === PAYMENT_LINK;
    if (!paid) return send(request, { pass: false }, 402);
    await env.SEASON.put('used:' + id, String(Date.now()));
    const receipt = session.customer_details && session.customer_details.email;
    if (receipt) await env.SEASON.put('email:' + String(receipt).trim().toLowerCase(), '1');
    return send(request, { pass: true }, 200);
  },
};
