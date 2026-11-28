// Starts the 3D stage (three.js and the first vehicle model) only after the hero photo has
// arrived, so on a slow connection they do not compete with the first screen. The three files
// are then asked for together instead of one after another.
// The road is laid out over the page's sections: the campaign section must be settled first (kampanya-veri.js).
import { hazir } from './kampanya-veri.js';

const hero = document.querySelector('.print.is-current .print__img img');
function hint(rel, href, extra = {}) {
  const link = Object.assign(document.createElement('link'), { rel, href }, extra);
  document.head.append(link);
}
function start() {
  hint('modulepreload', 'assets/vendor/three.bundle.min.js');
  hint('preload', 'assets/models/volvo-xc60-dusuk.glb', { as: 'fetch', type: 'model/gltf-binary', crossOrigin: 'anonymous' });
  hazir.then(() => import('../main.js'));
}
if (!hero || hero.complete) start();
else {
  hero.addEventListener('load', start, { once: true });
  hero.addEventListener('error', start, { once: true });
}
