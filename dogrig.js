// dogrig.js — poses the rigged 3D dog (Tripo skeleton: a 4-legged chain rig) from a few numbers game.js already computes for the old
// procedural Labrador (lie-down amount, leg swing, head pitch, tail wag, sniff).  Only needs THREE.Quaternion / Vector3 / Object3D,
// so it can be unit-tested outside a browser.
//
// The rig's own frame: the dog faces -x, its up is +y and its left/right axis is z.  A rotation about z by a NEGATIVE angle swings a hanging
// limb forward; about z by a POSITIVE angle bends a front-facing end (head) DOWN.  game.js turns the model by 90 degrees so it faces +z.
//
// Every driven bone gets a rotation DELTA in the model frame:  worldNew = delta * worldCurrentParent * restLocal  =>  local = inv(P) * delta * P * restLocal
// where P is the parent's CURRENT world rotation, so chains (hip -> knee -> ankle) stack correctly.

const norm = n => (n || '').replace(/[^A-Za-z0-9_]/g, '');   // "tripo::Head_1" / "tripoHead_1" -> "tripoHead_1"
const CFG_A = {   // dog.glb
  LEGS: {
    FL: { c: ['tripoSpine_0', 'tripoSpine_1', 'bone_29', 'bone_30', 'bone_31'], front: true },
    FR: { c: ['bone_22', 'bone_23', 'bone_24', 'bone_25', 'bone_26'], front: true },
    BL: { c: ['tripo1_Left_Limb_0', 'tripo1_Left_Limb_1', 'tripo1_Left_Limb_2', 'tripo1_Left_Limb_3', 'tripo1_Left_Limb_4'], front: false },
    BR: { c: ['tripo0_Right_Limb_0', 'tripo0_Right_Limb_1', 'tripo0_Right_Limb_2', 'tripo0_Right_Limb_3', 'tripo0_Right_Limb_4'], front: false },
  },
  HEAD: ['tripoHead_1', 'tripoHead_2', 'tripoHead_3'], TAIL: ['bone_34', 'bone_35', 'bone_36', 'bone_37'],
};
const CFG_B = {   // Dog1.glb (a lighter skeleton: 34 bones)
  LEGS: {
    FL: { c: ['tripoSpine_3', 'tripo0_Right_Limb_0', 'tripo0_Right_Limb_1', 'tripo0_Right_Limb_2', 'tripo0_Right_Limb_3'], front: true },
    FR: { c: ['bone_10', 'bone_11', 'bone_12', 'bone_13', 'bone_14'], front: true },
    BL: { c: ['tripo1_Right_Limb_0', 'tripo1_Right_Limb_1', 'tripo1_Right_Limb_2', 'tripo1_Right_Limb_3'], front: false },
    BR: { c: ['tripo0_Left_Limb_0', 'tripo0_Left_Limb_1', 'tripo0_Left_Limb_2', 'tripo0_Left_Limb_3', 'tripo0_Left_Limb_4'], front: false },
  },
  HEAD: ['tripoHead_0', 'tripoHead_1', 'tripoHead_2'], TAIL: ['bone_29', 'bone_30', 'bone_31', 'bone_32'],
};

