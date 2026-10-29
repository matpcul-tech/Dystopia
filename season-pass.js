// Season Pass rules that do not need the DOM.
// GitHub Pages cannot ask Stripe if a Checkout Session was paid.
// The secret key must never ship in this static site.
// A cs_ id is only a candidate. It never grants by itself.
// commercial.js posts it to COMMERCE.SEASON_VERIFY_URL and grants
// only when the JSON is { pass: true }. An empty URL fails closed.
// Used ids are remembered in this browser after a real grant so the
// same URL does not grant twice here.

export const PASS_KEY = 'latm_season_pass_v1';
export const USED_KEY = 'latm_season_sessions_v1';

const SESSION_RE = /^cs_(live|test)_[A-Za-z0-9]{14,}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function plausibleSessionId(id){
  return typeof id === 'string' && id.length <= 200 && SESSION_RE.test(id);
}

export function emailFromText(raw){
  const text = String(raw || '').trim().toLowerCase();
  if (!text || text.length > 200 || !EMAIL_RE.test(text)) return '';
  return text;
}

// Accept a bare id or a pasted return URL. This does not grant.
export function sessionFromText(raw){
  const text = String(raw || '').trim();
  if (!text || text.length > 2000) return '';
  const labeled = text.match(/session_id=(cs_(?:live|test)_[A-Za-z0-9]+)/);
  if (labeled) return labeled[1];
  const bare = text.match(/cs_(?:live|test)_[A-Za-z0-9]+/);
  return bare ? bare[0] : '';
}

// 'verify' means the shape is worth a server check. It is not a grant.
// usedList is the ids this browser has already granted.
// hasPass is true when this browser already holds the entitlement.
export function judgeSession(raw, usedList, hasPass){
  const id = sessionFromText(raw);
  if (!plausibleSessionId(id)) return { action: 'reject', id: id || '', email: '' };
  const used = Array.isArray(usedList) && usedList.indexOf(id) >= 0;
  if (used) return { action: hasPass ? 'already' : 'replay', id, email: '' };
  return { action: 'verify', id, email: '' };
}

export function judgeReturn(seasonFlag, sessionId, usedList, hasPass){
  if (seasonFlag !== '1') return { action: 'ignore', id: '', email: '' };
  return judgeSession(sessionId, usedList, hasPass);
}

// Email is the restore path. A pasted return URL is still a session check.
// Neither action grants until the worker says pass true.
export function judgeRestore(raw, usedList, hasPass){
  const id = sessionFromText(raw);
  if (id) return judgeSession(raw, usedList, hasPass);
  const email = emailFromText(raw);
  if (email) return { action: 'verify', id: '', email };
  return { action: 'reject', id: '', email: '' };
}

// Owner preview is not a Season Pass. The shape is a long unguessable
// code or the tab ticket the worker returns. ?preview=1 does not match.
const PREVIEW_SHAPE = /^[A-Za-z0-9_-]{20,128}$/;

export function previewCodeShape(code){
  return typeof code === 'string' && PREVIEW_SHAPE.test(code);
}

export function previewTicketShape(ticket){
  return typeof ticket === 'string' && PREVIEW_SHAPE.test(ticket);
}

// Posts { preview_code } or { preview_ticket }. preview is true only
// for HTTP ok JSON { preview: true, ticket }. { pass: true } is not a
// preview grant. Empty URL, network failure, and 4xx/5xx fail closed.
export async function askPreviewVerify(verifyUrl, body, fetchImpl){
  const url = typeof verifyUrl === 'string' ? verifyUrl.trim() : '';
  if (!url) return { preview: false, ticket: '', status: 0, reason: 'unconfigured' };
  const fetchFn = fetchImpl || globalThis.fetch;
  if (typeof fetchFn !== 'function') return { preview: false, ticket: '', status: 0, reason: 'network' };
  let res;
  try {
    res = await fetchFn(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body || {}),
    });
  } catch (e) {
    return { preview: false, ticket: '', status: 0, reason: 'network' };
  }
  if (!res) return { preview: false, ticket: '', status: 0, reason: 'network' };
  let data = null;
  try { data = await res.json(); } catch (e) { data = null; }
  const status = Number(res.status) || 0;
  const ticket = data && typeof data.ticket === 'string' ? data.ticket : '';
  if (res.ok && data && data.preview === true && previewTicketShape(ticket)) {
    return { preview: true, ticket, status, reason: '' };
  }
  if (status === 503) return { preview: false, ticket: '', status, reason: 'unconfigured' };
  if (!res.ok) return { preview: false, ticket: '', status, reason: 'http' };
  return { preview: false, ticket: '', status, reason: 'denied' };
}

// Posts { session_id } or { email }. pass is true only for HTTP ok
// JSON { pass: true }. Empty URL, network failure, and 4xx/5xx do not grant.
export async function askSeasonVerify(verifyUrl, body, fetchImpl){
  const url = typeof verifyUrl === 'string' ? verifyUrl.trim() : '';
  if (!url) return { pass: false, status: 0, reason: 'unconfigured' };
  const fetchFn = fetchImpl || globalThis.fetch;
  if (typeof fetchFn !== 'function') return { pass: false, status: 0, reason: 'network' };
  let res;
  try {
    res = await fetchFn(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body || {}),
    });
  } catch (e) {
    return { pass: false, status: 0, reason: 'network' };
  }
  if (!res) return { pass: false, status: 0, reason: 'network' };
  let data = null;
  try { data = await res.json(); } catch (e) { data = null; }
  const status = Number(res.status) || 0;
  if (res.ok && data && data.pass === true) return { pass: true, status, reason: '' };
  if (status === 409 || (data && data.reason === 'used')) return { pass: false, status, reason: 'used' };
  if (!res.ok) return { pass: false, status, reason: 'http' };
  return { pass: false, status, reason: 'denied' };
}
