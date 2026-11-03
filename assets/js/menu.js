// The shared top menu: index tabs whose groups open contents cards, and below 1240px a
// contents page behind the Menü tab. It hides while the reader scrolls down and comes
// back on the way up; --menu-offset tells sticky parts of the page where it ends.

const menu = document.querySelector('[data-menu]');

if (menu) {
  const root = document.documentElement;
  const toggle = menu.querySelector('.menu__toggle');
  const toggleLabel = menu.querySelector('.menu__toggle-label');
  const groups = [...menu.querySelectorAll('.menu__item--group')];
  const narrow = matchMedia('(max-width: 1239px)');

  /* ---------- The coming-soon page: the menu's own link names the page asked for ---------- */

  const here = [...menu.querySelectorAll('a[href]')].find((a) => a.href === location.href);
  if (here && !menu.querySelector('[aria-current="page"]')) {
    here.setAttribute('aria-current', 'page');
    here.closest('.menu__item--group')?.classList.add('is-current');
  }
  const soonTitle = document.querySelector('[data-yakinda-title]');
  if (soonTitle && here) {
    const name = (here.querySelector('.menu__label') ?? here).textContent.trim();
    soonTitle.textContent = name;
    document.title = `${name} · Yakında · Volan Otomotiv`;
  }

  /* ---------- Group cards ---------- */

  function setGroup(group, open) {
    group.classList.toggle('is-expanded', open);
    group.querySelector('.menu__tab').setAttribute('aria-expanded', String(open));
  }
  function closeGroups(except) {
    for (const g of groups) if (g !== except) setGroup(g, false);
  }
  for (const g of groups) {
    g.querySelector('.menu__tab').addEventListener('click', () => {
      const open = !g.classList.contains('is-expanded');
      if (!narrow.matches) closeGroups(g);
      setGroup(g, open);
    });
  }
  document.addEventListener('click', (e) => {
    if (!narrow.matches && !menu.contains(e.target)) closeGroups();
  });
  menu.addEventListener('focusout', (e) => {
    if (!narrow.matches && !menu.contains(e.relatedTarget)) closeGroups();
  });

  /* ---------- The contents page on narrow screens ---------- */

  function setPanel(open) {
    menu.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggleLabel.textContent = open ? 'Kapat' : 'Menü';
    root.classList.toggle('menu-open', open);
    if (open) for (const g of groups) setGroup(g, g.classList.contains('is-current'));
  }
  toggle.addEventListener('click', () => setPanel(!menu.classList.contains('is-open')));
  // A link to a section of this page closes the contents page on the way.
  menu.addEventListener('click', (e) => {
    if (e.target.closest('a') && menu.classList.contains('is-open')) setPanel(false);
  });
  narrow.addEventListener('change', () => {
    setPanel(false);
    closeGroups();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (menu.classList.contains('is-open')) {
      setPanel(false);
      toggle.focus();
      return;
    }
    const open = groups.find((g) => g.classList.contains('is-expanded'));
    if (open) {
      setGroup(open, false);
      open.querySelector('.menu__tab').focus();
    }
  });

  /* ---------- Hide on the way down, back on the way up ---------- */

  let lastY = scrollY;
  const offset = () => root.style.setProperty('--menu-offset', menu.classList.contains('is-hidden') ? '0px' : `${menu.offsetHeight}px`);
  addEventListener('scroll', () => {
    const y = scrollY;
    const busy = menu.classList.contains('is-open') || groups.some((g) => g.classList.contains('is-expanded'));
    if (!busy) {
      if (y > lastY + 6 && y > menu.offsetHeight) menu.classList.add('is-hidden');
      else if (y < lastY - 6 || y <= menu.offsetHeight) menu.classList.remove('is-hidden');
    }
    lastY = y;
    offset();
  }, { passive: true });
  menu.addEventListener('focusin', () => {
    menu.classList.remove('is-hidden');
    offset();
  });
  offset();
  menu.classList.add('is-ready');
}

// The quick-contact seal at the bottom right: it opens WhatsApp, Ara and Yol tarifi.
// Without this script the three buttons simply stay open.

const fab = document.querySelector('[data-fab]');

if (fab) {
  const toggle = fab.querySelector('.fab__toggle');
  const setFab = (open) => {
    fab.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };
  toggle.addEventListener('click', () => setFab(!fab.classList.contains('is-open')));
  document.addEventListener('click', (e) => {
    if (!fab.contains(e.target)) setFab(false);
  });
  fab.addEventListener('focusout', (e) => {
    if (e.relatedTarget && !fab.contains(e.relatedTarget)) setFab(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && fab.classList.contains('is-open')) {
      setFab(false);
      toggle.focus();
    }
  });
  fab.classList.add('is-ready');
}
