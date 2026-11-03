// Hero B, "Parça kataloğu levhası": the plate's line drawings develop into live 3D parts.
// Each part's GLB is rendered with an orthographic camera that repeats the Blender isometric
// camera of its line drawing (Euler 54.7356°, 0, 45°; fitted to 90% of the square), so the
// model lands exactly on its drawing. A noise front then develops the drawing into the model,
// the model lifts off the paper and turns a little. three.js loads only after the page shows.

const field = document.querySelector('[data-kp-field]');
if (field) init();

function init() {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const params = new URLSearchParams(location.search);
  const rows = [...document.querySelectorAll('.kp-row[data-part]')];
  const balloons = [...field.querySelectorAll('.kp-balloon[data-part]')];
  const leads = [...field.querySelectorAll('.kp-lead[data-part]')];
  const partEls = new Map([...field.querySelectorAll('.kp-part')].map((el) => [+el.dataset.part, el]));

  let active = 0;
  let stagePromise = null;
  const stage = () => (stagePromise ||= import('../../assets/vendor/three.bundle.min.js')
    .then((THREE) => makeStage(THREE, { field, partEls, reduce, params }))
    .catch(() => null));

  function mark(n) {
    for (const list of [rows, balloons, leads]) list.forEach((el) => el.classList.toggle('is-on', +el.dataset.part === n));
    partEls.forEach((el, k) => el.classList.toggle('is-on', k === n));
    if (n) field.dataset.on = n; else delete field.dataset.on;
  }

  function activate(n) {
    if (n === active) return;
    active = n;
    mark(n);
    stage().then((s) => s && s.show(n));
  }

  // Hover is debounced, so sweeping across the index does not load every model on the way.
  let pending = 0;
  const later = (n) => { clearTimeout(pending); pending = setTimeout(() => activate(n), 90); };
  for (const el of [...rows, ...balloons]) {
    const n = +el.dataset.part;
    el.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') later(n); });
    el.addEventListener('focus', () => { clearTimeout(pending); activate(n); });
  }

  // Staged load: the CSS prints the plate (about 1.5 s), then part 4, the engine, develops.
  const first = +(params.get('kp') || 4);
  const startAt = reduce ? 0 : 1450;
  const wait = Math.max(0, startAt - performance.now());
  setTimeout(() => { if (!active) activate(first); }, wait);
  if (!reduce) setTimeout(stage, Math.max(0, wait - 900)); // fetch three.js while the plate prints
}

