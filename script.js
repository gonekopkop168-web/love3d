(function () {
var MESSAGES = ["នី ជាមនុស្សពិសេសរបស់បង ❤️", "បងស្រឡាញ់នីណាស់", "នី ជាស្នាមញញឹមរបស់បង 😊", "មាននី ជីវិតបងកាន់តែស្រស់ស្អាត", "បងនឹកនីរាល់ថ្ងៃ", "សូមឱ្យនីញញឹមជានិច្ច", "នី ជាកាដូដ៏មានតម្លៃរបស់បង 🎁", "បងចង់នៅក្បែរនីជារៀងរហូត", "ស្រឡាញ់នី មិនចេះធុញទេ", "នី ជាពិភពលោកតូចរបស់បង 🌎", "អរគុណដែលបានចូលមកក្នុងជីវិតបង", "បេះដូងបងមានតែនីម្នាក់", "នី ស្អាតទាំងចិត្តទាំងរូប", "បងនឹងថែរក្សាស្នាមញញឹមនី", "នី ជាកម្លាំងចិត្តរបស់បង", "គិតដល់នីហើយញញឹមម្នាក់ឯង", "សុំកាន់ដៃនីបានទេ?", "បងមានសំណាងដែលបានស្គាល់នី", "សូមឱ្យយើងនៅជាមួយគ្នាយូរអង្វែង", "នី ជាមនុស្សដែលបងជ្រើសរើស 💕", "ព្រឹកនេះបងនឹកនីហើយ", "រាត្រីសួស្តី អូននី 🌙", "សូមឱ្យនីគេងលក់ស្រួល", "កុំភ្លេចញ៉ាំបាយផងណា", "ថែសុខភាពផង មនុស្សជាទីស្រឡាញ់", "បងបារម្ភពីនីជានិច្ច", "នី សមនឹងទទួលបានសេចក្តីសុខ", "បងនៅទីនេះសម្រាប់នី", "ទោះថ្ងៃណាក៏បងនៅតែស្រឡាញ់នី", "ស្នេហ៍បងចំពោះនីមិនប្រែប្រួល", "នី ធ្វើឱ្យថ្ងៃធម្មតាក្លាយជាថ្ងៃពិសេស", "សំឡេងនីធ្វើឱ្យបងមានក្តីសុខ", "ស្នាមញញឹមនីគួរឱ្យស្រឡាញ់ណាស់", "បងចង់បង្កើតអនុស្សាវរីយ៍ជាមួយនី", "សូមឱ្យបងបានមើលថែនី", "អូនជាមនុស្សដែលបងនឹកមុនគេ", "បងស្រឡាញ់គ្រប់យ៉ាងដែលជានី", "នៅក្បែរនី បងមានអារម្មណ៍កក់ក្តៅ", "នី ជាក្តីសុខតូចៗរបស់បង", "បងមិនចង់បាត់បង់នីទេ", "សូមញញឹមឱ្យបងមើលផង", "បងចង់ប្រាប់ថា នីសំខាន់ណាស់", "បងនឹងស្តាប់នីជានិច្ច", "ពេលនីពិបាកចិត្ត បងនៅក្បែរនី", "យើងជួយគ្នាឆ្លងកាត់គ្រប់រឿងណា", "ស្រឡាញ់នីថ្ងៃនេះ និងថ្ងៃស្អែក", "បេះដូងបងរីករាយពេលមាននី", "នី ជាមនុស្សដែលបងមិនអាចជំនួសបាន", "សុំអោបនីមួយបានទេ? 🤗", "បងចង់ឃើញនីរាល់ថ្ងៃ", "អូននី គួរឱ្យស្រឡាញ់បំផុត", "បងសន្យាថានឹងខិតខំដើម្បីយើង", "សូមកុំគិតថានីនៅម្នាក់ឯង", "បងនឹងលើកទឹកចិត្តនីជានិច្ច", "ស្នេហ៍មួយនេះមានឈ្មោះថា នី", "នី ជាចម្លើយនៃសំណួរបេះដូងបង", "បងចង់ធ្វើឱ្យនីសប្បាយចិត្ត", "គ្រប់ពេលវេលាជាមួយនីមានន័យ", "សូមឱ្យក្តីស្រឡាញ់យើងរឹងមាំ", "បងស្រឡាញ់នីលើសពីពាក្យដែលនិយាយបាន", "បើអាច បងចង់បញ្ឈប់ពេលវេលាពេលនៅជាមួយនី", "នី ជាពន្លឺក្នុងថ្ងៃងងឹតរបស់បង ✨", "គ្មានអ្នកណាដូចនីទេ", "បងចង់ធ្វើជាមនុស្សដែលនីអាចពឹងផ្អែកបាន", "អរគុណដែលធ្វើឱ្យបងស្គាល់ពាក្យថាស្នេហា", "សូមឱ្យសុបិនរបស់នីក្លាយជាការពិត", "បងនឹងមិនឈប់ខ្វល់ពីនីទេ", "បេះដូងនេះជារបស់នី", "ស្រឡាញ់អូននីម្នាក់គត់ 💖", "ពីបង ផ្ញើជូននីដោយក្តីស្រឡាញ់"];
var COLORS = "AliceBlue AntiqueWhite Aqua Aquamarine Azure Beige Bisque Blue BlueViolet Brown BurlyWood CadetBlue Chartreuse Chocolate Coral CornflowerBlue Crimson Cyan DarkBlue DarkCyan DarkGoldenRod DarkGray DarkGreen DarkKhaki DarkMagenta DarkOrange DarkOrchid DarkRed DarkSalmon DarkSeaGreen DarkSlateBlue DarkTurquoise DarkViolet DeepPink DeepSkyBlue DodgerBlue FireBrick ForestGreen Fuchsia Gold GoldenRod Gray Green GreenYellow HotPink IndianRed Indigo Khaki Lavender LawnGreen LightBlue LightCoral LightCyan LightGreen LightPink LightSalmon LightSkyBlue LightSteelBlue Lime LimeGreen Magenta Maroon MediumAquaMarine MediumBlue MediumOrchid MediumPurple MediumSeaGreen MediumSlateBlue MediumSpringGreen MediumTurquoise MediumVioletRed MidnightBlue Orange OrangeRed Orchid PaleGreen PaleTurquoise PaleVioletRed PeachPuff Pink Plum PowderBlue Purple RebeccaPurple Red RosyBrown RoyalBlue Salmon SandyBrown SeaGreen Silver SkyBlue SlateBlue SpringGreen SteelBlue Tan Teal Tomato Turquoise Violet Wheat Yellow YellowGreen".split(" ");
var FOV = 40, R = 9.5, PH = 1.3, PX = 100, TH = 0.66;
var canvas = document.getElementById("c"), heading = document.getElementById("heading"), controls = document.getElementById("controls");
var btnG = document.getElementById("btnGravity"), btnE = document.getElementById("btnExplode");
var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 200);
scene.add(new THREE.HemisphereLight(0xffffff, 0x666677, 0.85));
var sun = new THREE.DirectionalLight(0xffffff, 0.75); sun.position.set(-6, 12, 14); scene.add(sun);

/* love-in-space background */
var bg = new THREE.Group(), hearts = []; scene.add(bg);
function glowTex(stops) {
  var c = document.createElement("canvas"); c.width = c.height = 64;
  var x = c.getContext("2d"), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  stops.forEach(function (s) { g.addColorStop(s[0], s[1]); });
  x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
}
function heartTex() {
  var c = document.createElement("canvas"); c.width = c.height = 128; var x = c.getContext("2d");
  x.shadowColor = "rgba(255,80,150,.9)"; x.shadowBlur = 18; x.fillStyle = "#ff8fb8";
  x.beginPath(); x.moveTo(64, 106); x.bezierCurveTo(10, 70, 14, 22, 46, 22); x.bezierCurveTo(58, 22, 64, 32, 64, 38);
  x.bezierCurveTo(64, 32, 70, 22, 82, 22); x.bezierCurveTo(114, 22, 118, 70, 64, 106); x.fill();
  return new THREE.CanvasTexture(c);
}
(function () {
  var n = 700, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), pal = [0xff8fbf, 0xffb3d1, 0xf5a0d0, 0xffc9de];
  for (var i = 0; i < n; i++) {
    var r = rand(70, 140), u = rand(-1, 1), a = rand(0, Math.PI * 2), q = Math.sqrt(1 - u * u), c = new THREE.Color(pal[i % 4]);
    pos[i * 3] = r * q * Math.cos(a); pos[i * 3 + 1] = r * u; pos[i * 3 + 2] = r * q * Math.sin(a);
    c.multiplyScalar(rand(0.5, 1)); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  var g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  bg.add(new THREE.Points(g, new THREE.PointsMaterial({ size: 0.9, map: glowTex([[0, "rgba(255,255,255,1)"], [0.3, "rgba(255,255,255,.8)"], [1, "rgba(255,255,255,0)"]]), vertexColors: true, transparent: true, depthWrite: false })));
  ["255,170,205", "255,200,225", "235,180,255", "255,150,190", "255,210,230", "250,190,230"].forEach(function (rgb) {
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex([[0, "rgba(" + rgb + ",.55)"], [1, "rgba(" + rgb + ",0)"]]), transparent: true, opacity: 0.45, depthWrite: false }));
    var u = rand(-0.8, 0.8), a = rand(0, Math.PI * 2), q = Math.sqrt(1 - u * u);
    sp.position.set(85 * q * Math.cos(a), 85 * u, 85 * q * Math.sin(a)); sp.scale.setScalar(rand(70, 110)); bg.add(sp);
  });
  var ht = heartTex(), hc = [0xff7aa8, 0xffa0c8, 0xf06292, 0xffc2d9];
  for (var k = 0; k < 28; k++) {
    var hs = new THREE.Sprite(new THREE.SpriteMaterial({ map: ht, color: hc[k % 4], transparent: true, opacity: 0.8, depthWrite: false }));
    var hu = rand(-1, 1), ha = rand(0, Math.PI * 2), hq = Math.sqrt(1 - hu * hu), hr = rand(13, 42);
    hs.position.set(hr * hq * Math.cos(ha), hr * hu, hr * hq * Math.sin(ha)); hs.scale.setScalar(rand(0.7, 1.8));
    hs.userData = { x: hs.position.x, y: hs.position.y, s: rand(0.6, 1.4), p: rand(0, 6.28) };
    bg.add(hs); hearts.push(hs);
  }
})();


