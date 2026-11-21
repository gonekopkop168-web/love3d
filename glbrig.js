// glbrig.js — puts a Mixamo-rigged .glb body (Ny Ny / G1 G1) on the game's simple character "puppet".
//
// npc.js keeps animating the same invisible puppet it always did (legs, shins, arms, elbows, head, body lean …:
// walking, sitting, sleeping, swimming, hugging, typing, pool, phone, driving …). This file only READS that puppet
// every frame and re-poses the real skeleton bone by bone, so every existing animation works on the 3D models
// and a few extras (knee bend, elbow bend, hip/shoulder twist, breathing, relaxed fingers, running lean) are added on top.
//
// Maths: for each driven bone we compute a rotation DELTA in the body frame:   worldNew(bone) = delta * worldRest(bone)
// and write   local = inv(worldNew(parent)) * worldNew(bone).   Undriven bones simply follow their parent.
// The rig only needs THREE.Quaternion / Vector3 / Object3D, so it can be unit-tested outside a browser.

const norm = n => n.replace(/^mixamorig:?/i, '').replace(/[^A-Za-z0-9_]/g, '');   // "mixamorig:LeftArm" / "mixamorigLeftArm" -> "LeftArm"
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const FINGERS = ['Index', 'Middle', 'Ring', 'Pinky'];
const RELAX = [.16, .26, .2], FIST = [1.0, 1.2, .8];   // finger joint curl (rad): relaxed hand / gripping something

