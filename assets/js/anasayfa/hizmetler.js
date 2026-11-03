// Hizmetler (Dizin sekmeleri): turning a thumb-index tab opens that service's leaf.
// ARIA tabs: click, arrow keys, Home and End. Reduced motion: no slide-in.
const root = document.querySelector('.s-hizmetler');

if (root) {
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const open = (i, focus) => {
    tabs.forEach((t, j) => {
      const on = i === j;
      const panel = root.querySelector(`#${t.getAttribute('aria-controls')}`);
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      panel.hidden = !on;
      panel.classList.remove('is-turning');
      if (on && !still) { void panel.offsetWidth; panel.classList.add('is-turning'); }
    });
    if (focus) tabs[i].focus();
  };

  tabs.forEach((t, i) => {
    t.addEventListener('click', () => open(i));
    t.addEventListener('keydown', (e) => {
      const n = tabs.length;
      const to = { ArrowDown: i + 1, ArrowRight: i + 1, ArrowUp: i - 1, ArrowLeft: i - 1, Home: 0, End: n - 1 }[e.key];
      if (to === undefined) return;
      e.preventDefault();
      open((to + n) % n, true);
    });
  });
}
