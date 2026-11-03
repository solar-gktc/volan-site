// Kampanya — index tabs on the cover band. Works for one to three campaigns as written in the
// markup: one panel hides the tab row; two or three panels become ARIA tabs (click, arrows, Home/End).
const root = document.querySelector('.s-kampanya');

if (root) {
  const list = root.querySelector('.tabs');
  const panels = [...root.querySelectorAll('.panel')];
  const tabs = list ? [...list.querySelectorAll('.tab')] : [];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  if (panels.length < 2 || tabs.length < 2) {
    // One campaign: no tabs, the panel is plain content.
    if (list) list.hidden = true;
    panels.forEach((p, i) => {
      p.hidden = i > 0;
      p.removeAttribute('role');
      p.removeAttribute('aria-labelledby');
    });
  } else {
    const n = Math.min(tabs.length, panels.length);
    tabs.slice(n).forEach((t) => t.remove());
    const select = (i, focus) => {
      tabs.slice(0, n).forEach((t, k) => {
        t.setAttribute('aria-selected', String(k === i));
        t.tabIndex = k === i ? 0 : -1;
      });
      panels.slice(0, n).forEach((p, k) => {
        p.hidden = k !== i;
        p.classList.remove('is-in');
        if (k === i && !reduce.matches) {
          void p.offsetWidth; // restart the entrance animation
          p.classList.add('is-in');
        }
      });
      if (focus) tabs[i].focus();
    };
    tabs.slice(0, n).forEach((t, i) => {
      t.addEventListener('click', () => select(i));
      t.addEventListener('keydown', (e) => {
        const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
        if (step) { e.preventDefault(); select((i + step + n) % n, true); }
        else if (e.key === 'Home') { e.preventDefault(); select(0, true); }
        else if (e.key === 'End') { e.preventDefault(); select(n - 1, true); }
      });
    });
  }
}
