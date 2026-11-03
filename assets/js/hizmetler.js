// Hizmetlerimiz: the coupon row scrolls by buttons, and a coupon opens its service in the
// sheet (a modal dialog). The full service articles stay in the page for no-script
// visitors and search; the sheet shows a copy of one at a time.
// ---------- The facade: the pencil drawing develops into the photo, then the doors are stamped ----------
// The photo washes in like a print in the developer tray: from the VOLAN sign outward, darkest
// tones first, with a ragged noise edge. If the script is late or images fail, the CSS fallback
// in hizmetler.css fades the drawing and stamps the doors on its own.
(() => {
  const facade = document.querySelector('[data-facade]');
  if (!facade || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const drawing = facade.querySelector('.facade__drawing');
  const photo = facade.querySelector('.facade__photo');
  const sky = facade.querySelector('.facade__sky');

  function startSky() {
    if (!sky) return;
    sky.querySelectorAll('source[data-src]').forEach((s) => { s.src = s.dataset.src; });
    sky.addEventListener('playing', () => sky.classList.add('is-playing'), { once: true });
    sky.load();
    sky.play().catch(() => {}); // autoplay refused: the still photo stays
  }

  const loaded = (img) => (img.complete && img.naturalWidth
    ? Promise.resolve()
    : new Promise((res, rej) => {
      img.addEventListener('load', res, { once: true });
      img.addEventListener('error', rej, { once: true });
    }));

  // Smooth random noise at the canvas size, 0..1, contrast stretched (blur flattens it).
  function noiseField(w, h, cellsAcross, blur) {
    const gw = cellsAcross;
    const gh = Math.max(2, Math.round((gw * h) / w));
    const grid = document.createElement('canvas');
    grid.width = gw;
    grid.height = gh;
    const g = grid.getContext('2d');
    const cells = g.createImageData(gw, gh);
    for (let i = 0; i < gw * gh; i++) {
      const v = Math.random() * 255;
      cells.data.set([v, v, v, 255], i * 4);
    }
    g.putImageData(cells, 0, 0);
    const big = document.createElement('canvas');
    big.width = w;
    big.height = h;
    const b = big.getContext('2d', { willReadFrequently: true });
    b.imageSmoothingQuality = 'high';
    b.filter = `blur(${blur}px)`;
    b.drawImage(grid, 0, 0, w, h);
    const data = b.getImageData(0, 0, w, h).data;
    const out = new Float32Array(w * h);
    let lo = 255;
    let hi = 0;
    for (let i = 0; i < out.length; i++) {
      const v = data[i * 4];
      out[i] = v;
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
    const span = hi - lo || 1;
    for (let i = 0; i < out.length; i++) out[i] = (out[i] - lo) / span;
    return out;
  }

  // Reveal order per pixel, 0 = first: distance from the sign, two noise scales and the
  // drawing's darkness. Rank-equalized, so the revealed area grows evenly with the edge.
  function washOrder(w, h, px) {
    const coarse = noiseField(w, h, 14, 10);
    const fine = noiseField(w, h, 90, 2);
    const fx = 0.64 * w;
    const fy = 0.36 * h;
    const far = Math.hypot(Math.max(fx, w - fx), Math.max(fy, h - fy));
    const raw = new Float32Array(w * h);
    for (let y = 0, i = 0; y < h; y++) {
      for (let x = 0; x < w; x++, i++) {
        const j = i * 4;
        const lum = (px[j] * 0.3 + px[j + 1] * 0.59 + px[j + 2] * 0.11) / 255;
        raw[i] = 0.5 * (Math.hypot(x - fx, y - fy) / far) + 0.3 * coarse[i] + 0.1 * fine[i] + 0.1 * lum;
      }
    }
    const BINS = 1024;
    const hist = new Uint32Array(BINS);
    for (let i = 0; i < raw.length; i++) hist[Math.min(BINS - 1, Math.floor(raw[i] * BINS))]++;
    const rank = new Float32Array(BINS);
    for (let k = 0, sum = 0; k < BINS; k++) { sum += hist[k]; rank[k] = sum / raw.length; }
    for (let i = 0; i < raw.length; i++) raw[i] = rank[Math.min(BINS - 1, Math.floor(raw[i] * BINS))];
    return raw;
  }

  function wash() {
    const box = facade.getBoundingClientRect();
    const k = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.round(box.width * k);
    const h = Math.round(box.height * k);
    const canvas = document.createElement('canvas');
    canvas.className = 'facade__wash';
    canvas.width = w;
    canvas.height = h;
    canvas.setAttribute('aria-hidden', 'true');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    // Same crop as the CSS (object-fit: cover, top): the full width, the top rows.
    const sw = drawing.naturalWidth;
    ctx.drawImage(drawing, 0, 0, sw, (sw * h) / w, 0, 0, w, h);
    const frame = ctx.getImageData(0, 0, w, h);
    const px = frame.data;
    const order = washOrder(w, h, px);
    drawing.after(canvas);
    facade.classList.add('is-live'); // the canvas now shows the drawing; the img is hidden

    const DURATION = 2300;
    const SOFT = 0.16;
    let start = 0;
    function step(now) {
      if (!start) start = now;
      const p = Math.min(1, (now - start) / DURATION);
      // The order is equalized, so this curve is the revealed share of the picture.
      const eased = (1 - Math.cos(Math.PI * p)) / 2;
      const edge = -SOFT + eased * (1 + SOFT);
      const scale = 255 / SOFT;
      for (let i = 0, j = 3; i < order.length; i++, j += 4) px[j] = (order[i] - edge) * scale;
      ctx.putImageData(frame, 0, 0);
      if (p < 1) {
        requestAnimationFrame(step);
      } else {
        canvas.remove();
        facade.classList.add('is-marked');
      }
    }
    requestAnimationFrame(step);
  }

  Promise.all([loaded(drawing), loaded(photo)])
    .then(() => drawing.decode?.())
    .then(() => {
      // Too late to take over smoothly: leave it to the CSS fallback.
      if (performance.now() > 2600) { startSky(); return; }
      setTimeout(() => { wash(); startSky(); }, 450);
    })
    .catch(startSky);
})();

(() => {
  // ---------- Coupon row ----------
  const carousel = document.querySelector('[data-carousel]');
  const track = carousel && carousel.querySelector('.track');
  if (track) {
    const items = [...track.children];
    const count = carousel.querySelector('[data-count]');
    const prev = carousel.querySelector('[data-step="-1"]');
    const next = carousel.querySelector('[data-step="1"]');

    const stepWidth = () => {
      const a = items[0].getBoundingClientRect();
      const b = items[1] ? items[1].getBoundingClientRect() : a;
      return b.left - a.left || a.width;
    };

    function update() {
      const w = stepWidth();
      const first = Math.round(track.scrollLeft / w);
      const visible = Math.max(1, Math.floor((track.clientWidth - parseFloat(getComputedStyle(track).paddingLeft)) / w));
      const last = Math.min(items.length, first + visible);
      count.textContent = last > first + 1 ? `${first + 1}–${last}` : `${first + 1}`;
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
    }

    let frame = 0;
    track.addEventListener('scroll', () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    }, { passive: true });
    window.addEventListener('resize', update);
    [prev, next].forEach((btn) => btn.addEventListener('click', () => {
      const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;
      track.scrollBy({ left: Number(btn.dataset.step) * stepWidth(), behavior: smooth ? 'smooth' : 'auto' });
    }));
    update();
  }

  // ---------- The sheet ----------
  const sheet = document.querySelector('.sheet');
  const articles = [...document.querySelectorAll('.details .svc')];
  if (!sheet || !articles.length || typeof sheet.showModal !== 'function') {
    document.documentElement.classList.add('no-sheet'); // fall back to the printed list
    return;
  }

  const body = sheet.querySelector('[data-sheet-body]');
  const counter = sheet.querySelector('[data-sheet-count]');
  const prevBtn = sheet.querySelector('[data-sheet-step="-1"]');
  const nextBtn = sheet.querySelector('[data-sheet-step="1"]');
  const prevName = sheet.querySelector('[data-sheet-prev]');
  const nextName = sheet.querySelector('[data-sheet-next]');
  const names = articles.map((a) => a.querySelector('.svc__title').textContent);
  const shortNames = articles.map((a) => {
    const card = document.querySelector(`.coupon[data-open="${a.id}"] .coupon__name`);
    return card ? card.textContent : names[articles.indexOf(a)];
  });
  let current = -1;
  let opener = null;

  function show(i, dir = 1) {
    const n = articles.length;
    current = (i + n) % n;
    const copy = articles[current].cloneNode(true);
    // The copy must not repeat the ids of the printed article.
    copy.removeAttribute('id');
    copy.querySelectorAll('[id]').forEach((el) => { el.id = `sheet-${el.id}`; });
    copy.setAttribute('aria-labelledby', `sheet-${articles[current].id}-baslik`);
    copy.querySelectorAll('img').forEach((img) => { img.loading = 'eager'; });
    copy.style.setProperty('--dir', dir);
    body.replaceChildren(copy);
    body.scrollTop = 0;
    sheet.setAttribute('aria-labelledby', `sheet-${articles[current].id}-baslik`);
    counter.textContent = `${current + 1} / ${n}`;
    const p = (current - 1 + n) % n;
    const q = (current + 1) % n;
    prevName.textContent = shortNames[p];
    nextName.textContent = shortNames[q];
    prevBtn.setAttribute('aria-label', `Önceki hizmet: ${names[p]}`);
    nextBtn.setAttribute('aria-label', `Sonraki hizmet: ${names[q]}`);
    history.replaceState(null, '', `#${articles[current].id}`);
  }

  function open(id, from) {
    const i = articles.findIndex((a) => a.id === id);
    if (i < 0) return;
    opener = from || null;
    show(i);
    if (!sheet.open) sheet.showModal();
    sheet.querySelector('[data-sheet-close]').focus();
  }

  document.querySelectorAll('.coupon[data-open]').forEach((card) => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      open(card.dataset.open, card);
    });
  });

  prevBtn.addEventListener('click', () => show(current - 1, -1));
  nextBtn.addEventListener('click', () => show(current + 1, 1));
  sheet.querySelector('[data-sheet-close]').addEventListener('click', () => sheet.close());

  // A click on the dimmed page around the sheet closes it.
  sheet.addEventListener('click', (e) => {
    if (e.target === sheet) sheet.close();
  });

  sheet.addEventListener('keydown', (e) => {
    if (e.target.closest('a, input, textarea')) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(current - 1, -1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); show(current + 1, 1); }
  });

  sheet.addEventListener('close', () => {
    history.replaceState(null, '', location.pathname + location.search);
    // Return focus to the coupon of the service the visitor ended on.
    const card = document.querySelector(`.coupon[data-open="${articles[current].id}"]`) || opener;
    if (card) {
      card.closest('.track__item')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      card.focus({ preventScroll: true });
    }
  });

  // A link to hizmetlerimiz.html#kaporta opens that service.
  const fromHash = () => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (articles.some((a) => a.id === id)) open(id);
  };
  fromHash();
  window.addEventListener('hashchange', fromHash);
})();

// ---------- The dealer block's seal presses in when it comes into view ----------
(() => {
  const dealer = document.querySelector('.close__dealer');
  if (!dealer) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    dealer.classList.add('is-stamped');
    return;
  }
  const seal = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    dealer.classList.add('is-stamped');
    seal.disconnect();
  }, { rootMargin: '0px 0px -20% 0px' });
  seal.observe(dealer);
})();
