import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { createCharacter } from './npc.js';
import bannerData from './banner-data.js';
import { AVATARS } from './avatars.js';
const avatarOf = n => n === 'Ny Ny' ? AVATARS.nyny : n === 'G1 G1' ? AVATARS.g1 : null;
const avImg = (n, c = '') => { const a = avatarOf(n); return a ? `<img class="pav ${c}" src="${a}" alt="">` : '<i>🧑</i>'; };

const $ = id => document.getElementById(id);
const mobile = matchMedia('(pointer:coarse)').matches;
if (mobile) document.body.classList.add('mobile');

/* ================= RENDERER / SCENE ================= */
const renderer = new THREE.WebGLRenderer({ canvas: $('c'), antialias: !mobile });
renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = mobile ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9fd0ff);
scene.fog = new THREE.Fog(0x9fd0ff, 70, 230);
const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 420);
camera.rotation.order = 'YXZ';

scene.add(new THREE.HemisphereLight(0xcfe8ff, 0x6b8f4a, 0.8));
const sun = new THREE.DirectionalLight(0xfff0d0, 2.4);
sun.position.set(-18, 30, 22);
sun.castShadow = true;
const SM = mobile ? 1024 : 2048;
sun.shadow.mapSize.set(SM, SM);
Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 100 });
sun.shadow.bias = -0.0004;
scene.add(sun); scene.add(sun.target);
const sunDisc = new THREE.Mesh(new THREE.SphereGeometry(6, 16, 16), new THREE.MeshBasicMaterial({ color: 0xfff3b0, fog: false }));
sunDisc.position.copy(sun.position).multiplyScalar(4);
scene.add(sunDisc);
[[-5, 2.6, 3.5], [-5, 2.6, -3.5], [5, 2.6, 3.5], [-5, 5.8, 3], [5, 5.8, 2]].forEach(p => {
  const l = new THREE.PointLight(0xffe2b8, 14, 13); l.position.set(...p); scene.add(l);
});

/* ================= MATERIALS / TEXTURES ================= */
const mkTex = draw => {
  const c = document.createElement('canvas'); c.width = c.height = 256; draw(c.getContext('2d'));
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
};
const woodTex = mkTex(g => { for (let i = 0; i < 8; i++) { g.fillStyle = `hsl(30,45%,${36 + Math.random() * 12}%)`; g.fillRect(0, i * 32, 256, 30); } });
const tileTex = mkTex(g => { g.fillStyle = '#e9eef0'; g.fillRect(0, 0, 256, 256); g.strokeStyle = '#b8c2c8'; g.lineWidth = 4; g.strokeRect(0, 0, 256, 256); g.strokeRect(0, 0, 128, 128); g.strokeRect(128, 128, 128, 128); });
const grassTex = mkTex(g => { g.fillStyle = '#5f9a3d'; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 2000; i++) { g.fillStyle = `hsl(${90 + Math.random() * 25},45%,${28 + Math.random() * 18}%)`; g.fillRect(Math.random() * 256, Math.random() * 256, 2, 3); } });
const repMat = (t, x, y, r = 0.5) => { const c = t.clone(); c.needsUpdate = true; c.repeat.set(x, y); return new THREE.MeshStandardMaterial({ map: c, roughness: r }); };

const mc = {};
const M = (c, r = 0.7, m = 0) => mc[`${c}_${r}_${m}`] ||= new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
const mt = m => typeof m === 'number' ? M(m) : m;
const WM = M(0xf2eee6, 0.9), WOOD = M(0x7a5233, 0.5), WHITE = M(0xffffff, 0.8), DARK = M(0x25272b, 0.4), METAL = M(0xcfd4d8, 0.25, 0.9);
const GLASS = new THREE.MeshPhysicalMaterial({ color: 0xbfe0ff, transparent: true, opacity: 0.22, roughness: 0.05 });

/* ================= BUILDING HELPERS ================= */
const G = new THREE.BoxGeometry(1, 1, 1);
const cols = []; // collision boxes {x0,x1,z0,z1,y0,y1,on}
const staticAvoid = [];   // circles [x, z, r] around display vehicles (NPCs walk around them)
const blk = (x, z, w, d, y0, y1) => cols.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2, y0, y1, on: true });
function box(x, y, z, w, h, d, mat, col = true, cast = true) {
  const m = new THREE.Mesh(G, mt(mat)); m.scale.set(w, h, d); m.position.set(x, y + h / 2, z);
  m.castShadow = cast; m.receiveShadow = true; scene.add(m);
  if (col) blk(x, z, w, d, y, y + h);
  return m;
}
const FL = 3.2, H = 3.0;

/* ---- Doors ---- */
const doors = [];
function door(axis, fix, o, by) {
  const w = o.w, along = axis === 'x';
  const pivot = new THREE.Group();
  pivot.position.set(along ? o.c - w / 2 : fix, by, along ? fix : o.c - w / 2);
  const base = along ? 0 : -Math.PI / 2; pivot.rotation.y = base; scene.add(pivot);
  const leaf = new THREE.Mesh(G, M(0x6b4a2f, 0.5)); leaf.scale.set(w - 0.04, 2.15, 0.06); leaf.position.set(w / 2, 1.075, 0);
  leaf.castShadow = leaf.receiveShadow = true; pivot.add(leaf);
  for (const s of [-1, 1]) {
    const plate = new THREE.Mesh(G, METAL); plate.scale.set(0.05, 0.2, 0.01); plate.position.set(w - 0.12, 1.0, s * 0.035); pivot.add(plate);
    const h = new THREE.Mesh(G, METAL); h.scale.set(0.14, 0.03, 0.03); h.position.set(w - 0.17, 1.0, s * 0.07); pivot.add(h);
  }
  const col = along ? { x0: o.c - w / 2, x1: o.c + w / 2, z0: fix - 0.06, z1: fix + 0.06 } : { x0: fix - 0.06, x1: fix + 0.06, z0: o.c - w / 2, z1: o.c + w / 2 };
  Object.assign(col, { y0: by, y1: by + 2.2, on: true }); cols.push(col);
  doors.push({ pivot, base, ang: 0, open: false, col, sign: o.s || 1, pos: new THREE.Vector3(along ? o.c : fix, by + 1, along ? fix : o.c) });
}

/* ---- Walls with door / window openings ---- */
function wall(axis, fix, a, b, ops, by, wm = WM) {
  const A = axis === 'x';
  const seg = (s, e, y0, y1) => {
    if (e - s < 0.01 || y1 - y0 < 0.01) return; const c = (s + e) / 2, l = e - s;
    A ? box(c, by + y0, fix, l, y1 - y0, 0.2, wm) : box(fix, by + y0, c, 0.2, y1 - y0, l, wm);
  };
  let cur = a;
  for (const o of [...ops].sort((p, q) => p.c - q.c)) {
    const s = o.c - o.w / 2, e = o.c + o.w / 2;
    seg(cur, s, 0, H);
    const y0 = o.door ? 0 : (o.y0 ?? 0.9), y1 = o.door ? 2.2 : (o.y1 ?? 2.3);
    seg(s, e, 0, y0); seg(s, e, y1, H);
    if (o.door) door(axis, fix, o, by);
    else A ? box(o.c, by + y0, fix, o.w, y1 - y0, 0.05, GLASS, true, false) : box(fix, by + y0, o.c, 0.05, y1 - y0, o.w, GLASS, true, false);
    cur = e;
  }
  seg(cur, b, 0, H);
}

/* ================= HOUSE SHELL ================= */
const floorMatTop = (w, d) => [WM, WM, repMat(woodTex, w / 2, d / 2), WM, WM, WM];
box(0, -0.2, 0, 20, 0.2, 14, floorMatTop(20, 14), false);
const slabs = [[-10, 7.9, -7, 7], [7.9, 9.7, -7, 2.2], [9.7, 10, -7, 7], [7.9, 9.7, 6.7, 7]];
slabs.forEach(([a, b, c, d]) => box((a + b) / 2, 3.0, (c + d) / 2, b - a, 0.2, d - c, floorMatTop(b - a, d - c), false));
box(0, 6.2, 0, 21, 0.3, 15, M(0x2f3236, 0.6), false);

const win = (c, w, y0 = 0.9, y1 = 2.3) => ({ c, w, y0, y1 });
const dr = (c, w = 1.1, s = 1) => ({ c, w, door: 1, s });
for (const fl of [0, 1]) {
  const by = fl * FL, up = fl === 1;
  wall('x', 7, -10, 10, up ? [win(-6, 4.5, .3, 2.5), win(3, 3, .3, 2.5), win(8.8, 1.4)] : [win(-6, 4.5, .3, 2.5), dr(3, 1.4), win(6.2, 1.4)], by);
  wall('x', -7, -10, 10, up ? [win(-6, 3), win(2.5, 2), win(7.5, 1.2, 1.3)] : [win(-4, 3), win(2.5, 2), win(7.5, 1.2, 1.3)], by);
  wall('z', -10, -7, 7, up ? [win(5.3, 1.6), win(-3.5, 2.4, 1.0)] : [win(3.5, 3, .3, 2.5)], by);
  wall('z', 10, -7, 7, [win(4, 3, .3, 2.5), win(-3, 2, 1.3)], by);
  wall('z', 0, -7, 7, up ? [dr(3), dr(-3)] : [dr(3)], by);
  wall('x', 0, -10, 0, up ? [] : [dr(-2)], by);
  wall('x', 1, 0, 10, [dr(2.5), dr(7.5)], by);
  wall('z', 5, -7, 1, [], by);
}

/* ---- Staircase (x 7.9-9.7, z 6.7 -> 2.2, 15 steps) ---- */
const STEP = FL / 15;
for (let i = 0; i < 15; i++) {
  const zc = 6.7 - 0.3 * (i + 0.5);
  box(8.8, 0, zc, 1.8, (i + 1) * STEP, 0.3, M(0xb08a62, 0.5));
}
box(7.9, FL, 4.45, 0.05, 1.0, 4.5, GLASS, false, false); // upper balustrade (visual)
blk(7.9, 4.45, 0.1, 4.5, 2.0, 4.4);                      // rail collider (keeps player on stairs)
blk(8.8, 6.7, 1.8, 0.1, FL, 4.4);
box(8.8, FL, 6.7, 1.8, 1.0, 0.05, GLASS, false, false);

/* ================= FURNITURE ================= */
function plant(x, z, by = 0) {
  box(x, by, z, 0.4, 0.4, 0.4, 0xb5653a);
  const l = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45, 1), M(0x2f7d32, 0.9)); l.position.set(x, by + 0.9, z); l.castShadow = true; scene.add(l);
}
function table(x, z, w, d, by = 0, h = 0.75) {
  box(x, by + h - 0.06, z, w, 0.06, d, WOOD, false);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(x + sx * (w / 2 - 0.08), by, z + sz * (d / 2 - 0.08), 0.06, h - 0.06, 0.06, DARK, false);
  blk(x, z, w, d, by, by + h);
}
function chair(x, z, dir, by = 0) { box(x, by, z, 0.45, 0.45, 0.45, WOOD); box(x, by + 0.45, z + dir * 0.2, 0.45, 0.5, 0.06, WOOD, false); }
function bed(cx, cz, by, hd, color = 0x3b6a8f) {
  box(cx, by, cz, 2.1, 0.4, 1.8, WOOD); box(cx, by + 0.4, cz, 2.0, 0.25, 1.7, WHITE, false);
  box(cx - hd * 0.3, by + 0.65, cz, 1.3, 0.04, 1.72, color, false);
  box(cx + hd * 1.1, by, cz, 0.1, 0.95, 1.9, WOOD);
  for (const s of [-1, 1]) { box(cx + hd * 0.78, by + 0.65, cz + s * 0.45, 0.4, 0.15, 0.6, WHITE, false); box(cx + hd * 0.95, by, cz + s * 1.2, 0.45, 0.5, 0.45, WOOD); }
}
const wardrobe = (x, z, w, d, by) => { box(x, by, z, w, 2.2, d, 0xd8d0c2); box(x + (w > d ? 0 : (w / 2 + 0.01)), by + 0.9, z + (w > d ? d / 2 + 0.01 : 0), w > d ? 0.04 : 0.02, 0.3, w > d ? 0.02 : 0.04, METAL, false); };
const painting = (x, y, z, ax, c) => box(x, y, z, ax ? 1.4 : 0.05, 1.0, ax ? 0.05 : 1.4, c, false);
function bath(by) {
  box(7.5, by, -3, 5, 0.015, 8, repMat(tileTex, 8, 13, .3), false, false);
  box(9.5, by, -5.8, 0.4, 0.4, 0.65, WHITE); box(9.75, by + 0.4, -5.8, 0.15, 0.4, 0.5, WHITE);
  box(6, by, -6.6, 1.2, 0.85, 0.5, 0xe8e4dc); box(6, by + 0.85, -6.6, 1.3, 0.04, 0.55, 0x222222, false);
  box(6, by + 1.2, -6.88, 1.0, 0.8, 0.04, 0xdff3ff, false);
  box(9.2, by, -2.2, 1.6, 0.08, 1.6, WHITE, false);
  box(8.4, by, -2.2, 0.04, 2, 1.6, GLASS, true, false); box(8.9, by, -1.4, 1.0, 2, 0.04, GLASS, true, false);
  box(9.8, by + 2.0, -2.6, 0.3, 0.04, 0.3, METAL, false);
}
function guestRoom(by, sx = 0) {
  bed(3.3, -3.5, by, 1); wardrobe(0.55, -5.5, 0.8, 1.6, by);
  box(3.3, by, -1.2, 1.6, .01, .8, 0xc9b79c, false, false);
}

/* ---- Ground floor ---- */
// Living room
box(-6, 0, 3.4, 4, 0.02, 3, 0xb8a58a, false, false);
box(-6, 0, 5.3, 3, 0.45, 1, 0x3b4a5a); box(-6, 0.45, 5.7, 3, 0.5, 0.25, 0x3b4a5a); box(-7.6, 0, 5.3, 0.2, 0.65, 1, 0x2e3a47); box(-4.4, 0, 5.3, 0.2, 0.65, 1, 0x2e3a47);
table(-6, 3, 1.4, 0.8, 0, 0.4);
box(-6, 0, 0.35, 2.4, 0.5, 0.5, DARK);
box(-6, 0.9, 0.14, 1.8, 1.0, 0.08, 0x050505, false); box(-6, 0.95, 0.19, 1.7, 0.9, 0.01, new THREE.MeshStandardMaterial({ color: 0x0a2a44, emissive: 0x153f66, emissiveIntensity: .8 }), false, false);
plant(-9.3, 6.3); plant(-0.9, 6.3); plant(-9.3, 0.7);
painting(-9.88, 1.7, 5.5, false, 0xc0583a);
// Kitchen
box(-9.5, 0, -3.5, 0.8, 0.9, 5, 0xe8e4dc); box(-9.5, 0.9, -3.5, 0.85, 0.05, 5.05, 0x222222, false); box(-9.75, 1.5, -3.5, 0.4, 0.8, 5, 0xe8e4dc);
box(-6, 0, -3.2, 2.4, 0.9, 1, 0xe8e4dc); box(-6, 0.9, -3.2, 2.5, 0.05, 1.1, 0x222222, false);
box(-9.3, 0, -6.2, 0.9, 2.0, 0.8, METAL);
// refrigerator: hinged front door + shelves with drinks inside (visible when open)
const fridge = { open: false, ang: 0, pivot: new THREE.Group(), inner: [] };
{
  fridge.pivot.position.set(-8.84, 0.05, -5.82); scene.add(fridge.pivot);
  const dm = new THREE.Mesh(G, M(0xb8c0c8, 0.35, 0.6)); dm.scale.set(0.04, 1.9, 0.78); dm.position.set(0, 0.95, -0.39); dm.castShadow = true; fridge.pivot.add(dm);
  const hd = new THREE.Mesh(G, DARK); hd.scale.set(0.04, 0.6, 0.04); hd.position.set(0.04, 1.0, -0.68); fridge.pivot.add(hd);
  const add = (m) => { m.visible = false; fridge.inner.push(m); return m; };
  add(box(-8.84, 0.06, -6.2, 0.02, 1.88, 0.76, 0xdfe6ea, false, false));
  const cols = [0xd62828, 0x2563eb, 0x16a34a, 0xf59e0b, 0x9333ea];
  [0.55, 0.95, 1.35, 1.75].forEach((y, r) => {
    add(box(-8.8, y, -6.2, 0.1, 0.02, 0.76, 0xbfc9cf, false, false));
    for (let k = 0; k < 6; k++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.12, 10), new THREE.MeshStandardMaterial({ color: cols[(k + r) % 5], roughness: 0.35, metalness: 0.3 })); c.position.set(-8.79, y + 0.07, -6.5 + k * 0.12); scene.add(add(c)); }
  });
}
const nearFridge = () => !driving && !seat && !hug && !swimming && Math.abs(P.y) < 1 && Math.hypot(P.x + 8.4, P.z + 6.2) < 1.5;
function fridgeStep(dt) {
  if (fridge.open && Math.hypot(P.x + 8.4, P.z + 6.2) > 3.2) fridge.open = false;       // walk away -> it closes
  fridge.ang += ((fridge.open ? 1.9 : 0) - fridge.ang) * (1 - Math.exp(-dt * 6));
  fridge.pivot.rotation.y = -fridge.ang; const vis = fridge.ang > 0.08; fridge.inner.forEach(m => { m.visible = vis; });
  if (drinkAnim) {
    drinkAnim.t += dt; const k = Math.sin(Math.PI * Math.min(1, drinkAnim.t / 3));
    heldFP.position.set(0.24 - 0.2 * k, -0.3 + 0.2 * k, -0.55 + 0.15 * k); heldFP.rotation.x = -1.0 * k;
    if (drinkAnim.t >= 3) { drink = null; drinkAnim = null; refreshHeld(); toast('😋 ផឹករួចហើយ'); }
  }
}
table(-3.5, -4.2, 2.2, 1.1);
[-4.2, -2.8].forEach(x => { chair(x, -5.1, -1); chair(x, -3.3, 1); });
// Hall
box(5.2, 0, 1.5, 1.6, 0.8, 0.4, WOOD); plant(0.7, 6.4); plant(6.8, 1.6); painting(0.12, 1.8, 5, false, 0x3a6ea5);
// Guest room + bath
guestRoom(0); bath(0);

/* ---- Upper floor ---- */
const U = FL;
box(-6, U, 3.5, 4, 0.02, 3.5, 0xb8a58a, false, false);
bed(-8.7, 2.5, U, -1, 0x8a3b3b); wardrobe(-4.5, 0.55, 3, 0.6, U);
box(-3, U, 5.3, 1.6, 0.8, 0.5, WOOD); plant(-0.9, 6.3, U); painting(-6, U + 1.7, 0.14, true, 0x2f7d6a);
bed(-7.8, -3.5, U, -1, 0x6a8f3b); table(-2.5, -6.4, 1.6, 0.7, U); chair(-2.5, -5.5, 1, U); wardrobe(-9.4, -6.2, 0.6, 1.4, U);
guestRoom(U); bath(U);
box(5, U, 1.5, 1.6, 0.8, 0.4, WOOD); plant(0.7, 6.3, U); painting(0.12, U + 1.8, 5, false, 0xd29b3a);

/* ================= OUTDOORS ================= */
const gShape = new THREE.Shape();                                  // grass ground with a hole where the pool is (shape y = -world z)
gShape.moveTo(-330, -310); gShape.lineTo(180, -310); gShape.lineTo(180, 170); gShape.lineTo(-330, 170); gShape.closePath();
const gHole = new THREE.Path(); gHole.moveTo(-5, 10.5); gHole.lineTo(-5, 16.5); gHole.lineTo(5, 16.5); gHole.lineTo(5, 10.5); gHole.closePath(); gShape.holes.push(gHole);
const ground = new THREE.Mesh(new THREE.ShapeGeometry(gShape), repMat(grassTex, 0.25, 0.25, 1));
ground.rotation.x = -Math.PI / 2; ground.position.set(0, -0.01, 0); ground.receiveShadow = true; scene.add(ground);
box(0, 0, 8.8, 21, 0.03, 3.6, 0xcfc8bb, false, false);                 // terrace
box(3, 0, 13, 2, 0.03, 7, 0xbdb8ae, false, false);                     // path
box(18, 0, 8, 10, 0.03, 14, 0x3a3d42, false, false);                   // parking
for (let i = 0; i < 3; i++) box(13.2 + i * 4.8, 0.035, 8, 0.1, 0.01, 8, WHITE, false, false);
// (the drivable car is built in the CAR section below)

