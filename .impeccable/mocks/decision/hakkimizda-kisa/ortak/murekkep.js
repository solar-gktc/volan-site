// Ink-drop reveal for the pencil team drawing.
// A navy drop falls onto the page, splashes, and spreads as a wet blot with an uneven,
// fingered edge. The drawing develops inside the blot while the wet navy wash dries out.
// Markup: <figure data-murekkep data-drops="x,y,delayMs,size; ..."><img ...></figure>
// x, y are fractions of the drawing; size is the blot radius as a fraction of its width.

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
// Review hook: ?murekkep=<ms> freezes the effect at that moment ("son" = finished).
const freeze = new URLSearchParams(location.search).get('murekkep');
const NAVY = '50, 50, 119';
const FALL = 300; // ms the first drop takes to fall
const STEPS = 180;

function rng(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function makeDrop([x, y, delay, size], i) {
  const r = rng(1954 + i * 131);
  return {
    x, y, size,
    delay: delay + FALL,
    dur: 1500 + size * 1900,
    harmonics: Array.from({ length: 8 }, (_, k) => ({ k: k + 2, a: (0.035 + r() * 0.05) / Math.sqrt(k + 1), p: r() * 6.283 })),
    fingers: Array.from({ length: 6 + ((r() * 5) | 0) }, () => ({ ang: r() * 6.283, w: 0.05 + r() * 0.1, a: 0.1 + r() * 0.26 })),
    sats: Array.from({ length: 8 + ((r() * 10) | 0) }, () => ({ ang: r() * 6.283, d: 1.02 + r() * 0.55, s: 0.006 + r() * 0.02, t: r() * 0.12 })),
  };
}

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const easeOut = (p) => 1 - Math.pow(1 - p, 3.2);

function angDist(a, b) {
  const d = Math.abs(a - b) % 6.283;
  return d > 3.1416 ? 6.283 - d : d;
}

// Blot outline at progress p, in pixel space of a W×H box, scaled by k (grows the edge).
function blotPath(ctx, d, p, W, H, k = 1) {
  const e = easeOut(p);
  const R = d.size * W * e * k;
  if (R < 0.5) return false;
  const cx = d.x * W, cy = d.y * H;
  const fingerGrow = clamp01((p - 0.12) / 0.88);
  ctx.beginPath();
  for (let i = 0; i <= STEPS; i++) {
    const th = (i / STEPS) * 6.283;
    let m = 1;
    for (const h of d.harmonics) m += h.a * Math.sin(h.k * th + h.p + p * 0.7);
    for (const f of d.fingers) {
      const x = angDist(th, f.ang) / f.w;
      m += f.a * Math.exp(-x * x) * fingerGrow;
    }
    const rr = R * m;
    const px = cx + Math.cos(th) * rr, py = cy + Math.sin(th) * rr;
    if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
  }
  ctx.closePath();
  // Splash satellites: flung out at impact, they swell a little as they soak in.
  const Rfull = d.size * W;
  for (const s of d.sats) {
    const q = clamp01((p - s.t) / 0.25);
    if (q <= 0) continue;
    const dist = Rfull * s.d * (0.55 + 0.45 * easeOut(Math.min(1, p * 2.2)));
    const sr = s.s * W * (0.4 + 0.6 * easeOut(q)) * k;
    const sx = cx + Math.cos(s.ang) * dist, sy = cy + Math.sin(s.ang) * dist;
    ctx.moveTo(sx + sr, sy);
    ctx.arc(sx, sy, sr, 0, 6.283);
  }
  return true;
}

class InkDrop {
  constructor(fig) {
    this.fig = fig;
    this.img = fig.querySelector('img');
    this.drops = (fig.dataset.drops || '0.5,0.6,0,0.7')
      .split(';').map((s) => s.split(',').map(Number)).map(makeDrop);
    this.end = Math.max(...this.drops.map((d) => d.delay + d.dur));
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'murekkep__tuval';
    this.canvas.setAttribute('aria-hidden', 'true');
    fig.append(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.mask = document.createElement('canvas');
    this.mctx = this.mask.getContext('2d');
    this.off = document.createElement('canvas');
    this.octx = this.off.getContext('2d');
    this.t = 0;
    this.started = false;
    fig.classList.add('is-live');
    new ResizeObserver(() => this.resize()).observe(this.img);
  }

  resize() {
    const box = this.img.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    this.W = Math.round(box.width * dpr);
    this.H = Math.round(box.height * dpr);
    if (!this.W || !this.H) return;
    // The canvas covers the drawing only, not the caption under it.
    this.canvas.style.height = `${box.height}px`;
    for (const c of [this.canvas, this.off]) { c.width = this.W; c.height = this.H; }
    this.mask.width = Math.round(this.W / 2);
    this.mask.height = Math.round(this.H / 2);
    this.draw(this.started ? this.t : reduce ? Infinity : 0);
  }

  start() {
    if (this.started) return;
    this.started = true;
    if (reduce || freeze) { this.t = freeze && freeze !== 'son' ? Number(freeze) : Infinity; this.draw(this.t); return; }
    const t0 = performance.now();
    const tick = (now) => {
      this.t = now - t0;
      this.draw(this.t);
      if (this.t < this.end) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  draw(t) {
    const { ctx, mctx, octx, W, H } = this;
    if (!W) return;
    const mw = this.mask.width, mh = this.mask.height;
    ctx.clearRect(0, 0, W, H);

    // 1. Mask: the union of every blot, softened a touch so the edge is absorbed, not cut.
    mctx.clearRect(0, 0, mw, mh);
    mctx.fillStyle = '#fff';
    if ('filter' in mctx) mctx.filter = 'blur(1.2px)';
    for (const d of this.drops) {
      const p = clamp01((t - d.delay) / d.dur);
      if (p > 0 && blotPath(mctx, d, p, mw, mh, 0.97)) mctx.fill();
    }
    if ('filter' in mctx) mctx.filter = 'none';

    // 2. The drawing, kept only inside the blots.
    octx.globalCompositeOperation = 'source-over';
    octx.clearRect(0, 0, W, H);
    octx.drawImage(this.img, 0, 0, W, H);
    octx.globalCompositeOperation = 'destination-in';
    octx.drawImage(this.mask, 0, 0, W, H);
    ctx.drawImage(this.off, 0, 0);

    // 3. Wet ink: a navy wash that thins as it spreads, with pigment pooled at the edge.
    ctx.globalCompositeOperation = 'multiply';
    for (const d of this.drops) {
      const p = clamp01((t - d.delay) / d.dur);
      if (p <= 0 || p >= 1) continue;
      const wet = Math.pow(1 - p, 1.6);
      if (!blotPath(ctx, d, p, W, H)) continue;
      ctx.fillStyle = `rgba(${NAVY}, ${0.5 * wet})`;
      ctx.fill();
      ctx.lineWidth = Math.max(1.5, W / 700);
      ctx.strokeStyle = `rgba(${NAVY}, ${0.85 * wet})`;
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';

    // 4. The falling drop before the first impact.
    const first = this.drops[0];
    if (t < FALL) {
      const q = Math.max(0, t) / FALL;
      const cx = first.x * W, cy = first.y * H;
      const y = cy - (1 - q * q) * H * 0.42;
      const s = W / 260;
      ctx.fillStyle = `rgb(${NAVY})`;
      ctx.beginPath();
      ctx.ellipse(cx, y, s * 0.8, s * (1.1 + q * 0.9), 0, 0, 6.283);
      ctx.fill();
    }
  }
}

const figures = [...document.querySelectorAll('[data-murekkep]')];
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    io.unobserve(e.target);
    e.target._ink.ready.then(() => setTimeout(() => e.target._ink.start(), 250));
  }
}, { threshold: 0.12 });

for (const fig of figures) {
  const img = fig.querySelector('img');
  const ready = (img.complete ? Promise.resolve() : new Promise((r) => img.addEventListener('load', r, { once: true })))
    .then(() => img.decode?.().catch(() => {}));
  ready.then(() => {
    fig._ink = new InkDrop(fig);
    fig._ink.ready = Promise.resolve();
    fig._ink.resize();
    io.observe(fig);
  });
}
