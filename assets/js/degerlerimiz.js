/* Değerlerimiz (draft): the visitor ticks the items they have checked; when every
   tickable item is ticked, the "Görüldü" stamp presses into the visitor's stamp box.
   Ticks are kept for this visit (sessionStorage), so following a "Bakın" link and
   coming back keeps the form as it was left. */
(() => {
  const form = document.querySelector('[data-form]');
  if (!form) return;
  const KEY = 'volan-degerler-isaret';
  const boxes = [...form.querySelectorAll('[data-isaret]')];
  const counts = form.querySelectorAll('[data-sayi]');
  const status = form.querySelector('[data-durum]');
  const stampBox = form.querySelector('[data-onay]');
  const pressed = (box) => box.getAttribute('aria-pressed') === 'true';

  const update = () => {
    const n = boxes.filter(pressed).length;
    const done = n === boxes.length;
    counts.forEach((el) => { el.textContent = String(n); });
    if (status) status.textContent = done ? '. Onay damgası basıldı.' : '';
    if (stampBox) stampBox.classList.toggle('is-stamped', done);
  };

  const save = () => {
    try { sessionStorage.setItem(KEY, boxes.map((b) => (pressed(b) ? '1' : '0')).join('')); } catch (e) { /* storage blocked: the form still works */ }
  };

  let saved = '';
  try { saved = sessionStorage.getItem(KEY) || ''; } catch (e) { saved = ''; }

  // Restored ticks appear already pressed, without the press animation.
  form.classList.add('is-geri');
  boxes.forEach((box, i) => {
    box.hidden = false;
    if (saved[i] === '1') box.setAttribute('aria-pressed', 'true');
    box.addEventListener('click', () => {
      box.setAttribute('aria-pressed', pressed(box) ? 'false' : 'true');
      update();
      save();
    });
  });
  form.querySelectorAll('[data-js]').forEach((el) => { el.hidden = false; });
  update();
  requestAnimationFrame(() => requestAnimationFrame(() => form.classList.remove('is-geri')));
})();
