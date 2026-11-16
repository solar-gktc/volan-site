// Vizyon & Misyon (draft): draws the route and presses the stamps.
// The built road runs from the route slip past the three mission stops; from the navy
// board on it is only a planned outline. Without this script the page reads the same,
// with no road and every stamp applied.

(() => {
const page = document.querySelector('[data-yol]');
const svg = page?.querySelector('.vm-yol');

if (page && svg) {
  const NS = 'http://www.w3.org/2000/svg';
  const narrow = matchMedia('(max-width: 899px)');
  const start = page.querySelector('[data-yol-bas]');
  const board = page.querySelector('.ufuk');
  const stops = [...page.querySelectorAll('.durak[data-lane]')];
  const aims = [...page.querySelectorAll('.hedef[data-lane]')];
  const wrap = page.querySelector('.vm-wrap');

  const path = (cls, d) => {
    const el = document.createElementNS(NS, 'path');
    el.setAttribute('class', cls);
    el.setAttribute('d', d);
    return el;
  };

  // A lane-to-lane route: straight down each lane, a rounded crossing at the top of
  // every stop whose lane differs from the one before it.
  function route(x0, y0, legs, yEnd, r) {
    let x = x0;
    let d = `M${x} ${y0}`;
    for (const leg of legs) {
      if (leg.x === x) continue;
      const dir = Math.sign(leg.x - x);
      const rr = Math.min(r, Math.abs(leg.x - x) / 2);
      d += ` L${x} ${leg.y - rr} Q${x} ${leg.y} ${x + dir * rr} ${leg.y}`;
      d += ` L${leg.x - dir * rr} ${leg.y} Q${leg.x} ${leg.y} ${leg.x} ${leg.y + rr}`;
      x = leg.x;
    }
    return { d: `${d} L${x} ${yEnd}`, x };
  }

  // The same route drawn with true arcs and shifted sideways by o, so the planned road's
  // two edges stay parallel to its centre line through every corner.
  function offsetRoute(x0, y0, legs, yEnd, r, o) {
    let x = x0;
    let d = `M${x + o} ${y0}`;
    for (const leg of legs) {
      if (leg.x === x) continue;
      const dir = Math.sign(leg.x - x);
      const rr = Math.min(r, Math.abs(leg.x - x) / 2);
      const r1 = rr - dir * o;
      const r2 = rr + dir * o;
      const y = leg.y - dir * o;
      d += ` L${x + o} ${leg.y - rr} A${r1} ${r1} 0 0 ${dir > 0 ? 0 : 1} ${x + dir * rr} ${y}`;
      d += ` L${leg.x - dir * rr} ${y} A${r2} ${r2} 0 0 ${dir > 0 ? 1 : 0} ${leg.x + o} ${leg.y + rr}`;
      x = leg.x;
    }
    return `${d} L${x + o} ${yEnd}`;
  }

  function draw() {
    const box = page.getBoundingClientRect();
    const top = (el) => el.getBoundingClientRect().top - box.top;
    const w = wrap.getBoundingClientRect();
    const laneX = (el) => {
      if (narrow.matches) return 36;
      return Math.round(w.left - box.left + w.width * (el.dataset.lane === 'left' ? 0.2 : 0.8));
    };
    const r = narrow.matches ? 0 : 64;

    const s = start.getBoundingClientRect();
    // Wide: the route starts under the slip. Narrow: the slip is wider than the lane, so the
    // road starts at the slip's bottom edge.
    const y0 = Math.round(narrow.matches ? s.bottom - box.top - 3 : s.top - box.top + s.height / 2);
    const boardTop = Math.round(top(board));

    const built = route(laneX(stops[0]), y0, stops.map((el) => ({ x: laneX(el), y: Math.round(top(el)) })), boardTop, r);
    // The outline stops inside the board's foil frame.
    const frame = board.querySelector('.ufuk__cerceve');
    const planEnd = Math.round(frame.getBoundingClientRect().bottom - box.top) - 40;
    const planLegs = aims.map((el) => ({ x: laneX(el), y: Math.round(top(el)) }));
    const half = parseFloat(getComputedStyle(page).getPropertyValue('--road-width')) / 2 - 1;
    const plan = (o) => offsetRoute(built.x, boardTop, planLegs, planEnd, r, o);

    svg.setAttribute('width', box.width);
    svg.setAttribute('height', page.offsetHeight);
    svg.setAttribute('viewBox', `0 0 ${box.width} ${page.offsetHeight}`);
    svg.replaceChildren(
      path('road__edge', built.d),
      path('road__bed road__bed--1', built.d),
      path('road__bed road__bed--2', built.d),
      path('road__bed road__bed--3', built.d),
      path('road__bed', built.d),
      path('road__line', built.d),
      path('vm-yol__plan-kenar', plan(-half)),
      path('vm-yol__plan-kenar', plan(half)),
      path('vm-yol__plan-cizgi', plan(0)),
    );
  }

  let queued = 0;
  const redraw = () => {
    cancelAnimationFrame(queued);
    queued = requestAnimationFrame(draw);
  };
  draw();
  new ResizeObserver(redraw).observe(page);
  document.fonts?.ready.then(redraw);
  addEventListener('load', redraw);
}

/* ---------- Stamps press in once, when they come into view ---------- */

const stampables = [...document.querySelectorAll('[data-stamp]')];
if (!document.documentElement.classList.contains('press') || !('IntersectionObserver' in window)) {
  stampables.forEach((el) => el.classList.add('is-stamped'));
} else {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-stamped');
      io.unobserve(e.target);
    }
  }, { threshold: 0.6 });
  stampables.forEach((el) => io.observe(el));
}
})();
