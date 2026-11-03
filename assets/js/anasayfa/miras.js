// Miras: pick a frame on the contact sheet; the enlargement on the easel "develops" it.
const sec = document.querySelector('.s-miras');

if (sec) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const print = sec.querySelector('[data-print]');
  const big = sec.querySelector('[data-big]');
  const frames = [...sec.querySelectorAll('.frame')];

  const show = (f) => {
    big.src = f.dataset.src;
    big.alt = f.dataset.alt;
    print.style.setProperty('--pos', f.dataset.pos);
  };

  frames.forEach((f) => f.addEventListener('click', () => {
    if (f.getAttribute('aria-pressed') === 'true') return;
    frames.forEach((o) => o.setAttribute('aria-pressed', String(o === f)));
    if (reduce.matches) { show(f); return; }
    print.classList.add('is-developing');
    show(f);
    big.decode().catch(() => {}).then(() => requestAnimationFrame(() => print.classList.remove('is-developing')));
  }));
}
