// Entries the reader works with: the service index, the brand picker and the warning-lamp panel.
// Every note is laid out at once and stacked in one cell, so picking another one never
// changes the page height (the stage script would have to rebuild the road).
import { LEVELS, LAMPS } from './lamps.js';

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text != null) e.textContent = text;
  return e;
}

/* ---------- Hizmetlerimiz: the list picks the photo and the note on the service card ---------- */

function services() {
  const list = document.querySelector('[data-services]');
  if (!list) return;
  const photo = document.querySelector('[data-service-photo]');
  const notes = [...document.querySelectorAll('[data-service-note]')];
  const buttons = [...list.querySelectorAll('button')];

  list.addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (!button) return;
    const note = notes.find((n) => n.dataset.serviceNote === button.dataset.service);
    for (const b of buttons) b.setAttribute('aria-pressed', String(b === button));
    for (const n of notes) n.classList.toggle('is-current', n === note);
    // Swap the photo once it is decoded, unless another service was picked meanwhile.
    const next = new Image();
    next.src = note.dataset.img;
    next.decode().catch(() => {}).then(() => {
      if (!note.classList.contains('is-current')) return;
      photo.src = note.dataset.img;
      photo.alt = note.dataset.alt;
    });
  });

  // Fetch the other photos while the list is still a screen away.
  new IntersectionObserver((seen, observer) => {
    if (!seen.some((s) => s.isIntersecting)) return;
    observer.disconnect();
    for (const n of notes) new Image().src = n.dataset.img;
  }, { rootMargin: '100% 0px' }).observe(list);
}

/* ---------- Marka uzmanlığı: the brand picks the note and the plate (the stage swaps the car) ---------- */

function brands() {
  const form = document.querySelector('[data-brands]');
  if (!form) return;
  const shown = [...document.querySelectorAll('[data-brand-note], [data-brand-photo]')];
  form.addEventListener('change', (e) => {
    for (const el of shown) el.classList.toggle('is-current', (el.dataset.brandNote ?? el.dataset.brandPhoto) === e.target.value);
  });
}

/* ---------- Uyarı lambaları: dashboard buttons, one note per lamp ---------- */

function list(tag, items) {
  const l = el(tag);
  for (const item of items) l.append(el('li', null, item));
  return l;
}

function level(name) {
  return el('span', `level level--${name}`, LEVELS[name].metin);
}

function lampNote(lamp) {
  const note = el('article', 'lamp-note');
  note.id = `lamba-${lamp.id}`;
  const title = el('h3', null, lamp.uzun || lamp.ad);
  title.id = `${note.id}-ad`;
  note.setAttribute('aria-labelledby', title.id);

  const head = el('div', 'lamp-note__head');
  const icon = el('span', 'lamp-note__icon');
  icon.dataset.level = lamp.seviye;
  icon.innerHTML = lamp.svg;
  const name = el('div');
  const tag = el('p', 'lamp-note__level');
  tag.append(level(lamp.seviye));
  name.append(title, tag);
  head.append(icon, name);
  note.append(head);
  if (lamp.renk) note.append(el('p', 'lamp-note__colour', `Panelde genellikle ${lamp.renk.toLocaleLowerCase('tr')} yanar.`));

  if (lamp.yanip) {
    const label = el('h4', null, 'Yanıp sönüyorsa ');
    label.append(level(lamp.yanip.seviye));
    note.append(label, el('p', null, lamp.yanip.metin));
  }

  const blocks = [['Ne yapmalısınız?', list('ol', lamp.simdi)], ['Ne anlama gelir?', el('p', null, lamp.anlam)]];
  if (lamp.seviye !== 'dur') blocks.reverse();   // red lamps: the safety steps come first
  if (lamp.nedenler?.length) blocks.push(['Olası nedenler', list('ul', lamp.nedenler)]);
  for (const [heading, body] of blocks) note.append(el('h4', null, heading), body);

  const act = el('p', 'stamps stamps--ink');
  const wa = el('a', 'stamp-btn stamp-btn--primary', 'WhatsApp’tan yazın');
  const text = `Merhaba, aracımın panelinde "${lamp.uzun || lamp.ad}" lambası yanıyor.\nMarka / model / yıl: `;
  wa.href = `https://wa.me/905337653378?text=${encodeURIComponent(text)}`;
  act.append(wa);
  note.append(act);
  return note;
}

function lamps() {
  const dash = document.querySelector('[data-lamps]');
  const stack = document.querySelector('[data-lamp-notes]');
  if (!dash || !stack) return;
  const live = el('p', 'visually-hidden');
  live.setAttribute('aria-live', 'polite');
  stack.after(live);

  const buttons = [];
  const notes = new Map();
  for (const name of Object.keys(LEVELS)) {
    const group = el('div', 'dash__group');
    const label = el('p', 'dash__label');
    label.id = `lamba-grup-${name}`;
    label.append(el('span', `dash__mark dash__mark--${name}`), LEVELS[name].metin);
    group.setAttribute('role', 'group');
    group.setAttribute('aria-labelledby', label.id);
    const row = el('ul', 'dash__lamps');
    for (const lamp of LAMPS.filter((l) => l.seviye === name)) {
      const note = lampNote(lamp);
      notes.set(lamp.id, note);
      stack.append(note);
      const button = el('button', 'lamp');
      button.type = 'button';
      button.dataset.lamp = lamp.id;
      button.dataset.level = lamp.seviye;
      button.setAttribute('aria-pressed', 'false');
      button.setAttribute('aria-controls', note.id);
      button.tabIndex = -1;
      const icon = el('span', 'lamp__icon');
      icon.innerHTML = lamp.svg;
      button.append(icon, el('span', 'lamp__name', lamp.ad));
      const item = el('li');
      item.append(button);
      row.append(item);
      buttons.push(button);
    }
    group.append(label, row);
    dash.append(group);
  }

  function pick(button, quiet) {
    for (const b of buttons) {
      b.setAttribute('aria-pressed', String(b === button));
      b.tabIndex = b === button ? 0 : -1;
    }
    for (const [id, note] of notes) note.classList.toggle('is-current', id === button.dataset.lamp);
    if (quiet) return;
    const lamp = LAMPS.find((l) => l.id === button.dataset.lamp);
    live.textContent = '';
    setTimeout(() => { live.textContent = `${lamp.uzun || lamp.ad}. ${LEVELS[lamp.seviye].metin}.`; }, 60);
    // On a phone the note is below the dashboard: bring it up if it is out of sight.
    const top = stack.getBoundingClientRect().top;
    if (top > innerHeight * 0.75) scrollTo({ top: top + scrollY - innerHeight * 0.3, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
  }

  dash.addEventListener('click', (e) => {
    const button = e.target.closest('.lamp');
    if (button) pick(button);
  });
  // Arrow keys move between lamps; Tab leaves the dashboard.
  dash.addEventListener('keydown', (e) => {
    const i = buttons.indexOf(document.activeElement);
    if (i < 0) return;
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    let j;
    if (step) j = Math.min(buttons.length - 1, Math.max(0, i + step));
    else if (e.key === 'Home') j = 0;
    else if (e.key === 'End') j = buttons.length - 1;
    else return;
    e.preventDefault();
    for (const b of buttons) b.tabIndex = b === buttons[j] ? 0 : -1;
    buttons[j].focus();
  });

  pick(buttons.find((b) => b.dataset.lamp === 'motor-ariza') ?? buttons[0], true);
}

services();
brands();
lamps();
