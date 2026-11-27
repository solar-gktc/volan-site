// Kampanyalar panelden gelir: sunucu /kampanyalar.json adresinde geçerli kampanyaları verir (en çok
// üç tane), bu dosya da hero'nun üçüncü slaytını ve Kampanyalar bölümünü onlarla doldurur.
// index.html'deki örnek slayt ve örnek paneller kalıp olarak kullanılır: görünüm burada, sitede kalır.
//   - Cevap geldi, kampanya var     → paneller ve (isteyen kampanya varsa) slayt doldurulur.
//   - Cevap geldi, kampanya yok     → slayt ve bölüm sayfadan kaldırılır.
//   - Cevap yok (sunucu kapalı, adres yok) → canlı sitede kaldırılır; önizlemede örnekler kalır.
// hero.js, kampanya.js ve sahne-baslat.js başlamadan önce `hazir`ı bekler; en çok BEKLE ms sürer.
const BEKLE = 1200;
const CANLI = /(^|\.)volan\.com\.tr$/i.test(location.hostname);
const WHATSAPP = '905337653378';
const GORSEL = { jant: 'kampanya-jant-volvo', aku: 'kampanya-aku', 'fren-seti': 'kampanya-fren-seti' };

const bugun = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' });
const gunAyYil = (iso) => iso.split('-').reverse().join('.');
const gunAy = (iso) => gunAyYil(iso).slice(0, 5);
const wa = (mesaj) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mesaj)}`;
const yaz = (el, metin) => { if (el) el.textContent = metin; };

async function oku() {
  const kes = new AbortController();
  const sure = setTimeout(() => kes.abort(), BEKLE);
  try {
    const cevap = await fetch('/kampanyalar.json', { signal: kes.signal, headers: { Accept: 'application/json' } });
    if (!cevap.ok) return null;
    const veri = await cevap.json();
    if (!veri || !Array.isArray(veri.kampanyalar)) return null;
    // Önbellekte kalmış bir cevap, son günü geçmiş kampanyayı göstermesin.
    return veri.kampanyalar.filter((k) => k && typeof k.sonGun === 'string' && k.sonGun >= bugun()).slice(0, 3);
  } catch {
    return null;
  } finally {
    clearTimeout(sure);
  }
}

function slayt(k) {
  const kok = document.querySelector('.s-hero');
  if (!kok) return;
  const baski = kok.querySelector('.print[data-print="3"]');
  const govde = kok.querySelector('.hcard__body[data-body="3"]');
  const nokta = kok.querySelector('.hero__dot[data-go="2"]');
  if (!baski || !govde) return;
  if (!k) {
    baski.remove();
    govde.remove();
    nokta?.remove();
    kok.querySelectorAll('.hcard__body').forEach((g, i, hepsi) => g.setAttribute('aria-label', `${i + 1} / ${hepsi.length}`));
    return;
  }
  // Görsel: büyük kelime ve işaretli maddeler.
  yaz(baski.querySelector('.ad__word'), k.hero.kelime);
  const kapsam = baski.querySelector('.ad__scope');
  const ornek = kapsam?.querySelector('span');
  if (kapsam && ornek) {
    kapsam.replaceChildren(...k.hero.maddeler.map((madde) => {
      const s = ornek.cloneNode(true);
      s.lastChild.textContent = madde;
      return s;
    }));
    kapsam.hidden = !k.hero.maddeler.length;
  }
  // Kart: başlık (büyük kelime ekran okuyucu için başta), metin, randevu, son gün, şart.
  const baslik = govde.querySelector('.hcard__title');
  if (baslik) {
    const gizli = baslik.querySelector('.visually-hidden') ?? Object.assign(document.createElement('span'), { className: 'visually-hidden' });
    gizli.textContent = k.hero.kelime ? `${k.hero.kelime} ` : '';
    baslik.replaceChildren(gizli, [k.baslikVurgu, k.baslikDevam].filter(Boolean).join(' '));
  }
  yaz(govde.querySelector('.hcard__text'), k.giris);
  const randevu = govde.querySelector('.stamp-btn--primary');
  if (randevu) randevu.href = wa(k.whatsappMesaji);
  yaz(govde.querySelector('[data-lastday] strong'), gunAyYil(k.sonGun));
  const sart = govde.querySelector('.hcard__terms');
  if (sart) { sart.textContent = k.sartlarKisa; sart.hidden = !k.sartlarKisa; }
  govde.querySelector('.hcard__foot')?.remove(); // "örnek kampanya" notu
}

function bolum(liste) {
  const kok = document.querySelector('.s-kampanya');
  if (!kok) return;
  const sekmeler = kok.querySelector('.tabs');
  const kalip = kok.querySelector('.panel');
  const sekmeKalibi = sekmeler?.querySelector('.tab');
  if (!liste.length || !kalip || !sekmeler || !sekmeKalibi) { kok.remove(); return; }
  const kap = kalip.parentElement;
  const paneller = liste.map((k, i) => {
    const p = kalip.cloneNode(true);
    const n = i + 1;
    p.id = `kampanya-panel-${n}`;
    p.setAttribute('aria-labelledby', `kampanya-tab-${n}`);
    p.hidden = i > 0;
    const h = p.querySelector('h3');
    if (h) h.replaceChildren(Object.assign(document.createElement('span'), { className: 'big', textContent: k.baslikVurgu }), k.baslikDevam ? ` ${k.baslikDevam}` : '');
    yaz(p.querySelector('.offer__lead'), k.giris);
    const vurgu = p.querySelector('.offer__free');
    if (vurgu) { if (k.ucretsizSatiri) vurgu.textContent = k.ucretsizSatiri; else vurgu.remove(); }
    const sartlar = p.querySelector('.terms');
    if (sartlar) {
      const satir = (ad, deger) => (deger ? [Object.assign(document.createElement('dt'), { textContent: ad }), Object.assign(document.createElement('dd'), { textContent: deger })] : []);
      sartlar.replaceChildren(...satir('Kapsam', k.kapsam), ...satir('Nasıl işliyor?', k.nasilIsliyor));
      if (!sartlar.children.length) sartlar.remove();
    }
    const randevu = p.querySelector('.stamp-btn--primary');
    if (randevu) randevu.href = wa(k.whatsappMesaji);
    yaz(p.querySelector('.valid b'), gunAyYil(k.sonGun));
    p.querySelector('.sample')?.remove(); // "örnek kampanya" notu
    const dosya = GORSEL[k.gorsel] ?? GORSEL.jant;
    const cizgi = p.querySelector('.art__line');
    if (cizgi) {
      const maske = `url(assets/img/anasayfa/${dosya}-cizgi.webp)`;
      cizgi.style.setProperty('-webkit-mask-image', maske);
      cizgi.style.setProperty('mask-image', maske);
    }
    const parca = p.querySelector('.art__part');
    if (parca) parca.src = `assets/img/anasayfa/${dosya}.webp`;
    return p;
  });
  const dugmeler = liste.map((k, i) => {
    const t = sekmeKalibi.cloneNode(false);
    const n = i + 1;
    t.id = `kampanya-tab-${n}`;
    t.setAttribute('aria-controls', `kampanya-panel-${n}`);
    t.setAttribute('aria-selected', String(i === 0));
    if (i === 0) t.removeAttribute('tabindex'); else t.tabIndex = -1;
    t.append(`${k.sekmeAdi} `, Object.assign(document.createElement('span'), { className: 'typed', textContent: gunAy(k.sonGun) }));
    return t;
  });
  kap.querySelectorAll(':scope > .panel').forEach((p) => p.remove());
  kap.prepend(...paneller);
  sekmeler.replaceChildren(...dugmeler);
}

function uygula(liste) {
  slayt(liste.find((k) => k.hero) ?? null);
  bolum(liste);
}

/** Kampanyalar sayfaya işlendiğinde (ya da işlenecek bir şey olmadığında) çözülür; hiç reddedilmez. */
export const hazir = oku().then((liste) => {
  try {
    if (liste) uygula(liste);
    else if (CANLI) uygula([]);
  } catch (hata) {
    console.error('kampanyalar işlenemedi', hata);
  }
});
