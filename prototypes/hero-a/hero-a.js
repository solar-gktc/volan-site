// Hizmetlerimiz hero, prototype A: "Açılan araç".
// The XC60 rolls onto the sheet, stops, and opens into its parts like an exploded assembly
// drawing: the engine lifts above the bonnet, the door, fender, strut, brake and wheel pull
// out of the right side, the battery comes out of the nose and the ECU rises above the
// roof. Each part has a callout (a plain link to #<service>, which the page's hashchange
// handler opens as a sheet). Hovering or focusing a callout, or pointing at a part, lifts
// that part and turns it slowly. Without WebGL a still of the same drawing stays and the
// leaders are drawn over it.
// Test hooks (query string): ?nogl (still fallback), ?still (reduced motion), ?freeze=<ms>
// (hold the timeline), ?delay=<ms> (slow load), ?capture=genis|dar[&bekle] (print a still).
import {
  WebGLRenderer, Scene, PerspectiveCamera, PMREMGenerator, DirectionalLight, HemisphereLight,
  Mesh, PlaneGeometry, MeshPhysicalMaterial, MeshBasicMaterial, CanvasTexture, SRGBColorSpace,
  ACESFilmicToneMapping, DoubleSide, Box3, Vector3, Group, Raycaster, Vector2, Matrix4,
  BufferGeometry, LineDashedMaterial, Line, GLTFLoader, MeshoptDecoder,
} from 'three';

const root = document.querySelector('[data-acilan]');
const params = new URLSearchParams(location.search);
const CAPTURE = params.get('capture'); // 'genis' | 'dar': render the still and print it

