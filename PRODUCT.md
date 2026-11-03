# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Delegated; chosen after the sketch: plain HTML/CSS/JS with no framework and no build step. three.js renders the 3D vehicles; the scroll-linked drive is plain JavaScript. three.js is kept as one local minified bundle (`assets/vendor/three.bundle.min.js`, built once with esbuild from `assets/vendor/three.bundle.entry.js`). The Volvo model is compressed once with gltf-transform (a Node dev tool, not shipped). Why: it's a single page, hosting is not decided, and the scroll-driven 3D needs three.js but no framework. Turkish only.

## Users

Primary: Volvo owners in Ankara whose manufacturer warranty has ended or is ending. They want a service they can trust as much as the dealer, and they come to the site to decide, then book or call.

Secondary: Mercedes-Benz and Volkswagen owners.

## Product Purpose

A new website for Volan Otomotiv, an independent car service in Ankara. The site must make a post-warranty Volvo owner trust Volan and contact it (call, WhatsApp, or a booking request).

Volan describes its offer on volan.com.tr (Hakkımızda, read 2026-10-20): "Volvo, Volkswagen ve Mercedes araçlara yönelik olarak, yetkili servis kalitesinde ama Özel Servis olarak daha esnek, ulaşılabilir ve müşteri odaklı bir hizmet".

## Positioning

The company was founded in 1954 as "Volan Küçükyılmaz". It was a Volvo authorized service for many years ("uzun yıllar", no years are given on the site). Since 2017 it has operated as the private service "Volan Otomotiv". A neighboring independent shop cannot claim this lineage or show the archive that documents it (see Evidence on Hand).

## Operating Context

- Facility: Şaşmaz Oto Sanayi Sitesi. Address: Bahçekapı Mah. 2547. Sokak No:3 Etimesgut / Ankara. The building signage reads "VOLAN Premium Car Service" and "Since 1954". The workshops are labeled "Mekanik 1" and "Mekanik 2".
- Phones: 0533 765 33 78 (the site labels it "Telefon" and "Müşteri Destek Hattı") and 0312 278 69 90. WhatsApp: wa.me/905337653378. Email: info@volan.com.tr.
- Size and staff (user-stated): facility 1.800 m² (2026-11-01); 25 employees in total and 5 lifts in total (2026-11-03). Vehicles taken care of: "100.000+ araç" (user-stated 2026-11-03, for the homepage figures table). Per-unit staff counts are not published; the old site's per-unit numbers (4 mechanics, 2 body/paint, 1 damage advisor, 3 service advisors, 4 lifts) are outdated.
- Hours: weekdays and Saturday 08:30–18:00. Closed Sunday.
- Other channels: Instagram @volanotomotiv, and a spare parts shop at shop.volan.com.tr (external, not part of this build).
- Services named on volan.com.tr: Bakım & Onarım, Yedek Parça, Araç Arıza Tespiti, Sigorta / Kasko Onarım İşlemleri, Elektronik Sistem Onarımları, Kaporta, Boya, Mekanik Onarım. The site's Hakkımızda page also lists sigorta hasar danışmanlığı, 7/24 yol yardım ve kurtarıcı, and vale hizmeti.

## Capabilities and Constraints

- Language: Turkish only at launch. The current site has TR/EN/RU/DE; other languages are a later decision.
- Hosting: not decided. The build must work as static files.
- Booking: there is no booking backend yet. How a booking request is sent is still open.
- Layout input: the user will provide a sketch of the page (put it in `sketches/`). The sketch is the layout reference.
- Prior work is not a design reference. This covers `../anasayfa-2026`, `../volan-secenekler`, `../volan-roportaj`, and the look of the current volan.com.tr. Only product facts and client photos carry over.
- Verification rule (from `../info-extraction/00-bilgi-toplama-plani.md`): every date, name, or claim on the site needs two independent sources or one document. A single-source item is marked as reported ("aktarılan") or left out.
- Unverified items. None of these go on the site as fact until verified:
  - Founder name. The photo signage suggests Ömer Küçükyılmaz; it is a hypothesis.
  - Start and end years of the Volvo authorized service.
  - A truck/TIR era serving foreign hauliers. Only the photos suggest it.
  - "Türkiye'deki ilk Volvo yetkili servisi". This appears only in a customer review on the current site and is not a company claim.
  - Terms of the "işçilik garantisi" and the "Uygun Fiyat Garantisi" (duration, scope).
  - The body/paint certificate. The site says it is "Volan Otomotiv tarafından verilen"; no outside issuer is named.
  - The 1950s–1990s dates of the archive photos.
