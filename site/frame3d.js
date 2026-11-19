// Keeping a model clear of the canvas edges. The places a model reaches while it moves are gathered once as a small
// cloud of points, and every frame the camera is moved back just far enough for that cloud to leave a margin on all
// four sides. It only ever moves the camera back: the angles, the sway, the opening sweep and the zoom are the model's own.

// For each shape, its outermost vertices in 64 directions spread evenly round a sphere stand in for the whole shape;
// a shape with few vertices simply keeps them all. Worked out once per shape. (26 box directions were tried first and
// missed corners of Signal Room's six-sided deck, so the edge it was meant to keep clear was touched.)
// A part smaller than SMALL across (an eye, a cheek, a glint) is just its bounding ball: six points. Keeping every
// vertex of every small part made Bloom's walk-through 365,000 points and cost 220 ms on a throttled phone.
const ND = 64, DIRS = new Float64Array(ND * 3);
for (let k = 0; k < ND; k++) {
  const y = 1 - (2 * (k + 0.5)) / ND, r = Math.sqrt(1 - y * y), a = k * Math.PI * (3 - Math.sqrt(5));
  DIRS[k * 3] = r * Math.cos(a); DIRS[k * 3 + 1] = y; DIRS[k * 3 + 2] = r * Math.sin(a);
}
const hull = new WeakMap();
function outermost(g) {
  let s = hull.get(g);
  if (s) return s;
  if (g.userData.hull) { hull.set(g, g.userData.hull); return g.userData.hull; }
  const pos = g.attributes.position, n = pos.count;
  // Read the numbers straight from the array (getX() checks for normalised and interleaved data on every call, which
  // made this the slowest part of opening a panel: 30 ms on a desktop for LocalPhotoPDF's 25 shapes).
  let a = pos.array, st = 3;
  if (pos.isInterleavedBufferAttribute || pos.normalized || !(a instanceof Float32Array)) {
    a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = pos.getX(i); a[i * 3 + 1] = pos.getY(i); a[i * 3 + 2] = pos.getZ(i); }
  }
  if (n <= 48) { s = Float32Array.from(a.subarray(0, n * st)); hull.set(g, s); return s; }
  const best = new Float64Array(ND).fill(-Infinity), at = new Int32Array(ND);
  for (let i = 0, j = 0; i < n; i++, j += st) {
    const x = a[j], y = a[j + 1], z = a[j + 2];
    for (let k = 0, d = 0; k < ND; k++, d += 3) { const v = x * DIRS[d] + y * DIRS[d + 1] + z * DIRS[d + 2]; if (v > best[k]) { best[k] = v; at[k] = i; } }
  }
  const keep = [...new Set(at)];
  s = new Float32Array(keep.length * 3);
  keep.forEach((i, j) => { s[j * 3] = a[i * st]; s[j * 3 + 1] = a[i * st + 1]; s[j * 3 + 2] = a[i * st + 2]; });
  hull.set(g, s);
  return s;
}

// The outline of a rounded block (the slab() every model uses), worked out from its measurements instead of from its
// vertices: an extruded shape has thousands of them, and searching them took 33 ms on a desktop for LocalPhotoPDF.
// Rounded corners of radius r, plus the bevel b, at its bottom (y = 0) and top (y = h), as slab() leaves it.
export function slabHull(g, w, d, h, r, b) {
  const R = r + b, out = [];
  for (const [sx, sz] of [[1, 1], [-1, 1], [-1, -1], [1, -1]]) {
    const cx = sx * (w / 2 - r), cz = sz * (d / 2 - r);
    for (let k = 0; k <= 4; k++) {
      const a = (k / 4) * (Math.PI / 2), x = cx + sx * R * Math.cos(a), z = cz + sz * R * Math.sin(a);
      out.push(x, 0, z, x, h, z);
    }
  }
  g.userData.hull = new Float32Array(out);
  return g;
}