/* realistic clouds orbiting around the sphere */
var clouds = [];
function cloudTex(shade) {
  var c = document.createElement("canvas"); c.width = 512; c.height = 256; var x = c.getContext("2d");
  function puff(px, py, r, al) {
    var g = x.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, "rgba(255,255,255," + al + ")"); g.addColorStop(0.5, "rgba(255,255,255," + al * 0.55 + ")"); g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, 6.2832); x.fill();
  }
  var i, px, env, py, r;
  for (i = 0; i < 70; i++) {
    px = 256 + rand(-1, 1) * 200; env = Math.max(0, 1 - Math.pow((px - 256) / 215, 2));
    py = 178 - Math.pow(Math.random(), 0.8) * 120 * env; r = rand(22, 58) * (0.55 + 0.6 * env);
    py = Math.min(py, 200 - r * 0.35); puff(px, py, r, rand(0.35, 0.6));
  }
  for (i = 0; i < 40; i++) { px = 256 + rand(-1, 1) * 225; puff(px, rand(130, 190), rand(10, 24), rand(0.2, 0.4)); }
  x.globalCompositeOperation = "source-atop";
  var g = x.createLinearGradient(0, 55, 0, 205);
  g.addColorStop(0, "rgba(" + shade + ",0)"); g.addColorStop(0.6, "rgba(" + shade + ",0.28)"); g.addColorStop(1, "rgba(" + shade + ",0.6)");
  x.fillStyle = g; x.fillRect(0, 0, 512, 256);
  var t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
}
(function () {
  var shades = ["205,185,220", "190,185,225", "225,185,205", "200,195,230"], texs = shades.map(cloudTex);
  var ys = [9, -10, 20, -18, 12, -26, 35, -6, 24, -22, 15, -35];
  for (var i = 0; i < ys.length; i++) {
    var op = rand(0.6, 0.85);
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: texs[i % 4], transparent: true, opacity: op, depthWrite: false }));
    var rr0 = i % 3 === 0 ? rand(13, 19) : rand(22, 85), w = rand(13, 24) * (0.6 + rr0 / 28); sp.scale.set(w, w * 0.5, 1);
    sp.userData = { base: op, cur: op, r: rr0, a: (i / ys.length) * 6.2832 + rand(-0.2, 0.2), y: ys[i] + rand(-1.5, 1.5), s: rand(0.04, 0.09) * (i % 2 ? 1 : -1), p: rand(0, 6.28) };
    scene.add(sp); clouds.push(sp);
  }
  var last = performance.now(), v = new THREE.Vector3();
  (function tick(now) {
    var dt = Math.min((now - last) / 1000, 0.1); last = now;
    var cd = camera.position.length(), sr = R / (cd * Math.tan(FOV / 2 * Math.PI / 180));
    clouds.forEach(function (s) {
      var d = s.userData; d.a += d.s * dt; d.p += dt * 0.4;
      s.position.set(d.r * Math.cos(d.a), d.y + Math.sin(d.p) * 0.8, d.r * Math.sin(d.a));
      v.copy(s.position).project(camera);
      var front = camera.position.distanceTo(s.position) < cd, rr = Math.hypot(v.x * camera.aspect, v.y);
      var target = camera.position.distanceTo(s.position) < 16 ? 0 : ((front && rr < sr * 1.15) ? 0.1 : d.base);
      d.cur += (target - d.cur) * Math.min(1, dt * 3); s.material.opacity = d.cur;
    });
    requestAnimationFrame(tick);
  })(last);
})();

