// Yorumlar (homepage v2): a deck of Google reviews as postcards on the navy board.
// One large card in front, the next two smaller behind it; previous/next (buttons, arrow
// keys, a swipe on phones, or a click on a card behind) walk through the rest of the deck.

// ---------------------------------------------------------------------------------------
// REVIEWS are real customer reviews copied unchanged (text, name, date) from yorumlar.html.
// Ten reviews; longer ones get a smaller type and a wider message side (see `size`). One object per review;
// `rating`, `car` and `brand` may be left out (the source gives no star rating or car).
//   name / date / text: as published, rating: 1–5, car: "Model · işlem",
//   brand: volvo | vw | mercedes (chooses the drawing on the postage stamp),
//   sample: true shows "örnek" on the card.
// SUMMARY was checked against the Google profile on 2026-11-27 (4,7 / 255). It was sample ("örnek") data: the Google score, review count and profile
// address have not come from Volan yet.
const SUMMARY = { rating: 4.7, count: 255, url: 'https://www.google.com/maps/search/?api=1&query=Volan%20Otomotiv%20Bah%C3%A7ekap%C4%B1%20Mah.%202547.%20Sokak%20No%3A3%20Etimesgut%20Ankara', sample: false };
// Real Google reviews read from the profile on 2026-11-27: text word for word, names as Google
// shows them, no dates (the owner asked for none).
const REVIEWS = [
  { name: 'Eray ÖZSÜMER', brand: 'volvo',
    text: 'Kalite, Hız, İlgi, Alaka ve Güven hepsi bir arada. Kenan beye ve Ahmet ustaya teşekkür ediyorum. Gönül rahatlığıyla aracınızı teslim edebilirsiniz. Volvo S80 T4 aracımın motordaki ve turbodaki sorunlarını çözdüler. Teşekkürler.' },
  { name: 'Ertuğrul Aypek', brand: 'volvo',
    text: 'Almanya’dan Türkiye tatiline geldiğimde Volvo aracımın yıllık bakımını Volan’da yaptırdım. Profesyonel ekip ve dürüst bir yönetim gözlemledim. Her sorumu anlaşılır bir dille izah ettiler. Bundan sonra adresim hep Volan olacak' },
  { name: 'Çağrı Yılmaz',
    text: 'Yaklaşık 6 yıldır aracımın tüm işlemlerini burada yaptırıyorum. Ustalıklarına her zaman çok güvenirim ve asla gereksiz masrafa sokmazlar. Tüm ekibe teşekkür ederim.' },
  { name: 'Ahmet Deveci', brand: 'volvo',
    text: 'Hollanda’dan geliyorum ve Ankara’da sabit bir tamircim yoktu. Aracım Volvo XC90 T8, 2016 model. Daha önce başka bir servise gittim ve orası klima kompresörünün değişmesi gerektiğini söyledi. Ancak Volan otomotivde gerçek sorun doğru şekilde tespit edildi ve çok daha uygun bir maliyetle çözüldü. Hem param cebimde kaldı hem de problem tamamen giderildi. Volan otomotiv güvenilir, işini düzgün yapan ve müşteri memnuniyetine önem veren bir yer. Artık Ankara’da güvenle gidebileceğim bir garajım var. Kesinlikle tavsiye ederim!' },
  { name: 'Mehmet Can Ezgu', brand: 'volvo',
    text: '2017 model volvo s60 aracımın arızası için kendileriyle iletişime geçtim, aracı görmeden önce bana olabilecek arıza nedenlerini ve muhtemel fiyatları söylediler. ben şehir dışındayken aracımı başka bir servisten kendileri aldılar, aynı gün içinde arıza tespitini yaptılar ve normalde tamiri 20 gün süreceği söylenen arızaları 4-5 içinde giderdiler. İlgilerinden dolayı teşekkür ederim.' },
  { name: 'Talha Ayyıldız', brand: 'volvo',
    text: 'Volvo arabamla buraya yaptığım her ziyaretten çok memnun kaldım. Oldukça tecrübeli ve güvenilir servis. Çalışanlar oldukça hızlı. Mekan çok temiz ve nezih. Her zaman ulaşılabilirler. Kesinlikle tavsiye ediyorum' },
  { name: 'Yiğit Orçun Sırıklıoğlu', brand: 'volvo',
    text: 'Merhabalar , 2008 model v70 aracımla servislerine çekici üzerinde geldim. Buradan önce Ankara ve İstanbulda 2ayrı servis deneyimim oldu fakat ikisinde de fazlasıyla para harcamama rağmen yolda rezil oldum çünkü aynı sorunu yaşadım. Keşke burayı daha önce bulup gelebilseydim. Nokta atışı aracımın sorunu bulundu açıklandı gereken işlemler yapıldı. Son derece memnunum başka volvo kullanıcılarına da tavsiye ederim. Her şey için çok teşekkürler.' },
  { name: 'M.Sezgin Dönmez', brand: 'volvo',
    text: '2020 model XC90 aracım turbo arızası verdi.. Yetkili serviste tesbiti yapıldıktan sonra bir buçuk aylık bir tamir süresi ve yüksek bir fiyat verildi.  Bu süre benim için çok uzun olduğu için alternatif bir yer ararken Volan servisini ziyaret ettim..Biraz araştırdığımda eski yetkili servis olduklarını öğrendim ve sonrasında gözüm kapalı gittim.  Tesis ve ekip olarak güven verdikleri için aracımı bıraktım...orjinal parça ile bir  haftada aracımın turbo değişimini yapıp teslim ettiler. Neredeyse yarı yarıya daha uygun fiyata yaptırdım.  Kendilerine özellikle zaman konusunda ve fiyat konusunda  yardımcı oldukları için teşekkür ederim.' },
  { name: 'Mustafa Akboyraz',
    text: 'Aracımızın fren pedalı yumuşaması ve dipte kavrama problemi için Volan Otomotiv’i tercih ettim. Baştan sona hızlı, profesyonel ve çözümcü bir yaklaşım sergilemelerinden dolayı Kenan Bey’e be usta Mehmet Bey’e çok teşekkür ediyorum.' },
  { name: 'Kaan Akman', brand: 'volvo',
    text: 'İkinci el olarak satın aldığım 2008 model Volvo V70 aracım için tüm bakımları (triger, v kayışı, radyatör, motor kulağı, sıvı bakımları filtreler vs) ustalıkla ve özenle yapıldı. Daha önceden volvo sahibi değildim keşke daha önce tanışma fırsatım olsaydı. Parçası bulunmayan ve zor olan trim işlemleri bile özenle yapıldı. Buradan Orhan ve Kenan abi olmak üzere tüm çalışanlara teşekkür ederim. Daha profesyonel ve kurumsal bir işletme olduğunu sanmıyorum. Tamamen güvenilir ve köklü bir işletme. Aracımı bıraktıktan sonra hızlı bir şekilde tüm sorunlar çözüldü ve whatsapp üzerinden fotoğraflarla bilgilendirildim. Şeffaf ve güvenilir bir hizmet ;)' },
];
// ---------------------------------------------------------------------------------------

