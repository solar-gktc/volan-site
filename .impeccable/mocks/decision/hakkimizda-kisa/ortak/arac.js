// The parked Volvo XC60 (Volan's own model), drawn into a small transparent canvas.
// Drag turns it on the spot. Without WebGL the canvas is removed and nothing else changes.
import {
  WebGLRenderer, Scene, PerspectiveCamera, PMREMGenerator, DirectionalLight, HemisphereLight,
  MeshPhysicalMaterial, MeshBasicMaterial, CanvasTexture, SRGBColorSpace, ACESFilmicToneMapping,
  DoubleSide, Box3, Vector3, Group, GLTFLoader, MeshoptDecoder,
} from 'three';

const MODEL = '../../../../assets/models/volvo-xc60.glb';

function studioEnvironment(renderer) {
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
  const env = new PMREMGenerator(renderer).fromEquirectangular(tex).texture;
  tex.dispose();
  return env;
}

function prepare(scene) {
  const car = new Group();
  car.add(scene);
  scene.traverse((o) => {
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
    }
  });
  scene.updateMatrixWorld(true);
  const box = new Box3();
  scene.traverse((o) => { if (o.isMesh && !o.userData.shadow) box.expandByObject(o); });
  const c = box.getCenter(new Vector3());
  scene.position.set(-c.x, -box.min.y, -c.z);
  car.userData.length = box.max.x - box.min.x;
  return car;
}

async function mount(el) {
  const canvas = el.querySelector('canvas');
  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch {
    el.remove();
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const scene = new Scene();
  scene.environment = studioEnvironment(renderer);
  const sun = new DirectionalLight(0xffffff, 1.0);
  sun.position.set(-4, 10, 6);
  scene.add(sun, new HemisphereLight(0xf2f4fa, 0x8d93aa, 0.55));

  const camera = new PerspectiveCamera(22, 1, 0.1, 100);
  const elev = Number(el.dataset.elev || 0.32);
  const dist = Number(el.dataset.dist || 15);
  camera.position.set(0, Math.sin(elev) * dist, Math.cos(elev) * dist);
  camera.lookAt(0, 0.55, 0);

  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync(MODEL);
  const car = prepare(gltf.scene);
  let yaw = Number(el.dataset.yaw || -2.55);
  car.rotation.y = yaw;
  scene.add(car);

  const render = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  };
  new ResizeObserver(render).observe(canvas);
  render();
  el.classList.add('is-ready');

  // Drag to turn the car.
  let lastX = null;
  canvas.addEventListener('pointerdown', (e) => { lastX = e.clientX; canvas.setPointerCapture(e.pointerId); el.classList.add('is-dragging'); });
  canvas.addEventListener('pointermove', (e) => {
    if (lastX === null) return;
    yaw += (e.clientX - lastX) * 0.012;
    lastX = e.clientX;
    car.rotation.y = yaw;
    renderer.render(scene, camera);
  });
  const stop = () => { lastX = null; el.classList.remove('is-dragging'); };
  canvas.addEventListener('pointerup', stop);
  canvas.addEventListener('pointercancel', stop);
}

document.querySelectorAll('[data-arac]').forEach((el) => mount(el).catch(() => el.remove()));