var world = new CANNON.World();
world.gravity.set(0, -30, 0);
world.solver.iterations = 8;
world.broadphase = new CANNON.SAPBroadphase(world);
world.allowSleep = true;
var mat = new CANNON.Material("m");
world.addContactMaterial(new CANNON.ContactMaterial(mat, mat, { friction: 0.3, restitution: 0.25 }));

var W, H, zeroG = false, items = [], pending = [], lastSpawn = 0, walls = [], ceiling = null;
function rand(a, b) { return a + Math.random() * (b - a); }

var yaw = 0, pitch = 0, dist = 30, base = 30, zoom = 1, pointers = {}, pinch = null, orbit = null, frame3d = null, tgt = new THREE.Vector3();
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function updateCam() {
  dist = base / zoom;
  var lim = R * clamp(zoom - 0.9, 0, 1);
  if (tgt.length() > lim) tgt.setLength(lim);
  camera.position.set(tgt.x + dist * Math.sin(yaw) * Math.cos(pitch), tgt.y + dist * Math.sin(pitch), tgt.z + dist * Math.cos(yaw) * Math.cos(pitch));
  camera.lookAt(tgt);
}
function fit() {
  W = window.innerWidth; H = window.innerHeight;
  var a = W / H;
  camera.aspect = a;
  var half = Math.min(FOV / 2 * Math.PI / 180, Math.atan(Math.tan(FOV / 2 * Math.PI / 180) * a)) * 0.9;
  base = (R + 0.4) / Math.sin(half);
  updateCam();
  camera.updateProjectionMatrix();
  renderer.setSize(W, H, false);
  var r = heading.getBoundingClientRect();
  controls.style.top = (r.bottom + 6) + "px";
}
function buildWalls() {
  if (walls.length) return;
  var N = 140, up = new CANNON.Vec3(0, 0, 1);
  for (var i = 0; i < N; i++) {
    var y = 1 - 2 * (i + 0.5) / N, r = Math.sqrt(1 - y * y), th = i * 2.399963;
    var n = new CANNON.Vec3(-r * Math.cos(th), -y, -r * Math.sin(th));
    var b = new CANNON.Body({ mass: 0, material: mat });
    b.addShape(new CANNON.Plane());
    b.quaternion.setFromVectors(up, n);
    b.position.set(-n.x * R, -n.y * R, -n.z * R);
    world.addBody(b); walls.push(b);
  }
  frame3d = new THREE.Group();
  frame3d.add(new THREE.Mesh(new THREE.SphereGeometry(R, 48, 32), new THREE.MeshBasicMaterial({ color: 0xffb6d3, transparent: true, opacity: 0.18, side: THREE.BackSide, depthWrite: false })));
  frame3d.add(new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.SphereGeometry(R, 24, 16)), new THREE.LineBasicMaterial({ color: 0xf06292, transparent: true, opacity: 0.3 })));
  scene.add(frame3d);
}