const STAMPS = { volvo: 'yorumlar-pul-volvo', vw: 'yorumlar-pul-vw' };
const GENERIC = ['yorumlar-pul-usta', 'yorumlar-pul-cila', 'yorumlar-pul-triger'];
const STAR = '<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.4l-5.9 3.2 1.3-6.6L2.5 9.4l6.6-.8z"/></svg>';
const CANCEL = '<svg class="pc__cancel" viewBox="0 0 90 48" aria-hidden="true"><path d="M0 10c15-6 30 6 45 0s30 6 45 0M0 24c15-6 30 6 45 0s30 6 45 0M0 38c15-6 30 6 45 0s30 6 45 0"/></svg>';
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const num = (n) => String(n).replace('.', ',');
const stars = (r, cls = '') => `<span class="stars ${cls}" style="--r: ${r}" role="img" aria-label="5 üzerinden ${num(r)} yıldız"><span class="stars__base">${STAR.repeat(5)}</span><span class="stars__fill">${STAR.repeat(5)}</span></span>`;

function card(r, i, total) {
  const stamp = STAMPS[r.brand] || GENERIC[i % GENERIC.length];
  const size = r.text.length > 460 ? ' pc--long' : r.text.length > 250 ? ' pc--mid' : '';
  return `<article class="pc${size}" data-i="${i}" aria-label="Yorum ${i + 1} / ${total}">
    <div class="pc__msg">
      ${r.rating ? stars(r.rating) : ''}
      <p class="pc__quote">${esc(r.text)}</p>
      <p class="pc__from">— ${esc(r.name)}${r.date ? ` · ${esc(r.date)}` : ''}</p>
      ${r.car ? `<p class="pc__car"><b>Araç ve işlem</b><span>${esc(r.car)}</span></p>` : ''}
      <p class="pc__src">Google yorumu${r.sample ? ' · örnek' : ''}</p>
    </div>
    <div class="pc__addr">
      <div class="pc__stamp"><img src="assets/img/anasayfa/${stamp}.webp" alt="" width="240" height="300" loading="lazy"><small><span>Volan</span><span>1954</span></small></div>
      ${CANCEL}
      <svg class="seal" aria-hidden="true"><use href="#seal"/></svg>
      <ul class="pc__lines"><li>Volan Otomotiv</li><li>Bahçekapı Mah. 2547. Sk. No:3</li><li>Etimesgut / Ankara</li></ul>
    </div>
  </article>`;
}

