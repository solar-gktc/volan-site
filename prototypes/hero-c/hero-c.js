// Hero C, "Üç marka, tek tezgâh". One engine stands on the bench: the make chosen on the
// bench front (Volvo by default). It turns in, opens into its parts, and each part group is
// called out with leader lines to the service that works on it. The pointer turns it,
// scrolling away closes it again. Only the engine on the bench is loaded.
// Without WebGL (or if a model fails) the stage shows the exploded studio render instead.
import {
  WebGLRenderer, Scene, PerspectiveCamera, PMREMGenerator, DirectionalLight, HemisphereLight,
  Mesh, PlaneGeometry, MeshBasicMaterial, CanvasTexture, SRGBColorSpace, ACESFilmicToneMapping,
  Box3, Vector3, Vector2, Group, Raycaster, GLTFLoader, MeshoptDecoder,
} from 'three';

const BASE = 'prototypes/hero-c/';
const ENGINES = {
  volvo: { file: 'motor-volvo-drive-e', name: 'Volvo', engine: 'Drive-E', kb: 623, yaw: 0.62 },
  mercedes: { file: 'motor-mercedes-om654', name: 'Mercedes-Benz', engine: 'OM654', kb: 609, yaw: 0.62 },
  vw: { file: 'motor-vw-ea888-tsi', name: 'Volkswagen', engine: 'EA888 TSI', kb: 581, yaw: 0.62 },
};
const POSTER_ALT = {
  volvo: 'Volvo Drive-E motorunun parçalarına ayrılmış hâli.',
  mercedes: 'Mercedes-Benz OM654 motorunun parçalarına ayrılmış hâli.',
  vw: 'Volkswagen EA888 TSI motorunun parçalarına ayrılmış hâli.',
};
// Part groups by the service that works on them. Node names are the models' own.
const GROUPS = {
  bakim: ['yag-filtresi', 'yag-cubugu', 'kayis'],
  mekanik: ['triger-kapagi', 'turbo', 'silindir-kapagi'],
  elektronik: ['kablo-demeti', 'alternator'],
  ariza: ['blok', 'hortumlar'],
};
const EXPLODE = 0.82; // share of the offsets in the JSON
const PULL = 0.22; // extra opening of the group under the pointer
const FOV = 24;
const ELEV = 0.34; // camera elevation, radians

const root = document.querySelector('[data-tezgah]');
if (root) start(root);