function pillGeo(w, h) {
  var bs = 0.07, bt = 0.07, iw = w - 2 * bs, ih = h - 2 * bs, r = ih / 2, x = -iw / 2, y = -ih / 2, d = TH - 2 * bt;
  var s = new THREE.Shape();
  s.moveTo(x + r, y); s.lineTo(x + iw - r, y);
  s.absarc(x + iw - r, y + r, r, -Math.PI / 2, Math.PI / 2, false);
  s.lineTo(x + r, y + ih);
  s.absarc(x + r, y + r, r, Math.PI / 2, Math.PI * 1.5, false);
  var g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: true, bevelThickness: bt, bevelSize: bs, bevelSegments: 2, curveSegments: 14 });
  g.translate(0, 0, -d / 2); return g;
}

function createPills() {
  var m = document.createElement("canvas").getContext("2d");
  var font = "700 " + (PH * 0.38 * PX) + "px Battambang, 'Khmer Sangam MN', 'Noto Sans Khmer', Outfit, sans-serif";
  var count = Math.min(MESSAGES.length, 56);
  var list = MESSAGES.slice().sort(function () { return Math.random() - 0.5; }).slice(0, count);
  list.forEach(function (text, i) {
    m.font = font;
    /* iOS/Safari can under-measure Khmer: take the larger of advance width and glyph bounding box, then add a safety margin */
    var mt = m.measureText(text);
    var bb = (mt.actualBoundingBoxLeft || 0) + (mt.actualBoundingBoxRight || 0);
    var tw = Math.max(mt.width, bb) * 1.08;
    var w = Math.max(2.8, tw / PX + 1.3);
    var color = new THREE.Color(COLORS[Math.floor(Math.random() * COLORS.length)].toLowerCase());
    var light = (0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b) > 0.5;
    var cv = document.createElement("canvas"); cv.width = Math.ceil(w * PX); cv.height = Math.ceil(PH * PX);
    var cx = cv.getContext("2d"); cx.font = font; cx.textAlign = "center"; cx.textBaseline = "middle"; cx.direction = "ltr";
    cx.fillStyle = light ? "#101012" : "#ffffff"; cx.fillText(text, cv.width / 2, cv.height / 2 + 2);
    var tex = new THREE.CanvasTexture(cv); tex.anisotropy = 4;
    var group = new THREE.Group();
    group.add(new THREE.Mesh(pillGeo(w, PH), new THREE.MeshStandardMaterial({ color: color, roughness: 0.4, metalness: 0.05 })));
    var tm = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
    var front = new THREE.Mesh(new THREE.PlaneGeometry(w, PH), tm); front.position.z = TH / 2 + 0.004;
    var back = new THREE.Mesh(new THREE.PlaneGeometry(w, PH), tm); back.position.z = -TH / 2 - 0.004; back.rotation.y = Math.PI;
    group.add(front, back); scene.add(group);
    var ol = new THREE.Mesh(pillGeo(w + 0.34, PH + 0.34), new THREE.MeshBasicMaterial({ color: 0xffb300 }));
    ol.scale.z = 0.9; ol.visible = false; ol.raycast = function () {}; group.add(ol); group.userData.outline = ol;
    group.userData.glow = [];
    var body = new CANNON.Body({ mass: 1, material: mat, linearDamping: 0.01, angularDamping: 0.15 });
    body.addShape(new CANNON.Box(new CANNON.Vec3(w / 2, PH / 2, TH / 2)));
    body.position.set(0, R * 0.55, 0);
    body.quaternion.setFromEuler(0, 0, rand(-Math.PI, Math.PI), "XYZ");
    group.userData.body = body;
    group.visible = false; pending.push({ group: group, body: body, w: w, text: text });
  });
}