// A cloud of points: x, y, z packed in one array that only ever grows, so gathering every frame makes no garbage
// (the home server gathers every frame; a plain array emptied and refilled cost about 70 KB a frame).
export const cloud = () => ({ a: new Float64Array(3072), n: 0 });
function put(c, x, y, z) {
  if (c.n + 3 > c.a.length) { const b = new Float64Array(c.a.length * 2); b.set(c.a); c.a = b; }
  c.a[c.n++] = x; c.a[c.n++] = y; c.a[c.n++] = z;
}

// Adds the world positions of everything visible in the scene to the cloud c.
// skip(object) leaves parts out, such as a beam that is meant to run off the edge.
const SMALL = 0.1;
let C = null, SKIP = null, BOX = null;
function visit(o) {
  if (!o.isMesh || o.material.isShadowMaterial || (SKIP && SKIP(o))) return;
  if (o.material.transparent && o.material.opacity < 0.05) return;
  if (o.matrixWorld.getMaxScaleOnAxis() < 0.02) return;
  if (o.isInstancedMesh) {
    o.computeBoundingBox(); if (o.boundingBox.isEmpty()) return;
    BOX.copy(o.boundingBox).applyMatrix4(o.matrixWorld);
    for (let k = 0; k < 8; k++) put(C, k & 1 ? BOX.max.x : BOX.min.x, k & 2 ? BOX.max.y : BOX.min.y, k & 4 ? BOX.max.z : BOX.min.z);
    return;
  }
  const g = o.geometry, e = o.matrixWorld.elements;
  if (!g.boundingSphere) g.computeBoundingSphere();
  const b = g.boundingSphere, r = b.radius * o.matrixWorld.getMaxScaleOnAxis();
  if (r < SMALL) {
    const cx = b.center.x, cy = b.center.y, cz = b.center.z;
    const x = e[0] * cx + e[4] * cy + e[8] * cz + e[12], y = e[1] * cx + e[5] * cy + e[9] * cz + e[13], z = e[2] * cx + e[6] * cy + e[10] * cz + e[14];
    put(C, x - r, y, z); put(C, x + r, y, z); put(C, x, y - r, z); put(C, x, y + r, z); put(C, x, y, z - r); put(C, x, y, z + r);
    return;
  }
  const s = outermost(g); // an affine transform written out: applyMatrix4's divide is wasted on these matrices
  for (let i = 0; i < s.length; i += 3) {
    const x = s[i], y = s[i + 1], z = s[i + 2];
    put(C, e[0] * x + e[4] * y + e[8] * z + e[12], e[1] * x + e[5] * y + e[9] * z + e[13], e[2] * x + e[6] * y + e[10] * z + e[14]);
  }
}
export function gather(T, scene, c, skip) {
  if (!BOX) BOX = new T.Box3();
  C = c; SKIP = skip || null;
  scene.updateMatrixWorld(true);
  scene.traverseVisible(visit);
  C = SKIP = null;
  return c;
}

// Turns everything a model reaches into rings round the vertical axis it spins on: 8 height bands, each a circle as
// wide as the furthest point in that band. A ring looks the same from every side, so the distance it needs does not
// change as the model turns. The first version kept the outline's real shape, and the camera moved in and out several
// times a turn as Signal Room's six-sided deck was spun round. 32 points stand in for each
// circle, pushed out by the small amount a 32-sided shape falls inside it.
export function rings(c, B = 8, N = 32) {
  const a = c.a, n = c.n;
  let y0 = Infinity, y1 = -Infinity;
  for (let i = 1; i < n; i += 3) { if (a[i] < y0) y0 = a[i]; if (a[i] > y1) y1 = a[i]; }
  const h = Math.max(1e-6, (y1 - y0) / B), lo = new Float64Array(B).fill(Infinity), hi = new Float64Array(B).fill(-Infinity), r = new Float64Array(B);
  for (let i = 0; i < n; i += 3) {
    const y = a[i + 1], k = Math.min(B - 1, Math.floor((y - y0) / h)), d = Math.hypot(a[i], a[i + 2]);
    if (y < lo[k]) lo[k] = y; if (y > hi[k]) hi[k] = y; if (d > r[k]) r[k] = d;
  }
  const out = [], grow = 1 / Math.cos(Math.PI / N);
  for (let k = 0; k < B; k++) {
    if (lo[k] > hi[k]) continue;
    for (let j = 0; j < N; j++) {
      const t = (j / N) * Math.PI * 2, x = r[k] * grow * Math.cos(t), z = r[k] * grow * Math.sin(t);
      out.push(x, lo[k], z, x, hi[k], z);
    }
  }
  return new Float64Array(out);
}

