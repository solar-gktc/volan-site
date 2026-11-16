// Kalite Politikamız (taslak): presses the stamps. The six stamps on the record sheet land
// one after another on arrival; each ledger row's stamp and each tick lands when its row is
// reached. This file both lifts the stamps (html.press) and presses them, so if it does not
// load, or with reduced motion, every stamp is already applied.

const root = document.documentElement;
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!still && 'IntersectionObserver' in window) {
  const targets = document.querySelectorAll('.page-kalite main [data-kayit], .page-kalite main [data-stamp]');
  const seen = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-stamped');
      seen.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -18% 0px', threshold: 0.2 });

  root.classList.add('press');
  for (const target of targets) seen.observe(target);
}
