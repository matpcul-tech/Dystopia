// Cloudflare worker. Season Pass checks are deployed at
// waking-season-pass.matpcul.workers.dev. Owner preview is in this
// file and stays off until PREVIEW_CODE is set and this file is
// deployed again. See cloud/SEASON_PASS_WORKER.md.
// The game calls it only when COMMERCE.SEASON_VERIFY_URL is that
// live URL. A missing secret fails closed and does not grant.
//
// Secret: wrangler secret STRIPE_SECRET_KEY. Never put that key in the
// repo or in the Pages bundle.
// KV binding: SEASON
//
// POST { session_id } retrieves the Checkout Session. It grants only
// when the session is paid, complete, and created by a Season Pass
// Payment Link. The current link and the earlier link both count, so
// a purchase on either one can still verify. The id is stored once,
// so a shared return URL cannot grant a second browser.
// POST { email } restores a pass already recorded for that receipt
// email. It does not grant a session that was never paid.
//
// POST { preview_code } checks env.PREVIEW_CODE. The code is not in
// this file. A match returns { preview: true, ticket } for 12 hours
// and stores the ticket under a preview: key. It does not write
// used: or email: and it does not return { pass: true }.
// POST { preview_ticket } renews that same tab until the ticket
// expires. A missing PREVIEW_CODE fails closed. ?preview=1 is too
// short and is rejected. Keep the shape in step with PREVIEW_SHAPE
// in season-pass.js.

const PAYMENT_LINKS = [
  'plink_1UV4C7Rc0DOFqzuBoEDJ5Aa7',
  'plink_1UVspDRc0DOFqzuBbtCuM3MO',
];
const SESSION_RE = /^cs_(live|test)_[A-Za-z0-9]{14,}$/;
const PREVIEW_RE = /^[A-Za-z0-9_-]{20,128}$/;
const PREVIEW_TTL_MS = 12 * 60 * 60 * 1000;

function previewRequest(body){
  if (!body || typeof body !== 'object' || Array.isArray(body)) return false;
  const hasPreview = Object.prototype.hasOwnProperty.call(body, 'preview_code')
    || Object.prototype.hasOwnProperty.call(body, 'preview_ticket');
  if (!hasPreview) return false;
  if (body.session_id || body.email) return false;
  return true;
}

async function sha256(text){
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return new Uint8Array(buf);
}

async function sameSecret(given, secret){
  const a = await sha256('preview-code\n' + given);
  const b = await sha256('preview-code\n' + secret);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function secretMark(secret){
  const raw = await sha256('preview-mark\n' + secret);
  let hex = '';
  for (let i = 0; i < 8; i++) hex += raw[i].toString(16).padStart(2, '0');
  return hex;
}

function newTicket(){
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function handlePreview(request, env, body){
  const secret = env && typeof env.PREVIEW_CODE === 'string' ? env.PREVIEW_CODE : '';
  if (!secret || !PREVIEW_RE.test(secret) || !env.SEASON) {
    return send(request, { preview: false, reason: 'unconfigured' }, 503);
  }
  const mark = await secretMark(secret);
  const ticket = String(body.preview_ticket || '');
  if (ticket) {
    if (!PREVIEW_RE.test(ticket)) return send(request, { preview: false }, 400);
    const key = 'preview:' + mark + ':' + ticket;
    const raw = await env.SEASON.get(key);
    const exp = Number(raw);
    if (!raw || !Number.isFinite(exp) || exp <= Date.now()) {
      if (raw && typeof env.SEASON.delete === 'function') await env.SEASON.delete(key);
      return send(request, { preview: false }, 401);
    }
    return send(request, { preview: true, ticket }, 200);
  }
  const code = String(body.preview_code || '');
  if (!PREVIEW_RE.test(code)) return send(request, { preview: false }, 400);
  const match = await sameSecret(code, secret);
  if (!match) return send(request, { preview: false }, 401);
  const minted = newTicket();
  const exp = Date.now() + PREVIEW_TTL_MS;
  await env.SEASON.put('preview:' + mark + ':' + minted, String(exp));
  return send(request, { preview: true, ticket: minted }, 200);
}

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
    if (previewRequest(body)) return handlePreview(request, env, body);

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
    const paid = session.payment_status === 'paid' && session.status === 'complete' && PAYMENT_LINKS.indexOf(session.payment_link) !== -1;
    if (!paid) return send(request, { pass: false }, 402);
    await env.SEASON.put('used:' + id, String(Date.now()));
    const receipt = session.customer_details && session.customer_details.email;
    if (receipt) await env.SEASON.put('email:' + String(receipt).trim().toLowerCase(), '1');
    return send(request, { pass: true }, 200);
  },
};