// (deck around the pool is built in the pool section below)                // deck
// ---- deep swimming pool: a real pit (2 m deep) with water, steps and walls ----
const WATER_Y = -0.3;
const inPool = (x, z) => x > -5 && x < 5 && z > -16.5 && z < -10.5;
const poolH = (x, z) => !inPool(x, z) ? 0 : (x > 3 && z > -11.5 ? -0.6 : x > 3 && z > -12.5 ? -1.2 : -2.0);   // 2 shallow steps, then the 2 m floor
const poolDepth = (x, z, y) => inPool(x, z) ? Math.max(0, WATER_Y - y) : 0;
let swimming = false, wasUW = false;
const carOnly = [{ x0: -5.3, x1: 5.3, z0: -16.8, z1: -10.2, y0: 0, y1: 1, on: true }];                  // cars can't drive into the pool
[[-6.5, -13.5, 3, 11], [6.5, -13.5, 3, 11], [0, -17.75, 10, 2.5], [0, -9.25, 10, 2.5]].forEach(([x, z, w, d]) => box(x, 0, z, w, 0.03, d, 0xd9cbb0, false, false)); // deck around the opening
const poolWater = new THREE.Mesh(new THREE.PlaneGeometry(10, 6), new THREE.MeshStandardMaterial({ color: 0x2aa4d6, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.72, side: THREE.DoubleSide }));
poolWater.rotation.x = -Math.PI / 2; poolWater.position.set(0, WATER_Y, -13.5); scene.add(poolWater);
const pm = repMat(tileTex, 10, 6, 0.3); pm.color.set(0x8fd3f0);
box(0, -2.1, -13.5, 10.2, 0.1, 6.2, pm, false, false);                                                  // floor (top at -2.0)
box(-5.1, -2.1, -13.5, 0.2, 2.1, 6.4, pm, false, false); box(5.1, -2.1, -13.5, 0.2, 2.1, 6.4, pm, false, false);
box(0, -2.1, -16.6, 10.4, 2.1, 0.2, pm, false, false); box(0, -2.1, -10.4, 10.4, 2.1, 0.2, pm, false, false);
box(4, -2.0, -11.0, 2, 1.4, 1.0, pm, false, false); box(4, -2.0, -12.0, 2, 0.8, 1.0, pm, false, false);   // steps
blk(-5.2, -13.5, 0.4, 6.6, -2.5, -0.1); blk(5.2, -13.5, 0.4, 6.6, -2.5, -0.1);                          // walls (only felt from inside the water)
blk(0, -16.7, 10.8, 0.4, -2.5, -0.1); blk(0, -10.3, 10.8, 0.4, -2.5, -0.1);
[[0, -16.6, 10.4, .3], [0, -10.4, 10.4, .3]].forEach(([x, z, w, d]) => box(x, 0, z, w, 0.1, d, WHITE, false));
[[-5.1, -13.5, .3, 6.2], [5.1, -13.5, .3, 6.2]].forEach(([x, z, w, d]) => box(x, 0, z, w, 0.1, d, WHITE, false));
for (const x of [-6.8, 6.8]) { box(x, 0, -13.5, 0.7, 0.35, 1.9, 0xf4f1ea); box(x, 0.35, -12.7, 0.7, 0.4, 0.05, 0xf4f1ea, false); }
function tree(x, z, s = 1) {
  box(x, 0, z, 0.35 * s, 2.4 * s, 0.35 * s, 0x6b4a2f);
  const l = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4 * s, 1), M(0x2e7d32, 0.9)); l.position.set(x, 3.3 * s, z); l.castShadow = true; scene.add(l);
  const l2 = l.clone(); l2.scale.setScalar(.7); l2.position.set(x, 4.4 * s, z); scene.add(l2);
}
[[-14, 10], [-16, 0], [-14, -8], [14, -6], [16, -14], [-12, -22], [10, -22], [0, -25], [-18, 15], [22, -4], [26, 18], [8, 16], [-10, 16], [-22, -14]].forEach(([x, z], i) => tree(x, z, 1 + (i % 3) * 0.15));
[[-6, 12.5, 6], [-14, 6, 0.8]].forEach(([x, z, w]) => box(x, 0, z, w, 0.8, 0.8, M(0x2d6a2f, 0.95)));
/* ================= ROAD + COFFEE SHOP (far from the house) ================= */
const ASPH = M(0x3a3d42, 0.95);
box(3, 0, 56.25, 6, 0.03, 79.5, ASPH, false, false);                                   // main road x 0..6, z 16.5..96
const JUNC = [60, 84];                                      // z of the two side roads (6 m wide) crossing the main road
const inJunc = (z, m = 3) => JUNC.some(j => Math.abs(z - j) < m);
for (let z = 20; z < 95; z += 4) if (!inJunc(z, 4.2)) box(3, 0.035, z, 0.15, 0.01, 1.8, WHITE, false, false);   // dashed centre line
[[16.5, 57], [63, 81], [87, 96]].forEach(([a, b]) => {       // main-road sidewalks (with gaps at the junctions)
  box(-0.7, 0, (a + b) / 2, 1.4, 0.06, b - a, 0xbdb8ae, false, false); box(6.7, 0, (a + b) / 2, 1.4, 0.06, b - a, 0xbdb8ae, false, false);
});
JUNC.forEach(j => {                                          // side roads going left and right
  box(3, 0, j, 106, 0.03, 6, ASPH, false, false);            // x -50 .. 56
  for (let x = -48; x < 56; x += 4) if (x < -2 || x > 7) box(x, 0.035, j, 1.8, 0.01, 0.15, WHITE, false, false);
  for (const s of [-1, 1]) { box(-25.7, 0, j + s * 3.7, 48.6, 0.06, 1.4, 0xbdb8ae, false, false); box(31.7, 0, j + s * 3.7, 48.6, 0.06, 1.4, 0xbdb8ae, false, false); }
  if (j !== 84) { box(-50.5, 0, j, 0.3, 0.9, 6.4, 0xc0392b); box(56.5, 0, j, 0.3, 0.9, 6.4, 0xc0392b); }        // barriers at the dead ends (the z = 84 road continues east to the gas station)
  if (j !== 84) { box(-50.5, 0.9, j, 0.3, 0.15, 6.4, WHITE, false); box(56.5, 0.9, j, 0.3, 0.15, 6.4, WHITE, false); }
});
box(18, 0, 17.5, 10, 0.03, 5, ASPH, false, false); box(9.5, 0, 18.5, 7.4, 0.03, 4, ASPH, false, false);                  // parking lot -> driveway -> road
const labelTex = (lines, w, h, bg, fg) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, w, h); x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle';
  lines.forEach(([t, size, y]) => { x.font = `bold ${size}px system-ui, sans-serif`; x.fillText(t, w / 2, y); });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
};
const board = (x, y, z, w, h, tx) => box(x, y, z, w, h, 0.12, [DARK, DARK, DARK, DARK, DARK, new THREE.MeshBasicMaterial({ map: tx })], false); // text on the -z face
box(8, 0, 24, 0.12, 2.2, 0.12, DARK);
board(8, 2.2, 24, 3.4, 1.0, labelTex([['▲ COFFEE SHOP', 46, 40], ['☕ កាហ្វេ · 80 m', 34, 88]], 512, 128, '#14532d', '#ffffff'));
for (let z = 28; z < 96; z += 14) {
  if (inJunc(z, 4.5)) continue;                                                     // street lamps
  const sx = ((z / 14) | 0) % 2 ? -1.2 : 7.2, dir = sx < 0 ? 1 : -1;
  box(sx, 0, z, 0.12, 4.2, 0.12, DARK); box(sx + dir * 0.5, 4.1, z, 1.1, 0.1, 0.12, DARK, false);
  box(sx + dir * 0.9, 4.0, z, 0.35, 0.12, 0.25, new THREE.MeshBasicMaterial({ color: 0xfff2c0 }), false, false);
}
for (let z = 30; z <= 90; z += 12) { if (!inJunc(z, 5)) tree(-6, z, 1); if (!inJunc(z + 6, 5)) tree(13, z + 6, 1.05); }

// plaza + coffee shop at the end of the road
box(3, 0, 103, 36, 0.03, 14, 0xcfc8bb, false, false);
box(3, 0, 107, 14, 0.04, 7, repMat(woodTex, 7, 3.5), false, false);                       // interior floor
wall('x', 103.5, -4, 10, [win(-1.2, 3.4, 0.4, 2.4), dr(3, 1.3), win(7.2, 3.8, 0.4, 2.4)], 0); // front wall (interactive door)
wall('x', 110.5, -4, 10, [win(3, 3, 0.9, 2.3)], 0);
wall('z', -4, 103.5, 110.5, [win(107, 2.4, 0.9, 2.3)], 0); wall('z', 10, 103.5, 110.5, [win(107, 2.4, 0.9, 2.3)], 0);
box(3, 3.0, 107, 15, 0.3, 8, M(0x4a3426, 0.7), false);                                  // roof
const shopSign = board(3, 3.35, 103.2, 9, 1.2, labelTex([['☕ កាហ្វេ COFFEE', 60, 66]], 576, 128, '#3b2415', '#f3e2c6'));   // placeholder until the banner image loads
new THREE.TextureLoader().load(bannerData, tx => {                                          // the uploaded banner becomes the sign above the shop
  tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4;
  const w = 8.4, h = w * tx.image.height / tx.image.width;
  shopSign.scale.set(w, h, 0.14); shopSign.position.y = 3.35 + h / 2;
  const m = shopSign.material[5]; m.map = tx; m.toneMapped = false; m.needsUpdate = true;
});
const signClosed = labelTex([['CLOSED', 50, 42], ['បិទ', 34, 94]], 256, 128, '#7f1d1d', '#ffffff');
const signOpen = labelTex([['OPEN', 56, 42], ['បើក', 34, 94]], 256, 128, '#14532d', '#ffffff');
const openSign = board(4.5, 1.5, 103.3, 1.1, 0.55, signClosed);                          // OPEN / CLOSED sign next to the door
const stripeTex = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 16; const x = c.getContext('2d');
  x.fillStyle = '#c0392b'; x.fillRect(0, 0, 32, 16); x.fillStyle = '#f4ede0'; x.fillRect(32, 0, 32, 16);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.repeat.set(9, 1); return t; })();
box(3, 2.55, 102.3, 14.4, 0.08, 2.2, new THREE.MeshStandardMaterial({ map: stripeTex, roughness: 0.8 }), false).rotation.x = -0.15; // striped awning
box(-3.6, 0, 101.4, 0.1, 2.5, 0.1, WOOD); box(9.6, 0, 101.4, 0.1, 2.5, 0.1, WOOD);
plant(-2.8, 102.6); plant(8.8, 102.6);
// inside: counter, espresso machine, menu board, tables
box(3, 0, 108.7, 7, 1.05, 0.8, 0x5b3a26); box(3, 1.05, 108.7, 7.2, 0.06, 0.9, 0xe8e1d4, false);
box(1.2, 1.11, 108.7, 0.9, 0.5, 0.5, METAL, false); box(2.4, 1.11, 108.7, 0.35, 0.4, 0.35, DARK, false); box(4.6, 1.11, 108.6, 0.4, 0.15, 0.4, WHITE, false);
for (let i = 0; i < 6; i++) box(0 + i * 0.5, 1.11, 108.3, 0.18, 0.14, 0.18, WHITE, false);
board(3, 1.6, 110.3, 4.6, 1.0, labelTex([['MENU', 40, 26], ['Latte · Cappuccino · Espresso', 28, 64], ['Iced Coffee · Tea · Cake', 28, 98]], 512, 128, '#1f2a24', '#f2f2f2'));
box(3, 2.85, 106, 1.4, 0.08, 0.6, new THREE.MeshBasicMaterial({ color: 0xfff2c0 }), false, false);
[-1.5, 7.2].forEach(x => { table(x, 105.6, 0.9, 0.9); chair(x, 104.8, -1); chair(x, 106.4, 1); });
// outdoor patio sets with umbrellas
[[-9, 99.5, 0xc0392b], [-3.5, 98.5, 0x2e86c1], [10, 98.5, 0xf1c40f], [16, 99.5, 0x27ae60]].forEach(([x, z, c]) => {
  table(x, z, 0.9, 0.9); chair(x, z - 0.8, -1); chair(x, z + 0.8, 1);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.3, 6), DARK); pole.position.set(x, 1.15, z); scene.add(pole);
  const top = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.55, 10), M(c, 0.8)); top.position.set(x, 2.5, z); top.castShadow = true; scene.add(top);
});
tree(-12, 108, 1.1); tree(18, 108, 1.1); tree(-13, 97, 1); tree(19, 96.5, 1);

// ---- pool ball / table materials (shared by every table and the roof balls) ----
const FELT = new THREE.MeshStandardMaterial({ color: 0x0f7a45, roughness: 0.95 }), FELTD = new THREE.MeshStandardMaterial({ color: 0x0b5c34, roughness: 0.95 });
const RAILM = M(0x5a3420, 0.45), POCK = new THREE.MeshBasicMaterial({ color: 0x050505 });
const BALL_COL = [0xf8f8f4, 0xf4c20d, 0x1d4ed8, 0xdc2626, 0x6d28d9, 0xf97316, 0x15803d, 0x7f1d1d, 0x111111];
function ballTex(n) {          // n 0 = cue ball, 1-7 solids, 8 = black, 9-15 stripes (the number faces +x at the middle of the map)
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d');
  const stripe = n > 8, base = n === 0 ? BALL_COL[0] : BALL_COL[stripe ? n - 8 : n], css = '#' + base.toString(16).padStart(6, '0');
  x.fillStyle = stripe || n === 0 ? '#f8f8f4' : css; x.fillRect(0, 0, 256, 128);
  if (stripe) { x.fillStyle = css; x.fillRect(0, 32, 256, 64); }
  if (n === 0) { x.fillStyle = '#d33'; x.beginPath(); x.arc(128, 64, 5, 0, 7); x.fill(); }
  else for (const u of [0, 64, 128, 192, 256]) {
    x.fillStyle = '#fff'; x.beginPath(); x.arc(u, 64, 20, 0, 7); x.fill();
    x.fillStyle = '#111'; x.font = 'bold 26px system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(n), u, 66);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const ballMats = Array.from({ length: 16 }, (_, n) => new THREE.MeshStandardMaterial({ map: ballTex(n), roughness: 0.2 }));
const ballGeo = new THREE.SphereGeometry(0.03, 12, 8), ballGeoBig = new THREE.SphereGeometry(0.03, 24, 16);

/* ================= 8 BALL POOL HALL (end of the west side road, far from the house) ================= */
// the z = 84 side road continues straight west (the old dead-end barrier was removed) to a plaza and the pool hall
box(-100, 0, 84, 100, 0.03, 6, ASPH, false, false);                                         // road x -150 .. -50
for (let x = -52; x > -149; x -= 4) if (Math.abs(x + 136) > 5.5) box(x, 0.04, 84, 1.8, 0.01, 0.15, WHITE, false, false);  // dashed centre line
for (const s of [-1, 1]) box(-100, 0, 84 + s * 3.7, 100, 0.06, 1.4, 0xbdb8ae, false, false);  // sidewalks
box(-162, 0, 84, 28, 0.015, 32, 0xcfc8bb, false, false);                                     // plaza (lower than the road so the overlap at x -150..-148 never z-fights) x -176 .. -148
for (let z = 72; z <= 96; z += 4) box(-155, 0.02, z, 6, 0.01, 0.1, WHITE, false, false);     // parking lines
for (let x = -64, i = 0; x > -148; x -= 16, i++) {                                            // street lamps along the new road
  const sz = i % 2 ? 79.2 : 88.8, dir = sz > 84 ? -1 : 1;
  box(x, 0, sz, 0.12, 4.2, 0.12, DARK); box(x, 4.1, sz + dir * 0.5, 0.12, 0.1, 1.1, DARK, false);
  box(x, 4.0, sz + dir * 0.9, 0.25, 0.12, 0.35, new THREE.MeshBasicMaterial({ color: 0xfff2c0 }), false, false);
}
for (let x = -58; x > -146; x -= 12) { if (Math.abs(x + 136) > 6) tree(x, 74, 1); if (Math.abs(x - 6 + 136) > 6) tree(x - 6, 94, 1.05); }
// ---- cross road in front of the hall (north-south, x -139 .. -133), a junction with the pool road ----
box(-136, 0, 11.5, 6, 0.05, 223, ASPH, false, false);                                          // z -100 .. 123
box(-136, 0, 84, 6, 0.09, 8.4, ASPH, false, false);                                            // junction patch (covers the sidewalks)
for (let z = -98; z < 122; z += 4) if (Math.abs(z - 84) > 5) box(-136, 0.06, z, 0.15, 0.01, 1.8, WHITE, false, false);
for (const [a, b] of [[-100, 79.8], [88.2, 123]]) for (const sx of [-1, 1]) box(-136 + sx * 3.7, 0, (a + b) / 2, 1.4, 0.07, b - a, 0xbdb8ae, false, false);
for (const z of [-99.7, 122.7]) { box(-136, 0, z, 6.4, 0.9, 0.3, 0xc0392b); box(-136, 0.9, z, 6.4, 0.15, 0.3, WHITE, false); }   // dead-end barriers
for (let z = -94, i = 0; z < 122; z += 14, i++) {
  if (z > -80 && z < -44) continue;                                                            // keep the dealership front clear                                              // street lamps + trees along the cross road
  const sx = i % 2 ? -139.2 : -132.8, dir = sx < -136 ? 1 : -1;
  if (Math.abs(z - 84) > 6) { box(sx, 0, z, 0.12, 4.2, 0.12, DARK); box(sx + dir * 0.5, 4.1, z, 1.1, 0.1, 0.12, DARK, false); box(sx + dir * 0.9, 4.0, z, 0.35, 0.12, 0.25, new THREE.MeshBasicMaterial({ color: 0xfff2c0 }), false, false); }
  if (Math.abs(z - 84) > 8) tree(i % 2 ? -142.5 : -129.5, z + 7, 1);
}
// ---- CAR & MOTO SHOP: far down the cross road (south), x -160..-144, z -72..-52, door in the east wall ----
{
  const SW = M(0xe9e6df, 0.8), FLOOR = M(0xcfd2d6, 0.35);
  wall('x', -72, -160, -144, [win(-152, 6, 0.9, 2.3)], 0, SW);
  wall('x', -52, -160, -144, [win(-152, 6, 0.9, 2.3)], 0, SW);
  wall('z', -160, -72, -52, [], 0, SW);
  wall('z', -144, -72, -52, [win(-56.5, 4, 0.1, 2.7), dr(-62, 1.4), win(-67.5, 4, 0.1, 2.7)], 0, SW);   // glass front + door
  box(-152, 3.0, -62, 17, 0.3, 21, M(0x1d3557, 0.6), false);                                      // roof
  box(-152, 0, -62, 15.6, 0.04, 19.6, FLOOR, false, false);                                       // showroom floor
  box(-142.2, 0, -62, 3.6, 0.03, 28, 0xcfc8bb, false, false);                                     // forecourt
  board(-143.9, 3.4, -62, 10, 1.6, labelTex([['CAR & MOTO SHOP', 74, 56], ['ហាងលក់ឡាន និងម៉ូតូ', 40, 112]], 768, 160, '#101820', '#ffd43b')).rotation.y = -Math.PI / 2;
  const lamp = new THREE.PointLight(0xfff0d8, 22, 20, 1.6); lamp.position.set(-152, 2.7, -62); scene.add(lamp);
  const showCar = (x, z, h, col, pad = true) => { const m = buildCarModel(col); m.group.position.set(x, pad ? 0.12 : 0, z); m.group.rotation.y = h; for (const o of [-1.4, 0, 1.4]) staticAvoid.push([x + Math.sin(h) * o, z + Math.cos(h) * o, 1.05]); if (pad) box(x, 0, z, 4.9, 0.12, 2.8, M(0xf4f4f4, 0.3), false); blk(x, z, Math.abs(Math.cos(h)) > .5 ? 2.2 : 4.4, Math.abs(Math.cos(h)) > .5 ? 4.4 : 2.2, 0, 1.5); };
  const showBike = (x, z, h, col) => { const m = buildBikeModel(col); m.group.position.set(x, 0, z); m.group.rotation.y = h; for (const o of [-0.6, 0.6]) staticAvoid.push([x + Math.sin(h) * o, z + Math.cos(h) * o, 0.45]); m.lean.rotation.z = 0.12; blk(x, z, Math.abs(Math.cos(h)) > .5 ? 0.7 : 2.0, Math.abs(Math.cos(h)) > .5 ? 2.0 : 0.7, 0, 1.2); };
  showCar(-156, -56, Math.PI / 2, 0x1d6fb8); showCar(-156, -62, Math.PI / 2, 0xe9c46a); showCar(-156, -68, Math.PI / 2, 0x2a9d8f);   // indoor cars
  showBike(-149, -70, Math.PI / 2, 0xc0392b); showBike(-149, -68.2, Math.PI / 2, 0x2563eb); showBike(-149, -66.4, Math.PI / 2, 0x2f9e44);                         // indoor bikes
  showCar(-142.2, -50.2, 0, 0xb02a2a, false); showBike(-142.2, -75, 0, 0xf08c00);                                                              // outside on the forecourt
  box(-148, 0, -55.2, 0.6, 1.1, 2.4, 0x6b4f3a); box(-148, 1.1, -55.2, 0.75, 0.05, 2.55, 0xe8e1d4, false);                          // sales desk
  box(-147.9, 1.15, -55.7, 0.3, 0.02, 0.4, 0x222222, false, false);
  board(-159.9, 2.0, -62, 8, 1.0, labelTex([['CARS · MOTORBIKES', 54, 48], ['ឡាន · ម៉ូតូ', 40, 100]], 512, 128, '#101820', '#ffffff')).rotation.y = Math.PI / 2;
  plant(-145.2, -53.2); plant(-145.2, -70.8);
}
box(-12, 0, 78.6, 0.12, 2.4, 0.12, DARK);                                                    // direction sign near the junction
board(-12, 2.4, 78.6, 3.8, 1.0, labelTex([['▲ 8 BALL POOL', 46, 40], ['🎱 ប៊ីយ៉ា · 170 m', 32, 88]], 512, 128, '#111827', '#ffd43b')).rotation.y = -Math.PI / 2;

// ---- the hall: x -192..-176, z 76..92, door in the east wall facing the road ----
const PWM = M(0x24303f, 0.85);
wall('x', 76, -192, -176, [win(-184, 6, 0.9, 2.3)], 0, PWM);
wall('x', 92, -192, -176, [win(-184, 6, 0.9, 2.3)], 0, PWM);
wall('z', -192, 76, 92, [], 0, PWM);
wall('z', -176, 76, 92, [win(79.5, 3, 0.4, 2.4), dr(84, 1.4), win(88.5, 3, 0.4, 2.4)], 0, PWM);   // interactive front door
box(-184, 3.0, 84, 17, 0.3, 17, M(0x1b4332, 0.7), false);                                         // roof
box(-184, 0, 84, 15.6, 0.04, 15.6, repMat(woodTex, 8, 8, 0.45), false, false);                    // floor
board(-175.9, 3.3, 84, 10, 1.6, labelTex([['8 BALL POOL', 92, 56], ['ហាងប៊ីយ៉ា · POOL HALL', 40, 112]], 768, 160, '#0b0b10', '#39ff88')).rotation.y = -Math.PI / 2;   // roof sign facing the road
for (const [z, n] of [[77.5, 8], [90.5, 9]]) {                                                    // giant balls on the roof
  const b = new THREE.Mesh(ballGeoBig, ballMats[n]); b.scale.setScalar(26); b.position.set(-177.2, 4.15, z); b.castShadow = true; scene.add(b);
}
plant(-174.5, 81.8); plant(-174.5, 86.2);
board(-191.8, 1.9, 84, 6, 0.9, labelTex([['8 BALL POOL', 70, 64]], 512, 128, '#0b0b10', '#39ff88')).rotation.y = -Math.PI / 2;      // neon sign inside (west wall)

// bar: counter, stools, shelf with bottles, menu
box(-181, 0, 77.4, 6, 1.05, 0.8, 0x3a2416); box(-181, 1.05, 77.4, 6.2, 0.06, 0.95, 0xe8e1d4, false);
for (let x = -183.5; x <= -178.9; x += 1.5) { box(x, 0, 78.7, 0.4, 0.62, 0.4, 0x1f2937); box(x, 0.62, 78.7, 0.46, 0.08, 0.46, 0xb91c1c, false); }
box(-181, 1.6, 76.25, 6, 0.05, 0.3, WOOD, false);
for (let i = 0; i < 12; i++) { const bt = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.3, 8), M([0x2d6a4f, 0x9d4edd, 0xe9c46a, 0x4cc9f0][i % 4], 0.3)); bt.position.set(-183.6 + i * 0.5, 1.78, 76.3); scene.add(bt); }
board(-181, 2.2, 76.2, 3.6, 0.8, labelTex([['BAR · DRINKS', 44, 36], ['កាហ្វេ · តែ · ភេសជ្ជៈ', 30, 84]], 512, 128, '#1f2a24', '#f2f2f2')).rotation.y = Math.PI;

