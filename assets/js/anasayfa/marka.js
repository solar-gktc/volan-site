// Marka uzmanlığı: the brand picker swaps the engine drawing, its caption and the brand note.
// (The stage script listens to the same fieldset to swap the 3D car.)
const sec = document.querySelector('.s-marka');
const picker = sec?.querySelector('[data-brands]');

if (picker) {
  const names = { volvo: 'Volvo', mercedes: 'Mercedes-Benz', vw: 'Volkswagen' };
  const engines = { volvo: 'Drive-E', mercedes: 'OM654', vw: 'EA888 TSI' };
  const cap = sec.querySelector('[data-marka-cap]');
  const block = sec.querySelector('[data-marka-block]');

  picker.addEventListener('change', (ev) => {
    const b = ev.target.value;
    if (!names[b]) return;
    sec.querySelectorAll('[data-marka-note]').forEach((n) => n.classList.toggle('is-current', n.dataset.markaNote === b));
    sec.querySelectorAll('[data-marka-b]').forEach((i) => i.classList.toggle('is-current', i.dataset.markaB === b));
    if (cap) cap.textContent = `${names[b]} · ${engines[b]} tipi motor, çizim`;
    if (block) block.textContent = `${names[b]} · ${engines[b]}`;
  });
}