function start() {
  const sheetEl = root.querySelector('.acilan__sheet');
  const canvas = root.querySelector('.acilan__canvas');
  const svg = root.querySelector('.acilan__leaders');
  const list = root.querySelector('.acilan__parts');
  const callouts = [...root.querySelectorAll('.callout')];
  const byKey = Object.fromEntries(callouts.map((c) => [c.dataset.part, c]));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || params.has('still');
  const narrowMQ = matchMedia('(max-width: 899px)');
  const layout = () => (CAPTURE || (narrowMQ.matches ? 'dar' : 'genis'));

  /* ---------- Leaders: from the end of a callout's rule to its point on the drawing ---------- */

  const NS = 'http://www.w3.org/2000/svg';
  const leaders = Object.fromEntries(callouts.map((c) => {
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('class', 'leader');
    const dot = document.createElementNS(NS, 'circle');
    dot.setAttribute('class', 'leader-dot');
    dot.setAttribute('r', '3');
    const ring = document.createElementNS(NS, 'circle');
    ring.setAttribute('class', 'leader-ring');
    ring.setAttribute('r', '7');
    for (const el of [path, ring, dot]) el.style.display = 'none';
    svg.append(path, ring, dot);
    return [c.dataset.part, { path, dot, ring }];
  }));

  // anchors: { key: [fx, fy] } as fractions of the sheet.
  function drawLeaders(anchors, shownOnly) {
    const box = sheetEl.getBoundingClientRect();
    if (!box.width) return;
    svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    for (const c of callouts) {
      const key = c.dataset.part;
      const L = leaders[key];
      const a = anchors[key];
      const visible = a && (!shownOnly || c.classList.contains('is-shown'));
      L.path.style.display = L.dot.style.display = L.ring.style.display = visible ? '' : 'none';
      if (!visible) continue;
      const r = c.getBoundingClientRect();
      const ax = a[0] * box.width;
      const ay = a[1] * box.height;
      const left = r.left - box.left;
      const right = r.right - box.left;
      const y = r.bottom - box.top - 0.5;
      // A point below the label, within its rule: drop straight down from the rule. Otherwise
      // leave from the rule end nearer the point, run a little along the rule, then go on.
      let d;
      if (ay > y && ax >= left + 6 && ax <= right - 6) {
        d = `M${ax.toFixed(1)} ${y.toFixed(1)}L${ax.toFixed(1)} ${ay.toFixed(1)}`;
      } else {
        const fromRight = ax > (left + right) / 2;
        const x0 = fromRight ? right : left;
        const x1 = x0 + (fromRight ? 12 : -12);
        d = `M${x0.toFixed(1)} ${y.toFixed(1)}H${x1.toFixed(1)}L${ax.toFixed(1)} ${ay.toFixed(1)}`;
      }
      L.path.setAttribute('d', d);
      L.dot.setAttribute('cx', ax.toFixed(1));
      L.dot.setAttribute('cy', ay.toFixed(1));
      L.ring.setAttribute('cx', ax.toFixed(1));
      L.ring.setAttribute('cy', ay.toFixed(1));
    }
  }

  /* ---------- Hover and focus state, shared by callouts and parts ---------- */

  let active = null;
  let onActive = () => {};
  function setActive(key) {
    if (key === active) return;
    active = key;
    for (const c of callouts) c.classList.toggle('is-on', c.dataset.part === key);
    for (const [k, L] of Object.entries(leaders)) {
      for (const el of [L.path, L.dot, L.ring]) el.classList.toggle('is-on', k === key);
    }
    list.classList.toggle('is-dim', !!key);
    svg.classList.toggle('is-dim', !!key);
    onActive(key);
  }
  for (const c of callouts) {
    c.addEventListener('pointerenter', () => setActive(c.dataset.part));
    c.addEventListener('pointerleave', () => setActive(null));
    c.addEventListener('focus', () => setActive(c.dataset.part));
    c.addEventListener('blur', () => setActive(null));
  }

  // The page's sheet returns focus to the coupon row when it closes. If the sheet was opened
  // from the hero, bring the reader back to the callout they used instead.
  let openedFrom = null;
  for (const c of callouts) c.addEventListener('click', () => { openedFrom = { c, y: scrollY }; });
  const sheetDialog = document.querySelector('dialog');
  sheetDialog?.addEventListener('close', () => {
    if (!openedFrom) return;
    const { c, y } = openedFrom;
    openedFrom = null;
    setTimeout(() => { scrollTo({ top: y, behavior: 'instant' }); c.focus({ preventScroll: true }); }, 0);
  });

  /* ---------- Still fallback ---------- */

  let gaveUp = false;
  const stillMode = () => {
    gaveUp = true;
    root.classList.remove('is-live', 'is-booting');
    root.classList.add('is-still');
    callouts.forEach((c) => c.classList.add('is-shown'));
    const draw = () => drawLeaders(STILL_ANCHORS[layout()], false);
    draw();
    new ResizeObserver(draw).observe(sheetEl);
    document.fonts?.ready.then(draw);
  };

  if (params.has('nogl')) { canvas.remove(); stillMode(); return; }
  root.classList.add('is-booting');
  const bootStart = performance.now();
  // A very slow connection: stop waiting and show the drawing as a still.
  const giveUp = setTimeout(() => { if (!root.classList.contains('is-live')) { canvas.remove(); stillMode(); } }, 12000);
  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: !!CAPTURE });
  } catch {
    canvas.remove();
    stillMode();
    return;
  }
  stage(renderer).catch((e) => {
    console.warn('hero-a:', e);
    canvas.remove();
    stillMode();
  });

  /* ---------- The 3D stage ---------- */

  async function stage(renderer) {
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    const scene = studioScene(renderer);
    const camera = new PerspectiveCamera(20, 1, 0.1, 100);

    if (params.has('delay')) await new Promise((r) => setTimeout(r, Number(params.get('delay'))));
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);

    const [carGltf, ...partGltfs] = await Promise.all([
      loader.loadAsync('assets/models/volvo-xc60.glb'),
      ...PARTS.map((p) => loader.loadAsync(p.url)),
    ]);
    const explodeOffsets = await fetch('assets/models/parca/motor-volvo-drive-e-patlatma.json').then((r) => r.json());

    /* The car: materials as on the other pages. Its rims and tyres are one mesh each; they
       are split into four wheels so the car can roll in, and so the front-right wheel can
       give way to the real wheel part. */
    const car = new Group();
    const carModel = carGltf.scene;
    let paint = null;
    const wheelMeshes = [];
    carModel.traverse((o) => {
      if (!o.isMesh) return;
      const m = o.material;
      if (m.name === 'VOLAN_CAM_Cam') {
        o.material = new MeshPhysicalMaterial({ color: 0x1a2130, roughness: 0.04, clearcoat: 1, transparent: true, opacity: 0.62 });
      } else if (m.name === 'VOLAN_GOLGE') {
        o.material = new MeshBasicMaterial({ map: m.map, color: 0x0b0d1c, transparent: true, depthWrite: false, side: DoubleSide });
        o.userData.shadow = true;
      } else if (m.name === 'VOLAN_BOYA') {
        m.metalness = Math.min(m.metalness, 0.15);
        m.roughness = Math.max(m.roughness, 0.45);
        paint = m;
      } else if (m.name === 'Jant' || m.name === 'Lastik') {
        wheelMeshes.push(o);
      }
    });
    car.add(carModel);
    scene.add(car);
    carModel.updateMatrixWorld(true);
    const wheels = wheelMeshes.flatMap(splitWheels);
    const WHEEL_R = 0.43;
    const rot = new Matrix4(), toC = new Matrix4(), fromC = new Matrix4();
    function rollWheels(angle) {
      rot.makeRotationZ(angle);
      for (const w of wheels) {
        toC.makeTranslation(-w.c.x, -w.c.y, -w.c.z);
        fromC.makeTranslation(w.c.x, w.c.y, w.c.z);
        w.mesh.matrix.copy(fromC).multiply(rot).multiply(toC).multiply(w.base);
      }
    }
    const setWheelCut = (on) => { for (const w of wheels) if (w.frontRight) w.mesh.visible = !on; };

    /* The parts */
    const parts = PARTS.map((cfg, i) => {
      const model = partGltfs[i].scene;
      model.traverse((o) => {
        if (!o.isMesh) return;
        // Body panels take the car's own paint, so the door reads as this car's door.
        if (o.material.name === 'VP_Kaporta_Gumus' && paint) o.material = paint;
      });
      const holder = new Group(); // seat → exploded position
      const turn = new Group(); // hover lift and turn, about the part's own centre
      const pivot = new Group();
      model.updateMatrixWorld(true);
      const bb = new Box3().setFromObject(model);
      const c = bb.getCenter(new Vector3());
      model.position.sub(c);
      pivot.add(model);
      pivot.rotation.set(...(cfg.rot || [0, 0, 0]));
      pivot.scale.setScalar(cfg.scale || 1);
      turn.add(pivot);
      holder.add(turn);
      // Seats and exploded positions are given for the part's bottom centre (in car metres).
      const lift = ((bb.max.y - bb.min.y) / 2) * (cfg.scale || 1);
      const seat = new Vector3(...cfg.seat).add(new Vector3(0, lift, 0));
      const out = new Vector3(...cfg.out).add(new Vector3(0, lift, 0));
      holder.position.copy(seat);
      holder.visible = false;
      car.add(holder);

      let nodes = [];
      if (cfg.explode) {
        nodes = Object.entries(explodeOffsets).map(([n, v]) => {
          const node = model.getObjectByName(n);
          return node && { node, rest: node.position.clone(), off: new Vector3(...v) };
        }).filter(Boolean);
      }
      // A dashed assembly line from the seat to the exploded position.
      const lineGeom = new BufferGeometry().setFromPoints([seat.clone(), out.clone()]);
      const line = new Line(lineGeom, new LineDashedMaterial({ color: 0x323277, dashSize: 0.06, gapSize: 0.05, transparent: true, opacity: 0, depthWrite: false }));
      line.computeLineDistances();
      car.add(line);

      let shadow = null;
      if (cfg.shadow) {
        shadow = contactShadow(cfg.shadow[0], cfg.shadow[1]);
        shadow.material.opacity = 0;
        car.add(shadow);
      }
      return { ...cfg, holder, turn, pivot, model, seat, out, nodes, line, shadow, hover: 0, t: 0, turnPhase: i * 1.7 };
    });

    /* ---------- Layout and camera ---------- */

    let W = 0, H = 0;
    function resize() {
      const r = sheetEl.getBoundingClientRect();
      W = Math.round(r.width); H = Math.round(r.height);
      if (CAPTURE) { const s = CAPTURE === 'dar' ? 3 : 2; renderer.setPixelRatio(1); renderer.setSize(W * s, H * s, false); }
      else renderer.setSize(W, H, false);
      camera.aspect = W / H;
      const v = VIEW[layout()];
      camera.fov = v.fov;
      const t = new Vector3(...v.target);
      const el = v.el * Math.PI / 180, az = v.az * Math.PI / 180;
      camera.position.set(t.x + Math.sin(az) * Math.cos(el) * v.dist, t.y + Math.sin(el) * v.dist, t.z + Math.cos(az) * Math.cos(el) * v.dist);
      camera.lookAt(t);
      camera.updateProjectionMatrix();
    }

    /* ---------- Timeline ---------- */

    const ease = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)); // exponential ease-out
    const smooth = (x) => x * x * (3 - 2 * x);
    const clamp01 = (x) => Math.min(1, Math.max(0, x));
    const T_ARRIVE = 1300, T_OUT = 1250, T_STAGGER = 120, T_DUR = 1150;
    const T_ENGINE = T_OUT + 1300, T_ENGINE_DUR = 1200;
    const T_END = T_ENGINE + T_ENGINE_DUR + 200;
    let t0 = null;
    if (gaveUp) return;
    clearTimeout(giveUp);
    // If the waiting still was already on the sheet, the car is in place: skip the roll-in.
    const waited = performance.now() - bootStart > 1200;
    let done = reduce || !!CAPTURE;

    const FREEZE = params.has('freeze') ? Number(params.get('freeze')) : null;
    // Waited: the car is already parked on the sheet; open it after a short beat.
    const SKIP = waited ? T_OUT - 250 : 0;
    function pose(now) {
      const t = FREEZE !== null ? FREEZE : done ? 1e9 : now - t0 + SKIP;
      // Arrival: rolls in from behind and stops, a small nod on the brakes.
      const a = clamp01(t / T_ARRIVE);
      car.position.x = waited ? 0 : -2.6 * (1 - ease(a));
      rollWheels(-car.position.x / WHEEL_R);
      const nodT = (t - T_ARRIVE * 0.62) / 520;
      car.rotation.z = !waited && nodT > 0 && nodT < 1 ? -0.012 * Math.sin(nodT * Math.PI) * (1 - nodT) : 0;

      let wheelOut = false;
      parts.forEach((p, i) => {
        const s = clamp01((t - T_OUT - p.order * T_STAGGER) / T_DUR);
        p.t = ease(s);
        p.holder.visible = s > 0;
        p.holder.position.lerpVectors(p.seat, p.out, p.t);
        if (p.key === 'jant' && s > 0) wheelOut = true;
        p.line.material.opacity = 0.5 * smooth(clamp01((s - 0.15) / 0.5));
        if (p.shadow) {
          p.shadow.position.set(p.holder.position.x, 0.003, p.holder.position.z);
          p.shadow.material.opacity = p.shadowOpacity * smooth(clamp01((s - 0.3) / 0.5));
        }
        if (p.nodes.length) {
          const k = smooth(clamp01((t - T_ENGINE) / T_ENGINE_DUR)) * 0.55;
          for (const n of p.nodes) n.node.position.copy(n.rest).addScaledVector(n.off, k);
        }
        const c = byKey[p.callout];
        if (c && s > 0.55) c.classList.add('is-shown');
      });
      setWheelCut(wheelOut);
      for (const k of ['govde-ust', 'govde-arka']) if (t > T_OUT + 900) byKey[k]?.classList.add('is-shown');
      return t < T_END;
    }

    /* ---------- Hover: lift and a slow turn ---------- */

    let hoverActive = null;
    onActive = (key) => { hoverActive = key; kick(); };

    function hoverStep(dt, now) {
      let moving = false;
      for (const p of parts) {
        const target = hoverActive && p.callout === hoverActive ? 1 : 0;
        const next = p.hover + (target - p.hover) * (1 - Math.exp(-dt * 7));
        p.hover = Math.abs(next - target) < 0.001 ? target : next;
        if (p.hover !== target || target === 1) moving = true;
        const h = reduce ? (target ? 1 : 0) : p.hover;
        p.turn.position.y = (reduce ? 0.04 : 0.11) * h;
        p.turn.rotation.y = reduce ? 0 : Math.sin(now / 1400 + p.turnPhase) * 0.32 * h;
      }
      if (paint) {
        const want = hoverActive === 'govde-ust' ? 1.9 : 1;
        paint.envMapIntensity += (want - paint.envMapIntensity) * (1 - Math.exp(-dt * 6));
        if (Math.abs(paint.envMapIntensity - want) > 0.01) moving = true;
      }
      return moving && !reduce;
    }

    /* ---------- Anchors: where each leader meets the drawing ---------- */

    const tmp = new Vector3();
    function anchors() {
      const out = {};
      car.updateMatrixWorld(true);
      for (const p of parts) {
        if (!p.anchor) continue;
        tmp.set(...p.anchor).applyMatrix4(p.turn.matrixWorld).project(camera);
        out[p.callout] = [(tmp.x + 1) / 2, (1 - tmp.y) / 2];
      }
      for (const [k, v] of Object.entries(BODY_ANCHORS)) {
        tmp.set(...v).applyMatrix4(car.matrixWorld).project(camera);
        out[k] = [(tmp.x + 1) / 2, (1 - tmp.y) / 2];
      }
      return out;
    }

    /* ---------- Pointing at parts ---------- */

    const ray = new Raycaster();
    const pointer = new Vector2();
    const pickables = parts.map((p) => p.holder);
    function pick(e) {
      const r = canvas.getBoundingClientRect();
      pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(pointer, camera);
      const hit = ray.intersectObjects(pickables, true).find((h) => h.object.visible);
      if (!hit) return null;
      let o = hit.object;
      while (o && !pickables.includes(o)) o = o.parent;
      return parts[pickables.indexOf(o)]?.callout ?? null;
    }
    canvas.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      const key = pick(e);
      root.classList.toggle('is-hot', !!key);
      setActive(key);
    });
    canvas.addEventListener('pointerleave', () => { root.classList.remove('is-hot'); setActive(null); });
    canvas.addEventListener('click', (e) => { const key = pick(e); if (key && byKey[key]) byKey[key].click(); });

    /* ---------- Render loop: runs only while something moves ---------- */

    let raf = 0, last = 0;
    function frame(now) {
      raf = 0;
      if (t0 === null) t0 = now;
      const dt = Math.min(0.05, (now - (last || now)) / 1000);
      last = now;
      const timeline = pose(now);
      const hovering = hoverStep(dt, now);
      renderer.render(scene, camera);
      drawLeaders(anchors(), true);
      done = !timeline;
      if ((timeline || hovering) && visible) raf = requestAnimationFrame(frame);
      else last = 0;
    }
    function kick() { if (!raf && visible) raf = requestAnimationFrame(frame); }

    let visible = true;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); }).observe(sheetEl);
    new ResizeObserver(() => { resize(); kick(); if (!raf) frame(performance.now()); }).observe(sheetEl);
    document.fonts?.ready.then(() => kick());

    resize();
    root.classList.remove('is-booting');
    root.classList.add('is-live');
    if (done) callouts.forEach((c) => c.classList.add('is-shown'));
    kick();

    if (CAPTURE) {
      pose(0);
      if (params.has('bekle')) {
        // The waiting still: the parked car alone, all four wheels on.
        for (const p of parts) { p.holder.visible = false; p.line.visible = false; if (p.shadow) p.shadow.visible = false; }
        setWheelCut(false);
      }
      hoverStep(1, 0);
      renderer.render(scene, camera);
      const out = document.createElement('textarea');
      out.id = 'capture';
      out.textContent = JSON.stringify({ anchors: anchors(), png: renderer.domElement.toDataURL('image/png') });
      document.body.append(out);
    }
  }
}

