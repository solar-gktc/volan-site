// Volan homepage stage.
// The 3D Volvo drives the printed road as the page scrolls, stamps what it passes, stops on the
// turntable stage in the brand section (where it becomes the brand picked there), turns into the
// old Volvo truck on the page before the heritage page and drives into the 1954 garage.
import {
  WebGLRenderer, Scene, OrthographicCamera, PMREMGenerator, DirectionalLight, HemisphereLight,
  Group, Mesh, BufferGeometry, BufferAttribute, MeshPhysicalMaterial, MeshStandardMaterial, MeshBasicMaterial,
  CylinderGeometry, PlaneGeometry, RoundedBoxGeometry, CanvasTexture, Color, Matrix4, Box3, Vector3,
  SRGBColorSpace, ACESFilmicToneMapping, DoubleSide, GLTFLoader, MeshoptDecoder,
} from 'three';

// Door opening in assets/img/arsiv-eski-dukkan.webp, as fractions of the photo
// (measured on the 1067×702 scan; matches the clip-path on .store__walls).
// A page with another garage photo gives its own door as data-door="left right top bottom" on .finale.
const DOOR = { left: 0.17, right: 0.47, top: 0.365, bottom: 0.845 };
// How the road maps to scroll. The vehicle settles at ANCHOR of the viewport height;
// sideways and uphill road costs a fraction of a scrolled pixel, so the vehicle lags a
// little on crossings and catches up on the way down (DOWNHILL < 1).
const ANCHOR = 0.58;
const SIDEWAYS = 0.3;
const DOWNHILL = 0.55;
const UPHILL = 1.0;
const SAMPLE_STEP = 5;
// On a page that times the door (data-door-at), how far down the screen the truck rides when it
// reaches the run under the garage photo.
const RUN_LOW = 0.94;
// ...and how much slower than the run it climbs into the door, per pixel of road.
const CLIMB_SLOW = 1.5;
// Parked three-quarter view in the banner: nose to the left, slightly towards the reader.
const PARKED_YAW = -2.72;
// The stage in the brand section (wide screens only). The road runs through it, so the car
// drives onto it at its usual pace and stops when the stage is about at ANCHOR; if it is
// running late it is hurried so it stops by BAY_ARRIVE down the screen. It stays until the
// stage has scrolled up to BAY_LEAVE. The view turns to the showroom angle on the way in, and
// the turntable turns the car to face the text while it stands.
const BAY_ARRIVE = 0.55;
const BAY_LEAVE = 0.22;
const BAY_ELEVATION = 0.42;
// How far the view starts turning before the stage, and is back after it, in screen heights.
const BAY_VIEW = 0.3;
// Share of the stop the turntable takes to turn, at each end.
const BAY_TURN = 0.2;
// The turntable in metres: wide enough for the car in any direction, and how high it stands.
const STAGE_RADIUS = 2.75;
const STAGE_RIM = 0.3;

// Shader colours are mixed into the final (display-space) colour, so they are kept in sRGB.
// Gold edge on the car-to-truck dissolve:
const EDGE_GOLD = new Color('#d9bd7a').convertLinearToSRGB();
// The dark of the garage interior in the archive photo (sampled around the doorway):
const GARAGE_DARK = new Color('#75624e').convertLinearToSRGB();

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const canvas = document.querySelector('.stage');
const road = document.querySelector('.road');
const roadPaths = [...road.querySelectorAll(':scope > path')];
const aging = document.querySelector('.aging');
const probe = document.createElementNS('http://www.w3.org/2000/svg', 'path');
const entries = [...document.querySelectorAll('.entry')];
// Stamp boxes and step ticks: each is stamped when the vehicle draws level with it.
const stampables = [...document.querySelectorAll('[data-stamp]')];
// The page the truck carries; the car turns into the truck on the page before it.
const truckPage = document.querySelector('[data-truck]');
const finale = document.querySelector('.finale');
const store = finale.querySelector('.store');
const storePhoto = finale.querySelector('.store__photo');
const dealer = finale.querySelector('.dealer');
const door = finale.dataset.door?.trim().split(/\s+/).map(Number);
if (door?.length === 4 && door.every(Number.isFinite)) Object.assign(DOOR, { left: door[0], right: door[1], top: door[2], bottom: door[3] });
const parks = Object.fromEntries([...document.querySelectorAll('.park')].map((el) => [el.dataset.park, el]));
const bayEl = document.querySelector('[data-bay]');
const podium = document.querySelector('[data-podium]');
const brandForm = document.querySelector('[data-brands]');

const layout = { ready: false };
let renderer, scene, camera;
let volvo, truck, mercedes, vw;
// The car that drives the road: the Volvo, or from the brand page on, the brand picked there.
const cars = {};
let carYaw = null;
let progress = 0;
// The scroll position the car follows: the page's, eased so the car trails it a little.
let eased = 0;
let lastPose = null;
let raf = 0;
let lastTime = 0;

/* ---------- Road geometry (document coordinates) ---------- */

function docRect(el) {
  const r = el.getBoundingClientRect();
  return { left: r.left + scrollX, top: r.top + scrollY, right: r.right + scrollX, bottom: r.bottom + scrollY, width: r.width, height: r.height };
}

// Polyline with quadratic rounded corners.
function roundedPath(pts, radius) {
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i - 1], q = pts[i], n = pts[i + 1];
    const l1 = Math.hypot(q.x - p.x, q.y - p.y), l2 = Math.hypot(n.x - q.x, n.y - q.y);
    const r = Math.min(radius, l1 / 2, l2 / 2);
    const a = { x: q.x + (p.x - q.x) * (r / l1), y: q.y + (p.y - q.y) * (r / l1) };
    const b = { x: q.x + (n.x - q.x) * (r / l2), y: q.y + (n.y - q.y) * (r / l2) };
    d += ` L${a.x},${a.y} Q${q.x},${q.y} ${b.x},${b.y}`;
  }
  const last = pts[pts.length - 1];
  return `${d} L${last.x},${last.y}`;
}

