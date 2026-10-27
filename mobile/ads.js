// AdMob, UMP, and ATT are not connected.
// A live rewarded ad must not be simulated as a real view in the store build.
// The web pay sheet plays local book trailers from commercial.js.

export async function showRewarded(){
  return { ok: false, reason: 'AdMob is not connected. No ad played.' };
}