/* ---------- Data ---------- */

const M = 'assets/models/';
const P = 'prototypes/hero-a/models/';
const R90 = Math.PI / 2;

// Car metres: front +X, up +Y, right side +Z. seat = assembled place, out = exploded place,
// both for the part's bottom centre. Parts are scaled up from true size (scale) so the small
// ones read at hero size. anchor = the leader's point, in the part's own centred metres.
// order = when it leaves.
const PARTS = [
  { key: 'motor', callout: 'motor', url: `${M}parca/motor-volvo-drive-e.glb`, explode: true, scale: 1.3, rot: [0, R90, 0],
    seat: [1.55, 0.45, 0], out: [1.6, 2.15, -0.25], anchor: [0, 0.22, 0], order: 0 },
  { key: 'ecu', callout: 'ecu', url: `${M}parca/elektrik-ecu.glb`, scale: 2.6, rot: [0.5, -0.5, 0],
    seat: [0.95, 0.9, 0.5], out: [-0.2, 2.55, 0.25], anchor: [0, 0.03, 0], order: 1 },
  { key: 'aku', callout: 'aku', url: `${P}elektrik-aku.glb`, scale: 2.1, rot: [0, -R90 + 0.5, 0],
    seat: [1.85, 0.62, -0.55], out: [3.15, 1.45, -0.95], anchor: [0, 0.1, 0], order: 2 },
  { key: 'amortisor', callout: 'amortisor', url: `${M}parca/sasi-amortisor.glb`, scale: 1.35,
    seat: [1.51, 0.4, 0.62], out: [3.2, 1.0, 0.95], anchor: [0, 0.14, 0], order: 3 },
  { key: 'camurluk', callout: 'camurluk', url: `${P}kaporta-camurluk.glb`, scale: 1.05,
    seat: [1.55, 0.42, 0.75], out: [3.15, 0.1, 2.25], anchor: [0.15, 0.1, 0.05], order: 4, shadow: [1.1, 0.5], shadowOpacity: 0.3 },
  { key: 'fren', callout: 'fren', url: `${M}parca/fren-seti.glb`, scale: 1.4,
    seat: [1.51, 0.24, 0.66], out: [1.62, 0.24, 2.2], anchor: [0.05, 0.02, 0.04], order: 5 },
  { key: 'jant', callout: 'fren', url: `${P}jant-volvo.glb`, scale: 1.16,
    seat: [1.51, 0, 0.83], out: [1.8, 0, 3.35], order: 5.5, shadow: [0.9, 0.5], shadowOpacity: 0.8 },
  { key: 'kapi', callout: 'kapi', url: `${M}parca/kaporta-on-kapi.glb`, scale: 1,
    seat: [0.45, 0.34, 0.8], out: [-0.45, 0, 3.05], anchor: [-0.1, 0.05, 0.12], order: 6, shadow: [1.3, 0.45], shadowOpacity: 0.35 },
];

