// Shared plumbing for the small project models: renderer, light, rounded boxes and the fidget-spinner drag.
// It shares a palette and the drag, nothing else: each model builds its own stage and camera angle, and runs on its own clock. three.js (vendor/three, MIT).
import { cloud, gather, rings, margin, distance, slabHull } from './frame3d.js?v=20261118e';
const rad = (d) => (d * Math.PI) / 180;
export const TINT = { mint: 0x3fd9b5, blue: 0x6fa8ff, lav: 0xb48cff, peach: 0xff9d6b, pink: 0xff7fae, sun: 0xffd257, red: 0xff5d6c };
export const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export const pop = (x) => 1 + 2.7 * Math.pow(x - 1, 3) + 1.7 * Math.pow(x - 1, 2); // eases in with a small overshoot

export async function kit(holder, o = {}) {
  const T = await import('./vendor/three/three.module.min.js');
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
  const tick = () => new Promise((r) => setTimeout(r, 0)); // hand the page a frame between the heavy steps
  await tick();
  const key = new T.DirectionalLight(0xdfeaff, 3.2);
  key.position.set(-3.2, 12, 3.4); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 34 });
  key.shadow.radius = 6; key.shadow.blurSamples = 16; key.shadow.bias = -0.0006; key.shadow.normalBias = 0.02;
  const fill = new T.DirectionalLight(0xbcd0ff, 1.1); fill.position.set(6, 5, 7);
  const rim = new T.DirectionalLight(0xffffff, 0.7); rim.position.set(-2, 4, -8);
  scene.add(key, key.target, fill, rim, new T.HemisphereLight(0xc4d4ea, 0x1a2230, 1.5));

  // A box with rounded corners, w wide, d deep, h tall, standing on y = 0.
  function slab(w, d, h, r) {
    r = Math.max(0.001, Math.min(r, w / 2 - 0.001, d / 2 - 0.001));
    const s = new T.Shape(), x = -w / 2, y = -d / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0);
    s.lineTo(x + w, y + d - r); s.absarc(x + w - r, y + d - r, r, 0, Math.PI / 2);
    s.lineTo(x + r, y + d); s.absarc(x + r, y + d - r, r, Math.PI / 2, Math.PI);
    s.lineTo(x, y + r); s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5);
    const b = Math.min(0.03, h / 3);
    const g = new T.ExtrudeGeometry(s, { depth: h - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 4, curveSegments: 12 });
    g.rotateX(-Math.PI / 2); g.translate(0, b, 0);
    return slabHull(g, w, d, h, r, b);
  }
  const std = (color, extra = {}) => new T.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.1, ...extra });
  const soft = (color, glow = 0.16) => { const c = new T.Color(color); return new T.MeshStandardMaterial({ color: c, roughness: 0.42, metalness: 0, emissive: c, emissiveIntensity: glow }); };
  const add = (g, m, x = 0, y = 0, z = 0, parent = scene) => { const p = new T.Mesh(g, m); p.position.set(x, y, z); p.castShadow = true; p.receiveShadow = true; parent.add(p); return p; };


  // The toy face from the snakes: two dark shiny eyes set wide and low, a small smile, pink cheeks. It faces +z.
  const white = new T.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  const dark = new T.MeshStandardMaterial({ color: 0x1a1f2b, roughness: 0.15, metalness: 0.1 });
  const blush = new T.MeshBasicMaterial({ color: 0xff8fb0, transparent: true, opacity: 0.8, toneMapped: false });
  function face(r, flat) {
    const k = r / 0.191, g = new T.Group();
    for (const sx of [-1, 1]) {
      const ez = flat ? 0.012 * k : r * 0.9, cz = flat ? 0.008 * k : r * 0.72;
      const eye = new T.Mesh(new T.SphereGeometry(0.036 * k, 18, 14), dark); eye.position.set(sx * 0.082 * k, 0.012 * k, ez); eye.scale.set(1, 1.18, 0.55);
      const glint = new T.Mesh(new T.SphereGeometry(0.012 * k, 10, 8), white); glint.position.set(sx * 0.082 * k + 0.011 * k, 0.03 * k, ez + 0.017 * k);
      const cheek = new T.Mesh(new T.SphereGeometry(0.03 * k, 14, 10), blush); cheek.position.set(sx * 0.132 * k, -0.04 * k, cz); cheek.scale.set(1, 0.7, 0.35);
      g.add(eye, glint, cheek);
    }
    const smile = new T.Mesh(new T.TorusGeometry(0.026 * k, 0.0065 * k, 8, 16, Math.PI), dark);
    smile.rotation.z = Math.PI; smile.position.set(0, -0.03 * k, flat ? 0.012 * k : r * 0.97);
    g.add(smile);
    return g;
  }

  const ground = new T.Mesh(new T.PlaneGeometry(30, 30), new T.ShadowMaterial({ opacity: 0.28 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.001; ground.receiveShadow = true;
  scene.add(ground);

  // Spin it like a fidget spinner: drag turns it, a flick sets it spinning, it coasts down on its own.
  let spin = 0, vel = 0, dragging = false, dragX = 0, dragT = 0;
  canvas.addEventListener('pointerdown', (e) => { dragging = true; vel = 0; dragX = e.clientX; dragT = performance.now(); canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const now = performance.now(), d = -(e.clientX - dragX) * 0.45, dt = Math.max(1, now - dragT);
    spin += d; vel = vel * 0.6 + (d / dt) * 1000 * 0.4; dragX = e.clientX; dragT = now;
  });
  const release = () => { if (!dragging) return; dragging = false; if (performance.now() - dragT > 90) vel = 0; vel = Math.max(-1400, Math.min(1400, vel)); };
  canvas.addEventListener('pointerup', release); canvas.addEventListener('pointercancel', release);

  // Sized from the layout box, never getBoundingClientRect: that includes the panel's scale while it lifts out, and a
  // canvas sized from it stays at 94% and gets stretched (measured 2026-11-18). A transform fires no resize to fix it.
  let W = 1, H = 1;
  function resize() {
    W = Math.max(1, holder.clientWidth); H = Math.max(1, holder.clientHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
  }

  // run(draw): draw(t, az) moves the model; the kit moves the camera and paints.
  async function run(draw) {
    let frame = 0, running = false, t0 = 0, zoom = 0, zoomAim = 0, last = 0, lost = false, dead = false, began = -1e9;
    const O = { x: 0, y: 0.2, z: 0 }, L = { x: 0, y: o.lookY ?? 0.15, z: 0 }, u = { x: 0, y: 0, z: 1 };
    let reach = null; // every place the model gets to over one loop, as rings round its axis (frame3d.js)
    const memo = { el: NaN, px: NaN, W: 0, H: 0, d: 0 };
    function paint(now) {
      const t = (now - t0) / 1000;
      const ms = last ? Math.min(60, now - last) : 16.7; last = now;
      zoom += (zoomAim - zoom) * (1 - Math.exp(-ms / 700));
      if (!dragging && vel) { spin += vel * ms / 1000; vel *= Math.exp(-ms / 1500); if (Math.abs(vel) < 2) vel = 0; }
      const intro = 1 - sm(0, 1.6, (now - began) / 1000); // 1 as the panel opens, easing to 0
      const az = rad((o.az ?? 34) + Math.sin(t / 2.6) * (o.sway ?? 7) + spin - 42 * intro), el = rad((o.el ?? 36) - zoom * 6 + 9 * intro);
      draw(t, az);
      // The model's own distance, then moved back only if that would bring any part of it near an edge.
      let fit = ((o.fit ?? 2.95) - zoom * 0.5) / Math.sin(Math.atan(Math.tan(rad(camera.fov / 2)) * Math.min(1, camera.aspect)));
      if (reach) {
        // Rings look the same from every side, so the spin and the sway never change the answer: it is worked out
        // facing one fixed way, and only again when the height of the view, the zoom or the canvas changes.
        const px = margin(W, H, zoom);
        if (Math.abs(el - memo.el) > 1e-6 || Math.abs(px - memo.px) > 1e-4 || W !== memo.W || H !== memo.H) {
          u.x = 0; u.y = Math.sin(el); u.z = Math.cos(el);
          memo.d = distance(reach, camera.fov, camera.aspect, W, H, px, O, u, L, 0.6);
          memo.el = el; memo.px = px; memo.W = W; memo.H = H;
        }
        fit = Math.max(fit, memo.d);
      }
      fit *= 1 + 0.2 * intro;
      camera.position.set(fit * Math.sin(az) * Math.cos(el), 0.2 + fit * Math.sin(el), fit * Math.cos(az) * Math.cos(el));
      camera.lookAt(0, o.lookY ?? 0.15, 0);
      renderer.render(scene, camera);
    }
    function update(now) { frame = 0; if (!running) return; paint(now); frame = requestAnimationFrame(update); }
    const ro = new ResizeObserver(resize); ro.observe(holder);
    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); if (dead) return; lost = true; running = false; holder.dispatchEvent(new Event('stage3d:lost')); });
    resize(); await tick();
    // Walk the model through one loop (o.loop seconds from its starting point) and keep where every part goes.
    {
      // 48 samples a loop, or o.samples: Signal Room asks for 96 because its ring is in view for under a second.
      const cl = cloud(), n = o.samples ?? 48, from = o.lead || 0, span = o.loop ?? 20;
      // In slices of about 8 ms. Nothing in the panel moves yet, and each yield costs a whole frame, so not every sample.
      let slice = performance.now();
      for (let i = 0; i < n; i++) {
        draw(from + (span * i) / n, rad(o.az ?? 34));
        gather(T, scene, cl);
        if (performance.now() - slice > 8) { await tick(); slice = performance.now(); }
      }
      reach = rings(cl);
    }
    // Shaders compile in the background where the browser allows it, so the first picture does not freeze the page.
    try { await renderer.compileAsync(scene, camera); } catch (e) { /* compiles on first paint instead */ }
    await tick();
    t0 = performance.now() - (o.lead || 0) * 1000; paint(performance.now());
    return {
      start() { if (lost || dead || running) return; running = true; last = 0; began = performance.now(); resize(); frame = requestAnimationFrame(update); },
      stop() { running = false; if (frame) cancelAnimationFrame(frame); frame = 0; },
      reset() { zoom = 0; zoomAim = 0; },
      setTarget(p) { zoomAim = p; },
      setFocus() {},
      spin() { return { spin, vel }; },
      // Phones allow only a few 3D contexts at once, so a closed panel gives its one back.
      destroy() { dead = true; running = false; if (frame) cancelAnimationFrame(frame); ro.disconnect(); renderer.dispose(); renderer.forceContextLoss(); canvas.remove(); },
    };
  }
  return { T, scene, camera, slab, std, soft, add, face, run };
}
