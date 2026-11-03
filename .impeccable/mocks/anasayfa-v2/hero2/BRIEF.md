# Hero, round 2: brief for the hero agents

The user does not like the current hero (`../hero/fragment.html`, `assets/css/anasayfa/hero.css`; see it live at
http://127.0.0.1:8020/gc-volan-1/anasayfa-v2.html, top of the page). Their feedback, 2026-11-03:

- The Volan logo appears three times very close together: the menu logo, the oval logo in the navy band, and the
  oval sign on the building photo. Fix this: **no logo inside the hero**. Avoid hero images where the oval VOLAN sign
  is large and near the top-left menu logo (crop or position images so it is not a third logo).
- The hero "doesn't look very good". Make it clearly better: an award-level composition, not a template.
- **No video** in the hero.
- **2–3 images that switch** (a slideshow / rotating set). One of the slides **must be a campaign ad** (kampanya).
  Its content can be the same as the kampanya section, but its design and image must fit the hero.

## The world (fixed)

Read `../_kit/BRIEF.md` first (the Service Booklet world, rules, truth rules, assets list) and
`../_kit/INTEGRATION.md` (the stage contract). All of it applies, with the changes above.

Key points from those files, restated:
- Navy cover board with gold-foil double rules, pale card stock, tipped-in photo plates (white border, slight
  rotation, the one paper shadow), violet rubber stamps and seals with the ink filter, double-ruled stamp-box buttons.
  Besley (titles, prose), Archivo Narrow (uppercase labels, buttons), Courier Prime (typed data). Square corners.
- No rounded corners, no gradients, no glass, no glow, no kicker/eyebrow labels above headings, no dark showroom.
- Turkish copy, short and simple. Mark sample campaign terms with a small typed "örnek" note.

## The 3D cars (must keep working)

The real page parks three 3D cars in the hero (a Volvo XC60, a Mercedes C-Class, a VW Golf; three-quarter view,
nose left; the XC60 is about 450px long at 1440 wide). The hero must contain
`<span class="park" data-park="volvo|mercedes|vw"></span>` (absolute, positioned in %), where each car stands. The
printed road starts at the Volvo's spot and leaves the hero downward to the **left lane** (centre ≈77px from the left
edge at 1440; 36px on phones). The canvas with the cars is under every `z-index: 2` element, so: put the cars where
no z-2 plate or text covers them, on something that reads as ground (a forecourt in a photo that stays put, the
paper itself, a printed ground strip). Think about what the cars stand on **while the images switch**: a car parked
on a photo forecourt looks wrong when that photo changes to another picture. In your mock, mark each park spot with
a dashed outline of the car's footprint labelled with the brand (mock only).

Current values for reference: Volvo park at left 54% / top 82% of the hero, Mercedes 81% / 79%, VW 82% / 91%.

## The slides

- 2 or 3 slides. Suggested set: (1) the brand promise "Aracınız bizim sorumluluğumuzda" + "Garanti süreniz bittiği
  için servis kalitenizi düşürmek zorunda değilsiniz." with Randevu al / Ara / WhatsApp; (2) the campaign;
  optionally (3) heritage "1954'ten beri" or the facility / the team. Copy may be rewritten short.
- The campaign (from the kampanya section): "Ücretsiz yol öncesi kontrol" — "Uzun yoldan önce lastik, fren ve
  sıvıları tek randevuda kontrol ediyoruz." Kapsam: lastik, fren, motor yağı, aydınlatma. Son gün 15.01.2027.
  Randevu al (WhatsApp) / Ara. Mark it "örnek kampanya". Available art: `assets/img/anasayfa/kampanya-jant-volvo.webp`
  (transparent wheel render) and its line drawing `kampanya-jant-volvo-cizgi.webp`, `kampanya-aku.webp`, plus
  everything in `/general-assets/3d-parcalar/` and photos in `/general-assets/gorseller/`.
- Images: use real photos from `/general-assets/gorseller/` (bina-varyant has sunny / blue hour / night facade
  incl. 21:9 crops; is-anlari-karakalem, nesne-karakalem, once-simdi, ekip-karakalem, kesik-ustalar,
  arsiv-restore) and `gc-volan-1/assets/img/` (is-*.webp workshop photos, hakkimizda-*.webp). Read folder READMEs.
- Switching: auto-advance (about 6–7 s) with visible manual controls (prev/next or index tabs, with the current one
  marked), pause on hover/focus, a visible pause/play control (auto-moving content needs one), keyboard reachable,
  `prefers-reduced-motion`: no auto-advance and no transition motion. One headline `<h1>` for the page; slide
  headings after it are not h1. Vanilla JS inline in the mock.
- The hero height: about one screen minus the menu (72px) at 1440×900; on phones it may be taller than the screen.

## What to deliver (only inside `.impeccable/mocks/anasayfa-v2/hero2/`)

- `vN.html` (your N is given in your task): a standalone mock started from `../_kit/template.html`, linking
  `../_kit/kit.css`. Include a stand-in of the site menu bar on top (copy the markup between `<!-- menu -->` and
  `<!-- /menu -->` from `gc-volan-1/index.html` and link `/gc-volan-1/assets/css/menu.css`; a static bar is fine) so the
  logo repetition can be judged. Draw the road leaving the Volvo spot down to the left lane. Root-absolute asset URLs
  (`/general-assets/...`, `/gc-volan-1/assets/...`). Works at 1440 and 390 wide (one breakpoint at 900px).
- `?slide=N` in the URL shows slide N statically (for screenshots).
- Screenshots in `shots/`: `vN-1440-s1.png`, `vN-1440-s2.png` (and `-s3`), `vN-390-s1.png`, `vN-390-s2.png`.
  Capture with the CDP script (true widths):
  `node /tmp/claude-1000/-home-gcagiran-Desktop-VolanDijital-gc-volan-1/539265e6-87a3-41a5-a0c4-c0249277168b/scratchpad/cdp-shot.mjs "<url>" <width> <out.png> [waitMs]`
  It captures the full page height (the viewport is resized to the page height before the shot, so do not size the
  hero only in vh/svh units without a max, or the shot is distorted; a `clamp(…, …, 1000px)` height is fine). Open every shot with the Read tool and fix what you see. Two
  look-and-fix rounds at least.
- `notes-vN.md`: 5–8 lines: the idea in one sentence, layout, slides and images used (paths), the switching
  interaction, where the cars park and why it works while slides change, mobile, what needs real content.

Do not edit anything outside `hero2/`. Do not start servers; port 8020 already serves `/home/gcagiran/Desktop/VolanDijital/`.
Report back in a few lines: the idea, files written, anything that failed.