// Points on the car body for the two services that treat the whole car.
const BODY_ANCHORS = {
  'govde-ust': [-0.7, 1.69, 0.35],
  'govde-arka': [-2.0, 0.95, 0.9],
};

// Camera per layout: target (car metres), azimuth from the right side toward the front,
// elevation, distance, vertical fov.
const VIEW = {
  genis: { target: [1.0, 0.95, 1.0], az: 36, el: 28, dist: 17.2, fov: 24 },
  dar: { target: [1.0, 1.05, 1.0], az: 36, el: 28, dist: 25.5, fov: 24 },
};

// Leader points over the still images (filled in from ?capture=genis / ?capture=dar).
const STILL_ANCHORS = {
  genis: { motor: [0.6697, 0.2308], ecu: [0.429, 0.2172], aku: [0.8971, 0.3808], amortisor: [0.769, 0.5111], camurluk: [0.6689, 0.731], fren: [0.4728, 0.6543], kapi: [0.1418, 0.5974], 'govde-ust': [0.3716, 0.323], 'govde-arka': [0.2041, 0.3918] },
  dar: { motor: [0.663, 0.3279], ecu: [0.431, 0.3163], aku: [0.8829, 0.428], amortisor: [0.7527, 0.5159], camurluk: [0.6567, 0.6582], fren: [0.4743, 0.6102], kapi: [0.1578, 0.5731], 'govde-ust': [0.3737, 0.3865], 'govde-arka': [0.2058, 0.4327] },
};

