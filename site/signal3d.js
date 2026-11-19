// Signal Room: one dark server tower on a six-sided deck, ten lit bands round it for the ten things on that one
// machine. A small drone circles at a distance with a reading beam on the tower and never lands. When the machine
// goes, all ten bands turn red at once and a single amber ring drops round the tower: one incident, not ten alerts.
import { kit, TINT, sm, pop } from './kit3d.js?v=20261118e';

export async function create(holder) {
  const K = await kit(holder, { az: 30, el: 17, sway: 5, fit: 1.78, lookY: 1.12, lead: 1, loop: 15, samples: 96 });
  const { T } = K;
  const metal = (c) => K.std(c, { roughness: 0.35, metalness: 0.6 });
  K.add(new T.CylinderGeometry(1.75, 1.85, 0.14, 6), metal(0x121a28), 0, 0.07, 0);
  const glow = (c, o = 1) => new T.MeshBasicMaterial({ color: c, transparent: true, opacity: o, toneMapped: false });
  const deck = new T.Mesh(new T.TorusGeometry(1.42, 0.014, 8, 6), glow(TINT.mint, 0.55)); deck.rotation.x = Math.PI / 2; deck.rotation.z = Math.PI / 6; deck.position.y = 0.15; K.scene.add(deck);

  K.add(K.slab(0.98, 0.98, 2.12, 0.14), metal(0x2a3850), 0, 0.14, 0);
  K.add(K.slab(1.06, 1.06, 0.08, 0.16), metal(0x25324a), 0, 2.26, 0);
  const ok = new T.Color(TINT.mint), bad = new T.Color(TINT.red), amber = new T.Color(0xffb454), col = new T.Color();
  const bandGeo = K.slab(1.03, 1.03, 0.045, 0.15), bands = [];
  for (let i = 0; i < 10; i++) {
    const m = new T.Mesh(bandGeo, new T.MeshStandardMaterial({ color: 0x0a1018, roughness: 0.4, emissive: ok, emissiveIntensity: 1.5 }));
    m.position.y = 0.36 + i * 0.185; K.scene.add(m); bands.push(m);
  }
  const ring = new T.Mesh(new T.TorusGeometry(1.0, 0.03, 12, 72), glow(0xffb454, 0)); ring.rotation.x = Math.PI / 2; K.scene.add(ring);

  // The drone: a pale ball with a dark visor and two lit eyes, a halo under it, and a thin beam it reads with.
  const drone = new T.Group(); drone.rotation.order = 'YXZ'; K.scene.add(drone);
  const DR = 0.27;
  K.add(new T.SphereGeometry(DR, 32, 24), K.std(0xe4ebf8, { roughness: 0.35, metalness: 0.1 }), 0, 0, 0, drone);
  const visor = K.add(new T.SphereGeometry(DR * 0.8, 28, 20), K.std(0x0d131d, { roughness: 0.15, metalness: 0.4 }), 0, 0.02, DR * 0.5, drone); visor.scale.set(1.05, 0.6, 0.72);
  const eyes = [-1, 1].map((sx) => { const e = new T.Mesh(new T.SphereGeometry(0.038, 14, 10), glow(TINT.mint)); e.position.set(sx * 0.085, 0.03, DR * 1.06); e.scale.set(1, 1.25, 0.5); drone.add(e); return e; });
  const halo = new T.Mesh(new T.TorusGeometry(0.2, 0.018, 8, 36), glow(TINT.mint, 0.7)); halo.rotation.x = Math.PI / 2; halo.position.y = -DR - 0.08; drone.add(halo);
  K.add(new T.CylinderGeometry(0.012, 0.012, 0.16, 8), metal(0x8ea2c0), 0, DR + 0.07, 0, drone);
  const beam = new T.Mesh(new T.CylinderGeometry(0.012, 0.03, 1, 10, 1, true), glow(TINT.mint, 0.3)); beam.geometry.rotateX(Math.PI / 2); beam.geometry.translate(0, 0, 0.5); K.scene.add(beam);
  const aim = new T.Vector3();

  const C = 15;
  return K.run((t, az) => {
    const u = t % C, hit = sm(6, 6.1, u);
    let down = 0;
    bands.forEach((m, i) => {
      const red = hit * (1 - sm(11 + i * 0.14, 11.4 + i * 0.14, u)); down = Math.max(down, red);
      m.material.emissive.copy(col.copy(ok).lerp(bad, red));
      // Healthy: a slow breath that climbs the tower. Down: all of them flicker together.
      m.material.emissiveIntensity = (1 - red) * (0.9 + 0.7 * Math.max(0, Math.sin(t * 1.6 - i * 0.55))) + red * (1.3 + 0.6 * Math.sin(t * 9));
    });
    const r = sm(6.4, 7.3, u) * (1 - sm(11.3, 12, u));
    ring.material.opacity = r; ring.position.y = 2.9 - 1.75 * pop(r); ring.rotation.z = t * 0.5; ring.scale.setScalar(0.92 + 0.08 * Math.sin(t * 3));
    deck.material.color.copy(col.copy(ok).lerp(bad, down));
    // The drone keeps its distance, all the way round.
    const a = t * 0.42 + 0.9, jolt = sm(6.05, 6.25, u) * (1 - sm(6.25, 6.9, u));
    drone.position.set(Math.sin(a) * 1.5, 1.55 + 0.12 * Math.sin(t * 1.3) + 0.25 * jolt, Math.cos(a) * 1.5);
    drone.rotation.y = az + 0.35 * Math.sin(t * 0.7); drone.rotation.x = 0.1; // its visor is towards whoever is looking; the beam stays on the tower
    halo.material.color.copy(col.copy(ok).lerp(amber, down)); eyes.forEach((e) => e.material.color.copy(col));
    aim.set(0, 0.5 + ((t * 0.5) % 1) * 1.6, 0);
    beam.position.copy(drone.position); beam.lookAt(aim);
    beam.scale.set(1, 1, Math.max(0.01, drone.position.distanceTo(aim) - 0.5));
    beam.material.color.copy(col); beam.material.opacity = 0.22 + 0.12 * Math.sin(t * 5);
  });
}
