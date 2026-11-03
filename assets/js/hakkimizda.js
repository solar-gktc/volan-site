// Hakkımızda: the five quality parts, the stamps, the then/now slider, the years.
// The ink-drop drawing is murekkep.js. Without WebGL the 3D canvases are removed and the page
// reads the same.
import {
  WebGLRenderer, Scene, PerspectiveCamera, PMREMGenerator, DirectionalLight, HemisphereLight,
  Mesh, PlaneGeometry, MeshBasicMaterial, CanvasTexture, SRGBColorSpace,
  ACESFilmicToneMapping, Box3, Vector3, Group, GLTFLoader, MeshoptDecoder,
} from 'three';

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const pressing = document.documentElement.classList.contains('press') && !reduceMotion;

/* ---------- Years since 1954 ---------- */

const years = String(new Date().getFullYear() - 1954);
for (const el of document.querySelectorAll('[data-years]')) el.textContent = years;
for (const el of document.querySelectorAll('[data-this-year]')) el.textContent = String(new Date().getFullYear());
for (const el of document.querySelectorAll('[data-years-boxes]')) {
  const unit = el.querySelector('.kutular__birim');
  el.replaceChildren(...[...years].map((d) => Object.assign(document.createElement('span'), { textContent: d })), unit);
}

/* ---------- Isotype marks: one stamped mark per person or lift ---------- */

for (const el of document.querySelectorAll('[data-isaret]')) {
  const n = Number(el.dataset.adet);
  el.innerHTML = Array.from({ length: n }, (_, i) => `<svg style="--i:${i}"><use href="#${el.dataset.isaret}"/></svg>`).join('');
}

/* ---------- Stamps, ticks and seals press in once, when they come into view ---------- */

const stampables = [...document.querySelectorAll('[data-stamp]')];
if (!pressing) {
  stampables.forEach((el) => el.classList.add('is-stamped'));
} else {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-stamped');
      io.unobserve(e.target);
    }
  }, { threshold: 0.4 });
  stampables.forEach((el) => io.observe(el));
}

/* ---------- Dün / Bugün: a range input moves the split ---------- */

for (const el of document.querySelectorAll('[data-karsilastir]')) {
  const input = el.querySelector('input[type="range"]');
  const apply = () => el.style.setProperty('--ayrim', `${input.value}%`);
  input.addEventListener('input', apply);
  apply();
}

/* ---------- 3D ---------- */

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);

function makeRenderer(canvas) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  return renderer;
}

// The site's studio light: a soft vertical gradient as environment, one sun, a cool fill.
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

// A short contact shadow: dense where the part touches the page, gone a little past its edge.
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
  m.position.y = 0.002;
  return m;
}

/* The five quality parts. One renderer draws every part, then each frame is copied into its
   own canvas. Parts sway gently while the section is on screen; the engine opens into its
   parts and closes again ("Şeffaf süreç"). */
const PART_YAW = {
  'elektrik-ecu': -0.6,
  'fren-seti': 0.45,
  'motor-volvo-drive-e': -0.7,
  'kaporta-on-kapi': 0.3,
  'sasi-amortisor': 0.2,
};
const EXPLODE_MAX = 0.75;

// 0 → 1 → 0 over an 8 s cycle: rest, open, hold, close.
function explodeAt(t) {
  const s = (t / 1000) % 8;
  const ease = (x) => x * x * (3 - 2 * x);
  if (s < 1.2) return 0;
  if (s < 2.8) return ease((s - 1.2) / 1.6);
  if (s < 5.6) return 1;
  if (s < 7.2) return 1 - ease((s - 5.6) / 1.6);
  return 0;
}

