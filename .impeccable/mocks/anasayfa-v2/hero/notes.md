# hero — notes

All three: a plain navy 72px strip stands in for the site menu. Pinned content is present in each: building image, oval logo, h1 "Aracınız bizim sorumluluğumuzda", the subheader, stamp boxes Randevu al (primary) / Ara / WhatsApp. The 3D parking area is a faint dashed outline labelled "3D araçlar" with three slots (Volvo XC60 large, Mercedes and VW small); the road band starts under the Volvo slot and leaves the banner downwards. Screenshots use `?shot`, which holds the video on its poster frame.

## v1 · Pencereli kapak (die-cut cover)
- Idea: a short navy cover with an oval window die-cut into it (the shape of the building's own sign). Through the window you see the facade at blue hour. Below the short cover the first leaf shows, and that leaf is the forecourt where the cars park.
- Layout: the cover takes the top 61% of the banner, with the gold foil frame. Logo, h1 (light foil gold) and subheader sit on the left. The oval window is on the right, with a double foil ellipse around it and a foil seal "1954" pressed on its rim. On the stock below: ink stamp boxes and a typed phone/hours line on the left, parking on the right.
- Assets: `/general-assets/video/cephe/cephe-mavi-saat-loop.mp4` (+ `-poster.webp`), `/gc-volan-1/brand/logo-oval.svg`.
- Interaction: the facade loop only (lit windows breathe, slow sky). Paused for reduced motion and `?shot`.
- Mobile: the cover stacks (logo, h1, sub, then the oval window full width). The forecourt follows with the buttons, then the parking area, with the road starting under the Volvo slot.
- Road / 3D: the cars stand on stock, not on navy (the stage sits under the cover). The road starts under the Volvo and goes down-left, out of the banner.
- Real content later: the clip-path ellipse is the die-cut. If the window should match the logo oval exactly, use the logo's outer path as an SVG clipPath.

## v2 · Çizimden cepheye (drawing to facade)
- Idea: no cover at all. The banner opens on light stock. The facade is printed on the page as a pencil drawing, and a seam turns it into today's sunny photo.
- Layout: text on columns 1–5 (logo, navy h1, subheader, ink stamp boxes, typed phone/hours). The 3:2 figure runs from column 6 off the right edge, flush with the menu. The figure is printed on the paper (multiply, a hairline rule on the left and bottom, no plate border), so the cars park on its drawn forecourt.
- Assets: `/general-assets/gorseller/nesne-karakalem/bina-cephe-1600.webp` and `/general-assets/gorseller/bina-varyant/bina-gunesli-1600.webp`. I checked that they line up pixel for pixel (same master, same 1600×1067 frame).
- Interaction: a native range input over the figure moves the seam (`aria-valuetext` "Çizim %N, fotoğraf %M"). The handle is the system's round then/now handle (navy disc, double light-gold ring). It rests at 54%.
- Mobile: the figure goes first at full width, then the text, then the parking area on stock.
- Road / 3D: the road starts under the Volvo slot on the figure's forecourt and leaves downwards.
- Real content later: nothing.

## v3 · Kuşak (belly band) — boldest
- Idea: the whole banner is the facade on a sunny day, printed full bleed on the leaf. A navy band with gold foil edges wraps across it, like the paper band around a new booklet. The 3D cars park on the real forecourt in the photo, in front of the entrance.
- Layout: the facade video covers the banner. The band sits 56px under the menu, so a strip of sky shows above it. Inside the band: logo on the left; the h1 on one line in light foil gold (60px); the subheader below it, and the three stamp boxes on the right. The VOLAN sign shows just under the band. A typed tag "Bugün · Şaşmaz Oto Sanayi Sitesi, Etimesgut" sits at the lower left.
- Assets: `/general-assets/video/cephe/cephe-gunesli-bulut-loop.mp4` (+ poster), `/gc-volan-1/brand/logo-oval.svg`.
- Interaction: the facade loop only (clouds drift). Paused for reduced motion and `?shot`.
- Mobile: the band stacks first (logo, h1 on two lines, sub, buttons), then the photo at 460px tall with the parking area on its forecourt.
- Road / 3D: the photo is paper level (z 0), so the stage draws the cars over it. The road is cut into the photo from under the Volvo and goes down.
- Real content later: check the car scale against the ground floor in the photo. The Volvo should look parked at the entrance, not oversized.

## Integration (chosen: v3 Kuşak)
- Files: `hero/fragment.html` (`<header class="banner s-hero" id="icerik">`), `assets/css/anasayfa/hero.css`, `assets/js/anasayfa/hero.js`.
- Changes from the mock: the menu stand-in strip, the road SVG and the dashed parking markers are gone. The banner height uses `var(--menu-h, 72px)`. The video has no z-index (paper level), so the cars draw over it; the band and the photo tag are z 2. The video has no `autoplay`: `hero.js` plays it while the banner is on screen and pauses it off-screen. With reduced motion or without JS, the poster stays.
- Park spots: the three `.park` spans are inside the photo figure. Wide: Volvo 62%/85% (the forecourt in front of the entrance), Mercedes 87%/83%, VW 89%/95%. Narrow (photo 460px tall): Volvo 40%/84%, Mercedes 80%/72%, VW 82%/93%. These are placed from the photo only; tune them once the real 3D cars render.
- Assets: `assets/video/cephe-gunesli-bulut-loop.{mp4,webm}` already existed. I added the missing poster, `assets/video/cephe-gunesli-bulut-loop-poster.webp` (+ `.json`), from `general-assets/video/cephe/`, re-encoded at q80.
- Not done: there is no stop control for the film. DESIGN.md asks for one on moving films, but the chosen mock had none and the user asked for no design changes.

## Replaced by hero2 v2 · Etiketli baskı (2026-11-03)
- The user picked hero2 v2 with changes: arrows at the print edges, dots at its foot, no index list, no pause button, and the whole facade on slide 1. See `../hero2/notes-v2.md`.
- Files: `hero/fragment.html`, `assets/css/anasayfa/hero.css`, `assets/js/anasayfa/hero.js` (all replaced). New images (each with a `.json` sidecar): `assets/img/anasayfa/hero-cephe-genis.webp`, `hero-cephe-dar.webp`, `hero-atolye-genis.webp`, `hero-atolye-dar.webp`, `hero-jant.webp`. The line drawing reuses `kampanya-jant-volvo-cizgi.webp`.
- `header.banner.s-hero { min-height: 0 }` cancels the `.menu ~ .banner` min-height from menu.css. On wide screens the JS freezes the hero height in px (re-measured only when the width changes).
- The page h1 is visually hidden ("Volan Otomotiv · Ankara'da Volvo, Mercedes-Benz ve Volkswagen servisi"); the slide titles are h2. The `#tick` symbol from the page defs is used in the campaign list.
- Park spots were placed from the layout only; tune them with the real cars.