// The margin, in CSS pixels, kept between the model and every edge: roomier at rest, tighter when the reader has
// scrolled and the camera has come in. zoom runs 0 to 1.
export function margin(W, H, zoom = 0) {
  const s = Math.min(W, H), rest = Math.max(12, 0.07 * s), near = Math.max(6, 0.025 * s);
  return rest + (near - rest) * Math.min(1, Math.max(0, zoom));
}

// The smallest camera distance d that keeps every point inside the canvas less the margin, for a camera placed at
// O + d * u and looking at L (u is a unit vector). Found by bisection on the real projection, because the camera
// re-aims as it moves back: a straight-line solve with the aim held fixed was tried first and an independent
// projection check caught it clipping by up to 420 px.
const P = { x: 0, y: 0, z: 0 };
function inside(pts, n, O, u, L, d, kx, ky, near) {
  P.x = O.x + d * u.x; P.y = O.y + d * u.y; P.z = O.z + d * u.z;
  // the camera's axes, built the way three.js lookAt builds them (world up is +y): z backwards, x right, y up
  let zx = P.x - L.x, zy = P.y - L.y, zz = P.z - L.z; const zl = Math.hypot(zx, zy, zz) || 1; zx /= zl; zy /= zl; zz /= zl;
  let xx = zz, xz = -zx; const xl = Math.hypot(xx, xz) || 1; xx /= xl; xz /= xl;
  const yx = zy * xz, yy = zz * xx - zx * xz, yz = -zy * xx;
  for (let i = 0; i < n; i += 3) {
    const qx = pts[i] - P.x, qy = pts[i + 1] - P.y, qz = pts[i + 2] - P.z;
    const depth = -(qx * zx + qy * zy + qz * zz);
    if (depth < near) return false;
    const cx = qx * xx + qz * xz, cy = qx * yx + qy * yy + qz * yz;
    if (cx > kx * depth || -cx > kx * depth || cy > ky * depth || -cy > ky * depth) return false;
  }
  return true;
}
// n is how many numbers of pts to read (a cloud's n); it defaults to all of them.
export function distance(pts, fovDeg, aspect, W, H, px, O, u, L, guess, near = 0.55, n = pts.length) {
  const tv = Math.tan((fovDeg * Math.PI) / 360);
  const kx = (1 - (2 * px) / W) * tv * aspect, ky = (1 - (2 * px) / H) * tv;
  if (kx <= 0 || ky <= 0 || !n) return guess;
  if (inside(pts, n, O, u, L, guess, kx, ky, near)) return guess; // already clear: the model's own distance stands
  let lo = guess, hi = Math.max(guess, 0.5) * 1.5;
  for (let i = 0; i < 12 && !inside(pts, n, O, u, L, hi, kx, ky, near); i++) { lo = hi; hi *= 1.5; }
  for (let i = 0; i < 18 && hi - lo > 1e-4 * hi; i++) { const mid = (lo + hi) / 2; if (inside(pts, n, O, u, L, mid, kx, ky, near)) hi = mid; else lo = mid; }
  return hi;
}