// cue racks on the west wall, dartboard on the south wall
for (const z of [78.5, 89.5]) {
  box(-191.8, 0.7, z, 0.06, 1.3, 2.4, WOOD, false);
  for (let k = 0; k < 5; k++) { const q = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.016, 1.45, 6), M(0xd9b382, 0.4)); q.position.set(-191.7, 1.5, z - 0.9 + k * 0.45); q.rotation.z = 0.03; scene.add(q); }
}
{
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  [['#111', 128], ['#e8dfc6', 108], ['#c0392b', 80], ['#e8dfc6', 62], ['#1e8449', 36], ['#c0392b', 14]].forEach(([col, r]) => { x.fillStyle = col; x.beginPath(); x.arc(128, 128, r, 0, 7); x.fill(); });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const dart = new THREE.Mesh(new THREE.CircleGeometry(0.32, 28), new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 }));
  dart.position.set(-180, 1.7, 91.88); dart.rotation.y = Math.PI; scene.add(dart);
}

// pool tables
function poolTable(cx, cz, mode) {
  box(cx, 0, cz, 2.1, 0.7, 0.9, RAILM, false);                                       // cabinet
  box(cx, 0.7, cz, 2.3, 0.06, 1.1, FELT, false, false);                              // felt (top at y .76)
  for (const s of [-1, 1]) {
    box(cx, 0.7, cz + s * 0.65, 2.7, 0.12, 0.2, RAILM, false);                       // long rails
    box(cx + s * 1.25, 0.7, cz, 0.2, 0.12, 1.1, RAILM, false);                       // short rails
    box(cx, 0.76, cz + s * 0.57, 2.3, 0.05, 0.06, FELTD, false, false);              // cushions
    box(cx + s * 1.17, 0.76, cz, 0.06, 0.05, 1.1, FELTD, false, false);
  }
  [[-1.2, -0.6], [1.2, -0.6], [-1.2, 0.6], [1.2, 0.6], [0, -0.65], [0, 0.65]].forEach(([px, pz]) => {   // pockets
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.004, 12), POCK); p.position.set(cx + px, 0.826, cz + pz); scene.add(p);
  });
  const T = { cx, cz, balls: [], spots: [{ x: cx + 0.4, z: cz - 1.1, face: 0, taken: false }, { x: cx - 0.4, z: cz + 1.1, face: Math.PI, taken: false }], bots: [], shooter: null, last: null, moving: false };
  const put = (n, x, z) => {
    const b = new THREE.Mesh(ballGeo, ballMats[n]); b.position.set(x, 0.79, z); b.castShadow = true;
    b.rotation.set(0, Math.random() * 6.28, Math.PI / 2 + (Math.random() - 0.5) * 0.5); scene.add(b);   // a number faces up
    T.balls.push({ n, m: b, x: x - cx, z: z - cz, vx: 0, vz: 0, alive: true });
  };
  if (mode === 'rack') {
    put(0, cx - 0.55, cz);
    [[1], [2, 9], [3, 8, 10], [11, 4, 12, 5], [6, 13, 14, 7, 15]].forEach((row, r) => row.forEach((n, i) => put(n, cx + 0.55 + r * 0.054, cz + (i - r / 2) * 0.061)));
  } else {                                                                            // a game in progress: scattered balls
    const pts = [];
    for (const n of [0, 1, 3, 5, 8, 9, 11, 13, 14]) {
      for (let tries = 0; tries < 30; tries++) {
        const x = (Math.random() - 0.5) * 1.9, z = (Math.random() - 0.5) * 0.8;
        if (pts.every(p => Math.hypot(p[0] - x, p[1] - z) > 0.08)) { pts.push([x, z]); put(n, cx + x, cz + z); break; }
      }
    }
    const q = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.016, 1.45, 8), M(0xd9b382, 0.4)); q.rotation.z = Math.PI / 2; q.position.set(cx + 0.2, 0.845, cz + 0.68); scene.add(q);   // a cue on the rail
  }
  box(cx + 0.7, 0.82, cz - 0.68, 0.06, 0.03, 0.06, 0x2b6cb0, false, false);        // chalk
  blk(cx, cz, 2.7, 1.5, 0, 0.84);
  box(cx, 2.1, cz, 2.0, 0.1, 0.4, new THREE.MeshBasicMaterial({ color: 0xfff2c0 }), false, false);   // hanging lamp
  box(cx - 0.8, 2.2, cz, 0.02, 0.8, 0.02, DARK, false, false); box(cx + 0.8, 2.2, cz, 0.02, 0.8, 0.02, DARK, false, false);
  T.rack = () => {
    const place = (n, x, z) => { const b = T.balls.find(o => o.n === n) || (put(n, cx + x, cz + z), T.balls[T.balls.length - 1]); Object.assign(b, { x, z, vx: 0, vz: 0, alive: true }); b.m.visible = true; };
    place(0, -0.55, 0);
    [[1], [2, 9], [3, 8, 10], [11, 4, 12, 5], [6, 13, 14, 7, 15]].forEach((row, r) => row.forEach((n, i) => place(n, 0.55 + r * 0.054, (i - r / 2) * 0.061)));
  };
  const HX = 1.6, HZ = 0.95;                                                          // walkway ring around the table
  T.plan = () => {                                                                    // choose a shot + the spot to stand behind the cue ball
    const cue = T.balls.find(b => b.n === 0); if (!cue.alive) return null;
    const objs = T.balls.filter(b => b.n && b.alive); if (objs.length <= 3) { T.rack(); return null; }
    const o = pick(objs); const dx = o.x - cue.x, dz = o.z - cue.z, d = Math.hypot(dx, dz) || 1, ux = dx / d, uz = dz / d;
    const k = Math.min(Math.abs(ux) > 1e-3 ? (HX + Math.sign(-ux) * cue.x) / Math.abs(ux) : 1e9, Math.abs(uz) > 1e-3 ? (HZ + Math.sign(-uz) * cue.z) / Math.abs(uz) : 1e9);
    const sx = cue.x - ux * k, sz = cue.z - uz * k;                                  // on the ring, directly behind the cue ball
    T.shot = { a: Math.atan2(dz, dx) + (Math.random() - 0.5) * 0.2, sp: 1.6 + Math.random() * 2.2, sx, sz, face: Math.atan2(ux, uz) };
    return T.shot;
  };
  T.ringPath = (fx, fz, tx, tz) => {                                                  // walk around the table edge, never across it
    const edge = (x, z) => { const px = Math.max(-HX, Math.min(HX, x)), pz = Math.max(-HZ, Math.min(HZ, z)); let q = [px, pz];
      if (Math.abs(px) < HX && Math.abs(pz) < HZ) { const dxs = [HX - px, px + HX, HZ - pz, pz + HZ], m = dxs.indexOf(Math.min(...dxs)); q = m === 0 ? [HX, pz] : m === 1 ? [-HX, pz] : m === 2 ? [px, HZ] : [px, -HZ]; }
      const e = Math.abs(q[1] + HZ) < 1e-6 ? 0 : Math.abs(q[0] - HX) < 1e-6 ? 1 : Math.abs(q[1] - HZ) < 1e-6 ? 2 : 3; return { q, e }; };
    const A = edge(fx, fz), B = edge(tx, tz), C = [[HX, -HZ], [HX, HZ], [-HX, HZ], [-HX, -HZ]], out = [A.q];
    if (A.e !== B.e) { const fwd = (B.e - A.e + 4) % 4; if (fwd <= 2) for (let e = A.e; e !== B.e; e = (e + 1) % 4) out.push(C[e]); else for (let e = A.e; e !== B.e; e = (e + 3) % 4) out.push(C[(e + 3) % 4]); }
    out.push(B.q); return out;
  };
  T.shoot = () => {                                                                   // hit the cue ball along the planned line
    const cue = T.balls.find(b => b.n === 0), sh = T.shot; if (!cue.alive || !sh) return;
    cue.vx = Math.cos(sh.a) * sh.sp; cue.vz = Math.sin(sh.a) * sh.sp; T.moving = true;
  };
  T.step = dt => {
    if (!T.moving) return;
    const R = 0.028, n = Math.ceil(dt / 0.008), h = dt / n; let any = false;
    for (let k = 0; k < n; k++) {
      const al = T.balls.filter(b => b.alive);
      for (const b of al) {
        if (Math.abs(b.vx) + Math.abs(b.vz) < 0.02) { b.vx = b.vz = 0; continue; }
        any = true; const f = Math.exp(-1.1 * h); b.vx *= f; b.vz *= f;
        const px = b.x, pz = b.z; b.x += b.vx * h; b.z += b.vz * h;
        for (const [qx, qz] of [[-1.2, -0.6], [1.2, -0.6], [-1.2, 0.6], [1.2, 0.6], [0, -0.65], [0, 0.65]]) {
          if (Math.hypot(b.x - qx, b.z - qz) < 0.15) { b.alive = false; b.m.visible = false; b.vx = b.vz = 0; break; }
        }
        if (!b.alive) { if (b.n === 0) setTimeout(() => { b.x = -0.55; b.z = 0; b.alive = true; b.m.visible = true; }, 900); continue; }
        if (Math.abs(b.x) > 1.12) { b.x = Math.sign(b.x) * 1.12; b.vx *= -0.8; }
        if (Math.abs(b.z) > 0.52) { b.z = Math.sign(b.z) * 0.52; b.vz *= -0.8; }
        const dist = Math.hypot(b.x - px, b.z - pz);
        if (dist > 0) { b.m.rotateOnWorldAxis(new THREE.Vector3((b.z - pz), 0, -(b.x - px)).normalize(), dist / R); }
      }
      for (let i = 0; i < al.length; i++) for (let j = i + 1; j < al.length; j++) {
        const a = al[i], b = al[j]; if (!a.alive || !b.alive) continue;
        const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz);
        if (d < 2 * R && d > 1e-5) {
          const nx = dx / d, nz = dz / d, rel = (a.vx - b.vx) * nx + (a.vz - b.vz) * nz, ov = (2 * R - d) / 2;
          a.x -= nx * ov; a.z -= nz * ov; b.x += nx * ov; b.z += nz * ov;
          if (rel > 0) { a.vx -= rel * nx; a.vz -= rel * nz; b.vx += rel * nx; b.vz += rel * nz; }
        }
      }
    }
    T.balls.forEach(b => b.m.position.set(cx + b.x, 0.79, cz + b.z));
    if (!any) T.moving = false;
  };
  POOLS.push(T); return T;
}
const POOLS = [];
poolTable(-187.5, 80, 'rack'); poolTable(-187.5, 84, 'scatter'); poolTable(-187.5, 88, 'rack');
[[-180, 88.4], [-178, 88.4]].forEach(([x, z]) => { table(x, z, 0.9, 0.9); chair(x, z - 0.8, -1); chair(x, z + 0.8, 1); });   // lounge tables by the window

const cloudM = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false });
for (let i = 0; i < 8; i++) { const c = new THREE.Mesh(new THREE.SphereGeometry(8, 8, 6), cloudM); c.scale.set(2.2, .5, 1.2); c.position.set(-90 + i * 26, 60 + (i % 3) * 8, -70 + (i % 4) * 18); scene.add(c); }

/* ================= PLAYER / PHYSICS ================= */
const P = { x: 3, z: 14, y: 0, vy: 0, on: true }, R = 0.35, EYE = 1.65;
let eyeY = EYE, vx = 0, vz = 0, bob = 0;
camera.rotation.y = 0;

function surfaceH(x, z, fy) {
  const t = fy + 0.55; let h = poolH(x, z);
  if (FL <= t && slabs.some(([a, b, c, d]) => x >= a && x <= b && z >= c && z <= d)) h = FL;
  if (x >= 7.9 && x <= 9.7 && z > 2.2 && z < 6.7) { const s = (Math.min(14, Math.floor((6.7 - z) / 0.3)) + 1) * STEP; if (s <= t) h = Math.max(h, s); }
  return h;
}
function resolve() {
  for (let k = 0; k < 3; k++) for (const c of cols) {
    if (!c.on || P.y + 0.55 >= c.y1 || P.y + 1.7 <= c.y0) continue;
    const nx = Math.max(c.x0, Math.min(P.x, c.x1)), nz = Math.max(c.z0, Math.min(P.z, c.z1));
    const dx = P.x - nx, dz = P.z - nz, d2 = dx * dx + dz * dz;
    if (d2 >= R * R) continue;
    if (d2 > 1e-6) { const d = Math.sqrt(d2), p = R - d; P.x += dx / d * p; P.z += dz / d * p; }
    else { const l = P.x - c.x0, r = c.x1 - P.x, t = P.z - c.z0, b = c.z1 - P.z, m = Math.min(l, r, t, b);
      if (m === l) P.x = c.x0 - R; else if (m === r) P.x = c.x1 + R; else if (m === t) P.z = c.z0 - R; else P.z = c.z1 + R; }
  }
}

/* ================= AI NPC ================= */
/* ================= SEATS & BEDS ================= */
const spots = []; // shared by the player and the AI characters
const sitSpot = (x, z, by, yaw, ex, ez, node) => spots.push({ type: 'sit', px: x, pz: z, x, z, y: by + .45, by, eye: .72, yaw, ex, ez, r: 1.5, node, taken: null });
const bedSpot = (cx, cz, by, hd, node) => spots.push({ type: 'sleep', px: cx, pz: cz, x: cx + hd * .65, z: cz, y: by + .65, by, eye: .28, yaw: hd * Math.PI / 2, hd, ex: cx - hd * 1.7, ez: cz, r: 2.1, node, taken: null });
[-7, -6, -5].forEach(x => sitSpot(x, 5.1, 0, 0, x, 4.0, 'SOFA'));          // living-room sofa
sitSpot(-4.2, -3.3, 0, 0, -4.2, -2.4, 'DINA'); sitSpot(-2.8, -3.3, 0, 0, -2.8, -2.4, 'DINB'); // dining chairs
sitSpot(-4.2, -5.1, 0, Math.PI, -4.2, -6.0, null); sitSpot(-2.8, -5.1, 0, Math.PI, -2.8, -6.0, null);
sitSpot(-2.5, -5.5, U, 0, -2.5, -4.6, 'DESKA');                              // desk chair (upstairs)
const deskSpot = spots[spots.length - 1]; deskSpot.pc = true;                  // sitting here = working on the computer
/* ---- computer on the upstairs desk (desk top y = U + .75, chair side = +z) ---- */
const pcCv = document.createElement('canvas'); pcCv.width = 256; pcCv.height = 160;
const pcTex = new THREE.CanvasTexture(pcCv); pcTex.colorSpace = THREE.SRGBColorSpace;
function drawPC(on, t) {
  const c = pcCv.getContext('2d'), w = 256, h = 160;
  const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, on ? '#0f2a52' : '#16324f'); gr.addColorStop(1, on ? '#1b6aa5' : '#24527a'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
  c.fillStyle = '#10151c'; c.fillRect(0, h - 14, w, 14); c.fillStyle = '#3ddc84'; c.fillRect(4, h - 11, 18, 8);               // taskbar
  if (on) {                                                                                                                  // an open window with scrolling code lines
    c.fillStyle = '#f4f6f8'; c.fillRect(24, 14, 208, 118); c.fillStyle = '#2d3b4e'; c.fillRect(24, 14, 208, 14);
    c.fillStyle = '#ff5f57'; c.beginPath(); c.arc(32, 21, 3, 0, 7); c.fill();
    const off = Math.floor(t * 3) % 6;
    for (let i = 0; i < 8; i++) { const ln = 40 + ((i + off) * 37) % 120; c.fillStyle = ['#2563eb', '#16a34a', '#475569'][(i + off) % 3]; c.fillRect(34 + (i % 3) * 8, 36 + i * 11, ln, 5); }
    if (Math.floor(t * 2) % 2) { c.fillStyle = '#111'; c.fillRect(34 + 40, 36 + 7 * 11, 3, 8); }
  } else { c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(24, 22, 60, 50); c.fillRect(100, 22, 60, 50); c.fillStyle = '#fff'; c.font = '14px sans-serif'; c.fillText('Home', 30, 90); }
  pcTex.needsUpdate = true;
}
drawPC(false, 0);
box(-2.5, U + 0.75, -6.58, 0.24, 0.02, 0.18, DARK, false, false);                                           // monitor base
box(-2.5, U + 0.77, -6.6, 0.05, 0.14, 0.05, DARK, false, false);                                            // neck
box(-2.5, U + 0.9, -6.62, 0.6, 0.36, 0.04, [DARK, DARK, DARK, DARK, new THREE.MeshBasicMaterial({ map: pcTex }), DARK], false, false);   // screen (faces +z)
box(-2.5, U + 0.75, -6.3, 0.42, 0.02, 0.14, 0x20242b, false, false);                                         // keyboard
box(-2.5, U + 0.77, -6.3, 0.38, 0.005, 0.1, 0x4b5563, false, false);
box(-2.08, U + 0.75, -6.3, 0.06, 0.025, 0.09, 0x20242b, false, false);                                       // mouse
box(-3.12, U + 0.75, -6.5, 0.2, 0.42, 0.38, 0x15171c, false);                                                // tower
box(-3.019, U + 1.05, -6.4, 0.01, 0.02, 0.02, new THREE.MeshBasicMaterial({ color: 0x39ff88 }), false, false);
let pcT = 0, pcOn = false;
function pcStep(dt) {
  const on = seat === deskSpot || !!deskSpot.taken; pcT += dt;
  if (on !== pcOn || (on && Math.floor(pcT * 3) !== Math.floor((pcT - dt) * 3))) { pcOn = on; drawPC(on, pcT); }
}
bedSpot(3.3, -3.5, 0, 1, 'GBED'); bedSpot(3.3, -3.5, U, 1, 'B3'); bedSpot(-8.7, 2.5, U, -1, 'MB'); bedSpot(-7.8, -3.5, U, -1, 'B2');

let seat = null;
const nearSpot = () => {
  let best = null, bd = 1e9;
  for (const s of spots) { if (s.taken || Math.abs(P.y - s.by) > .8) continue; const d = Math.hypot(P.x - s.px, P.z - s.pz); if (d < s.r && d < bd) { best = s; bd = d; } }
  return best;
};
function sitDown(s) {
  seat = s; s.taken = 'player'; vx = vz = 0; P.vy = 0;
  camera.rotation.set(s.type === 'sleep' ? 1.0 : 0, s.yaw, 0);
  $('sleepFade').classList.toggle('show', s.type === 'sleep');
  if (s.type === 'sit') startEating(s);                              // food on the table? start eating
}
function standUp() {
  const s = seat; seat = null; s.taken = null;
  Object.assign(P, { x: s.ex, z: s.ez, y: s.by, vy: 0, on: true }); eyeY = s.by + EYE; vx = vz = 0;
  camera.rotation.x = 0; camera.position.set(P.x, eyeY, P.z); $('sleepFade').classList.remove('show');
}
const toggleSeat = () => { if (hug) return; if (driving) exitCar(); else if (seat) standUp(); else if (nearVeh()) enterCar(nearVeh()); else { const s = nearSpot(); if (s) sitDown(s); } };
function seatStep(dt) {
  if (keys.KeyW || keys.KeyS || keys.KeyA || keys.KeyD || jumpReq || Math.hypot(joy.x, joy.y) > .5) { jumpReq = false; standUp(); return; }
  P.x = seat.x; P.z = seat.z; P.y = seat.by;
  eyeY += (seat.y + seat.eye - eyeY) * (1 - Math.exp(-dt * 6));
  camera.position.set(P.x, eyeY + (seat.type === 'sleep' ? Math.sin(performance.now() / 1500) * .012 : 0), P.z);
}

