---
version: 1
slug: "anasayfa-v2-html"
primary_target: "anasayfa-v2.html"
related_targets: []
---

# Homepage v2 (anasayfa-v2.html)

## Scope and mode
Candidate replacement for index.html with the user's new content order (sketch, 2026-11-03). Mode: Persuade. Turkish only. index.html stays untouched until the user approves the swap.

## Audience, job, action
Same as the index.html brief: post-warranty Volvo owners in Ankara decide whether Volan matches the dealer, then book (Randevu, via WhatsApp), call, or message.

## Pinned by the user
- Order: banner → Hizmetlerimiz (tek noktadan servis) → Kampanya → Hizmet kalitesi (5 adım) → Marka uzmanlığı + Ücretsiz tespit → Teklif → Onay → İstatistik → Tesis modeli → Müşteri yorumları → Kamyon dönüşümü / miras → Final (1954 garajı + iletişim). Warning-lamp section removed.
- World: keep the Service Booklet world and the 3D road drive (user answer, 2026-11-03).
- Picks: hero v3, hizmetler v3, kampanya v2, kalite v3, marka v1, istatistik v1, tesis v1, yorumlar v3, miras v3, final v2 (mocks in .impeccable/mocks/anasayfa-v2/).
- Changes: kalite card top = facility photo + car photo (no employee); marka = engine line drawings instead of the wheel; istatistik = "100.000+ araç" (user-stated), no facility model, original team photo + pencil building; yorumlar = a deck that holds many Google reviews; final = garage photo further right.

## Direction contract
THESIS: The homepage is the car's service booklet, now paced as a run of different booklet pages (index tabs, coupon band, work-order copy, quote form, type plate, floor tabs, postcards, darkroom print, back cover) along one road. It refuses the row of rounded service cards and the dark showroom hero.
OWN-WORLD: DESIGN.md Service Booklet: navy cover with gold-foil double rules, stock #eef0f5, endpaper road with printed net, stamp violet ink, tipped-in plates, double-ruled stamp boxes, Besley / Archivo Narrow / Courier Prime, square corners; archive cream from the truck page on.
STORY: The owner sees the facade today, picks a service, sees an offer, reads the five signed quality lines, chooses a brand on the turntable and reads the free-diagnosis promise, checks the facility's type plate and floors, reads other owners' cards, then follows the car as it becomes the 1954 truck and drives into the old garage; the back cover holds every contact.
FIRST VIEWPORT (1440×900): menu bar; a strip of the sunny facade loop; a full-width navy band with gold foil edges holding the oval logo, the one-line h1 in light gold, the subheader and three stamp boxes (Randevu al primary, Ara, WhatsApp); below, the facade fills the frame and the 3D XC60 parks on the forecourt with the small Mercedes and VW; the road starts under the Volvo.
FORM: Service Booklet (index.html's world, inherited); structure chosen per section by the user from three subagent variants each. seed: none (no roll; inherited world from index.html, structure pinned by the user, who picked one of three subagent variants per section)
SIGNATURE: The 3D Volvo drives the printed road on scroll, passes under plates, stamps the work-order lines and the quote form, stands on the brand turntable as the picked brand, dissolves into the old Volvo truck on the cream heritage page and drives into the arsiv-08 garage door.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved
- Real copy for every section (Lorem/sample now), real campaign(s), real Google reviews and rating (sample data in assets/js/anasayfa/yorumlar.js).
- Brand turntable is hidden below 900px, as on index.html (the stage script only stops the car on the turntable on wide screens).
- Wording to confirm: "Kapımız 1954'ten beri açık", work-order and quote-form device copy.
- Booking backend, hosting.
