// Miras: the then/now seams, the seam's first sweep, archive plates that develop as they
// arrive, the stamps, the viewing board, the years. Without this script the page reads the
// same: the seams rest at their marks, the plates are developed, the stamps are applied.

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const pressing = document.documentElement.classList.contains('press') && !reduceMotion;

/* ---------- Years ---------- */

for (const el of document.querySelectorAll('[data-this-year]')) el.textContent = String(new Date().getFullYear());

/* ---------- Dün / Bugün: a range input moves the seam ---------- */

for (const el of document.querySelectorAll('[data-karsilastir]')) {
  const input = el.querySelector('input[type="range"]');
  const apply = () => {
    const v = Math.round(Number(input.value));
    el.style.setProperty('--ayrim', `${input.value}%`);
    input.setAttribute('aria-valuetext', `Dün %${v}, bugün %${100 - v}`);
  };
  input.addEventListener('input', apply);
  const sweeps = 'supur' in el.dataset && document.documentElement.classList.contains('press') && !reduceMotion;
  // The sweeping seam keeps its CSS start (100%) until the plate is in view; the rest sit at their marks.
  if (!sweeps) { apply(); continue; }

  // The cover's seam sweeps once from all-archive back to its mark, so the old front
  // gives way to today's. Any touch of the control stops it.
  // The sweep runs as Web Animations on transforms, so it plays on the compositor and stays
  // smooth while the page is still loading. When it ends, the CSS variable takes over at the
  // same spot and the animations are dropped.
  const rest = Number(input.value);
  const win = el.querySelector('.karsilastir__dun');
  const old = win.querySelector('img');
  const line = el.querySelector('.karsilastir__cizgi');
  let anims = [];
  let stopped = false;
  const settle = () => { apply(); anims.forEach((a) => a.cancel()); anims = []; };
  // Any touch of the control ends the sweep and hands the seam to the visitor.
  const stop = () => { if (stopped) return; stopped = true; settle(); };
  input.addEventListener('pointerdown', stop, { once: true });
  input.addEventListener('keydown', stop, { once: true });
  const run = () => {
    if (stopped) return;
    const timing = { duration: 2200, delay: 300, easing: 'cubic-bezier(0.33, 1, 0.68, 1)', fill: 'both' };
    anims = [
      win.animate([{ transform: 'translateX(0%)' }, { transform: `translateX(${rest - 100}%)` }], timing),
      old.animate([{ transform: 'translateX(0%)' }, { transform: `translateX(${100 - rest}%)` }], timing),
      line.animate([{ transform: 'translateX(100%)' }, { transform: `translateX(${rest}%)` }], timing),
    ];
    anims[0].finished.then(() => { if (!stopped) { stopped = true; settle(); } }, () => {});
  };
  const loaded = old.complete ? Promise.resolve() : new Promise((r) => { old.addEventListener('load', r, { once: true }); old.addEventListener('error', r, { once: true }); });
  const seen = new Promise((r) => {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { io.disconnect(); r(); }
    }, { threshold: 0.5 });
    io.observe(el);
  });
  Promise.all([loaded, seen]).then(run);
}

/* ---------- Archive plates develop as they come into view ---------- */

const plates = [...document.querySelectorAll('[data-gelis]')];
if (pressing && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('mr-gelistir');
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-gelisti');
      io.unobserve(e.target);
    }
  }, { threshold: 0.35 });
  plates.forEach((el) => io.observe(el));
}

/* ---------- Stamps and the closing seal press in once ---------- */

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
  }, { threshold: 0, rootMargin: '0px 0px -30% 0px' });
  stampables.forEach((el) => io.observe(el));
}

/* ---------- The viewing board ---------- */

const board = document.querySelector('.mr-buyut');
if (board && typeof board.showModal === 'function') {
  // The board's image is made here, so the page never ships an <img> without a source.
  const img = document.createElement('img');
  board.querySelector('.mr-buyut__plaka').append(img);
  let opener = null;
  for (const btn of document.querySelectorAll('[data-buyut]')) {
    btn.addEventListener('click', () => {
      const src = btn.querySelector('img');
      img.src = src.currentSrc || src.src;
      img.alt = src.alt;
      opener = btn;
      board.showModal();
    });
  }
  // A click on the dark board around the plate closes it.
  board.addEventListener('click', (e) => { if (e.target === board) board.close(); });
  board.addEventListener('close', () => opener?.focus());
} else {
  // No dialog support: the buttons do nothing useful, so they stop looking clickable.
  for (const btn of document.querySelectorAll('[data-buyut]')) { btn.disabled = true; btn.style.cursor = 'default'; }
}

/* ---------- The facade film: a stop/play stamp, and no playing off-screen ---------- */

for (const film of document.querySelectorAll('.mr-bugun__film')) {
  const v = film.querySelector('video');
  const btn = film.querySelector('.mr-film__dugme');
  let held = reduceMotion; // the visitor (or the reduced-motion setting) wants it still
  if (held) { v.removeAttribute('autoplay'); v.pause(); }
  const label = () => { btn.textContent = held ? 'Oynat' : 'Durdur'; };
  btn.hidden = false;
  label();
  btn.addEventListener('click', () => {
    held = !held;
    if (held) v.pause(); else v.play().catch(() => {});
    label();
  });
  new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) v.pause(); else if (!held) v.play().catch(() => {});
    }
  }).observe(v);
}