/* drag */
var ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), dragPlane = new THREE.Plane(), hitPt = new THREE.Vector3();
var mouseBody = new CANNON.Body({ mass: 0 }); world.addBody(mouseBody);
var joint = null, dragging = null;
function setRay(e) { ndc.set(e.clientX / W * 2 - 1, -(e.clientY / H) * 2 + 1); ray.setFromCamera(ndc, camera); }
function pdist() { var k = Object.keys(pointers), a = pointers[k[0]], b = pointers[k[1]]; return Math.hypot(a.x - b.x, a.y - b.y) || 1; }
function pmid() { var k = Object.keys(pointers), a = pointers[k[0]], b = pointers[k[1]]; return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; }
function pan(dx, dy) {
  var k = 2 * dist * Math.tan(FOV / 2 * Math.PI / 180) / H;
  camera.updateMatrixWorld();
  tgt.addScaledVector(new THREE.Vector3().setFromMatrixColumn(camera.matrix, 0), -dx * k);
  tgt.addScaledVector(new THREE.Vector3().setFromMatrixColumn(camera.matrix, 1), dy * k);
}
canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); });
canvas.addEventListener("pointerdown", function (e) {
  if (reading) return;
  pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
  if (Object.keys(pointers).length === 2) { release(); orbit = null; var mp = pmid(); pinch = { d: pdist(), z: zoom, x: mp.x, y: mp.y }; return; }
  if (pinch) return;
  if (e.button === 2 || e.shiftKey) { orbit = { x: e.clientX, y: e.clientY, pan: true }; canvas.setPointerCapture(e.pointerId); return; }
  setRay(e);
  var hits = ray.intersectObjects(items.map(function (i) { return i.group; }), true);
  if (!hits.length) { orbit = { x: e.clientX, y: e.clientY, yaw: yaw, pitch: pitch }; canvas.setPointerCapture(e.pointerId); return; }
  var o = hits[0].object; while (o && !o.userData.body) o = o.parent;
  if (!o) return;
  var b = o.userData.body, p = hits[0].point;
  canvas.setPointerCapture(e.pointerId);
  dragPlane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(new THREE.Vector3()).negate(), p);
  mouseBody.position.set(p.x, p.y, p.z);
  var local = b.pointToLocalFrame ? b.pointToLocalFrame(new CANNON.Vec3(p.x, p.y, p.z)) : new CANNON.Vec3(p.x - b.position.x, p.y - b.position.y, p.z - b.position.z);
  joint = new CANNON.PointToPointConstraint(b, local, mouseBody, new CANNON.Vec3(0, 0, 0), 600);
  world.addConstraint(joint); dragging = b; b.wakeUp();
});
canvas.addEventListener("pointermove", function (e) {
  if (pointers[e.pointerId]) { pointers[e.pointerId].x = e.clientX; pointers[e.pointerId].y = e.clientY; }
  if (pinch) {
    zoom = clamp(pinch.z * pdist() / pinch.d, 0.5, 3); dist = base / zoom;
    var mp = pmid(); pan(mp.x - pinch.x, mp.y - pinch.y); pinch.x = mp.x; pinch.y = mp.y;
    updateCam(); return;
  }
  if (orbit && orbit.pan) { pan(e.clientX - orbit.x, e.clientY - orbit.y); orbit.x = e.clientX; orbit.y = e.clientY; updateCam(); return; }
  if (orbit) {
    yaw = orbit.yaw - (e.clientX - orbit.x) * 0.006;
    pitch = clamp(orbit.pitch + (e.clientY - orbit.y) * 0.005, -1.3, 1.3);
    updateCam(); return;
  }
  if (!joint) return;
  setRay(e);
  if (ray.ray.intersectPlane(dragPlane, hitPt)) { mouseBody.position.set(hitPt.x, hitPt.y, hitPt.z); dragging.wakeUp(); }
});
function release() { orbit = null; if (joint) { world.removeConstraint(joint); joint = null; dragging = null; } }
function up(e) { delete pointers[e.pointerId]; if (Object.keys(pointers).length < 2) pinch = null; release(); }
canvas.addEventListener("pointerup", up);
canvas.addEventListener("pointercancel", up);
canvas.addEventListener("wheel", function (e) { e.preventDefault(); if (reading) return; zoom = clamp(zoom * Math.exp(-e.deltaY * 0.0015), 0.5, 3); updateCam(); }, { passive: false });