const avoidList = () => { const l = staticAvoid.slice(); for (const v of fleet) for (const [x, z] of carCircles(v)) l.push([x, z, v.r]); return l; };
const common = { THREE, scene, doors, cols, player: P, FL, STEP, spots, avoid: avoidList };
const girl = createCharacter({ ...common, kind: 'girl', name: 'Ny Ny', start: 'HC' });
const boy = createCharacter({ ...common, kind: 'boy', name: 'G1 G1', start: 'OUT2' });
let me = boy, other = girl;   // "me" = character the human controls, "other" = AI
boy.control();
const switchLabel = () => { $('switchBtn').textContent = `🔁 Switch → ${other.name}`; };
switchLabel();
function switchChar() {
  if (typeof closePhone === 'function') closePhone();
  hug = null; if (aiMeal) finishAIMeal(false);
  if (driving) exitCar();
  if (seat) standUp();
  const workHere = shop.open && canShop();   // shop is open and we stand at the sales spot
  const s = other.getPose();                                   // where the AI character stands now
  me.release(P.x, P.z, P.y, camera.rotation.y + Math.PI);      // my old character becomes AI right here
  other.control();                                             // I take over the other one
  Object.assign(P, { x: s.x, z: s.z, y: s.y, vy: 0, on: true });
  camera.rotation.set(0, s.ang + Math.PI, 0); eyeY = s.y + EYE; vx = vz = 0;
  camera.position.set(P.x, eyeY, P.z); eyePos.copy(camera.position);
  [me, other] = [other, me]; switchLabel(); refreshHeld();   // the carried bowl goes with you
  if (shop.barista === me) shop.barista = null;                                    // we took control of the barista again
  if (workHere) { other.work(); shop.barista = other; toast(other.name + ' ឈរលក់ហាង ☕'); }   // the character we left keeps selling
}

/* ---- Drivable car ---- */
function buildCarModel(bodyCol = 0xb02a2a) {
  const group = new THREE.Group(); scene.add(group);
  const add = (w, h, d, m, x, y, z, cast = true) => { const o = new THREE.Mesh(G, mt(m)); o.scale.set(w, h, d); o.position.set(x, y, z); o.castShadow = cast; o.receiveShadow = true; group.add(o); return o; };
  const bodyMat = M(bodyCol, 0.35, 0.4);
  add(2, 0.6, 4.2, bodyMat, 0, 0.65, 0);
  add(1.7, 0.75, 2.2, new THREE.MeshStandardMaterial({ color: 0x1c2733, roughness: 0.1, metalness: 0.6, transparent: true, opacity: 0.85 }), 0, 1.325, -0.2);
  add(1.5, 0.12, 0.5, DARK, 0, 0.98, 0.75, false);                       // dashboard
  add(0.5, 0.5, 0.5, 0x2a2a2a, 0.4, 0.7, -0.35, false); add(0.5, 0.5, 0.5, 0x2a2a2a, -0.4, 0.7, -0.35, false); // seats
  add(2.05, 0.2, 0.15, DARK, 0, 0.45, 2.12); add(2.05, 0.2, 0.15, DARK, 0, 0.45, -2.12);
  for (const sx of [-1, 1]) {
    add(0.4, 0.16, 0.08, new THREE.MeshBasicMaterial({ color: 0xfff2c0 }), sx * 0.7, 0.78, 2.12, false);
    add(0.4, 0.16, 0.08, new THREE.MeshBasicMaterial({ color: 0xff2a2a }), sx * 0.7, 0.78, -2.12, false);
  }
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.022, 8, 20), DARK); wheel.position.set(0.4, 1.08, 0.45); wheel.rotation.x = -1.0; group.add(wheel);
  const wheels = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const pivot = new THREE.Group(), spin = new THREE.Group(); pivot.position.set(sx * 1.0, 0.35, sz * 1.4); pivot.add(spin); group.add(pivot);
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.25, 14), DARK); w.rotation.z = Math.PI / 2; w.castShadow = true; spin.add(w);
    wheels.push({ pivot, spin, front: sz > 0 });
  }
  return { group, wheels, wheel, bodyMat };
}
const CAR_CFG = { cap: 900, burn: 1 / 6500, offs: [-1.4, 0, 1.4], r: 1.05, maxF: 15, maxB: 24, acc: 8, accB: 12, wb: 2.6, maxS: 0.5, wr: 0.35, near: 3.4, ph: 1.0 };
const car = { ...buildCarModel(), x: 18, z: 10, h: 0, v: 0, steer: 0, spin: 0, ...CAR_CFG, slot: [18, 10], active: true };

/* ---- Motorbike (black Dream-style underbone with a gold stripe) ---- */
function buildBikeModel(col = 0x15161a) {
  const group = new THREE.Group(), lean = new THREE.Group(); group.add(lean); scene.add(group);
  const add = (par, w, h, d, m, x, y, z, cast = true) => { const o = new THREE.Mesh(G, mt(m)); o.scale.set(w, h, d); o.position.set(x, y, z); o.castShadow = cast; par.add(o); return o; };
  const BLK = M(0x15161a, 0.35, 0.4), BODY = M(col, 0.35, 0.4), GOLD = M(0xc9a227, 0.35, 0.6), CHR = M(0xcfd3d8, 0.25, 0.8);
  add(lean, 0.3, 0.07, 0.75, CHR, 0, 0.3, 0.0);                                         // floor board
  add(lean, 0.34, 0.3, 0.6, BODY, 0, 0.58, -0.55);                                        // rear body
  add(lean, 0.3, 0.1, 0.78, BLK, 0, 0.8, -0.42);                                         // seat
  add(lean, 0.2, 0.75, 0.1, BODY, 0, 0.62, 0.42).rotation.x = -0.25;                      // leg shield
  add(lean, 0.22, 0.4, 0.14, BODY, 0, 0.45, 0.2).rotation.x = 0.2;                        // spine tube
  add(lean, 0.36, 0.03, 0.3, CHR, 0, 0.7, 0.55, false);                                  // front carrier
  add(lean, 0.34, 0.03, 0.3, CHR, 0, 0.77, -0.95, false);                                // rear rack
  add(lean, 0.1, 0.1, 0.55, CHR, 0.2, 0.3, -0.4);                                        // muffler
  add(lean, 0.22, 0.16, 0.2, CHR, 0, 0.3, -0.25);                                        // engine
  for (const sx of [-1, 1]) {
    add(lean, 0.015, 0.1, 0.5, GOLD, sx * 0.175, 0.6, -0.55, false);                    // gold side stripes
    add(lean, 0.015, 0.08, 0.3, GOLD, sx * 0.105, 0.64, 0.4, false).rotation.x = -0.25;
  }
  add(lean, 0.14, 0.06, 0.05, new THREE.MeshBasicMaterial({ color: 0xff2a2a }), 0, 0.68, -0.98, false);   // tail light
  const wheels = [];
  const mkWheel = par => {
    const spin = new THREE.Group(); par.add(spin);
    const tire = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.06, 8, 20), DARK); tire.rotation.y = Math.PI / 2; tire.castShadow = true; spin.add(tire);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.09, 10), CHR); hub.rotation.z = Math.PI / 2; spin.add(hub);
    const rim = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.5, 0.02), CHR); spin.add(rim); const rim2 = rim.clone(); rim2.rotation.x = Math.PI / 2; spin.add(rim2);
    return spin;
  };
  const rear = new THREE.Group(); rear.position.set(0, 0.34, -0.8); lean.add(rear); wheels.push({ pivot: rear, spin: mkWheel(rear), front: false });
  const steer = new THREE.Group(); steer.position.set(0, 0, 0.6); lean.add(steer);
  const fw = new THREE.Group(); fw.position.set(0, 0.34, 0.2); steer.add(fw); wheels.push({ pivot: steer, spin: mkWheel(fw), front: true });
  for (const sx of [-1, 1]) add(steer, 0.03, 0.62, 0.04, CHR, sx * 0.09, 0.64, 0.12).rotation.x = -0.2;   // fork
  add(steer, 0.1, 0.04, 0.5, BODY, 0, 0.7, 0.25, false);                                  // front fender
  add(steer, 0.62, 0.04, 0.04, BLK, 0, 1.0, -0.02);                                       // handlebar
  for (const sx of [-1, 1]) { add(steer, 0.02, 0.18, 0.02, DARK, sx * 0.24, 1.1, -0.02); add(steer, 0.1, 0.07, 0.015, CHR, sx * 0.28, 1.2, -0.02, false); add(steer, 0.07, 0.04, 0.07, DARK, sx * 0.3, 1.0, -0.02, false); }  // mirrors + grips
  add(steer, 0.2, 0.15, 0.13, BODY, 0, 0.98, 0.06);                                        // headlamp housing
  add(steer, 0.16, 0.1, 0.02, new THREE.MeshBasicMaterial({ color: 0xfff2c0 }), 0, 0.98, 0.135, false);
  add(steer, 0.1, 0.12, 0.1, GOLD, 0, 0.9, -0.05, false);                                 // dashboard
  return { group, lean, wheels, bodyMat: BODY };
}
const BIKE_CFG = { cap: 450, burn: 1 / 4800, wheel: null, offs: [-0.6, 0.6], r: 0.45, maxF: 19, maxB: 28, acc: 9, accB: 13, wb: 1.35, maxS: 0.7, wr: 0.34, near: 2.4, ph: 1.0, bike: true };
const bike = { ...buildBikeModel(), x: 21.3, z: 9, h: 0, v: 0, steer: 0, spin: 0, ...BIKE_CFG, slot: [21.3, 9], active: true };
const fleet = [car, bike]; car.key = 0; bike.key = 1;
const allVeh = () => fleet;
let driving = false, dv = car;
const bikeSeat = { type: 'sit', bike: true, x: 0, z: 0, by: 0.28, yaw: 0 };
const carCircles = v => v.offs.map(o => [v.x + Math.sin(v.h) * o, v.z + Math.cos(v.h) * o]);
const nearVeh = () => { if (driving || seat || Math.abs(P.y) > 1) return null; let best = null, bd = 1e9; for (const v of allVeh()) { const d = Math.hypot(P.x - v.x, P.z - v.z); if (d < v.near && d < bd) { best = v; bd = d; } } return best; };
function poolExit() { // climb out of the pool when close to the edge
  const dl = P.x + 5, dr = 5 - P.x, dtp = P.z + 16.5, db = -10.5 - P.z, m = Math.min(dl, dr, dtp, db);
  if (m > 0.9) return false;
  if (m === dl) P.x = -5.7; else if (m === dr) P.x = 5.7; else if (m === dtp) P.z = -17.2; else P.z = -9.8;
  P.y = 0; P.vy = 3; P.on = false; return true;
}
function swimStep(dt, f) { // float at the surface; look down + swim forward = dive, look up = rise; Jump at the edge = climb out
  const surfaceY = WATER_Y - 1.35;                                   // feet level when floating (eyes ~0.3 m above the water)
  if (jumpReq) { jumpReq = false; if (poolExit()) return; }
  const vyS = f > 0.1 ? Math.sin(camera.rotation.x) * 2.2 : 0;
  P.y += vyS * dt;
  if (vyS >= 0) P.y += (surfaceY - P.y) * Math.min(1, dt * 1.2);     // buoyancy
  P.y = Math.min(surfaceY, Math.max(-2.0, P.y)); P.vy = 0; P.on = false;
}

