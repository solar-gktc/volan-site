// The floating contact seal: opens three stamp-box links (Ara, WhatsApp, Yol tarifi).
const root = document.querySelector('[data-iletisim]');
if (root) {
  const btn = root.querySelector('.iletisim__muhur');
  const panel = root.querySelector('.iletisim__liste');
  const set = (open) => {
    btn.setAttribute('aria-expanded', String(open));
    root.classList.toggle('is-open', open);
    panel.inert = !open;
  };
  set(false);
  btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') !== 'true';
    set(open);
    if (open) panel.querySelector('a').focus({ preventScroll: true });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && root.classList.contains('is-open')) { set(false); btn.focus(); }
  });
  document.addEventListener('pointerdown', (e) => {
    if (root.classList.contains('is-open') && !root.contains(e.target)) set(false);
  });
}

// Dün / Bugün compare: a range input drives the split.
document.querySelectorAll('[data-karsilastir]').forEach((el) => {
  const input = el.querySelector('input[type="range"]');
  const apply = () => el.style.setProperty('--ayrim', `${input.value}%`);
  input.addEventListener('input', apply);
  apply();
});

// Stamps press in when they come into view.
const stampIO = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-stamped'); stampIO.unobserve(e.target); }
}, { threshold: 0.5 });
document.querySelectorAll('[data-stamp]').forEach((el) => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) el.classList.add('is-stamped');
  else stampIO.observe(el);
});

// Years since 1954.
const years = new Date().getFullYear() - 1954;
document.querySelectorAll('[data-years]').forEach((el) => { el.textContent = years; });
