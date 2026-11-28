// Hakkımızda: the stamps, the then/now slider, the years.
// The ink-drop drawing is murekkep.js.
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const pressing = document.documentElement.classList.contains('press') && !reduceMotion;

/* ---------- Years since 1954 ---------- */

const years = String(new Date().getFullYear() - 1954);
for (const el of document.querySelectorAll('[data-years]')) el.textContent = years;
for (const el of document.querySelectorAll('[data-this-year]')) el.textContent = String(new Date().getFullYear());
for (const el of document.querySelectorAll('[data-years-boxes]')) {
  const unit = el.querySelector('.kutular__birim');
  el.replaceChildren(...[...years].map((d) => Object.assign(document.createElement('span'), { textContent: d })), unit);
}

/* ---------- Isotype marks: one stamped mark per person or lift ---------- */

for (const el of document.querySelectorAll('[data-isaret]')) {
  const n = Number(el.dataset.adet);
  el.innerHTML = Array.from({ length: n }, (_, i) => `<svg style="--i:${i}"><use href="#${el.dataset.isaret}"/></svg>`).join('');
}

/* ---------- Stamps, ticks and seals press in once, when they come into view ---------- */

const stampables = [...document.querySelectorAll('[data-stamp]')];
if (!pressing) {
  stampables.forEach((el) => el.classList.add('is-stamped'));
} else {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-stamped');
      io.unobserve(e.target);
    }
  }, { threshold: 0.4 });
  stampables.forEach((el) => io.observe(el));
}

/* ---------- Dün / Bugün: a range input moves the split ---------- */

for (const el of document.querySelectorAll('[data-karsilastir]')) {
  const input = el.querySelector('input[type="range"]');
  const apply = () => el.style.setProperty('--ayrim', `${input.value}%`);
  input.addEventListener('input', apply);
  apply();
}
