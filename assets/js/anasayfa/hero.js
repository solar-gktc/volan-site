// Hero (Etiketli baskı): three prints with a stapled card. Arrows at the side edges and dots at
// the foot of the print switch slides; the new print is pulled down over the old one.
// Auto-advance every 7 s, held while the pointer is over the hero or focus is inside it, stopped
// for good once the visitor uses an arrow or a dot, never with reduced motion, and only while the
// hero is on screen. Without this script the first slide shows and the controls stay hidden.
const root = document.querySelector('.s-hero');
if (root) init(root);

function init(root) {
  const prints = [...root.querySelectorAll('.print')];
  const bodies = [...root.querySelectorAll('.hcard__body')];
  const dots = [...root.querySelectorAll('.hero__dot')];
  const arrows = [...root.querySelectorAll('.hero__arrow')];
  const nav = root.querySelector('[data-nav]');
  const stack = root.querySelector('[data-prints]');
  const card = root.querySelector('[data-card]');
  const lastday = root.querySelector('[data-lastday]');
  if (!prints.length || !nav || !card) return;

  const DUR = 7000;
  const tilts = ['-0.9deg', '0.7deg', '-0.5deg'];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let cur = 0;
  let stopped = reduce;
  let pointerIn = false;
  let focusIn = false;
  let visible = true;
  let elapsed = 0;
  let stampTimer;

  nav.hidden = false;
  root.classList.toggle('is-animated', !reduce);

  // Freeze the banner height on wide screens; recompute only when the width changes,
  // so it does not jump with the browser bars.
  const sizeHero = () => {
    if (innerWidth < 900) { root.style.height = ''; return; }
    const menu = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--menu-h')) || 72;
    root.style.height = `${Math.round(Math.min(1000, Math.max(720, innerHeight - menu)))}px`;
  };
  let lastW = innerWidth;
  sizeHero();
  addEventListener('resize', () => { if (innerWidth !== lastW) { lastW = innerWidth; sizeHero(); } });

  function show(n, animate) {
    if (n === cur) return;
    const prev = cur;
    cur = n;
    prints.forEach((p, i) => {
      p.classList.remove('is-prev', 'is-entering');
      p.classList.toggle('is-current', i === n);
      if (animate && i === prev) p.classList.add('is-prev');
      if (i === n) p.removeAttribute('aria-hidden'); else p.setAttribute('aria-hidden', 'true');
    });
    if (animate) {
      const p = prints[n];
      stack.classList.remove('is-pulling');
      void p.offsetWidth;
      p.classList.add('is-entering');
      stack.classList.add('is-pulling');
      p.addEventListener('animationend', function done(e) {
        if (e.target !== p) return;
        p.removeEventListener('animationend', done);
        p.classList.remove('is-entering');
        stack.classList.remove('is-pulling');
        prints.forEach((q) => q.classList.remove('is-prev'));
      });
    }
    bodies.forEach((b, i) => {
      b.inert = i !== n;
      if (i === n) b.removeAttribute('aria-hidden'); else b.setAttribute('aria-hidden', 'true');
    });
    card.style.setProperty('--tilt', tilts[n] || '0deg');
    dots.forEach((d, i) => { if (i === n) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
    clearTimeout(stampTimer);
    if (lastday) {
      lastday.classList.remove('is-stamped');
      if (bodies[n] && bodies[n].contains(lastday)) {
        if (animate) stampTimer = setTimeout(() => lastday.classList.add('is-stamped'), 650);
        else lastday.classList.add('is-stamped');
      }
    }
    elapsed = 0;
  }

  // A visitor's choice stops auto-advance for good; the card then announces the new slide.
  const choose = (n) => {
    stopped = true;
    card.setAttribute('aria-live', 'polite');
    show((n + prints.length) % prints.length, !reduce);
  };

  arrows.forEach((a) => a.addEventListener('click', () => choose(cur + Number(a.dataset.step))));
  dots.forEach((d) => d.addEventListener('click', () => choose(Number(d.dataset.go))));
  [...arrows, ...dots].forEach((b) => b.addEventListener('keydown', (e) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    choose(cur + step);
    if (b.classList.contains('hero__dot')) dots[cur].focus();
  }));

  root.addEventListener('pointerenter', () => { pointerIn = true; });
  root.addEventListener('pointerleave', () => { pointerIn = false; });
  root.addEventListener('focusin', () => { focusIn = true; });
  root.addEventListener('focusout', (e) => { if (!root.contains(e.relatedTarget)) focusIn = false; });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(root);
  }

  if (stopped) return;
  let last = performance.now();
  const timer = setInterval(() => {
    const now = performance.now();
    const dt = now - last;
    last = now;
    if (stopped) { clearInterval(timer); return; }
    if (pointerIn || focusIn || !visible || document.hidden) return;
    elapsed += dt;
    if (elapsed >= DUR) show((cur + 1) % prints.length, true);
  }, 200);
}
