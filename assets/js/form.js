// İletişim sayfasındaki başvuru formu. Sunucu (blog motoru) iki adres verir:
//   GET  /form/anahtar → { anahtar }   sayfa açılınca alınır; formun ne zaman gösterildiğini imzalı taşır
//   POST /form/gonder  → { ok } | { ok: false, hatalar | hata, yenile }
// Korumaların hepsi sunucudadır (alan denetimi, tuzak alan, anahtarın yaşı, hız sınırı, yalnız bu
// siteden gelen istek). Buradaki denetim yalnız ziyaretçiye erken söylemek içindir.
// Sunucu yoksa: canlı sitede form hiç görünmez (WhatsApp ve telefon sayfada durur); önizlemede
// tasarım görülsün diye görünür ama gönderime kapalıdır.
(() => {
  const kutu = document.querySelector('[data-form]');
  const form = kutu?.querySelector('form');
  if (!kutu || !form) return;
  const CANLI = /(^|\.)volan\.com\.tr$/i.test(location.hostname);
  const dugme = form.querySelector('[type="submit"]');
  const durum = form.querySelector('.basvuru__durum');
  const tamam = kutu.querySelector('.basvuru__tamam');
  let anahtar = null;

  const anahtarAl = async () => {
    try {
      const cevap = await fetch('/form/anahtar', { headers: { Accept: 'application/json' }, cache: 'no-store' });
      const veri = cevap.ok ? await cevap.json() : null;
      anahtar = veri && typeof veri.anahtar === 'string' ? veri.anahtar : null;
    } catch {
      anahtar = null;
    }
    return anahtar;
  };

  const soyle = (metin) => {
    durum.textContent = metin;
    durum.hidden = !metin;
  };
  const alanHatasi = (ad, metin) => {
    const giris = form.elements[ad];
    const yer = document.getElementById(`f-${ad}-hata`);
    if (!giris || !yer) return;
    yer.textContent = metin || '';
    yer.hidden = !metin;
    if (metin) giris.setAttribute('aria-invalid', 'true'); else giris.removeAttribute('aria-invalid');
  };
  const temizle = () => ['ad', 'telefon', 'eposta', 'mesaj'].forEach((ad) => alanHatasi(ad, ''));

  // Erken denetim: sunucunun kurallarının sade hâli.
  const denetle = (v) => {
    const h = {};
    if (v.ad.trim().length < 2) h.ad = 'Adınızı yazın.';
    const rakam = v.telefon.replace(/\D/g, '');
    if (rakam.length < 10 || rakam.length > 13) h.telefon = 'Telefon numaranızı alan koduyla yazın. Örnek: 0533 765 33 78';
    if (v.eposta.trim() && !/^\S+@\S+\.\S{2,}$/.test(v.eposta.trim())) h.eposta = 'E-posta adresini kontrol edin.';
    if (v.mesaj.trim().length < 5) h.mesaj = 'Mesajınızı yazın.';
    return h;
  };
  const goster = (hatalar) => {
    temizle();
    const adlar = Object.keys(hatalar);
    adlar.forEach((ad) => alanHatasi(ad, hatalar[ad]));
    if (adlar.length) form.elements[adlar[0]]?.focus();
    return adlar.length;
  };

  // Düzeltilen alanın uyarısı yazarken kalkar.
  form.addEventListener('input', (olay) => { if (olay.target.name) alanHatasi(olay.target.name, ''); });

  form.addEventListener('submit', async (olay) => {
    olay.preventDefault();
    soyle('');
    const v = Object.fromEntries(new FormData(form));
    if (goster(denetle(v))) return;
    if (!anahtar && !(await anahtarAl())) { soyle('Form şu an gönderilemiyor. Lütfen bizi arayın: 0533 765 33 78'); return; }
    dugme.disabled = true;
    try {
      const cevap = await fetch('/form/gonder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...v, sayfa: location.pathname, anahtar }),
      });
      const veri = await cevap.json().catch(() => ({}));
      if (cevap.ok && veri.ok) {
        form.hidden = true;
        tamam.hidden = false;
        tamam.setAttribute('tabindex', '-1');
        tamam.focus();
        return;
      }
      if (veri.yenile) await anahtarAl(); // anahtar eskimiş ya da çok yeni: bir sonraki deneme yenisiyle gider
      if (veri.hatalar && goster(veri.hatalar)) return;
      soyle(veri.hata || 'Form gönderilemedi. Lütfen yeniden deneyin ya da bizi arayın: 0533 765 33 78');
    } catch {
      soyle('Bağlantı kurulamadı. Lütfen yeniden deneyin ya da bizi arayın: 0533 765 33 78');
    } finally {
      dugme.disabled = false;
    }
  });

  anahtarAl().then((var_mi) => {
    if (var_mi) { kutu.hidden = false; return; }
    if (CANLI) return; // canlıda sunucu yoksa form görünmez
    kutu.hidden = false;
    dugme.disabled = true;
    soyle('Önizleme: form sunucusu bu adreste yok, gönderim kapalı.');
  });
})();