function carResolve(v) { // push the vehicle out of walls / trees / furniture (circles along its body)
  let hit = 0; const r = v.r;
  const all = cols.concat(carOnly);
  for (let k = 0; k < 3; k++) for (const c of all) {
    if (!c.on || c.y1 <= 0.25 || c.y0 >= 1.5) continue;
    for (const o of v.offs) {
      const cx = v.x + Math.sin(v.h) * o, cz = v.z + Math.cos(v.h) * o;
      const nx = Math.max(c.x0, Math.min(cx, c.x1)), nz = Math.max(c.z0, Math.min(cz, c.z1));
      const dx = cx - nx, dz = cz - nz, d = Math.hypot(dx, dz);
      if (d >= r) continue;
      if (d > 1e-6) { v.x += dx / d * (r - d); v.z += dz / d * (r - d); hit += r - d; }
      else { v.x += (cx < (c.x0 + c.x1) / 2 ? -1 : 1) * r; hit += r; }
    }
  }
  return hit;
}
function carPushPlayer() { // you can't walk through a vehicle
  if (driving || P.y > 1.2) return;
  for (const v of allVeh()) for (const [cx, cz] of carCircles(v)) {
    const dx = P.x - cx, dz = P.z - cz, d = Math.hypot(dx, dz), m = v.r + R;
    if (d < m) { if (d > 1e-4) { P.x += dx / d * (m - d); P.z += dz / d * (m - d); } else P.x += m; }
  }
}
let prevH = 0;
function enterCar(v) { v.ai = null; if (aiTask && aiTask.v === v) cancelAiDrive(); dv = v; if (other.mode() === 'follow') other.board(v); driving = true; vx = vz = 0; P.vy = 0; camera.rotation.set(0, v.h + Math.PI, 0); $('speed').classList.add('show'); }
function exitCar() {
  saveGame();
  other.alight();
  const v = dv, side = v.bike ? 1.2 : 2.1;
  driving = false; $('speed').classList.remove('show');
  Object.assign(P, { x: v.x + Math.cos(v.h) * side, z: v.z - Math.sin(v.h) * side, y: 0, vy: 0, on: true });
  eyeY = EYE; vx = vz = 0; camera.rotation.x = 0; camera.position.set(P.x, eyeY, P.z);
}
function carStep(v, dt) {
  const on = driving && dv === v;
  let f = 0, s = 0, boost = false, brake = false;
  if (on) {
    f = Math.max(-1, Math.min(1, (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) - joy.y));
    s = Math.max(-1, Math.min(1, (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + joy.x));
    boost = !!keys.ShiftLeft; brake = !!keys.Space || jumpReq; jumpReq = false;
  } else if (v.ai) { f = v.ai.f; s = v.ai.s; brake = !!v.ai.brake; }
  if (v.fuel === undefined) v.fuel = 1;
  const maxF = v.fuel <= 0 ? 3 : (boost ? v.maxB : v.maxF);                       // empty tank: crawl only
  if (brake) v.v -= Math.sign(v.v) * Math.min(Math.abs(v.v), 22 * dt);
  else if (f > 0.05) v.v += (v.v < 0 ? 20 : (boost ? v.accB : v.acc)) * f * dt;
  else if (f < -0.05) v.v += (v.v > 0 ? 20 : 6) * f * dt;
  else v.v *= Math.exp(-dt * 0.9);
  v.v = Math.max(-5, Math.min(maxF, v.v)); if (!on && Math.abs(v.v) < 0.05) v.v = 0;
  v.steer += (s * v.maxS / (1 + Math.abs(v.v) / 8) - v.steer) * Math.min(1, dt * 6);
  const oh = v.h;
  v.h -= (v.v / v.wb) * Math.tan(v.steer) * dt;
  v.x += Math.sin(v.h) * v.v * dt; v.z += Math.cos(v.h) * v.v * dt;
  v.fuel = Math.max(0, v.fuel - Math.abs(v.v) * dt * v.burn * (boost ? 1.6 : 1));
  if (on && v.fuel < 0.15 && !v.warned) { v.warned = true; toast(v.fuel <= 0 ? '⛽ អស់សាំងហើយ! ទៅស្ថានីយ៍សាំងនៅចុងផ្លូវខាងកើត' : '⛽ សាំងជិតអស់ហើយ'); } else if (v.fuel > 0.3) v.warned = false;
  const hit = carResolve(v); if (hit > 0.001) v.v *= Math.max(0.2, 1 - hit * 5);
  v.x = Math.max(-230, Math.min(175, v.x)); v.z = Math.max(-110, Math.min(125, v.z));
  v.spin += v.v * dt / v.wr;
  v.group.position.set(v.x, 0, v.z); v.group.rotation.y = v.h;
  v.wheels.forEach(w => { w.spin.rotation.x = v.spin; if (w.front) w.pivot.rotation.y = -v.steer; });
  if (v.wheel) v.wheel.rotation.z = -v.steer * 3;
  if (v.lean) v.lean.rotation.z += (Math.max(-0.4, Math.min(0.4, v.steer * v.v * 0.06)) - v.lean.rotation.z) * Math.min(1, dt * 5);
  if (!on) return;
  camera.rotation.y += v.h - oh;                                   // the view turns with the vehicle
  P.x = v.x; P.z = v.z; P.y = 0; P.vy = 0; vx = vz = 0;
  const sn = Math.sin(v.h), cs = Math.cos(v.h), tps = camMode === 'tps';
  if (v.bike) {
    bikeSeat.x = v.x - sn * 0.3; bikeSeat.z = v.z - cs * 0.3; bikeSeat.yaw = v.h - Math.PI;
    camera.position.set(v.x - (tps ? 0 : sn * 0.3), tps ? 1.5 : 1.5, v.z - (tps ? 0 : cs * 0.3));
  } else camera.position.set(v.x + (tps ? 0 : cs * 0.4 + sn * 0.1), tps ? 1.6 : 1.15, v.z + (tps ? 0 : -sn * 0.4 + cs * 0.1));
  $('speed').textContent = Math.round(Math.abs(v.v) * 3.6) + ' km/h · ⛽ ' + Math.round(v.fuel * 100) + '%';
}

/* ================= CAMERA VIEW (first / third person) ================= */
let camMode = 'tps', camDist = 3, lookSens = 1;
const eyePos = new THREE.Vector3(P.x, EYE, P.z);   // real eye position (first-person point)
function applyView() {
  me.group.visible = camMode === 'tps' && (!driving || dv.bike);
  heldFP.visible = (!!held || !!eating || !!drink || baby.state === 'held') && camMode === 'fps' && !driving && !swimming;              // your own body is only shown in third person
  if (camMode !== 'tps') { camera.position.copy(eyePos); return; }
  const th = camera.rotation.y, ph = camera.rotation.x;
  const fx = -Math.sin(th) * Math.cos(ph), fy = Math.sin(ph), fz = -Math.cos(th) * Math.cos(ph);
  const cd = driving ? (dv.bike ? camDist * 1.2 + 1.2 : camDist * 1.6 + 2) : camDist;
  let d = cd;
  for (let s = 0.3; s <= cd; s += 0.2) {        // pull the camera in when a wall / furniture is behind us
    const x = eyePos.x - fx * s, y = eyePos.y - fy * s, z = eyePos.z - fz * s;
    if (cols.some(c => c.on && y > c.y0 && y < c.y1 && x > c.x0 - .15 && x < c.x1 + .15 && z > c.z0 - .15 && z < c.z1 + .15)) { d = Math.max(.4, s - .3); break; }
  }
  const inside = Math.abs(eyePos.x) < 10 && Math.abs(eyePos.z) < 7, top = eyePos.y > 3.4 ? FL + 2.85 : 2.85;
  let cy = eyePos.y - fy * d; if (inside) cy = Math.min(cy, top);
  camera.position.set(eyePos.x - fx * d, Math.max(.15, cy), eyePos.z - fz * d);
}

/* ================= TALK / FOLLOW / HUG (click an AI character) ================= */
let hug = null; // active hug: { t, ang, camYaw }
const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2();
function clickAt(x, y) {
  if (driving || seat || hug) return;
  ndc.set(x / innerWidth * 2 - 1, -(y / innerHeight) * 2 + 1);
  camera.updateMatrixWorld(); raycaster.setFromCamera(ndc, camera);
  const hit = raycaster.intersectObject(other.group, true)[0];
  if (!hit || hit.distance > 14) return;
  const m = other.mode();
  if (m === 'ride') return;
  if (m === 'talk' || m === 'follow') other.resume();   // click again -> back to AI routine
  else other.talk();                                    // click -> stop and face the player
}
const canFollow = () => {
  if (other.mode() !== 'talk' || driving || seat || hug) return false;
  const p = other.getPose(); return Math.hypot(P.x - p.x, P.z - p.z) < 3.2 && Math.abs(P.y - p.y) < 1.2;
};
const followMe = () => { if (canFollow()) other.follow(); };
const canHug = () => !hug && (other.mode() === 'talk' || other.mode() === 'follow') && !driving && !seat &&
  (p => Math.hypot(P.x - p.x, P.z - p.z) < 3.2 && Math.abs(P.y - p.y) < 1.2)(other.getPose());
function startHug() {
  if (!canHug()) return;
  const p = other.getPose(), dx = p.x - P.x, dz = p.z - P.z, d = Math.hypot(dx, dz) || 1;
  hug = { t: 0, ang: Math.atan2(dx, dz), camYaw: Math.atan2(-dx, -dz) };
  other.hug(P.x + dx / d * 0.42, P.z + dz / d * 0.42, hug.ang + Math.PI, 5);   // the AI steps in close; both embrace for 5 s
  vx = vz = 0;
}
function hugStep(dt) { // player is frozen, camera turns toward the partner
  hug.t += dt; vx = vz = 0; jumpReq = false;
  if (hug.t < 0.6) { // only the first moments turn the view toward the partner; after that you can look around freely
    let df = hug.camYaw - camera.rotation.y; df = Math.atan2(Math.sin(df), Math.cos(df));
    camera.rotation.y += df * Math.min(1, dt * 5); camera.rotation.x += (0 - camera.rotation.x) * Math.min(1, dt * 3);
  }
  camera.position.set(P.x, eyeY, P.z);
  if (hug.t >= 5) hug = null;
}

/* ================= COFFEE SHOP (open the shop -> customer bots come in one at a time) ================= */
// ---- saved progress (money + customers served), stored in the browser ----
const SAVE_KEY = 'villaGame.save.v1', save = { money: 0, served: 0 };   // money in cents
try { Object.assign(save, JSON.parse(localStorage.getItem(SAVE_KEY) || '{}')); } catch (e) { /* no saved data */ }
const FUEL_KEY = 'villaGame.fuel.v1';   // fuel levels also live under their own key so nothing else can overwrite them
const saveGame = () => { try { save.fuel = fleet.map(v => Math.round((v.fuel === undefined ? 1 : v.fuel) * 1000) / 1000); localStorage.setItem(SAVE_KEY, JSON.stringify(save)); localStorage.setItem(FUEL_KEY, JSON.stringify(save.fuel)); } catch (e) { /* storage unavailable */ } };
const fmt = c => '$' + (c / 100).toFixed(2);
function updateMoney(pop) {
  $('moneyAmt').textContent = fmt(save.money);
  if (pop) { const el = $('money'); el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
}
updateMoney();
const MENU = [['Latte', 300], ['Cappuccino', 350], ['Espresso', 250], ['Iced Coffee', 400], ['Tea', 200]];
const shop = { open: false, custs: [], next: 0, served: save.served || 0, busy: false, queue: [], barista: null };
const LOOKS = {
  girl: [{ hair: 0x14141a, skin: 0xf6cdb4, shirt: '#4a5f94' }, { hair: 0x5a3825, skin: 0xe8b997, shirt: '#b84a5e' }, { hair: 0x2b1d14, skin: 0xd9a77f, shirt: '#3f8f6b' }, { hair: 0x8a5a2b, skin: 0xf1c9a8, shirt: '#d9822b' }],
  boy: [{ hair: 0x4a3a2c, skin: 0xd9a77f, shirt: '#d9534f', shirt2: '#f3d9a4' }, { hair: 0x15151a, skin: 0xe8b997, shirt: '#3b82f6', shirt2: '#c7d8f5' }, { hair: 0x6b4a2b, skin: 0xf1c9a8, shirt: '#f59e0b', shirt2: '#5b3a1a' }, { hair: 0x222222, skin: 0xc68e63, shirt: '#8b5cf6', shirt2: '#e5dcfb' }],
};
const NAMES = { girl: ['Srey', 'Bopha', 'Maly', 'Sophea', 'Vanna', 'Nary'], boy: ['Sok', 'Mony', 'Rith', 'Kosal', 'Chan', 'Veasna'] };
const pick = a => a[Math.floor(Math.random() * a.length)];
const toast = msg => { const el = $('toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('show'), 2600); };
const canShop = () => !driving && !seat && !hug && Math.abs(P.y) < 1 && P.x > 0.2 && P.x < 6.3 && P.z > 108.9 && P.z < 110.6;  // behind the counter
function toggleShop() {
  if (!canShop()) return;
  shop.open = !shop.open; shop.next = 3;                       // first customer arrives after a few seconds
  const m = openSign.material[5]; m.map = shop.open ? signOpen : signClosed; m.needsUpdate = true;
  if (!shop.open && shop.barista) { shop.barista.resume(); shop.barista = null; }   // shop closed: the barista goes back to normal
  toast(shop.open ? 'ហាងបើកហើយ ☕ អតិថិជននឹងមកដល់ឆាប់ៗ' : 'ហាងបិទហើយ');
}
// chairs of the coffee shop become sittable spots (customers - and you - can use them)
const cafeIn = [], cafeOut = [];
const addCafeSet = (x, z, list) => [[z - 0.8, Math.PI], [z + 0.8, 0]].forEach(([cz, yaw]) => {
  sitSpot(x, cz, 0, yaw, x < 3 ? x + 1.0 : x - 1.0, cz, null); list.push(spots[spots.length - 1]);   // exit toward the middle of the shop
});
[[-1.5, 105.6], [7.2, 105.6]].forEach(([x, z]) => addCafeSet(x, z, cafeIn));
[[-9, 99.5], [-3.5, 98.5], [10, 98.5], [16, 99.5]].forEach(([x, z]) => addCafeSet(x, z, cafeOut));

function spawnCustomer() {
  const kind = Math.random() < 0.5 ? 'girl' : 'boy', look = pick(LOOKS[kind]), name = pick(NAMES[kind]);
  const [sx, sz] = pick([[3, 90], [-12, 97], [18, 97]]);
  const c = createCharacter({ ...common, kind, name, look, at: [sx, sz] });
  const door = doors.find(d => Math.abs(d.pos.x - 3) < 0.3 && Math.abs(d.pos.z - 103.5) < 0.3);
  // pick a free chair (inside or outside, random) and reserve it
  const inside = Math.random() < 0.5, free = l => l.filter(s => !s.taken);
  let pool = free(inside ? cafeIn : cafeOut); if (!pool.length) pool = free(inside ? cafeOut : cafeIn);
  const seat = pool.length ? pick(pool) : null; if (seat) seat.taken = name;
  // pick a waiting spot that isn't too close to the other customers
  let wp = null, best = -1;
  for (let i = 0; i < 6; i++) {
    const cand = [0.8 + Math.random() * 4.8, 105.4 + Math.random() * 1.2];
    const d = Math.min(9, ...shop.custs.map(o => o.wp ? Math.hypot(o.wp[0] - cand[0], o.wp[1] - cand[1]) : 9));
    if (d > best) { best = d; wp = cand; }
  }
  c.wp = wp; shop.custs.push(c);
  const ox = 2.6 + Math.random() * 1.6, stay = 10 + Math.random() * 10, tag = 'Enjoying coffee ☕';
  const pts = [
    { x: 3, z: 101.7 },
    { x: 3, z: 105.2, door },                                                           // through the front door
    { x: wp[0], z: wp[1], face: 0, tag: 'Waiting in line', arrive: () => shop.queue.push(c),
      until: () => shop.queue[0] === c && !shop.busy, after: () => { shop.queue.shift(); shop.busy = true; } },
    { x: ox, z: 107.4, face: 0, wait: 3.5, tag: 'Ordering ☕',
      after: () => { shop.busy = false; c.setCup(true); const item = pick(MENU); save.money += item[1]; save.served = ++shop.served; saveGame(); updateMoney(true); toast(name + ' ទិញ ' + item[0] + ' +' + fmt(item[1]) + ' 💰'); } },
  ];
  if (seat && cafeIn.includes(seat)) pts.push({ x: seat.ex, z: seat.ez, sit: seat, dur: stay, tag }, { x: 3, z: 105.2 }, { x: 3, z: 102.3, door });  // sit inside, then leave
  else if (seat) pts.push({ x: 3, z: 105.2 }, { x: 3, z: 102.3, door }, { x: seat.ex, z: seat.ez, sit: seat, dur: stay, tag });                      // sit outside
  else { const st = pick([[3, 100.4], [-6.5, 101.5], [12.5, 101.5]]); pts.push({ x: 3, z: 105.2 }, { x: 3, z: 102.3, door }, { x: st[0], z: st[1], face: Math.PI, wait: 6, tag, drink: true }); } // no free chair: drink standing
  pts.push({ x: 3, z: 92 }, { x: 3, z: 74 });                                                                                                          // walk away down the road
  c.script(pts, () => { c.dispose(); shop.custs.splice(shop.custs.indexOf(c), 1); });
}
function shopStep(dt) {
  if (shop.barista) shop.barista.setBusy(shop.busy);
  [...shop.custs].forEach(c => c.update(dt));
  if (shop.open && shop.custs.length < 4) {                  // new customers keep arriving, even while others are still drinking
    shop.next -= dt;
    if (shop.next <= 0) { spawnCustomer(); shop.next = 5 + Math.random() * 9; }
  }
}

/* ================= EAST ROAD (the z = 84 side road continues straight east) + GAS STATION ================= */
{
  const X0 = 56, X1 = 170, CX = (X0 + X1) / 2, LEN = X1 - X0;
  box(CX, 0, 84, LEN, 0.03, 6, ASPH, false, false);                                                     // road x 56 .. 170
  for (let x = X0 + 2; x < X1 - 1; x += 4) box(x, 0.035, 84, 1.8, 0.01, 0.15, WHITE, false, false);     // dashed centre line
  for (const sg of [-1, 1]) box(CX, 0, 84 + sg * 3.7, LEN, 0.06, 1.4, 0xbdb8ae, false, false);          // sidewalks
  box(X1 + 0.5, 0, 84, 0.3, 0.9, 6.4, 0xc0392b); box(X1 + 0.5, 0.9, 84, 0.3, 0.15, 6.4, WHITE, false);   // dead end far away
  for (let x = 66, i = 0; x < X1 - 4; x += 16, i++) {                                                   // street lamps
    const sz = i % 2 ? 79.2 : 88.8, dir = sz > 84 ? -1 : 1;
    if (x > 84 && x < 124 && sz > 84) continue;                                                         // keep the station frontage clear
    box(x, 0, sz, 0.12, 4.2, 0.12, DARK); box(x, 4.1, sz + dir * 0.5, 0.12, 0.1, 1.1, DARK, false);
    box(x, 4.0, sz + dir * 0.9, 0.25, 0.12, 0.35, new THREE.MeshBasicMaterial({ color: 0xfff2c0 }), false, false);
  }
  for (let x = 64; x < X1 - 6; x += 12) { if (x < 84 || x > 124) tree(x, 74, 1); if (x < 80 || x > 126) tree(x + 6, 96, 1.05); }
  // station: forecourt x 84..124, z 88.4..110 (two driveways cross the north sidewalk)
  const CONC = 0xb8b8b2, RED = 0xd62828, WH = 0xf4f1ea;
  box(104, 0, 99.2, 40, 0.04, 21.6, CONC, false, false);
  for (const dx of [92, 116]) box(dx, 0, 87.7, 6, 0.07, 1.4, CONC, false, false);                      // driveways over the sidewalk
  for (const dx of [92, 116]) box(dx, 0, 86, 6, 0.035, 3.4, ASPH, false, false);                         // asphalt ramps from the road
  // canopy on four pillars
  box(103, 4.6, 96, 20, 0.35, 12, M(0xf4f1ea, 0.6), false); box(103, 4.35, 96, 20.2, 0.25, 12.2, M(RED, 0.5), false);
  for (const [px, pz] of [[94, 91], [112, 91], [94, 101], [112, 101]]) box(px, 0, pz, 0.45, 4.6, 0.45, M(WH, 0.5));
  board(103, 4.0, 89.8, 6, 0.8, labelTex([['⛽ GAS STATION', 56, 44], ['ស្ថានីយ៍ប្រេងសាំង', 36, 94]], 512, 128, '#b71c1c', '#ffffff'));
  // two pump islands (pumps on both sides) with a hose and a price display
  for (const ix of [98, 108]) {
    box(ix, 0, 96, 1.3, 0.18, 5.2, 0x8d8d86);
    for (const pz of [94.6, 97.4]) {
      box(ix, 0.18, pz, 0.6, 1.5, 0.45, M(RED, 0.4)); box(ix, 1.2, pz - 0.01, 0.5, 0.3, 0.46, M(0x1b1f24, 0.3), false); box(ix, 1.28, pz - 0.24, 0.34, 0.12, 0.02, new THREE.MeshBasicMaterial({ color: 0x66ff99 }), false, false);
      box(ix, 1.7, pz, 0.62, 0.08, 0.47, M(WH, 0.5), false); box(ix + 0.34, 0.9, pz, 0.06, 0.5, 0.1, DARK, false);
    }
  }
  // price pylon by the road (readable from both directions)
  box(88, 0, 90.2, 0.25, 6.2, 0.25, DARK);
  board(88, 6.2, 90.2, 3.8, 1.5, labelTex([['⛽ GAS', 66, 44], ['PETROL $1.20 · ប្រេង', 28, 100]], 512, 128, '#b71c1c', '#ffe08a'));
  // convenience store x 120..132, z 94..106, glass front towards the pumps (west)
  const SWM = M(0xe9e6df, 0.8);
  wall('z', 120, 94, 106, [win(96.8, 3, 0.9, 2.3), dr(100, 1.4), win(103.4, 3, 0.9, 2.3)], 0, SWM);
  wall('z', 132, 94, 106, [], 0, SWM);
  wall('x', 94, 120, 132, [win(126, 5, 0.9, 2.3)], 0, SWM); wall('x', 106, 120, 132, [], 0, SWM);
  box(126, 3.0, 100, 13.5, 0.3, 13.5, M(RED, 0.6), false);
  box(126, 0, 100, 11.6, 0.04, 11.6, 0xcfd2d6, false, false);
  board(119.9, 3.5, 100, 8, 1.2, labelTex([['MINI MART', 62, 44], ['ហាងទំនិញ · 24h', 34, 98]], 512, 128, '#14532d', '#ffffff')).rotation.y = Math.PI / 2;
  box(124, 0, 102.6, 0.8, 1.05, 4.2, 0x5b3a26); box(124, 1.05, 102.6, 1.0, 0.06, 4.4, 0xe8e1d4, false);   // checkout counter
  box(130.8, 0, 97, 0.7, 1.9, 3.6, 0x4b5563); box(130.8, 0, 103, 0.7, 1.9, 3.6, 0x4b5563);                 // shelves along the east wall
  box(128, 0, 100, 0.7, 1.4, 3.2, 0x4b5563);
  box(94, 0, 105, 1.4, 1.0, 1.4, 0x3a3d42); box(94, 1.0, 105, 1.5, 0.1, 1.5, 0xf4f1ea, false);          // air / water stand
  [[84.5, 108], [124, 109]].forEach(([x, z]) => tree(x, z, 1));
}
const gasClerk = createCharacter({ ...common, kind: 'girl', name: 'Cashier', look: pick(LOOKS.girl), at: [125.3, 102.6] });
gasClerk.script([{ x: 125.3, z: 102.6, face: -Math.PI / 2, tag: 'Cashier ⛽', until: () => false }], () => {});

/* ================= POOL HALL BOTS ================= */
const hall = { seeded: false, next: 4, bots: [] };
const hallDoor = doors.find(d => Math.abs(d.pos.x + 176) < 0.3 && Math.abs(d.pos.z - 84) < 0.3);
function spawnPoolBot(T, spot, seed) {
  const kind = Math.random() < 0.5 ? 'girl' : 'boy', look = pick(LOOKS[kind]), name = pick(NAMES[kind]);
  spot.taken = true;
  const c = createCharacter({ ...common, kind, name, look, at: seed ? [spot.x, spot.z] : [-150, 84] });
  c.pool = true; hall.bots.push(c);
  let end = 0, st = 'wait', t = 0, hit = false;
  const me = c;
  let wps = [], me2 = null;
  const anim = dt => {
    t += dt;
    if (st === 'wait') {
      c.play(0.3, 0); c.setFace(null);
      if (performance.now() >= end && !T.shooter && !T.moving) {                      // time to leave: walk back to our spot around the table
        const pp = c.getPose(); wps = T.ringPath(pp.x - T.cx, pp.z - T.cz, spot.x - T.cx, spot.z - T.cz).slice(1); wps.push([spot.x - T.cx, spot.z - T.cz]); st = 'back'; return;
      }
      const turn = !T.shooter && !T.moving && performance.now() < end && (T.last !== me || T.bots.length < 2);
      if (turn) {
        const sh = T.plan();
        if (sh) {
          T.shooter = me; T.pending = true;
          const pp = c.getPose ? c.getPose() : null, px = (pp ? pp.x : spot.x) - T.cx, pz = (pp ? pp.z : spot.z) - T.cz;
          wps = T.ringPath(px, pz, sh.sx, sh.sz).slice(1); st = 'walk'; t = 0;
        }
      }
    } else if (st === 'walk') {
      c.play(0.3, 0);
      if (!c.walking()) { const w = wps.shift(); if (w) c.walkTo(T.cx + w[0], T.cz + w[1]); else { c.setFace(T.shot.face); st = 'turn'; t = 0; } }
    } else if (st === 'back') {
      c.play(0.3, 0); if (!c.walking()) { const w = wps.shift(); if (w) c.walkTo(T.cx + w[0], T.cz + w[1]); else { c.setFace(null); st = 'done'; } }
    } else if (st === 'turn') {
      c.play(0.3, 0); if (t > 0.5) { st = 'aim'; t = 0; hit = false; }
    } else if (st === 'aim') {
      const e = Math.min(1, t / 0.8); c.play(0.3 + 0.7 * e, Math.sin(t * 2.2) * 0.3 - 0.2);
      if (t > 2.2) { st = 'stroke'; t = 0; }
    } else if (st === 'stroke') {
      const k = Math.min(1, t / 0.3); c.play(1, -1 + 2 * k);
      if (k >= 1 && !hit) { hit = true; T.shoot(); }
      if (t > 0.7) { st = 'rest'; t = 0; }
    } else if (st === 'rest') {
      c.play(Math.max(0.3, 1 - t), 1);
      if (t > 0.8 && !T.moving) { T.shooter = null; T.last = me; st = 'wait'; t = 0; }
    }
  };
  const sz = spot.z, tz = T.cz;
  const pts = [];
  if (!seed) pts.push({ x: -166, z: 84 }, { x: -179, z: 84, door: hallDoor }, { x: -185, z: 84 });
  if (!seed) pts.push({ x: -185, z: sz });
  pts.push({ x: spot.x, z: spot.z, face: spot.face, tag: 'Playing pool 🎱',
    arrive: () => { c.setTool(true); T.bots.push(c); end = performance.now() + (30 + Math.random() * 25) * 1000; },
    anim, until: () => performance.now() > end && !T.moving && T.shooter !== me && st === 'done',
    after: () => { c.setFace(null); c.setTool(false); T.bots.splice(T.bots.indexOf(c), 1); if (T.shooter === me) T.shooter = null; if (T.last === me) T.last = null; spot.taken = false; } },
    { x: -185, z: sz }, { x: -185, z: 84 }, { x: -166, z: 84, door: hallDoor }, { x: -150, z: 84 });
  c.script(pts, () => { c.dispose(); hall.bots.splice(hall.bots.indexOf(c), 1); });
}
/* ---- hall guests (sit at the lounge tables / bar stools) + bartender ---- */
hall.crowd = []; hall.gnext = 3; hall.bartender = null;
const loungeSeats = [], barSeats = [];
[-180, -178].forEach(x => { sitSpot(x, 87.6, 0, Math.PI, x, 86.6, null); loungeSeats.push(spots[spots.length - 1]); sitSpot(x, 89.2, 0, 0, x, 90.2, null); loungeSeats.push(spots[spots.length - 1]); });
[-183.5, -182, -180.5, -179].forEach(x => { sitSpot(x, 78.7, 0.25, 0, x, 79.9, null); barSeats.push(spots[spots.length - 1]); });
function makePlate() {
  const p = new THREE.Group();
  const d = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.012, 14), new THREE.MeshStandardMaterial({ color: 0xf5f5f0, roughness: 0.5 }));
  const f = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 6), new THREE.MeshStandardMaterial({ color: pick([0xf2e9c9, 0xc97b3c, 0x8bbf5a]), roughness: 0.8 })); f.scale.y = 0.6; f.position.y = 0.015;
  p.add(d, f); return p;
}
function spawnHallGuest(seat, bar, seed) {
  const kind = Math.random() < 0.5 ? 'girl' : 'boy', look = pick(LOOKS[kind]), name = pick(NAMES[kind]);
  seat.taken = name;
  const c = createCharacter({ ...common, kind, name, look, at: seed ? [seat.ex, seat.ez] : [-150, 84] });
  hall.crowd.push(c);
  const stay = 25 + Math.random() * 30, tag = bar ? 'Eating 🍽' : 'Chilling 🥤';
  const pts = [];
  if (!seed) pts.push({ x: -166, z: 84 }, { x: -179, z: 84, door: hallDoor });
  pts.push({ x: seat.ex, z: seat.ez, sit: seat, dur: stay, tag, arrive: () => { if (bar) c.setHold(makePlate()); else c.setCup(true); } },
    { x: -179, z: 84 }, { x: -166, z: 84, door: hallDoor }, { x: -150, z: 84 });
  c.script(pts, () => { seat.taken = null; c.dispose(); hall.crowd.splice(hall.crowd.indexOf(c), 1); });
}
function spawnBartender() {
  const c = createCharacter({ ...common, kind: 'girl', name: 'Bar', look: pick(LOOKS.girl), at: [-181, 76.75] });
  hall.bartender = c; hall.crowd.push(c);
  let t = 0, nx = 4;
  c.script([{ x: -181, z: 76.75, face: 0, tag: 'Bartender 🍹', until: () => false, anim: dt => {
    t += dt; c.setFace(0);
    if (!c.walking() && t > nx) { t = 0; nx = 4 + Math.random() * 6; c.walkTo(-183 + Math.random() * 4, 76.75); }
  } }], () => {});
}
/* ---- car & moto shop: buy a vehicle (Buy -> Car/Moto -> pick -> confirm) ---- */
const CATALOG = {
  car: [{ name: 'ឡានខៀវ', col: 0x1d6fb8, price: 12000 }, { name: 'ឡានលឿង', col: 0xe9c46a, price: 15000 }, { name: 'ឡានបៃតង', col: 0x2a9d8f, price: 18000 }, { name: 'ឡានក្រហម', col: 0xb02a2a, price: 22000 }],
  bike: [{ name: 'ម៉ូតូក្រហម', col: 0xc0392b, price: 6000 }, { name: 'ម៉ូតូខៀវ', col: 0x2563eb, price: 7000 }, { name: 'ម៉ូតូបៃតង', col: 0x2f9e44, price: 8000 }, { name: 'ម៉ូតូទឹកក្រូច', col: 0xf08c00, price: 10000 }],
};
const CAR_SLOTS = [[15.6, 4.6], [20.4, 4.6], [15.6, 9.8], [20.4, 9.8], [15.6, 17.6], [20.4, 17.6]];      // neat rows in the home parking lot (between the painted lines)
const BIKE_SLOTS = [[14.2, 13.2], [15.8, 13.2], [17.4, 13.2], [19.0, 13.2], [20.6, 13.2], [22.2, 13.2]];
function addVeh(kind, col, n) {   // a bought vehicle (n = how many of this kind we already have -> its parking spot)
  const slots = kind === 'car' ? CAR_SLOTS : BIKE_SLOTS, s = slots[n % slots.length];
  const v = { ...(kind === 'car' ? buildCarModel(col) : buildBikeModel(col)), x: s[0], z: s[1], h: 0, v: 0, steer: 0, spin: 0, ...(kind === 'car' ? CAR_CFG : BIKE_CFG), slot: s, active: true, key: fleet.length };
  fleet.push(v); return v;
}
if (!save.fleet) { save.fleet = []; if (save.carB != null) save.fleet.push({ kind: 'car', col: save.carB }); if (save.bikeB != null) save.fleet.push({ kind: 'bike', col: save.bikeB }); }
save.fleet.forEach(f => addVeh(f.kind, f.col, fleet.filter(v => !!v.bike === (f.kind === 'bike')).length));     // vehicles bought earlier
// every time the game starts, ALL our vehicles (the originals and every one we bought) line up in the parking lot, wherever we left them
{ let ci = 0, bi = 0; fleet.forEach(v => { const s = v.bike ? BIKE_SLOTS[bi++ % BIKE_SLOTS.length] : CAR_SLOTS[ci++ % CAR_SLOTS.length]; v.slot = s; Object.assign(v, { x: s[0], z: s[1], h: 0, v: 0, steer: 0 }); }); }
{ let sf = null; try { sf = JSON.parse(localStorage.getItem(FUEL_KEY) || 'null'); } catch (e) {} if (!Array.isArray(sf)) sf = save.fuel;
  if (Array.isArray(sf)) fleet.forEach((v, i) => { if (typeof sf[i] === 'number') v.fuel = Math.max(0, Math.min(1, sf[i])); }); }   // saved fuel levels
