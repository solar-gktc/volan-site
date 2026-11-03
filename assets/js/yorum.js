// Review comments, stored as rows in a Google Sheet through a Google Apps Script web app
// (see tools/yorum-apps-script.gs).
//   "Yorum bırak" → click anywhere on the page → write → saved; a numbered pin marks the spot.
//   Click a pin → read the comment, edit it, or delete it.
// The UI lives in a shadow root so the site's CSS and this file's CSS never touch each other.

// The Apps Script web app URL (Deploy → Manage deployments → Web app URL).
const ENDPOINT = 'https://script.google.com/macros/s/AKfycby7PTVPKz8B07NAuSEJUCpw3twI7tlEYODcU11L7aLxCDdhyfU1N7Mg0ytpHMfPkxuD/exec';

(() => {
  // Comments belong to a page: file name plus query (yakinda.html?s=haberler is its own page).
  const PAGE = (location.pathname.split('/').pop() || 'index.html') + location.search;

  const host = document.createElement('div');
  host.style.cssText = 'position:absolute;top:0;left:0;width:0;height:0;z-index:2147483000';
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `
<style>
  :host { all: initial; }
  * { box-sizing: border-box; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  .btn {
    position: fixed; left: max(24px, env(safe-area-inset-left)); bottom: max(24px, env(safe-area-inset-bottom));
    display: flex; align-items: center; gap: 8px; padding: 12px 18px; border: 0; border-radius: 999px;
    background: #e8590c; color: #fff; font-size: 15px; font-weight: 600; cursor: pointer;
    box-shadow: 0 4px 16px rgba(0,0,0,.25);
  }
  .btn[aria-pressed="true"] { background: #222; }
  .btn svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2; }
  .hint {
    position: fixed; top: 16px; left: 50%; transform: translateX(-50%); max-width: calc(100vw - 32px);
    padding: 10px 16px; border-radius: 8px; background: #222; color: #fff; font-size: 14px; text-align: center;
  }
  .pin {
    position: absolute; width: 26px; height: 26px; margin: -13px 0 0 -13px; padding: 0; border-radius: 50%;
    display: grid; place-items: center; background: #e8590c; color: #fff; border: 3px solid #fff;
    font-size: 11px; font-weight: 700; line-height: 1; box-shadow: 0 1px 6px rgba(0,0,0,.4); cursor: pointer;
  }
  .pin.draft { pointer-events: none; }
  .pin.active { background: #222; }
  .box {
    position: absolute; width: 300px; max-width: calc(100vw - 32px); padding: 12px; border-radius: 10px;
    background: #fff; color: #222; box-shadow: 0 8px 30px rgba(0,0,0,.3); font-size: 15px;
  }
  .meta { margin-bottom: 6px; font-size: 12px; color: #666; }
  .text { white-space: pre-wrap; overflow-wrap: anywhere; max-height: 240px; overflow: auto; }
  textarea {
    display: block; width: 100%; min-height: 96px; padding: 8px; border: 1px solid #bbb; border-radius: 6px;
    font-size: 15px; color: #222; background: #fff; resize: vertical;
  }
  textarea:focus { outline: 2px solid #e8590c; border-color: transparent; }
  .row { display: flex; justify-content: flex-end; gap: 8px; margin-top: 10px; }
  .row button { padding: 8px 14px; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; }
  .plain { border: 1px solid #bbb; background: #fff; color: #222; }
  .main { border: 0; background: #e8590c; color: #fff; }
  .danger { border: 0; background: #c92a2a; color: #fff; }
  .row button:disabled { opacity: .6; cursor: default; }
  .msg { margin-top: 8px; font-size: 13px; color: #c92a2a; }
  .ask { margin-top: 10px; font-weight: 600; }
  .toast {
    position: fixed; left: 50%; bottom: 24px; transform: translateX(-50%); padding: 10px 16px; border-radius: 8px;
    background: #2b8a3e; color: #fff; font-size: 14px;
  }
  .toast.error { background: #c92a2a; }
  [hidden] { display: none !important; }
</style>
<button class="btn" type="button" aria-pressed="false">
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
  <span>Yorum bırak</span>
</button>
<div class="hint" hidden>Yorum bırakmak istediğiniz yere tıklayın · Esc ile vazgeçin</div>
<div class="layer"></div>
<div class="toast" hidden></div>`;

  const btn = root.querySelector('.btn');
  const label = btn.querySelector('span');
  const hint = root.querySelector('.hint');
  const layer = root.querySelector('.layer');
  const toastEl = root.querySelector('.toast');
  const comments = []; // { id, comment, time, updated, selector, ox, oy, x, y, xPct, pin }
  let placing = false;
  let draft = null; // a new comment not saved yet
  let box = null; // { el, c } the open box and the comment it belongs to

  // ---- server -------------------------------------------------------------------------------
  async function api(payload) {
    // A plain-text body keeps this a "simple" request, so the browser sends no CORS preflight.
    const res = await fetch(ENDPOINT, { method: 'POST', body: JSON.stringify(payload) });
    const out = await res.json();
    if (!out.ok) throw new Error(out.error || 'not ok');
    return out;
  }

  async function load() {
    try {
      const res = await fetch(ENDPOINT + '?page=' + encodeURIComponent(PAGE));
      const out = await res.json();
      if (!out.ok) throw new Error(out.error || 'not ok');
      for (const c of out.comments) addSaved(c);
      renumber();
      placeAll();
    } catch (err) {
      console.error('[yorum] load', err);
      toast('Kayıtlı yorumlar yüklenemedi.', true);
    }
  }

  // ---- positions ----------------------------------------------------------------------------
  // Host-relative position for a viewport (client) point.
  function pos(clientX, clientY) {
    const r = host.getBoundingClientRect();
    return { left: clientX - r.left, top: clientY - r.top };
  }

  // A selector that finds this exact element again: an id, or tag:nth-of-type steps from body.
  function selectorFor(el) {
    const parts = [];
    for (let n = el; n && n.nodeType === 1 && n !== document.body && n !== document.documentElement; n = n.parentElement) {
      if (n.id) { parts.unshift('#' + CSS.escape(n.id)); return parts.join(' > '); }
      let i = 1;
      for (let s = n.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === n.tagName) i++;
      parts.unshift(n.tagName.toLowerCase() + ':nth-of-type(' + i + ')');
    }
    return ['body', ...parts].join(' > ');
  }

  function elementText(el) {
    const t = el.innerText || el.getAttribute('alt') || el.getAttribute('aria-label') || '';
    return t.replace(/\s+/g, ' ').trim().slice(0, 150);
  }

  // Client point of a comment: the same spot inside the element it was left on, so the pin
  // follows that element when the layout changes. Falls back to the saved page coordinates.
  function clientPoint(c) {
    let el = null;
    try { el = c.selector ? document.querySelector(c.selector) : null; } catch { /* bad selector */ }
    const r = el && el.getBoundingClientRect();
    if (r && (r.width || r.height)) return { x: r.left + c.ox * r.width, y: r.top + c.oy * r.height };
    const x = c.xPct ? (c.xPct / 100) * document.documentElement.scrollWidth : c.x;
    return { x: x - scrollX, y: c.y - scrollY };
  }

  function placePin(c) {
    const p = clientPoint(c);
    const h = pos(p.x, p.y);
    c.pin.style.left = h.left + 'px';
    c.pin.style.top = h.top + 'px';
    return p;
  }

  function placeBox() {
    if (!box) return;
    const p = placePin(box.c);
    const width = Math.min(300, innerWidth - 32);
    const height = box.el.offsetHeight || 180;
    const x = Math.min(Math.max(p.x + 18, 16), innerWidth - width - 16);
    const y = p.y + 18 + height > innerHeight ? Math.max(16, p.y - 18 - height) : p.y + 18;
    const h = pos(x, y);
    box.el.style.left = h.left + 'px';
    box.el.style.top = h.top + 'px';
  }

  function placeAll() {
    for (const c of comments) placePin(c);
    if (draft) placePin(draft);
    placeBox();
  }

  let frame = 0;
  const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(placeAll); };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  addEventListener('load', schedule);
  new ResizeObserver(schedule).observe(document.body);

  // ---- pins ---------------------------------------------------------------------------------
  function makePin(c, isDraft) {
    const pin = document.createElement(isDraft ? 'div' : 'button');
    pin.className = 'pin' + (isDraft ? ' draft' : '');
    if (!isDraft) {
      pin.type = 'button';
      pin.addEventListener('click', () => (box && box.c === c ? closeBox() : openBox(c, 'view')));
    }
    c.pin = pin;
    layer.prepend(pin);
  }

  function addSaved(c) {
    makePin(c, false);
    comments.push(c);
  }

  function renumber() {
    comments.forEach((c, i) => {
      c.pin.textContent = String(i + 1);
      c.pin.setAttribute('aria-label', 'Yorum ' + (i + 1));
    });
  }

  // ---- box ----------------------------------------------------------------------------------
  function closeBox() {
    if (!box) return;
    box.el.remove();
    box.c.pin.classList.remove('active');
    box = null;
    if (draft) { draft.pin.remove(); draft = null; }
  }

  function button(text, cls, onClick) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = cls;
    b.textContent = text;
    b.addEventListener('click', onClick);
    return b;
  }

  function stamp(c) {
    const fmt = (t) => new Date(t).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' });
    return fmt(c.time) + (c.updated ? ' · düzenlendi ' + fmt(c.updated) : '');
  }

  // Runs a server call with the box's buttons disabled; shows the error in the box on failure.
  async function busy(el, buttons, work) {
    const msg = el.querySelector('.msg');
    msg.hidden = true;
    buttons.forEach((b) => { b.disabled = true; });
    try {
      await work();
    } catch (err) {
      console.error('[yorum]', err);
      msg.textContent = 'İşlem yapılamadı. Tekrar deneyin.';
      msg.hidden = false;
      buttons.forEach((b) => { b.disabled = false; });
    }
  }

  // mode: 'new' | 'view' | 'edit' | 'delete'
  function openBox(c, mode) {
    if (box && box.c !== c) closeBox();
    if (box) box.el.remove();
    const el = document.createElement('div');
    el.className = 'box';
    const msg = document.createElement('div');
    msg.className = 'msg';
    msg.hidden = true;
    const row = document.createElement('div');
    row.className = 'row';

    if (mode === 'new' || mode === 'edit') {
      const ta = document.createElement('textarea');
      ta.placeholder = 'Yorumunuzu yazın';
      ta.setAttribute('aria-label', 'Yorum');
      ta.value = mode === 'edit' ? c.comment : '';
      const save = button(mode === 'new' ? 'Gönder' : 'Kaydet', 'main', () => {
        const text = ta.value.trim();
        if (!text) { ta.focus(); return; }
        save.textContent = mode === 'new' ? 'Gönderiliyor…' : 'Kaydediliyor…';
        busy(el, [save, cancel], async () => {
          if (mode === 'new') {
            const { draft: data } = c;
            const out = await api({ action: 'create', page: PAGE, comment: text, ...data });
            Object.assign(c, data, { id: out.id, time: out.time, comment: text });
            delete c.draft;
            c.pin.remove();
            draft = null;
            box = null;
            el.remove();
            addSaved(c);
            renumber();
            placePin(c);
            toast('Yorumunuz kaydedildi.');
          } else {
            const out = await api({ action: 'update', id: c.id, comment: text });
            c.comment = text;
            c.updated = out.updated;
            openBox(c, 'view');
            toast('Yorum güncellendi.');
          }
        }).finally(() => { save.textContent = mode === 'new' ? 'Gönder' : 'Kaydet'; });
      });
      const cancel = button('Vazgeç', 'plain', () => (mode === 'new' ? closeBox() : openBox(c, 'view')));
      ta.addEventListener('keydown', (k) => {
        if (k.key === 'Enter' && (k.ctrlKey || k.metaKey)) save.click();
      });
      row.append(cancel, save);
      el.append(ta, msg, row);
      setTimeout(() => ta.focus({ preventScroll: true }));
    } else {
      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.textContent = stamp(c);
      const text = document.createElement('div');
      text.className = 'text';
      text.textContent = c.comment;
      el.append(meta, text);
      if (mode === 'view') {
        row.append(
          button('Sil', 'plain', () => openBox(c, 'delete')),
          button('Düzenle', 'plain', () => openBox(c, 'edit')),
          button('Kapat', 'main', closeBox),
        );
      } else {
        const q = document.createElement('div');
        q.className = 'ask';
        q.textContent = 'Bu yorum silinsin mi?';
        el.append(q);
        const del = button('Sil', 'danger', () => {
          del.textContent = 'Siliniyor…';
          busy(el, [del, keep], async () => {
            await api({ action: 'delete', id: c.id });
            closeBox();
            c.pin.remove();
            comments.splice(comments.indexOf(c), 1);
            renumber();
            toast('Yorum silindi.');
          }).finally(() => { del.textContent = 'Sil'; });
        });
        const keep = button('Vazgeç', 'plain', () => openBox(c, 'view'));
        row.append(keep, del);
      }
      el.append(msg, row);
    }

    layer.append(el);
    box = { el, c };
    c.pin.classList.add('active');
    placeBox();
  }

  let toastTimer = 0;
  function toast(text, isError) {
    toastEl.textContent = text;
    toastEl.classList.toggle('error', !!isError);
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.hidden = true; }, 2500);
  }

  // ---- placing a new comment ----------------------------------------------------------------
  function setPlacing(on) {
    placing = on;
    btn.setAttribute('aria-pressed', String(on));
    label.textContent = on ? 'Vazgeç' : 'Yorum bırak';
    hint.hidden = !on;
    document.documentElement.style.cursor = on ? 'crosshair' : '';
  }

  btn.addEventListener('click', () => {
    if (placing) { setPlacing(false); return; }
    closeBox();
    setPlacing(true);
  });

  // Capture phase, so the page's own links and buttons don't react to the placing click.
  document.addEventListener('click', (e) => {
    if (!placing || e.composedPath().includes(host)) return;
    e.preventDefault();
    e.stopPropagation();
    setPlacing(false);
    const t = e.target;
    const r = t.getBoundingClientRect();
    const data = {
      element: elementText(t),
      selector: selectorFor(t),
      ox: r.width ? Math.round(((e.clientX - r.left) / r.width) * 10000) / 10000 : 0,
      oy: r.height ? Math.round(((e.clientY - r.top) / r.height) * 10000) / 10000 : 0,
      x: Math.round(e.pageX),
      y: Math.round(e.pageY),
      xPct: Math.round((e.pageX / document.documentElement.scrollWidth) * 1000) / 10,
      viewport: innerWidth + '×' + innerHeight,
    };
    draft = { ...data, draft: data };
    makePin(draft, true);
    openBox(draft, 'new');
  }, true);

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (placing) setPlacing(false);
    else closeBox();
  });

  document.body.append(host);
  load();
})();
