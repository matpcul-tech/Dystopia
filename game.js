// @ts-nocheck
import * as THREE from 'three';

window.THREE = THREE; // people.js is a classic script that reads global THREE at call time

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
    cinematic: true,          // the book's opening scene plays first
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
      { x1:-3, x2:3, z1:-10,  z2:2    },   // the gravel lot where he wakes
      { x1:-5, x2:5, z1:-42,  z2:-10  },   // ruined street
      { x1:-4, x2:4, z1:-76,  z2:-42  },   // hardware district
      { x1:-3, x2:3, z1:-112, z2:-76  },   // the rail bridge
      { x1:-9, x2:9, z1:-136, z2:-112 },   // the depot
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
      ['crawler',  0, -18, 1], ['crawler', -3, -26, 1], ['crawler',  3, -33, 1], ['crawler', 0, -39, 1],
      ['crawler', -2, -48, 2], ['crawler',  2, -55, 2], ['sentry', -3, -60, 2], ['crawler', 0, -66, 2], ['sentry', 3, -72, 2],
      ['crawler',  0, -82, 3], ['sentry', -2, -88, 3], ['crawler', 0, -95, 3], ['sentry', 2, -101, 3], ['warden', 0, -108, 3],
      ['sentry', -5, -120, 4], ['sentry', 5, -120, 4],
    ],
    waveSpawns: [[-7,-114],[7,-114],[-7,-134],[7,-134]],
    waveTotal: 12,
    zones: [ {z:-26,key:'seg1_mid'}, {z:-58,key:'seg2_mid'}, {z:-94,key:'seg3_mid'} ],
    objectivePos: [0, 1.4, -128],
    annexes: [
      { room:1, side:'R', z1:-38, z2:-30, depth:4,   loot:'med'  },   // looted clinic off the street
      { room:3, side:'L', z1:-100, z2:-92, depth:3.5, loot:'cell' },  // bridge service platform
    ],
    obj: {
      find:"FIND THE DEAD MAN'S RIFLE", advance:'HEAD FOR THE RIVER',
      segs:['CROSS THE RUINED STREET','CLEAR THE HARDWARE DISTRICT','CROSS THE RAIL BRIDGE'],
      final:'PULL THE LEDGER AT THE DEPOT SCREEN', done:'GET OUT OF THE NET',
      armLabel:'COPYING LEDGER', btn:'PULL',
      promptKey:'HOLD [E] TO PULL THE LEDGER', promptTouch:'HOLD PULL TO COPY THE LEDGER',
    },
    introLines: [
      "Gravel. Cold. Somewhere past the overpass, a sound like counting.",
      "A dead man's radio crackled. \"...can hear you breathing. My name is Reyes. Get up.\"",
    ],
    radio: {
      pickup:      [{who:'REYES', text:"There's a rifle by the man who didn't make it. He'd want it used."},
                    {who:'REYES', text:"Crawlers between you and the river. Light them up and keep moving."}],
      seg1_mid:    [{who:'REYES', text:"I'm across the river. The old rail depot. Real walls. Come find me."}],
      seg1_clear:  [{who:'REYES', text:"Street's clear. You're better at this than you sound."}],
      seg2_enter:  [{who:'REYES', text:"Hardware district. They collect here. Don't be collectible."}],
      seg2_mid:    [{who:'REYES', text:"Sentries ahead. The red flare is the wind-up. Move on the flare."}],
      seg2_clear:  [{who:'REYES', text:"Clear. The bridge is next. I'll talk you across."}],
      seg3_enter:  [{who:'REYES', text:"Rail bridge. Eyes forward. Don't look at the water. It's in on something."}],
      seg3_mid:    [{who:'REYES', text:"Heavy frame on the span. A warden. Use the trusses, Marcus."}],
      seg3_clear:  [{who:'REYES', text:"You're across. Marcus... The depot gate is open. It shouldn't be open."}],
      core_enter:  [{who:'REYES', text:"Cots. Cartons. Lights. No people. Get to that screen. The list is everyone."}],
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
  Object.values(CHAPTERS).forEach(c => {
    if (c.id === CH.id) return;
    if (c.id !== 'ep1' && !UNLOCKED.includes(c.id)) return;
    const sw = document.createElement('button');
    sw.className = 'btn';
    sw.style.cssText = 'margin-top:14px;font-size:11px;padding:10px 18px;opacity:.85';
    sw.textContent = '\u25B8 ' + c.subtitle;
    sw.onclick = () => { location.hash = '#' + c.id; location.reload(); };
    document.getElementById('startScreen').appendChild(sw);
  });
  if (UNLOCKED.length){
    const t = document.createElement('div');
    t.style.cssText = 'margin-top:16px;font-size:10px;letter-spacing:3px;color:#ffb85c;';
    t.textContent = 'PATHS UNLOCKED: ' + UNLOCKED.length + ' / 5';
    document.getElementById('startScreen').appendChild(t);
  }
  if (CH.nextHash){
    const nx = document.createElement('button');
    nx.className = 'btn';
    nx.textContent = 'NEXT CHAPTER \u25B8';
    nx.onclick = () => { location.hash = CH.nextHash; location.reload(); };
    document.getElementById('endBtns').appendChild(nx);
  }
}

const IS_TOUCH = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
el.startHint.innerHTML = IS_TOUCH
  ? 'LEFT SIDE: MOVE &nbsp;&bull;&nbsp; RIGHT SIDE: LOOK &nbsp;&bull;&nbsp; FIRE BUTTON: SHOOT'
  : 'WASD: MOVE &nbsp;&bull;&nbsp; MOUSE: LOOK &nbsp;&bull;&nbsp; CLICK: FIRE &nbsp;&bull;&nbsp; E: INTERACT &nbsp;&bull;&nbsp; M: MUSIC';

/* ============================================================
   Quality system (ported from LATM: Hive Infiltration).
   low  = phones / weak GPUs: direct render, no shadows, capped pixel ratio
   med  = bloom + color grade post stack, no shadows
   high = med + shadow-casting flashlight, FXAA, higher pixel ratio, more particles
   Override: ?q=low|med|high  (or the GRAPHICS button on the title screen).
   A runtime governor steps DOWN when frame rate is poor and steps UP once
   on a phone that is clearly coasting. Choice is remembered per device.
   ============================================================ */
