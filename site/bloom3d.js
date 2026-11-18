// Bloom: a portrait of one flower in a pot on a round pastel stand, seen from low down. Seventeen puzzle tiles
// (the page's own number of puzzle types) drift round it in a slow ring and light up one after another, with no
// hurry. When all are lit the flower opens.
import { kit, TINT, sm } from './kit3d.js';

export async function create(holder) {
  const K = await kit(holder, { az: 18, el: 15, sway: 5, fit: 1.72, lookY: 1.08, lead: 5 });
  const { T } = K;
  // The stand: two soft round steps.
  K.add(new T.CylinderGeometry(1.5, 1.56, 0.12, 64), K.std(0xe6dcf7, { roughness: 0.85, metalness: 0 }), 0, 0.06, 0);
  K.add(new T.CylinderGeometry(1.0, 1.04, 0.1, 64), K.std(0xffd6e4, { roughness: 0.85, metalness: 0 }), 0, 0.17, 0);
  // The pot.
  const clay = K.std(0xf0966a, { roughness: 0.75, metalness: 0 });
  K.add(new T.CylinderGeometry(0.4, 0.29, 0.46, 40), clay, 0, 0.45, 0);
  K.add(new T.TorusGeometry(0.4, 0.05, 12, 40), clay, 0, 0.68, 0).rotation.x = Math.PI / 2;
  K.add(new T.CylinderGeometry(0.36, 0.36, 0.02, 32), K.std(0x5b4236, { roughness: 1 }), 0, 0.68, 0);

  const flower = new T.Group(); flower.position.y = 0.68; K.scene.add(flower);
  const green = K.soft(0x57c98f, 0.1);
  K.add(new T.CylinderGeometry(0.045, 0.06, 1.0, 14), green, 0, 0.5, 0, flower);
  for (const sx of [-1, 1]) { const leaf = K.add(new T.SphereGeometry(0.16, 18, 12), green, sx * 0.2, 0.34 + (sx > 0 ? 0.16 : 0), 0.02, flower); leaf.scale.set(1.5, 0.26, 0.75); leaf.rotation.z = sx * 0.55; }
  const head = new T.Group(); head.position.y = 1.12; head.rotation.order = 'YXZ'; flower.add(head);
  const R = 0.33;
  K.add(new T.SphereGeometry(R, 36, 26), K.soft(TINT.sun, 0.2), 0, 0, 0, head).scale.set(1, 1, 0.8);
  const f = K.face(R); f.scale.z = 0.8; head.add(f);
  const petalGeo = new T.SphereGeometry(0.17, 22, 16), petals = [];
  for (let i = 0; i < 10; i++) {
    const pivot = new T.Group(); pivot.rotation.order = 'ZXY'; pivot.rotation.z = (i / 10) * Math.PI * 2; pivot.position.z = -0.05;
    K.add(petalGeo, K.soft(i % 2 ? 0xffa9c8 : TINT.pink, 0.14), 0, R + 0.17, 0, pivot).scale.set(1.0, 1.7, 0.36);
    head.add(pivot); petals.push(pivot);
  }

  // Seventeen tiles in a ring, standing up, each a different pastel.
  const pastel = [TINT.mint, TINT.blue, TINT.lav, TINT.pink, TINT.peach, TINT.sun];
  const tileGeo = K.slab(0.3, 0.3, 0.08, 0.08), N = 17, dim = new T.Color(0x8c86a8), col = new T.Color();
  const tiles = [];
  for (let k = 0; k < N; k++) {
    const pivot = new T.Group(); K.scene.add(pivot);
    const m = K.add(tileGeo, K.std(0xffffff, { roughness: 0.6, metalness: 0 }), 0, 0, 1.33, pivot); m.rotation.x = Math.PI / 2;
    tiles.push({ pivot, m, tint: new T.Color(pastel[k % pastel.length]), at: 0.6 + k * 0.42 });
  }

  const C = 21;
  return K.run((t, az) => {
    const u = t % C, out = 1 - sm(18.2, 20.2, u);
    tiles.forEach((tile, k) => {
      const lit = sm(tile.at, tile.at + 0.6, u) * out, a = (k / N) * Math.PI * 2 + t * 0.14;
      tile.pivot.rotation.y = a;
      tile.pivot.position.y = 1.0 + 0.3 * Math.sin(a * 2 + t * 0.35) + 0.05 * lit;
      tile.m.material.color.copy(col.copy(dim).lerp(tile.tint, lit));
      tile.m.material.emissive.copy(tile.tint); tile.m.material.emissiveIntensity = 0.22 * lit;
      tile.m.scale.setScalar(0.78 + 0.22 * lit);
    });
    const b = sm(8.2, 11, u) * out;
    flower.rotation.z = 0.045 * Math.sin(t * 0.9);
    head.rotation.y = az; head.rotation.x = -0.18; head.rotation.z = 0.08 * Math.sin(t * 1.3);
    head.scale.setScalar(0.7 + 0.3 * b);
    petals.forEach((p, i) => { p.rotation.x = (1 - b) * 0.5; p.scale.setScalar(0.52 + 0.48 * b + 0.025 * Math.sin(t * 1.6 + i)); });
  });
}