async function qualityParts(list) {
  const stages = [...list.querySelectorAll('[data-parca]')];
  const renderer = makeRenderer(document.createElement('canvas'));
  const base = studioScene(renderer);
  const env = base.environment;
  const lights = base.children;

  const parts = await Promise.all(stages.map(async (stage, i) => {
    const name = stage.dataset.parca;
    const [gltf, offsets] = await Promise.all([
      loader.loadAsync(`assets/models/parca/${name}.glb`),
      'patlat' in stage.dataset ? fetch(`assets/models/parca/${name}-patlatma.json`).then((r) => r.json()) : null,
    ]);
    const scene = new Scene();
    scene.environment = env;
    for (const l of lights) scene.add(l.clone());
    const pivot = new Group();
    pivot.add(gltf.scene);
    scene.add(pivot);

    // Explode nodes: rest position plus offset × t.
    const nodes = offsets
      ? Object.entries(offsets).map(([n, v]) => {
        const node = gltf.scene.getObjectByName(n);
        return node && { node, rest: node.position.clone(), off: new Vector3(...v) };
      }).filter(Boolean)
      : [];
    const setExplode = (t) => { for (const e of nodes) e.node.position.copy(e.rest).addScaledVector(e.off, t * EXPLODE_MAX); };

    // Frame the part (opened, for the engine) from a fixed three-quarter view.
    setExplode(nodes.length ? 1 : 0);
    gltf.scene.updateMatrixWorld(true);
    const box = new Box3().setFromObject(gltf.scene);
    setExplode(0);
    const size = box.getSize(new Vector3());
    const centre = box.getCenter(new Vector3());
    gltf.scene.position.set(-centre.x, -box.min.y, -centre.z);
    // The shadow follows the part's footprint and turns with it; nudged away from the sun.
    const shadow = contactShadow(size.x * 1.12, size.z * 1.12);
    shadow.position.set(size.x * 0.04, 0.002, -size.z * 0.03);
    pivot.add(shadow);
    const radius = size.length() / 2;
    const camera = new PerspectiveCamera(26, 1, 0.01, 100);
    // An opening part is framed a little tighter: its widest pose is held only briefly.
    const dist = (radius / Math.sin((26 * Math.PI) / 360)) * (nodes.length ? 0.86 : 1.02);
    const elev = 0.38;
    camera.position.set(0, size.y / 2 + Math.sin(elev) * dist, Math.cos(elev) * dist);
    camera.lookAt(0, size.y / 2, 0);

    const yaw0 = PART_YAW[name] ?? 0;
    pivot.rotation.y = yaw0;
    const canvas = stage.querySelector('canvas');
    return { stage, canvas, ctx: canvas.getContext('2d'), scene, camera, pivot, yaw0, phase: i * 1.3, setExplode, explodes: nodes.length > 0 };
  }));

  let W = 0, H = 0;
  const resize = () => {
    const r = stages[0].getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio, 2);
    W = Math.round(r.width * dpr);
    H = Math.round(r.height * dpr);
    if (!W || !H) return;
    renderer.setPixelRatio(1);
    renderer.setSize(W, H, false);
    for (const p of parts) { p.canvas.width = W; p.canvas.height = H; p.camera.aspect = W / H; p.camera.updateProjectionMatrix(); }
  };
  const draw = (t) => {
    if (!W) return;
    for (const p of parts) {
      if (!reduceMotion) {
        p.pivot.rotation.y = p.yaw0 + Math.sin(t / 2600 + p.phase) * 0.45;
        if (p.explodes) p.setExplode(explodeAt(t));
      }
      renderer.render(p.scene, p.camera);
      p.ctx.clearRect(0, 0, W, H);
      p.ctx.drawImage(renderer.domElement, 0, 0);
    }
  };
  new ResizeObserver(() => { resize(); draw(performance.now()); }).observe(stages[0]);
  resize();
  draw(0);
  if (reduceMotion) return;

  // Animate only while the steps are on screen.
  let running = false, raf = 0;
  const loop = (now) => { draw(now); if (running) raf = requestAnimationFrame(loop); };
  new IntersectionObserver(([e]) => {
    running = e.isIntersecting;
    cancelAnimationFrame(raf);
    if (running) raf = requestAnimationFrame(loop);
  }).observe(list);
}

function removeCanvases() {
  document.querySelectorAll('[data-parca] canvas').forEach((el) => el.remove());
}

try {
  const list = document.querySelector('[data-parcalar]');
  if (list) {
    // Load the parts only when the steps come near the screen.
    const near = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      near.disconnect();
      qualityParts(list).catch(() => list.querySelectorAll('[data-parca] canvas').forEach((c) => c.remove()));
    }, { rootMargin: '400px 0px' });
    near.observe(list);
  }
} catch {
  removeCanvases();
}