// Put each entry's text on its page's 32px ruling: top up the heading's bottom margin so the
// paragraphs start on a line, then nudge the (vertically centred) column onto the grid.
function snapToRuling() {
  for (const text of document.querySelectorAll('.entry__text')) {
    const h = text.querySelector('h2');
    text.style.top = '';
    h.style.marginBottom = '';
    const line = parseFloat(getComputedStyle(text).getPropertyValue('--line')) || 32;
    const gap = parseFloat(getComputedStyle(h).marginBottom);
    const rest = (h.offsetHeight + gap) % line;
    if (rest > 0.5) h.style.marginBottom = `${gap + line - rest}px`;
    const page = text.closest('.entry');
    const offset = (text.getBoundingClientRect().top - page.getBoundingClientRect().top - page.clientTop) % line;
    if (offset > 0.5) text.style.top = `${line - offset}px`;
  }
}

function buildRoute() {
  snapToRuling();
  const W = document.documentElement.clientWidth;
  const H = innerHeight;
  const narrow = W < 900;
  const inner = docRect(entries[0].querySelector('.entry__inner'));
  const inset = narrow ? 36 : Math.max(26, inner.left * 0.8);
  const lanes = { left: inset, right: W - inset };
  const drop = narrow ? 24 : 36;
  const radius = narrow ? 72 : Math.min(150, W * 0.1);
  const ppuDrive = narrow ? Math.max(20, W * 0.058) : Math.min(66, Math.max(42, W * 0.044));
  const roadWidth = Math.round(1.9 * ppuDrive * 1.25);

  const start = docRect(parks.volvo);
  const firstPage = docRect(entries[0]);
  const pts = [{ x: start.left, y: start.top }, { x: start.left - W * (narrow ? 0.2 : 0.1), y: firstPage.top - drop }];
  // The stage spans the bay's width and sits at its foot, seen from the showroom angle.
  // Small screens hide the bay: the road keeps to its lane and the car does not stop.
  let bay = null, bayAt = -1;
  if (bayEl?.getClientRects().length) {
    const spot = docRect(bayEl);
    const R = spot.width / 2;
    const ppu = R / STAGE_RADIUS;
    const ry = R * Math.sin(BAY_ELEVATION);
    const rim = STAGE_RIM * Math.cos(BAY_ELEVATION) * ppu;
    bay = { x: spot.left + R, y: spot.bottom - ry - rim - 8, R, ry, rim, ppu };
  }
  for (const entry of entries) {
    const r = docRect(entry);
    const x = lanes[entry.dataset.lane];
    if (bay && entry.contains(bayEl)) {
      // The road runs down this page through the stage.
      pts.push({ x: bay.x, y: r.top + drop });
      bayAt = pts.length;
      pts.push({ x: bay.x, y: bay.y }, { x: bay.x, y: r.bottom - drop });
    } else {
      pts.push({ x, y: r.top + drop }, { x, y: r.bottom - drop });
    }
  }
  const stampYs = stampables.map((el) => {
    const r = docRect(el);
    return (r.top + r.bottom) / 2;
  });

  const fin = docRect(finale);
  const photo = docRect(storePhoto);
  const desk = docRect(dealer);
  // The truck comes down between the photo and the dealer block, or down a lane the page names.
  const truckLane = lanes[finale.dataset.truckLane] ?? (narrow ? lanes.right : (photo.right + desk.left) / 2);
  // A page that times the door (data-door-at) runs a little closer under the photo and drives in
  // less deep, which leaves more scrolling for the run and the climb.
  const doorAt = parseFloat(finale.dataset.doorAt);
  const runY = photo.bottom + (doorAt > 0 ? (narrow ? 72 : 96) : (narrow ? 84 : 116));
  const door = {
    x: photo.left + photo.width * (DOOR.left + DOOR.right) / 2,
    top: photo.top + photo.height * DOOR.top,
    bottom: photo.top + photo.height * DOOR.bottom,
  };
  const endY = door.top + (door.bottom - door.top) * (doorAt > 0 ? 0.4 : 0.2);
  pts.push({ x: truckLane, y: fin.top + drop }, { x: truckLane, y: runY }, { x: door.x, y: runY }, { x: door.x, y: endY });

  // The printed road stops at the forecourt; the last stretch is the truck going in.
  // Measure without the two page-sized layers, so the page can also get shorter.
  road.setAttribute('height', 0);
  aging.style.height = '0px';
  const docH = document.documentElement.scrollHeight;
  road.setAttribute('width', W);
  road.setAttribute('height', docH);
  road.setAttribute('viewBox', `0 0 ${W} ${docH}`);
  const visible = roundedPath(pts.slice(0, -1), radius);
  const route = roundedPath(pts, radius);
  for (const path of roadPaths) path.setAttribute('d', visible);
  if (bay) {
    probe.setAttribute('d', roundedPath(pts.slice(0, bayAt + 1), radius));
    // On the stage the car turns to the banner's angle, mirrored to face the text.
    Object.assign(bay, { at: probe.getTotalLength(), yaw: -Math.PI - PARKED_YAW });
  }
  drawStage(bay);
  // The paper ages across the crossing onto the truck's page.
  const agingTop = docRect(truckPage ?? finale).top - drop - radius;
  aging.style.top = `${agingTop}px`;
  aging.style.height = `${docH - agingTop}px`;
  aging.style.setProperty('--aging-ramp', `${2 * (drop + radius)}px`);

  probe.setAttribute('d', route);
  const length = probe.getTotalLength();
  const n = Math.ceil(length / SAMPLE_STEP) + 1;
  // The sample where the car stands on the stage; the stop is scrolled before the next one.
  const arrive = bay ? Math.round(bay.at / SAMPLE_STEP) : -1;
  // A late car is hurried from the crossing onto the brand page, where it becomes the brand picked.
  const brandPage = brandForm?.closest('.entry');
  const hurryFrom = brandPage ? docRect(brandPage).top - drop - radius : 0;
  // ks[i]: the scroll position at which the vehicle reaches sample i.
  const xs = new Float32Array(n), ys = new Float32Array(n), ks = new Float32Array(n);
  let enter = -1;
  for (let i = 0; i < n; i++) {
    const p = i === arrive ? bay : probe.getPointAtLength(Math.min(length, i * SAMPLE_STEP));
    xs[i] = p.x; ys[i] = p.y;
    if (!i) continue;
    const dx = Math.abs(p.x - xs[i - 1]), dy = p.y - ys[i - 1];
    let step = SIDEWAYS * dx + (dy > 0 ? DOWNHILL * dy : -UPHILL * dy);
    if (i === arrive + 1) step += Math.max(0, bay.y - BAY_LEAVE * H - ks[i - 1]);
    ks[i] = Math.max(ks[i - 1] + step, p.y - ANCHOR * H);
    if (bay && enter < 0 && p.y >= hurryFrom) enter = i;
    if (i === arrive && enter >= 0) {
      // Bring the drive from the crossing to the stage forward, so it ends on time.
      const due = Math.max(ks[enter], bay.y - BAY_ARRIVE * H);
      const f = ks[i] > due ? (due - ks[enter]) / (ks[i] - ks[enter]) : 1;
      for (let j = enter + 1; j <= i; j++) ks[j] = ks[enter] + (ks[j] - ks[enter]) * f;
    }
  }
  // If the road needs more scrolling than the page has, squeeze it to fit: only the stretch
  // after the bay when there is one, so the car still parks and leaves where it should.
  const maxScroll = Math.max(1, docH - H);
  const kept = arrive + 1 < n ? Math.max(0, arrive + 1) : 0;
  if (ks[n - 1] > maxScroll && ks[kept] < maxScroll) {
    const squeeze = (maxScroll - ks[kept]) / (ks[n - 1] - ks[kept]);
    for (let i = kept + 1; i < n; i++) ks[i] = ks[kept] + (ks[i] - ks[kept]) * squeeze;
  }
  // A page whose garage is not at the very end (data-door-at on .finale, a fraction of the screen
  // height) times the last page's drive so the truck reaches the door while the door is at that
  // height on screen, instead of after the garage has scrolled away. The drive is paced evenly:
  // down the lane the truck sinks to RUN_LOW on the screen by the run under the photo, then it
  // runs and climbs into the door at an even pace, a little slower on the climb (CLIMB_SLOW).
  if (doorAt > 0) {
    const due = Math.min(maxScroll, endY - doorAt * H);
    let from = 0;
    while (from < n - 1 && ys[from] < fin.top) from++;
    let run = from;
    while (run < n - 1 && ys[run] < runY - 0.5) run++;
    // ...but never faster down the lane than 2.5 pixels of road per pixel scrolled.
    const atRun = Math.min(due, Math.max(ks[from] + (ys[run] - ys[from]) / 2.5, runY - RUN_LOW * H));
    if (due > ks[from] && run > from && run < n - 1) {
      for (let i = from + 1; i <= run; i++) ks[i] = lerp(ks[from], atRun, (i - from) / (run - from));
      const cost = new Float32Array(n);
      for (let i = run + 1; i < n; i++) cost[i] = cost[i - 1] + (ys[i] < ys[i - 1] - 0.01 ? CLIMB_SLOW : 1);
      for (let i = run + 1; i < n; i++) ks[i] = lerp(atRun, due, cost[i] / cost[n - 1]);
    }
  }
  const indexAtY = (y) => {
    for (let i = 0; i < n; i++) if (ys[i] >= y) return i;
    return n - 1;
  };
  let upFrom = n - 1;
  while (upFrom > 0 && ys[upFrom - 1] < runY - 0.5) upFrom--;
  let runFrom = upFrom;
  while (runFrom > 0 && ys[runFrom - 1] >= runY - 0.5) runFrom--;

  // The change runs along the crossing from the page before onto the truck's page, where no
  // plate covers the road. A short crossing (phones) still gets 45% of a screen of scrolling.
  const changePage = docRect(entries[entries.indexOf(truckPage) - 1] ?? entries[entries.length - 1]);
  const truckTop = docRect(truckPage ?? finale).top;
  const indexAtKey = (k) => {
    for (let i = 0; i < n; i++) if (ks[i] >= k) return i;
    return n - 1;
  };
  const morphFrom = indexAtY(changePage.bottom - drop - radius);
  const morphTo = Math.max(indexAtY(truckTop + drop + radius), indexAtKey(ks[morphFrom] + 0.45 * H));
  // The view turns to the showroom angle on the way onto the stage, and back on the way off.
  if (bay) {
    let from = arrive, to = arrive + 1;
    while (from > 0 && ys[from - 1] >= bay.y - BAY_VIEW * H) from--;
    while (to < n - 1 && ys[to + 1] <= bay.y + BAY_VIEW * H) to++;
    Object.assign(bay, { arrive, from, to });
  }
  // A stamp may name its moment on the stage instead of its height (data-stamp="approach|near|stop"):
  // coming down towards the stage, nearly there, getting onto it. Without the stage (phones) it uses
  // its height.
  const atBay = bay && {
    approach: Math.min(arrive - 2, indexAtY(bay.y - 0.3 * H)),
    near: Math.min(arrive - 1, indexAtY(bay.y - 0.14 * H)),
    stop: arrive,
  };
  Object.assign(layout, {
    ready: true, W, H, narrow, xs, ys, ks, n,
    ppuBanner: narrow ? W * 0.11 : Math.min(108, W * 0.066),
    ppuDrive,
    ppuBay: bay ? bay.ppu : 0,
    parkY: start.top,
    bay,
    brandFrom: brandPage ? indexAtY(hurryFrom) : Infinity,
    leaveBanner: indexAtY(firstPage.top),
    stamps: stampables.map((el, i) => (atBay && atBay[el.dataset.stamp]) ?? indexAtY(stampYs[i])),
    morph: [morphFrom, morphTo],
    runStart: runFrom,
    upStart: upFrom,
    doorBottom: door.bottom,
  });
  road.style.setProperty('--road-width', `${roadWidth}px`);
}

