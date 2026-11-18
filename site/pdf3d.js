// LocalPhotoPDF: a bright desk seen from the side. Three photos ride a belt, one after another, into a chunky white
// box with a red lid, and one finished document comes out of the other end and stands up. The photos never leave the desk.
import { kit, TINT, sm, pop } from './kit3d.js';

export async function create(holder) {
  const K = await kit(holder, { az: -10, el: 21, sway: 5, fit: 2.08, lookY: 0.5, lead: 2 });
  const { T } = K;
  const flat = (c) => K.std(c, { roughness: 0.8, metalness: 0 });
  K.add(K.slab(4.7, 2.3, 0.07, 0.6), flat(0xdfe7f3), 0, 0, 0);          // desk mat
  K.add(K.slab(4.1, 0.95, 0.07, 0.2), flat(0x9fb0c8), 0, 0.07, 0);      // the belt
  for (let i = 0; i < 9; i++) K.add(K.slab(0.05, 0.95, 0.012, 0.01), flat(0x8697b1), -1.9 + i * 0.475, 0.14, 0).castShadow = false;
  const BY = 0.15;

  // The box that does the work. It has the face; the pages do not.
  const box = new T.Group(); box.position.y = BY - 0.01; K.scene.add(box);
  const shell = flat(0xf7f8fb);
  K.add(K.slab(1.3, 1.3, 0.34, 0.2), shell, 0, 0.62, 0, box);                       // upper body
  K.add(K.slab(1.3, 0.2, 0.64, 0.08), shell, 0, 0, 0.55, box); K.add(K.slab(1.3, 0.2, 0.64, 0.08), shell, 0, 0, -0.55, box); // side walls: the belt runs through between them
  K.add(K.slab(1.34, 1.34, 0.16, 0.22), K.soft(TINT.red, 0.12), 0, 0.96, 0, box);  // the red lid
  const fc = K.face(0.3, true); fc.position.set(0, 0.36, 0.655); box.add(fc);
  const lamp = new T.Mesh(new T.SphereGeometry(0.05, 14, 10), new T.MeshBasicMaterial({ color: TINT.mint, toneMapped: false })); lamp.position.set(0.48, 0.8, 0.655); box.add(lamp);

  const paper = flat(0xfdfdfb);
  function photo(color, art) {
    const g = new T.Group();
    K.add(K.slab(0.92, 0.74, 0.035, 0.05), paper, 0, 0, 0, g);
    K.add(K.slab(0.78, 0.6, 0.012, 0.03), K.soft(color, 0.22), 0, 0.035, 0, g);
    if (art === 'sun') K.add(new T.CylinderGeometry(0.1, 0.1, 0.014, 20), K.soft(TINT.sun, 0.3), 0.17, 0.047, -0.1, g).castShadow = false;
    if (art === 'hill') { const h = K.add(new T.SphereGeometry(0.19, 18, 10), K.soft(0x2fa36b, 0.1), -0.1, 0.04, 0.08, g); h.scale.set(1.3, 0.12, 0.7); h.castShadow = false; }
    if (art === 'lines') for (let i = 0; i < 3; i++) K.add(K.slab(0.54 - i * 0.1, 0.04, 0.008, 0.012), flat(0x3d4860), -0.06 - i * 0.05, 0.047, -0.15 + i * 0.15, g).castShadow = false;
    K.scene.add(g); return g;
  }
  const photos = [photo(TINT.blue, 'sun'), photo(TINT.mint, 'hill'), photo(TINT.lav, 'lines')];

  // The document: one page with a red tab and lines of text. It slides out flat, then stands up.
  const doc = new T.Group(); K.scene.add(doc);
  const page = new T.Group(); doc.add(page);
  K.add(K.slab(0.78, 0.07, 1.04, 0.03), paper, 0, 0, 0, page);
  K.add(K.slab(0.3, 0.02, 0.14, 0.008), K.soft(TINT.red, 0.2), -0.17, 0.82, 0.036, page);
  for (let i = 0; i < 4; i++) K.add(K.slab(0.54 - (i % 2) * 0.14, 0.02, 0.06, 0.008), flat(0x55617a), -0.05 - (i % 2) * 0.07, 0.6 - i * 0.13, 0.036, page).castShadow = false;

  const C = 11.6;
  return K.run((t) => {
    const u = t % C, fresh = sm(10.4, 11.2, u); // a new stack of photos drops in as the loop comes round
    photos.forEach((g, k) => {
      // They wait in a stack at the start of the belt; the top one goes first.
      const s0 = 0.5 + k * 1.3, a = u > 10.2 ? 0 : sm(s0, s0 + 1.7, u), wait = (2 - k) * 0.045;
      g.position.set(-1.62 + 1.42 * a, BY + 0.005 + wait * (1 - sm(0, 0.25, a)) + (u > 10.2 ? (1 - fresh) * 0.7 : 0), 0);
      g.rotation.y = (k - 1) * 0.16 * (1 - a);
      g.scale.setScalar(Math.max(0.001, u > 10.2 ? fresh : 1 - sm(0.72, 1, a)));
    });
    // The box gives a small shake while it works, and its lamp blinks.
    const busy = sm(4.7, 5.0, u) * (1 - sm(5.8, 6.1, u));
    box.scale.set(1 + 0.03 * busy * Math.sin(t * 22), 1 - 0.04 * busy * Math.abs(Math.sin(t * 11)), 1);
    lamp.material.color.setHex(busy > 0.5 && Math.sin(t * 16) > 0 ? TINT.sun : TINT.mint);
    const outA = sm(5.9, 6.9, u), up = sm(6.9, 7.7, u), gone = sm(10.1, 10.7, u);
    doc.position.set(0.35 + 1.3 * outA, BY + 0.045 + 0.06 * up * Math.abs(Math.sin(t * 2.2)), 0);
    page.rotation.x = -Math.PI / 2 * (1 - pop(up)) - 0.12 * up; page.rotation.y = 0.5 * up;
    doc.scale.setScalar(Math.max(0.001, sm(5.9, 6.2, u) * (1 - gone)));
  });
}