const root = document.querySelector('.s-yorumlar');
if (root && REVIEWS.length) {
  // Summary on the board
  const tally = root.querySelector('[data-tally]');
  if (tally) {
    root.querySelector('[data-tally-score]').textContent = num(SUMMARY.rating);
    root.querySelector('[data-tally-stars]').outerHTML = stars(SUMMARY.rating, 'stars--gold');
    root.querySelector('[data-tally-count]').textContent = SUMMARY.count.toLocaleString('tr-TR');
    tally.querySelector('.tally__count').lastChild.textContent = SUMMARY.sample ? ' yorum · örnek değerler' : ' yorum';
  }
  const link = root.querySelector('[data-google-link]');
  if (link && SUMMARY.url) link.href = SUMMARY.url;

  // The deck
  const holder = root.querySelector('[data-cards]');
  const nav = root.querySelector('[data-nav]');
  const N = REVIEWS.length;
  holder.innerHTML = REVIEWS.map((r, i) => card(r, i, N)).join('');
  const cards = [...holder.querySelectorAll('.pc')];
  let front = 0;

  const slotOf = (p) => (p === 0 ? 'big' : p === 1 ? 'a' : p === 2 ? 'b' : p === N - 1 && N > 3 ? 'out' : 'deck');
  let fit = () => {};
  const place = () => {
    cards.forEach((c, i) => {
      const p = (i - front + N) % N;
      const slot = slotOf(p);
      c.dataset.slot = slot;
      c.setAttribute('aria-hidden', String(slot !== 'big'));
      c.inert = slot === 'deck' || slot === 'out';
    });
    root.querySelector('[data-count]').textContent = String(front + 1);
    fit();
  };
  // Phones: the deck is as tall as the card in front.
  const phone = matchMedia('(max-width: 899px)');
  fit = () => { holder.style.height = phone.matches ? `${cards[front].offsetHeight}px` : ''; };
  addEventListener('resize', fit);
  const step = (d) => { front = (front + d + N) % N; place(); };

  root.querySelector('[data-total]').textContent = String(N);
  if (N > 1) {
    nav.hidden = false;
    root.querySelector('[data-prev]').addEventListener('click', () => step(-1));
    root.querySelector('[data-next]').addEventListener('click', () => step(1));
    // A card behind the front one comes forward when clicked.
    holder.addEventListener('click', (e) => {
      const c = e.target.closest('.pc');
      if (!c) return;
      if (c.dataset.slot === 'a') step(1);
      else if (c.dataset.slot === 'b') step(2);
    });
    root.querySelector('[data-deck]').addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    });
    // Swipe on touch screens; vertical scrolling stays with the page (touch-action: pan-y).
    let x0 = null;
    holder.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') x0 = e.clientX; });
    holder.addEventListener('pointerup', (e) => {
      if (x0 === null) return;
      const dx = e.clientX - x0;
      x0 = null;
      if (Math.abs(dx) > 48) step(dx < 0 ? 1 : -1);
    });
    holder.addEventListener('pointercancel', () => { x0 = null; });
  }
  place();
  root.classList.add('is-deck');
}