/* buttons */
btnG.addEventListener("click", function () {
  zeroG = !zeroG;
  if (zeroG) {
    world.gravity.set(0, 0, 0);
    items.forEach(function (it) {
      var b = it.body;
      b.linearDamping = 0.002; b.wakeUp();
      b.velocity.set(rand(-6, 6), rand(-6, 6), rand(-6, 6)); b.angularVelocity.set(rand(-1.5, 1.5), rand(-1.5, 1.5), rand(-1.5, 1.5));
    });
    btnG.textContent = "បើកទំនាញវិញ";
  } else {
    world.gravity.set(0, -30, 0);
    items.forEach(function (it) { it.body.linearDamping = 0.01; it.body.wakeUp(); });
    btnG.textContent = "គ្មានទំនាញ";
  }
});
btnE.addEventListener("click", function () {
  var k = 0.8;
  items.forEach(function (it) {
    var a = rand(0, Math.PI * 2), s = rand(14, 34) * k, b = it.body;
    b.wakeUp();
    var u = rand(-1, 1), q = Math.sqrt(1 - u * u);
    b.velocity.set(q * Math.cos(a) * s, u * s + (zeroG ? 0 : rand(6, 14)), q * Math.sin(a) * s);
    b.angularVelocity.set(rand(-8, 8), rand(-8, 8), rand(-8, 8));
  });
});