const QP = {
  low:  { pr:1.15, shadows:0, post:0, bloom:0,   fxaa:0, dust:80,  accent:1, shafts:4,  tex:256, ash:160 },
  med:  { pr:1.35, shadows:0, post:1, bloom:.45, fxaa:0, dust:170, accent:1, shafts:8,  tex:512, ash:300 },
  high: { pr:1.75, shadows:1, post:1, bloom:.6,  fxaa:1, dust:320, accent:1, shafts:14, tex:512, ash:420 },
};
const QLEVELS = ['low','med','high'];
const Q = (() => {
  const url = new URLSearchParams(location.search).get('q');
  let saved = null; try { saved = localStorage.getItem('waking_q'); } catch(e){}
  const coarse = !!(window.matchMedia && matchMedia('(pointer:coarse)').matches);
  const smallScreen = Math.min(screen.width, screen.height) < 700;
  const mem = navigator.deviceMemory || 4, cores = navigator.hardwareConcurrency || 4;
  let auto = 'high';
  if ((IS_TOUCH && (coarse || smallScreen)) || mem <= 2 || cores <= 2) auto = 'low';
  else if (mem <= 4 || cores <= 4) auto = 'med';
  let cap = null; try { cap = localStorage.getItem('waking_qcap'); } catch(e){}
  if (QLEVELS.includes(cap) && QLEVELS.indexOf(cap) < QLEVELS.indexOf(auto)) auto = cap;
  const pick = [url, saved].find(v => QLEVELS.includes(v));
  const level = pick || auto;
  return { level, auto, forced: !!pick, userChoice: pick || 'auto', p: QP[level], scale: 1,
           noUp: !!pick, phone: auto === 'low' && IS_TOUCH };
})();
const TEXN = Q.p.tex;
{
  // title-screen graphics selector: AUTO / LOW / MED / HIGH (remembered on this device)
  const gb = document.createElement('button');
  gb.className = 'btn small'; gb.id = 'gfxBtn'; gb.type = 'button';
  gb.onclick = () => {
    const order = ['auto','low','med','high'];
    const next = order[(order.indexOf(Q.userChoice) + 1) % order.length];
    Q.userChoice = next; Q.noUp = next !== 'auto'; Q.scale = 1;
    try { if (next === 'auto'){ localStorage.removeItem('waking_q'); localStorage.removeItem('waking_qcap'); } else localStorage.setItem('waking_q', next); } catch(e){}
    applyQuality(next === 'auto' ? Q.auto : next);
  };
  el.startBtn.insertAdjacentElement('afterend', gb);
}
function refreshGfxButton(){
  const b = document.getElementById('gfxBtn');
  if (b) b.textContent = 'GRAPHICS: ' + Q.userChoice.toUpperCase() + (Q.userChoice === 'auto' ? ' [' + Q.level.toUpperCase() + ']' : '');
}

/* ============================================================
   Audio. All synthesized, zero assets
   ============================================================ */
const AudioSys = (() => {
  let ctx = null, master = null, humOsc = null, humGain = null, alarmTimer = null, heartTimer = null;
  function init(){
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0.55; master.connect(ctx.destination);
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
  const ROOT = ({ ep1:65.41, ch_taken:73.42, ch_ghost:55.0, ch_together:110.0, ch_lone:82.41, ch1:73.42, ch2:110.0, ch3:82.41 })[CH.id] || 65.41;
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
    out = ctx.createGain(); out.gain.value = muted ? 0 : 1; out.connect(ctx.destination);
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
      if (out) out.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, .05);
    },
  };
})();

/* ============================================================
   Three.js scene
   ============================================================ */
