// Red Sky Archive: full episodes stay in the gallery.
// A level only plays beat clips, each 8 to 20 seconds, then control returns.
// This file stores no story sentences. intro indexes and radio keys point at
// lines that already live on the chapter in game.js.

// url is a local file under media/shorts. PLAY FULL SHORT uses the whole file.
// A level never does. It only plays the cue on the beat that names this id.
// Episode 9, Fire and Steel, stays a hook. The Listening Dark is not Episode 7.
export const ARCHIVE = [
  { id:'rsa1', n:1, title:'EPISODE ONE: THE WAKING', shortTitle:'TWENTY FEET OF MACHINE', chapter:'ep1', url:'media/shorts/rsa_ep01_720p.mp4', status:'ready' },
  { id:'short02', n:2, title:'FORTY-THREE LEFT', chapter:'ch_conduits', url:'media/shorts/rsa_ep02_720p.mp4', status:'ready' },
  { id:'short03', n:3, title:'THEY ARE STEALING OUR MINDS', chapter:'ch_conduits', url:'media/shorts/rsa_ep03_720p.mp4', status:'ready' },
  { id:'short04', n:4, title:'THE AFTERNOONS', chapter:'ch_harvest', url:'media/shorts/rsa_ep04_720p.mp4', status:'ready' },
  { id:'short07', n:7, title:'THE BASE IS GONE', chapter:'ch_harvest', url:'media/shorts/rsa_ep07_720p.mp4', status:'ready' },
  { id:'rsa2', n:2, title:'CHAPTER TWO: INSIDE THE HIVE', chapter:'ch_taken', url:'', status:'ready' },
  { id:'rsa3', n:3, title:'CHAPTER TWO: THE LISTENING DARK', chapter:'ch_ghost', url:'', status:'ready' },
  { id:'rsa4', n:4, title:'CHAPTER TWO: THE CONVOY', chapter:'ch_together', url:'', status:'ready' },
  { id:'rsa5', n:5, title:'CHAPTER TWO: THE LONG ROAD', chapter:'ch_lone', url:'', status:'ready' },
  { id:'rsa6', n:6, title:'CHAPTER THREE: THE COUNTING HOUSE', chapter:'ch_counting', url:'', status:'ready' },
  { id:'rsa7', n:7, title:'CHAPTER FOUR: THE CONDUITS', shortTitle:'EIGHT HUNDRED METERS', chapter:'ch_conduits', url:'media/shorts/rsa_ep05_720p.mp4', status:'ready' },
  { id:'rsa8', n:8, title:'CHAPTER FIVE: THE HARVEST', shortTitle:'BATCH', chapter:'ch_harvest', url:'media/shorts/rsa_ep06_720p.mp4', status:'ready' },
  { id:'rsa9', n:9, title:'CHAPTER SIX: FIRE AND STEEL', chapter:'ch_steel', url:'', status:'hook' },
  // Episode One level clips. Book RSA files stay in the gallery.
  // A missing file still skips to control.
  // Origin is the New Game open. The older rail car wake stays a gallery rewatch.
  { id:'game_ep1_origin', n:'G1', title:'GAME SHORT: WHY THE TRAIN', chapter:'ep1', url:'media/shorts/game/game_ep1_origin.mp4', poster:'media/shorts/game/game_ep1_origin.jpg', status:'ready', game:true },
  { id:'game_ep1_train', n:'G1b', title:'GAME SHORT: WAKE IN THE TRAIN', chapter:'ep1', url:'media/shorts/game/game_ep1_train.mp4', poster:'media/shorts/game/game_ep1_train.jpg', status:'ready', game:true },
  { id:'game_ep1_street', n:'G2', title:'GAME SHORT: THE RUINED STREET', chapter:'ep1', url:'media/shorts/game/game_ep1_street.mp4', poster:'media/shorts/game/game_ep1_street.jpg', status:'ready', game:true },
  { id:'game_ep1_depot', n:'G3', title:'GAME SHORT: THE DEPOT LEDGER', chapter:'ep1', url:'media/shorts/game/game_ep1_depot.mp4', poster:'media/shorts/game/game_ep1_depot.jpg', status:'ready', game:true },
];