function deliver(kind, col) {   // the new vehicle appears at the shop; the one we rode there goes back home
  const same = fleet.filter(v => !!v.bike === (kind === 'bike'));
  const oldV = same.reduce((b, v) => Math.hypot(P.x - v.x, P.z - v.z) < Math.hypot(P.x - b.x, P.z - b.z) ? v : b, same[0]);
  const newV = addVeh(kind, col, same.length);
  save.fleet.push({ kind, col });
  Object.assign(newV, { x: -142.2, z: kind === 'car' ? -57 : -66.5, h: 0, v: 0, steer: 0 });
  Object.assign(oldV, { x: oldV.slot[0], z: oldV.slot[1], h: 0, v: 0, steer: 0 });
  return newV;
}
const canBuy = () => !driving && !seat && !hug && Math.abs(P.y) < 1 && P.x > -147.4 && P.x < -144.4 && Math.abs(P.z + 55.2) < 1.9;   // in front of the sales desk
let buyOpen = false;
const buyBtn = document.createElement('button'); buyBtn.id = 'buyBtn'; document.body.appendChild(buyBtn);
const buyPanel = document.createElement('div'); buyPanel.id = 'buyPanel'; document.body.appendChild(buyPanel);
const hex = c => '#' + c.toString(16).padStart(6, '0');
const svgCar = c => `<svg viewBox="0 0 120 56"><rect x="6" y="24" width="108" height="20" rx="7" fill="${hex(c)}"/><path d="M28 24 L40 8 H82 L96 24Z" fill="${hex(c)}"/><path d="M36 24 L44 12 H60 V24Z M64 24 V12 H80 L90 24Z" fill="#9fd0ff"/><circle cx="30" cy="44" r="9" fill="#222"/><circle cx="90" cy="44" r="9" fill="#222"/><circle cx="30" cy="44" r="3.5" fill="#ccc"/><circle cx="90" cy="44" r="3.5" fill="#ccc"/></svg>`;
const svgBike = c => `<svg viewBox="0 0 120 56"><circle cx="24" cy="40" r="12" fill="none" stroke="#222" stroke-width="5"/><circle cx="96" cy="40" r="12" fill="none" stroke="#222" stroke-width="5"/><path d="M24 40 L48 40 L60 22 L84 22 L96 40" fill="none" stroke="${hex(c)}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><rect x="36" y="14" width="30" height="8" rx="4" fill="#111"/><path d="M88 22 L84 8 H98" fill="none" stroke="#222" stroke-width="4" stroke-linecap="round"/></svg>`;
function buyView(step, kind, item) {
  const x = '<button class="bx" data-a="close">✕</button>';
  if (step === 'type') buyPanel.innerHTML = `<div class="bcard">${x}<h2>🛒 ទិញ</h2><p>លុយរបស់អ្នក៖ ${fmt(save.money)}</p><div class="brow"><button class="bbig" data-a="kind" data-k="car">🚗<br>ឡាន</button><button class="bbig" data-a="kind" data-k="bike">🏍<br>ម៉ូតូ</button></div></div>`;
  else if (step === 'list') buyPanel.innerHTML = `<div class="bcard">${x}<h2>${kind === 'car' ? '🚗 ឡាន' : '🏍 ម៉ូតូ'}</h2><p>លុយរបស់អ្នក៖ ${fmt(save.money)}</p><div class="bgrid">${CATALOG[kind].map((it, i) => `<button class="bitem" data-a="pick" data-k="${kind}" data-i="${i}">${kind === 'car' ? svgCar(it.col) : svgBike(it.col)}<b>${it.name}</b><span>${fmt(it.price)}</span></button>`).join('')}</div><button class="bback" data-a="type">← ត្រឡប់ក្រោយ</button></div>`;
  else if (step === 'confirm') buyPanel.innerHTML = `<div class="bcard">${x}<h2>បញ្ជាក់ការទិញ</h2><div class="bpre">${kind === 'car' ? svgCar(item.col) : svgBike(item.col)}</div><p>ទិញ <b>${item.name}</b> ក្នុងតម្លៃ <b>${fmt(item.price)}</b> មែនទេ?</p><p class="bsmall">លុយនៅសល់ក្រោយទិញ៖ ${fmt(Math.max(0, save.money - item.price))}</p><div class="brow"><button class="byes" data-a="yes" data-k="${kind}" data-i="${CATALOG[kind].indexOf(item)}">✔ យល់ព្រម</button><button class="bno" data-a="list" data-k="${kind}">✖ បោះបង់</button></div></div>`;
}
function openBuy() { if (buyOpen || !canBuy()) return; buyOpen = true; running = false; if (!mobile) controls.unlock(); buyView('type'); buyPanel.classList.add('show'); }
function closeBuy() { if (!buyOpen) return; buyOpen = false; buyPanel.classList.remove('show'); if (mobile) running = true; else controls.lock(); }
function doBuy(kind, i) {
  const it = CATALOG[kind][i];
  if (save.money < it.price) { toast('លុយមិនគ្រប់ទេ 💸'); buyView('list', kind); return; }
  save.money -= it.price; deliver(kind, it.col);
  saveGame(); updateMoney(true); closeBuy(); toast('ទិញ ' + it.name + ' បានជោគជ័យ 🎉 (នៅមុខហាង · យានចាស់ត្រឡប់ទៅផ្ទះ)');
}
buyPanel.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return; const a = b.dataset.a, k = b.dataset.k, i = +b.dataset.i;
  if (a === 'close') closeBuy(); else if (a === 'kind' || a === 'list') buyView('list', k);
  else if (a === 'type') buyView('type'); else if (a === 'pick') buyView('confirm', k, CATALOG[k][i]); else if (a === 'yes') doBuy(k, i);
});
buyBtn.onclick = e => { openBuy(); e.currentTarget.blur(); };
addEventListener('keydown', e => { if (e.target && e.target.tagName === 'INPUT') return; if (e.code === 'KeyB' && running) openBuy(); });
addEventListener('keydown', e => { if (e.target && e.target.tagName === 'INPUT') return; if (e.code === 'KeyP') { if (phoneOpen) closePhone(); else if (running) openPhone(); } });

/* ================= SMARTPHONE (Messenger + Camera) ================= */
const phoneBtn = document.createElement('button'); phoneBtn.id = 'phoneBtn'; phoneBtn.textContent = '📱'; document.body.appendChild(phoneBtn);
const phoneEl = document.createElement('div'); phoneEl.id = 'phone'; document.body.appendChild(phoneEl);
const flashEl = document.createElement('div'); flashEl.id = 'camFlash'; document.body.appendChild(flashEl);
let phoneOpen = false, phoneApp = 'home', phoneChar = null, chatWith = null, photoView = -1;
const photos = [], chats = {};
const REPLIES = {
  friend: ['សួស្តី! 😊', 'ខ្ញុំនៅផ្ទះ ចង់ទៅណាទេ?', 'ពេលនេះឃ្លានបាយហើយ 🍚', 'ទៅលេងកាហ្វេទេ? ☕', 'អូខេ! ខ្ញុំមកភ្លាម 👍', 'ហាហា ត្រូវហើយ 😂', 'ទៅលេងប៊ីយ៉ាទេ? 🎱'],
  coffee: ['សូមស្វាគមន៍មកកាន់ហាងកាហ្វេ! ☕', 'ហាងយើងបើកគ្រប់ថ្ងៃ មានកាហ្វេ តែ និងភេសជ្ជៈ', 'អរគុណសម្រាប់ការទំនាក់ទំនង 🙏'],
  pool: ['8 Ball Pool បើកទទួលភ្ញៀវ 🎱', 'មានតុ ៣ និងបារភេសជ្ជៈ', 'មកលេងជាមួយមិត្តភក្តិបានណា!'],
  car: ['ហាងលក់ឡាន និងម៉ូតូ 🚗🏍', 'មានឡាន ៤ពណ៌ និងម៉ូតូ ៤ពណ៌ ជួបអ្នកលក់នៅហាងបាន', 'សូមអរគុណ!'],
};
const isGirl = () => other.name === 'Ny Ny';                       // the AI contact is the girl -> player (boy) calls himself បង, her អូន; reversed otherwise
const SELF = () => isGirl() ? 'អូន' : 'បង', YOU = () => isGirl() ? 'បង' : 'អូន';
const quick = () => [{ t: 'ជិះយានជំនិះមកយក' + YOU() + 'ផង', act: 'ride' }, { t: 'ដាំបាយនិងស្លផង' + SELF(), act: 'cook' }];
const contacts = () => [{ id: 'friend', name: other.name, icon: '🧑', type: 'friend' }];   // the only contact is the other character
const hhmm = () => { const d = new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function phoneView() {
  const bar = `<div class="pbar"><span>${hhmm()}</span><span>📶 🔋</span></div>`;
  let body = '';
  if (phoneApp === 'home') body = `<div class="phome">${bar}<div class="pclock">${hhmm()}</div><div class="papps"><button class="papp" data-a="app" data-k="msg"><i class="ic msg">💬</i><span>Messenger</span></button><button class="papp" data-a="app" data-k="cam"><i class="ic cam">📷</i><span>Camera</span></button></div><button class="pexit" data-a="close">⌂ បិទ</button></div>`;
  else if (phoneApp === 'msg' && !chatWith) body = `<div class="pscr">${bar}<div class="phead"><button data-a="home">‹</button><b>Messenger</b></div><div class="plist">${contacts().map(c => `<button class="pcon" data-a="chat" data-k="${c.id}">${avImg(c.name)}<div><b>${esc(c.name)}</b><small>${esc((chats[c.id] || []).slice(-1)[0]?.t || 'ចុចដើម្បីផ្ញើសារ')}</small></div></button>`).join('')}</div></div>`;
  else if (phoneApp === 'msg') { const c = contacts().find(x => x.id === chatWith); const log = chats[chatWith] || [];
    body = `<div class="pscr">${bar}<div class="phead"><button data-a="msg">‹</button><span class="pht">${avImg(c.name, "sm")}<b>${esc(c.name)}</b></span></div><div class="pchat" id="pchat">${log.map(m => `<div class="pmsg ${m.me ? 'me' : 'them'}">${esc(m.t)}</div>`).join('') || '<div class="pempty">ចាប់ផ្ដើមសន្ទនា 👋</div>'}</div>${chatWith === 'friend' ? `<div class="pquick">${quick().map((q, i) => `<button data-a="quick" data-i="${i}">${q.t}</button>`).join('')}</div>` : `<form class="pform" id="pform"><input id="pinput" autocomplete="off" placeholder="សរសេរសារ..." maxlength="80"><button type="submit">➤</button></form>`}</div>`; }
  else if (phoneApp === 'cam' && photoView < 0) body = `<div class="pcam">${bar.replace('class="pbar"', 'class="pbar dark"')}<div class="pgrid"></div><div class="pcbar"><button class="pthumb" data-a="gallery">${photos.length ? `<img src="${photos[photos.length - 1]}">` : '🖼'}</button><button class="pshut" data-a="shot"></button><button class="pflip" data-a="flip">🔄</button></div><button class="pback" data-a="home">‹</button></div>`;
  else if (phoneApp === 'cam') body = photoView >= 1000 ? `<div class="pscr">${bar}<div class="phead"><button data-a="cam">‹</button><b>រូបថត (${photos.length})</b></div><div class="pgal">${photos.map((p, i) => `<img data-a="photo" data-i="${i}" src="${p}">`).join('') || '<div class="pempty">មិនទាន់មានរូបទេ</div>'}</div></div>` : `<div class="pscr">${bar}<div class="phead"><button data-a="gallery">‹</button><b>រូបថត</b></div><img class="pbig" src="${photos[photoView]}"><div class="pacts"><a download="villa-photo-${photoView + 1}.jpg" href="${photos[photoView]}">⬇ រក្សាទុក</a><button data-a="del" data-i="${photoView}">🗑 លុប</button></div></div>`;
  phoneEl.className = 'show' + (phoneApp === 'cam' && photoView < 0 ? ' camMode' : ''); phoneEl.innerHTML = body;
  const ch = $('pchat'); if (ch) ch.scrollTop = ch.scrollHeight;
}
function openPhone() {
  if (phoneOpen) return; phoneOpen = true; phoneApp = 'home'; chatWith = null; photoView = -1; phoneChar = me; me.setPhone(true);
  if (!mobile && controls.isLocked) { phoneOpen = 'unlocked'; controls.unlock(); }
  phoneView(); phoneBtn.classList.add('on');
}
function closePhone() {
  if (!phoneOpen) return; const was = phoneOpen; phoneOpen = false; phoneEl.className = ''; phoneEl.innerHTML = ''; phoneBtn.classList.remove('on');
  if (phoneChar) phoneChar.setPhone(false); phoneChar = null;
  if (was === 'unlocked') controls.lock();
}
function takePhoto() {
  renderer.render(scene, camera);
  try { const u = renderer.domElement.toDataURL('image/jpeg', 0.85); photos.push(u); if (photos.length > 12) photos.shift(); } catch (e) { toast('ថតមិនបាន'); return; }
  flashEl.classList.add('go'); setTimeout(() => flashEl.classList.remove('go'), 220); toast('📸 បានថតរូប');
  const t = phoneEl.querySelector('.pthumb'); if (t) t.innerHTML = `<img src="${photos[photos.length - 1]}">`;
}
phoneEl.addEventListener('click', e => {
  const b = e.target.closest('[data-a]'); if (!b) return; const a = b.dataset.a;
  if (a === 'close') closePhone();
  else if (a === 'home') { phoneApp = 'home'; chatWith = null; photoView = -1; phoneView(); }
  else if (a === 'app') { phoneApp = b.dataset.k; chatWith = null; photoView = -1; phoneView(); }
  else if (a === 'msg') { phoneApp = 'msg'; chatWith = null; phoneView(); }
  else if (a === 'chat') { chatWith = b.dataset.k; phoneView(); const i = $('pinput'); if (i && !mobile) i.focus(); }
  else if (a === 'shot') takePhoto();
  else if (a === 'flip') setMode(camMode === 'fps' ? 'tps' : 'fps');
  else if (a === 'quick') { const q = quick()[+b.dataset.i]; const r = q.act === 'ride' ? nyRide() : nyCook(); sendChat(q.t, r); }
  else if (a === 'gallery') { photoView = 1000; phoneView(); }
  else if (a === 'cam') { photoView = -1; phoneView(); }
  else if (a === 'photo') { photoView = +b.dataset.i; phoneView(); }
  else if (a === 'del') { photos.splice(+b.dataset.i, 1); photoView = 1000; phoneView(); }
});
function sendChat(t, reply) {   // send a message; the contact answers a moment later (reply = fixed answer, otherwise a random canned one)
  const id = chatWith, c = contacts().find(x => x.id === id); if (!c) return; (chats[id] = chats[id] || []).push({ me: true, t }); phoneView();
  setTimeout(() => { (chats[id] = chats[id] || []).push({ me: false, t: reply || pick(REPLIES[c.type]) }); if (phoneOpen && phoneApp === 'msg' && chatWith === id) { phoneView(); const i = $('pinput'); if (i && !mobile) i.focus(); } }, 900 + Math.random() * 1200);
}
phoneEl.addEventListener('submit', e => {
  e.preventDefault(); const inp = $('pinput'), t = inp.value.trim(); if (!t || !chatWith) return;
  sendChat(t); const i2 = $('pinput'); if (i2 && !mobile) i2.focus();
});
/* ---- Ny Ny does what the quick messages ask ---- */
let aiTask = null;
function cancelAiDrive() { if (aiTask) { aiTask.v.ai = null; aiTask = null; } }
function nyCook() {   // cooks rice AND soup: walk to the stove, start whatever is idle
  const rice = pots.find(x => x.name === 'rice'), soup = pots.find(x => x.name === 'soup');
  if (other.mode() === 'ride' || other.mode() === 'work') return 'ខ្ញុំកំពុងជាប់រវល់ មិនទាន់បានទេ 😅';
  const idle = pots.filter(p => p.state === 'idle');
  if (!idle.length) return pots.some(p => p.state === 'cooking') ? 'បាយនិងស្លកំពុងឆ្អិនហើយ រង់ចាំបន្តិចណា 🍚🍲' : 'បាយនិងស្លឆ្អិនហើយ មកដួសបានហើយ' + YOU() + ' 🍚🍲';
  const start = p => { if (p.state === 'idle') { p.state = 'cooking'; p.t = p.secs; toast(p.emoji + ' ' + other.name + ' ចាប់ផ្ដើមដាំ' + (p.name === 'rice' ? 'បាយ' : 'ស្ល') + ' (' + p.secs + ' វិនាទី)'); } };
  const zMid = idle.reduce((t, p) => t + p.z, 0) / idle.length;   // stand between the pots and start every idle one at once
  const ok = other.goTo(-8.5, zMid, () => idle.forEach(start), 'Cooking 🍚🍲', -Math.PI / 2);
  if (!ok) return SELF() + 'មិនទាន់បានទេ 😅';
  return 'បាទ! ' + SELF() + 'ទៅដាំបាយនិងស្លឥឡូវនេះ 🍚🍲';
}
function nyRide() {
  if (driving) return YOU() + 'កំពុងជិះយានជំនិះនៅឡើយ មិនបាច់ទេ 😄';
  if (other.mode() === 'ride') return SELF() + 'ជិះជាមួយ' + YOU() + 'ហើយណា 🚗';
  if (other.mode() === 'work') return SELF() + 'កំពុងលក់ហាង មិនទាន់បានទេ 😅';
  if (aiTask) return SELF() + 'កំពុងមកហើយ ចាំបន្តិច 🚗';
  const op = other.getPose();
  const vs = fleet.filter(v => Math.hypot(v.x - op.x, v.z - op.z) < 45 && !(driving && dv === v));
  if (!vs.length) return 'យានជំនិះនៅឆ្ងាយពេក ' + SELF() + 'មកមិនបានទេ 😢';
  const v = vs.reduce((b, x) => Math.hypot(x.x - op.x, x.z - op.z) < Math.hypot(b.x - op.x, b.z - op.z) ? x : b);
  const ok = other.goTo(v.x - (v.bike ? 0.9 : 1.6), v.z, () => {
    if (!other.boardDrive(v)) return;
    aiTask = { v, t: 0, stuck: 0, rev: 0, best: 9999, bt: 0, way: (v.x > 5 && v.z < 21) ? [[18, 17.5], [9.5, 18.5], [3, 22]] : [] };
    toast('🚗 ' + other.name + ' កំពុងជិះមកយកអ្នក');
  }, 'Getting the ' + (v.bike ? 'motorbike 🏍' : 'car 🚗'), 0);
  return ok ? 'បាទ ចាំបន្តិចណា ' + SELF() + 'ជិះមកយក' + YOU() + 'ភ្លាម ' + (v.bike ? '🏍' : '🚗') : SELF() + 'មិនទាន់បានទេ 😅';
}
function aiDriveStep(dt) {
  if (!aiTask) return; const T = aiTask, v = T.v; T.t += dt;
  if (other.mode() !== 'ride' || driving || T.t > 150) { if (other.mode() === 'ride') other.alight(); cancelAiDrive(); return; }
  let tx = P.x, tz = P.z; const homeZone = P.z < 17 && P.x < 12;   // the goal is always where the player is standing right now
  if (T.way.length) { [tx, tz] = T.way[0]; if (Math.hypot(tx - v.x, tz - v.z) < 5.5) T.way.shift(); }
  else if (homeZone) { tx = 3; tz = 19; }
  const dx = tx - v.x, dz = tz - v.z, d = Math.hypot(dx, dz), final = !T.way.length;
  if (final && d < (homeZone ? 3 : 7)) { v.ai = { f: 0, s: 0, brake: true }; if (Math.abs(v.v) < 1) { other.alight(); toast('✅ ' + other.name + ' មកដល់ហើយ'); cancelAiDrive(); } return; }
  let diff = Math.atan2(dx, dz) - v.h; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
  // speed follows distance and how well the nose points at the goal (no more wide circles around it)
  const vt = Math.min(v.maxF, d * 1.1 + 2) * (1 - 0.8 * Math.min(1, Math.abs(diff) / 1.1));
  let f = Math.max(-1, Math.min(1, (vt - v.v) * 0.8)), s = Math.max(-1, Math.min(1, -diff * 3));
  let brake = v.v - vt > 5;
  // not getting closer for a while (circling / blocked): back up and swing the nose round
  if (d < T.best - 2.5) { T.best = d; T.bt = 0; } else { T.bt = (T.bt || 0) + dt; }
  if (T.bt > 5 && T.rev <= 0) { T.rev = 1.6; T.bt = 0; T.best = d + 1; }
  if (T.rev > 0) { T.rev -= dt; f = -0.8; s = -s; brake = false; }                  // back out when stuck against something
  else if (Math.abs(v.v) < 0.35 && vt > 1) { T.stuck += dt; if (T.stuck > 1.2) { T.stuck = 0; T.rev = 1.3; } } else T.stuck = 0;
  v.ai = { f, s, brake };
}
phoneBtn.onclick = e => { phoneOpen ? closePhone() : openPhone(); e.currentTarget.blur(); };
setInterval(() => { if (phoneOpen && (phoneApp === 'home')) { const c = phoneEl.querySelector('.pclock'); if (c) c.textContent = hhmm(); } }, 5000);

/* ---- car & moto shop: salesperson + browsing customers ---- */
const shw = { bots: [], next: 4, sales: null, door: doors.find(d => Math.abs(d.pos.x + 144) < 0.3 && Math.abs(d.pos.z + 62) < 0.3) };
function spawnSales() {
  const c = createCharacter({ ...common, kind: 'boy', name: 'Seller', look: pick(LOOKS.boy), at: [-149.2, -55.2] });
  shw.sales = c; shw.bots.push(c);
  c.script([{ x: -149.2, z: -55.2, face: Math.PI / 2, tag: 'Salesperson 🚗', until: () => false }], () => {});
}
function spawnBuyer() {
  const kind = Math.random() < 0.5 ? 'girl' : 'boy', look = pick(LOOKS[kind]), name = pick(NAMES[kind]);
  const c = createCharacter({ ...common, kind, name, look, at: [-136, -38] });
  shw.bots.push(c);
  const spots = [[-151.5, -58.5, -Math.PI / 2, 'Looking at cars 🚗'], [-151.5, -65, -Math.PI / 2, 'Looking at cars 🚗'], [-146.5, -68.2, -Math.PI / 2, 'Looking at motorbikes 🏍'], [-146.5, -63.8, -Math.PI / 2, 'Looking at motorbikes 🏍']];
  const pts = [{ x: -139, z: -62 }, { x: -146, z: -62, door: shw.door }];
  const a = pick(spots), b = pick(spots);
  pts.push({ x: a[0], z: a[1], face: a[2], wait: 4 + Math.random() * 5, tag: a[3] });
  if (b !== a) pts.push({ x: b[0], z: b[1], face: b[2], wait: 4 + Math.random() * 5, tag: b[3] });
  pts.push({ x: -146, z: -62 }, { x: -141.5, z: -62, door: shw.door }, { x: -136, z: -62 }, { x: -136, z: -40 });
  c.script(pts, () => { c.dispose(); shw.bots.splice(shw.bots.indexOf(c), 1); });
}
function shopRoomStep(dt) {
  shw.bots.forEach(c => c.update(dt));
  if (Math.hypot(P.x + 150, P.z + 62) > 150) return;
  if (!shw.sales) spawnSales();
  shw.next -= dt;
  if (shw.next <= 0) { shw.next = 12 + Math.random() * 10; if (shw.bots.length < 4) spawnBuyer(); }
}
function poolStep(dt) {
  shopRoomStep(dt);
  gasClerk.update(dt);
  POOLS.forEach(T => T.step(dt));
  hall.bots.forEach(c => c.update(dt)); hall.crowd.forEach(c => c.update(dt));
  if (Math.hypot(P.x + 185, P.z - 84) > 150) return;
  if (!hall.bartender) { spawnBartender(); const l = pick(loungeSeats), b = pick(barSeats); spawnHallGuest(l, false, true); spawnHallGuest(b, true, true); }
  hall.gnext -= dt;
  if (hall.gnext <= 0) {
    hall.gnext = 9 + Math.random() * 9;
    if (hall.crowd.length < 6) {
      const bar = Math.random() < 0.5, free = (bar ? barSeats : loungeSeats).filter(s => !s.taken), other = (bar ? loungeSeats : barSeats).filter(s => !s.taken), pl = free.length ? free : other;
      if (pl.length) { const s = pick(pl); spawnHallGuest(s, barSeats.includes(s), false); }
    }
  }
  if (!hall.seeded) { hall.seeded = true; const T = POOLS[1]; T.spots.forEach(sp => spawnPoolBot(T, sp, true)); }
  hall.next -= dt;
  if (hall.next <= 0 && hall.bots.length < 5) {
    hall.next = 6 + Math.random() * 7;
    const free = []; POOLS.forEach(T => T.spots.forEach(sp => { if (!sp.taken) free.push([T, sp]); }));
    if (free.length) { const [T, sp] = pick(free); spawnPoolBot(T, sp, false); }
  }
}

/* ================= COOKING (rice pot + soup pot on the kitchen stove) ================= */
box(-9.5, 0.95, -2.6, 0.7, 0.03, 2.0, M(0xb8bec4, 0.3, 0.8), false);                  // cooktop plate on the counter
function makePot(name, z, color, metal, emoji, secs, doneMsg) {
  const burner = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.015, 8, 24), new THREE.MeshStandardMaterial({ color: 0x331100, emissive: 0xff3300, emissiveIntensity: 0 }));
  burner.rotation.x = Math.PI / 2; burner.position.set(-9.5, 0.99, z); scene.add(burner);
  const g = new THREE.Group(); g.position.set(-9.5, 0.985, z); scene.add(g);
  const pm = new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: metal });
  const add = (geo, m, x, y, zz) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, zz); o.castShadow = true; g.add(o); return o; };
  add(new THREE.CylinderGeometry(0.2, 0.19, 0.22, 20), pm, 0, 0.11, 0);                  // pot
  const lid = add(new THREE.CylinderGeometry(0.205, 0.205, 0.02, 20), pm, 0, 0.23, 0);   // lid
  add(new THREE.SphereGeometry(0.03, 8, 6), DARK, 0, 0.26, 0);
  add(new THREE.BoxGeometry(0.1, 0.03, 0.05), DARK, 0.25, 0.16, 0); add(new THREE.BoxGeometry(0.1, 0.03, 0.05), DARK, -0.25, 0.16, 0);
  const steam = [];
  for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false })); m.visible = false; scene.add(m); steam.push(m); }
  const c = document.createElement('canvas'); c.width = 256; c.height = 80;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true })); label.scale.set(0.9, 0.28, 1); label.position.set(-9.15, 1.5, z); label.visible = false; scene.add(label);
  return { name, z, emoji, secs, doneMsg, state: 'idle', t: 0, lid, steam, burner, label, c, tex, shown: '' };
}
const pots = [makePot('rice', -3.2, 0xcfd3d8, 0.6, '🍚', 20, 'ដួសបាយរួចរាល់ 🍚'), makePot('soup', -2.0, 0xb03a2e, 0.1, '🍲', 30, 'ដួសស្លរួចរាល់ 🍲')];
const potWord = p => p.name === 'rice' ? 'បាយ' : 'ស្ល';
function drawLabel(p, text, bg) {
  if (p.shown === text) return; p.shown = text;
  const x = p.c.getContext('2d'); x.clearRect(0, 0, 256, 80); x.fillStyle = bg; x.beginPath(); x.roundRect(4, 4, 248, 72, 18); x.fill();
  x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = 'bold 34px system-ui, sans-serif'; x.fillText(text, 128, 42); p.tex.needsUpdate = true;
}
let actx = null;
function beep() { // short "ding" when the food is ready
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const o = actx.createOscillator(), g = actx.createGain(); o.frequency.value = 880; o.connect(g); g.connect(actx.destination);
    g.gain.setValueAtTime(0.12, actx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.5); o.start(); o.stop(actx.currentTime + 0.5);
  } catch (e) { /* audio not available */ }
}
function cookStep(dt) {
  const now = performance.now();
  for (const p of pots) {
    if (p.state === 'cooking') {
      p.t -= dt;
      if (p.t <= 0) { p.state = 'done'; p.t = 0; p.left = 2; beep(); toast(p.emoji + ' ' + potWord(p) + 'ឆ្អិនហើយ!'); }
      else drawLabel(p, p.emoji + ' ' + Math.ceil(p.t) + ' វិនាទី', '#7a2e0e');
    }
    if (p.state === 'done') drawLabel(p, p.emoji + ' ឆ្អិនហើយ ✅ ×' + p.left, '#14532d');
    if (p.state === 'idle') p.shown = '';
    p.label.visible = p.state !== 'idle';
    const cook = p.state === 'cooking';
    p.burner.material.emissiveIntensity = cook ? 1.6 : 0;
    p.lid.position.y = 0.23 + (cook ? Math.abs(Math.sin(now / 90)) * 0.012 : 0);          // the lid rattles
    p.steam.forEach((m, i) => {
      m.visible = cook; if (!cook) return;
      const f = ((now / 1600) + i / 5) % 1;
      m.position.set(-9.5 + Math.sin(i * 2 + f * 3) * 0.05, 1.25 + f * 0.5, p.z + Math.cos(i * 3) * 0.05);
      m.material.opacity = 0.4 * (1 - f); m.scale.setScalar(0.6 + f * 1.2);
    });
  }
}
const nearPot = () => {
  if (driving || seat || hug || swimming || Math.abs(P.y) > 1) return null;
  let best = null, bd = 2.0;
  for (const p of pots) { const d = Math.hypot(P.x + 9.5, P.z - p.z); if (d < bd) { best = p; bd = d; } }
  return best;
};
function cookAction() {
  if (drink && !held) { if (!drinkAnim) { drinkAnim = { t: 0 }; toast('🥤 កំពុងផឹក...'); } return; }
  if (fridge.open && nearFridge() && !held && !eating) { drink = { col: pick([0xd62828, 0x2563eb, 0x16a34a, 0xf59e0b, 0x9333ea]) }; fridge.open = false; refreshHeld(); toast('🥤 បានយកភេសជ្ជៈ'); return; }
  if (held && nearTable()) { placeHeld(); return; }                                   // carrying food + at the table -> put it down
  const p = nearPot();
  if (p) {
    if (p.state === 'idle') { p.state = 'cooking'; p.t = p.secs; toast(p.emoji + ' ចាប់ផ្ដើមដាំ' + potWord(p) + ' (' + p.secs + ' វិនាទី)'); }
    else if (p.state === 'done') {
      if (held) { toast('កំពុងកាន់ម្ហូបមួយហើយ — យកទៅដាក់លើតុសិន'); return; }
      p.left--; if (p.left <= 0) p.state = 'idle'; held = { kind: p.name }; refreshHeld();
      toast(p.doneMsg + (p.left > 0 ? ' (នៅសល់ ' + p.left + ' ចាន)' : '') + ' — យកទៅដាក់លើតុ');   // serve: carry it in your hands
    }
    return;
  }
}