// The turntable, drawn over the road where it runs through: a glow on the page, its shadow,
// the navy side with a foil line, and the paper top with a gold double rule.
function drawStage(bay) {
  if (!bay) {
    podium.replaceChildren();
    return;
  }
  const { x, y, R, ry, rim } = bay;
  const e = ry / R;
  const ring = (r) => `<ellipse class="podium__ring${r < R * 0.9 ? ' podium__ring--fine' : ''}" cx="${x}" cy="${y}" rx="${r}" ry="${r * e}"/>`;
  podium.innerHTML = `<ellipse class="podium__glow" cx="${x}" cy="${y + rim}" rx="${R * 1.45}" ry="${ry * 1.9}"/>`
    + `<ellipse class="podium__shadow" cx="${x}" cy="${y + rim + 4}" rx="${R * 1.06}" ry="${ry * 1.16}"/>`
    + `<path class="podium__side" d="M${x - R},${y} V${y + rim} A${R},${ry} 0 0 0 ${x + R},${y + rim} V${y} Z"/>`
    + `<path class="podium__foil" d="M${x - R},${y + rim * 0.55} A${R},${ry} 0 0 0 ${x + R},${y + rim * 0.55}"/>`
    + `<ellipse class="podium__top" cx="${x}" cy="${y}" rx="${R}" ry="${ry}"/>`
    + ring(R * 0.9) + ring(R * 0.9 - 7);
}

