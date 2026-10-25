// AdMob, UMP, and ATT are not connected.
// A live rewarded ad must not be simulated as a real view in the store build.
// The web paywall uses a labeled stand in so the three view rule can be tested.

export async function showRewarded(){
  return { ok: false, reason: 'AdMob is not connected. No ad played.' };
}
