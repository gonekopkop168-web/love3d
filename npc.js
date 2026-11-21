// npc.js — playable / autonomous characters ("girl" Mina, "boy" Dara).
// A character is either controlled by the player (hidden, first-person camera) or driven by AI:
// walks room to room, goes outside and back in, opens/closes doors, climbs stairs, idles, repeats.
import { createGlbRig } from './glbrig.js';

// glb (optional): { scene, height } — a Mixamo-rigged 3D model that replaces the built-in body (used for Ny Ny and G1 G1).
export function createCharacter({ THREE, scene, doors, cols, player, FL, STEP, kind = 'girl', name = 'Mina', start = 'HC', spots = [], look = {}, at = null, avoid = null, glb = null }) {

  /* ================= WAYPOINT GRAPH [x, z, floorY] ================= */
  const N = {
    OUT2: [3, 16, 0], OUT1: [3, 11.5, 0], GARD: [-6, 9.5, 0], E1: [11.5, 9, 0], PARK: [14.5, 9, 0], E2: [12, 0, 0], E3: [12, -9, 0],
    POOLE: [7.8, -9.2, 0], POOLM: [0, -9.2, 0], POOLW: [-7.8, -9.2, 0], W3: [-12, -9, 0], W2: [-12, 0, 0], W1: [-11.5, 9, 0],
    FDo: [3, 8.4, 0], FDi: [3, 5.6, 0], HC: [4, 4, 0], H2: [6.8, 5.5, 0],
    HLa: [1.2, 3, 0], HLb: [-1.2, 3, 0], LV: [-3.2, 3, 0], LKa: [-2, 1.2, 0], LKb: [-2, -1.2, 0], KIT: [-4.5, -1.5, 0],
    GGa: [2.5, 2.2, 0], GGb: [2.5, -0.2, 0], GUEST: [3, -1.2, 0],
    BTa: [7.5, 2.2, 0], BTb: [7.5, -0.2, 0], BT1: [7.5, -1.2, 0], BATH: [7, -3, 0],
    A0: [7.4, 6.8, 0], A: [8.8, 6.8, 0], B: [8.8, 2.0, FL],
    UH1: [6, 2.6, FL], UH2: [3, 4, FL], MDa: [1.2, 3, FL], MDb: [-1.2, 3, FL], MASTER: [-4, 3, FL],
    UBa: [7.5, 2.2, FL], UBb: [7.5, -0.2, FL], UB1: [7.5, -1.2, FL], UBATH: [7, -3, FL],
    U3a: [2.5, 2.2, FL], U3b: [2.5, -0.2, FL], BED3: [3, -1.2, FL], C1: [1.2, -3, FL], C2: [-1.2, -3, FL], BED2: [-4, -3, FL],
    SOFA: [-6, 4.0, 0], DINA: [-4.2, -2.4, 0], DINB: [-2.8, -2.4, 0], GBED: [1.6, -3.5, 0], DESKA: [-2.5, -4.6, FL],
    B3: [1.6, -3.5, FL], MB: [-7.0, 2.5, FL], B2: [-6.1, -3.5, FL],
    R1: [3, 45, 0], R2: [3, 75, 0], CAFE: [3, 98, 0], CAFEd: [3, 102.3, 0], CAFEi: [3, 105.6, 0],
    J84: [3, 84, 0], PR1: [-25, 84, 0], PR2: [-60, 84, 0], PR3: [-95, 84, 0], PR4: [-130, 84, 0], PR5: [-165, 84, 0], PHo: [-172, 84, 0], PHi: [-179.5, 84, 0], PHc: [-184, 84, 0],
  };
  const EDGES = [ // [from, to, optional door [x, z, floorY] between them]
    ['OUT1', 'OUT2'], ['OUT1', 'GARD'], ['OUT1', 'E1'], ['E1', 'PARK'], ['E1', 'E2'], ['E2', 'E3'], ['E3', 'POOLE'], ['POOLE', 'POOLM'],
    ['POOLM', 'POOLW'], ['POOLW', 'W3'], ['W3', 'W2'], ['W2', 'W1'], ['W1', 'OUT1'],
    ['OUT1', 'FDo'], ['FDo', 'FDi', [3, 7, 0]], ['FDi', 'HC'],
    ['HC', 'HLa'], ['HLa', 'HLb', [0, 3, 0]], ['HLb', 'LV'], ['LV', 'LKa'], ['LKa', 'LKb', [-2, 0, 0]], ['LKb', 'KIT'],
    ['HC', 'GGa'], ['GGa', 'GGb', [2.5, 1, 0]], ['GGb', 'GUEST'],
    ['HC', 'BTa'], ['BTa', 'BTb', [7.5, 1, 0]], ['BTb', 'BT1'], ['BT1', 'BATH'],
    ['HC', 'H2'], ['H2', 'A0'], ['A0', 'A'], ['A', 'B'],
    ['B', 'UH1'], ['UH1', 'UH2'], ['UH2', 'MDa'], ['MDa', 'MDb', [0, 3, FL]], ['MDb', 'MASTER'],
    ['UH1', 'UBa'], ['UBa', 'UBb', [7.5, 1, FL]], ['UBb', 'UB1'], ['UB1', 'UBATH'],
    ['UH1', 'U3a'], ['U3a', 'U3b', [2.5, 1, FL]], ['U3b', 'BED3'], ['BED3', 'C1'], ['C1', 'C2', [0, -3, FL]], ['C2', 'BED2'],
    ['LV', 'SOFA'], ['KIT', 'DINA'], ['KIT', 'DINB'], ['GUEST', 'GBED'], ['BED2', 'DESKA'], ['C1', 'B3'], ['MASTER', 'MB'], ['BED2', 'B2'],
    ['OUT2', 'R1'], ['R1', 'R2'], ['R2', 'CAFE'], ['CAFE', 'CAFEd'], ['CAFEd', 'CAFEi', [3, 103.5, 0]],
    ['R2', 'J84'], ['J84', 'CAFE'], ['J84', 'PR1'], ['PR1', 'PR2'], ['PR2', 'PR3'], ['PR3', 'PR4'], ['PR4', 'PR5'], ['PR5', 'PHo'], ['PHo', 'PHi', [-176, 84, 0]], ['PHi', 'PHc'],
  ];
  const adj = {}, dEdge = {};
  for (const [a, b, d] of EDGES) { (adj[a] ||= []).push(b); (adj[b] ||= []).push(a); if (d) dEdge[a + '>' + b] = dEdge[b + '>' + a] = d; }
  const doorOf = (a, b) => { const d = dEdge[a + '>' + b]; return d && doors.find(o => Math.abs(o.pos.x - d[0]) < .3 && Math.abs(o.pos.z - d[1]) < .3 && Math.abs(o.pos.y - (d[2] + 1)) < .5); };
  const DEST = [['LV', 'the living room'], ['KIT', 'the kitchen'], ['GUEST', 'the guest room'], ['BATH', 'the bathroom'], ['MASTER', 'the master bedroom'],
    ['BED2', 'bedroom 2'], ['BED3', 'bedroom 3'], ['UBATH', 'the upstairs bathroom'], ['UH2', 'the upstairs hall'], ['HC', 'the hall'],
    ['POOLM', 'the pool'], ['PARK', 'the parking area'], ['GARD', 'the garden'], ['OUT2', 'the front yard'], ['CAFEi', 'the coffee shop']];

  function route(from, to) { // Dijkstra
    const dist = { [from]: 0 }, prev = {}, todo = new Set(Object.keys(N));
    while (todo.size) {
      let u = null; for (const n of todo) if (dist[n] !== undefined && (u === null || dist[n] < dist[u])) u = n;
      if (u === null || u === to) break; todo.delete(u);
      for (const v of adj[u] || []) { const w = dist[u] + Math.hypot(N[u][0] - N[v][0], N[u][1] - N[v][1]); if (dist[v] === undefined || w < dist[v]) { dist[v] = w; prev[v] = u; } }
    }
    const p = [to]; while (p[0] !== from) p.unshift(prev[p[0]]); return p;
  }
  const nearestNode = (x, z, y) => Object.keys(N).reduce((best, n) => {
    const s = Math.hypot(N[n][0] - x, N[n][1] - z) + (Math.abs(N[n][2] - y) > 1.5 ? 50 : 0);
    return s < best[1] ? [n, s] : best;
  }, ['HC', 1e9])[0];

  /* ================= MODEL HELPERS ================= */
  const mat = (c, r = .6) => new THREE.MeshStandardMaterial({ color: c, roughness: r });
  const tex = (w, h, draw) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'));
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; return t;
  };
  const part = (parent, geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; parent.add(o); return o; };
  const WHITE = new THREE.MeshBasicMaterial({ color: 0xffffff });

  /* ---- girl (long black hair, striped sweater, gray pleated skirt, flip-flops) ---- */
  function buildGirl() {
    const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    const SKIN = mat(look.skin ?? 0xf6cdb4, .7), HAIR = mat(look.hair ?? 0x14141a, .3), SKIRT = mat(0x8f98a3, .85), SANDAL = mat(0x9aa0aa, .3);
    const st = tex(64, 256, x => {
      x.fillStyle = '#f4f0e6'; x.fillRect(0, 0, 64, 256); x.fillStyle = look.shirt || '#4a5f94';
      x.fillRect(0, 0, 64, 56); x.fillRect(0, 238, 64, 18); for (let y = 76; y < 230; y += 24) x.fillRect(0, y, 64, 8);
    });
    const SW = new THREE.MeshStandardMaterial({ map: st, roughness: .9 });
    const mkLeg = sx => {
      const p = new THREE.Group(); p.position.set(sx * .085, .8, 0); body.add(p);
      part(p, new THREE.CylinderGeometry(.055, .05, .4, 10), SKIN, 0, -.2, 0);
      const sh = new THREE.Group(); sh.position.y = -.4; p.add(sh); p.userData.shin = sh;
      part(sh, new THREE.CylinderGeometry(.05, .045, .4, 10), SKIN, 0, -.2, 0);
      part(sh, new THREE.BoxGeometry(.1, .025, .27), SANDAL, 0, -.39, .05);
      part(sh, new THREE.BoxGeometry(.085, .02, .08), SKIN, 0, -.365, .1); return p;
    };
    const legL = mkLeg(-1), legR = mkLeg(1);
    part(body, new THREE.CylinderGeometry(.17, .25, .3, 16), SKIRT, 0, .88, 0).scale.z = .85;
    part(body, new THREE.CylinderGeometry(.15, .165, .46, 16), SW, 0, 1.25, 0).scale.z = .72;
    const mkArm = sx => {
      const p = new THREE.Group(); p.position.set(sx * .2, 1.44, 0); p.rotation.z = sx * .06; body.add(p);
      part(p, new THREE.CylinderGeometry(.05, .047, .28, 10), SW, 0, -.14, 0); part(p, new THREE.SphereGeometry(.046, 10, 8), SW, 0, -.28, 0);   // upper arm + elbow
      const el = new THREE.Group(); el.position.y = -.28; p.add(el); p.userData.el = el; p.userData.ey = -.28;
      part(el, new THREE.CylinderGeometry(.047, .045, .26, 10), SW, 0, -.13, 0); part(el, new THREE.SphereGeometry(.04, 10, 8), SKIN, 0, -.28, 0); return p;
    };
    const armL = mkArm(-1), armR = mkArm(1);
    part(body, new THREE.CylinderGeometry(.04, .045, .1, 10), SKIN, 0, 1.51, 0);
    const head = new THREE.Group(); head.position.set(0, 1.6, 0); body.add(head);
    part(head, new THREE.SphereGeometry(.11, 20, 16), SKIN, 0, 0, 0).scale.set(.95, 1.08, .95);
    const eyeM = mat(0x3b4252, .3);
    for (const s of [-1, 1]) {
      part(head, new THREE.SphereGeometry(.018, 10, 8), eyeM, s * .04, .005, .092).scale.z = .4;
      part(head, new THREE.SphereGeometry(.005, 6, 6), WHITE, s * .036, .012, .108);
      part(head, new THREE.BoxGeometry(.045, .006, .01), HAIR, s * .04, .04, .097);
    }
    part(head, new THREE.BoxGeometry(.03, .007, .008), mat(0xc77b7b), 0, -.05, .098);
    part(head, new THREE.SphereGeometry(.12, 20, 16), HAIR, 0, .015, -.035).scale.set(1, 1.05, 1);
    part(head, new THREE.BoxGeometry(.21, .055, .045), HAIR, 0, .075, .075);
    part(head, new THREE.BoxGeometry(.27, .62, .07), HAIR, 0, -.32, -.075);
    for (const s of [-1, 1]) part(head, new THREE.CapsuleGeometry(.028, .42, 4, 8), HAIR, s * .118, -.25, .02);
    return { g, body, legL, legR, armL, armR, head, tagY: 1.98, hipH: .8 };
  }

  /* ---- boy (messy brown hair, black/green jersey, ripped black jeans, sneakers, watch) ---- */
  function buildBoy() {
    const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    const SKIN = mat(look.skin ?? 0xd9a77f, .7), JEANS = mat(0x1b1c20, .85), HAIR = mat(look.hair ?? 0x4a3a2c, .6), SHOE = mat(0x15161a, .7), SOLE = mat(0xeeeeee, .8);
    const jt = tex(128, 256, x => {
      x.fillStyle = '#17181c'; x.fillRect(0, 0, 128, 256);
      x.fillStyle = look.shirt || '#6fae3c'; x.beginPath(); x.moveTo(74, 0); x.lineTo(98, 0); x.lineTo(98, 256); x.lineTo(50, 256); x.lineTo(50, 200); x.lineTo(66, 130); x.lineTo(58, 110); x.closePath(); x.fill();
      x.strokeStyle = '#e9e7da'; x.lineWidth = 3; x.stroke();
      x.fillStyle = '#e9e7da'; x.beginPath(); x.ellipse(44, 60, 9, 7, 0, 0, 7); x.fill();
      x.fillRect(36, 190, 3, 66); x.fillRect(100, 190, 3, 66);
    });
    jt.offset.x = .5; // put the chest design at the front of the cylinder
    const sl = tex(32, 128, x => {
      x.fillStyle = '#17181c'; x.fillRect(0, 0, 32, 128); x.fillStyle = look.shirt2 || '#b9d334'; x.fillRect(0, 0, 32, 74);
      x.fillStyle = '#eceadc'; x.fillRect(6, 14, 20, 34);
    });
    const JER = new THREE.MeshStandardMaterial({ map: jt, roughness: .85 }), SLV = new THREE.MeshStandardMaterial({ map: sl, roughness: .85 });
    const mkLeg = sx => {
      const p = new THREE.Group(); p.position.set(sx * .09, .86, 0); body.add(p);
      part(p, new THREE.CylinderGeometry(.065, .058, .43, 10), JEANS, 0, -.215, 0);
      const sh = new THREE.Group(); sh.position.y = -.43; p.add(sh); p.userData.shin = sh;
      part(sh, new THREE.CylinderGeometry(.058, .05, .43, 10), JEANS, 0, -.215, 0);
      part(sh, new THREE.BoxGeometry(.075, .075, .012), SKIN, 0, -.02, .056);       // ripped knee
      part(sh, new THREE.BoxGeometry(.105, .06, .29), SHOE, 0, -.37, .06);
      part(sh, new THREE.BoxGeometry(.112, .03, .3), SOLE, 0, -.405, .06); return p;
    };
    const legL = mkLeg(-1), legR = mkLeg(1);
    part(body, new THREE.CylinderGeometry(.175, .17, .2, 16), JEANS, 0, .93, 0).scale.z = .75;
    part(body, new THREE.CylinderGeometry(.16, .17, .52, 18), JER, 0, 1.23, 0).scale.z = .72;
    const mkArm = sx => {
      const p = new THREE.Group(); p.position.set(sx * .215, 1.46, 0); p.rotation.z = sx * .05; body.add(p);
      part(p, new THREE.CylinderGeometry(.055, .05, .36, 10), SLV, 0, -.18, 0); part(p, new THREE.SphereGeometry(.052, 10, 8), SLV, 0, -.36, 0);   // upper arm + elbow
      const el = new THREE.Group(); el.position.y = -.36; p.add(el); p.userData.el = el; p.userData.ey = -.36;
      part(el, new THREE.CylinderGeometry(.044, .038, .26, 8), SKIN, 0, -.14, 0);
      part(el, new THREE.SphereGeometry(.042, 10, 8), SKIN, 0, -.29, 0);
      if (sx < 0) part(el, new THREE.CylinderGeometry(.05, .05, .035, 14), mat(0x111111, .4), 0, -.2, 0); // watch
      return p;
    };
    const armL = mkArm(-1), armR = mkArm(1);
    part(body, new THREE.CylinderGeometry(.045, .05, .1, 10), SKIN, 0, 1.52, 0);
    const head = new THREE.Group(); head.position.set(0, 1.67, 0); body.add(head);
    part(head, new THREE.SphereGeometry(.105, 20, 16), SKIN, 0, 0, 0).scale.set(.95, 1.1, .97);
    const eyeM = mat(0x3a2a20, .3), browM = mat(0x2b2018, .6);
    for (const s of [-1, 1]) {
      part(head, new THREE.SphereGeometry(.016, 10, 8), eyeM, s * .04, .005, .095).scale.z = .4;
      part(head, new THREE.SphereGeometry(.005, 6, 6), WHITE, s * .036, .011, .108);
      part(head, new THREE.BoxGeometry(.05, .011, .01), browM, s * .04, .038, .1).rotation.z = s * -.25; // stern brows
    }
    part(head, new THREE.BoxGeometry(.012, .03, .015), mat(0xc4906b), 0, -.015, .104);
    part(head, new THREE.BoxGeometry(.035, .005, .008), mat(0xa5664f), 0, -.05, .1);
    part(head, new THREE.SphereGeometry(.115, 18, 14), HAIR, 0, .035, -.03);
    for (let i = 0; i < 9; i++) { // messy spikes on top
      const a = i / 9 * Math.PI * 2, r = .075;
      const c = part(head, new THREE.ConeGeometry(.032, .1, 5), HAIR, Math.cos(a) * r, .145, Math.sin(a) * r - .03);
      c.rotation.set(Math.sin(a) * .6, 0, -Math.cos(a) * .6);
    }
    for (const x of [-.07, -.025, .025, .07]) part(head, new THREE.ConeGeometry(.026, .07, 5), HAIR, x, .085, .09).rotation.x = Math.PI - .35; // fringe
    return { g, body, legL, legR, armL, armR, head, tagY: 2.05, hipH: .86 };
  }

  const built = kind === 'boy' ? buildBoy() : buildGirl();
  const { g, body, legL, legR, armL, armR, head } = built;
  let { tagY, hipH } = built;
  g.rotation.order = 'YXZ'; scene.add(g);
  const armZ0 = [armL.rotation.z, armR.rotation.z];

  /* ---- optional 3D model: the built-in body stays as an invisible "puppet" that all animations drive; the real skeleton copies it ---- */
  let rig = null;
  if (glb) {
    try {
      rig = createGlbRig(THREE, glb.scene, { height: glb.height || 1.7 });
      const old = []; body.traverse(o => { if (o.isMesh) old.push(o); }); old.forEach(o => o.removeFromParent());   // drop the box/cylinder body
      body.add(rig.root); hipH = rig.hipH; tagY = rig.height + .26;
    } catch (e) { console.warn('3D model not usable, keeping the built-in body', e); rig = null; }
  }

  // name tag
  const tagC = document.createElement('canvas'); tagC.width = 320; tagC.height = 80;
  const tagT = new THREE.CanvasTexture(tagC); tagT.colorSpace = THREE.SRGBColorSpace;
  const tag = new THREE.Sprite(new THREE.SpriteMaterial({ map: tagT, transparent: true })); tag.scale.set(.9, .225, 1); tag.position.y = tagY; g.add(tag);
  function setTag(status) {
    const t = tagC.getContext('2d'); t.clearRect(0, 0, 320, 80);
    t.fillStyle = 'rgba(15,18,24,.72)'; t.beginPath(); t.roundRect(4, 4, 312, 72, 18); t.fill();
    t.textAlign = 'center'; t.fillStyle = '#ffd98a'; t.font = 'bold 28px system-ui'; t.fillText(name, 160, 36);
    t.fillStyle = '#fff'; t.font = '20px system-ui'; t.fillText(status, 160, 62); tagT.needsUpdate = true;
  }

  /* ================= BRAIN ================= */
  const SPEED = 1.35;
  let spd = SPEED, fT = 0, fPN = '', carryDoor = null, rideCar = null;
  let rideDrv = false, script = null, si = 0, sWait = 0, sDone = null, cup = null, drinking = false, disposed = false; // scripted (customer) behaviour
  let inScript = false, actDur = null, actTag = null, playP = null, cueM = null, wTo = null, faceO = null;
  let workTo = { x: 0, z: 0 }, barBusy = false;          // barista duty (stand behind the coffee counter)
  const pos = at ? { x: at[0], z: at[1], y: 0 } : { x: N[start][0], z: N[start][1], y: N[start][2] };
  const col = { x0: 0, x1: 0, z0: 0, z1: 0, y0: 0, y1: 0, on: true }; cols.push(col);
  let cur = start, dest = 'the hall', path = [], k = 1, seg = null, state = 'idle', idleT = 2, phase = 0, sf = 0, ang = 0, t = 0;
  let act = null, enterT = 0, seatT = 0, ox = 0, oz = 0, oy = 0; // current sit/sleep action
  let fresh = false, drvSeat = null, drvHug = false, drvSwim = false;
  let hugT = 0, hugDur = 5, hugPrev = 'talk', hugFrom = { x: 0, z: 0 }, hugTo = { x: 0, z: 0 }, hugFace = 0;
  const closeList = [];

  function startSeg() {
    const a = k > 0 ? N[path[k - 1]] : [pos.x, pos.z, pos.y], b = N[path[k]];
    seg = { len: Math.max(.01, Math.hypot(b[0] - a[0], b[1] - a[1])), y0: a[2], y1: b[2] };
  }
  function plan() {
    let to, label; act = null;
    const free = spots.filter(s => s.node && !s.taken);
    if (free.length && Math.random() < .4) { // sometimes go sit down or sleep
      act = free[Math.floor(Math.random() * free.length)]; act.taken = name; to = act.node; label = act.type === 'sleep' ? 'bed' : 'sit down';
    } else { const opts = DEST.filter(d => d[0] !== cur); [to, label] = opts[Math.floor(Math.random() * opts.length)]; }
    path = route(cur, to);
    k = Math.hypot(pos.x - N[cur][0], pos.z - N[cur][1]) > .2 ? 0 : 1; // walk to the first node if we aren't on it
    if (k >= path.length) k = path.length - 1;
    startSeg(); state = 'walk'; setTag('Going to ' + label); cur = to; dest = label;
  }

  function updateBody(dt) {
    if (state === 'player' || disposed) return;
    t += dt;
    for (let i = closeList.length - 1; i >= 0; i--) { // close doors behind us (only if the player isn't standing there)
      const d = closeList[i];
      if (Math.hypot(pos.x - d.pos.x, pos.z - d.pos.z) > 1.5 && Math.hypot(player.x - d.pos.x, player.z - d.pos.z) > 1.3) { d.open = false; closeList.splice(i, 1); }
    }
    if (state === 'enter' || state === 'seated') { actStep(dt); return; }
    if (state === 'hug') { hugStep(dt); return; }
    let walking = 0, face = null;
    spd = SPEED;
    if (state === 'follow') { followPlan(dt); const pd = Math.hypot(player.x - pos.x, player.z - pos.z); spd = pd > 4 ? Math.min(6.5, 1.6 + (pd - 4) * .8) : 1.6; }
    if (state === 'ride') { rideStep(); return; }
    if (state === 'idle') {
      idleT -= dt; if (idleT <= 0) plan();
    } else if (state === 'script') {                     // scripted route (used by coffee-shop customers)
      const p = script[si];
      if (!p) { const cb = sDone; sDone = null; state = 'idle'; idleT = 1e9; if (cb) cb(); }
      else if (sWait > 0) {
        face = p.face ?? null; sWait -= dt; if (p.anim) p.anim(dt);
        if (faceO !== null) face = faceO;
        if (wTo) { const wx = wTo.x - pos.x, wz = wTo.z - pos.z, wd = Math.hypot(wx, wz); if (wd > .06) { walking = 1; face = Math.atan2(wx, wz); const st = Math.min(wd, 1.3 * dt); pos.x += wx / wd * st; pos.z += wz / wd * st; } else wTo = null; }
        if (p.until ? p.until() : sWait <= 0) { sWait = 0; if (p.after) p.after(); si++; }   // wait for a time, or until a condition is true
      } else {
        const dx = p.x - pos.x, dz = p.z - pos.z, dist = Math.hypot(dx, dz); let go = true;
        if (p.door) {
          const d = p.door, dd = Math.hypot(d.pos.x - pos.x, d.pos.z - pos.z);
          if (dd < 2.2) d.open = true;                                                       // open the door ahead
          if (dd < 1.3 && d.ang < 1.1 && (d.pos.x - pos.x) * dx + (d.pos.z - pos.z) * dz > 0) go = false; // wait for the swing
        }
        face = Math.atan2(dx, dz);
        if (go && dist > .08) { walking = 1; const s = Math.min(dist, 1.3 * dt); pos.x += dx / dist * s; pos.z += dz / dist * s; }
        const inSt = pos.x >= 7.9 && pos.x <= 9.7 && pos.z > 2.2 && pos.z < 6.7;
        pos.y += ((inSt ? (Math.min(14, Math.floor((6.7 - pos.z) / .3)) + 1) * STEP : (p.y ?? 0)) - pos.y) * Math.min(1, dt * 14);
        if (dist <= .08) {
          if (p.door && !closeList.includes(p.door)) closeList.push(p.door);
          drinking = !!p.drink; if (p.arrive) p.arrive();
          if (p.sit) startSit(p);                                           // sit down on a chair, the script resumes when we stand up
          else if (p.until) { sWait = 1e9; if (p.tag) setTag(p.tag); }
          else if (p.wait) { sWait = p.wait; if (p.tag) setTag(p.tag); } else si++;
        }
      }
    } else if (state === 'work') {                       // barista: walk to the station behind the counter, then face the customers
      const dx = workTo.x - pos.x, dz = workTo.z - pos.z, dist = Math.hypot(dx, dz);
      if (dist > .05) { face = Math.atan2(dx, dz); walking = 1; const s = Math.min(dist, 1.2 * dt); pos.x += dx / dist * s; pos.z += dz / dist * s; }
      else face = Math.PI;
    } else if (state === 'talk') {                       // stopped: stand still and look at the player
      face = Math.atan2(player.x - pos.x, player.z - pos.z);
    } else if (state === 'follow' && !path.length) {     // close to the player's area: walk straight to them
      const dx = player.x - pos.x, dz = player.z - pos.z, dist = Math.hypot(dx, dz);
      face = Math.atan2(dx, dz);
      if (dist > 1.7) { walking = 1; const s = Math.min(dist - 1.5, spd * dt); pos.x += dx / dist * s; pos.z += dz / dist * s; }
      const inSt = pos.x >= 7.9 && pos.x <= 9.7 && pos.z > 2.2 && pos.z < 6.7;
      const ty = inSt ? (Math.min(14, Math.floor((6.7 - pos.z) / .3)) + 1) * STEP : (player.y > 1.6 ? FL : 0);
      pos.y += (ty - pos.y) * Math.min(1, dt * 14);
    } else {
      const [tx, tz] = N[path[k]], dx = tx - pos.x, dz = tz - pos.z, dist = Math.hypot(dx, dz);
      const door = k > 0 ? doorOf(path[k - 1], path[k]) : carryDoor; let go = true;
      if (door) {
        const dd = Math.hypot(door.pos.x - pos.x, door.pos.z - pos.z), ahead = (door.pos.x - pos.x) * dx + (door.pos.z - pos.z) * dz > 0;
        if (ahead && dd < 2.0) door.open = true;              // auto-open
        if (ahead && dd < 1.3 && door.ang < 1.1) go = false;  // wait for the swing
      }
      face = Math.atan2(dx, dz);
      if (go) { walking = 1; const s = Math.min(dist, spd * dt), d = Math.max(dist, 1e-6); pos.x += dx / d * s; pos.z += dz / d * s; }
      const inStairs = pos.x >= 7.9 && pos.x <= 9.7 && pos.z > 2.2 && pos.z < 6.7;
      const ty = inStairs ? (Math.min(14, Math.floor((6.7 - pos.z) / .3)) + 1) * STEP : (1 - dist / seg.len < .5 ? seg.y0 : seg.y1);
      pos.y += (ty - pos.y) * Math.min(1, dt * 14);
      if (dist < .06) {
        if (door && !closeList.includes(door)) closeList.push(door);
        k++; carryDoor = null;
        if (k >= path.length) {
          pos.y = N[path[k - 1]][2];
          if (state === 'follow') { path = []; }
          else if (act) { state = 'enter'; enterT = 0; ox = pos.x; oz = pos.z; oy = pos.y; setTag(act.type === 'sleep' ? 'Getting into bed' : 'Sitting down'); }
          else { state = 'idle'; idleT = 4 + Math.random() * 5; setTag('Relaxing in ' + dest); }
        }
        else startSeg();
      }
    }
    sf += (walking - sf) * Math.min(1, dt * 8); phase += sf * dt * 7 * Math.max(1, spd / 1.6);
    const sw = Math.sin(phase) * .6 * sf;
    legL.rotation.x = sw; legR.rotation.x = -sw; armL.rotation.x = -sw * .7; armR.rotation.x = sw * .7;
    body.position.y = Math.abs(Math.cos(phase)) * .02 * sf;
    head.rotation.y = state === 'idle' ? Math.sin(t * .7) * .4 : 0;
    if (state === 'work') {                                        // look around, or make coffee while a customer orders
      head.rotation.y = barBusy ? 0 : Math.sin(t * .6) * .3;
      if (barBusy) { armL.rotation.x = -.7 + Math.sin(t * 5) * .25; armR.rotation.x = -.7 + Math.cos(t * 4) * .25; }
    }
    if (cup && cup.visible) { const sb = drinking && sWait > 0 ? Math.max(0, Math.sin(t * 1.6)) : 0; if (rig) mouth(sb); else armR.rotation.x = -1.0 - sb * .5; } // hold / sip the coffee
    if (playP) { const a = playP.a, sv = playP.s; body.rotation.x = .38 * a; head.rotation.x = .3 * a; armL.rotation.x = -1.2 * a; armL.userData.el.rotation.x = -.18 * a; armR.rotation.x = -.35 * a; armR.userData.el.rotation.x = a * (-1.43 + .25 * sv); }  // playing pool
    if (avoid && pos.y < .8 && (state === 'idle' || state === 'walk' || state === 'follow' || state === 'talk' || state === 'script' || state === 'work')) {   // walk around parked vehicles instead of into them
      const hx = Math.sin(ang), hz = Math.cos(ang);
      for (const [cx, cz, cr] of avoid()) {
        const dx = pos.x - cx, dz = pos.z - cz, d = Math.hypot(dx, dz), m = cr + .32;
        if (d < m && d > 1e-4) {
          const nx = dx / d, nz = dz / d, tx = -nz, tz = nx, sg = (tx * hx + tz * hz) >= 0 ? 1 : -1;
          pos.x += nx * (m - d) + tx * sg * 1.6 * dt; pos.z += nz * (m - d) + tz * sg * 1.6 * dt;       // pushed out + slid around the side we're heading to
        }
      }
    }
    if (face !== null) { let df = face - ang; df = Math.atan2(Math.sin(df), Math.cos(df)); ang += df * Math.min(1, dt * 8); }
    g.position.set(pos.x, pos.y, pos.z); g.rotation.y = ang;
    Object.assign(col, { x0: pos.x - .25, x1: pos.x + .25, z0: pos.z - .25, z1: pos.z + .25, y0: pos.y, y1: pos.y + 1.7 });
  }

  /* ---- sit / sleep actions ---- */
  const drop = hipH - (rig ? .54 : .47), legs = [legL, legR], shins = [legL.userData.shin, legR.userData.shin];
  function resetPose() {
    body.position.y = 0; g.rotation.x = 0; legs.forEach(l => l.rotation.x = 0); shins.forEach(s => s.rotation.x = 0);
    armL.rotation.x = armR.rotation.x = 0; armL.userData.el.rotation.x = armR.userData.el.rotation.x = 0; armL.rotation.z = armZ0[0]; armR.rotation.z = armZ0[1]; armL.rotation.y = armR.rotation.y = 0;
    body.rotation.x = 0; head.rotation.z = 0; head.rotation.x = 0; sf = 0; bikeGrip = false; bikeTilt = 0; bikeAbd = 0;
  }
  let bikeGrip = false, bikeTilt = 0, bikeAbd = 0;
  function dreamRide() {   // riding the Honda Dream: hips on the rear of the seat, thighs forward, feet on the footrests, back leaning, arms reaching the grips
    legs.forEach(l => l.rotation.x = -1.1); shins.forEach(s => s.rotation.x = 1.26);                 // thighs nearly level, shins hanging down to the footrests
    armL.rotation.x = armR.rotation.x = -1.05; armL.userData.el.rotation.x = armR.userData.el.rotation.x = -.85;   // slightly bent elbows, hands on the grips
    body.rotation.x = 0; bikeTilt = .7; bikeAbd = .3; head.rotation.x = -.5; bikeGrip = true;
  }
  function pose(e, s = act) {
    if (s.type === 'sleep') { g.rotation.x = -Math.PI / 2 * e; return; } // lie on back
    body.position.y = -drop * e; legs.forEach(l => l.rotation.x = -1.5 * e); shins.forEach(s => s.rotation.x = 1.5 * e);
    armL.rotation.x = armR.rotation.x = -.4 * e;
  }
  function leave() {
    const s = act; resetPose(); pos.x = s.ex; pos.z = s.ez; pos.y = s.by; cur = s.node; s.taken = null; act = null;
    g.position.set(pos.x, pos.y, pos.z);
    if (inScript) { inScript = false; actDur = null; actTag = null; state = 'script'; si++; sWait = 0; setTag('Leaving 👋'); return; } // customers carry on with their script
    state = 'idle'; idleT = 1.5; setTag(s.type === 'sleep' ? 'Just woke up' : 'Just stood up');
  }
  function actStep(dt) {
    const s = act, sleep = s.type === 'sleep';
    const tx = sleep ? s.px - s.hd * .8 : s.x, tz = sleep ? s.pz : s.z, ty = sleep ? s.y + .17 : s.by;
    const fa = sleep ? -s.hd * Math.PI / 2 : s.yaw + Math.PI;
    if (state === 'enter') {
      enterT = Math.min(1, enterT + dt / .7);
      pos.x = ox + (tx - ox) * enterT; pos.z = oz + (tz - oz) * enterT; pos.y = oy + (ty - oy) * enterT; pose(enterT);
      if (enterT >= 1) { state = 'seated'; seatT = actDur ?? (sleep ? 12 + Math.random() * 10 : 8 + Math.random() * 8); setTag(actTag ?? (sleep ? 'Sleeping 💤' : s.pc ? 'Using the computer 💻' : 'Sitting')); }
    } else { seatT -= dt; if (seatT <= 0) { leave(); return; } pose(1); if (s.pc) typing(); }
    let df = fa - ang; df = Math.atan2(Math.sin(df), Math.cos(df)); ang += df * Math.min(1, dt * 10);
    head.rotation.y = 0; g.position.set(pos.x, pos.y, pos.z); g.rotation.y = ang;
    if (cup && cup.visible && !sleep) { const sipB = state === 'seated' ? Math.max(0, Math.sin(t * 1.6)) : 0; if (rig) mouth(sipB); else armR.rotation.x = -1.0 - sipB * .5; } // sip while seated
    Object.assign(col, { x0: pos.x - .25, x1: pos.x + .25, z0: pos.z - .25, z1: pos.z + .25, y0: pos.y, y1: pos.y + 1.7 });
  }

  function driveBody(dt, d) { // animate this body while the human controls it (only visible in third-person view)
    if (state !== 'player') return;
    t += dt;
    if (fresh) { ang = d.yaw + Math.PI; fresh = false; }
    const s = d.seat;
    if ((drvSeat && !s) || (drvHug && !d.hug) || (drvSwim && !d.swim)) resetPose();
    drvSeat = s; drvHug = !!d.hug; drvSwim = !!d.swim;
    if (d.hug) {
      let df = d.hug.ang - ang; df = Math.atan2(Math.sin(df), Math.cos(df)); ang += df * Math.min(1, dt * 8);
      sf = 0; legL.rotation.x = legR.rotation.x = 0; hugPose(d.hug.e); g.position.set(d.x, d.y, d.z);
    } else if (s) {
      const sleep = s.type === 'sleep';
      g.position.set(sleep ? s.px - s.hd * .8 : s.x, sleep ? s.y + .17 : s.by, sleep ? s.pz : s.z);
      const fa = sleep ? -s.hd * Math.PI / 2 : s.yaw + Math.PI;
      let df = fa - ang; df = Math.atan2(Math.sin(df), Math.cos(df)); ang += df * Math.min(1, dt * 10);
      pose(1, s); head.rotation.y = 0;
      if (s.pc) typing();
      if (s.bike) { if (s.dream) dreamRide(); else { armL.rotation.x = armR.rotation.x = -1.2; body.rotation.x = .12; } }   // hands on the handlebar
      if (d.eating) { const bite = Math.max(0, Math.sin(t * 3.2)); if (rig) mouth(bite); else armR.rotation.x = -1.3 - bite * .9; head.rotation.x = bite * .15; }   // spoon to the mouth
    } else if (d.swim) {                                  // swimming: lie flat on the water and paddle
      const sp = Math.hypot(d.vx, d.vz); sf += ((sp > .3 ? 1 : .35) - sf) * Math.min(1, dt * 6); phase += sf * dt * 6;
      g.rotation.x = 1.4; body.position.y = 0; head.rotation.y = 0;
      armL.rotation.x = -2.5 + Math.sin(phase) * .7; armR.rotation.x = -2.5 + Math.sin(phase + Math.PI) * .7;
      legL.rotation.x = Math.sin(phase * 2) * .3; legR.rotation.x = -Math.sin(phase * 2) * .3;
      if (sp > .3) { let df = Math.atan2(d.vx, d.vz) - ang; df = Math.atan2(Math.sin(df), Math.cos(df)); ang += df * Math.min(1, dt * 6); }
      g.position.set(d.x - Math.sin(ang) * 1.5, d.swimY, d.z - Math.cos(ang) * 1.5);
    } else {
      const sp = Math.hypot(d.vx, d.vz), w = sp > .3 ? 1 : 0;
      sf += (w - sf) * Math.min(1, dt * 8); phase += sf * dt * 7 * Math.max(1, sp / 4.2);
      const sw = Math.sin(phase) * .6 * sf;
      legL.rotation.x = sw; legR.rotation.x = -sw; armL.rotation.x = -sw * .7; armR.rotation.x = sw * .7;
      body.position.y = Math.abs(Math.cos(phase)) * .02 * sf; head.rotation.y = 0;
      if (sp > .3) { let df = Math.atan2(d.vx, d.vz) - ang; df = Math.atan2(Math.sin(df), Math.cos(df)); ang += df * Math.min(1, dt * 10); }
      g.position.set(d.x, d.y, d.z);
    }
    if (cup && cup.visible && !d.hug && !d.swim && !s) { if (rig) mouth(0); else armR.rotation.x = -1.0; }   // holding something: keep the arm raised
    if (cradle && !d.hug && !d.swim && !s) cradlePose();   // carrying the baby
    if (phoneUp && !d.hug && !d.swim && !s) { armL.rotation.x = -.7; armL.userData.el.rotation.x = -1.5; armL.rotation.z = armZ0[0] + .35; head.rotation.x = .2; }   // looking at the phone
    g.rotation.y = ang;
  }

  /* ---- 3D model driver ---- */
  const rigSt = { dt: 0, t: 0, sf: 0, run: 0, swim: false, legs: [legL, legR], arms: [armL, armR], head, grip: [false, false] };
  let runT = 0, runS = 0;
  const mouth = b => { armR.rotation.x = -.7 - .45 * b; armR.rotation.y = -.15 - .65 * b; armR.userData.el.rotation.x = -1.6 - .6 * b; };   // right hand lifts the spoon / cup to the mouth
  function rigNeutral() { armL.rotation.y = armR.rotation.y = 0; if (!phoneUp) armL.userData.el.rotation.x = 0; armR.userData.el.rotation.x = 0; }
  function rigApply(dt) {
    if (!rig || !g.visible || disposed) return;
    runS += (runT - runS) * Math.min(1, dt * 5);
    rigSt.tilt = bikeTilt; rigSt.abd = bikeAbd; rigSt.armOut = bikeAbd ? .15 : 0; rigSt.dt = dt; rigSt.t = t; rigSt.sf = sf; rigSt.run = runS; rigSt.swim = drvSwim;
    rigSt.grip[0] = bikeGrip || !!phoneUp || !!(cueM && cueM.visible); rigSt.grip[1] = bikeGrip || !!(cup && cup.visible) || !!(cueM && cueM.visible);
    rig.apply(rigSt);
  }
  function update(dt) {
    if (rig && state !== 'player' && !disposed) rigNeutral();
    updateBody(dt);
    if (rig && state !== 'player') { runT = sf > .2 ? Math.max(0, Math.min(1, (spd - 2.6) / 2.4)) : 0; rigApply(dt); }
  }
  function drive(dt, d) {
    if (rig && state === 'player') rigNeutral();
    driveBody(dt, d);
    if (rig && state === 'player') { const sp = Math.hypot(d.vx, d.vz); runT = !d.swim && !d.seat && !d.hug && sp > 4.6 ? Math.min(1, (sp - 4.6) / 1.9) : 0; rigApply(dt); }
  }

  /* ---- coffee cup + clean-up (customers) ---- */
  function setCup(on) {
    if (!cup) {
      cup = new THREE.Group();
      part(cup, new THREE.CylinderGeometry(.035, .028, .09, 10), new THREE.MeshStandardMaterial({ color: 0xf4efe6, roughness: .6 }), 0, 0, 0);
      part(cup, new THREE.CylinderGeometry(.038, .038, .015, 10), mat(0x4a2c1a, .5), 0, .05, 0);
      if (rig) { cup.position.set(0, -.09, .05); cup.rotation.x = 2.3; rig.anchors[1].add(cup); } else { cup.position.set(0, -.56, .07); cup.rotation.x = 1.0; armR.add(cup); }
    }
    cup.visible = on;
  }
  function typing() {   // working at the computer: hands on the keyboard
    const k = Math.sin(t * 10);
    armL.rotation.x = -.7 + k * .04; armR.rotation.x = -.7 - k * .04;
    armL.userData.el.rotation.x = -.95 + Math.sin(t * 9) * .1; armR.userData.el.rotation.x = -.95 + Math.sin(t * 11 + 1) * .1;
    head.rotation.x = .12; body.rotation.x = .06;
  }
  let phoneUp = false, phoneM = null;   // the phone is held in the character's real right hand (armL, because the body faces +z)
  function setPhone(on) {   // hold a smartphone up in the right hand
    if (on && !phoneM) {
      phoneM = new THREE.Group();
      const b = new THREE.Mesh(new THREE.BoxGeometry(.075, .15, .012), mat(0x15171c, .3)); phoneM.add(b);
      const sc = new THREE.Mesh(new THREE.PlaneGeometry(.065, .135), new THREE.MeshBasicMaterial({ color: 0x7cc8ff })); sc.position.z = -.0066; sc.rotation.y = Math.PI; phoneM.add(sc);
      phoneM.rotation.x = 2.0; if (rig) { phoneM.position.set(0, -.1, .07); rig.anchors[0].add(phoneM); } else { phoneM.position.set(0, -.34, .09); armL.userData.el.add(phoneM); }   // counter-rotated so the phone stands upright, screen toward the face
    }
    if (phoneM) phoneM.visible = on;
    phoneUp = on; if (!on) { armL.userData.el.rotation.x = 0; armL.rotation.z = armZ0[0]; head.rotation.x = 0; }
  }
  function setTool(on) {   // pool cue held in the right hand
    if (!cueM) { cueM = new THREE.Mesh(new THREE.CylinderGeometry(.008, .014, 1.45, 8), mat(0xd9b382, .4)); cueM.position.set(0, -.885 - armR.userData.ey + (rig ? .27 : 0), .03); (rig ? rig.anchors[1] : armR.userData.el).add(cueM); }
    cueM.visible = on; if (!on) { playP = null; resetPose(); }
  }
  function play(a, sv) { playP = { a, s: sv || 0 }; }
  function startSit(p) { act = p.sit; act.taken = name; actDur = p.dur ?? null; actTag = p.tag ?? null; inScript = true; state = 'enter'; enterT = 0; ox = pos.x; oz = pos.z; oy = pos.y; setTag('Sitting down'); }
  function setOutfit(g2) {   // swap the 3D body for another rigged model (different clothes); held items move to the new hands
    if (!rig || !g2) return false;
    let nr; try { nr = createGlbRig(THREE, g2.scene, { height: g2.height || 1.7 }); } catch (e) { console.warn('outfit not usable', e); return false; }
    rig.root.removeFromParent(); body.add(nr.root); rig = nr; hipH = nr.hipH;
    if (cup) { cup.removeFromParent(); rig.anchors[1].add(cup); }
    if (phoneM) { phoneM.removeFromParent(); rig.anchors[0].add(phoneM); }
    if (cueM) { cueM.removeFromParent(); rig.anchors[1].add(cueM); }
    return true;
  }
  function setHold(obj) { // carry an object (e.g. a bowl) in the right hand
    if (cup) cup.removeFromParent();
    cup = obj || null;
    if (cup) { if (rig) { cup.position.set(0, -.09, .05); cup.rotation.x = 2.3; rig.anchors[1].add(cup); } else { cup.position.set(0, -.56, .07); cup.rotation.x = 1.0; armR.add(cup); } cup.visible = true; }
    else { armR.rotation.x = 0; if (rig) { armR.rotation.y = 0; armR.userData.el.rotation.x = 0; } }
  }
  function goEat(spot, dur, cb, spoon) { // a following character walks to a chair, sits and eats, then goes back to following
    if (state !== 'follow') return false;
    spot.taken = name; path = []; setHold(spoon || null);
    const from = nearestNode(pos.x, pos.z, pos.y), to = nearestNode(spot.ex, spot.ez, 0), rt = route(from, to), pts = [];
    rt.forEach((n, i) => pts.push({ x: N[n][0], z: N[n][1], y: N[n][2], door: i > 0 ? doorOf(rt[i - 1], n) : null }));
    if (spot.ez < -5.5) pts.push({ x: -5.3, z: -3.2, y: 0 }, { x: -5.3, z: -5.9, y: 0 });   // far-side chairs: walk around the table
    pts.push({ x: spot.ex, z: spot.ez, y: 0, sit: spot, dur, tag: 'Eating 🍽' });
    script = pts; si = 0; sWait = 0;
    sDone = () => { setHold(null); state = 'follow'; path = []; fT = 0; fPN = ''; setTag('Following you 🚶'); if (cb) cb(); };
    state = 'script'; setTag('Going to eat 🍽'); return true;
  }
  function goTo(x, z, cb, tag, face) {   // walk through the house to (x, z), wait a moment there, run cb, then carry on (following / normal routine)
    if (state === 'player' || state === 'ride' || state === 'hug' || state === 'work') return false;
    if (state === 'enter' || state === 'seated') { const s = act; resetPose(); pos.x = s.ex; pos.z = s.ez; pos.y = s.by; cur = s.node; }
    if (act) { act.taken = null; act = null; }
    const wasFollow = state === 'follow'; inScript = false; actDur = null; actTag = null; setHold(null); path = [];
    const from = nearestNode(pos.x, pos.z, pos.y), to = nearestNode(x, z, 0), rt = route(from, to), pts = [];
    rt.forEach((nd, i) => pts.push({ x: N[nd][0], z: N[nd][1], y: N[nd][2], door: i > 0 ? doorOf(rt[i - 1], nd) : null }));
    pts.push({ x, z, y: 0, face: face ?? null, wait: 1.8, tag: tag || 'Working', arrive: () => { if (cb) cb(); } });
    script = pts; si = 0; sWait = 0;
    sDone = () => { if (wasFollow) { state = 'follow'; path = []; fT = 0; fPN = ''; carryDoor = null; setTag('Following you 🚶'); } else idleT = 1; };
    state = 'script'; setTag(tag || 'On my way'); return true;
  }
  function boardDrive(c) { if (state === 'player' || state === 'hug' || state === 'work') return false; script = null; sDone = null; inScript = false; setHold(null); path = []; rideCar = c; rideDrv = true; state = 'ride'; col.on = false; setTag('Driving to you 🚗'); return true; }
  function dispose() { disposed = true; scene.remove(g); const i = cols.indexOf(col); if (i >= 0) cols.splice(i, 1); }

  /* ---- hug (both characters play this pose for a few seconds) ---- */
  const _hV1 = new THREE.Vector3(), _hV2 = new THREE.Vector3(), _hU = new THREE.Vector3(), _hF = new THREE.Vector3(), _hZ = new THREE.Vector3(), _hN = new THREE.Vector3(), _hQ = new THREE.Quaternion(), _hQ0 = new THREE.Quaternion(), _hD = new THREE.Vector3(0, -1, 0), _hI = new THREE.Quaternion();
  function aimArm(arm, U, F, e) {   // point the upper arm along U and the forearm along F (body frame), blended by e
    _hU.copy(U).normalize(); _hF.copy(F).normalize();
    _hQ0.setFromUnitVectors(_hD, _hU);
    _hZ.set(0, 0, 1).applyQuaternion(_hQ0);                                    // the elbow bends toward this local direction ...
    _hN.copy(_hF).addScaledVector(_hU, -_hF.dot(_hU)).normalize();             // ... so twist the arm until it points at the forearm's side
    const phi = Math.atan2(_hZ.clone().cross(_hN).dot(_hU), _hZ.dot(_hN));
    _hQ.setFromAxisAngle(_hU, phi).multiply(_hQ0);
    arm.quaternion.copy(_hI.identity()).slerp(_hQ, e);
    arm.userData.el.rotation.x = -Math.acos(Math.max(-1, Math.min(1, _hU.dot(_hF)))) * e;
  }
  function hugArm(arm, inw, e) {   // aim the upper arm out past the partner's side, then fold the forearm in across their back (hands end up behind the partner)
    const hy = kind === 'boy' ? -.22 : -.06;                                   // the taller one reaches down onto the partner's back
    aimArm(arm, _hV1.set(-inw * .45, hy, .88), _hV2.set(inw * .74, hy - .1, .67), e);
  }
  let cradle = false;
  function cradlePose() {   // carrying the baby: both forearms form a flat cradle in front of the chest, elbows close to the body, head slightly bowed to the baby
    if (!rig) { armL.rotation.x = armR.rotation.x = -1.0; armL.userData.el.rotation.x = armR.userData.el.rotation.x = -1.1; return; }
    aimArm(armL, _hV1.set(-.1, -.8, .42), _hV2.set(.3, .08, .9), 1);
    aimArm(armR, _hV1.set(.1, -.8, .42), _hV2.set(-.3, .08, .9), 1);
    head.rotation.x = .22;
  }
  function hugPose(e) { // arms wrap around the partner, bodies lean in, heads turn and rest cheek to cheek
    if (rig) { hugArm(armL, 1, e); hugArm(armR, -1, e); body.rotation.x = .08 * e; head.rotation.y = .5 * e; head.rotation.z = .1 * e; head.rotation.x = (kind === 'boy' ? .22 : -.04) * e; return; }
    armL.rotation.x = armR.rotation.x = -1.15 * e;
    armL.userData.el.rotation.x = armR.userData.el.rotation.x = -.65 * e;
    armL.rotation.z = armZ0[0] + .32 * e; armR.rotation.z = armZ0[1] - .32 * e;
    body.rotation.x = .1 * e; head.rotation.z = .12 * e; head.rotation.x = .08 * e;
  }
  function hug(tx, tz, face, dur) { // called when the player presses "hug": step in close and embrace
    if (state !== 'talk' && state !== 'follow') return;
    hugPrev = state; state = 'hug'; hugT = 0; hugDur = dur; hugFrom = { x: pos.x, z: pos.z }; hugTo = { x: tx, z: tz }; hugFace = face;
    path = []; setTag('❤️ Hug');
  }
  function hugStep(dt) {
    hugT += dt;
    const e = Math.max(0, Math.min(1, hugT / .6, (hugDur - hugT) / .4)), m = Math.min(1, hugT / .5);
    pos.x = hugFrom.x + (hugTo.x - hugFrom.x) * m; pos.z = hugFrom.z + (hugTo.z - hugFrom.z) * m;
    let df = hugFace - ang; df = Math.atan2(Math.sin(df), Math.cos(df)); ang += df * Math.min(1, dt * 8);
    sf = 0; legL.rotation.x = legR.rotation.x = 0; hugPose(e);
    g.position.set(pos.x, pos.y, pos.z); g.rotation.y = ang;
    Object.assign(col, { x0: pos.x - .25, x1: pos.x + .25, z0: pos.z - .25, z1: pos.z + .25, y0: pos.y, y1: pos.y + 1.7 });
    if (hugT >= hugDur) {
      resetPose(); state = hugPrev;
      if (state === 'follow') { path = []; fT = 0; fPN = ''; setTag('Following you 🚶'); } else setTag('Hi! 👋 Talk to me');
    }
  }

  /* ---- talk / follow / ride (triggered by the player) ---- */
  function followPlan(dt) { // keep a route to the player's current area
    fT -= dt; if (fT > 0) return; fT = .4;
    if (Math.hypot(player.x - pos.x, player.z - pos.z) < 1.8 && Math.abs(player.y - pos.y) < 1.2) { path = []; return; }
    const pn = nearestNode(player.x, player.z, player.y);
    if (pn === fPN) return;
    fPN = pn;
    const from = path.length && k < path.length ? path[k] : nearestNode(pos.x, pos.z, pos.y);
    carryDoor = path.length && k > 0 && k < path.length ? doorOf(path[k - 1], path[k]) : null;
    path = route(from, pn); k = 0; startSeg();
  }
  function rideStep() { // sit in the passenger seat of the player's car (or at the wheel when we drive it ourselves)
    const c = rideCar, sn = Math.sin(c.h), cs = Math.cos(c.h);
    if (c.bike) { const bz = rideDrv ? (c.seatZ ?? .3) : (c.seatZ ? c.seatZ + .4 : .72); pos.x = c.x - sn * bz; pos.z = c.z - cs * bz; pos.y = c.seatBy ?? .28; ang = c.h; pose(1, { type: 'sit' }); head.rotation.y = 0; armL.rotation.x = armR.rotation.x = rideDrv ? -1.2 : -.9; body.rotation.x = .08; if (c.dream && rideDrv) dreamRide(); g.position.set(pos.x, pos.y, pos.z); g.rotation.y = ang; return; }   // pillion on the motorbike
    const sd = rideDrv ? -1 : 1;
    pos.x = c.x - sd * cs * .4 - sn * .35; pos.z = c.z + sd * sn * .4 - cs * .35; pos.y = .15; ang = c.h;
    pose(1, { type: 'sit' }); head.rotation.y = 0; if (rideDrv) armL.rotation.x = armR.rotation.x = -1.2;
    g.position.set(pos.x, pos.y, pos.z); g.rotation.y = ang;
  }
  function talk() { // stop whatever we're doing and face the player
    if (state === 'player' || state === 'ride' || state === 'hug' || state === 'work') return;
    if (state === 'enter' || state === 'seated') { const s = act; resetPose(); pos.x = s.ex; pos.z = s.ez; pos.y = s.by; cur = s.node; }
    if (act) { act.taken = null; act = null; }
    inScript = false; script = null; actDur = null; actTag = null; setHold(null);
    path = []; state = 'talk'; setTag('Hi! 👋 Talk to me');
  }
  function work() { // stay at the coffee counter and serve customers until the player takes control again
    if (state === 'player') return;
    if (act) { act.taken = null; act = null; }
    path = []; resetPose(); workTo = { x: Math.max(.8, Math.min(5.5, pos.x)), z: 109.75 }; state = 'work'; setTag('Serving customers ☕');
  }
  function follow() { if (state !== 'talk') return; path = []; k = 1; fT = 0; fPN = ''; carryDoor = null; state = 'follow'; setTag('Following you 🚶'); }
  function resume() { // back to autonomous behaviour
    if (state !== 'talk' && state !== 'follow' && state !== 'work') return;
    path = []; act = null; cur = nearestNode(pos.x, pos.z, pos.y); state = 'idle'; idleT = .6; setTag('Back to my routine');
  }
  function board(c) { if (state !== 'follow') return; rideCar = c; state = 'ride'; col.on = false; setTag('Riding along 🚗'); }
  function alight() {
    if (state !== 'ride') return;
    const c = rideCar; rideCar = null; rideDrv = false; resetPose();
    const sd = c.bike ? 1.2 : 2.1; pos.x = c.x - Math.cos(c.h) * sd; pos.z = c.z + Math.sin(c.h) * sd; pos.y = 0;
    col.on = true; state = 'follow'; path = []; fT = 0; fPN = ''; setTag('Following you 🚶'); g.position.set(pos.x, pos.y, pos.z);
  }

  /* ---- control hand-over ---- */
  const getPose = () => (act && (state === 'enter' || state === 'seated')) ? { x: act.ex, z: act.ez, y: act.by, ang } : { x: pos.x, z: pos.z, y: pos.y, ang };
  function control() { // the human takes this character: hide the body (first-person), stop AI + collider
    if (act) { act.taken = null; act = null; } resetPose();
    fresh = true; drvSeat = null; drvHug = false; drvSwim = false; inScript = false; script = null; tag.visible = false; rideCar = null; path = [];
    state = 'player'; g.visible = false; col.on = false; closeList.length = 0;
  }
  function release(x, z, y, a) { // the human leaves this character: AI continues from where it stands
    pos.x = x; pos.z = z; pos.y = y; ang = a; g.position.set(x, y, z); g.rotation.y = a;
    if (act) act.taken = null; act = null; path = []; rideCar = null; resetPose(); tag.visible = true; g.visible = true; col.on = true; sf = 0; cur = nearestNode(x, z, y); dest = 'here'; state = 'idle'; idleT = .8; setTag('Looking around');
  }

  setTag('Just arrived'); g.position.set(pos.x, pos.y, pos.z);
  return { setCradle: v => { cradle = !!v; if (!cradle) { head.rotation.x = 0; armL.rotation.set(0, 0, armZ0[0]); armR.rotation.set(0, 0, armZ0[1]); armL.userData.el.rotation.x = armR.userData.el.rotation.x = 0; } }, update, drive, control, release, getPose, name, group: g, mode: () => state, talk, follow, resume, board, alight, hug, setCup, setTool, setPhone, goTo, boardDrive, play, walkTo: (x, z) => { wTo = { x, z }; }, walking: () => !!wTo, setFace: a => { faceO = a; }, setHold, setOutfit, goEat, dispose, work, setBusy: v => { barBusy = v; }, script: (pts, cb) => { script = pts; si = 0; sWait = 0; sDone = cb; state = 'script'; } };
}
