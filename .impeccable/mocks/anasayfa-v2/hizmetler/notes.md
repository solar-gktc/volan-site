# hizmetler — notes

All three: h2 "Hizmetlerimiz" with the idea "Tek noktadan servis". The 8 services are Bakım & Onarım, Yedek Parça, Araç Arıza Tespiti, Sigorta / Kasko Onarım İşlemleri, Elektronik Sistem Onarımları, Kaporta, Boya, Mekanik Onarım. Each service links to `/gc-volan-1/hizmetlerimiz.html#<slug>` (anchors taken from that page), and each variant also has a "Bütün hizmetler" link. The road is a straight left lane (x 150 at 1440, x 38 at 390); text starts at column 3 (or after a 64–80px pad on mobile). hizmetlerimiz.html already uses an exploded 3D car and white cards with part renders, so these teasers avoid that: pencil drawings, a printed work order, blueprint sheets. Service copy is short placeholder Turkish.

## v1 · Karakalem albümü (pencil album) — carousel
- Idea: the eight services as pencil drawings from the workshop, tipped in as an album strip that runs off the right edge of the page.
- Layout: the head on columns 3–12 (h2 and lead on the left; a typed counter "1 / 8", two stamp-box arrows and "Bütün hizmetler" on the right). Below it, a horizontal scroll-snap strip that starts at column 3. The plates have mixed widths (470/360/420/380), rotations and drops, with a typed caption inside each plate. Under each plate: the service name, one line of text, and "Ayrıntı →".
- Assets: `/general-assets/gorseller/is-anlari-karakalem/` (xc90-lift-altinda, turbo-tezgahi-volan, kafa-lambali-usta, pasta-cila, motor-bolmesinde) and `/general-assets/gorseller/nesne-karakalem/` (xc90-on, xc90-farlar-yanik, volvo-izgara), all `-1600.webp`.
- Interaction: the carousel. The buttons step one slide, swipe and trackpad work natively, the counter updates, and the arrows disable at the ends. Smooth scroll is off for reduced motion.
- Mobile: the head stacks; slides are 66vw so the next one peeks; the strip starts after the road pad.
- Road / 3D: the strip starts past the lane; the lane stays empty.
- Real content later: the drawing-to-service mapping is approximate. Kaporta and Sigorta use object drawings, because there is no pencil drawing of body work.

## v2 · İş emri (work order) — list
- Idea: "tek noktadan" as one printed work order. One form holds all eight jobs. Pointing at a line ticks its box and shows that job's workshop photo in the plate beside the road.
- Layout: a sticky portrait plate on columns 1–5. It overlaps the road lane, so the car passes under it. The form is on columns 6–12: a 4px double navy border on paper white; a head with "İş emri" and blank Plaka / Tarih fields; column labels Parça / İş / Kapsam; 8 ruled lines (part render chip, tick box, name in Besley, typed scope, arrow). The foot has a "TEK NOKTADA / bütün işler" stamp in a "Teslim" stamp box and a primary "Bütün hizmetler" stamp-box button.
- Assets: photos `/gc-volan-1/assets/img/is-*.webp` (8); part chips `/general-assets/3d-parcalar/cikti/png/{motor-volvo-drive-e, sasi-amortisor, elektrik-ecu, kaporta-on-kapi, elektrik-alternator, kaporta-camurluk, kaporta-motor-kaputu, fren-seti}.webp`.
- Interaction: hover or focus on a line ticks it (stamp-ink tick) and crossfades the plate photo and caption.
- Mobile: the plate goes on top (4:3, not sticky). The column labels and tick boxes are hidden; each line shows the chip, the name, the typed scope and the arrow. The Tarih field is hidden.
- Road / 3D: the plate sits on the lane; the text stays off it.
- Real content later: real per-service photos (some `is-*` photos match their service only loosely), and real scope lines.

## v3 · Dizin sekmeleri (thumb-index board) — boldest
- Idea: one navy board with eight thumb-index tabs cut into its fore-edge. Turning a tab opens that service's leaf: a blueprint of the part it touches, a workshop photo tipped in over the board's edge toward the road, and the service name in large light-foil type.
- Layout: the board is on columns 3–11 with the double foil frame. Its head is "Hizmetlerimiz" plus "Tek noktadan servis: sekiz iş, tek teslim, tek muhatap." The 8 tabs stick out of the right edge, in stock-deep; the open tab is navy and joins the board. The panel has two columns: the blueprint sheet with the photo plate below it, pushed 176px out past the board's left edge; then the name, body, a typed scope list on foil rules, and Ayrıntılar (primary, to `#slug`) / Bütün hizmetler.
- Assets: `/general-assets/3d-parcalar/cikti/blueprint/{motor-volvo-drive-e, motor-volvo-drive-e-patlatma, elektrik-ecu, kaporta-on-kapi, elektrik-kablo-demeti, kaporta-camurluk, kaporta-motor-kaputu, fren-seti}-blueprint.webp`; photos `/gc-volan-1/assets/img/is-*.webp`.
- Interaction: ARIA tabs (click; arrow keys, Home, End). The new leaf slides in 18px from the fore-edge (340ms ease-out). There is no slide for reduced motion.
- Mobile: the tabs become a row of folder tabs above the board's top edge (horizontal scroll). The board bleeds off the right edge. The panel stacks: text, then the sheet with the photo plate hanging out over the road.
- Road / 3D: the board stays clear of the lane; only the photo plate reaches over it, so the car passes under the plate.
- Real content later: real scope items per service. The panels currently use invented sample scopes (e.g. "Bilgisayarlı test", "Eksper görüşmesi"), which should be confirmed with Volan.

## Integration (chosen: v3 Dizin sekmeleri)
- Files: `hizmetler/fragment.html` (`<section class="entry s-hizmetler" id="hizmetler" data-lane="left">` with `.entry__inner`), `assets/css/anasayfa/hizmetler.css`, `assets/js/anasayfa/hizmetler.js` (ARIA tabs; no slide-in with reduced motion).
- Lane check (real geometry, harness): at 1440 the road spans x ≈ 2–152 and the board starts at x 309; at 390 the road spans x ≈ 9–63 and the board starts at x 80. The board never covers the lane. The workshop photo plate (z 2) hangs out past the board's left edge: at 1440 it ends about 50px short of the road; at 390 it lies over the road. Section padding is 144px top and bottom, so the board stays out of the crossing zones.
- Assets: 8 blueprint sheets copied to `assets/img/anasayfa/hizmetler-<part>-blueprint.webp` (1120×700, q80, + `.json`). The workshop photos are the existing `assets/img/is-*.webp`. Images in the 7 hidden panels load lazily.