// Fractional sample index for a scroll position.
function indexAtScroll(scroll) {
  const { ks, n } = layout;
  if (scroll <= 0) return 0;
  if (scroll >= ks[n - 1]) return n - 1;
  let lo = 0, hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (ks[mid] <= scroll) lo = mid; else hi = mid;
  }
  const span = ks[hi] - ks[lo];
  return lo + (span > 0 ? (scroll - ks[lo]) / span : 0);
}

function poseAt(index) {
  const { xs, ys, n } = layout;
  const lo = Math.min(n - 1, Math.max(0, Math.floor(index)));
  const hi = Math.min(n - 1, lo + 1);
  const t = index - lo;
  const a = Math.max(0, lo - 2), b = Math.min(n - 1, hi + 2);
  return {
    x: xs[lo] + (xs[hi] - xs[lo]) * t,
    y: ys[lo] + (ys[hi] - ys[lo]) * t,
    tx: xs[b] - xs[a],
    ty: ys[b] - ys[a],
  };
}

/* ---------- Camera: an orthographic view looking down onto the page ---------- */

const view = { ppu: 100, elevation: 0.4 };

function setCamera(ppu, elevation) {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  view.ppu = ppu;
  view.elevation = elevation;
  camera.left = -w / 2 / ppu;
  camera.right = w / 2 / ppu;
  camera.top = h / 2 / ppu;
  camera.bottom = -h / 2 / ppu;
  camera.position.set(0, Math.sin(elevation) * 60, Math.cos(elevation) * 60);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
}

// A point on the screen (px) to the ground plane, and a screen direction to a ground heading.
function ground(sx, sy) {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  return { x: (sx - w / 2) / view.ppu, z: (sy - h / 2) / view.ppu / Math.sin(view.elevation) };
}
function heading(tx, ty) {
  return Math.atan2(-ty / Math.sin(view.elevation), tx);
}

/* ---------- Dissolve: the car breaks up as the truck forms ---------- */

const DISSOLVE_COMMON = /* glsl */ `
varying vec3 vDissolvePos;
uniform float uDissolve;
uniform float uShade;
uniform float uShadeLine;
uniform float uShadeBand;
uniform vec3 uEdgeColor;
uniform vec3 uShadeColor;
float dHash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float dNoise(vec3 x) {
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(dHash(i), dHash(i + vec3(1, 0, 0)), f.x), mix(dHash(i + vec3(0, 1, 0)), dHash(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(dHash(i + vec3(0, 0, 1)), dHash(i + vec3(1, 0, 1)), f.x), mix(dHash(i + vec3(0, 1, 1)), dHash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
float dField(vec3 p) { return 0.62 * dNoise(p * 2.1) + 0.38 * dNoise(p * 6.3); }
`;

function patchDissolve(material, uniforms) {
  for (const m of Array.isArray(material) ? material : [material]) {
    m.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = 'varying vec3 vDissolvePos;\nuniform mat4 uRootInverse;\n' + shader.vertexShader.replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvDissolvePos = (uRootInverse * modelMatrix * vec4(transformed, 1.0)).xyz;',
      );
      shader.fragmentShader = DISSOLVE_COMMON + shader.fragmentShader
        .replace('void main() {', 'void main() {\n  float dn = dField(vDissolvePos);\n  if (dn < uDissolve) discard;')
        .replace('#include <dithering_fragment>', `#include <dithering_fragment>
  float dEdge = (1.0 - smoothstep(uDissolve, uDissolve + 0.07, dn)) * step(0.001, uDissolve) * step(uDissolve, 0.999);
  gl_FragColor.rgb = mix(gl_FragColor.rgb, uEdgeColor, dEdge);
  // Only what is past the door threshold (above uShadeLine on screen) is inside the dark garage.
  float dInside = smoothstep(uShadeLine, uShadeLine + uShadeBand, gl_FragCoord.y);
  gl_FragColor.rgb = mix(gl_FragColor.rgb, uShadeColor, uShade * dInside);`);
    };
    m.customProgramCacheKey = () => 'volan-dissolve';
  }
}