export function createDogRig(THREE, model, opts = {}) {
  const { Quaternion, Vector3 } = THREE;
  const bone = {};
  model.traverse(o => { if (o.isBone) bone[norm(o.name)] = o; });
  const { LEGS, HEAD, TAIL } = bone.tripoSpine_3 ? CFG_B : CFG_A;
  if (!bone.tripoRoot) throw new Error('dog rig: root bone not found');
  const rest = {};   // rest local rotation / position of the bones we touch
  const need = [...HEAD, ...TAIL, 'tripoRoot'];
  for (const k in LEGS) need.push(...LEGS[k].c);
  for (const n of need) {
    if (!bone[n]) throw new Error('dog rig: bone missing ' + n);
    rest[n] = { q: bone[n].quaternion.clone(), p: bone[n].position.clone() };
  }
  const AZ = new Vector3(0, 0, 1), AY = new Vector3(0, 1, 0), AXv = new Vector3(1, 0, 0);
  /* standing posture: the model's own legs zig-zag, so every leg segment is turned to a chosen absolute angle (0 = straight down, + = lower end back, - = forward) */
  const wpos = b => {   // rest position of a bone in the MODEL frame
    const chain = []; for (let o = b; o && o !== model.parent; o = o.parent) chain.push(o);
    const p = new Vector3(), q = new Quaternion();
    for (let i = chain.length - 1; i >= 0; i--) { p.add(chain[i].position.clone().applyQuaternion(q)); q.multiply(chain[i].quaternion); }
    return p;
  };
  const STAND = { FL: [-.12, 0, 0, 0], FR: [-.12, 0, 0, 0], BL: [-.17, .26, 0, 0], BR: [-.17, .26, 0, 0] };
  const stand = {};
  for (const k in LEGS) {
    const pts = LEGS[k].c.map(n => wpos(bone[n])), off = []; let prev = 0;
    for (let i = 0; i < 4; i++) {
      const d = pts[Math.min(i + 1, pts.length - 1)].clone().sub(pts[i]), a = Math.atan2(d.x, -d.y), C = i === 3 ? 0 : STAND[k][i] - a;   // the paw keeps its own (flat) orientation   // x < 0 is forward in the rig frame
      off.push(C - prev); prev = C;
    }
    stand[k] = off;
  }
  let raise = 0;   // straight legs are longer than the zig-zag ones: the body has to rise by the average shortfall so the paws still touch the ground
  for (const k in LEGS) {
    const pts = LEGS[k].c.map(n => wpos(bone[n])); let y = pts[0].y;
    for (let i = 0; i < 3; i++) y -= pts[i + 1].clone().sub(pts[i]).length() * Math.cos(STAND[k][i]);
    raise += (pts[3].y - y) / 4;
  }
  const RAISE = opts.raise ?? Math.max(0, raise);   // straight legs are longer than the zig-zag ones: lift the body so the paws still stand on the ground
  const D = {};   // delta (model frame) per bone for this frame
  for (const n of need) D[n] = new Quaternion();
  const tmp = new Quaternion(), P = new Quaternion(), Pi = new Quaternion();
  const setZ = (n, a, y = 0) => { D[n].setFromAxisAngle(AZ, a); if (y) { tmp.setFromAxisAngle(AY, y); D[n].premultiply(tmp); } };

  /* write local rotations for a chain (parents first): local = inv(P) * delta * P * rest */
  function put(n) {
    const b = bone[n]; P.identity();
    const chain = []; for (let o = b.parent; o && o !== model.parent; o = o.parent) chain.push(o);   // rotation of the parent in the MODEL frame (outer yaw / scale excluded)
    for (let i = chain.length - 1; i >= 0; i--) P.multiply(chain[i].quaternion);
    Pi.copy(P).invert();
    b.quaternion.copy(rest[n].q).premultiply(P).premultiply(D[n]).premultiply(Pi);
  }

  /* st: { lie 0..1, sw (leg swing, rad), speed 0..1, head (pitch, rad: + = down), tailY (wag), tailX, bob (m, body sinks), sn (sniff 0..1) } */
  function apply(st) {
    const lie = st.lie || 0, sw = st.sw || 0, mv = st.speed || 0;
    /* body: lower the whole skeleton when lying down */
    const m = Math.min(1, mv) * (1 - lie), ph = st.phase || 0, t = st.t || 0;
    bone.tripoRoot.position.copy(rest.tripoRoot.p);
    bone.tripoRoot.position.y += RAISE * (1 - lie) - (st.bob || 0) + .011 * m * Math.cos(2 * ph) + .004 * (1 - m) * (1 - lie) * Math.sin(t * 1.8);   // two bounces per stride / slow breathing
    { const AXx = AXv, roll = .035 * m * Math.sin(ph), pitch = .03 * m * Math.sin(2 * ph + .6), br = .008 * (1 - m) * (1 - lie) * Math.sin(t * 1.8);
      D.tripoRoot.setFromAxisAngle(AXx, roll); tmp.setFromAxisAngle(AZ, pitch + br); D.tripoRoot.multiply(tmp); put('tripoRoot'); }   // the trunk rocks a little with every step
    /* legs: diagonal pairs swing opposite; a knee folds while the leg goes forward */
    const sgn = { FL: 1, BR: 1, FR: -1, BL: -1 };
    for (const k in LEGS) {
      const L = LEGS[k], a = sgn[k] * sw, fwd = Math.max(0, -a);
      let j1, j2, j3, j4;
      const so = stand[k], w = 1 - lie;
      if (L.front) { j1 = (a + so[0]) * w + lie * .85; j2 = (.45 * fwd + .12 * Math.max(0, a) + so[1]) * w + lie * -2.75; j3 = (.2 * fwd + so[2]) * w + lie * 1.0; j4 = so[3] * w; }
      else { j1 = (a + so[0]) * w + lie * -.75; j2 = (.5 * fwd + so[1]) * w + lie * 1.5; j3 = (-.35 * fwd + so[2]) * w - lie * 2.2; j4 = so[3] * w; }
      setZ(L.c[0], j1); setZ(L.c[1], j2); setZ(L.c[2], j3); setZ(L.c[3], j4); if (L.c[4]) D[L.c[4]].identity();
      for (const n of L.c) put(n);
    }
    /* head: nod down when sniffing / lying, a little bob when trotting */
    const hp = (st.head || 0) - .06 * m * Math.sin(2 * ph + .6), hy = st.headYaw || 0;   // the head stays steadier than the trunk; it can also turn toward something
    setZ(HEAD[0], hp * .4, hy * .35); setZ(HEAD[1], hp * .35, hy * .4); setZ(HEAD[2], hp * .25, hy * .25);
    for (const n of HEAD) put(n);
    /* tail: wag side to side (rotation about the vertical axis), droops when lying */
    const ty = st.tailY || 0, tx = (st.tailX || 0) + .22 * m;   // tail up while trotting
    TAIL.forEach((n, i) => { const w = [.4, .3, .2, .1][i]; setZ(n, tx * w * 2, ty * w * 1.6); put(n); });
  }
  return { apply, bone, scale: opts.scale || 1, raise: RAISE };
}
