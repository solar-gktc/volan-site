# miras — Kamyon dönüşümü, tarih, miras

All three: road straight down the left lane (x = inner left + 54 desktop, 36 mobile), drawn by a small script from the section size. Text stays right of the lane; archive plates sit on or next to the lane so the car→truck passes under them. Only facts used: 1954 "Volan Küçükyılmaz", Volvo Yetkili Servisi "uzun yıllar" (blank year: four underlines), 2017 "Volan Otomotiv", today (brands, 1.800 m², 25 kişi, 5 lift). Every archive caption: "Arşivden, tarihsiz: …". Link goes to `/gc-volan-1/hakkimizda.html`. `?shot` or reduced motion shows the end state.

## v1 — Kayıt defteri (quiet)
- Idea: the booklet's name-and-status register; each name change is a ruled row with its own rubber stamp, today's row gets the round seal.
- Layout: cols 1–5 two tipped-in plates (arsiv-06 portrait, arsiv-12 overlapping it); cols 7–12 heading, lead, the 4-row register form, a typed note on the missing Volvo years, "Hikâyenin tamamı" stamp button. The page ages from stock to cream with the existing `.aging` multiply ramp (22% → 68%).
- Assets: `/general-assets/gorseller/arsiv-restore/arsiv-06-…-restore-1600.webp`, `arsiv-12-…-restore-1600.webp`.
- Interaction: the four stamps press in one after another when the register enters view.
- Mobile: plates first (78% / 70%), then text with 64px road pad; register becomes 2 columns, stamps drop under each entry.
- Real content later: final lead copy; whether "Sayfa 1/1" stays.

## v2 — Albüm yaprağı
- Idea: the section is a reverse-turned leaf: a printed cut edge (2px rule + one page-block band) turns the stock into archive cream with no ramp, and the archive is mounted in an album with paper photo corners.
- Layout: cols 1–8 a loose album of five mounted prints at mixed angles; cols 9–12 heading, short text, a 4-line lineage list, link, note "Fotoğrafların tarihleri kayıtlı değil."
- Assets: arsiv-06, arsiv-07, arsiv-05, arsiv-02 (restore-1600); then→now wipe film `/general-assets/video/once-simdi/once-simdi-cephe-wipe-loop.{webm,mp4}` + `-poster.webp`.
- Interaction: the then/now film plays muted in its plate with an "Oynat / Durdur" stamp-box control; pauses off-screen; no autoplay in reduced motion.
- Mobile: album becomes a 2-column grid (two portraits side by side, landscapes full width), text below.
- Real content later: film is the AI-cleaned facade (`bina-temiz`), see its README; corner colour could be checked against print.

## v3 — Büyütme (boldest)
- Idea: a darkroom enlargement: one archive print blown up to 7 columns on an easel with navy crop blades, a film contact sheet beside it to pick the frame, and the lineage set big across the page.
- Layout: cols 1–7 the enlargement (arsiv-06 at 4:5, over the road lane); cols 8–12 a 72px ceremonial heading, lead, navy-deep contact sheet with perforations (6 frames numbered by archive number); below, cols 3–12 a four-step lineage band (1954 → blank → 2017 → Bugün) with authored arrows and the seal; typed note + link.
- Assets: arsiv-06, 05, 07, 11, 12, 13 (restore-1600).
- Interaction: choosing a frame swaps the enlargement, which "develops" from pale/blurred to sharp (700–900ms); a grease-pencil box marks the chosen frame (`aria-pressed`).
- Mobile: enlargement full width, heading 40px, contact sheet 3×2 (numbers only), lineage stacks vertically with down arrows.
- Real content later: final heading/lead; frame captions.

## Integration (chosen: v3 Büyütme)
- Files: `miras/fragment.html`, `assets/css/anasayfa/miras.css`, `assets/js/anasayfa/miras.js`; assets `assets/img/anasayfa/miras-arsiv-{06,05,07,11,12,13}.webp` (enlargement, ≤1430px wide, no upscale) and `…-kare.webp` (480px contact-sheet thumbs), each with a `.json` sidecar.
- Root: `<section class="entry s-miras" id="miras" data-lane="left" data-truck>`. No own road, no own aging/cream: the page-level `.aging` layer does it.
- Changes from the mock: road removed (stage draws it); film perforation and grease-pencil defs are section-local (`#miras-perf`, `#miras-pick`); lineage arrows are CSS (`::after`, inline SVG data URI) instead of SVG children of the `<ol>`; mobile text clears the real 54px lane with a 48px pad; mobile seal moved up off "tek servis". `?shot` switch removed; reduced motion swaps frames without the develop effect.
- Checked in `_kit/harness.html?s=miras` at true 1440 and 390 (`shots/final-*.png`): big print over the lane (z 2) as intended, all text right of the lane.