const MGLOW = CH.palette.strip;   // machine light colour of this chapter
const renderer = new THREE.WebGLRenderer({ antialias:true, powerPreference:'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, Q.p.pr));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = CH.palette.exposure || 1.1;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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
          tDiffuse:{value:null}, uTime:{value:0}, uCA:{value:0}, uDmg:{value:0}, uLow:{value:0},
          uShadow:{value:new THREE.Vector3(...G_.sh)}, uHigh:{value:new THREE.Vector3(...G_.hi)},
        },
        vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
        fragmentShader: `
          uniform sampler2D tDiffuse; uniform float uTime, uCA, uDmg, uLow;
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
            col += (rnd(vUv*vec2(1287.,731.) + mod(uTime,9.)) - .5) * .045;     // film grain
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
  try {
    const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
    const loader = new GLTFLoader();
    const defs = [
      ['crawler', 'models/crawler.glb', .80, -0.50,  0,     { eye:[0,.06,.42] }],
      ['sentry',  'models/sentry.glb',  .90,  0,     0,     { eye:[0,.02,.45], muzzle:[0,-.30,.42] }],
      ['warden',  'models/warden.glb', 1.30, -0.643, -0.104,{ eye:[0,.14,.66], muzzle:[0,-.30,.60] }],
      ['rifle',   'models/rifle.glb',  1.08,  0,     0,     {}],
      ['pod',     'models/pod.glb',    1.25,  0,     -0.024,{}],
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
function applyQuality(level){
  level = QLEVELS.includes(level) ? level : 'low';
  Q.level = level;
  const p = Q.p = QP[level];
  const w = window.innerWidth, h = window.innerHeight;
  const pr = Math.min(window.devicePixelRatio, p.pr * Q.scale);
  renderer.setPixelRatio(pr);
  renderer.setSize(w, h);
  const spot = !!p.shadows;
  hemi.intensity = (CH.palette.hemiI || .75) * (spot ? 1 : 1.5);
  renderer.toneMappingExposure = (CH.palette.exposure || 1.1) * (p.post || spot ? 1 : 1.12);
  flash.visible = spot; flash.castShadow = spot;
  lamp.intensity = spot ? 14 : 42;
  accent.visible = !!p.accent;
  if (GFX.dust) GFX.dust.geometry.setDrawRange(0, p.dust);
  GFX.shafts.forEach((m,i) => { m.visible = i < p.shafts; });
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
// A phone that sits at 57+ fps for three windows is promoted one tier, once.
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
  const floorFps = IS_TOUCH ? 30 : 42;
  if (fps < floorFps){
    G._fpsGood = 0;
    if (++G._fpsBad < 2) return;
    G._fpsBad = 0;
    Q.noUp = true;
    const i = QLEVELS.indexOf(Q.level);
    if (i > 0){
      const nl = QLEVELS[i-1];
      try { localStorage.setItem('waking_qcap', nl); } catch(e){}
      applyQuality(nl);
    } else if (Q.scale > .62){
      Q.scale = Math.max(.62, Q.scale * .85);   // last resort: render fewer pixels
      applyQuality('low');
    }
  } else if (fps > 56 && !Q.noUp){
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
float tri(float x){ return abs(fract(x*.5)*2. - 1.); }      // mirrored repeat without a seam
void main(){
  vec3 d = normalize(vDir);
  float e = asin(clamp(d.y, -1., 1.));                      // elevation, radians
  float az = atan(d.x, -d.z);
  // horizon band: the photo wrapped as a cylinder, four mirrored copies
  vec2 bu = vec2(tri(az / 6.2831853 * 4.), clamp(.27 + e * 57.2958 / 52., .003, .997));
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
function makeSkyDome(radius){
  const mat = new THREE.ShaderMaterial({
    vertexShader: SKY_VS, fragmentShader: SKY_FS, side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uSky:{ value:null }, uHas:{ value:0 }, uTime:{ value:0 }, uGain:{ value:1.25 },
      uTop:{ value:new THREE.Color(0x1a0705) }, uHaze:{ value:new THREE.Color(0x6e2414) }, uDeck:{ value:new THREE.Color(0x5a1a0e) } },
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 20), mat);
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
    const gnd = new THREE.Mesh(new THREE.PlaneGeometry(600,600), new THREE.MeshStandardMaterial({
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
    const facadeMat = new THREE.MeshStandardMaterial({
      map:FACADE.map, normalMap:FACADE.normal, roughnessMap:FACADE.orm, roughness:1, metalness:.05,
      emissiveMap:FACADE.emissive, emissive:new THREE.Color(0xffffff), emissiveIntensity:1.4 });
    const steelMat = new THREE.MeshStandardMaterial({ color:0x2a2220, roughness:.55, metalness:.85 });
    {
      const geo = new THREE.DodecahedronGeometry(1, 0), N = 90;
      const rubMat = new THREE.MeshStandardMaterial({ map:FACADE.map, normalMap:FACADE.normal, roughnessMap:FACADE.orm, roughness:1, metalness:.05, flatShading:true });
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
      const bars = new THREE.InstancedMesh(gb, steelMat, 40);
      for (let i=0;i<40;i++){
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
        new THREE.MeshStandardMaterial({ color:0x15181a, roughness:.45, metalness:.85,
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
    for (let i=0;i<8;i++){
      const p = new THREE.Sprite(smokeMat);
      p.position.set(-120+R()*240, 26+R()*30, -140+R()*160);
      p.scale.set(90, 28, 1);
      cScene.add(p); smokes.push(p);
    }
    // falling ash (count follows the quality tier)
    {
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
    const bodyMat = new THREE.MeshStandardMaterial({ color:0x1a1614, roughness:.4, metalness:.85 });
    const eyeMat = new THREE.MeshBasicMaterial({ color:0xff3322 });
    function mkDrone(bm){
      const g3 = new THREE.Group();
      const body = new THREE.Mesh(new THREE.SphereGeometry(1.1, 14, 10), bodyMat);
      body.scale.set(1.4,.7,1.4);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(.3, 8, 6), eyeMat);
      eye.position.y = -.5;
      const beam = new THREE.Mesh(new THREE.ConeGeometry(4.2, 26, 16, 1, true), bm);
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
    if (ash){
      const a = ash.geometry.attributes.position;
      for (let i=0;i<a.count;i++){
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
  function onQuality(){ if (ash) ash.geometry.setDrawRange(0, Q.p.ash); }
  function resize(){ if (cCam){ cCam.aspect = window.innerWidth/window.innerHeight; cCam.updateProjectionMatrix(); } }
  return { start, update, skip: teardown, prewarm, onQuality, resize, isActive: () => active,
    debugSeek: tt => { t = tt; }, scene: () => cScene, cam: () => cCam };
})();
window.addEventListener('resize', () => Cinematic.resize());

/* ============================================================
   Level: 5 rooms (start, 3 segments, core) along -Z
   ============================================================ */
const WALL_H = CH.wallH || 4, DOOR_HALF = 1.6;
const ROOMS = CH.rooms;
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
const ANISO = Math.min(renderer.capabilities.getMaxAnisotropy(), Q.level === 'high' ? 8 : 3);
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
  const set = { map:toTex(A,true), normal:toTex(heightToNormal(Hc, opts.nstr || 3.2), false), orm:toTex(O,false) };
  if (opts.emissive) set.emissive = toTex(E,true);
  return set;
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
  const orm = cl(set.orm);
  const m = new THREE.MeshStandardMaterial({
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
    // blood sky dome, same pinch-free shader as the opening cinematic
    const dome = makeSkyDome(100);
    dome.onBeforeRender = () => { dome.position.set(yawObj.position.x, 0, yawObj.position.z); };
    scene.add(dome);
    const sun = new THREE.DirectionalLight(0xff6a40, .45);
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
ROOMS.forEach((r,i)=>{
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
  const b = new THREE.Mesh(new THREE.BoxGeometry(.5,.35,.4), new THREE.MeshStandardMaterial({ color:0x2a2f28, metalness:.5, roughness:.5 }));
  b.position.y = .3; grp.add(b);
  const led = new THREE.Mesh(new THREE.SphereGeometry(.06,10,8), new THREE.MeshBasicMaterial({ color:col }));
  led.position.y = .58; grp.add(led);
  const halo = new THREE.Sprite(glowMat.clone()); halo.material.color.setHex(col); halo.material.opacity = .8;
  halo.scale.set(1.3, 1.3, 1); halo.position.y = .62; grp.add(halo);
  grp.position.set(lx, 0, lz);
  scene.add(grp);
  LOOT.push({ grp, x:lx, z:lz, type:a.loot });
});
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
const fixtureMat = new THREE.MeshStandardMaterial({ color:0x2a3036, roughness:.45, metalness:.85, envMapIntensity:1.1 });
ROOMS.forEach(r=>{
  for (let z = r.z2-3; z > r.z1+1; z -= 6){
    [r.x1+.07, r.x2-.07].forEach(x=>{
      const housing = new THREE.Mesh(new THREE.BoxGeometry(.16, .2, 2.4), fixtureMat);
      const fy = Math.min(2.6, WALL_H-.4);
      housing.position.set(x, fy, z); scene.add(housing);
      const s = new THREE.Mesh(new THREE.BoxGeometry(.1, .12, 2.2), matStrip);
      s.position.set(x + (x<0?.05:-.05), fy, z); scene.add(s); strips.push(s);
      const halo = new THREE.Sprite(glowMat);
      halo.scale.set(2.2, 1.1, 1); halo.position.set(x + (x<0?.35:-.35), fy, z); scene.add(halo);
    });
  }
});

// structural ribs: wall posts + ceiling beam every 6m
const ribMat = patchSurface(new THREE.MeshStandardMaterial({ color:0x2e353b, roughness:.5, metalness:.85, envMapIntensity:1.1 }), { floorAO:.5, ceilAO:.3, aoH:1.2 });
const unitBox = new THREE.BoxGeometry(1,1,1);
ROOMS.forEach(r=>{
  for (let z = r.z2-4; z > r.z1+2; z -= 6){
    [[r.x1+.14, .32],[r.x2-.14, .32]].forEach(([x,sx])=>{
      const post = new THREE.Mesh(unitBox, ribMat);
      post.position.set(x, WALL_H/2, z); post.scale.set(sx, WALL_H, .4);
      scene.add(post);
    });
    const beam = new THREE.Mesh(unitBox, ribMat);
    beam.position.set((r.x1+r.x2)/2, WALL_H-.16, z);
    beam.scale.set(r.x2-r.x1, .32, .4);
    scene.add(beam);
  }
});

// conduit pipes running the length of each room
const pipeGeo = new THREE.CylinderGeometry(.07,.07,1,8);
const pipeMat = new THREE.MeshStandardMaterial({ color:0x2c343a, roughness:.4, metalness:.9, envMapIntensity:1.3 });
ROOMS.forEach(r=>{
  const len = r.z2-r.z1, zc = (r.z1+r.z2)/2;
  [[r.x1+.24,3.4],[r.x1+.24,3.18],[r.x2-.24,3.3]].forEach(([x,y])=>{
    const p = new THREE.Mesh(pipeGeo, pipeMat);
    p.rotation.x = Math.PI/2;
    p.position.set(x, y, zc); p.scale.set(1, len, 1);
    scene.add(p);
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
if (!CH.outdoor){
  let i = 0;
  ROOMS.forEach((r, ri) => {
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
    m.material.map = t; m.position.set(x, y, zc); scene.add(m);
    condMats.push(m.material);
  });
});

// skirting + cornice trims, pillar plinths and light rings: silhouette detail and contact edges
const trimMat = new THREE.MeshStandardMaterial({ color:0x20252a, roughness:.5, metalness:.85, envMapIntensity:.8 });
ROOMS.forEach(r => {
  const len = r.z2 - r.z1, zc = (r.z1 + r.z2)/2;
  [[r.x1 + .1, .13, .26],[r.x2 - .1, .13, .26],[r.x1 + .1, WALL_H - .1, .2],[r.x2 - .1, WALL_H - .1, .2]].forEach(([x,y,hh]) => {
    const m = new THREE.Mesh(unitBox, trimMat);
    m.scale.set(.2, hh, len - .1); m.position.set(x, y, zc); scene.add(m);
  });
});
PILLARS.forEach(([x,z,s]) => {
  const plinth = new THREE.Mesh(unitBox, trimMat);
  plinth.scale.set(s*2 + .24, .34, s*2 + .24); plinth.position.set(x, .17, z); scene.add(plinth);
  const cap = new THREE.Mesh(unitBox, trimMat);
  cap.scale.set(s*2 + .2, .22, s*2 + .2); cap.position.set(x, WALL_H - .11, z); scene.add(cap);
  const ring = new THREE.Mesh(unitBox, matStrip);
  ring.scale.set(s*2 + .05, .06, s*2 + .05); ring.position.set(x, Math.min(2.55, WALL_H-.45), z); scene.add(ring);
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
  scene.add(im);
}

// floor scrap and rubble (one instanced draw)
{
  const R = rngOf(SEED + 7), geo = new THREE.DodecahedronGeometry(1, 0);
  const mat = new THREE.MeshStandardMaterial({ color:0x2a2e33, roughness:.7, metalness:.7, flatShading:true, envMapIntensity:.7 });
  const N = 150, im = new THREE.InstancedMesh(geo, mat, N), dm = new THREE.Object3D();
  for (let i=0;i<N;i++){
    const r = ROOMS[(R()*ROOMS.length)|0];
    const side = R() < .6, x = side ? (R() < .5 ? r.x1 + .3 + R()*1.1 : r.x2 - .3 - R()*1.1) : r.x1 + R()*(r.x2-r.x1);
    const z = r.z1 + 1 + R()*(r.z2 - r.z1 - 2), s = .03 + R()*R()*.2;
    dm.position.set(x, s*.5, z); dm.scale.set(s*(.8+R()), s*(.5+R()*.6), s*(.8+R()));
    dm.rotation.set(R()*6, R()*6, R()*6); dm.updateMatrix(); im.setMatrixAt(i, dm.matrix);
  }
  scene.add(im);
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

// pickup rifle on floor in start room
// shared unit geometries for all built models (scaled per part)
const sphereGeo  = new THREE.SphereGeometry(1, 14, 12);
const coneGeo    = new THREE.ConeGeometry(1, 1, 6);
const cylGeo     = new THREE.CylinderGeometry(1, 1, 1, 8);
const torusGeoLg = new THREE.TorusGeometry(.5, .045, 6, 24);
const torusGeoSm = new THREE.TorusGeometry(.42, .028, 6, 20);
const discGeo    = new THREE.CircleGeometry(.09, 10);
const eyeGeoC    = new THREE.SphereGeometry(.09, 10, 8);
const eyeGeoS    = new THREE.SphereGeometry(.12, 12, 10);

const gunMetal = new THREE.MeshStandardMaterial({ color:0x46524a, roughness:.38, metalness:.55 });
const gunDark  = new THREE.MeshStandardMaterial({ color:0x252c26, roughness:.5, metalness:.5 });
const glowGreenMat = new THREE.MeshBasicMaterial({ color:0xe7c98a });

// pulse rifle model, used for both the floor pickup and the view-model
function buildRifle(){
  const r = new THREE.Group();
  const parts = [
    [unitBox, gunMetal, [.085,.11,.42],  [0,0,0],       [0,0,0]],   // receiver
    [unitBox, gunDark,  [.07,.08,.26],   [0,-.005,-.32],[0,0,0]],   // fore-end
    [cylGeo,  gunDark,  [.018,.30,.018], [0,.02,-.55],  [Math.PI/2,0,0]], // barrel
    [cylGeo,  gunMetal, [.028,.07,.028], [0,.02,-.70],  [Math.PI/2,0,0]], // muzzle brake
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
const VMLIGHT = { value:.03 };   // direct light reaching the viewmodel (raised by the muzzle flash)
function dimViewmodel(group){
  // the view-model sits half a metre from the headlamp, so its lit materials are
  // darkened and de-glossed or physically-correct falloff blows them out white
  const seen = new Map();
  group.traverse(o => {
    if (!o.isMesh) return;
    o.castShadow = false; o.receiveShadow = false; o.frustumCulled = false;
    if (!seen.has(o.material)){
      const m = o.material.clone();
      if (m.isMeshStandardMaterial){
        const glow = m.emissiveIntensity > 0 && m.emissive.getHex() > 0;
        if (glow) m.emissiveIntensity = Math.min(m.emissiveIntensity, .55);
        else { m.color.multiplyScalar(.5); m.roughness = Math.max(.42, m.roughness); m.metalness = Math.min(.75, m.metalness); m.envMapIntensity = .9; }
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
  const coreMat = new THREE.MeshStandardMaterial({ color:0x0c1810, emissive:0xe7c98a,
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
  const glassMat  = new THREE.MeshStandardMaterial({ color:0xbfe4ef, roughness:.12,
    metalness:0, transparent:true, opacity:.16, depthWrite:false });
  const fluidMat  = new THREE.MeshBasicMaterial({ color:0x86d8c9, transparent:true,
    opacity:.13, blending:THREE.AdditiveBlending, depthWrite:false });
  const figureMat = new THREE.MeshStandardMaterial({ color:0x0a0d0e, roughness:.9, metalness:0 });
  const baseMat   = new THREE.MeshStandardMaterial({ color:0x39444a, roughness:.5, metalness:.6 });
  const usePod = !!MODELS.pod;
  CH.cylinders.forEach(([x,z,angela])=>{
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
  const frame = new THREE.MeshStandardMaterial({ color:0x4a4238, roughness:.5, metalness:.6 });
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
PROPS = { animate(){}, onComplete(){} };
modelsReady.then(() => {
  PROPS = CH.setPiece === 'ledger' ? buildPropsCh2() : CH.setPiece === 'uplink' ? buildPropsCh3() : buildPropsCh1();
});

// story pickup: the dead man's radio, hidden in the hardware district
let radioProp = CH.id !== 'ep1' ? null : (() => {
  const g = new THREE.Group();
  const b = new THREE.Mesh(unitBox, new THREE.MeshStandardMaterial({color:0x1c221c,metalness:.6,roughness:.4}));
  b.scale.set(.34,.14,.22); b.position.y = .3; g.add(b);
  const led = new THREE.Mesh(new THREE.SphereGeometry(.035,8,6), new THREE.MeshBasicMaterial({color:0xe7c98a}));
  led.position.set(.1,.4,.08); g.add(led);
  const l = new THREE.PointLight(0xe7c98a, 2.6, 7, 2); l.position.y = .7; g.add(l);
  g.position.set(0, 0, -62);
  scene.add(g);
  return g;
})();

/* ============================================================
   Drones
   ============================================================ */
const EYE_GREEN = 0xe7c98a, EYE_RED = 0xff2b3c;
const droneMetal = new THREE.MeshStandardMaterial({ color:0x59685c, roughness:.42, metalness:.55 });
const droneDark  = new THREE.MeshStandardMaterial({ color:0x2b332c, roughness:.55, metalness:.5 });
const droneArmor = new THREE.MeshStandardMaterial({ color:0x48594d, roughness:.5, metalness:.6 });
const thrusterGlowMat = new THREE.MeshBasicMaterial({ color:0xe7c98a, transparent:true,
  opacity:.7, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide });

// six-legged hunter with an articulated walk cycle and a scanning sensor head
function buildCrawler(eyeMat){
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
  const M = MODELS[kind];
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

function spawnSegment(seg){
  // (re)create the initial drones of a segment; used at load + on respawn
  for (let i = drones.length-1; i >= 0; i--){
    if (drones[i].segment === seg){
      scene.remove(drones[i].mesh);
      if (drones[i].w) scene.remove(drones[i].w.grp);
      drones.splice(i,1);
    }
  }
  INITIAL_DRONES.filter(d=>d[3]===seg).forEach(([k,x,z,s])=>{
    const d = makeDrone(k,x,z,s);
    d.spawned = true; scene.add(d.mesh);
  });
}
modelsReady.then(() => { [1,2,3,4].forEach(spawnSegment); });

function segmentCleared(seg){
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
function fireProjectile(from, target, speed = 13, dmg = 12){
  const m = new THREE.Mesh(projGeo, projMat);
  m.position.copy(from);
  const vel = target.clone().sub(from).normalize().multiplyScalar(speed);
  scene.add(m);
  projectiles.push({ mesh:m, vel, life:4, dmg });
  AudioSys.sentryFire();
}

/* ============================================================
   Game state
   ============================================================ */
const G = {
  mode: 'boot',            // boot > title > intro > play > dead > extracting > end
  hp: 100, lastDamageT: 0,
  hasRifle: false, fireCd: 0,
  yaw: 0, pitch: 0,
  checkpoint: { pos: new THREE.Vector3(0,0,0), yaw: 0, segment: 0 },
  currentSegment: 0,
  radioQueue: [], radioT: 0, radioFired: new Set(),
  plantProgress: 0, planting: false, planted: false, detect: 0, escape: false,
  alarm: false, waveSpawned: 0, waveT: 0,
  time: 0, shakeT: 0,
};
const PLAYER_R = 0.4, PLAYER_EYE = 1.7;
const MOVE_SPEED = 5.2;

yawObj.position.set(0, PLAYER_EYE, 0);

/* ============================================================
   Input
   ============================================================ */
const keys = {};
let mouseFiring = false, pointerLocked = false;

addEventListener('keydown', e => {
  keys[e.code] = true;
  if (e.code === 'KeyM') MusicSys.toggleMute();
});
addEventListener('keyup',   e => { keys[e.code] = false; });

renderer.domElement.addEventListener('click', () => {
  if (G.mode === 'play' && !IS_TOUCH && !pointerLocked){
    renderer.domElement.requestPointerLock();
  }
});
document.addEventListener('pointerlockchange', () => {
  pointerLocked = document.pointerLockElement === renderer.domElement;
});
addEventListener('mousemove', e => {
  if (!pointerLocked || G.mode !== 'play') return;
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
document.addEventListener('visibilitychange', () => { if (document.hidden) resetInputs(); });

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
  (RADIO[key] || []).forEach(l => G.radioQueue.push(l));
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
  const wantFire = (mouseFiring || touchFiring || keys['Space']) && G.hasRifle;
  if (!wantFire || G.fireCd > 0) return;
  G.fireCd = 0.18; // fire-rate cap
  AudioSys.shot();
  G.shakeT = 0.06;
  viewRifle.position.z = VMB.z + .08; // recoil, eased back in update

  camera.getWorldDirection(_rayDir);
  const origin = new THREE.Vector3();
  camera.getWorldPosition(origin);

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

  const hitPoint = origin.clone().addScaledVector(_rayDir, bestT);
  viewRifle.getWorldPosition(_muzzle);
  spawnTracer(_muzzle.clone().addScaledVector(_rayDir, .4), hitPoint);
  muzzleLight.intensity = 26;
  spawnSparks(hitPoint, bestDrone ? 12 : 6);

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

function damagePlayer(dmg){
  if (G.mode !== 'play') return;
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
        if (!seesPlayer && dist > 30) setDroneState(d, 'idle');
      } else {
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
    if (dx*dx + dy*dy + dz*dz < .45){
      damagePlayer(p.dmg); dead = true;
    } else {
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
   ============================================================ */
function updateDoors(dt){
  doors.forEach(dr => {
    if (!dr.open){
      const canOpen = CH.stealth ? (yawObj.position.z > dr.boundaryZ && yawObj.position.z - dr.boundaryZ < 7) : (dr.index === 0 ? G.hasRifle : segmentCleared(dr.index));
      if (canOpen){
        dr.open = true;
        dr.lock.material.color.setHex(0xe7c98a);
        AudioSys.doorOpen();
        if (dr.index === 1){ radio('seg1_clear'); if (CB.door1) setTimeout(()=>{ if (G.mode==='play') Story.start(CB.door1); }, 1400); }
        if (dr.index === 2){ radio('seg2_clear'); if (CB.door2) setTimeout(()=>{ if (G.mode==='play') Story.start(CB.door2); }, 1400); }
        if (dr.index === 3) radio('seg3_clear');
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
    G.checkpoint.pos.set(0, 0, ROOMS[seg].z2 - 2);
    G.checkpoint.yaw = 0; // yaw 0 faces -z, deeper into the hive
    G.checkpoint.segment = seg;
    AudioSys.checkpoint();
    if (seg === 2) radio('seg2_enter');
    if (seg === 3) radio('seg3_enter');
    if (seg === 4){
      radio('core_enter');
      startAlarm();
    }
    setObjectiveText();
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
  // escape phase: reaching the entrance ends the chapter
  if (G.escape && yawObj.position.z > ROOMS[0].z1 + 1.5){
    G.escape = false;
    if (CB.finale) Story.start(CB.finale); else beginExtraction();
  }
  // chapter-defined chatter zones
  CH.zones.forEach(zn => { if (z < zn.z) radio(zn.key); });
}

function setObjectiveText(){
  const O = CH.obj;
  if (G.escape){ el.objective.textContent = O.done; return; }
  const t = {
    0: G.hasRifle ? O.advance : O.find,
    1: O.segs[0], 2: O.segs[1], 3: O.segs[2],
    4: G.planted ? O.done : O.final,
  }[G.currentSegment] || '';
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
  if (G.currentSegment !== 4 || G.planted) { el.plantWrap.style.display='none'; el.plantBtn.style.display='none'; return; }
  const dx = yawObj.position.x - CORE_POS.x, dz = yawObj.position.z - CORE_POS.z;
  const near = (dx*dx + dz*dz) < 9;
  const holding = keys['KeyE'] || touchPlanting;
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
  PROPS.onComplete();
  // brief beat, then extraction
  setTimeout(()=>{ if (G.mode === 'play'){
    G.escape = true; G.waveSpawned = 0; G.waveT = 1.5; setObjectiveText();
    if (CH.id === 'ep1' && SFLAGS.trusted){ spawnCompanion(); sToast('REYES CAME BACK OVER THE BRIDGE FOR YOU.'); }
    if (CH.id === 'ch_taken' && SFLAGS.freed){
      G.waveCap = Math.ceil((CH.waveTotal||12)/2);
      // sleepers strung out along the whole escape route, so the player
      // keeps passing them on the way to daylight
      for (let i = 0; i < 10; i++){
        const c = makeCivvy({ jacket:[0x3a3a32,0x4a3a30,0x33402f,0x46464b,0x54443a,0x3c3348][i%6],
          hair:[0x241d16,0x0f0d0a,0x4a4038,0x2a1d12,0x1a1a1c,0x33261a][i%6] });
        c.position.set((i%2 ? 1 : -1) * (1.5 + (i%4)), 0, -100 + i*6);
        scene.add(c); FLEE.push(c);
      }
      sToast('THE SLEEPERS ARE RUNNING. THE HIVE DIVIDES ITS ATTENTION.');
    }
  } }, 2600);
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
  // reset the segment being attempted (and the core wave if applicable)
  if (seg >= 1 && seg <= 4) spawnSegment(seg);
  if (seg === 4){
    G.waveSpawned = 0; G.waveT = 2; G.plantProgress = 0; G.planting = false;
    // remove wave drones
    for (let i = drones.length-1; i >= 0; i--){
      if (drones[i].segment === 9){ scene.remove(drones[i].mesh); if (drones[i].w) scene.remove(drones[i].w.grp); drones.splice(i,1); }
    }
  }
  projectiles.forEach(p=>scene.remove(p.mesh)); projectiles.length = 0;
  yawObj.position.set(G.checkpoint.pos.x, PLAYER_EYE, G.checkpoint.pos.z);
  G.yaw = G.checkpoint.yaw; G.pitch = 0;
  G.hp = 100; G.lastDamageT = G.time; G.detect = 0;
  el.redFade.style.opacity = 0;
  G.mode = 'play';
}

/* ============================================================
   Player movement
   ============================================================ */
const _fwd = new THREE.Vector3(), _right = new THREE.Vector3();
function updatePlayer(dt){
  let mx = 0, mz = 0;
  if (keys['KeyW'] || keys['ArrowUp'])    mz -= 1;
  if (keys['KeyS'] || keys['ArrowDown'])  mz += 1;
  if (keys['KeyA'] || keys['ArrowLeft'])  mx -= 1;
  if (keys['KeyD'] || keys['ArrowRight']) mx += 1;
  if (stick.active){ mx += stick.dx; mz += stick.dy; }
  const len = Math.hypot(mx, mz);
  if (len > 1){ mx/=len; mz/=len; }

  yawObj.rotation.y = G.yaw;
  pitchObj.rotation.x = G.pitch;

  _fwd.set(-Math.sin(G.yaw), 0, -Math.cos(G.yaw));
  _right.set(Math.cos(G.yaw), 0, -Math.sin(G.yaw));
  yawObj.position.addScaledVector(_fwd, -mz * MOVE_SPEED * (G.spdMul||1) * dt);
  yawObj.position.addScaledVector(_right, mx * MOVE_SPEED * (G.spdMul||1) * dt);
  collide(yawObj.position, PLAYER_R);
  yawObj.position.y = PLAYER_EYE + (len > .1 ? Math.sin(G.time*11)*.03 : 0);

  // camera shake
  if (G.shakeT > 0){
    G.shakeT -= dt;
    camera.position.set((Math.random()-.5)*.02, (Math.random()-.5)*.02, 0);
  } else camera.position.set(0,0,0);

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

  // rifle pickup
  if (!G.hasRifle && !CH.stealth){
    const d = yawObj.position.distanceTo(rifleFloor.position);
    el.prompt.style.display = 'block';
    el.prompt.textContent = 'RETRIEVE THE PULSE RIFLE';
    if (d < 1.6) pickupRifle();
  }
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
  G.currentSegment = 0;
  setObjectiveText();
  setTimeout(setObjectiveText, 50);
}

/* ============================================================
   Alarm visuals + misc FX
   ============================================================ */
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
  if (muzzleLight.intensity > 0)
    muzzleLight.intensity = Math.max(0, muzzleLight.intensity - dt*300);
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
   Intro sequence (Scene 1: Awakening)
   ============================================================ */
let introState = null;
function startIntro(){
  el.start.style.display = 'none';
  AudioSys.init();
  AudioSys.resume();
  AudioSys.heartbeatStart();
  MusicSys.start();
  if (CH.cinematic){
    // the book's opening scene plays first, then the hive awakening
    G.mode = 'cinematic';
    introStartT = performance.now();
    el.intro.style.display = 'flex';
    el.intro.style.background = 'transparent';
    Cinematic.start(beginWakeIntro);
    showSkip();
    return;
  }
  introStartT = performance.now();
  beginWakeIntro();
}
function beginWakeIntro(){
  G.mode = 'intro';
  el.intro.style.display = 'flex';
  // the hive is visible behind the text from the first frame: no black wait
  el.intro.style.background = 'rgba(0,0,0,.45)';
  el.fade.style.transition = 'opacity .6s';
  el.fade.style.background = '#000';
  el.fade.style.opacity = 0;
  // lying on the floor, looking up
  yawObj.position.set(0, .35, 0);
  G.pitch = 1.1; pitchObj.rotation.x = G.pitch;
  introState = { line: 0, t: 0, phase: 'lines', riseT: 0 };
  showSkip();
}
const WAKE_HOLD = 2.3;   // seconds per wake-up line (was 3.6 on a black screen)
function updateIntro(dt){
  const s = introState;
  if (!s) return;
  s.t += dt;
  if (s.phase === 'lines'){
    if (s.line < INTRO_LINES.length){
      if (s.t > .15 && !s.shown){
        el.introText.textContent = INTRO_LINES[s.line];
        el.introText.style.opacity = 1;
        s.shown = true;
      }
      if (s.t > Math.min(WAKE_HOLD + 1, 1.3 + INTRO_LINES[s.line].length * .02)){
        el.introText.style.opacity = 0;
        s.line++; s.t = 0; s.shown = false;
      }
    } else {
      s.phase = 'rise'; s.t = 0;
      el.intro.style.background = 'transparent';
      el.introText.style.display = 'none';
    }
  }
  else if (s.phase === 'rise'){
    const k = Math.min(1, s.t / 1.6);
    const e = k*k*(3-2*k); // smoothstep
    yawObj.position.y = .35 + (PLAYER_EYE - .35) * e;
    G.pitch = 1.1 * (1 - e);
    pitchObj.rotation.x = G.pitch;
    if (k >= 1) finishIntro();
  }
}
function finishIntro(skipAll){
  introState = null;
  AudioSys.heartbeatStop();
  el.intro.style.display = 'none';
  el.intro.style.background = '';
  el.introText.style.display = '';
  el.introText.style.transition = '';
  el.introText.style.opacity = 0;
  el.skipBtn.style.opacity = 0;
  el.fade.style.transition = skipAll ? 'none' : 'opacity 1s';
  el.fade.style.background = '#000';
  el.fade.style.opacity = 0;
  yawObj.position.set(0, PLAYER_EYE, 0);
  G.pitch = 0; G.yaw = 0;
  G.mode = 'play';
  hudVisible(true);
  if (IS_TOUCH){ el.stickZone.style.display='block'; el.lookZone.style.display='block'; }
  else if (!pointerLocked){ try { const r = renderer.domElement.requestPointerLock(); if (r && r.catch) r.catch(()=>{}); } catch(e){} }
  if (!CH.stealth && (skipAll || CH.startArmed)) pickupRifle();
  if (CH.stealth) radio('pickup');
  if (CH.id === 'ch_together') spawnCompanion();
  renderPerks();
  setObjectiveText();
}
// SKIP: visible at once, and the button, a click or tap anywhere on the
// intro, or any key all skip immediately (no waiting on fades).
function showSkip(){ el.skipBtn.style.transition = 'none'; el.skipBtn.style.opacity = .85; }
let introStartT = 0;
function skipIntro(){
  if (G.mode !== 'cinematic' && G.mode !== 'intro') return false;
  if (performance.now() - introStartT < 180) return false;   // ignore the ENTER press itself
  el.introText.style.transition = 'none';
  if (G.mode === 'cinematic') Cinematic.skip();
  finishIntro(true);
  return true;
}
el.skipBtn.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); skipIntro(); });
el.skipBtn.addEventListener('click', e => { e.stopPropagation(); skipIntro(); });
el.intro.addEventListener('pointerdown', e => { if (e.target !== el.skipBtn) skipIntro(); });
addEventListener('keydown', e => {
  if ((G.mode === 'cinematic' || G.mode === 'intro') && !e.repeat){
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
function sToast(text, ember){
  sEl.toast.textContent = '◆ ' + text;
  sEl.toast.className = 'show' + (ember ? ' ember' : '');
  clearTimeout(sToastTimer);
  sToastTimer = setTimeout(()=>{ sEl.toast.className=''; }, 3600);
}

const Story = (() => {
  let beats = [], bi = 0, sayT = 0, cState = null, active = false;
  function start(list){
    if (active || G.mode === 'dead' || G.mode === 'end') return;
    active = true; beats = list; bi = 0;
    G.mode = 'story';
    resetInputs();
    if (document.pointerLockElement) document.exitPointerLock();
    document.body.classList.add('cine');
    sEl.wrap.style.display = 'block';
    next();
  }
  function next(){
    const b = beats[bi++];
    if (!b){ return finish(); }
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
    sEl.text.textContent = text;
    sEl.text.className = who ? '' : 'narr';
    sayT = Math.max(3.4, text.length * .06);
    if (Cast) Cast.speak(who);
  }
  function showChoice(c){
    if (Cast) Cast.silence();
    sEl.dlg.style.display = 'none';
    sEl.opts.innerHTML = '';
    const opts = c.options;
    function pick(o){
      if (o.locked) return;
      sEl.choice.style.display = 'none';
      cState = null;
      SCHOICES.push({ q: c.record, a: o.label.replace(/[\[\]]/g,'') });
      if (o.flags) Object.assign(SFLAGS, o.flags);
      if (o.apply) o.apply();
      if (o.toast) sToast(o.toast, o.ember);
      renderPerks();
      if (Cast && !o.silent) Cast.nod('MARCUS');
      AudioSys.doorOpen();
      if (o.end){ finishEnding(o.end === 'RUNCHECK' ? (SFLAGS.trusted ? 'together' : 'lone') : o.end); return; }
      next();
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
    cState = { opts, pick, t: c.timer || 8, total: c.timer || 8, locked: o => o.req && !SFLAGS[o.req] };
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
  function advance(){
    if (G.mode !== 'story' || cState) return;
    next();
  }
  function update(dt){
    if (G.mode !== 'story') return;
    if (cState){
      cState.t -= dt;
      const k = Math.max(0, cState.t / cState.total);
      sEl.timerFill.style.width = (k*100) + '%';
      sEl.timerFill.className = k < .33 ? 'hot' : '';
      if (cState.t <= 0){
        const usable = cState.opts.filter(o => !cState.locked(o));
        const def = usable.find(o => o.silent) || usable[usable.length-1];
        cState.pick(def);
      }
      return;
    }
    sayT -= dt;
    if (sayT <= 0) advance();
  }
  return { start, advance, update, finish,
    pickIndex(i){ if (cState && cState.opts[i] && !cState.locked(cState.opts[i])) cState.pick(cState.opts[i]); },
    inChoice(){ return !!cState; } };
})();

/* story input: taps advance, 1-3 pick */
addEventListener('pointerdown', e => {
  if (G.mode !== 'story') return;
  if (e.target.closest('.opt') || e.target.closest('.btn')) return;
  Story.advance();
});
addEventListener('keydown', e => {
  if (G.mode !== 'story') return;
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

const FINALE_BEATS = [
  { say:['LEDGER', 'SUBJECT M-1. UNREGISTERED. REMAIN WHERE YOU ARE.'] },
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
const BEATSETS = {
  ep1:        { door1:SHELTER_BEATS, door2:VOICE_BEATS, finale:FINALE_BEATS },
  ch_taken:   { door1:TK_MID, finale:TK_FINALE },
  ch_ghost:   { door1:GH_MID, finale:GH_FINALE },
  ch_together:{ door1:TW_MID, finale:TW_FINALE },
  ch_lone:    { door1:LN_MID, finale:LN_FINALE },
  ch_counting:{ door1:CT_MID, finale:CT_FINALE },
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
function finishEnding(id){
  loadCover();
  const E = ENDING_TEXT[id];
  G.mode = 'extracting';
  Story.finish();
  sEl.endName.textContent = 'ENDING: ' + E.name;
  document.getElementById('endTitle').textContent = E.title;
  document.getElementById('endSub').textContent = E.sub;
  let f = [];
  try { f = JSON.parse(localStorage.getItem(EKEY)) || []; } catch(e){}
  if (!f.includes(id)){ f.push(id); try { localStorage.setItem(EKEY, JSON.stringify(f)); } catch(e){} }
  sEl.endTracker.textContent = 'ENDINGS RECOVERED: ' + f.length + ' / 14';
  if (CH.id === 'ep1'){
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
      cont.onclick = () => { location.hash = E.next; location.reload(); };
    }
  } else if (CH.id !== 'ch_counting'){
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
    cont.onclick = () => { location.hash = '#ch_counting'; location.reload(); };
  }
  sEl.endSummary.innerHTML = SCHOICES.length
    ? '<b>YOUR CHOICES:</b><br>' + SCHOICES.map(c => '▸ ' + c.q + '. <b>' + c.a + '</b>').join('<br>')
    : '';
  if (id === 'together' || id === 'lone') radio('extract');
  AudioSys.extract();
  el.fade.style.transition = 'opacity 2.8s';
  el.fade.style.background = (id === 'taken') ? '#fff' : '#000';
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
function makeCivvy(o){
  o = o || {};
  const M = (c, r=.85) => new THREE.MeshStandardMaterial({ color:c, roughness:r });
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
  const m = makeCivvy({ jacket:0x2e3a2c, pants:0x20241f, ponytail:true, armed:true, scarf:0x7a3322, hair:0x171009, skin:0x9a8a76 });
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
  box.innerHTML = chips.map(c => '<div class="pchip">' + c + '</div>').join('');
}

/* ============================================================
   Recurring cast (people.js). Fixed seeds, defined ONCE.
   A transparent LATMPeople stage shows the current speaker
   behind the dialogue UI during story beats. CreateStage runs
   its own loop, so the game loop does not call LATMPeople.update.
   ============================================================ */
const Cast = (() => {
  if (!window.LATMPeople) return null;
  const div = document.getElementById('castStage');
  if (!div) return null;
  const stage = LATMPeople.createStage(div, { transparent: true, ground: false, fog: false });
  stage.camera.position.set(0, 1.52, 1.85);
  stage.camera.lookAt(0, 1.32, 0);
  const CAST_DEFS = {
    MARCUS: { seed:'marcus', hood:false, mask:false, coat:0x3f4a45, pack:true,  height:1.8,  hair:0x2b2118, limp:false },
    REYES:  { seed:'reyes',  hood:false, mask:false, coat:0x2e3a2c, pack:false, height:1.68, hair:0x171009, wrap:0x7a3322, limp:true },
    KARA:   { seed:'kara',   hood:true,  mask:false, coat:0x555b52, pack:true,  height:1.72, wrap:0x5d6b4a, limp:false },
    LEDGER: { seed:'ledger', role:'machine', glow:0xff3b30, height:1.95 },
  };
  const members = {};
  for (const name of Object.keys(CAST_DEFS)){
    const c = LATMPeople.createCharacter(CAST_DEFS[name]);
    c.visible = false;
    c.userData.faceToward(0, 5);   // face the stage camera
    stage.scene.add(c);
    members[name] = c;
  }
  let active = null;
  return {
    members, stage,
    speak(who){
      const c = members[who];
      if (active && active !== c){ active.userData.setTalking(false); active.visible = false; }
      active = c || null;
      div.style.opacity = c ? 1 : 0;
      if (c){ c.visible = true; c.userData.setTalking(true); }
    },
    silence(){
      if (active) active.userData.setTalking(false);
      div.style.opacity = 0;
    },
    nod(who){
      const c = members[who || 'MARCUS'];
      if (c) c.userData.playEmote('nod');
    },
  };
})();

/* ============================================================
   Boot / title / replay
   ============================================================ */
el.startBtn.addEventListener('click', () => {
  AudioSys.init(); AudioSys.resume();
  startIntro();
});
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

// debug hook (console-only; not used by game logic)
window.__LATM = { Q, FX, applyQuality, Warm, Cinematic, loadCover, scene, camera, renderer, ROOMS, plantComplete, showEndCard, G, drones, yawObj, finishIntro, pickupRifle, damageDrone, MusicSys, postFX, Story, SFLAGS, SCHOICES, FINALE_BEATS, SHELTER_BEATS, VOICE_BEATS, finishEnding, CB, BEATSETS, getComp: () => COMP, Cast };

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
  const nowT = performance.now();
  let dt = (nowT - lastT) / 1000;
  lastT = nowT;
  dt = Math.min(dt, 0.05); // clamp tab-switch spikes
  if (window.__LATM && window.__LATM.fixedDt) dt = window.__LATM.fixedDt; // offline capture
  if (window.__LATM && window.__LATM.capture){ // frame-stepped capture
    if (window.__LATM.stepFrames > 0){ dt = 1/24; window.__LATM.stepFrames--; }
    else dt = 0;
  }
  G.time += dt;

  if (G.mode === 'cinematic'){ Cinematic.update(dt); return; } // renders its own scene
  if (G.mode === 'intro') updateIntro(dt);
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
    updateWave(dt);
    updateObjective(dt);
    updateRadio(dt);
    if (G.time - (G.musicT || 0) > .5){
      G.musicT = G.time;
      MusicSys.setMode(
        CH.stealth ? (G.detect > 55 ? 'combat' : (G.alarm && !G.planted ? 'alarm' : 'calm')) :
        G.alarm && !G.planted ? 'alarm' :
        drones.some(d => d.alive && d.state === 'attack') ? 'combat' : 'calm');
    }
  }
  if (G.mode === 'story'){ Story.update(dt); updateRadio(dt); }
  if (G.mode === 'dead' || G.mode === 'extracting'){
    updateRadio(dt);
    if (!CH.stealth) updateDrones(dt);
  }
  // quality governor (disabled during scripted capture)
  if (G.mode === 'play' && !(window.__LATM && window.__LATM.capture)) governor(nowT);
  updateFX(dt);
  if (G.mode === 'title' || G.mode === 'end') return;   // opaque screens cover the level
  renderFrame(scene, camera);
}
loop();

export function bootWaking() {
  return true;
}