- The interview program (plan in `../info-extraction/`, answer collection in `../volan-roportaj/`) may fill these gaps later. I did not check whether any answers exist.

## Brand Commitments

- Names: "Volan Otomotiv" (trading name since 2017). The logo reads "VOLAN · Premium Car Service".
- Logo authority: `brand/LOGO_2026.pdf` (CorelDRAW 2017 export, confirmed by the user). It has two lockups:
  - Oval: gold ring, white fill, mark and wordmark inside → `brand/logo-oval.svg`
  - Horizontal: mark and wordmark, no background → `brand/logo-horizontal.svg`
  - Both SVGs are the PDF's own vector paths, cropped to each lockup and otherwise unchanged.
- Brand colors (from the PDF, confirmed by the user):
  - Navy `#323277`: swoosh and wordmark
  - Silver `#CFD0D0`: inner swoosh
  - Near-black `#2B2A29`: "Premium Car Service" tagline
  - Gold: spot color named "R136 G114 B67" (`#887243` by its name). Its Lab definition (49 / 3 / 28) renders as `#857244`. Used for the oval ring.
  - White `#FEFEFE`: oval fill
  - Supporting colors (surfaces, states) are a design decision, not part of the brand record.
- Open: the PDF has no reversed (light-on-dark) or single-color logo version. The horizontal lockup's navy and near-black parts have low contrast on dark backgrounds.
- Slogans now on volan.com.tr: "Aracınız bizim sorumluluğumuzdadır" and "Yola çıkmadan önce değil, her zaman yanınızdayız."
- The user chose for the new homepage banner: "Aracınız bizim sorumluluğumuzda" (slogan) and "Garanti süreniz bittiği için servis kalitenizi düşürmek zorunda değilsiniz." (subheader).
- 3D: `../3d-indirilen/xc60.glb` is Volan's own Volvo model, and Volan holds its usage rights (user-confirmed). No other vehicle models exist yet.

## Evidence on Hand

- `photos/`: 22 client-supplied photos. `photos/FOTOGRAF-INDEKSI.md` describes each one and lists the questions it raises.
  - `arsiv-01` … `arsiv-13`: scans of old prints. Mostly black-and-white or sepia, low resolution: long edge 576–1067 px, except two studio portraits at 1185×1600. They show the first workshop, team portraits, Volvo trucks of foreign hauliers, "ANADOLU · VOLVO Yetkili" and "Ömer Küçükyılmaz ve Ort." Volvo signage, an engine overhaul hall, and a car on a lift. Dates and people are unverified.
  - `guncel-01` … `guncel-09`: the current building, shot on 2026-10-04 (1536×2048, portrait). They show the oval sign, "Since 1954", the entrance path, the Mekanik 1/2 doors, and an XC90.
- Absent; do not fabricate:
  - customer testimonials with permission
  - current photos of the team, the workshop interior, or equipment
  - certificate documents
  - price lists
  - warranty terms
  - Volvo dealership documents

## Product Principles

1. **Evidence before claims.** A date, name, or promise appears only when it meets the verification rule. A gap is shown as a gap, not filled with a guess.
2. **Post-warranty Volvo owner first.** Every page answers this visitor's question: is this as good as the dealer? Mercedes-Benz and VW are served honestly, without stretching the Volvo depth claim to them.
3. **The archive is proof.** The 1954 lineage is shown through real photos and documents, not stated as a slogan alone.
4. **Contact is never far.** Calling, WhatsApp, and asking for an appointment stay within easy reach on every page.
