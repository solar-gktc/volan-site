// Tesisimiz: the facade photo hands over to the 3D building on scroll, the walls lift away
// and the floors separate; then numbered pins open each unit's card beside the model.
// Model: assets/models/tesis.glb, made by tools/tesis-model.sh from ../facility-modelling.
// Three.js coordinates: X along the facade (left to right), Y up, the facade faces +Z.

import * as THREE from 'three';
import { GLTFLoader, MeshoptDecoder, RoomEnvironment } from 'three';
import { OrbitControls } from '../vendor/OrbitControls.js';

const MODEL_URL = 'assets/models/tesis.glb';

const tour = document.querySelector('[data-tour]');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const narrowMQ = matchMedia('(max-width: 899.98px)');

// ---------- The seven units, in the client's order ----------
// zone: where the pin stands (a zone empty in the model); at: shift along the zone's width.
// cards: what opens (the first is the one asked for); frame: zones the camera fits.
const UNITS = {
  mekanik: { zone: 'mechanics2', floor: 'main', cards: ['mekanik', 'bakim'], frame: ['mechanics1', 'mechanics2'] },
  elektrik: { zone: 'mechanics1', floor: 'main', cards: ['elektrik'], frame: ['mechanics1'] },
  tespit: { zone: 'office', at: -0.26, floor: 'main', cards: ['tespit'], frame: ['office'] },
  kuafor: { zone: 'detailing', floor: 'main', cards: ['kuafor'], frame: ['detailing'], side: -1 },
  kaporta: { zone: 'bodyshop', at: -0.18, floor: 'lower', cards: ['kaporta'], frame: ['bodyshop', 'oven'] },
  ofis: { zone: 'office', at: 0.26, floor: 'main', cards: ['ofis'], frame: ['office'] },
  bekleme: { zone: 'lounge', floor: 'upper', cards: ['bekleme'], frame: ['lounge'] },
};
// Cards that belong to another unit's pin (Yıllık Bakım is the second Mekanik card).
const CARD_PIN = { bakim: 'mekanik' };
// A click on the building itself: either workshop opens Mekanik's two cards; the office
// opens both of its cards.
const ZONE_UNIT = {
  mechanics1: ['mekanik'],
  mechanics2: ['mekanik'],
  office: ['tespit', ['tespit', 'ofis']],
  detailing: ['kuafor'],
  bodyshop: ['kaporta'],
  oven: ['kaporta'],
  lounge: ['bekleme'],
};

if (tour) start();