/* ---- carry served food and put it on the dining table ---- */
let drink = null, drinkAnim = null;                                    // a can taken from the fridge / drinking animation
let held = null;                                                      // { kind: 'rice' | 'soup' } carried in the hands
const tableItems = [];
const TABLE_SLOTS = [[-3.5, -4.5], [-3.5, -3.9], [-4.4, -4.5], [-2.6, -4.5], [-4.4, -3.9], [-2.6, -3.9]];   // places on the table top (y = 0.75)
const heldFP = new THREE.Group(); heldFP.position.set(0.24, -0.3, -0.55); camera.add(heldFP); scene.add(camera);  // first-person view of the bowl
function makeBowl(kind) {
  const g = new THREE.Group();
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.06, 0.07, 18), new THREE.MeshStandardMaterial({ color: kind === 'rice' ? 0xf4f1ea : 0x5b8fb9, roughness: 0.4 }));
  bowl.position.y = 0.035; g.add(bowl);
  if (kind === 'rice') {
    const r = new THREE.Mesh(new THREE.SphereGeometry(0.095, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xfffdf6, roughness: 0.9 }));
    r.position.y = 0.07; r.scale.y = 0.8; g.add(r);
  } else {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.092, 0.092, 0.006, 18), new THREE.MeshStandardMaterial({ color: 0xd9822b, roughness: 0.5 }));
    s.position.y = 0.066; g.add(s);
    for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.01, 0.012), new THREE.MeshStandardMaterial({ color: 0x3f9b3f })); b.position.set(Math.cos(i * 1.6) * 0.04, 0.072, Math.sin(i * 1.6) * 0.04); g.add(b); }
  }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}
function makeCan(col) {
  const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color: col, roughness: 0.35, metalness: 0.3 });
  const b = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.12, 12), m); b.position.y = 0.06; g.add(b);
  const t = new THREE.Mesh(new THREE.CylinderGeometry(0.027, 0.03, 0.01, 12), new THREE.MeshStandardMaterial({ color: 0xcfd3d8, metalness: 0.8, roughness: 0.3 })); t.position.y = 0.125; g.add(t);
  const w = new THREE.Mesh(new THREE.CylinderGeometry(0.031, 0.031, 0.04, 12), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 })); w.position.y = 0.06; g.add(w);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g;
}
/* ================= NEWBORN BABY on the blue bed: tiny wiggling hands and feet, can be carried and put back on any bed ================= */
function makeBaby() {
  const group = new THREE.Group(), SK = M(0xf4c7a1, 0.7), ON = M(0xfff0b3, 0.9), DK = M(0x2b1d14, 0.8), PK = M(0xf29aa0, 0.7);
  const add = (par, geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; par.add(m); return m; };
  const torso = add(group, new THREE.CapsuleGeometry(0.075, 0.13, 4, 10), ON, 0, 0.078, -0.03); torso.rotation.x = Math.PI / 2;
  const head = new THREE.Group(); head.position.set(0, 0.09, 0.17); group.add(head);
  add(head, new THREE.SphereGeometry(0.09, 16, 12), SK, 0, 0, 0).scale.set(1, 0.95, 1.05);
  add(head, new THREE.SphereGeometry(0.05, 10, 8), DK, 0, 0.02, 0.075).scale.set(1.2, 0.45, 0.8);                 // a little hair on the crown
  for (const sx of [-1, 1]) {
    add(head, new THREE.SphereGeometry(0.018, 8, 6), SK, sx * 0.088, 0, -0.01);                                     // ears
    const eye = add(head, new THREE.BoxGeometry(0.032, 0.005, 0.007), DK, sx * 0.032, 0.083, 0.03); eye.rotation.z = sx * 0.18;   // closed, sleepy eyes
    add(head, new THREE.SphereGeometry(0.02, 8, 6), PK, sx * 0.052, 0.074, -0.012).scale.set(1, 0.4, 0.8);           // rosy cheeks
  }
  add(head, new THREE.SphereGeometry(0.011, 8, 6), SK, 0, 0.09, -0.005);                                             // nose
  add(head, new THREE.BoxGeometry(0.03, 0.005, 0.01), PK, 0, 0.087, -0.04);                                          // mouth
  const arms = [], legs = [];
  for (const sx of [-1, 1]) {
    const a = new THREE.Group(); a.position.set(sx * 0.1, 0.115, 0.06); group.add(a);
    const up = add(a, new THREE.CylinderGeometry(0.02, 0.024, 0.085, 8), ON, 0, 0, -0.042); up.rotation.x = Math.PI / 2;
    add(a, new THREE.SphereGeometry(0.03, 8, 6), SK, 0, 0, -0.09);                                                    // tiny fist
    a.userData = { sx, ph: sx > 0 ? 0 : 1.7 }; arms.push(a);
    const l = new THREE.Group(); l.position.set(sx * 0.045, 0.062, -0.11); group.add(l);
    const th = add(l, new THREE.CylinderGeometry(0.03, 0.026, 0.1, 8), ON, 0, 0, -0.05); th.rotation.x = Math.PI / 2;
    add(l, new THREE.SphereGeometry(0.032, 8, 6), SK, 0, 0, -0.112);                                                  // foot
    l.userData = { sx, ph: sx > 0 ? 0.9 : 2.6 }; legs.push(l);
  }
  return { group, torso, head, arms, legs };
}
const baby = { state: 'bed', bed: null, grp: makeBaby(), tp: makeBaby(), fp: makeBaby(), t: 0 };
scene.add(baby.grp.group);
baby.tp.group.position.set(-0.02, 1.16, 0.34); baby.tp.group.rotation.y = Math.PI / 2; baby.tp.group.scale.setScalar(1.1);   // cradled across the chest (third person)
baby.fp.group.position.set(-0.22, -0.13, 0); baby.fp.group.rotation.y = Math.PI / 2; baby.fp.group.scale.setScalar(1.35);      // in front of the camera (first person)
const babyHand = new THREE.Object3D();                       // invisible "held item" that raises the carrying arm
function placeBaby(s) {
  baby.bed = s; baby.state = 'bed'; const g = baby.grp.group;
  g.position.set(s.px + s.hd * 0.35, s.by + 0.69, s.pz); g.rotation.y = s.hd > 0 ? Math.PI / 2 : -Math.PI / 2; g.visible = true;
  refreshHeld();
}
placeBaby(spots.find(s => s.node === 'B3') || spots.find(s => s.type === 'sleep'));
const babyOk = () => !(driving || seat || hug || swimming || buyOpen || phoneOpen);
const nearBaby = () => { if (baby.state !== 'bed' || !babyOk()) return false; const p = baby.grp.group.position; return Math.hypot(P.x - p.x, P.z - p.z) < 1.9 && Math.abs(P.y - baby.bed.by) < 1.3; };
const bedForBaby = () => baby.state === 'held' && babyOk() ? spots.find(s => s.type === 'sleep' && Math.hypot(P.x - s.px, P.z - s.pz) < 2.4 && Math.abs(P.y - s.by) < 1.3) : null;
function babyAction() {
  if (nearBaby()) { baby.state = 'held'; baby.grp.group.visible = false; refreshHeld(); toast('👶 បីកូនហើយ ❤️'); return true; }
  const b = bedForBaby(); if (b) { placeBaby(b); toast('🛏 ដាក់កូនលើគ្រែហើយ 😴'); return true; }
  return false;
}
const babyBtn = document.createElement('button'); babyBtn.id = 'babyBtn'; document.body.appendChild(babyBtn);
babyBtn.onclick = e => { babyAction(); e.currentTarget.blur(); };
addEventListener('keydown', e => { if (e.code === 'KeyK' && running) babyAction(); });
function babyStep(dt) {
  baby.t += dt; const t = baby.t;
  const anim = B => {
    B.torso.scale.set(1 + Math.sin(t * 2.2) * 0.03, 1, 1 + Math.sin(t * 2.2) * 0.03); B.head.rotation.z = Math.sin(t * 0.7) * 0.06;
    for (const a of B.arms) { const { sx, ph } = a.userData; a.rotation.y = sx * (0.35 + Math.sin(t * 1.7 + ph) * 0.22); a.rotation.x = Math.sin(t * 1.3 + ph) * 0.3; }
    for (const l of B.legs) { const { sx, ph } = l.userData; l.rotation.x = Math.sin(t * 2.0 + ph) * 0.24; l.rotation.y = sx * (0.22 + Math.sin(t * 1.5 + ph) * 0.12); }
  };
  if (baby.state === 'bed') anim(baby.grp); else { anim(baby.tp); anim(baby.fp); }
  const nb = nearBaby(), bd = bedForBaby(), show = nb || !!bd;
  babyBtn.classList.toggle('show', show);
  if (show) babyBtn.textContent = (nb ? '👶 បីកូន' : '🛏 ដាក់កូនលើគ្រែ') + (mobile ? '' : ' [K]');
}
function refreshHeld() { // show the carried bowl on the controlled character (third person) and in front of the camera (first person)
  boy.setHold(null); girl.setHold(null); heldFP.clear(); heldFP.position.set(0.24, -0.3, -0.55); heldFP.rotation.set(0, 0, 0);
  baby.tp.group.removeFromParent();
  if (baby.state === 'held') { me.group.add(baby.tp.group); me.setHold(babyHand); heldFP.add(baby.fp.group); return; }   // carrying the baby
  if (drink && !held) { me.setHold(makeCan(drink.col)); const c = makeCan(drink.col); c.scale.setScalar(2); heldFP.add(c); return; }
  if (!held) return;
  me.setHold(makeBowl(held.kind));
  const b = makeBowl(held.kind); b.scale.setScalar(1.7); heldFP.add(b);
}
const nearTable = () => {
  if (driving || seat || hug || swimming || Math.abs(P.y) > 1) return false;
  return tableDist(P.x, P.z) < 1.5;
};
function placeHeld() {
  const slot = TABLE_SLOTS.find(s => !tableItems.some(i => i.slot === s));
  if (!slot) { toast('តុពេញហើយ'); return; }
  const mesh = makeBowl(held.kind); mesh.position.set(slot[0], 0.75, slot[1]); scene.add(mesh);
  tableItems.push({ slot, kind: held.kind, mesh }); held = null; refreshHeld(); toast('ដាក់លើតុរួចរាល់ 🍽');
}
const tableDist = (x, z) => Math.hypot(Math.max(-4.6 - x, 0, x + 2.4), Math.max(-4.75 - z, 0, z + 3.65));   // distance to the table rectangle
let eating = null;                                                    // { t, dur, items } while the seated player eats
function makeSpoon() {
  const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color: 0xcfd3d8, roughness: 0.3, metalness: 0.8 });
  const h = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.16, 6), m); h.position.y = 0.05; g.add(h);
  const t = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), m); t.position.y = 0.14; t.scale.set(1, 0.4, 1.4); g.add(t);
  return g;
}
function setFood(it, frac) { // the food in the bowl goes down while eating
  const f = it.mesh.children[1];
  if (it.kind === 'rice') f.scale.y = Math.max(0.04, 0.8 * (1 - frac)); else f.position.y = 0.066 - 0.025 * frac;
}
let aiMeal = null;                                                     // { items, dur, t } while the following AI character eats too
function startEating(s) { // sit at the table with food on it -> eat the nearest bowls (a following AI joins and eats too)
  if (held || !tableItems.length || tableDist(s.x, s.z) > 1.0) return;
  const near = (a, b) => Math.hypot(a.slot[0] - b.x, a.slot[1] - b.z);
  const sorted = tableItems.slice().sort((a, b) => near(a, s) - near(b, s));
  let aiSeat = null;
  if (other.mode() === 'follow' && !aiMeal) {
    const op = other.getPose();                                       // wherever the AI stands (any corner of the house): she takes the free table chair nearest to her
    aiSeat = spots.filter(sp => sp.type === 'sit' && !sp.taken && tableDist(sp.x, sp.z) < 1.0)
      .sort((a, b) => Math.hypot(a.x - op.x, a.z - op.z) - Math.hypot(b.x - op.x, b.z - op.z))[0] || null;
  }
  const mine = sorted.slice(0, Math.min(2, aiSeat && sorted.length > 1 ? Math.ceil(sorted.length / 2) : sorted.length));
  eating = { t: 0, dur: 4 * mine.length, items: mine };
  me.setHold(makeSpoon());                                            // spoon in the hand (third person)
  heldFP.clear(); const b = makeBowl(mine[0].kind); b.scale.setScalar(1.7); heldFP.add(b);   // bowl lifted toward you (first person)
  if (aiSeat) {
    const rest = sorted.filter(i => !mine.includes(i)).sort((a, b) => near(a, aiSeat) - near(b, aiSeat));
    const aiItems = (rest.length ? rest : mine).slice(0, 2), dur = 4 * aiItems.length;       // the other bowls (or share if there are no more)
    if (other.goEat(aiSeat, dur, null, makeSpoon())) aiMeal = { items: aiItems, dur, t: 0 };
  }
  toast(aiMeal ? '🍽 ញាំជាមួយ ' + other.name : '🍽 កំពុងញាំ...');
}
function finishAIMeal(done) {
  const m = aiMeal; aiMeal = null; if (!m) return;
  m.items.forEach(it => { const k = tableItems.indexOf(it); if (done) { scene.remove(it.mesh); if (k >= 0) tableItems.splice(k, 1); } else if (k >= 0) setFood(it, 0); });
}
function stopEating(finished) {
  if (!eating) return;
  const e = eating; eating = null;
  e.items.forEach(it => { const k = tableItems.indexOf(it); if (finished) { scene.remove(it.mesh); if (k >= 0) tableItems.splice(k, 1); } else if (k >= 0) setFood(it, 0); });   // finished: the bowls disappear
  refreshHeld();
  if (finished) toast('ញាំអស់ហើយ ឆ្ងាញ់ណាស់ 😋');
}
function eatingStep(dt) {
  if (aiMeal) {                                                       // the AI's bowls go down while she is seated
    const m = other.mode();
    if (m === 'seated') {
      aiMeal.t += dt; const frac = Math.min(1, aiMeal.t / aiMeal.dur);
      aiMeal.items.forEach(it => { if (!(eating && eating.items.includes(it))) setFood(it, frac); });
      if (aiMeal.t >= aiMeal.dur) finishAIMeal(true);
    } else if (aiMeal.t > 0 && m !== 'enter') finishAIMeal(aiMeal.t >= aiMeal.dur * 0.9);   // interrupted (or just finished)
    else if (aiMeal.t === 0 && m !== 'script' && m !== 'enter') finishAIMeal(false);          // never made it to the chair
  }
  if (!eating) return;
  if (!seat) { stopEating(false); return; }                           // stood up early: the food stays
  eating.t += dt; const frac = Math.min(1, eating.t / eating.dur);
  eating.items.forEach(it => setFood(it, frac));
  const lift = Math.max(0, Math.sin(eating.t * 3.2));
  heldFP.position.set(0.1, -0.32 + lift * 0.2, -0.5 + lift * 0.1);
  if (eating.t >= eating.dur) stopEating(true);
}

