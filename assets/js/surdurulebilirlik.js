/* Sürdürülebilirlik (draft): hold the status card's tick and stamp until the stamp box is
   in view, then let them press in once. Without this script they press in on arrival. */
(function () {
  var card = document.querySelector('.sr-durum');
  var box = card && card.querySelector('.stamp-box');
  if (!box || !('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  card.classList.add('is-waiting');
  var seen = new IntersectionObserver(function (entries) {
    if (!entries[0].isIntersecting) return;
    card.classList.remove('is-waiting');
    seen.disconnect();
  }, { threshold: 0.75 });
  seen.observe(box);
})();
