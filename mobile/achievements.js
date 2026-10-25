// Game Center and Play Games are not connected.

export const ACHIEVEMENTS = [
  { id: 'ep1_clear', name: 'The Waking' },
  { id: 'endings_all', name: 'Every ending' },
  { id: 'hunter_down', name: 'The hunter' },
];

export async function unlock(){
  return { ok: false, reason: 'Achievements are not connected.' };
}
