# Kampanya — notes

All three variants show 2 sample campaigns by default. Add `?n=1` or `?n=3` to the URL to see one or three (a small "Mock · kampanya 1 2 3" switch sits at the lower left; it is hidden with `?shot`). Extra shots: `shots/vX-1440-n1.png`, `shots/vX-1440-n3.png`. All campaign content, terms and dates are samples and are marked "örnek" in typed text. Every "Randevu al" opens `https://wa.me/905337653378` with a prefilled message naming the campaign.

Part renders get a small SVG alpha filter (`#cut`) that removes the wide, faint contact-shadow haze in the `.webp` files; without it the haze shows as a grey box on paper.

## v1 — Kupon sayfası (coupon sheet)
- Idea: a sheet of tear-off coupons tipped into the booklet; each offer is one coupon with a navy stub that carries the offer word ("Ücretsiz", "%20") in light foil gold.
- Layout: heading and note on columns 1–3 (sticky on desktop); the sheet on columns 4–10, slightly rotated, with perforations (holes show the stock) between stub and body and between coupons, plus a scissors icon. The part render breaks out of each coupon's upper right corner. A round seal sits under the intro text.
- Assets: `/general-assets/3d-parcalar/cikti/png/elektrik-aku.webp`, `jant-volvo.webp`, `fren-seti-lacivert.webp`.
- Interaction: on hover/focus a coupon tilts and lifts as if it is coming away along its perforation.
- Mobile: the stub turns into a horizontal navy strip above each coupon; checks go to one column; the road runs on the right with a 60px pad.
- Road/car: the road crosses from the left lane to the right at the top of the section; the first coupon's battery overlaps the crossing so the car passes under it. The sheet stops at column 10, clear of the lane.
- Real content later: campaign names, terms, dates, coupon numbering scheme.

## v2 — Kapak bandı (cover band) — boldest
- Idea: the navy cover board breaks into the page as a band from the left edge of the screen up to the road, with a perforated right edge beside the lane. One huge foil-gold offer word, a giant part render that breaks out of the band, the part's blueprint line drawing behind it in light foil gold.
- Layout: band width = up to 150px short of the inner right edge; text on the left 7/12, part on the right 5/12; terms as a typed label/value list; the last day in a double-ruled foil box; primary "Randevu al" + "Ara".
- Assets: `png/jant-volvo.webp`, `png/elektrik-aku.webp`, `png/fren-seti-gumus.webp`; line art as CSS masks: `blueprint/jant-volvo-cizgi.webp`, `elektrik-aku-cizgi.webp`, `fren-seti-cizgi.webp`.
- Interaction: with 2–3 campaigns, index tabs on the band's top edge switch the offer (ARIA tabs, arrow/Home/End keys); the panel fades up and the part slides in. One campaign: no tabs.
- Mobile: the band takes the width minus 92px for the road; the part sits above the title; tabs wrap.
- Road/car: the band never covers the lane (the car canvas is under z 2, so a covered lane would hide the car). The wheel overlaps the crossing above the band.
- Real content later: campaign texts; the band background could carry a seasonal colour only if the brand allows (not proposed here).

## v3 — Servis biletleri (service tickets)
- Idea: each offer is a tall punched ticket dealt onto the page beside the service advisor, who stands on the page with his phone (a transparent cut-out). A "GEÇERLİ · VOLAN" rubber stamp presses across each ticket's tear line.
- Layout: heading, text and the standing advisor (with typed phone number) on columns 1–3; tickets on columns 4–10, fanned at -2.2/1.6/-0.8deg with staggered drops. One campaign: a single, larger ticket.
- Assets: `/general-assets/gorseller/kesik-ustalar/yonetici-telefon-ayakta.webp`, `png/jant-volvo.webp`, `elektrik-aku.webp`, `fren-seti-lacivert.webp`.
- Interaction: IntersectionObserver presses the stamp into each ticket as it comes into view (staggered 220ms). Reduced motion and `?shot`: stamps already applied.
- Mobile: advisor at 300px tall under the text; tickets stack (268px wide).
- Road/car: crossing at the top; tickets end at column 10, the right lane stays empty.
- Real content later: campaigns, ticket numbers; a real photo cut-out of the advisor is already real (team photo).

## Integration (chosen: v2) — 2026-11-03
- Part: `kampanya/fragment.html`, `assets/css/anasayfa/kampanya.css` (scoped `.s-kampanya`), `assets/js/anasayfa/kampanya.js` (tabs).
- Mock-only `?n=` switch and road script removed. The number of campaigns comes from the markup: one `.panel` hides the tab row; two or three panels with matching `.tab` buttons become ARIA tabs. The fragment ships two sample campaigns; a comment in it says how to add the third (its assets are already copied).
- Real lane: the band's right edge is `100px − 0.2 × gap` short of the measure (≈1263px at 1440; the lane starts ≈1288px). Narrow: 56px short of the measure (≈314px at 390; the lane starts ≈327px). Section top padding 216px (208px narrow), so the tabs start below the crossing zone.
- Part renders are pre-processed copies with the faint shadow haze removed from their alpha (the mock's SVG `#cut` filter is not in the page). Line art is a mask set inline on `.art__line` (page-relative URL).
- Checked at true 1440 and 390: `shots/final-1440.png`, `shots/final-390.png`.
