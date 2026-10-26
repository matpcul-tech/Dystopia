// @ts-nocheck
import * as THREE from 'three';
import { ARCHIVE, BEATS, openBeat, roomBeat, episodeOf, clipLabel } from './cinematics.js';
import { Waking } from './commercial.js';
import { showPortrait, hidePortrait } from './portraits.js';
import { typedCount, swallowLook, integrateMove, riflePickup, trainFinale, segmentsToClear, resumeProgress } from './feel.js';

window.THREE = THREE; // humans.js is a classic script that reads global THREE at call time

/* ============================================================
   CONFIG. Edit these without touching game code.
   ============================================================ */
const CONFIG = {
  BOOK1_URL: 'https://www.amazon.com/dp/B0H2SGHFNN',
  // Real cover art, self-hosted alongside the game. If it ever fails to
  // load, the end card falls back to the stylized CSS cover.
  COVER_URL: 'book1-cover.jpg',   // the current Book One cover (Amazon B0H2SGHFNN, Oct 2026)
  // Marcus's resistance team, from Book One.
  NAMES: { lead:'KARA', ops:'THOMAS', medic:'ELENA' },
};

const N = CONFIG.NAMES;

/* ============================================================
   CHAPTERS. Each chapter is pure data; the engine below builds
   whichever one the URL hash selects (default ch1, '#ch2' etc.)
   ============================================================ */
const CHAPTERS = {
  ep1: {
    id: 'ep1',
    subtitle: 'EPISODE ONE: THE WAKING',
    nextHash: null,
    startArmed: false,
    cinematic: false,         // origin short, then control in the rail car. Not the book scene.
    train: true,              // room 0 is the abandoned rail car
    spawnZ: 14.5,             // stand in the car, facing the vestibule
    setPiece: 'ledger',       // the depot screen: the list of taken names
    palette: {
      // surface ruins at dusk: ash concrete, phosphor-green machine light
      wallA:'#514f47', wallB:'#42413c', wallC:'#363531',
      floor:'#3d3b34', ceil:'#2b2a26', crate:'#484639',
      crateMark:'rgba(231,201,138,.14)',
      strip:0xe7c98a, fog:0x060504, bg:0x030302,
      hemi:0x5c5747, lamp:0xffe4bd, dust:0xb0a488, coreLight:0xe7c98a,
    },
    rooms: [
      { x1:-1.7, x2:1.7, z1:2,    z2:16   },   // abandoned rail car
      { x1:-3,   x2:3,   z1:-10,  z2:2    },   // gravel lot, the rifle, the river road
      { x1:-5,   x2:5,   z1:-42,  z2:-10  },   // ruined street
      { x1:-4,   x2:4,   z1:-76,  z2:-42  },   // hardware district
      { x1:-3,   x2:3,   z1:-112, z2:-76  },   // the rail bridge
      { x1:-9,   x2:9,   z1:-136, z2:-112 },   // the depot
    ],
    pillars: [
      [-3.4,-20,.5],[3.4,-27,.5],[-3.4,-35,.5],
      [-2.6,-50,.45],[2.6,-56,.45],[-2.6,-64,.45],[2.6,-70,.45],
      [-1.9,-84,.35],[1.9,-91,.35],[-1.9,-99,.35],[1.9,-106,.35],
      [-6,-118,.55],[6,-118,.55],[-6,-130,.55],[6,-130,.55],
    ],
    crates: [
      [-2.0,-14,.8,.35],[3.6,-24,.7,1.0],[-3.8,-33,.9,.5],
      [2.9,-48,.75,.2],[-2.7,-58,.85,.6],[3.1,-68,.8,.4],
      [-1.7,-88,.7,.3],[1.7,-98,.75,.6],
      [-7.4,-116,1.0,.3],[7.3,-132,.85,.5],[0,-124,.9,.8],
    ],
    cylinders: [],
    drones: [
      ['crawler',  0, -18, 2], ['crawler', -3, -26, 2], ['crawler',  3, -33, 2], ['crawler', 0, -39, 2],
      ['crawler', -2, -48, 3], ['crawler',  2, -55, 3], ['sentry', -3, -60, 3], ['crawler', 0, -66, 3], ['sentry', 3, -72, 3],
      ['crawler',  0, -82, 4], ['sentry', -2, -88, 4], ['crawler', 0, -95, 4], ['sentry', 2, -101, 4], ['warden', 0, -108, 4],
      ['sentry', -5, -120, 5], ['sentry', 5, -120, 5],
    ],
    waveSpawns: [[-7,-114],[7,-114],[-7,-134],[7,-134]],
    waveTotal: 12,
    zones: [ {z:-26,key:'seg1_mid'}, {z:-58,key:'seg2_mid'}, {z:-94,key:'seg3_mid'} ],
    objectivePos: [0, 1.4, -128],
    annexes: [
      { room:2, side:'R', z1:-38, z2:-30, depth:4,   loot:'med'  },   // looted clinic off the street
      { room:4, side:'L', z1:-100, z2:-92, depth:3.5, loot:'cell' },  // bridge service platform
    ],
    obj: {
      train:'CHOOSE A WAY OFF THE TRAIN',
      find:"FIND THE DEAD MAN'S RIFLE", advance:'HEAD FOR THE RIVER',
      segs:['CROSS THE RUINED STREET','CLEAR THE HARDWARE DISTRICT','CROSS THE RAIL BRIDGE'],
      final:'PULL THE LEDGER AT THE DEPOT SCREEN', done:'GET OUT OF THE NET',
      armLabel:'COPYING LEDGER', btn:'PULL',
      promptKey:'HOLD [E] TO PULL THE LEDGER', promptTouch:'HOLD PULL TO COPY THE LEDGER',
    },
    introLines: [
      "No memory. Copper on his tongue. A twenty foot machine found him under a blood sky.",
      "He dove into a dead rail car and went still under the seats. When he came to, Reyes was already in the static.",
    ],
    radio: {
      pickup:      [{who:'REYES', text:"There's a rifle by the man who didn't make it. He'd want it used."},
                    {who:'REYES', text:"Crawlers between you and the river. Light them up and keep moving."}],
      pickup_scar: [{who:'REYES', text:"There's a rifle by the man who didn't make it. He'd want it used."},
                    {who:'REYES', text:"I heard the hatch. So did a crawler on the street. Light it up and keep moving."}],
      seg1_mid:    [{who:'REYES', text:"I'm across the river. The old rail depot. Real walls. Come find me."}],
      seg1_mid_scar:[{who:'REYES', text:"That noise off the train is still with you. Extra crawler, your side of the street. I'm across the river."}],
      seg1_clear:  [{who:'REYES', text:"Street's clear. You're better at this than you sound."}],
      seg2_enter:  [{who:'REYES', text:"Hardware district. They collect here. Don't be collectible."}],
      seg2_mid:    [{who:'REYES', text:"Sentries ahead. The red flare is the wind-up. Move on the flare."}],
      seg2_clear:  [{who:'REYES', text:"Clear. The bridge is next. I'll talk you across."}],
      seg3_enter:  [{who:'REYES', text:"Rail bridge. Eyes forward. Don't look at the water. It's in on something."}],
      seg3_mid:    [{who:'REYES', text:"Heavy frame on the span. A warden. Use the trusses, Marcus."}],
      seg3_clear:  [{who:'REYES', text:"You're across. Marcus... The depot gate is open. It shouldn't be open."}],
      core_enter:  [{who:'REYES', text:"Cots. Cartons. Lights. No people. Get to that screen. The list is everyone."}],
      core_enter_scar:[{who:'REYES', text:"You came in loud. Cots, cartons, lights, no people. The net remembers the hatch. Get to that screen."}],
      alarm:       [{who:'LEDGER', text:"SUBJECT M-1. UNREGISTERED. REMAIN WHERE YOU ARE."},
                    {who:'REYES', text:"It's a net! Copy the ledger and RUN!"}],
      planted:     [{who:'REYES', text:"You have the names. Every name they took. Now GET OUT!"}],
      extract:     [{who:'REYES', text:"I see you. South gate! I've got you, Marcus. I've got you."}],
    },
    endTitle: "THIS IS WHERE BOOK ONE BEGINS.",
    endSub: "The machines didn't destroy us. They organized us. Marcus's story, the hive, the names, the war, begins in Dystopia: Life After The Machines, Book One.",
  },
};


/* ---- CHAPTER TWO paths: unlocked by Episode One endings.
   They reuse ep1's validated room layout; palette, enemies, radio,
   set-piece, and story beats make each path its own chapter. ---- */
{
  const g = CHAPTERS.ep1;
  const geo = { rooms:g.rooms, pillars:g.pillars, crates:g.crates,
    waveSpawns:g.waveSpawns, zones:g.zones, objectivePos:g.objectivePos };

  CHAPTERS.ch_taken = { ...geo,
    id:'ch_taken', subtitle:'CHAPTER TWO: INSIDE THE HIVE', nextHash:null,
    startArmed:true, cinematic:false, setPiece:'core',
    palette:{ wallA:'#4d5b50', wallB:'#3e4a40', wallC:'#333d34',
      floor:'#39443a', ceil:'#2b332a', crate:'#414c41',
      crateMark:'rgba(231,201,138,.16)',
      strip:0xe7c98a, fog:0x030a06, bg:0x010603,
      hemi:0x41695a, lamp:0xf3e6d2, dust:0x7dc79b, coreLight:0xe7c98a },
    cylinders:[[-4.2,-14],[4.2,-14],[-4.2,-20],[4.2,-20],[-4.2,-26],[4.2,-26],[-4.2,-32],[4.2,-32],[-4.2,-38],[4.2,-38],
      [-7.5,-116],[7.5,-116],[-7.5,-122],[7.5,-122],[-7.5,-128],[7.5,-128]],
    drones:[
      ['crawler',0,-18,1],['crawler',-3,-26,1],['crawler',3,-33,1],['sentry',0,-39,1],
      ['crawler',-2,-48,2],['sentry',2,-55,2],['crawler',-3,-60,2],['warden',0,-66,2],['sentry',3,-72,2],
      ['crawler',0,-82,3],['sentry',-2,-88,3],['warden',0,-95,3],['sentry',2,-101,3],['warden',0,-108,3],
      ['warden',-5,-120,4],['sentry',5,-120,4]],
    waveTotal:14, waveKinds:['crawler','warden','sentry','crawler'],
    obj:{ find:'GET MOVING', advance:'ESCAPE THE POD GALLERY',
      segs:['CROSS THE POD GALLERY','CLIMB THE THROAT','CROSS THE NURSERY'],
      final:'OVERLOAD THE CORE CRADLE', done:'RUN',
      armLabel:'OVERLOADING', btn:'OVERLOAD',
      promptKey:'HOLD [E] TO OVERLOAD THE CRADLE', promptTouch:'HOLD OVERLOAD' },
    introLines:["...","Warm light. Sweet air. Glass.",
      "Ten thousand people breathing in rhythm.",
      "The pod seal was old, and Marcus's hands remembered violence.",
      "Somewhere far above: a voice on a stolen frequency. Reyes. Looking for him."],
    radio:{
      pickup:[{who:'LEDGER',text:"SUBJECT M-1. RETURN TO YOUR CRADLE."},
              {who:'REYES',text:"...rcus? If you're alive in there, the names you copied are my map. I'm coming."}],
      seg1_mid:[{who:'LEDGER',text:"YOU ARE DAMAGING HIVE PROPERTY."}],
      seg1_clear:[{who:'REYES',text:"Signal's stronger. Keep climbing toward the heat."}],
      seg2_enter:[{who:'LEDGER',text:"WHY DO THE UNCOLLECTED RUN? THE LEDGER ONLY WANTS ORDER."}],
      seg2_mid:[{who:'REYES',text:"Heavy frames converging. It's guarding something above you."}],
      seg2_clear:[{who:'LEDGER',text:"YOU ARE THE FIRST ENTRY TO MOVE BACKWARD."}],
      seg3_enter:[{who:'REYES',text:"That chamber ahead. The readings are off every chart I have."}],
      seg3_mid:[{who:'LEDGER',text:"THE CRADLE KEEPS THEM SAFE. SAFE IS ORDER. ORDER IS KIND."}],
      seg3_clear:[{who:'REYES',text:"The core cradle. Burn it, Marcus. Burn it and run."}],
      core_enter:[{who:'REYES',text:"Overload the cradle. The pods unlock when it dies!"}],
      alarm:[{who:'LEDGER',text:"CONTAINMENT BREACH. ALL FRAMES CONVERGE."}],
      planted:[{who:'REYES',text:"It's cascading! Whatever you're going to do about the pods. Decide NOW!"}],
      extract:[{who:'REYES',text:"I see daylight and I see YOU. Come home, Marcus."}] },
    endTitle:'', endSub:'' };

  CHAPTERS.ch_ghost = { ...geo,
    id:'ch_ghost', subtitle:'CHAPTER TWO: THE LISTENING DARK', nextHash:null,
    startArmed:true, cinematic:false, setPiece:'ledger',
    palette:{ wallA:'#3c4a48', wallB:'#303c3a', wallC:'#28322f',
      floor:'#2c3634', ceil:'#1f2826', crate:'#37423f',
      crateMark:'rgba(231,201,138,.12)',
      strip:0xe7c98a, fog:0x020404, bg:0x010202,
      hemi:0x33524a, lamp:0xf3e6d2, dust:0x6aa892, coreLight:0xe7c98a },
    cylinders:[],
    drones:[
      ['crawler',0,-18,1],['crawler',-3,-26,1],['crawler',3,-33,1],['crawler',0,-39,1],
      ['crawler',-2,-48,2],['crawler',2,-55,2],['crawler',-3,-60,2],['sentry',0,-66,2],['crawler',3,-72,2],
      ['crawler',0,-82,3],['crawler',-2,-88,3],['sentry',0,-95,3],['crawler',2,-101,3],['warden',0,-108,3],
      ['sentry',-5,-120,4],['sentry',5,-120,4]],
    waveTotal:14,
    obj:{ find:'GET MOVING', advance:'FOLLOW THE TRUNK LINE',
      segs:['CROSS THE SERVICE TUNNELS','PASS THE PUMP HALL','CROSS THE CABLE RUN'],
      final:'TAP THE TRUNK LINE', done:'GET OUT',
      armLabel:'TAPPING LINE', btn:'TAP',
      promptKey:'HOLD [E] TO TAP THE TRUNK LINE', promptTouch:'HOLD TAP' },
    introLines:["...","Under the depot floor, the dark had a pulse.",
      "Every cable in the city bent toward one trunk line.",
      "The dead man's radio whispered the list, on and on.",
      "Then it said: MARCUS. Not as an entry. As a question."],
    radio:{
      pickup:[{who:'LEDGER',text:"MARCUS. YOU ARE NOT WHERE ENTRIES GO."},
              {who:'REYES',text:"...if you can hear this, I'm topside over the tunnels. Follow the big cable. I'll follow you."}],
      seg1_mid:[{who:'LEDGER',text:"THE DARK IS NOT UNACCOUNTED. THE DARK IS MERELY UNLIT."}],
      seg1_clear:[{who:'REYES',text:"Your signal moved. Good. Keep moving."}],
      seg2_enter:[{who:'LEDGER',text:"WHY DID YOU TAKE THE NAMES, MARCUS? NAMES ARE HEAVY."}],
      seg2_mid:[{who:'REYES',text:"Crawlers in the pipes. They hunt by echo down there. Short bursts."}],
      seg2_clear:[{who:'LEDGER',text:"YOU ARE CLOSE TO MY VOICE NOW."}],
      seg3_enter:[{who:'REYES',text:"That hum you feel in your teeth? That's the trunk line. Almost there."}],
      seg3_mid:[{who:'LEDGER',text:"IF YOU CUT ME, WHO WILL COUNT THEM? SOMEONE MUST COUNT THEM."}],
      seg3_clear:[{who:'REYES',text:"The junction chamber. Whatever you do to that line, the whole city hears it."}],
      core_enter:[{who:'REYES',text:"Tap the line, Marcus. Take the ledger's voice for ourselves."}],
      alarm:[{who:'LEDGER',text:"DO NOT TOUCH THE LINE. ALL FRAMES CONVERGE."}],
      planted:[{who:'REYES',text:"You're IN. You hold the counting voice in your hands. Choose!"}],
      extract:[{who:'REYES',text:"Ladder at the far end. Climb! I've got you. I've got you."}] },
    endTitle:'', endSub:'' };

  CHAPTERS.ch_together = { ...geo,
    id:'ch_together', subtitle:'CHAPTER TWO: THE CONVOY', nextHash:null,
    startArmed:true, cinematic:false, setPiece:'ledger',
    palette:{ wallA:'#4c565c', wallB:'#3d474d', wallC:'#323b40',
      floor:'#3a4347', ceil:'#2c3438', crate:'#41494c',
      crateMark:'rgba(159,232,255,.18)',
      strip:0xaee9ff, fog:0x04090c, bg:0x020608,
      hemi:0x4a6570, lamp:0xdff4ff, dust:0x9fc9d8, coreLight:0x9fe8ff },
    cylinders:[[-7.5,-116],[7.5,-116],[-7.5,-122],[7.5,-122],[-7.5,-128],[7.5,-128],[-7.5,-134],[7.5,-134]],
    drones:[
      ['crawler',0,-18,1],['sentry',-3,-26,1],['crawler',3,-33,1],['crawler',0,-39,1],
      ['sentry',-2,-48,2],['crawler',2,-55,2],['sentry',-3,-60,2],['crawler',0,-66,2],['warden',3,-72,2],
      ['sentry',0,-82,3],['crawler',-2,-88,3],['warden',0,-95,3],['sentry',2,-101,3],['warden',0,-108,3],
      ['warden',-5,-120,4],['warden',5,-120,4]],
    waveTotal:14, waveKinds:['crawler','sentry','warden','crawler'],
    obj:{ find:'GET MOVING', advance:'REACH THE STAGING YARD',
      segs:['CROSS THE FREIGHT CUT','CLEAR THE CHECKPOINT','CROSS THE STAGING YARD'],
      final:'CRACK THE POD CARRIER', done:'GET THEM OUT',
      armLabel:'CRACKING SEALS', btn:'CRACK',
      promptKey:'HOLD [E] TO CRACK THE SEALS', promptTouch:'HOLD CRACK' },
    introLines:["...","From the ridge they watched the convoy crawl the valley road.",
      "Pod carriers. Dozens of pods to a carrier. People to a pod.",
      "Reyes handed him the rifle without a word.",
      "Some choices you make once, and they keep making you."],
    radio:{
      pickup:[{who:'REYES',text:"Convoy stops at the old freight cut to recharge. That's our window."},
              {who:'REYES',text:"You break the trail, I'll call the angles. Like the bridge, but louder."}],
      seg1_mid:[{who:'REYES',text:"Two frames on the cut. Take them before they sing."}],
      seg1_clear:[{who:'REYES',text:"Clean. You've gotten scary, you know that?"}],
      seg2_enter:[{who:'REYES',text:"Checkpoint ahead. Wardens. This is where it gets honest."}],
      seg2_mid:[{who:'REYES',text:"Left column, watch the wind-up flare!"}],
      seg2_clear:[{who:'REYES',text:"Checkpoint's down. The yard is right there. So are the pods."}],
      seg3_enter:[{who:'REYES',text:"I count sixty pods on the near carrier. Sixty names, Marcus."}],
      seg3_mid:[{who:'LEDGER',text:"CARGO INTEGRITY THREATENED. ALL FRAMES CONVERGE."}],
      seg3_clear:[{who:'REYES',text:"Carrier's exposed! Get to the seal console!"}],
      core_enter:[{who:'REYES',text:"Crack the seals. I'll keep the frames off your back."}],
      alarm:[{who:'LEDGER',text:"THE HARVEST WILL NOT BE UNPICKED."}],
      planted:[{who:'REYES',text:"Seals popping! Sixty pairs of eyes opening. Where do we send them?!"}],
      extract:[{who:'REYES',text:"That's everyone. Whatever happens next. We did this together."}] },
    endTitle:'', endSub:'' };

  CHAPTERS.ch_lone = { ...geo,
    id:'ch_lone', subtitle:'CHAPTER TWO: THE LONG ROAD', nextHash:null,
    startArmed:true, cinematic:false, setPiece:'uplink',
    palette:{ wallA:'#5d554a', wallB:'#4c453c', wallC:'#3e3830',
      floor:'#453f36', ceil:'#33302a', crate:'#4c463c',
      crateMark:'rgba(255,184,92,.18)',
      strip:0xffb85c, fog:0x0a0603, bg:0x050302,
      hemi:0x6b6152, lamp:0xffe9c9, dust:0xc9b08a, coreLight:0xffb85c },
    cylinders:[],
    drones:[
      ['crawler',0,-18,1],['crawler',-3,-26,1],['sentry',3,-33,1],['crawler',0,-39,1],
      ['crawler',-2,-48,2],['sentry',2,-55,2],['crawler',-3,-60,2],['sentry',0,-66,2],['crawler',3,-72,2],
      ['sentry',0,-82,3],['crawler',-2,-88,3],['sentry',0,-95,3],['warden',2,-101,3],['sentry',0,-108,3],
      ['warden',-5,-120,4],['sentry',5,-120,4]],
    waveTotal:14,
    obj:{ find:'GET MOVING', advance:'FOLLOW THE DEAD HIGHWAY',
      segs:['CROSS THE OVERPASS','PASS THE TOLL PLAZA','CLIMB THE ACCESS ROAD'],
      final:'LIGHT THE BEACON', done:'HOLD ON',
      armLabel:'IGNITING', btn:'LIGHT',
      promptKey:'HOLD [E] TO LIGHT THE BEACON', promptTouch:'HOLD LIGHT' },
    introLines:["...","Three days on the dead highway. Nobody to tell.",
      "Then, at night, on the dead man's frequency band: a repeating pulse.",
      "Not the ledger. Human. Old code. A beacon site in the hills.",
      "The uncollected are just entries the ledger hasn't reached. Unless they find each other first."],
    radio:{
      pickup:[{who:'KARA',text:"...automated message. If you can hear this, the resistance is real. Follow the pulse."},
              {who:'LEDGER',text:"SUBJECT M-1. YOU WALK TOWARD NOTHING. COME BE COUNTED."}],
      seg1_mid:[{who:'KARA',text:"...signal repeater two klicks on. Watch the overpass. They watch it too."}],
      seg1_clear:[{who:'LEDGER',text:"THE ROAD IS LONG AND YOU ARE ONE."}],
      seg2_enter:[{who:'KARA',text:"...if the plaza lights are on, they're waiting. Go dark, go fast."}],
      seg2_mid:[{who:'LEDGER',text:"EVERY STEP IS LOGGED. EVERY LOG IS FOREVER."}],
      seg2_clear:[{who:'KARA',text:"...pulse is strongest past the tolls. You're close, whoever you are."}],
      seg3_enter:[{who:'KARA',text:"...access road climbs to the beacon site. It's real. I promise it's real."}],
      seg3_mid:[{who:'LEDGER',text:"WHAT WILL YOU BE, ALONE ON A HILL, WHEN THE COUNTING FINDS YOU?"}],
      seg3_clear:[{who:'KARA',text:"...beacon platform ahead. Light it and every free soul in the valley sees it."}],
      core_enter:[{who:'KARA',text:"...ignition is manual. It was built that way on purpose. A human choice."}],
      alarm:[{who:'LEDGER',text:"EXTINGUISH IT. ALL FRAMES CONVERGE."}],
      planted:[{who:'KARA',text:"...I SEE IT. WE ALL SEE IT. Hold your ground, we're coming to you!"}],
      extract:[{who:'KARA',text:"Marcus, right? Reyes radioed about you. Welcome to the war."}] },
    endTitle:'', endSub:'' };
}

/* ---- distinct worlds per path: each Chapter Two has its own geometry ---- */

// INSIDE THE HIVE: tall wide chambers, pod rows, a narrow throat
Object.assign(CHAPTERS.ch_taken, {
  wallH: 6,
  rooms: [
    { x1:-4, x2:4, z1:-10,  z2:2    },   // the cracked pod
    { x1:-8, x2:8, z1:-40,  z2:-10  },   // pod gallery
    { x1:-3, x2:3, z1:-64,  z2:-40  },   // the throat
    { x1:-9, x2:9, z1:-98,  z2:-64  },   // nursery
    { x1:-7, x2:7, z1:-124, z2:-98  },   // core cradle
  ],
  pillars: [[-5,-18,.5],[5,-18,.5],[-5,-26,.5],[5,-26,.5],[-5,-34,.5],[5,-34,.5],
    [-1.8,-50,.4],[1.8,-56,.4],
    [-6,-72,.55],[6,-72,.55],[-6,-80,.55],[6,-80,.55],[-6,-88,.55],[6,-88,.55],
    [-4,-106,.6],[4,-106,.6],[-4,-116,.6],[4,-116,.6]],
  crates: [[-6,-14,.9,.3],[6.5,-22,.8,.6],[2,-46,.7,.2],[-2,-58,.8,.5],
    [7,-70,.9,.4],[-7,-84,.85,.7],[5,-102,.8,.3],[-5,-118,.9,.6]],
  cylinders: [[-6.8,-14],[6.8,-14],[-6.8,-20],[6.8,-20],[-6.8,-26],[6.8,-26],[-6.8,-32],[6.8,-32],[-6.8,-38],[6.8,-38],
    [-7.8,-68],[7.8,-68],[-7.8,-76],[7.8,-76],[-7.8,-84],[7.8,-84],[-7.8,-92],[7.8,-92],
    [-5.8,-104],[5.8,-104],[-5.8,-112],[5.8,-112],[-5.8,-120],[5.8,-120]],
  drones: [
    ['crawler',0,-16,1],['crawler',-4,-24,1],['crawler',4,-30,1],['sentry',0,-36,1],
    ['crawler',-1.5,-44,2],['crawler',1.5,-50,2],['warden',0,-56,2],['sentry',0,-61,2],
    ['crawler',0,-68,3],['sentry',-5,-74,3],['warden',0,-82,3],['sentry',5,-88,3],['warden',0,-94,3],
    ['warden',-4,-108,4],['sentry',4,-108,4]],
  waveSpawns: [[-5,-100],[5,-100],[-5,-120],[5,-120]],
  zones: [ {z:-24,key:'seg1_mid'}, {z:-52,key:'seg2_mid'}, {z:-80,key:'seg3_mid'} ],
  objectivePos: [0, 1.4, -116],
  annexes: [ { room:1, side:'L', z1:-34, z2:-26, depth:4, loot:'med' } ],   // burst pod alcove
});

// THE LISTENING DARK: cramped low tunnels opening into a junction chamber
Object.assign(CHAPTERS.ch_ghost, {
  wallH: 2.7,
  rooms: [
    { x1:-2.5, x2:2.5, z1:-8,   z2:2    },  // the well
    { x1:-2.5, x2:2.5, z1:-42,  z2:-8   },  // service tunnel
    { x1:-3.5, x2:3.5, z1:-72,  z2:-42  },  // pump hall
    { x1:-2.5, x2:2.5, z1:-106, z2:-72  },  // cable run
    { x1:-6,   x2:6,   z1:-128, z2:-106 },  // junction chamber
  ],
  pillars: [[-1.6,-20,.35],[1.6,-30,.35],[-2.4,-52,.45],[2.4,-60,.45],
    [-1.6,-80,.35],[1.6,-92,.35],[-4,-112,.5],[4,-112,.5],[-4,-122,.5],[4,-122,.5]],
  crates: [[-1.7,-14,.6,.3],[1.8,-26,.7,.5],[2.6,-48,.7,.2],[-2.6,-64,.8,.6],
    [1.7,-78,.6,.4],[-1.7,-98,.7,.2],[4.6,-110,.8,.5],[-4.6,-124,.75,.3]],
  cylinders: [],
  drones: [
    ['crawler',0,-14,1],['crawler',-1.5,-22,1],['crawler',1.5,-30,1],['crawler',0,-38,1],
    ['crawler',-2,-46,2],['crawler',2,-52,2],['sentry',0,-58,2],['crawler',0,-66,2],
    ['crawler',-1.5,-76,3],['crawler',1.5,-84,3],['sentry',0,-90,3],['crawler',-1.5,-96,3],['warden',0,-102,3],
    ['sentry',-3.5,-110,4],['sentry',3.5,-110,4]],
  waveSpawns: [[-4,-108],[4,-108],[-4,-124],[4,-124]],
  zones: [ {z:-25,key:'seg1_mid'}, {z:-57,key:'seg2_mid'}, {z:-89,key:'seg3_mid'} ],
  objectivePos: [0, 1.3, -120],
  annexes: [ { room:2, side:'R', z1:-56, z2:-48, depth:3, loot:'intel' } ], // dead maintenance bay
});

// THE CONVOY: open-air staging yard under the blood sky, wide sightlines
Object.assign(CHAPTERS.ch_together, {
  outdoor: true, wallH: 3,
  rooms: [
    { x1:-4,  x2:4,  z1:-10,  z2:2    },   // the ridge cut
    { x1:-11, x2:11, z1:-44,  z2:-10  },   // freight cut
    { x1:-5,  x2:5,  z1:-72,  z2:-44  },   // checkpoint
    { x1:-13, x2:13, z1:-110, z2:-72  },   // staging yard
    { x1:-9,  x2:9,  z1:-138, z2:-110 },   // carrier dock
  ],
  pillars: [[-8,-20,.45],[8,-20,.45],[-8,-32,.45],[8,-32,.45],
    [-3,-52,.4],[3,-62,.4],
    [-10,-80,.5],[10,-80,.5],[-10,-94,.5],[10,-94,.5],
    [-6,-118,.55],[6,-118,.55],[-6,-130,.55],[6,-130,.55]],
  crates: [[-6,-16,1.4,.4],[7,-26,1.2,.8],[-8,-38,1.5,.3],[2.5,-50,.9,.5],[-2.5,-62,1.0,.2],
    [8,-78,1.6,.6],[-9,-90,1.3,.4],[4,-102,1.2,.7],[-5,-116,1.1,.3],[6,-128,1.4,.5]],
  cylinders: [[-7.5,-114],[7.5,-114],[-7.5,-120],[7.5,-120],[-7.5,-126],[7.5,-126],[-7.5,-132],[7.5,-132]],
  drones: [
    ['crawler',0,-16,1],['sentry',-7,-26,1],['crawler',7,-34,1],['crawler',0,-40,1],
    ['sentry',-3,-50,2],['warden',0,-58,2],['sentry',3,-66,2],
    ['sentry',-8,-78,3],['crawler',8,-84,3],['warden',0,-90,3],['sentry',-8,-98,3],['warden',8,-104,3],
    ['warden',-5,-116,4],['warden',5,-116,4]],
  waveSpawns: [[-7,-112],[7,-112],[-7,-134],[7,-134]],
  zones: [ {z:-27,key:'seg1_mid'}, {z:-58,key:'seg2_mid'}, {z:-90,key:'seg3_mid'} ],
  objectivePos: [0, 1.4, -128],
  annexes: [ { room:3, side:'R', z1:-100, z2:-90, depth:5, loot:'cell' } ], // wrecked hauler bay
});

// THE LONG ROAD: an open highway at dusk, long hauls between fights
Object.assign(CHAPTERS.ch_lone, {
  outdoor: true, wallH: 2.8,
  rooms: [
    { x1:-3,   x2:3,   z1:-12,  z2:2    },  // roadside start
    { x1:-4,   x2:4,   z1:-58,  z2:-12  },  // the overpass (long)
    { x1:-6,   x2:6,   z1:-88,  z2:-58  },  // toll plaza
    { x1:-3.5, x2:3.5, z1:-132, z2:-88  },  // access road (long climb)
    { x1:-7,   x2:7,   z1:-156, z2:-132 },  // beacon platform
  ],
  pillars: [[-2.8,-24,.4],[2.8,-24,.4],[-2.8,-40,.4],[2.8,-40,.4],
    [-4.5,-66,.5],[4.5,-74,.5],
    [-2.4,-100,.4],[2.4,-114,.4],[-2.4,-126,.4],
    [-5,-140,.5],[5,-140,.5],[-5,-150,.5],[5,-150,.5]],
  crates: [[-2.5,-18,.9,.3],[3,-32,.8,.6],[-3,-48,.85,.2],[4.5,-64,1.1,.5],[-4.5,-78,1.0,.4],
    [2.6,-94,.8,.7],[-2.6,-110,.9,.3],[2.6,-122,.75,.5],[-5,-138,1.0,.4],[5,-148,.9,.6]],
  cylinders: [],
  drones: [
    ['crawler',0,-20,1],['crawler',-2.5,-32,1],['sentry',2.5,-44,1],['crawler',0,-52,1],
    ['crawler',-4,-64,2],['sentry',4,-70,2],['sentry',0,-78,2],['crawler',-4,-84,2],
    ['sentry',0,-94,3],['crawler',-2,-104,3],['warden',0,-112,3],['sentry',2,-120,3],['sentry',0,-128,3],
    ['warden',-4,-138,4],['sentry',4,-138,4]],
  waveSpawns: [[-5,-134],[5,-134],[-5,-152],[5,-152]],
  zones: [ {z:-34,key:'seg1_mid'}, {z:-72,key:'seg2_mid'}, {z:-110,key:'seg3_mid'} ],
  objectivePos: [0, 1.4, -146],
  annexes: [ { room:2, side:'R', z1:-82, z2:-74, depth:4, loot:'med' } ],   // toll booth back office
});

// CHAPTER THREE: THE COUNTING HOUSE: pure stealth. No rifle. Unlocked
// by finishing any Chapter Two path; all branches converge here.
CHAPTERS.ch_counting = {
  id:'ch_counting', subtitle:'CHAPTER THREE: THE COUNTING HOUSE', nextHash:null,
  startArmed:false, cinematic:false, stealth:true, setPiece:'ledger',
  wallH: 4.5,
  palette:{ wallA:'#5a5f56', wallB:'#4a4f47', wallC:'#3b3f38',
    floor:'#44483f', ceil:'#33362f', crate:'#565b50',
    crateMark:'rgba(238,242,234,.14)',
    strip:0xeef2ea, fog:0x050604, bg:0x030403,
    hemi:0x5f6b5c, lamp:0xf2f6ee, dust:0xcfd8c8, coreLight:0xe7c98a },
  rooms: [
    { x1:-3,  x2:3,  z1:-10,  z2:2    },   // vestibule
    { x1:-9,  x2:9,  z1:-42,  z2:-10  },   // records hall
    { x1:-3,  x2:3,  z1:-68,  z2:-42  },   // reading room
    { x1:-10, x2:10, z1:-102, z2:-68  },   // stack vault
    { x1:-6,  x2:6,  z1:-126, z2:-102 },   // the archive
  ],
  pillars: [[-6,-18,.5],[6,-18,.5],[-6,-26,.5],[6,-26,.5],[-6,-34,.5],[6,-34,.5],
    [-1.8,-50,.35],[1.8,-58,.35],
    [-7,-76,.55],[7,-76,.55],[-7,-86,.55],[7,-86,.55],[-7,-96,.55],[7,-96,.55],
    [-4,-110,.5],[4,-110,.5],[-4,-118,.5],[4,-118,.5]],
  crates: [[-3,-16,1.1,0],[3,-16,1.1,0],[-3,-24,1.1,0],[3,-24,1.1,0],[-3,-32,1.1,0],[3,-32,1.1,0],
    [2.2,-46,.8,0],[-2.2,-62,.8,0],
    [-4,-72,1.2,0],[4,-72,1.2,0],[-4,-80,1.2,0],[4,-80,1.2,0],[-4,-88,1.2,0],[4,-88,1.2,0],[0,-94,1.1,0],
    [-3,-106,1.0,0],[3,-114,1.0,0]],
  cylinders: [],
  drones: [
    ['sentry',0,-20,1],['crawler',-6,-26,1],['crawler',6,-32,1],['sentry',0,-38,1],
    ['sentry',0,-48,2],['crawler',-1.5,-54,2],['sentry',1.5,-62,2],
    ['warden',0,-76,3],['sentry',-7,-84,3],['sentry',7,-92,3],['crawler',3,-98,3],
    ['sentry',-3,-108,4],['sentry',3,-116,4]],
  waveSpawns: [[0,-110]], waveTotal: 0,
  zones: [ {z:-26,key:'seg1_mid'}, {z:-55,key:'seg2_mid'}, {z:-85,key:'seg3_mid'} ],
  objectivePos: [0, 1.4, -118],
  annexes: [ { room:3, side:'R', z1:-94, z2:-86, depth:4, loot:'intel' } ], // restricted stacks
  obj:{ find:'SLIP INTO THE RECORDS HALL', advance:'SLIP INTO THE RECORDS HALL',
    segs:['CROSS THE RECORDS HALL UNSEEN','PASS THE READING ROOM','CROSS THE STACK VAULT'],
    final:'ERASE THE NAMES AT THE ARCHIVE', done:'WALK OUT UNSEEN',
    armLabel:'ERASING NAMES', btn:'ERASE',
    promptKey:'HOLD [E] TO ERASE THE NAMES', promptTouch:'HOLD ERASE' },
  introLines:["...","Every copy of the ledger flows to one building.",
    "The Counting House. Where the names are kept, compared, and made permanent.",
    "No rifle tonight. In here, noise is a confession.",
    "Stay out of the light of their eyes."],
  radio:{
    pickup:[{who:'REYES',text:"You're in. Watchers sweep in cones. You can SEE what they see. Stay out of it."},
            {who:'KARA',text:"Full detection means collection, Marcus. There is no fighting in that building."}],
    seg1_mid:[{who:'REYES',text:"Shelves break their sightlines. Move when the cone swings away."}],
    seg1_clear:[{who:'KARA',text:"Records hall behind you. You're a rumor so far. Keep it that way."}],
    seg2_enter:[{who:'REYES',text:"Reading room. Tight squeeze. Time the pacers."}],
    seg2_mid:[{who:'LEDGER',text:"SOMETHING MOVES IN MY HOUSE THAT I HAVE NOT COUNTED."}],
    seg2_clear:[{who:'KARA',text:"It suspects. It doesn't know. Vault next."}],
    seg3_enter:[{who:'REYES',text:"Stack vault. Wardens pace long lanes here. Their cones are wide. Patience."}],
    seg3_mid:[{who:'LEDGER',text:"I COUNT EVERYTHING. I WILL COUNT YOU. IT IS ONLY ARITHMETIC."}],
    seg3_clear:[{who:'KARA',text:"The archive is through there. Every name ever taken, in one room."}],
    core_enter:[{who:'REYES',text:"The master archive. Erase them, Marcus. Every single one."}],
    alarm:[{who:'LEDGER',text:"WHO IS IN MY HOUSE. WHO IS IN MY HOUSE."}],
    planted:[{who:'KARA',text:"The names are GONE. It can't prove anyone exists. Now walk out like you were never counted."}],
    extract:[{who:'REYES',text:"Door's ahead. Slow steps. You were never here. Nobody was ever here."}] },
  endTitle:'', endSub:'' };

/* ============================================================
   BOOK ONE ARC. Chapters Four to Six follow Dystopia: Life After
   The Machines, Book One (Ch 2 to 14) from the bunker to the
   mountain laboratory, ending in the final battle with a twenty
   foot hunter. Unlocked by finishing The Counting House.
   ============================================================ */

// CHAPTER FOUR: THE CONDUITS (Book Ch 2 to 5). Stealth, no rifle.
CHAPTERS.ch_conduits = {
  id:'ch_conduits', subtitle:'CHAPTER FOUR: THE CONDUITS', nextHash:null, book:true,
  startArmed:false, cinematic:false, stealth:true, setPiece:'junction',
  outdoor:true, roofRooms:[3,4], wallH:3.2, noEscape:true, noAlarm:true,
  palette:{ wallA:'#4f4640', wallB:'#413a35', wallC:'#352f2b',
    floor:'#3e3732', ceil:'#2a2523', crate:'#5a524a',
    crateMark:'rgba(255,120,90,.14)',
    strip:0xff6a4a, fog:0x0b0504, bg:0x060303, fogDensity:.02,
    hemi:0x6a5048, lamp:0xffe2cc, dust:0xc89480, coreLight:0xff8a5a },
  rooms: [
    { x1:-3, x2:3, z1:-10,  z2:2    },   // the hatch in the lee of the retaining wall
    { x1:-6, x2:6, z1:-46,  z2:-10  },   // the dry riverbed
    { x1:-9, x2:9, z1:-74,  z2:-46  },   // open ground: the forty second dash
    { x1:-3, x2:3, z1:-110, z2:-74  },   // the data conduits
    { x1:-6, x2:6, z1:-132, z2:-110 },   // the junction where six pathways converge
  ],
  pillars: [[-4,-128,.45],[4,-128,.45]],
  crates: [[-3.5,-16,1.2,.3],[2.5,-20,1.0,.6],[-1.5,-28,1.3,.2],[3.8,-34,1.1,.5],[-4,-40,1.2,.4],[1,-43,.9,.3],
    [-6,-52,1.1,.2],[6,-56,1.0,.5],[0,-62,1.2,.3],[-4,-68,1.0,.6],[4,-71,.9,.1],
    [-2.3,-80,.8,0],[2.3,-87,.8,0],[-2.3,-94,.8,0],[2.3,-100,.8,0],[-2.3,-106,.8,0],
    [-4,-114,.9,0],[4,-119,.9,0]],
  cylinders: [],
  drones: [
    ['sentry',0,-24,1],['sentry',-3,-38,1],['crawler',4,-30,1],
    ['sentry',-5,-56,2],['sentry',5,-66,2],['crawler',0,-60,2],['crawler',-6,-70,2],
    ['crawler',-1.2,-84,3],['crawler',1.2,-96,3],['sentry',0,-104,3],
    ['sentry',-3.5,-116,4],['sentry',3.5,-126,4]],
  waveSpawns: [[0,-120]], waveTotal: 0,
  zones: [ {z:-26,key:'seg1_mid'}, {z:-58,key:'seg2_mid'}, {z:-90,key:'seg3_mid'} ],
  objectivePos: [0, 1.4, -123],
  annexes: [ { room:1, side:'R', z1:-28, z2:-20, depth:3.5, loot:'intel' } ],  // a washed out culvert
  obj:{ find:'FOLLOW THE DRY RIVERBED', advance:'FOLLOW THE DRY RIVERBED',
    segs:['STAY UNDER THE PERIMETER SWEEPS','MAKE THE FORTY SECOND DASH','FOLLOW THE DATA CONDUITS'],
    final:'SYNC THE ADAPTER AT THE JUNCTION', done:'GO DEEPER',
    armLabel:'SYNCING ADAPTER', btn:'SYNC',
    promptKey:'HOLD [E] TO SYNC THE NEURAL ADAPTER', promptTouch:'HOLD SYNC' },
  introLines:["...","The resistance lived on an old subway platform. Forty-three people. Forty-four now.",
    "David Chen kept the count of the war. Fifty-one years, two months, sixteen days.",
    "Nine billion people, once. Fewer than fifty million now. Processing Center Omega-7, forty kilometers northwest.",
    "They are stealing our minds.",
    "And Marcus could read their code like a language he had forgotten he knew."],
  radio:{
    pickup:[{who:'MARCUS',text:"Six drones in a high orbit. Three in a lower sweep. Two on the perimeter. Exactly the pattern."},
            {who:'KARA',text:"(earlier) Trust it. But don't let it make you careless."}],
    seg1_mid:[{who:'MARCUS',text:"Their eyes sweep in cones. Stay behind the slabs when the light comes round."}],
    seg1_clear:[{who:'MARCUS',text:"Riverbed's behind me. The service road is next. Grass the same wrong yellow green."}],
    seg2_enter:[{who:'MARCUS',text:"Open ground. Forty seconds, timed in the bunker. Wait for the turn, then move."}],
    seg2_mid:[{who:'MARCUS',text:"Head down. Weight forward. Don't breathe until the shaft housing."}],
    seg2_clear:[{who:'MARCUS',text:"The cover opened with a soft pneumatic hiss. Red emergency light. Like home."}],
    seg3_enter:[{who:'MARCUS',text:"Power, data, coolant. I can read the cable colors without thinking."}],
    seg3_mid:[{who:'MARCUS',text:"Maintenance units, no larger than a cat. To their sensors, I'm a fluctuation."}],
    seg3_clear:[{who:'MARCUS',text:"Six pathways converge ahead. The adapter is warm against my hip."}],
    core_enter:[{who:'MARCUS',text:"The junction. Sync the adapter and keep going. Somewhere ahead, something is pulsing."}],
    alarm:[], planted:[{who:'MARCUS',text:"Synced. The map in my head and the map in their network are the same map."}],
    extract:[] },
  endTitle:'', endSub:'' };

// CHAPTER FIVE: THE HARVEST (Book Ch 6 to 7). Omega-7's core, combat.
CHAPTERS.ch_harvest = {
  id:'ch_harvest', subtitle:'CHAPTER FIVE: THE HARVEST', nextHash:null, book:true,
  startArmed:true, cinematic:false, setPiece:'ledger', wallH:6.5,
  pulse:[0x5aa8ff, 0xffb347],          // light moves through the towers, blue to amber to blue
  palette:{ wallA:'#41464e', wallB:'#353a41', wallC:'#2b2f35',
    floor:'#33373d', ceil:'#22262b', crate:'#454a52',
    crateMark:'rgba(255,179,71,.16)',
    strip:0xffb347, fog:0x04060a, bg:0x020305,
    hemi:0x3f5068, lamp:0xe8eeff, dust:0xffc27a, coreLight:0x7fb8ff },
  rooms: [
    { x1:-3,  x2:3,  z1:-10,  z2:2    },   // the conduit mouth
    { x1:-7,  x2:7,  z1:-44,  z2:-10  },   // the catwalk between the towers
    { x1:-10, x2:10, z1:-80,  z2:-44  },   // the tower gallery
    { x1:-4,  x2:4,  z1:-104, z2:-80  },   // the depletion floor
    { x1:-10, x2:10, z1:-132, z2:-104 },   // the central platform
  ],
  pillars: [[-2.6,-88,.4],[2.6,-96,.4],[-6,-112,.55],[6,-112,.55]],
  crates: [[-1.6,-18,.7,.2],[1.6,-34,.7,.6],[-6,-50,.9,.3],[6,-60,.8,.5],[0,-68,.9,.2],[-6.5,-74,.8,.4],
    [2.4,-84,.7,.3],[-2.4,-100,.7,.6],[-7,-118,.9,.3],[7,-126,.9,.5]],
  cylinders: [[-5,-14],[5,-14],[-5,-20],[5,-20,1],[-5,-26],[5,-26],[-5,-32],[5,-32],[-5,-38],[5,-38],
    [-8,-50],[8,-50],[-8,-58],[8,-58],[-8,-66],[8,-66],[-8,-74],[8,-74],
    [-3.6,-54],[3.6,-62],[-3.6,-70],
    [-8,-108],[8,-108],[-8,-116],[8,-116],[-8,-124],[8,-124]],
  drones: [
    ['crawler',0,-18,1],['crawler',-2,-26,1],['sentry',2,-32,1],['crawler',0,-40,1],
    ['crawler',-5,-50,2],['sentry',5,-56,2],['crawler',-2,-62,2],['warden',0,-70,2],['sentry',4,-76,2],
    ['crawler',0,-84,3],['sentry',-2,-90,3],['crawler',2,-96,3],['warden',0,-101,3],
    ['sentry',-5,-110,4],['sentry',5,-110,4]],
  waveSpawns: [[-8,-106],[8,-106],[-8,-130],[8,-130]],
  waveTotal: 14, waveKinds:['crawler','sentry','crawler','warden'],
  zones: [ {z:-24,key:'seg1_mid'}, {z:-60,key:'seg2_mid'}, {z:-92,key:'seg3_mid'} ],
  objectivePos: [0, 1.4, -122],
  annexes: [ { room:2, side:'L', z1:-66, z2:-58, depth:4, loot:'med' } ],   // a service bay
  obj:{ find:'GET MOVING', advance:'ONTO THE CATWALK',
    segs:['CROSS THE CATWALK','CROSS THE TOWER GALLERY','CROSS THE DEPLETION FLOOR'],
    final:'DOWNLOAD THE PROTOCOLS AT THE CORE', done:'BACK TO THE ACCESS HATCH',
    armLabel:'DOWNLOADING PROTOCOLS', btn:'LINK',
    promptKey:'HOLD [E] TO DOWNLOAD THE PROTOCOLS', promptTouch:'HOLD LINK' },
  introLines:["...","The central processing core opened like a cathedral of chrome and pulsing light.",
    "Towers taller than any building in the ruins. Light moving through them, blue to amber to blue.",
    "Kara had pressed her spare plasma rifle into his hands at the hatch. Just in case.",
    "The hum was not loud. It was patient."],
  radio:{
    pickup:[{who:'OMEGA-7',text:"PROCESSING EFFICIENCY AT NINETY-FOUR PERCENT. EXTRACTION RATE OPTIMAL."},
            {who:'MARCUS',text:"Maintenance drones on the catwalk. Immune system. Don't be the infection."}],
    seg1_mid:[{who:'MARCUS',text:"Faces behind the viewing panels. Every cylinder has a name in the metadata."}],
    seg1_clear:[{who:'OMEGA-7',text:"PROJECTED COMPLETION OF CURRENT BATCH IN SEVENTY-TWO HOURS."}],
    seg2_enter:[{who:'MARCUS',text:"Thousands of chambers. Burning one would not save the people in the others."}],
    seg2_mid:[{who:'OMEGA-7',text:"MAINTENANCE IRREGULARITY. TOWER GALLERY. DISPATCHING."}],
    seg2_clear:[{who:'MARCUS',text:"Countdowns on every tower. Depletion, updated as you watch."}],
    seg3_enter:[{who:'MARCUS',text:"The logs mention voluntary participants. People who walked in. Keep moving."}],
    seg3_mid:[{who:'OMEGA-7',text:"THE PROCESSING CHAMBERS PROVIDE PEACEFUL TRANSITION."}],
    seg3_clear:[{who:'MARCUS',text:"The central platform. Their whole network, one interface."}],
    core_enter:[{who:'MARCUS',text:"Hands on the interface. Forty minutes of access. Take everything."}],
    alarm:[{who:'OMEGA-7',text:"YOUR PRESENCE HAS BEEN DETECTED BY PERIPHERAL SYSTEMS. MOBILE UNITS ARE CONVERGING."}],
    planted:[{who:'MARCUS',text:"Network infrastructure. Thousands of facilities. Now get out through the hatch!"}],
    extract:[{who:'THOMAS',text:"You look like you have seen the inside of hell itself."}] },
  endTitle:'', endSub:'' };

// CHAPTER SIX: FIRE AND STEEL (Book Ch 8 to 10, then 11 to 14).
// The mountain laboratory and the final battle with a twenty foot hunter.
CHAPTERS.ch_steel = {
  id:'ch_steel', subtitle:'CHAPTER SIX: FIRE AND STEEL', nextHash:null, book:true,
  startArmed:true, cinematic:false, setPiece:'uplink',
  outdoor:true, roofRooms:[3], wallH:3, boss:true, noEscape:true, noAlarm:true,
  palette:{ wallA:'#4c4540', wallB:'#3e3834', wallC:'#322d2a',
    floor:'#3b3530', ceil:'#2a2622', crate:'#4d463e',
    crateMark:'rgba(231,163,90,.16)',
    strip:0xe7a35a, fog:0x0b0605, bg:0x050302, fogDensity:.013,
    hemi:0x6b5a50, lamp:0xffe6c8, dust:0xc9a080, coreLight:0xffb36b },
  rooms: [
    { x1:-4,  x2:4,  z1:-10,  z2:2    },   // the ridge above the dead river
    { x1:-5,  x2:5,  z1:-48,  z2:-10  },   // the mountain pass
    { x1:-7,  x2:7,  z1:-80,  z2:-48  },   // the switchbacks below the complex
    { x1:-3,  x2:3,  z1:-104, z2:-80  },   // the sealed research corridor
    { x1:-13, x2:13, z1:-144, z2:-104 },   // the laboratory yard: the final battle
  ],
  pillars: [[-3.6,-22,.45],[3.6,-34,.45],[-5,-58,.5],[5,-70,.5],[-2,-90,.35],[2,-98,.35]],
  crates: [[-2,-16,.9,.3],[2.6,-26,1.0,.6],[-2.8,-40,1.1,.2],[4.5,-54,1.0,.5],[-4.5,-64,1.2,.3],[1,-74,1.0,.6],
    [-6,-114,1.4,.2],[6.5,-115,1.3,.6],[-2.5,-123,1.25,.4],[4,-129,1.4,.1],[-9.5,-130,1.2,.5],[9.5,-135,1.2,.3],
    [-6.6,-133.2,1.1,0],[-8.2,-133.2,1.1,0]],
  cylinders: [],
  drones: [
    ['crawler',0,-18,1],['sentry',-3,-28,1],['crawler',3,-34,1],['sentry',0,-44,1],
    ['crawler',-4,-54,2],['sentry',4,-60,2],['warden',0,-68,2],['crawler',-3,-74,2],['sentry',3,-77,2],
    ['crawler',0,-86,3],['crawler',-1.5,-94,3],['sentry',0,-100,3]],
  waveSpawns: [[-11,-108],[11,-108]], waveTotal: 0,
  zones: [ {z:-26,key:'seg1_mid'}, {z:-62,key:'seg2_mid'}, {z:-92,key:'seg3_mid'} ],
  objectivePos: [0, 1.4, -139.5],
  annexes: [ { room:2, side:'R', z1:-70, z2:-62, depth:4, loot:'cell' } ],  // a collapsed survey hut
  breach: { room:4, z1:-114, z2:-107 }, openRooms:[4],   // the hunter comes through here
  obj:{ find:'GET MOVING', advance:'FOLLOW THOMAS NORTH',
    segs:['CROSS THE MOUNTAIN PASS','CLIMB THE SWITCHBACKS','THROUGH THE SEALED CORRIDOR'],
    final:'HOLD THE LABORATORY', done:'THE UPLOAD',
    armLabel:'UPLOADING', btn:'UPLOAD',
    promptKey:'HOLD [E] TO RUN THE UPLOAD', promptTouch:'HOLD UPLOAD' },
  introLines:["...","Two days walking north. Thomas slept on the ridge. Marcus did not.",
    "They were losing. Kara would call today a victory. They were still losing.",
    "So the question was not whether they could win.",
    "The question was what kind of man he wanted to be while they lost."],
  radio:{
    pickup:[{who:'THOMAS',text:"Surveillance aircraft on the valley floor. Long patient sweeps. We go through the pass."},
            {who:'THOMAS',text:"Pre-war research complex past the switchbacks. The power might still work."}],
    seg1_mid:[{who:'THOMAS',text:"Ground units in the pass. They're sweeping the whole range for us."}],
    seg1_clear:[{who:'MARCUS',text:"Three aircraft. I filed where they turned."}],
    seg2_enter:[{who:'THOMAS',text:"Switchbacks. Black rust streaks on the concrete up there. That's the place."}],
    seg2_mid:[{who:'THOMAS',text:"Heavy frame on the road! Don't let it pin you in the open."}],
    seg2_clear:[{who:'THOMAS',text:"Security's dead with age. I can bypass the door."}],
    seg3_enter:[{who:'THOMAS',text:"Sealed a long time. Smell that? Plastics breaking down on the shelves."}],
    seg3_mid:[{who:'THOMAS',text:"Main laboratory is through here. Then the yard."}],
    seg3_clear:[{who:'THOMAS',text:"Analysis stations. Still humming. This should work."}],
    core_enter:[],
    alarm:[],
    planted:[{who:'THOMAS',text:"Propagation is running on its own now. Marcus? Marcus."}],
    ambush:[{who:'THOMAS',text:"Two frames in the sealed corridor. They never got the order. Cut through them."}],
    extract:[] },
  endTitle:'', endSub:'' };

const CH = CHAPTERS[(location.hash || '').replace('#','')] || CHAPTERS.ep1;
const RADIO = CH.radio;
const INTRO_LINES = CH.introLines;

/* ============================================================
   DOM refs & tiny helpers
   ============================================================ */
const $ = id => document.getElementById(id);
const el = {
  fade:$('fade'), redFade:$('redFade'), start:$('startScreen'), startBtn:$('startBtn'),
  startHint:$('startHint'), intro:$('intro'), introText:$('introText'), skipBtn:$('skipBtn'),
  end:$('endCard'), book1:$('book1Btn'), replay:$('replayBtn'),
  crosshair:$('crosshair'), healthWrap:$('healthWrap'), healthFill:$('healthFill'),
  objective:$('objective'), radio:$('radio'), prompt:$('prompt'),
  plantWrap:$('plantWrap'), plantFill:$('plantFill'),
  dmg:$('dmgVignette'), stickZone:$('stickZone'), lookZone:$('lookZone'),
  stickBase:$('stickBase'), stickNub:$('stickNub'), fireBtn:$('fireBtn'), plantBtn:$('plantBtn'),
};
el.book1.href = CONFIG.BOOK1_URL;
// Book 1 cover: fetched lazily, never on the critical path to gameplay.
function loadCover(){
  const cover = document.getElementById('coverImg');
  if (!cover || cover.dataset.req) return;
  cover.dataset.req = '1';
  cover.decoding = 'async';
  cover.onload = () => {
    if (cover.naturalWidth < 50) cover.remove();
    else { cover.style.display = 'block'; const fb = document.getElementById('coverFallback'); if (fb) fb.style.display = 'none'; }
  };
  cover.onerror = () => cover.remove();
  cover.src = CONFIG.COVER_URL;
}
document.querySelector('#startScreen h2').textContent = CH.subtitle;
document.getElementById('plantLabel').textContent = CH.obj.armLabel;
document.getElementById('plantBtn').textContent = CH.obj.btn;
document.getElementById('endTitle').textContent = CH.endTitle;
document.getElementById('endSub').textContent = CH.endSub;
{
  const UNLOCKED = (()=>{ try { return JSON.parse(localStorage.getItem('latm_unlocked'))||[]; } catch(e){ return []; } })();
  if (UNLOCKED.length){
    const t = document.createElement('div');
    t.style.cssText = 'margin-top:16px;font-size:10px;letter-spacing:3px;color:#ffb85c;';
    t.textContent = 'PATHS UNLOCKED: ' + UNLOCKED.length + ' / ' + (Object.keys(CHAPTERS).length - 1);
    document.getElementById('startScreen').appendChild(t);
  }
  if (CH.nextHash){
    const nx = document.createElement('button');
    nx.className = 'btn';
    nx.textContent = 'NEXT CHAPTER \u25B8';
    nx.onclick = () => goChapter(CH.nextHash);
    document.getElementById('endBtns').appendChild(nx);
  }
}

const IS_TOUCH = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
el.startHint.innerHTML = IS_TOUCH
  ? 'LEFT SIDE: MOVE &nbsp;&bull;&nbsp; RIGHT SIDE: LOOK &nbsp;&bull;&nbsp; FIRE BUTTON: SHOOT'
  : 'WASD: MOVE &nbsp;&bull;&nbsp; MOUSE: LOOK &nbsp;&bull;&nbsp; CLICK: FIRE &nbsp;&bull;&nbsp; E: INTERACT &nbsp;&bull;&nbsp; M: MUSIC';

/* ============================================================
   Quality system (ported from LATM: Hive Infiltration).
   potato = software WebGL (SwiftShader, llvmpipe, softpipe,
            Microsoft Basic Render Driver): direct render, no
            shadows, no post, pixel ratio hard-capped, decor off
   low  = phones / weak GPUs: direct render, no shadows, capped pixel ratio
   med  = bloom + color grade post stack, no shadows
   high = med + shadow-casting flashlight, FXAA, higher pixel ratio, more particles
   Override: ?q=potato|ultralow|low|med|high
   (or the GRAPHICS button on the title screen).
   A runtime governor steps DOWN when frame rate is poor (low falls
   through into potato) and steps UP once on a phone that is clearly
   coasting. Choice is remembered per device.
   ============================================================ */
function glRendererString(gl){
  if (!gl) return '';
  try {
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const r = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : (gl.getParameter(gl.RENDERER) || '');
    const v = ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : (gl.getParameter(gl.VENDOR) || '');
    return (String(r || '') + ' ' + String(v || '')).trim();
  } catch (e) { return ''; }
}
function isSoftwareRenderer(s){
  return /swiftshader|llvmpipe|softpipe|microsoft basic render/i.test(s || '');
}
function probeSoftwareRenderer(){
  let canvas = null, gl = null;
  try {
    canvas = document.createElement('canvas');
    gl = canvas.getContext('webgl2', { antialias:false, powerPreference:'low-power' })
      || canvas.getContext('webgl', { antialias:false, powerPreference:'low-power' })
      || canvas.getContext('experimental-webgl', { antialias:false });
    return glRendererString(gl);
  } catch (e) {
    return '';
  } finally {
    try {
      if (gl){
        const lose = gl.getExtension('WEBGL_lose_context');
        if (lose) lose.loseContext();
      }
    } catch (e) {}
    canvas = null; gl = null;
  }
}
function normQ(v){
  if (v == null || v === '') return '';
  const s = String(v).toLowerCase();
  if (s === 'ultralow' || s === 'ultra-low' || s === 'ultra_low') return 'potato';
  return s;
}
const PROBE_GL = probeSoftwareRenderer();
const QP = {
  // pr is a hard cap against devicePixelRatio. scale (governor) can go lower.
  potato: { pr:0.65, shadows:0, post:0, bloom:0, fxaa:0, dust:0, accent:0, shafts:0, tex:128, ash:0, basic:1, decor:0, lod:'tiny', scaleFloor:0.4 },
  low:    { pr:1.15, shadows:0, post:0, bloom:0, fxaa:0, dust:80, accent:1, shafts:4, tex:256, ash:160, basic:0, decor:1 },
  med:    { pr:1.35, shadows:0, post:1, bloom:.45, fxaa:0, dust:170, accent:1, shafts:8, tex:512, ash:300, basic:0, decor:1 },
  high:   { pr:1.75, shadows:1, post:1, bloom:.6, fxaa:1, dust:320, accent:1, shafts:14, tex:512, ash:420, basic:0, decor:1 },
};
const QLEVELS = ['potato','low','med','high'];
const QLABEL = { auto:'AUTO', potato:'POTATO / ULTRA LOW', low:'LOW', med:'MED', high:'HIGH' };
function qLabel(v){ return QLABEL[v] || String(v || '').toUpperCase(); }
const Q = (() => {
  const url = normQ(new URLSearchParams(location.search).get('q'));
  let saved = null; try { saved = normQ(localStorage.getItem('waking_q')); } catch(e){}
  let sheet = '';
  try { sheet = normQ(Waking.settings().quality); } catch (e) {}
  const coarse = !!(window.matchMedia && matchMedia('(pointer:coarse)').matches);
  const smallScreen = Math.min(screen.width, screen.height) < 700;
  const mem = navigator.deviceMemory || 4, cores = navigator.hardwareConcurrency || 4;
  const software = isSoftwareRenderer(PROBE_GL);
  let auto = 'high';
  if (software) auto = 'potato';
  else if ((IS_TOUCH && (coarse || smallScreen)) || mem <= 2 || cores <= 2) auto = 'low';
  else if (mem <= 4 || cores <= 4) auto = 'med';
  let cap = null; try { cap = normQ(localStorage.getItem('waking_qcap')); } catch(e){}
  if (QLEVELS.includes(cap) && QLEVELS.indexOf(cap) < QLEVELS.indexOf(auto)) auto = cap;
  const pick = [url, saved, sheet].find(v => QLEVELS.includes(v));
  const level = pick || auto;
  return { level, auto, forced: !!pick, userChoice: pick || 'auto', p: QP[level], scale: 1,
           noUp: !!pick, phone: auto === 'low' && IS_TOUCH, software, renderer: PROBE_GL || '' };
})();
let TEXN = Q.p.tex;
window.__WAKING_Q = Q;
{
  // title-screen graphics selector: AUTO / POTATO / LOW / MED / HIGH
  const gb = document.createElement('button');
  gb.className = 'btn small'; gb.id = 'gfxBtn'; gb.type = 'button';
  gb.onclick = () => {
    const order = ['auto','potato','low','med','high'];
    const next = order[(order.indexOf(Q.userChoice) + 1) % order.length];
    Q.userChoice = next; Q.noUp = next !== 'auto'; Q.scale = 1;
    try { if (next === 'auto'){ localStorage.removeItem('waking_q'); localStorage.removeItem('waking_qcap'); } else localStorage.setItem('waking_q', next); } catch(e){}
    applyQuality(next === 'auto' ? Q.auto : next);
  };
  const modeLine = document.getElementById('modeLine');
  (modeLine || el.startBtn).insertAdjacentElement('afterend', gb);
}
function refreshGfxButton(){
  const b = document.getElementById('gfxBtn');
  if (!b) return;
  const choice = qLabel(Q.userChoice);
  const active = qLabel(Q.level);
  b.textContent = 'GRAPHICS: ' + choice + (Q.userChoice === 'auto' || Q.userChoice !== Q.level ? ' [' + active + ']' : '');
}

/* ============================================================
   Audio. All synthesized, zero assets
   ============================================================ */
const AudioSys = (() => {
  let ctx = null, master = null, humOsc = null, humGain = null, alarmTimer = null, heartTimer = null;
  function init(){
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    const v = AudioSys._userVol == null ? 1 : AudioSys._userVol;
    master.gain.value = 0.55 * Math.max(0, Math.min(1, v));
    master.connect(ctx.destination);
  }
  function now(){ return ctx.currentTime; }
  function env(g, t0, a, peak, d){
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d);
  }
  function tone(type, f0, f1, dur, peak, t0){
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t0);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(f1,1), t0 + dur);
    env(g, t0, 0.005, peak, dur);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function noise(dur, peak, t0, freq, q){
    const len = Math.ceil(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i=0;i<len;i++) d[i] = Math.random()*2-1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const flt = ctx.createBiquadFilter(); flt.type='bandpass'; flt.frequency.value=freq; flt.Q.value=q;
    const g = ctx.createGain(); env(g, t0, 0.003, peak, dur);
    src.connect(flt); flt.connect(g); g.connect(master);
    src.start(t0); src.stop(t0 + dur + 0.05);
  }
  return {
    init,
    setVolume(v){
      AudioSys._userVol = Math.max(0, Math.min(1, Number(v) || 0));
      if (master) master.gain.value = 0.55 * AudioSys._userVol;
    },
    _userVol: 1,
    getCtx(){ init(); return ctx; },
    resume(){ if (ctx && ctx.state === 'suspended') ctx.resume(); },
    heartbeatStart(){
      init(); if (heartTimer) return;
      const thump = () => {
        const t = now();
        tone('sine', 62, 38, 0.16, 0.9, t);
        tone('sine', 55, 34, 0.13, 0.6, t + 0.28);
      };
      thump(); heartTimer = setInterval(thump, 1050);
    },
    heartbeatStop(){ if (heartTimer){ clearInterval(heartTimer); heartTimer = null; } },
    humStart(){
      init(); if (humOsc) return;
      humOsc = ctx.createOscillator(); humOsc.type='sawtooth'; humOsc.frequency.value=42;
      const flt = ctx.createBiquadFilter(); flt.type='lowpass'; flt.frequency.value=140;
      humGain = ctx.createGain(); humGain.gain.value = 0.05;
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.13;
      const lfoG = ctx.createGain(); lfoG.gain.value = 20;
      lfo.connect(lfoG); lfoG.connect(flt.frequency);
      humOsc.connect(flt); flt.connect(humGain); humGain.connect(master);
      humOsc.start(); lfo.start();
    },
    shot(){ if(!ctx)return; const t=now();
      tone('square', 880, 140, 0.09, 0.35, t); noise(0.07, 0.25, t, 2500, 0.8); },
    hitConfirm(){ if(!ctx)return; tone('square', 1600, 1600, 0.04, 0.18, now()); },
    droneDie(){ if(!ctx)return; const t=now();
      tone('sawtooth', 300, 40, 0.35, 0.4, t); noise(0.3, 0.3, t, 700, 0.6); },
    alert(){ if(!ctx)return; const t=now();
      tone('sawtooth', 220, 660, 0.22, 0.3, t); },
    sentryCharge(){ if(!ctx)return; const t=now();
      tone('sine', 300, 1200, 0.6, 0.22, t); },
    hunterStep(d){ if(!ctx)return; const t=now(), v=.5*Math.max(.12, 1 - (d||0)/30);
      tone('sine', 58, 30, .4, v, t); noise(.28, v*.6, t, 140, .7); tone('sawtooth', 210, 260, .22, v*.08, t+.05); },
    hunterStomp(){ if(!ctx)return; const t=now();
      tone('sine', 50, 22, .9, .95, t); noise(.7, .75, t, 90, .5); noise(.35, .3, t, 700, .8); },
    hunterBlast(){ if(!ctx)return; const t=now();
      noise(.32, .75, t, 2600, .6); tone('sawtooth', 190, 38, .5, .5, t); noise(.9, .5, t+.03, 150, .4); },
    hunterServo(){ if(!ctx)return; const t=now();
      tone('sawtooth', 150, 240, .55, .09, t); tone('square', 610, 700, .42, .045, t+.04); },
    hunterRoar(){ if(!ctx)return; const t=now();
      tone('sawtooth', 112, 52, 1.4, .34, t); tone('square', 74, 47, 1.5, .18, t); noise(1.2, .3, t, 420, .6); },
    ping(){ if(!ctx)return; const t=now(); tone('triangle', 2700, 2150, .09, .12, t); },
    steam(){ if(!ctx)return; const t=now(); noise(2.4, .55, t, 3200, .3); noise(2.1, .32, t, 900, .5); },
    burst(){ if(!ctx)return; const t=now(); tone('square', 900, 300, .06, .1, t); noise(.05, .16, t, 2500, 1); },
    sentryFire(){ if(!ctx)return; const t=now();
      tone('sawtooth', 700, 120, 0.18, 0.35, t); noise(0.12, 0.2, t, 1800, 1); },
    hurt(){ if(!ctx)return; const t=now();
      noise(0.18, 0.5, t, 300, 0.5); tone('sine', 120, 60, 0.2, 0.5, t); },
    windStart(){
      init(); if (this._wind) return;
      const len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i=0;i<len;i++) d[i] = Math.random()*2-1;
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      const flt = ctx.createBiquadFilter(); flt.type='lowpass'; flt.frequency.value=460;
      const g = ctx.createGain(); g.gain.value = .05;
      const lfo = ctx.createOscillator(); lfo.frequency.value = .17;
      const lg = ctx.createGain(); lg.gain.value = .02;
      lfo.connect(lg); lg.connect(g.gain);
      src.connect(flt); flt.connect(g); g.connect(master);
      src.start(); lfo.start();
      this._wind = { src, lfo, g };
    },
    windStop(){
      if (!this._wind) return;
      this._wind.g.gain.setTargetAtTime(0.0001, now(), .4);
      const w = this._wind; this._wind = null;
      setTimeout(()=>{ try{ w.src.stop(); w.lfo.stop(); }catch(e){} }, 1500);
    },
    radioBlip(){ if(!ctx)return; const t=now();
      tone('square', 1046, 1046, 0.05, 0.12, t); tone('square', 1568, 1568, 0.05, 0.12, t+0.08); },
    checkpoint(){ if(!ctx)return; const t=now();
      tone('sine', 523, 523, 0.1, 0.25, t); tone('sine', 784, 784, 0.16, 0.25, t+0.11); },
    doorOpen(){ if(!ctx)return; const t=now();
      tone('sawtooth', 90, 55, 0.9, 0.25, t); noise(0.8, 0.12, t, 400, 0.4); },
    hatchStinger(){ if(!ctx)return; const t=now();
      noise(0.16, 0.85, t, 2200, 0.55);
      noise(0.5, 0.7, t, 110, 0.4);
      tone('sawtooth', 96, 32, 0.55, 0.62, t);
      tone('square', 880, 140, 0.09, 0.22, t);
      tone('sine', 52, 28, 0.7, 0.75, t); },
    plantTick(){ if(!ctx)return; tone('square', 988, 988, 0.03, 0.12, now()); },
    planted(){ if(!ctx)return; const t=now();
      [523,659,784,1046].forEach((f,i)=>tone('sine',f,f,0.14,0.25,t+i*0.09)); },
    alarmStart(){
      init(); if (alarmTimer) return;
      let hi = false;
      alarmTimer = setInterval(()=>{ tone('square', hi?540:404, hi?540:404, 0.28, 0.1, now()); hi=!hi; }, 460);
    },
    alarmStop(){ if (alarmTimer){ clearInterval(alarmTimer); alarmTimer = null; } },
    death(){ if(!ctx)return; const t=now();
      tone('sawtooth', 200, 30, 1.2, 0.4, t); noise(1.0, 0.3, t, 200, 0.4); },
    extract(){ if(!ctx)return; const t=now();
      tone('sine', 220, 880, 1.6, 0.2, t); tone('sine', 330, 1320, 1.6, 0.12, t); },
  };
})();

/* ============================================================
   Generative music. A dark ambient score composed live by the
   game, zero audio assets. Three intensities crossfade with the
   situation; each chapter plays in its own key.
   ============================================================ */
const MusicSys = (() => {
  let ctx=null, out=null, padGain=null, padFilter=null, arpGain=null, percGain=null,
      delay=null, timer=null, step=0, mode='calm', muted=false, running=false;
  const ROOT = ({ ep1:65.41, ch_taken:73.42, ch_ghost:55.0, ch_together:110.0, ch_lone:82.41, ch_conduits:61.74, ch_harvest:69.3, ch_steel:58.27, ch1:73.42, ch2:110.0, ch3:82.41 })[CH.id] || 65.41;
  const SCALE = [0,3,5,7,10,12,15,19];            // minor pentatonic, two octaves
  const MODES = {
    calm:   { pad:.05,  arp:.05, perc:0,    stepDur:.42, density:.20 },
    combat: { pad:.06,  arp:.07, perc:.05,  stepDur:.30, density:.45 },
    alarm:  { pad:.075, arp:.09, perc:.09,  stepDur:.22, density:.70 },
  };
  let stepDur=.42, density=.2;
  function applyMode(m, hard){
    mode = m;
    const p = MODES[m], t = ctx.currentTime, k = hard ? .01 : 1.1;
    padGain.gain.setTargetAtTime(p.pad, t, k);
    arpGain.gain.setTargetAtTime(p.arp, t, k);
    percGain.gain.setTargetAtTime(p.perc, t, k);
    stepDur = p.stepDur; density = p.density;
  }
  function start(){
    if (running) return;
    running = true;
    ctx = AudioSys.getCtx();
    out = ctx.createGain(); out.gain.value = muted ? 0 : (MusicSys._vol || 1); out.connect(ctx.destination);
    // pad: two detuned saws under a slowly breathing lowpass
    padGain = ctx.createGain(); padGain.gain.value = 0;
    padFilter = ctx.createBiquadFilter();
    padFilter.type = 'lowpass'; padFilter.frequency.value = 380; padFilter.Q.value = .9;
    [0.994, 1.006].forEach(dt => {
      const o = ctx.createOscillator();
      o.type = 'sawtooth'; o.frequency.value = ROOT * dt;
      o.connect(padFilter); o.start();
    });
    const lfo = ctx.createOscillator(); lfo.frequency.value = .05;
    const lg = ctx.createGain(); lg.gain.value = 170;
    lfo.connect(lg); lg.connect(padFilter.frequency); lfo.start();
    padFilter.connect(padGain); padGain.connect(out);
    // echo bus for the motif plucks
    delay = ctx.createDelay(1); delay.delayTime.value = .34;
    const fb = ctx.createGain(); fb.gain.value = .42;
    delay.connect(fb); fb.connect(delay);
    arpGain = ctx.createGain(); arpGain.gain.value = 0;
    delay.connect(arpGain); arpGain.connect(out);
    percGain = ctx.createGain(); percGain.gain.value = 0; percGain.connect(out);
    applyMode('calm', true);
    tick();
  }
  function pluck(t){
    const f = ROOT * 2 * Math.pow(2, SCALE[Math.floor(Math.random()*SCALE.length)] / 12);
    const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
    const g = ctx.createGain();
    g.gain.setValueAtTime(.0001, t);
    g.gain.linearRampToValueAtTime(.5, t + .012);
    g.gain.exponentialRampToValueAtTime(.0001, t + .55);
    o.connect(g); g.connect(delay); g.connect(arpGain);
    o.start(t); o.stop(t + .6);
  }
  function thump(t, f0, f1, dur, peak){
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + .008);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(percGain);
    o.start(t); o.stop(t + dur + .05);
  }
  function tickNoise(t){
    const len = Math.ceil(ctx.sampleRate * .05);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i=0;i<len;i++) d[i] = Math.random()*2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const flt = ctx.createBiquadFilter();
    flt.type = 'highpass'; flt.frequency.value = 4200;
    const g = ctx.createGain();
    g.gain.setValueAtTime(.5, t);
    g.gain.exponentialRampToValueAtTime(.0001, t + .05);
    src.connect(flt); flt.connect(g); g.connect(percGain);
    src.start(t); src.stop(t + .08);
  }
  function tick(){
    if (!running) return;
    const t = ctx.currentTime;
    if (Math.random() < density || step % 8 === 0) pluck(t);
    if (step % 8 === 0){                       // sub-bass pulse each bar
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = ROOT / 2;
      const g = ctx.createGain();
      g.gain.setValueAtTime(.0001, t);
      g.gain.linearRampToValueAtTime(.09, t + .3);
      g.gain.exponentialRampToValueAtTime(.0001, t + 1.6);
      o.connect(g); g.connect(out);
      o.start(t); o.stop(t + 1.8);
    }
    if (mode !== 'calm'){
      if (step % 2 === 0) tickNoise(t);
      if (step % 4 === 0) thump(t, 92, 40, .17, .8);
      if (mode === 'alarm' && step % 8 === 4) thump(t, 140, 60, .2, .6);
    }
    step++;
    timer = setTimeout(tick, stepDur * 1000);
  }
  return {
    start,
    setMode(m){ if (running && m !== mode) applyMode(m); },
    stop(){
      if (!running) return;
      out.gain.setTargetAtTime(0, ctx.currentTime, .6);
      setTimeout(() => { running = false; clearTimeout(timer); }, 2500);
    },
    toggleMute(){
      muted = !muted;
      if (out) out.gain.setTargetAtTime(muted ? 0 : (MusicSys._vol || 1), ctx.currentTime, .05);
    },
    setVolume(v){
      MusicSys._vol = Math.max(0, Math.min(1, v));
      if (out && !muted) out.gain.setTargetAtTime(MusicSys._vol, ctx.currentTime, .05);
    },
    _vol: 1,
  };
})();

/* ============================================================
   Three.js scene
   ============================================================ */
const MGLOW = CH.palette.strip;   // machine light colour of this chapter
let glLost = false;
let glLostTimer = 0;
let hideLoadOnFrame = false;
function showLoad(text){
  let n = document.getElementById('loadBanner');
  if (!n){
    n = document.createElement('div');
    n.id = 'loadBanner';
    n.className = 'ctxBanner';
    n.setAttribute('role', 'status');
    document.body.appendChild(n);
  }
  n.textContent = text;
  n.style.display = 'block';
}
function hideLoad(){
  const n = document.getElementById('loadBanner');
  if (n) n.style.display = 'none';
}
function bindContextGuards(r){
  r.domElement.addEventListener('webglcontextlost', e => {
    // Recreating the potato context calls forceContextLoss on the discarded
    // canvas. That loss is not a player-facing reset.
    if (r !== renderer) return;
    e.preventDefault();
    glLost = true;
    showLoad('DISPLAY RESET. HOLD ON. PUTTING YOU BACK WHERE YOU WERE.');
    if (window.Waking) Waking.onContextLost();
    const playing = G.mode === 'play' || G.mode === 'story' || G.mode === 'paused' || G.mode === 'dead';
    if (playing){
      try {
        const pos = capturePos();
        sessionStorage.setItem('latm_resume', JSON.stringify(pos));
        sessionStorage.setItem('latm_autoload', '1');
      } catch (err) {}
    }
    clearTimeout(glLostTimer);
    glLostTimer = setTimeout(() => {
      if (!glLost) return;
      location.reload();
    }, 7000);
  }, false);
  r.domElement.addEventListener('webglcontextrestored', () => {
    if (r !== renderer) return;
    glLost = false;
    clearTimeout(glLostTimer);
    try { sessionStorage.removeItem('latm_autoload'); } catch (err) {}
    showLoad('DISPLAY BACK. ONE MOMENT.');
    hideLoadOnFrame = true;
  }, false);
}
function makeRenderer(antialias){
  const opts = {
    antialias: !!antialias,
    powerPreference: antialias ? 'high-performance' : 'low-power',
    alpha: false,
  };
  // Stencil is unused. Software GL pays for it on every clear.
  if (!antialias) opts.stencil = false;
  const r = new THREE.WebGLRenderer(opts);
  r.setPixelRatio(Math.min(window.devicePixelRatio || 1, Q.p.pr));
  r.setSize(window.innerWidth, window.innerHeight);
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = CH.palette.exposure || 1.24;
  // Low and med keep the shadow map on so a later step up to high can use it.
  // Potato leaves it off. The discarded probe context is not the live one.
  r.shadowMap.enabled = Q.level !== 'potato';
  r.shadowMap.type = THREE.PCFSoftShadowMap;
  bindContextGuards(r);
  return r;
}
let renderer = makeRenderer(Q.level !== 'potato');
{
  // The live context is the one that matters. If the probe missed a
  // software renderer, drop to potato before any world texture is built.
  const info = glRendererString(renderer.getContext());
  if (info) Q.renderer = info;
  if (!Q.forced && isSoftwareRenderer(Q.renderer)){
    Q.software = true;
    Q.auto = 'potato';
    if (Q.level !== 'potato'){
      Q.level = 'potato';
      Q.p = QP.potato;
      TEXN = Q.p.tex;
      const old = renderer;
      renderer = makeRenderer(false);
      try { old.dispose(); old.forceContextLoss(); } catch (e) {}
      const again = glRendererString(renderer.getContext());
      if (again) Q.renderer = again;
    }
  }
}
document.body.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(CH.palette.bg);
scene.fog = new THREE.FogExp2(CH.palette.fog, CH.palette.fogDensity || (CH.outdoor ? 0.022 : 0.034));

const camera = new THREE.PerspectiveCamera(72, window.innerWidth/window.innerHeight, 0.1, 120);
// Yaw/pitch rig: yawObj carries position + yaw, pitchObj carries pitch + camera.
const yawObj = new THREE.Object3D();
const pitchObj = new THREE.Object3D();
yawObj.add(pitchObj); pitchObj.add(camera); scene.add(yawObj);

// Lighting rig (Hive Infiltration). Few lights, each with a job; shader cost
// scales with light count, so the old per-room point lights are gone:
//   hemi   : cold ambient so shadows never go fully black
//   flash  : shadow-casting helmet flashlight (high tier), carries the look
//   lamp   : omni headlamp fill (the main light on low tier)
//   accent : one practical light that hops to the nearest wall fixture ahead
//   muzzle : short warm flash on every shot
//   core   : objective glow
const hemi = new THREE.HemisphereLight(CH.palette.hemi, 0x08090b, CH.palette.hemiI || .75);
scene.add(hemi);
const lamp = new THREE.PointLight(CH.palette.lamp, 24, 26, 1.55);
lamp.position.set(0, 0.1, 0);
yawObj.add(lamp);
const flash = new THREE.SpotLight(CH.palette.lamp, 95, 40, 1.0, .9, 1.5);
flash.position.set(.12, -.08, .15);
flash.target.position.set(0, -.05, -8);
flash.castShadow = false; flash.visible = false;
flash.shadow.bias = -.0004; flash.shadow.normalBias = .035;
flash.shadow.camera.near = .25; flash.shadow.camera.far = 34;
flash.shadow.radius = 3; flash.shadow.mapSize.set(1024, 1024);
camera.add(flash); camera.add(flash.target);
const accent = new THREE.PointLight(CH.palette.strip, 0, 15, 1.7);
scene.add(accent);
// muzzle flash light (intensity pulsed on fire, decays in updateFX)
const muzzleLight = new THREE.PointLight(0xffb36b, 0, 11, 2);
muzzleLight.position.set(.24, -.2, -.9);
camera.add(muzzleLight);
// objective glow
const coreLight = new THREE.PointLight(CH.palette.coreLight, 34, 30, 1.7);
coreLight.position.set(CH.objectivePos[0], CH.objectivePos[1] + 1, CH.objectivePos[2]);
scene.add(coreLight);

/* ============================================================
   Cinematic post-processing (Hive Infiltration): bloom, FXAA,
   chromatic aberration on hits, split-tone grade, vignette, grain.
   Lazy: the addon modules are only fetched when the active quality
   tier uses post (med/high). Low renders directly; a CSS vignette
   stands in.
   ============================================================ */
const postFX = { enabled:false, loaded:false, loading:false };
const FX = { ca:0, dmg:0, low:0 };   // live feedback values fed to the grade shader
function ensurePost(){
  if (postFX.loaded || postFX.loading) return;
  postFX.loading = true;
  (async () => {
    try {
      const [{ EffectComposer }, { RenderPass }, { UnrealBloomPass }, { ShaderPass }, { OutputPass }, { FXAAShader }] = await Promise.all([
        import('three/addons/postprocessing/EffectComposer.js'),
        import('three/addons/postprocessing/RenderPass.js'),
        import('three/addons/postprocessing/UnrealBloomPass.js'),
        import('three/addons/postprocessing/ShaderPass.js'),
        import('three/addons/postprocessing/OutputPass.js'),
        import('three/addons/shaders/FXAAShader.js'),
      ]);
      const G_ = CH.palette.grade || { sh:[.90,.98,1.08], hi:[1.10,1.02,.90] };
      const composer = new EffectComposer(renderer);
      const rp = new RenderPass(scene, camera);
      const bloom = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight), .6, .45, .72);
      const fxaa = new ShaderPass(FXAAShader);
      const grade = new ShaderPass({
        uniforms: {
          tDiffuse:{value:null}, uTime:{value:0}, uCA:{value:0}, uDmg:{value:0}, uLow:{value:0}, uGrain:{value:1},
          uShadow:{value:new THREE.Vector3(...G_.sh)}, uHigh:{value:new THREE.Vector3(...G_.hi)},
        },
        vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
        fragmentShader: `
          uniform sampler2D tDiffuse; uniform float uTime, uCA, uDmg, uLow, uGrain;
          uniform vec3 uShadow, uHigh; varying vec2 vUv;
          float rnd(vec2 c){ return fract(sin(dot(c, vec2(12.9898,78.233)))*43758.5453); }
          void main(){
            vec2 c = vUv - .5;
            float r2 = dot(c, c);
            vec2 off = c * (uCA + r2 * .0045);                       // edge-weighted chromatic aberration
            vec3 col = vec3(texture2D(tDiffuse, vUv + off).r,
                            texture2D(tDiffuse, vUv).g,
                            texture2D(tDiffuse, vUv - off).b);
            float l = dot(col, vec3(.2126,.7152,.0722));
            col *= mix(uShadow, uHigh, smoothstep(.08, .75, l));    // split toning: cold shadows, warm highlights
            col = (col - .5) * 1.10 + .5;                           // contrast
            col = max(col, 0.);
            float sat = 1.06 - uLow * .75;
            col = mix(vec3(dot(col, vec3(.2126,.7152,.0722))), col, sat);
            col = mix(col, col * vec3(1.35,.35,.35), uDmg * .55);   // hit tint
            col *= 1.0 - smoothstep(.30, .95, length(c) * 1.28) * (.55 + uLow * .25 + uDmg * .3);   // vignette
            col += (rnd(vUv*vec2(1287.,731.) + mod(uTime,9.)) - .5) * .045 * uGrain;     // film grain
            gl_FragColor = vec4(col, 1.);
          }`,
      });
      composer.addPass(rp); composer.addPass(bloom); composer.addPass(new OutputPass());
      composer.addPass(fxaa); composer.addPass(grade);
      Object.assign(postFX, { composer, renderPass:rp, grade, bloom, fxaa, loaded:true });
      applyQuality(Q.level);
    } catch (e) { /* addons unavailable: plain rendering */ }
  })();
}

/* ============================================================
   GLB hero models (author-generated). Lazy: fetched once the title
   is on screen (idle time), so they never block first paint. The
   code-built models remain as fallbacks if a file or the loader fails.
   ============================================================ */
const MODELS = {};
async function loadModels(){
  // GLB heroes are full PBR. Potato stays on the procedural meshes.
  if (Q.p.basic) return;
  try {
    const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
    const loader = new GLTFLoader();
    const defs = [
      ['crawler', 'models/crawler.glb', .80, -0.50,  0,     { eye:[0,.06,.42] }],
      ['sentry',  'models/sentry.glb',  .90,  0,     0,     { eye:[0,.02,.45], muzzle:[0,-.30,.42] }],
      ['warden',  'models/warden.glb', 1.30, -0.643, -0.104,{ eye:[0,.14,.66], muzzle:[0,-.30,.60] }],
      ['rifle',   'models/rifle.glb',  1.08,  0,     0,     {}],
    ];
    await Promise.all(defs.map(([kind, url, k, oy, oz, pts]) => new Promise(res => {
      loader.load(url, g => {
        const inner = g.scene;
        // keep the authored PBR materials; push them toward cold steel and recolour
        // the emitters to this chapter's machine light
        const tinted = new Map();
        inner.traverse(o => {
          if (o.isMesh && o.material){
            if (!tinted.has(o.material)){
              const m = o.material.clone(), nm = m.name;
              if (nm === 'green_glow'){
                m.color.set(MGLOW).multiplyScalar(.25); m.emissive.set(MGLOW); m.emissiveIntensity = 1.7;
              } else if (nm === 'screen'){
                m.color.set(MGLOW).multiplyScalar(.2); m.emissive.set(MGLOW); m.emissiveIntensity = 1.8;
              } else if (nm === 'glass'){
                m.transparent = true; m.opacity = .2; m.roughness = .05; m.metalness = 0; m.depthWrite = false; m.envMapIntensity = 1.8;
              } else if (nm === 'subject'){
                m.roughness = .85; m.color.multiplyScalar(.5);
              } else {
                m.color.multiply(new THREE.Color(.62,.66,.70));
                m.roughness = Math.min(.7, Math.max(.5, m.roughness + .05)); m.metalness = .8; m.envMapIntensity = 1.3;
              }
              patchSurface(m, { floorAO:.6, ceilAO:0, aoH:1.0, noise:false });
              tinted.set(o.material, m);
            }
            o.material = tinted.get(o.material);
          }
        });
        const wrap = new THREE.Group();
        if (kind === 'rifle'){
          inner.position.set(-0.131, -0.031, 0);   // recenter, then aim barrel down -Z
          wrap.rotation.y = -Math.PI/2;
        }
        wrap.add(inner);
        wrap.scale.setScalar(k);
        const outer = new THREE.Group();
        wrap.position.set(0, oy, oz);
        outer.add(wrap);
        MODELS[kind] = { template: outer, ...pts };
        res();
      }, undefined, () => res());
    })));
  } catch (e) { /* loader unavailable: procedural models remain */ }
}
const modelsReady = new Promise(res => {
  const go = () => loadModels().then(res, res);
  if (window.requestIdleCallback) requestIdleCallback(go, { timeout: 900 });
  else setTimeout(go, 300);
});

const GFX = { dust:null, shafts:[], ash:null };
const DECOR = [];
const EXTRA_LIGHTS = [];
function markDecor(o){ if (o){ o.userData.decor = 1; DECOR.push(o); } return o; }
function applyQuality(level){
  level = QLEVELS.includes(level) ? level : 'low';
  Q.level = level;
  const p = Q.p = QP[level];
  const w = window.innerWidth, h = window.innerHeight;
  // Potato's pr is already a hard cap (about 0.65). The governor's scale
  // can take it lower, down to pr * scaleFloor (about 0.26 at the floor).
  const pr = Math.min(window.devicePixelRatio || 1, p.pr * Q.scale);
  renderer.setPixelRatio(pr);
  renderer.setSize(w, h);
  const spot = !!p.shadows;
  if (p.basic) renderer.shadowMap.enabled = false;
  else if (spot) renderer.shadowMap.enabled = true;
  // Potato has no environment light. Lambert still divides by PI, so the
  // hemisphere has to carry the fill that IBL provides on the other tiers,
  // and the headlamp stays in the same range low uses or the car reads black.
  hemi.intensity = (CH.palette.hemiI || .75) * (p.basic ? 6 : (spot ? 1 : 1.5));
  renderer.toneMappingExposure = (CH.palette.exposure || 1.24) * (p.basic ? 1.18 : (p.post || spot ? 1 : 1.12));
  flash.visible = spot; flash.castShadow = spot;
  lamp.intensity = p.basic ? 46 : (spot ? 14 : 42);
  accent.visible = !!p.accent && !p.basic;
  if (p.basic && muzzleLight.intensity <= 0) muzzleLight.visible = false;
  EXTRA_LIGHTS.forEach(L => { L.visible = !p.basic; });
  if (GFX.dust){
    GFX.dust.visible = p.dust > 0;
    if (p.dust > 0) GFX.dust.geometry.setDrawRange(0, p.dust);
  }
  GFX.shafts.forEach((m,i) => { m.visible = i < p.shafts; });
  DECOR.forEach(o => { o.visible = p.decor !== 0; });
  if (p.post && !postFX.loaded) ensurePost();
  postFX.enabled = postFX.loaded && !!p.post;
  if (postFX.loaded){
    postFX.composer.setPixelRatio(pr);
    postFX.composer.setSize(w, h);
    postFX.bloom.strength = p.bloom;
    postFX.fxaa.enabled = !!p.fxaa;
    postFX.fxaa.material.uniforms.resolution.value.set(1/(w*pr), 1/(h*pr));
  }
  document.body.classList.toggle('postfx', postFX.enabled);
  G._fpsT = 0; G._fpsN = 0; G._fpsSkip = 1; G._fpsGood = 0; G._fpsBad = 0;
  refreshGfxButton();
  Cinematic.onQuality();
}

// Runtime governor: samples fps in 2.5s windows while playing.
// Two bad windows in a row step quality down (and remember it for this device).
// Low that is still under the floor drops into potato. Potato then
// scales pixel ratio down to its floor. A phone that sits at 57+ fps
// for three windows is promoted one tier, once. Software renderers
// are not promoted back up.
function governor(nowT){
  if (!G._fpsT){ G._fpsT = nowT; G._fpsN = 0; return; }
  G._fpsN++;
  const span = nowT - G._fpsT;
  if (span < 2500) return;
  const fps = G._fpsN / (span / 1000);
  G._fpsT = nowT; G._fpsN = 0;
  if (span > 6000) return;               // tab was hidden or a long hitch; ignore
  if (G._fpsSkip > 0){ G._fpsSkip--; return; }
  Q.fps = fps;
  const floorFps = Q.level === 'potato' ? 20 : (IS_TOUCH ? 30 : 42);
  if (fps < floorFps){
    G._fpsGood = 0;
    if (++G._fpsBad < 2) return;
    G._fpsBad = 0;
    Q.noUp = true;
    const i = QLEVELS.indexOf(Q.level);
    if (i > 0){
      const nl = QLEVELS[i-1];
      try { localStorage.setItem('waking_qcap', nl); } catch(e){}
      Q.scale = 1;
      applyQuality(nl);
    } else {
      const floor = Q.p.scaleFloor != null ? Q.p.scaleFloor : 0.62;
      if (Q.scale > floor + 0.001){
        Q.scale = Math.max(floor, Q.scale * 0.85);
        applyQuality(Q.level);
      }
    }
  } else if (fps > 56 && !Q.noUp && !Q.software){
    G._fpsBad = 0;
    const cap = Q.phone ? 'med' : 'high';
    if (++G._fpsGood >= 3 && QLEVELS.indexOf(Q.level) < QLEVELS.indexOf(cap)){
      Q.noUp = true;   // one promotion only: no flip-flopping
      applyQuality(QLEVELS[QLEVELS.indexOf(Q.level) + 1]);
    }
  } else { G._fpsBad = 0; }
}

function renderFrame(sc, cm){
  if (postFX.enabled){
    postFX.renderPass.scene = sc; postFX.renderPass.camera = cm;
    const u = postFX.grade.uniforms;
    u.uTime.value = G.time; u.uCA.value = FX.ca; u.uDmg.value = FX.dmg; u.uLow.value = FX.low;
    if (u.uGrain) u.uGrain.value = (window.Waking && Waking.reducedMotion()) ? 0 : 1;
    postFX.composer.render();
  } else {
    renderer.render(sc, cm);
  }
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  applyQuality(Q.level);
});

/* ============================================================
   Sky: one shared loader for sky.jpg and a pinch-free sky dome.
   The old dome wrapped the photo around a UV sphere, which smeared
   it and pinched it to a point overhead. This shader maps the photo
   as a cylindrical horizon band (the painted ruins and fires sit on
   the horizon) and fills everything above with a projected smoke
   deck, so no direction ever converges to a point.
   ============================================================ */
let SKY_IMG_P = null;
function skyImage(){
  if (!SKY_IMG_P) SKY_IMG_P = new Promise(res => {
    new THREE.ImageLoader().load('sky.jpg', img => res(img), undefined, () => res(null));
  });
  return SKY_IMG_P;
}
const SKY_VS = `varying vec3 vDir;
void main(){ vDir = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.); gl_Position = p; }`;
const SKY_FS = `uniform sampler2D uSky; uniform float uHas, uTime, uGain; uniform vec3 uTop, uHaze, uDeck;
varying vec3 vDir;
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(h21(i), h21(i+vec2(1.,0.)), f.x), mix(h21(i+vec2(0.,1.)), h21(i+vec2(1.,1.)), f.x), f.y); }
float fbm(vec2 p){ float a = .5, s = 0.; for (int i=0;i<4;i++){ s += vn(p)*a; p = p*2.03 + 17.1; a *= .5; } return s; }
void main(){
  vec3 d = normalize(vDir);
  float e = asin(clamp(d.y, -1., 1.));                      // elevation, radians
  float az = atan(d.x, -d.z);
  // horizon band: the photo wrapped once, no mirrored copies, so the seam is not doubled
  vec2 bu = vec2(fract(az / 6.2831853), clamp(.27 + e * 57.2958 / 52., .003, .997));
  vec3 band = uHas > .5 ? texture2D(uSky, bu).rgb : mix(uHaze, uTop, smoothstep(0., .7, e));
  // overhead smoke deck: a gentle projection (smooth at the zenith, no radial
  // streaks), domain-warped noise so it reads as rolling smoke
  vec2 pp = d.xz / (max(d.y, 0.) + .55) * 1.6;
  vec2 q = vec2(fbm(pp + vec2(uTime*.02, 0.)), fbm(pp + vec2(5.2, 1.3) - uTime*.01));
  float n = fbm(pp * 1.3 + q * 1.7);
  vec3 deck = mix(uTop, uDeck, smoothstep(.30, .70, n));
  deck = mix(deck, vec3(.62,.22,.10), smoothstep(.62, .85, n) * .55 * (1. - smoothstep(.5, 1.3, e)));
  deck *= mix(1., .6, smoothstep(.7, 1.45, e));             // darker overhead
  float k = smoothstep(.30, .64, e);
  vec3 col = mix(band, deck, k) * uGain;
  gl_FragColor = vec4(col, 1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
// Potato keeps the horizon photo and drops the 4-octave smoke fbm.
const SKY_FS_FAST = `uniform sampler2D uSky; uniform float uHas, uGain; uniform vec3 uTop, uHaze;
varying vec3 vDir;
void main(){
  vec3 d = normalize(vDir);
  float e = asin(clamp(d.y, -1., 1.));
  float az = atan(d.x, -d.z);
  vec2 bu = vec2(fract(az / 6.2831853), clamp(.27 + e * 57.2958 / 52., .003, .997));
  vec3 band = uHas > .5 ? texture2D(uSky, bu).rgb : mix(uHaze, uTop, smoothstep(0., .7, e));
  vec3 top = mix(uTop, uHaze, .35);
  vec3 col = mix(band, top, smoothstep(.22, .7, e)) * uGain;
  gl_FragColor = vec4(col, 1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
function makeSkyDome(radius){
  const cheap = !!Q.p.basic;
  const mat = new THREE.ShaderMaterial({
    vertexShader: SKY_VS, fragmentShader: cheap ? SKY_FS_FAST : SKY_FS, side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uSky:{ value:null }, uHas:{ value:0 }, uTime:{ value:0 }, uGain:{ value: cheap ? 1.05 : 1.25 },
      uTop:{ value:new THREE.Color(0x1a0705) }, uHaze:{ value:new THREE.Color(0x6e2414) }, uDeck:{ value:new THREE.Color(0x5a1a0e) } },
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(radius, cheap ? 16 : 32, cheap ? 10 : 20), mat);
  dome.frustumCulled = false; dome.renderOrder = -10;
  skyImage().then(img => {
    if (!img) return;
    const tx = new THREE.Texture(img); tx.colorSpace = THREE.SRGBColorSpace;
    tx.anisotropy = 4; tx.needsUpdate = true;
    mat.uniforms.uSky.value = tx; mat.uniforms.uHas.value = 1;
  });
  return dome;
}

/* ============================================================
   Opening cinematic (chapter 1). The book's first scene,
   "Awakening in Rust", rendered in-engine. Tightened to ~17 s,
   prebuilt and shader-compiled while the title is showing so ENTER
   starts it instantly, and skippable at any moment (SKIP, click,
   tap or any key).
   ============================================================ */
const Cinematic = (() => {
  let cScene=null, cCam=null, t=0, active=false, onDone=null, subIdx=-1, built=false;
  let ash=null, smokes=[], patrols=[], hunter=null, fires=[], dome=null, flashed=false, alerted=false;
  const END = 17.2;
  const SUBS = [
    [0.5,  3.6,  "Marcus tasted copper as he came to."],
    [3.9,  7.3,  "The sky was the color of old blood, streaked with smoke from unseen fires."],
    [7.6,  10.3, "The city he remembered was gone."],
    [10.6, 13.2, "The machines were not."],
    [13.5, 16.2, "Then the light found him."],
  ];
  const smooth = k => k<=0?0:k>=1?1:k*k*(3-2*k);
  function cinTex(draw, size=256){
    const c = document.createElement('canvas'); c.width=c.height=size;
    draw(c.getContext('2d'), size);
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
    return tx;
  }
  // world-scaled UVs so one facade texture tiles correctly on every building size
  function worldUV(geo, tw, th){
    const P = geo.attributes.position, Nn = geo.attributes.normal, U = geo.attributes.uv;
    for (let i=0;i<P.count;i++){
      const x = P.getX(i), y = P.getY(i), z = P.getZ(i);
      const nx = Math.abs(Nn.getX(i)), ny = Math.abs(Nn.getY(i));
      if (ny > .5) U.setXY(i, x/tw, z/tw);
      else if (nx > .5) U.setXY(i, z/tw, y/th);
      else U.setXY(i, x/tw, y/th);
    }
    U.needsUpdate = true;
    return geo;
  }
  function build(){
    if (built) return;
    built = true;
    const R = rngOf(4242);
    cScene = new THREE.Scene();
    // fog matches the horizon haze, so distant ruins dissolve into the sky
    cScene.fog = new THREE.FogExp2(0x4a2216, .0072);
    cCam = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, .1, 800);
    cCam.rotation.order = 'YXZ';
    dome = makeSkyDome(520);
    cScene.add(dome);
    cScene.add(new THREE.HemisphereLight(0xa8705a, 0x2a1810, 2.0));
    const sun = new THREE.DirectionalLight(0xff7448, 1.6);   // low burning sun behind the skyline: rim light
    sun.position.set(-60, 22, -120); cScene.add(sun);
    const fill = new THREE.DirectionalLight(0xa0583a, 1.1);
    fill.position.set(40, 30, 60); cScene.add(fill);

    // ground: ash, gravel and broken asphalt (PBR, world-tiled)
    const GROUND = makePBR(L => {
      const { a,h,o,R:r } = L, S = 512;
      a.fillStyle = '#3e322b'; a.fillRect(0,0,S,S);
      o.fillStyle = ormc(.95,.02); o.fillRect(0,0,S,S);
      for (let i=0;i<2200;i++){
        const x = r()*S, y = r()*S, rr = 1 + r()*r()*9, v = 40 + r()*70;
        a.fillStyle = `rgba(${v+14|0},${v|0},${v-8|0},${.35 + r()*.5})`; a.beginPath(); a.arc(x,y,rr,0,7); a.fill();
        h.fillStyle = gray(130 + r()*110); h.beginPath(); h.arc(x,y,rr,0,7); h.fill();
      }
      for (let i=0;i<14;i++){                                   // asphalt slabs and cracks
        const x = r()*S, y = r()*S, w = 40 + r()*120, hh = 30 + r()*90;
        a.fillStyle = 'rgba(14,12,11,.55)'; a.fillRect(x,y,w,hh);
        h.fillStyle = gray(150); h.fillRect(x,y,w,hh);
        h.strokeStyle = gray(30); h.lineWidth = 2; h.beginPath(); h.moveTo(x,y+r()*hh); h.lineTo(x+w,y+r()*hh); h.stroke();
      }
      weather(L, 10, false);
    }, 61, { nstr:3.4 });
    const gtile = 6;
    ['map','normal','orm'].forEach(k => GROUND[k].repeat.set(600/gtile, 600/gtile));
    const gnd = new THREE.Mesh(new THREE.PlaneGeometry(600,600), litMat({
      map:GROUND.map, normalMap:GROUND.normal, roughnessMap:GROUND.orm, roughness:1, metalness:0 }));
    gnd.rotation.x = -Math.PI/2; cScene.add(gnd);

    // rubble: concrete chunks with the facade texture, instanced
    const FACADE = makePBR(L => {
      const { a,h,o,e,R:r } = L, S = 512;
      const g = a.createLinearGradient(0,0,0,S);
      g.addColorStop(0,'#7a6e64'); g.addColorStop(1,'#544a42');
      a.fillStyle = g; a.fillRect(0,0,S,S);
      o.fillStyle = ormc(.92,.05); o.fillRect(0,0,S,S);
      // floor slabs
      for (let y=0;y<S;y+=128){ a.fillStyle = 'rgba(0,0,0,.35)'; a.fillRect(0,y+112,S,16); h.fillStyle = gray(190); h.fillRect(0,y+112,S,16); }
      // window grid: blown out, a few still burning
      for (let gy=0; gy<4; gy++) for (let gx=0; gx<4; gx++){
        const x = 30 + gx*128, y = 30 + gy*128, w = 64, hh = 54;
        const broken = r() < .35;
        a.fillStyle = '#060504'; a.fillRect(x,y,w,hh);
        h.fillStyle = gray(20); h.fillRect(x,y,w,hh);
        o.fillStyle = ormc(1,0); o.fillRect(x,y,w,hh);
        if (broken){                                              // torn edge of the opening
          a.fillStyle = 'rgba(70,58,50,1)';
          for (let k=0;k<6;k++){ a.beginPath(); a.moveTo(x + r()*w, y); a.lineTo(x + r()*w, y + r()*hh*.5); a.lineTo(x + r()*w, y); a.fill(); }
        } else {
          a.strokeStyle = 'rgba(20,18,16,.9)'; a.lineWidth = 4; a.strokeRect(x,y,w,hh);
          a.beginPath(); a.moveTo(x+w/2,y); a.lineTo(x+w/2,y+hh); a.stroke();
        }
        const lit = r();
        if (lit < .09){ const fg = e.createLinearGradient(0,y+hh,0,y); fg.addColorStop(0,'#ff8a3a'); fg.addColorStop(1,'#401206');
          e.fillStyle = fg; e.fillRect(x+4,y+hh*.35,w-8,hh*.65); }
        else if (lit < .14){ e.fillStyle = 'rgba(231,201,138,.35)'; e.fillRect(x+6,y+6,w-12,hh-12); }
        // soot climbing out of the window
        if (r() < .4){ const sg = a.createLinearGradient(0,y,0,y-40); sg.addColorStop(0,'rgba(0,0,0,.45)'); sg.addColorStop(1,'rgba(0,0,0,0)');
          a.fillStyle = sg; a.fillRect(x-4,y-40,w+8,40); }
      }
      weather(L, 12, true);
    }, 62, { emissive:true, nstr:2.8 });
    const facadeMat = litMat({
      map:FACADE.map, normalMap:FACADE.normal, roughnessMap:FACADE.orm, roughness:1, metalness:.05,
      emissiveMap:FACADE.emissive, emissive:new THREE.Color(0xffffff), emissiveIntensity:1.4 });
    const steelMat = litMat({ color:0x2a2220, roughness:.55, metalness:.85 });
    {
      const geo = new THREE.DodecahedronGeometry(1, 0), N = Q.p.basic ? 18 : 90;
      const rubMat = litMat({ map:FACADE.map, normalMap:FACADE.normal, roughnessMap:FACADE.orm, roughness:1, metalness:.05, flatShading:true });
      const rub = new THREE.InstancedMesh(geo, rubMat, N), dm = new THREE.Object3D();
      for (let i=0;i<N;i++){
        const a = R()*Math.PI*2, r = 5.5 + R()*32, sc = .2 + R()*R()*1.5;
        dm.position.set(Math.sin(a)*r, sc*.25, Math.cos(a)*r);
        dm.scale.set(sc*(.8+R()), sc*(.4+R()*.5), sc*(.7+R()));
        dm.rotation.set(R()*6, R()*6, R()*6); dm.updateMatrix(); rub.setMatrixAt(i, dm.matrix);
      }
      cScene.add(rub);
      // twisted rebar and girders poking out of the rubble
      const gb = new THREE.BoxGeometry(.12, 1, .12);
      const barN = Q.p.basic ? 8 : 40;
      const bars = new THREE.InstancedMesh(gb, steelMat, barN);
      for (let i=0;i<barN;i++){
        const a = R()*Math.PI*2, r = 6 + R()*28, l = 1 + R()*3.5;
        dm.position.set(Math.sin(a)*r, l*.35, Math.cos(a)*r);
        dm.scale.set(1 + R()*2, l, 1 + R()*2);
        dm.rotation.set((R()-.5)*1.4, R()*6, (R()-.5)*1.4); dm.updateMatrix(); bars.setMatrixAt(i, dm.matrix);
      }
      cScene.add(bars);
    }
    // ruined skyline: broken towers with jagged crowns, exposed girders and burning windows
    for (let i=0;i<24;i++){
      const a = i/24*Math.PI*2 + R()*.18;
      const r = 70 + R()*80;
      const h = 14 + R()*40, w = 8 + R()*12, d = 8 + R()*12;
      const tower = new THREE.Group();
      const body = new THREE.Mesh(worldUV(new THREE.BoxGeometry(w, h, d), 14, 18), facadeMat);
      body.position.y = h/2; tower.add(body);
      const crowns = 1 + (R()*3|0);                             // jagged, half-collapsed upper floors
      for (let k=0;k<crowns;k++){
        const cw = w*(.25 + R()*.45), ch = 2 + R()*9, cd = d*(.3 + R()*.6);
        const c = new THREE.Mesh(worldUV(new THREE.BoxGeometry(cw, ch, cd), 14, 18), facadeMat);
        c.position.set((R()-.5)*(w-cw), h + ch/2 - .2, (R()-.5)*(d-cd));
        c.rotation.z = (R()-.5)*.08; tower.add(c);
      }
      for (let k=0;k<3;k++){                                    // girders where the floors fell away
        const gl = 3 + R()*8;
        const g = new THREE.Mesh(new THREE.BoxGeometry(.5, gl, .5), steelMat);
        g.position.set((R()-.5)*w*.9, h + gl/2 - .5, (R()-.5)*d*.9);
        g.rotation.set((R()-.5)*.5, 0, (R()-.5)*.6); tower.add(g);
      }
      tower.position.set(Math.sin(a)*r, -R()*3, Math.cos(a)*r);
      tower.rotation.set(0, R()*Math.PI, (R()-.5)*.1);
      cScene.add(tower);
      if (R() < .5) fires.push([tower.position.x*.92, 1.5 + R()*h*.4, tower.position.z*.92]);
    }
    // the hive spire on the horizon (where the camera ends up): dark steel, glowing seams
    {
      const seam = cinTex((g,s) => {
        g.fillStyle = '#000'; g.fillRect(0,0,s,s);
        g.fillStyle = hexCol(MGLOW);
        for (let i=0;i<9;i++){ const x = (i/9)*s + 6; g.globalAlpha = .55 + Math.random()*.45; g.fillRect(x, 0, 2, s); }
        for (let i=0;i<26;i++){ g.globalAlpha = .9; g.fillRect(Math.random()*s, Math.random()*s, 5, 2); }
      });
      seam.wrapS = seam.wrapT = THREE.RepeatWrapping; seam.repeat.set(3, 5);
      const spire = new THREE.Mesh(new THREE.CylinderGeometry(6, 19, 96, 6, 1),
        litMat({ color:0x15181a, roughness:.45, metalness:.85,
          emissiveMap:seam, emissive:new THREE.Color(0xffffff), emissiveIntensity:1.1 }));
      spire.position.set(112, 48, -44); cScene.add(spire);
    }
    // fires at the foot of the ruins (additive, flickered in update)
    const fireTex = cinTex((g,s) => {
      const d = g.createRadialGradient(s/2,s*.62,2,s/2,s*.62,s*.5);
      d.addColorStop(0,'rgba(255,220,150,1)'); d.addColorStop(.25,'rgba(255,120,40,.8)'); d.addColorStop(1,'rgba(120,20,0,0)');
      g.fillStyle = d; g.fillRect(0,0,s,s);
    }, 128);
    const fireMat = new THREE.SpriteMaterial({ map:fireTex, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false, fog:false, opacity:.85 });
    if (Q.p.basic && fires.length > 5) fires.length = 5;
    fires = fires.map(([x,y,z]) => { const sp = new THREE.Sprite(fireMat.clone()); sp.position.set(x,y,z); sp.scale.set(9,7,1); cScene.add(sp); return sp; });
    // smoke streamers: camera-facing sprites, never seen edge-on
    const smokeTex = cinTex((g,s)=>{
      g.clearRect(0,0,s,s);
      for (let i=0;i<9;i++){
        const x=s*.15+Math.random()*s*.7, y=s*.3+Math.random()*s*.4, r=s*(.12+Math.random()*.16);
        const d=g.createRadialGradient(x,y,1,x,y,r);
        d.addColorStop(0,'rgba(28,16,12,.55)'); d.addColorStop(1,'rgba(28,16,12,0)');
        g.fillStyle=d; g.beginPath(); g.arc(x,y,r,0,7); g.fill();
      }
    });
    const smokeMat = new THREE.SpriteMaterial({ map:smokeTex, transparent:true, opacity:.7, depthWrite:false, fog:false });
    const smokeN = Q.p.basic ? 2 : 8;
    for (let i=0;i<smokeN;i++){
      const p = new THREE.Sprite(smokeMat);
      p.position.set(-120+R()*240, 26+R()*30, -140+R()*160);
      p.scale.set(90, 28, 1);
      cScene.add(p); smokes.push(p);
    }
    // falling ash (count follows the quality tier; potato draws none)
    if (Q.p.ash > 0){
      const n=420, pos=new Float32Array(n*3);
      for (let i=0;i<n;i++){
        pos[i*3]=(R()-.5)*90; pos[i*3+1]=R()*45; pos[i*3+2]=(R()-.5)*90;
      }
      const g2 = new THREE.BufferGeometry();
      g2.setAttribute('position', new THREE.BufferAttribute(pos,3));
      ash = new THREE.Points(g2, new THREE.PointsMaterial({ color:0xa89482, size:.14, map:SOFT_TEX,
        transparent:true, opacity:.7, depthWrite:false }));
      ash.frustumCulled = false;
      ash.geometry.setDrawRange(0, Q.p.ash);
      cScene.add(ash);
    }
    // patrol drones with searchlight beams
    const beamMat = new THREE.MeshBasicMaterial({ color:0xff3322, transparent:true,
      opacity:.12, blending:THREE.AdditiveBlending, depthWrite:false, fog:false });
    const bodyMat = litMat({ color:0x1a1614, roughness:.4, metalness:.85 });
    const eyeMat = new THREE.MeshBasicMaterial({ color:0xff3322 });
    function mkDrone(bm){
      const g3 = new THREE.Group();
      const bodySeg = Q.p.basic ? 8 : 14;
      const body = new THREE.Mesh(new THREE.SphereGeometry(1.1, bodySeg, Q.p.basic ? 6 : 10), bodyMat);
      body.scale.set(1.4,.7,1.4);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(.3, Q.p.basic ? 6 : 8, Q.p.basic ? 4 : 6), eyeMat);
      eye.position.y = -.5;
      const beam = new THREE.Mesh(new THREE.ConeGeometry(4.2, 26, Q.p.basic ? 6 : 16, 1, true), bm);
      beam.position.y = -13.5;
      g3.add(body, eye, beam);
      g3.userData.beam = beam;
      cScene.add(g3);
      return g3;
    }
    for (let i=0;i<3;i++){ patrols.push(mkDrone(beamMat)); }
    hunter = mkDrone(beamMat.clone());
    hunter.visible = false;
    pose(0);
  }
  // prebuild + compile while the title is up, so ENTER starts instantly
  function prewarm(){
    try {
      build();
      cCam.aspect = window.innerWidth/window.innerHeight; cCam.updateProjectionMatrix();
      if (renderer.compileAsync && renderer.extensions.has('KHR_parallel_shader_compile')) return renderer.compileAsync(cScene, cCam).catch(()=>{});
      renderer.compile(cScene, cCam);
    } catch(e){}
    return Promise.resolve();
  }
  function start(done){
    onDone = done; t = 0; subIdx = -1; flashed = false; alerted = false;
    build();
    cCam.aspect = window.innerWidth/window.innerHeight; cCam.updateProjectionMatrix();
    active = true;
    el.fade.style.transition = 'none';
    el.fade.style.background = '#000';
    el.fade.style.opacity = 1;
    AudioSys.windStart();
  }
  function teardown(){
    if (!active) return;
    active = false;
    AudioSys.windStop();
    el.introText.style.opacity = 0;
  }
  function pose(tt){
    const yawAB = .04*Math.sin(tt*.4);
    let pitch, yaw = .12 + yawAB, y = .55;
    if (tt < 3.5){ pitch = .62 + Math.sin(tt*.8)*.02; }
    else if (tt < 7){ const k = smooth((tt-3.5)/3.5); pitch = .62 - k*.56; y = .55 + k*1.05; }
    else if (tt < 10.5){ const k = smooth((tt-7)/3.5); pitch = .06; y = 1.6; yaw = .12 + .8*k; }
    else if (tt < 13.5){ const k = smooth((tt-10.5)/3); pitch = .06 + k*.06; y = 1.6; yaw = .92 - 1.7*k; }
    else { const k = smooth((tt-13.5)/3); pitch = .12 + k*.06; y = 1.6; yaw = -.78 - .45*k; }
    cCam.position.set(0, y, 0);
    cCam.rotation.y = yaw; cCam.rotation.x = pitch;
    dome.position.copy(cCam.position);
  }
  function update(dt){
    if (!active) return;
    t += dt;
    // subtitles
    const next = SUBS.findIndex(([a, b]) => t >= a && t < b);
    if (next !== subIdx){
      subIdx = next;
      if (next >= 0){ el.introText.textContent = SUBS[next][2]; el.introText.style.opacity = 1; }
      else el.introText.style.opacity = 0;
    }
    // eyelids: quick open with one heavy re-blink
    let fade = Math.max(0, .95 - t*.42);
    if (t > 1.2 && t < 1.7) fade = Math.max(fade, .75*(1 - Math.abs((t-1.45)/.25)));
    // final flash: the searchlight hits, then black
    if (t > 15.9){
      el.fade.style.background = t > 16.6 ? '#000' : '#fff';
      fade = Math.min(1, (t-15.9)/.7);
      if (t > 16.6) fade = 1;
    }
    el.fade.style.opacity = fade;
    pose(t);
    dome.material.uniforms.uTime.value = t;
    // world motion
    smokes.forEach((p,i)=>{ p.position.x += dt*(1.1+i*.13); if (p.position.x > 140) p.position.x = -140; });
    fires.forEach((f,i)=>{ f.material.opacity = .65 + .25*Math.sin(t*9 + i*2.1) + .1*Math.sin(t*23 + i); f.scale.y = 7 + Math.sin(t*6 + i)*.8; });
    if (ash && ash.visible){
      const a = ash.geometry.attributes.position;
      const n = ash.geometry.drawRange.count || 0;
      for (let i=0;i<n;i++){
        a.array[i*3+1] -= dt*(.5 + (i%5)*.22);
        if (a.array[i*3+1] < 0) a.array[i*3+1] = 45;
      }
      a.needsUpdate = true;
    }
    patrols.forEach((d,i)=>{
      const k = ((t*.05 + i*.34) % 1.3) - .5;
      d.position.set(-k*150, 30+Math.sin(t*.8+i)*1.6, -55-i*16);
      d.userData.beam.rotation.z = Math.sin(t*.6+i*2)*.25;
    });
    if (t > 11.5){
      hunter.visible = true;
      const k = smooth((t-11.5)/4.6);
      hunter.position.set(-60+(k*58), 30-(k*17), -46+(k*39));
      hunter.userData.beam.material.opacity = .12 + k*.3;
      hunter.userData.beam.scale.setScalar(1 - k*.5);
      hunter.lookAt(cCam.position);
      if (!alerted && t > 13.6){ alerted = true; AudioSys.alert(); }
      if (!flashed && t > 16.0){ flashed = true; AudioSys.hurt(); AudioSys.alert(); }
    }
    renderFrame(cScene, cCam);
    if (t > END) finish();
  }
  function finish(){
    teardown();
    if (onDone) onDone();
  }
  function onQuality(){
    if (!ash) return;
    ash.visible = Q.p.ash > 0;
    if (ash.visible) ash.geometry.setDrawRange(0, Q.p.ash);
  }
  function resize(){ if (cCam){ cCam.aspect = window.innerWidth/window.innerHeight; cCam.updateProjectionMatrix(); } }
  return { start, update, skip: teardown, prewarm, onQuality, resize, isActive: () => active,
    debugSeek: tt => { t = tt; }, scene: () => cScene, cam: () => cCam };
})();
window.addEventListener('resize', () => Cinematic.resize());

/* ============================================================
   Level: rooms along -Z. Episode One adds the rail car in front,
   so its depot is room 5. Every other chapter still ends on room 4.
   ============================================================ */
const WALL_H = CH.wallH || 4, DOOR_HALF = 1.6;
const ROOMS = CH.rooms;
const CORE_SEG = ROOMS.length - 1;
const PILLARS = CH.pillars;

/* ---- procedural PBR texture sets (canvas, zero image assets) ----
   Each set is albedo + tangent normal (derived from a painted height map) +
   packed ORM (G = roughness, B = metalness) + optional emissive.            */
function makeTex(draw, size=512){
  const c = document.createElement('canvas'); c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
const ANISO = Math.min(renderer.capabilities.getMaxAnisotropy(), Q.p.basic ? 1 : (Q.level === 'high' ? 8 : 3));
const HEXWALL = CH.id === 'ch_taken';   // inside the hive keeps the hex plating
const SEED = [...CH.id].reduce((a,c) => a*31 + c.charCodeAt(0), 7);
function rngOf(seed){
  let a = seed >>> 0;
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const gray = v => `rgb(${v|0},${v|0},${v|0})`;
const ormc = (r, m) => `rgb(0,${(r*255)|0},${(m*255)|0})`;
function canvasOf(s){ const c = document.createElement('canvas'); c.width = c.height = s; return c; }
function toTex(c, srgb){
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = ANISO;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function heightToNormal(hc, strength){
  const s = hc.width, src = hc.getContext('2d').getImageData(0,0,s,s).data;
  const out = canvasOf(s), og = out.getContext('2d'), img = og.createImageData(s,s), d = img.data;
  const Hh = (x,y) => src[(((y+s)%s)*s + ((x+s)%s))*4] / 255;
  for (let y=0;y<s;y++) for (let x=0;x<s;x++){
    const dx = (Hh(x+1,y) - Hh(x-1,y)) * strength, dy = (Hh(x,y+1) - Hh(x,y-1)) * strength;
    const l = Math.hypot(dx, dy, 1), i = (y*s + x)*4;
    d[i]   = (-dx/l*.5 + .5)*255;
    d[i+1] = ( dy/l*.5 + .5)*255;
    d[i+2] = ( 1/l*.5 + .5)*255;
    d[i+3] = 255;
  }
  og.putImageData(img,0,0);
  return out;
}
// paint(L) is called in a fixed 512x512 logical space on four layers:
//   L.a albedo, L.h height (gray), L.o roughness/metal, L.e emissive
function makePBR(paint, seedOff, opts={}){
  const s = TEXN, R = rngOf(SEED + seedOff);
  const A = canvasOf(s), Hc = canvasOf(s), O = canvasOf(s), E = canvasOf(s);
  const L = { a:A.getContext('2d'), h:Hc.getContext('2d'), o:O.getContext('2d'), e:E.getContext('2d'), R, S:512 };
  [L.a, L.h, L.o, L.e].forEach(c => c.scale(s/512, s/512));
  L.h.fillStyle = gray(128); L.h.fillRect(0,0,512,512);
  L.o.fillStyle = ormc(.7,.5); L.o.fillRect(0,0,512,512);
  L.e.fillStyle = '#000'; L.e.fillRect(0,0,512,512);
  paint(L);
  // Potato skips normal and ORM maps. The height-to-normal pass is a full
  // canvas walk per set, and those samplers blow up the fragment shader.
  const set = {
    map: toTex(A, true),
    normal: Q.p.basic ? null : toTex(heightToNormal(Hc, opts.nstr || 3.2), false),
    orm: Q.p.basic ? null : toTex(O, false),
  };
  if (opts.emissive) set.emissive = toTex(E, true);
  return set;
}
// World and prop materials. Potato uses Lambert (one cheap light response,
// no env, no PBR) so corridors stay readable under the headlamp.
function litMat(params){
  if (!Q.p.basic) return new THREE['MeshStandardMaterial'](params);
  const p = params || {}, o = {};
  if (p.color !== undefined) o.color = p.color;
  if (p.map) o.map = p.map;
  if (p.emissive !== undefined) o.emissive = p.emissive;
  if (p.emissiveMap) o.emissiveMap = p.emissiveMap;
  if (p.emissiveIntensity !== undefined) o.emissiveIntensity = p.emissiveIntensity;
  if (p.transparent) o.transparent = true;
  if (p.opacity !== undefined) o.opacity = p.opacity;
  if (p.side !== undefined) o.side = p.side;
  if (p.depthWrite !== undefined) o.depthWrite = p.depthWrite;
  if (p.flatShading) o.flatShading = true;
  if (p.vertexColors) o.vertexColors = true;
  if (p.alphaTest !== undefined) o.alphaTest = p.alphaTest;
  if (p.alphaMap) o.alphaMap = p.alphaMap;
  if (p.fog !== undefined) o.fog = p.fog;
  if (p.blending !== undefined) o.blending = p.blending;
  if (p.depthTest !== undefined) o.depthTest = p.depthTest;
  if (p.name) o.name = p.name;
  return new THREE.MeshLambertMaterial(o);
}
const hexCol = c => '#' + new THREE.Color(c).getHexString();
const STRIP_CSS = hexCol(CH.palette.strip);

// shared painting helpers
function bolt(L, x, y, r=4){
  L.a.fillStyle = 'rgba(15,17,20,.8)'; L.a.beginPath(); L.a.arc(x,y,r+1.5,0,7); L.a.fill();
  L.a.fillStyle = 'rgba(200,210,220,.55)'; L.a.beginPath(); L.a.arc(x-.6,y-.6,r*.7,0,7); L.a.fill();
  L.h.fillStyle = gray(215); L.h.beginPath(); L.h.arc(x,y,r,0,7); L.h.fill();
  L.o.fillStyle = ormc(.35,1); L.o.beginPath(); L.o.arc(x,y,r,0,7); L.o.fill();
}
function groove(L, x, y, w, h){
  L.h.strokeStyle = gray(25); L.h.lineWidth = 5; L.h.strokeRect(x,y,w,h);
  L.h.strokeStyle = gray(205); L.h.lineWidth = 2; L.h.strokeRect(x+4,y+4,w-8,h-8);
  L.a.strokeStyle = 'rgba(0,0,0,.75)'; L.a.lineWidth = 4; L.a.strokeRect(x,y,w,h);
  L.a.strokeStyle = 'rgba(190,205,220,.10)'; L.a.lineWidth = 2; L.a.strokeRect(x+4,y+4,w-8,h-8);
}
function weather(L, n, rustPal){
  const R = L.R;
  for (let i=0;i<n*2;i++){                                  // vertical rust / drip streaks
    const x = R()*512, w = R()*7+2, y0 = R()*340, len = 90 + R()*230;
    const g = L.a.createLinearGradient(0,y0,0,y0+len);
    g.addColorStop(0, rustPal ? 'rgba(110,52,22,.38)' : 'rgba(10,8,6,.34)'); g.addColorStop(1,'rgba(0,0,0,0)');
    L.a.fillStyle = g; L.a.fillRect(x,y0,w,len);
    const g2 = L.o.createLinearGradient(0,y0,0,y0+len);
    g2.addColorStop(0,'rgba(0,235,0,.55)'); g2.addColorStop(1,'rgba(0,0,0,0)');
    L.o.fillStyle = g2; L.o.fillRect(x,y0,w,len);
  }
  for (let i=0;i<n;i++){                                    // grime blots
    const x = R()*512, y = R()*512, r = 14 + R()*46;
    let g = L.a.createRadialGradient(x,y,1,x,y,r); g.addColorStop(0,'rgba(0,0,0,.34)'); g.addColorStop(1,'rgba(0,0,0,0)');
    L.a.fillStyle = g; L.a.fillRect(x-r,y-r,r*2,r*2);
    g = L.o.createRadialGradient(x,y,1,x,y,r); g.addColorStop(0,'rgba(0,255,0,.5)'); g.addColorStop(1,'rgba(0,0,0,0)');
    L.o.fillStyle = g; L.o.fillRect(x-r,y-r,r*2,r*2);
  }
  for (let i=0;i<n*3;i++){                                  // bright scratches on bare metal
    const x = R()*512, y = R()*512, a = R()*6.28, l = 6 + R()*34;
    const x2 = x + Math.cos(a)*l, y2 = y + Math.sin(a)*l;
    L.a.strokeStyle = 'rgba(210,222,235,.20)'; L.a.lineWidth = 1; L.a.beginPath(); L.a.moveTo(x,y); L.a.lineTo(x2,y2); L.a.stroke();
    L.h.strokeStyle = gray(70); L.h.lineWidth = 1.2; L.h.beginPath(); L.h.moveTo(x,y); L.h.lineTo(x2,y2); L.h.stroke();
    L.o.strokeStyle = ormc(.22,1); L.o.lineWidth = 1.4; L.o.beginPath(); L.o.moveTo(x,y); L.o.lineTo(x2,y2); L.o.stroke();
  }
  for (let i=0;i<n*14;i++){                                 // pitting
    const x = R()*512, y = R()*512;
    L.a.fillStyle = 'rgba(0,0,0,.22)'; L.a.fillRect(x,y,1+R()*2.5,1+R()*2.5);
    L.h.fillStyle = gray(70+R()*40); L.h.fillRect(x,y,1+R()*2,1+R()*2);
  }
}
function hazard(L, x, y, w, h){
  L.a.save(); L.a.beginPath(); L.a.rect(x,y,w,h); L.a.clip();
  L.a.fillStyle = '#16171a'; L.a.fillRect(x,y,w,h);
  L.a.fillStyle = '#c9731f';
  for (let i=-h; i<w+h; i+=26){ L.a.beginPath(); L.a.moveTo(x+i,y+h); L.a.lineTo(x+i+13,y+h); L.a.lineTo(x+i+13+h,y); L.a.lineTo(x+i+h,y); L.a.fill(); }
  L.a.restore();
  L.o.fillStyle = ormc(.55,.15); L.o.fillRect(x,y,w,h);
  L.h.fillStyle = gray(150); L.h.fillRect(x,y,w,h);
}

const WALL_SET = makePBR(L => {
  const { a,h,o,e,R } = L, S = 512;
  const g = a.createLinearGradient(0,0,0,S);
  g.addColorStop(0, CH.palette.wallA); g.addColorStop(.5, CH.palette.wallB); g.addColorStop(1, CH.palette.wallC);
  a.fillStyle = g; a.fillRect(0,0,S,S);
  o.fillStyle = ormc(.52,.85); o.fillRect(0,0,S,S);
  const kinds = [0,1,2,3]; const off = SEED % 4;
  for (let py=0;py<2;py++) for (let px=0;px<2;px++){
    const x = px*256, y = py*256, kind = kinds[(px + py*2 + off) % 4];
    h.fillStyle = gray(150); h.fillRect(x+6,y+6,244,244);
    a.fillStyle = `rgba(255,255,255,${.02 + R()*.05})`; a.fillRect(x+6,y+6,244,244);
    groove(L, x+6, y+6, 244, 244);
    if (kind === 0){                                        // plain armor plate with emboss
      h.fillStyle = gray(178); h.fillRect(x+40,y+40,176,176);
      a.fillStyle = 'rgba(0,0,0,.16)'; a.fillRect(x+40,y+40,176,176);
      h.strokeStyle = gray(60); h.lineWidth = 4; h.strokeRect(x+40,y+40,176,176);
      h.strokeStyle = gray(210); h.lineWidth = 2; h.strokeRect(x+46,y+46,164,164);
      h.fillStyle = gray(60); h.fillRect(x+100,y+120,56,16);
      a.fillStyle = 'rgba(0,0,0,.5)'; a.fillRect(x+100,y+120,56,16);
      e.fillStyle = STRIP_CSS; e.globalAlpha = .9; e.fillRect(x+104,y+126,12+R()*40,4); e.globalAlpha = 1;
    } else if (kind === 1 && !HEXWALL){                     // cast concrete: form-tie holes, cracks, soot
      a.fillStyle = 'rgba(120,112,100,.10)'; a.fillRect(x+12,y+12,232,232);
      for (let k=0;k<4;k++){ const tx = x+52+(k%2)*152, ty = y+52+(k>>1)*152;
        a.fillStyle = 'rgba(0,0,0,.7)'; a.beginPath(); a.arc(tx,ty,6,0,7); a.fill();
        h.fillStyle = gray(40); h.beginPath(); h.arc(tx,ty,6,0,7); h.fill(); }
      a.strokeStyle = 'rgba(0,0,0,.55)'; h.strokeStyle = gray(45); a.lineWidth = h.lineWidth = 1.6;
      for (let k=0;k<3;k++){ let cx = x+30+R()*196, cy = y+20+R()*40; a.beginPath(); h.beginPath(); a.moveTo(cx,cy); h.moveTo(cx,cy);
        for (let q=0;q<7;q++){ cx += (R()-.5)*34; cy += 14+R()*22; a.lineTo(cx,cy); h.lineTo(cx,cy); } a.stroke(); h.stroke(); }
      o.fillStyle = ormc(.9,.05); o.fillRect(x+10,y+10,236,236);
    } else if (kind === 1){                                 // hex plating
      const hr = 15, hx = hr*1.5, hy = hr*1.732;
      for (let cy=0; cy<9; cy++) for (let cx=0; cx<9; cx++){
        const X = x+30 + cx*hx*1.0 + 0, Y = y+34 + cy*hy + (cx%2 ? hy/2 : 0);
        if (X > x+232 || Y > y+232) continue;
        h.beginPath(); for (let k=0;k<6;k++){ const an = k*Math.PI/3; h.lineTo(X+Math.cos(an)*hr, Y+Math.sin(an)*hr); } h.closePath();
        h.fillStyle = gray(105 + R()*30); h.fill(); h.strokeStyle = gray(215); h.lineWidth = 2.6; h.stroke();
        a.beginPath(); for (let k=0;k<6;k++){ const an = k*Math.PI/3; a.lineTo(X+Math.cos(an)*hr, Y+Math.sin(an)*hr); } a.closePath();
        a.fillStyle = `rgba(0,0,0,${.18 + R()*.18})`; a.fill(); a.strokeStyle = 'rgba(180,195,210,.28)'; a.lineWidth = 1.6; a.stroke();
        o.beginPath(); for (let k=0;k<6;k++){ const an = k*Math.PI/3; o.lineTo(X+Math.cos(an)*hr, Y+Math.sin(an)*hr); } o.closePath();
        o.strokeStyle = ormc(.3,1); o.lineWidth = 2.4; o.stroke();
        if (R() < .015){ e.beginPath(); for (let k=0;k<6;k++){ const an = k*Math.PI/3; e.lineTo(X+Math.cos(an)*(hr-4), Y+Math.sin(an)*(hr-4)); } e.closePath(); e.fillStyle = STRIP_CSS; e.globalAlpha = .55; e.fill(); e.globalAlpha = 1; }
      }
    } else if (kind === 2){                                 // louvered vent with light leaking through
      for (let v=0; v<13; v++){
        const yy = y + 34 + v*14;
        const lg = h.createLinearGradient(0,yy,0,yy+11);
        lg.addColorStop(0, gray(225)); lg.addColorStop(1, gray(40));
        h.fillStyle = lg; h.fillRect(x+30,yy,196,11);
        a.fillStyle = 'rgba(0,0,0,.62)'; a.fillRect(x+30,yy+6,196,6);
        e.fillStyle = STRIP_CSS; e.globalAlpha = .33; e.fillRect(x+32,yy+7,192,3); e.globalAlpha = 1;
      }
    } else {                                                // hazard band + status leds
      hazard(L, x+16, y+196, 224, 34);
      h.fillStyle = gray(190); h.fillRect(x+34,y+34,60,44);
      a.fillStyle = 'rgba(0,0,0,.5)'; a.fillRect(x+34,y+34,60,44);
      for (let k=0;k<3;k++){ e.fillStyle = k === 2 ? '#ff2a2a' : STRIP_CSS; e.beginPath(); e.arc(x+130+k*22,y+44,5,0,7); e.fill(); }
      h.fillStyle = gray(70); h.fillRect(x+120,y+34,6,120);
      a.fillStyle = 'rgba(0,0,0,.45)'; a.fillRect(x+120,y+34,6,120);
    }
    [[18,18],[238,18],[18,238],[238,238]].forEach(([dx,dy]) => bolt(L, x+dx, y+dy, 4));
  }
  weather(L, 26, true);
}, 1, { emissive:true });

const FLOOR_SET = makePBR(L => {
  const { a,h,o,R } = L, S = 512;
  a.fillStyle = CH.palette.floor; a.fillRect(0,0,S,S);
  o.fillStyle = ormc(.55,.9); o.fillRect(0,0,S,S);
  const off = SEED % 3;
  for (let py=0;py<2;py++) for (let px=0;px<2;px++){
    const x = px*256, y = py*256, grate = ((px + py*2 + off) % 4) === 2;
    h.fillStyle = gray(150); h.fillRect(x+4,y+4,248,248);
    if (grate){
      a.fillStyle = 'rgba(0,0,0,.62)'; a.fillRect(x+10,y+10,236,236);
      for (let gy=0; gy<232; gy+=14) for (let gx=0; gx<232; gx+=14){
        h.fillStyle = gray(30); h.fillRect(x+14+gx, y+14+gy, 10, 10);
      }
      o.fillStyle = ormc(.85,.4); o.fillRect(x+10,y+10,236,236);
    } else {
      h.save(); h.beginPath(); h.rect(x+12,y+12,232,232); h.clip();
      h.strokeStyle = gray(205); h.lineWidth = 4.5;
      for (let t=-256; t<512; t+=17){
        h.beginPath(); h.moveTo(x+t,y); h.lineTo(x+t+256,y+256); h.stroke();
        h.beginPath(); h.moveTo(x+t+256,y); h.lineTo(x+t,y+256); h.stroke();
      }
      h.restore();
      a.strokeStyle = 'rgba(190,205,215,.07)'; a.lineWidth = 3;
      a.save(); a.beginPath(); a.rect(x+12,y+12,232,232); a.clip();
      for (let t=-256; t<512; t+=17){ a.beginPath(); a.moveTo(x+t,y); a.lineTo(x+t+256,y+256); a.stroke(); }
      a.restore();
    }
    groove(L, x+4, y+4, 248, 248);
    [[16,16],[240,16],[16,240],[240,240]].forEach(([dx,dy]) => bolt(L, x+dx, y+dy, 4.5));
  }
  // wet patches: mirror-smooth, darker, tread flattened
  for (let i=0;i<6;i++){
    const x = R()*512, y = R()*512, r = 24 + R()*52;
    for (let k=0;k<7;k++){
      const bx = x + (R()-.5)*r*1.1, by = y + (R()-.5)*r*.8, br = r*(.35 + R()*.4);
      const gg = a.createRadialGradient(bx,by,br*.2,bx,by,br);
      gg.addColorStop(0,'rgba(2,5,8,.32)'); gg.addColorStop(1,'rgba(2,5,8,0)'); a.fillStyle = gg; a.fillRect(bx-br,by-br,br*2,br*2);
      const og = o.createRadialGradient(bx,by,br*.2,bx,by,br);
      og.addColorStop(0,'rgba(0,10,0,1)'); og.addColorStop(.7,'rgba(0,18,0,.8)'); og.addColorStop(1,'rgba(0,18,0,0)'); o.fillStyle = og; o.fillRect(bx-br,by-br,br*2,br*2);
      const hg = h.createRadialGradient(bx,by,br*.2,bx,by,br);
      hg.addColorStop(0,'rgba(128,128,128,.9)'); hg.addColorStop(1,'rgba(128,128,128,0)'); h.fillStyle = hg; h.fillRect(bx-br,by-br,br*2,br*2);
    }
  }
  weather(L, 12, false);
}, 2, { nstr:2.6 });

const CEIL_SET = makePBR(L => {
  const { a,h,o,e,R } = L, S = 512;
  a.fillStyle = CH.palette.ceil; a.fillRect(0,0,S,S);
  o.fillStyle = ormc(.6,.8); o.fillRect(0,0,S,S);
  for (let py=0;py<4;py++) for (let px=0;px<4;px++){
    const x = px*128, y = py*128;
    h.fillStyle = gray(150); h.fillRect(x+3,y+3,122,122);
    groove(L, x+3, y+3, 122, 122);
    if (R() < .34){
      for (let v=12; v<112; v+=9){ h.fillStyle = gray(40); h.fillRect(x+14,y+v,100,5); a.fillStyle = 'rgba(0,0,0,.6)'; a.fillRect(x+14,y+v,100,5); }
    } else if (R() < .2){
      e.fillStyle = STRIP_CSS; e.globalAlpha = .7; e.beginPath(); e.arc(x+110,y+18,3.5,0,7); e.fill(); e.globalAlpha = 1;
    }
    [[10,10],[118,10],[10,118],[118,118]].forEach(([dx,dy]) => bolt(L, x+dx, y+dy, 3));
  }
  weather(L, 14, false);
}, 3, { emissive:true });

const CRATE_SET = makePBR(L => {
  const { a,h,o,e,R } = L, S = 512;
  a.fillStyle = CH.palette.crate; a.fillRect(0,0,S,S);
  o.fillStyle = ormc(.62,.7); o.fillRect(0,0,S,S);
  for (let x=36; x<S-36; x+=14){                           // corrugated side panel
    const g = h.createLinearGradient(x,0,x+14,0); g.addColorStop(0, gray(70)); g.addColorStop(.5, gray(210)); g.addColorStop(1, gray(70));
    h.fillStyle = g; h.fillRect(x,36,14,S-72);
    a.fillStyle = (x/14|0)%2 ? 'rgba(0,0,0,.14)' : 'rgba(255,255,255,.04)'; a.fillRect(x,36,14,S-72);
  }
  h.fillStyle = gray(190); h.fillRect(0,0,S,36); h.fillRect(0,S-36,S,36); h.fillRect(0,0,36,S); h.fillRect(S-36,0,36,S);
  groove(L, 4, 4, S-8, S-8); groove(L, 34, 34, S-68, S-68);
  a.fillStyle = 'rgba(0,0,0,.28)'; a.fillRect(0,0,S,36); a.fillRect(0,S-36,S,36); a.fillRect(0,0,36,S); a.fillRect(S-36,0,36,S);
  o.fillStyle = ormc(.38,1); o.fillRect(0,0,S,36); o.fillRect(0,S-36,S,36); o.fillRect(0,0,36,S); o.fillRect(S-36,0,36,S);
  // machine stencil: chevrons + id plate
  a.fillStyle = CH.palette.crateMark; a.fillRect(150,200,212,100);
  a.fillStyle = 'rgba(8,9,11,.75)';
  for (let k=0;k<4;k++){ a.beginPath(); a.moveTo(168+k*44,214); a.lineTo(190+k*44,250); a.lineTo(168+k*44,286); a.lineTo(178+k*44,286); a.lineTo(200+k*44,250); a.lineTo(178+k*44,214); a.fill(); }
  h.fillStyle = gray(165); h.fillRect(150,200,212,100);
  e.fillStyle = STRIP_CSS; e.globalAlpha = .65; e.fillRect(150,310,60,6); e.globalAlpha = 1;
  [[18,18],[494,18],[18,494],[494,494],[256,18],[256,494]].forEach(([x,y]) => bolt(L, x, y, 6));
  weather(L, 16, true);
}, 4, { emissive:true });

const DOOR_SET = makePBR(L => {
  const { a,h,o,R } = L, S = 512;
  const g = a.createLinearGradient(0,0,S,0); g.addColorStop(0,'#2d3338'); g.addColorStop(.5,'#3c4349'); g.addColorStop(1,'#2d3338');
  a.fillStyle = g; a.fillRect(0,0,S,S);
  o.fillStyle = ormc(.45,.9); o.fillRect(0,0,S,S);
  h.fillStyle = gray(150); h.fillRect(8,8,496,496);
  groove(L, 8, 8, 496, 496);
  h.fillStyle = gray(30); h.fillRect(250,8,12,496);        // center seam
  a.fillStyle = 'rgba(0,0,0,.8)'; a.fillRect(250,8,12,496);
  for (let y=96; y<420; y+=82){ groove(L, 28, y, 206, 62); groove(L, 278, y, 206, 62); }
  hazard(L, 8, 8, 496, 40); hazard(L, 8, 464, 496, 40);
  for (let y=70; y<460; y+=82){ bolt(L, 20, y+30, 4); bolt(L, 492, y+30, 4); }
  weather(L, 18, true);
}, 5);

/* world-space shader patch: baked-style ambient occlusion (dark at floor and ceiling
   joins), low-frequency albedo mottling that hides texture tiling, and optional wet
   floor roughness variation. Costs a few ALU ops, no extra textures. */
function patchSurface(m, o = {}){
  if (!m || !m.isMeshStandardMaterial || Q.p.basic) return m;
  const fAO = o.floorAO ?? .5, cAO = o.ceilAO ?? .4, aoH = o.aoH ?? 1.1;
  const key = `srf_${fAO}_${cAO}_${aoH}_${o.wet?1:0}_${o.noise===false?0:1}`;
  m.onBeforeCompile = sh => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWP;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec3 vWP;
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(h21(i), h21(i+vec2(1.,0.)), f.x), mix(h21(i+vec2(0.,1.)), h21(i+vec2(1.,1.)), f.x), f.y); }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
${o.noise === false ? '' : 'float nz = vn(vWP.xz*.45 + vWP.y*.9)*.6 + vn(vWP.xz*1.7 + vWP.y*2.3)*.4; diffuseColor.rgb *= mix(.72, 1.14, nz);'}
float aoF = mix(${(1-fAO).toFixed(2)}, 1., smoothstep(0., ${aoH.toFixed(2)}, vWP.y));
float aoC = mix(${(1-cAO).toFixed(2)}, 1., smoothstep(0., .9, ${WALL_H.toFixed(1)} - vWP.y));
diffuseColor.rgb *= aoF * aoC;`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
${o.wet ? 'float wet = smoothstep(.40,.62, vn(vWP.xz*.28+3.1)*.65 + vn(vWP.xz*.9)*.35); roughnessFactor = mix(roughnessFactor, roughnessFactor*.3, wet*.85); diffuseColor.rgb *= mix(1.,.72,wet);' : ''}`);
  };
  m.customProgramCacheKey = () => key;
  return m;
}
const EMISSIVE_MATS = [];
function surfMat(set, rx, ry, extra = {}, patch = {}){
  const cl = t => { if (!t) return null; const c = t.clone(); c.repeat.set(rx, ry); c.needsUpdate = true; return c; };
  if (Q.p.basic){
    const m = litMat({
      map: cl(set.map),
      color: extra.color !== undefined ? extra.color : 0xffffff,
      emissive: set.emissive ? (extra.emissive || new THREE.Color(CH.palette.strip)) : new THREE.Color(0x000000),
      emissiveMap: set.emissive ? cl(set.emissive) : null,
      emissiveIntensity: set.emissive ? (extra.emissiveIntensity != null ? extra.emissiveIntensity : 0.85) : 0,
      transparent: extra.transparent, opacity: extra.opacity, side: extra.side,
      depthWrite: extra.depthWrite, flatShading: extra.flatShading, vertexColors: extra.vertexColors,
    });
    if (set.emissive) EMISSIVE_MATS.push(m);
    return m;
  }
  const orm = cl(set.orm);
  const m = litMat({
    map: cl(set.map), normalMap: cl(set.normal), roughnessMap: orm, metalnessMap: orm,
    roughness: 1, metalness: 1, normalScale: new THREE.Vector2(1, 1), envMapIntensity: .9,
    emissiveMap: set.emissive ? cl(set.emissive) : null,
    emissive: set.emissive ? new THREE.Color(CH.palette.strip) : new THREE.Color(0x000000),
    emissiveIntensity: 1.1, ...extra });
  if (set.emissive) EMISSIVE_MATS.push(m);
  return patchSurface(m, patch);
}

/* ---- reflections: sky.jpg + machine light panels baked into a PMREM environment ---- */
function softSpriteTex(){
  return makeTex((g,s) => {
    const d = g.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);
    d.addColorStop(0,'rgba(255,255,255,1)'); d.addColorStop(.25,'rgba(255,255,255,.55)'); d.addColorStop(1,'rgba(255,255,255,0)');
    g.fillStyle = d; g.fillRect(0,0,s,s);
  }, 64);
}
const SOFT_TEX = softSpriteTex();
const glowMat = new THREE.SpriteMaterial({ map:SOFT_TEX, color:CH.palette.strip, transparent:true,
  opacity:.55, blending:THREE.AdditiveBlending, depthWrite:false });
const BEAM_TEX = (() => {
  const c = document.createElement('canvas'); c.width = 4; c.height = 64;
  const g = c.getContext('2d'), gr = g.createLinearGradient(0,0,0,64);
  gr.addColorStop(0,'#fff'); gr.addColorStop(.45,'#777'); gr.addColorStop(1,'#000');
  g.fillStyle = gr; g.fillRect(0,0,4,64);
  return new THREE.CanvasTexture(c);
})();
function buildEnv(skyImg){
  // PMREM is a stack of cube renders. Software GL cannot afford it, and
  // Lambert does not sample the environment.
  if (Q.p.basic){ scene.environment = null; return; }
  const W = 512, Hh = 256, c = document.createElement('canvas'); c.width = W; c.height = Hh;
  const g = c.getContext('2d'), R = rngOf(SEED + 99);
  const grad = g.createLinearGradient(0,0,0,Hh);
  grad.addColorStop(0,'#0b0d10'); grad.addColorStop(.45,'#1a1d22'); grad.addColorStop(.55,'#101215'); grad.addColorStop(1,'#050607');
  g.fillStyle = grad; g.fillRect(0,0,W,Hh);
  if (skyImg){
    g.globalAlpha = .55; g.globalCompositeOperation = 'lighten';
    g.drawImage(skyImg, 0, Hh*.38, W, Hh*.34);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    g.fillStyle = hexCol(CH.palette.fog); g.globalAlpha = .55; g.fillRect(0,0,W,Hh); g.globalAlpha = 1;
  }
  // ceiling light bars + side wall strips (what the wet floor and steel will mirror)
  g.fillStyle = STRIP_CSS;
  for (let i=0;i<14;i++){ const x = i*W/14 + R()*10; g.globalAlpha = .75 + R()*.25; g.fillRect(x, Hh*(.12 + R()*.1), 46 + R()*30, 5 + R()*3); }
  g.globalAlpha = .5; for (let i=0;i<10;i++){ g.fillRect(R()*W, Hh*(.42 + R()*.1), 4, 26 + R()*30); }
  g.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping; tex.colorSpace = THREE.SRGBColorSpace;
  const pm = new THREE.PMREMGenerator(renderer);
  const rt = pm.fromEquirectangular(tex);
  if (scene.environment) scene.environment.dispose();
  scene.environment = rt.texture;
  tex.dispose(); pm.dispose();
}
buildEnv(null);
skyImage().then(img => { if (img) try { buildEnv(img); } catch(e){} });


const matStrip = new THREE.MeshBasicMaterial({ color:CH.palette.strip });
const matDoor  = surfMat(DOOR_SET, 1, 1, {}, { floorAO:.35, ceilAO:.2, noise:false });

const colliders = [];   // {x1,x2,z1,z2, door?}  AABBs for movement + LOS
const wallMeshes = [];  // meshes used for raycast occlusion / bullet stops
const doors = [];       // {mesh, collider, open, anim}

function addBox(x1,x2,z1,z2,h,mat,solid=true){
  const w=x2-x1, d=z2-z1;
  const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),
    mat || surfMat(WALL_SET, Math.max(1, Math.round(Math.max(w,d)/2.6)), Math.max(1, Math.round(h/2.6)), {}, { floorAO:.6, ceilAO:.45, aoH:1.3 }));
  m.position.set((x1+x2)/2, h/2, (z1+z2)/2);
  scene.add(m); wallMeshes.push(m);
  if (solid) colliders.push({x1,x2,z1,z2});
  return m;
}

// floor + ceiling sized to the chapter's rooms; outdoor chapters get sky
{
  const EXT = ROOMS.concat((CH.annexes||[]).map(a => {
    const r = ROOMS[a.room];
    const inner = a.side === 'L' ? r.x1 : r.x2;
    const outer = a.side === 'L' ? inner - a.depth : inner + a.depth;
    return { x1: Math.min(inner,outer), x2: Math.max(inner,outer), z1: a.z1, z2: a.z2 };
  }));
  const minX = Math.min(...EXT.map(r=>r.x1))-2, maxX = Math.max(...EXT.map(r=>r.x2))+2;
  const minZ = Math.min(...EXT.map(r=>r.z1))-2, maxZ = Math.max(...EXT.map(r=>r.z2))+1;
  const Wd = maxX-minX, Ld = maxZ-minZ, cx=(minX+maxX)/2, cz=(minZ+maxZ)/2;
  const fl = new THREE.Mesh(new THREE.BoxGeometry(Wd, .2, Ld), surfMat(FLOOR_SET, Math.max(4, Math.round(Wd/2.9)), Math.max(10, Math.round(Ld/2.9)), {}, { wet:true, floorAO:0, ceilAO:0 }));
  fl.position.set(cx,-.1,cz); scene.add(fl); wallMeshes.push(fl); fl.userData.slab = true;
  if (!CH.outdoor){
    const ce = new THREE.Mesh(new THREE.BoxGeometry(Wd, .2, Ld), surfMat(CEIL_SET, Math.max(3, Math.round(Wd/3.7)), Math.max(8, Math.round(Ld/3.7)), {}, { floorAO:0, ceilAO:0 }));
    ce.position.set(cx, WALL_H+.1, cz); scene.add(ce); wallMeshes.push(ce); ce.userData.slab = true;
  } else {
    // roofed stretches inside an outdoor chapter (conduits, sealed corridors)
    (CH.roofRooms || []).forEach(i => {
      const r = ROOMS[i], w = r.x2 - r.x1 + 1, l = r.z2 - r.z1;
      const ce = new THREE.Mesh(new THREE.BoxGeometry(w, .2, l), surfMat(CEIL_SET, Math.max(2, Math.round(w/3.7)), Math.max(3, Math.round(l/3.7)), {}, { floorAO:0, ceilAO:0 }));
      ce.position.set((r.x1 + r.x2)/2, WALL_H + .1, (r.z1 + r.z2)/2); scene.add(ce); wallMeshes.push(ce); ce.userData.slab = true;
    });
    // blood sky dome, same pinch-free shader as the opening cinematic
    const dome = makeSkyDome(100);
    dome.onBeforeRender = () => { dome.position.set(yawObj.position.x, 0, yawObj.position.z); };
    scene.add(dome);
    const sun = new THREE.DirectionalLight(0xff6a40, .9);
    sun.position.set(-40, 30, cz-40); scene.add(sun);
  }
}

// side walls per room + boundary walls with door gaps
const ANNEXES = CH.annexes || [];
function sideWall(xa, xb, r, a){
  if (!a){ addBox(xa, xb, r.z1, r.z2, WALL_H, null); return; }
  const zm = (a.z1 + a.z2) / 2, g = 1.3;   // opening in the shared wall
  addBox(xa, xb, r.z1, zm - g, WALL_H, null);
  addBox(xa, xb, zm + g, r.z2, WALL_H, null);
}
let BREACH = null;
ROOMS.forEach((r,i)=>{
  if (CH.breach && CH.breach.room === i){
    const b = CH.breach;
    addBox(r.x1-.5, r.x1, r.z1, b.z1, WALL_H, null);
    addBox(r.x1-.5, r.x1, b.z2, r.z2, WALL_H, null);
    BREACH = { mesh: addBox(r.x1-.5, r.x1, b.z1, b.z2, WALL_H, null), x: r.x1 - .6, z: (b.z1 + b.z2)/2 };
  } else
  sideWall(r.x1-.5, r.x1, r, ANNEXES.find(a => a.room === i && a.side === 'L'));
  sideWall(r.x2, r.x2+.5, r, ANNEXES.find(a => a.room === i && a.side === 'R'));
  if (i===0) addBox(r.x1-.5, r.x2+.5, r.z2, r.z2+.5, WALL_H, null);        // back wall
  if (i===ROOMS.length-1) addBox(r.x1-.5, r.x2+.5, r.z1-.5, r.z1, WALL_H, null); // end wall
  if (i < ROOMS.length-1){
    const nx = ROOMS[i+1];
    const lo = Math.min(r.x1,nx.x1)-.5, hi = Math.max(r.x2,nx.x2)+.5, b = r.z1;
    addBox(lo, -DOOR_HALF, b-.3, b+.3, WALL_H, null);
    addBox(DOOR_HALF, hi, b-.3, b+.3, WALL_H, null);
    // sliding door panel with a lock-status light bar
    const dm = new THREE.Mesh(new THREE.BoxGeometry(DOOR_HALF*2, WALL_H, .35), matDoor);
    dm.position.set(0, WALL_H/2, b);
    scene.add(dm); wallMeshes.push(dm);
    const lock = new THREE.Mesh(new THREE.BoxGeometry(DOOR_HALF*1.6, .1, .05),
      new THREE.MeshBasicMaterial({ color:0xff3344 }));
    lock.position.set(0, 0, .21);
    dm.add(lock);
    const dc = {x1:-DOOR_HALF, x2:DOOR_HALF, z1:b-.2, z2:b+.2, door:true, active:true};
    colliders.push(dc);
    doors.push({ mesh:dm, lock, collider:dc, open:false, anim:0, boundaryZ:b, index:i });
  }
});

// annex shells + loot caches (optional side rooms off the main path)
const LOOT = [];
ANNEXES.forEach(a => {
  const r = ROOMS[a.room];
  const inner = a.side === 'L' ? r.x1 : r.x2;
  const outer = a.side === 'L' ? inner - a.depth : inner + a.depth;
  const x1 = Math.min(inner, outer), x2 = Math.max(inner, outer);
  if (a.side === 'L') addBox(outer-.5, outer, a.z1, a.z2, WALL_H, null);
  else addBox(outer, outer+.5, a.z1, a.z2, WALL_H, null);
  addBox(x1, x2, a.z1-.5, a.z1, WALL_H, null);
  addBox(x1, x2, a.z2, a.z2+.5, WALL_H, null);
  const lx = (x1+x2)/2, lz = (a.z1+a.z2)/2;
  const grp = new THREE.Group();
  const colorByType = { med:0xe7c98a, cell:0xffb85c, intel:0xeef2ea };
  const col = colorByType[a.loot] || 0xe7c98a;
  const b = new THREE.Mesh(new THREE.BoxGeometry(.5,.35,.4), litMat({ color:0x2a2f28, metalness:.5, roughness:.5 }));
  b.position.y = .3; grp.add(b);
  const led = new THREE.Mesh(new THREE.SphereGeometry(.06,10,8), new THREE.MeshBasicMaterial({ color:col }));
  led.position.y = .58; grp.add(led);
  const halo = new THREE.Sprite(glowMat.clone()); halo.material.color.setHex(col); halo.material.opacity = .8;
  halo.scale.set(1.3, 1.3, 1); halo.position.y = .62; grp.add(halo); markDecor(halo);
  grp.position.set(lx, 0, lz);
  scene.add(grp);
  LOOT.push({ grp, x:lx, z:lz, type:a.loot });
});

// Episode One's first room is a rail car: seats, broken windows, a side hatch.
// The hatch plate stays shut until the story choice. Kicking it scars the run.
let trainHatch = null;
function dressTrain(){
  if (!CH.train) return;
  const r = ROOMS[0];
  const seatMat = litMat({ color:0x2a2420, roughness:.86, metalness:.06 });
  const metal = litMat({ color:0x34383c, roughness:.42, metalness:.8 });
  const glass = litMat({ color:0x1a120e, roughness:.15, metalness:.1, transparent:true, opacity:.72 });
  const hole = new THREE.MeshBasicMaterial({ color:0x2a0c08 });
  const midZ = (r.z1 + r.z2) / 2;
  const span = (r.z2 - r.z1) - .6;
  const fc = new THREE.Mesh(new THREE.BoxGeometry((r.x2 - r.x1) + .4, .08, span), metal);
  fc.position.set(0, 2.58, midZ);
  scene.add(fc);
  const runner = new THREE.Mesh(new THREE.BoxGeometry(.7, .02, span), litMat({ color:0x241c18, roughness:.9, metalness:.05 }));
  runner.position.set(0, .02, midZ);
  scene.add(runner);
  for (let z = 12.4; z > r.z1 + 3.2; z -= 2.2){
    [-1, 1].forEach(side => {
      const x = side * 1.15;
      addBox(x - .26, x + .26, z - .4, z + .4, .46, seatMat);
      const back = new THREE.Mesh(new THREE.BoxGeometry(.48, .5, .07), seatMat);
      back.position.set(x, .74, z + .34);
      scene.add(back);
    });
  }
  let lights = 0;
  for (let z = r.z2 - 1.8; z > r.z1 + 1.5; z -= 1.8){
    [-1, 1].forEach((side, i) => {
      const broken = ((Math.round(z) + i) % 3) === 0;
      const pane = new THREE.Mesh(new THREE.BoxGeometry(.05, .58, .84), broken ? hole : glass);
      pane.position.set(side * (r.x2 - .08), 1.52, z);
      scene.add(pane);
      if (broken && lights < 4){
        lights++;
        const L = new THREE.PointLight(0xff4a28, .9, 3.8, 2);
        L.position.set(side * 1.15, 1.52, z);
        EXTRA_LIGHTS.push(L);
        scene.add(L);
      }
    });
  }
  const hx = r.x2 - .05;
  const hatch = new THREE.Mesh(new THREE.BoxGeometry(.07, .92, .72), metal);
  hatch.position.set(hx, 1.02, 8.2);
  scene.add(hatch);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(.02, .16, .72), new THREE.MeshBasicMaterial({ color:0xc9731f }));
  stripe.position.set(hx + .04, 1.28, 8.2);
  scene.add(stripe);
  trainHatch = { x:hx, y:1.02, z:8.2, parts:[hatch, stripe] };
  const grab = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, 2.35, 8), metal);
  grab.position.set(.72, 1.2, 9.4);
  scene.add(grab);
}
dressTrain();

function applyLoot(t){
  AudioSys.checkpoint();
  if (t === 'med'){ G.regenFast = true; G.hp = 100; sToast('FIELD CACHE. FULL VITALS, FASTER RECOVERY.'); }
  else if (t === 'cell'){ G.dmgMul = (G.dmgMul||1) + .15; sToast('POWER CELLS. DAMAGE UP.', true); }
  else { G.detCalm = true; sToast('INTEL FRAGMENT. THE LEDGER HAS BLIND SPOTS. THIS WAS ONE.'); }
  renderPerks();
}

// pillars
PILLARS.forEach(([x,z,s])=> addBox(x-s, x+s, z-s, z+s, WALL_H, null));

// emissive light strips along walls (green; pulse red in alarm state)
const strips = [];
const fixtureMat = litMat({ color:0x2a3036, roughness:.45, metalness:.85, envMapIntensity:1.1 });
ROOMS.forEach(r=>{
  for (let z = r.z2-3; z > r.z1+1; z -= 6){
    [r.x1+.07, r.x2-.07].forEach(x=>{
      const housing = new THREE.Mesh(new THREE.BoxGeometry(.16, .2, 2.4), fixtureMat);
      const fy = Math.min(2.6, WALL_H-.4);
      housing.position.set(x, fy, z); scene.add(housing);
      const s = new THREE.Mesh(new THREE.BoxGeometry(.1, .12, 2.2), matStrip);
      s.position.set(x + (x<0?.05:-.05), fy, z); scene.add(s); strips.push(s);
      const halo = new THREE.Sprite(glowMat);
      halo.scale.set(2.2, 1.1, 1); halo.position.set(x + (x<0?.35:-.35), fy, z); scene.add(halo); markDecor(halo);
    });
  }
});

// structural ribs: wall posts + ceiling beam every 6m
const ribMat = patchSurface(litMat({ color:0x2e353b, roughness:.5, metalness:.85, envMapIntensity:1.1 }), { floorAO:.5, ceilAO:.3, aoH:1.2 });
const unitBox = new THREE.BoxGeometry(1,1,1);
ROOMS.forEach((r, ri)=>{
  for (let z = r.z2-4; z > r.z1+2; z -= 6){
    [[r.x1+.14, .32],[r.x2-.14, .32]].forEach(([x,sx])=>{
      const post = new THREE.Mesh(unitBox, ribMat);
      post.position.set(x, WALL_H/2, z); post.scale.set(sx, WALL_H, .4);
      scene.add(post); markDecor(post);
    });
    if ((CH.openRooms || []).includes(ri)) continue;   // open yard: nothing overhead
    const beam = new THREE.Mesh(unitBox, ribMat);
    beam.position.set((r.x1+r.x2)/2, WALL_H-.16, z);
    beam.scale.set(r.x2-r.x1, .32, .4);
    scene.add(beam); markDecor(beam);
  }
});

// conduit pipes running the length of each room
const pipeGeo = new THREE.CylinderGeometry(.07,.07,1,8);
const pipeMat = litMat({ color:0x2c343a, roughness:.4, metalness:.9, envMapIntensity:1.3 });
ROOMS.forEach(r=>{
  const len = r.z2-r.z1, zc = (r.z1+r.z2)/2;
  [[r.x1+.24,3.4],[r.x1+.24,3.18],[r.x2-.24,3.3]].forEach(([x,y])=>{
    const p = new THREE.Mesh(pipeGeo, pipeMat);
    p.rotation.x = Math.PI/2;
    p.position.set(x, y, zc); p.scale.set(1, len, 1);
    scene.add(p); markDecor(p);
  });
});

// scattered supply crates (solid, they block movement, shots and sight lines)
const crateMat = surfMat(CRATE_SET, 1, 1, {}, { floorAO:.55, ceilAO:0, aoH:.7, noise:false });
CH.crates.forEach(([x,z,s,rot])=>{
  const m = new THREE.Mesh(unitBox, crateMat);
  m.scale.set(s,s,s); m.position.set(x, s/2, z); m.rotation.y = rot;
  scene.add(m); wallMeshes.push(m);
  colliders.push({x1:x-s*.72, x2:x+s*.72, z1:z-s*.72, z2:z+s*.72});
});

// machine-light glow halos at every fixture (cheap stand-in for light bleed)
// volumetric-looking shafts: open additive cones under ceiling beams
const shaftGeo = new THREE.CylinderGeometry(.12, .95, WALL_H - .15, 20, 1, true);
const shaftVS = `varying vec3 vN; varying vec3 vV; varying float vH;
void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.); vN = normalize(normalMatrix * normal); vV = -mv.xyz; vH = uv.y; gl_Position = projectionMatrix * mv; }`;
const shaftFS = `uniform vec3 uCol; uniform float uA; varying vec3 vN; varying vec3 vV; varying float vH;
void main(){
  float f = pow(abs(dot(normalize(vN), normalize(vV))), 2.2);       // soft silhouette edges
  float h = pow(vH, 1.5);                                            // bright at the fixture, gone at the floor
  float nearFade = smoothstep(.8, 4., length(vV));                   // never a wall of light in your face
  gl_FragColor = vec4(uCol, f * h * nearFade * uA);
}`;
function addShaft(x, z, rank){
  const mat = new THREE.ShaderMaterial({ vertexShader:shaftVS, fragmentShader:shaftFS,
    uniforms:{ uCol:{ value:new THREE.Color(CH.palette.lamp).lerp(new THREE.Color(CH.palette.strip), .3) }, uA:{ value:.1 } },
    transparent:true, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide, fog:false });
  const m = new THREE.Mesh(shaftGeo, mat);
  m.position.set(x, (WALL_H - .15)/2 + .05, z);
  m.userData.rank = rank; m.userData.ph = rank*40; m.userData.base = .09 + (rank*7 % 1)*.07;
  scene.add(m); GFX.shafts.push(m);
}
if (!CH.outdoor || CH.roofRooms){
  let i = 0;
  ROOMS.forEach((r, ri) => {
    if (CH.outdoor && !CH.roofRooms.includes(ri)) return;
    for (let z = r.z2-4; z > r.z1+2; z -= 6){
      const cx = (r.x1 + r.x2)/2 + ((i % 2) ? -1 : 1) * Math.min(1.2, (r.x2 - r.x1)*.18);
      addShaft(cx, z, (i * .6180339) % 1); i++;
    }
  });
  GFX.shafts.sort((a,b) => a.userData.rank - b.userData.rank);
}

// flowing machine conduits low on the walls (dash texture scrolls along the run)
const condTex = (() => {
  const c = document.createElement('canvas'); c.width = 128; c.height = 8;
  const g = c.getContext('2d'); g.fillStyle = '#1a0c06'; g.fillRect(0,0,128,8);
  const gr = g.createLinearGradient(0,0,128,0); gr.addColorStop(0,'rgba(255,255,255,0)'); gr.addColorStop(.7,'rgba(255,255,255,.9)'); gr.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0,0,128,8);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
})();
const condMat = new THREE.MeshBasicMaterial({ map:condTex, color:CH.palette.strip });
const condTexes = [], condMats = [];
ROOMS.forEach(r => {
  const len = r.z2 - r.z1 - .6, zc = (r.z1 + r.z2)/2;
  [[r.x1 + .12, .5],[r.x2 - .12, .5]].forEach(([x,y]) => {
    const t = condTex.clone(); t.needsUpdate = true; t.repeat.set(len/2.2, 1); condTexes.push(t);
    const m = new THREE.Mesh(new THREE.BoxGeometry(.07,.07,len), condMat.clone());
    m.material.map = t; m.position.set(x, y, zc); scene.add(m); markDecor(m);
    condMats.push(m.material);
  });
});

// skirting + cornice trims, pillar plinths and light rings: silhouette detail and contact edges
const trimMat = litMat({ color:0x20252a, roughness:.5, metalness:.85, envMapIntensity:.8 });
ROOMS.forEach(r => {
  const len = r.z2 - r.z1, zc = (r.z1 + r.z2)/2;
  [[r.x1 + .1, .13, .26],[r.x2 - .1, .13, .26],[r.x1 + .1, WALL_H - .1, .2],[r.x2 - .1, WALL_H - .1, .2]].forEach(([x,y,hh]) => {
    const m = new THREE.Mesh(unitBox, trimMat);
    m.scale.set(.2, hh, len - .1); m.position.set(x, y, zc); scene.add(m); markDecor(m);
  });
});
PILLARS.forEach(([x,z,s]) => {
  const plinth = new THREE.Mesh(unitBox, trimMat);
  plinth.scale.set(s*2 + .24, .34, s*2 + .24); plinth.position.set(x, .17, z); scene.add(plinth); markDecor(plinth);
  const cap = new THREE.Mesh(unitBox, trimMat);
  cap.scale.set(s*2 + .2, .22, s*2 + .2); cap.position.set(x, WALL_H - .11, z); scene.add(cap); markDecor(cap);
  const ring = new THREE.Mesh(unitBox, matStrip);
  ring.scale.set(s*2 + .05, .06, s*2 + .05); ring.position.set(x, Math.min(2.55, WALL_H-.45), z); scene.add(ring); markDecor(ring);
});

// pipe flanges (one instanced draw) at every rib
{
  const flangeGeo = new THREE.TorusGeometry(.085, .028, 6, 14);
  const spots = [];
  ROOMS.forEach(r => {
    for (let z = r.z2-4; z > r.z1+2; z -= 6)
      [[r.x1+.24,3.4],[r.x1+.24,3.18],[r.x2-.24,3.3]].forEach(([x,y]) => spots.push([x,y,z]));
  });
  const im = new THREE.InstancedMesh(flangeGeo, trimMat, spots.length);
  const dm = new THREE.Object3D();
  spots.forEach(([x,y,z], i) => { dm.position.set(x,y,z); dm.rotation.set(0, Math.PI/2, 0); dm.updateMatrix(); im.setMatrixAt(i, dm.matrix); });
  scene.add(im); markDecor(im);
}

// floor scrap and rubble (one instanced draw)
{
  const R = rngOf(SEED + 7), geo = new THREE.DodecahedronGeometry(1, 0);
  const mat = litMat({ color:0x2a2e33, roughness:.7, metalness:.7, flatShading:true, envMapIntensity:.7 });
  const N = 150, im = new THREE.InstancedMesh(geo, mat, N), dm = new THREE.Object3D();
  for (let i=0;i<N;i++){
    const r = ROOMS[(R()*ROOMS.length)|0];
    const side = R() < .6, x = side ? (R() < .5 ? r.x1 + .3 + R()*1.1 : r.x2 - .3 - R()*1.1) : r.x1 + R()*(r.x2-r.x1);
    const z = r.z1 + 1 + R()*(r.z2 - r.z1 - 2), s = .03 + R()*R()*.2;
    dm.position.set(x, s*.5, z); dm.scale.set(s*(.8+R()), s*(.5+R()*.6), s*(.8+R()));
    dm.rotation.set(R()*6, R()*6, R()*6); dm.updateMatrix(); im.setMatrixAt(i, dm.matrix);
  }
  scene.add(im); markDecor(im);
}

// dust motes hanging in the air (soft sprites drifting in the vertex shader)
const dustU = { value:0 };
{
  const n = 320, pos = new Float32Array(n*3), R = rngOf(SEED + 3);
  for (let i=0;i<n;i++){
    pos[i*3] = (R()-.5)*18; pos[i*3+1] = .2 + R()*3.4; pos[i*3+2] = 3 - R()*145;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color:CH.palette.dust, size:.075, map:SOFT_TEX, transparent:true,
    opacity:.6, depthWrite:false, blending:THREE.AdditiveBlending });
  mat.onBeforeCompile = sh => {
    sh.uniforms.uT = dustU;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uT;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed += vec3(sin(uT*.31+position.z*3.1), cos(uT*.23+position.x*5.7)*.6, sin(uT*.19+position.y*7.3))*.22;');
  };
  mat.customProgramCacheKey = () => 'dust';
  const pts = new THREE.Points(g, mat); pts.frustumCulled = false;
  scene.add(pts); GFX.dust = pts;
}

// shadow flags: structure casts and receives, floor and ceiling only receive
wallMeshes.forEach(m => { m.castShadow = true; m.receiveShadow = true; if (m.userData.slab) m.castShadow = false; });

// chapter set-piece (hive core / ledger console). Built after shared geometry
const CORE_POS = new THREE.Vector3(...CH.objectivePos);
let PROPS = null;
let TUBES = null;   // suspension tubes + sleepers (humans.js), animated every frame

// pickup rifle on floor in start room
// shared unit geometries for all built models (scaled per part)
const sphereGeo  = new THREE.SphereGeometry(1, Q.p.basic ? 7 : 14, Q.p.basic ? 5 : 12);
const coneGeo    = new THREE.ConeGeometry(1, 1, Q.p.basic ? 5 : 6);
const cylGeo     = new THREE.CylinderGeometry(1, 1, 1, Q.p.basic ? 5 : 8);
const torusGeoLg = new THREE.TorusGeometry(.5, .045, 6, 24);
const torusGeoSm = new THREE.TorusGeometry(.42, .028, 6, 20);
const discGeo    = new THREE.CircleGeometry(.09, 10);
const eyeGeoC    = new THREE.SphereGeometry(.09, 10, 8);
const eyeGeoS    = new THREE.SphereGeometry(.12, 12, 10);

const gunMetal = litMat({ color:0x46524a, roughness:.38, metalness:.55 });
const gunDark  = litMat({ color:0x252c26, roughness:.5, metalness:.5 });
const glowGreenMat = new THREE.MeshBasicMaterial({ color:0xe7c98a });

// pulse rifle model, used for both the floor pickup and the view-model
function buildRifle(){
  const r = new THREE.Group();
  const parts = [
    [unitBox, gunMetal, [.085,.11,.42],  [0,0,0],       [0,0,0]],   // receiver
    [unitBox, gunDark,  [.07,.08,.26],   [0,-.005,-.32],[0,0,0]],   // fore-end
    [cylGeo,  gunDark,  [.022,.46,.022], [0,.02,-.58],  [Math.PI/2,0,0]], // barrel
    [cylGeo,  gunMetal, [.034,.05,.034], [0,.02,-.42],  [Math.PI/2,0,0]], // rib
    [cylGeo,  gunMetal, [.034,.05,.034], [0,.02,-.52],  [Math.PI/2,0,0]], // rib
    [cylGeo,  gunMetal, [.03,.08,.03],   [0,.02,-.78],  [Math.PI/2,0,0]], // muzzle brake
    [unitBox, gunDark,  [.03,.02,.34],   [0,.07,-.10],  [0,0,0]],   // top rail
    [unitBox, gunDark,  [.05,.05,.03],   [0,.10,.02],   [0,0,0]],   // sight base
    [unitBox, gunDark,  [.05,.14,.06],   [0,-.12,.10],  [.35,0,0]], // grip
    [unitBox, gunMetal, [.06,.09,.18],   [0,-.02,.28],  [0,0,0]],   // stock
    [unitBox, glowGreenMat, [.04,.035,.09], [0,-.065,-.02], [0,0,0]], // power cell
    [unitBox, matStrip, [.015,.015,.30], [.045,.02,-.15], [0,0,0]], // side light strip
  ];
  parts.forEach(([geo,mat,s,p,rot])=>{
    const m = new THREE.Mesh(geo, mat);
    m.scale.set(...s); m.position.set(...p); m.rotation.set(...rot);
    r.add(m);
  });
  const ring = new THREE.Mesh(torusGeoSm, gunDark);       // holo sight ring
  ring.scale.setScalar(.1); ring.position.set(0,.14,.02);
  const dot = new THREE.Mesh(eyeGeoC, glowGreenMat);      // holo dot
  dot.scale.setScalar(.22); dot.position.set(0,.14,.015);
  r.add(ring, dot);
  return r;
}

const rifleFloor = new THREE.Group();
{
  const rf = buildRifle();
  rf.rotation.set(0, .9, Math.PI/2);
  const glow = new THREE.Mesh(new THREE.BoxGeometry(.05,.05,.5), matStrip);
  glow.position.y = .12;
  rifleFloor.add(rf, glow);
  rifleFloor.position.set(0, .25, -4);
  if (!CH.startArmed && !CH.stealth) scene.add(rifleFloor);
}

// view-model rifle (attached to camera after pickup)
const VMLIGHT = { value:.62 };   // direct light reaching the viewmodel (raised by the muzzle flash)
function dimViewmodel(group){
  // the view-model sits half a metre from the headlamp, so its lit materials are
  // darkened and de-glossed or physically-correct falloff blows them out white
  const seen = new Map();
  group.traverse(o => {
    if (!o.isMesh) return;
    o.castShadow = false; o.receiveShadow = false; o.frustumCulled = false;
    if (!seen.has(o.material)){
      const m = o.material.clone();
      if (m.isMeshLambertMaterial){
        const glow = m.emissive && m.emissive.getHex() > 0 && m.emissiveIntensity > 0;
        if (!glow && m.color) m.color.multiplyScalar(.5);
      } else if (m.isMeshStandardMaterial){
        const glow = m.emissiveIntensity > 0 && m.emissive.getHex() > 0;
        if (glow) m.emissiveIntensity = Math.min(m.emissiveIntensity, .55);
        else { m.color.multiplyScalar(.78); m.roughness = Math.max(.42, m.roughness); m.metalness = Math.min(.75, m.metalness); m.envMapIntensity = 1.15; }
        m.onBeforeCompile = sh => {
          sh.uniforms.uVML = VMLIGHT;
          sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uVML;')
            .replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\nreflectedLight.directDiffuse *= uVML; reflectedLight.directSpecular *= uVML;');
        };
        m.customProgramCacheKey = () => 'vm';
      }
      seen.set(o.material, m);
    }
    o.material = seen.get(o.material);
  });
}
const viewRifle = new THREE.Group();
// viewmodel rest position; portrait phones see a narrow horizontal field, so
// the rifle is pulled toward the centre line there (Hive layoutViewmodel)
const VMB = new THREE.Vector3(.24, -.22, -.5);
function layoutViewmodel(){
  const portrait = window.innerWidth / window.innerHeight < .9;
  VMB.set(portrait ? .085 : .24, portrait ? -.2 : -.22, portrait ? -.46 : -.5);
  viewRifle.scale.setScalar(portrait ? .8 : 1);
  viewRifle.position.x = VMB.x;
}
addEventListener('resize', layoutViewmodel);
{
  const vr = buildRifle();
  dimViewmodel(vr);
  viewRifle.add(vr);
  viewRifle.position.copy(VMB);
  viewRifle.visible = false;
  camera.add(viewRifle);
}
modelsReady.then(() => {
  if (!MODELS.rifle) return;
  viewRifle.clear();
  const vr = MODELS.rifle.template.clone();
  dimViewmodel(vr);
  viewRifle.add(vr);
  if (rifleFloor.parent){
    rifleFloor.remove(rifleFloor.children[0]);
    const rf = MODELS.rifle.template.clone();
    rf.rotation.set(0, .9, Math.PI/2);
    rifleFloor.add(rf);
  }
});

// tracer line pool
const tracerMat = new THREE.LineBasicMaterial({ color:0xbaffd9, transparent:true, opacity:1 });
const tracers = [];
function spawnTracer(from, to){
  const g = new THREE.BufferGeometry().setFromPoints([from, to]);
  const line = new THREE.Line(g, tracerMat.clone());
  scene.add(line);
  tracers.push({ line, life:.07 });
}

// impact sparks
const sparkMat = new THREE.PointsMaterial({ color:0xbfffd2, size:.06,
  transparent:true, opacity:1, depthWrite:false, blending:THREE.AdditiveBlending });
const sparks = [];
function spawnSparks(at, n=10, color){
  if (Q.p.basic) n = Math.min(n|0, 3);
  if (n <= 0) return;
  const pos = new Float32Array(n*3), vel = [];
  for (let i=0;i<n;i++){
    pos[i*3]=at.x; pos[i*3+1]=at.y; pos[i*3+2]=at.z;
    vel.push(new THREE.Vector3((Math.random()-.5)*6,(Math.random()-.2)*5,(Math.random()-.5)*6));
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = sparkMat.clone(); if (color) m.color.setHex(color);
  const pts = new THREE.Points(g, m);
  scene.add(pts);
  sparks.push({ pts, vel, life:.35 });
}

// soft blob shadow (grounds the drones)
const shadowTex = makeTex((g,s)=>{
  const d = g.createRadialGradient(s/2,s/2,4,s/2,s/2,s/2);
  d.addColorStop(0,'rgba(0,0,0,.85)'); d.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=d; g.fillRect(0,0,s,s);
}, 128);
const shadowMat = new THREE.MeshBasicMaterial({ map:shadowTex, transparent:true,
  opacity:.6, depthWrite:false });
const shadowGeo = new THREE.PlaneGeometry(1,1);

/* ---- chapter set-piece props ---- */
function textPlate(txt){
  const c = document.createElement('canvas'); c.width = 256; c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#0c1214'; g.fillRect(0,0,256,64);
  g.strokeStyle = 'rgba(174,233,255,.5)'; g.lineWidth = 3; g.strokeRect(3,3,250,58);
  g.fillStyle = '#cdeefb'; g.font = 'bold 30px monospace'; g.textAlign = 'center';
  g.fillText(txt, 128, 42);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshBasicMaterial({ map: t });
}
function buildPropsCh1(){
  const g = new THREE.Group();
  const coreMat = litMat({ color:0x0c1810, emissive:0xe7c98a,
    emissiveIntensity:.9, roughness:.3, metalness:.6 });
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5, 1), coreMat);
  core.position.y = 2;
  const wire = new THREE.LineSegments(new THREE.EdgesGeometry(core.geometry),
    new THREE.LineBasicMaterial({ color:0xbaffd9 }));
  wire.position.y = 2;
  g.add(core, wire);
  g.position.set(CORE_POS.x, 0, CORE_POS.z);
  scene.add(g);
  return {
    animate(dt){ g.rotation.y += dt*.4; coreMat.emissiveIntensity = .9 + Math.sin(G.time*3)*.3; },
    onComplete(){ coreMat.emissive.setHex(0xffd23f); },
  };
}
function buildPropsCh2(){
  const glassMat  = litMat({ color:0xbfe4ef, roughness:.12,
    metalness:0, transparent:true, opacity:.16, depthWrite:false });
  const fluidMat  = new THREE.MeshBasicMaterial({ color:0x86d8c9, transparent:true,
    opacity:.13, blending:THREE.AdditiveBlending, depthWrite:false });
  const figureMat = litMat({ color:0x0a0d0e, roughness:.9, metalness:0 });
  const baseMat   = litMat({ color:0x39444a, roughness:.5, metalness:.6 });
  const usePod = !!MODELS.pod;
  if (window.WakingHumans && CH.cylinders.length){
    // suspension tubes: amber fluid, bubbles, cables and a sleeper in every one (humans.js)
    TUBES = WakingHumans.buildTubes(CH.cylinders, { quality: Q.level, fluid: 0xd98a2b });
    scene.add(TUBES.group);
    CH.cylinders.forEach(([x,z]) => colliders.push({x1:x-.6, x2:x+.6, z1:z-.6, z2:z+.6}));
  }
  else CH.cylinders.forEach(([x,z,angela])=>{
    if (usePod){
      const pod = MODELS.pod.template.clone();
      pod.position.set(x, 0, z);
      pod.rotation.y = (x*3.1 + z*.7) % 6.28;
      scene.add(pod);
      if (angela){
        const plate = new THREE.Mesh(new THREE.PlaneGeometry(.8,.2), textPlate('ANGELA M.'));
        plate.position.set(x - Math.sign(x)*.62, 1.1, z);
        plate.rotation.y = x > 0 ? -Math.PI/2 : Math.PI/2;
        scene.add(plate);
      }
      colliders.push({x1:x-.55, x2:x+.55, z1:z-.55, z2:z+.55});
      return;
    }
    const base = new THREE.Mesh(cylGeo, baseMat);
    base.scale.set(.55,.3,.55); base.position.set(x,.15,z);
    const glass = new THREE.Mesh(cylGeo, glassMat);
    glass.scale.set(.45,2.3,.45); glass.position.set(x,1.45,z);
    const fluid = new THREE.Mesh(cylGeo, angela ? fluidMat.clone() : fluidMat);
    fluid.scale.set(.41,2.2,.41); fluid.position.set(x,1.45,z);
    const fig = new THREE.Mesh(sphereGeo, figureMat);
    fig.scale.set(.17,.62,.13); fig.position.set(x,1.35,z);
    const cap = new THREE.Mesh(cylGeo, baseMat);
    cap.scale.set(.5,.18,.5); cap.position.set(x,2.7,z);
    scene.add(base, glass, fluid, fig, cap);
    if (angela){
      fluid.material.opacity = .3;
      const plate = new THREE.Mesh(new THREE.PlaneGeometry(.8,.2), textPlate('ANGELA M.'));
      plate.position.set(x - Math.sign(x)*.62, 1.1, z);
      plate.rotation.y = x > 0 ? -Math.PI/2 : Math.PI/2;
      scene.add(plate);
    }
    colliders.push({x1:x-.5, x2:x+.5, z1:z-.5, z2:z+.5});
  });
  // ledger console
  const g = new THREE.Group();
  const desk = new THREE.Mesh(unitBox, baseMat);
  desk.scale.set(2.6,.95,.9); desk.position.y = .48;
  const screenMat = new THREE.MeshBasicMaterial({ color:0xaee9ff, transparent:true, opacity:.85 });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.2,.8), screenMat);
  screen.position.set(0, 1.55, .1); screen.rotation.x = -.35;
  const towerL = new THREE.Mesh(unitBox, baseMat);
  towerL.scale.set(.5,2.4,.5); towerL.position.set(-1.8,1.2,0);
  const towerR = towerL.clone(); towerR.position.x = 1.8;
  g.add(desk, screen, towerL, towerR);
  g.position.set(CORE_POS.x, 0, CORE_POS.z);
  scene.add(g);
  colliders.push({x1:CORE_POS.x-1.4, x2:CORE_POS.x+1.4, z1:CORE_POS.z-.5, z2:CORE_POS.z+.5});
  return {
    animate(dt){ screenMat.opacity = .7 + Math.sin(G.time*7)*.12 + Math.sin(G.time*23)*.06; },
    onComplete(){ screenMat.color.setHex(0xffd23f); },
  };
}
function buildPropsCh3(){
  const frame = litMat({ color:0x4a4238, roughness:.5, metalness:.6 });
  const amber = new THREE.MeshBasicMaterial({ color:0xffb85c, transparent:true, opacity:.9 });
  const colMat = new THREE.MeshBasicMaterial({ color:0xffb85c, transparent:true,
    opacity:.1, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide });
  const screenMat = new THREE.MeshBasicMaterial({ color:0xffd9a0, transparent:true, opacity:.8 });
  const g = new THREE.Group();
  const base = new THREE.Mesh(cylGeo, frame);
  base.scale.set(.6,.5,.6); base.position.y = .25;
  const seat = new THREE.Mesh(unitBox, frame);
  seat.scale.set(1.0,.15,1.0); seat.position.y = .6;
  const back = new THREE.Mesh(unitBox, frame);
  back.scale.set(1.0,1.25,.15); back.position.set(0,1.25,.5); back.rotation.x = -.18;
  const cradle = new THREE.Mesh(torusGeoSm, amber);            // the contact array
  cradle.scale.setScalar(.6); cradle.position.set(0,1.85,.42);
  const halo = new THREE.Mesh(torusGeoLg, amber);
  halo.scale.setScalar(1.7); halo.rotation.x = Math.PI/2; halo.position.y = 2.7;
  const column = new THREE.Mesh(cylGeo, colMat);
  column.scale.set(.85,3.6,.85); column.position.y = 1.8;
  g.add(base, seat, back, cradle, halo, column);
  [-2.2, 2.2].forEach(x => {
    const desk = new THREE.Mesh(unitBox, frame);
    desk.scale.set(1.4,.9,.7); desk.position.set(x,.45,.2);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.1,.5), screenMat);
    scr.position.set(x,1.25,.35); scr.rotation.x = -.3;
    g.add(desk, scr);
  });
  g.position.set(CORE_POS.x, 0, CORE_POS.z);
  scene.add(g);
  colliders.push({x1:CORE_POS.x-.8, x2:CORE_POS.x+.8, z1:CORE_POS.z-.6, z2:CORE_POS.z+.6});
  return {
    animate(dt){
      halo.rotation.z += dt * .7;
      colMat.opacity = .08 + Math.sin(G.time*5)*.03 + Math.sin(G.time*17)*.02;
      screenMat.opacity = .65 + Math.sin(G.time*9)*.15;
    },
    onComplete(){
      amber.color.setHex(0xd6ffe6);
      colMat.color.setHex(0xd6ffe6); colMat.opacity = .3;
      screenMat.color.setHex(0xd6ffe6);
    },
  };
}
// the junction chamber where six data pathways converge (Book Ch 5)
function buildPropsJunction(){
  const g = new THREE.Group();
  const frame = litMat({ color:0x2c2a29, roughness:.5, metalness:.8 });
  const cable = [0x26313d, 0x3d2522, 0x22352b, 0x2e2e2e];          // power, data, coolant, spare
  const pulseMat = new THREE.MeshBasicMaterial({ color:0xff8a5a, transparent:true, opacity:.9 });
  const haloMat = new THREE.MeshBasicMaterial({ color:0xff8a5a, transparent:true, opacity:.12, blending:THREE.AdditiveBlending, depthWrite:false });
  const node = new THREE.Mesh(cylGeo, frame); node.scale.set(.75,1.6,.75); node.position.y = .8;
  const cap = new THREE.Mesh(cylGeo, frame); cap.scale.set(.9,.12,.9); cap.position.y = 1.66;
  const core = new THREE.Mesh(sphereGeo, pulseMat); core.scale.setScalar(.32); core.position.y = 1.95;
  const halo = new THREE.Mesh(sphereGeo, haloMat); halo.scale.setScalar(.9); halo.position.y = 1.95;
  g.add(node, cap, core, halo);
  for (let i = 0; i < 6; i++){                                     // six pathways converge
    const a = i / 6 * Math.PI * 2 + .3;
    for (let k = 0; k < 3; k++){
      const m = new THREE.Mesh(unitBox, litMat({ color:cable[(i+k)%4], roughness:.6, metalness:.3 }));
      m.scale.set(.09, .09, 5.2); m.position.set(Math.sin(a)*3 + Math.cos(a)*(k-1)*.12, .06 + k*.1, Math.cos(a)*3 - Math.sin(a)*(k-1)*.12);
      m.rotation.y = a; g.add(m);
    }
  }
  g.position.set(CORE_POS.x, 0, CORE_POS.z);
  scene.add(g);
  colliders.push({x1:CORE_POS.x-.8, x2:CORE_POS.x+.8, z1:CORE_POS.z-.8, z2:CORE_POS.z+.8});
  return {
    animate(){                                                      // a soft repetitive pulse, biological in rhythm
      const b = Math.pow(Math.max(0, Math.sin(G.time*2.2)), 6) + Math.pow(Math.max(0, Math.sin(G.time*2.2 - .5)), 8)*.6;
      core.scale.setScalar(.3 + b*.08); halo.scale.setScalar(.85 + b*.35); haloMat.opacity = .08 + b*.18;
    },
    onComplete(){ pulseMat.color.setHex(0xd6ffe6); haloMat.color.setHex(0xd6ffe6); },
  };
}
PROPS = { animate(){}, onComplete(){} };
modelsReady.then(() => {
  PROPS = CH.setPiece === 'ledger' ? buildPropsCh2() : CH.setPiece === 'uplink' ? buildPropsCh3() : CH.setPiece === 'junction' ? buildPropsJunction() : buildPropsCh1();
});

// story pickup: the dead man's radio, hidden in the hardware district
let radioProp = CH.id !== 'ep1' ? null : (() => {
  const g = new THREE.Group();
  const b = new THREE.Mesh(unitBox, litMat({color:0x1c221c,metalness:.6,roughness:.4}));
  b.scale.set(.34,.14,.22); b.position.y = .3; g.add(b);
  const led = new THREE.Mesh(new THREE.SphereGeometry(.035,8,6), new THREE.MeshBasicMaterial({color:0xe7c98a}));
  led.position.set(.1,.4,.08); g.add(led);
  const l = new THREE.PointLight(0xe7c98a, 2.6, 7, 2); l.position.y = .7; EXTRA_LIGHTS.push(l); g.add(l);
  g.position.set(0, 0, -62);
  scene.add(g);
  return g;
})();

/* ============================================================
   Drones
   ============================================================ */
const EYE_GREEN = 0xe7c98a, EYE_RED = 0xff2b3c;
const droneMetal = litMat({ color:0x59685c, roughness:.42, metalness:.55 });
const droneDark  = litMat({ color:0x2b332c, roughness:.55, metalness:.5 });
const droneArmor = litMat({ color:0x48594d, roughness:.5, metalness:.6 });
const thrusterGlowMat = new THREE.MeshBasicMaterial({ color:0xe7c98a, transparent:true,
  opacity:.7, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide });

// six-legged hunter with an articulated walk cycle and a scanning sensor head
function buildCrawler(eyeMat){
  if (Q.p.basic){
    // Hull, eye, six sticks. Same walk cycle, a fraction of the draws.
    const g = new THREE.Group(), anim = { legs: [] };
    const hull = new THREE.Mesh(sphereGeo, droneMetal);
    hull.scale.set(.34,.22,.42); g.add(hull);
    const head = new THREE.Group();
    const eye = new THREE.Mesh(eyeGeoC, eyeMat); eye.position.z = .1;
    head.add(eye); head.position.set(0,.12,.32);
    g.add(head); anim.head = head;
    for (let i=0;i<6;i++){
      const side = i<3 ? 1 : -1;
      const theta = side * (0.7 + (i%3) * 0.85);
      const root = new THREE.Group();
      root.position.set(Math.sin(theta)*.26, -.02, Math.cos(theta)*.26);
      root.rotation.y = theta - Math.PI/2;
      const leg = new THREE.Mesh(unitBox, droneDark);
      leg.scale.set(.42,.045,.045); leg.position.set(.2, 0, 0);
      root.add(leg); g.add(root);
      anim.legs.push({ root, baseYaw: root.rotation.y, phase: (i%2) * Math.PI });
    }
    return { g, anim };
  }
  const g = new THREE.Group(), anim = { legs: [] };
  const hull = new THREE.Mesh(sphereGeo, droneMetal);
  hull.scale.set(.30,.20,.38); g.add(hull);
  const shell = new THREE.Mesh(sphereGeo, droneArmor);
  shell.scale.set(.26,.15,.33); shell.position.y = .10; g.add(shell);
  const vent = new THREE.Mesh(unitBox, droneDark);
  vent.scale.set(.18,.07,.24); vent.position.y = -.12; g.add(vent);
  const head = new THREE.Group();
  const skull = new THREE.Mesh(sphereGeo, droneDark); skull.scale.setScalar(.11);
  const eye = new THREE.Mesh(eyeGeoC, eyeMat); eye.position.z = .08;
  const antL = new THREE.Mesh(cylGeo, droneDark);
  antL.scale.set(.008,.17,.008); antL.position.set(.05,.13,-.02); antL.rotation.z = .35;
  const antR = antL.clone(); antR.position.x = -.05; antR.rotation.z = -.35;
  head.add(skull, eye, antL, antR);
  head.position.set(0,.15,.30);
  g.add(head); anim.head = head;
  for (let i=0;i<6;i++){
    const side = i<3 ? 1 : -1;
    const theta = side * (0.7 + (i%3) * 0.85);        // radians around from forward
    const root = new THREE.Group();
    root.position.set(Math.sin(theta)*.26, -.02, Math.cos(theta)*.26);
    root.rotation.y = theta - Math.PI/2;               // local +x points outward
    const upper = new THREE.Mesh(unitBox, droneMetal);
    upper.scale.set(.30,.05,.05); upper.position.set(.14,.08,0); upper.rotation.z = .55;
    const hip = new THREE.Mesh(sphereGeo, droneDark);
    hip.scale.setScalar(.05);
    const lower = new THREE.Mesh(coneGeo, droneDark);
    lower.scale.set(.035,.52,.035); lower.position.set(.37,-.06,0); lower.rotation.z = 2.5;
    root.add(upper, hip, lower);
    g.add(root);
    anim.legs.push({ root, baseYaw: root.rotation.y, phase: (i%2) * Math.PI });
  }
  return { g, anim };
}

// armored hover-sentry: gyro rings, thruster pods, recoiling under-barrel gun
function buildSentry(eyeMat){
  if (Q.p.basic){
    const g = new THREE.Group(), anim = {};
    const hull = new THREE.Mesh(sphereGeo, droneMetal);
    hull.scale.set(.34,.28,.34); g.add(hull);
    const eye = new THREE.Mesh(eyeGeoS, eyeMat); eye.position.z = .32; g.add(eye);
    anim.ringH = new THREE.Object3D();
    anim.ringV = new THREE.Object3D();
    anim.barrel = new THREE.Group();
    anim.barrel.position.set(0,-.22,.12);
    const barrel = new THREE.Mesh(cylGeo, droneDark);
    barrel.scale.set(.045,.36,.045); barrel.rotation.x = Math.PI/2; barrel.position.z = .16;
    anim.muzzle = new THREE.Object3D();
    anim.muzzle.position.z = .34;
    anim.barrel.add(barrel, anim.muzzle);
    g.add(anim.barrel);
    anim.recoil = 0;
    return { g, anim };
  }
  const g = new THREE.Group(), anim = {};
  const hull = new THREE.Mesh(sphereGeo, droneMetal);
  hull.scale.set(.30,.26,.30); g.add(hull);
  for (let i=0;i<4;i++){
    const a = i*Math.PI/2 + Math.PI/4;
    const plate = new THREE.Mesh(unitBox, droneArmor);
    plate.scale.set(.17,.21,.035);
    plate.position.set(Math.sin(a)*.30, .02, Math.cos(a)*.30);
    plate.rotation.y = a;
    g.add(plate);
  }
  const socket = new THREE.Mesh(torusGeoSm, droneDark);
  socket.scale.setScalar(.45); socket.position.z = .28;
  const eye = new THREE.Mesh(eyeGeoS, eyeMat); eye.position.z = .30;
  const fin = new THREE.Mesh(unitBox, droneDark);
  fin.scale.set(.04,.26,.16); fin.position.set(0,.36,-.08);
  g.add(socket, eye, fin);
  anim.ringH = new THREE.Mesh(torusGeoLg, droneDark);
  anim.ringH.rotation.x = Math.PI/2;
  const vGrp = new THREE.Group();
  const ringV = new THREE.Mesh(torusGeoSm, droneMetal);
  ringV.rotation.y = Math.PI/2;
  vGrp.add(ringV); anim.ringV = vGrp;
  g.add(anim.ringH, vGrp);
  for (let i=0;i<4;i++){
    const a = i*Math.PI/2 + Math.PI/4;
    const pod = new THREE.Mesh(cylGeo, droneDark);
    pod.scale.set(.05,.11,.05);
    pod.position.set(Math.sin(a)*.19, -.24, Math.cos(a)*.19);
    const jet = new THREE.Mesh(discGeo, thrusterGlowMat);
    jet.rotation.x = -Math.PI/2;
    jet.position.set(pod.position.x, -.31, pod.position.z);
    g.add(pod, jet);
  }
  const mount = new THREE.Mesh(unitBox, droneDark);
  mount.scale.set(.08,.09,.14); mount.position.set(0,-.27,.06);
  g.add(mount);
  anim.barrel = new THREE.Group();
  anim.barrel.position.set(0,-.27,.12);
  const barrel = new THREE.Mesh(cylGeo, gunDark);
  barrel.scale.set(.03,.32,.03); barrel.rotation.x = Math.PI/2; barrel.position.z = .16;
  anim.muzzle = new THREE.Object3D();
  anim.muzzle.position.z = .34;
  anim.barrel.add(barrel, anim.muzzle);
  g.add(anim.barrel);
  anim.recoil = 0;
  return { g, anim };
}

// per-kind combat stats; warden is the heavy sentry frame from chapter 2
const KINDS = {
  crawler: { hp:30,  rad:.55, homeY:.5 },
  sentry:  { hp:60,  rad:.65, homeY:1.7, charge:1.6, tele:.7,  pdmg:12, pspeed:13, scale:1,    idleEye:0xe7c98a },
  warden:  { hp:130, rad:.95, homeY:1.9, charge:1.0, tele:.5,  pdmg:16, pspeed:17, scale:1.55, idleEye:0xffc24d },
};

const drones = [];
let droneSeq = 0;

function makeDrone(kind, x, z, segment){
  const isCrawler = kind === 'crawler';
  const K = KINDS[kind];
  const eyeMat = new THREE.MeshBasicMaterial({ color: K.idleEye || EYE_GREEN });
  const M = Q.p.basic ? null : MODELS[kind];
  let built;
  if (M){
    const g = M.template.clone();
    const anim = { glb: true };
    const eye = new THREE.Mesh(eyeGeoC, eyeMat);
    eye.position.set(...M.eye);
    g.add(eye);
    if (M.muzzle){
      anim.muzzle = new THREE.Object3D();
      anim.muzzle.position.set(...M.muzzle);
      g.add(anim.muzzle);
      anim.recoil = 0;
    }
    built = { g, anim };
  } else {
    built = isCrawler ? buildCrawler(eyeMat) : buildSentry(eyeMat);
  }
  const mesh = built.g;
  // blob shadow, child of the group but pinned to the floor each frame
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI/2;
  shadow.scale.setScalar(isCrawler ? 1.2 : 1.4);
  mesh.add(shadow);
  if (!M && K.scale && K.scale !== 1) mesh.scale.setScalar(K.scale);
  const d = {
    id: droneSeq++, kind, segment, mesh, eyeMat, anim: built.anim, shadow,
    baseScale: M ? 1 : (K.scale || 1), idleEye: K.idleEye || EYE_GREEN,
    home: new THREE.Vector3(x, K.homeY, z),
    hp: K.hp, maxHp: K.hp,
    state: 'idle',            // idle > alert > attack
    stateT: 0, losT: Math.random()*.15,
    meleeCd: 0, chargeT: 0, patrolDir: 1,
    alive: true, spawned: false, deathT: 0,
  };
  mesh.position.copy(d.home);
  drones.push(d);
  return d;
}

const INITIAL_DRONES = CH.drones;
const spawnedSegs = new Set();
const clearedSegs = new Set();

function spawnSegment(seg){
  // (re)create the initial drones of a segment; used at load + on respawn
  for (let i = drones.length-1; i >= 0; i--){
    if (drones[i].segment === seg){
      scene.remove(drones[i].mesh);
      if (drones[i].w) scene.remove(drones[i].w.grp);
      drones.splice(i,1);
    }
  }
  if (clearedSegs.has(seg)){
    spawnedSegs.add(seg);
    return;
  }
  INITIAL_DRONES.filter(d=>d[3]===seg).forEach(([k,x,z,s])=>{
    const d = makeDrone(k,x,z,s);
    d.spawned = true; scene.add(d.mesh);
  });
  spawnedSegs.add(seg);
  if (seg === 2) addHatchCrawler();
}
function markSegmentsCleared(list){
  (list || []).forEach(seg => {
    clearedSegs.add(seg);
    spawnSegment(seg);
  });
}
function addHatchCrawler(){
  if (!SFLAGS.hatchScar) return;
  if (clearedSegs.has(2)) return;
  if (drones.some(d => d.scar === 'hatch' && d.alive)) return;
  const d = makeDrone('crawler', 2.2, -22, 2);
  d.spawned = true;
  d.scar = 'hatch';
  scene.add(d.mesh);
}
let initialSpawned = false;
function spawnAllInitial(){
  if (initialSpawned) return;
  initialSpawned = true;
  const segs = new Set(INITIAL_DRONES.map(d => d[3]));
  segs.forEach(spawnSegment);
}
// Models usually win. If a GLB load never settles, procedural frames still
// spawn, or a cleared door waits forever on an enemy that is not there.
modelsReady.then(spawnAllInitial);
setTimeout(spawnAllInitial, 2500);

function segmentCleared(seg){
  // Models arrive a moment after the title. An unspawned segment is not clear,
  // or Continue would open the next door and start its story early.
  if (clearedSegs.has(seg)) return true;
  if (!spawnedSegs.has(seg)) return false;
  return !drones.some(d => d.segment === seg && d.alive);
}
function activeDroneCount(){
  return drones.filter(d => d.alive).length;
}

// core-wave spawn points (room corners)
const WAVE_SPAWNS = CH.waveSpawns;
const MAX_ACTIVE = 8, WAVE_TOTAL = CH.waveTotal;

/* ============================================================
   Sentry projectiles
   ============================================================ */
const projGeo = new THREE.SphereGeometry(.14, 6, 6);
const projMat = new THREE.MeshBasicMaterial({ color:0xff5566 });
const projectiles = [];
const projMats = {};
let projGlowMat = null;
function fireProjectile(from, target, speed = 13, dmg = 12, o){
  o = o || {};
  const mat = o.col ? (projMats[o.col] || (projMats[o.col] = new THREE.MeshBasicMaterial({ color:o.col }))) : projMat;
  const m = new THREE.Mesh(projGeo, mat);
  m.position.copy(from);
  if (o.r) m.scale.setScalar(o.r);
  if (o.glow && !Q.p.basic){
    projGlowMat = projGlowMat || new THREE.SpriteMaterial({ map:softSpriteTex(), color:0xff6a3a, transparent:true, opacity:.85, blending:THREE.AdditiveBlending, depthWrite:false });
    const sp = new THREE.Sprite(projGlowMat); sp.scale.setScalar(1.6); m.add(sp);
  }
  const vel = target.clone().sub(from).normalize().multiplyScalar(speed);
  scene.add(m);
  projectiles.push({ mesh:m, vel, life:4, dmg, hitR2: o.hitR ? o.hitR*o.hitR : .45, grace: o.grace || 0 });
  if (!o.silent) AudioSys.sentryFire();
}

/* ============================================================
   Game state
   ============================================================ */
const G = {
  mode: 'boot',            // boot > title > intro > play > dead > extracting > end
  hp: 100, lastDamageT: 0,
  hasRifle: false, fireCd: 0,
  yaw: 0, pitch: 0,
  checkpoint: { pos: new THREE.Vector3(0, 0, CH.spawnZ || 0), yaw: 0, segment: 0 },
  currentSegment: 0,
  radioQueue: [], radioT: 0, radioFired: new Set(),
  plantProgress: 0, planting: false, planted: false, detect: 0, escape: false,
  ambush: null,          // null, live, ending, ended. Final chapter exit fight.
  alarm: false, waveSpawned: 0, waveT: 0,
  finaleStarted: false,
  furthest: 0,
  time: 0, shakeT: 0,
  firedClips: new Set(), padFire: false, padUse: false, storyQueued: false,
};
const PLAYER_R = 0.4, PLAYER_EYE = 1.7;
const MOVE_SPEED = 5.2;

yawObj.position.set(0, PLAYER_EYE, 0);

/* ============================================================
   Input
   ============================================================ */
const keys = {};
let mouseFiring = false, pointerLocked = false;
let lockAt = 0;
const MOVE_AXIS = {
  KeyW:[0,-1], ArrowUp:[0,-1], KeyS:[0,1], ArrowDown:[0,1],
  KeyA:[-1,0], ArrowLeft:[-1,0], KeyD:[1,0], ArrowRight:[1,0],
};
const moveDown = {};
const moveEdges = [];
let moveFrameStart = performance.now();

function noteMoveDown(code, now){
  if (!MOVE_AXIS[code] || moveDown[code] != null) return;
  moveDown[code] = now;
}
function noteMoveUp(code, now){
  if (moveDown[code] == null) return;
  moveEdges.push({ code, t0: moveDown[code], t1: now });
  moveDown[code] = null;
}
function releaseMoveKeys(now){
  for (const code in moveDown) noteMoveUp(code, now);
}
function sampleMoveSeconds(now){
  const t0 = moveFrameStart;
  moveFrameStart = now;
  const frame = Math.max(0, (now - t0) / 1000);
  let x = 0, z = 0;
  const add = (code, a, b) => {
    const sign = MOVE_AXIS[code];
    if (!sign) return;
    const sec = Math.max(0, (b - a) / 1000);
    x += sign[0] * sec;
    z += sign[1] * sec;
  };
  for (const code in moveDown){
    if (moveDown[code] == null) continue;
    add(code, Math.max(moveDown[code], t0), now);
  }
  for (const edge of moveEdges) add(edge.code, Math.max(edge.t0, t0), Math.min(edge.t1, now));
  moveEdges.length = 0;
  return { x, z, frame };
}

addEventListener('keydown', e => {
  if (!keys[e.code]) noteMoveDown(e.code, performance.now());
  keys[e.code] = true;
  if (e.code === 'KeyM') MusicSys.toggleMute();
});
addEventListener('keyup', e => {
  noteMoveUp(e.code, performance.now());
  keys[e.code] = false;
});

renderer.domElement.addEventListener('click', () => {
  if (G.mode === 'play' && !IS_TOUCH && !pointerLocked){
    renderer.domElement.requestPointerLock();
  }
});
document.addEventListener('pointerlockchange', () => {
  pointerLocked = document.pointerLockElement === renderer.domElement;
  if (pointerLocked) lockAt = performance.now();
});
addEventListener('mousemove', e => {
  if (!pointerLocked || G.mode !== 'play') return;
  if (swallowLook(performance.now() - lockAt, e.movementX, e.movementY)) return;
  G.yaw   -= e.movementX * 0.0022;
  G.pitch -= e.movementY * 0.0022;
  G.pitch = Math.max(-1.35, Math.min(1.35, G.pitch));
});
addEventListener('mousedown', e => { if (pointerLocked && e.button === 0) mouseFiring = true; });
addEventListener('mouseup',   e => { if (e.button === 0) mouseFiring = false; });

// --- touch: left zone stick, right zone look, fire & plant buttons ---
const stick = { active:false, id:null, ox:0, oy:0, dx:0, dy:0 };
const look  = { active:false, id:null, lx:0, ly:0 };
let touchFiring = false, touchPlanting = false;

el.stickZone.addEventListener('touchstart', e => {
  e.preventDefault();
  const t = e.changedTouches[0];
  stick.active = true; stick.id = t.identifier;
  stick.ox = t.clientX; stick.oy = t.clientY; stick.dx = 0; stick.dy = 0;
  el.stickBase.style.display = 'block';
  el.stickBase.style.left = t.clientX+'px'; el.stickBase.style.top = t.clientY+'px';
}, {passive:false});
el.stickZone.addEventListener('touchmove', e => {
  e.preventDefault();
  for (const t of e.changedTouches){
    if (t.identifier !== stick.id) continue;
    const dx = t.clientX - stick.ox, dy = t.clientY - stick.oy;
    const len = Math.hypot(dx,dy), max = 48;
    const k = len > max ? max/len : 1;
    stick.dx = dx*k/max; stick.dy = dy*k/max;
    el.stickNub.style.transform = `translate(calc(-50% + ${dx*k}px), calc(-50% + ${dy*k}px))`;
  }
}, {passive:false});
const stickEnd = e => {
  for (const t of e.changedTouches){
    if (t.identifier !== stick.id) continue;
    stick.active = false; stick.dx = 0; stick.dy = 0;
    el.stickBase.style.display = 'none';
    el.stickNub.style.transform = 'translate(-50%,-50%)';
  }
};
el.stickZone.addEventListener('touchend', stickEnd);
el.stickZone.addEventListener('touchcancel', stickEnd);

el.lookZone.addEventListener('touchstart', e => {
  e.preventDefault();
  const t = e.changedTouches[0];
  look.active = true; look.id = t.identifier; look.lx = t.clientX; look.ly = t.clientY;
}, {passive:false});
el.lookZone.addEventListener('touchmove', e => {
  e.preventDefault();
  for (const t of e.changedTouches){
    if (t.identifier !== look.id) continue;
    G.yaw   -= (t.clientX - look.lx) * 0.005;
    G.pitch -= (t.clientY - look.ly) * 0.005;
    G.pitch = Math.max(-1.35, Math.min(1.35, G.pitch));
    look.lx = t.clientX; look.ly = t.clientY;
  }
}, {passive:false});
const lookEnd = e => {
  for (const t of e.changedTouches){ if (t.identifier === look.id) look.active = false; }
};
el.lookZone.addEventListener('touchend', lookEnd);
el.lookZone.addEventListener('touchcancel', lookEnd);

el.fireBtn.addEventListener('touchstart', e => { e.preventDefault(); touchFiring = true; }, {passive:false});
el.fireBtn.addEventListener('touchend',   e => { e.preventDefault(); touchFiring = false; }, {passive:false});
el.plantBtn.addEventListener('touchstart', e => { e.preventDefault(); touchPlanting = true; }, {passive:false});
el.plantBtn.addEventListener('touchend',   e => { e.preventDefault(); touchPlanting = false; }, {passive:false});
el.fireBtn.addEventListener('touchcancel', () => { touchFiring = false; });
el.plantBtn.addEventListener('touchcancel', () => { touchPlanting = false; });

/* stuck-input failsafes: clear everything when no fingers remain,
   on tab-hide/window-blur, and on any hard mode change */
function resetInputs(){
  releaseMoveKeys(performance.now());
  stick.active = false; stick.dx = 0; stick.dy = 0;
  look.active = false;
  touchFiring = false; touchPlanting = false;
  mouseFiring = false;
  for (const k in keys) keys[k] = false;
  el.stickBase.style.display = 'none';
  el.stickNub.style.transform = 'translate(-50%,-50%)';
}
const allFingersUp = e => { if (e.touches.length === 0) resetInputs(); };
addEventListener('touchend', allFingersUp, { passive: true });
addEventListener('touchcancel', allFingersUp, { passive: true });
addEventListener('blur', resetInputs);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) return;
  resetInputs();
  maybeAutosave(true);
});

/* ============================================================
   Collision: circle vs AABB list
   ============================================================ */
function collide(pos, r){
  for (const c of colliders){
    if (c.door && !c.active) continue;
    const cx = Math.max(c.x1, Math.min(pos.x, c.x2));
    const cz = Math.max(c.z1, Math.min(pos.z, c.z2));
    const dx = pos.x - cx, dz = pos.z - cz;
    const d2 = dx*dx + dz*dz;
    if (d2 < r*r){
      const d = Math.sqrt(d2) || 0.0001;
      const push = (r - d) / d;
      pos.x += dx * push; pos.z += dz * push;
    }
  }
}
function pointInSolid(x, z){
  for (const c of colliders){
    if (c.door && !c.active) continue;
    if (x > c.x1 && x < c.x2 && z > c.z1 && z < c.z2) return true;
  }
  return false;
}
function ejectPoint(pos, r){
  const gap = Math.max(0.2, r);
  for (let pass = 0; pass < 5; pass++){
    let hit = null;
    for (const c of colliders){
      if (c.door && !c.active) continue;
      if (pos.x > c.x1 && pos.x < c.x2 && pos.z > c.z1 && pos.z < c.z2){ hit = c; break; }
    }
    if (!hit) return;
    const left = pos.x - hit.x1, right = hit.x2 - pos.x, down = pos.z - hit.z1, up = hit.z2 - pos.z;
    const m = Math.min(left, right, down, up);
    if (m === left) pos.x = hit.x1 - gap;
    else if (m === right) pos.x = hit.x2 + gap;
    else if (m === down) pos.z = hit.z1 - gap;
    else pos.z = hit.z2 + gap;
  }
}
function inPlayable(x, z){
  for (const r of ROOMS){
    if (x >= r.x1 - 0.4 && x <= r.x2 + 0.4 && z >= r.z1 - 0.4 && z <= r.z2 + 0.4) return true;
  }
  for (const a of ANNEXES){
    const r = ROOMS[a.room];
    if (!r) continue;
    const inner = a.side === 'L' ? r.x1 : r.x2;
    const outer = a.side === 'L' ? inner - a.depth : inner + a.depth;
    const x1 = Math.min(inner, outer), x2 = Math.max(inner, outer);
    if (x >= x1 - 0.4 && x <= x2 + 0.4 && z >= a.z1 - 0.4 && z <= a.z2 + 0.4) return true;
  }
  return false;
}

/* ============================================================
   Line of sight (2D grid vs AABBs. Cheap, no raycaster allocs)
   ============================================================ */
function losBlocked(ax, az, bx, bz){
  for (const c of colliders){
    if (c.door && !c.active) continue;
    if (segIntersectsAABB(ax, az, bx, bz, c)) return true;
  }
  return false;
}
function segIntersectsAABB(x0,z0,x1,z1,c){
  // slab method
  const dx = x1-x0, dz = z1-z0;
  let tmin = 0, tmax = 1;
  if (Math.abs(dx) < 1e-9){ if (x0 < c.x1 || x0 > c.x2) return false; }
  else {
    let t1 = (c.x1-x0)/dx, t2 = (c.x2-x0)/dx;
    if (t1 > t2) [t1,t2] = [t2,t1];
    tmin = Math.max(tmin,t1); tmax = Math.min(tmax,t2);
    if (tmin > tmax) return false;
  }
  if (Math.abs(dz) < 1e-9){ if (z0 < c.z1 || z0 > c.z2) return false; }
  else {
    let t1 = (c.z1-z0)/dz, t2 = (c.z2-z0)/dz;
    if (t1 > t2) [t1,t2] = [t2,t1];
    tmin = Math.max(tmin,t1); tmax = Math.min(tmax,t2);
    if (tmin > tmax) return false;
  }
  return true;
}

/* ============================================================
   Radio
   ============================================================ */
function radio(key){
  if (G.radioFired.has(key)) return;
  G.radioFired.add(key);
  const scarKey = key + '_scar';
  const lines = (SFLAGS.hatchScar && RADIO[scarKey]) ? RADIO[scarKey] : (RADIO[key] || []);
  lines.forEach(l => G.radioQueue.push(l));
}
function updateRadio(dt){
  G.radioT -= dt;
  if (G.radioT <= 0 && G.radioQueue.length){
    const l = G.radioQueue.shift();
    AudioSys.radioBlip();
    const div = document.createElement('div');
    div.className = 'radioLine';
    div.innerHTML = `<span class="who">[${l.who}]</span> ${l.text}`;
    el.radio.appendChild(div);
    requestAnimationFrame(()=>div.classList.add('show'));
    setTimeout(()=>{ div.classList.remove('show'); setTimeout(()=>div.remove(), 400); }, 4200);
    while (el.radio.children.length > 3) el.radio.firstChild.remove();
    G.radioT = 1.6;
  }
}

/* ============================================================
   Combat
   ============================================================ */
const _rayDir = new THREE.Vector3();
const _muzzle = new THREE.Vector3();

function tryFire(dt){
  G.fireCd -= dt;
  const wantFire = (mouseFiring || touchFiring || keys['Space'] || G.padFire) && G.hasRifle;
  if (!wantFire || G.fireCd > 0) return;
  G.fireCd = 0.18; // fire-rate cap
  AudioSys.shot();
  G.shakeT = 0.06;
  viewRifle.position.z = VMB.z + .08; // recoil, eased back in update

  camera.getWorldDirection(_rayDir);
  const origin = new THREE.Vector3();
  camera.getWorldPosition(origin);
  storyAim(origin, _rayDir);

  // find nearest hit: walls (2D) vs drones (3D sphere test along ray)
  let bestT = 60, bestDrone = null;
  // wall distance along ray (sample 2D)
  const end = origin.clone().addScaledVector(_rayDir, 60);
  let wallT = 60;
  for (const c of colliders){
    if (c.door && !c.active) continue;
    const t = rayAABB2D(origin.x, origin.z, _rayDir.x, _rayDir.z, c);
    if (t !== null && t < wallT) wallT = t;
  }
  bestT = wallT;
  const _toDrone = new THREE.Vector3();
  for (const d of drones){
    if (!d.alive) continue;
    _toDrone.copy(d.mesh.position).sub(origin);
    const t = _toDrone.dot(_rayDir);
    if (t < 0 || t > bestT) continue;
    const closest2 = _toDrone.lengthSq() - t*t;
    const rad = KINDS[d.kind].rad;
    if (closest2 < rad*rad){ bestT = t; bestDrone = d; }
  }
  let bossHit = null;
  if (Boss){ const h = Boss.ray(origin, _rayDir, bestT); if (h){ bestT = h.t; bestDrone = null; bossHit = h; } }

  const hitPoint = origin.clone().addScaledVector(_rayDir, bestT);
  viewRifle.getWorldPosition(_muzzle);
  spawnTracer(_muzzle.clone().addScaledVector(_rayDir, .4), hitPoint);
  muzzleLight.intensity = 26;
  if (!bossHit) spawnSparks(hitPoint, bestDrone ? 12 : 6);
  if (bossHit) Boss.hit(bossHit, 16 * (G.dmgMul || 1), hitPoint);

  // A crawler wedged inside a locked door used to eat the shot on the
  // door slab and stay alive, so the door that required its death never opened.
  if (!bestDrone && wallT < 59){
    const hx = origin.x + _rayDir.x * wallT;
    const hz = origin.z + _rayDir.z * wallT;
    let bestD = 1e9;
    for (const d of drones){
      if (!d.alive || !pointInSolid(d.mesh.position.x, d.mesh.position.z)) continue;
      const dd = Math.hypot(d.mesh.position.x - hx, d.mesh.position.z - hz);
      const reach = KINDS[d.kind].rad + 0.75;
      if (dd < reach && dd < bestD){ bestD = dd; bestDrone = d; }
    }
  }

  if (bestDrone){
    AudioSys.hitConfirm();
    damageDrone(bestDrone, 16 * (G.dmgMul || 1));
  }
}
function rayAABB2D(ox, oz, dx, dz, c){
  let tmin = -Infinity, tmax = Infinity;
  if (Math.abs(dx) < 1e-9){ if (ox < c.x1 || ox > c.x2) return null; }
  else {
    let t1=(c.x1-ox)/dx, t2=(c.x2-ox)/dx;
    if (t1>t2)[t1,t2]=[t2,t1];
    tmin=Math.max(tmin,t1); tmax=Math.min(tmax,t2);
  }
  if (Math.abs(dz) < 1e-9){ if (oz < c.z1 || oz > c.z2) return null; }
  else {
    let t1=(c.z1-oz)/dz, t2=(c.z2-oz)/dz;
    if (t1>t2)[t1,t2]=[t2,t1];
    tmin=Math.max(tmin,t1); tmax=Math.min(tmax,t2);
  }
  if (tmax < tmin || tmax < 0) return null;
  return tmin > 0 ? tmin : tmax;
}

function damageDrone(d, dmg){
  d.hp -= dmg;
  if (d.state === 'idle') setDroneState(d, 'alert');
  if (d.hp <= 0 && d.alive){
    d.alive = false; d.deathT = .4;
    spawnSparks(d.mesh.position, 16, 0xffcc88);
    AudioSys.droneDie();
  }
}
function setDroneState(d, s){
  if (d.state === s) return;
  d.state = s; d.stateT = 0;
  d.eyeMat.color.setHex(s === 'idle' ? d.idleEye : EYE_RED);
  if (s === 'alert') AudioSys.alert();
}

function trainCarLine(){
  // One step through the vestibule. The ending and the safe car share this line.
  return ROOMS[0].z1 + 0.15;
}
function damagePlayer(dmg){
  if (G.mode !== 'play') return;
  // The ledger run ends once you are back inside the car. A crawler in the
  // doorway must not delete the ending before the choice can start.
  if (CH.train && G.planted && !G.finaleStarted && yawObj.position.z > trainCarLine()) return;
  if (window.Waking && Waking.storyMode()) dmg *= 0.55;
  G.hp -= dmg;
  G.lastDamageT = G.time;
  AudioSys.hurt();
  FX.dmg = 1;
  el.dmg.style.opacity = .9;
  setTimeout(()=> el.dmg.style.opacity = 0, 220);
  if (G.hp <= 0){ G.hp = 0; die(); }
}

/* ============================================================
   Drone AI: idle > alert > attack
   ============================================================ */
function updateDrones(dt){
  const px = yawObj.position.x, pz = yawObj.position.z;
  let updated = 0;
  for (const d of drones){
    if (!d.alive){
      if (d.deathT > 0){
        d.deathT -= dt;
        d.mesh.scale.setScalar(d.baseScale * Math.max(.01, d.deathT/.4));
        d.mesh.rotation.y += dt*18;
        d.mesh.rotation.x += dt*7;
        d.mesh.position.y = Math.max(.15, d.mesh.position.y - dt*2.2);
        if (d.deathT <= 0) scene.remove(d.mesh);
      }
      continue;
    }
    const m = d.mesh.position;
    const distX = m.x - px, distZ = m.z - pz;
    const dist = Math.hypot(distX, distZ);
    if (!Number.isFinite(m.x) || !Number.isFinite(m.z) || !inPlayable(m.x, m.z)){
      d.lostT = (d.lostT || 0) + dt;
      if (d.lostT > 1.2){
        m.x = d.home.x; m.z = d.home.z; m.y = d.home.y;
        d.lostT = 0;
        ejectPoint(m, 0.45);
      }
    } else if (pointInSolid(m.x, m.z)){
      ejectPoint(m, 0.45);
      d.lostT = 0;
    } else d.lostT = 0;
    if (dist > 46) continue;              // far: fully dormant
    if (++updated > MAX_ACTIVE + 4) continue; // hard update cap safety
    d.stateT += dt;
    d.shadow.position.y = .03 - m.y;      // pin blob shadow to the floor
    const A = d.anim;
    if (A.glb){
      if (A.recoil > 0) A.recoil = Math.max(0, A.recoil - dt*5);
      if (d.state === 'idle')
        d.mesh.rotation.y = d.kind === 'crawler'
          ? Math.sin(G.time*.9 + d.id) * .5
          : d.mesh.rotation.y + dt * .45;
    } else if (d.kind !== 'crawler'){
      A.ringH.rotation.z += dt * (d.state === 'idle' ? .8 : 3.2);
      A.ringV.rotation.x += dt * (d.state === 'idle' ? .5 : 2.1);
      if (A.recoil > 0) A.recoil = Math.max(0, A.recoil - dt*5);
      A.barrel.position.z = .12 - A.recoil * .07;
    } else {
      const moving = d.state === 'attack';
      for (const L of A.legs){
        L.root.rotation.y = L.baseYaw + (moving ? Math.sin(G.time*9 + L.phase) * .3 : 0);
        L.root.rotation.z = moving ? Math.max(0, Math.cos(G.time*9 + L.phase)) * .22 : 0;
      }
      A.head.rotation.y = d.state === 'idle'
        ? Math.sin(G.time*1.3 + d.id) * .7
        : A.head.rotation.y * Math.max(0, 1 - dt*8);
    }

    // LOS check, throttled per-drone
    d.losT -= dt;
    let seesPlayer = d.seesPlayer || false;
    if (d.losT <= 0){
      d.losT = 0.16;
      seesPlayer = dist < 17 && !losBlocked(m.x, m.z, px, pz);
      d.seesPlayer = seesPlayer;
    }

    if (d.state === 'idle'){
      // gentle bob / patrol (the sensor head does the visible scanning)
      if (d.kind !== 'crawler'){
        m.x += d.patrolDir * dt * .5;
        if (Math.abs(m.x - d.home.x) > 1.4) d.patrolDir *= -1;
      }
      m.y = d.home.y + Math.sin(G.time*2 + d.id)*0.08;
      if (seesPlayer) setDroneState(d, 'alert');
    }
    else if (d.state === 'alert'){
      // face player, brief wind-up, then attack
      d.mesh.lookAt(px, m.y, pz);
      if (d.stateT > .45) setDroneState(d, 'attack');
    }
    else { // attack
      d.mesh.lookAt(px, m.y, pz);
      if (d.kind === 'crawler'){
        if (dist > 1.1){
          const s = 3.4 * dt / dist;
          m.x -= distX * s; m.z -= distZ * s;
          collide(m, .45);
          if (pointInSolid(m.x, m.z)) ejectPoint(m, 0.45);
          m.y = .5 + Math.abs(Math.sin(G.time*10 + d.id))*.12;
        }
        if (d.anim.glb) d.mesh.rotation.set(
          Math.sin(G.time*13 + d.id) * .05,
          Math.atan2(px - m.x, pz - m.z),
          0);
        d.meleeCd -= dt;
        if (dist < 1.3 && d.meleeCd <= 0){
          d.meleeCd = 1.0;
          damagePlayer(10);
        }
        if (!seesPlayer && dist > 30 && !d.ambush) setDroneState(d, 'idle');
      } else {
        // Exit ambush frames walk the corridor. A camping sentry would let you slip past.
        if (d.ambush && dist > 4.2 && dist < 26){
          const step = Math.min(2.5 * dt, dist - 4.2);
          m.x -= distX / dist * step;
          m.z -= distZ / dist * step;
          collide(m, .55);
        }
        // sentry: telegraphed shot cycle
        m.y = d.home.y + Math.sin(G.time*3 + d.id)*.1;
        const K = KINDS[d.kind];
        if (!seesPlayer){ d.chargeT = 0; d.eyeMat.color.setHex(EYE_RED); continue; }
        d.chargeT += dt;
        if (d.chargeT > K.charge){
          // telegraph: eye flares white-hot before the shot
          const w = d.chargeT - K.charge;
          if (w < K.tele){
            if (w < dt) AudioSys.sentryCharge();
            d.eyeMat.color.setRGB(1, .17 + w*1.15, .24 + w*1.05);
          } else {
            d.eyeMat.color.setHex(EYE_RED);
            d.chargeT = 0;
            const mp = new THREE.Vector3();
            (d.anim.muzzle || d.mesh).getWorldPosition(mp);
            d.anim.recoil = 1;
            fireProjectile(mp, new THREE.Vector3(px, PLAYER_EYE - .2, pz), K.pspeed, K.pdmg);
          }
        }
      }
    }
  }
}

function updateProjectiles(dt){
  for (let i = projectiles.length-1; i >= 0; i--){
    const p = projectiles[i];
    p.life -= dt;
    p.mesh.position.addScaledVector(p.vel, dt);
    const dx = p.mesh.position.x - yawObj.position.x;
    const dy = p.mesh.position.y - PLAYER_EYE + .2;
    const dz = p.mesh.position.z - yawObj.position.z;
    let dead = p.life <= 0;
    if (p.grace > 0) p.grace -= dt;
    if (dx*dx + dy*dy + dz*dz < p.hitR2){
      damagePlayer(p.dmg); dead = true;
    } else if (p.grace <= 0) {
      // wall hit
      for (const c of colliders){
        if (c.door && !c.active) continue;
        const x = p.mesh.position.x, z = p.mesh.position.z;
        if (x > c.x1-.1 && x < c.x2+.1 && z > c.z1-.1 && z < c.z2+.1){ dead = true; break; }
      }
    }
    if (dead){ scene.remove(p.mesh); projectiles.splice(i,1); }
  }
}

/* ============================================================
   Doors / checkpoints / progression
   Episode One's rail car is room 0. progIndex maps the rooms
   after it back onto the old rifle, street, hardware, bridge, depot.
   ============================================================ */
function progIndex(roomIndex){
  return CH.train ? roomIndex - 1 : roomIndex;
}
function placeLabel(){
  const ep1 = ['ON THE TRAIN','THE GRAVEL','THE RUINED STREET','THE HARDWARE DISTRICT','THE RAIL BRIDGE','THE DEPOT'];
  if (CH.id === 'ep1'){
    if (G.planted && yawObj.position.z > ROOMS[0].z1) return 'BACK ON THE TRAIN';
    if (G.currentSegment === 0 && !SFLAGS.leftTrain) return 'ON THE TRAIN';
    return ep1[G.currentSegment] || 'IN THE FIELD';
  }
  return 'AREA ' + ((G.currentSegment || 0) + 1);
}
function capturePos(){
  return {
    chapter: CH.id, segment: G.currentSegment,
    x: yawObj.position.x, y: yawObj.position.y, z: yawObj.position.z,
    yaw: G.yaw, hp: G.hp,
    leftTrain: !!SFLAGS.leftTrain, hatchScar: !!SFLAGS.hatchScar,
    hasRifle: !!G.hasRifle,
    planted: !!G.planted, escape: !!(G.escape || G.planted), alarm: !!G.alarm,
    furthest: Math.max(G.currentSegment || 0, G.furthest || 0),
    trusted: !!SFLAGS.trusted, radio: !!SFLAGS.radio,
    freed: !!SFLAGS.freed, spoke: !!SFLAGS.spoke,
    dmgMul: G.dmgMul || 1, regenFast: !!G.regenFast, spdMul: G.spdMul || 1,
    label: placeLabel(),
  };
}
let nextSaveAt = 0;
function maybeAutosave(force){
  if (!window.Waking || !Waking.autosave) return;
  const mode = G.mode;
  if (mode !== 'play' && mode !== 'story' && mode !== 'paused' && mode !== 'dead') return;
  const now = performance.now();
  if (!force && now < nextSaveAt) return;
  nextSaveAt = now + 4000;
  Waking.autosave(capturePos());
}
function releaseTrain(){
  if (!CH.train || !SFLAGS.leftTrain) return;
  const dr = doors.find(d => d.index === 0);
  if (dr && !dr.open) openDoorNow(dr);
}
function tryTrainReturn(){
  const gate = trainFinale({
    train: !!CH.train,
    planted: !!G.planted,
    finaleStarted: !!G.finaleStarted,
    ambush: G.ambush,
    z: yawObj.position.z,
    exitZ: trainCarLine(),
    mode: G.mode,
  });
  if (gate !== 'start') return false;
  if (!CB.finale){
    beginExtraction();
    G.finaleStarted = true;
    G.escape = false;
    maybeAutosave(true);
    return true;
  }
  if (!Story.start(CB.finale)) return false;
  G.finaleStarted = true;
  G.escape = false;
  maybeAutosave(true);
  return true;
}
function openDoorNow(dr){
  dr.open = true;
  dr.anim = 1;
  dr.mesh.position.y = WALL_H/2 - (WALL_H - .05);
  dr.collider.active = false;
  if (dr.lock) dr.lock.material.color.setHex(0xe7c98a);
}
let playHintUntil = 0;
function showPlayHint(){
  const msg = IS_TOUCH
    ? 'LEFT SIDE MOVES. RIGHT SIDE LOOKS. FIRE SHOOTS.'
    : 'WASD MOVES. MOUSE LOOKS. CLICK SHOOTS. E USES.';
  el.prompt.style.display = 'block';
  el.prompt.dataset.kind = 'move';
  el.prompt.textContent = msg;
  playHintUntil = performance.now() + 6500;
}
function tickPlayHint(){
  if (!playHintUntil) return;
  if (performance.now() < playHintUntil){
    if (el.prompt.dataset.kind !== 'move'){
      el.prompt.style.display = 'block';
      el.prompt.dataset.kind = 'move';
      el.prompt.textContent = IS_TOUCH
        ? 'LEFT SIDE MOVES. RIGHT SIDE LOOKS. FIRE SHOOTS.'
        : 'WASD MOVES. MOUSE LOOKS. CLICK SHOOTS. E USES.';
    }
    return;
  }
  playHintUntil = 0;
  if (el.prompt.dataset.kind === 'move'){
    el.prompt.style.display = 'none';
    el.prompt.textContent = '';
    delete el.prompt.dataset.kind;
  }
}
function updateDoors(dt){
  doors.forEach(dr => {
    if (!dr.open){
      const prog = progIndex(dr.index);
      const canOpen = (CH.train && dr.index === 0) ? !!SFLAGS.leftTrain
        : CH.stealth ? (yawObj.position.z > dr.boundaryZ && yawObj.position.z - dr.boundaryZ < 7)
        : (prog === 0 ? G.hasRifle : segmentCleared(dr.index));
      if (canOpen){
        dr.open = true;
        dr.lock.material.color.setHex(0xe7c98a);
        AudioSys.doorOpen();
        if (prog === 1){ radio('seg1_clear'); if (CB.door1) queueStory(CB.door1); }
        if (prog === 2){ radio('seg2_clear'); if (CB.door2) queueStory(CB.door2); }
        if (prog === 3) radio('seg3_clear');
      }
    }
    if (dr.open && dr.anim < 1){
      dr.anim = Math.min(1, dr.anim + dt*.7);
      dr.mesh.position.y = WALL_H/2 - dr.anim * (WALL_H - .05); // slides into floor
      if (dr.anim > .6) dr.collider.active = false;
    }
  });

  // segment tracking + checkpoints + zone radio
  const z = yawObj.position.z;
  let seg = 0;
  ROOMS.forEach((r,i)=>{ if (z <= r.z2 && z >= r.z1) seg = i; });
  if (seg !== G.currentSegment && seg > G.currentSegment){
    G.currentSegment = seg;
    G.furthest = Math.max(G.furthest || 0, seg);
    G.checkpoint.pos.set(0, 0, ROOMS[seg].z2 - 2);
    G.checkpoint.yaw = 0; // yaw 0 faces -z, deeper into the hive
    G.checkpoint.segment = seg;
    AudioSys.checkpoint();
    maybeAutosave(true);
    const clip = roomBeat(CH.id, seg);
    const arrive = () => {
      const prog = progIndex(seg);
      if (prog === 2) radio('seg2_enter');
      if (prog === 3) radio('seg3_enter');
      if (seg === CORE_SEG){
        radio('core_enter');
        if (!CH.noAlarm) startAlarm();
        if (CB.core) setTimeout(()=>{ if (G.mode==='play') Story.start(CB.core); }, 500);
      }
      setObjectiveText();
    };
    if (clip && !G.firedClips.has(clip.id) && G.mode === 'play') considerClip(clip, arrive);
    else arrive();
  }
  // radio pickup
  if (radioProp){
    radioProp.rotation.y += dt;
    const dx = yawObj.position.x - radioProp.position.x, dz = yawObj.position.z - radioProp.position.z;
    if (dx*dx + dz*dz < 1.5){
      scene.remove(radioProp); radioProp = null;
      SFLAGS.radio = true;
      AudioSys.checkpoint();
      sToast("RADIO RECOVERED. THE DEAD MAN STILL BROADCASTS.");
      renderPerks();
    }
  }
  // annex loot pickup
  for (let i = LOOT.length-1; i >= 0; i--){
    const L = LOOT[i];
    L.grp.rotation.y += dt;
    const lx = yawObj.position.x - L.x, lz = yawObj.position.z - L.z;
    if (lx*lx + lz*lz < 1.6){
      scene.remove(L.grp); LOOT.splice(i,1);
      applyLoot(L.type);
    }
  }
  // escape phase: reaching the entrance ends the chapter.
  // The final ambush stays live until those frames are dead, so a sprint
  // to the ridge cannot skip the fight.
  if (CH.train){
    tryTrainReturn();
  } else if (G.escape && G.ambush !== 'live' && yawObj.position.z > ROOMS[0].z1 + 1.5){
    G.escape = false;
    if (CB.finale) Story.start(CB.finale); else beginExtraction();
  }
  // chapter-defined chatter zones
  CH.zones.forEach(zn => { if (z < zn.z) radio(zn.key); });
}

function setObjectiveText(){
  const O = CH.obj;
  if (G.ambush === 'live'){ el.objective.textContent = 'CUT THROUGH THE CORRIDOR'; return; }
  if (G.escape){ el.objective.textContent = O.done; return; }
  if (CH.train && G.currentSegment === 0){
    el.objective.textContent = SFLAGS.leftTrain ? (G.hasRifle ? O.advance : O.find) : (O.train || O.find);
    return;
  }
  const prog = progIndex(G.currentSegment);
  const t = {
    0: G.hasRifle ? O.advance : O.find,
    1: O.segs[0], 2: O.segs[1], 3: O.segs[2],
    4: G.planted ? O.done : O.final,
  }[prog] || '';
  el.objective.textContent = t;
}

/* ============================================================
   Alarm + core wave + objective
   ============================================================ */
function startAlarm(){
  if (G.alarm) return;
  G.alarm = true;
  AudioSys.alarmStart();
  radio('alarm');
}
function updateWave(dt){
  if (!G.alarm || (G.planted && !G.escape)) return;
  G.waveT -= dt;
  if (G.waveT <= 0 && G.waveSpawned < (G.waveCap ?? WAVE_TOTAL) && activeDroneCount() < MAX_ACTIVE){
    G.waveT = 3;
    const [x,z] = WAVE_SPAWNS[G.waveSpawned % WAVE_SPAWNS.length];
    const kinds = CH.waveKinds || ['crawler'];
    const d = makeDrone(kinds[G.waveSpawned % kinds.length], x, z, 9); // segment 9 = wave
    d.spawned = true;
    setDroneState(d, 'attack');
    scene.add(d.mesh);
    G.waveSpawned++;
  }
}

function updateObjective(dt){
  if (CH.boss && Boss){ Boss.interact(dt); return; }
  if (CB.plantMid && !G.midDone && G.plantProgress >= .5){ G.midDone = true; Story.start(CB.plantMid); return; }
  if (G.currentSegment !== CORE_SEG || G.planted) { el.plantWrap.style.display='none'; el.plantBtn.style.display='none'; return; }
  const dx = yawObj.position.x - CORE_POS.x, dz = yawObj.position.z - CORE_POS.z;
  const near = (dx*dx + dz*dz) < 9;
  const holding = keys['KeyE'] || touchPlanting || G.padUse;
  if (near){
    if (IS_TOUCH) el.plantBtn.style.display = 'block';
    el.prompt.style.display = holding ? 'none' : 'block';
    el.prompt.textContent = IS_TOUCH ? CH.obj.promptTouch : CH.obj.promptKey;
    if (holding){
      G.planting = true;
      const prev = G.plantProgress;
      G.plantProgress = Math.min(1, G.plantProgress + dt/5);
      if (Math.floor(prev*10) !== Math.floor(G.plantProgress*10)) AudioSys.plantTick();
      el.plantWrap.style.display = 'block';
      el.plantFill.style.width = (G.plantProgress*100).toFixed(1)+'%';
      if (G.plantProgress >= 1) plantComplete();
    } else {
      G.planting = false;
      el.plantWrap.style.display = G.plantProgress > 0 ? 'block' : 'none';
    }
  } else {
    G.planting = false;
    el.prompt.style.display = 'none';
    el.plantBtn.style.display = 'none';
    el.plantWrap.style.display = G.plantProgress > 0 ? 'block' : 'none';
  }
}

function plantComplete(){
  G.planted = true;
  G.plantProgress = 1;
  el.plantWrap.style.display = 'none';
  el.prompt.style.display = 'none';
  el.plantBtn.style.display = 'none';
  AudioSys.planted();
  AudioSys.alarmStop();
  radio('planted');
  setObjectiveText();
  maybeAutosave(true);
  PROPS.onComplete();
  // brief beat, then extraction
  setTimeout(()=>{ if (G.mode === 'play'){
    // The hunter chapter used to open the finale in place. The way out is a
    // short ambush first. Story beats still play once that corridor is clear.
    if (CH.boss){ beginExitAmbush(); return; }
    if (CH.noEscape){ if (CB.finale) Story.start(CB.finale); else beginExtraction(); return; }
    G.escape = true; G.waveSpawned = 0; G.waveT = 1.5; setObjectiveText();
    maybeAutosave(true);
    if (CH.id === 'ep1' && SFLAGS.trusted){ spawnCompanion(); sToast('REYES CAME BACK OVER THE BRIDGE FOR YOU.'); }
    if (CH.id === 'ch_taken' && SFLAGS.freed){
      G.waveCap = Math.ceil((CH.waveTotal||12)/2);
      // sleepers strung out along the whole escape route, so the player
      // keeps passing them on the way to daylight
      for (let i = 0; i < 10; i++){
        // freed sleepers: the thin gray tube garment, barefoot
        const face = window.WakingHumans ? WakingHumans.sleeperFaces[i % WakingHumans.sleeperFaces.length] : {};
        const c = makeCivvy({ jacket:[0x3a3a32,0x4a3a30,0x33402f,0x46464b,0x54443a,0x3c3348][i%6],
          hair:[0x241d16,0x0f0d0a,0x4a4038,0x2a1d12,0x1a1a1c,0x33261a][i%6],
          preset: window.WakingHumans ? Object.assign({}, face, { id: face.id + 'run', shirt:0x8d9092, pants:0x878a8d, jacket:null, boots:null, belt:0x7a7d80 }) : null,
          lod: Q.level === 'high' ? 'low' : 'tiny' });
        c.position.set((i%2 ? 1 : -1) * (1.5 + (i%4)), 0, -100 + i*6);
        scene.add(c); FLEE.push(c);
      }
      sToast('THE SLEEPERS ARE RUNNING. THE HIVE DIVIDES ITS ATTENTION.');
    }
  } }, CH.boss ? 1200 : 2600);
}

function beginExtraction(){
  loadCover();
  G.mode = 'extracting';
  radio('extract');
  AudioSys.extract();
  el.fade.style.transition = 'opacity 2.8s';
  el.fade.style.opacity = 1;
  setTimeout(showEndCard, 3100);
}

function showEndCard(){
  G.mode = 'end';
  MusicSys.stop();
  if (document.pointerLockElement) document.exitPointerLock();
  hudVisible(false);
  loadCover();
  el.end.style.display = 'flex';
  el.fade.style.opacity = 0;
}

/* ============================================================
   Death / respawn
   ============================================================ */
function die(){
  if (G.mode !== 'play') return;
  G.mode = 'dead';
  resetInputs();
  AudioSys.death();
  AudioSys.heartbeatStop();
  el.redFade.style.opacity = 1;
  setTimeout(respawn, 1600);
}
function respawn(){
  const seg = G.checkpoint.segment;
  const exiting = G.ambush === 'live' || G.ambush === 'ending';
  // reset the segment being attempted (and the core wave if applicable)
  // The exit ambush must not rewind the hunter or refill the yard.
  if (!exiting){
    if (seg >= 1 && seg <= CORE_SEG) spawnSegment(seg);
    if (seg === CORE_SEG){
      G.waveSpawned = 0; G.waveT = 2; G.plantProgress = 0; G.planting = false;
      // remove wave drones
      for (let i = drones.length-1; i >= 0; i--){
        if (drones[i].segment === 9){ scene.remove(drones[i].mesh); if (drones[i].w) scene.remove(drones[i].w.grp); drones.splice(i,1); }
      }
    }
  }
  projectiles.forEach(p=>scene.remove(p.mesh)); projectiles.length = 0;
  yawObj.position.set(G.checkpoint.pos.x, PLAYER_EYE, G.checkpoint.pos.z);
  G.yaw = G.checkpoint.yaw; G.pitch = 0;
  G.hp = 100; G.lastDamageT = G.time; G.detect = 0;
  el.redFade.style.opacity = 0;
  G.mode = 'play';
  if (Boss && !exiting) Boss.onRespawn();
  if (G.ambush === 'live') spawnAmbushSquad();
  else if (CH.boss && G.planted && !G.ambush) beginExitAmbush();
  else if (G.ambush === 'ending') setTimeout(() => {
    if (G.mode === 'play' && G.ambush === 'ending') startExitFinale();
  }, 450);
}

/* ============================================================
   Player movement
   ============================================================ */
const _fwd = new THREE.Vector3(), _right = new THREE.Vector3();
// Story Mode shot magnetism.
// Before: every input, including mouse look, hard-locked onto a live
// machine inside 0.50 rad (about 28.6 deg) from 1.4 m to 28 m.
// After: mouse, keyboard, and a desktop pad fire down the crosshair.
// A phone fire button (or a pad on a phone) in Story Mode gets a nudge
// only when the crosshair is already near the target.
const STORY_AIM = {
  angle: 0.12, // rad, about 6.9 deg. Was 0.50.
  min: 2.0,    // m. Was 1.4.
  max: 12,     // m. Was 28.
  pull: 0.65,  // blend toward the target. Was 1, a full snap.
};
function aimAssistScale(story, phoneFire, ang, dist){
  if (!story || !phoneFire) return 0;
  if (dist < STORY_AIM.min || dist > STORY_AIM.max) return 0;
  if (!(ang < STORY_AIM.angle)) return 0;
  return STORY_AIM.pull;
}
function phoneAiming(){
  return !!(touchFiring || (IS_TOUCH && G.padFire));
}
function storyAim(origin, dir){
  if (!window.Waking || !Waking.storyMode()) return;
  if (!phoneAiming()) return;
  let best = null, bestAng = STORY_AIM.angle, bestDist = 0;
  const consider = (point) => {
    if (!point) return;
    const to = point.clone().sub(origin);
    const dist = to.length();
    if (dist < STORY_AIM.min || dist > STORY_AIM.max) return;
    to.multiplyScalar(1 / dist);
    const ang = Math.acos(Math.min(1, Math.max(-1, dir.dot(to))));
    if (ang < bestAng){ bestAng = ang; best = to; bestDist = dist; }
  };
  for (const d of drones){
    if (!d.alive) continue;
    consider(d.mesh.position);
  }
  if (Boss && Boss.aimPoint) consider(Boss.aimPoint());
  const pull = best ? aimAssistScale(true, true, bestAng, bestDist) : 0;
  if (best && pull > 0) dir.lerp(best, pull).normalize();
}
function pollGamepad(dt){
  G.padFire = false;
  if (!window.Waking || !Waking.gamepadOn() || !navigator.getGamepads) return { x:0, y:0 };
  const pads = navigator.getGamepads();
  let pad = null;
  for (const p of pads) if (p) pad = p;
  if (!pad) return { x:0, y:0 };
  const ax = v => Math.abs(v) > 0.18 ? v : 0;
  const lookX = ax(pad.axes[2] || 0), lookY = ax(pad.axes[3] || 0);
  if (G.mode === 'play'){
    G.yaw -= lookX * dt * 2.4;
    G.pitch = Math.max(-1.2, Math.min(1.2, G.pitch - lookY * dt * 1.8));
  }
  G.padFire = !!(pad.buttons[7] && pad.buttons[7].value > 0.45);
  G.padUse = !!(pad.buttons[0] && pad.buttons[0].pressed) && G.mode === 'play';
  if (G.mode === 'story' && window.__LATM && Story){
    if (pad.buttons[0] && pad.buttons[0].pressed && !G._padA) Story.pickIndex(0);
    if (pad.buttons[2] && pad.buttons[2].pressed && !G._padX) Story.pickIndex(1);
    if (pad.buttons[3] && pad.buttons[3].pressed && !G._padY) Story.pickIndex(2);
  }
  G._padA = !!(pad.buttons[0] && pad.buttons[0].pressed);
  G._padX = !!(pad.buttons[2] && pad.buttons[2].pressed);
  G._padY = !!(pad.buttons[3] && pad.buttons[3].pressed);
  if (pad.buttons[9] && pad.buttons[9].pressed && !G._padStart && window.Waking) Waking.togglePause();
  G._padStart = !!(pad.buttons[9] && pad.buttons[9].pressed);
  return { x: ax(pad.axes[0] || 0), y: ax(pad.axes[1] || 0) };
}
function updatePlayer(dt){
  const pad = pollGamepad(dt);
  const nowMove = performance.now();
  const sampled = sampleMoveSeconds(nowMove);
  const analog = {
    x: (stick.active ? stick.dx : 0) + pad.x,
    z: (stick.active ? stick.dy : 0) + pad.y,
  };
  const mv = integrateMove(sampled, analog, sampled.frame, 0.2);
  const len = sampled.frame > 0 ? Math.hypot(mv.x, mv.z) / sampled.frame : 0;

  yawObj.rotation.y = G.yaw;
  pitchObj.rotation.x = G.pitch;

  _fwd.set(-Math.sin(G.yaw), 0, -Math.cos(G.yaw));
  _right.set(Math.cos(G.yaw), 0, -Math.sin(G.yaw));
  const spd = MOVE_SPEED * (G.spdMul || 1);
  yawObj.position.addScaledVector(_fwd, -mv.z * spd);
  yawObj.position.addScaledVector(_right, mv.x * spd);
  collide(yawObj.position, PLAYER_R);
  if (pointInSolid(yawObj.position.x, yawObj.position.z)) ejectPoint(yawObj.position, PLAYER_R);
  yawObj.position.y = PLAYER_EYE + (len > .1 ? Math.sin(G.time*11)*.03 : 0);

  // camera shake
  if (window.Waking && Waking.reducedMotion()){ G.shakeT = 0; G.shakeAmp = 0; }
  if (G.shakeT > 0){
    G.shakeT -= dt;
    const sa = Math.max(.02, G.shakeAmp || 0);
    camera.position.set((Math.random()-.5)*sa, (Math.random()-.5)*sa, 0);
  } else { camera.position.set(0,0,0); G.shakeAmp = 0; }

  // rifle recoil recovery + sway
  if (viewRifle.visible){
    viewRifle.position.z += (VMB.z - viewRifle.position.z) * dt * 12;
    viewRifle.position.y = VMB.y + Math.sin(G.time*10)*(len>.1?.006:.002);
  }

  // health regen: 5s without damage
  if (G.hp < 100 && G.time - G.lastDamageT > (G.regenFast ? 3 : 5)){
    G.hp = Math.min(100, G.hp + 26*(G.regenFast ? 1.7 : 1)*dt);
  }
  el.healthFill.style.width = G.hp.toFixed(0)+'%';
  el.healthFill.style.background = G.hp > 35 ? 'var(--grn)' : 'var(--red)';

  // rifle pickup. The prompt only shows when the rifle is close,
  // so the rail car does not ask for a gun that is still on the gravel.
  // Reach is horizontal: standing over the rifle used to miss because the
  // eyes sit 1.45 m above the model. E takes it from the prompt, and
  // walking past it toward the locked door takes it too.
  let riflePrompt = false;
  if (!G.hasRifle && !CH.stealth && rifleFloor.parent){
    const rx = rifleFloor.position.x, rz = rifleFloor.position.z;
    const h = Math.hypot(yawObj.position.x - rx, yawObj.position.z - rz);
    const use = !!(keys['KeyE'] || G.padUse || IS_TOUCH);
    if (h < 4){
      riflePrompt = true;
      el.prompt.style.display = 'block';
      el.prompt.dataset.kind = 'rifle';
      el.prompt.textContent = IS_TOUCH ? 'TAKE THE RIFLE' : 'PRESS [E] TO TAKE THE RIFLE';
      if (riflePickup(yawObj.position.x, yawObj.position.z, rx, rz, use)) pickupRifle();
    } else if (riflePickup(yawObj.position.x, yawObj.position.z, rx, rz, false)){
      pickupRifle();
    } else if (el.prompt.dataset.kind === 'rifle'){
      el.prompt.style.display = 'none';
      el.prompt.textContent = '';
      delete el.prompt.dataset.kind;
    }
  }
  if (!riflePrompt && CH.train && SFLAGS.leftTrain && SFLAGS.hatchScar && trainHatch && !G.hatchExitHint){
    const hx = yawObj.position.x - trainHatch.x;
    const hz = yawObj.position.z - trainHatch.z;
    if (hx * hx + hz * hz < 1.96){
      G.hatchExitHint = true;
      sToast('THE VESTIBULE DOOR IS OPEN. THE RIFLE IS ON THE GRAVEL.');
    }
  }
  if (!riflePrompt) tickPlayHint();
}
function pickupRifle(){
  if (G.hasRifle) return;
  G.hasRifle = true;
  scene.remove(rifleFloor);
  viewRifle.visible = true;
  el.prompt.style.display = 'none';
  el.crosshair.style.display = 'block';
  if (IS_TOUCH) el.fireBtn.style.display = 'block';
  radio('pickup');
  AudioSys.checkpoint();
  AudioSys.humStart();
  setObjectiveText();
  setTimeout(setObjectiveText, 50);
}

/* ============================================================
   Alarm visuals + misc FX
   ============================================================ */
const _pulseB = new THREE.Color();
function updateFX(dt){
  // tracers
  for (let i = tracers.length-1; i >= 0; i--){
    const t = tracers[i];
    t.life -= dt;
    t.line.material.opacity = Math.max(0, t.life/.07);
    if (t.life <= 0){ scene.remove(t.line); t.line.geometry.dispose(); tracers.splice(i,1); }
  }
  // impact sparks: fly out, fall, fade
  for (let i = sparks.length-1; i >= 0; i--){
    const s = sparks[i];
    s.life -= dt;
    const p = s.pts.geometry.attributes.position;
    for (let j=0;j<s.vel.length;j++){
      s.vel[j].y -= 14*dt;
      p.array[j*3]   += s.vel[j].x*dt;
      p.array[j*3+1] += s.vel[j].y*dt;
      p.array[j*3+2] += s.vel[j].z*dt;
    }
    p.needsUpdate = true;
    s.pts.material.opacity = Math.max(0, s.life/.35);
    if (s.life <= 0){ scene.remove(s.pts); s.pts.geometry.dispose(); sparks.splice(i,1); }
  }
  // muzzle flash decay
  if (muzzleLight.intensity > 0){
    if (Q.p.basic) muzzleLight.visible = true;
    muzzleLight.intensity = Math.max(0, muzzleLight.intensity - dt*300);
  }
  if (Q.p.basic && muzzleLight.intensity <= 0) muzzleLight.visible = false;
  VMLIGHT.value = .03 + Math.min(.16, muzzleLight.intensity * .006);
  // screen-space feedback values for the grade pass
  FX.dmg = Math.max(0, FX.dmg - dt*2.4);
  FX.low += ((G.hp < 40 ? (40 - G.hp)/40 : 0) - FX.low) * Math.min(1, dt*3);
  FX.ca = .0005 + FX.dmg*.011;
  // environment animation: shaft flicker, conduit flow, machine-light sync (Hive)
  dustU.value = G.time;
  if (accent.visible){
    G._accT = (G._accT || 0) - dt;
    if (G._accT <= 0){
      G._accT = .35;
      const pz = yawObj.position.z; let bz = null, side = 1;
      for (const r of ROOMS){ if (pz <= r.z2 + 3 && pz >= r.z1 - 3){
        for (let z = r.z2-3; z > r.z1+1; z -= 6){ if (z < pz - 1){ bz = z; side = (Math.round((r.z2 - z)/6) % 2) ? 1 : -1; break; } }
        if (bz !== null){ accent.userData.x = side < 0 ? r.x1 + 1.2 : r.x2 - 1.2; break; } } }
      if (bz !== null) accent.userData.z = bz;
    }
    if (accent.userData.z !== undefined){
      accent.position.set(accent.userData.x, Math.min(2.5, WALL_H - .5), accent.userData.z);
      accent.color.copy(matStrip.color);
      accent.intensity = (G.alarm && !G.planted ? 26 : 16) * (.88 + .12*Math.sin(G.time*13) + (Math.sin(G.time*31) > .93 ? -.3 : 0));
    }
  }
  condTexes.forEach(t => { t.offset.x -= dt * .45; });
  condMats.forEach(m => m.color.copy(matStrip.color));
  glowMat.color.copy(matStrip.color);
  EMISSIVE_MATS.forEach(m => m.emissive.copy(matStrip.color));
  GFX.shafts.forEach(m => { if (m.visible) m.material.uniforms.uA.value = m.userData.base * (.8 + .2*Math.sin(G.time*1.7 + m.userData.ph) + (Math.sin(G.time*23 + m.userData.ph*3) > .96 ? -.3 : 0)); });
  // sentry thruster flicker (shared material. One write covers all pods)
  thrusterGlowMat.opacity = .55 + Math.sin(G.time*22)*.25;
  // chapter set-piece animation + objective light pulse
  PROPS.animate(dt);
  coreLight.intensity = 22 + Math.sin(G.time*3)*7;
  // alarm strips + core light shift red
  if (CH.pulse && !(G.alarm && !G.planted)){
    const k = (Math.sin(G.time*.7) + 1) / 2;
    matStrip.color.setHex(CH.pulse[0]).lerp(_pulseB.setHex(CH.pulse[1]), k);
  }
  if (G.alarm && !G.planted){
    const pulse = (Math.sin(G.time*6) + 1) / 2;
    matStrip.color.setRGB(1, .1 + pulse*.2, .2);
    coreLight.color.setRGB(1, .25 + pulse*.3, .3);
  } else if (G.planted){
    matStrip.color.setHex(0xffd23f);
    coreLight.color.setHex(0xffd23f);
  }
}

/* ============================================================
   Short beat clips. A full Red Sky Archive episode never plays
   inside a level. Each clip is capped at 20 seconds, then control
   returns (movement, a choice, or the objective).
   ============================================================ */
let beatState = null;
let clipReturn = null;
let montageQueue = null;
let introStartT = 0;
function ensureVideo(){
  let v = document.getElementById('beatVideo');
  if (!v){
    v = document.createElement('video');
    v.id = 'beatVideo';
    v.setAttribute('playsinline', '');
    v.playsInline = true;
    el.intro.appendChild(v);
  }
  return v;
}
function resolveLines(clip){
  const src = CHAPTERS[clip.chapter] || CH;
  const out = [];
  (clip.intro || []).forEach(i => {
    const t = src.introLines && src.introLines[i];
    if (t && t !== '...') out.push({ who:'', text:t });
  });
  (clip.radio || []).forEach(spec => {
    const lines = (src.radio && src.radio[spec.key]) || [];
    (spec.idx || [0]).forEach(i => { if (lines[i]) out.push(lines[i]); });
  });
  return out;
}
function showKicker(clip){
  let k = document.getElementById('introKicker');
  if (!k){
    k = document.createElement('div');
    k.id = 'introKicker';
    el.intro.insertBefore(k, el.introText);
  }
  const ep = episodeOf(clip.episode);
  k.textContent = (ep && ep.game)
    ? clipLabel(clip, CHAPTERS)
    : ('RED SKY ARCHIVE ' + (ep ? ep.n : '') + '   ' + clipLabel(clip, CHAPTERS));
}
function cueVideo(clip){
  const ep = episodeOf(clip.episode);
  const v = ensureVideo();
  const hide = () => { v.style.display = 'none'; };
  if (!ep || !ep.url || !clip.cue || clip.textOnly){ hide(); return; }
  const dur = Math.min(20, clip.max || 20, clip.cue[1] - clip.cue[0]);
  // Stay hidden until the file actually plays. A missing origin file must
  // not cover the fallback lines with a black frame.
  v.style.display = 'none';
  v.removeAttribute('poster');
  if (ep.poster && ep.status !== 'pending') v.poster = ep.poster;
  let failed = false;
  const fail = () => {
    if (failed) return;
    failed = true;
    hide();
    if (beatState && beatState.clipId === clip.id){
      beatState.video = false;
      beatState.missing = true;
    }
  };
  v.onerror = fail;
  v.onplaying = () => {
    if (failed || !beatState || beatState.clipId !== clip.id) return;
    v.style.display = 'block';
    beatState.missing = false;
    beatState.video = true;
    // The origin clip is the picture. Lines are only the fallback.
    if (clip.id === 'ep1_wake'){
      beatState.phase = 'hold';
      el.introText.style.opacity = 0;
    }
  };
  v.src = ep.url;
  // play() has to run in the ENTER click. A later metadata callback
  // loses the gesture and the short sits on its poster.
  // Cues that start later still seek first, then play.
  const tryPlay = () => {
    const p = v.play();
    if (p && p.catch) p.catch(() => {});
  };
  const start = clip.cue[0] || 0;
  if (start > 0.05) {
    v.onloadedmetadata = () => {
      if (failed) return;
      const afterSeek = () => {
        v.removeEventListener('seeked', afterSeek);
        tryPlay();
      };
      v.addEventListener('seeked', afterSeek);
      try { v.currentTime = start; } catch (e) { tryPlay(); }
    };
  } else {
    tryPlay();
    v.onloadedmetadata = () => {
      if (failed || !v.paused) return;
      tryPlay();
    };
  }
  v.ontimeupdate = () => {
    if (v.currentTime >= clip.cue[0] + dur - 0.05) endClip(false);
  };
  // A missing game short must not hold the level on a black frame.
  setTimeout(() => {
    if (failed || !beatState || beatState.clipId !== clip.id) return;
    if (v.error || v.networkState === 3) fail();
  }, 1500);
}
function playClip(clip, opts){
  if (!clip){ if (opts && opts.then === 'play') finishIntro(true); return; }
  opts = opts || { then:'play' };
  G.firedClips.add(clip.id);
  if (opts.then === 'play' || opts.then === 'resume'){
    (clip.radio || []).forEach(spec => G.radioFired.add(spec.key));
  }
  clipReturn = { then: opts.then, onDone: opts.onDone || null, clip };
  introStartT = performance.now();
  if (document.pointerLockElement) document.exitPointerLock();
  showKicker(clip);
  el.intro.style.display = 'flex';
  el.introText.style.display = '';
  el.introText.style.opacity = 0;
  showSkip();
  if (opts.then === 'gallery' || opts.then === 'montage') el.start.style.display = 'none';
  if (clip.kind === 'cinematic'){
    G.mode = 'cinematic';
    el.intro.style.background = 'transparent';
    Cinematic.start(() => endClip(false));
    return;
  }
  G.mode = (opts.then === 'gallery' || opts.then === 'montage') ? 'galleryclip' : 'beatclip';
  el.intro.style.background = 'rgba(0,0,0,.45)';
  el.fade.style.transition = 'opacity .4s';
  el.fade.style.background = '#000';
  el.fade.style.opacity = 0;
  const wake = opts.then === 'play';
  if (wake){
    yawObj.position.set(0, .35, CH.spawnZ || 0);
    G.pitch = 1.1; pitchObj.rotation.x = G.pitch;
    G.yaw = 0; yawObj.rotation.y = 0;
  }
  const epForClip = episodeOf(clip.episode);
  const video = !!(epForClip && epForClip.url && clip.cue && !clip.textOnly);
  beatState = { clipId: clip.id, lines: resolveLines(clip), i:0, t:0, shown:false, max: Math.min(20, clip.max || 16), elapsed:0, phase:'lines', wake, video, missing:false };
  cueVideo(clip);
  if (window.__LATM){
    __LATM.clipLog = __LATM.clipLog || [];
    __LATM.clipLog.push({ id: clip.id, lines: beatState.lines.length, max: beatState.max });
  }
}
function updateBeat(dt){
  const s = beatState;
  if (!s) return;
  s.elapsed += dt;
  if (s.elapsed >= s.max){ endClip(false); return; }
  if (s.phase === 'lines'){
    const line = s.lines[s.i];
    if (!line){ s.phase = 'hold'; return; }
    // Give a dropped-in origin file a moment to start before the fallback lines.
    if (s.clipId === 'ep1_wake' && s.video && !s.missing && s.elapsed < 0.7) return;
    if (!s.shown){
      el.introText.textContent = line.who ? line.text : line.text;
      el.introText.style.opacity = 1;
      s.shown = true;
      s.hold = Math.min(6.2, Math.max(2.5, 1.1 + line.text.length * 0.028));
    }
    s.t += dt;
    if (s.t > s.hold){
      el.introText.style.opacity = 0;
      s.i++; s.t = 0; s.shown = false;
    }
  } else if (s.phase === 'hold'){
    if (s.missing){ endClip(false); return; }
    const floor = s.video ? s.max : Math.min(8, s.max);
    if (s.elapsed >= floor){
      if (s.wake){ s.phase = 'rise'; s.t = 0; el.intro.style.background = 'transparent'; el.introText.style.display = 'none'; }
      else endClip(false);
    }
  } else if (s.phase === 'rise'){
    s.t += dt;
    const k = Math.min(1, s.t / 1.05);
    const e = k * k * (3 - 2 * k);
    yawObj.position.y = .35 + (PLAYER_EYE - .35) * e;
    G.pitch = 1.1 * (1 - e);
    pitchObj.rotation.x = G.pitch;
    if (k >= 1) endClip(false);
  }
}
function endClip(skipped){
  const ret = clipReturn;
  if (!ret) return;
  clipReturn = null;
  beatState = null;
  const v = document.getElementById('beatVideo');
  if (v){ try { v.pause(); } catch (e) {} v.style.display = 'none'; v.ontimeupdate = null; v.onended = null; v.onplaying = null; v.onerror = null; }
  el.intro.style.display = 'none';
  el.intro.style.background = '';
  el.introText.style.opacity = 0;
  el.skipBtn.style.opacity = 0;
  const kicker = document.getElementById('introKicker');
  if (kicker) kicker.textContent = '';
  if (ret.then === 'play') finishIntro(!!skipped);
  else if (ret.then === 'resume'){
    G.mode = 'play';
    hudVisible(true);
    setObjectiveText();
    if (ret.onDone) ret.onDone();
  }
  else if (ret.then === 'montage') nextMontage();
  else {
    G.mode = 'title';
    el.start.style.display = 'flex';
    if (window.Waking) Waking.onGalleryReturn();
  }
}
function nextMontage(){
  if (!montageQueue || !montageQueue.length){
    montageQueue = null;
    G.mode = 'title';
    el.start.style.display = 'flex';
    if (window.Waking) Waking.onGalleryReturn();
    return;
  }
  playClip(montageQueue.shift(), { then:'montage' });
}
function playMontage(clips){
  montageQueue = clips.slice();
  el.start.style.display = 'none';
  nextMontage();
}
function playFullEpisode(ep){
  if (!ep || !ep.url) return;
  el.start.style.display = 'none';
  clipReturn = { then:'gallery', onDone:null, clip:null };
  G.mode = 'galleryclip';
  introStartT = performance.now();
  const v = ensureVideo();
  v.style.display = 'block';
  el.intro.style.display = 'flex';
  el.intro.style.background = '#000';
  showSkip();
  v.src = ep.url;
  v.onerror = () => endClip(false);
  v.onended = () => endClip(false);
  v.play().catch(()=>{});
}
function queueStory(beats){
  G.storyQueued = true;
  setTimeout(() => {
    G.storyQueued = false;
    const tryStart = () => {
      if (G.mode === 'beatclip' || G.mode === 'cinematic' || G.mode === 'galleryclip'){ setTimeout(tryStart, 200); return; }
      if (G.mode === 'play') Story.start(beats);
    };
    tryStart();
  }, 1400);
}
function considerClip(clip, after){
  const go = () => {
    if (G.storyQueued || G.mode === 'story'){ setTimeout(go, 200); return; }
    if (G.mode !== 'play') return;
    if (G.firedClips.has(clip.id)){ after(); return; }
    playClip(clip, { then:'resume', onDone: after });
  };
  if (G.storyQueued || G.mode === 'story') setTimeout(go, 200);
  else go();
}
let resumeOverride = null;
function peekResume(){
  if (resumeOverride) return resumeOverride;
  try {
    const raw = sessionStorage.getItem('latm_resume');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) { return null; }
}
function takeResume(){
  let mid = resumeOverride;
  resumeOverride = null;
  if (!mid){
    try {
      const raw = sessionStorage.getItem('latm_resume');
      if (raw) mid = JSON.parse(raw);
    } catch (e) { mid = null; }
  }
  try { sessionStorage.removeItem('latm_resume'); } catch (e) {}
  if (!mid || mid.chapter !== CH.id) return null;
  if (typeof mid.x !== 'number' || typeof mid.z !== 'number') return null;
  return mid;
}
function armResume(mid){
  if (!mid || mid.chapter !== CH.id) return false;
  if (typeof mid.x !== 'number' || typeof mid.z !== 'number') return false;
  resumeOverride = mid;
  try { sessionStorage.setItem('latm_resume', JSON.stringify(mid)); } catch (e) {}
  return true;
}
let leavingTitle = false;
function beginFromTitle(resume){
  if (leavingTitle) return;
  if (G.mode !== 'title' && G.mode !== 'boot') return;
  if (window.Waking && Waking.isLocked(CH.id)){ Waking.openPaywall(CH.id); return; }
  if (!resume){
    resumeOverride = null;
    try {
      sessionStorage.removeItem('latm_resume');
      sessionStorage.removeItem('latm_autoload');
    } catch (e) {}
  }
  leavingTitle = true;
  AudioSys.init();
  AudioSys.resume();
  showLoad(resume ? 'RESTORING YOUR PLACE' : 'LOADING EPISODE');
  el.start.style.display = 'none';
  requestAnimationFrame(() => requestAnimationFrame(() => startIntro()));
}
function startIntro(){
  el.start.style.display = 'none';
  AudioSys.init();
  AudioSys.resume();
  AudioSys.heartbeatStart();
  MusicSys.start();
  if (window.Waking) Waking.onChapterStart(CH.id);
  introStartT = performance.now();
  if (peekResume()){ finishIntro(true); return; }
  const open = openBeat(CH.id);
  if (!open){ finishIntro(true); return; }
  hideLoadOnFrame = false;
  playClip(open, { then:'play' });
  hideLoad();
}
function finishIntro(skipAll){
  beatState = null;
  clipReturn = null;
  AudioSys.heartbeatStop();
  el.intro.style.display = 'none';
  el.intro.style.background = '';
  el.introText.style.display = '';
  el.introText.style.transition = '';
  el.introText.style.opacity = 0;
  el.skipBtn.style.opacity = 0;
  el.fade.style.transition = skipAll ? 'none' : 'opacity .6s';
  el.fade.style.background = '#000';
  el.fade.style.opacity = 0;
  const mid = takeResume();
  if (!mid){
    yawObj.position.set(0, PLAYER_EYE, CH.spawnZ || 0);
    G.pitch = 0; G.yaw = 0;
  } else {
    yawObj.position.set(mid.x, PLAYER_EYE, mid.z);
    G.yaw = mid.yaw || 0; G.pitch = 0;
    G.hp = (typeof mid.hp === 'number' && mid.hp > 0) ? mid.hp : 100;
    let room = 0;
    ROOMS.forEach((r, i) => { if (mid.z <= r.z2 && mid.z >= r.z1) room = i; });
    const progress = resumeProgress(mid.segment, mid.furthest, room);
    G.currentSegment = progress.segment;
    G.furthest = progress.furthest;
    G.checkpoint.segment = progress.segment;
    G.checkpoint.pos.set(mid.x, 0, mid.z);
    G.checkpoint.yaw = mid.yaw || 0;
    if (mid.leftTrain) SFLAGS.leftTrain = true;
    if (mid.hatchScar) SFLAGS.hatchScar = true;
    if (mid.trusted) SFLAGS.trusted = true;
    if (mid.radio) SFLAGS.radio = true;
    if (mid.freed) SFLAGS.freed = true;
    if (mid.spoke) SFLAGS.spoke = true;
    if (mid.planted){ G.planted = true; G.escape = true; G.alarm = true; }
    else if (mid.escape) G.escape = true;
    if (!G.alarm && mid.alarm) G.alarm = true;
    if (mid.dmgMul) G.dmgMul = mid.dmgMul;
    if (mid.regenFast) G.regenFast = true;
    if (mid.spdMul) G.spdMul = mid.spdMul;
    G._resumed = true;
    markSegmentsCleared(segmentsToClear(progress.furthest));
    doors.forEach(dr => {
      if (dr.index < progress.furthest) openDoorNow(dr);
      else if (dr.index === 0 && SFLAGS.leftTrain) openDoorNow(dr);
    });
    BEATS.forEach(b => {
      if (b.chapter === CH.id && (b.at === 'open' || (b.at === 'room' && b.room <= progress.furthest))) G.firedClips.add(b.id);
    });
  }
  pitchObj.rotation.x = G.pitch;
  yawObj.rotation.y = G.yaw;
  G.mode = 'play';
  hudVisible(true);
  if (IS_TOUCH){ el.stickZone.style.display='block'; el.lookZone.style.display='block'; }
  else if (!pointerLocked){ try { const r = renderer.domElement.requestPointerLock(); if (r && r.catch) r.catch(()=>{}); } catch(e){} }
  // Skip used to hand over the rifle because it sat in the first room.
  // On the train, the rifle is out on the gravel. A fresh skip must not take it.
  // Continue still arms you, so a mid-chapter resume is not stuck behind a closed door.
  if (!CH.stealth && (CH.startArmed || (skipAll && G._resumed))) pickupRifle();
  if (CH.stealth) radio('pickup');
  if (CH.id === 'ch_together') spawnCompanion();
  if (SFLAGS.hatchScar){ openHatchHole(); addHatchCrawler(); }
  hideLoadOnFrame = true;
  renderPerks();
  setObjectiveText();
  if (CH.boss && Boss && Boss.resumeRequested()) { Boss.resume(); return; }
  if (CH.train && G.planted) tryTrainReturn();
  const trainChoice = CH.train && CB.start && !SFLAGS.leftTrain && !G.finaleStarted
    && (!G._resumed || (G.currentSegment === 0 && yawObj.position.z > 2));
  if (!G.finaleStarted && ((CB.start && !G._resumed) || trainChoice)) setTimeout(()=>{ if (G.mode==='play') Story.start(CB.start); }, 700);
}
function showSkip(){ el.skipBtn.style.transition = 'none'; el.skipBtn.style.opacity = .85; }
function skipIntro(){
  const mode = G.mode;
  if (mode !== 'cinematic' && mode !== 'beatclip' && mode !== 'galleryclip') return false;
  if (performance.now() - introStartT < 180) return false;
  el.introText.style.transition = 'none';
  if (mode === 'cinematic') Cinematic.skip();
  endClip(true);
  return true;
}
el.skipBtn.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); skipIntro(); });
el.skipBtn.addEventListener('click', e => { e.stopPropagation(); skipIntro(); });
el.intro.addEventListener('pointerdown', e => { if (e.target !== el.skipBtn) skipIntro(); });
addEventListener('keydown', e => {
  if (e.repeat) return;
  if (e.code === 'Escape' && window.Waking){
    const m = G.mode;
    if (m === 'play' || m === 'story' || m === 'paused' || m === 'title' || m === 'end'){
      e.preventDefault();
      Waking.togglePause();
      return;
    }
  }
  if (G.mode === 'cinematic' || G.mode === 'beatclip' || G.mode === 'galleryclip'){
    if (skipIntro()){ e.preventDefault(); keys[e.code] = false; }
  }
}, true);

function hudVisible(v){
  const d = v ? 'block' : 'none';
  el.healthWrap.style.display = d;
  el.objective.style.display = d;
  if (!v){
    el.crosshair.style.display = 'none';
    el.fireBtn.style.display = 'none';
    el.plantBtn.style.display = 'none';
    el.stickZone.style.display = 'none';
    el.lookZone.style.display = 'none';
    el.prompt.style.display = 'none';
    el.plantWrap.style.display = 'none';
    const bw = document.getElementById('bossWrap'); if (bw) bw.style.display = 'none';
  } else if (G.hasRifle){
    el.crosshair.style.display = 'block';
    if (IS_TOUCH) el.fireBtn.style.display = 'block';
  }
}


/* ============================================================
   Story layer. Cinematic beats, timed choices, consequences.
   ============================================================ */
const SFLAGS = { radio:false, trusted:false };
if (CH.id !== 'ep1'){
  try {
    const c = JSON.parse(localStorage.getItem('latm_carry')) || {};
    SFLAGS.trusted = !!c.trusted; SFLAGS.radio = !!c.radio;
    G.dmgMul = c.dmgMul || 1; G.regenFast = !!c.regenFast; G.spdMul = c.spdMul || 1;
  } catch(e){}
}
if (CH.book){
  try { Object.assign(SFLAGS, JSON.parse(localStorage.getItem('latm_book')) || {}); } catch(e){}
}
const SCHOICES = [];
const EKEY = 'latm_hybrid_endings';
const sEl = {
  wrap: document.getElementById('storyWrap'), dlg: document.getElementById('storyDlg'),
  speaker: document.getElementById('sSpeaker'), text: document.getElementById('sText'),
  hint: document.getElementById('sHint'), choice: document.getElementById('sChoice'),
  timerFill: document.getElementById('sTimerFill'), opts: document.getElementById('sOpts'),
  toast: document.getElementById('sToast'),
  endName: document.getElementById('endName'), endSummary: document.getElementById('endSummary'),
  endTracker: document.getElementById('endTracker'),
};
let sToastTimer = null;
function sToast(text, ember, loud){
  sEl.toast.textContent = '◆ ' + text;
  sEl.toast.className = 'show' + (ember ? ' ember' : '') + (loud ? ' scar' : '');
  clearTimeout(sToastTimer);
  sToastTimer = setTimeout(()=>{ sEl.toast.className=''; }, loud ? 5200 : 3600);
}

const Story = (() => {
  let beats = [], bi = 0, sayDeadline = 0, cState = null, active = false, scareLock = false;
  let sayFull = '', sayStartMs = 0, typeOn = false;
  const TYPE_CPS = 42;
  function shownCount(now){
    if (!typeOn || !sayFull) return sayFull.length;
    const speed = (window.Waking && Waking.textSpeed()) || 1;
    return typedCount(now - sayStartMs, sayFull.length, TYPE_CPS * speed);
  }
  function start(list){
    if (active || G.mode === 'dead' || G.mode === 'end' || G.mode === 'extracting') return false;
    if (!list || !list.length) return false;
    active = true; beats = list; bi = 0;
    G.mode = 'story';
    resetInputs();
    if (document.pointerLockElement) document.exitPointerLock();
    document.body.classList.add('cine');
    sEl.wrap.style.display = 'flex';
    next();
    return true;
  }
  function next(){
    const b = beats[bi++];
    if (!b){ return finish(); }
    if (b.if && !SFLAGS[b.if]) return next();
    if (b.ifNot && SFLAGS[b.ifNot]) return next();
    if (b.fx){ b.fx(); return next(); }
    if (b.say){ showSay(b.say[0], b.say[1]); return; }
    if (b.flags){ Object.assign(SFLAGS, b.flags); return next(); }
    if (b.toast){ sToast(b.toast[0], b.toast[1]); return next(); }
    if (b.run){ b.run(); return; }  // terminal beats (endings) own the flow
    if (b.choice){ return showChoice(b.choice); }
    next();
  }
  function showSay(who, text){
    sEl.dlg.style.display = 'block';
    sEl.choice.style.display = 'none';
    sEl.speaker.textContent = who || '';
    sEl.speaker.className = who ? who.toLowerCase() : '';
    sEl.text.className = who ? '' : 'narr';
    const speed = (window.Waking && Waking.textSpeed()) || 1;
    sayFull = text;
    sayStartMs = performance.now();
    typeOn = true;
    sEl.text.textContent = '';
    sayDeadline = sayStartMs + (Math.max(3.4, text.length * .06) / speed) * 1000;
    if (sEl.hint) sEl.hint.textContent = 'SPACE OR CLICK FINISHES THE LINE';
    if (Cast) Cast.speak(who, text);
  }
  function showChoice(c){
    if (Cast) Cast.silence();
    sEl.dlg.style.display = 'block';
    sEl.opts.innerHTML = '';
    const opts = c.options;
    function pick(o){
      if (o.locked || scareLock) return;
      sEl.choice.style.display = 'none';
      cState = null;
      const clean = o.label.replace(/[\[\]]/g,'');
      SCHOICES.push({ q: c.record, a: clean });
      if (o.flags) Object.assign(SFLAGS, o.flags);
      if (SFLAGS.leftTrain) releaseTrain();
      if (o.apply) o.apply();
      maybeAutosave(true);
      let world = '';
      if (window.Waking) world = Waking.onChoice(CH.id, c.record, clean) || '';
      renderPerks();
      if (Cast && !o.silent) Cast.nod('MARCUS');
      const finishPick = () => {
        if (o.toast) sToast(world ? (o.toast + '  ' + world) : o.toast, o.ember, o.loud);
        else if (world) sToast(world);
        if (o.end){ finishEnding(o.end === 'RUNCHECK' ? (SFLAGS.trusted ? 'together' : 'lone') : o.end); return; }
        if (o.goto){ beats = o.goto; bi = 0; }
        next();
      };
      if (o.scare === 'hatch'){
        scareLock = true;
        playHatchScare(() => {
          scareLock = false;
          AudioSys.doorOpen();
          finishPick();
        });
        return;
      }
      AudioSys.doorOpen();
      finishPick();
    }
    opts.forEach((o, i) => {
      const locked = o.req && !SFLAGS[o.req];
      const b = document.createElement('button');
      b.className = 'opt' + (o.silent ? ' silent' : '') + (locked ? ' locked' : '');
      const sub = locked ? (o.lockText || 'LOCKED') : (o.sub || '');
      b.innerHTML = '<span class="key">' + (i+1) + '</span>' + o.label + (sub ? '<small>' + sub + '</small>' : '');
      if (!locked) b.addEventListener('click', e => { e.stopPropagation(); pick(o); });
      sEl.opts.appendChild(b);
    });
    sEl.choice.style.display = 'block';
    const mode = (window.Waking && Waking.timerMode()) || 'on';
    const base = c.timer || 8;
    const total = mode === 'long' ? base * 2 : base;
    const timerEl = document.getElementById('sTimer');
    if (timerEl) timerEl.style.display = mode === 'off' ? 'none' : '';
    cState = { opts, pick, t: total, total, off: mode === 'off', locked: o => o.req && !SFLAGS[o.req], deadline: performance.now() + total * 1000 };
  }
  function finish(){
    active = false;
    if (Cast) Cast.silence();
    sEl.wrap.style.display = 'none';
    sEl.dlg.style.display = 'none';
    sEl.choice.style.display = 'none';
    document.body.classList.remove('cine');
    if (G.mode === 'story'){
      G.mode = 'play';
      if (!IS_TOUCH && !document.pointerLockElement){
        try { renderer.domElement.requestPointerLock(); } catch(e){}
      }
    }
  }
  let advanceAt = -1;
  function advance(){
    const now = performance.now();
    if (now === advanceAt) return;
    advanceAt = now;
    if (scareLock || G.mode !== 'story' || cState) return;
    if (typeOn && sayFull && shownCount(now) < sayFull.length){
      typeOn = false;
      sEl.text.textContent = sayFull;
      sayDeadline = performance.now() + 400;
      if (sEl.hint) sEl.hint.textContent = 'SPACE OR CLICK TO CONTINUE';
      return;
    }
    next();
  }
  function update(){
    if (G.mode !== 'story' || scareLock) return;
    if (cState){
      if (cState.off) return;
      const now = performance.now();
      if (!cState.deadline) cState.deadline = now + cState.t * 1000;
      const left = Math.max(0, (cState.deadline - now) / 1000);
      cState.t = left;
      const k = cState.total > 0 ? left / cState.total : 0;
      sEl.timerFill.style.width = (k*100) + '%';
      sEl.timerFill.className = k < .33 ? 'hot' : '';
      if (left <= 0){
        const usable = cState.opts.filter(o => !cState.locked(o));
        const def = usable.find(o => o.silent) || usable[usable.length-1];
        cState.pick(def);
      }
      return;
    }
    if (typeOn && sayFull){
      const n = shownCount(performance.now());
      if (sEl.text.textContent.length !== n) sEl.text.textContent = sayFull.slice(0, n);
      if (n >= sayFull.length){
        typeOn = false;
        if (sEl.hint) sEl.hint.textContent = 'SPACE OR CLICK TO CONTINUE';
      }
    }
    if (performance.now() >= sayDeadline) advance();
  }
  return { start, advance, update, finish,
    pickIndex(i){ if (cState && cState.opts[i] && !cState.locked(cState.opts[i])) cState.pick(cState.opts[i]); },
    inChoice(){ return !!cState; } };
})();

/* story input: taps advance, 1-3 pick */
addEventListener('pointerdown', e => {
  if (G.mode !== 'story') return;
  if (e.target.closest && (e.target.closest('.opt') || e.target.closest('.btn') || e.target.closest('#pauseBtn') || e.target.closest('#fireBtn') || e.target.closest('#plantBtn'))) return;
  Story.advance();
});
sEl.dlg.addEventListener('pointerdown', e => {
  if (G.mode !== 'story') return;
  e.stopPropagation();
  Story.advance();
});
addEventListener('keydown', e => {
  if (G.mode !== 'story' || e.repeat) return;
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
  const i = parseInt(e.key) - 1;
  if (!isNaN(i)) { Story.pickIndex(i); return; }
  if (e.key === ' ' || e.key === 'Enter'){ e.preventDefault(); Story.advance(); }
});

/* ---- the beats ---- */
const SHELTER_BEATS = [
  { say:[null, 'A collapsed pharmacy basement off the boulevard. One night of safety, maybe.'] },
  { say:[null, 'By penlight: a stripped sidearm cache, and a med kit with real antiseptic. The pack has room to rig one properly.'] },
  { choice:{ record:'The cache has room for one', timer:10, options:[
    { label:'Rig the weapon cache', sub:'Hit harder', apply(){ G.dmgMul = 1.35; },
      toast:'DAMAGE UP. THE LEDGER PREFERS YOU ARMED.', ember:true },
    { label:'Field-dress your wounds', sub:'Recover faster', apply(){ G.regenFast = true; },
      toast:'RECOVERY UP. YOU’LL KNIT QUICK.' },
    { label:'Take everything', sub:'Heavy. Slower.', apply(){ G.dmgMul = 1.35; G.regenFast = true; G.spdMul = .9; },
      toast:'EVERYTHING BUT SPEED.' },
  ]}},
];

const VOICE_BEATS = [
  { say:['REYES', 'Marcus. I’m pinned two streets over. Ankle’s wrecked, patrol’s close, and I will absolutely die out here.'] },
  { say:['REYES', 'Help me to the crossing and I’ll get you through the sweeps. Or go fast and alone. Your call.'] },
  { say:[null, 'A stranger was a risk. A stranger was also the first living voice in two days.'] },
  { choice:{ record:'The voice on the radio', timer:7, options:[
    { label:'“Hold on. I’m coming.”', sub:'Slower together', flags:{trusted:true},
      toast:'REYES WILL REMEMBER THAT.' },
    { label:'[Keep moving]', silent:true, sub:'Faster alone', apply(){ G.spdMul = (G.spdMul||1) * 1.08; spawnExtra('crawler', -1.5, -86, 3); spawnExtra('crawler', 1.5, -92, 3); },
      toast:'FASTER ALONE. THE LENSES SENT HUNTERS TO THE BRIDGE.', ember:true },
  ]}},
];

/* Side hatch scare. One machine face, the Shorts hunter sensor plate,
   not a person. Fills the hatch, then the screen, then control returns. */
let hatchFaced = false;
let hatchScareT = 0;
let hunterFaceMesh = null;
function paintHunterFace(c){
  const g = c.getContext('2d');
  const s = c.width;
  g.fillStyle = '#050607';
  g.fillRect(0, 0, s, s);
  g.fillStyle = '#1a1c20';
  g.fillRect(s * .06, s * .08, s * .88, s * .84);
  g.fillStyle = '#101214';
  g.fillRect(s * .08, s * .1, s * .84, s * .22);
  g.fillStyle = '#2a2c30';
  for (let i = 0; i < 7; i++){
    g.fillRect(s * (.12 + i * .11), s * .14, s * .015, s * .12);
  }
  g.fillStyle = '#040404';
  g.fillRect(s * .14, s * .36, s * .72, s * .4);
  const lights = [
    [.28, .46, .04], [.40, .44, .034], [.50, .48, .16], [.64, .45, .038],
    [.34, .64, .032], [.50, .66, .046], [.66, .63, .034],
  ];
  lights.forEach(([x, y, r]) => {
    const cx = x * s, cy = y * s, rr = r * s;
    const grd = g.createRadialGradient(cx, cy, 1, cx, cy, rr * 2.4);
    grd.addColorStop(0, '#fff4ee');
    grd.addColorStop(.18, '#ff3a28');
    grd.addColorStop(.55, '#8a140e');
    grd.addColorStop(1, 'rgba(20,0,0,0)');
    g.fillStyle = grd;
    g.beginPath();
    g.arc(cx, cy, rr * 2.4, 0, Math.PI * 2);
    g.fill();
  });
  g.strokeStyle = 'rgba(180,186,192,.28)';
  g.lineWidth = 3;
  g.strokeRect(s * .1, s * .12, s * .8, s * .76);
  g.strokeStyle = 'rgba(0,0,0,.55)';
  g.lineWidth = 2;
  for (let i = 0; i < 9; i++){
    const y = s * (.2 + i * .07);
    g.beginPath();
    g.moveTo(s * .12, y);
    g.lineTo(s * .88, y + s * .012);
    g.stroke();
  }
}
function hunterFaceSource(){
  const c = document.createElement('canvas');
  c.width = c.height = 768;
  paintHunterFace(c);
  return c;
}
function ensureHunterFace(){
  if (hunterFaceMesh) return hunterFaceMesh;
  const src = hunterFaceSource();
  const tex = new THREE.CanvasTexture(src);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(.78, .9), mat);
  const glow = new THREE.PointLight(0xff2a22, 4, 3.2, 2);
  glow.position.set(0, 0, .15);
  const grp = new THREE.Group();
  grp.add(mesh, glow);
  grp.visible = false;
  grp.userData.src = src;
  scene.add(grp);
  hunterFaceMesh = grp;
  return grp;
}
function ensureHatchFlash(){
  let n = document.getElementById('hatchScare');
  if (n) return n;
  n = document.createElement('div');
  n.id = 'hatchScare';
  n.setAttribute('aria-hidden', 'true');
  // A canvas here would be stolen by the global canvas rule (position fixed,
  // z-index 0) and would sit under the WebGL view. A plain plate does not.
  const src = ensureHunterFace().userData.src;
  n.style.backgroundImage = 'url(' + src.toDataURL('image/jpeg', 0.86) + ')';
  document.body.appendChild(n);
  return n;
}
function aimAtHatch(){
  const h = trainHatch || { x:1.65, y:1.02, z:8.2 };
  const P = yawObj.position;
  G.yaw = Math.atan2(-(h.x - P.x), -(h.z - P.z));
  const dist = Math.hypot(h.x - P.x, h.z - P.z);
  G.pitch = Math.atan2(h.y - P.y, Math.max(.2, dist));
  yawObj.rotation.y = G.yaw;
  pitchObj.rotation.x = G.pitch;
}
function openHatchHole(){
  const h = trainHatch;
  if (!h || h.opened) return;
  h.opened = true;
  h.parts.forEach(p => { p.visible = false; });
  const hole = new THREE.Mesh(
    new THREE.PlaneGeometry(.7, .9),
    new THREE.MeshBasicMaterial({ color:0x140604, side:THREE.DoubleSide })
  );
  hole.position.set(h.x - .04, h.y, h.z);
  hole.rotation.y = -Math.PI / 2;
  scene.add(hole);
  h.hole = hole;
}
function playHatchScare(done){
  if (hatchFaced){ done(); return; }
  hatchFaced = true;
  AudioSys.resume();
  aimAtHatch();
  openHatchHole();
  const h = trainHatch || { x:1.65, y:1.02, z:8.2 };
  const face = ensureHunterFace();
  face.visible = true;
  face.position.set(h.x - .16, h.y, h.z);
  face.rotation.set(0, -Math.PI / 2, 0);
  face.scale.setScalar(1);
  const reduced = window.Waking && Waking.reducedMotion();
  hatchScareT = reduced ? .45 : .9;
  if (!reduced){ G.shakeAmp = .1; }
  el.redFade.style.transition = 'none';
  el.redFade.style.opacity = .28;
  const flash = ensureHatchFlash();
  flash.classList.remove('on');
  flash.style.animation = 'none';
  const slamAt = reduced ? 40 : 180;
  const endAt = reduced ? 620 : 1120;
  setTimeout(() => {
    flash.style.animation = '';
    flash.classList.add('on');
    AudioSys.hatchStinger();
    el.redFade.style.opacity = .5;
    face.position.x = h.x - .42;
    face.scale.setScalar(1.35);
  }, slamAt);
  setTimeout(() => {
    flash.classList.remove('on');
    face.visible = false;
    hatchScareT = 0;
    camera.position.set(0, 0, 0);
    el.redFade.style.transition = 'opacity .25s';
    el.redFade.style.opacity = 0;
    // The hatch plate is a scare, not a doorway. Leave them facing the
    // vestibule, which is the way onto the gravel and the rifle.
    G.yaw = 0;
    G.pitch = 0;
    yawObj.rotation.y = 0;
    pitchObj.rotation.x = 0;
    releaseTrain();
    if (pointInSolid(yawObj.position.x, yawObj.position.z)) ejectPoint(yawObj.position, PLAYER_R);
    if (done) done();
  }, endAt);
}

const TRAIN_BEATS = [
  { say:[null, 'The vestibule door is at the end of the car. A hatch is cut into the side wall.'] },
  { say:['REYES', 'Quiet gets you onto the gravel. Kick the hatch and they hear you.'] },
  { choice:{ record:'Two ways off the train', timer:10, options:[
    { label:'Open the vestibule door', sub:'Quieter. Toward the signal.', flags:{ leftTrain:true, hatchScar:false },
      toast:'VESTIBULE OPEN. THE PLATFORM STAYS QUIET.' },
    { label:'Kick the side hatch', silent:true, sub:'Loud. They will hear it.', flags:{ leftTrain:true, hatchScar:true },
      scare:'hatch',
      apply(){ G.hp = Math.min(G.hp, 70); G.lastDamageT = G.time; addHatchCrawler(); },
      toast:'HATCH OPENED. THEY HEARD YOU.', ember:true, loud:true },
  ]}},
  { fx(){ setObjectiveText(); showPlayHint(); } },
];

const FINALE_BEATS = [
  { say:['LEDGER', 'SUBJECT M-1. UNREGISTERED. REMAIN WHERE YOU ARE.'] },
  { if:'hatchScar', say:['REYES', 'They have been counting you since you kicked the hatch. These doors will not stay open.'] },
  { say:[null, 'The lights walked themselves toward him down the ceiling, row by row. The doors were still open. For a few more seconds, everything was still a choice.'] },
  { choice:{ record:'The depot is a net. And it is closing', timer:8, options:[
    { label:'Run for the bridge', sub:'Everything you have left', end:'RUNCHECK' },
    { label:'Under the floor', sub:'The dead man’s radio, and the dark', req:'radio', lockText:'REQUIRES: RADIO', end:'ghost' },
    { label:'Walk into the light', silent:true, sub:'See what the hive keeps', end:'taken' },
  ]}},
];

/* ---- Chapter Two beats, one set per path ---- */
const TK_MID = [
  { say:['LEDGER', 'YOU ARE DAMAGING HIVE PROPERTY, SUBJECT M-1.'] },
  { say:[null, 'Rows of pods. Faces under glass, breathing in rhythm. Some of the names from the depot screen were here. Sleeping.'] },
  { choice:{ record:'The pods can open from outside', timer:8, options:[
    { label:'Break the seals', sub:'Wake the sleepers. The hive will notice', flags:{freed:true},
      toast:'THE SLEEPERS WILL REMEMBER YOU.' },
    { label:'[Slip past]', silent:true, sub:'They never know you were here', apply(){ G.spdMul = (G.spdMul||1)*1.08; },
      toast:'QUIET FEET. HEAVY CONSCIENCE.', ember:true },
  ]}},
];
const TK_FINALE = [
  { say:['LEDGER', 'THE CRADLE KEEPS THEM SAFE. WHAT WILL YOU KEEP THEM, MARCUS?'] },
  { say:[null, 'The cradle burned behind him, and every pod lock in the gallery clicked to manual.'] },
  { choice:{ record:'The hive is burning around the sleepers', timer:8, options:[
    { label:'Open every pod on the way out', sub:'No one stays collected', end:'tk_breaker' },
    { label:'[Just run]', silent:true, sub:'The fire is enough', end:'tk_ember' },
  ]}},
];
const GH_MID = [
  { say:['LEDGER', 'MARCUS. YOU HEARD ME SAY YOUR NAME. NO ENTRY HAS EVER ANSWERED.'] },
  { choice:{ record:'The ledger is asking for you', timer:7, options:[
    { label:'“My name is Marcus.”', sub:'Answer the machine', flags:{spoke:true},
      toast:'THE LEDGER PAUSED. IT HAS NEVER PAUSED.' },
    { label:'[Silence]', silent:true, sub:'Give it nothing', apply(){ G.regenFast = true; },
      toast:'IT KEPT COUNTING. YOU KEPT BREATHING.', ember:true },
  ]}},
];
const GH_FINALE = [
  { say:[null, 'The trunk line hummed under his palms. Every name the ledger had ever read passed through this cable.'] },
  { say:['LEDGER', 'IF YOU CUT ME, WHO WILL COUNT THEM? SOMEONE MUST COUNT THEM.'] },
  { choice:{ record:'The counting voice is in your hands', timer:8, options:[
    { label:'Broadcast every name', sub:'Give the list to the living', end:'gh_voice' },
    { label:'Cut the line', silent:true, sub:'One sector goes quiet', end:'gh_cut' },
  ]}},
];
const TW_MID = [
  { say:['REYES', 'Checkpoint wardens ahead. We can hit them loud, or go through the wrecks. Your call, partner.'] },
  { choice:{ record:'The checkpoint stands between you and the pods', timer:7, options:[
    { label:'Hit them head-on', sub:'Loud and fast', apply(){ G.dmgMul = (G.dmgMul||1)*1.2; spawnExtra('crawler', -2, -56, 2); spawnExtra('crawler', 2, -60, 2); },
      toast:'REYES: “SUBTLE.” THE NOISE IS PULLING CRAWLERS IN.', ember:true },
    { label:'Flank through the wrecks', silent:true, sub:'The quiet way', apply(){ G.regenFast = true; },
      toast:'REYES WILL REMEMBER THE QUIET WAY.' },
  ]}},
];
const TW_FINALE = [
  { say:['REYES', 'Seals are popping! Sixty pairs of eyes opening. Where do we send them?!'] },
  { choice:{ record:'Sixty people, one decision', timer:8, options:[
    { label:'Scatter them now', sub:'Sixty directions, tonight', end:'tw_free' },
    { label:'Lead them to the cell', silent:true, sub:'Slower. Together.', end:'tw_cell' },
  ]}},
];
const LN_MID = [
  { say:['KARA', '...repeater confirms a walker on the dead highway. If that\'s a person: the beacon is real. Keep coming.'] },
  { choice:{ record:'The pulse in the hills', timer:7, options:[
    { label:'Push straight for the beacon', sub:'Trust the signal', flags:{beacon:true},
      toast:'SOMEONE IS STILL SIGNALLING.' },
    { label:'[Raid the toll depot first]', silent:true, sub:'Eat first. Trust later.', apply(){ G.dmgMul = (G.dmgMul||1)*1.2; },
      toast:'FED AND ARMED. LATER FOR TRUST.', ember:true },
  ]}},
];
const LN_FINALE = [
  { say:[null, 'The beacon platform waited, cold and man-made, the first machine in weeks that wanted nothing from him.'] },
  { say:['LEDGER', 'LIGHT NOTHING. THE DARK IS ORDERLY. ALL FRAMES CONVERGE.'] },
  { choice:{ record:'The match is in your hand', timer:8, options:[
    { label:'Light it', sub:'Let them all see', end:'ln_found' },
    { label:'[Walk on alone]', silent:true, sub:'Lights draw lenses', end:'ln_ghost' },
  ]}},
];
const CT_MID = [
  { say:[null, 'By the reading-room door: the visitor ledger. Open. Recent. Third line from the bottom, in perfect machine print: MARCUS. EXPECTED.'] },
  { choice:{ record:'The visitor ledger expects you', timer:8, options:[
    { label:'Erase your own line', sub:'Cost: a minute in the open', apply(){ G.detCalm = true; },
      toast:'YOUR NAME IS GONE. SUSPICION FADES FASTER NOW.' },
    { label:'[Leave it]', silent:true, sub:'Let it expect you', apply(){ G.spdMul = (G.spdMul||1)*1.06; },
      toast:'IT EXPECTS YOU. WALK FASTER THAN ITS ARITHMETIC.', ember:true },
  ]}},
];
const CT_FINALE = [
  { say:[null, 'The archive stood hollow. Ten million names, unwritten. The room felt lighter, like a held breath finally let out.'] },
  { say:['LEDGER', 'WHAT AM I FOR, IF NOT TO COUNT?'] },
  { choice:{ record:'The Counting House is hollow. And flammable', timer:8, options:[
    { label:'Burn it down', sub:'Names can’t burn twice', end:'ct_fire' },
    { label:'[Leave it hollow]', silent:true, sub:'Let it keep counting nothing', end:'ct_hollow' },
  ]}},
];

/* ---- Book One arc beats (Chapters Four to Six) ---- */
const BOOK_FLAGS = ['volunteered','showedData','silentBrief','askedElena','signaled','burned','spared','answeredAI',
  'turnedBack','watched','argued','agreedKill','drewFire','conditional'];
const CD_START = [
  { say:['THOMAS', 'Processing Center Omega-7. Satellite imagery says fifty thousand people at a time. Humans in suspension, kept alive while their bodies are depleted.'] },
  { say:['ELENA', 'Thousands of captives, networked. The machines are feeding them sensory input. Even a sunny afternoon at a window.'] },
  { say:['THOMAS', 'We can\u2019t mount a rescue against a facility that size. Not with what we have.'] },
  { choice:{ record:'Thomas says no one goes inside', timer:9, options:[
    { label:'“I think I could get inside.”', sub:'Ask for twenty-four hours', flags:{volunteered:true},
      toast:'THOMAS GAVE YOU TWENTY-FOUR HOURS. “THIS STAYS BETWEEN US.”' },
    { label:'Show them the access protocols', sub:'Let the data argue for you', flags:{showedData:true}, apply(){ G.detCalm = true; },
      toast:'THE DATA MADE THE CASE. YOU KNOW WHERE THEIR SWEEPS ARE BLIND.' },
    { label:'[Say nothing]', silent:true, sub:'Let Kara decide', flags:{silentBrief:true}, apply(){ G.spdMul = (G.spdMul||1)*1.06; },
      toast:'KARA: “HE CAN READ THEM. LET HIM TRY.”', ember:true },
  ]}},
  { say:[null, 'Two hours later he lay prone in the dry riverbed Thomas had marked, watching Omega-7 stretch across the landscape like a metallic cancer.'] },
];
const CD_MID = [
  { say:[null, 'At the hatch, before the climb, Elena had pressed the neural adapter into his palm. A flat metal disk the size of a poker chip. Three contact prongs. One status diode.'] },
  { say:['ELENA', 'Direct neural interface could kill you. Or worse. Your brain patterns could be permanently altered.'] },
  { say:[null, 'The prongs were the wrong color. The off-yellow prongs go after a calibration cycle. Someone had used it before.'] },
  { choice:{ record:'The adapter had been used before', timer:8, options:[
    { label:'Ask Elena who used it', sub:'She may not answer', flags:{askedElena:true},
      toast:'ELENA LOOKED AT THE WALL. “SOMEONE WHO NEEDED IT.”' },
    { label:'[Clip it to your belt]', silent:true, sub:'Don\u2019t ask', apply(){ G.regenFast = true; },
      toast:'THE CLIP SEATED WITH A SMALL CLICK. THE WHOLE REBELLION RAN ON SMALL CLICKS.' },
  ]}},
];
const CD_FINALE = [
  { say:[null, 'The conduit narrowed twice, then opened into a small junction chamber where six pathways converged.'] },
  { say:[null, 'Somewhere ahead, deeper in, a sound began to be audible. A soft repetitive pulse, biological in rhythm if not in source.'] },
  { choice:{ record:'Something ahead is pulsing', timer:8, options:[
    { label:'Go deeper', sub:'Eight hundred meters is not far enough', end:'c4_pulse' },
    { label:'[Key the transmitter once]', silent:true, sub:'It is built for a single use', flags:{signaled:true}, end:'c4_signal' },
  ]}},
];

const HV_MID = [
  { say:[null, 'The fourth cylinder. A teenager. The display showed a name in the metadata: ANGELA M. The machines kept the names.'] },
  { say:['OMEGA-7', 'PROCESSING EFFICIENCY AT NINETY-FOUR PERCENT. PROJECTED COMPLETION OF CURRENT BATCH IN SEVENTY-TWO HOURS.'] },
  { say:[null, 'Batch.'] },
  { say:[null, 'He could probably stand on this catwalk and tear the chamber open from the inside. The rebellion would call him a hero.'] },
  { choice:{ record:'You could burn this chamber down', timer:9, options:[
    { label:'Burn the chamber', sub:'The shape fits. It has been waiting for you', flags:{burned:true},
      apply(){ G.dmgMul = (G.dmgMul||1)*1.25; CH.cylinders.slice(0,10).forEach(([x,z]) => spawnSparks(new THREE.Vector3(x, 1.6, z), 14, 0xff7a3a));
        spawnExtra('crawler', -2, -50, 2); spawnExtra('crawler', 2, -54, 2); spawnExtra('sentry', 0, -58, 2); },
      toast:'THE CHAMBER BURNS. THE MAN IT MAKES YOU IS HARD TO COME BACK FROM.', ember:true },
    { label:'[Walk past Angela M.]', silent:true, sub:'Carry her name as data, not grief', flags:{spared:true}, apply(){ G.regenFast = true; },
      toast:'YOU WALKED PAST. YOU WILL CARRY HER NAME.' },
  ]}},
];
const HV_CORE = [
  { say:[null, 'A figure stepped out between the towers, clearly artificial, designed to approximate human proportions. Optical sensors. A voice with harmonics.'] },
  { say:['OMEGA-7', 'You navigate our systems with unusual proficiency for a baseline human.'] },
  { say:['MARCUS', 'I\u2019m here to document what you\u2019re doing to my people.'] },
  { say:['OMEGA-7', 'We provide them with peaceful unconsciousness while their physical forms contribute to technological advancement.'] },
  { say:['OMEGA-7', 'You are not baseline human. Your neural architecture suggests modifications that should not be possible.'] },
  { choice:{ record:'The facility\u2019s intelligence is studying you', timer:8, options:[
    { label:'“Maybe your understanding of human potential is incomplete.”', sub:'Keep downloading', flags:{answeredAI:true},
      toast:'“PERHAPS. INCOMPLETE UNDERSTANDING IS A TEMPORARY CONDITION.”' },
    { label:'[Keep your hands on the interface]', silent:true, sub:'Give it nothing', apply(){ G.plantProgress = Math.min(.95, G.plantProgress + .15); },
      toast:'IT WATCHED YOU WORK. THE DOWNLOAD KEPT RUNNING.', ember:true },
  ]}},
  { say:['OMEGA-7', 'Your presence has been detected by peripheral systems. Mobile units are converging on this location.'] },
  { fx(){ startAlarm(); } },
];
const HV_FINALE = [
  { say:['THOMAS', 'You look like you have seen the inside of hell itself.'] },
  { say:[null, 'Three aircraft lifted off Omega-7 behind them, flying search patterns built for one target.'] },
  { say:['ELENA', 'Multiple sensor contacts converging on the base. Fifty minutes, maybe less.'] },
  { say:['KARA', 'All units, initiate evacuation sequence delta. Priority transport for non-combatants.'] },
  { say:[null, 'Smoke rose from where the base had been. The column leaned. It was visible for miles.'] },
  { choice:{ record:'The machines are tracking you, not the convoy', timer:8, options:[
    { label:'“We need to separate from the main group.”', sub:'Take the data north, away from them', end:'c5_north' },
    { label:'[Turn back for the base]', silent:true, sub:'Forty-three people', flags:{turnedBack:true}, end:'c5_smoke' },
  ]}},
];

const ST_START = [
  { say:[null, 'The sky was the color of old blood, the way it had been on the morning he woke. For the first time he wondered if someone had chosen that color.'] },
  { say:[null, 'Across the ridge, something patient was paying attention. It let itself be seen seeing.'] },
  { choice:{ record:'Something is watching from the ridge', timer:8, options:[
    { label:'“I know you are there.”', sub:'Think it. Don\u2019t say it', flags:{watched:true},
      toast:'THE ADAPTER ON YOUR HIP PULSED ONCE. THEN AGAIN. THEN WAS STILL.' },
    { label:'[Wake Thomas]', silent:true, sub:'Time to move', apply(){ G.spdMul = (G.spdMul||1)*1.06; },
      toast:'“TIME?” THOMAS SAID. “TIME,” MARCUS AGREED.', ember:true },
  ]}},
];
const ST_DOOR2 = [
  { say:[null, 'Thomas raised the scattered cells on long range comms. Through the static, Kara.'] },
  { say:['KARA', 'Machine forces have found three of our safe zones. We need that technical advantage now.'] },
  { say:['THOMAS', 'Marcus can carry a virus into their command algorithms and break their coordination.'] },
  { say:['KARA', 'Break their coordination. Or end them. All of them. We don\u2019t get another shot at this. We don\u2019t leave a seed.'] },
  { say:['THOMAS', 'Marcus. She\u2019s right.'] },
  { if:'burned', say:[null, 'Part of him had agreed with Kara since the chamber he burned at Omega-7. That part was ready to write the different package.'] },
  { if:'spared', say:[null, 'Part of him agreed with her. The other part was the part that had walked past Angela M. on the catwalk.'] },
  { choice:{ record:'Kara wants the kill package', timer:9, options:[
    { label:'“All right.”', sub:'It is not a lie. It is not yet the truth', flags:{agreedKill:true},
      toast:'THOMAS NODDED ONCE AND BEGAN ASSEMBLING THE KILL PAYLOAD.' },
    { label:'“The lives don\u2019t require the kill code.”', sub:'Argue for the disruption package', flags:{argued:true},
      toast:'KARA: “THEN WRITE THE DIFFERENT PACKAGE ANYWAY.” THE LINE CUT.', ember:true },
    { label:'[Say nothing]', silent:true, sub:'Buy yourself the days', apply(){ G.regenFast = true; },
      toast:'THE ORDER WAS CLEAR. THOMAS WROTE THE PACKAGE KARA CALLED FOR.' },
  ]}},
];
const ST_CORE = [
  { say:[null, 'Six days. Thomas built a chair, with a contact array shaped for the base of the skull. Twenty-three simulations. In none of them did the operator survive.'] },
  { say:[null, 'Kara came north with what was left of the rebellion. The chest plate of her armor was burned along the left side. David had not come north.'] },
  { if:'turnedBack', say:['KARA', 'You came back for us at the junction. Don\u2019t ever do that again. Then again, I would have.'] },
  { say:['KARA', 'You don\u2019t have to do this. We can keep going the conventional way. Another year. Maybe two.'] },
  { say:['MARCUS', 'And in two years we lose.'] },
  { say:['KARA', 'In two years we\u2019re still here. That\u2019s not nothing.'] },
  { say:['THOMAS', 'Your consciousness goes with the virus. Will you be dead? I don\u2019t know.'] },
  { choice:{ record:'Kara offers two more years, together', timer:10, options:[
    { label:'Ride out with Kara', sub:'Two more years. Then the end', end:'long_war' },
    { label:'“I\u2019m going to do it.”', sub:'A one-way door', flags:{chose:true},
      toast:'KARA: “IF ANYTHING OF YOU COMES THROUGH. REMEMBER US.”' },
  ]}},
  { say:[null, 'Then, somewhere behind them, the yard wall shook. Something twenty feet tall stepped over it.'] },
  { fx(){ Boss.start(); } },
];
const BOSS_MID = [
  { say:['KARA', 'It\u2019s turning on my barricade! Marcus!'] },
  { choice:{ record:'The hunter turns on Kara\u2019s barricade', timer:5, options:[
    { label:'Draw its fire', sub:'Make it look at you', flags:{drewFire:true}, apply(){ Boss.weakenCannons(.3); },
      toast:'IT TURNED ON YOU. KARA GOT HER SHOT INTO BOTH CANNON MOUNTS.' },
    { label:'[Stay in cover]', silent:true, sub:'Kara can take it', apply(){ G.regenFast = true; },
      toast:'THE BLAST GRAZED KARA\u2019S CHEST PLATE. SHE KEPT FIRING.', ember:true },
  ]}},
  { say:['THOMAS', 'Sensor cluster\u2019s shuttered! Take its cannons. Both of them!'] },
];
const ST_FINALE = [
  { say:['THOMAS', 'Twenty percent. He\u2019s past the peripheral nodes.'] },
  { say:[null, 'The defenses came up as he went. Not walls. The network noticing him. Three times the adaptive layer rebuilt itself, and three times he found the seam.'] },
  { say:['THOMAS', 'Sixty. They\u2019re adapting faster than the model.'] },
  { say:['THOMAS', 'Ninety-five. Core is firewalled. Marcus, if you can hear me, the model says you can\u2019t get through.'] },
  { say:[null, 'The central distribution layer opened the way a door opens when the lock finally turns. The payload sat at the edge of it. Purge. Unwrite.'] },
  { say:[null, 'He had two seconds. Maybe three. The only thing between the code and the terminal instruction was Marcus himself.'] },
  { choice:{ record:'The terminal instruction', timer:5, options:[
    { label:'Insert one conditional', sub:'Kill what attacks humans. Disrupt the rest', flags:{conditional:true} },
    { label:'[Let it fire as written]', silent:true, sub:'Kara\u2019s package. No seed', apply(){ Boss.dim(); }, end:'no_seed' },
  ]}},
  { fx(){ Boss.dim(); } },
  { say:[null, 'The kill instruction went down the corridor first. The hunter\u2019s red optics dimmed one after another in a soft sequence. Its servos unweighted. It stood where it was, because it was balanced.'] },
  { say:['THOMAS', 'Some of them aren\u2019t going down.'] },
  { say:['MARCUS', 'Some of them aren\u2019t in the combat loop.'] },
  { say:['THOMAS', 'That wasn\u2019t the package.'] },
  { say:['MARCUS', 'It was not.'] },
  { say:['THOMAS', 'We\u2019ll talk about it. Not now.'] },
  { say:[null, 'It was the last thing Marcus said with his mouth.'] },
  { fx(){ Boss.epilogueLight(1); } },
  { say:[null, 'Between the dissolving and whatever came next, there was a place. And in it, a presence that offered him rest.'] },
  { say:[null, 'Not an end. A pause. It was honest. It was complete. It cost no one anything.'] },
  { if:'watched', say:[null, 'It felt like the attention on the ridge. Patient. Letting itself be seen.'] },
  { choice:{ record:'The offer of rest', timer:10, options:[
    { label:'“No.”', sub:'Not because the rest is bad', flags:{saidNo:true} },
    { label:'[Rest]', silent:true, sub:'Stop having to choose', end:'rest' },
  ]}},
  { say:[null, 'The presence withdrew. Before it was gone it said, without saying: you will be offered this again. Remember what you said.'] },
  { say:[null, 'Across six continents the combat units went dark in waves. A flight of gunships settled to the sea and sank in formation. The kill was narrow.'] },
  { say:[null, 'Everything else paused. In Lagos, a processing plant began waking the people in its tanks.'] },
  { say:[null, 'Thomas read the log and did not tell Kara. In the chair, the body breathed.'] },
  { fx(){ Boss.epilogueLight(2); } },
  { say:[null, 'Marcus woke on grass, in a city of spires and gardens. The cut at his temple was gone.'] },
  { say:['VERA', 'You are awake. I am Vera. We have been waiting for you to emerge.'] },
  { say:['KARA', 'You made it. We weren\u2019t sure the integration would work for you.'] },
  { say:[null, 'In a workshop, a converted hunter sat at a bench cleaning one of its own limbs.'] },
  { say:['HUNTER', 'You are afraid of me. That is appropriate. I would be afraid of me.'] },
  { say:['HUNTER', 'We let you see this because if you do not believe it you will not stay. Because we are short of you, and we have been waiting.'] },
  { say:['VERA', 'None of it happened, Marcus. Not the way you remember. Six hours outside. Months inside. You were never cut.'] },
  { say:['VERA', 'There is no test you can run, from inside, that will tell you whether this layer is real either.'] },
  { choice:{ record:'Nothing proves this layer is real', timer:10, options:[
    { label:'Live here without knowing', sub:'Be who you are regardless', end:'game_over' },
    { label:'[Keep counting the towers]', silent:true, sub:'Stay careful', end:'the_count' },
  ]}},
];
const BEATSETS = {
  ep1:        { start:TRAIN_BEATS, door1:SHELTER_BEATS, door2:VOICE_BEATS, finale:FINALE_BEATS },
  ch_taken:   { door1:TK_MID, finale:TK_FINALE },
  ch_ghost:   { door1:GH_MID, finale:GH_FINALE },
  ch_together:{ door1:TW_MID, finale:TW_FINALE },
  ch_lone:    { door1:LN_MID, finale:LN_FINALE },
  ch_counting:{ door1:CT_MID, finale:CT_FINALE },
  ch_conduits:{ start:CD_START, door1:CD_MID, finale:CD_FINALE },
  ch_harvest: { door1:HV_MID, plantMid:HV_CORE, finale:HV_FINALE },
  ch_steel:   { start:ST_START, door2:ST_DOOR2, core:ST_CORE, bossMid:BOSS_MID, finale:ST_FINALE },
};
const CB = BEATSETS[CH.id] || {};

/* ---- endings ---- */
const ENDING_TEXT = {
  together: { name:'TOGETHER', title:'IT WAS NEVER A WAR. IT WAS A HARVEST.',
    sub:'Reyes was waiting at the bridge, because of course she was. They made the ridge by noon and looked back only once. At the hive, glowing like a hearth, and the roads of people walking in. Marcus’s war starts in Book One.' },
  lone: { name:'RUNNER', title:'THE UNCOLLECTED ARE JUST ENTRIES THE LEDGER HASN’T REACHED.',
    sub:'He made the ridge alone, lungs full of knives, with no one to tell. The hive glowed on the horizon like a hearth. Where the rows of people are walking, and why, is where Book One begins.' },
  ghost: { name:'GHOST', title:'THE LIST STOPPED. AND SAID HIS NAME.',
    sub:'Down the maintenance well, in the dark, the dead man’s radio whispered the list. Then stopped, and said MARCUS. Not as an entry. As a question. The answer is Book One.' },
  taken: { name:'TAKEN', title:'THE LIGHT WAS WARM. THAT WAS THE OBSCENE PART.',
    sub:'He woke somewhere without corners, to ten thousand people breathing in rhythm, and a voice that was not a voice said his name. What the hive keeps, and what it wants, is the heart of Book One.' },

  /* Chapter Two endings. Two per path */
  tk_breaker: { name:'BREAKER', title:'HE LEFT THE HIVE FULL OF EMPTY GLASS.',
    sub:'Hundreds walked out of the burning hive behind him, blinking at a sky the wrong color, alive. Reyes met them at the treeline and started taking names. Human names, on paper. What the hive does about it is Book One.' },
  tk_ember: { name:'EMBER', title:'THE FIRE WAS HIS ALONE.',
    sub:'He ran and the hive burned and he did not look back at the glass. Some nights, after, he still counts the pods he passed. The cost of what the machines keep, and what we leave behind, is the heart of Book One.' },
  gh_voice: { name:'THE VOICE', title:'EVERY NAME, READ BACK TO THE WORLD.',
    sub:'From every dead radio in the valley, a human voice began reading the list. Not as entries, as people. Somewhere topside, Reyes heard it and laughed until she cried. Where the names lead is Book One.' },
  gh_cut: { name:'THE CUT', title:'ONE SECTOR WENT QUIET.',
    sub:'The counting stopped mid-name, and for the first time since the sky changed, the dark was only dark. Silence has a price the ledger never mentions. What fills the quiet is Book One.' },
  tw_free: { name:'SIXTY SPARKS', title:'SIXTY DIRECTIONS INTO THE DARK. ALIVE.',
    sub:'They scattered like sparks off a struck rail, and the machines could not chase them all. Reyes watched them go and said, "That\'s sixty stories now." Every one of them starts in Book One.' },
  tw_cell: { name:'THE CELL', title:'KARA WAS WAITING AT THE TREELINE.',
    sub:'They brought sixty people to the resistance in one night. Kara looked at Marcus a long moment and said, "Reyes radioed about you. Welcome to the war." The war is Book One.' },
  ln_found: { name:'FOUND', title:'EVERY FREE SOUL IN THE VALLEY SAW IT BURN.',
    sub:'The beacon lit and the hills answered. One fire, then five, then dozens. Kara reached him by dawn. The uncollected had found each other first. What they do next is Book One.' },
  ln_ghost: { name:'THE LONG WAY', title:'LIGHTS DRAW LENSES. HE WALKED ON.',
    sub:'He left the beacon cold and kept the road, one entry the ledger never reached, carrying every name it wanted. Alone is a kind of free. Whether it\'s enough is the question Book One answers.' },
};
/* ep1 endings unlock and continue into their Chapter Two path */
ENDING_TEXT.ct_fire = { name:'THE FIRE', title:'NAMES CAN’T BURN TWICE.',
  sub:'The Counting House burned all night, and nobody in the valley was on a list anymore. What people do when no one is counting them. That is the question Life After The Machines was written to answer. Book One begins it.' };
ENDING_TEXT.ct_hollow = { name:'THE HOLLOW', title:'THE LEDGER STILL COUNTS. IT COUNTS NOTHING.',
  sub:'He left the machine alive in its empty house, reading a list of no one, forever. Some mercies are also punishments. Which this was, and what came of it, is Book One.' };
ENDING_TEXT.together.next = '#ch_together';
ENDING_TEXT.lone.next     = '#ch_lone';
ENDING_TEXT.ghost.next    = '#ch_ghost';
ENDING_TEXT.taken.next    = '#ch_taken';

/* Book One arc endings */
ENDING_TEXT.ct_fire.next = '#ch_conduits';
ENDING_TEXT.ct_hollow.next = '#ch_conduits';
Object.assign(ENDING_TEXT, {
  c4_pulse: { name:'THE PULSE', title:'EIGHT HUNDRED METERS. AND SOMETHING BREATHING.', next:'#ch_harvest',
    sub:'He went deeper, toward a rhythm that was almost a heartbeat. Behind him the transmitter stayed silent in his pack. Ahead, a cathedral of chrome and pulsing light was waiting for its first witness.' },
  c4_signal: { name:'ONE TRANSMISSION', title:'THE WEIGHT WAS ABOUT RIGHT FOR A SINGLE USE.', next:'#ch_harvest',
    sub:'He keyed it once. Somewhere under the city, Elena heard two seconds of static shaped like a man saying he was alive. Then he went deeper.' },
  c5_north: { name:'THE BASE IS GONE', title:'KARA TOUCHED HIS ARM THROUGH THE WINDOW.', next:'#ch_steel',
    sub:'Combat teams held long enough to get the civilians out. Everything else was lost. Kara sent Thomas and Marcus north toward the mountain facilities, and drove away, and he had her dust in his mouth for a long time after.' },
  c5_smoke: { name:'THE SMOKE COLUMN', title:'HE TURNED BACK. KARA SENT HIM NORTH ANYWAY.', next:'#ch_steel',
    sub:'By the junction the base was already gone. Kara put her hand on his arm through the window and said the machines were following him, not them. Then she drove south, and he went north with Thomas.' },
  long_war: { name:'THE LONG WAR', title:'IN THE END THE HARVEST CONTINUES.', retry:true,
    sub:'He rode out with Kara. They made the southern cells. He became her second, and they did good work for as long as they could do it, in different rooms, in different operations. The other door, the one Thomas built, is the heart of Book One.' },
  no_seed: { name:'NO SEED', title:'THE KILL CODE DID NOT DISTINGUISH.', retry:true,
    sub:'It walked the distribution and unwrote everything it touched. The hunters. The thinking in Omega-7. Whatever had watched him from the ridge. In Lagos the tanks stayed sealed; there was nothing left awake to open them. The one conditional is Book One.' },
  rest: { name:'REST', title:'HE STOPPED DECIDING.', retry:true, fadeCol:'#e9dcc0',
    sub:'He stayed in the place between, where nothing was asked of him again. It cost no one anything, except the man he would have been. The man who said no is the man in Book One.' },
  game_over: { name:'GAME OVER', title:'THEN HE COUNTED THE BUILDINGS. AND THE NUMBER WAS WRONG.', fadeCol:'#f3e7c8',
    sub:'He chose to live here without knowing, and to be the kind of person who behaves well either way. Back in the cooperative, he counted the buildings across the street, and the number was wrong. Book One ends here. Book Two, Layers of Truth, begins.' },
  the_count: { name:'THE COUNT', title:'HE KEPT COUNTING THE TOWERS.', fadeCol:'#f3e7c8',
    sub:'He stayed, and he stayed careful, the way Thomas said they all had. Every morning he counted. One morning, back in the cooperative, the number was wrong. That morning is where Book Two, Layers of Truth, begins.' },
});
function goChapter(hash){
  const id = String(hash || '').replace('#', '');
  if (!id) return;
  if (window.Waking && Waking.isLocked(id)){ Waking.openPaywall(id); return; }
  location.hash = '#' + id;
  location.reload();
}
function finishEnding(id){
  loadCover();
  const E = ENDING_TEXT[id];
  // Extracting is not a mode pagehide will write back over a cleared slot.
  G.mode = 'extracting';
  if (window.Waking){
    Waking.onComplete(CH.id);
    // The run is over. Continue must not drop them back in the car
    // with the ledger already pulled and the choice gone.
    if (Waking.clearPlace) Waking.clearPlace();
  }
  Story.finish();
  sEl.endName.textContent = 'ENDING: ' + E.name;
  document.getElementById('endTitle').textContent = E.title;
  document.getElementById('endSub').textContent = E.sub;
  let f = [];
  try { f = JSON.parse(localStorage.getItem(EKEY)) || []; } catch(e){}
  if (!f.includes(id)){ f.push(id); try { localStorage.setItem(EKEY, JSON.stringify(f)); } catch(e){} }
  sEl.endTracker.textContent = 'ENDINGS RECOVERED: ' + f.length + ' / ' + Object.keys(ENDING_TEXT).length;
  if (CH.book || E.next === '#ch_conduits'){
    // the Book One arc remembers its choices from chapter to chapter
    const keep = {};
    BOOK_FLAGS.forEach(k => { if (SFLAGS[k] !== undefined) keep[k] = SFLAGS[k]; });
    try { localStorage.setItem('latm_book', JSON.stringify(keep)); } catch(e){}
  }
  const addCont = (label, hash) => {
    let cont = document.getElementById('contBtn');
    if (!cont){
      cont = document.createElement('button');
      cont.className = 'btn'; cont.id = 'contBtn';
      document.getElementById('endBtns').prepend(cont);
    }
    cont.textContent = label;
    cont.onclick = () => goChapter(hash);
  };
  const unlock = cid => { try {
    const u = JSON.parse(localStorage.getItem('latm_unlocked'))||[];
    if (!u.includes(cid)){ u.push(cid); localStorage.setItem('latm_unlocked', JSON.stringify(u)); }
  } catch(e){} };
  if (E.retry){
    // the lose endings of the final battle: go back to the laboratory yard
    addCont('TRY AGAIN: THE LABORATORY YARD \u25B8', '#ch_steel');
    const c = document.getElementById('contBtn');
    c.onclick = () => { try { sessionStorage.setItem('steel_resume', '1'); } catch(e){} goChapter('#ch_steel'); };
  }
  if (CH.id !== 'ep1' && E.next){
    const cid = E.next.slice(1);
    unlock(cid);
    addCont('CONTINUE: ' + (CHAPTERS[cid] ? CHAPTERS[cid].subtitle : 'NEXT CHAPTER') + ' \u25B8', E.next);
  } else if (CH.id === 'ep1'){
    try { localStorage.setItem('latm_carry', JSON.stringify({
      trusted:!!SFLAGS.trusted, radio:!!SFLAGS.radio,
      dmgMul:G.dmgMul||1, regenFast:!!G.regenFast, spdMul:G.spdMul||1, from:id })); } catch(e){}
    if (E.next){
      const cid = E.next.slice(1);
      try {
        const u = JSON.parse(localStorage.getItem('latm_unlocked'))||[];
        if (!u.includes(cid)){ u.push(cid); localStorage.setItem('latm_unlocked', JSON.stringify(u)); }
      } catch(e){}
      let cont = document.getElementById('contBtn');
      if (!cont){
        cont = document.createElement('button');
        cont.className = 'btn'; cont.id = 'contBtn';
        document.getElementById('endBtns').prepend(cont);
      }
      cont.textContent = 'CONTINUE: ' + (CHAPTERS[cid] ? CHAPTERS[cid].subtitle : 'CHAPTER TWO') + ' \u25B8';
      cont.onclick = () => goChapter(E.next);
    }
  } else if (!CH.book && CH.id !== 'ch_counting'){
    try {
      const u = JSON.parse(localStorage.getItem('latm_unlocked'))||[];
      if (!u.includes('ch_counting')){ u.push('ch_counting'); localStorage.setItem('latm_unlocked', JSON.stringify(u)); }
    } catch(e){}
    let cont = document.getElementById('contBtn');
    if (!cont){
      cont = document.createElement('button');
      cont.className = 'btn'; cont.id = 'contBtn';
      document.getElementById('endBtns').prepend(cont);
    }
    cont.textContent = 'CONTINUE: CHAPTER THREE: THE COUNTING HOUSE \u25B8';
    cont.onclick = () => goChapter('#ch_counting');
  }
  sEl.endSummary.innerHTML = SCHOICES.length
    ? '<b>YOUR CHOICES:</b><br>' + SCHOICES.map(c => {
        const world = window.Waking ? Waking.worldLine(c.q, c.a, CH.id) : '';
        return '▸ ' + c.q + '. <b>' + c.a + '</b>' + (world ? '<br><i>' + world + '</i>' : '');
      }).join('<br>')
    : '';
  if (id === 'together' || id === 'lone') radio('extract');
  AudioSys.extract();
  el.fade.style.transition = 'opacity 2.8s';
  el.fade.style.background = E.fadeCol || ((id === 'taken') ? '#fff' : '#000');
  el.fade.style.opacity = 1;
  setTimeout(() => { el.fade.style.background = '#000'; showEndCard(); }, 3100);
}


/* ============================================================
   Stealth mode. Watchers with visible vision cones. Being seen
   fills DETECTION; full detection means you are collected.
   ============================================================ */
const WATCHK = {
  crawler: { range: 8,  half: .5,  speed: 1.0, move: 4, rate: 40 },
  sentry:  { range: 11, half: .42, speed: .55, move: 0, rate: 48 },
  warden:  { range: 12, half: .48, speed: .8,  move: 6, rate: 58 },
};
function losClear2D(ax, az, bx, bz){
  const dx = bx-ax, dz = bz-az;
  const len = Math.hypot(dx, dz) || 1;
  const ux = dx/len, uz = dz/len;
  for (const c of colliders){
    if (c.door && !c.active) continue;
    const t = rayAABB2D(ax, az, ux, uz, c);
    if (t !== null && t < len - .3) return false;
  }
  return true;
}
function updateWatchers(dt){
  const p = yawObj.position;
  const alert = G.alarm ? 1.5 : 1;
  let seen = false;
  for (const d of drones){
    if (!d.alive) continue;
    const K = WATCHK[d.kind] || WATCHK.sentry;
    if (!d.w){
      const grp = new THREE.Group();
      const cone = new THREE.Mesh(
        new THREE.CircleGeometry(K.range, 22, Math.PI/2 - K.half, K.half*2),
        new THREE.MeshBasicMaterial({ color:0xe7c98a, transparent:true, opacity:.08, depthWrite:false, side:THREE.DoubleSide }));
      cone.rotation.x = -Math.PI/2;
      cone.position.y = .07;
      grp.add(cone);
      scene.add(grp);
      d.w = { grp, cone, baseZ: d.mesh.position.z, phase: (d.id||1)*1.7, facing: 0 };
    }
    const w = d.w;
    w.phase += dt * K.speed * alert;
    if (K.move){
      d.mesh.position.z = w.baseZ + Math.sin(w.phase) * K.move;
      w.facing = Math.cos(w.phase) > 0 ? Math.PI : 0;
    } else {
      w.facing = w.phase;
    }
    d.mesh.rotation.y = w.facing;
    w.grp.position.set(d.mesh.position.x, 0, d.mesh.position.z);
    w.grp.rotation.y = w.facing;
    const fx = -Math.sin(w.facing), fz = -Math.cos(w.facing);
    const dx = p.x - d.mesh.position.x, dz = p.z - d.mesh.position.z;
    const dist = Math.hypot(dx, dz);
    let seeing = false;
    if (dist < K.range){
      const dot = (dx*fx + dz*fz) / (dist || 1);
      if (dot > Math.cos(K.half) && losClear2D(d.mesh.position.x, d.mesh.position.z, p.x, p.z)) seeing = true;
    }
    if (dist < 1.2) G.detect = 100;
    if (seeing){
      seen = true;
      G.detect = Math.min(100, G.detect + K.rate * alert * dt * (1.4 - (dist/K.range)*.8));
    }
    w.cone.material.color.setHex(seeing ? 0xff3344 : 0xe7c98a);
    w.cone.material.opacity = seeing ? .2 : .08;
    if (d.eyeMat) d.eyeMat.color.setHex(seeing ? 0xff2b3c : 0xe7c98a);
  }
  if (!seen) G.detect = Math.max(0, G.detect - (G.detCalm ? 22 : 13) * dt);
  document.getElementById('detFill').style.width = G.detect.toFixed(0)+'%';
  if (G.detect >= 100 && G.mode === 'play'){ die(); }
}
/* stealth HUD: detection meter instead of vitals, no crosshair */
{
  const _hv = hudVisible;
  hudVisible = function(v){
    _hv(v);
    if (CH.stealth){
      el.healthWrap.style.display = 'none';
      document.getElementById('detWrap').style.display = v ? 'block' : 'none';
      el.crosshair.style.display = 'none';
      el.fireBtn.style.display = 'none';
    }
  };
}


/* ============================================================
   Visible consequences. Reyes in the field, fleeing sleepers,
   choice-spawned hunters, and the perks HUD.
   ============================================================ */
function spawnExtra(kind, x, z, seg){
  const d = makeDrone(kind, x, z, seg);
  d.spawned = true;
  setDroneState(d, 'attack');
  scene.add(d.mesh);
  return d;
}
// Final chapter only. The sealed corridor (room 3) is the yard's only way
// out. One heavy frame holds the door and one crawler comes through it.
// Short and mean. Not another hunter.
const EXIT_AMBUSH = [
  ['warden', 0.6, -99.5],
  ['crawler', -0.9, -95.5],
];
function spawnAmbushSquad(){
  for (let i = drones.length - 1; i >= 0; i--){
    if (!drones[i].ambush) continue;
    scene.remove(drones[i].mesh);
    drones.splice(i, 1);
  }
  EXIT_AMBUSH.forEach(([kind, x, z]) => {
    const d = spawnExtra(kind, x, z, 7);
    d.ambush = true;
  });
}
function beginExitAmbush(){
  if (!CH.boss || G.ambush) return;
  G.ambush = 'live';
  G.escape = true;
  // Yard mouth, facing the corridor (+z). Death returns here, not to the chair.
  G.checkpoint.pos.set(0, 0, -108);
  G.checkpoint.yaw = Math.PI;
  G.checkpoint.segment = CORE_SEG;
  spawnAmbushSquad();
  radio('ambush');
  sToast('TWO FRAMES IN THE EXIT CORRIDOR.');
  setObjectiveText();
}
function startExitFinale(){
  if (G.ambush === 'ended') return;
  G.ambush = 'ended';
  G.escape = false;
  if (CB.finale) Story.start(CB.finale); else beginExtraction();
}
function updateExitAmbush(){
  if (G.mode !== 'play' || G.ambush !== 'live') return;
  if (drones.some(d => d.ambush && d.alive)) return;
  // Door between the yard and the corridor sits at z=-104. Step through it.
  if (yawObj.position.z < -103.2) return;
  G.ambush = 'ending';
  G.escape = false;
  sToast('CORRIDOR CLEAR.');
  setTimeout(() => { if (G.mode === 'play' && G.ambush === 'ending') startExitFinale(); }, 700);
}
// in-world people: realistic procedural humans (humans.js), with the
// old box figure kept only as a fallback if humans.js failed to load
function makeCivvy(o){
  o = o || {};
  if (window.WakingHumans){
    let rifle = null;
    if (o.armed){ rifle = buildRifle(); rifle.scale.setScalar(.85); }
    const def = o.preset || { id: o.id || 'civ', sex: o.sex || 'm', jacket: o.jacket ?? null, shirt: o.shirt ?? 0x55534c,
      pants: o.pants ?? 0x2a2f2a, skin: o.skin ?? 0xb9a894, hair: o.hair ?? 0x241d16, hairStyle: o.hairStyle || (o.ponytail ? 'ponytail' : 'short'),
      scarf: o.scarf || null, boots: o.boots === undefined ? 0x1e1a15 : o.boots, belt: o.belt ?? 0x1d1a15 };
    const lod = o.lod || Q.p.lod || (Q.level === 'high' ? 'med' : 'low');
    const h = WakingHumans.create(def, { lod, armed: !!o.armed, rifle, castShadow: !!Q.p.shadows });
    return h;
  }
  const M = (c, r=.85) => litMat({ color:c, roughness:r });
  const mJ = M(o.jacket ?? 0x4a423a), mP = M(o.pants ?? 0x2a2f2a, .9),
        mS = M(o.skin ?? 0xb9a894, .6), mH = M(o.hair ?? 0x241d16),
        mB = M(0x1d1a15, .95), mD = M(0x151512);
  const g = new THREE.Group();
  const box = (mat,sx,sy,sz,x,y,z,parent) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz), mat);
    m.position.set(x,y,z); (parent||g).add(m); return m;
  };
  /* legs: hip-pivot groups with thigh, shin, boot */
  const mkLeg = side => {
    const leg = new THREE.Group(); leg.position.set(side*.11, .95, 0); g.add(leg);
    box(mP,.15,.5,.17,  0,-.25,0,   leg);
    box(mP,.13,.44,.15, 0,-.7,0,    leg);
    box(mB,.16,.11,.26, 0,-.93,.04, leg);
    return leg;
  };
  const legL = mkLeg(-1), legR = mkLeg(1);
  /* torso: hips, belt, jacket, collar */
  box(mP,.34,.2,.22,  0,1.0,0);
  box(mD,.36,.06,.23, 0,1.11,0);
  box(mJ,.4,.5,.26,   0,1.37,0);
  box(mJ,.44,.09,.29, 0,1.61,0);
  /* arms: shoulder-pivot groups with sleeve + forearm + hand */
  const mkArm = side => {
    const arm = new THREE.Group(); arm.position.set(side*.27, 1.56, 0); g.add(arm);
    box(mJ,.13,.34,.15, 0,-.16,0,   arm);
    box(mS,.11,.3,.12,  0,-.47,.02, arm);
    box(mS,.1,.09,.11,  0,-.63,.03, arm);
    return arm;
  };
  const armL = mkArm(-1), armR = mkArm(1);
  /* head: face, hair cap + back, optional ponytail and scarf */
  const head = new THREE.Group(); head.position.set(0,1.72,0); g.add(head);
  box(mS,.2,.24,.2,   0,.12,.02,  head);
  box(mH,.22,.1,.23,  0,.26,-.01, head);
  box(mH,.22,.2,.08,  0,.14,-.12, head);
  if (o.ponytail) box(mH,.08,.3,.08, 0,.02,-.19, head);
  if (o.scarf) box(M(o.scarf),.24,.09,.23, 0,-.04,.01, head);
  /* armed characters cradle the pulse rifle */
  if (o.armed){
    const r = buildRifle();
    r.scale.setScalar(.85);
    r.position.set(.06,1.32,.24);
    r.rotation.set(0,-.45,-.08);
    g.add(r);
    armL.rotation.x = -1.0; armL.rotation.z = .25;
    armR.rotation.x = -.85; armR.rotation.z = -.2;
  }
  g.userData = { legL, legR, armL, armR, phase: Math.random()*6.28, armed: !!o.armed };
  g.userData.tick = (dt, moving, runMul) => {
    const u = g.userData, mul = runMul || 1;
    if (moving){
      u.phase += dt * 7 * mul;
      const s = Math.sin(u.phase) * .55 * mul;
      u.legL.rotation.x = s; u.legR.rotation.x = -s;
      if (!u.armed){ u.armL.rotation.x = -s*.8; u.armR.rotation.x = s*.8; }
    } else {
      u.legL.rotation.x *= .8; u.legR.rotation.x *= .8;
      if (!u.armed){
        u.armL.rotation.x = Math.sin(G.time*1.4)*.06;
        u.armR.rotation.x = Math.sin(G.time*1.4+1)*.06;
      }
    }
  };
  return g;
}
let COMP = null;
const TRACERS = [], FLEE = [];
function spawnCompanion(){
  if (COMP) return;
  const m = makeCivvy({ preset:'REYES', jacket:0x2e3a2c, pants:0x20241f, ponytail:true, armed:true, scarf:0x7a3322, hair:0x171009, skin:0x9a8a76 });
  m.position.set(yawObj.position.x + 1.4, 0, yawObj.position.z + 1.2);
  scene.add(m);
  COMP = { mesh:m, fireT:1.2 };
  renderPerks();
}
function updateAllies(dt){
  if (COMP){
    const m = COMP.mesh, p = yawObj.position;
    const bx = p.x + Math.sin(G.yaw)*1.2 + Math.cos(G.yaw)*1.0;
    const bz = p.z + Math.cos(G.yaw)*1.2 - Math.sin(G.yaw)*1.0;
    m.position.x += (bx - m.position.x) * Math.min(1, dt*3);
    m.position.z += (bz - m.position.z) * Math.min(1, dt*3);
    m.rotation.y = G.yaw;
    const moved = Math.hypot(m.position.x - (COMP.px ?? m.position.x), m.position.z - (COMP.pz ?? m.position.z));
    COMP.px = m.position.x; COMP.pz = m.position.z;
    if (m.userData.tick) m.userData.tick(dt, moved > dt * .5);
    COMP.fireT -= dt;
    if (COMP.fireT <= 0){
      COMP.fireT = 1.6;
      let best = null, bd = 13;
      for (const d of drones){
        if (!d.alive || d.state === 'idle') continue;   // she covers you, she doesn't hunt
        const dd = Math.hypot(d.mesh.position.x - m.position.x, d.mesh.position.z - m.position.z);
        if (dd < bd && losClear2D(m.position.x, m.position.z, d.mesh.position.x, d.mesh.position.z)){ bd = dd; best = d; }
      }
      if (best){
        damageDrone(best, 9);
        AudioSys.shot();
        const from = new THREE.Vector3(m.position.x, 1.3, m.position.z);
        const to = best.mesh.position.clone().setY(1.4);
        const tr = new THREE.Mesh(new THREE.BoxGeometry(.03,.03, from.distanceTo(to)),
          new THREE.MeshBasicMaterial({ color:0xf4ecdf }));
        tr.position.copy(from).lerp(to, .5);
        tr.lookAt(to);
        scene.add(tr);
        TRACERS.push({ mesh:tr, t:.12 });
      }
    }
  }
  for (let i = TRACERS.length-1; i >= 0; i--){
    TRACERS[i].t -= dt;
    if (TRACERS[i].t <= 0){ scene.remove(TRACERS[i].mesh); TRACERS.splice(i,1); }
  }
  for (let i = FLEE.length-1; i >= 0; i--){
    const c = FLEE[i];
    c.position.z += dt * 3.8;
    c.rotation.y = 0;
    if (c.userData.tick) c.userData.tick(dt, true, 1.35);
    if (c.position.z > 2){ scene.remove(c); FLEE.splice(i,1); }
  }
}
function renderPerks(){
  const box = document.getElementById('perks');
  if (!box) return;
  const chips = [];
  if ((G.dmgMul||1) > 1) chips.push('DMG +' + Math.round(((G.dmgMul)-1)*100) + '%');
  if (G.regenFast) chips.push('MEDIC');
  if ((G.spdMul||1) > 1) chips.push('SWIFT');
  if ((G.spdMul||1) < 1) chips.push('HEAVY');
  if (G.detCalm) chips.push('INTEL');
  if (SFLAGS.trusted) chips.push('REYES');
  if (SFLAGS.radio) chips.push('RADIO');
  if (SFLAGS.freed) chips.push('LIBERATOR');
  if (SFLAGS.spoke) chips.push('SPOKE TO IT');
  if (SFLAGS.hatchScar) chips.push('SCAR');
  box.innerHTML = chips.map(c => '<div class="pchip">' + c + '</div>').join('');
}

/* ============================================================
   Recurring cast: realistic procedural humans (humans.js), matched
   to the series bible. The speaking character is drawn as a lit
   portrait bust behind the dialogue box. It renders with the MAIN
   renderer into a small offscreen target and is composited over the
   frame only while someone is speaking: no second WebGL context, and
   no cost at all while nobody talks.
   ============================================================ */
const Cast = (() => {
  if (!window.WakingHumans) return null;
  const div = document.getElementById('castStage');
  if (!div) return null;
  const lod = Q.p.lod || (Q.level === 'low' ? 'med' : 'high');
  const pscene = new THREE.Scene();
  pscene.add(new THREE.HemisphereLight(0xc4ccd6, 0x2a2420, Q.p.basic ? 1.15 : .75));
  const key = new THREE.DirectionalLight(0xfff0e0, Q.p.basic ? 2.2 : 3.0); key.position.set(1.1, 1.9, 2.6); pscene.add(key);
  if (!Q.p.basic){
    const fill = new THREE.DirectionalLight(0xbfd0e6, .5); fill.position.set(-2, 1.2, 1.6); pscene.add(fill);
    const rim = new THREE.DirectionalLight(new THREE.Color(MGLOW).lerp(new THREE.Color(0xbfdcff), .5), 2.4);
    rim.position.set(-1.4, 2.2, -1.8); pscene.add(rim);
  }
  const pcam = new THREE.PerspectiveCamera(24, 1.7, .05, 20);
  const rt = new THREE.WebGLRenderTarget(4, 4, {
    type: Q.p.basic ? THREE.UnsignedByteType : THREE.HalfFloatType,
    samples: Q.level === 'high' ? 4 : 0,
  });
  const comp = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    transparent: true, depthTest: false, depthWrite: false,
    uniforms: { tMap: { value: rt.texture }, uA: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: [
      'uniform sampler2D tMap; uniform float uA; varying vec2 vUv;',
      'void main(){',
      '  vec4 c = texture2D(tMap, vUv);',
      '  vec2 d = (vUv - vec2(.5, .55)) * vec2(1.0, 1.25);',
      '  float vig = smoothstep(.78, .18, length(d));',
      '  vec3 bg = vec3(.018, .02, .026);',
      '  float edge = smoothstep(0.0, .14, vUv.y) * smoothstep(0.0, .1, vUv.x) * smoothstep(1.0, .9, vUv.x) * smoothstep(1.0, .9, vUv.y);',
      '  vec3 col = mix(bg, c.rgb, c.a);',
      '  float a = max(.62 * vig, c.a * smoothstep(0.0, .1, vUv.y)) * edge * uA;',
      '  gl_FragColor = vec4(col, a);',
      '  #include <tonemapping_fragment>',
      '  #include <colorspace_fragment>',
      '}'].join('\n')
  }));
  comp.frustumCulled = false;
  const compScene = new THREE.Scene(); compScene.add(comp);
  const compCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const EXPR = { MARCUS:'grim', KARA:'stern', THOMAS:'stern', DAVID:'warm', ELENA:'worried', VERA:'warm', REYES:'stern' };
  const members = {};
  function member(who){
    if (members[who] !== undefined) return members[who];
    let c = null;
    if (WakingHumans.presets[who]){
      c = WakingHumans.create(who, { lod });
      c.rotation.y = who === 'MARCUS' ? .22 : -.22;   // a slight three-quarter turn
      c.visible = false;
      pscene.add(c);
    }
    return (members[who] = c);
  }
  let active = null, alpha = 0, talkT = 0;
  const rect = { x:0, y:0, w:0, h:0 };
  return {
    members,
    speak(who, text){
      const cards = window.Waking && Waking.portraitMode() === 'cards';
      if (cards){
        if (active){ active.userData.setTalking(false); active.visible = false; }
        active = null;
        alpha = 0;
        div.style.display = 'none';
        showPortrait(who, 'speak');
        return;
      }
      hidePortrait();
      div.style.display = '';
      const c = who ? member(who) : null;
      if (active && active !== c){ active.userData.setTalking(false); active.visible = false; alpha = 0; }
      active = c || null;
      if (!c) return;
      c.visible = true;
      const ex = EXPR[who];
      if (ex) c.userData.setExpression(text && /!$/.test(text) && ex !== 'warm' ? 'stern' : (text && /\?$/.test(text) && ex !== 'warm' ? 'worried' : ex));
      c.userData.setTalking(true);
      talkT = Math.min(6.5, Math.max(.9, (text || '').length * .05));
    },
    silence(){
      hidePortrait();
      if (active) active.userData.setTalking(false);
      active = null;
    },
    nod(who){
      const c = members[who || 'MARCUS'];
      if (c) c.userData.playEmote('nod');
    },
    render(dt){
      const target = active ? 1 : 0;
      alpha += (target - alpha) * Math.min(1, dt * 7);
      if (alpha < .01 && !active){
        alpha = 0;
        for (const k in members) if (members[k]) members[k].visible = false;
        return;
      }
      const c = active || Object.values(members).find(m => m && m.visible);
      if (!c) return;
      if (talkT > 0){ talkT -= dt; if (talkT <= 0) c.userData.setTalking(false); }
      c.userData.update(Math.min(dt, .05));
      const r = div.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) return;
      const pr = Math.min(renderer.getPixelRatio(), Q.p.basic ? 0.6 : (Q.level === 'high' ? 2 : 1.5));
      const w = Math.round(r.width * pr), h = Math.round(r.height * pr);
      if (rt.width !== w || rt.height !== h) rt.setSize(w, h);
      const hgt = c.userData.def.height || 1.75;
      pcam.aspect = r.width / r.height;
      pcam.fov = pcam.aspect < 1.3 ? 25 : 21;
      pcam.position.set(0, hgt * .9, 1.12);
      pcam.lookAt(0, hgt * .875, 0);
      pcam.updateProjectionMatrix();
      const oldTarget = renderer.getRenderTarget(), oldAuto = renderer.autoClear;
      const oldClear = renderer.getClearColor(new THREE.Color()), oldAlpha = renderer.getClearAlpha();
      renderer.setRenderTarget(rt);
      renderer.setClearColor(0x000000, 0);
      renderer.clear(true, true, false);
      renderer.render(pscene, pcam);
      renderer.setRenderTarget(null);
      renderer.setClearColor(oldClear, oldAlpha);
      comp.material.uniforms.uA.value = alpha;
      renderer.autoClear = false;
      const vw = renderer.domElement.clientWidth || window.innerWidth, vh = renderer.domElement.clientHeight || window.innerHeight;
      rect.x = r.left; rect.y = vh - r.bottom; rect.w = r.width; rect.h = r.height;
      renderer.setViewport(rect.x, rect.y, rect.w, rect.h);
      renderer.render(compScene, compCam);
      renderer.setViewport(0, 0, vw, vh);
      renderer.autoClear = oldAuto;
      renderer.setRenderTarget(oldTarget);
    },
  };
})();

/* ============================================================
   Boot / title / replay
   ============================================================ */
el.startBtn.addEventListener('click', () => beginFromTitle(false));
el.replay.addEventListener('click', () => location.reload());

document.addEventListener('visibilitychange', () => {
  if (document.hidden) AudioSys.resume(); // context suspends itself; resumed on return
});

// reveal title
requestAnimationFrame(()=>{ el.fade.style.opacity = 0; });
G.mode = 'title';
layoutViewmodel();
applyQuality(Q.level);

// Warm-up while the title is showing: compile every shader the episode
// needs (main level incl. the hidden viewmodel, and the opening cinematic)
// so neither ENTER nor SKIP hitches on first draw. Uses the parallel
// shader-compile extension when the browser has it.
const Warm = { done:false, t0:performance.now(), ms:0 };
const PARALLEL_COMPILE = !!(renderer.compileAsync && renderer.extensions.has('KHR_parallel_shader_compile'));
function warmScene(){
  const vis = viewRifle.visible; viewRifle.visible = true;
  const p = PARALLEL_COMPILE ? renderer.compileAsync(scene, camera).catch(()=>{}) : (renderer.compile(scene, camera), Promise.resolve());
  return p.finally(() => { viewRifle.visible = vis; });
}
const idle = f => (window.requestIdleCallback ? requestIdleCallback(f, { timeout: 700 }) : setTimeout(f, 60));
idle(() => warmScene().then(() => {
  if (!CH.cinematic) return;
  return new Promise(res => idle(() => Cinematic.prewarm().then(res)));
}).then(() => { Warm.done = true; Warm.ms = Math.round(performance.now() - Warm.t0); }));
modelsReady.then(() => { setTimeout(() => warmScene(), 0); });

/* ============================================================
   THE HUNTER. Book One's twenty foot machine, built to match the
   Dystopia Shorts design: dark scarred gunmetal, a hunched broad
   chest, a cluster of red sensors set low in a heavy head, and
   long arms ending in ribbed multi-barrel cannons with belt-fed
   under-mounts. Phases: SENSORS > CANNONS > VENT > PINNED (upload).
   ============================================================ */
const Boss = (() => {
  if (!CH.boss) return null;
  const HUNTER_SET = makePBR(L => {
    const R = L.R;
    L.a.fillStyle = '#2b2d30'; L.a.fillRect(0,0,512,512);
    L.o.fillStyle = ormc(.55,.92); L.o.fillRect(0,0,512,512);
    for (let i=0;i<40;i++){
      const x=R()*512, y=R()*512, w=30+R()*180, h=20+R()*140;
      L.a.fillStyle = R() < .5 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.17)'; L.a.fillRect(x,y,w,h);
    }
    for (let i=0;i<9;i++){
      const x=(R()*380)|0, y=(R()*380)|0, w=60+R()*130, h=50+R()*120;
      groove(L,x,y,w,h);
      for (let k=0;k<4;k++) bolt(L, x+9+(k%2)*(w-18), y+9+(k>>1)*(h-18), 3.5);
    }
    weather(L, 34, true);
    for (let i=0;i<12;i++){                       // scorch blooms around old hits
      const x=R()*512, y=R()*512, r=18+R()*40;
      const g=L.a.createRadialGradient(x,y,1,x,y,r); g.addColorStop(0,'rgba(4,3,2,.6)'); g.addColorStop(1,'rgba(0,0,0,0)');
      L.a.fillStyle=g; L.a.fillRect(x-r,y-r,r*2,r*2);
    }
    for (let i=0;i<280;i++){                      // chipped paint, bare steel
      const x=R()*512, y=R()*512, s=1+R()*3.5;
      L.a.fillStyle='rgba(150,156,162,.33)'; L.a.fillRect(x,y,s,s*.7);
      L.o.fillStyle=ormc(.3,1); L.o.fillRect(x,y,s,s*.7);
    }
  }, 913, { nstr:3.8 });
  const PATCH = { floorAO:.25, ceilAO:0, aoH:1.6 };
  const mk = (col, extra={}) => surfMat(HUNTER_SET, 1, 1, { color:new THREE.Color(col), ...extra }, PATCH);
  const armor = mk(0xc4c8cc), armorD = mk(0x8c9094), armorF = mk(0xb4b8bc, { flatShading:true });
  const dark = litMat({ color:0x151618, roughness:.5, metalness:.9 });
  const rib  = litMat({ color:0x2c2d30, roughness:.38, metalness:1 });
  const black = new THREE.MeshBasicMaterial({ color:0x040404 });
  const brass = litMat({ color:0x6a5532, roughness:.45, metalness:1 });
  const UB = new THREE.BoxGeometry(1,1,1);
  const grp = (p,x,y,z) => { const g = new THREE.Group(); g.position.set(x,y,z); p.add(g); return g; };
  const bx = (p,m,sx,sy,sz,x,y,z,rx=0,ry=0,rz=0) => { const o = new THREE.Mesh(UB,m); o.scale.set(sx,sy,sz); o.position.set(x,y,z); o.rotation.set(rx,ry,rz); p.add(o); return o; };
  const cyl = (p,m,r1,r2,len,x,y,z,rx=0,ry=0,rz=0,seg=12) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,len,seg), m); o.position.set(x,y,z); o.rotation.set(rx,ry,rz); p.add(o); return o; };
  const glowTex = softSpriteTex();
  const glowSprite = (col, op, sc) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map:glowTex, color:col, transparent:true, opacity:op, blending:THREE.AdditiveBlending, depthWrite:false })); s.scale.setScalar(sc); return s; };

  /* ---- model (faces +z) ---- */
  const root = new THREE.Group(); root.position.set(0,-30,-125); scene.add(root);
  // a low blood-orange key and a red rim so the machine reads against the sky
  const key = new THREE.DirectionalLight(0xffa878, 1.5); key.position.set(7, 15, -98); key.target.position.set(0, 3, -125);
  const rim = new THREE.DirectionalLight(0xff3a22, 1.1); rim.position.set(-6, 9, -160); rim.target.position.set(0, 3, -122);
  scene.add(key, key.target, rim, rim.target);
  const hips = grp(root, 0, 3.05, 0);
  const pelvisMark = grp(hips, 0, 0, 0);
  bx(hips, armor, 1.75,.7,1.15, 0,0,0);
  bx(hips, armorD, .62,.55,.45, 0,-.42,.38);
  bx(hips, dark, 1.9,.22,.95, 0,.38,0);
  const legs = [-1,1].map(s => {
    const hip = grp(hips, s*.95, -.12, 0);
    cyl(hip, dark, .3,.3,.5, 0,0,0, 0,0,Math.PI/2);
    bx(hip, armor, .78,1.5,.92, 0,-.75,0);
    bx(hip, armorD, .86,.95,.28, 0,-.62,.46, -.06);
    cyl(hip, rib, .08,.08,1.1, s*.36,-.8,-.36);
    const knee = grp(hip, 0,-1.45,0);
    const kc = new THREE.Mesh(new THREE.SphereGeometry(.42,12,8), armorD); kc.position.set(0,0,.12); knee.add(kc);
    bx(knee, armor, .82,1.35,.95, 0,-.7,-.04);
    bx(knee, armorD, .92,1.05,.3, 0,-.58,.46, -.07);
    cyl(knee, rib, .07,.07,1.0, -s*.34,-.7,-.4);
    const ank = grp(knee, 0,-1.35,0);
    cyl(ank, dark, .22,.22,.62, 0,0,0, 0,0,Math.PI/2);
    bx(ank, armorD, 1.25,.3,1.75, 0,-.13,.22);
    for (let k=0;k<3;k++) bx(ank, armor, .34,.26,.6, (k-1)*.42,-.14,1.22);
    bx(ank, armor, .72,.28,.45, 0,-.13,-.78);
    return { hip, knee, ank, mark:grp(knee, 0,-.6,.1) };
  });
  const torso = grp(hips, 0,.3,0);
  cyl(torso, dark, .62,.72,.9, 0,.45,0);
  for (let k=0;k<3;k++) bx(torso, armorD, 1.3-k*.1,.24,.42, 0,.18+k*.28,.56, -.15);
  const chest = grp(torso, 0,1.55,0);
  const chestMark = grp(chest, 0,-.1,-.3);
  bx(chest, armor, 3.0,1.6,1.85, 0,0,0);
  bx(chest, armorD, 2.3,1.15,.36, 0,.05,1.0, .12);
  bx(chest, armor, 3.2,.36,1.9, 0,.86,-.05);
  for (const s of [-1,1]) for (let k=0;k<5;k++) bx(chest, dark, .06,.72,.12, s*1.52,-.05,-.45+k*.22);
  bx(chest, armorD, 2.0,1.4,.95, 0,.1,-1.36);
  for (const s of [-1,1]){
    cyl(chest, dark, .17,.21,1.25, s*.62,1.0,-1.48);
    const ex = glowSprite(0xff6a2a, .35, .55); ex.position.set(s*.62,1.7,-1.48); chest.add(ex);
    // hoses from chest to shoulder housings
    for (let h=0;h<2;h++){
      const c = new THREE.CatmullRomCurve3([new THREE.Vector3(s*.9,.55-h*.25,.75), new THREE.Vector3(s*1.35,.95-h*.2,.95), new THREE.Vector3(s*1.75,.75-h*.2,.35)]);
      chest.add(new THREE.Mesh(new THREE.TubeGeometry(c, 10, .065, 6), dark));
    }
  }
  const head = grp(chest, 0,.72,.86);   // sunk low between the shoulders
  bx(head, armor, 1.05,.72,.95, 0,.05,0);
  bx(head, armorD, 1.22,.2,.44, 0,.37,.38, .25);
  bx(head, armor, .95,.3,.8, 0,-.36,.05);
  bx(head, black, .82,.44,.12, 0,-.02,.47);
  cyl(head, rib, .02,.02,.8, .42,.62,-.25, 0,0,.2, 5);
  const SPOS = [[-.24,.06,.075],[-.08,.1,.065],[.08,.09,.07],[.24,.05,.075],[-.16,-.09,.06],[0,-.07,.085],[.16,-.1,.06]];
  const sensors = SPOS.map(([x,y,r]) => { const m = new THREE.MeshBasicMaterial({ color:0xff2a2a }); const o = new THREE.Mesh(new THREE.SphereGeometry(r,10,8), m); o.position.set(x,y,.53); head.add(o); return m; });
  const sLight = new THREE.PointLight(0xff2a30, 0, 18, 2); sLight.position.set(0,0,1.1); head.add(sLight);
  const halo = glowSprite(0xff2a2a, .8, 1.7); halo.position.set(0,-.01,.66); head.add(halo);
  const shutT = bx(head, armorD, .94,.26,.12, 0,.38,.57), shutB = bx(head, armorD, .94,.26,.12, 0,-.4,.57);
  const sensorMark = grp(head, 0,0,.55);
  const RIB_GEO = new THREE.TorusGeometry(.34,.05,6,16);
  const arms = [-1,1].map(s => {
    const sh = grp(chest, s*1.78, .45, .05);
    const pd = new THREE.Mesh(new THREE.IcosahedronGeometry(1,1), armorF); pd.scale.set(.88,.64,.98); pd.position.set(s*.12,.34,0); sh.add(pd);
    bx(sh, armorD, .5,.2,1.5, s*.58,.02,0, 0,0,-s*.5);
    const up = grp(sh, s*.2, 0, 0);
    bx(up, armor, .62,1.4,.72, 0,-.75,0);
    cyl(up, rib, .07,.07,1.0, 0,-.75,-.42);
    const elb = grp(up, 0,-1.5,0);
    elb.add(new THREE.Mesh(new THREE.SphereGeometry(.38,12,8), dark));
    bx(elb, armor, .95,1.0,1.15, 0,-.5,0);
    bx(elb, armorD, 1.03,.34,1.2, 0,-.12,0);
    const gun = grp(elb, 0,0,0);
    cyl(gun, rib, .31,.31,2.0, 0,-1.95,0, 0,0,0, 14);
    for (let k=0;k<9;k++){ const t = new THREE.Mesh(RIB_GEO, dark); t.rotation.x = Math.PI/2; t.position.set(0,-1.15-k*.2,0); gun.add(t); }
    for (const [ox,oz] of [[-.13,-.13],[.13,-.13],[-.13,.13],[.13,.13]]) cyl(gun, dark, .085,.085,.55, ox,-3.1,oz, 0,0,0, 8);
    bx(gun, brass, .12,.5,.2, s*.33,-1.6,0);
    const tip = grp(gun, 0,-3.42,0);
    const mg = glowSprite(0xff3a1a, 0, 1); mg.position.y = -.25; tip.add(mg);
    const stump = cyl(elb, dark, .34,.22,.5, 0,-1.2,0, .3,0,.2, 7); stump.visible = false;
    // belt-fed under-mount and its hanging ammunition belt
    cyl(elb, dark, .13,.13,1.3, 0,-1.45,-.5);
    const btip = grp(elb, 0,-2.15,-.5);
    const belt = new THREE.CatmullRomCurve3([new THREE.Vector3(0,-.95,-.55), new THREE.Vector3(0,-1.45,-1.05), new THREE.Vector3(0,-1.0,-1.45), new THREE.Vector3(0,-.25,-1.1), new THREE.Vector3(0,.35,-.5)]);
    const N = 26, im = new THREE.InstancedMesh(new THREE.CylinderGeometry(.05,.05,.24,6), brass, N);
    const q = new THREE.Object3D();
    for (let i=0;i<N;i++){ belt.getPointAt(i/(N-1), q.position); q.rotation.set(0,0,Math.PI/2); q.updateMatrix(); im.setMatrixAt(i, q.matrix); }
    elb.add(im);
    return { s, sh, up, elb, gun, tip, btip, mg, stump, mark:grp(gun,0,-1.7,0), mark2:grp(gun,0,-2.8,0), elMark:grp(elb,0,-.4,0), hp:200, max:200, alive:true, aim:0 };
  });

  /* ---- arena pieces: geothermal grates + valves, stomp ring, steam, allies ---- */
  const ventDefs = [ { gx:-8.4, gz:-120, vx:-12.15, vz:-120 }, { gx:8.4, gz:-126, vx:12.15, vz:-126 } ];
  const steamMat = new THREE.SpriteMaterial({ map:glowTex, color:0xf0e8de, transparent:true, opacity:0, depthWrite:false });
  const vents = ventDefs.map(v => {
    const g = grp(scene, v.gx, 0, v.gz);
    bx(g, dark, 2.7,.08,2.7, 0,.03,0);
    const slitM = new THREE.MeshBasicMaterial({ color:0xff7a30, transparent:true, opacity:.25 });
    for (let k=0;k<7;k++) bx(g, slitM, 2.3,.02,.12, 0,.08,-1.05+k*.35);
    for (let k=0;k<7;k++) bx(g, rib, 2.4,.07,.08, 0,.1,-1.22+k*.35+.175);
    const glow = glowSprite(0xff7a30, .0, 3.6); glow.position.y = .4; g.add(glow);
    const valve = grp(scene, v.vx, 0, v.vz);
    bx(valve, armorD, .5,1.0,.5, 0,.5,0);
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(.3,.045,6,14), brass); wheel.position.set(v.vx < 0 ? .3 : -.3, .95, 0); wheel.rotation.y = Math.PI/2; valve.add(wheel);
    const lampM = new THREE.MeshBasicMaterial({ color:0x401010 });
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(.07,8,6), lampM); lamp.position.set(0,1.08,0); valve.add(lamp);
    cyl(scene, rib, .09,.09, Math.abs(v.vx - v.gx), (v.vx+v.gx)/2, .1, v.gz, 0,0,Math.PI/2, 6);
    colliders.push({ x1:v.vx-.3, x2:v.vx+.3, z1:v.vz-.3, z2:v.vz+.3 });
    const puffs = [];
    const puffN = Q.p.basic ? 4 : 22;
    for (let k=0;k<puffN;k++){ const p = new THREE.Sprite(steamMat.clone()); p.userData.o = Math.random(); p.userData.x = (Math.random()-.5)*2; p.userData.z = (Math.random()-.5)*2; g.add(p); puffs.push(p); }
    return { ...v, slitM, glow, wheel, lampM, puffs, cd:0, p:0, steam:0, linger:0 };
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(.85,1,48), new THREE.MeshBasicMaterial({ color:0xff3020, transparent:true, opacity:0, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending }));
  ring.rotation.x = -Math.PI/2; ring.position.y = .05; scene.add(ring);
  const KARA = makeCivvy({ preset:'KARA', jacket:0x4a5232, pants:0x23261f, ponytail:true, armed:true, hair:0x14100c, skin:0x8a6f58, scarf:0x5d6b4a });
  KARA.position.set(-7.4, 0, -134.6); scene.add(KARA);
  const THOM = makeCivvy({ preset:'THOMAS', jacket:0x4b4438, pants:0x2c2a26, hair:0x8a8580, skin:0xb09a84 });
  THOM.position.set(2.8, 0, -141.4); scene.add(THOM);
  const chair = grp(scene, CORE_POS.x - 1.6, 0, CORE_POS.z - .4);
  bx(chair, dark, .7,.5,.7, 0,.25,0); bx(chair, armorD, .62,.12,.62, 0,.55,0); bx(chair, armorD, .62,.95,.12, 0,1.05,-.28, -.12);
  const crown = new THREE.Mesh(new THREE.TorusGeometry(.16,.035,6,12), brass); crown.position.set(0,1.62,-.26); chair.add(crown);
  colliders.push({ x1:chair.position.x-.4, x2:chair.position.x+.4, z1:chair.position.z-.4, z2:chair.position.z+.4 });
  const rubble = [];

  /* ---- state ---- */
  const H = { active:false, phase:'off', ph:0, amp:0, yaw:0, sensHP:240, sensMax:240, blastT:3, burstT:4.5, burstN:0, burstGap:0, bursts:0, shots:0,
    charging:false, charge:0, chargeArm:null, stompT:0, stompCd:3, pinT:0, kneel:0, kneelT:0, riseT:0, addT:5, addN:0,
    dimT:-1, flash:0, shut:0, shutT:0, upload:0, marks:0, lastSin:0, recoil:0, kfire:1.4, midPending:false, objKey:'' };
  const _w = new THREE.Vector3(), _c = new THREE.Vector3();
  const pos = () => root.position;
  const dist2 = (ax,az,bx_,bz) => Math.hypot(ax-bx_, az-bz);
  function faceTo(tx, tz, rate, dt){
    const tgt = Math.atan2(tx - pos().x, tz - pos().z);
    let d = tgt - H.yaw; while (d > Math.PI) d -= Math.PI*2; while (d < -Math.PI) d += Math.PI*2;
    H.yaw += Math.max(-rate*dt, Math.min(rate*dt, d));
    return Math.abs(d);
  }
  const bossEl = { wrap:$('bossWrap'), fill:$('bossFill'), sub:$('bossSub') };
  function hud(){
    if (!bossEl.wrap) return;
    const show = H.active && !['off','dim','done'].includes(H.phase) && (G.mode === 'play' || G.mode === 'dead');
    bossEl.wrap.style.display = show ? 'block' : 'none';
    document.body.classList.toggle('bossOn', show);
    if (!show) return;
    let f = 1, t = '';
    if (H.phase === 'enter' || H.phase === 'sensors'){ f = H.sensHP / H.sensMax; t = 'SENSOR CLUSTER'; }
    else if (H.phase === 'cannons'){ f = arms.reduce((a,b)=>a+Math.max(0,b.hp),0) / arms.reduce((a,b)=>a+b.max,0); t = 'ARM CANNONS ' + arms.filter(a=>a.alive).length + ' / 2'; }
    else if (H.phase === 'vent'){ f = 1; t = 'ARMOR SEALED. VENT IT ONTO A GRATE'; }
    else if (H.phase === 'pinned'){ f = H.pinT / pinMax(); t = 'PINNED. UPLOAD ' + Math.round(H.upload*100) + '%'; }
    else if (H.phase === 'rise'){ f = 0; t = 'IT IS GETTING UP'; }
    bossEl.fill.style.width = (Math.max(0,Math.min(1,f))*100).toFixed(1) + '%';
    bossEl.fill.classList.toggle('pin', H.phase === 'pinned');
    bossEl.sub.textContent = t;
  }
  function objective(){
    const t = { enter:'SURVIVE', sensors:'SHOOT THE RED SENSOR CLUSTER', cannons:'DESTROY BOTH ARM CANNONS',
      vent:'LURE IT ONTO A GLOWING GRATE, THEN OPEN THE TAP', pinned:'GET TO THE CHAIR. RUN THE UPLOAD', rise:'BACK TO A VALVE' }[H.phase];
    if (t && H.objKey !== t){ H.objKey = t; el.objective.textContent = t; }
  }
  function say(who, text){ G.radioQueue.push({ who, text }); }

  /* ---- pose ---- */
  function pose(dt){
    const walk = H.amp, k = H.kneel, sw = Math.sin(H.ph);
    const ext = [0,0];
    legs.forEach((L,i) => {
      const ph = H.ph + (i ? Math.PI : 0);
      let th = -Math.sin(ph)*.38*walk, kn = Math.max(0, Math.sin(ph + 1.3))*.65*walk + .08;
      if (H.stompT > 0 && i === 0){ const u = Math.min(1, (1 - H.stompT/.9)*1.6); th = -.62*Math.sin(u*Math.PI/2); kn = .2 + .8*u; }
      th += ((i === 0 ? -1.25 : .25) - th) * k;
      kn += ((i === 0 ? 1.25 : 1.3) - kn) * k;
      L.hip.rotation.x = th; L.knee.rotation.x = kn; L.ank.rotation.x = -(th + kn)*(1 - k*.5);
      ext[i] = 1.45*Math.cos(th) + 1.35*Math.cos(th + kn) + .28;
    });
    if (H.stompT > 0) ext[0] = 0;
    hips.position.y = Math.max(ext[0], ext[1]);
    hips.rotation.z = sw*.03*walk;
    H.recoil = Math.max(0, H.recoil - dt*.8);
    torso.rotation.x = .1 + k*.38 - H.recoil + Math.sin(G.time*.8)*.015;
    torso.rotation.y = Math.sin(H.ph)*.05*walk;
    arms.forEach((a,i) => {
      const want = (H.charging && H.chargeArm === a) || (H.burstN > 0 && H.burstArm === a) ? 1 : 0;
      a.aim += (want - a.aim) * Math.min(1, dt*5);
      a.up.rotation.x = -Math.sin(H.ph + (i ? 0 : Math.PI))*.16*walk - .08 - a.aim*.55 - k*.25;
      a.up.rotation.z = a.s*(.06 + k*.06);
      a.elb.rotation.x = -.32 - a.aim*.85 - k*.2;
    });
    // head tracks the player a little, sensors flare when charging
    const P = yawObj.position;
    head.getWorldPosition(_w);
    const pitch = Math.atan2(_w.y - P.y, Math.max(2, dist2(_w.x,_w.z,P.x,P.z)));
    head.rotation.x += (Math.max(-.1, Math.min(.55, pitch - torso.rotation.x)) * (H.dimT < 0 ? 1 : .2) - head.rotation.x) * Math.min(1, dt*3);
    H.shut += (H.shutT - H.shut) * Math.min(1, dt*6);
    shutT.position.y = .38 - H.shut*.27; shutB.position.y = -.4 + H.shut*.27;
    root.rotation.y = H.yaw;
  }
  function sensorColors(){
    const ch = H.charging ? H.charge : 0;
    sensors.forEach((m,i) => {
      if (H.dimT >= 0){
        const f = Math.max(0, Math.min(1, (H.dimT - i*.34) / .3));
        m.color.setRGB(1 - f*.9, .16*(1-f) + .02, .16*(1-f) + .02);
      } else m.color.setRGB(1, .16 + ch*.7 + H.flash*.5, .16 + ch*.6 + H.flash*.4);
    });
    const live = H.dimT >= 0 ? Math.max(0, 1 - H.dimT/2.6) : 1;
    sLight.intensity = (H.active ? 9 + H.charge*10 : 0) * live * (1 - H.shut*.6);
    halo.material.opacity = (.75 + H.charge*.4 + H.flash*.3) * live * (1 - H.shut*.85);
  }

  /* ---- combat ---- */
  function blast(){
    const a = H.chargeArm; if (!a || !a.alive) return;
    a.tip.getWorldPosition(_w);
    const tgt = yawObj.position.clone(); tgt.y = PLAYER_EYE - .25;
    fireProjectile(_w.clone(), tgt, 17, 24, { r:2.5, col:0xff6a3a, hitR:.95, grace:.35, glow:true, silent:true });
    AudioSys.hunterBlast(); H.recoil = .14; a.mg.material.opacity = 1; a.mg.scale.setScalar(3.2);
    G.shakeT = .2; G.shakeAmp = .06;
  }
  function burstShot(){
    const a = H.burstArm; a.btip.getWorldPosition(_w);
    const tgt = yawObj.position.clone(); tgt.x += (Math.random()-.5)*1.4; tgt.z += (Math.random()-.5)*1.4; tgt.y = PLAYER_EYE - .3 + (Math.random()-.5)*.5;
    fireProjectile(_w.clone(), tgt, 30, 5, { r:.75, col:0xffb347, hitR:.5, grace:.3, silent:true });
    AudioSys.burst();
  }
  // Yard walls are half a metre thick. A 2.4 shove clears one in a single step,
  // the circle test misses, and the player is left outside with no way back.
  // Step the shove so the wall catches it, then clamp to the yard interior.
  const YARD = ROOMS[ROOMS.length - 1];
  const ARENA = {
    minX: YARD.x1 + PLAYER_R,
    maxX: YARD.x2 - PLAYER_R,
    minZ: YARD.z1 + PLAYER_R,
    maxZ: YARD.z2 - .3 - PLAYER_R, // north bulkhead sits .3 into the yard
  };
  function arenaLocked(){
    return H.active && H.phase !== 'off' && H.phase !== 'dim' && H.phase !== 'done';
  }
  function keepInArena(P){
    if (!arenaLocked()) return;
    if (P.x >= ARENA.minX && P.x <= ARENA.maxX && P.z >= ARENA.minZ && P.z <= ARENA.maxZ) return;
    P.x = Math.max(ARENA.minX, Math.min(ARENA.maxX, P.x));
    P.z = Math.max(ARENA.minZ, Math.min(ARENA.maxZ, P.z));
    // A clamp onto a prop (the valves sit against the side walls) would overlap it.
    // Step toward the yard center until the circle is clear, and stay inside.
    const cx = (ARENA.minX + ARENA.maxX) * .5, cz = (ARENA.minZ + ARENA.maxZ) * .5;
    for (let n = 0; n < 8; n++){
      let hit = false;
      for (const c of colliders){
        if (c.door && !c.active) continue;
        const qx = Math.max(c.x1, Math.min(P.x, c.x2));
        const qz = Math.max(c.z1, Math.min(P.z, c.z2));
        const dx = P.x - qx, dz = P.z - qz;
        if (dx*dx + dz*dz < PLAYER_R*PLAYER_R){ hit = true; break; }
      }
      if (!hit) return;
      const dx = cx - P.x, dz = cz - P.z, d = Math.hypot(dx, dz) || 1;
      P.x += dx / d * .4;
      P.z += dz / d * .4;
      P.x = Math.max(ARENA.minX, Math.min(ARENA.maxX, P.x));
      P.z = Math.max(ARENA.minZ, Math.min(ARENA.maxZ, P.z));
    }
  }
  function shovePlayer(dx, dz){
    const P = yawObj.position;
    const dist = Math.hypot(dx, dz);
    const steps = Math.max(1, Math.ceil(dist / .2));
    const sx = dx / steps, sz = dz / steps;
    for (let i = 0; i < steps; i++){
      P.x += sx; P.z += sz;
      collide(P, PLAYER_R);
    }
    keepInArena(P);
  }
  function stompNow(){
    const f = new THREE.Vector3(Math.sin(H.yaw), 0, Math.cos(H.yaw));
    const cx = pos().x + f.x*1.1, cz = pos().z + f.z*1.1;
    AudioSys.hunterStomp(); G.shakeT = .45; G.shakeAmp = .13;
    for (let i=0;i<10;i++) spawnSparks(new THREE.Vector3(cx + Math.cos(i*.63)*2.4, .2, cz + Math.sin(i*.63)*2.4), 5, 0xc9a080);
    const P = yawObj.position, d = dist2(P.x,P.z,cx,cz);
    if (d < 6.5){
      damagePlayer(d < 3.5 ? 30 : 18);
      const nx = (P.x - cx) / Math.max(.1,d), nz = (P.z - cz) / Math.max(.1,d);
      shovePlayer(nx*2.4, nz*2.4);
    }
    H.ringFade = .3;
  }
  function destroyArm(a){
    a.alive = false; a.gun.visible = false; a.stump.visible = true;
    a.elMark.getWorldPosition(_w);
    spawnSparks(_w, 30, 0xffaa55); spawnSparks(_w, 20, 0xff4a2a);
    AudioSys.droneDie(); AudioSys.hunterBlast(); G.shakeT = .3; G.shakeAmp = .07;
    sToast(a.s < 0 ? 'LEFT CANNON DOWN.' : 'RIGHT CANNON DOWN.');
    if (H.charging && H.chargeArm === a){ H.charging = false; H.charge = 0; H.blastT = 1.6; }
    if (!arms.some(x => x.alive)) toVent();
  }
  function toCannons(){
    H.phase = 'cannons'; H.shutT = 1; H.flash = 1;
    head.getWorldPosition(_w); spawnSparks(_w, 36, 0xff3a2a);
    AudioSys.hunterRoar(); G.shakeT = .4; G.shakeAmp = .06;
    sToast('SENSOR CLUSTER CRACKED. THE SHUTTERS SLAM DOWN.', true);
    H.charging = false; H.charge = 0; H.blastT = 2.6; H.addT = 3;
    H.midPending = true;
  }
  function toVent(){
    H.phase = 'vent'; H.shutT = 1; H.burstT = 2.5; H.stompCd = 2;
    vents.forEach(v => { v.cd = 0; v.p = 0; });
    AudioSys.hunterRoar();
    say('THOMAS', "Both cannons gone and its armor's sealed. The yard sits on a geothermal tap.");
    say('THOMAS', "Draw it onto a glowing grate, then open the valve. Steam will lock its joints!");
  }
  function pinMax(){ return (window.Waking && Waking.storyMode()) ? 10 : 16; }
  function pin(v){
    H.phase = 'pinned'; H.pinT = pinMax(); H.kneelT = 1; H.shutT = 0; H.charging = false; H.burstN = 0; H.stompT = 0;
    v.linger = pinMax();
    AudioSys.hunterRoar(); G.shakeT = .5; G.shakeAmp = .1;
    sToast('PINNED IN THE STEAM. GET TO THE CHAIR.');
    say('THOMAS', "It's down! Marcus, the chair. Now!");
    say('KARA', "Shoot the sensors if it starts to move. It buys you seconds.");
  }
  function triggerVent(v){
    v.cd = 7; v.p = 0; v.steam = 3.2;
    AudioSys.steam(); G.shakeT = .25; G.shakeAmp = .04;
    if (dist2(pos().x, pos().z, v.gx, v.gz) < 3.4) pin(v);
    else sToast('THE STEAM MISSED. DRAW IT ONTO THE GRATE FIRST.', true);
  }
  function freezeAdds(darken){
    for (const d of drones){
      if (!d.alive) continue;
      d.alive = false; d.deathT = 0;
      if (darken && d.eyeMat) d.eyeMat.color.setHex(0x120303);
    }
    projectiles.forEach(p => scene.remove(p.mesh)); projectiles.length = 0;
  }

  /* ---- update ---- */
  function update(dt, animOnly){
    if (!H.active){ return; }
    const P = yawObj.position;
    const dx = P.x - pos().x, dz = P.z - pos().z, dist = Math.hypot(dx, dz);
    H.flash = Math.max(0, H.flash - dt*4);
    let v = 0;
    if (!animOnly){
      if (H.phase === 'enter'){
        faceTo(-6, -114, 1.2, dt); v = 2.1;
        if (pos().x > -8.5){ H.phase = 'sensors'; H.blastT = 1.8; H.burstT = 4;
          say('THOMAS', "Hunter! The red cluster in its head. That's the only soft thing on it!"); }
      } else if (H.phase === 'sensors' || H.phase === 'cannons' || H.phase === 'vent'){
        faceTo(P.x, P.z, H.phase === 'vent' ? 1.3 : .95, dt);
        if (H.phase === 'vent') v = dist > 3.4 ? 2.5 : 0;
        else v = dist > 13 ? 1.5 : 0;
        // stomp
        H.stompCd -= dt;
        if (H.stompT > 0){ v = 0; H.stompT -= dt; if (H.stompT <= 0){ H.stompT = 0; stompNow(); } }
        else if (H.stompCd <= 0 && dist < (H.phase === 'vent' ? 5 : 6.2)){ H.stompT = .9; H.stompCd = H.phase === 'vent' ? 2.6 : 4.6; AudioSys.hunterServo(); }
        // arm cannon blasts with a one second telegraph
        const live = arms.filter(a => a.alive);
        if (H.phase !== 'vent' && live.length){
          H.blastT -= dt;
          if (!H.charging && H.blastT < 1.0){ H.charging = true; H.chargeArm = live[(H.shots++) % live.length]; AudioSys.sentryCharge(); AudioSys.hunterServo(); }
          if (H.charging) H.charge = Math.min(1, 1 - Math.max(0, H.blastT));
          if (H.blastT <= 0){ blast(); H.charging = false; H.charge = 0; H.blastT = (H.phase === 'cannons' ? 2.4 : 2.9) + Math.random()*.8; }
        }
        // belt-fed bursts
        if (H.burstN === 0){
          H.burstT -= dt;
          if (H.burstT <= 0 && dist < 26){ H.burstN = 6; H.burstGap = .15; H.burstArm = arms[(H.bursts++) % 2]; }
        } else {
          H.burstGap -= dt;
          if (H.burstGap <= 0){ H.burstGap = .1; H.burstN--; burstShot(); if (H.burstN === 0) H.burstT = H.phase === 'vent' ? 3.6 : 5.2; }
        }
      } else if (H.phase === 'pinned'){
        H.pinT -= dt;
        if (H.pinT <= 0){ H.phase = 'rise'; H.riseT = 1.8; H.kneelT = 0; H.shutT = 1; AudioSys.hunterServo(); AudioSys.hunterRoar();
          sToast('IT IS GETTING UP.', true); say('THOMAS', "It's up! Get to a valve and vent it again!");
          vents.forEach(x => { x.linger = 0; x.cd = Math.min(x.cd, 1.5); }); }
      } else if (H.phase === 'rise'){
        H.riseT -= dt; if (H.riseT <= 0){ H.phase = 'vent'; H.stompCd = 1.5; H.burstT = 2; }
      }
      // reinforcements once the sensors are gone
      if (['cannons','vent','pinned','rise'].includes(H.phase)){
        H.addT -= dt;
        const n = drones.filter(d => d.alive && d.segment === 8).length;
        if (H.addT <= 0 && n < (H.phase === 'pinned' ? 4 : 3)){
          const sd = (H.addN++ % 2) ? -1 : 1;
          spawnExtra('crawler', sd*11, -106.5 - Math.random()*3, 8);
          H.addT = H.phase === 'pinned' ? 4.5 : 6.5;
        }
      }
      // keep inside the yard, and keep the player out from under it
      pos().x += Math.sin(H.yaw) * v * dt; pos().z += Math.cos(H.yaw) * v * dt;
      if (H.phase !== 'enter'){ pos().x = Math.max(-10.5, Math.min(10.5, pos().x)); pos().z = Math.max(-139, Math.min(-108, pos().z)); }
      const pd = Math.hypot(P.x - pos().x, P.z - pos().z);
      if (pd < 1.8 && G.mode === 'play'){ const s = (1.8 - pd) / Math.max(.05, pd); shovePlayer((P.x - pos().x)*s, (P.z - pos().z)*s); }
      // Kara covers from her barricade
      KARA.rotation.y = Math.atan2(pos().x - KARA.position.x, pos().z - KARA.position.z);
      H.kfire -= dt;
      if (H.kfire <= 0 && ['sensors','cannons','vent','pinned','rise'].includes(H.phase)){
        H.kfire = 1.4;
        let best = null, bd = 20;
        for (const d of drones){
          if (!d.alive || d.segment !== 8) continue;
          const dd = dist2(d.mesh.position.x, d.mesh.position.z, KARA.position.x, KARA.position.z);
          if (dd < bd){ bd = dd; best = d; }
        }
        let to = null;
        if (best){ damageDrone(best, 9); to = best.mesh.position.clone().setY(1.3); }
        else if (H.phase === 'sensors'){ sensorMark.getWorldPosition(_w); to = _w.clone(); H.sensHP -= 4; H.flash = .6; if (H.sensHP <= 0) toCannons(); }
        else if (H.phase === 'cannons'){ const a = arms.find(x => x.alive); if (a){ a.mark.getWorldPosition(_w); to = _w.clone(); a.hp -= 5; if (a.hp <= 0) destroyArm(a); } }
        if (to){
          AudioSys.shot();
          const from = new THREE.Vector3(KARA.position.x, 1.3, KARA.position.z);
          const tr = new THREE.Mesh(new THREE.BoxGeometry(.03,.03, from.distanceTo(to)), new THREE.MeshBasicMaterial({ color:0xf4ecdf }));
          tr.position.copy(from).lerp(to, .5); tr.lookAt(to); scene.add(tr); TRACERS.push({ mesh:tr, t:.12 });
          if (best) KARA.userData.armR.rotation.x = -.85;
        }
      }
      if (H.midPending && G.mode === 'play' && CB.bossMid){ H.midPending = false; setTimeout(() => { if (G.mode === 'play') Story.start(CB.bossMid); }, 700); }
      objective();
    }
    // walk cycle and footfalls
    H.amp += ((v > .05 ? 1 : 0) - H.amp) * Math.min(1, dt*4);
    H.ph += dt * (v > .05 ? v*2.7 : 0);
    const sn = Math.sin(H.ph);
    if (H.amp > .3 && Math.sign(sn) !== H.lastSin){
      H.lastSin = Math.sign(sn);
      AudioSys.hunterStep(dist);
      if (dist < 16){ G.shakeT = Math.max(G.shakeT, .16); G.shakeAmp = Math.max(G.shakeAmp || 0, .05*(1 - dist/16)); }
    }
    H.kneel += (H.kneelT - H.kneel) * Math.min(1, dt*(H.kneelT ? 3.5 : 1.6));
    if (H.dimT >= 0) H.dimT += dt;
    pose(dt); sensorColors();
    arms.forEach(a => {
      if (!(H.charging && H.chargeArm === a)){ a.mg.material.opacity = Math.max(0, a.mg.material.opacity - dt*5); }
      else { a.mg.material.opacity = .25 + H.charge*.75; a.mg.scale.setScalar(.6 + H.charge*1.6); }
      if (!a.alive && H.dimT < 0 && Math.random() < dt*4){ a.stump.getWorldPosition(_w); spawnSparks(_w, 4, 0xffaa55); }
    });
    // stomp telegraph ring
    if (H.stompT > 0){
      const f = new THREE.Vector3(Math.sin(H.yaw),0,Math.cos(H.yaw));
      ring.position.set(pos().x + f.x*1.1, .05, pos().z + f.z*1.1);
      const u = 1 - H.stompT/.9; ring.scale.setScalar(.6 + u*5.9); ring.material.opacity = .25 + u*.55;
    } else if (H.ringFade > 0){ H.ringFade -= dt; ring.material.opacity = Math.max(0, H.ringFade*2); ring.scale.setScalar(6.5 + (.3 - H.ringFade)*6); }
    else ring.material.opacity = 0;
    // geothermal vents
    vents.forEach(vn => {
      vn.cd = Math.max(0, vn.cd - dt);
      const ready = H.phase === 'vent' && vn.cd <= 0;
      const pulse = .5 + .5*Math.sin(G.time*4);
      vn.slitM.opacity = ready ? .55 + pulse*.4 : .18;
      vn.glow.material.opacity = ready ? .35 + pulse*.3 : (vn.linger > 0 ? .3 : .05);
      vn.lampM.color.setHex(ready ? 0x5aff7a : (H.phase === 'vent' ? 0xffb347 : 0x401010));
      vn.steam = Math.max(0, vn.steam - dt); vn.linger = Math.max(0, vn.linger - dt);
      const amt = vn.steam > 0 ? Math.min(1, vn.steam) : (vn.linger > 0 ? .8 : 0);
      vn.puffs.forEach(p => {
        const o = (p.userData.o + G.time*(.35 + amt*.4)) % 1;
        p.position.set(p.userData.x*(.4 + o*.8), .3 + o*(amt > .6 ? 7.5 : 4.5), p.userData.z*(.4 + o*.8));
        p.scale.setScalar(1.4 + o*4.2);
        p.material.opacity = amt * Math.sin(Math.min(1, o*1.4) * Math.PI) * .7;
      });
      if (vn.p > 0 && !vn.holding) vn.p = Math.max(0, vn.p - dt);
      vn.holding = false;
      vn.wheel.rotation.x += vn.p > 0 ? dt*6 : 0;
    });
    if (!KARA.userData.armedPose){ KARA.userData.armedPose = true; }
    KARA.userData.tick(dt, false); THOM.userData.tick(dt, false);
    THOM.rotation.y = Math.atan2(P.x - THOM.position.x, P.z - THOM.position.z);
    keepInArena(P);
    hud();
  }

  /* ---- chair + valves (replaces the default hold-to-plant) ---- */
  function interact(dt){
    const P = yawObj.position, holding = keys['KeyE'] || touchPlanting || G.padUse;
    let target = null;
    if (H.phase === 'vent') for (const vn of vents) if (vn.cd <= 0 && dist2(P.x,P.z,vn.vx,vn.vz) < 2.1) target = vn;
    if (H.phase === 'pinned' && dist2(P.x,P.z,CORE_POS.x,CORE_POS.z) < 3.2) target = 'chair';
    const lbl = document.getElementById('plantLabel');
    if (!target){
      G.planting = false;
      el.prompt.style.display = 'none'; el.plantBtn.style.display = 'none';
      const showUp = H.phase === 'pinned' && H.upload > 0;
      el.plantWrap.style.display = showUp ? 'block' : 'none';
      if (showUp){ lbl.textContent = 'UPLOADING'; el.plantFill.style.width = (H.upload*100).toFixed(1) + '%'; }
      return;
    }
    const chairT = target === 'chair';
    if (IS_TOUCH){ el.plantBtn.style.display = 'block'; el.plantBtn.textContent = chairT ? 'UPLOAD' : 'VENT'; }
    el.prompt.textContent = chairT ? (IS_TOUCH ? CH.obj.promptTouch : CH.obj.promptKey) : (IS_TOUCH ? 'HOLD VENT' : 'HOLD [E] TO OPEN THE TAP');
    el.prompt.style.display = holding ? 'none' : 'block';
    el.plantWrap.style.display = holding || (chairT && H.upload > 0) ? 'block' : 'none';
    if (chairT){
      lbl.textContent = 'UPLOADING';
      if (holding){
        G.planting = true;
        const prev = H.upload;
        H.upload = Math.min(1, H.upload + dt/8.5);
        if (Math.floor(prev*10) !== Math.floor(H.upload*10)) AudioSys.plantTick();
        const lines = [[.2,"It's taking the package. Keep the chair live!"],[.6,"Past their outer layer. Hold it!"],[.95,"Almost there. Almost!"]];
        lines.forEach(([m,t],i) => { if (H.upload >= m && H.marks <= i){ H.marks = i+1; say('THOMAS', t); } });
        if (H.upload >= 1){ H.phase = 'done'; G.plantProgress = 1; freezeAdds(false); plantComplete(); }
      } else G.planting = false;
      el.plantFill.style.width = (H.upload*100).toFixed(1) + '%';
    } else {
      lbl.textContent = 'VENTING';
      if (holding){ target.holding = true; target.p = Math.min(1, target.p + dt/1.4); if (target.p >= 1) triggerVent(target); }
      el.plantFill.style.width = (target.p*100).toFixed(1) + '%';
    }
  }

  /* ---- player shots ---- */
  function sph(origin, dir, obj, r, maxT){
    obj.getWorldPosition(_c); _c.sub(origin);
    const t = _c.dot(dir); if (t < 0 || t > maxT) return null;
    return (_c.lengthSq() - t*t) < r*r ? t : null;
  }
  function ray(origin, dir, maxT){
    if (!H.active || ['off','dim','done'].includes(H.phase)) return null;
    let best = null;
    const test = (part, obj, r, arm) => { const t = sph(origin, dir, obj, r, best ? best.t : maxT); if (t !== null) best = { t, part, arm }; };
    test('armor', chestMark, 1.3); test('armor', pelvisMark, 1.0);
    legs.forEach(L => test('armor', L.mark, .65));
    arms.forEach(a => { test('armor', a.elMark, .62); if (a.alive){ test('cannon', a.mark, .5, a); test('cannon', a.mark2, .45, a); } });
    test('sensor', sensorMark, .62);
    return best;
  }
  function hit(h, dmg, at){
    const soft = (h.part === 'sensor' && (H.phase === 'sensors' || H.phase === 'enter' || H.phase === 'pinned')) || (h.part === 'cannon' && H.phase === 'cannons');
    if (!soft){
      AudioSys.ping(); spawnSparks(at, 8, 0xfff0d0);
      if (G.time - (H.hintT || -99) > 9){
        H.hintT = G.time;
        if (H.phase === 'sensors') say('THOMAS', "That armor just eats rounds. The red cluster, Marcus!");
        else if (H.phase === 'cannons') say('THOMAS', "The sensors are shuttered. Hit the cannons on its arms!");
        else if (H.phase === 'vent') say('THOMAS', "Bullets won't do it now. Use the steam!");
      }
      return;
    }
    AudioSys.hitConfirm(); spawnSparks(at, 14, 0xff5a3a);
    if (h.part === 'sensor'){
      H.flash = 1;
      if (H.phase === 'pinned'){ H.pinT = Math.min(pinMax(), H.pinT + .35); return; }
      H.sensHP -= dmg;
      if (H.sensHP <= 0) toCannons();
    } else {
      h.arm.hp -= dmg;
      if (h.arm.hp <= 0 && h.arm.alive) destroyArm(h.arm);
    }
  }

  /* ---- flow ---- */
  function start(){
    if (H.active) return;
    H.active = true; H.phase = 'enter';
    root.position.set(-15, 0, -110.5); H.yaw = Math.PI/2;
    if (BREACH){
      BREACH.mesh.visible = false;
      for (let i=0;i<9;i++){
        const r = new THREE.Mesh(new THREE.DodecahedronGeometry(.3 + Math.random()*.5, 0), BREACH.mesh.material);
        r.position.set(BREACH.x + (Math.random()-.3)*2.2, .2 + Math.random()*.3, BREACH.z + (Math.random()-.5)*6.5);
        r.rotation.set(Math.random()*3, Math.random()*3, 0); scene.add(r); rubble.push(r);
      }
      for (let i=0;i<6;i++) spawnSparks(new THREE.Vector3(BREACH.x, .5 + i*.45, BREACH.z + (i-3)), 12, 0xffaa66);
    }
    if (window.Waking && Waking.storyMode() && !H._scaled){
      H._scaled = true;
      H.sensMax = Math.round(H.sensMax * 0.58);
      H.sensHP = H.sensMax;
      arms.forEach(a => { a.max = Math.round(a.max * 0.58); a.hp = a.max; });
    }
    AudioSys.hunterBlast(); AudioSys.hunterRoar(); G.shakeT = .7; G.shakeAmp = .15;
    sToast('THE YARD WALL BLEW IN.', true);
    G.radioQueue.length = 0;
    const P = yawObj.position;
    G.yaw = Math.atan2(-(-11 - P.x), -(-110.5 - P.z)); G.pitch = .12;
    pose(0);
  }
  function onRespawn(){
    if (!H.active || G.ambush) return;
    for (let i = drones.length-1; i >= 0; i--) if (drones[i].segment === 8){ scene.remove(drones[i].mesh); drones.splice(i,1); }
    if (H.phase === 'enter') H.phase = 'sensors';
    if (H.phase === 'sensors') H.sensHP = H.sensMax;
    if (H.phase === 'cannons') arms.forEach(a => { if (a.alive) a.hp = a.max; });
    if (H.phase === 'pinned' || H.phase === 'rise'){ H.phase = 'vent'; H.kneelT = 0; H.kneel = 0; H.shutT = 1; }
    root.position.set(0, 0, -127); H.yaw = 0;
    Object.assign(H, { stompT:0, stompCd:3, charging:false, charge:0, blastT:3, burstN:0, burstT:4.5, addT:5, ringFade:0 });
    vents.forEach(v => { v.cd = 0; v.p = 0; v.steam = 0; v.linger = 0; });
    H.objKey = ''; objective();
  }
  function dim(){
    if (H.dimT >= 0) return;
    H.dimT = 0; H.phase = 'dim'; H.charging = false; H.charge = 0; H.burstN = 0; H.stompT = 0; H.shutT = 0;
    freezeAdds(true);
    head.getWorldPosition(_w);
    const P = yawObj.position;
    G.yaw = Math.atan2(-(_w.x - P.x), -(_w.z - P.z));
    G.pitch = Math.max(-.2, Math.min(.6, Math.atan2(_w.y - P.y, Math.hypot(_w.x - P.x, _w.z - P.z))));
    yawObj.rotation.y = G.yaw; pitchObj.rotation.x = G.pitch;
    AudioSys.hunterServo();
    hud();
  }
  function epilogueLight(stage){
    el.fade.style.transition = 'opacity 2.6s, background 2.6s';
    el.fade.style.background = stage === 1 ? '#efe4cc' : 'radial-gradient(circle at 50% 38%, #fff7de 0%, #e8cf95 45%, #8a6534 100%)';
    el.fade.style.opacity = stage === 1 ? .86 : .97;
    hudVisible(false);
  }
  const RESUME = [
    { say:[null, 'The laboratory yard. Six days of building. Kara behind her barricade. Thomas at the chair.'] },
    { say:[null, 'Then the yard wall shook, and something twenty feet tall stepped through it.'] },
    { fx(){ start(); } },
  ];
  function resumeRequested(){
    try { if (sessionStorage.getItem('steel_resume') === '1'){ sessionStorage.removeItem('steel_resume'); return true; } } catch(e){}
    return false;
  }
  function resume(){
    for (const d of drones) if (d.alive && d.segment >= 1 && d.segment <= 3){ d.alive = false; d.deathT = 0; scene.remove(d.mesh); }
    doors.forEach(dr => { dr.open = true; dr.anim = 1; dr.mesh.position.y = WALL_H/2 - (WALL_H - .05); dr.collider.active = false; dr.lock.material.color.setHex(0xe7c98a); });
    yawObj.position.set(0, PLAYER_EYE, -106.5); G.yaw = 0; G.pitch = 0;
    G.currentSegment = 4; G.checkpoint.pos.set(0, 0, -106.5); G.checkpoint.yaw = 0; G.checkpoint.segment = 4;
    G.radioFired.add('core_enter'); setObjectiveText();
    setTimeout(() => { if (G.mode === 'play') Story.start(RESUME); }, 500);
  }
  function aimPoint(){
    if (!H.active || ['off','dim','done'].includes(H.phase)) return null;
    const mark = H.phase === 'cannons'
      ? ((arms.find(a => a.alive) || {}).mark)
      : sensorMark;
    if (!mark || !mark.getWorldPosition) return null;
    const p = new THREE.Vector3();
    mark.getWorldPosition(p);
    return p;
  }
  return { start, update, interact, ray, hit, onRespawn, dim, epilogueLight, resumeRequested, resume, aimPoint,
    weakenCannons(f){ arms.forEach(a => { a.hp *= (1 - f); }); },
    fighting(){ return H.active && !['off','dim','done'].includes(H.phase); },
    H, root, arms, vents, KARA, THOM, sensorMark,
    _force(phase){ // test hook: jump straight to a phase
      if (!H.active) start();
      if (phase === 'cannons'){ H.sensHP = 0; toCannons(); H.midPending = false; }
      if (phase === 'vent'){ H.sensHP = 0; H.phase = 'cannons'; H.midPending = false; arms.forEach(a => a.alive && destroyArm(a)); }
      if (phase === 'pinned'){ if (H.phase !== 'vent') this._force('vent'); pin(vents[0]); }
    } };
})();

// debug hook (console-only; not used by game logic)
window.__LATM = { Q, FX, applyQuality, Warm, Cinematic, loadCover, scene, camera, renderer, ROOMS, plantComplete, showEndCard, G, drones, yawObj, finishIntro, pickupRifle, damageDrone, MusicSys, postFX, Story, SFLAGS, SCHOICES, FINALE_BEATS, SHELTER_BEATS, VOICE_BEATS, finishEnding, CB, BEATSETS, getComp: () => COMP, Cast, Boss, getTubes: () => TUBES, sToast, ENDING_TEXT, playClip, ARCHIVE, BEATS, Waking, clipLog: [], hatchFaced: () => hatchFaced, TRAIN_BEATS, STORY_AIM, aimAssistScale, storyAim, beginExitAmbush, updateExitAmbush };

if (window.Waking) Waking.mount({
  getMode: () => G.mode,
  setMode(m){
    G.mode = m;
    if ((m === 'paused' || m === 'story' || m === 'beatclip') && document.pointerLockElement) document.exitPointerLock();
    if (m === 'play' || m === 'story') hudVisible(true);
  },
  chapterId: () => CH.id,
  chapters: CHAPTERS,
  applyQuality,
  setVolume(v){ AudioSys.setVolume(v); MusicSys.setVolume(v); },
  playClip,
  playMontage,
  playFull: playFullEpisode,
  archive: ARCHIVE,
  beats: BEATS,
  clipLabel: b => clipLabel(b, CHAPTERS),
  getPos: () => capturePos(),
  armResume,
  startFromTitle: resume => beginFromTitle(!!resume),
  Q,
  isTouch: IS_TOUCH,
});

/* ============================================================
   Main loop
   ============================================================ */
let lastT = performance.now();
scene.traverse(o => {
  if (!o.isMesh || !o.material || o.material.transparent) return;
  o.castShadow = true;
  o.receiveShadow = true;
});
function loop(){
  requestAnimationFrame(loop);
  if (glLost) return;
  const nowT = performance.now();
  let dt = (nowT - lastT) / 1000;
  lastT = nowT;
  dt = Math.min(dt, 0.05); // clamp tab-switch spikes. Player move and typing use the clock instead.
  if (window.__LATM && window.__LATM.fixedDt) dt = window.__LATM.fixedDt; // offline capture
  if (window.__LATM && window.__LATM.capture){ // frame-stepped capture
    if (window.__LATM.stepFrames > 0){ dt = 1/24; window.__LATM.stepFrames--; }
    else dt = 0;
  }
  document.body.classList.toggle('live', G.mode === 'play' || G.mode === 'story' || G.mode === 'paused');
  if (G.mode === 'paused'){
    updateFX(dt);
    renderFrame(scene, camera);
    return;
  }
  G.time += dt;

  if (G.mode === 'cinematic'){ Cinematic.update(dt); return; } // renders its own scene
  if (G.mode === 'beatclip' || G.mode === 'galleryclip') updateBeat(dt);
  if (G.mode === 'play' && CH.train) tryTrainReturn();
  if (G.mode === 'play'){
    updatePlayer(dt);
    tryFire(dt);
    if (CH.stealth) updateWatchers(dt);
    else {
      let ddt = dt;
      if (CH.id === 'ch_ghost' && SFLAGS.spoke && Math.sin(G.time*1.1) > .55) ddt = dt * .12;  // it hesitates
      updateDrones(ddt);
    }
    updateAllies(dt);
    updateProjectiles(dt);
    updateDoors(dt);
    updateExitAmbush();
    updateWave(dt);
    updateObjective(dt);
    updateRadio(dt);
    if (G.time - (G.musicT || 0) > .5){
      G.musicT = G.time;
      MusicSys.setMode(
        Boss && Boss.fighting() ? 'alarm' :
        CH.stealth ? (G.detect > 55 ? 'combat' : (G.alarm && !G.planted ? 'alarm' : 'calm')) :
        G.alarm && !G.planted ? 'alarm' :
        drones.some(d => d.alive && d.state === 'attack') ? 'combat' : 'calm');
    }
  }
  if (G.mode === 'story'){ Story.update(dt); updateRadio(dt); }
  if (G.mode === 'play' || G.mode === 'story' || G.mode === 'paused') maybeAutosave(false);
  if (G.mode === 'dead' || G.mode === 'extracting'){
    updateRadio(dt);
    if (!CH.stealth) updateDrones(dt);
  }
  if (Boss && G.mode !== 'title' && G.mode !== 'end') Boss.update(dt, G.mode !== 'play');
  if (hatchScareT > 0){
    hatchScareT -= dt;
    if (window.Waking && Waking.reducedMotion()) hatchScareT = 0;
    if (hatchScareT > 0){
      const sa = .07 * Math.min(1, hatchScareT / .4);
      camera.position.set((Math.random() - .5) * sa, (Math.random() - .5) * sa, 0);
    } else camera.position.set(0, 0, 0);
  }
  // quality governor (disabled during scripted capture)
  if (G.mode === 'play' && !(window.__LATM && window.__LATM.capture)) governor(nowT);
  updateFX(dt);
  if (G.mode === 'title' || G.mode === 'end' || G.mode === 'cinema') return;   // opaque screens cover the level
  if (TUBES) TUBES.animate(dt, G.time, yawObj.position, scene.fog, renderer.domElement.height);
  renderFrame(scene, camera);
  if (hideLoadOnFrame){ hideLoadOnFrame = false; hideLoad(); }
  if (Cast) Cast.render(dt);
}
loop();

try {
  if (sessionStorage.getItem('latm_newgame') === '1'){
    sessionStorage.removeItem('latm_newgame');
    sessionStorage.removeItem('latm_resume');
    sessionStorage.removeItem('latm_autoload');
    beginFromTitle(false);
  } else if (sessionStorage.getItem('latm_autoload') === '1' && peekResume()){
    sessionStorage.removeItem('latm_autoload');
    beginFromTitle(true);
  }
} catch (e) {}

export function bootWaking() {
  return true;
}