class Vehicle {
  constructor(model, { dissolvable = false } = {}) {
    this.root = new Group();
    this.dissolvable = dissolvable;
    this.yaw = null;
    // How much of this car is formed (1) or dissolved away (0) when cars swap.
    this.presence = 0;
    this.uniforms = {
      uDissolve: { value: 0 },
      uShade: { value: 0 },
      uShadeLine: { value: -1e6 },
      uShadeBand: { value: 1 },
      uEdgeColor: { value: EDGE_GOLD.clone() },
      uShadeColor: { value: GARAGE_DARK.clone() },
      uRootInverse: { value: new Matrix4() },
    };
    this.setModel(model);
    scene.add(this.root);
  }

  // Put a model on this vehicle, replacing the one it had (a placeholder, until the GLB loads).
  setModel(model) {
    if (this.model) this.root.remove(this.model);
    this.model = model;
    this.root.add(model);
    this.wheels = model.userData.wheels ?? [];
    this.wheelRadius = model.userData.wheelRadius ?? 0.35;
    // Ground shadows fade by opacity; run through the noise mask they leave speckle on the page.
    this.shadows = [];
    model.traverse((o) => {
      if (!o.isMesh) return;
      if (o.userData.shadow) this.shadows.push(o);
      else if (this.dissolvable) patchDissolve(o.material, this.uniforms);
    });
  }

  fade(opacity) {
    for (const s of this.shadows) s.material.opacity = opacity;
  }

  place(sx, sy, yaw, scale = 1) {
    const g = ground(sx, sy);
    this.root.position.set(g.x, 0, g.z);
    this.root.rotation.y = yaw;
    this.root.scale.setScalar(scale);
    this.root.updateMatrixWorld();
    this.uniforms.uRootInverse.value.copy(this.root.matrixWorld).invert();
  }

  roll(distance) {
    for (const w of this.wheels) w.rotation.z -= distance / this.wheelRadius;
  }
}

/* ---------- Models ---------- */

function toFloat(attr) {
  const size = attr.itemSize;
  const out = new Float32Array(attr.count * size);
  const get = [attr.getX, attr.getY, attr.getZ, attr.getW];
  for (let i = 0; i < attr.count; i++) for (let k = 0; k < size; k++) out[i * size + k] = get[k].call(attr, i);
  return new BufferAttribute(out, size);
}

// Copy the triangles listed in `tris` into a compact geometry of their own.
function extract(geometry, tris) {
  const remap = new Map();
  const index = [];
  for (const v of tris) {
    if (!remap.has(v)) remap.set(v, remap.size);
    index.push(remap.get(v));
  }
  const part = new BufferGeometry();
  for (const [name, attr] of Object.entries(geometry.attributes)) {
    const out = new Float32Array(remap.size * attr.itemSize);
    for (const [from, to] of remap) for (let k = 0; k < attr.itemSize; k++) out[to * attr.itemSize + k] = attr.array[from * attr.itemSize + k];
    part.setAttribute(name, new BufferAttribute(out, attr.itemSize));
  }
  part.setIndex(index);
  return part;
}

const gltfLoader = new GLTFLoader();
gltfLoader.setMeshoptDecoder(MeshoptDecoder);

async function loadGltf(url) {
  const gltf = await gltfLoader.loadAsync(url);
  gltf.scene.updateMatrixWorld(true);
  return gltf;
}

// Every vehicle GLB follows the Volvo's conventions: faces +X, wheels in materials Jant and
// Lastik, glass in VOLAN_CAM_Cam, ground shadow in VOLAN_GOLGE. One gltf can build several
// independent copies; each copy gets its own materials, since the dissolve patch edits them.
function buildVehicle(gltf) {
  // Bake every node transform into float geometry so all parts share one car space.
  const car = new Group();
  const parts = [];
  gltf.scene.traverse((o) => { if (o.isMesh) parts.push(o); });
  for (const src of parts) {
    const g = new BufferGeometry();
    for (const [name, attr] of Object.entries(src.geometry.attributes)) g.setAttribute(name, toFloat(attr));
    if (src.geometry.index) g.setIndex([...src.geometry.index.array]);
    g.applyMatrix4(src.matrixWorld);
    let material = src.material.clone();
    if (material.name === 'VOLAN_CAM_Cam') {
      // Transmission needs a second render pass; tinted clearcoat glass reads the same at this size.
      material = new MeshPhysicalMaterial({ name: 'glass', color: 0x1a2130, roughness: 0.04, metalness: 0, clearcoat: 1, transparent: true, opacity: 0.62 });
    } else if (material.name === 'VOLAN_GOLGE') {
      material = new MeshBasicMaterial({ name: 'shadow', map: material.map, color: 0x0b0d1c, transparent: true, depthWrite: false, side: DoubleSide });
    } else if (material.name === 'VOLAN_BOYA') {
      // Satin paint: soft, wide highlights instead of sharp mirror streaks.
      material.metalness = Math.min(material.metalness, 0.15);
      material.roughness = Math.max(material.roughness, 0.45);
      if (material.isMeshPhysicalMaterial) {
        material.clearcoat = Math.min(material.clearcoat, 0.6);
        material.clearcoatRoughness = Math.max(material.clearcoatRoughness, 0.12);
      }
    }
    const mesh = new Mesh(g, material);
    mesh.userData.shadow = material.name === 'shadow';
    car.add(mesh);
  }

  // Centre the body on its footprint, wheels on the ground. The model faces +X.
  const box = new Box3();
  for (const m of car.children) if (m.material.name !== 'shadow') box.expandByObject(m);
  const centre = box.getCenter(new Vector3());
  for (const m of car.children) m.geometry.translate(-centre.x, -box.min.y, -centre.z);

  // Split rims and tyres into four wheels that can turn.
  const quadrants = [[], [], [], []];
  for (const mesh of [...car.children]) {
    if (!/^(Jant|Lastik)$/.test(mesh.material.name)) continue;
    const pos = mesh.geometry.attributes.position.array;
    const idx = mesh.geometry.index.array;
    const groups = [[], [], [], []];
    for (let t = 0; t < idx.length; t += 3) {
      let cx = 0, cz = 0;
      for (let k = 0; k < 3; k++) { cx += pos[idx[t + k] * 3]; cz += pos[idx[t + k] * 3 + 2]; }
      groups[(cx > 0 ? 0 : 2) + (cz > 0 ? 0 : 1)].push(idx[t], idx[t + 1], idx[t + 2]);
    }
    groups.forEach((tris, q) => { if (tris.length) quadrants[q].push(new Mesh(extract(mesh.geometry, tris), mesh.material)); });
    car.remove(mesh);
  }
  const wheels = [];
  let radius = 0;
  for (const meshes of quadrants) {
    if (!meshes.length) continue;
    const wb = new Box3();
    for (const m of meshes) { m.geometry.computeBoundingBox(); wb.union(m.geometry.boundingBox); }
    const c = wb.getCenter(new Vector3());
    const hub = new Group();
    hub.position.copy(c);
    for (const m of meshes) { m.geometry.translate(-c.x, -c.y, -c.z); hub.add(m); }
    car.add(hub);
    wheels.push(hub);
    radius = Math.max(radius, (wb.max.y - wb.min.y) / 2);
  }
  car.userData.wheels = wheels;
  car.userData.wheelRadius = radius || 0.36;
  return car;
}

