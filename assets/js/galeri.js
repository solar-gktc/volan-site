// Galeri (taslak): the fold-out album and the viewing board.
// Without this script the page still works: the strip scrolls sideways on its own, the
// contents rows are plain anchors, and every plate is a plain link to its image.
(function () {
  'use strict';

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var scroller = document.querySelector('.rs-kaydir');
  var panels = Array.prototype.slice.call(document.querySelectorAll('.rs-levha'));
  var plates = Array.prototype.slice.call(document.querySelectorAll('.rs-levha__ac'));
  var pager = document.querySelector('.rs-sayac');
  var counter = document.querySelector('[data-sayac]');
  var groupLinks = Array.prototype.slice.call(document.querySelectorAll('[data-git]'));
  if (!scroller || !panels.length) return;

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function left(panel) { return panel.offsetLeft - panels[0].offsetLeft; }

  // ---------- The strip ----------

  var current = 0;

  function goTo(i, instant) {
    i = Math.max(0, Math.min(panels.length - 1, i));
    scroller.scrollTo({ left: left(panels[i]), behavior: instant || reduce ? 'auto' : 'smooth' });
  }

  // The panel in view is the last one whose left edge has reached the window's left edge.
  function read() {
    var x = scroller.scrollLeft + 24;
    var atEnd = scroller.scrollLeft >= scroller.scrollWidth - scroller.clientWidth - 2;
    var i = 0;
    for (var k = 0; k < panels.length; k++) { if (left(panels[k]) <= x) i = k; }
    current = i;
    var photo = Math.min(i, plates.length - 1);
    if (counter) counter.textContent = pad(photo + 1);
    var group = panels[i].getAttribute('data-grup');
    groupLinks.forEach(function (a) {
      if (a.getAttribute('data-git') === group) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
    if (pager) {
      pager.querySelector('[data-yon="-1"]').disabled = scroller.scrollLeft <= 2;
      pager.querySelector('[data-yon="1"]').disabled = atEnd;
    }
  }

  var ticking = false;
  scroller.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; read(); });
  }, { passive: true });
  window.addEventListener('resize', read);

  if (pager) {
    pager.hidden = false;
    pager.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-yon]');
      if (btn) goTo(current + Number(btn.getAttribute('data-yon')));
    });
  }

  // Arrow keys step plate by plate while the strip itself has focus.
  scroller.addEventListener('keydown', function (e) {
    if (e.target !== scroller) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(current + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(current - 1); }
    else if (e.key === 'Home') { e.preventDefault(); goTo(0); }
    else if (e.key === 'End') { e.preventDefault(); goTo(panels.length - 1); }
  });

  // A plate reached with Tab is brought fully into the window.
  scroller.addEventListener('focusin', function (e) {
    var panel = e.target.closest('.rs-levha');
    if (!panel || e.target === scroller) return;
    var l = left(panel);
    if (l < scroller.scrollLeft || l + panel.offsetWidth > scroller.scrollLeft + scroller.clientWidth) goTo(panels.indexOf(panel), true);
  });

  // The contents rows move the strip only; the page does not jump.
  groupLinks.forEach(function (a) {
    a.addEventListener('click', function (e) {
      var target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      goTo(panels.indexOf(target));
    });
  });

  read();

  // ---------- The viewing board ----------

  var board = document.querySelector('.rs-buyut');
  if (!board || typeof board.showModal !== 'function') return;

  var figure = board.querySelector('.rs-buyut__plaka');
  var img = figure.querySelector('img');
  var no = board.querySelector('#rs-buyut-no');
  var kind = board.querySelector('.rs-buyut__tur');
  var prev = board.querySelector('[data-yon="-1"]');
  var next = board.querySelector('[data-yon="1"]');
  var shown = 0;

  function show(i) {
    shown = Math.max(0, Math.min(plates.length - 1, i));
    var a = plates[shown];
    var w = a.getAttribute('data-w');
    var h = a.getAttribute('data-h');
    var panel = a.closest('.rs-levha');
    img.style.setProperty('--w', w);
    img.style.setProperty('--h', h);
    img.width = w;
    img.height = h;
    img.alt = a.querySelector('img').alt;
    img.src = a.getAttribute('href');
    no.textContent = 'Levha ' + pad(shown + 1) + ' / ' + pad(plates.length);
    kind.textContent = panel.querySelector('.rs-levha__tur').textContent;
    prev.disabled = shown === 0;
    next.disabled = shown === plates.length - 1;
    figure.classList.remove('is-degisti');
    void figure.offsetWidth;
    figure.classList.add('is-degisti');
  }

  var fromStrip = false;
  function open(i, opener) {
    fromStrip = !!(opener && opener.classList.contains('rs-levha__ac'));
    show(i);
    figure.classList.remove('is-degisti');
    board.showModal();
  }

  // Plates in the strip and rows in the list both open the board.
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-levha]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
    e.preventDefault();
    open(Number(a.getAttribute('data-levha')) - 1, a);
  });

  function step(d) {
    var to = shown + d;
    if (to < 0 || to >= plates.length) return;
    show(to);
    // If the arrow that was pressed has just been disabled, keep focus inside the board.
    if (document.activeElement && document.activeElement.disabled) (d > 0 ? prev : next).focus();
  }
  prev.addEventListener('click', function () { step(-1); });
  next.addEventListener('click', function () { step(1); });

  board.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    else if (e.key === 'Home') { e.preventDefault(); show(0); }
    else if (e.key === 'End') { e.preventDefault(); show(plates.length - 1); }
  });

  // A click on the navy backdrop closes the board (Esc and the close button are native).
  board.addEventListener('click', function (e) { if (e.target === board) board.close(); });

  // On closing, the strip is left at the plate that was last viewed.
  board.addEventListener('close', function () {
    goTo(shown, true);
    if (fromStrip) plates[shown].focus({ preventScroll: true });
  });
})();
