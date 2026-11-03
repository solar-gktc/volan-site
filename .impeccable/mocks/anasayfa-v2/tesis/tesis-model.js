// Live facility model for the tesis mocks (v2, v3). One module, two settings.
// Loads three.js and the GLB only when the section nears the viewport; until then (and
// without WebGL, or if loading fails) the render image in the plate is the picture.
// Camera: orthographic (an axonometric drawing), turned by dragging sideways; vertical
// touch drags still scroll the page. Zone pins are HTML buttons placed over the canvas.

const GLB = '/facility-modelling/assets/volan-building.glb';
export const ZONES = {
  detailing: { no: 1, title: 'Oto kuaför', floor: 'Ana kat', group: 'main', text: 'Yıkama, pasta-cila ve detaylı temizlik.' },
  mechanics1: { no: 2, title: 'Mekanik 1', floor: 'Ana kat', group: 'main', text: 'İki lift, takım duvarı ve tezgâhlar.' },
  office: { no: 3, title: 'Giriş ve ofis', floor: 'Ana kat', group: 'main', text: 'Karşılama, servis danışmanı ve merdiven.' },
  mechanics2: { no: 4, title: 'Mekanik 2', floor: 'Ana kat', group: 'main', text: 'En büyük atölye: üç lift.' },
  bodyshop: { no: 5, title: 'Kaporta / boya', floor: 'Alt kat', group: 'lower', text: 'Sağdaki girişten rampayla inilen atölye.' },
  oven: { no: 6, title: 'Boya fırını', floor: 'Alt kat', group: 'lower', text: 'Alt atölyenin uzak ucunda, kapalı fırın.' },
  lounge: { no: 7, title: 'Bekleme salonu', floor: 'Üst kat', group: 'upper', text: 'Çay-kahve barı ve masalar; aracınız aşağıda.' },
};

export function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGL2RenderingContext && c.getContext('webgl2'));
  } catch { return false; }
}