function contactShadow(length, width, strength = 0.5) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 6, 64, 64, 64);
  grad.addColorStop(0, `rgba(11,13,28,${strength})`);
  grad.addColorStop(1, 'rgba(11,13,28,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const mesh = new Mesh(new PlaneGeometry(length * 1.3, width * 1.9), new MeshBasicMaterial({ map: new CanvasTexture(c), transparent: true, depthWrite: false }));
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.005;
  mesh.userData.shadow = true;
  return mesh;
}

function wheel(radius, width, material, x, z) {
  const hub = new Group();
  const tyre = new Mesh(new CylinderGeometry(radius, radius, width, 24), material);
  tyre.rotation.x = Math.PI / 2;
  hub.add(tyre);
  hub.position.set(x, radius, z);
  return hub;
}

// Stand-in for the Mercedes and Volkswagen while their models load, or if they fail to.
function placeholderCar(paint) {
  const L = 4.6, Wd = 1.84, r = 0.34;
  const car = new Group();
  const body = new MeshStandardMaterial({ color: paint, metalness: 0.55, roughness: 0.35 });
  const glass = new MeshStandardMaterial({ color: 0x1a2130, metalness: 0.2, roughness: 0.1 });
  const rubber = new MeshStandardMaterial({ color: 0x15161a, roughness: 0.85 });
  const lower = new Mesh(new RoundedBoxGeometry(L, 0.66, Wd, 3, 0.2), body);
  lower.position.y = 0.2 + 0.33;
  const cabin = new Mesh(new RoundedBoxGeometry(L * 0.5, 0.52, Wd * 0.86, 3, 0.18), glass);
  cabin.position.set(-0.15, 0.86 + 0.22, 0);
  car.add(contactShadow(L, Wd), lower, cabin);
  const wheels = [];
  for (const x of [L * 0.32, -L * 0.32]) for (const z of [Wd / 2 - 0.14, -(Wd / 2 - 0.14)]) {
    const w = wheel(r, 0.24, rubber, x, z);
    wheels.push(w);
    car.add(w);
  }
  car.userData.wheels = wheels;
  car.userData.wheelRadius = r;
  return car;
}

// Stand-in for the old Volvo truck,
// while assets/models/volvo-n88-truck.glb (an N88-style bonneted truck) loads, or if it fails to.
function placeholderTruck() {
  const truck = new Group();
  const cabPaint = new MeshStandardMaterial({ color: 0x3a4278, metalness: 0.25, roughness: 0.5 });
  const dark = new MeshStandardMaterial({ color: 0x17181d, roughness: 0.8 });
  const steel = new MeshStandardMaterial({ color: 0xb9bcc4, metalness: 0.8, roughness: 0.3 });
  const glass = new MeshStandardMaterial({ color: 0x141a26, metalness: 0.3, roughness: 0.08 });
  const deck = new MeshStandardMaterial({ color: 0x5b5a63, roughness: 0.7 });

  const cab = new Mesh(new RoundedBoxGeometry(1.9, 2.15, 2.4, 3, 0.14), cabPaint);
  cab.position.set(2.15, 0.78 + 1.075, 0);
  const windscreen = new Mesh(new RoundedBoxGeometry(0.06, 0.8, 2.12, 2, 0.02), glass);
  windscreen.position.set(3.1, 2.3, 0);
  const grille = new Mesh(new RoundedBoxGeometry(0.06, 0.62, 1.5, 2, 0.02), steel);
  grille.position.set(3.1, 1.42, 0);
  const bumper = new Mesh(new RoundedBoxGeometry(0.28, 0.26, 2.44, 2, 0.06), dark);
  bumper.position.set(3.12, 0.78, 0);
  const chassis = new Mesh(new RoundedBoxGeometry(6.0, 0.28, 1.0, 2, 0.04), dark);
  chassis.position.set(0.05, 0.86, 0);
  const bed = new Mesh(new RoundedBoxGeometry(3.85, 0.62, 2.42, 2, 0.05), deck);
  bed.position.set(-0.95, 1.33, 0);

  const label = document.createElement('canvas');
  label.width = 256; label.height = 96;
  const lg = label.getContext('2d');
  lg.fillStyle = '#e6e9f0';
  lg.font = '600 64px Besley, Georgia, serif';
  lg.textAlign = 'center';
  lg.textBaseline = 'middle';
  lg.fillText('J.M.', 128, 52);
  const decalMaterial = new MeshBasicMaterial({ map: new CanvasTexture(label), transparent: true });
  for (const side of [1, -1]) {
    const decal = new Mesh(new PlaneGeometry(1.1, 0.41), decalMaterial);
    decal.position.set(2.15, 1.55, side * 1.215);
    if (side < 0) decal.rotation.y = Math.PI;
    truck.add(decal);
  }
  truck.add(contactShadow(6.2, 2.4, 0.55), cab, windscreen, grille, bumper, chassis, bed);

  const wheels = [];
  const r = 0.52;
  for (const [x, dual] of [[2.2, false], [-1.15, true], [-2.3, true]]) {
    for (const side of [1, -1]) {
      const w = wheel(r, dual ? 0.5 : 0.3, dark, x, side * (dual ? 0.92 : 1.0));
      wheels.push(w);
      truck.add(w);
    }
  }
  truck.userData.wheels = wheels;
  truck.userData.wheelRadius = r;
  return truck;
}