/* ================= INPUT ================= */
const controls = new PointerLockControls(camera, renderer.domElement);
const keys = {}; const joy = { x: 0, y: 0 }; let running = false, jumpReq = false;
addEventListener('keydown', e => {
  if (e.target && e.target.tagName === 'INPUT') return;   // typing in the phone
  keys[e.code] = true;
  if (e.code === 'Space') { jumpReq = true; e.preventDefault(); }
  if (e.code === 'KeyE' && running) interact();
  if (e.code === 'KeyC' && running) switchChar();
  if (e.code === 'KeyF' && running) toggleSeat();
  if (e.code === 'KeyV' && running) setMode(camMode === 'fps' ? 'tps' : 'fps');
  if (e.code === 'KeyG' && running) followMe();
  if (e.code === 'KeyH' && running) startHug();
  if (e.code === 'KeyO' && running) toggleShop();
  if (e.code === 'KeyR' && running) cookAction();
});
addEventListener('keyup', e => keys[e.code] = false);

const showMenu = (title, btn) => { $('menu').style.display = 'flex'; $('mt').textContent = title; $('play').textContent = btn; };
const hideMenu = () => $('menu').style.display = 'none';
controls.addEventListener('lock', () => { running = true; hideMenu(); });
controls.addEventListener('unlock', () => { running = false; if (!buyOpen && phoneOpen !== 'unlocked') showMenu('Paused', 'Resume'); });
$('play').onclick = () => mobile ? (running = true, hideMenu()) : controls.lock();
$('pauseBtn').onclick = () => { running = false; showMenu('Paused', 'Resume'); };
$('switchBtn').onclick = e => { switchChar(); e.currentTarget.blur(); };
const setMode = m => { camMode = m; $('camFps').classList.toggle('on', m === 'fps'); $('camTps').classList.toggle('on', m === 'tps'); };
$('camFps').onclick = () => setMode('fps'); $('camTps').onclick = () => setMode('tps');
setMode('tps');   // the game starts in third person
$('camDist').oninput = e => camDist = +e.target.value;
$('fov').oninput = e => { camera.fov = +e.target.value; camera.updateProjectionMatrix(); };
$('sens').oninput = e => { lookSens = +e.target.value; controls.pointerSpeed = lookSens; };
$('settingsBtn').onclick = e => { if (mobile && running) { running = false; showMenu('Paused', 'Resume'); } $('settings').classList.add('show'); e.currentTarget.blur(); };
$('closeSettings').onclick = () => $('settings').classList.remove('show');
renderer.domElement.addEventListener('mousedown', e => { if (controls.isLocked && e.button === 0) clickAt(innerWidth / 2, innerHeight / 2); });
$('cookBtn').onclick = e => { cookAction(); e.currentTarget.blur(); };
$('shopBtn').onclick = e => { toggleShop(); e.currentTarget.blur(); };
$('hugBtn').onclick = e => { startHug(); e.currentTarget.blur(); };
$('followBtn').onclick = e => { followMe(); e.currentTarget.blur(); };
$('sitBtn').onclick = e => { toggleSeat(); e.currentTarget.blur(); };
$('fs').onclick = e => {
  const d = document, el = d.documentElement;
  if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
  else (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el);
  e.currentTarget.blur();
};
$('jumpBtn').ontouchstart = e => { e.preventDefault(); jumpReq = true; };
$('useBtn').ontouchstart = e => { e.preventDefault(); if (running) interact(); };

// Touch: joystick (left) + drag-to-look (anywhere else)
let joyId = null, lookId = null, lx = 0, ly = 0, tap = null;
const joyEl = $('joy'), knob = $('knob');
function joyMove(t) {
  const r = joyEl.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  let dx = (t.clientX - cx) / 55, dy = (t.clientY - cy) / 55; const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; }
  joy.x = dx; joy.y = dy; knob.style.transform = `translate(${dx * 40}px,${dy * 40}px)`;
}
joyEl.addEventListener('touchstart', e => { e.preventDefault(); joyId = e.changedTouches[0].identifier; joyMove(e.changedTouches[0]); }, { passive: false });
document.addEventListener('touchstart', e => {
  if (!mobile || !running) return;
  for (const t of e.changedTouches) if (lookId === null && !t.target.closest('#mobile,#switchBtn,#sitBtn,#cookBtn,#topleft,#settingsBtn,#settings,#buyBtn,#fuelBtn,#babyBtn,#buyPanel,#phoneBtn,#phone')) { lookId = t.identifier; lx = t.clientX; ly = t.clientY; tap = { x: t.clientX, y: t.clientY, t: performance.now() }; }
}, { passive: false });
document.addEventListener('touchmove', e => {
  if (!e.target.closest('#settings,#menu,#buyPanel,#phone')) e.preventDefault();  // allow scrolling inside menus
  for (const t of e.changedTouches) {
    if (t.identifier === joyId) joyMove(t);
    if (t.identifier === lookId) {
      camera.rotation.y -= (t.clientX - lx) * 0.005 * lookSens;
      camera.rotation.x = Math.max(-1.45, Math.min(1.45, camera.rotation.x - (t.clientY - ly) * 0.005 * lookSens));
      lx = t.clientX; ly = t.clientY;
    }
  }
}, { passive: false });
const touchEnd = e => { for (const t of e.changedTouches) {
  if (t.identifier === joyId) { joyId = null; joy.x = joy.y = 0; knob.style.transform = ''; }
  if (t.identifier === lookId) { lookId = null; if (tap && running && Math.hypot(t.clientX - tap.x, t.clientY - tap.y) < 12 && performance.now() - tap.t < 350) clickAt(t.clientX, t.clientY); tap = null; } } };
document.addEventListener('touchend', touchEnd); document.addEventListener('touchcancel', touchEnd);

/* ================= DOOR INTERACTION ================= */
const fwdV = new THREE.Vector3(), tmp = new THREE.Vector3();
function nearestDoor() {
  camera.getWorldDirection(fwdV); let best = null, bd = 2.3;
  for (const d of doors) {
    tmp.copy(d.pos).sub(eyePos); const dist = Math.hypot(tmp.x, tmp.z);
    if (dist < bd && Math.abs(tmp.y) < 2.2 && tmp.normalize().dot(fwdV) > 0.25) { best = d; bd = dist; }
  }
  return best;
}
function interact() {
  if (nearFridge()) { fridge.open = !fridge.open; return; }
  const d = nearestDoor(); if (!d) return;
  if (d.open && Math.hypot(P.x - d.pos.x, P.z - d.pos.z) < 0.9) return; // don't close on the player
  d.open = !d.open;
}

/* ================= MAIN LOOP ================= */
function resize() { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

const clock = new THREE.Clock();
/* ---- refuelling at the gas station pumps ---- */
const GAS_PUMPS = [[98, 94.6], [98, 97.4], [108, 94.6], [108, 97.4]];
const nearPump = (x, z) => GAS_PUMPS.some(([px, pz]) => Math.hypot(x - px, z - pz) < 4.2);
const fuelBtn = document.createElement('button'); fuelBtn.id = 'fuelBtn'; document.body.appendChild(fuelBtn);
let fueling = null;
function fuelTarget() {                                   // the vehicle you are driving (stopped at a pump) or the closest one parked at a pump
  if (buyOpen || phoneOpen) return null;
  if (driving) return nearPump(dv.x, dv.z) && Math.abs(dv.v) < 2 ? dv : null;
  let best = null, bd = 1e9;
  for (const v of fleet) { if (!nearPump(v.x, v.z)) continue; const d = Math.hypot(P.x - v.x, P.z - v.z); if (d < 6 && d < bd) { best = v; bd = d; } }
  return best;
}
function stopFuel(msg) { if (!fueling) return; const f = fueling; fueling = null; if (f.spent > 0) { saveGame(); updateMoney(true); } toast(msg || ('⛽ ចាក់សាំងរួចរាល់ ' + Math.round(f.v.fuel * 100) + '% · ចំណាយ ' + fmt(f.spent))); }
fuelBtn.onclick = e => { e.currentTarget.blur(); if (fueling) { stopFuel(); return; } const v = fuelTarget(); if (!v) return; if (v.fuel === undefined) v.fuel = 1; if (v.fuel >= 0.995) { toast('⛽ ធុងពេញហើយ'); return; } if (save.money < 1) { toast('លុយមិនគ្រប់ទេ 💸'); return; } fueling = { v, acc: 0, spent: 0 }; };
addEventListener('pagehide', () => saveGame()); document.addEventListener('visibilitychange', () => { if (document.hidden) saveGame(); });
let lastFuelSig = '';
function fuelStep(dt) {
  const sig = fleet.map(v => Math.round((v.fuel === undefined ? 1 : v.fuel) * 100)).join(',');   // save as soon as any tank level changes by 1 % (no need to wait for the page to close)
  if (sig !== lastFuelSig) { lastFuelSig = sig; saveGame(); }
  const t = fuelTarget();
  if (fueling) {
    const f = fueling, v = f.v;
    if (t !== v || Math.abs(v.v) > 1.5) { stopFuel('⛽ ឈប់ចាក់សាំង'); }
    else {
      const add = Math.min(1 - v.fuel, dt * 0.2); f.acc += add * v.cap; const whole = Math.floor(f.acc);
      if (whole > 0) { if (save.money < whole) { v.fuel += add * Math.max(0, save.money / Math.max(whole, 1)); stopFuel('លុយអស់ 💸 · ចាក់បាន ' + Math.round(v.fuel * 100) + '%'); } else { save.money -= whole; f.acc -= whole; f.spent += whole; updateMoney(false); } }
      if (fueling) { v.fuel += add; if (v.fuel >= 0.999) { v.fuel = 1; stopFuel(); } }
    }
  }
  const show = !!t && (t.fuel === undefined ? false : t.fuel < 0.995 || !!fueling);
  fuelBtn.classList.toggle('show', show);
  if (show) fuelBtn.textContent = fueling ? '⏹ ឈប់ចាក់ ⛽ ' + Math.round(t.fuel * 100) + '%' : '⛽ ចាក់សាំង ' + Math.round(t.fuel * 100) + '% · ' + fmt(Math.ceil((1 - t.fuel) * t.cap));
}
function update(dt) {
  swimming = false;
  allVeh().forEach(v => carStep(v, dt));
  if (driving) { /* camera + position handled in carStep */ } else if (seat) seatStep(dt); else if (hug) hugStep(dt); else {
  const wd = poolDepth(P.x, P.z, P.y), swimNow = wd > 1.05, wadeNow = wd > 0.05 && !swimNow; swimming = swimNow;   // in the pool?
  const f = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) - joy.y;
  const s = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + joy.x;
  const len = Math.hypot(f, s), n = len > 1 ? 1 / len : 1;
  const sp = swimNow ? (keys.ShiftLeft ? 3.4 : 2.4) : wadeNow ? 2.8 : (keys.ShiftLeft ? 6.5 : 4.2), yaw = camera.rotation.y, sn = Math.sin(yaw), cs = Math.cos(yaw);
  const tx = (-sn * f + cs * s) * n * sp, tz = (-cs * f - sn * s) * n * sp, k = 1 - Math.exp(-dt * 12);
  vx += (tx - vx) * k; vz += (tz - vz) * k;
  P.x = Math.max(-230, Math.min(175, P.x + vx * dt)); P.z = Math.max(-110, Math.min(125, P.z + vz * dt));
  resolve(); carPushPlayer();

  if (swimNow) swimStep(dt, f); else {
  if (jumpReq && P.on) { P.vy = 6.8; P.on = false; } jumpReq = false;
  let gh = surfaceH(P.x, P.z, P.y);
  if (P.on && P.vy <= 0 && P.y - gh < 0.35 && P.y >= gh - 0.01) { P.y = gh; P.vy = 0; }
  else { P.vy -= 22 * dt; P.y += P.vy * dt; gh = surfaceH(P.x, P.z, P.y); if (P.y <= gh) { P.y = gh; P.vy = 0; P.on = true; } else P.on = false; }
  if (P.y < gh) P.y = gh;
  }

  const moving = Math.hypot(vx, vz); bob += moving * dt * 2.2;
  eyeY += (P.y + EYE - eyeY) * (1 - Math.exp(-dt * 14));
  camera.position.set(P.x, eyeY + (P.on ? Math.sin(bob) * 0.025 * Math.min(1, moving / 4) : 0), P.z);
  }

  for (const d of doors) {
    d.ang += ((d.open ? Math.PI / 2 : 0) - d.ang) * (1 - Math.exp(-dt * 6));
    d.pivot.rotation.y = d.base + d.sign * d.ang;
    d.col.on = d.ang < 0.8;
  }
  eyePos.copy(camera.position);
  girl.update(dt); boy.update(dt); babyStep(dt); shopStep(dt); aiDriveStep(dt); pcStep(dt); fridgeStep(dt); fuelStep(dt); poolStep(dt); cookStep(dt); eatingStep(dt);
  me.drive(dt, { x: P.x, y: P.y, z: P.z, vx, vz, seat: driving && dv.bike ? bikeSeat : seat, yaw: camera.rotation.y, swim: swimming, swimY: P.y + EYE - 0.4, eating: !!eating, hug: hug && { ang: hug.ang, e: Math.max(0, Math.min(1, hug.t / .6, (5 - hug.t) / .4)) } });
  const nc = nearVeh(), ns = driving || nc || seat || nearSpot(), sb = $('sitBtn');
  sb.classList.toggle('show', !!ns);
  if (ns) sb.textContent = (driving ? (dv.bike ? '🚪 Get off' : '🚪 Exit car') : nc ? (nc.bike ? '🏍 Ride' : '🚗 Drive') : seat ? '🧍 Stand up' : ns.type === 'sleep' ? '🛏 Sleep' : '🪑 Sit') + (mobile ? '' : ' [F]');
  const fb = $('followBtn'), cf = canFollow(); fb.classList.toggle('show', cf); if (cf) fb.textContent = 'តាមខ្ញុំ' + (mobile ? '' : ' [G]');
  const hb = $('hugBtn'), ch = canHug(); hb.classList.toggle('show', ch); if (ch) hb.textContent = 'ឱប' + (mobile ? '' : ' [H]');
  const cbuy = canBuy() && !buyOpen; buyBtn.classList.toggle("show", cbuy); if (cbuy) buyBtn.textContent = '🛒 ទិញ' + (mobile ? '' : ' [B]');
  const shb = $('shopBtn'), cs = canShop(); shb.classList.toggle('show', cs); if (cs) shb.textContent = (shop.open ? 'បិទហាង' : 'បើកហាង') + (mobile ? '' : ' [O]');
  const np = nearPot(), nt = nearTable(), cb = $('cookBtn'); let cookTxt = '';           // stove / table button
  if (drink && !held) cookTxt = drinkAnim ? '' : '🥤 ផឹក';
  else if (fridge.open && nearFridge() && !held && !eating) cookTxt = '🥤 យកភេសជ្ជៈ';
  else if (held && nt) cookTxt = '🍽 ដាក់លើតុ';
  else if (np && np.state !== 'cooking' && !(held && np.state === 'done')) cookTxt = np.emoji + (np.state === 'done' ? ' ដួស' : ' ដាំ') + potWord(np);
  cb.classList.toggle('show', !!cookTxt); if (cookTxt) cb.textContent = cookTxt + (mobile ? '' : ' [R]');
  const nd = nearestDoor(), nf = nearFridge();
  $('prompt').classList.toggle('show', !!nd || nf);
  if (nf) $('prompt').textContent = `Press E to ${fridge.open ? 'Close' : 'Open'} Fridge 🧊`; else if (nd) $('prompt').textContent = `Press E to ${nd.open ? 'Close' : 'Open'} Door`;
}
function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.05);
  if (running) update(dt);
  applyView();
  poolWater.position.y = WATER_Y + Math.sin(performance.now() / 700) * 0.012;                      // gentle ripples
  const uw = camera.position.y < WATER_Y && inPool(camera.position.x, camera.position.z);          // underwater look
  if (uw !== wasUW) {
    wasUW = uw; $('waterFx').classList.toggle('show', uw);
    const c = uw ? 0x1b7fb0 : 0x9fd0ff; scene.fog.color.set(c); scene.background.set(c); scene.fog.near = uw ? 1 : 70; scene.fog.far = uw ? 16 : 230;
  }
  sun.target.position.set(eyePos.x, 0, eyePos.z); sun.position.set(eyePos.x - 18, 30, eyePos.z + 22); // shadows follow the player
  sunDisc.position.set(eyePos.x - 72, 120, eyePos.z + 88);
  renderer.render(scene, camera);
}
switchChar();   // the game starts with Ny Ny (the girl) under our control; G1 G1 becomes the AI character
camera.position.set(P.x, EYE, P.z);
loop();
