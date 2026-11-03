# marka — notes

All three variants share these rules. The road comes down the left lane, turns right, and runs into the podium centre-left. It leaves from the podium's foot and turns to the right lane at the bottom, ready for `istatistik`. The podium is drawn by inline JS from the empty `[data-bay]` grid cell, using the live page's geometry: `main.js` `drawStage()`, `BAY_ELEVATION` 0.42, `STAGE_RIM` 0.3, the same gradients and the `.podium__*` styles. Its top is empty, for the car. An ink arrow is drawn in the road SVG from the podium to the promise box. Below 900px the podium and arrow are hidden, as on the live page (`.bay { display: none }`). The road then runs down the left edge and crosses right at the bottom of the section. The one interaction in each variant is the brand switch (radio inputs). `?shot` changes nothing because there is no entrance motion. The resting state is the visible state.

## v1 — Teklif formu (calm)
- Idea: the promise is a filled-in service form: three numbered rows with tick boxes, a blank "Tutar … TL" field (no price), a signature line, and the stamp "Onayınız olmadan işlem yok".
- Layout: heading and stamp-box brand buttons on the right, top (cols 8–12). A wheel plate sits above the road's turn (cols 3–5). The podium is on cols 3–6. The brand note is under the podium, left of the exit road (cols 1–3). The form plate is on the right (cols 8–12), and the arrow runs from the podium to the form.
- Assets: `/general-assets/3d-parcalar/cikti/png/jant-volvo.webp`, `jant-mercedes.webp`, `jant-vw.webp` (they swap with the brand).
- Interaction: the brand buttons change the wheel plate, its caption and the brand note.
- Mobile: one column with a 72px pad on the road side. Order: heading, note, wheel, form.
- Later: real brand copy, and confirmation that "Ücretsiz tespit" applies to every job.

## v2 — Dosya ve iş emri (medium)
- Idea: brands are a navy file folder with three tabs. Each tab holds that brand's engine as a white line drawing. The promise is a carbon-copy work order: the original, a blue "2. nüsha · arşiv" and a cream "3. nüsha · atölye" fanned behind it. Each step has a carbon-typed line and a "Paraf" box. Steps 1 and 2 are initialled, step 3 waits for the customer.
- Layout: a large regular-weight heading top-left, above the road's turn (cols 3–7). The folder is top-right (cols 8–12). The podium is cols 3–6, the work order is cols 8–12 below it, and the arrow runs from the podium's foot to the work order. The seal is stamped on the "Servis danışmanı" line.
- Assets: `/general-assets/3d-parcalar/cikti/blueprint/motor-volvo-drive-e-cizgi.webp`, `motor-mercedes-om654-cizgi.webp`, `motor-vw-ea888-tsi-cizgi.webp`.
- Interaction: the folder tabs switch the sheet.
- Mobile: one column. The folder sits 40px in from the left. In the work order, the "Paraf" box moves under each row.
- Later: the copy labels ("arşiv", "atölye") are only a design device. Check how Volan really handles work orders before keeping the "üç nüsha" line.

## v3 — Söz koçanı (boldest)
- Idea: giant Besley brand names are the selector, and the chosen one is boxed in a double rule. The promise is a navy cover board bled to the right page edge. On it, the gold headline "Onayınız olmadan işe başlamayız." sits over a three-coupon tear-off stub, with perforations, scissor marks, 96px numerals and a signature line. A foil seal is pressed on the board.
- Layout: the heading and the large names are top-left (cols 3–7), and the brand note and stamp are below them. An exploded-engine plate is top-right. The podium is bigger (cols 2–6). The board runs from col 8 to the viewport edge, and a short ink arrow runs from the podium to the board.
- Assets: `/general-assets/3d-parcalar/cikti/png/motor-volvo-drive-e-patlatilmis.webp`, `motor-mercedes-om654-patlatilmis.webp`, `motor-vw-ea888-tsi-patlatilmis.webp`.
- Interaction: the brand names switch the engine plate and the note. Only Volvo gets the "Uzun yıllar Volvo yetkili servisi" stamp. Mercedes-Benz and Volkswagen get a plain typed scope line.
- Mobile: the names shrink to 8.4vw so "Mercedes-Benz" fits on one line. The board goes full width, edge to edge, and the car passes under it.
- Later: real brand copy. Turntable videos (`turntable/*.mp4`) could replace the engine plate if motion is wanted. They were not used, to keep one interaction per variant.

## Integration (picked: v1, with the user's change)
- Files: `marka/fragment.html`, `assets/css/anasayfa/marka.css` (everything under `.s-marka`), `assets/js/anasayfa/marka.js` (ES module; the brand switch only).
- The user's change: the wheel plate became a navy blueprint sheet with the brand's engine line drawing. The sheet has a faint gold grid, a hairline frame, and a title block ("VOLAN | Volvo · Drive-E"). It swaps with the picker.
- Assets: `assets/img/anasayfa/marka-motor-volvo|mercedes|vw.webp`. Each is cropped to its drawing and resized to 900px, WebP q80 with alpha, with `.json` sidecars. Source: `general-assets/3d-parcalar/cikti/blueprint/motor-*-cizgi.png`.
- My podium drawing is removed. `<div class="bay" data-bay>` sits on cols 3–6, row 2. The stage script draws the podium there, and the road runs through the bay's centre x. The ink arrow is now an inline SVG inside the bay, pointing at the form; it hides below 900px with the bay.
- The picker is `fieldset[data-brands]`, with radios `name="marka"` and values `volvo|mercedes|vw`.
- The ticks on steps 1–2 and the stamp use `data-stamp`, so they press in as the car passes.
- The engine sheet sits over the road's vertical run above the podium. It is a z 2 plate, so the car drives under it onto the turntable. The brand note (cols 1–3) and the form (cols 8–12) are clear of the lane.
- Mobile: the text has a 52px pad on the road side. The form stamp moved inside the viewport, because its pre-press scale made the page overflow to 418px.
- Check shots: `shots/final-1440.png` and `shots/final-390.png`, both in the `&stamped` state.