export function mountFacility(root, opts = {}) {
  const o = Object.assign({
    cut: true,            // start in cutaway (no façade) or as the closed building
    exploded: false,      // floors pulled apart in the overview
    explodeBy: [7, 14],
    isolate: true,        // a selected zone shows only its floor
    hideSite: false,      // drop the forecourt slab and parked cars
    focus: true,          // a selected zone flies the camera to it
    theta: 38, phi: 60, margin: 1.06,
    onSelect: () => {}, onReady: () => {},
    eager: /[?&]shot/.test(location.search),
  }, opts);
  const stage = root.querySelector('[data-fm-stage]');
  const pinLayer = root.querySelector('[data-fm-pins]');
  const status = root.querySelector('[data-fm-status]');
  const api = { ready: false, select() {}, reset() {}, setCut() {} };
  if (!hasWebGL()) {
    root.classList.add('is-static');
    if (status) status.textContent = 'Bu tarayıcıda canlı model açılmıyor; çizim gösteriliyor.';
    return api;
  }

  let started = false;
  const start = () => { if (!started) { started = true; boot().catch(fail); } };
  if (o.eager) start();
  else {
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); start(); } }, { rootMargin: '900px 0px' });
    io.observe(root);
  }
  function fail(err) {
    console.error(err);
    root.classList.remove('is-loading', 'is-live');
    root.classList.add('is-static');
    if (status) status.textContent = 'Canlı model açılamadı; çizim gösteriliyor.';
  }

  async function boot() {
    root.classList.add('is-loading');
    const THREE = await import('three');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    const deg = THREE.MathUtils.degToRad;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    renderer.domElement.className = 'fm-canvas';
    stage.insertBefore(renderer.domElement, pinLayer || null);
    renderer.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); fail(new Error('context lost')); });

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new THREE.RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.5;
    pmrem.dispose();
    scene.add(new THREE.HemisphereLight('#f2f4fa', '#8d93aa', 2.0));
    const sun = new THREE.DirectionalLight('#ffffff', 3.0);
    sun.position.set(-18, 44, 22);
    sun.target.position.set(0, 0, -6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 160 });
    sun.shadow.normalBias = 0.045;
    scene.add(sun, sun.target);

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -400, 400);
    const view = { target: new THREE.Vector3(0, 2, -4), theta: deg(o.theta), phi: deg(o.phi), half: 20 };
    let tween = null, explodeT = 0, explodeTween = null;

    const gltf = await new Promise((res, rej) => new THREE.GLTFLoader().load(GLB, res, (p) => {
      if (status && p.total) status.textContent = `Model yükleniyor · %${Math.round((p.loaded / p.total) * 100)}`;
    }, rej));
    const model = gltf.scene;
    const groups = { upper: model.getObjectByName('UPPER'), main: model.getObjectByName('MAIN'), lower: model.getObjectByName('LOWER'), envelope: model.getObjectByName('ENVELOPE'), site: model.getObjectByName('SITE') };
    const base = { main: groups.main.position.y, upper: groups.upper.position.y, envelope: groups.envelope.position.y };
    const zoneOf = (obj) => { while (obj && obj !== model) { if (ZONES[obj.userData.zone]) return obj.userData.zone; obj = obj.parent; } return null; };
    const zoneMeshes = {}, tintable = [], cutParts = [];
    model.traverse((obj) => {
      if (obj.userData.cutawayHide && !Object.values(groups).includes(obj)) cutParts.push(obj);
      if (obj.isMesh) {
        obj.castShadow = true; obj.receiveShadow = true;
        const z = zoneOf(obj);
        if (z) {
          (zoneMeshes[z] ||= []).push(obj);
          const clone = (m) => { const c = m.clone(); if (c.emissive) tintable.push({ c, z, e: c.emissive.clone(), i: c.emissiveIntensity }); return c; };
          obj.material = Array.isArray(obj.material) ? obj.material.map(clone) : clone(obj.material);
        }
      }
    });
    scene.add(model);

    // State → scene
    const state = { cut: o.cut, floor: null, selected: null };
    function applyVisibility() {
      groups.envelope.visible = !state.cut;
      for (const p of cutParts) p.visible = !state.cut;
      const f = state.floor;
      groups.upper.visible = !f || f === 'upper';
      groups.main.visible = !f || f === 'main';
      groups.lower.visible = !f || f === 'lower';
      groups.site.visible = !o.hideSite && f !== 'lower';
    }
    function applyExplode(t) {
      groups.main.position.y = base.main + o.explodeBy[0] * t;
      groups.upper.position.y = base.upper + o.explodeBy[1] * t;
      model.updateMatrixWorld(true);
    }
    const explodeGoal = () => (state.cut && o.exploded && !state.floor ? 1 : 0);
    applyVisibility();
    explodeT = explodeGoal();
    applyExplode(explodeT);

    const isVisible = (obj) => { while (obj) { if (!obj.visible) return false; obj = obj.parent; } return true; };
    function zoneBox(z) {
      const b = new THREE.Box3();
      for (const m of zoneMeshes[z] || []) if (isVisible(m)) b.expandByObject(m);
      return b;
    }
    // The frame fits the building; the site slab may run past the plate's edge.
    function buildingBox() {
      const b = new THREE.Box3();
      for (const g of [groups.upper, groups.main, groups.lower, groups.envelope]) g.traverse((m) => { if (m.isMesh && isVisible(m)) b.expandByObject(m); });
      return b;
    }

    function size() { const r = stage.getBoundingClientRect(); return { w: Math.max(1, r.width), h: Math.max(1, r.height) }; }
    function place(v = view) {
      const { w, h } = size();
      const a = w / h;
      camera.position.copy(v.target).add(new THREE.Vector3().setFromSphericalCoords(150, v.phi, v.theta));
      camera.lookAt(v.target);
      Object.assign(camera, { top: v.half, bottom: -v.half, left: -v.half * a, right: v.half * a });
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
    }
    function fit(box, margin, theta, phi) {
      const v = { target: box.getCenter(new THREE.Vector3()), theta, phi, half: 10 };
      place(v);
      const inv = camera.matrixWorldInverse;
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      for (let i = 0; i < 8; i++) {
        const p = new THREE.Vector3(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).applyMatrix4(inv);
        x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y);
      }
      const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
      const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
      v.target.addScaledVector(right, (x0 + x1) / 2).addScaledVector(up, (y0 + y1) / 2);
      const { w, h } = size();
      v.half = Math.max((y1 - y0) / 2, (x1 - x0) / 2 / (w / h)) * margin;
      place(view);
      return v;
    }
    // The view a state wants, measured with the floors where they will end up.
    function goal() {
      const now = explodeT;
      applyExplode(explodeGoal());
      const narrow = innerWidth < 900;
      const angle = !state.cut && o.closedView ? (narrow && o.narrowClosed) || o.closedView : (narrow && o.narrowView) || { theta: o.theta, phi: o.phi };
      const v = state.selected && o.focus
        ? fit(zoneBox(state.selected), 1.9, view.theta, Math.min(view.phi, deg(56)))
        : fit(buildingBox(), o.margin, deg(angle.theta), deg(angle.phi));
      // Optional nudge of the overview (fractions of the frame), e.g. to clear a title block.
      const shift = !state.selected && (state.cut ? o.shiftCut : o.shiftClosed);
      if (shift && !(innerWidth < 900)) {
        place(v);
        const { w, h } = size();
        const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
        const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
        v.half *= shift[2] || 1;
        v.target.addScaledVector(right, shift[0] * 2 * v.half * (w / h)).addScaledVector(up, shift[1] * 2 * v.half);
        place(view);
      }
      applyExplode(now);
      return v;
    }
    function go(animate = true) {
      const v = goal();
      const to = explodeGoal();
      if (!animate || reduce.matches) {
        Object.assign(view, { target: v.target.clone(), theta: v.theta, phi: v.phi, half: v.half });
        explodeT = to; applyExplode(to); tween = null; explodeTween = null;
      } else {
        tween = { from: { target: view.target.clone(), theta: view.theta, phi: view.phi, half: view.half }, to: v, t0: performance.now(), dur: 800 };
        if (to !== explodeT) explodeTween = { from: explodeT, to, t0: performance.now() };
      }
      request();
    }

    // Pins
    const pins = {};
    if (pinLayer) {
      for (const [z, info] of Object.entries(ZONES)) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'fm-pin';
        b.dataset.zone = z;
        b.innerHTML = `<span class="fm-pin__no">${info.no}</span><span class="fm-pin__label">${info.title}</span>`;
        b.setAttribute('aria-label', `${info.no}. ${info.title}, ${info.floor}`);
        b.setAttribute('aria-pressed', 'false');
        b.addEventListener('click', () => api.select(z));
        pinLayer.appendChild(b);
        pins[z] = b;
      }
    }
    function placePins() {
      const { w, h } = size();
      for (const [z, el] of Object.entries(pins)) {
        const b = state.cut ? zoneBox(z) : new THREE.Box3();
        if (b.isEmpty()) { el.hidden = true; continue; }
        const c = b.getCenter(new THREE.Vector3());
        c.y = b.min.y + Math.min(2.2, (b.max.y - b.min.y) * 0.5);
        const p = c.project(camera);
        const x = (p.x + 1) / 2 * w, y = (1 - p.y) / 2 * h;
        el.hidden = x < 12 || x > w - 12 || y < 12 || y > h - 12;
        el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      }
    }

    function tint() {
      for (const t of tintable) {
        t.c.emissive.copy(t.e); t.c.emissiveIntensity = t.i;
        if (state.selected && t.z === state.selected) { t.c.emissive.set('#3b3f8f'); t.c.emissiveIntensity = 0.5; }
      }
      for (const [z, el] of Object.entries(pins)) el.setAttribute('aria-pressed', String(z === state.selected));
    }

    // Render on demand
    let queued = false;
    function request() { if (!queued) { queued = true; requestAnimationFrame(frame); } }
    function frame(now) {
      queued = false;
      let busy = false;
      if (explodeTween) {
        const k = Math.min(1, (now - explodeTween.t0) / 900);
        explodeT = explodeTween.from + (explodeTween.to - explodeTween.from) * (1 - Math.pow(1 - k, 3));
        applyExplode(explodeT);
        if (k === 1) explodeTween = null; else busy = true;
      }
      if (tween) {
        const k = Math.min(1, (now - tween.t0) / tween.dur);
        const e = 1 - Math.pow(1 - k, 3);
        view.target.lerpVectors(tween.from.target, tween.to.target, e);
        view.theta = tween.from.theta + (tween.to.theta - tween.from.theta) * e;
        view.phi = tween.from.phi + (tween.to.phi - tween.from.phi) * e;
        view.half = tween.from.half + (tween.to.half - tween.from.half) * e;
        if (k === 1) tween = null; else busy = true;
      }
      place();
      renderer.render(scene, camera);
      placePins();
      root.classList.toggle('is-moving', busy);
      if (busy) request();
    }

    function resize() {
      const { w, h } = size();
      renderer.setSize(w, h, false);
      go(false);
    }
    new ResizeObserver(resize).observe(stage);

    // Drag sideways to turn. Touch: horizontal drags only (CSS touch-action: pan-y on the canvas).
    let drag = null;
    const cv = renderer.domElement;
    cv.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, theta: view.theta, phi: view.phi }; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', (e) => {
      if (!drag) return;
      tween = null;
      view.theta = drag.theta - (e.clientX - drag.x) * 0.006;
      if (e.pointerType === 'mouse') view.phi = THREE.MathUtils.clamp(drag.phi - (e.clientY - drag.y) * 0.004, 0.35, 1.32);
      request();
    });
    const end = () => { drag = null; };
    cv.addEventListener('pointerup', end);
    cv.addEventListener('pointercancel', end);

    api.select = (z) => {
      if (!ZONES[z] || z === state.selected) z = null;
      state.selected = z;
      if (z) state.cut = true;
      state.floor = z && o.isolate ? ZONES[z].group : null;
      applyVisibility(); tint(); go();
      o.onSelect(z);
    };
    api.reset = () => { state.selected = null; state.floor = null; state.cut = o.cut; applyVisibility(); tint(); go(); o.onSelect(null); };
    api.setCut = (on) => { state.cut = on; state.selected = null; state.floor = null; applyVisibility(); tint(); go(); o.onSelect(null); };
    api.state = state;
    resize();
    root.classList.remove('is-loading');
    root.classList.add('is-live');
    if (status) status.textContent = 'Sürükleyerek çevirin; numaraya dokunun.';
    api.ready = true;
    o.onReady(api);
    const q = new URLSearchParams(location.search);
    if (q.get('zone')) api.select(q.get('zone'));
    if (q.get('cut') === '1') api.setCut(true);
    window.__fm = { THREE, scene, camera, view, model, api };
  }
  return api;
}
