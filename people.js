/*
============================================================
LIFE AFTER THE MACHINES, CINEMATIC PEOPLE MODULE (people.js)
Procedural 3D characters authored entirely in code.
No asset files. No dependencies beyond global THREE.
Works with Three.js r120+ (no CapsuleGeometry, no new APIs).

Built for the Telltale-style cinematic layer of the LATM
narrative game. Supports named recurring characters that look
identical in every scene, background survivor crowds, hive
machines, talking, emotes, and staged walking.

CLAUDE CODE INTEGRATION INSTRUCTIONS
1. Copy this file into the game repo next to index.html.
2. Discover the current setup first:
   a. If the repo already has a Three.js scene: add
      <script src="people.js"></script> after the Three tag,
      add characters to the existing scene, and call
      LATMPeople.update(dt) inside the existing animate loop.
   b. If the game is DOM-only (text and choices, no canvas):
      add a Three.js r128 CDN script tag, then people.js, then
      mount a cinematic canvas behind or above the dialogue UI:
        const stage = LATMPeople.createStage(
          document.getElementById("cinematic"));
      createStage builds renderer, camera, fog, light, ground,
      and runs its own loop that calls LATMPeople.update.
3. Define the recurring cast ONCE with fixed seeds so each
   character is identical in every scene and episode:
     const marcus = LATMPeople.createCharacter({
       seed: "marcus", hood: false, mask: false,
       coat: 0x3f4a45, pack: true, height: 1.8
     });
     stage.scene.add(marcus);
     marcus.position.set(-0.7, 0, 0);
     marcus.userData.faceToward(0.7, 0);
   Map each book character's described look onto the options.
4. Wire the narrative engine to the characters:
     on dialogue line start: speaker.userData.setTalking(true)
     on dialogue line end:   speaker.userData.setTalking(false)
     on beats: speaker.userData.playEmote("nod")
     scene moves: marcus.userData.walkTo(2, 1, onArrive)
5. Background extras, survivors plus patrolling machines:
     const crowd = new LATMPeople.CrowdSystem(stage.scene, {
       count: 10, bounds: { minX: -12, maxX: 12, minZ: -14, maxZ: -4 }
     });
     crowd.update(dt) each frame (createStage loop does NOT
     call this, wire it via stage onFrame or the game loop).
6. Use targeted Python str_replace edits with assert guards,
   then run: node --check people.js

CHARACTER OPTIONS (createCharacter)
  seed: string or number, same seed = same look every time
  role: "survivor" (default) | "machine" | "kid"
  height: world units, default 1.75, match the game scale
  coat, pants, skin, hair, wrap: hex color overrides
  hood, mask, pack, limp: booleans, force feature on or off
  glow: hex, machine visor color
  materialFactory: (colorHex) => material, to reuse the game's
    own material style. Defaults to MeshToonMaterial.

PER CHARACTER API (on group.userData)
  update(dt)              advance animation (auto via LATMPeople.update)
  setTalking(bool)        mouth and gesture loop while speaking
  playEmote(name, dur?)   "nod" "shake" "point" "wave" "slump"
  walkTo(x, z, onArrive?) walk to a mark, then idle
  faceToward(x, z)        turn the body toward a point
  lookAtPoint(x, y, z)    aim the head, clearLook() to release

MODULE API
  LATMPeople.createCharacter(opts)   named cast, deterministic
  LATMPeople.createSurvivor(opts)    random survivor extra
  LATMPeople.createMachine(opts)     hive machine unit
  LATMPeople.CrowdSystem(scene, opts) wandering extras
  LATMPeople.createStage(container, opts) full canvas bootstrap
  LATMPeople.update(dt)              animates every character
  LATMPeople.remove(person)          unregister and detach
============================================================
*/

