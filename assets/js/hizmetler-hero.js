// Hizmetlerimiz hero: "Açılan araç". The XC60 (the painted 3D model) rolls onto the sheet,
// stops, and its parts slide out to an exploded assembly as navy line drawings: the engine
// above the bonnet, the ECU above the roof, the battery out of the nose, the strut, brake,
// wheel, fender and door off the right side. Each part has a callout (a plain link to
// #<service>, which the page's hashchange handler opens as a sheet). Pointing at a part or its
// callout, or focusing the callout, develops that drawing into the 3D model with a noise front
// and a thin ink edge (the effect and timing of hero B), then the model lifts and turns; the
// part chosen last stays developed. After the opening the engine develops once, as a hint.
// Without WebGL a still of the same drawing stays and the leaders are drawn over it.
// Test hooks (query string): ?nogl (still fallback), ?still (reduced motion), ?freeze=<ms>
// (hold the timeline), ?delay=<ms> (slow load), ?develop=<callout>:<prog>[:<lift>:<turn>]
// (hold a develop stage), ?capture=genis|dar[&bekle] (print a still).
import {
  WebGLRenderer, Scene, PerspectiveCamera, PMREMGenerator, DirectionalLight, HemisphereLight,
  Mesh, PlaneGeometry, MeshPhysicalMaterial, MeshBasicMaterial, CanvasTexture, SRGBColorSpace,
  ACESFilmicToneMapping, DoubleSide, Box3, Vector3, Group, Raycaster, Vector2, Matrix4,
  BufferGeometry, LineDashedMaterial, Line, LineSegments, EdgesGeometry, ShaderMaterial,
  BackSide, GLTFLoader, MeshoptDecoder,
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
  // how: 'focus' develops at once; 'pointer' waits 60 ms, so a sweep does not develop each part.
  function setActive(key, how = 'pointer') {
    if (key === active) return;
    active = key;
    for (const c of callouts) c.classList.toggle('is-on', c.dataset.part === key);
    for (const [k, L] of Object.entries(leaders)) {
      for (const el of [L.path, L.dot, L.ring]) el.classList.toggle('is-on', k === key);
    }
    list.classList.toggle('is-dim', !!key);
    svg.classList.toggle('is-dim', !!key);
    onActive(key, how);
  }
  for (const c of callouts) {
    c.addEventListener('pointerenter', () => setActive(c.dataset.part));
    c.addEventListener('pointerleave', () => setActive(null));
    c.addEventListener('focus', () => setActive(c.dataset.part, 'focus'));
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

    /* The parts. Each one is there twice: the model (in `turn`, which lifts and turns) and its
       drawing (in `draw`, which stays at the part's place). The drawing is a depth-only fill
       that hides back lines, the crease edges, and a backface hull pushed out in screen space
       for the outline. A noise front develops the drawing into the model. */
    const res = { value: new Vector2(1, 1) };
    // Edges are found once, here, in slices of about 12 ms, so the page never blocks for long.
    let slice = performance.now();
    const breathe = async () => {
      if (performance.now() - slice < 12) return;
      await new Promise((r) => setTimeout(r, 0));
      slice = performance.now();
    };
    const parts = [];
    for (const [i, cfg] of PARTS.entries()) {
      const model = partGltfs[i].scene;
      model.updateMatrixWorld(true);
      const bb = new Box3().setFromObject(model);
      const size = bb.getSize(new Vector3());
      const common = {
        uProg: { value: 0 },
        uRange: { value: new Vector2(bb.min.y, bb.max.y) },
        uScale: { value: 11 / Math.max(size.x, size.y, size.z) },
        uInk: { value: INK },
      };
      const modelU = { ...common, uInv: { value: new Matrix4() } };
      const drawU = {
        ...common, uInv: { value: new Matrix4() }, uRes: res,
        uDraw: { value: 0 }, uGhost: { value: 0 }, uWidth: { value: 1 },
      };
      model.traverse((o) => {
        if (!o.isMesh) return;
        // Body panels take the car's own paint (a copy), so the door reads as this car's door.
        if (o.material.name === 'VP_Kaporta_Gumus' && paint) o.material = paint.clone();
        o.material = [].concat(o.material).map((m) => developing(m, modelU))[0];
      });

      const c = bb.getCenter(new Vector3());
      model.position.sub(c);
      const pivot = new Group();
      pivot.add(model);
      pivot.rotation.set(...(cfg.rot || [0, 0, 0]));
      pivot.scale.setScalar(cfg.scale || 1);
      const drawPivot = pivot.clone(); // same hierarchy and pose, models' materials replaced below
      const drawing = drawPivot.children[0];
      // A capture is drawn at 2–3× and scaled down, which thins 1 px lines: ink them darker.
      const mats = drawingMaterials(drawU, (cfg.ink || 1) * (CAPTURE ? 1.35 : 1));
      const meshes = [];
      drawing.traverse((o) => { if (o.isMesh) meshes.push(o); });
      for (const o of meshes) {
        await breathe();
        o.material = mats.fill;
        o.renderOrder = 10;
        const hull = new Mesh(o.geometry, mats.hull);
        const edges = new LineSegments(new EdgesGeometry(o.geometry, cfg.crease || 32), mats.line);
        hull.renderOrder = 11;
        edges.renderOrder = 12;
        hull.raycast = edges.raycast = () => {};
        o.add(hull, edges);
      }
      const turn = new Group(); // hover lift and turn of the model, about the part's centre
      turn.add(pivot);
      const holder = new Group(); // seat → exploded position, for model and drawing alike
      holder.add(turn, drawPivot);
      // Seats and exploded positions are given for the part's bottom centre (in car metres).
      const lift = (size.y / 2) * (cfg.scale || 1);
      const seat = new Vector3(...cfg.seat).add(new Vector3(0, lift, 0));
      const out = new Vector3(...cfg.out).add(new Vector3(0, lift, 0));
      holder.position.copy(seat);
      holder.visible = false;
      car.add(holder);

      let nodes = [];
      if (cfg.explode) {
        nodes = Object.entries(explodeOffsets).flatMap(([n, v]) => [model, drawing].map((r) => {
          const node = r.getObjectByName(n);
          return node && { node, rest: node.position.clone(), off: new Vector3(...v) };
        })).filter(Boolean);
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
      parts.push({
        ...cfg, holder, turn, pivot, model, drawing, seat, out, nodes, line, shadow, modelU, drawU,
        on: false, prog: 0, lift: 0, spin: 0, sway: 0, t: 0, phase: i * 1.7,
      });
    }
    const partKeys = new Set(parts.map((p) => p.callout));

    /* ---------- Layout and camera ---------- */

    let W = 0, H = 0;
    function resize() {
      const r = sheetEl.getBoundingClientRect();
      W = Math.round(r.width); H = Math.round(r.height);
      if (CAPTURE) { const s = CAPTURE === 'dar' ? 3 : 2; renderer.setPixelRatio(1); renderer.setSize(W * s, H * s, false); }
      else renderer.setSize(W, H, false);
      renderer.getDrawingBufferSize(res.value);
      const px = res.value.x / Math.max(1, W); // device px per CSS px
      for (const p of parts) p.drawU.uWidth.value = 1.1 * px;
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
    const T_ARRIVE = 700, T_OUT = 560, T_STAGGER = 45, T_DUR = 520;
    const T_ENGINE = T_OUT + 450, T_ENGINE_DUR = 450;
    const T_END = T_ENGINE + T_ENGINE_DUR + 200;
    const T_HINT = T_ENGINE + 250;
    const HINT = 'motor';
    let hinted = false;
    let t0 = null;
    if (gaveUp) return;
    clearTimeout(giveUp);
    // If the waiting still was already on the sheet, the car is in place: skip the roll-in.
    const waited = performance.now() - bootStart > 700;
    let done = reduce || !!CAPTURE;

    const FREEZE = params.has('freeze') ? Number(params.get('freeze')) : null;
    // Waited: the car is already parked on the sheet; open it after a short beat.
    const SKIP = waited ? T_OUT - 120 : 0;
    function pose(now) {
      const t = FREEZE !== null ? FREEZE : done ? 1e9 : now - t0 + SKIP;
      // Arrival: rolls in from behind and stops, a small nod on the brakes.
      const a = clamp01(t / T_ARRIVE);
      car.position.x = waited ? 0 : -2.6 * (1 - ease(a));
      rollWheels(-car.position.x / WHEEL_R);
      const nodT = (t - T_ARRIVE * 0.62) / 340;
      car.rotation.z = !waited && nodT > 0 && nodT < 1 ? -0.012 * Math.sin(nodT * Math.PI) * (1 - nodT) : 0;

      let wheelOut = false;
      parts.forEach((p, i) => {
        const s = clamp01((t - T_OUT - p.order * T_STAGGER) / T_DUR);
        p.t = ease(s);
        p.holder.visible = s > 0;
        p.holder.position.lerpVectors(p.seat, p.out, p.t);
        if (p.key === 'jant' && s > 0) wheelOut = true;
        p.line.material.opacity = 0.5 * smooth(clamp01((s - 0.15) / 0.5));
        p.drawU.uDraw.value = smooth(clamp01(s / 0.35)); // the drawing inks in as it leaves
        if (p.shadow) {
          // Only a developed part casts a shadow; a drawing lies on the paper.
          p.shadow.position.set(p.holder.position.x, 0.003, p.holder.position.z);
          p.shadow.material.opacity = p.shadowOpacity * smooth(clamp01((s - 0.3) / 0.5)) * Math.min(1, p.prog * 1.5);
        }
        if (p.nodes.length) {
          const k = smooth(clamp01((t - T_ENGINE) / T_ENGINE_DUR)) * 0.55;
          for (const n of p.nodes) n.node.position.copy(n.rest).addScaledVector(n.off, k);
        }
        const c = byKey[p.callout];
        if (c && s > 0.55) c.classList.add('is-shown');
      });
      setWheelCut(wheelOut);
      for (const k of ['govde-ust', 'govde-arka']) if (t > T_OUT + 350) byKey[k]?.classList.add('is-shown');
      // The hint: once the drawings are out, the engine develops into its model and stays.
      if (t > T_HINT && !hinted) { hinted = true; if (!chosen) develop(HINT); }
      return t < T_END;
    }

    /* ---------- Develop: drawing → model, then lift and a slow turn (timing as hero B) ---------- */

    let hoverActive = null; // what the pointer or focus is on now (callouts dim, the part sways)
    let chosen = null; // the part developed by the reader; it stays developed when they leave
    let pending = 0;
    function develop(key) {
      for (const p of parts) p.on = p.callout === key;
      kick();
    }
    onActive = (key, how) => {
      hoverActive = key;
      clearTimeout(pending);
      if (key && partKeys.has(key)) {
        const go = () => { chosen = key; develop(key); };
        if (how === 'focus' || reduce) go(); else pending = setTimeout(go, 60);
      }
      kick();
    };

    const easeOut3 = (x) => 1 - (1 - x) ** 3;
    const easeInOut3 = (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
    // Test hook: ?develop=<callout>:<prog>:<lift>:<turn> holds one part at that stage.
    const HOLD = params.get('develop')?.split(':');
    function devStep(dt, now) {
      let moving = false;
      for (const p of parts) {
        const before = p.prog + p.lift + p.spin + p.sway;
        if (HOLD) {
          const on = p.callout === HOLD[0];
          p.prog = on ? +HOLD[1] : 0; p.lift = on ? +(HOLD[2] || 0) : 0; p.spin = on ? +(HOLD[3] || 0) : 0;
        } else if (reduce) {
          p.prog = p.on ? 1 : 0; p.lift = 0; p.spin = 0; p.sway = 0;
        } else if (p.on) {
          p.prog = Math.min(1, p.prog + dt / 0.45);
          if (p.prog > 0.55) p.lift = Math.min(1, p.lift + dt / 0.3);
          if (p.lift > 0.3) p.spin = Math.min(1, p.spin + dt / 0.7);
        } else {
          p.spin = Math.max(0, p.spin - dt / 0.25);
          if (p.spin < 0.7) p.lift = Math.max(0, p.lift - dt / 0.22);
          if (p.lift < 0.6) p.prog = Math.max(0, p.prog - dt / 0.35);
        }
        // A slow sway only while the reader points at the part.
        const swayTo = !reduce && p.on && hoverActive === p.callout ? 1 : 0;
        p.sway += (swayTo - p.sway) * (1 - Math.exp(-dt * 3));
        if (Math.abs(p.sway - swayTo) < 0.002) p.sway = swayTo;
        // Keep running until every part has reached its target (a dt of 0 changes nothing).
        const settled = p.on ? p.prog === 1 && p.lift === 1 && p.spin === 1 : p.prog + p.lift + p.spin === 0;
        if (!reduce && !HOLD && !settled) moving = true;
        if (p.prog + p.lift + p.spin + p.sway !== before || p.sway > 0) moving = true;

        const L = easeOut3(p.lift);
        const Tn = easeOut3(p.spin);
        p.turn.position.y = 0.11 * L;
        p.turn.rotation.y = Tn * 0.38 + Math.sin(now / 2600 + p.phase) * 0.12 * Tn * p.sway;
        const k = easeInOut3(p.prog) * 1.04;
        p.modelU.uProg.value = p.drawU.uProg.value = k;
        p.model.visible = p.prog > 0;
        p.drawU.uGhost.value = 0.26 * L; // the drawing shows faintly under the lifted model
      }
      if (paint) {
        const want = hoverActive === 'govde-ust' ? 1.9 : 1;
        paint.envMapIntensity += (want - paint.envMapIntensity) * (1 - Math.exp(-dt * 6));
        if (Math.abs(paint.envMapIntensity - want) > 0.01) moving = true;
      }
      return moving;
    }

    // The dissolve works in each part's own metres, so the front moves with the part.
    function syncFronts() {
      car.updateMatrixWorld(true);
      for (const p of parts) {
        p.modelU.uInv.value.copy(p.model.matrixWorld).invert();
        p.drawU.uInv.value.copy(p.drawing.matrixWorld).invert();
      }
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
      const dt = Math.min(0.1, Math.max(0, now - (last || now)) / 1000);
      last = now;
      const timeline = pose(now);
      const hovering = devStep(dt, now);
      syncFronts();
      renderer.render(scene, camera);
      drawLeaders(anchors(), true);
      done = !timeline;
      if ((timeline || hovering) && visible) { if (!raf) raf = requestAnimationFrame(frame); } else last = 0;
    }
    function kick() { if (!raf && visible) { last = performance.now(); raf = requestAnimationFrame(frame); } }

    let visible = true;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); }).observe(sheetEl);
    new ResizeObserver(() => { resize(); kick(); if (!raf) frame(performance.now()); }).observe(sheetEl);
    document.fonts?.ready.then(() => kick());

    resize();
    root.classList.remove('is-booting');
    root.classList.add('is-live');
    if (done) {
      callouts.forEach((c) => c.classList.add('is-shown'));
      hinted = true;
      develop(HINT); // reduced motion: the drawings, and the engine as a model
    }
    kick();

    if (CAPTURE) {
      pose(0);
      if (params.has('bekle')) {
        // The waiting still: the parked car alone, all four wheels on.
        for (const p of parts) { p.holder.visible = false; p.line.visible = false; if (p.shadow) p.shadow.visible = false; }
        setWheelCut(false);
      }
      if (!params.has('bekle')) for (const p of parts) if (p.callout === HINT) { p.on = true; p.prog = p.lift = p.spin = 1; }
      devStep(0, 0);
      syncFronts();
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
const P = 'assets/models/parca/';
const R90 = Math.PI / 2;

// Car metres: front +X, up +Y, right side +Z. seat = assembled place, out = exploded place,
// both for the part's bottom centre. Parts are scaled up from true size (scale) so the small
// ones read at hero size. anchor = the leader's point, in the part's own centred metres.
// order = when it leaves.
const PARTS = [
  { key: 'motor', callout: 'motor', url: `${M}parca/motor-volvo-drive-e.glb`, explode: true, scale: 1.3, rot: [0, R90, 0], crease: 50,
    seat: [1.55, 0.45, 0], out: [1.6, 2.15, -0.25], anchor: [0, 0.22, 0], order: 0 },
  { key: 'ecu', callout: 'ecu', url: `${M}parca/elektrik-ecu.glb`, scale: 2.6, ink: 0.5, rot: [0.5, -0.5, 0],
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
  genis: { motor: [0.6702, 0.2164], ecu: [0.429, 0.2172], aku: [0.8971, 0.3808], amortisor: [0.769, 0.5111], camurluk: [0.6689, 0.731], fren: [0.4728, 0.6543], kapi: [0.1418, 0.5974], 'govde-ust': [0.3716, 0.323], 'govde-arka': [0.2041, 0.3918] },
  dar: { motor: [0.6634, 0.3185], ecu: [0.431, 0.3163], aku: [0.8829, 0.428], amortisor: [0.7527, 0.5159], camurluk: [0.6567, 0.6582], fren: [0.4743, 0.6102], kapi: [0.1578, 0.5731], 'govde-ust': [0.3737, 0.3865], 'govde-arka': [0.2058, 0.4327] },
};

/* ---------- Drawing and developing (the look and timing of hero B) ---------- */

// Navy ink, as sRGB values: written straight to the output, after tone mapping.
const INK = new Vector3(50 / 255, 50 / 255, 119 / 255);

// The front: mostly bottom → top in the part's own metres, broken up by two octaves of noise.
// kpD > uProg: still a drawing. kpD <= uProg: the model, with a thin ink edge at the front.
const FRONT = `
uniform float uProg; uniform vec2 uRange; uniform float uScale; uniform vec3 uInk;
varying vec3 vKp;
float kpHash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float kpNoise(vec3 x) {
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(kpHash(i), kpHash(i + vec3(1, 0, 0)), f.x), mix(kpHash(i + vec3(0, 1, 0)), kpHash(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(kpHash(i + vec3(0, 0, 1)), kpHash(i + vec3(1, 0, 1)), f.x), mix(kpHash(i + vec3(0, 1, 1)), kpHash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
float kpFront() {
  float h = clamp((vKp.y - uRange.x) / (uRange.y - uRange.x), 0.0, 1.0);
  float n = kpNoise(vKp * uScale) * 0.65 + kpNoise(vKp * uScale * 3.3) * 0.35;
  return h * 0.68 + n * 0.32;
}`;

// The model's own material, cut by the front.
function developing(mat, u) {
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform mat4 uInv;\nvarying vec3 vKp;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvKp = (uInv * modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\n${FRONT}`)
      .replace('void main() {', 'void main() {\n  float kpD = kpFront();\n  if (kpD > uProg) discard;')
      .replace('#include <dithering_fragment>', '#include <dithering_fragment>\n  if (kpD > uProg - 0.018) gl_FragColor.rgb = uInk;');
  };
  mat.customProgramCacheKey = () => 'acilan-model';
  mat.needsUpdate = true;
  return mat;
}

// The drawing: navy ink where the part is still a drawing (uDraw inks it in on load), a faint
// ghost (uGhost) where it has developed and lifted away.
const INK_FRAG = `${FRONT}
uniform float uDraw; uniform float uGhost; uniform float uAlpha;
void main() {
  float a = kpFront() > uProg ? uDraw : uGhost;
  if (a * uAlpha < 0.004) discard;
  gl_FragColor = vec4(uInk, a * uAlpha);
}`;
const PLAIN_VERT = `uniform mat4 uInv; varying vec3 vKp;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vKp = (uInv * w).xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
// The outline: back faces pushed out along the screen-space normal by uWidth device px.
const HULL_VERT = `uniform mat4 uInv; uniform vec2 uRes; uniform float uWidth; varying vec3 vKp;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vKp = (uInv * w).xyz;
  vec4 clip = projectionMatrix * viewMatrix * w;
  vec4 cn = projectionMatrix * viewMatrix * vec4(normalize(mat3(modelMatrix) * normal), 0.0);
  vec2 d = cn.xy * uRes;
  float l = length(d);
  if (l > 1e-6) clip.xy += (d / l) * (2.0 * uWidth / uRes) * clip.w;
  gl_Position = clip;
}`;

function drawingMaterials(u, weight = 1) {
  const ink = (alpha) => ({ ...u, uAlpha: { value: alpha } });
  // Depth only, pushed back a little: hides the lines behind, lets the car show through.
  const fill = new ShaderMaterial({
    uniforms: { uInv: u.uInv }, vertexShader: PLAIN_VERT,
    fragmentShader: 'void main() { gl_FragColor = vec4(1.0); }',
    colorWrite: false, side: DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
  });
  const line = new ShaderMaterial({
    uniforms: ink(0.72 * weight), vertexShader: PLAIN_VERT, fragmentShader: INK_FRAG,
    transparent: true, depthWrite: false,
  });
  const hull = new ShaderMaterial({
    uniforms: ink(0.9), vertexShader: HULL_VERT, fragmentShader: INK_FRAG,
    transparent: true, depthWrite: false, side: BackSide,
    polygonOffset: true, polygonOffsetFactor: 4, polygonOffsetUnits: 4,
  });
  return { fill, line, hull };
}

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
