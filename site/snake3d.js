// Retro Snake Arena, as a small lit model: one board, the player's snake in mint, bot snakes around it.
// It runs on its own clock while its panel is open. three.js (vendor/three, MIT).
const rad = (d) => (d * Math.PI) / 180;

export async function create(holder) {
  const T = await import('./vendor/three/three.module.min.js');
  const css = (name, fb) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fb;

  const canvas = document.createElement('canvas');
  holder.prepend(canvas);
  const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;

  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(22, 1, 0.5, 80);
  {
    const room = new T.Scene();
    room.add(new T.Mesh(new T.BoxGeometry(30, 30, 30), new T.MeshBasicMaterial({ color: 0x05080c, side: T.BackSide })));
    const panel = (w, h, col, pos) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: new T.Color(...col), side: T.DoubleSide })); m.position.set(...pos); m.lookAt(0, 0, 0); room.add(m); };
    panel(16, 10, [2.6, 2.9, 3.3], [0, 12, 2]); panel(4, 12, [1.5, 2.2, 2.6], [-13, 3, -4]); panel(10, 3, [0.7, 0.85, 1.0], [9, 1, 12]);
    const pmrem = new T.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(room, 0.04).texture;
    pmrem.dispose();
  }
  await new Promise((r) => setTimeout(r, 0));
  const key = new T.DirectionalLight(0xdfeaff, 3.2);
  key.position.set(-3.2, 12, 3.4); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 34 });
  key.shadow.radius = 6; key.shadow.blurSamples = 16; key.shadow.bias = -0.0006; key.shadow.normalBias = 0.02;
  scene.add(key, key.target, new T.HemisphereLight(0x9fb6d4, 0x101822, 0.9));

  const mint = new T.Color(css('--accent', '#4fe3c1'));

  function slab(w, d, h, r) {
    const s = new T.Shape(), x = -w / 2, y = -d / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0);
    s.lineTo(x + w, y + d - r); s.absarc(x + w - r, y + d - r, r, 0, Math.PI / 2);
    s.lineTo(x + r, y + d); s.absarc(x + r, y + d - r, r, Math.PI / 2, Math.PI);
    s.lineTo(x, y + r); s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5);
    const b = Math.min(0.03, h / 3);
    const g = new T.ExtrudeGeometry(s, { depth: h - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 4, curveSegments: 12 });
    g.rotateX(-Math.PI / 2); g.translate(0, b, 0);
    return g;
  }
  const N = 14, CELL = 0.3, SIZE = N * CELL + 0.5, TOP = 0.26;
  const at = (i) => (i - (N - 1) / 2) * CELL;

  const boardMat = new T.MeshStandardMaterial({ color: 0x232c38, roughness: 0.55, metalness: 0.3 });
  const part = (g, m, x = 0, y = 0, z = 0) => { const o = new T.Mesh(g, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; scene.add(o); return o; };
  part(slab(SIZE + 0.5, SIZE + 0.5, 0.16, 0.42), new T.MeshStandardMaterial({ color: 0x171e28, roughness: 0.6, metalness: 0.3 }), 0, -0.16, 0); // the step it stands on
  part(slab(SIZE, SIZE, TOP, 0.34), boardMat);
  // A low wall round the edge, so the floor sits down inside it.
  const rimMat = new T.MeshStandardMaterial({ color: 0x33415a, roughness: 0.45, metalness: 0.35 });
  const RIM = SIZE / 2 - 0.09;
  part(slab(SIZE - 0.1, 0.13, 0.15, 0.06), rimMat, 0, TOP, -RIM); part(slab(SIZE - 0.1, 0.13, 0.15, 0.06), rimMat, 0, TOP, RIM);
  part(slab(0.13, SIZE - 0.36, 0.15, 0.06), rimMat, -RIM, TOP, 0); part(slab(0.13, SIZE - 0.36, 0.15, 0.06), rimMat, RIM, TOP, 0);
  // The floor: one tile per cell in two tones, every other one a touch higher.
  const tiles = new T.InstancedMesh(slab(CELL - 0.03, CELL - 0.03, 0.03, 0.045), new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7, metalness: 0.12 }), N * N);
  const M = new T.Matrix4(), P = new T.Vector3(), Q = new T.Quaternion(), S = new T.Vector3();
  const toneA = new T.Color(0x2c3848), toneB = new T.Color(0x374559);
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const odd = (i + j) % 2;
    M.makeTranslation(at(i), TOP + (odd ? 0.014 : 0), at(j)); tiles.setMatrixAt(i * N + j, M); tiles.setColorAt(i * N + j, odd ? toneB : toneA);
  }
  tiles.receiveShadow = true;
  scene.add(tiles);
  // Maze walls on cells no snake uses: rounded blocks of different heights.
  const wallMat = new T.MeshStandardMaterial({ color: 0x4a5c78, roughness: 0.4, metalness: 0.25 });
  const capMat = new T.MeshStandardMaterial({ color: 0x5f7596, roughness: 0.35, metalness: 0.2 });
  [[6, 4, 0.22], [7, 4, 0.34], [8, 4, 0.22], [9, 8, 0.4], [4, 10, 0.26], [5, 10, 0.18], [8, 11, 0.2], [9, 11, 0.3], [12, 7, 0.24], [12, 8, 0.36], [3, 3, 0.3], [3, 4, 0.2], [12, 1, 0.26], [1, 10, 0.3], [1, 11, 0.2]].forEach(([i, j, h]) => {
    part(slab(CELL - 0.05, CELL - 0.05, h, 0.06), wallMat, at(i), TOP + 0.02, at(j));
    part(slab(CELL - 0.11, CELL - 0.11, 0.03, 0.05), capMat, at(i), TOP + 0.02 + h, at(j));
  });

  // Each snake walks a closed loop of grid corners at a steady speed.
  const loops = [
    { pts: [[2, 2], [11, 2], [11, 6], [7, 6], [7, 10], [11, 10], [11, 12], [2, 12], [2, 8], [4, 8], [4, 5], [2, 5]], len: 9, speed: 2.5, player: true },
    { pts: [[5, 3], [9, 3], [9, 5], [5, 5]], len: 5, speed: 1.9 },
    { pts: [[8, 7], [10, 7], [10, 9], [8, 9]], len: 4, speed: -1.6 },
    { pts: [[3, 9], [6, 9], [6, 11], [3, 11]], len: 5, speed: 2.1 },
    { pts: [[0, 0], [13, 0], [13, 13], [0, 13]], len: 7, speed: -2.3 },
    { pts: [[5, 6], [6, 6], [6, 8], [5, 8]], len: 3, speed: 1.5 },
  ];
  // A snake is one smooth, chubby tube with a big round head. The face is drawn on, toy-style: two dark shiny
  // eyes set wide and low, a small smile and pink cheeks, tipped up so it looks at whoever is looking down.
  const R = 0.118, PER = 6; // body radius, beads per grid cell (close enough that no joints show)
  const bead = new T.SphereGeometry(R, 24, 18);
  const tints = [0x3fd9b5, 0x6fa8ff, 0xb48cff, 0xff9d6b, 0xff7fae, 0xffd257];
  const white = new T.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  const dark = new T.MeshStandardMaterial({ color: 0x1a1f2b, roughness: 0.15, metalness: 0.1 });
  const blush = new T.MeshBasicMaterial({ color: 0xff8fb0, transparent: true, opacity: 0.8, toneMapped: false });
  const HR = R * 1.62;
  const snakes = loops.map((l, n) => {
    const legs = l.pts.map((p, i) => { const q = l.pts[(i + 1) % l.pts.length]; return { a: p, b: q, d: Math.abs(q[0] - p[0]) + Math.abs(q[1] - p[1]) }; });
    const total = legs.reduce((s, g) => s + g.d, 0);
    const tint = new T.Color(tints[n % tints.length]);
    const mat = new T.MeshStandardMaterial({ color: tint, roughness: 0.42, metalness: 0, emissive: tint, emissiveIntensity: 0.16 });
    const count = l.len * PER;
    const mesh = new T.InstancedMesh(bead, mat, count);
    mesh.castShadow = true; mesh.receiveShadow = true; mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    scene.add(mesh);
    const face = new T.Group();
    const skull = new T.Mesh(new T.SphereGeometry(HR, 32, 24), mat); skull.scale.set(1.04, 0.94, 1.04); skull.castShadow = true;
    face.add(skull);
    const look = new T.Group(); look.rotation.x = -0.62; // tip the face up towards the viewer
    for (const sx of [-1, 1]) {
      const eye = new T.Mesh(new T.SphereGeometry(0.036, 18, 14), dark); eye.position.set(sx * 0.082, 0.012, HR * 0.9); eye.scale.set(1, 1.18, 0.55);
      const glint = new T.Mesh(new T.SphereGeometry(0.012, 10, 8), white); glint.position.set(sx * 0.082 + 0.011, 0.03, HR * 0.9 + 0.017);
      const cheek = new T.Mesh(new T.SphereGeometry(0.03, 14, 10), blush); cheek.position.set(sx * 0.132, -0.04, HR * 0.72); cheek.scale.set(1, 0.7, 0.35);
      look.add(eye, glint, cheek);
    }
    const smile = new T.Mesh(new T.TorusGeometry(0.026, 0.0065, 8, 16, Math.PI), dark);
    smile.rotation.z = Math.PI; smile.position.set(0, -0.03, HR * 0.97);
    look.add(smile);
    face.add(look);
    scene.add(face);
    return { ...l, legs, total, mesh, count, face, turn: null, phase: n * 3.7 };
  });
  const A1 = new T.Vector3(), A2 = new T.Vector3();
  function corner(s, d, out) {
    d = ((d % s.total) + s.total) % s.total;
    for (const g of s.legs) { if (d <= g.d) { const t = g.d ? d / g.d : 0; out.set(at(g.a[0] + (g.b[0] - g.a[0]) * t), 0, at(g.a[1] + (g.b[1] - g.a[1]) * t)); return; } d -= g.d; }
  }
  // The route's square corners are rounded off, so the body curves round them instead of snapping.
  function along(s, d, out) { corner(s, d - 0.32, A1); corner(s, d + 0.32, A2); out.copy(A1).add(A2).multiplyScalar(0.5); }

  // Food: a few small lights on free cells.
  // They sit on the player's route, so the snake eats each one as it passes and it grows back a moment later.
  const food = [[6, 2], [11, 4], [7, 8], [5, 12], [3, 8]].map(([i, j]) => {
    const m = new T.Mesh(new T.OctahedronGeometry(0.095, 0), new T.MeshStandardMaterial({ color: 0x9ff5df, roughness: 0.15, metalness: 0.1, emissive: mint, emissiveIntensity: 0.9, flatShading: true }));
    m.position.set(at(i), TOP + 0.3, at(j)); m.userData.eaten = -99; scene.add(m); return m;
  });
  const head = new T.Vector3();
  let ate = -99;
  // Spin the board like a fidget spinner: drag turns it under the pointer, a flick sets it spinning,
  // and it coasts down on its own. It never snaps back.
  let spin = 0, vel = 0, dragging = false, dragX = 0, dragT = 0;
  const DEG_PER_PX = 0.45;
  canvas.addEventListener('pointerdown', (e) => { dragging = true; vel = 0; dragX = e.clientX; dragT = performance.now(); canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const now = performance.now(), d = -(e.clientX - dragX) * DEG_PER_PX, dt = Math.max(1, now - dragT);
    spin += d;
    vel = vel * 0.6 + (d / dt) * 1000 * 0.4; // degrees a second, smoothed over the last few moves
    dragX = e.clientX; dragT = now;
  });
  const release = () => { if (!dragging) return; dragging = false; if (performance.now() - dragT > 90) vel = 0; vel = Math.max(-1400, Math.min(1400, vel)); };
  canvas.addEventListener('pointerup', release); canvas.addEventListener('pointercancel', release);

  const ground = new T.Mesh(new T.PlaneGeometry(30, 30), new T.ShadowMaterial({ opacity: 0.28 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.18; ground.receiveShadow = true;
  scene.add(ground);

  function resize() {
    const r = holder.getBoundingClientRect();
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setSize(Math.max(1, Math.round(r.width)), Math.max(1, Math.round(r.height)), false);
    camera.aspect = Math.max(1, r.width) / Math.max(1, r.height);
    camera.updateProjectionMatrix();
  }

  let frame = 0, running = false, t0 = 0, zoom = 0, zoomAim = 0, last = 0;
  function draw(now) {
    const t = (now - t0) / 1000;
    snakes.forEach((s, n) => {
      const dir = Math.sign(s.speed), d0 = s.phase + t * s.speed;
      for (let k = 0; k < s.count; k++) {
        along(s, d0 - dir * (k + 1) / PER, P);
        const u = k / (s.count - 1);
        const w = Math.max(0, (u - 0.55) / 0.45), sc = 1 - 0.62 * w * w * (3 - 2 * w); // even all the way, then a short soft tail
        P.y = TOP + 0.03 + R * sc * 0.95 + 0.008 * Math.sin(t * 4 - k * 0.3 + n); // a small ripple down the body
        S.setScalar(sc); M.compose(P, Q, S); s.mesh.setMatrixAt(k, M);
      }
      s.mesh.instanceMatrix.needsUpdate = true;
      // The head looks where it is going, and turns smoothly at corners.
      along(s, d0, P); along(s, d0 + dir * 0.25, A1);
      const want = Math.atan2(A1.x - P.x, A1.z - P.z);
      if (s.turn === null) s.turn = want;
      let diff = want - s.turn; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      s.turn += diff * 0.22;
      s.face.position.set(P.x, TOP + 0.03 + HR * 0.9 + 0.012 * Math.sin(t * 3 + n), P.z);
      s.face.rotation.y = s.turn;
      s.face.rotation.z = 0.09 * Math.sin(t * 2.2 + n * 2); // a slight happy tilt
    });
    const player = snakes[0];
    along(player, player.phase + t * player.speed, head);
    food.forEach((f, i) => {
      if (t - f.userData.eaten > 2.6 && Math.hypot(f.position.x - head.x, f.position.z - head.z) < 0.13) { f.userData.eaten = t; ate = t; }
      const back = Math.min(1, Math.max(0, (t - f.userData.eaten - 2.1) / 0.5));
      f.scale.setScalar(Math.max(0.001, back * back * (3 - 2 * back)));
      f.rotation.y = t * 1.6 + i; f.position.y = TOP + 0.26 + 0.035 * Math.sin(t * 2.4 + i * 1.7);
    });
    player.mesh.material.emissiveIntensity = 0.16 + 0.6 * Math.max(0, 1 - (t - ate) / 0.6); // a flash down its length when it eats
    const ms = last ? Math.min(60, now - last) : 16.7; last = now;
    zoom += (zoomAim - zoom) * (1 - Math.exp(-ms / 700));
    if (!dragging && vel) { spin += vel * ms / 1000; vel *= Math.exp(-ms / 1500); if (Math.abs(vel) < 2) vel = 0; }
    const az = rad(34 + Math.sin(t / 2.6) * 7 + spin), el = rad(36 - zoom * 6);
    const fit = (2.95 - zoom * 0.5) / Math.sin(Math.atan(Math.tan(rad(camera.fov / 2)) * Math.min(1, camera.aspect)));
    camera.position.set(fit * Math.sin(az) * Math.cos(el), 0.2 + fit * Math.sin(el), fit * Math.cos(az) * Math.cos(el));
    camera.lookAt(0, 0.15, 0);
    renderer.render(scene, camera);
  }
  function update(now) { frame = 0; if (!running) return; draw(now); frame = requestAnimationFrame(update); }
  let lost = false, dead = false;
  const ro = new ResizeObserver(resize); ro.observe(holder);
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); if (dead) return; lost = true; running = false; holder.dispatchEvent(new Event('stage3d:lost')); });

  resize();
  await new Promise((r) => setTimeout(r, 0));
  try { await renderer.compileAsync(scene, camera); } catch (e) { /* compiles on first paint instead */ }
  await new Promise((r) => setTimeout(r, 0));
  t0 = performance.now(); draw(t0);
  return {
    start() { if (lost || dead || running) return; running = true; last = 0; resize(); frame = requestAnimationFrame(update); },
    stop() { running = false; if (frame) cancelAnimationFrame(frame); frame = 0; },
    reset() { zoom = 0; zoomAim = 0; },
    setTarget(p) { zoomAim = p; },
    setFocus() {},
    spin() { return { spin, vel }; },
    destroy() { dead = true; running = false; if (frame) cancelAnimationFrame(frame); ro.disconnect(); renderer.dispose(); renderer.forceContextLoss(); canvas.remove(); },
  };
}