async function makeStage(T, { field, partEls, reduce, params }) {
  const {
    WebGLRenderer, Scene, OrthographicCamera, PMREMGenerator, DirectionalLight, HemisphereLight,
    CanvasTexture, SRGBColorSpace, ACESFilmicToneMapping, Vector3, Box3, Group, Color,
    GLTFLoader, MeshoptDecoder,
  } = T;

  const canvas = field.querySelector('.kp-field__gl');
  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (err) {
    canvas.remove(); // no WebGL: the drawings and the index still work
    return null;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.autoClear = false;
  renderer.setClearColor(0x000000, 0);

  // The site's studio light: a soft vertical gradient as environment, one sun, a cool fill.
  const g = document.createElement('canvas');
  g.width = 256; g.height = 128;
  const c2 = g.getContext('2d');
  const grad = c2.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.38, '#e8ebf3');
  grad.addColorStop(0.5, '#b8bdcc');
  grad.addColorStop(1, '#5c6176');
  c2.fillStyle = grad;
  c2.fillRect(0, 0, 256, 128);
  const envTex = new CanvasTexture(g);
  envTex.colorSpace = SRGBColorSpace;
  const env = new PMREMGenerator(renderer).fromEquirectangular(envTex).texture;
  envTex.dispose();

  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);

  // Isometric axes of the Blender camera, in glTF space (Y up): it looks from (+1, +1, +1).
  const VIEW = new Vector3(1, 1, 1).normalize();
  const RIGHT = new Vector3(1, 0, -1).normalize();
  const UP = new Vector3(-1, 2, -1).normalize();
  const PAD = 64;        // the canvas reaches this far past the field (CSS), for the lifted part
  const GROW = 1.5;      // each part's viewport is this much larger than its drawing box
  const LIFT = 16;       // px the part rises off the paper
  const ZOOM = 0.16;     // and it comes this much closer
  const TURN = 0.38;     // rad it turns once lifted
  const EDGE = new Color(0x323277); // the developing front: navy ink, written after tone mapping

  const still = params.has('still'); // debug: hold the developed part on its drawing
  if (params.has('debug')) field.classList.add('is-debug');
  const parts = new Map();
  for (const [n, el] of partEls) {
    parts.set(n, { n, el, slug: el.dataset.slug, on: false, prog: 0, lift: 0, turn: 0, ready: null, box: null });
  }

  function dissolve(mat, u) {
    mat.onBeforeCompile = (s) => {
      Object.assign(s.uniforms, u);
      s.vertexShader = s.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vKpPos;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvKpPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      s.fragmentShader = s.fragmentShader
        .replace('#include <common>', `#include <common>
varying vec3 vKpPos;
uniform float uKpProg; uniform vec3 uKpUp; uniform vec2 uKpRange; uniform float uKpScale; uniform vec3 uKpEdge;
float kpHash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float kpNoise(vec3 x) {
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(kpHash(i), kpHash(i + vec3(1, 0, 0)), f.x), mix(kpHash(i + vec3(0, 1, 0)), kpHash(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(kpHash(i + vec3(0, 0, 1)), kpHash(i + vec3(1, 0, 1)), f.x), mix(kpHash(i + vec3(0, 1, 1)), kpHash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}`)
        .replace('void main() {', `void main() {
  float kpH = clamp((dot(vKpPos, uKpUp) - uKpRange.x) / (uKpRange.y - uKpRange.x), 0.0, 1.0);
  float kpN = kpNoise(vKpPos * uKpScale) * 0.65 + kpNoise(vKpPos * uKpScale * 3.3) * 0.35;
  float kpD = kpH * 0.68 + kpN * 0.32;
  if (kpD > uKpProg) discard;`)
        .replace('#include <dithering_fragment>', `#include <dithering_fragment>
  if (kpD > uKpProg - 0.018) gl_FragColor.rgb = uKpEdge;`);
    };
    mat.customProgramCacheKey = () => 'kp-dissolve';
    mat.needsUpdate = true;
  }

  function load(p) {
    if (p.ready) return p.ready;
    p.el.classList.add('is-loading');
    p.ready = loader.loadAsync(`prototypes/hero-b/glb/${p.slug}.glb`).then((gltf) => {
      const root = gltf.scene;
      root.updateMatrixWorld(true);
      // Projected extent of every vertex, as blueprint.py measured it for the drawing.
      let r0 = Infinity; let r1 = -Infinity; let u0 = Infinity; let u1 = -Infinity; let d0 = Infinity; let d1 = -Infinity;
      const v = new Vector3();
      root.traverse((o) => {
        if (!o.isMesh) return;
        const pos = o.geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
          const a = v.dot(RIGHT); const b = v.dot(UP); const d = v.dot(VIEW);
          if (a < r0) r0 = a; if (a > r1) r1 = a;
          if (b < u0) u0 = b; if (b > u1) u1 = b;
          if (d < d0) d0 = d; if (d > d1) d1 = d;
        }
      });
      const W = Math.max(r1 - r0, u1 - u0) / 0.9; // world width of the square drawing
      const half = (W * GROW) / 2;
      const depth = d1 - d0;
      const cam = new OrthographicCamera(-half, half, half, -half, 0.01, depth + 20);
      cam.position.copy(RIGHT).multiplyScalar((r0 + r1) / 2)
        .addScaledVector(UP, (u0 + u1) / 2)
        .addScaledVector(VIEW, d1 + 10);
      cam.up.set(0, 1, 0);
      cam.lookAt(cam.position.clone().sub(VIEW));

      const box = new Box3().setFromObject(root);
      const centre = box.getCenter(new Vector3());
      const pivot = new Group();
      pivot.position.copy(centre);
      root.position.sub(centre);
      pivot.add(root);

      const uniforms = {
        uKpProg: { value: 0 },
        uKpUp: { value: UP.clone() },
        uKpRange: { value: new T.Vector2(u0, u1) },
        uKpScale: { value: 11 / W },
        uKpEdge: { value: EDGE },
      };
      root.traverse((o) => {
        if (!o.isMesh) return;
        for (const m of [].concat(o.material)) {
          if (m.name === 'VP_Kirmizi_Kaliper') m.color.set(0x323277); // navy caliper, as in fren-seti-lacivert
          dissolve(m, uniforms);
        }
      });

      const scene = new Scene();
      scene.environment = env;
      const sun = new DirectionalLight(0xffffff, 1.0);
      sun.position.set(-4, 10, 6);
      scene.add(sun, new HemisphereLight(0xf2f4fa, 0x8d93aa, 0.55), pivot);
      Object.assign(p, { scene, cam, pivot, uniforms });
      renderer.compile(scene, cam);
      p.el.classList.remove('is-loading');
      return p;
    }).catch(() => {
      p.el.classList.remove('is-loading');
      p.ready = null;
      return null;
    });
    return p.ready;
  }

  // Layout: each part's drawing box in canvas CSS px (top-left origin).
  let cw = 0; let ch = 0;
  function layout() {
    cw = field.clientWidth + PAD * 2;
    ch = field.clientHeight + PAD * 2;
    renderer.setSize(cw, ch, false);
    for (const p of parts.values()) {
      p.box = { x: p.el.offsetLeft + PAD, y: p.el.offsetTop + PAD, s: p.el.offsetWidth };
    }
    kick();
  }

  const easeOut = (x) => 1 - (1 - x) ** 3;
  const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);

  function step(p, dt) {
    const before = p.prog + p.lift + p.turn;
    if (reduce || still) {
      p.prog = p.on && p.scene ? 1 : 0; p.lift = 0; p.turn = 0;
    } else if (p.on && p.scene) {
      p.prog = Math.min(1, p.prog + dt / 1.2);
      if (p.prog > 0.8) p.lift = Math.min(1, p.lift + dt / 0.6);
      if (p.lift > 0.4) p.turn = Math.min(1, p.turn + dt / 1.4);
    } else if (!p.on) {
      p.turn = Math.max(0, p.turn - dt / 0.5);
      if (p.turn < 0.5) p.lift = Math.max(0, p.lift - dt / 0.45);
      if (p.lift < 0.3) p.prog = Math.max(0, p.prog - dt / 0.7);
    }
    return p.prog + p.lift + p.turn !== before;
  }

  let raf = 0; let last = 0; let visible = true;
  const swayOn = !reduce && !params.has('nosway');
  function frame(t) {
    raf = 0;
    const dt = Math.min(0.05, (t - last) / 1000 || 0.016);
    last = t;
    let busy = false;
    let shadow = 0;
    renderer.setScissorTest(false);
    renderer.clear();
    renderer.setScissorTest(true);
    for (const p of parts.values()) {
      if (step(p, dt)) busy = true;
      const L = easeOut(p.lift);
      p.el.style.setProperty('--ghost', (1 - 0.74 * L).toFixed(3));
      if (!p.scene || p.prog <= 0 || !p.box) continue;
      const Tn = easeOut(p.turn);
      p.uniforms.uKpProg.value = easeInOut(p.prog) * 1.04;
      p.pivot.rotation.y = Tn * TURN + (swayOn && p.on ? Tn * Math.sin(t / 2600) * 0.07 : 0);
      p.cam.zoom = 1 + ZOOM * L;
      p.cam.updateProjectionMatrix();
      const size = p.box.s * GROW;
      const x = p.box.x - (size - p.box.s) / 2;
      const yTop = p.box.y - (size - p.box.s) / 2 - LIFT * L;
      renderer.setViewport(x, ch - yTop - size, size, size);
      renderer.setScissor(x, ch - yTop - size, size, size);
      renderer.render(p.scene, p.cam);
      renderer.clearDepth();
      shadow = Math.max(shadow, L);
      if (p.on && p.turn > 0 && swayOn) busy = true; // the slow sway keeps going
    }
    canvas.style.filter = shadow > 0.01
      ? `drop-shadow(0 ${(2 + 12 * shadow).toFixed(1)}px ${(3 + 9 * shadow).toFixed(1)}px rgba(43, 42, 41, ${(0.32 * shadow).toFixed(3)}))`
      : 'none';
    if (busy && visible) raf = requestAnimationFrame(frame);
  }
  function kick() {
    if (!raf && visible) { last = performance.now(); raf = requestAnimationFrame(frame); }
  }

  new ResizeObserver(layout).observe(field);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); }).observe(field);
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; if (visible) kick(); });
  layout();

  // On a desktop, the other models load one by one once the first is in, so hover is instant.
  let prefetched = false;
  function prefetch() {
    if (prefetched || !matchMedia('(hover: hover)').matches || navigator.connection?.saveData) return;
    prefetched = true;
    const queue = [...parts.values()];
    const next = () => {
      const p = queue.shift();
      if (!p) return;
      const idle = window.requestIdleCallback || ((f) => setTimeout(f, 200));
      idle(() => load(p).then(next));
    };
    next();
  }

  return {
    show(n) {
      for (const p of parts.values()) p.on = p.n === n;
      const p = parts.get(n);
      if (!p) return;
      load(p).then(() => { kick(); prefetch(); });
      kick();
    },
  };
}
