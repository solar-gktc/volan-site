# Homepage v2 — section design brief (shared by all section agents)

## Goal

Volan Otomotiv's homepage gets a new content order (user sketch, 2026-11-03). Each section gets **three materially different design variants** as standalone mock pages. The user will pick one variant per section; the picks are then assembled into `anasayfa-v2.html`. **The design is what matters. Exact copy and images are not important** (Lorem ipsum or short placeholder Turkish copy is fine), but the design of the content must be excellent: an award-level, distinct composition, not a template.

## New page order (the road snakes down the page through all of it)

| # | Slug | Section | Road / 3D car lane at this section |
|---|------|---------|-----------------------------------|
| 1 | `hero` | Banner: image + text (pinned content, see below) | Car parks at lower right of the banner; road starts under it |
| 2 | `hizmetler` | Hizmetlerimiz — "Tek noktadan servis". The sketch says "list or image carousel" | Road on the **left** |
| 3 | `kampanya` | Kampanya alanı (campaign / offer area) | Road crosses to the **right** |
| 4 | `kalite` | Hizmet kalitesi — 5 adım (five quality steps) | Road on the **left** |
| 5 | `marka` | Marka uzmanlığı (Volvo, Mercedes-Benz, Volkswagen) on a round turntable the car drives onto, **plus** a box with a 3-step promise: Ücretsiz tespit → Teklif → Onayınızdan sonra işlem | Road runs into the turntable (centre-left), box to the right |
| 6 | `istatistik` | İstatistik / kalite tablosu (figures table) | Road on the **right** |
| 7 | `tesis` | Tesis modeli (3D model of the facility) | Road on the **right**, then crosses left below |
| 8 | `yorumlar` | Müşteri yorumları (three reviews) | Road crosses above, then runs on the **left** |
| 9 | `miras` | Kamyon dönüşümü — tarih, miras (the car dissolves into the old Volvo truck here) | Road on the **left** |
| 10 | `final` | The end box: the truck drives into the 1954 garage door; contact details beside it | Road curves right into the garage |

The removed section: the warning-lamp ("Uyarı lambaları") section is gone.

The 3D car (Volvo XC60) drives this road on scroll in the real page, rendered on a fixed canvas above the paper and below plates/text, so it passes *under* plates. In your mock, draw only the road band in its lane (see `_kit/template.html`); keep the lane free of text, and put images near the turn so the car can pass behind them. Text sits on the side away from the road.

## The world (fixed — do not invent a new one)

Read before designing: `../../../../DESIGN.md` (the "Service Booklet" system), `../../../../PRODUCT.md` (facts and evidence rules), `assets/css/site.css` (the live code; it is the truth where it differs from DESIGN.md: stock is `#eef0f5`, the road is cut down to the endpaper with a printed net), and the craft floor: `/home/gcagiran/.claude/plugins/cache/impeccable/impeccable/4.8.0/skills/impeccable/reference/craft-floor.md`.

Look at the current homepage for the incumbent look: `http://127.0.0.1:8020/gc-volan-1/index.html` (also `hizmetlerimiz.html`, `hakkimizda.html` — these newer pages show how far the world has been stretched; you may borrow their ideas).

Materials: navy cover board with gold-foil double rules; pale card stock; tipped-in photo plates (white border, slight rotation, the one paper shadow); violet-blue rubber stamps and round seals with the ink filter; double-ruled stamp-box buttons; Besley (titles, prose), Archivo Narrow (uppercase form labels, buttons), Courier Prime (typed record data: numbers, phones, captions). Square corners everywhere.

You may **extend** the world inside its logic (booklet pages, tabs, carbon copies, receipts, work orders, index cards, file folders, perforations, ledger tables, the navy cover used as a full-bleed section, archive cream for old material). Pages in a service booklet vary a lot; use that range. Vary density and scale between variants: one variant should be clearly the boldest.

Rules:
- No rounded corners, no gradients (except the existing road/podium), no glass, no glow, no dark showroom backdrop.
- No kicker/eyebrow label above headings (ban). No section numbers unless the sequence means something (the 5 steps may be numbered).
- No row of identical icon+heading+text cards as the structure. No hero-metric template (big number + small label row) unless reworked into the booklet's own form (e.g. an odometer, a typed ledger, a stamped table).
- Foil gold `#857244` is lines only; text on navy is `#cdb585` or stock.
- Only shadow: plate on stock.
- Icons: authored SVG, one stroke weight. No emoji.
- Motion: one meaningful interaction per variant at most (e.g. a carousel, a stamp pressing in, a tab turning); vanilla JS inline; honour `prefers-reduced-motion`.
- Turkish copy. Keep it short and simple.

## Truth rules (from PRODUCT.md)

- Facts you may use as real: founded 1954; Volvo authorized service for many years (no years); "Volan Otomotiv" since 2017; facility 1.800 m²; 25 employees; 5 lifts; brands Volvo, Mercedes-Benz, Volkswagen; services Bakım & Onarım, Yedek Parça, Araç Arıza Tespiti, Sigorta / Kasko Onarım İşlemleri, Elektronik Sistem Onarımları, Kaporta, Boya, Mekanik Onarım; address, phones, hours (see PRODUCT.md).
- Anything else (customer counts, ratings, prices, campaign terms, testimonials) is placeholder: use Lorem ipsum or obviously sample values, and mark sample reviews/campaigns with a small typed "örnek" note. Never invent a year for an archive photo; caption undated archive plates "Arşivden, tarihsiz: …".