export function createGlbRig(THREE, model, { height = 1.7 } = {}) {
  const { Quaternion, Vector3, Object3D } = THREE;
  const AX = new Vector3(1, 0, 0), AY = new Vector3(0, 1, 0), AZ = new Vector3(0, 0, 1), DOWN = new Vector3(0, -1, 0);

  /* ---------- rest pose (measured with the model detached, unit scale) ---------- */
  model.updateMatrixWorld(true);
  const bone = {}, skinned = [];
  model.traverse(o => { if (o.isBone) bone[norm(o.name)] = o; if (o.isSkinnedMesh) skinned.push(o); });
  for (const need of ['Hips', 'Spine', 'Spine1', 'Spine2', 'Neck', 'Head', 'LeftArm', 'LeftForeArm', 'LeftHand', 'LeftUpLeg', 'LeftLeg', 'LeftFoot', 'RightArm', 'RightForeArm', 'RightHand', 'RightUpLeg', 'RightLeg', 'RightFoot'])
    if (!bone[need]) throw new Error('glbrig: missing bone ' + need);
  const rW = {}, rP = {}, pW = {}, par = {};   // rest world rotation / position of each bone, rest world rotation of its parent node
  for (const k in bone) {
    rW[k] = bone[k].getWorldQuaternion(new Quaternion()); rP[k] = bone[k].getWorldPosition(new Vector3());
    pW[k] = bone[k].parent ? bone[k].parent.getWorldQuaternion(new Quaternion()) : new Quaternion();
    par[k] = bone[k].parent && bone[k].parent.isBone ? norm(bone[k].parent.name) : null;
  }
  let top = 0; for (const m of skinned) { m.geometry.computeBoundingBox(); top = Math.max(top, m.geometry.boundingBox.max.y); }
  if (!top) top = rP.HeadTop_End ? rP.HeadTop_End.y : 1;
  const s = height / top;                                            // metres per model unit

  const dirOf = (a, b) => rP[b].clone().sub(rP[a]).normalize();
  const hang = (a, b, dir) => new Quaternion().setFromUnitVectors(dirOf(a, b), dir);

  /* ---------- per side data: index 0 = the puppet's armL/legL (x < 0), index 1 = armR/legR (x > 0) ---------- */
  const side = [null, null];
  for (const pre of ['Left', 'Right']) {
    const sg = rP[pre + 'Arm'].x < 0 ? -1 : 1, i = sg < 0 ? 0 : 1;
    const out = new Vector3(sg * Math.sin(.08), -Math.cos(.08), 0);   // arms hang a little away from the body
    const Ha = hang(pre + 'Arm', pre + 'ForeArm', out), Hf = hang(pre + 'ForeArm', pre + 'Hand', out);
    const Hu = hang(pre + 'UpLeg', pre + 'Leg', DOWN), Hl = hang(pre + 'Leg', pre + 'Foot', DOWN);
    // finger curl axis = the knuckle line; sign chosen so the fingers curl toward the palm (inward when the arm hangs)
    const axis = rP[pre + 'HandIndex1'] && rP[pre + 'HandPinky1'] ? rP[pre + 'HandIndex1'].clone().sub(rP[pre + 'HandPinky1']).normalize() : AZ.clone();
    const fd = rP[pre + 'HandMiddle2'] && rP[pre + 'HandMiddle1'] ? dirOf(pre + 'HandMiddle1', pre + 'HandMiddle2') : DOWN.clone();
    const inward = new Vector3(-sg, 0, 0);
    const base = fd.clone().applyQuaternion(Hf);
    const moved = fd.clone().applyQuaternion(new Quaternion().setFromAxisAngle(axis, .3)).applyQuaternion(Hf);
    if (moved.sub(base).dot(inward) < 0) axis.negate();
    const fing = [];
    for (const f of FINGERS) { const chain = [1, 2, 3].map(j => pre + 'Hand' + f + j); if (chain.every(n => bone[n])) fing.push(chain); }
    // anchor in the hand: objects attached here sit in the same frame as the puppet's elbow group (so holding poses carry over)
    const anchor = new Object3D();
    anchor.quaternion.copy(Hf).multiply(rW[pre + 'Hand']).invert();
    anchor.scale.setScalar(1 / s);
    bone[pre + 'Hand'].add(anchor);
    side[i] = { pre, sg, Ha, Hf, Hu, Hl, axis, fing, anchor, curl: 0, prevLeg: 0, flex: 0, foreLen: rP[pre + 'ForeArm'].distanceTo(rP[pre + 'Hand']) * s };
  }

  model.scale.setScalar(s);
  for (const m of skinned) { m.frustumCulled = false; m.castShadow = true; m.receiveShadow = false; if (m.material) { m.material.roughness = Math.max(m.material.roughness ?? .8, .7); m.material.metalness = 0; if (m.material.map) m.material.map.anisotropy = 4; } }

  /* ---------- driven bones & the ancestor whose delta they inherit ---------- */
  const driven = new Set(['Hips', 'Spine', 'Spine1', 'Spine2', 'Neck', 'Head']);
  for (const sd of side) {
    for (const n of ['Arm', 'ForeArm', 'UpLeg', 'Leg', 'Foot']) driven.add(sd.pre + n);
    for (const ch of sd.fing) for (const n of ch) driven.add(n);
  }
  const inh = {};   // bone -> nearest driven ancestor of its PARENT (or null)
  for (const k in bone) { let p = par[k]; while (p && !driven.has(p)) p = par[p]; inh[k] = p; }

  const D = {};     // current delta per driven bone
  for (const k of driven) D[k] = new Quaternion();
  const ID = new Quaternion();
  const T = [0, 1, 2, 3, 4, 5].map(() => new Quaternion());   // scratch
  const tmp = new Quaternion();
  const qx = (o, a) => o.setFromAxisAngle(AX, a), qy = (o, a) => o.setFromAxisAngle(AY, a);
  const qYXZ = (o, x, y) => { qy(o, y); return o.multiply(qx(tmp, x)); };

  function put(name) {   // write the local rotation of bone `name` from its delta
    const dp = inh[name] ? D[inh[name]] : ID;
    bone[name].quaternion.copy(pW[name]).invert().multiply(tmp.copy(dp).invert()).multiply(D[name]).multiply(rW[name]);
  }

  let swell = 0;
  function apply(st) {   // st: { dt, t, sf, run, swim, legs:[L,R], arms:[L,R], head, grip:[l,r] }
    const { dt, t, sf, run, legs, arms, head } = st;
    const dq = Math.max(.001, dt);

    /* pelvis + torso */
    const legSw = (legs[0].rotation.x - legs[1].rotation.x) * .5;
    const walk = legSw !== 0 && sf > .05 ? 1 : 0;
    const yaw = clamp(-legSw * .2 * walk, -.22, .22), tw = -yaw * 1.3;
    swell += (Math.sin(t * 1.7) - swell) * Math.min(1, dq * 4);
    const breath = swell * .012, lean = run * .17 * sf + (st.tilt || 0);   // st.tilt: extra forward bend of the back only (the legs stay put), used when riding a motorbike
    const dH = qy(D.Hips, yaw);
    D.Spine.copy(dH).multiply(qYXZ(T[0], lean * .4 + breath * .3, tw * .3));
    D.Spine1.copy(D.Spine).multiply(qYXZ(T[0], lean * .35 + breath * .6, tw * .3));
    D.Spine2.copy(D.Spine1).multiply(qYXZ(T[0], lean * .25 + breath, tw * .4));
    D.Neck.copy(D.Spine2).multiply(T[0].copy(ID).slerp(head.quaternion, .35));
    D.Head.copy(D.Spine2).multiply(head.quaternion);

    for (let i = 0; i < 2; i++) {
      const sd = side[i], pre = sd.pre, leg = legs[i], arm = arms[i], el = arm.userData.el;
      /* legs: knee bends while the leg swings forward, foot stays flatter than the shin */
      const ang = leg.rotation.x, shin = leg.userData.shin.rotation.x, walking = sf > .2 && !st.swim;
      const jump = Math.abs(ang - sd.prevLeg) > .35; const vel = (ang - sd.prevLeg) / dq; sd.prevLeg = ang;
      const flexT = walking && !jump ? clamp(-vel * .17, 0, 1) * (1 + run * .6) : 0;
      sd.flex += (flexT - sd.flex) * Math.min(1, dq * 18);
      const boost = walking ? 1 + run * .45 : 1;
      const P = T[1].copy(ID); qx(P, ang * boost);
      if (st.abd) P.premultiply(T[4].setFromAxisAngle(AZ, st.abd * (i ? 1 : -1)));   // knees out (riding a bike)
      D[pre + 'UpLeg'].copy(dH).multiply(P).multiply(sd.Hu);
      const Sh = qx(T[2], shin + sd.flex);
      D[pre + 'Leg'].copy(dH).multiply(P).multiply(Sh).multiply(sd.Hl);
      D[pre + 'Foot'].copy(dH).multiply(qx(T[3], -.6 * (ang * boost + shin + sd.flex))).multiply(P).multiply(Sh);

      /* arms (+ a natural elbow bend while walking / raising the arm) */
      const ax = arm.rotation.x, exp = Math.abs(el.rotation.x) > .02;
      let bend = 0;
      if (!exp && !st.swim) {
        bend = sf > .2 ? (.12 + .3 * clamp(-ax / .45, 0, 1) + run * .9) * Math.min(1, sf) : 0;
        if (ax < -.5) bend = Math.max(bend, clamp((-ax - .3) * .85, 0, 1.25));
      }
      const Ar = ax !== 0 && walking && run > 0 ? tmp.copy(arm.quaternion).premultiply(qx(T[4], ax * run * .5)) : arm.quaternion;
      const Ar2 = st.armOut ? tmp.copy(Ar).premultiply(qy(T[4], st.armOut * (i ? 1 : -1))) : Ar;   // elbows out sideways (riding a bike)
      D[pre + 'Arm'].copy(D.Spine2).multiply(Ar2).multiply(sd.Ha);
      const E = qx(T[5], el.rotation.x - bend).multiply(sd.Hf);
      D[pre + 'ForeArm'].copy(D.Spine2).multiply(Ar2).multiply(E);

      /* fingers: relaxed curl, or a fist while holding something */
      sd.curl += ((st.grip[i] ? 1 : 0) - sd.curl) * Math.min(1, dq * 10);
      for (const ch of sd.fing) {
        let cum = 0;
        for (let j = 0; j < 3; j++) {
          cum += RELAX[j] + (FIST[j] - RELAX[j]) * sd.curl;
          D[ch[j]].copy(D[pre + 'ForeArm']).multiply(T[0].setFromAxisAngle(sd.axis, cum));
        }
      }
    }

    /* write local rotations (parents before children) */
    for (const n of ['Hips', 'Spine', 'Spine1', 'Spine2', 'Neck', 'Head']) put(n);
    for (const sd of side) {
      const pre = sd.pre;
      for (const n of ['Arm', 'ForeArm', 'UpLeg', 'Leg', 'Foot']) put(pre + n);
      for (const ch of sd.fing) for (const n of ch) put(n);
    }
  }

  const hipJoint = Math.max(rP.LeftUpLeg.y, rP.RightUpLeg.y) * s;   // height of the hip joint above the floor
  return {
    root: model, height: height, hipH: hipJoint, scale: s, apply,
    anchors: [side[0].anchor, side[1].anchor],        // hand frames (index = puppet's armL / armR)
    foreLen: [side[0].foreLen, side[1].foreLen],
  };
}