// at: 'open' plays once when the chapter starts, then gameplay.
// at: 'room' plays once when the player enters that room index.
// cue is the window inside the full episode file, used only if url is set.
// The player never runs the file from 0 to the end during a level.
export const BEATS = [
  // Episode One. Game shorts, not the book file. Each file is its own cue.
  // The open is why he is in the car: hunter, dive, still. Then the door choice.
  // The door is a story choice, not a clip. Missing mp4s fall back to control.
  { id:'ep1_wake', episode:'game_ep1_origin', chapter:'ep1', at:'open', intro:[0, 1], max:15, cue:[0, 15], labelFrom:'train' },
  { id:'ep1_street', episode:'game_ep1_street', chapter:'ep1', at:'room', room:2, max:10, cue:[0, 10], labelFrom:'segs:0' },
  { id:'ep1_depot', episode:'game_ep1_depot', chapter:'ep1', at:'room', room:5, max:10, cue:[0, 10], labelFrom:'final' },

  // Inside the Hive
  { id:'taken_pod', episode:'rsa2', chapter:'ch_taken', at:'open', intro:[1, 2], max:14, cue:[0, 14], labelFrom:'advance' },
  { id:'taken_gallery', episode:'rsa2', chapter:'ch_taken', at:'room', room:1, intro:[3], max:10, cue:[14, 24], labelFrom:'segs:0' },
  { id:'taken_nursery', episode:'rsa2', chapter:'ch_taken', at:'room', room:3, intro:[4], max:12, cue:[24, 36], labelFrom:'segs:2' },

  // The Listening Dark
  { id:'ghost_well', episode:'rsa3', chapter:'ch_ghost', at:'open', intro:[1, 2], max:14, cue:[0, 14], labelFrom:'advance' },
  { id:'ghost_cable', episode:'rsa3', chapter:'ch_ghost', at:'room', room:3, intro:[3, 4], max:14, cue:[14, 28], labelFrom:'segs:2' },

  // The Convoy
  { id:'convoy_ridge', episode:'rsa4', chapter:'ch_together', at:'open', intro:[1, 2], max:14, cue:[0, 14], labelFrom:'advance' },
  { id:'convoy_check', episode:'rsa4', chapter:'ch_together', at:'room', room:2, intro:[3], max:10, cue:[14, 24], labelFrom:'segs:1' },
  { id:'convoy_yard', episode:'rsa4', chapter:'ch_together', at:'room', room:3, intro:[4], max:12, cue:[24, 36], labelFrom:'segs:2' },

  // The Long Road
  { id:'road_open', episode:'rsa5', chapter:'ch_lone', at:'open', intro:[1, 2], max:14, cue:[0, 14], labelFrom:'advance' },
  { id:'road_toll', episode:'rsa5', chapter:'ch_lone', at:'room', room:2, intro:[3], max:12, cue:[14, 26], labelFrom:'segs:1' },
  { id:'road_climb', episode:'rsa5', chapter:'ch_lone', at:'room', room:3, intro:[4], max:12, cue:[26, 38], labelFrom:'segs:2' },

  // Counting House entry, then the records hall. Not one long open.
  { id:'count_entry', episode:'rsa6', chapter:'ch_counting', at:'open', intro:[1, 2], max:14, cue:[0, 14], labelFrom:'advance' },
  { id:'count_hall', episode:'rsa6', chapter:'ch_counting', at:'room', room:1, intro:[3, 4], max:14, cue:[14, 28], labelFrom:'segs:0' },

  // Conduits. Forty-Three Left stays the bunker opener.
  // Eight Hundred Meters is the later rooms. Windows come from that file's cards.
  // The sweep room has no card in the file, so it stays text.
  { id:'conduits_brief', episode:'short02', chapter:'ch_conduits', at:'open', intro:[1, 2, 3], max:18, cue:[0, 18], labelFrom:'advance' },
  { id:'conduits_sweep', episode:'rsa7', chapter:'ch_conduits', at:'room', room:1, textOnly:true, radio:[{ key:'seg1_mid', idx:[0] }], max:10, cue:[0, 10], labelFrom:'segs:0' },
  { id:'conduits_dash', episode:'rsa7', chapter:'ch_conduits', at:'room', room:2, radio:[{ key:'seg2_enter', idx:[0] }], max:12, cue:[20, 32], labelFrom:'segs:1' },
  { id:'conduits_data', episode:'rsa7', chapter:'ch_conduits', at:'room', room:3, radio:[{ key:'seg3_enter', idx:[0] }], max:8, cue:[4, 12], labelFrom:'segs:2' },

  // Harvest. Batch is the core. The Afternoons stays the tower, blue to amber.
  // The Angela choice and the core voice stay door stories, not extra clips.
  { id:'harvest_hatch', episode:'rsa8', chapter:'ch_harvest', at:'open', intro:[1], max:8, cue:[0, 8], labelFrom:'advance' },
  { id:'harvest_gallery', episode:'short04', chapter:'ch_harvest', at:'room', room:2, intro:[2], max:16, cue:[16, 32], labelFrom:'segs:1' },
  { id:'harvest_floor', episode:'rsa8', chapter:'ch_harvest', at:'room', room:3, intro:[4], max:8, cue:[8, 16], labelFrom:'segs:2' },

  // Fire and Steel hook. Ridge opener, pass, then the yard before the hunter.
  { id:'steel_ridge', episode:'rsa9', chapter:'ch_steel', at:'open', intro:[1, 4], max:16, cue:[0, 16], labelFrom:'advance' },
  { id:'steel_pass', episode:'rsa9', chapter:'ch_steel', at:'room', room:1, intro:[2], max:12, cue:[16, 28], labelFrom:'segs:0' },
  { id:'steel_yard', episode:'rsa9', chapter:'ch_steel', at:'room', room:4, intro:[3], max:12, cue:[28, 40], labelFrom:'final' },
];

export function episodeOf(id){
  return ARCHIVE.find(e => e.id === id) || null;
}
export function openBeat(chapterId){
  return BEATS.find(b => b.chapter === chapterId && b.at === 'open') || null;
}
export function roomBeat(chapterId, room){
  return BEATS.find(b => b.chapter === chapterId && b.at === 'room' && b.room === room) || null;
}
export function beatsFor(chapterId){
  return BEATS.filter(b => b.chapter === chapterId);
}
export function clipLabel(clip, chapters){
  const ch = chapters && chapters[clip.chapter];
  if (!ch || !ch.obj) return clip.id;
  const spec = clip.labelFrom || '';
  if (spec.indexOf('segs:') === 0){
    const i = Number(spec.slice(5));
    return (ch.obj.segs && ch.obj.segs[i]) || clip.id;
  }
  return ch.obj[spec] || clip.id;
}