## Assets (use them well — this is a main point of the task)

Serve root: `http://127.0.0.1:8020/` = `/home/gcagiran/Desktop/VolanDijital/`. Reference assets with root-absolute URLs (`/general-assets/...`, `/gc-volan-1/assets/...`, `/facility-modelling/...`). Read-only: never edit, move or copy source files. Each folder has a README.md; read the ones you use. Prefer the `-1600.webp` or `.webp` files.

- `/general-assets/gorseller/bina-temiz/` — the facade, cleaned (no cars/people). `bina-varyant/` — the same facade sunny, blue hour, night (incl. 21:9 hero crops).
- `/general-assets/gorseller/arsiv-restore/` — 13 restored archive prints (sepia "restore" and AI-coloured "renkli"; prefer restore). arsiv-06 = truck with child (J.M. Keith), arsiv-08 = Anadolu Volvo Yetkili garage with open door, arsiv-11 = Volvo dealer facade, arsiv-12 engine overhaul hall, arsiv-13 car on lift.
- `/general-assets/gorseller/once-simdi/` — then/now pairs (facade, workshop lift, engine), vertical and horizontal.
- `/general-assets/gorseller/ekip-karakalem/` — team as realistic pencil drawings (standing, kneeling, small group; also `-lacivert` navy versions).
- `/general-assets/gorseller/is-anlari-karakalem/` — pencil drawings of work: under the car, head torch, lift, engine bay, polishing, timing chain, turbo bench with VOLAN sign, XC90 on lift.
- `/general-assets/gorseller/nesne-karakalem/` — pencil drawings without people: facade, entrance "since 1954", VOLAN sign, Volvo grille, XC90 front/headlights/on lift, engine, workshop.
- `/general-assets/gorseller/kesik-ustalar/` — transparent PNG/WebP cut-outs of mechanics and the full team (can stand on the page).
- `/general-assets/Photos-1-001/` — 51 original 6000×4000 photos (huge; use only if nothing else fits, and prefer the derived files).
- `/general-assets/3d-parcalar/cikti/png/` — studio renders of parts: engines (volvo-drive-e, vw-ea888-tsi, mercedes-om654, plus `-patlatilmis` exploded), wheels per brand (`jant-volvo/vw/mercedes`), brake set, body panels (door, bonnet, fender), chassis, electrics (battery, alternator, ECU, harness). Light (`.webp`, transparent) and `-dark` (on navy) versions. `blueprint/` — the same parts as technical line drawings on navy sheets (`-blueprint`) or lines only (`-cizgi`). `turntable/*.mp4` — 360° spins on stock. `glb/` — web 3D models (meshopt; three.js needs MeshoptDecoder).
- `/general-assets/video/` — `cephe/` facade loops (sunny clouds, blue hour, night), `karakalem/` pencil drawings drawing themselves, `once-simdi/` archive→today wipes, `3d-reel/`. Every clip has `-poster.webp`.
- `/facility-modelling/assets/volan-building.glb` (8.2 MB, Y-up metres, not compressed), `/facility-modelling/assets/renders/*.jpg` (exterior, cutaway, exploded, front, main, lower, upper, top, mek1, mek2, office, ramp, stairs, entry), `/facility-modelling/HANDOFF.md` (what the model shows), `/facility-modelling/viewer/app.js` (a working three.js viewer you can learn from).
- Already in the site: `/gc-volan-1/assets/img/` (service photos, `is-*` and `parca-*` used on hizmetlerimiz.html, archive crops), `/gc-volan-1/assets/video/`, `/gc-volan-1/assets/models/`, `/gc-volan-1/brand/logo-oval.svg` and `logo-horizontal.svg`, three.js at `/gc-volan-1/assets/vendor/three.bundle.min.js` (import map `{"imports":{"three":"/gc-volan-1/assets/vendor/three.bundle.min.js"}}`; check what it exports before relying on loaders).

## Output (write only inside your own section folders)

For each of your sections, in `.impeccable/mocks/anasayfa-v2/<slug>/`:
- `v1.html`, `v2.html`, `v3.html` — start from `../_kit/template.html`, link `../_kit/kit.css`. One section per page at full width, as it would sit in the page (the road band drawn in its lane). Each must work at 1440 and at 390 wide (one breakpoint at 900px).
- `shots/v1-1440.png`, `shots/v1-390.png`, etc. Capture with headless Chrome, e.g.
  `google-chrome --headless=new --hide-scrollbars --window-size=1440,1400 --virtual-time-budget=5000 --screenshot=<abs path>.png http://127.0.0.1:8020/gc-volan-1/.impeccable/mocks/anasayfa-v2/<slug>/v1.html`
  (pick a window height that fits the whole section; for 390 use e.g. 390,2400). Settle entrance motion first (render the end state when `?shot` is in the URL, or make the resting state the visible one). Open every shot with the Read tool and fix what you see: overlap, clipping, text in the road lane, bad contrast, broken images. Two look-and-fix rounds.
- `notes.md` — per variant, 4–6 lines: the idea in one sentence; layout; assets used (paths); the interaction; mobile behaviour; how it relates to the road/3D car; what would need real content later.

Do not edit anything outside your section folders (not index.html, not assets/, not DESIGN.md, not _kit/). Do not start servers; port 8020 is already serving. Report back: per variant one line (name + idea) and anything that failed.