function start() {
  const $ = (s) => tour.querySelector(s);
  const frameEl = $('[data-frame]');
  const photo = $('[data-photo]');
  const cover = $('[data-cover]');
  const address = $('[data-address]');
  const canvasBox = $('[data-canvas]');
  const pinsBox = $('[data-pins]');
  const leads = $('[data-leads]');
  const cardsBox = $('[data-cards]');
  const status = $('[data-status]');
  const resetBtn = $('[data-reset]');
  const unitButtons = [...tour.querySelectorAll('[data-unit]')];
  const cards = Object.fromEntries([...tour.querySelectorAll('[data-card]')].map((el) => [el.dataset.card, el]));
  const cardUnit = Object.fromEntries(Object.entries(cards).map(([k, el]) => [el.id, CARD_PIN[k] || k]));

  stampDealer();

  // ---------- Renderer: without WebGL the page stays a static leaf ----------
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (error) {
    console.warn('Tesisimiz: WebGL is not available; showing the still page.', error);
    return;
  }
  tour.classList.add('is-live');
  if (reduced.matches) tour.classList.add('is-still');

  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  canvasBox.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.6;
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight('#f2f4fa', '#8d93aa', 1.6));
  const sun = new THREE.DirectionalLight('#ffffff', 2.6);
  sun.position.set(-18, 46, 30);
  sun.target.position.set(0, 0, -6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -42, right: 42, top: 42, bottom: -42, near: 1, far: 140 });
  sun.shadow.normalBias = 0.04;
  scene.add(sun, sun.target);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), new THREE.ShadowMaterial({ color: 0x2b2a29, opacity: 0.16 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -4.7;
  ground.receiveShadow = true;
  scene.add(ground);

  const camera = new THREE.PerspectiveCamera(30, 1, 0.5, 600);
  const controls = new OrbitControls(camera, renderer.domElement);
  Object.assign(controls, {
    enabled: false, enableZoom: false, enablePan: false, enableDamping: true, dampingFactor: 0.09,
    rotateSpeed: 0.6, minPolarAngle: 0.32, maxPolarAngle: 1.32,
  });
  // Vertical swipes scroll the page; sideways drags turn the building.
  renderer.domElement.style.touchAction = 'pan-y';

  // ---------- State ----------
  const S = {
    model: null, roots: null, base: new Map(), zones: new Map(), cutParts: [], materials: new Map(),
    w: 1, h: 1, p: reduced.matches ? 1 : 0, open: false, sel: null,
    poses: null, tween: null, offset: { x: 0, y: 0 }, offsetGoal: { x: 0, y: 0 },
    explode: 0, lift: 0, floorShown: null, frameRequested: false,
  };
  const pins = {};

  // ---------- Pins ----------
  for (const btn of unitButtons) {
    const key = btn.dataset.unit;
    const pin = document.createElement('button');
    pin.type = 'button';
    pin.className = 'tour__pin';
    pin.dataset.unit = key;
    pin.setAttribute('aria-pressed', 'false');
    pin.hidden = true;
    const num = btn.querySelector('.tour__num').textContent;
    const name = btn.textContent.replace(num, '').trim();
    pin.innerHTML = `<span aria-hidden="true">${num}</span><span class="tour__pin-label">${name}</span>`;
    pin.setAttribute('aria-label', `${num}. ${name}`);
    pin.addEventListener('click', () => select(key));
    pinsBox.appendChild(pin);
    pins[key] = pin;
    btn.addEventListener('click', () => (S.sel?.key === key ? close() : select(key)));
  }
  for (const btn of tour.querySelectorAll('[data-close]')) btn.addEventListener('click', () => close(true));
  resetBtn.addEventListener('click', () => close(true));
  for (const btn of tour.querySelectorAll('[data-zoom]')) btn.addEventListener('click', () => zoom(Number(btn.dataset.zoom)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && S.sel && !document.documentElement.classList.contains('menu-open')) close(true);
  });

  // "Binayı gez" scrolls to the opened building.
  tour.querySelector('[data-go]').addEventListener('click', (e) => {
    e.preventDefault();
    goToBuilding(reduced.matches ? 'auto' : 'smooth');
  });

  // ---------- Layout and poses ----------
  // The pinned scene: OPEN of scroll opens the building. The walk starts the moment it is
  // open (OPEN_AT of OPEN): one STEP per unit, in order (1 Mekanik … 7 Bekleme Salonu),
  // then a short REST before the contact section. Lengths are in screen heights.
  const ORDER = unitButtons.map((b) => b.dataset.unit);
  const LEN = { open: 1.9, step: 1, rest: 0.45 };
  const OPEN_AT = 0.76;
  const WALK_AT = OPEN_AT * LEN.open;
  const still = () => tour.classList.contains('is-still');
  const tourTop = () => tour.getBoundingClientRect().top + scrollY;
  function sizeTour() {
    const vh = frameEl.clientHeight || innerHeight;
    S.vh = vh;
    tour.style.height = still() ? '' : `${Math.round(vh * (1 + WALK_AT + ORDER.length * LEN.step + LEN.rest))}px`;
  }
  function openPoint() {
    if (still()) return tour.querySelector('[data-stage]').getBoundingClientRect().top + scrollY;
    return tourTop() + 0.82 * LEN.open * S.vh;
  }
  function stepPoint(key) {
    const i = ORDER.indexOf(key);
    return tourTop() + (WALK_AT + (i + 0.3) * LEN.step) * S.vh;
  }
  function goToBuilding(behavior) {
    scrollTo({ top: openPoint(), behavior });
  }

  function resize() {
    sizeTour();
    const r = canvasBox.getBoundingClientRect();
    S.w = Math.max(1, Math.round(r.width));
    S.h = Math.max(1, Math.round(r.height));
    renderer.setPixelRatio(Math.min(devicePixelRatio, S.w < 900 ? 1.75 : 2));
    renderer.setSize(S.w, S.h, false);
    camera.aspect = S.w / S.h;
    applyOffset();
    if (S.model) {
      S.poses = makePoses();
      if (S.open && !S.sel) setPose(S.poses.over);
      if (S.sel) frameSelection(false);
    }
    update();
  }
  new ResizeObserver(resize).observe(canvasBox);

  function applyOffset() {
    if (S.offset.x || S.offset.y) camera.setViewOffset(S.w, S.h, S.offset.x, S.offset.y, S.w, S.h);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  }

  // The distance at which a box fits the view, found by projecting its corners.
  const corners = Array.from({ length: 8 }, () => new THREE.Vector3());
  function fitDistance(box, target, dir, margin) {
    const c = box;
    const keepPos = camera.position.clone();
    const keepQuat = camera.quaternion.clone();
    let lo = 2, hi = 600;
    for (let i = 0; i < 22; i++) {
      const d = (lo + hi) / 2;
      camera.position.copy(target).addScaledVector(dir, d);
      camera.lookAt(target);
      camera.updateMatrixWorld(true);
      let fits = true;
      let k = 0;
      for (const x of [c.min.x, c.max.x]) for (const y of [c.min.y, c.max.y]) for (const z of [c.min.z, c.max.z]) {
        const v = corners[k++].set(x, y, z).project(camera);
        if (Math.abs(v.x) > 1 - margin.x || Math.abs(v.y) > 1 - margin.y || v.z > 1) fits = false;
      }
      if (fits) hi = d; else lo = d;
    }
    camera.position.copy(keepPos);
    camera.quaternion.copy(keepQuat);
    camera.updateMatrixWorld(true);
    return hi;
  }

  const FOV = 30;
  function pose(target, dir, distance, fov = FOV) {
    return { target: target.clone(), dir: dir.clone().normalize(), d: distance, fov };
  }

  function makePoses() {
    const narrow = S.w / S.h < 0.95;
    const saved = { x: S.offset.x, y: S.offset.y };
    S.offset.x = S.offset.y = 0;
    camera.fov = FOV;
    applyOffset();
    // Front: low and from the left, where the photograph was taken (matched by overlay at
    // 1440×900). The field of view follows how much of the photo's height the crop shows.
    const photoScale = Math.max(S.w / 2000, S.h / 1026);
    const fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(25)) * (S.h / photoScale) / 1026));
    const eye = new THREE.Vector3(-13, 1.7, 15);
    const look = narrow ? new THREE.Vector3(1.1, 8.6, 0) : new THREE.Vector3(-1, 9.2, -5);
    const front = pose(look, eye.clone().sub(look), eye.distanceTo(look), fov);
    // Overview: the building opened, floors apart, seen from front right and above.
    const overBox = new THREE.Box3(new THREE.Vector3(-25, -4.7, -12.5), new THREE.Vector3(25, 19.5, 2));
    const overTarget = new THREE.Vector3(0, narrow ? 6.5 : 6, -6);
    const overDir = narrow ? new THREE.Vector3(0.95, 0.85, 0.75) : new THREE.Vector3(0.52, 0.5, 0.7);
    const bottom = (narrow ? 64 : 92) / S.h; // room for the bar
    const over = pose(overTarget, overDir, fitDistance(overBox, overTarget, overDir.clone().normalize(), { x: narrow ? 0.04 : 0.1, y: 0.1 + bottom }));
    S.offset.x = saved.x; S.offset.y = saved.y;
    applyOffset();
    return { front, over };
  }

  function setPose(p) {
    const fov = p.fov ?? FOV;
    if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
    controls.target.copy(p.target);
    camera.position.copy(p.target).addScaledVector(p.dir, p.d);
    camera.lookAt(p.target);
  }

  function lerpPose(a, b, t) {
    return {
      target: a.target.clone().lerp(b.target, t),
      dir: a.dir.clone().lerp(b.dir, t).normalize(),
      d: a.d + (b.d - a.d) * t,
      fov: (a.fov ?? FOV) + ((b.fov ?? FOV) - (a.fov ?? FOV)) * t,
    };
  }

  const smooth = (a, b, x) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };

  // ---------- The scroll scene ----------
  function scrolled() {
    return -tour.getBoundingClientRect().top;
  }
  function progress() {
    if (still()) return 1;
    return Math.min(1, Math.max(0, scrolled() / (LEN.open * S.vh)));
  }
  // Which unit the walk is on: -1 before it starts, ORDER.length in the rest after it.
  function walkStep() {
    if (still() || !S.vh) return -1;
    const y = scrolled() - WALK_AT * S.vh;
    if (y < 0) return -1;
    return Math.min(ORDER.length, Math.floor(y / (LEN.step * S.vh)));
  }

  function onScroll() {
    S.p = progress();
    update();
    walk();
  }

  function walk() {
    const step = walkStep();
    if (step === S.step) return;
    const was = S.step;
    S.step = step;
    if (!S.open) return;
    if (step >= 0 && step < ORDER.length) select(ORDER[step]);
    else if (was !== undefined && was >= 0 && was < ORDER.length) close(true);
  }
  addEventListener('scroll', onScroll, { passive: true });

  function update() {
    const p = S.p;
    const still = tour.classList.contains('is-still');
    // Photo and cover panel.
    const fade = still ? 0 : smooth(0.1, 0.2, p);
    photo.style.opacity = String(1 - fade);
    photo.style.visibility = fade >= 1 ? 'hidden' : '';
    const coverOut = still ? 0 : smooth(0.02, 0.15, p);
    for (const el of [cover, address]) {
      el.style.opacity = String(1 - coverOut);
      el.style.visibility = coverOut >= 1 ? 'hidden' : '';
    }
    cover.style.marginTop = `${-48 * coverOut}px`;

    const open = still || p >= OPEN_AT;
    if (open !== S.open) setOpen(open);

    if (S.model) {
      // Walls lift away, the forecourt goes, then the floors separate.
      const e = still ? 1 : smooth(0.4, 0.6, p);
      const x = still ? 1 : smooth(0.52, 0.74, p);
      if (!S.sel) setBuilding(e, x);
      if (!S.open) {
        const t = smooth(0.22, 0.72, p);
        setPose(lerpPose(S.poses.front, S.poses.over, t));
      }
    } else if (open && !S.failed) {
      status.textContent = S.loading || 'Model yükleniyor…';
    }
    requestFrame();
  }

  function setBuilding(e, x) {
    const { roots } = S;
    S.lift = e;
    S.explode = x;
    roots.ENVELOPE.visible = e < 0.98;
    roots.ENVELOPE.position.y = S.base.get(roots.ENVELOPE) + 46 * e * e;
    roots.SITE.visible = e < 0.5;
    const cut = e > 0.3;
    for (const part of S.cutParts) part.visible = !cut;
    for (const name of ['LOWER', 'MAIN', 'UPPER']) roots[name].visible = true;
    if (!S.tween?.floors) setFloors({ MAIN: 7 * x, UPPER: 14 * x }); // a closing glide owns them
    S.floorShown = null;
  }

  function setOpen(open) {
    S.open = open;
    tour.classList.toggle('is-open', open);
    document.documentElement.classList.toggle('tesis-stage-open', open);
    controls.enabled = open && !!S.model;
    if (open) {
      if (S.model) setPose(S.poses.over);
      if (pendingHash) { const k = pendingHash; pendingHash = null; select(k); }
    } else {
      if (S.sel) close(false);
      S.tween = null;
    }
    syncPins();
  }

  // ---------- Selection ----------
  function select(key, cardsOverride) {
    const unit = UNITS[key];
    if (!unit) return;
    if (!S.open) {
      pendingHash = key;
      if (still()) goToBuilding('auto');
      else scrollTo({ top: stepPoint(key), behavior: reduced.matches ? 'auto' : 'smooth' });
      return;
    }
    // A pick by click moves the walk to that unit, so the next scroll goes on from it.
    // The scene is pinned, so the jump does not show.
    const i = ORDER.indexOf(key);
    if (!still() && i >= 0 && walkStep() !== i) {
      S.step = i;
      scrollTo({ top: stepPoint(key), behavior: 'auto' });
    }
    const shown = cardsOverride || unit.cards;
    S.sel = { key, cards: shown };
    for (const [k, el] of Object.entries(cards)) {
      const i = shown.indexOf(k);
      el.classList.toggle('is-shown', i >= 0);
      el.style.order = i >= 0 ? String(i) : '';
    }
    for (const btn of unitButtons) btn.setAttribute('aria-pressed', String(shown.includes(btn.dataset.unit)));
    for (const [k, pin] of Object.entries(pins)) pin.setAttribute('aria-pressed', String(shown.includes(k)));
    document.documentElement.classList.add('tesis-cards-open');
    cardsBox.scrollLeft = 0;
    for (const k of shown) cards[k].scrollTop = 0;
    history.replaceState(null, '', `#${cards[shown[0]].id}`);
    if (S.model) {
      focusFloor(unit.floor);
      highlight(unit.frame);
      frameSelection(!reduced.matches);
    } else {
      requestFrame();
    }
    syncPins();
  }

  function close(animate) {
    if (!S.sel) return;
    S.sel = null;
    for (const el of Object.values(cards)) { el.classList.remove('is-shown'); el.style.order = ''; }
    document.documentElement.classList.remove('tesis-cards-open');
    for (const btn of unitButtons) btn.setAttribute('aria-pressed', 'false');
    for (const pin of Object.values(pins)) pin.setAttribute('aria-pressed', 'false');
    history.replaceState(null, '', location.pathname + location.search);
    if (S.model) {
      highlight([]);
      ghost(null);
      S.floorGoal = { MAIN: 7, UPPER: 14 };
      setOffsetGoal(0, 0);
      if (S.open) tweenTo(S.poses.over, animate && !reduced.matches);
      else setBuilding(1, 1);
    }
    syncPins();
    update();
  }

  // A picked unit keeps the whole building on screen: the floors spread further apart so
  // the picked one is clear of the floor above, and the other floors fade back.
  const SPREAD = {
    lower: { MAIN: 12, UPPER: 23 },
    main: { MAIN: 7, UPPER: 20 },
    upper: { MAIN: 7, UPPER: 17 },
  };
  function focusFloor(floor) {
    const { roots } = S;
    roots.ENVELOPE.visible = false;
    roots.SITE.visible = false;
    for (const part of S.cutParts) part.visible = false;
    for (const name of ['LOWER', 'MAIN', 'UPPER']) roots[name].visible = true;
    S.floorGoal = { ...SPREAD[floor] };
    ghost(floor);
    S.floorShown = floor;
  }

  function ghost(floor) {
    const rootOf = { lower: S.roots.LOWER, main: S.roots.MAIN, upper: S.roots.UPPER };
    for (const [mesh, mats] of S.materials) {
      const faded = floor && !isInside(mesh, rootOf[floor]);
      for (const m of mats) {
        const { mat } = m;
        const want = faded ? { transparent: true, opacity: m.opacity * 0.28, depthWrite: false } : { transparent: m.transparent, opacity: m.opacity, depthWrite: m.depthWrite };
        if (mat.transparent !== want.transparent) mat.needsUpdate = true;
        Object.assign(mat, want);
      }
      mesh.castShadow = !faded && m0(mats).castShadow;
    }
  }
  const m0 = (mats) => mats[0];

  function floorsNow() {
    return { MAIN: S.roots.MAIN.position.y - S.base.get(S.roots.MAIN), UPPER: S.roots.UPPER.position.y - S.base.get(S.roots.UPPER) };
  }
  function setFloors(f) {
    S.roots.MAIN.position.y = S.base.get(S.roots.MAIN) + f.MAIN;
    S.roots.UPPER.position.y = S.base.get(S.roots.UPPER) + f.UPPER;
  }

  function highlight(zoneNames) {
    const on = new Set();
    for (const z of zoneNames) S.zones.get(z)?.meshes.forEach((m) => on.add(m));
    for (const [mesh, mats] of S.materials) {
      for (const { mat, emissive, intensity } of mats) {
        if (!mat.emissive) continue;
        if (on.has(mesh)) { mat.emissive.set('#cdb585'); mat.emissiveIntensity = 0.22; }
        else { mat.emissive.copy(emissive); mat.emissiveIntensity = intensity; }
      }
    }
  }

  function setOffsetGoal(x, y) {
    S.offsetGoal.x = x;
    S.offsetGoal.y = y;
  }

  // The part of the stage the cards, the heading, the tools and the bar leave free:
  // its size, and the view offset that centres the model in it.
  function freeArea() {
    const frameBox = canvasBox.getBoundingClientRect();
    const menu = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--menu-offset')) || 0;
    if (narrowMQ.matches) {
      const top = menu + 36; // the heading steps aside while the sheet is open
      const bottom = cardsBox.getBoundingClientRect().height + 16;
      return { x: 0, y: Math.round((bottom - top) / 2), w: S.w - 32, h: S.h - top - bottom };
    }
    const shown = S.sel.cards.map((k) => cards[k]);
    const left = Math.min(...shown.map((el) => el.getBoundingClientRect().left)) - frameBox.left;
    const cardsW = S.w - left + 32;
    const top = menu + 150;
    const bottom = 112;
    return { x: Math.round(cardsW / 2), y: Math.round((bottom - top) / 2), w: S.w - cardsW - 64, h: S.h - top - bottom };
  }

  function frameSelection(animate) {
    const unit = UNITS[S.sel.key];
    const floorRoot = { main: S.roots.MAIN, lower: S.roots.LOWER, upper: S.roots.UPPER }[unit.floor];
    // Measure the picked floor where the spread will put it.
    const now = floorsNow();
    setFloors(S.floorGoal);
    S.model.updateMatrixWorld(true);
    // The whole floor is framed, so nothing of it is cut; the unit is lit and pinned.
    const box = new THREE.Box3();
    floorRoot.traverse((o) => { if (o.isMesh && visibleChain(o) && !o.userData?.cutawayHide) box.expandByObject(o); });
    setFloors(now);
    S.model.updateMatrixWorld(true);
    if (box.isEmpty()) return;
    const unitBox = new THREE.Box3();
    for (const z of unit.frame) S.zones.get(z)?.meshes.forEach((m) => unitBox.expandByObject(m));
    const ux = unitBox.isEmpty() ? 0 : unitBox.getCenter(new THREE.Vector3()).x;
    const target = box.getCenter(new THREE.Vector3());
    target.y = box.min.y + 1.5;
    // Look from the side the unit is on, from above and in front.
    const side = THREE.MathUtils.clamp(ux / 25, -1, 1) * 0.6 + 0.15;
    const dir = new THREE.Vector3(side, unit.floor === 'lower' ? 0.8 : 1.15, 1).normalize();
    const free = freeArea();
    const saved = { x: S.offset.x, y: S.offset.y };
    S.offset.x = S.offset.y = 0;
    camera.fov = FOV;
    applyOffset();
    const d = fitDistance(box, target, dir, { x: 1 - (free.w / S.w) * 0.94, y: 1 - (free.h / S.h) * 0.94 });
    S.offset.x = saved.x; S.offset.y = saved.y;
    applyOffset();
    setOffsetGoal(free.x, free.y);
    tweenTo({ target, dir, d }, animate);
  }

  function tweenTo(goal, animate) {
    const from = {
      target: controls.target.clone(),
      dir: camera.position.clone().sub(controls.target).normalize(),
      d: camera.position.distanceTo(controls.target),
      fov: camera.fov,
    };
    const floors = S.floorGoal ? { from: floorsNow(), to: { ...S.floorGoal } } : null;
    if (!animate) {
      S.offset.x = S.offsetGoal.x; S.offset.y = S.offsetGoal.y;
      applyOffset();
      if (floors) setFloors(floors.to);
      setPose(goal);
      S.tween = null;
      requestFrame();
      return;
    }
    S.tween = { from, goal, floors, fromOffset: { ...S.offset }, start: performance.now(), dur: 750 };
    requestFrame();
  }

  function zoom(factor) {
    if (!S.model || !S.open) return;
    S.tween = null;
    const offset = camera.position.clone().sub(controls.target);
    const base = S.poses.over.d;
    const d = THREE.MathUtils.clamp(offset.length() * factor, base * 0.22, base * 1.5);
    camera.position.copy(controls.target).addScaledVector(offset.normalize(), d);
    requestFrame();
  }

  controls.addEventListener('start', () => { S.tween = null; });
  controls.addEventListener('change', requestFrame);

  // ---------- Picking on the model ----------
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function pick(clientX, clientY) {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, 1 - ((clientY - r.top) / r.height) * 2);
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObject(S.model, true);
    for (const hit of hits) {
      if (!visibleChain(hit.object)) continue;
      return zoneOf(hit.object);
    }
    return null;
  }
  let down = null;
  renderer.domElement.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (!S.model || !S.open || !down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    const quick = performance.now() - down.t < 500;
    down = null;
    if (moved > 6 || !quick) return;
    const zone = pick(e.clientX, e.clientY);
    if (!zone) return;
    const [key, both] = ZONE_UNIT[zone] || [];
    if (key) select(key, both);
  });
  let hoverQueued = false;
  renderer.domElement.addEventListener('pointermove', (e) => {
    if (!S.model || !S.open || e.pointerType !== 'mouse' || hoverQueued) return;
    hoverQueued = true;
    requestAnimationFrame(() => {
      hoverQueued = false;
      canvasBox.classList.toggle('is-pointing', !!pick(e.clientX, e.clientY));
    });
  });

  canvasBox.addEventListener('keydown', (e) => {
    if (!S.model || !S.open) return;
    if (e.key === '+' || e.key === '=') { e.preventDefault(); zoom(0.8); return; }
    if (e.key === '-') { e.preventDefault(); zoom(1.25); return; }
    if (!e.key.startsWith('Arrow')) return;
    e.preventDefault();
    S.tween = null;
    const offset = camera.position.clone().sub(controls.target);
    const sph = new THREE.Spherical().setFromVector3(offset);
    sph.theta += e.key === 'ArrowLeft' ? -0.12 : e.key === 'ArrowRight' ? 0.12 : 0;
    sph.phi = THREE.MathUtils.clamp(sph.phi + (e.key === 'ArrowUp' ? -0.08 : e.key === 'ArrowDown' ? 0.08 : 0), controls.minPolarAngle, controls.maxPolarAngle);
    camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(sph));
    requestFrame();
  });

  function visibleChain(o) {
    for (; o; o = o.parent) if (!o.visible) return false;
    return true;
  }
  function zoneOf(o) {
    for (; o && o !== S.model; o = o.parent) if (o.userData?.zone && ZONE_UNIT[o.userData.zone]) return o.userData.zone;
    return null;
  }

  // ---------- Frame loop (on demand) ----------
  function requestFrame() {
    if (S.frameRequested) return;
    S.frameRequested = true;
    requestAnimationFrame(frame);
  }

  function frame(now) {
    S.frameRequested = false;
    let busy = false;
    if (S.tween) {
      const t = Math.min(1, (now - S.tween.start) / S.tween.dur);
      const k = 1 - Math.pow(1 - t, 3);
      setPose(lerpPose(S.tween.from, S.tween.goal, k));
      const fl = S.tween.floors;
      if (fl) setFloors({ MAIN: fl.from.MAIN + (fl.to.MAIN - fl.from.MAIN) * k, UPPER: fl.from.UPPER + (fl.to.UPPER - fl.from.UPPER) * k });
      S.offset.x = S.tween.fromOffset.x + (S.offsetGoal.x - S.tween.fromOffset.x) * k;
      S.offset.y = S.tween.fromOffset.y + (S.offsetGoal.y - S.tween.fromOffset.y) * k;
      applyOffset();
      if (t >= 1) S.tween = null; else busy = true;
    } else if (S.offset.x !== S.offsetGoal.x || S.offset.y !== S.offsetGoal.y) {
      S.offset.x = S.offsetGoal.x; S.offset.y = S.offsetGoal.y;
      applyOffset();
    }
    if (controls.enabled && controls.update()) busy = true;
    if (S.model) renderer.render(scene, camera);
    placePins();
    drawLeads();
    if (busy) requestFrame();
  }

  // ---------- Pins and leader lines ----------
  const v = new THREE.Vector3();
  const pinXY = {};
  function syncPins() {
    for (const [key, pin] of Object.entries(pins)) {
      const unit = UNITS[key];
      pin.hidden = !S.model || !S.open || !S.zones.has(unit.zone);
    }
    requestFrame();
  }

  function placePins() {
    if (!S.model) return;
    for (const [key, pin] of Object.entries(pins)) {
      if (pin.hidden) { delete pinXY[key]; continue; }
      const unit = UNITS[key];
      const zone = S.zones.get(unit.zone);
      const local = zone.anchor.clone();
      if (unit.at) local.x += unit.at * zone.width;
      v.copy(local);
      zone.root.localToWorld(v);
      v.project(camera);
      const x = (v.x * 0.5 + 0.5) * S.w;
      const y = (-v.y * 0.5 + 0.5) * S.h;
      pinXY[key] = { x, y };
      pin.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    }
  }

  function drawLeads() {
    if (!S.sel || !S.model) { if (leads.firstChild) leads.replaceChildren(); return; }
    const box = canvasBox.getBoundingClientRect();
    const out = [];
    for (const key of S.sel.cards) {
      const pinKey = CARD_PIN[key] || key;
      const at = pinXY[pinKey];
      const el = cards[key];
      if (!at || !el.classList.contains('is-shown')) continue;
      const r = el.getBoundingClientRect();
      const left = r.left - box.left;
      const top = r.top - box.top;
      if (narrowMQ.matches) {
        const cx = Math.min(Math.max(at.x, left + 24), r.right - box.left - 24);
        if (cx < 0 || cx > S.w) continue;
        out.push(`<path class="tour__lead-line" d="M${at.x.toFixed(1)} ${at.y.toFixed(1)} L${cx.toFixed(1)} ${(top - 18).toFixed(1)} L${cx.toFixed(1)} ${top.toFixed(1)}"/>`);
      } else {
        const y = Math.min(Math.max(at.y, top + 48), r.bottom - box.top - 48);
        const ex = left - 28;
        // A line that would pass over another pin climbs above all pins first.
        const others = Object.entries(pinXY).filter(([k]) => k !== pinKey).map(([, q]) => q);
        const crosses = others.some((q) => q.x > at.x && q.x < ex && distToSegment(q, at, { x: ex, y }) < 24);
        if (crosses) {
          const lane = Math.max(top + 12, Math.min(...others.map((q) => q.y), at.y) - 34);
          out.push(`<path class="tour__lead-line" d="M${at.x.toFixed(1)} ${at.y.toFixed(1)} L${at.x.toFixed(1)} ${lane.toFixed(1)} L${ex.toFixed(1)} ${lane.toFixed(1)} L${ex.toFixed(1)} ${y.toFixed(1)} L${left.toFixed(1)} ${y.toFixed(1)}"/>`);
        } else {
          out.push(`<path class="tour__lead-line" d="M${at.x.toFixed(1)} ${at.y.toFixed(1)} L${ex.toFixed(1)} ${y.toFixed(1)} L${left.toFixed(1)} ${y.toFixed(1)}"/>`);
        }
      }
    }
    leads.innerHTML = out.join('');
  }

  function distToSegment(q, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const t = Math.max(0, Math.min(1, ((q.x - a.x) * dx + (q.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
    return Math.hypot(q.x - (a.x + t * dx), q.y - (a.y + t * dy));
  }

  // ---------- Load the model ----------
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  loader.load(MODEL_URL, (gltf) => {
    try {
      prepare(gltf.scene);
    } catch (error) {
      fail(error);
    }
  }, (e) => {
    if (e.total) S.loading = `Model yükleniyor · %${Math.round((e.loaded / e.total) * 100)}`;
    if (S.open && !S.model) status.textContent = S.loading;
  }, fail);

  function prepare(model) {
    const roots = Object.fromEntries(['MAIN', 'LOWER', 'UPPER', 'ENVELOPE', 'SITE'].map((n) => [n, model.getObjectByName(n)]));
    const missing = Object.entries(roots).filter(([, o]) => !o).map(([n]) => n);
    if (missing.length) throw new Error(`tesis.glb is missing groups: ${missing.join(', ')}`);
    for (const o of Object.values(roots)) S.base.set(o, o.position.y);
    // The photograph shows an empty forecourt: the cars parked out front stay hidden.
    roots.SITE.traverse((o) => { if (/^(suv|sedan|hatch)_/.test(o.name)) o.visible = false; });

    model.traverse((o) => {
      if (o.userData?.cutawayHide && !Object.values(roots).includes(o)) S.cutParts.push(o);
      if (!o.isMesh) return;
      o.castShadow = true;
      o.receiveShadow = true;
      const list = Array.isArray(o.material) ? o.material : [o.material];
      const copies = list.map((m) => {
        let mat = m.clone();
        // Transmission needs an extra render pass; plain transparency reads the same at this scale.
        if (mat.transmission > 0) {
          mat = new THREE.MeshStandardMaterial({ color: mat.color, roughness: 0.1, metalness: 0, transparent: true, opacity: 0.35, depthWrite: false });
          o.castShadow = false;
        }
        return mat;
      });
      o.material = Array.isArray(o.material) ? copies : copies[0];
      S.materials.set(o, copies.map((mat) => ({ mat, emissive: mat.emissive?.clone(), intensity: mat.emissiveIntensity, transparent: mat.transparent, opacity: mat.opacity, depthWrite: mat.depthWrite, castShadow: o.castShadow })));
    });

    scene.add(model);
    model.updateMatrixWorld(true);

    // Zones: their meshes, and a pin anchor in the floor's own space.
    model.traverse((o) => {
      const name = o.userData?.zone;
      if (!name || !ZONE_UNIT[name]) return;
      const root = ['UPPER', 'MAIN', 'LOWER'].map((n) => roots[n]).find((r) => isInside(o, r));
      const meshes = [];
      o.traverse((c) => { if (c.isMesh && !c.userData?.cutawayHide && !isCut(c, o)) meshes.push(c); });
      const box = new THREE.Box3();
      for (const m of meshes) box.expandByObject(m);
      if (box.isEmpty() || !root) return;
      const anchor = box.getCenter(new THREE.Vector3());
      anchor.y = box.min.y + (name === 'lounge' ? 1.6 : 2.4);
      root.worldToLocal(anchor);
      S.zones.set(name, { meshes, root, anchor, width: box.max.x - box.min.x });
    });

    S.model = model;
    S.roots = roots;
    S.poses = makePoses();
    tour.classList.add('is-ready');
    status.textContent = '';
    controls.enabled = S.open;
    if (S.open) setPose(S.poses.over);
    update();
    syncPins();
    if (S.open && pendingHash) { const k = pendingHash; pendingHash = null; select(k); }
    else if (S.sel) select(S.sel.key, S.sel.cards); // picked before the model arrived
  }

  function isInside(o, root) {
    for (; o; o = o.parent) if (o === root) return true;
    return false;
  }
  function isCut(mesh, zone) {
    for (let o = mesh; o && o !== zone; o = o.parent) if (o.userData?.cutawayHide) return true;
    return false;
  }

  function fail(error) {
    console.error('Tesisimiz: the 3D model could not be loaded.', error);
    S.failed = true;
    tour.classList.remove('is-ready');
    renderer.domElement.hidden = true;
    status.textContent = '3D model açılamadı; binanın görüntüsü gösteriliyor. Bölümleri numaralı düğmelerle açabilirsiniz.';
    syncPins();
  }

  // ---------- Deep links: #mekanik, #ariza-tespit … ----------
  let pendingHash = cardUnit[decodeURIComponent(location.hash.slice(1))] || null;
  if (pendingHash) requestAnimationFrame(() => (still() ? goToBuilding('auto') : scrollTo({ top: stepPoint(pendingHash), behavior: 'auto' })));
  addEventListener('hashchange', () => {
    const key = cardUnit[decodeURIComponent(location.hash.slice(1))];
    if (key) select(key);
  });

  reduced.addEventListener('change', () => {
    tour.classList.toggle('is-still', reduced.matches);
    resize();
    onScroll();
  });
  narrowMQ.addEventListener('change', () => { if (S.sel) frameSelection(false); });

  resize();
  onScroll();
}

// ---------- The dealer block's seal presses in when it comes into view ----------
function stampDealer() {
  const dealer = document.querySelector('.close__dealer');
  if (!dealer) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    dealer.classList.add('is-stamped');
    return;
  }
  const seal = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    dealer.classList.add('is-stamped');
    seal.disconnect();
  }, { rootMargin: '0px 0px -20% 0px' });
  seal.observe(dealer);
}
