/* ============================================================
   humans.js : procedural human characters for The Waking.
   No third-party assets. Everything is generated at load time
   from code (geometry, face paint, hair), so there is nothing
   to download and nothing to license.

   Classic script. Reads the global THREE at call time
   (game.js sets window.THREE before it calls in here).

   WakingHumans.create(def, opts)  -> THREE.Group
     def   : a preset name ('KARA', 'THOMAS', ...) or a def object
     opts  : { lod:'high'|'med'|'low', armed:bool, rifle:Object3D }
   group.userData:
     update(dt)            breathing, blink, talk, expression
     setTalking(bool)      jaw syllables + head motion while a line shows
     setExpression(name)   'neutral' 'stern' 'worried' 'warm' 'grim'
     playEmote(name)       'nod' 'shake'
     faceToward(x, z)      turn the body toward a point
     tick(dt, moving, run) in-world walk cycle (makeCivvy compatible)
     legL legR armL armR   bones, rotation.x swings them (makeCivvy compatible)
   WakingHumans.createSleeper(opts) -> suspended body for the tubes
   WakingHumans.buildTubes(list, opts) -> { group, animate(dt,t,cam,fog) }
   ============================================================ */
(function (global) {
  'use strict';
  var T = null;
  function three(){ T = global.THREE; return T; }

  /* ---------- small helpers ---------- */
  function clamp(v,a,b){ return v < a ? a : v > b ? b : v; }
  function sstep(a,b,x){ var t = clamp((x-a)/(b-a),0,1); return t*t*(3-2*t); }
  function gauss(d,s){ return Math.exp(-(d*d)/(2*s*s)); }
  function mix(a,b,t){ return a + (b-a)*t; }
  function rng(seed){
    var h = 2166136261 >>> 0, s = String(seed);
    for (var i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return function(){
      h = (h + 0x6D2B79F5) | 0; var t = h;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hexCss(hex){ return '#' + ('000000' + (hex >>> 0).toString(16)).slice(-6); }
  function shade(hex, k){ // k<1 darker, k>1 lighter (sRGB space, for paint and vertex colours)
    var r = (hex >> 16) & 255, g = (hex >> 8) & 255, b = hex & 255;
    function f(c){ return clamp(Math.round(k < 1 ? c*k : c + (255-c)*(k-1)), 0, 255); }
    return (f(r) << 16) | (f(g) << 8) | f(b);
  }
  function mixHex(a, b, t){
    var r = Math.round(mix((a>>16)&255, (b>>16)&255, t)), g = Math.round(mix((a>>8)&255, (b>>8)&255, t)),
        bl = Math.round(mix(a&255, b&255, t));
    return (r << 16) | (g << 8) | bl;
  }
  function rgba(hex, a){ return 'rgba(' + ((hex>>16)&255) + ',' + ((hex>>8)&255) + ',' + (hex&255) + ',' + a + ')'; }
  function noise1(x, seed){
    var i = Math.floor(x), f = x - i, u = f*f*(3-2*f);
    function h(n){ var s = Math.sin((n + seed*17.13) * 127.1) * 43758.5453; return s - Math.floor(s); }
    return mix(h(i), h(i+1), u);
  }

  var LOD = {
    high: { ring:22, limb:14, headA:56, headRows:40, tex:1024, eyes:true,  brows:true,  lids:true,  hair:true },
    med:  { ring:16, limb:10, headA:40, headRows:30, tex:512,  eyes:true,  brows:true,  lids:true,  hair:true },
    low:  { ring:10, limb:7,  headA:26, headRows:20, tex:256,  eyes:false, brows:false, lids:false, hair:true },
    tiny: { ring:8,  limb:6,  headA:20, headRows:15, tex:128,  eyes:false, brows:false, lids:false, hair:false }
  };

  /* ---------- geometry assembly ----------
     Every body part is authored in model space (rest pose, facing +z,
     feet at y=0). Each vertex carries a colour and up to two bone
     weights, and all parts merge into ONE skinned mesh per character:
     a single draw call for the whole body. */
  function Builder(){ this.pos = []; this.col = []; this.si = []; this.sw = []; this.idx = []; this.n = 0; }
  Builder.prototype.addGeo = function(g, hex, bone, mat4, bone2, w2){
    if (mat4) g.applyMatrix4(mat4);
    var p = g.attributes.position, c = new T.Color(hex), base = this.n;
    for (var i = 0; i < p.count; i++){
      this.pos.push(p.getX(i), p.getY(i), p.getZ(i));
      this.col.push(c.r, c.g, c.b);
      if (bone2 != null){ this.si.push(bone, bone2, 0, 0); this.sw.push(1-w2, w2, 0, 0); }
      else { this.si.push(bone, 0, 0, 0); this.sw.push(1, 0, 0, 0); }
    }
    if (g.index){ var ix = g.index.array; for (var j = 0; j < ix.length; j++) this.idx.push(ix[j] + base); }
    else for (var k = 0; k < p.count; k++) this.idx.push(base + k);
    this.n += p.count;
    g.dispose();
  };
  // loft: rings of points around the y axis.
  // ring = {y, rx, rz, x, z, col(hex or fn(ang)), b:[boneA, boneB, wB], f(ang)->radius mult, p:superellipse power, dy(ang)}
  // opts.arc = [a0, a1] (numbers or fn(ring)) builds an open band with thickness opts.thick
  Builder.prototype.loft = function(rings, N, opts){
    opts = opts || {};
    var base = this.n, self = this, arc = opts.arc;
    var P = [];
    rings.forEach(function(r){
      var row = [], cnt = arc ? N*2 : N;
      for (var i = 0; i < cnt; i++){
        var ang, rad = 1;
        if (arc){
          var a0 = typeof arc[0] === 'function' ? arc[0](r) : arc[0];
          var a1 = typeof arc[1] === 'function' ? arc[1](r) : arc[1];
          if (i < N){ ang = mix(a0, a1, i/(N-1)); }
          else { ang = mix(a1, a0, (i-N)/(N-1)); rad = 1 - (opts.thick || .06); }
        } else ang = i / N * Math.PI * 2;
        var m = r.f ? r.f(ang, r) : 1;
        var sx = Math.sin(ang), cz = Math.cos(ang), pe = r.p || 2.4;
        var ex = Math.sign(sx) * Math.pow(Math.abs(sx), 2/pe), ez = Math.sign(cz) * Math.pow(Math.abs(cz), 2/pe);
        var x = (r.x || 0) + ex * r.rx * m * rad, z = (r.z || 0) + ez * r.rz * m * rad;
        var hex = typeof r.col === 'function' ? r.col(ang, r) : r.col;
        row.push([x, r.y + (r.dy ? r.dy(ang) : 0), z, hex]);
      }
      P.push(row);
    });
    var cnt = P[0].length;
    function pushV(q, b){
      var c = new T.Color(q[3]);
      self.pos.push(q[0], q[1], q[2]); self.col.push(c.r, c.g, c.b);
      if (b[1] != null){ self.si.push(b[0], b[1], 0, 0); self.sw.push(1-b[2], b[2], 0, 0); }
      else { self.si.push(b[0], 0, 0, 0); self.sw.push(1, 0, 0, 0); }
    }
    for (var ri = 0; ri < rings.length; ri++){
      var b = rings[ri].b || [0, null, 0];
      for (var i2 = 0; i2 < cnt; i2++) pushV(P[ri][i2], b);
    }
    for (var r2 = 0; r2 < rings.length - 1; r2++){
      for (var i3 = 0; i3 < cnt; i3++){
        var i4 = (i3 + 1) % cnt;
        var a = base + r2*cnt + i3, bb = base + r2*cnt + i4, c2 = base + (r2+1)*cnt + i3, d = base + (r2+1)*cnt + i4;
        if (opts.flip) self.idx.push(a, c2, bb, bb, c2, d); else self.idx.push(a, bb, c2, bb, d, c2);
      }
    }
    this.n += rings.length * cnt;
    function cap(ri, down){
      var r = rings[ri], b = r.b || [0,null,0];
      var ci = self.n;
      pushV([r.x || 0, r.y + (down ? -(opts.capDepth||0) : (opts.capDepth||0)), r.z || 0, typeof r.col === 'function' ? r.col(0, r) : r.col], b);
      self.n++;
      for (var i = 0; i < cnt; i++){
        var j = (i+1) % cnt, a = base + ri*cnt + i, bb = base + ri*cnt + j;
        if (down !== !!opts.flip) self.idx.push(ci, bb, a); else self.idx.push(ci, a, bb);
      }
    }
    if (opts.capBottom) cap(0, true);
    if (opts.capTop) cap(rings.length - 1, false);
  };
  Builder.prototype.geometry = function(skinned){
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('color', new T.Float32BufferAttribute(this.col, 3));
    if (skinned){
      g.setAttribute('skinIndex', new T.Uint16BufferAttribute(this.si, 4));
      g.setAttribute('skinWeight', new T.Float32BufferAttribute(this.sw, 4));
    }
    g.setIndex(this.idx);
    g.computeVertexNormals();
    g.computeBoundingSphere();
    return g;
  };
  function TRS(x, y, z, rx, ry, rz, sx, sy, sz){
    var m = new T.Matrix4();
    if (sx == null){ sx = sy = sz = 1; } else if (sy == null){ sy = sz = sx; }
    m.compose(new T.Vector3(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(rx||0, ry||0, rz||0)), new T.Vector3(sx, sy, sz));
    return m;
  }

  /* ---------- presets, matched to characters/bible.md ---------- */
  var PRESETS = {
    MARCUS: { id:'marcus', sex:'m', age:32, height:1.80, skin:0xc69c7e, hair:0x2b1f17, hairStyle:'short', eyes:0x5a4632,
      shirt:0x34363a, jacket:null, pants:0x3d3a33, boots:0x231d17, belt:0x1f1a15, collar:'crew', thermal:true,
      stubble:.55, cut:'rightTemple', adapter:true, expr:'grim', jaw:1.08, brow:1.05 },
    KARA: { id:'kara', sex:'f', age:28, height:1.71, skin:0xb7896a, hair:0x2a1c13, hairStyle:'braid', eyes:0x4f8a4a,
      shirt:0x6d6e6b, jacket:0x3d4330, jacketTorn:true, pants:0x2e2f28, boots:0x1e1a15, belt:0x2a221a, sleeves:'rolled',
      warPaint:true, scar:'leftTemple', forearmMarks:true, expr:'stern', jaw:.96, brow:1.0 },
    THOMAS: { id:'thomas', sex:'m', age:62, height:1.77, skin:0xb58f72, hair:0x8d8a85, hairStyle:'crop', eyes:0x4d5a63,
      shirt:0x4b4a44, jacket:0x3a3a30, pants:0x2f2c27, boots:0x241e18, belt:0x231d17,
      stubble:.75, stubbleCol:0x9a958c, wrinkles:.9, expr:'stern', jaw:1.06, brow:1.1, recede:.12 },
    DAVID: { id:'david', sex:'m', age:60, height:1.75, skin:0xc7a07c, hair:0x2a2622, hairGray:.45, hairStyle:'short', eyes:0x2a1f18,
      shirt:0x5a5246, jacket:0x6a5136, pants:0x34302a, boots:0x2a2119, belt:0x2a2119,
      beard:true, beardCol:0x2a2420, beardGray:.38, noRightForearm:true, wrinkles:.7, expr:'warm', asian:true, jaw:1.0, brow:.95 },
    ELENA: { id:'elena', sex:'f', age:31, height:1.64, skin:0xe4c9b3, hair:0x1d1612, hairStyle:'bun', eyes:0x5b4a3a,
      shirt:0x3b4250, jacket:0x2c3038, pants:0x2a2b30, boots:0x1c1b1d, belt:0x1d1c1c,
      headset:true, datapad:true, expr:'worried', jaw:.92, brow:.95 },
    VERA: { id:'vera', sex:'f', age:30, height:1.70, skin:0x6e4a35, hair:0xd9d6d2, hairStyle:'silver', eyes:0x6b5a48,
      shirt:0xc9c9c6, jacket:null, pants:0xb9b9b6, boots:0x9a9a98, belt:0xb0b0ad, collar:'high', clean:true,
      expr:'warm', jaw:.94, brow:.95 },
    REYES: { id:'reyes', sex:'f', age:34, height:1.68, skin:0x9a7258, hair:0x171009, hairStyle:'ponytail', eyes:0x3a2a1c,
      shirt:0x4a463e, jacket:0x2e3a2c, pants:0x20241f, boots:0x1a1712, belt:0x241c15, scarf:0x7a3322,
      expr:'stern', jaw:.98, brow:1.0, smudge:true },
    'OMEGA-7': { id:'omega7', machine:true, height:2.0, body:0x4a4e54, trim:0x6a6e74, glow:0xcfe8ff, sensors:2 },
    LEDGER: { id:'ledger', machine:true, height:1.95, body:0x3a3c40, trim:0x55585c, glow:0xff3b30, sensors:1 },
    HUNTER: { id:'hunter', machine:true, height:2.1, body:0x343434, trim:0x5a3a34, glow:0xff2a2a, sensors:3, bulky:true },
    ANGELA: { id:'angela', sex:'f', age:16, height:1.58, skin:0xd8b49a, hair:0x5a3b22, hairStyle:'loose', eyes:0x4a3a2a, jaw:.9, nose:.85 }  // 'a teenager' (game text)
  };

  /* ---------- the face: a parametric head with a real mouth seam ----------
     The head is a grid in (a, th): a = angle around the vertical axis
     (0 = facing +z), th = angle from the crown. One row is duplicated
     on the mouth line: at rest the two rows coincide, and the jaw
     morph pulls the lower one down, stretching a thin band of the face
     texture (painted as the mouth interior) into an open mouth. */
  var MOUTH_TH = Math.PI/2 + .56, BAND = .07;
  var EYE_A = .40, EYE_TH = 1.535;
  function headShape(def){
    var f = def.sex === 'f';
    return { w: f ? .074 : .078, h: f ? .107 : .112, d: f ? .09 : .094,
      jaw: (def.jaw || 1) * (f ? .94 : 1), brow: def.brow || 1, chin: f ? .85 : 1.05, asian: !!def.asian, nose: (def.nose || 1) * (f ? .88 : 1) };
  }
  function headPoint(a, th, sh, out){
    var st = Math.sin(th), nx = Math.sin(a)*st, ny = Math.cos(th), nz = Math.cos(a)*st;
    var x = nx*sh.w, y = ny*sh.h, z = nz*sh.d;
    if (nz < 0) z *= 1.13;                                // fuller back of the skull
    x *= 1 + .07*Math.max(0, ny);                          // wider cranium
    var lower = sstep(-.05, -.9, ny);                      // jaw region
    var front = Math.max(0, nz);
    x *= 1 - (.22 - (sh.jaw-1)*.8)*lower*(.5 + .5*front);
    z += .016*sh.chin*lower*front*front;                   // jaw and chin come forward
    if (ny < -.55 && nz < .35){                            // tuck the underside into the neck
      var k = sstep(-.55, -.95, ny)*sstep(.35, -.2, nz); z *= 1 - .35*k; x *= 1 - .1*k;
    }
    z -= .006*Math.pow(front, 6)*(1-lower);                // flatter face plane
    var r = 1, da, dt;
    for (var s = -1; s <= 1; s += 2){
      da = a - s*EYE_A; dt = th - EYE_TH;
      z -= .0095*gauss(Math.hypot(da*.9, dt*1.15), .15)*front;                   // eye sockets
      dt = th - (EYE_TH - .26);
      z += .0045*sh.brow*gauss(Math.hypot(da*.55, dt*1.6), .14)*front;           // brow ridge
      da = a - s*.78; dt = th - 1.86;
      r += (sh.asian ? .05 : .035)*gauss(Math.hypot(da, dt*1.2), .2);           // cheekbones
    }
    z += .007*sh.chin*gauss(Math.hypot(a*1.2, th - 2.48), .16)*front;             // chin
    z += .0035*gauss(Math.hypot(a*.8, (th - MOUTH_TH)*1.6), .13)*front;           // lips
    if (front > .5){                                                               // nose
      var nl = sh.nose, tN = 1.86;
      var hN = th < tN ? mix(.003, .019, sstep(1.4, tN, th)) * (th > 1.36 ? 1 : sstep(1.25, 1.36, th)) : .019 * (1 - sstep(tN - .01, tN + .12, th));
      var sg = mix(.05, .1, sstep(1.45, tN, th));
      z += hN * nl * gauss(a, sg);
      for (var s2 = -1; s2 <= 1; s2 += 2) z += .0055 * nl * gauss(Math.hypot((a - s2*.125)*1.1, th - 1.875), .045);
    }
    out.set(x*r, y, z + (r-1)*.02*front);
    return out;
  }
  var JAW_PIV = { y: -.018, z: -.025 }, JAW_ANG = .2;
  function jawW(a, th){
    var A = Math.abs(a);
    var lens = (1 - .82*sstep(0, .36, A)) * (1 - sstep(.75, 1.2, A));   // corners open less: lens-shaped mouth
    var wide = 1 - sstep(.8, 1.35, A);                                   // the jaw itself drops as one piece
    var W = mix(lens, wide, sstep(MOUTH_TH + .02, MOUTH_TH + .3, th));
    return W * (1 - sstep(Math.PI - .55, Math.PI - .05, th));
  }
  // sample n+1 values over [lo, hi] with extra density where dens() is high
  var WARP = {};
  function warped(n, lo, hi, dens, key){
    key += ':' + n; if (WARP[key]) return WARP[key];
    var M = 4000, cum = [0], x, i;
    for (i = 1; i <= M; i++){ x = lo + (hi - lo) * (i - .5) / M; cum.push(cum[i-1] + dens(x)); }
    var out = [], j = 0, tot = cum[M];
    for (i = 0; i <= n; i++){
      var target = tot * i / n;
      while (j < M && cum[j+1] < target) j++;
      var f = (target - cum[j]) / Math.max(1e-9, cum[j+1] - cum[j]);
      out.push(lo + (hi - lo) * clamp((j + f) / M, 0, 1));
    }
    out[0] = lo; out[n] = hi;
    return (WARP[key] = out);
  }
  function headGeo(def, lod, thickFn){
    var sh = headShape(def), A = lod.headA, R = lod.headRows;
    var rows = warped(R, 0, Math.PI, function(t){ return 1 + 1.5*gauss(t - 1.85, .5); }, 'rows').slice();
    var cols = warped(A, -Math.PI, Math.PI, function(a){ return 1 + 1.8*gauss(a, .55); }, 'cols');
    var best = 0; for (var j = 1; j < rows.length; j++) if (Math.abs(rows[j] - MOUTH_TH) < Math.abs(rows[best] - MOUTH_TH)) best = j;
    rows[best] = MOUTH_TH; rows.splice(best + 1, 0, MOUTH_TH);
    var dupRow = best + 1;
    var pos = [], uv = [], mJaw = [], mSmile = [], mFrown = [], idx = [];
    var v = new T.Vector3(), n1 = new T.Vector3(), n2 = new T.Vector3(), nr = new T.Vector3();
    var cosJ = Math.cos(JAW_ANG), sinJ = Math.sin(JAW_ANG);
    for (var r = 0; r < rows.length; r++){
      var th = rows[r], lowerRow = r >= dupRow;
      var thUV = lowerRow ? th + BAND : th;
      for (var c = 0; c <= A; c++){
        var a = cols[c];
        headPoint(a, th, sh, v);
        if (thickFn){
          headPoint(a + .01, th, sh, n1).sub(v); headPoint(a, Math.min(Math.PI, th + .01), sh, n2).sub(v);
          nr.crossVectors(n2, n1).normalize();
          if (th < .02 || !isFinite(nr.x)) nr.set(0, 1, 0);
          if (th > Math.PI - .02) nr.set(0, -1, 0);
          v.addScaledVector(nr, thickFn(a, th));
        }
        pos.push(v.x, v.y, v.z);
        uv.push(a / (Math.PI*2) + .5, 1 - thUV / (Math.PI + BAND));
        var w = lowerRow ? jawW(a, th) : 0;
        var yy = v.y - JAW_PIV.y, zz = v.z - JAW_PIV.z;
        var ny = yy*cosJ - zz*sinJ, nz = yy*sinJ + zz*cosJ;   // rotate about x so the chin drops
        mJaw.push(0, (ny - yy)*w, (nz - zz)*w*.4);
        var cs = 0, ca = 0;
        for (var s = -1; s <= 1; s += 2){ var gg = gauss(Math.hypot((a - s*.3)*1.1, (th - MOUTH_TH)*1.3), .07); cs += gg*s; ca += gg; }
        mSmile.push(cs*.0025, ca*.0042, -ca*.0018);
        mFrown.push(-cs*.0006, -ca*.0034, ca*.0004);
      }
    }
    var W = A + 1;
    for (var r2 = 0; r2 < rows.length - 1; r2++){
      for (var c2 = 0; c2 < A; c2++){
        var i0 = r2*W + c2, i1 = i0 + 1, i2 = i0 + W, i3 = i2 + 1;
        idx.push(i0, i2, i1, i1, i2, i3);
      }
    }
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    g.morphAttributes.position = [new T.Float32BufferAttribute(mJaw, 3), new T.Float32BufferAttribute(mSmile, 3), new T.Float32BufferAttribute(mFrown, 3)];
    g.morphTargetsRelative = true;
    return g;
  }
  // merge small solid parts (nose, ears) into the head with a constant uv
  function appendParts(headG, parts){
    var P = Array.from(headG.attributes.position.array), U = Array.from(headG.attributes.uv.array), I = Array.from(headG.index.array);
    var morphs = headG.morphAttributes.position.map(function(m){ return Array.from(m.array); });
    parts.forEach(function(pt){
      var g = pt.geo; g.applyMatrix4(pt.m);
      var gp = g.attributes.position, base = P.length/3;
      for (var i = 0; i < gp.count; i++){
        P.push(gp.getX(i), gp.getY(i), gp.getZ(i)); U.push(pt.uv[0], pt.uv[1]);
        for (var k = 0; k < morphs.length; k++) morphs[k].push(0, 0, 0);
      }
      var ix = g.index.array; for (var j = 0; j < ix.length; j++) I.push(ix[j] + base);
      g.dispose();
    });
    var out = new T.BufferGeometry();
    out.setAttribute('position', new T.Float32BufferAttribute(P, 3));
    out.setAttribute('uv', new T.Float32BufferAttribute(U, 2));
    out.setIndex(I); out.computeVertexNormals();
    out.morphAttributes.position = morphs.map(function(m){ return new T.Float32BufferAttribute(m, 3); });
    out.morphTargetsRelative = true;
    headG.dispose();
    return out;
  }

  /* ---------- face paint (canvas, in the head's (a, th) uv space) ---------- */
  var TEXCACHE = {};
  function faceUV(a, th, below){ return [a/(Math.PI*2) + .5, 1 - (below ? th + BAND : th) / (Math.PI + BAND)]; }
  function hairline(def, a){
    var A = Math.abs(a), rec = def.recede || 0;
    var front = .86 + rec + (def.sex === 'f' ? .04 : 0);
    if (A < .9) return mix(front, front + .2 + rec*.5, sstep(.1, .9, A));
    if (A < 1.3) return mix(front + .2 + rec*.5, 1.45, sstep(.9, 1.3, A));
    if (A < 1.8) return 1.36;                    // above the ear
    return mix(1.55, 2.2, sstep(1.8, Math.PI, A));
  }
  function browCol(def){
    if (def.hairStyle === 'silver') return 0x2a221c;
    return def.hairGray ? mixHex(def.hair, 0x9a958c, def.hairGray*.6) : def.hair;
  }
  function paintFace(def, lod, sleeper){
    var key = 'face:' + def.id + ':' + lod.tex + ':' + (lod.eyes ? 1 : 0) + (sleeper ? ':s' : '');
    if (TEXCACHE[key]) return TEXCACHE[key];
    var Wd = lod.tex, Ht = lod.tex/2, cv = document.createElement('canvas'); cv.width = Wd; cv.height = Ht;
    var g = cv.getContext('2d'), R = rng(def.id + 'face');
    function X(a){ return (a/(Math.PI*2) + .5) * Wd; }
    function Y(th, below){ return (below ? th + BAND : th) / (Math.PI + BAND) * Ht; }
    var px = Wd / (Math.PI*2);                     // pixels per radian
    var skin = def.skin;
    g.fillStyle = hexCss(skin); g.fillRect(0, 0, Wd, Ht);
    for (var i = 0; i < 90; i++){                  // soft blotches
      var bx = R()*Wd, by = R()*Ht, br = (8 + R()*30) * Wd/1024;
      var gr = g.createRadialGradient(bx, by, 0, bx, by, br);
      var tone = R() < .5 ? shade(skin, .9) : shade(skin, 1.06);
      gr.addColorStop(0, rgba(tone, .25)); gr.addColorStop(1, rgba(tone, 0));
      g.fillStyle = gr; g.fillRect(bx-br, by-br, br*2, br*2);
    }
    function blob(a, th, rx, ry, hex, al, below){
      var cx = X(a), cy = Y(th, below), r = Math.max(rx, ry) * px;
      g.save(); g.translate(cx, cy); g.scale(rx/Math.max(rx,ry), ry/Math.max(rx,ry));
      var gr = g.createRadialGradient(0, 0, 0, 0, 0, r);
      gr.addColorStop(0, rgba(hex, al)); gr.addColorStop(1, rgba(hex, 0));
      g.fillStyle = gr; g.fillRect(-r, -r, r*2, r*2); g.restore();
    }
    var flush = mixHex(skin, 0xc0504a, .5);
    blob(-.62, 1.85, .28, .2, flush, .16); blob(.62, 1.85, .28, .2, flush, .16);
    blob(0, 1.82, .14, .14, flush, .12);
    blob(-1.57, 1.6, .2, .25, flush, .22); blob(1.57, 1.6, .2, .25, flush, .22);
    blob(0, 3.0, 1.4, .3, shade(skin, .72), .25, true);
    for (var s = -1; s <= 1; s += 2){
      blob(s*EYE_A, EYE_TH - .02, .2, .1, shade(skin, .62), .42);
      if (!lod.eyes){
        if (sleeper){
          g.strokeStyle = rgba(shade(skin, .42), .9); g.lineWidth = Math.max(1, px*.014);
          g.beginPath(); g.ellipse(X(s*EYE_A), Y(EYE_TH), px*.12, px*.03, 0, 0, Math.PI); g.stroke();
        } else {
          g.fillStyle = '#e6e0d6'; g.beginPath(); g.ellipse(X(s*EYE_A), Y(EYE_TH), px*.12, px*.05, 0, 0, Math.PI*2); g.fill();
          g.fillStyle = hexCss(def.eyes || 0x3a2a1c); g.beginPath(); g.arc(X(s*EYE_A), Y(EYE_TH), px*.05, 0, Math.PI*2); g.fill();
          g.fillStyle = '#0b0807'; g.beginPath(); g.arc(X(s*EYE_A), Y(EYE_TH), px*.022, 0, Math.PI*2); g.fill();
          g.strokeStyle = rgba(0x1a1210, .85); g.lineWidth = Math.max(1, px*.016);
          g.beginPath(); g.ellipse(X(s*EYE_A), Y(EYE_TH), px*.125, px*.052, 0, Math.PI, Math.PI*2); g.stroke();
        }
      }
      // painted brows (soft base under the 3D brows; the only brows at low LOD)
      g.strokeStyle = rgba(browCol(def), lod.brows ? .3 : .85); g.lineCap = 'round';
      g.lineWidth = px * (def.sex === 'f' ? .028 : .04);
      g.beginPath();
      g.moveTo(X(s*(EYE_A - .2)), Y(EYE_TH - .2)); g.quadraticCurveTo(X(s*EYE_A), Y(EYE_TH - .27), X(s*(EYE_A + .24)), Y(EYE_TH - .19)); g.stroke();
    }
    if (def.wrinkles){
      var wk = def.wrinkles;
      g.strokeStyle = rgba(shade(skin, .6), .35*wk); g.lineWidth = Math.max(1, px*.008);
      for (var k = 0; k < 3; k++){ g.beginPath(); g.moveTo(X(-.4), Y(1.02 + k*.07)); g.quadraticCurveTo(X(0), Y(1.0 + k*.07), X(.4), Y(1.02 + k*.07)); g.stroke(); }
      for (var s3 = -1; s3 <= 1; s3 += 2){
        g.beginPath(); g.moveTo(X(s3*.2), Y(1.84)); g.quadraticCurveTo(X(s3*.34), Y(1.98), X(s3*.33), Y(2.2, true)); g.stroke();
        for (var k2 = 0; k2 < 3; k2++){ g.beginPath(); g.moveTo(X(s3*.62), Y(1.5 + k2*.05)); g.lineTo(X(s3*.72), Y(1.47 + k2*.07)); g.stroke(); }
        blob(s3*EYE_A, EYE_TH + .13, .14, .05, shade(skin, .65), .35*wk);
      }
    }
    var st = def.stubble || (def.beard ? .7 : 0);
    if (st){
      var sc = def.stubbleCol || def.beardCol || def.hair;
      g.globalAlpha = .25*st; blob(0, 2.35, .7, .45, sc, .6, true); blob(0, MOUTH_TH - .05, .3, .05, sc, .5); g.globalAlpha = 1;
      var n = Math.round(Wd * Ht / 50 * st);
      for (var q = 0; q < n; q++){
        var a = (R()*2 - 1) * 1.5, th = 1.86 + R()*1.0, A = Math.abs(a);
        var zone = (th > 1.98 && A < 1.25) || (A > .9 && A < 1.45 && th > 1.55);
        if (!zone || (Math.abs(th - MOUTH_TH) < .09 && A < .3)) continue;
        g.fillStyle = rgba(sc, .3 + R()*.35);
        g.fillRect(X(a), Y(th, th > MOUTH_TH), Math.max(1, px*.006), Math.max(1, px*.006));
      }
    }
    // lips and the mouth band
    var lip = mixHex(skin, def.sex === 'f' ? 0xa0464a : 0x9a5a52, def.sex === 'f' ? .5 : .32);
    if (sleeper) lip = mixHex(lip, 0x9aa0a8, .35);
    var mw = .27, yTop = Y(MOUTH_TH), yBot = Y(MOUTH_TH, true), bandH = yBot - yTop;
    g.fillStyle = hexCss(lip);
    g.beginPath(); g.moveTo(X(-mw), yTop);
    g.quadraticCurveTo(X(-.13), Y(MOUTH_TH - .075), X(-.035), Y(MOUTH_TH - .08));
    g.lineTo(X(0), Y(MOUTH_TH - .065)); g.lineTo(X(.035), Y(MOUTH_TH - .08));
    g.quadraticCurveTo(X(.13), Y(MOUTH_TH - .075), X(mw), yTop); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(X(-mw*.95), yBot); g.quadraticCurveTo(X(0), yBot + .14/(Math.PI+BAND)*Ht, X(mw*.95), yBot); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,.07)'; g.beginPath(); g.ellipse(X(0), yBot + .035/(Math.PI+BAND)*Ht, px*.08, px*.018, 0, 0, Math.PI*2); g.fill();
    g.fillStyle = hexCss(lip); g.fillRect(X(-mw), yTop, X(mw) - X(-mw), bandH);
    g.fillStyle = '#1c0b0b';
    g.beginPath(); g.ellipse(X(0), yTop + bandH/2, (X(mw) - X(-mw))/2*.94, bandH/2, 0, 0, Math.PI*2); g.fill();
    g.fillStyle = '#cfc8b8'; g.fillRect(X(-.13), yTop, X(.13) - X(-.13), bandH*.26);
    g.strokeStyle = rgba(shade(lip, .5), .9); g.lineWidth = Math.max(1, px*.009);
    g.beginPath(); g.moveTo(X(-mw), yTop); g.lineTo(X(mw), yTop); g.stroke();
    // hair painted under the hair shell so the edges blend
    if (def.hairStyle){
      var hc = def.hairGray ? mixHex(def.hair, 0x8f8a84, def.hairGray*.5) : def.hair;
      var step = Math.max(1, Wd/512);
      for (var xx = 0; xx < Wd; xx += step){
        var y1 = Y(hairline(def, (xx / Wd - .5) * Math.PI * 2));
        var gr2 = g.createLinearGradient(0, y1 - px*.08, 0, y1 + px*.03);
        gr2.addColorStop(0, rgba(hc, 1)); gr2.addColorStop(1, rgba(hc, 0));
        g.fillStyle = gr2; g.fillRect(xx, 0, step + .5, y1 + px*.03);
      }
    }
    if (def.warPaint){
      g.fillStyle = rgba(0x1b1714, .5);
      for (var s4 = -1; s4 <= 1; s4 += 2){
        for (var k3 = 0; k3 < 2; k3++){
          var a0 = s4*(.24 + k3*.17), t0 = 1.66 + k3*.02;
          g.beginPath();
          g.moveTo(X(a0), Y(t0)); g.lineTo(X(a0 + s4*.1), Y(t0 + .02)); g.lineTo(X(a0 + s4*.12), Y(t0 + .3 - k3*.06)); g.lineTo(X(a0 + s4*.03), Y(t0 + .27 - k3*.06));
          g.closePath(); g.fill();
        }
      }
      blob(.3, 1.3, .12, .06, 0x3a2e24, .35);
    }
    if (def.smudge){ blob(-.55, 1.95, .16, .1, 0x2a2018, .4); blob(.3, 1.2, .1, .08, 0x2a2018, .3); }
    if (def.scar === 'leftTemple'){   // the character's left is +x, which is +a
      g.strokeStyle = rgba(mixHex(skin, 0xf2e2d6, .55), .95); g.lineWidth = Math.max(1.2, px*.012);
      g.beginPath(); g.moveTo(X(.88), Y(1.16)); g.quadraticCurveTo(X(1.02), Y(1.28), X(.98), Y(1.42)); g.quadraticCurveTo(X(.95), Y(1.49), X(.87), Y(1.46)); g.stroke();
      g.strokeStyle = rgba(shade(skin, .6), .5); g.lineWidth = Math.max(1, px*.004);
      g.beginPath(); g.moveTo(X(.89), Y(1.17)); g.quadraticCurveTo(X(1.03), Y(1.29), X(.99), Y(1.42)); g.stroke();
    }
    if (def.cut === 'rightTemple'){
      blob(-.88, 1.3, .08, .11, 0x5a1a14, .45);
      g.strokeStyle = rgba(0x7a1f1a, .95); g.lineWidth = Math.max(1.2, px*.015);
      g.beginPath(); g.moveTo(X(-.93), Y(1.2)); g.lineTo(X(-.84), Y(1.37)); g.stroke();
      g.strokeStyle = rgba(0x6a1a14, .5); g.lineWidth = Math.max(1, px*.006);
      g.beginPath(); g.moveTo(X(-.84), Y(1.37)); g.lineTo(X(-.83), Y(1.52)); g.stroke();
    }
    if (sleeper){ g.fillStyle = 'rgba(150,170,190,.12)'; g.fillRect(0, 0, Wd, Ht); }
    var tex = new T.CanvasTexture(cv); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 4;
    TEXCACHE[key] = tex;
    return tex;
  }
  function hairMask(def){
    var key = 'hmask:' + def.id; if (TEXCACHE[key]) return TEXCACHE[key];
    var W = 512, H = 256, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var g = cv.getContext('2d'), R = rng(def.id + 'hm');
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(0, 0);
    for (var x = 0; x <= W; x += 2){
      var a = (x / W - .5) * Math.PI * 2, th = hairline(def, a) + (R() - .5) * .012;
      g.lineTo(x, th / (Math.PI + BAND) * H);
    }
    g.lineTo(W, 0); g.closePath(); g.fill();
    // wisps along the edge
    g.strokeStyle = '#fff'; g.lineWidth = 1;
    for (var i = 0; i < 260; i++){
      var xx = R() * W, aa = (xx / W - .5) * Math.PI * 2, y0 = hairline(def, aa) / (Math.PI + BAND) * H;
      g.beginPath(); g.moveTo(xx, y0 - 2); g.lineTo(xx + (R() - .5) * 2, y0 + R() * 3); g.stroke();
    }
    var t = new T.CanvasTexture(cv);
    TEXCACHE[key] = t; return t;
  }
  function strandTex(base, streak, streakAmt, key){
    key = 'strand:' + base + ':' + streak + ':' + streakAmt + ':' + (key||'');
    if (TEXCACHE[key]) return TEXCACHE[key];
    var W = 256, H = 128, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var g = cv.getContext('2d'), R = rng(key);
    g.fillStyle = hexCss(base); g.fillRect(0, 0, W, H);
    for (var i = 0; i < 2200; i++){
      var x = R()*W, y = R()*H, len = 6 + R()*22;
      var c = R() < streakAmt ? streak : (R() < .5 ? shade(base, .7) : shade(base, 1.2));
      g.strokeStyle = rgba(c, .5 + R()*.4); g.lineWidth = .7 + R()*.8;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R()-.5)*2, y + len); g.stroke();
    }
    var t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; t.wrapS = t.wrapT = T.RepeatWrapping;
    TEXCACHE[key] = t; return t;
  }
  function eyeTex(hex){
    var key = 'eye:' + hex; if (TEXCACHE[key]) return TEXCACHE[key];
    var W = 256, H = 128, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var g = cv.getContext('2d');
    g.fillStyle = '#e4ddd2'; g.fillRect(0, 0, W, H);
    var cx = W*.25, cy = H*.5, ir = 17;      // SphereGeometry: u = .25 faces +z
    var gr = g.createRadialGradient(cx, cy, 10, cx, cy, 70);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(170,90,80,.35)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    var ig = g.createRadialGradient(cx, cy, 2, cx, cy, ir);
    ig.addColorStop(0, hexCss(shade(hex, 1.25))); ig.addColorStop(.7, hexCss(hex)); ig.addColorStop(1, hexCss(shade(hex, .4)));
    g.fillStyle = ig; g.beginPath(); g.arc(cx, cy, ir, 0, Math.PI*2); g.fill();
    for (var i = 0; i < 40; i++){ var an = i/40*Math.PI*2; g.strokeStyle = rgba(shade(hex, i%2 ? 1.4 : .6), .35);
      g.beginPath(); g.moveTo(cx + Math.cos(an)*6, cy + Math.sin(an)*6); g.lineTo(cx + Math.cos(an)*ir*.95, cy + Math.sin(an)*ir*.95); g.stroke(); }
    g.fillStyle = '#060404'; g.beginPath(); g.arc(cx, cy, 6.5, 0, Math.PI*2); g.fill();
    g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.arc(cx - 4, cy - 4, 2.4, 0, Math.PI*2); g.fill();
    var t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace;
    TEXCACHE[key] = t; return t;
  }

  /* ---------- the head assembly ---------- */
  // sleepers sit in amber fluid: it absorbs the blue end, so their albedo is tinted and
  // dimmed (a flashlight at arm's length must not wash them out), and the fluid glow lifts them
  function sleeperKnee(sh){
    // soft knee on the lit colour: the fluid scatters a close flashlight instead of letting it burn the skin white
    sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>',
      'outgoingLight = outgoingLight / (1.0 + max(max(outgoingLight.r, outgoingLight.g), outgoingLight.b) * .8);\n#include <opaque_fragment>');
  }
  function emis(m, sleeper){
    if (sleeper){ m.color = new T.Color(0x8a6640); m.emissive = new T.Color(0x3a2208); m.emissiveIntensity = .5;
      m.onBeforeCompile = sleeperKnee; m.customProgramCacheKey = function(){ return 'sleeperKnee'; }; }
    return m;
  }
  function buildHead(def, lod, sleeper){
    var grp = new T.Group(), sh = headShape(def);
    var geo = headGeo(def, lod, null);
    var parts = [], skinUV = faceUV(0, 1.86);
    var segS = lod.eyes ? 10 : 6;
    for (var s2 = -1; s2 <= 1; s2 += 2){
      var ep = headPoint(s2*1.57, 1.62, sh, new T.Vector3());
      parts.push({ geo: new T.SphereGeometry(1, segS, segS - 2), m: TRS(ep.x + s2*.001, ep.y, ep.z - .006, 0, s2*-.3, s2*.06, .0068, .027, .017), uv: faceUV(s2*1.57, 1.6) });
    }
    geo = appendParts(geo, parts);
    var mat = emis(new T.MeshStandardMaterial({ map: paintFace(def, lod, sleeper), roughness: def.clean ? .5 : .62, metalness: 0 }), sleeper);
    var head = new T.Mesh(geo, mat);
    head.morphTargetInfluences = [0, 0, 0];
    grp.add(head);
    var R = { group: grp, head: head, eyes: [], lidU: null, lidL: null, brows: [], hair: null, hairExtra: null, beard: null };
    if (lod.eyes && !sleeper){
      var er = .0122, emat = new T.MeshStandardMaterial({ map: eyeTex(def.eyes || 0x3a2a1c), roughness: .15, metalness: 0 });
      var eg = new T.SphereGeometry(er, 20, 14), eyeY = 0, eyeZ = 0;
      for (var s3 = -1; s3 <= 1; s3 += 2){
        var c = headPoint(s3*EYE_A, EYE_TH, sh, new T.Vector3());
        var piv = new T.Group(); piv.position.set(c.x*.97, c.y, c.z - er*.62);
        piv.add(new T.Mesh(eg, emat));
        grp.add(piv); R.eyes.push(piv);
        eyeY = c.y; eyeZ = c.z - er*.62;
      }
      if (lod.lids){
        // one mesh pivots both upper lids: the eye centres share an x-axis line
        var lidMat = new T.MeshStandardMaterial({ vertexColors: true, roughness: .6 });
        var lidGeo = function(upper){
          var b = new Builder();
          for (var s4 = -1; s4 <= 1; s4 += 2){
            var c2 = headPoint(s4*EYE_A, EYE_TH, sh, new T.Vector3());
            b.addGeo(new T.SphereGeometry(er*1.1, 18, 7, 0, Math.PI*2, 0, Math.PI*.5), shade(def.skin, .92), 0, TRS(c2.x*.97, 0, 0, upper ? 0 : Math.PI, 0, 0, 1.08, 1, 1));
          }
          var gg = b.geometry(false), P = gg.attributes.position, C = gg.attributes.color, dark = new T.Color(0x1a1210);
          for (var i = 0; i < P.count; i++) if (Math.abs(P.getY(i)) < er*.15) C.setXYZ(i, dark.r, dark.g, dark.b);
          return gg;
        };
        var up = new T.Mesh(lidGeo(true), lidMat), lo = new T.Mesh(lidGeo(false), lidMat);
        up.position.set(0, eyeY, eyeZ); lo.position.set(0, eyeY, eyeZ);
        grp.add(up, lo); R.lidU = up; R.lidL = lo;
      }
    }
    if (lod.brows && !sleeper){
      var bmat = new T.MeshStandardMaterial({ color: browCol(def), roughness: .9 });
      for (var s5 = -1; s5 <= 1; s5 += 2){
        var pts = [];
        for (var k = 0; k <= 4; k++){
          var aa = s5*mix(EYE_A - .2, EYE_A + .24, k/4), tt = EYE_TH - .2 - .07*Math.sin(k/4*Math.PI) + (k === 4 ? .01 : 0);
          var p = headPoint(aa, tt, sh, new T.Vector3()); p.z += .0026; p.x *= 1.02; pts.push(p);
        }
        var center = pts[2].clone();
        var tg = new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(function(q){ return q.clone().sub(center); })), 10, def.sex === 'f' ? .0024 : .0034, 5, false);
        tg.scale(1, .6, .7);
        var bp = new T.Group(); bp.position.copy(center); bp.add(new T.Mesh(tg, bmat));
        bp.userData.side = s5; bp.userData.base = center.clone();
        grp.add(bp); R.brows.push(bp);
      }
    }
    var hcol = def.hairGray ? mixHex(def.hair, 0x8f8a84, def.hairGray*.5) : def.hair;
    if (lod.hair && def.hairStyle){
      var style = def.hairStyle;
      var thick = { short: .011, crop: .0045, braid: .007, bun: .008, silver: .012, ponytail: .008, loose: .014 }[style] || .01;
      var hg = headGeo(def, { headA: Math.max(18, lod.headA - 8), headRows: Math.max(14, lod.headRows - 6) }, function(a, th){
        var hl = hairline(def, a) + .1, m = 1 - sstep(hl - .06, hl, th);
        var vol = 1 + (style === 'silver' ? .55 : style === 'short' ? .3 : .1) * Math.max(0, Math.cos(th));
        return thick * m * vol + .0016 * m - .0022 * (1 - m);
      });
      hg.morphAttributes = {};
      var hmat = emis(new T.MeshStandardMaterial({ map: strandTex(hcol, 0x9b968f, def.hairGray || 0, def.id), roughness: style === 'silver' ? .45 : .62, alphaMap: hairMask(def), alphaTest: .5 }), sleeper);
      var hair = new T.Mesh(hg, hmat); grp.add(hair); R.hair = hair;
      var ex = new Builder(), has = false;
      if (style === 'braid'){
        for (var bi = 0; bi < 9; bi++){
          var t = bi / 8, r = .022 - t*.009;
          ex.addGeo(new T.SphereGeometry(1, 8, 6), hcol, 0, TRS(bi%2 ? .005 : -.005, -.03 - t*.26, -.112 - .01*Math.sin(t*3) + t*.012, .3, 0, bi%2 ? .5 : -.5, r, r*1.5, r));
        }
        ex.addGeo(new T.CylinderGeometry(.006, .006, .012, 6), 0x2a2622, 0, TRS(0, -.3, -.1)); has = true;
      } else if (style === 'bun'){
        ex.addGeo(new T.SphereGeometry(.04, 12, 10), hcol, 0, TRS(0, -.05, -.118, 0, 0, 0, 1.1, .85, .8)); has = true;
      } else if (style === 'ponytail'){
        for (var pi = 0; pi < 7; pi++){ var tp = pi/6; ex.addGeo(new T.SphereGeometry(1, 8, 6), hcol, 0, TRS(0, -tp*.2, -.125 - tp*.02, 0, 0, 0, .02 - tp*.008, .035, .018 - tp*.006)); }
        has = true;
      } else if (style === 'loose'){
        for (var li = 0; li < 14; li++){
          var la = (li / 13 - .5) * 2.6 + Math.PI, lp = headPoint(la, 1.9, headShape(def), new T.Vector3());
          ex.addGeo(new T.SphereGeometry(1, 6, 6), hcol, 0, TRS(lp.x*1.12, lp.y - .06, lp.z*1.1, 0, la, 0, .024, .1, .012));
        }
        has = true;
      }
      if (has){ var hx = new T.Mesh(ex.geometry(false), emis(new T.MeshStandardMaterial({ vertexColors: true, roughness: .62 }), sleeper)); grp.add(hx); R.hairExtra = hx; }
    }
    if (def.beard && lod.hair){
      var bg = headGeo(def, lod, function(a, th){
        var A = Math.abs(a), m = 0;
        if (A < 1.2 && th > 1.97) m = 1 - sstep(.95, 1.2, A);
        if (A < .32 && th > MOUTH_TH - .1 && th < MOUTH_TH - .015) m = Math.max(m, .55);
        if (A >= .95 && A < 1.38 && th > 1.62) m = Math.max(m, .5 * (1 - sstep(1.28, 1.38, A)));
        if (A < .25 && th > MOUTH_TH - .015 && th < MOUTH_TH + .13) m = 0;
        if (th > 2.75) m *= 1 - sstep(2.75, 2.95, th);
        return m > .02 ? .0075 * m : -.003;
      });
      var beard = new T.Mesh(bg, new T.MeshStandardMaterial({ map: strandTex(def.beardCol || def.hair, 0xa8a49c, def.beardGray || 0, def.id + 'b'), roughness: .75 }));
      beard.morphTargetInfluences = [0, 0, 0];
      grp.add(beard); R.beard = beard;
    }
    if (def.headset){
      var hb = new Builder(), metal = 0x2a2c30;
      hb.addGeo(new T.TorusGeometry(.098, .0035, 6, 24, Math.PI), metal, 0, TRS(0, .01, -.01, 0, 0, 0, 1.0, 1.18, 1));
      hb.addGeo(new T.CylinderGeometry(.017, .017, .012, 14), 0x1d1e21, 0, TRS(.084, -.003, -.005, 0, 0, Math.PI/2));
      hb.addGeo(new T.CylinderGeometry(.0018, .0018, .085, 5), metal, 0, TRS(.072, -.04, .04, -1.0, 0, -.35));
      hb.addGeo(new T.SphereGeometry(.005, 6, 6), 0x111111, 0, TRS(.05, -.062, .078));
      hb.addGeo(new T.SphereGeometry(.0022, 6, 6), 0x3cff9a, 0, TRS(.091, 0, .003));
      grp.add(new T.Mesh(hb.geometry(false), new T.MeshStandardMaterial({ vertexColors: true, roughness: .45, metalness: .5 })));
    }
    return R;
  }

  /* ---------- skeleton ---------- */
  var BONE = { hips:0, spine:1, chest:2, neck:3, head:4, uaL:5, faL:6, hL:7, uaR:8, faR:9, hR:10, thL:11, shL:12, ftL:13, thR:14, shR:15, ftR:16 };
  var PARENT = { hips:null, spine:'hips', chest:'spine', neck:'chest', head:'neck', uaL:'chest', faL:'uaL', hL:'faL', uaR:'chest', faR:'uaR', hR:'faR',
    thL:'hips', shL:'thL', ftL:'shL', thR:'hips', shR:'thR', ftR:'shR' };
  function joints(S){
    return {
      hips:[0,.95,0], spine:[0,1.08,0], chest:[0,1.24,0], neck:[0,1.455,-.01], head:[0,1.555,0],
      uaL:[S,1.425,-.015], faL:[S+.012,1.135,-.025], hL:[S+.018,.885,-.01],
      uaR:[-S,1.425,-.015], faR:[-S-.012,1.135,-.025], hR:[-S-.018,.885,-.01],
      thL:[.095,.92,0], shL:[.1,.5,.01], ftL:[.105,.085,-.01],
      thR:[-.095,.92,0], shR:[-.1,.5,.01], ftR:[-.105,.085,-.01]
    };
  }
  function skin(geo, mat, J){
    var bones = [], names = Object.keys(BONE);
    names.forEach(function(n){ var bn = new T.Bone(); bn.name = n; bones.push(bn); });
    names.forEach(function(n, i){
      var p = PARENT[n], w = J[n];
      if (p){ var pw = J[p]; bones[i].position.set(w[0]-pw[0], w[1]-pw[1], w[2]-pw[2]); bones[BONE[p]].add(bones[i]); }
      else bones[i].position.set(w[0], w[1], w[2]);
    });
    var mesh = new T.SkinnedMesh(geo, mat);
    mesh.add(bones[0]);
    mesh.updateMatrixWorld(true);
    mesh.bind(new T.Skeleton(bones));
    mesh.frustumCulled = false;   // skinned bounds do not follow the pose
    return { mesh: mesh, bones: bones, J: J };
  }
  var MATS = {};
  function bodyMat(sleeper){
    var k = sleeper ? 'bodyS' : 'body';
    if (!MATS[k]) MATS[k] = emis(new T.MeshStandardMaterial({ vertexColors: true, roughness: sleeper ? .7 : .86, metalness: 0 }), sleeper);
    return MATS[k];
  }

  /* ---------- body ---------- */
  function buildBody(def, lod, sleeper){
    var f = def.sex === 'f', b = new Builder(), seg = lod.ring, ls = lod.limb, H = BONE;
    var S = f ? .156 : .182;
    var jacket = def.jacket, shirt = def.shirt, pants = def.pants, sk = def.skin, top = jacket || shirt;
    var chestF = function(ang){
      var fr = Math.cos(ang), m = 1;
      if (fr < 0) m -= .1 * -fr;
      if (f){ for (var s = -1; s <= 1; s += 2){ var d = Math.atan2(Math.sin(ang - s*.42), Math.cos(ang - s*.42)); m += .15 * gauss(d, .32); } }
      else m += .05 * Math.max(0, fr);
      return m;
    };
    var tc = function(){ return def.thermal ? function(ang){ return (Math.floor((ang + 7) * 26) % 2) ? shirt : shade(shirt, .92); } : shirt; };
    var hipRx = f ? .158 : .15, waistRx = f ? .128 : .15, chestRx = f ? .158 : .182, chestRz = f ? .118 : .128, belt = def.belt || pants;
    b.loft([
      { y:.82, rx:.11, rz:.09, col:pants, b:[H.hips] },
      { y:.88, rx:hipRx - .01, rz:.1, col:pants, b:[H.hips] },
      { y:.95, rx:hipRx, rz:.104, col:pants, b:[H.hips] },
      { y:.98, rx:hipRx - .004, rz:.102, col:pants, b:[H.hips] },
      { y:.98, rx:hipRx + .002, rz:.106, col:belt, b:[H.hips] },
      { y:1.025, rx:hipRx - .002, rz:.106, col:belt, b:[H.hips, H.spine, .3] },
      { y:1.025, rx:hipRx - .008, rz:.1, col:tc(), b:[H.hips, H.spine, .4] },
      { y:1.1, rx:waistRx, rz:.1, col:tc(), b:[H.spine] },
      { y:1.19, rx:(waistRx + chestRx)/2, rz:.114, col:tc(), b:[H.spine, H.chest, .5], f:chestF },
      { y:1.28, rx:chestRx, rz:chestRz, z:.006, col:tc(), b:[H.chest], f:chestF },
      { y:1.36, rx:chestRx + .005, rz:chestRz - .004, col:tc(), b:[H.chest], f:chestF },
      { y:1.42, rx:S - .01, rz:.1, z:-.01, col:tc(), b:[H.chest], p:3.2 },
      { y:1.455, rx:S - .04, rz:.084, z:-.012, col:tc(), b:[H.chest], p:2.8 },
      { y:1.48, rx:S - .085, rz:.072, z:-.012, col:tc(), b:[H.chest], p:2.4 },
      { y:1.495, rx:f ? .066 : .074, rz:f ? .06 : .066, z:-.01, col:tc(), b:[H.chest, H.neck, .3] }
    ], seg, { capBottom:true });
    var neckCol = def.collar === 'high' ? shirt : sk;
    b.loft([
      { y:1.43, rx:f ? .06 : .068, rz:f ? .056 : .062, z:-.008, col:neckCol, b:[H.chest] },
      { y:1.5, rx:f ? .051 : .058, rz:f ? .05 : .055, z:-.004, col:neckCol, b:[H.neck] },
      { y:1.6, rx:f ? .048 : .054, rz:f ? .047 : .052, z:0, col:neckCol, b:[H.neck, H.head, .8] }
    ], Math.max(8, seg - 4));
    if (def.collar === 'high'){
      b.loft([{ y:1.44, rx:.072, rz:.068, z:-.008, col:shade(shirt, .92), b:[H.chest] },
              { y:1.545, rx:.064, rz:.061, z:-.006, col:shade(shirt, .97), b:[H.neck] }], Math.max(8, seg - 4), { arc:[-2.8, 2.8], thick:.1 });
    } else if (!jacket){
      b.addGeo(new T.TorusGeometry(.06, .008, 6, Math.max(10, seg)), shade(shirt, .85), H.chest, TRS(0, 1.462, -.01, Math.PI/2 - .12, 0, 0, 1.1, 1, 1));
    }
    if (def.scarf){
      b.addGeo(new T.TorusGeometry(.068, .026, 8, Math.max(10, seg)), def.scarf, H.neck, TRS(0, 1.48, -.006, Math.PI/2 - .1, 0, 0, 1.12, 1, 1));
      }
    if (jacket){
      var jcol = function(y){ return function(ang){ return Math.abs(Math.sin(ang*7 + y*30)) < .06 ? shade(jacket, .82) : jacket; }; };
      var torn = def.jacketTorn ? function(ang){ return (Math.sin(ang*11) + Math.sin(ang*23 + 1)) * .011; } : null;
      var jr = function(y, rx, rz, z, bb, ff, p, dy){ return { y:y, rx:rx, rz:rz, z:z || 0, col:jcol(y), b:bb, f:ff, p:p, dy:dy }; };
      var gap = function(r){ return r.y > 1.3 ? .2 + (r.y - 1.3) * 3.2 : .2 + (1.3 - r.y) * .2; };
      b.loft([
        jr(.9, hipRx + .032, .128, 0, [H.hips], null, null, torn),
        jr(.98, hipRx + .024, .124, 0, [H.hips, H.spine, .3]),
        jr(1.1, waistRx + .026, .12, 0, [H.spine]),
        jr(1.2, (waistRx + chestRx)/2 + .024, .132, 0, [H.spine, H.chest, .5], chestF),
        jr(1.29, chestRx + .022, chestRz + .018, .006, [H.chest], chestF),
        jr(1.37, chestRx + .024, chestRz + .01, 0, [H.chest], chestF),
        jr(1.425, S + .008, .118, -.01, [H.chest], null, 3.2),
        jr(1.465, S - .035, .094, -.012, [H.chest], null, 2.6),
        jr(1.51, .088, .085, -.02, [H.chest, H.neck, .25])
      ], seg + 4, { arc:[gap, function(r){ return Math.PI*2 - gap(r); }], thick:.07 });
      for (var s = -1; s <= 1; s += 2){
        b.addGeo(new T.BoxGeometry(.07, .065, .012), shade(jacket, .88), H.chest, TRS(s*.1, 1.31, chestRz + .03, -.1, s*.3, 0));
        b.addGeo(new T.BoxGeometry(.09, .085, .012), shade(jacket, .88), H.hips, TRS(s*.115, .99, .138, 0, s*.5, 0));
      }
    }
    function arm(side){
      var L = side > 0, ua = L ? H.uaL : H.uaR, fa = L ? H.faL : H.faR, hd = L ? H.hL : H.hR, sx = side * S;
      var rolled = def.sleeves === 'rolled', noFore = !L && def.noRightForearm, sl = top;
      if (!f) b.addGeo(new T.SphereGeometry(1, ls + 2, ls), sl, ua, TRS(sx - side*.006, 1.41, -.014, 0, 0, side*.3, f ? .044 : .05, .055, f ? .046 : .054), H.chest, .25);
      var upper = [
        { y:1.42, x:sx + side*.006, z:-.015, rx:f ? .043 : .05, rz:f ? .046 : .054, col:sl, b:[H.chest, ua, .7] },
        { y:1.34, x:sx + side*.01, z:-.015, rx:f ? .043 : .05, rz:f ? .045 : .052, col:sl, b:[ua] },
        { y:1.24, x:sx + side*.012, z:-.02, rx:f ? .04 : .046, rz:f ? .042 : .048, col:sl, b:[ua] },
        { y:1.16, x:sx + side*.012, z:-.024, rx:.043, rz:.045, col:sl, b:[ua, fa, .25] }
      ];
      if (noFore){
        // the sleeve folds at the elbow and is pinned with folded wire
        upper[3].b = [ua];
        upper.push({ y:1.125, x:sx + side*.012, z:-.024, rx:.04, rz:.042, col:sl, b:[ua] });
        upper.push({ y:1.1, x:sx + side*.012, z:-.024, rx:.026, rz:.03, col:shade(sl, .8), b:[ua] });
        b.loft(upper, ls, { capTop:true });
        b.addGeo(new T.BoxGeometry(.05, .09, .016), shade(sl, .88), ua, TRS(sx + side*.016, 1.16, .022, .12, 0, side*.05));
        b.addGeo(new T.TorusGeometry(.011, .0022, 5, 10), 0xa8a59c, ua, TRS(sx + side*.016, 1.195, .033));
        b.addGeo(new T.TorusGeometry(.011, .0022, 5, 10), 0xa8a59c, ua, TRS(sx + side*.016, 1.15, .033, 0, 0, .6));
        return;
      }
      upper.push({ y:1.135, x:sx + side*.012, z:-.025, rx:.042, rz:.044, col:sl, b:[ua, fa, .5] });
      b.loft(upper, ls);
      var fc = rolled ? sk : sl;
      b.loft([
        { y:1.14, x:sx + side*.012, z:-.025, rx:.041, rz:.043, col:fc, b:[ua, fa, .5] },
        { y:1.06, x:sx + side*.014, z:-.022, rx:.039, rz:.04, col:fc, b:[fa] },
        { y:.96, x:sx + side*.016, z:-.016, rx:.031, rz:.029, col:fc, b:[fa] },
        { y:.9, x:sx + side*.018, z:-.012, rx:.026, rz:.024, col:rolled ? sk : shade(sl, .9), b:[fa, hd, .3] }
      ], ls, { capBottom:true });
      if (rolled){
        b.addGeo(new T.TorusGeometry(.045, .011, 6, ls + 4), shirt, ua, TRS(sx + side*.012, 1.175, -.024, Math.PI/2, 0, 0, 1, 1.05, 1));
        b.addGeo(new T.TorusGeometry(.043, .01, 6, ls + 4), shade(shirt, .9), ua, TRS(sx + side*.012, 1.152, -.024, Math.PI/2, 0, 0, 1, 1.05, 1));
        if (L && def.forearmMarks) for (var k = 0; k < 2; k++)
          b.addGeo(new T.BoxGeometry(.003, .026, .004), 0x2a1c18, fa, TRS(sx - .004 - k*.008, 1.02, .014));
      } else {
        b.addGeo(new T.TorusGeometry(.029, .007, 5, ls + 2), shade(sl, .8), fa, TRS(sx + side*.018, .912, -.012, Math.PI/2, 0, 0));
      }
      var hx = sx + side*.02;
      b.addGeo(new T.SphereGeometry(1, ls, ls - 2), sk, hd, TRS(hx, .845, -.006, 0, 0, side*.05, .022, .048, .04));
      b.addGeo(new T.SphereGeometry(1, ls, ls - 2), shade(sk, .96), hd, TRS(hx + side*.002, .79, -.004, .15, 0, side*.05, .019, .045, .036));
      b.addGeo(new T.CapsuleGeometry(.0085, .03, 3, 6), sk, hd, TRS(hx - side*.012, .835, .03, .5, 0, -side*.35));
    }
    arm(1); arm(-1);
    function leg(side){
      var L = side > 0, th = L ? H.thL : H.thR, sh = L ? H.shL : H.shR, ft = L ? H.ftL : H.ftR, x = side * .095;
      var cuff = def.boots ? shade(def.boots, 1.1) : pants;
      b.loft([
        { y:.97, x:x*.9, rx:.088, rz:.096, col:pants, b:[H.hips, th, .7] },
        { y:.85, x:x, rx:.086, rz:.09, col:pants, b:[th] },
        { y:.68, x:x + side*.003, rx:.075, rz:.078, col:pants, b:[th] },
        { y:.53, x:x + side*.005, z:.008, rx:.06, rz:.064, col:pants, b:[th, sh, .45] },
        { y:.47, x:x + side*.005, z:.01, rx:.054, rz:.058, col:pants, b:[sh] },
        { y:.33, x:x + side*.007, z:-.005, rx:.054, rz:.06, col:pants, b:[sh] },
        { y:.17, x:x + side*.009, z:-.008, rx:.045, rz:.048, col:pants, b:[sh] },
        { y:.13, x:x + side*.01, z:-.008, rx:.05, rz:.052, col:cuff, b:[sh, ft, .3] }
      ], ls);
      if (def.boots){
        b.loft([{ y:.16, x:x + side*.01, z:-.006, rx:.05, rz:.056, col:def.boots, b:[sh] },
                { y:.09, x:x + side*.01, z:0, rx:.052, rz:.06, col:def.boots, b:[ft] }], ls);
        b.addGeo(new T.SphereGeometry(1, ls + 2, ls), def.boots, ft, TRS(x + side*.01, .055, .045, 0, 0, 0, .052, .05, .125));
        b.addGeo(new T.BoxGeometry(.11, .022, .26), shade(def.boots, .55), ft, TRS(x + side*.01, .011, .04));
      } else {
        b.addGeo(new T.SphereGeometry(1, ls, ls - 2), sk, ft, TRS(x + side*.01, .1, -.005, 0, 0, 0, .04, .05, .045));
        b.addGeo(new T.SphereGeometry(1, ls, ls - 2), sk, ft, TRS(x + side*.01, .045, .05, 0, 0, 0, .042, .04, .11));
      }
    }
    leg(1); leg(-1);
    if (def.adapter){
      b.addGeo(new T.CylinderGeometry(.026, .026, .012, 14), 0x6d7378, H.hips, TRS(.12, 1.005, .122, Math.PI/2 - .1, .45, 0));
      b.addGeo(new T.CylinderGeometry(.012, .012, .014, 10), 0x7fd8ff, H.hips, TRS(.121, 1.005, .125, Math.PI/2 - .1, .45, 0));
    }
    return skin(b.geometry(true), bodyMat(sleeper), joints(S));
  }

  /* ---------- machine variant (OMEGA-7, LEDGER, HUNTER) ---------- */
  function buildMachine(def, lod){
    var b = new Builder(), seg = Math.max(10, lod.ring), H = BONE, body = def.body, trim = def.trim, S = def.bulky ? .21 : .185;
    var panel = function(ang){ return Math.abs(Math.sin(ang*4)) < .08 ? shade(trim, .6) : body; };
    b.loft([
      { y:.84, rx:.1, rz:.08, col:body, b:[H.hips] },
      { y:.95, rx:.15, rz:.1, col:trim, b:[H.hips] },
      { y:1.04, rx:.12, rz:.09, col:shade(body, .7), b:[H.hips, H.spine, .4], p:3 },
      { y:1.12, rx:.11, rz:.085, col:shade(body, .7), b:[H.spine], p:3 },
      { y:1.2, rx:.16, rz:.11, col:panel, b:[H.spine, H.chest, .6], p:3 },
      { y:1.32, rx:def.bulky ? .22 : .19, rz:.13, z:.01, col:panel, b:[H.chest], p:3.4 },
      { y:1.42, rx:S, rz:.11, col:panel, b:[H.chest], p:3.6 },
      { y:1.47, rx:.07, rz:.06, col:trim, b:[H.chest], p:2.4 }
    ], seg, { capBottom:true, capTop:true });
    for (var k = 0; k < 3; k++) b.addGeo(new T.CylinderGeometry(.035, .04, .03, 10), k%2 ? trim : shade(body, .6), H.neck, TRS(0, 1.47 + k*.03, -.005));
    b.addGeo(new T.CylinderGeometry(.022, .022, .01, 16), def.glow, H.chest, TRS(0, 1.31, .14, Math.PI/2, 0, 0));
    function limb(side){
      var L = side > 0, ua = L ? H.uaL : H.uaR, fa = L ? H.faL : H.faR, hd = L ? H.hL : H.hR, sx = side*S;
      b.addGeo(new T.SphereGeometry(.065, 12, 10), trim, ua, TRS(sx, 1.41, -.015, 0, 0, 0, 1, .9, 1));
      b.addGeo(new T.CylinderGeometry(.04, .034, .26, 10), body, ua, TRS(sx + side*.008, 1.28, -.02));
      b.addGeo(new T.SphereGeometry(.036, 10, 8), shade(trim, .8), fa, TRS(sx + side*.012, 1.135, -.025));
      b.addGeo(new T.CylinderGeometry(.036, .028, .24, 10), body, fa, TRS(sx + side*.015, 1.01, -.02));
      b.addGeo(new T.BoxGeometry(.04, .09, .06), shade(body, .8), hd, TRS(sx + side*.02, .83, -.006));
      var lx = side*.095, th = L ? H.thL : H.thR, sh = L ? H.shL : H.shR, ft = L ? H.ftL : H.ftR;
      b.addGeo(new T.CylinderGeometry(.07, .055, .4, 10), body, th, TRS(lx, .72, 0));
      b.addGeo(new T.SphereGeometry(.05, 10, 8), trim, sh, TRS(lx, .5, .01));
      b.addGeo(new T.CylinderGeometry(.052, .04, .38, 10), body, sh, TRS(lx, .29, 0));
      b.addGeo(new T.BoxGeometry(.1, .07, .24), shade(body, .7), ft, TRS(lx, .035, .04));
    }
    limb(1); limb(-1);
    var R = skin(b.geometry(true), new T.MeshStandardMaterial({ vertexColors: true, roughness: .45, metalness: .25 }), joints(S));
    var hg = new T.Group();
    var shell = new T.Mesh(new T.SphereGeometry(.105, 28, 20), new T.MeshStandardMaterial({ color: shade(body, 1.08), roughness: .35, metalness: .3 }));
    shell.scale.set(.82, 1.08, .98); shell.position.set(0, .085, 0);
    var visor = new T.Mesh(new T.SphereGeometry(.1, 24, 10, -.9, 1.8, Math.PI*.38, Math.PI*.22), new T.MeshStandardMaterial({ color: 0x0a0b0c, roughness: .12, metalness: .9 }));
    visor.scale.set(.86, 1.08, 1.04); visor.position.set(0, .085, .004); visor.rotation.y = Math.PI/2;
    var seam = new T.Mesh(new T.TorusGeometry(.087, .0025, 4, 32), new T.MeshStandardMaterial({ color: shade(trim, .7), roughness: .5, metalness: .6 }));
    seam.rotation.y = Math.PI/2; seam.position.set(0, .085, 0); seam.scale.set(1, 1.18, 1.05);
    hg.add(shell, visor, seam);
    var sensors = [], ns = def.sensors || 2;
    for (var i = 0; i < ns; i++){
      var sg = new T.Mesh(new T.SphereGeometry(ns === 1 ? .0075 : .0105, 12, 10), new T.MeshBasicMaterial({ color: def.glow }));
      sg.position.set(ns === 1 ? 0 : (i/(ns-1) - .5) * .06, .095, .101); sg.scale.set(ns === 1 ? 3.5 : 1, 1, .5);
      hg.add(sg); sensors.push(sg);
    }
    R.bones[BONE.head].add(hg);
    R.sensors = sensors;
    return R;
  }
  function dataPad(){
    var b = new Builder();
    b.addGeo(new T.BoxGeometry(.13, .19, .014), 0x1e2125, 0, null);
    b.addGeo(new T.BoxGeometry(.112, .15, .002), 0x6fd6e8, 0, TRS(0, .008, .0075));
    for (var k = 0; k < 2; k++) b.addGeo(new T.TorusGeometry(.07, .004, 4, 18), 0x9a9a96, 0, TRS(0, -.05 + k*.1, 0, 0, 0, Math.PI/2, 1, 1, .22));
    return new T.Mesh(b.geometry(false), new T.MeshStandardMaterial({ vertexColors: true, roughness: .4, metalness: .4, emissive: 0x0c3a44, emissiveIntensity: .6 }));
  }

  /* ---------- the character ---------- */
  function resolveDef(def){
    if (typeof def === 'string') def = PRESETS[def] || PRESETS[def.toUpperCase()] || { id: def };
    var d = {}, k;
    if (def.base && PRESETS[def.base]) for (k in PRESETS[def.base]) d[k] = PRESETS[def.base][k];
    for (k in def) d[k] = def[k];
    if (!d.id) d.id = 'anon';
    if (d.skin == null) d.skin = 0xb9a088;
    if (d.hair == null) d.hair = 0x241d16;
    if (d.shirt == null) d.shirt = 0x4a4a46;
    if (d.pants == null) d.pants = 0x2c2f2a;
    if (d.boots === undefined) d.boots = 0x1e1a15;
    if (!d.sex) d.sex = 'm';
    if (!d.height) d.height = d.sex === 'f' ? 1.67 : 1.77;
    if (d.hairStyle === undefined && !d.machine) d.hairStyle = 'short';
    return d;
  }
  var EXPR = {
    neutral: { raise:0, furrow:0, smile:0, frown:0 },
    stern:   { raise:-.15, furrow:.75, smile:0, frown:.3 },
    grim:    { raise:-.05, furrow:.45, smile:0, frown:.22 },
    worried: { raise:.35, furrow:-.7, smile:0, frown:.4 },
    warm:    { raise:.25, furrow:-.1, smile:.6, frown:0 },
    sleep:   { raise:0, furrow:0, smile:0, frown:0 }
  };
  function create(defIn, opts){
    three(); opts = opts || {};
    var def = resolveDef(defIn), lod = LOD[opts.lod] || LOD.med, sleeper = !!opts.sleeper;
    var root = new T.Group(); root.name = 'human:' + def.id;
    var inner = new T.Group(); root.add(inner);
    var sc = def.height / 1.75; inner.scale.setScalar(sc);
    var machine = !!def.machine;
    var B = machine ? buildMachine(def, lod) : buildBody(def, lod, sleeper);
    inner.add(B.mesh);
    var bones = B.bones, J = B.J, bn = function(n){ return bones[BONE[n]]; };
    var headR = null;
    if (!machine){
      headR = buildHead(def, lod, sleeper);
      headR.group.position.set(0, .062, .014);
      bn('head').add(headR.group);
    }
    if (opts.castShadow){ B.mesh.castShadow = true; if (headR) headR.head.castShadow = true; }
    var REST = {};
    function setRest(n, x, y, z){ REST[n] = [x, y, z]; bn(n).rotation.set(x, y, z); }
    setRest('uaL', .04, 0, .1); setRest('uaR', .04, 0, -.1);
    setRest('faL', -.18, 0, 0); setRest('faR', -.18, 0, 0);
    if (def.noRightForearm) setRest('uaR', .02, 0, -.05);
    if (def.datapad && !sleeper){
      setRest('uaL', -.2, 0, .14); setRest('faL', -1.5, -.25, 0);
      var pad = dataPad(); pad.position.set(-.01, -.09, .04); pad.rotation.set(-.2, -.5, 1.5);
      bn('hL').add(pad);
    }
    if (opts.armed){
      setRest('uaL', -1.0, 0, .25); setRest('uaR', -.85, 0, -.2);
      setRest('faL', -.55, .3, 0); setRest('faR', -.9, -.2, 0);
      if (opts.rifle){ var rf = opts.rifle; rf.position.set(.06/sc, 1.3/sc, .26/sc); rf.rotation.set(0, -.45, -.08); rf.scale.multiplyScalar(1/sc); inner.add(rf); }
    }
    var st = {
      t: Math.random()*10, seed: Math.random()*100, talking: false, talkAmt: 0, jaw: 0,
      blinkT: 1 + Math.random()*3, blink: 0, blinkDir: 0,
      expr: EXPR[def.expr] || EXPR.neutral, cur: { raise:0, furrow:0, smile:0, frown:0 },
      emote: null, emoteT: 0, look: { x:0, y:0 }, lookT: 0, eyeTarget: { x:0, y:0 }, phase: Math.random()*6.28,
      moving: false, sleep: sleeper
    };
    var ud = root.userData;
    ud.def = def; ud.bones = bones; ud.head = headR; ud.lod = opts.lod || 'med'; ud.sensors = B.sensors || null;
    ud.legL = bn('thL'); ud.legR = bn('thR'); ud.armL = bn('uaL'); ud.armR = bn('uaR');
    ud.phase = st.phase; ud.armed = !!opts.armed;
    ud.setTalking = function(b){ st.talking = !!b; };
    ud.setExpression = function(n){ st.expr = EXPR[n] || EXPR.neutral; };
    ud.playEmote = function(n){ st.emote = n; st.emoteT = 0; };
    ud.faceToward = function(x, z){ root.rotation.y = Math.atan2(x - root.position.x, z - root.position.z); };
    ud.lookAt = function(x, y){ st.eyeTarget.x = x; st.eyeTarget.y = y; };
    ud.update = function(dt){ animate(dt, false); };
    ud.tick = function(dt, moving, runMul){
      var mul = runMul || 1;
      if (moving){
        st.phase += dt * 7 * mul;
        var s = Math.sin(st.phase) * .55 * mul;
        ud.legL.rotation.x = s; ud.legR.rotation.x = -s;
        bn('shL').rotation.x = Math.max(0, -Math.cos(st.phase)) * .8 * mul;
        bn('shR').rotation.x = Math.max(0, Math.cos(st.phase)) * .8 * mul;
        if (!ud.armed){ ud.armL.rotation.x = -s*.8; ud.armR.rotation.x = s*.8; bn('faL').rotation.x = -.4; bn('faR').rotation.x = -.4; }
        bn('hips').position.y = J.hips[1] + Math.abs(Math.cos(st.phase)) * .025;
        st.moving = true;
      } else {
        ud.legL.rotation.x *= .8; ud.legR.rotation.x *= .8;
        bn('shL').rotation.x *= .8; bn('shR').rotation.x *= .8;
        bn('hips').position.y = J.hips[1];
        if (!ud.armed){
          ud.armL.rotation.x = REST.uaL[0] + Math.sin(st.t*1.4)*.04; ud.armR.rotation.x = REST.uaR[0] + Math.sin(st.t*1.4+1)*.04;
          bn('faL').rotation.x = REST.faL[0]; bn('faR').rotation.x = REST.faR[0];
        }
        st.moving = false;
      }
      animate(dt, true);
    };
    function animate(dt, fromTick){
      st.t += dt;
      var t = st.t;
      var br = Math.sin(t * (st.talking ? 1.9 : 1.35) + st.seed);
      bn('chest').scale.set(1 + br*.008, 1 + br*.006, 1 + br*.016);
      if (!st.moving && !sleeper){
        var sway = Math.sin(t*.45 + st.seed);
        bn('hips').rotation.z = sway * .018; bn('hips').position.x = sway * .008;
        bn('spine').rotation.z = -sway * .012;
        if (!fromTick && !ud.armed){
          var ar = Math.sin(t*1.35 + st.seed) * .02;
          ud.armL.rotation.x = REST.uaL[0] + ar; ud.armR.rotation.x = REST.uaR[0] + ar;
        }
      }
      st.talkAmt += ((st.talking ? 1 : 0) - st.talkAmt) * Math.min(1, dt * 8);
      var syl = Math.max(0, Math.sin(t * 13.5 + Math.sin(t * 3.7) * 2.2)) * (.45 + .55 * noise1(t * 2.6, st.seed));
      var phrase = sstep(.25, .45, noise1(t * .9, st.seed + 3));
      st.jaw += (st.talkAmt * syl * (.35 + .65 * phrase) - st.jaw) * Math.min(1, dt * 22);
      var em = st.expr, cur = st.cur, k = Math.min(1, dt * 4);
      var emph = st.talkAmt * Math.max(0, noise1(t * 1.6, st.seed + 9) - .55) * 2.2;
      cur.raise += ((em.raise + emph*.5) - cur.raise) * k;
      cur.furrow += (em.furrow - cur.furrow) * k;
      cur.smile += (em.smile - cur.smile) * k;
      cur.frown += (em.frown - cur.frown) * k;
      var hx = Math.sin(t*.7 + st.seed) * .025 + st.talkAmt * (Math.sin(t*2.3) * .035 + emph * .06);
      var hy = Math.sin(t*.37 + st.seed*2) * .04 + st.talkAmt * Math.sin(t*1.1 + 1) * .05;
      var hz = Math.sin(t*.51 + st.seed) * .02 + st.talkAmt * Math.sin(t*1.7) * .025;
      if (st.emote){
        st.emoteT += dt; var e = st.emoteT;
        if (st.emote === 'nod'){ hx += Math.sin(e * 9) * .16 * Math.max(0, 1 - e/.9); if (e > .9) st.emote = null; }
        else if (st.emote === 'shake'){ hy += Math.sin(e * 10) * .2 * Math.max(0, 1 - e/1.1); if (e > 1.1) st.emote = null; }
        else st.emote = null;
      }
      if (!sleeper){
        bn('head').rotation.set(hx * .6, hy * .6, hz * .6);
        bn('neck').rotation.set(hx * .4, hy * .4, hz * .4);
      }
      if (headR){
        var mi = headR.head.morphTargetInfluences;
        mi[0] = st.jaw * .95; mi[1] = cur.smile * (1 - st.jaw*.5); mi[2] = cur.frown;
        if (headR.beard){ var bi = headR.beard.morphTargetInfluences; bi[0] = mi[0]; bi[1] = mi[1]; bi[2] = mi[2]; }
        st.blinkT -= dt;
        if (st.blinkT <= 0 && !st.blinkDir){ st.blinkDir = 1; st.blinkT = Math.random() < .15 ? .25 : 1.8 + Math.random()*3.5; }
        if (st.blinkDir){ st.blink += st.blinkDir * dt * 14; if (st.blink >= 1){ st.blink = 1; st.blinkDir = -1; } else if (st.blink <= 0){ st.blink = 0; st.blinkDir = 0; } }
        if (headR.lidU){
          headR.lidU.rotation.x = mix(-.42 - cur.raise*.1 + cur.furrow*.08, .3, st.blink);
          headR.lidL.rotation.x = mix(.42, .32, st.blink);
        }
        st.lookT -= dt;
        if (st.lookT <= 0){ st.lookT = .6 + Math.random()*2.2; st.look.x = st.eyeTarget.x + (Math.random()-.5)*.18; st.look.y = st.eyeTarget.y + (Math.random()-.5)*.1; }
        for (var i = 0; i < headR.eyes.length; i++){
          var ep = headR.eyes[i];
          ep.rotation.y += (st.look.x - ep.rotation.y) * Math.min(1, dt*18);
          ep.rotation.x += (-st.look.y - ep.rotation.x) * Math.min(1, dt*18);
        }
        for (var j = 0; j < headR.brows.length; j++){
          var bp = headR.brows[j], sd = bp.userData.side;
          bp.position.y = bp.userData.base.y + cur.raise * .005 - Math.abs(cur.furrow) * .0012;
          bp.rotation.z = sd * cur.furrow * .2;
          bp.position.x = bp.userData.base.x - sd * cur.furrow * .002;
        }
      }
      if (B.sensors){
        for (var s2 = 0; s2 < B.sensors.length; s2++){
          var pulse = .75 + .25 * Math.sin(t*2 + s2) + st.talkAmt * syl * .9;
          B.sensors[s2].material.color.setHex(def.glow).multiplyScalar(Math.min(1.6, pulse));
        }
      }
    }
    ud.animate = animate;
    animate(0, false);
    return root;
  }

  /* ---------- tube occupants ---------- */
  var SLEEPER_FACES = [
    { id:'s1', sex:'m', skin:0xc9a68a, hair:0x2a1d14, hairStyle:'crop', eyes:0x3a2a1c, age:35 },
    { id:'s2', sex:'f', skin:0x8e6a52, hair:0x15100c, hairStyle:'loose', eyes:0x2a1f18, age:27 },
    { id:'s3', sex:'m', skin:0xe0c2a8, hair:0x6a5a48, hairStyle:'short', eyes:0x4d5a63, age:52, wrinkles:.5 },
    { id:'s4', sex:'f', skin:0xb98e70, hair:0x3a2a1c, hairStyle:'loose', eyes:0x3a2a1c, age:44 },
    { id:'s5', sex:'m', skin:0x6e4e38, hair:0x0e0c0a, hairStyle:'crop', eyes:0x241a14, age:30, stubble:.4 },
    { id:'s6', sex:'f', skin:0xd8b8a0, hair:0x8a6a4a, hairStyle:'bun', eyes:0x4f6a7a, age:23 }
  ];
  function createSleeper(o){
    three(); o = o || {};
    var base = o.angela ? PRESETS.ANGELA : SLEEPER_FACES[(o.index || 0) % SLEEPER_FACES.length];
    var def = {}; for (var k in base) def[k] = base[k];
    def.shirt = 0x8d9092; def.pants = 0x878a8d; def.jacket = null; def.boots = null; def.belt = 0x7a7d80; def.collar = 'crew';
    def.expr = 'sleep'; if (!o.angela) def.height = def.sex === 'f' ? 1.64 : 1.74;
    var h = create(def, { lod: o.lod || 'low', sleeper: true });
    var ud = h.userData, bones = ud.bones, bn = function(n){ return bones[BONE[n]]; };
    var P = { uaL:[-.15,0,.42], uaR:[-.12,0,-.38], faL:[-.5,0,0], faR:[-.42,0,0], thL:[-.18,0,.06], thR:[-.08,0,-.05], shL:[.32,0,0], shR:[.22,0,0], spine:[.06,0,0], head:[.32,0,0] };
    for (var n in P) bn(n).rotation.set(P[n][0], P[n][1], P[n][2]);
    var t0 = Math.random()*10;
    ud.float = function(dt, t, detail){
      var tt = t + t0;
      h.position.y = (o.baseY || 0) + Math.sin(tt*.6) * .035;
      h.rotation.y = (o.baseRot || 0) + Math.sin(tt*.21) * .25;
      h.rotation.z = Math.sin(tt*.33) * .02;
      if (!detail) return;
      ud.animate(dt, true);
      bn('uaL').rotation.z = P.uaL[2] + Math.sin(tt*.7) * .07;
      bn('uaR').rotation.z = P.uaR[2] - Math.sin(tt*.63 + 1) * .07;
      bn('faL').rotation.x = P.faL[0] + Math.sin(tt*.5) * .08;
      bn('thL').rotation.x = P.thL[0] + Math.sin(tt*.4) * .05;
      bn('thR').rotation.x = P.thR[0] + Math.sin(tt*.45 + 2) * .05;
      bn('head').rotation.x = P.head[0] + Math.sin(tt*.5) * .05;
      bn('head').rotation.y = Math.sin(tt*.3) * .08;
      if (ud.head && ud.head.hairExtra){ ud.head.hairExtra.rotation.x = Math.sin(tt*.8)*.08 - .05; ud.head.hairExtra.position.y = Math.sin(tt*.9)*.006 + .01; }
    };
    return h;
  }

  /* ---------- suspension tubes ----------
     All static hardware for every tube merges into one mesh, the glass
     into one, the amber fluid into one shader mesh, the bubbles into one
     GPU-animated point cloud and the name plates into one atlas mesh:
     a handful of draw calls for the whole hall, however many tubes. */
  var TAKEN = ['R. OKAFOR','J. LINDQVIST','M. HADDAD','T. NGUYEN','S. MORALES','D. KOWALSKI','A. BRENNAN','L. ADEYEMI','K. TANAKA','P. RUIZ',
    'E. VOSS','H. CHAUDHRY','N. PETROV','C. AMARA','B. HOLLIS','F. ITO','G. MENSAH','O. WEBB','I. SORENSEN','V. CASTILLO','Y. KAPOOR',
    'W. FIELDS','Z. NOVAK','Q. DARROW','U. BELL','X. MARIN','R. CHO','M. ESTES','J. ABARA','S. LUND'];
  function buildTubes(list, o){
    three(); o = o || {};
    var q = o.quality || 'med';
    var segs = q === 'high' ? 28 : q === 'med' ? 20 : 14;
    var grp = new T.Group(), hw = new Builder(), glass = new Builder();
    var fpos = [], fuv = [], fhi = [], fidx = [];
    var bubbleN = q === 'high' ? 26 : q === 'med' ? 16 : 9;
    var bpos = [], bseed = [], bhi = [], plates = [];
    var R0 = .45, GY0 = .34, GY1 = 2.62;
    var metal = 0x3b454b, dark = 0x1d2226, cable = 0x15181a, brass = 0x8a7448;
    var rnd = rng('tubes');
    list.forEach(function(e, i){
      var x = e[0], z = e[1], ang = !!e[2], side = x > 0 ? -1 : 1;   // side: toward the aisle
      hw.addGeo(new T.CylinderGeometry(.56, .62, .22, segs), dark, 0, TRS(x, .11, z));
      hw.addGeo(new T.CylinderGeometry(.5, .55, .12, segs), metal, 0, TRS(x, .28, z));
      hw.addGeo(new T.TorusGeometry(.47, .025, 6, segs), brass, 0, TRS(x, GY0, z, Math.PI/2, 0, 0));
      hw.addGeo(new T.TorusGeometry(.47, .025, 6, segs), brass, 0, TRS(x, GY1, z, Math.PI/2, 0, 0));
      hw.addGeo(new T.CylinderGeometry(.52, .5, .2, segs), metal, 0, TRS(x, GY1 + .1, z));
      hw.addGeo(new T.CylinderGeometry(.3, .5, .2, segs), dark, 0, TRS(x, GY1 + .3, z));
      hw.addGeo(new T.CylinderGeometry(.09, .12, .4, 10), metal, 0, TRS(x, GY1 + .58, z));
      for (var k = 0; k < 3; k++){
        var a = k/3*Math.PI*2 + Math.PI/6 + (side > 0 ? 0 : Math.PI);
        hw.addGeo(new T.BoxGeometry(.035, GY1 - GY0, .035), metal, 0, TRS(x + Math.cos(a)*.5, (GY0 + GY1)/2, z + Math.sin(a)*.5, 0, -a, 0));
      }
      // cables from the cap down into the body (the occupant's back faces away from the aisle)
      var bx = -side*.12, cy = 1.95;
      [[[x + bx*.5 + .1, GY1, z + .1], [x + bx*1.6, 2.35, z + .16], [x + bx*1.3, cy + .05, z + .05], [x + bx, cy - .1, z + .02]],
       [[x + bx*.5 - .1, GY1, z - .1], [x + bx*1.7, 2.3, z - .2], [x + bx*1.25, cy, z - .06], [x + bx, cy - .16, z - .02]],
       [[x + bx*2.4, GY0 + .02, z], [x + bx*2.6, .8, z + .05], [x + bx*1.6, 1.25, z], [x + bx, 1.4, z]]
      ].forEach(function(c){
        var cv = new T.CatmullRomCurve3(c.map(function(p){ return new T.Vector3(p[0], p[1], p[2]); }));
        hw.addGeo(new T.TubeGeometry(cv, q === 'low' ? 8 : 16, .011, 5, false), cable, 0, null);
      });
      var hc = new T.CatmullRomCurve3([new T.Vector3(x, GY1 + .5, z), new T.Vector3(x - side*.2, GY1 + .7, z - .1),
        new T.Vector3(x - side*.66, 2.0, z - .2), new T.Vector3(x - side*.72, .1, z - .25)]);
      hw.addGeo(new T.TubeGeometry(hc, q === 'low' ? 10 : 20, .03, 6, false), cable, 0, null);
      hw.addGeo(new T.BoxGeometry(.02, .03, .1), ang ? 0xffb347 : 0x8ad7a8, 0, TRS(x + side*.6, .2, z));
      glass.addGeo(new T.CylinderGeometry(R0, R0, GY1 - GY0, segs, 1, true), 0xffffff, 0, TRS(x, (GY0 + GY1)/2, z));
      var fg = new T.CylinderGeometry(R0 - .02, R0 - .02, GY1 - GY0 - .03, segs, 3, false);
      fg.translate(x, (GY0 + GY1)/2, z);
      var p = fg.attributes.position, uvA = fg.attributes.uv, base = fpos.length/3;
      for (var vi = 0; vi < p.count; vi++){ fpos.push(p.getX(vi), p.getY(vi), p.getZ(vi)); fuv.push(uvA.getX(vi), (p.getY(vi) - GY0)/(GY1 - GY0)); fhi.push(ang ? 1 : 0); }
      var ix = fg.index.array; for (var j = 0; j < ix.length; j++) fidx.push(ix[j] + base);
      fg.dispose();
      for (var b2 = 0; b2 < bubbleN; b2++){
        var ra = rnd()*Math.PI*2, rr = Math.sqrt(rnd()) * (R0 - .07);
        bpos.push(x + Math.cos(ra)*rr, GY0 + .03, z + Math.sin(ra)*rr); bseed.push(rnd()); bhi.push(ang ? 1 : 0);
      }
      plates.push({ x: x, z: z, side: side, name: ang ? 'ANGELA M.' : TAKEN[i % TAKEN.length], hi: ang });
      hw.addGeo(new T.BoxGeometry(.05, .5, .05), metal, 0, TRS(x + side*.6 - side*.035, .45, z));
    });
    var hwMesh = new T.Mesh(hw.geometry(false), new T.MeshStandardMaterial({ vertexColors: true, roughness: .5, metalness: .6 }));
    hwMesh.receiveShadow = true;
    var glassMesh = new T.Mesh(glass.geometry(false), new T.MeshStandardMaterial({ color: 0x000000, roughness: .08, metalness: .1,
      transparent: true, opacity: .16, depthWrite: false, side: T.DoubleSide }));
    // black albedo: glass reflects, it does not scatter (a pale albedo turned the tube white under the flashlight)
    glassMesh.material.onBeforeCompile = sleeperKnee; glassMesh.material.customProgramCacheKey = function(){ return 'sleeperKnee'; };
    glassMesh.renderOrder = 3;
    var fgeo = new T.BufferGeometry();
    fgeo.setAttribute('position', new T.Float32BufferAttribute(fpos, 3));
    fgeo.setAttribute('uv', new T.Float32BufferAttribute(fuv, 2));
    fgeo.setAttribute('aHi', new T.Float32BufferAttribute(fhi, 1));
    fgeo.setIndex(fidx); fgeo.computeVertexNormals();
    var fMat = new T.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { uTime: { value: 0 }, uCol: { value: new T.Color(o.fluid || 0xd98a2b) }, uFogColor: { value: new T.Color(0) }, uFogDensity: { value: 0 } },
      vertexShader: [
        'attribute float aHi; varying float vHi; varying vec2 vUv; varying vec3 vW; varying vec3 vN; varying float vFogDepth;',
        'void main(){ vHi = aHi; vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal);',
        '  vec4 mv = viewMatrix * w; vFogDepth = -mv.z; gl_Position = projectionMatrix * mv; }'
      ].join('\n'),
      fragmentShader: [
        'uniform float uTime; uniform vec3 uCol; uniform vec3 uFogColor; uniform float uFogDensity;',
        'varying float vHi; varying vec2 vUv; varying vec3 vW; varying vec3 vN; varying float vFogDepth;',
        'float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
        'float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);',
        '  return mix(mix(h(i), h(i+vec2(1.0,0.0)), f.x), mix(h(i+vec2(0.0,1.0)), h(i+vec2(1.0,1.0)), f.x), f.y); }',
        'void main(){',
        '  vec3 V = normalize(cameraPosition - vW); float fr = 1.0 - abs(dot(V, normalize(vN)));',
        '  vec2 q = vec2(vUv.x * 9.0, vW.y * 2.2 - uTime * .35);',
        '  float c = n2(q) * .6 + n2(q * 2.3 + uTime * .2) * .4; c = pow(c, 2.2);',
        '  float grad = mix(1.1, .5, vUv.y);',
        '  vec3 col = uCol * (grad + c * .9) * (1.0 + vHi * .5);',
        '  float a = clamp(.2 + fr * .36 + c * .12 + vHi * .06, 0.0, .75);',
        '  float fog = 1.0 - exp(-uFogDensity * uFogDensity * vFogDepth * vFogDepth);',
        '  col = mix(col, uFogColor, fog); a *= 1.0 - fog * .6;',
        '  gl_FragColor = vec4(col, a);',
        '  #include <tonemapping_fragment>',
        '  #include <colorspace_fragment>',
        '}'
      ].join('\n')
    });
    var fluid = new T.Mesh(fgeo, fMat); fluid.renderOrder = 2;
    var bgeo = new T.BufferGeometry();
    bgeo.setAttribute('position', new T.Float32BufferAttribute(bpos, 3));
    bgeo.setAttribute('aSeed', new T.Float32BufferAttribute(bseed, 1));
    bgeo.setAttribute('aHi', new T.Float32BufferAttribute(bhi, 1));
    var bMat = new T.ShaderMaterial({
      transparent: true, depthWrite: false, blending: T.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uH: { value: GY1 - GY0 - .1 }, uScale: { value: 800 } },
      vertexShader: [
        'attribute float aSeed; attribute float aHi; uniform float uTime; uniform float uH; uniform float uScale; varying float vA;',
        'void main(){ vec3 p = position; float sp = .14 + aSeed * .3; float y = fract(aSeed * 17.0 + uTime * sp / uH);',
        '  p.y += y * uH; p.x += sin(uTime * 2.0 + aSeed * 40.0) * .018; p.z += cos(uTime * 1.7 + aSeed * 30.0) * .018;',
        '  vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv;',
        '  gl_PointSize = max(1.5, (.006 + aSeed * .012) * uScale / -mv.z);',
        '  vA = (1.0 - y * .7) * smoothstep(0.0, .06, y) * (.6 + aHi * .3); }'
      ].join('\n'),
      fragmentShader: [
        'varying float vA; void main(){ vec2 c = gl_PointCoord - .5; float d = length(c); if (d > .5) discard;',
        '  float ring = smoothstep(.5, .38, d) * (.3 + smoothstep(.2, .44, d) * .7); gl_FragColor = vec4(vec3(1.0, .86, .62) * ring * vA, 1.0); }'
      ].join('\n')
    });
    var bubbles = new T.Points(bgeo, bMat); bubbles.renderOrder = 4; bubbles.frustumCulled = false;
    // name plates: one atlas texture, one mesh
    var cols = 2, rows = Math.ceil(plates.length / cols), PW = 256, PH = 56;
    var cv = document.createElement('canvas'); cv.width = PW*cols; cv.height = PH*rows;
    var g = cv.getContext('2d');
    plates.forEach(function(pl, i){
      var px = (i % cols) * PW, py = Math.floor(i / cols) * PH;
      g.fillStyle = pl.hi ? '#1d1407' : '#0c1214'; g.fillRect(px, py, PW, PH);
      g.strokeStyle = pl.hi ? 'rgba(255,190,90,.95)' : 'rgba(174,233,255,.45)'; g.lineWidth = 3; g.strokeRect(px + 3, py + 3, PW - 6, PH - 6);
      g.fillStyle = pl.hi ? '#ffd38a' : '#bfe3ef'; g.font = 'bold ' + (pl.hi ? 30 : 25) + 'px monospace'; g.textAlign = 'center';
      g.fillText(pl.name, px + PW/2, py + PH/2 + 10);
    });
    var ptex = new T.CanvasTexture(cv); ptex.colorSpace = T.SRGBColorSpace; ptex.anisotropy = 4;
    var pp = [], pu = [], pi = [];
    plates.forEach(function(pl, i){
      var w = pl.hi ? .8 : .62, hh = w * PH / PW, cx = pl.x + pl.side * .6, cy = .78, cz = pl.z, dz = pl.side * w/2;
      var u0 = (i % cols) / cols, u1 = u0 + 1/cols, v1 = 1 - Math.floor(i / cols) / rows, v0 = v1 - 1/rows, b0 = pp.length/3;
      pp.push(cx, cy - hh/2, cz + dz, cx, cy - hh/2, cz - dz, cx, cy + hh/2, cz - dz, cx, cy + hh/2, cz + dz);
      pu.push(u0, v0, u1, v0, u1, v1, u0, v1);
      pi.push(b0, b0 + 1, b0 + 2, b0, b0 + 2, b0 + 3);
    });
    var pgeo = new T.BufferGeometry();
    pgeo.setAttribute('position', new T.Float32BufferAttribute(pp, 3));
    pgeo.setAttribute('uv', new T.Float32BufferAttribute(pu, 2));
    pgeo.setIndex(pi);
    var plateMesh = new T.Mesh(pgeo, new T.MeshBasicMaterial({ map: ptex, side: T.DoubleSide, toneMapped: false, color: 0xd8d8d8 }));
    grp.add(hwMesh, plateMesh);
    var occ = [], occLod = q === 'high' ? 'med' : 'low';
    list.forEach(function(e, i){
      var face = e[0] > 0 ? -Math.PI/2 : Math.PI/2;   // face the aisle
      var s = createSleeper({ angela: !!e[2], index: i, lod: e[2] && q !== 'low' ? 'med' : occLod, baseY: .44, baseRot: face + (rnd() - .5) * .5 });
      s.scale.setScalar(.92);
      s.position.set(e[0], .44, e[1]);
      grp.add(s); occ.push(s);
    });
    grp.add(glassMesh, fluid, bubbles);
    return {
      group: grp, occupants: occ, plates: plateMesh, fluid: fluid,
      animate: function(dt, t, cam, fog, pixelH){
        fMat.uniforms.uTime.value = t; bMat.uniforms.uTime.value = t;
        if (fog){ fMat.uniforms.uFogColor.value.copy(fog.color); fMat.uniforms.uFogDensity.value = fog.density || 0; }
        bMat.uniforms.uScale.value = pixelH || 800;
        for (var i = 0; i < occ.length; i++){
          var s = occ[i];
          var d2 = cam ? (s.position.x - cam.x) * (s.position.x - cam.x) + (s.position.z - cam.z) * (s.position.z - cam.z) : 0;
          s.visible = d2 < 26*26;
          if (s.visible) s.userData.float(dt, t, d2 < 12*12);
        }
      }
    };
  }

  global.WakingHumans = { sleeperFaces: SLEEPER_FACES, create: create, createSleeper: createSleeper, buildTubes: buildTubes, presets: PRESETS, LOD: LOD, EXPR: EXPR };
})(window);