/* ---------- Split a mesh that holds four wheels into four meshes, one per corner ---------- */

function splitWheels(mesh) {
  const g = mesh.geometry;
  const pos = g.attributes.position;
  const idx = g.index ? g.index.array : Array.from({ length: pos.count }, (_, i) => i);
  const m = mesh.matrix; // node → car model space (the model sits at the scene root)
  const v = new Vector3();
  const lists = [[], [], [], []];
  const boxes = [0, 1, 2, 3].map(() => new Box3());
  for (let i = 0; i < idx.length; i += 3) {
    let cx = 0, cz = 0;
    for (let k = 0; k < 3; k++) { v.fromBufferAttribute(pos, idx[i + k]).applyMatrix4(m); cx += v.x; cz += v.z; }
    const q = (cx > 0 ? 1 : 0) + (cz > 0 ? 2 : 0);
    lists[q].push(idx[i], idx[i + 1], idx[i + 2]);
    for (let k = 0; k < 3; k++) boxes[q].expandByPoint(v.fromBufferAttribute(pos, idx[i + k]).applyMatrix4(m));
  }
  const out = [];
  lists.forEach((list, q) => {
    if (!list.length) return;
    const geom = new BufferGeometry();
    for (const [name, attr] of Object.entries(g.attributes)) geom.setAttribute(name, attr);
    geom.setIndex(list);
    const sub = new Mesh(geom, mesh.material);
    sub.matrixAutoUpdate = false;
    sub.matrix.copy(m);
    mesh.parent.add(sub);
    out.push({ mesh: sub, base: m.clone(), c: boxes[q].getCenter(new Vector3()), frontRight: q === 3 });
  });
  mesh.removeFromParent();
  return out;
}

/* ---------- Light: the site's studio set (as on Hakkımızda) ---------- */

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

let shadowTexture;
function contactShadow(w, d) {
  if (!shadowTexture) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(64, 64, 2, 64, 64, 64);
    grad.addColorStop(0, 'rgba(20,20,40,0.5)');
    grad.addColorStop(0.5, 'rgba(20,20,40,0.26)');
    grad.addColorStop(1, 'rgba(20,20,40,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    shadowTexture = new CanvasTexture(c);
  }
  const m = new Mesh(new PlaneGeometry(w, d), new MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  return m;
}

if (root) start();