function start(root) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stage = root.querySelector('[data-stage]');
  const canvas = root.querySelector('[data-canvas]');
  const svg = root.querySelector('[data-lines]');
  const poster = root.querySelector('[data-poster]');
  const statusText = root.querySelector('[data-status-text]');
  const meter = root.querySelector('[data-meter]');
  const callouts = [...root.querySelectorAll('.callout')];
  const radios = [...root.querySelectorAll('input[name="tezgah-motor"]')];
  const params = new URLSearchParams(location.search);

  root.classList.add('js-stage');

  const flat = (key) => {
    root.classList.remove('is-live', 'is-switching', 'is-loading');
    root.classList.add('is-flat');
    poster.src = `${BASE}img/${ENGINES[key].file}-patlatilmis.webp`;
    poster.alt = POSTER_ALT[key];
  };

  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    radios.forEach((r) => r.addEventListener('change', () => flat(r.value)));
    flat(radios.find((r) => r.checked)?.value || 'volvo');
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = studioScene(renderer);
  const camera = new PerspectiveCamera(FOV, 1, 0.05, 50);
  const pivot = new Group();
  scene.add(pivot);
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);

  /* ---------- Loading one engine ---------- */

  const cache = new Map();
  let wanted = null;

  function fetchEngine(key) {
    if (cache.has(key)) return cache.get(key);
    const e = ENGINES[key];
    const glb = new Promise((res, rej) => loader.load(`${BASE}models/${e.file}.glb`, res, (ev) => {
      if (wanted === key && ev.total) meter.style.setProperty('--p', (ev.loaded / ev.total).toFixed(3));
    }, rej));
    const json = fetch(`${BASE}models/${e.file}-patlatma.json`).then((r) => r.json());
    const p = Promise.all([glb, json]).then(([gltf, offsets]) => prepare(key, gltf.scene, offsets));
    cache.set(key, p);
    p.catch(() => cache.delete(key));
    return p;
  }

  function prepare(key, model, offsets) {
    const groupOf = {};
    for (const [g, names] of Object.entries(GROUPS)) for (const n of names) groupOf[n] = g;
    const entries = Object.entries(offsets)
      .map(([n, v]) => {
        const node = model.getObjectByName(n);
        return node && { name: n, node, rest: node.position.clone(), off: new Vector3(...v), group: groupOf[n] || null, p: 0, pull: 0 };
      })
      .filter(Boolean);
    // Top parts lift first: the order of the offsets' height.
    [...entries].sort((a, b) => b.off.y - a.off.y || b.off.length() - a.off.length())
      .forEach((e, i) => { e.delay = i * 55; });
    const byNode = new Map(entries.map((e) => [e.node, e]));

    // Each mesh gets its own material so a part can be faded alone.
    const meshes = [];
    model.traverse((o) => {
      if (!o.isMesh) return;
      o.material = o.material.clone();
      o.material.transparent = true;
      o.userData.base = o.material.opacity;
      o.userData.ghost = 0;
      let up = o;
      while (up && !byNode.has(up)) up = up.parent;
      o.userData.entry = up ? byNode.get(up) : null;
      meshes.push(o);
    });

    const set = (t) => { for (const e of entries) e.node.position.copy(e.rest).addScaledVector(e.off, t * EXPLODE); };
    set(0);
    model.updateMatrixWorld(true);
    const restBox = new Box3().setFromObject(model);
    set(1);
    model.updateMatrixWorld(true);
    const openBox = new Box3().setFromObject(model);
    set(0);
    const c = openBox.getCenter(new Vector3());
    model.position.set(-c.x, -restBox.min.y, -c.z);
    openBox.translate(model.position);
    restBox.translate(model.position);

    const holder = new Group();
    holder.add(model);
    const rs = restBox.getSize(new Vector3());
    const shadow = contactShadow(rs.x * 1.25, rs.z * 1.25);
    shadow.position.set(restBox.getCenter(new Vector3()).x, 0.002, restBox.getCenter(new Vector3()).z);
    holder.add(shadow);

    // Corners of every part at the open pose, in the holder's space: the fit uses these.
    set(1);
    holder.updateMatrixWorld(true);
    const corners = [];
    for (const e of entries) corners.push(...boxCorners(new Box3().setFromObject(e.node)));
    set(0);
    holder.updateMatrixWorld(true);

    const groups = {};
    for (const g of Object.keys(GROUPS)) groups[g] = entries.filter((e) => e.group === g);
    return { key, holder, model, entries, meshes, groups, openBox, corners };
  }

  /* ---------- Callouts and leader lines ---------- */

  const NS = 'http://www.w3.org/2000/svg';
  const leaders = {};
  for (const el of callouts) {
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'leader');
    svg.append(g);
    leaders[el.dataset.group] = { el, g, paths: [], dots: [], root: null, main: 0, r: { x: 0, y: 0 }, dir: { x: 1, y: 0 } };
  }

  function buildLeaders(eng) {
    for (const [key, L] of Object.entries(leaders)) {
      L.g.replaceChildren();
      L.paths = [];
      L.dots = [];
      for (let i = 0; i < eng.groups[key].length; i++) {
        const p = document.createElementNS(NS, 'path');
        p.setAttribute('pathLength', '1');
        L.g.append(p);
        L.paths.push(p);
      }
      for (let i = 0; i < eng.groups[key].length; i++) {
        const d = document.createElementNS(NS, 'circle');
        d.setAttribute('r', '3.5');
        L.g.append(d);
        L.dots.push(d);
      }
      L.root = document.createElementNS(NS, 'circle');
      L.root.setAttribute('r', '3');
      L.root.setAttribute('class', 'leader__root');
      L.g.append(L.root);
    }
  }

  let W = 0, H = 0;
  const v = new Vector3();
  const toScreen = (obj) => {
    obj.getWorldPosition(v).project(camera);
    return { x: (v.x + 1) * 0.5 * W, y: (1 - v.y) * 0.5 * H };
  };
  const narrow = () => W < 620;

  // Fit the opened engine into the space the callouts leave, standing on the bench edge.
  function fit(eng) {
    W = stage.clientWidth;
    H = stage.clientHeight;
    if (!W || !H) return;
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.clearViewOffset();
    const cw = callouts[0].offsetWidth || 190;
    const box = { l: 0, r: W, t: 0, b: H };
    if (narrow()) {
      box.l = 12; box.r = W - 12; box.t = calloutBandHeight() + 34; box.b = H - 8;
    } else {
      box.l = 44; box.r = W - cw - 64; box.t = 20; box.b = H - 14;
    }
    const pose = { yaw: ENGINES[eng.key].yaw, elev: ELEV };
    pivot.rotation.y = pose.yaw;
    const target = new Vector3(0, eng.openBox.getCenter(new Vector3()).y, 0);
    const corners = eng.corners;
    let dist = eng.openBox.getSize(new Vector3()).length() * 2.2;
    let rect;
    for (let i = 0; i < 3; i++) {
      placeCamera(target, dist, pose.elev);
      rect = projectRect(corners);
      const k = Math.max(rect.w / (box.r - box.l), rect.h / (box.b - box.t));
      dist *= k;
    }
    placeCamera(target, dist, pose.elev);
    rect = projectRect(corners);
    const dx = (box.l + box.r) / 2 - (rect.x + rect.w / 2);
    const dy = box.b - (rect.y + rect.h);
    camera.setViewOffset(W, H, -dx, -dy, W, H);
    camera.updateProjectionMatrix();
    eng.dist = dist;
    eng.target = target;
  }
  function placeCamera(target, dist, elev) {
    camera.position.set(0, target.y + Math.sin(elev) * dist, Math.cos(elev) * dist);
    camera.lookAt(target);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    pivot.updateMatrixWorld(true);
  }
  function boxCorners(b) {
    const out = [];
    for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) out.push(new Vector3(x, y, z));
    return out;
  }
  function projectRect(corners) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const c of corners) {
      v.copy(c).applyMatrix4(pivot.matrixWorld).project(camera);
      const x = (v.x + 1) * 0.5 * W, y = (1 - v.y) * 0.5 * H;
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    }
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }
  function calloutBandHeight() {
    const h = callouts.map((c) => c.offsetHeight || 60);
    return Math.max(h[0], h[1]) + Math.max(h[2], h[3]) + 10 + 8;
  }

  // Place the callouts once per engine and size: beside the parts they name.
  function layoutCallouts(eng) {
    // Measure at the open pose.
    const keep = eng.entries.map((e) => e.node.position.clone());
    for (const e of eng.entries) e.node.position.copy(e.rest).addScaledVector(e.off, EXPLODE);
    pivot.rotation.y = ENGINES[eng.key].yaw;
    pivot.updateMatrixWorld(true);
    const items = Object.entries(leaders).map(([key, L]) => {
      const pts = eng.groups[key].map((e) => toScreen(e.node));
      const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
      const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
      return { key, L, pts, cx, cy, w: L.el.offsetWidth, h: L.el.offsetHeight };
    });
    eng.entries.forEach((e, i) => e.node.position.copy(keep[i]));

    const byX = [...items].sort((a, b) => a.cx - b.cx);
    const nearest = (it, r) => {
      let best = 0, bd = Infinity;
      it.pts.forEach((p, i) => { const d = Math.hypot(p.x - r.x, p.y - r.y); if (d < bd) { bd = d; best = i; } });
      it.L.main = best;
    };
    if (narrow()) {
      // Two columns of two at the top of the stage; lines run down to the parts.
      const left = byX.slice(0, 2).sort((a, b) => a.cy - b.cy);
      const right = byX.slice(2).sort((a, b) => a.cy - b.cy);
      const pad = 16;
      let y = 6;
      const rowH = [Math.max(left[0].h, right[0].h), Math.max(left[1].h, right[1].h)];
      // The two columns mirror each other around a centre gutter; the lines leave toward
      // the gutter and run down it, side by side, to below the list.
      const mid = W / 2;
      const rows = [[left[0], right[0]], [left[1], right[1]]];
      const bottom = 6 + rowH[0] + 10 + rowH[1];
      rows.forEach((row, r) => {
        row.forEach((it, c) => {
          const x = c === 0 ? mid - 22 - it.w : mid + 22;
          place(it, x, y, c === 0 ? 'left' : 'right');
          it.L.el.dataset.col = c === 0 ? 'left' : 'right';
          const lane = (r === 0 ? 7 : 15) * (c === 0 ? -1 : 1);
          it.L.r = { x: c === 0 ? x + it.w + 4 : x - 4, y: y + 15 };
          it.L.via = [{ x: mid + lane, y: y + 15 }, { x: mid + lane, y: bottom + 18 + r * 10 }];
          it.L.dir = null;
          nearest(it, it.L.via[1]);
        });
        y += rowH[r] + 10;
      });
      order(rows.flat());
      return;
    }
    // One column on the right, like the parts list beside a manual's drawing. Each entry
    // sits level with the part of its group that is nearest to the column.
    const x = W - items[0].w;
    for (const it of items) { nearest(it, { x: W, y: it.cy }); it.ay = it.pts[it.L.main].y; }
    const side = [...items].sort((a, b) => a.ay - b.ay);
    const room = H - 36 - side.reduce((t, it) => t + it.h, 0);
    const gap = Math.max(8, Math.min(26, room / (side.length - 1)));
    const ys = side.map((it) => it.ay - 15);
    for (let i = 1; i < ys.length; i++) ys[i] = Math.max(ys[i], ys[i - 1] + side[i - 1].h + gap);
    for (let i = ys.length - 1; i >= 0; i--) ys[i] = Math.min(ys[i], (i === ys.length - 1 ? H - 20 : ys[i + 1] - gap) - side[i].h);
    for (let i = 0; i < ys.length; i++) ys[i] = Math.max(ys[i], i ? ys[i - 1] + side[i - 1].h + gap : 16);
    side.forEach((it, i) => {
      place(it, x, ys[i], 'right');
      delete it.L.el.dataset.col;
      it.L.r = { x: x - 12, y: ys[i] + 15 };
      it.L.dir = { x: -1, y: 0 };
      it.L.via = null;
    });
    order(side);
  }
  // Keyboard order follows the order on screen.
  function order(list) {
    const ul = list[0].L.el.parentNode;
    for (const it of list) ul.append(it.L.el);
  }
  function place(it, x, y, side) {
    it.L.el.style.setProperty('--x', `${Math.round(x)}px`);
    it.L.el.style.setProperty('--y', `${Math.round(y)}px`);
    it.L.el.dataset.side = side;
  }

  function drawLeaders(eng) {
    for (const [key, L] of Object.entries(leaders)) {
      const { r, dir } = L;
      const via = L.via || [{ x: r.x + dir.x * 26, y: r.y + dir.y * 26 }];
      const mid = via.map((q) => `L${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join('');
      L.root.setAttribute('cx', r.x.toFixed(1));
      L.root.setAttribute('cy', r.y.toFixed(1));
      eng.groups[key].forEach((e, i) => {
        const more = i !== L.main;
        L.paths[i].classList.toggle('leader__more', more);
        L.dots[i].classList.toggle('leader__more', more);
        const p = toScreen(e.node);
        L.paths[i].setAttribute('d', `M${r.x.toFixed(1)} ${r.y.toFixed(1)}${mid}L${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
        L.dots[i].setAttribute('cx', p.x.toFixed(1));
        L.dots[i].setAttribute('cy', p.y.toFixed(1));
      });
    }
  }

  /* ---------- Hover: a callout or a part lights its group ---------- */

  let hot = null;
  function setHot(key) {
    if (hot === key) return;
    hot = key;
    root.classList.toggle('has-hot', !!key);
    for (const [k, L] of Object.entries(leaders)) {
      L.g.classList.toggle('is-hot', k === key);
      L.el.classList.toggle('is-hot', k === key);
    }
    kick();
  }
  for (const el of callouts) {
    const a = el.querySelector('a');
    a.addEventListener('pointerenter', () => setHot(el.dataset.group));
    a.addEventListener('pointerleave', () => setHot(null));
    a.addEventListener('focus', () => setHot(el.dataset.group));
    a.addEventListener('blur', () => setHot(null));
    a.addEventListener('click', (e) => openService(e, a));
  }

  // Open the service sheet through the page's own hash handler, without the jump to the
  // printed article; when the sheet closes, come back to the bench.
  let returnTo = null;
  function openService(e, a) {
    const sheet = document.querySelector('.sheet');
    if (!sheet || typeof sheet.showModal !== 'function') return;
    e?.preventDefault();
    returnTo = { a, y: scrollY };
    history.replaceState(null, '', a.getAttribute('href'));
    dispatchEvent(new HashChangeEvent('hashchange'));
  }
  document.querySelector('.sheet')?.addEventListener('close', () => {
    if (!returnTo) return;
    const { a, y } = returnTo;
    returnTo = null;
    scrollTo({ top: y, behavior: 'instant' });
    a.focus({ preventScroll: true });
  });

  const ray = new Raycaster();
  const ndc = new Vector2();
  let mouse = null; // pointer over the canvas, in stage pixels
  let pointer = { x: 0.5, y: 0.5 }; // over the hero, 0..1
  root.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    pointer = { x: e.clientX / innerWidth, y: e.clientY / innerHeight };
    kick();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = canvas.getBoundingClientRect();
    mouse = { x: e.clientX - r.left, y: e.clientY - r.top };
  });
  canvas.addEventListener('pointerleave', () => { mouse = null; if (partHot) { partHot = false; setHot(null); root.classList.remove('is-hot'); } });
  let partHot = false;
  function pickPart(eng) {
    if (!mouse) return;
    ndc.set((mouse.x / W) * 2 - 1, -(mouse.y / H) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObject(eng.model, true).find((h) => h.object.isMesh && h.object.userData.entry);
    const g = hit?.object.userData.entry.group || null;
    root.classList.toggle('is-hot', !!g);
    if (g || partHot) { partHot = !!g; setHot(g); }
    mouse = null;
  }
  canvas.addEventListener('click', () => {
    if (!hot || !partHot) return;
    const a = leaders[hot].el.querySelector('a');
    openService(null, a);
  });

  // Touch: a sideways drag turns the engine; vertical scrolling stays the page's.
  let drag = null, dragYaw = 0;
  canvas.style.touchAction = 'pan-y';
  canvas.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') drag = { x: e.clientX, y: e.clientY, yaw: dragYaw }; });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerType === 'mouse') return;
    dragYaw = Math.max(-1.2, Math.min(1.2, drag.yaw + (e.clientX - drag.x) * 0.008));
    kick();
  });
  const endDrag = () => { drag = null; };
  // A tap on a part lights its group, as hovering does with a mouse.
  canvas.addEventListener('pointerup', (e) => {
    if (drag && cur && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 8) {
      const r = canvas.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / W) * 2 - 1, -((e.clientY - r.top) / H) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObject(cur.model, true).find((h) => h.object.isMesh && h.object.userData.entry);
      setHot(hit?.object.userData.entry.group || null);
    }
    endDrag();
  });
  canvas.addEventListener('pointercancel', endDrag);

  /* ---------- Showing an engine ---------- */

  let cur = null;
  let t0 = 0; // start of the current entrance
  let closing = null; // { from, start } while the old engine closes
  const state = { yaw: 0, elev: ELEV, scroll: 0 };

  async function show(key) {
    wanted = key;
    const e = ENGINES[key];
    const ready = cache.has(key);
    statusText.textContent = `${e.name} ${e.engine} tezgâha geliyor · ${e.kb} KB`;
    meter.style.setProperty('--p', ready ? 1 : 0);
    root.classList.toggle('is-loading', !ready || !cur);
    root.classList.remove('is-error');
    let wait = Promise.resolve();
    if (cur) {
      root.classList.add('is-switching');
      root.classList.remove('is-live');
      for (const L of Object.values(leaders)) { L.g.classList.remove('is-on'); L.el.classList.remove('is-on'); }
      closing = { start: performance.now() };
      kick();
      if (!reduce) wait = new Promise((r) => setTimeout(r, 300));
    }
    let eng;
    try {
      [eng] = await Promise.all([fetchEngine(key), wait]);
    } catch {
      if (wanted !== key) return;
      statusText.textContent = `${e.name} motoru yüklenemedi. Fotoğrafını gösteriyoruz.`;
      flat(key);
      return;
    }
    if (wanted !== key) return;
    closing = null;
    if (cur) pivot.remove(cur.holder);
    cur = eng;
    pivot.add(eng.holder);
    for (const en of eng.entries) { en.p = 0; en.pull = 0; }
    for (const m of eng.meshes) { m.userData.ghost = 0; m.material.opacity = m.userData.base; m.material.depthWrite = true; }
    buildLeaders(eng);
    root.classList.remove('is-loading', 'is-switching', 'is-flat');
    root.classList.add('is-live');
    fit(eng);
    layoutCallouts(eng);
    poster.alt = POSTER_ALT[key];
    t0 = performance.now();
    if (reduce) {
      for (const L of Object.values(leaders)) { L.g.classList.add('is-on'); L.el.classList.add('is-on'); }
    }
    kick();
  }

  /* ---------- The frame ---------- */

  const expo = (x) => (x >= 1 ? 1 : 1 - 2 ** (-10 * x));
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!cur) return false;
    let moving = false;
    const rest = ENGINES[cur.key].yaw;
    const since = reduce ? 1e6 : now - t0;
    const turnIn = reduce ? 0 : -0.95 * (1 - expo(since / 1700));

    // Close as the stage scrolls up out of view, and turn a little with it.
    const sr = stage.getBoundingClientRect();
    const top = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--menu-offset')) || 0;
    const scroll = reduce ? 0 : Math.min(1, Math.max(0, (top + 8 - sr.top) / (sr.height * 0.8)));
    const k = 1 - Math.exp(-6 * dt);
    const px = reduce ? 0 : (pointer.x - 0.5) * 0.7;
    const py = reduce ? 0 : (pointer.y - 0.5) * 0.16;
    const yawT = rest + turnIn + px + dragYaw + scroll * 0.7;
    state.yaw += (yawT - state.yaw) * (reduce || since < 40 ? 1 : k);
    state.elev += (ELEV + py - state.elev) * (reduce ? 1 : k);
    if (Math.abs(yawT - state.yaw) > 1e-4 || since < 2600) moving = true;
    pivot.rotation.y = state.yaw;
    placeCamera(cur.target, cur.dist, state.elev);

    const closeK = closing && !reduce ? 1 - expo((now - closing.start) / 300) : 1;
    const openAll = (1 - 0.72 * scroll) * closeK;
    for (const e of cur.entries) {
      const p = reduce ? 1 : expo(Math.max(0, Math.min(1, (since - 380 - e.delay) / 1150)));
      e.p = p;
      const pullT = hot && e.group === hot ? 1 : 0;
      e.pull += (pullT - e.pull) * (reduce ? 1 : Math.min(1, dt * 10));
      if (Math.abs(pullT - e.pull) > 1e-3) moving = true;
      e.node.position.copy(e.rest).addScaledVector(e.off, EXPLODE * p * openAll + PULL * e.pull * openAll);
    }
    for (const m of cur.meshes) {
      const g = m.userData.entry?.group;
      const target = hot && g !== hot ? 1 : 0;
      const gh = m.userData.ghost + (target - m.userData.ghost) * (reduce ? 1 : Math.min(1, dt * 9));
      if (Math.abs(target - gh) > 1e-3) moving = true;
      m.userData.ghost = gh;
      m.material.opacity = m.userData.base * (1 - 0.74 * gh);
      m.material.depthWrite = gh < 0.5;
    }

    // Each callout is printed once its parts have nearly reached their place.
    if (!reduce && !closing) {
      for (const [key, L] of Object.entries(leaders)) {
        if (L.g.classList.contains('is-on')) continue;
        if (cur.groups[key].every((e) => e.p > 0.72)) { L.g.classList.add('is-on'); L.el.classList.add('is-on'); }
      }
    }

    pivot.updateMatrixWorld(true);
    pickPart(cur);
    renderer.render(scene, camera);
    drawLeaders(cur);
    return moving || !!closing;
  }

  // Render while something moves and the hero is on screen.
  let visible = true, raf = 0;
  function kick() {
    if (raf || !visible) return;
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }
  function loop(now) {
    raf = 0;
    const more = frame(now);
    if (more && visible) raf = requestAnimationFrame(loop);
  }
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); }).observe(root);
  addEventListener('scroll', kick, { passive: true });
  new ResizeObserver(() => {
    if (!cur) return;
    fit(cur);
    layoutCallouts(cur);
    kick();
  }).observe(stage);

  // Callout heights change once the web fonts arrive.
  document.fonts?.ready.then(() => { if (cur) { fit(cur); layoutCallouts(cur); kick(); } });

  radios.forEach((r) => r.addEventListener('change', () => {
    if (root.classList.contains('is-flat') && cache.has(r.value) === false) {
      // A model failed before: try this one live again.
      root.classList.remove('is-flat');
    }
    show(r.value);
  }));

  const first = params.get('motor') && ENGINES[params.get('motor')] ? params.get('motor') : (radios.find((r) => r.checked)?.value || 'volvo');
  radios.forEach((r) => { r.checked = r.value === first; });
  if (params.has('yaw')) for (const e of Object.values(ENGINES)) e.yaw = Number(params.get('yaw'));
  show(first);
}

/* ---------- Light, as on Hakkımızda ---------- */

function studioScene(renderer) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 128;
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
  const scene = new Scene();
  scene.environment = new PMREMGenerator(renderer).fromEquirectangular(tex).texture;
  tex.dispose();
  const sun = new DirectionalLight(0xffffff, 1.0);
  sun.position.set(-4, 10, 6);
  scene.add(sun, new HemisphereLight(0xf2f4fa, 0x8d93aa, 0.55));
  return scene;
}

function contactShadow(w, d) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 2, 64, 64, 64);
  grad.addColorStop(0, 'rgba(20,20,40,0.5)');
  grad.addColorStop(0.5, 'rgba(20,20,40,0.24)');
  grad.addColorStop(1, 'rgba(20,20,40,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const m = new Mesh(new PlaneGeometry(w, d), new MeshBasicMaterial({ map: new CanvasTexture(c), transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = -1;
  return m;
}