(function (global) {
  "use strict";

  var PALETTE = {
    skin:  [0xd8c4ae, 0xc9a98c, 0xa87f5f, 0x8a6448, 0x6e4e38, 0xbfae9e],
    coat:  [0x4a4a48, 0x5c584f, 0x6b4f3a, 0x3f4a45, 0x555b52, 0x704a3a, 0x8a8578, 0x2e2b28],
    pants: [0x3a3733, 0x4d443c, 0x2e3230, 0x5a5248, 0x433a35],
    wrap:  [0x9c4a2f, 0x7d3b34, 0x5d6b4a, 0x99803f, 0x6e6a60],
    hair:  [0x1b1b1e, 0x3b2d23, 0x54452f, 0x6e6259, 0x9c9184, 0x5a2e24],
    metal: [0x7d8285, 0x5f6468, 0x8f8a7f, 0x6a6f73],
    glow:  [0xff3b30, 0xffb347, 0x7ddfff]
  };

  var CANON_HEIGHT = 1.10;
  var geoCache = {};
  var matCache = {};
  var registry = [];

  function hashSeed(s) {
    s = String(s);
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function geo(key, make) {
    if (!geoCache[key]) geoCache[key] = make();
    return geoCache[key];
  }

  function defaultMaterial(color) {
    var key = "m" + color;
    if (!matCache[key]) {
      var M = global.THREE.MeshToonMaterial || global.THREE.MeshLambertMaterial;
      matCache[key] = new M({ color: color });
    }
    return matCache[key];
  }

  function glowMaterial(color) {
    var key = "g" + color;
    if (!matCache[key]) {
      matCache[key] = new global.THREE.MeshBasicMaterial({ color: color });
    }
    return matCache[key];
  }

  function mesh(g, material) {
    var m = new global.THREE.Mesh(g, material);
    m.castShadow = true;
    return m;
  }

  function wrapAngle(a) {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  }

  // ---------------------------------------------------------
  // Character construction
  // ---------------------------------------------------------

  function createCharacter(opts) {
    opts = opts || {};
    var THREE = global.THREE;
    var mat = opts.materialFactory || defaultMaterial;
    var rng = (opts.seed !== undefined) ? mulberry32(hashSeed(opts.seed)) : Math.random;
    function rr(min, max) { return min + rng() * (max - min); }
    function rpick(list) { return list[Math.floor(rng() * list.length)]; }
    function flag(name, chance) {
      return (opts[name] !== undefined) ? !!opts[name] : (rng() < chance);
    }

    var role = opts.role || "survivor";
    var isMachine = role === "machine";
    var isKid = role === "kid";

    var skin = opts.skin !== undefined ? opts.skin : rpick(PALETTE.skin);
    var coat = opts.coat !== undefined ? opts.coat : rpick(PALETTE.coat);
    var pants = opts.pants !== undefined ? opts.pants : rpick(PALETTE.pants);
    var wrapC = opts.wrap !== undefined ? opts.wrap : rpick(PALETTE.wrap);
    var hairC = opts.hair !== undefined ? opts.hair : rpick(PALETTE.hair);
    var metal = rpick(PALETTE.metal);
    var glowC = opts.glow !== undefined ? opts.glow : rpick(PALETTE.glow);
    if (isMachine) { skin = metal; coat = metal; pants = rpick(PALETTE.metal); }

    var hood = !isMachine && flag("hood", 0.5);
    var maskOn = !isMachine && flag("mask", 0.35);
    var pack = !isMachine && flag("pack", 0.45);
    var limp = !isMachine && flag("limp", 0.2);

    var root = new THREE.Group();
    var rig = new THREE.Group();
    root.add(rig);

    var hipY = 0.50;
    var torsoH = 0.34;
    var headR = 0.12;
    var legLen = 0.46;
    var armLen = 0.40;

    // Torso. Survivor coats flare at the hem, machines are straight.
    var torsoGeo = isMachine
      ? geo("torsoM", function () { return new THREE.CylinderGeometry(0.12, 0.12, torsoH, 8); })
      : geo("torsoS", function () { return new THREE.CylinderGeometry(0.115, 0.145, torsoH, 8); });
    var torso = mesh(torsoGeo, mat(coat));
    torso.position.y = hipY + torsoH / 2;
    torso.scale.x = rr(0.92, 1.1);
    rig.add(torso);

    // Head
    var headG = new THREE.Group();
    headG.position.y = hipY + torsoH + 0.02 + headR;
    rig.add(headG);
    var head = mesh(
      geo("head", function () { return new THREE.SphereGeometry(headR, 10, 8); }),
      mat(skin)
    );
    headG.add(head);
    if (isKid) headG.scale.setScalar(1.22);

    var mouth = null;
    var visorMat = null;

    if (isMachine) {
      visorMat = glowMaterial(glowC).clone();
      var visor = new THREE.Mesh(
        geo("visor", function () { return new THREE.BoxGeometry(0.14, 0.035, 0.02); }),
        visorMat
      );
      visor.position.set(0, 0.012, headR * 0.95);
      headG.add(visor);
      var mast = mesh(
        geo("mast", function () { return new THREE.CylinderGeometry(0.006, 0.006, 0.1, 5); }),
        mat(pants)
      );
      mast.position.y = headR + 0.05;
      headG.add(mast);
      var tip = new THREE.Mesh(
        geo("tip", function () { return new THREE.SphereGeometry(0.014, 6, 5); }),
        visorMat
      );
      tip.position.y = headR + 0.1;
      headG.add(tip);
    } else {
      var eyeG = geo("eye", function () { return new THREE.SphereGeometry(0.015, 6, 6); });
      var eyeM = mat(0x241f1c);
      var eL = mesh(eyeG, eyeM); eL.position.set(-0.044, 0.014, headR * 0.86); headG.add(eL);
      var eR = mesh(eyeG, eyeM); eR.position.set(0.044, 0.014, headR * 0.86); headG.add(eR);

      mouth = mesh(
        geo("mouth", function () { return new THREE.BoxGeometry(0.05, 0.012, 0.012); }),
        mat(0x40342e)
      );
      mouth.position.set(0, -0.048, headR * 0.9);
      headG.add(mouth);

      if (hood) {
        var hd = mesh(
          geo("hood", function () { return new THREE.SphereGeometry(headR * 1.28, 10, 8); }),
          mat(wrapC)
        );
        hd.position.set(0, 0.02, -0.045);
        hd.scale.set(1.02, 1.08, 1.12);
        headG.add(hd);
        var collar = mesh(
          geo("collar", function () { return new THREE.CylinderGeometry(0.15, 0.19, 0.1, 8); }),
          mat(wrapC)
        );
        collar.position.y = -0.14;
        headG.add(collar);
      } else {
        var hair = mesh(
          geo("hair", function () { return new THREE.SphereGeometry(headR * 1.04, 10, 8); }),
          mat(hairC)
        );
        hair.position.set(0, 0.028, -0.014);
        hair.scale.set(1, 0.7, 1);
        headG.add(hair);
      }

      if (maskOn) {
        var mk = mesh(
          geo("mask", function () { return new THREE.BoxGeometry(0.11, 0.07, 0.05); }),
          mat(0x57534a)
        );
        mk.position.set(0, -0.034, headR * 0.78);
        headG.add(mk);
        var can = mesh(
          geo("can", function () {
            var c = new THREE.CylinderGeometry(0.028, 0.028, 0.03, 8);
            return c;
          }),
          mat(0x6e6a60)
        );
        can.rotation.x = Math.PI / 2;
        can.position.set(0, -0.05, headR * 1.02);
        headG.add(can);
      }
    }

    // Arms
    function makeArm(side) {
      var g = new THREE.Group();
      g.position.set(0.155 * side, hipY + torsoH - 0.03, 0);
      var arm = mesh(
        geo("arm", function () { return new THREE.CylinderGeometry(0.041, 0.034, armLen, 7); }),
        mat(coat)
      );
      arm.position.y = -armLen / 2;
      g.add(arm);
      var hand = mesh(
        geo("hand", function () { return new THREE.SphereGeometry(0.042, 7, 6); }),
        mat(isMachine ? metal : skin)
      );
      hand.position.y = -armLen;
      g.add(hand);
      rig.add(g);
      return g;
    }
    var armL = makeArm(-1);
    var armR = makeArm(1);

    // Legs
    function makeLeg(side) {
      var g = new THREE.Group();
      g.position.set(0.065 * side, hipY, 0);
      var leg = mesh(
        geo("leg", function () { return new THREE.CylinderGeometry(0.054, 0.044, legLen, 7); }),
        mat(pants)
      );
      leg.position.y = -legLen / 2;
      g.add(leg);
      var boot = mesh(
        geo("boot", function () { return new THREE.BoxGeometry(0.095, 0.055, 0.15); }),
        mat(0x241f1c)
      );
      boot.position.set(0, -legLen - 0.012, 0.02);
      g.add(boot);
      rig.add(g);
      return g;
    }
    var legL = makeLeg(-1);
    var legR = makeLeg(1);

    if (pack) {
      var bp = mesh(
        geo("pack", function () { return new THREE.BoxGeometry(0.2, 0.26, 0.1); }),
        mat(0x4d443c)
      );
      bp.position.set(0, hipY + torsoH - 0.1, -0.16);
      rig.add(bp);
    }

    // Weary survivor posture. Machines stand rigid.
    var lean = isMachine ? 0 : rr(0.03, 0.08);
    var headBaseX = isMachine ? 0 : rr(0.03, 0.09);
    rig.rotation.x = lean;
    headG.rotation.x = headBaseX;

    var height = (opts.height || 1.75) * (isKid ? 0.62 : 1) * (opts.seed !== undefined ? 1 : rr(0.95, 1.05));
    root.scale.setScalar(height / CANON_HEIGHT);

    var ud = root.userData;
    ud.isPerson = true;
    ud.role = role;
    ud._parts = { rig: rig, headG: headG, armL: armL, armR: armR, legL: legL, legR: legR, mouth: mouth, visorMat: visorMat };
    ud._base = { lean: lean, headX: headBaseX };
    ud._prm = {
      armAmp: isMachine ? 0.16 : 0.45,
      legAmp: 0.6,
      bob: isMachine ? 0.015 : 0.03,
      limpL: 1,
      limpR: limp ? 0.35 : 1,
      speed: (isMachine ? 1.1 : rr(0.7, 1.2)) * (limp ? 0.7 : 1) * (height / 1.75)
    };
    ud.clock = rr(0, 100);
    ud.phase = rr(0, 100);
    ud.talking = false;
    ud._talkW = 0;
    ud._w = 0;
    ud._walk = null;
    ud._face = null;
    ud._look = null;
    ud._emote = null;
    ud.managed = false;

    attachBehavior(root);
    registry.push(root);
    return root;
  }

  function createSurvivor(opts) {
    opts = opts || {};
    opts.role = "survivor";
    return createCharacter(opts);
  }

  function createMachine(opts) {
    opts = opts || {};
    opts.role = "machine";
    return createCharacter(opts);
  }

  // ---------------------------------------------------------
  // Animation and behavior
  // ---------------------------------------------------------

  function animWalk(person, t, w) {
    var p = person.userData._parts;
    var b = person.userData._base;
    var k = person.userData._prm;
    var s = Math.sin(t);
    p.legL.rotation.x = s * k.legAmp * w * k.limpL;
    p.legR.rotation.x = -s * k.legAmp * w * k.limpR;
    p.armL.rotation.x = -s * k.armAmp * w;
    p.armR.rotation.x = s * k.armAmp * w;
    p.rig.position.y = Math.abs(s) * k.bob * w;
    p.rig.rotation.x = b.lean + Math.sin(t * 2) * 0.008 * w;
  }

  function animIdle(person, t, w) {
    var p = person.userData._parts;
    var b = person.userData._base;
    var iw = 1 - w;
    p.legL.rotation.x *= 0.88;
    p.legR.rotation.x *= 0.88;
    p.armL.rotation.x *= 0.88;
    p.armR.rotation.x *= 0.88;
    p.rig.position.y *= 0.88;
    p.rig.rotation.x = b.lean;
    if (person.userData.role === "machine") {
      if (!person.userData._look) p.headG.rotation.y = Math.sin(t * 0.35) * 0.5 * iw;
      if (p.visorMat) p.visorMat.opacity = 1;
    } else {
      p.rig.rotation.z = Math.sin(t * 1.3) * 0.014 * iw;
      if (!person.userData._look) p.headG.rotation.y = Math.sin(t * 0.45) * 0.28 * iw;
    }
  }

  function applyTalking(person, dt) {
    var ud = person.userData;
    var p = ud._parts;
    ud._talkW += ((ud.talking ? 1 : 0) - ud._talkW) * Math.min(1, dt * 7);
    var tw = ud._talkW;
    if (tw < 0.01) {
      if (p.mouth) p.mouth.scale.y = 1;
      return;
    }
    if (p.mouth) {
      p.mouth.scale.y = 1 + Math.abs(Math.sin(ud.clock * 11)) * 2.2 * tw;
    }
    if (p.visorMat) {
      p.visorMat.color.multiplyScalar(1);
      p.visorMat.transparent = true;
      p.visorMat.opacity = 0.55 + Math.abs(Math.sin(ud.clock * 10)) * 0.45 * tw;
    }
    p.headG.rotation.x = ud._base.headX + Math.sin(ud.clock * 9) * 0.02 * tw;
    p.armR.rotation.x += (-0.14 + Math.sin(ud.clock * 2.6) * 0.16) * tw;
  }

  var EMOTES = {
    nod:   { dur: 0.9 },
    shake: { dur: 1.0 },
    point: { dur: 1.5 },
    wave:  { dur: 1.6 },
    slump: { dur: 2.4 }
  };

  function applyEmote(person, dt) {
    var ud = person.userData;
    var e = ud._emote;
    if (!e) return;
    e.t += dt;
    var p = ud._parts;
    var b = ud._base;
    var pr = e.t / e.dur;
    if (pr >= 1) { ud._emote = null; return; }
    var env = pr < 0.2 ? pr / 0.2 : (pr > 0.8 ? (1 - pr) / 0.2 : 1);
    if (e.name === "nod") {
      p.headG.rotation.x = b.headX + Math.sin(pr * Math.PI * 3) * 0.3 * (1 - pr);
    } else if (e.name === "shake") {
      p.headG.rotation.y += Math.sin(pr * Math.PI * 4) * 0.4 * (1 - pr);
    } else if (e.name === "point") {
      p.armR.rotation.x = -1.45 * env;
    } else if (e.name === "wave") {
      p.armR.rotation.x = -2.6 * env;
      p.armR.rotation.z = Math.sin(e.t * 10) * 0.35 * env;
    } else if (e.name === "slump") {
      p.rig.rotation.x = b.lean + 0.18 * env;
      p.headG.rotation.x = b.headX + 0.26 * env;
      p.armL.rotation.x = 0.15 * env;
      p.armR.rotation.x = 0.15 * env;
    }
  }

  function applyLook(person, dt) {
    var ud = person.userData;
    if (!ud._look) return;
    var p = ud._parts;
    var THREE = global.THREE;
    var headPos = new THREE.Vector3();
    p.headG.getWorldPosition(headPos);
    var dx = ud._look.x - headPos.x;
    var dy = ud._look.y - headPos.y;
    var dz = ud._look.z - headPos.z;
    var flat = Math.sqrt(dx * dx + dz * dz) || 0.0001;
    var yaw = wrapAngle(Math.atan2(dx, dz) - person.rotation.y);
    yaw = Math.max(-0.9, Math.min(0.9, yaw));
    var pitch = Math.max(-0.5, Math.min(0.5, Math.atan2(dy, flat)));
    p.headG.rotation.y += (yaw - p.headG.rotation.y) * Math.min(1, dt * 6);
    p.headG.rotation.x += ((ud._base.headX - pitch) - p.headG.rotation.x) * Math.min(1, dt * 6);
  }

  function stepToward(person, tx, tz, dt) {
    var ud = person.userData;
    var dx = tx - person.position.x;
    var dz = tz - person.position.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 0.22) return true;
    var desired = Math.atan2(dx, dz);
    var d = wrapAngle(desired - person.rotation.y);
    person.rotation.y += d * Math.min(1, dt * 5);
    var step = Math.min(ud._prm.speed * dt, dist);
    person.position.x += Math.sin(person.rotation.y) * step;
    person.position.z += Math.cos(person.rotation.y) * step;
    return false;
  }

  function attachBehavior(person) {
    var ud = person.userData;

    ud.setTalking = function (on) { ud.talking = !!on; };

    ud.playEmote = function (name, dur) {
      if (!EMOTES[name]) return;
      ud._emote = { name: name, t: 0, dur: dur || EMOTES[name].dur };
    };

    ud.walkTo = function (x, z, onArrive) {
      ud._walk = { x: x, z: z, cb: onArrive || null };
    };

    ud.faceToward = function (x, z) {
      ud._face = Math.atan2(x - person.position.x, z - person.position.z);
    };

    ud.lookAtPoint = function (x, y, z) { ud._look = { x: x, y: y, z: z }; };
    ud.clearLook = function () { ud._look = null; };

    ud.update = function (dt) {
      ud.clock += dt;
      var t = ud.clock + ud.phase;

      if (ud._walk) {
        ud._w += (1 - ud._w) * Math.min(1, dt * 6);
        var arrived = stepToward(person, ud._walk.x, ud._walk.z, dt);
        animWalk(person, t * (3.2 + ud._prm.speed * 1.6), ud._w);
        if (arrived) {
          var cb = ud._walk.cb;
          ud._walk = null;
          if (cb) cb(person);
        }
      } else {
        ud._w += (0 - ud._w) * Math.min(1, dt * 6);
        if (ud._face !== null) {
          var d = wrapAngle(ud._face - person.rotation.y);
          person.rotation.y += d * Math.min(1, dt * 5);
          if (Math.abs(d) < 0.02) ud._face = null;
        }
        animIdle(person, t, ud._w);
      }

      applyLook(person, dt);
      applyEmote(person, dt);
      applyTalking(person, dt);
    };
  }

  // ---------------------------------------------------------
  // Crowd system for background extras
  // ---------------------------------------------------------

  function CrowdSystem(scene, opts) {
    opts = opts || {};
    this.scene = scene;
    this.bounds = opts.bounds || { minX: -15, maxX: 15, minZ: -15, maxZ: 15 };
    this.personHeight = opts.personHeight || 1.75;
    this.canWalkTo = opts.canWalkTo || null;
    this.materialFactory = opts.materialFactory || null;
    this.groundY = opts.groundY || 0;
    this.kidChance = (opts.kidChance === undefined) ? 0.1 : opts.kidChance;
    this.machineChance = (opts.machineChance === undefined) ? 0.15 : opts.machineChance;
    this.separation = opts.separation !== false;
    this.people = [];

    var count = (opts.count === undefined) ? 12 : opts.count;
    for (var i = 0; i < count; i++) {
      var p = this._randomPoint();
      if (p) this.add(p.x, p.z);
    }
  }

  CrowdSystem.prototype._randomPoint = function () {
    var b = this.bounds;
    for (var i = 0; i < 14; i++) {
      var x = b.minX + Math.random() * (b.maxX - b.minX);
      var z = b.minZ + Math.random() * (b.maxZ - b.minZ);
      if (!this.canWalkTo || this.canWalkTo(x, z)) return { x: x, z: z };
    }
    return null;
  };

  CrowdSystem.prototype.add = function (x, z) {
    var roll = Math.random();
    var role = roll < this.machineChance ? "machine"
      : (roll < this.machineChance + this.kidChance ? "kid" : "survivor");
    var person = createCharacter({
      role: role,
      height: this.personHeight,
      materialFactory: this.materialFactory
    });
    person.position.set(x || 0, this.groundY, z || 0);
    person.rotation.y = Math.random() * Math.PI * 2;
    person.userData.managed = true;
    person.userData._ai = { state: "idle", wait: Math.random() * 2 };
    this.scene.add(person);
    this.people.push(person);
    return person;
  };

  CrowdSystem.prototype.remove = function (person) {
    var i = this.people.indexOf(person);
    if (i >= 0) this.people.splice(i, 1);
    removePerson(person);
  };

  CrowdSystem.prototype.dispose = function () {
    while (this.people.length) this.remove(this.people[0]);
  };

  CrowdSystem.prototype.update = function (dt) {
    if (dt === undefined) dt = 0.016;
    if (dt > 0.1) dt = 0.1;
    for (var i = 0; i < this.people.length; i++) {
      var person = this.people[i];
      var ai = person.userData._ai;
      if (ai.state === "idle") {
        ai.wait -= dt;
        person.userData.update(dt);
        if (ai.wait <= 0) {
          var t = this._randomPoint();
          if (t) {
            person.userData.walkTo(t.x, t.z, this._onArrive(person));
            ai.state = "walking";
          } else {
            ai.wait = 1 + Math.random() * 2;
          }
        }
      } else {
        person.userData.update(dt);
      }
    }
    if (this.separation) this._separate();
  };

  CrowdSystem.prototype._onArrive = function (person) {
    var ai = person.userData._ai;
    return function () {
      ai.state = "idle";
      ai.wait = 1.5 + Math.random() * 4;
    };
  };

  CrowdSystem.prototype._separate = function () {
    var minD = 0.55;
    for (var i = 0; i < this.people.length; i++) {
      for (var j = i + 1; j < this.people.length; j++) {
        var a = this.people[i], b = this.people[j];
        var dx = b.position.x - a.position.x;
        var dz = b.position.z - a.position.z;
        var d2 = dx * dx + dz * dz;
        if (d2 > 0.0001 && d2 < minD * minD) {
          var dEst = Math.sqrt(d2);
          var push = (minD - dEst) * 0.5;
          var nx = dx / dEst, nz = dz / dEst;
          a.position.x -= nx * push; a.position.z -= nz * push;
          b.position.x += nx * push; b.position.z += nz * push;
        }
      }
    }
  };

  // ---------------------------------------------------------
  // Global update and stage bootstrap
  // ---------------------------------------------------------

  function update(dt) {
    if (dt === undefined) dt = 0.016;
    if (dt > 0.1) dt = 0.1;
    for (var i = 0; i < registry.length; i++) {
      var person = registry[i];
      if (!person.userData.managed) person.userData.update(dt);
    }
  }

  function removePerson(person) {
    var i = registry.indexOf(person);
    if (i >= 0) registry.splice(i, 1);
    if (person.parent) person.parent.remove(person);
  }

  function createStage(container, opts) {
    opts = opts || {};
    var THREE = global.THREE;
    var scene = new THREE.Scene();
    var bg = (opts.background === undefined) ? 0x504e48 : opts.background;
    if (!opts.transparent) scene.background = new THREE.Color(bg);
    if (opts.fog !== false) scene.fog = new THREE.Fog(bg, 7, 42);

    var w = container.clientWidth || 640;
    var h = container.clientHeight || 360;
    var camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 120);
    camera.position.set(0, 1.6, 3.6);
    camera.lookAt(0, 1.15, 0);

    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: !!opts.transparent });
    renderer.setPixelRatio(Math.min(global.devicePixelRatio || 1, 2));
    renderer.setSize(w, h);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    var hemi = new THREE.HemisphereLight(0x9aa0a6, 0x3a3733, 0.9);
    scene.add(hemi);
    var sun = new THREE.DirectionalLight(0xd8d2c4, 0.9);
    sun.position.set(4, 7, 3);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 1024;
    sun.shadow.mapSize.height = 1024;
    sun.shadow.camera.left = -10;
    sun.shadow.camera.right = 10;
    sun.shadow.camera.top = 10;
    sun.shadow.camera.bottom = -10;
    scene.add(sun);

    if (opts.ground !== false) {
      var ground = new THREE.Mesh(
        new THREE.CircleGeometry(60, 24),
        new (THREE.MeshToonMaterial || THREE.MeshLambertMaterial)({ color: 0x46443f })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);
    }

    var running = true;
    var last = null;
    function loop() {
      if (!running) return;
      global.requestAnimationFrame(loop);
      var now = (global.performance || Date).now();
      var dt = last === null ? 0.016 : (now - last) / 1000;
      last = now;
      update(dt);
      if (opts.onFrame) opts.onFrame(dt);
      renderer.render(scene, camera);
    }
    if (opts.autoLoop !== false) loop();

    function onResize() {
      var w2 = container.clientWidth || 640;
      var h2 = container.clientHeight || 360;
      camera.aspect = w2 / h2;
      camera.updateProjectionMatrix();
      renderer.setSize(w2, h2);
    }
    global.addEventListener("resize", onResize);

    return {
      scene: scene,
      camera: camera,
      renderer: renderer,
      dispose: function () {
        running = false;
        global.removeEventListener("resize", onResize);
        if (renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      }
    };
  }

  var API = {
    createCharacter: createCharacter,
    createSurvivor: createSurvivor,
    createMachine: createMachine,
    CrowdSystem: CrowdSystem,
    createStage: createStage,
    update: update,
    remove: removePerson,
    registry: registry,
    PALETTE: PALETTE
  };

  global.LATMPeople = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;

})(typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this));