/* select + read */
var reading = null, selected = null, down = null, HOME = new THREE.Vector3(0, R * 0.25, 0), YAX = new THREE.Vector3(0, 1, 0);
var rv = new THREE.Vector3(), rr = new THREE.Vector3(), ru = new THREE.Vector3(), rp = new THREE.Vector3(), rq = new THREE.Quaternion(), rs = new THREE.Quaternion();
var readBtn = document.createElement("button");
readBtn.type = "button"; readBtn.textContent = "អាន";
readBtn.style.cssText = "position:fixed;top:calc(env(safe-area-inset-top,0px) + 14px);right:clamp(16px,3vw,40px);z-index:6;display:none;background:#ff4d8d;color:#fff;border-color:#ff4d8d;box-shadow:0 6px 20px rgba(255,77,141,.4)";
document.body.appendChild(readBtn);
heading.style.transition = "opacity .5s";
function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
function ensureGlow(it) {
  var u = it.group.userData; if (u.glow.length) return;
  [[4.4, 40], [1.8, 16]].forEach(function (cfg) {
    var S = 48, pw = it.w + 0.34, ph = PH + 0.34, cw = Math.ceil((pw + cfg[0]) * S), ch = Math.ceil((ph + cfg[0]) * S), OFF = 4000;
    var c = document.createElement("canvas"); c.width = cw; c.height = ch; var x = c.getContext("2d");
    var r = ph * S / 2, x0 = (cw - pw * S) / 2 - OFF, y0 = (ch - ph * S) / 2;
    x.shadowColor = "#fff"; x.shadowBlur = cfg[1]; x.shadowOffsetX = OFF; x.fillStyle = "#fff";
    for (var k = 0; k < 3; k++) {
      x.beginPath(); x.moveTo(x0 + r, y0); x.lineTo(x0 + pw * S - r, y0); x.arc(x0 + pw * S - r, y0 + r, r, -Math.PI / 2, Math.PI / 2);
      x.lineTo(x0 + r, y0 + ph * S); x.arc(x0 + r, y0 + r, r, Math.PI / 2, Math.PI * 1.5); x.fill();
    }
    var tex = new THREE.CanvasTexture(c);
    var m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide, opacity: 0.8 });
    var mesh = new THREE.Mesh(new THREE.PlaneGeometry(cw / S, ch / S), m); mesh.raycast = function () {};
    u.outline.add(mesh); u.glow.push(m);
  });
}
function select(it) {
  if (it) ensureGlow(it);
  if (selected) selected.group.userData.outline.visible = false;
  selected = it;
  if (it) it.group.userData.outline.visible = true;
  readBtn.style.display = it ? "block" : "none";
}
function startRead() {
  var it = selected; if (!it || reading) return;
  reading = { item: it, phase: "in", t0: performance.now(), dur: 1500, z0: zoom, z1: Math.max(0.5, Math.min(zoom, 0.65)), tg0: tgt.clone(), p0: it.group.position.clone(), q0: it.group.quaternion.clone(), dir: Math.random() < 0.5 ? 1 : -1, rot: new THREE.Quaternion(), vx: 0, vy: 0, drag: null };
  it.held = true; world.removeBody(it.body); release();
  readBtn.textContent = "បិទ"; heading.style.opacity = "0.12";
}
function closeRead() {
  if (!reading || reading.phase !== "shown") return;
  var r = reading, g = r.item.group;
  r.phase = "out"; r.t0 = performance.now(); r.dur = 900; r.zf = zoom; r.pf = g.position.clone(); r.qf = g.quaternion.clone(); r.sf = g.scale.x; r.dir = -r.dir;
  readBtn.textContent = "អាន"; heading.style.opacity = "";
}
var RB = [0xff2d2d, 0xff8a00, 0xffe600, 0x22d13a, 0x1e90ff, 0x4b3bff, 0xb43bff].map(function (c) { return new THREE.Color(c); }), gc = new THREE.Color();
function glowStep(now) {
  if (!selected) return;
  var k = (now / 600) % 7, i = Math.floor(k), u = selected.group.userData, pulse = 0.5 + 0.5 * Math.sin(now * 0.003);
  gc.copy(RB[i]).lerp(RB[(i + 1) % 7], k - i);
  u.outline.material.color.copy(gc);
  u.glow[0].color.copy(gc); u.glow[0].opacity = 0.5 + 0.35 * pulse;
  u.glow[1].color.copy(gc); u.glow[1].opacity = 0.4 + 0.4 * pulse;
}
var qa = new THREE.Quaternion(), qb = new THREE.Quaternion();
function spinBy(r, ax, ay) { qa.setFromAxisAngle(ru, ax); qb.setFromAxisAngle(rr, ay); r.rot.premultiply(qa).premultiply(qb); }
function readStep(now) {
  if (!reading) return;
  var r = reading, it = r.item, g = it.group;
  var t = Math.min(1, (now - r.t0) / r.dur), e = ease(t), shown = r.phase === "shown";
  if (r.phase === "in") { zoom = r.z0 + (r.z1 - r.z0) * e; tgt.copy(r.tg0).multiplyScalar(1 - e); }
  else if (r.phase === "out") { zoom = r.zf + (r.z0 - r.zf) * e; }
  updateCam(); camera.updateMatrixWorld();
  camera.getWorldDirection(rv);
  rr.setFromMatrixColumn(camera.matrixWorld, 0); ru.setFromMatrixColumn(camera.matrixWorld, 1);
  var dd = dist * 0.4, visW = 2 * dd * Math.tan(FOV / 2 * Math.PI / 180) * camera.aspect, sT = clamp(0.82 * visW / it.w, 0.8, 2.2);
  rp.copy(camera.position).addScaledVector(rv, dd);
  if (shown) {
    if (!r.drag && (Math.abs(r.vx) > 1e-4 || Math.abs(r.vy) > 1e-4)) { spinBy(r, r.vx, r.vy); r.vx *= 0.95; r.vy *= 0.95; }
    g.position.copy(rp).addScaledVector(ru, Math.sin(now * 0.0015) * 0.15); g.quaternion.copy(r.rot).multiply(camera.quaternion); g.scale.setScalar(sT); return;
  }
  var th = e * 4 * Math.PI * r.dir, sw = Math.sin(Math.PI * e) * R * 0.45;
  rs.setFromAxisAngle(YAX, 4 * Math.PI * (1 - e) * r.dir);
  if (r.phase === "in") {
    g.position.lerpVectors(r.p0, rp, e).addScaledVector(rr, Math.cos(th) * sw).addScaledVector(ru, Math.sin(th) * sw);
    rq.copy(r.q0).slerp(camera.quaternion, e); g.quaternion.copy(rs).multiply(rq);
    g.scale.setScalar(1 + (sT - 1) * e);
    if (t >= 1) r.phase = "shown";
  } else {
    g.position.lerpVectors(r.pf, HOME, e).addScaledVector(rr, Math.cos(th) * sw).addScaledVector(ru, Math.sin(th) * sw);
    rs.setFromAxisAngle(YAX, 4 * Math.PI * e * r.dir);
    rq.copy(r.qf).slerp(r.q0, e); g.quaternion.copy(rs).multiply(rq);
    g.scale.setScalar(r.sf + (1 - r.sf) * e);
    if (t >= 1) {
      var b = it.body, q = g.quaternion;
      b.position.set(HOME.x, HOME.y, HOME.z); b.velocity.set(0, 0, 0); b.angularVelocity.set(0, 0, 0);
      b.quaternion.set(q.x, q.y, q.z, q.w); world.addBody(b); b.wakeUp();
      it.held = false; g.scale.setScalar(1); reading = null;
    }
  }
}
readBtn.addEventListener("click", function () { if (reading) closeRead(); else startRead(); });
canvas.addEventListener("pointerdown", function (e) {
  if (reading) {
    if (reading.phase === "shown") {
      setRay(e);
      if (ray.intersectObject(reading.item.group, true).length) { reading.drag = { x: e.clientX, y: e.clientY }; reading.vx = 0; reading.vy = 0; canvas.setPointerCapture(e.pointerId); }
      else closeRead();
    }
    return;
  }
  if (Object.keys(pointers).length > 1 || e.button === 2 || e.shiftKey) { down = null; return; }
  setRay(e);
  var hits = ray.intersectObjects(items.map(function (i) { return i.group; }), true), hit = null;
  if (hits.length) { var o = hits[0].object; while (o && !o.userData.body) o = o.parent; items.forEach(function (i) { if (i.group === o) hit = i; }); }
  down = { it: hit, x: e.clientX, y: e.clientY, t: performance.now(), moved: false };
});
canvas.addEventListener("pointermove", function (e) {
  if (reading && reading.drag) {
    var dx = (e.clientX - reading.drag.x) * 0.01, dy = (e.clientY - reading.drag.y) * 0.01;
    reading.drag.x = e.clientX; reading.drag.y = e.clientY;
    spinBy(reading, dx, dy); reading.vx = dx; reading.vy = dy; return;
  }
  if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) down.moved = true;
});
canvas.addEventListener("pointerup", function () {
  if (reading && reading.drag) reading.drag = null;
  if (down && !down.moved && !reading && performance.now() - down.t < 600) select(down.it);
  down = null;
});

