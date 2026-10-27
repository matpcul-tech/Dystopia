// Season Pass rules that do not need the DOM.
// GitHub Pages cannot ask Stripe if a Checkout Session was paid.
// The secret key must never ship in this static site.
// A return grants only with season_pass=1 and a plausible one-time
// session id. Used ids are remembered in this browser so the same
// URL does not grant twice here. Another browser does not see that
// list until a server records it. cloud/season-pass-worker.js is
// that check. It is not deployed, and this file does not call it.

export const PASS_KEY = 'latm_season_pass_v1';
export const USED_KEY = 'latm_season_sessions_v1';

const SESSION_RE = /^cs_(live|test)_[A-Za-z0-9]{14,}$/;

export function plausibleSessionId(id){
  return typeof id === 'string' && id.length <= 200 && SESSION_RE.test(id);
}

// Accept a bare id or a pasted return URL.
export function sessionFromText(raw){
  const text = String(raw || '').trim();
  if (!text || text.length > 2000) return '';
  const labeled = text.match(/session_id=(cs_(?:live|test)_[A-Za-z0-9]+)/);
  if (labeled) return labeled[1];
  const bare = text.match(/cs_(?:live|test)_[A-Za-z0-9]+/);
  return bare ? bare[0] : '';
}

// source is 'return' (the Stripe success URL) or 'restore' (pasted id).
// usedList is the ids this browser has already granted.
// hasPass is true when this browser already holds the entitlement.
export function judgeSession(raw, usedList, hasPass){
  const id = sessionFromText(raw);
  if (!plausibleSessionId(id)) return { action: 'reject', id: id || '' };
  const used = Array.isArray(usedList) && usedList.indexOf(id) >= 0;
  if (used) return { action: hasPass ? 'already' : 'replay', id };
  return { action: 'grant', id };
}

export function judgeReturn(seasonFlag, sessionId, usedList, hasPass){
  if (seasonFlag !== '1') return { action: 'ignore', id: '' };
  return judgeSession(sessionId, usedList, hasPass);
}
