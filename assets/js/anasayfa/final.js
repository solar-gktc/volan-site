// Final: the foil seal presses into the navy back cover when the cover comes into view, lifts
// off when it leaves (scrolling back up), and presses in again on the next pass.
const sec = document.querySelector('.s-final');
const back = sec && sec.querySelector('[data-back]');

if (back) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    back.classList.add('is-stamped');
  } else {
    let timer = 0;
    new IntersectionObserver(([e]) => {
      clearTimeout(timer);
      if (e.isIntersecting) timer = setTimeout(() => back.classList.add('is-stamped'), 200);
      else back.classList.remove('is-stamped');
    }, { threshold: 0.3 }).observe(back);
  }
}