var rt;
window.addEventListener("resize", function () {
  clearTimeout(rt);
  rt = setTimeout(function () {
    fit();
  }, 80);
});

var last = 0;
function frame(now) {
  requestAnimationFrame(frame);
  var dt = Math.min((now - (last || now)) / 1000, 0.05); last = now;
  world.step(1 / 60, dt, 3);
  if (pending.length && now - lastSpawn > 55) {
    lastSpawn = now;
    var n0 = pending.shift(), m0 = Math.max(0, R * 0.8 - n0.w / 2 - 0.5);
    n0.body.position.set(rand(-1, 1) * m0, R * 0.55, rand(-1, 1) * 2);
    n0.body.quaternion.setFromEuler(rand(-0.6, 0.6), rand(-0.6, 0.6), rand(-Math.PI, Math.PI), "XYZ");
    world.addBody(n0.body); n0.group.visible = true; items.push(n0);
  }
  for (var i = 0; i < items.length; i++) {
    var it = items[i], b = it.body, p = b.position;
    if (it.held) continue;
    if (p.length() > R + 2) {
      b.position.set(rand(-2, 2), R * 0.4, rand(-2, 2)); b.velocity.set(0, 0, 0); b.angularVelocity.set(0, 0, 0);
    }
    it.group.position.set(p.x, p.y, p.z);
    it.group.quaternion.set(b.quaternion.x, b.quaternion.y, b.quaternion.z, b.quaternion.w);
  }
  glowStep(now); readStep(now);
  bg.rotation.y = now * 0.000008;
  hearts.forEach(function (h) {
    var d = h.userData;
    h.position.y = d.y + Math.sin(now * 0.0006 * d.s + d.p) * 1.5;
    h.position.x = d.x + Math.cos(now * 0.0004 * d.s + d.p) * 0.8;
  });
  renderer.render(scene, camera);
}

function start() { fit(); buildWalls(); createPills(); requestAnimationFrame(frame); }
var started = false;
function go() { if (!started) { started = true; start(); } }
if (document.fonts && document.fonts.load) {
  var sample = MESSAGES.join(" ");
  Promise.all([document.fonts.load("700 40px Battambang", sample), document.fonts.load("400 40px Battambang", "នី")]).then(function () { return document.fonts.ready; }).then(go, go);
  setTimeout(go, 6000);
} else go();
})();


/* background music */
(function () {
  var bgm = new Audio("audio/song.mp3");
  bgm.loop = true; bgm.preload = "auto"; bgm.volume = 0.7;
  var btn = document.getElementById("bgmBtn"), wanted = true, started = false;
  function sync() { btn.textContent = (started && !bgm.paused) ? "🔊" : "🔇"; }
  function start() {
    if (!wanted) return;
    var pr = bgm.play();
    if (pr && pr.then) pr.then(function () { started = true; sync(); unbind(); }, function () { sync(); });
  }
  var evs = ["pointerdown", "touchend", "keydown"];
  function unbind() { evs.forEach(function (n) { window.removeEventListener(n, first, true); }); }
  function first(e) { if (e.target === btn) return; start(); }
  evs.forEach(function (n) { window.addEventListener(n, first, true); });
  btn.addEventListener("click", function () {
    if (!bgm.paused) { wanted = false; bgm.pause(); } else { wanted = true; start(); }
    sync();
  });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) bgm.pause(); else if (wanted && started) bgm.play().catch(function () {});
  });
  start();
})();
