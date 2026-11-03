// Tesis (homepage v2): floor tabs. One floor at a time; the drawing wipes in from the left.
// The legend and the pins on the drawing light each other up on hover.
const root = document.querySelector('.s-tesis');
if (root) {
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  const page = root.querySelector('.page');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const show = (tab) => {
    for (const t of tabs) {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      root.querySelector(`#${t.getAttribute('aria-controls')}`).classList.toggle('is-on', on);
    }
    if (!reduce.matches && page) {
      page.classList.remove('is-turning');
      void page.offsetWidth;
      page.classList.add('is-turning');
    }
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => show(t));
    t.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      const n = tabs[(i + d + tabs.length) % tabs.length];
      n.focus();
      show(n);
    });
  });
  for (const floor of root.querySelectorAll('.floor')) {
    for (const li of floor.querySelectorAll('.legend li')) {
      const pin = floor.querySelector(`.pin[data-n="${li.dataset.n}"]`);
      if (!pin) continue;
      const hot = (v) => { li.classList.toggle('is-hot', v); pin.classList.toggle('is-hot', v); };
      li.addEventListener('mouseenter', () => hot(true));
      li.addEventListener('mouseleave', () => hot(false));
    }
  }
}
