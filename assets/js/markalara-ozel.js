// Markalara Özel Hizmet Prensibimiz (draft): the key tags are tabs.
// Choosing a tag opens that brand's record; arrow keys, Home and End move between tags.
(function () {
  var ray = document.querySelector('[data-markalar]');
  if (!ray) return;
  var etiketler = Array.prototype.slice.call(ray.querySelectorAll('.mo-etiket'));
  var kayitlar = Array.prototype.slice.call(document.querySelectorAll('[data-kayit]'));
  var sakin = window.matchMedia('(prefers-reduced-motion: reduce)');
  var dar = window.matchMedia('(max-width: 899px)');

  function kayit(marka) {
    return kayitlar.filter(function (k) { return k.dataset.kayit === marka; })[0];
  }

  ray.setAttribute('role', 'tablist');
  etiketler.forEach(function (e) {
    var k = kayit(e.dataset.marka);
    e.setAttribute('role', 'tab');
    e.setAttribute('aria-controls', k.id);
    k.setAttribute('role', 'tabpanel');
    k.setAttribute('tabindex', '-1');
    k.setAttribute('aria-labelledby', e.id);
  });

  function sec(marka, kullanici) {
    etiketler.forEach(function (e) {
      var acik = e.dataset.marka === marka;
      var once = e.classList.contains('is-secili');
      e.classList.toggle('is-secili', acik);
      e.setAttribute('aria-selected', acik ? 'true' : 'false');
      e.tabIndex = acik ? 0 : -1;
      e.querySelector('.mo-etiket__sec-yazi').textContent = acik ? 'Kayıt açık' : 'Kaydı aç';
      e.classList.remove('is-sallanan');
      if (acik && !once && kullanici && !sakin.matches) {
        void e.offsetWidth; // restart the swing
        e.classList.add('is-sallanan');
      }
    });
    kayitlar.forEach(function (k) {
      k.classList.toggle('is-acik', k.dataset.kayit === marka);
    });
    if (!kullanici) return;
    var k = kayit(marka);
    if (history.replaceState) history.replaceState(null, '', '#' + k.id);
    // Narrow layout only: the record opens below the stacked tags, so bring its heading into view.
    // On the wide layout the board stays put, so the tags and the swing remain on screen.
    var ust = k.getBoundingClientRect().top;
    if (dar.matches && ust > window.innerHeight * 0.72) {
      window.scrollTo({ top: window.scrollY + ust - 88, behavior: sakin.matches ? 'auto' : 'smooth' });
    }
  }

  etiketler.forEach(function (e, i) {
    e.addEventListener('click', function (olay) {
      olay.preventDefault();
      sec(e.dataset.marka, true);
    });
    e.addEventListener('animationend', function () { e.classList.remove('is-sallanan'); });
    e.addEventListener('keydown', function (olay) {
      var hedef = null;
      if (olay.key === 'ArrowRight' || olay.key === 'ArrowDown') hedef = etiketler[(i + 1) % etiketler.length];
      else if (olay.key === 'ArrowLeft' || olay.key === 'ArrowUp') hedef = etiketler[(i - 1 + etiketler.length) % etiketler.length];
      else if (olay.key === 'Home') hedef = etiketler[0];
      else if (olay.key === 'End') hedef = etiketler[etiketler.length - 1];
      else if (olay.key === ' ') hedef = e;
      if (!hedef) return;
      olay.preventDefault();
      hedef.focus();
      sec(hedef.dataset.marka, true);
    });
  });

  // A link such as markalara-ozel.html#kayit-mercedes opens that record and scrolls to it
  // (the record is hidden until this script runs, so the browser's own jump finds nothing).
  function adresten() {
    var k = kayitlar.filter(function (x) { return '#' + x.id === location.hash; })[0];
    sec(k ? k.dataset.kayit : (ray.querySelector('.is-secili') || etiketler[0]).dataset.marka, false);
    if (k) k.scrollIntoView({ block: 'start' });
  }
  adresten();
  window.addEventListener('hashchange', adresten);
})();
