// Yorumlar (homepage v2): a deck of Google reviews as postcards on the navy board.
// One large card in front, the next two smaller behind it; previous/next (buttons, arrow
// keys, a swipe on phones, or a click on a card behind) walk through the rest of the deck.

// ---------------------------------------------------------------------------------------
// REPLACE WITH REAL DATA. Everything below is sample ("örnek") content: no real reviews
// with permission exist yet. One object per review; `car` and `brand` may be left out.
//   name:   first name + initial of the surname, as Google shows it (e.g. "Ayşe K.")
//   rating: 1–5, date: as shown on the card, text: the review text (long text is cut
//   to six lines on the card), car: "Model · işlem", brand: volvo | vw | mercedes
//   (chooses the drawing on the postage stamp), sample: true shows "örnek" on the card.
const SUMMARY = { rating: 4.8, count: 127, url: '#', sample: true };
const REVIEWS = [
  { name: 'M. K.', rating: 5, date: 'Ekim 2026', car: 'Volvo XC60 · periyodik bakım', brand: 'volvo', sample: true,
    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante venenatis.' },
  { name: 'S. A.', rating: 5, date: 'Ekim 2026', car: 'Mercedes-Benz C 200 · arıza tespiti', brand: 'mercedes', sample: true,
    text: 'Donec ullamcorper nulla non metus auctor fringilla. Vestibulum id ligula porta felis euismod semper.' },
  { name: 'E. T.', rating: 4, date: 'Eylül 2026', car: 'Volkswagen Golf · kaporta ve boya', brand: 'vw', sample: true,
    text: 'Cras mattis consectetur purus sit amet fermentum. Aenean lacinia bibendum nulla sed consectetur.' },
  { name: 'A. Y.', rating: 5, date: 'Eylül 2026', car: 'Volvo XC90 · fren bakımı', brand: 'volvo', sample: true,
    text: 'Maecenas faucibus mollis interdum. Nullam quis risus eget urna mollis ornare vel eu leo. Curabitur blandit tempus porttitor, integer posuere erat a ante venenatis dapibus posuere velit aliquet. Donec id elit non mi porta gravida at eget metus.' },
  { name: 'B. D.', rating: 5, date: 'Ağustos 2026', sample: true,
    text: 'Etiam porta sem malesuada magna mollis euismod.' },
  { name: 'H. Ö.', rating: 4, date: 'Ağustos 2026', car: 'Volkswagen Passat · elektronik onarım', brand: 'vw', sample: true,
    text: 'Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Duis mollis, est non commodo luctus.' },
  { name: 'C. E.', rating: 5, date: 'Temmuz 2026', car: 'Volvo V60 · triger seti', brand: 'volvo', sample: true,
    text: 'Nulla vitae elit libero, a pharetra augue. Morbi leo risus, porta ac consectetur ac, vestibulum at eros.' },
  { name: 'F. Ş.', rating: 3, date: 'Temmuz 2026', car: 'Mercedes-Benz E 220 · bakım', brand: 'mercedes', sample: true,
    text: 'Aenean eu leo quam. Pellentesque ornare sem lacinia quam venenatis vestibulum.' },
  { name: 'K. G.', rating: 5, date: 'Haziran 2026', car: 'Volvo S90 · kasko onarımı', brand: 'volvo', sample: true,
    text: 'Sed posuere consectetur est at lobortis. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus.' },
];
// ---------------------------------------------------------------------------------------

const STAMPS = { volvo: 'yorumlar-pul-volvo', vw: 'yorumlar-pul-vw' };
const GENERIC = ['yorumlar-pul-usta', 'yorumlar-pul-cila', 'yorumlar-pul-triger'];
const STAR = '<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.4l-5.9 3.2 1.3-6.6L2.5 9.4l6.6-.8z"/></svg>';
const CANCEL = '<svg class="pc__cancel" viewBox="0 0 90 48" aria-hidden="true"><path d="M0 10c15-6 30 6 45 0s30 6 45 0M0 24c15-6 30 6 45 0s30 6 45 0M0 38c15-6 30 6 45 0s30 6 45 0"/></svg>';
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const num = (n) => String(n).replace('.', ',');
const stars = (r, cls = '') => `<span class="stars ${cls}" style="--r: ${r}" role="img" aria-label="5 üzerinden ${num(r)} yıldız"><span class="stars__base">${STAR.repeat(5)}</span><span class="stars__fill">${STAR.repeat(5)}</span></span>`;

function card(r, i, total) {
  const stamp = STAMPS[r.brand] || GENERIC[i % GENERIC.length];
  return `<article class="pc" data-i="${i}" aria-label="Yorum ${i + 1} / ${total}">
    <div class="pc__msg">
      ${stars(r.rating)}
      <p class="pc__quote">${esc(r.text)}</p>
      <p class="pc__from">— ${esc(r.name)}${r.date ? ` · ${esc(r.date)}` : ''}</p>
      ${r.car ? `<p class="pc__car"><b>Araç ve işlem</b><span>${esc(r.car)}</span></p>` : ''}
      <p class="pc__src">Google yorumu${r.sample ? ' · örnek' : ''}</p>
    </div>
    <div class="pc__addr">
      <div class="pc__stamp"><img src="assets/img/anasayfa/${stamp}.webp" alt="" width="240" height="300" loading="lazy"><small><span>Volan</span><span>1954</span></small></div>
      ${CANCEL}
      <svg class="seal" aria-hidden="true"><use href="#seal"/></svg>
      <ul class="pc__lines"><li>Volan Otomotiv</li><li>Bahçekapı Mah. 2547. Sk. No:3</li><li>Etimesgut / Ankara</li></ul>
    </div>
  </article>`;
}

const root = document.querySelector('.s-yorumlar');
if (root && REVIEWS.length) {
  // Summary on the board
  const tally = root.querySelector('[data-tally]');
  if (tally) {
    root.querySelector('[data-tally-score]').textContent = num(SUMMARY.rating);
    root.querySelector('[data-tally-stars]').outerHTML = stars(SUMMARY.rating, 'stars--gold');
    root.querySelector('[data-tally-count]').textContent = SUMMARY.count.toLocaleString('tr-TR');
    tally.querySelector('.tally__count').lastChild.textContent = SUMMARY.sample ? ' yorum · örnek değerler' : ' yorum';
  }
  const link = root.querySelector('[data-google-link]');
  if (link && SUMMARY.url) link.href = SUMMARY.url;

  // The deck
  const holder = root.querySelector('[data-cards]');
  const nav = root.querySelector('[data-nav]');
  const N = REVIEWS.length;
  holder.innerHTML = REVIEWS.map((r, i) => card(r, i, N)).join('');
  const cards = [...holder.querySelectorAll('.pc')];
  let front = 0;

  const slotOf = (p) => (p === 0 ? 'big' : p === 1 ? 'a' : p === 2 ? 'b' : p === N - 1 && N > 3 ? 'out' : 'deck');
  const place = () => {
    cards.forEach((c, i) => {
      const p = (i - front + N) % N;
      const slot = slotOf(p);
      c.dataset.slot = slot;
      c.setAttribute('aria-hidden', String(slot !== 'big'));
      c.inert = slot === 'deck' || slot === 'out';
    });
    root.querySelector('[data-count]').textContent = String(front + 1);
  };
  const step = (d) => { front = (front + d + N) % N; place(); };

  root.querySelector('[data-total]').textContent = String(N);
  if (N > 1) {
    nav.hidden = false;
    root.querySelector('[data-prev]').addEventListener('click', () => step(-1));
    root.querySelector('[data-next]').addEventListener('click', () => step(1));
    // A card behind the front one comes forward when clicked.
    holder.addEventListener('click', (e) => {
      const c = e.target.closest('.pc');
      if (!c) return;
      if (c.dataset.slot === 'a') step(1);
      else if (c.dataset.slot === 'b') step(2);
    });
    root.querySelector('[data-deck]').addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    });
    // Swipe on touch screens; vertical scrolling stays with the page (touch-action: pan-y).
    let x0 = null;
    holder.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') x0 = e.clientX; });
    holder.addEventListener('pointerup', (e) => {
      if (x0 === null) return;
      const dx = e.clientX - x0;
      x0 = null;
      if (Math.abs(dx) > 48) step(dx < 0 ? 1 : -1);
    });
    holder.addEventListener('pointercancel', () => { x0 = null; });
  }
  place();
  root.classList.add('is-deck');
}