/* ---------- Frame ---------- */

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (v) => v * v * (3 - 2 * v);
const lerp = (a, b, t) => a + (b - a) * t;
function lerpAngle(a, b, t) {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

function onScreen(sy, margin = 420) {
  return sy > -margin && sy < canvas.clientHeight + margin;
}

function frame(now) {
  raf = 0;
  const dt = Math.min(0.1, lastTime ? (now - lastTime) / 1000 : 0.016);
  lastTime = now;
  if (!layout.ready || !volvo) return;

  const still = reduceMotion.matches;
  // The lag is eased in scroll distance, not road distance, so stretches the car hurries
  // through (into the bay) do not leave it further behind.
  eased = still ? scrollY : lerp(eased, scrollY, 1 - Math.exp(-dt * 7));
  if (Math.abs(scrollY - eased) < 0.5) eased = scrollY;
  progress = still ? 0 : indexAtScroll(eased);

  // Banner view while the Volvo is parked, the steeper drive view once it is on the road,
  // and the showroom view on the stage. Without motion nothing drives, so the page position
  // decides instead: the car stands on the stage whenever it is nearer than the banner.
  const { bay } = layout;
  const away = smooth(still ? clamp01(scrollY / (layout.H * 0.8)) : clamp01(progress / Math.max(1, layout.leaveBanner)));
  let show = 0;
  if (bay && still) {
    const mid = scrollY + layout.H / 2;
    show = Math.abs(bay.y - mid) < Math.abs(layout.parkY - mid) ? 1 : 0;
  } else if (bay) {
    show = progress <= bay.arrive
      ? smooth(clamp01((progress - bay.from) / Math.max(1, bay.arrive - bay.from)))
      : smooth(clamp01((bay.to - progress) / Math.max(1, bay.to - bay.arrive - 1)));
  }
  setCamera(lerp(lerp(layout.ppuBanner, layout.ppuDrive, away), layout.ppuBay, show), lerp(lerp(0.4, 0.82, away), BAY_ELEVATION, show));

  // From the brand page on, the car is the brand picked there; a swap is a dissolve, like the truck.
  const picked = brandForm?.querySelector('input:checked')?.value ?? 'volvo';
  const brand = (still ? show === 1 : progress >= layout.brandFrom) ? picked : 'volvo';
  let swapping = false;
  for (const [name, car] of Object.entries(cars)) {
    const want = name === brand ? 1 : 0;
    car.presence = still ? want : lerp(car.presence, want, 1 - Math.exp(-dt * 5));
    if (Math.abs(car.presence - want) < 0.01) car.presence = want;
    else swapping = true;
  }

  // Parked placeholders in the banner, at the Volvo's parked angle.
  for (const [car, el] of [[mercedes, parks.mercedes], [vw, parks.vw]]) {
    const r = el.getBoundingClientRect();
    car.root.visible = onScreen(r.top);
    if (car.root.visible) car.place(r.left, r.top, PARKED_YAW, 0.5);
  }

  const morph = still ? 0 : smooth(clamp01((progress - layout.morph[0]) / (layout.morph[1] - layout.morph[0])));
  const pose = still && show === 1 ? { x: bay.x, y: bay.y, tx: 0, ty: 1 } : poseAt(progress);
  const sx = pose.x - scrollX, sy = pose.y - scrollY;
  // While the car stands on the stage the turntable turns it to face the text, and back to
  // the road before it drives on.
  let spin = show === 1 ? 1 : 0;
  if (bay && !still) {
    const t = progress - bay.arrive;
    spin = t > 0 && t < 1 ? smooth(clamp01(t / BAY_TURN)) * smooth(clamp01((1 - t) / BAY_TURN)) : 0;
  }
  // Pulling out of the parking spot: the parked angle hands over to the road's heading.
  const roadYaw = heading(pose.tx, pose.ty);
  const yaw = lerpAngle(lerpAngle(PARKED_YAW, roadYaw, smooth(clamp01(progress / 28))), bay ? bay.yaw : 0, spin);
  const turn = 1 - Math.exp(-dt * 14);

  if (lastPose && !still) {
    const dx = (pose.x - lastPose.x) / view.ppu;
    const dz = (pose.y - lastPose.y) / view.ppu / Math.sin(view.elevation);
    const dist = Math.hypot(dx, dz) * Math.sign(progress - lastPose.progress || 1);
    for (const car of Object.values(cars)) car.roll(dist);
    truck.roll(dist);
  }
  lastPose = { x: pose.x, y: pose.y, progress };

  carYaw = carYaw === null || still ? yaw : lerpAngle(carYaw, yaw, turn);
  for (const car of Object.values(cars)) {
    car.root.visible = car.presence > 0 && morph < 1 && onScreen(sy);
    car.uniforms.uDissolve.value = Math.max(1 - car.presence, morph);
    car.fade(car.presence * (1 - morph));
    if (car.root.visible) car.place(sx, sy, carYaw);
  }

  if (still) {
    // No driving: the truck waits in front of the old garage, heading for the open door.
    const wait = poseAt(Math.max(0, layout.upStart - 30));
    const wy = wait.y - scrollY;
    truck.root.visible = onScreen(wy);
    truck.uniforms.uDissolve.value = 0;
    truck.fade(1);
    if (truck.root.visible) truck.place(wait.x - scrollX, wy, heading(wait.tx, wait.ty));
  } else {
    // Going away from the reader into the garage: the truck shrinks, the door frame takes over
    // once the cab reaches the threshold, and the dark inside swallows it.
    // It shrinks along the forecourt so it fits the doorway, and again as it goes in.
    const inside = clamp01((progress - layout.upStart) / Math.max(1, layout.n - 1 - layout.upStart));
    const approach = clamp01((progress - layout.runStart) / Math.max(1, layout.upStart - layout.runStart));
    const scale = lerp(1, 0.74, smooth(approach)) * lerp(1, 0.72, smooth(inside));
    const cabReach = (3.1 * Math.sin(view.elevation) + 2.9 * Math.cos(view.elevation)) * view.ppu * scale;
    const shut = progress > layout.upStart && pose.y - cabReach < layout.doorBottom;
    store.classList.toggle('is-shut', shut);
    truck.yaw = truck.yaw === null ? yaw : lerpAngle(truck.yaw, yaw, turn);
    // Last stretch: what has passed the threshold takes the garage's own dark, then the
    // truck dissolves into it.
    const gone = smooth(clamp01((inside - 0.82) / 0.18));
    const pixelRatio = renderer.getPixelRatio();
    truck.uniforms.uShadeLine.value = (canvas.clientHeight - (layout.doorBottom - scrollY)) * pixelRatio;
    truck.uniforms.uShadeBand.value = 26 * pixelRatio;
    truck.root.visible = morph > 0 && gone < 1 && onScreen(sy);
    truck.uniforms.uDissolve.value = Math.max(1 - morph, gone);
    truck.uniforms.uEdgeColor.value.copy(gone > 0 ? truck.uniforms.uShadeColor.value : EDGE_GOLD);
    truck.uniforms.uShade.value = shut ? 0.9 : 0;
    truck.fade(morph * (1 - gone));
    if (truck.root.visible) truck.place(sx, sy, truck.yaw, scale);
  }

  stampables.forEach((el, i) => {
    if (still || progress >= layout.stamps[i]) el.classList.add('is-stamped');
  });
  if (still || progress >= layout.n - 1.5) dealer.classList.add('is-stamped');

  renderer.render(scene, camera);
  if (eased !== scrollY || swapping) wake();
}

function wake() {
  if (!raf) raf = requestAnimationFrame(frame);
}

function resize() {
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  buildRoute();
  eased = scrollY;
  progress = reduceMotion.matches ? 0 : indexAtScroll(eased);
  carYaw = null;
  truck && (truck.yaw = null);
  lastPose = null;
  wake();
}

/* ---------- Start ---------- */

// Soft studio reflections: light sky fading to a grey floor, with no window shapes,
// so car paint shows smooth, wide highlights.
function studioEnvironment(renderer) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, c.height);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.38, '#e8ebf3');
  grad.addColorStop(0.5, '#b8bdcc');
  grad.addColorStop(1, '#5c6176');
  g.fillStyle = grad;
  g.fillRect(0, 0, c.width, c.height);
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  const env = new PMREMGenerator(renderer).fromEquirectangular(tex).texture;
  tex.dispose();
  return env;
}

