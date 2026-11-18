// The home server as a lit model: the layers a request passes on its way to this website, played on a clock inside the walkthrough panel. three.js (vendor/three, MIT).
const root = document.documentElement;

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const inOut = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const rad = (d) => (d * Math.PI) / 180;

// The story's beats, as fractions of the whole story. Every pause between two beats is a frame that has
// to read on its own, because that is where a reader stops.
const BEAT = {
  open: [0.08, 0.40],        // the model comes apart, top layer first
  dial: [0.46, 0.58],        // the tunnel dials out from the host
  rain: [0.60, 0.80],        // traffic arrives; most of it stops
  ride: [0.70, 0.84],        // the one wanted request rides the tunnel down
  reveal: [0.82, 0.94],      // the layers lift away and the containers stand up
};
// Which caption is lit at each point: the layers in turn as they separate, then the path of the request.
const CAPTION_AT = [[0.10, 0], [0.17, 1], [0.24, 2], [0.31, 3], [0.38, 4], [0.46, 3], [0.60, 0], [0.66, 1], [0.72, 2], [0.77, 3], [0.83, 4]];

export async function create(holder, names, onLayer) {
  const T = await import('./vendor/three/three.module.min.js');
  const css = (name, fb) => getComputedStyle(root).getPropertyValue(name).trim() || fb;
  await Promise.race([document.fonts.load('500 40px "Inter"'), new Promise((r) => setTimeout(r, 1200))]).catch(() => {});

  const canvas = document.createElement('canvas');
  canvas.className = 'stage-canvas';
  holder.prepend(canvas);
  const phone = () => innerWidth < 735;
  const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;

  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(22, 1, 0.5, 80);

  // A small studio for the model to reflect: one big soft box overhead, a cool strip to one side and
  // a low warm fill. It is only ever seen as highlights on the bevelled edges.
  {
    const room = new T.Scene();
    const wall = new T.Mesh(new T.BoxGeometry(30, 30, 30), new T.MeshBasicMaterial({ color: 0x05080c, side: T.BackSide }));
    room.add(wall);
    const panel = (w, h, col, pos, look) => {
      const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: new T.Color(...col), side: T.DoubleSide }));
      m.position.set(...pos); m.lookAt(...look); room.add(m);
    };
    panel(16, 10, [2.6, 2.9, 3.3], [0, 12, 2], [0, 0, 0]);
    panel(4, 12, [1.5, 2.2, 2.6], [-13, 3, -4], [0, 0, 0]);
    panel(10, 3, [0.7, 0.85, 1.0], [9, 1, 12], [0, 0, 0]);
    const pmrem = new T.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(room, 0.04).texture;
    scene.environmentIntensity = 1.0;
    pmrem.dispose();
  }
  await new Promise((r) => setTimeout(r, 0));

  const key = new T.DirectionalLight(0xdfeaff, 3.4);
  key.position.set(-3.2, 12, 3.4);
  key.castShadow = true;
  const sm = phone() ? 1024 : 2048;
  key.shadow.mapSize.set(sm, sm);
  Object.assign(key.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 34 });
  key.shadow.radius = 7; key.shadow.blurSamples = 16; key.shadow.bias = -0.0006; key.shadow.normalBias = 0.02;
  scene.add(key, key.target);
  scene.add(new T.HemisphereLight(0x9fb6d4, 0x101822, 0.9));

  const mint = new T.Color(css('--accent', '#50e8c0'));
  const danger = new T.Color(css('--danger', '#f08c84'));
  const body = new T.Color(css('--surface', '#1c232d'));
  const dim = new T.Color(css('--text-2', '#a0a5ac'));

  // A rounded slab with softened edges, lying flat with its base at y = 0.
  function slab(w, d, h, r, holes = []) {
    const s = new T.Shape();
    const x = -w / 2, y = -d / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0);
    s.lineTo(x + w, y + d - r); s.absarc(x + w - r, y + d - r, r, 0, Math.PI / 2);
    s.lineTo(x + r, y + d); s.absarc(x + r, y + d - r, r, Math.PI / 2, Math.PI);
    s.lineTo(x, y + r); s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5);
    for (const [hx, hz, hr] of holes) { const p = new T.Path(); p.absarc(hx, -hz, hr, 0, Math.PI * 2, true); s.holes.push(p); }
    const b = Math.min(0.035, h / 3);
    const g = new T.ExtrudeGeometry(s, { depth: h - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 4, curveSegments: 14 });
    g.rotateX(-Math.PI / 2);
    g.translate(0, b, 0);
    return g;
  }
  const solid = (hex, rough, metal) => new T.MeshStandardMaterial({ color: hex, roughness: rough, metalness: metal });
  const mesh = (g, m, cast = true) => { const o = new T.Mesh(g, m); o.castShadow = cast; o.receiveShadow = true; return o; };

  const W = 4.0, D = 2.6;                 // the host's footprint
  const TX = -0.5, TZ = 0.62;             // where the tunnel comes up, straight above this website
  const H_HOST = 0.42, H_FW = 0.16, H_CF = 0.1;

  // ---- Host: the server, with its eight services set into the top --------------------------------
  const host = new T.Group();
  const hostMat = solid(0x2a3442, 0.5, 0.35);
  host.add(mesh(slab(W, D, H_HOST, 0.3), hostMat));
  const order = [1, 0, 2, 3, 4, 5, 6, 7]; // this website sits second in the front row, under the tunnel
  const modules = [];
  const MW = 0.84, MD = 1.02, MH = 0.2;
  function label(text, accent) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 512 * (MD / MW) | 0;
    const g = c.getContext('2d');
    g.fillStyle = accent ? css('--accent', '#50e8c0') : css('--text-pill', '#d6dbe3');
    g.globalAlpha = accent ? 1 : 0.9;
    g.textBaseline = 'middle';
    const words = text.split(' ');
    const lines = [];
    let size = 86;
    g.font = `600 ${size}px "Inter", sans-serif`;
    // One line if it fits, otherwise break at the dot or the middle space. This website's stays on one.
    if (accent || g.measureText(text).width <= c.width - 96) lines.push(text);
    else { const cut = words.indexOf('·') > 0 ? words.indexOf('·') : Math.ceil(words.length / 2); lines.push(words.slice(0, cut).join(' '), words.slice(cut).join(' ').replace(/^· /, '')); }
    while (Math.max(...lines.map((l) => g.measureText(l).width)) > c.width - 96 && size > 40) { size -= 4; g.font = `600 ${size}px "Inter", sans-serif`; }
    lines.forEach((l, i) => g.fillText(l, 52, c.height - 70 - (lines.length - 1 - i) * size * 1.2));
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return t;
  }
  names.forEach((name, n) => {
    const slot = order.indexOf(n);
    const col = slot % 4, row = slot < 4 ? 1 : 0; // row 1 is the front row
    const g = new T.Group();
    g.position.set(-W / 2 + 0.26 + MW / 2 + col * (MW + 0.04), H_HOST - MH + 0.02, row ? 0.62 : -0.62 + 0.0);
    const accent = n === 0;
    const mat = solid(accent ? 0x24383b : 0x364252, 0.5, 0.25);
    mat.emissive = accent ? mint.clone() : new T.Color(0x000000); mat.emissiveIntensity = 0;
    g.add(mesh(slab(MW, MD, MH, 0.1), mat));
    const text = new T.Mesh(new T.PlaneGeometry(MW, MD), new T.MeshBasicMaterial({ map: label(name, accent), transparent: true, depthWrite: false, toneMapped: false, opacity: 0 }));
    text.rotation.x = -Math.PI / 2; text.position.y = MH + 0.004;
    g.add(text);
    let edge = null;
    if (accent) {
      // Lit, it gets a thin mint outline and its name in mint; it never becomes a bright block.
      const o = 0.012, sh = new T.Shape(), hx = MW / 2 - 0.03, hz = MD / 2 - 0.03, r = 0.085, hole = new T.Path();
      const rr = (path, a, b, q) => { path.moveTo(-a + q, -b); path.lineTo(a - q, -b); path.absarc(a - q, -b + q, q, -Math.PI / 2, 0); path.lineTo(a, b - q); path.absarc(a - q, b - q, q, 0, Math.PI / 2); path.lineTo(-a + q, b); path.absarc(-a + q, b - q, q, Math.PI / 2, Math.PI); path.lineTo(-a, -b + q); path.absarc(-a + q, -b + q, q, Math.PI, Math.PI * 1.5); };
      rr(sh, hx, hz, r); rr(hole, hx - o, hz - o, r - o); sh.holes.push(hole);
      edge = new T.Mesh(new T.ShapeGeometry(sh, 16), new T.MeshBasicMaterial({ color: mint, transparent: true, opacity: 0, toneMapped: false, depthWrite: false, side: T.DoubleSide }));
      edge.rotation.x = -Math.PI / 2; edge.position.y = MH + 0.006;
      g.add(edge);
    }
    host.add(g);
    modules.push({ g, mat, text, accent, slot, edge, name: name.toLowerCase() });
  });
  const site = modules.find((m) => m.accent);
  site.g.position.x = TX; site.g.position.z = TZ; // exact, so the tunnel lands in its middle
  scene.add(host);

  // Plex is the one service the internet reaches without the tunnel: the router forwards 32400 to it. Its port
  // sits at a point of the field outside the Cloudflare pane, straight above the Plex module.
  const plexMod = modules.find((m) => m.name.indexOf('plex') === 0);
  const PX = TX - 4 * 0.3, PZ = TZ;
  const isPlexPort = (x, z) => !!plexMod && Math.abs(x - PX) < 0.01 && Math.abs(z - PZ) < 0.01;

  // ---- Firewall: a wall of closed ports. Two are open: the tunnel's way out, and 32400 for Plex ----
  const fw = new T.Group();
  const fwMat = solid(0x2c3644, 0.6, 0.3);
  fw.add(mesh(slab(W, D, H_FW, 0.3, [[TX, TZ, 0.17]].concat(plexMod ? [[PX, PZ, 0.12]] : [])), fwMat, false));
  {
    // One closed port under every point of the internet above it, except the tunnel's and Plex's.
    const list = [];
    for (let x = TX - 4 * 0.3; x <= W / 2 - 0.25; x += 0.3) for (let z = TZ - 5 * 0.3; z <= D / 2 - 0.25; z += 0.3) {
      if (Math.abs(x - TX) < 0.01 && Math.abs(z - TZ) < 0.01) continue;
      if (isPlexPort(x, z)) continue;
      list.push([x, z]);
    }
    const ports = new T.InstancedMesh(new T.CylinderGeometry(0.052, 0.052, 0.014, 24), solid(0x1a222d, 0.7, 0.2), list.length);
    const m = new T.Matrix4();
    list.forEach(([x, z], i) => { m.makeTranslation(x, H_FW + 0.004, z); ports.setMatrixAt(i, m); });
    ports.receiveShadow = true;
    fw.add(ports); fw.userData.ports = ports;
    const rim = new T.Mesh(new T.TorusGeometry(0.19, 0.022, 10, 48), new T.MeshStandardMaterial({ color: 0x2a3644, roughness: 0.4, metalness: 0.6, emissive: mint, emissiveIntensity: 0 }));
    rim.rotation.x = Math.PI / 2; rim.position.set(TX, H_FW + 0.005, TZ);
    fw.add(rim); fw.userData.rim = rim;
    if (plexMod) {
      const prim = new T.Mesh(new T.TorusGeometry(0.14, 0.02, 10, 40), new T.MeshStandardMaterial({ color: 0x3a3226, roughness: 0.4, metalness: 0.6, emissive: new T.Color(0xffb454), emissiveIntensity: 0 }));
      prim.rotation.x = Math.PI / 2; prim.position.set(PX, H_FW + 0.005, PZ);
      fw.add(prim); fw.userData.prim = prim;
    }
  }
  scene.add(fw);

  // ---- Cloudflare: a pane of glass over this website's way in. Plex traffic goes round it, straight to 32400.
  const CW = 2.9, CD = 1.9, CX = TX + 0.35, CZ = TZ - 0.3;
  const cf = new T.Group();
  const cfMat = new T.MeshPhysicalMaterial({ color: 0x9fc0e0, roughness: 0.22, metalness: 0, transparent: true, opacity: 0.2, clearcoat: 1, clearcoatRoughness: 0.2, depthWrite: false });
  const pane = mesh(slab(CW, CD, H_CF, 0.26), cfMat);
  pane.position.set(CX, 0, CZ); pane.receiveShadow = false;
  cf.add(pane);
  const ringMat = new T.MeshBasicMaterial({ color: 0xcfe0f2, transparent: true, opacity: 0.1, depthWrite: false, toneMapped: false, side: T.DoubleSide });
  for (const r of [0.3, 0.56, 0.82]) {
    const ring = new T.Mesh(new T.RingGeometry(r - 0.006, r + 0.006, 72), ringMat);
    ring.rotation.x = -Math.PI / 2; ring.position.set(TX, H_CF + 0.004, TZ);
    cf.add(ring);
  }
  scene.add(cf);

  // ---- Tunnel: a glass sleeve around one thread of light that starts at the host and goes up ------
  const tunnel = new T.Group();
  const sleeveMat = new T.MeshPhysicalMaterial({ color: 0xa8c8e4, roughness: 0.15, transparent: true, opacity: 0.22, clearcoat: 1, depthWrite: false, emissive: mint, emissiveIntensity: 0 });
  const sleeve = new T.Mesh(new T.CylinderGeometry(0.15, 0.15, 1, 40, 1, true), sleeveMat);
  const collarMat = new T.MeshStandardMaterial({ color: 0x33404f, roughness: 0.35, metalness: 0.7 });
  const collarA = mesh(new T.TorusGeometry(0.15, 0.03, 12, 48), collarMat, false), collarB = collarA.clone();
  collarA.rotation.x = collarB.rotation.x = Math.PI / 2;
  tunnel.add(sleeve, collarA, collarB);
  tunnel.position.set(TX, 0, TZ);
  scene.add(tunnel);
  const threadMat = new T.MeshBasicMaterial({ color: mint, toneMapped: false });
  const thread = new T.Mesh(new T.CylinderGeometry(0.022, 0.022, 1, 12), threadMat);
  thread.position.set(TX, 0, TZ);
  scene.add(thread);
  const glowMat = new T.MeshBasicMaterial({ color: mint, transparent: true, opacity: 0.16, toneMapped: false, depthWrite: false });
  const glow = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 1, 16), glowMat);
  glow.position.copy(thread.position);
  scene.add(glow);

  // ---- Internet: a loose field of points. Some of them are requests, and they fall. ---------------
  const STEP = 0.3, dots = [];
  for (let x = TX - 6 * STEP; x <= 2.21; x += STEP) for (let z = TZ - 7 * STEP; z <= 1.5; z += STEP) dots.push([x, z]);
  const net = new T.InstancedMesh(new T.SphereGeometry(0.024, 10, 8), new T.MeshBasicMaterial({ color: dim.clone().multiplyScalar(0.62), toneMapped: false, transparent: true, opacity: 0 }), dots.length);
  scene.add(net);
  // A fixed shuffle, so the same requests fall in the same order every time.
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const overPane = ([x, z]) => Math.abs(x - CX) < CW / 2 - 0.12 && Math.abs(z - CZ) < CD / 2 - 0.12;
  const pick = dots.map((d, i) => i).filter((i) => !(Math.abs(dots[i][0] - TX) < 0.01 && Math.abs(dots[i][1] - TZ) < 0.01) && !isPlexPort(dots[i][0], dots[i][1]) && dots[i][0] > TX - 4.5 * STEP && Math.abs(dots[i][0]) < W / 2 - 0.2 && Math.abs(dots[i][1]) < D / 2 - 0.2).sort(() => rnd() - 0.5).slice(0, 22);
  const wanted = dots.findIndex(([x, z]) => Math.abs(x - TX) < 0.01 && Math.abs(z - TZ) < 0.01);
  const packets = pick.map((i, n) => ({ i, at: BEAT.rain[0] + (n / pick.length) * (BEAT.rain[1] - BEAT.rain[0] - 0.07), toPane: overPane(dots[i]) }));
  // Instance packets.length is the wanted request on the tunnel; packets.length + 1 is the one Plex accepts.
  const balls = new T.InstancedMesh(new T.SphereGeometry(0.05, 16, 12), new T.MeshBasicMaterial({ toneMapped: false }), packets.length + 2);
  const amber = new T.Color(0xffb454);
  balls.instanceMatrix.setUsage(T.DynamicDrawUsage);
  scene.add(balls);
  const pale = new T.Color(css('--text', '#f0f6fd')).multiplyScalar(0.9);

  // ---- The ground only catches the shadow ---------------------------------------------------------
  const ground = new T.Mesh(new T.PlaneGeometry(30, 30), new T.ShadowMaterial({ opacity: 0.22 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; ground.receiveShadow = true;
  scene.add(ground);

  // ---- One pose per progress value ----------------------------------------------------------------
  const M = new T.Matrix4(), Q = new T.Quaternion(), S = new T.Vector3(), P = new T.Vector3(), C = new T.Color();
  const lit = [0, 0, 0, 0, 0]; // how strongly each layer is picked out: internet, cloudflare, firewall, tunnel, host
  let W_px = 1, H_px = 1, px = 0, activeCaption = -2, focus = null, focusName = '', sway = 0;

  function pose(p) {
    const open = inOut(BEAT.open[0], BEAT.open[1], p);
    const dial = inOut(BEAT.dial[0], BEAT.dial[1], p);
    const reveal = inOut(BEAT.reveal[0], BEAT.reveal[1], p);
    const ride = clamp((p - BEAT.ride[0]) / (BEAT.ride[1] - BEAT.ride[0]));
    // The layers part from the top down: each one starts a little after the one above it.
    const part = (k) => inOut(BEAT.open[0] + k * 0.05, BEAT.open[1] - (2 - k) * 0.05, p);
    const tall = camera.aspect < 1; // a phone held upright
    const lift = reveal * (tall ? 2.7 : 2.25);
    const yFW = H_HOST + lerp(0.07, 1.0, part(2)) + lift;
    const yCF = yFW + H_FW + lerp(0.06, 0.92, part(1)) + lift * 0.25;
    const yNet = yCF + H_CF + lerp(0.08, 0.9, part(0)) + lift * 0.2;
    fw.position.y = yFW; cf.position.y = yCF;

    // Tunnel: the sleeve sits between the host and the wall, the thread grows out of the host.
    const span = yFW - H_HOST;
    const sl = Math.min(0.62, span * 0.7) * lerp(1, 0.9, reveal);
    const mid = H_HOST + Math.min(span / 2, 0.55 + lift * 0.1);
    sleeve.scale.y = Math.max(0.01, sl); sleeve.position.y = mid;
    collarA.position.y = mid + sl / 2; collarB.position.y = mid - sl / 2;
    tunnel.visible = span > 0.12;
    const topY = yCF + H_CF * 0.5;
    const len = Math.max(0.001, (topY - H_HOST) * dial);
    thread.scale.y = glow.scale.y = len; thread.position.y = glow.position.y = H_HOST + len / 2;
    thread.visible = glow.visible = dial > 0.002;
    fw.userData.rim.material.emissiveIntensity = 1.6 * smooth(0.4, 0.75, dial);

    // The field of points, and the requests that leave it.
    dots.forEach(([x, z], i) => { M.makeTranslation(x, yNet, z); net.setMatrixAt(i, M); });
    net.instanceMatrix.needsUpdate = true;
    const fallLen = 0.085;
    packets.forEach((k, n) => {
      const [x, z] = dots[k.i];
      const t = clamp((p - k.at) / fallLen);
      const floorY = (k.toPane ? yCF + H_CF : yFW + H_FW + 0.014) + 0.05;
      const y = lerp(yNet, floorY, t * t);                    // falls like something dropped
      const gone = smooth(1, 1.5, (p - k.at) / fallLen);     // then it is refused, and fades
      const s = t <= 0 ? 0.001 : (1 - gone) * lerp(0.7, 1, t);
      P.set(x, y, z); S.set(s * (1 + gone * 0.9), s * (1 - gone * 0.6), s * (1 + gone * 0.9));
      M.compose(P, Q, S); balls.setMatrixAt(n, M);
      balls.setColorAt(n, C.copy(pale).lerp(danger, smooth(0.9, 1.25, (p - k.at) / fallLen)));
    });
    // The wanted one comes down on to the glass, straight on to the thread, and rides it to the host.
    {
      const drop = clamp((p - (BEAT.ride[0] - 0.06)) / 0.06);
      const down = inOut(0.12, 1, ride);
      const y = drop < 1 ? lerp(yNet, topY + 0.05, drop * drop) : lerp(topY + 0.05, H_HOST + 0.06, down);
      const s = drop <= 0 ? 0.001 : lerp(1.15, 0.9, down) * (1 - smooth(0.96, 1, ride));
      P.set(TX, y, TZ); S.setScalar(s); M.compose(P, Q, S);
      balls.setMatrixAt(packets.length, M); balls.setColorAt(packets.length, mint);
    }
    // One request goes round the pane, straight down through 32400, and Plex takes it.
    if (plexMod) {
      const pt = clamp((p - 0.63) / 0.1);
      const y = lerp(yNet, H_HOST + 0.07, pt * pt);
      const s = pt <= 0 ? 0.001 : lerp(1, 0.85, pt) * (1 - smooth(0.9, 1, pt));
      P.set(PX, y, PZ); S.setScalar(Math.max(0.001, s)); M.compose(P, Q, S);
      balls.setMatrixAt(packets.length + 1, M); balls.setColorAt(packets.length + 1, C.copy(pale).lerp(amber, smooth(0.3, 0.8, pt)));
      fw.userData.prim.material.emissiveIntensity = 1.2 * smooth(0.4, 0.75, dial) + 0.8 * Math.sin(Math.PI * clamp((p - 0.66) / 0.05));
    }
    balls.instanceMatrix.needsUpdate = true; balls.instanceColor.needsUpdate = true;

    // The services stand up out of the host once the layers have lifted, and this website lights.
    const arrive = smooth(0.9, 1, ride);
    modules.forEach((m) => {
      const up = inOut(0, 1, clamp(reveal * 1.5 - m.slot * 0.045));
      m.g.position.y = H_HOST - MH + 0.02 + up * 0.13;
      m.text.material.opacity = smooth(0.35, 0.95, up);
      if (m.accent) { m.mat.emissiveIntensity = 0.1 * arrive; m.edge.material.opacity = arrive; }
      else { const on = focusName && m.name.indexOf(focusName) === 0; m.mat.emissive.copy(on ? mint : C.setScalar(0)); m.mat.emissiveIntensity = on ? 0.16 : 0; if (on) m.g.position.y += 0.07; }
    });
    glowMat.opacity = 0.16 + 0.1 * arrive;

    // Which layer is being talked about gets a little more light.
    const story = CAPTION_AT.reduce((a, [at, i]) => (p >= at ? i : a), -1);
    const final = p >= BEAT.reveal[1] - 0.02;
    const want = final ? 4 : story;
    lit.forEach((v, i) => { lit[i] = focus ? (focus.includes(i) ? 2.6 : 0) : (i === story && !final ? 1 : 0); });
    net.material.color.copy(dim).multiplyScalar(lerp(0.62, 1.0, lit[0]));
    net.material.opacity = smooth(BEAT.open[0], BEAT.open[0] + 0.1, p); // sealed, the model shows no traffic at all
    cfMat.opacity = lerp(0.2, 0.34, lit[1]); ringMat.opacity = lerp(0.1, 0.3, lit[1]);
    fwMat.emissive.setScalar(0.035 * lit[2]);
    sleeveMat.emissiveIntensity = 0.5 * lit[3]; sleeveMat.opacity = lerp(0.22, 0.4, lit[3]);
    hostMat.emissive.setScalar(0.03 * lit[4]);
    const fade = 1 - smooth(0.15, 0.75, reveal);
    for (const m of [fwMat, fw.userData.ports.material, fw.userData.rim.material]) { m.transparent = fade < 1; m.opacity = fade; }
    fw.visible = cf.visible = fade > 0.01;
    cfMat.opacity *= fade; ringMat.opacity *= fade; net.material.opacity *= fade;
    if (!focus && want !== activeCaption) { activeCaption = want; onLayer([want]); }

    // Camera: starts looking down on the closed block, comes round and lower as it opens, then
    // moves in on the host for the ending. Distance is whatever fits the model in the canvas.
    const az = rad(lerp(lerp(26, 40, open), 16, reveal) + sway);
    const el = rad(lerp(lerp(40, 23, open), 40, reveal));
    const ty = lerp(lerp(0.3, yNet * 0.5, open), 0.55, reveal);
    const tx = lerp(0, TX * 0.35, reveal), tz = lerp(0, 0.2, reveal);
    const radius = lerp(lerp(2.55, 3.05, open), tall ? 2.25 : 1.95, reveal) * (tall ? 0.94 : 1);
    const half = rad(camera.fov / 2);
    const fit = radius * (H_px < 230 ? 0.9 : 1) / Math.sin(Math.atan(Math.tan(half) * Math.min(1, camera.aspect)));
    camera.position.set(tx + fit * Math.sin(az) * Math.cos(el), ty + fit * Math.sin(el), tz + fit * Math.cos(az) * Math.cos(el));
    camera.lookAt(tx, ty, tz);
    key.target.position.set(0, ty, 0);
  }

  function resize() {
    const r = holder.getBoundingClientRect();
    W_px = Math.max(1, Math.round(r.width)); H_px = Math.max(1, Math.round(r.height));
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setSize(W_px, H_px, false);
    camera.aspect = W_px / H_px;
    camera.updateProjectionMatrix();
  }

  // ---- Time in, picture out: the story runs towards whichever point the reader has reached ----------
  let frame = 0, running = false, shown = 0, target = 0, last = 0, t0 = 0;
  const RATE = 0.19; // of the whole story per second
  function update(now) {
    frame = 0;
    if (!running) return;
    const ms = last ? Math.min(60, now - last) : 16.7;
    last = now;
    const d = target - shown, step = RATE * ms / 1000;
    shown = Math.abs(d) <= step ? target : shown + Math.sign(d) * step;
    drag += (dragAim - drag) * (1 - Math.exp(-ms / (dragging ? 70 : 900)));
    sway = Math.sin((now - t0) / 2600) * 5 + drag; // a slow turn, so the model always reads as solid
    pose(shown);
    renderer.render(scene, camera);
    frame = requestAnimationFrame(update);
  }
  new ResizeObserver(() => { resize(); }).observe(holder);
  let lost = false, drag = 0, dragAim = 0, dragging = false, dragX = 0;
  canvas.addEventListener('pointerdown', (e) => { dragging = true; dragX = e.clientX; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => { if (!dragging) return; dragAim = Math.max(-80, Math.min(80, dragAim - (e.clientX - dragX) * 0.4)); dragX = e.clientX; });
  const release = () => { dragging = false; dragAim = 0; };
  canvas.addEventListener('pointerup', release); canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); lost = true; running = false; holder.dispatchEvent(new Event('stage3d:lost')); });

  resize();
  pose(0);
  // Hand the page a frame between the heavy steps, and let shaders compile in the background where the browser can.
  await new Promise((r) => setTimeout(r, 0));
  try { await renderer.compileAsync(scene, camera); } catch (e) { renderer.compile(scene, camera); }
  await new Promise((r) => setTimeout(r, 0));
  renderer.render(scene, camera);
  canvas.classList.add('is-ready');
  return {
    start() { if (lost || running) return; running = true; last = 0; t0 = performance.now(); resize(); frame = requestAnimationFrame(update); },
    stop() { running = false; if (frame) cancelAnimationFrame(frame); frame = 0; },
    reset() { shown = 0; target = 0; activeCaption = -2; },
    setTarget(p) { target = p; },
    setFocus(layers, name) { focus = layers && layers.length ? layers : null; focusName = name || ''; if (focus) onLayer(focus); else { activeCaption = -2; } },
    progress() { return shown; },
  };
}

