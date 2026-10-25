// Cloud save is not connected. The device save is latm_save_v1.
// A backup code can move one slot by hand.

export async function pushSave(){
  return { ok: false, reason: 'Cloud save is not connected.' };
}

export async function pullSave(){
  return { ok: false, reason: 'Cloud save is not connected.' };
}
