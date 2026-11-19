// Patchwork: a cork pinboard on a wooden easel, seen almost face on. Photos, notes and a star get pinned up one at
// a time. A ball of yarn sits on the rug in front with its needles, the thread trailing off across the floor.
import { kit, TINT, sm } from './kit3d.js?v=20261118e';

export async function create(holder) {
  const K = await kit(holder, { az: 12, el: 9, sway: 6, fit: 1.72, lookY: 1.2, lead: 7, loop: 22 });
  const { T } = K;
  K.add(new T.CylinderGeometry(1.95, 1.95, 0.04, 64), K.std(0x4a3550, { roughness: 0.95, metalness: 0 }), 0, 0.02, 0.2); // the rug
  K.add(new T.CylinderGeometry(1.6, 1.6, 0.045, 64), K.std(0x5d4366, { roughness: 0.95, metalness: 0 }), 0, 0.022, 0.2);

  const wood = K.std(0xc9955f, { roughness: 0.7, metalness: 0 });
  const leg = (x, z, rz, rx) => { const l = K.add(new T.CylinderGeometry(0.045, 0.045, 2.75, 12), wood, x, 1.35, z); l.rotation.set(rx, 0, rz); };
  leg(-1.0, -0.42, -0.1, -0.12); leg(1.0, -0.42, 0.1, -0.12); leg(0, -0.95, 0, 0.3); // all behind the board
  const board = new T.Group(); board.position.set(0, 0.55, -0.12); board.rotation.x = -0.12; K.scene.add(board);
  K.add(K.slab(2.86, 0.09, 2.02, 0.04), K.std(0xf3e6d2, { roughness: 0.8, metalness: 0 }), 0, 0, -0.03, board); // frame
  K.add(K.slab(2.66, 0.09, 1.82, 0.04), K.std(0xd9ad7c, { roughness: 0.95, metalness: 0 }), 0, 0.1, 0.02, board); // cork
  K.add(K.slab(2.9, 0.2, 0.07, 0.03), wood, 0, -0.07, 0.1, board); // the ledge it rests on

  const paper = K.std(0xfbfaf6, { roughness: 0.8, metalness: 0 });
  const pin = (g, c) => { const p = K.add(new T.SphereGeometry(0.045, 14, 10), K.soft(c, 0.3), 0, 0.05, 0, g); p.userData.pin = 1; return p; };
  function photo(w, d, color, art) {
    const g = new T.Group();
    K.add(K.slab(w, d, 0.03, 0.03), paper, 0, 0, 0, g);
    K.add(K.slab(w - 0.12, d - 0.24, 0.01, 0.02), K.soft(color, 0.1), 0, 0.03, -0.05, g);
    if (art === 'sun') K.add(new T.CylinderGeometry(0.08, 0.08, 0.012, 20), K.soft(TINT.sun, 0.3), 0.14, 0.04, -0.12, g).castShadow = false;
    if (art === 'hill') { const h = K.add(new T.SphereGeometry(0.16, 18, 10), K.soft(0x57c98f, 0.1), -0.1, 0.035, 0.0, g); h.scale.set(1.3, 0.12, 0.6); h.castShadow = false; }
    pin(g, TINT.red).position.set(0, 0.05, -d / 2 + 0.07);
    return g;
  }
  function note(color) {
    const g = new T.Group(); K.add(K.slab(0.5, 0.5, 0.02, 0.03), K.soft(color, 0.12), 0, 0, 0, g);
    for (let i = 0; i < 3; i++) K.add(K.slab(0.3 - i * 0.07, 0.025, 0.006, 0.01), K.std(0x4a3550), -0.04 - i * 0.03, 0.02, -0.08 + i * 0.1, g).castShadow = false;
    pin(g, TINT.blue).position.set(0, 0.04, -0.19); return g;
  }
  function star() {
    const s = new T.Shape();
    for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.08 : 0.19, a = (i / 10) * Math.PI * 2; i ? s.lineTo(Math.sin(a) * r, Math.cos(a) * r) : s.moveTo(Math.sin(a) * r, Math.cos(a) * r); }
    const geo = new T.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.015, bevelSegments: 3 }); geo.rotateX(-Math.PI / 2);
    const g = new T.Group(); K.add(geo, K.soft(TINT.sun, 0.25), 0, 0.02, 0, g); return g;
  }
  function swatches() { const g = new T.Group(); [TINT.mint, TINT.lav, TINT.peach].forEach((c, i) => K.add(new T.CylinderGeometry(0.1, 0.1, 0.03, 24), K.soft(c, 0.14), (i - 1) * 0.25, 0.015, 0, g)); return g; }
  // x across the board, y up it, a little turn each: nobody pins things straight.
  const items = [
    [photo(0.86, 0.74, TINT.blue, 'sun'), -0.82, 1.38, 0.07],
    [photo(0.8, 0.7, TINT.peach), 0.2, 1.48, -0.06],
    [note(TINT.sun), 0.95, 1.5, 0.09],
    [photo(0.9, 0.76, TINT.mint, 'hill'), -0.1, 0.64, -0.05],
    [note(TINT.pink), -0.98, 0.6, -0.1],
    [star(), 0.66, 1.0, 0.3],
    [swatches(), 0.7, 0.5, 0.04],
  ].map(([g, x, y, turn], k) => {
    const holder = new T.Group(); holder.position.set(x, y, 0.12); holder.rotation.x = Math.PI / 2; holder.add(g); board.add(holder);
    return { holder, g, turn, at: 0.6 + k * 0.95 };
  });

  // The yarn ball, on the rug in front.
  const YR = 0.36, yarn = new T.Group(); yarn.position.set(1.6, 0.045 + YR, 1.0); K.scene.add(yarn);
  const ball = new T.Group(); ball.rotation.order = 'YXZ'; yarn.add(ball);
  const wool = K.soft(TINT.peach, 0.14);
  K.add(new T.SphereGeometry(YR, 36, 26), wool, 0, 0, 0, ball);
  const strand = K.std(0xf0865a, { roughness: 0.8, metalness: 0 });
  [[0.5, 0.3], [-0.6, 0.9], [1.25, -0.4]].forEach(([rx, rz]) => { const w = K.add(new T.TorusGeometry(YR + 0.004, 0.014, 8, 48), strand, 0, 0, 0, ball); w.rotation.set(Math.PI / 2 + rx, 0, rz); w.castShadow = false; });
  ball.add(K.face(YR));
  const needle = K.soft(TINT.lav, 0.12);
  for (const s of [-1, 1]) {
    const n = new T.Group(); n.position.set(0, YR * 0.55, -0.12); n.rotation.set(-0.5, 0, s * 0.55); yarn.add(n);
    K.add(new T.CylinderGeometry(0.02, 0.02, 1.05, 10), needle, 0, 0.2, 0, n);
    K.add(new T.SphereGeometry(0.05, 14, 10), needle, 0, 0.74, 0, n);
  }
  // The loose end, wandering off across the rug.
  const curve = new T.CatmullRomCurve3([[1.35, 0.07, 1.2], [0.6, 0.06, 1.5], [-0.1, 0.06, 1.15], [-0.7, 0.06, 1.5], [-1.25, 0.06, 1.2], [-1.5, 0.06, 0.8]].map((p) => new T.Vector3(...p)));
  K.add(new T.TubeGeometry(curve, 60, 0.016, 8), strand);

  const IN = 0.95, DONE = 0.6 + items.length * IN + 0.8, EVERY = 2.6;
  return K.run((t, az) => {
    // After the first pinning-up, a different piece every few seconds comes off the board, turns, and goes back.
    const turnNo = t > DONE ? Math.floor((t - DONE) / EVERY) : -1, phase = t > DONE ? ((t - DONE) % EVERY) / EVERY : 0;
    items.forEach((it, k) => {
      const a = sm(it.at, it.at + 0.7, t), p = 1 - Math.pow(1 - a, 3);
      const lift = turnNo >= 0 && (turnNo * 3) % items.length === k ? Math.sin(Math.PI * sm(0, 0.62, phase)) : 0;
      it.holder.position.z = 0.12 + (1 - p) * 1.3 + lift * 0.55;
      it.g.rotation.y = it.turn + (1 - p) * 0.9 + lift * 0.35;
      it.holder.scale.setScalar(Math.max(0.001, p) * (1 + 0.08 * lift));
      // A piece off the board would throw a hard dark block across it, so it casts no shadow until it is pinned.
      if (!it.meshes) { it.meshes = []; it.g.traverse((o) => { if (o.isMesh && o.castShadow) it.meshes.push(o); }); }
      const off = lift > 0.02 || p < 0.98;
      if (off !== it.shadowOff) { it.meshes.forEach((m) => { m.castShadow = !off; }); it.shadowOff = off; }
    });
    yarn.position.y = 0.045 + YR + 0.03 * Math.abs(Math.sin(t * 1.5));
    ball.rotation.y = az - 0.25; ball.rotation.x = -0.12; ball.rotation.z = 0.09 * Math.sin(t * 1.2);
  });
}