async function start() {
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    canvas.remove();
    buildRoute();
    stampables.forEach((e) => e.classList.add('is-stamped'));
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  scene = new Scene();
  scene.environment = studioEnvironment(renderer);
  const sun = new DirectionalLight(0xffffff, 1.0);
  sun.position.set(-4, 10, 6);
  scene.add(sun, new HemisphereLight(0xf2f4fa, 0x8d93aa, 0.55));
  camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 200);

  mercedes = new Vehicle(placeholderCar(0xc4c7ce));
  vw = new Vehicle(placeholderCar(0x5d6a86));
  truck = new Vehicle(placeholderTruck(), { dissolvable: true });
  truck.root.visible = false;
  // Full-size Mercedes and Volkswagen that can stand on the stage (placeholders until loaded).
  cars.mercedes = new Vehicle(placeholderCar(0xc4c7ce), { dissolvable: true });
  cars.vw = new Vehicle(placeholderCar(0x5d6a86), { dissolvable: true });
  for (const car of Object.values(cars)) car.root.visible = false;

  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  buildRoute();

  // All four models load together. The other three keep their placeholders if theirs fail.
  const [volvoGltf, mercedesGltf, vwGltf, truckGltf] = await Promise.allSettled(
    ['volvo-xc60', 'mercedes-c-class', 'vw-golf7', 'volvo-n88-truck'].map((name) => loadGltf(`assets/models/${name}.glb`)),
  );
  if (volvoGltf.status === 'rejected') {
    console.error('Volvo model failed to load', volvoGltf.reason);
    return;
  }
  volvo = new Vehicle(buildVehicle(volvoGltf.value), { dissolvable: true });
  volvo.presence = 1;
  cars.volvo = volvo;
  for (const [result, vehicles] of [[mercedesGltf, [mercedes, cars.mercedes]], [vwGltf, [vw, cars.vw]], [truckGltf, [truck]]]) {
    if (result.status === 'rejected') console.error('Vehicle model failed to load', result.reason);
    else for (const v of vehicles) v.setModel(buildVehicle(result.value));
  }
  // Compile every program before the first visible frame so the dissolve never stalls.
  renderer.compile(scene, camera);
  eased = scrollY;
  progress = reduceMotion.matches ? 0 : indexAtScroll(eased);
  canvas.classList.add('is-ready');
  wake();

  addEventListener('scroll', wake, { passive: true });
  brandForm?.addEventListener('change', wake);
  reduceMotion.addEventListener('change', resize);
  let pending = 0;
  new ResizeObserver(() => {
    cancelAnimationFrame(pending);
    pending = requestAnimationFrame(resize);
  }).observe(document.body);
  document.fonts?.ready.then(resize);
}

start();
