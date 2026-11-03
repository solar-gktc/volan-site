# Tesis — notes

Road: right lane (x = page width − lane inset, as in `main.js`); the crossing to the left lane starts at the foot of the section. The road path is computed in px by a small inline script (same lane maths as `main.js`: inset `max(26, inner.left × 0.8)`, 36px on phones, 150px corner radius). Road width on phones is 56px (live site computes ~54px), not the kit's 84px.

Shared file: `tesis-model.js` (used by v2 and v3). Lazy-loads three.js (`/gc-volan-1/assets/vendor/three.bundle.min.js` via import map: it exports GLTFLoader and RoomEnvironment, but no OrbitControls, so the module has its own drag-to-turn) and `/facility-modelling/assets/volan-building.glb` when the section is 900px from the viewport. Orthographic camera (axonometric drawing), transparent canvas on paper, render on demand, HTML zone pins projected from the GLB zone bounding boxes. `?shot` loads at once; `?zone=<id>` and `?cut=1` set a state for checking. Without WebGL2, or if loading fails, the render image stays and the status line says so (checked with `--disable-3d-apis`).

## v1 — Kat sekmeleri (no WebGL)
- Idea: a booklet page with thumb-index tabs, one floor per tab, built from the renders.
- Layout: text and a typed "Tesis kartı" (1.800 m², 5 lift, 25 çalışan, Şaşmaz) on cols 1–4; the tabbed page on cols 5–11, rotated 0.6deg, with a seal at the corner. Numbered pins on the render, legend under it (pin and legend light each other up on hover).
- Assets: `/facility-modelling/assets/renders/upper.jpg`, `main.jpg`, `lower.jpg` (cropped in CSS).
- Interaction: tab switch (Üst / Ana / Alt kat); the render wipes in from the left (520ms; none with reduced motion). Arrow keys move between tabs. Floors are stacked in one grid cell, so the section height does not change.
- Mobile: stacked; tabs stay as tabs above the page; legend becomes one column.
- Later: pin positions are hand-placed on the renders; re-place them if the renders change.

## v2 — Canlı model (live 3D)
- Idea: tour the facility: a work-order checklist of seven zones drives the live model.
- Layout: heading on cols 1–4, the zone list (grouped by floor, with tick boxes that stay ticked once visited) under it; the model plate on cols 5–12 (rotated 0.8deg, poster `exploded.jpg`) with a slip clipped on its lower-left naming the open zone.
- Assets: `volan-building.glb`, `renders/exploded.jpg` (poster/fallback).
- Interaction: pick a zone (list or pin) → the floors close, only that floor stays, the camera flies to the zone (800ms) and the zone is tinted stamp violet. "Bütün bina" returns to the exploded overview. Drag sideways to turn.
- Mobile: plate full width (square stage), list below; picking from the list scrolls the plate back into view. Touch: vertical drag scrolls the page, horizontal drag turns the model.
- Road: the plate edge overlaps the road lane slightly (plates pass over the car).

## v3 — Tesis paftası (boldest; live 3D)
- Idea: a fold-out architectural sheet wider than the booklet: the closed building at full scale, a "Cepheyi kaldır" stamp button lifts the façade and pulls the floors apart, with labelled callouts and a drawing title block.
- Layout: the sheet bleeds off the left edge and stops before the road; drafting grid and two fold creases; heading top-left, button top-right; the model fills the sheet; title block bottom-right (address, 1.800 m², 5 lift, 25 çalışan, "Ölçek: yaklaşık", selected zone, legend 1–7) with a seal.
- Assets: `volan-building.glb` (site slab hidden), `renders/exterior.jpg` and `renders/exploded.jpg` as posters; the button swaps them without WebGL.
- Interaction: one toggle (closed ↔ opened, 900ms floor separation); pins fill the "Bölüm" field.
- Mobile: sheet full width minus the road; title block moves under the model; pin labels hidden (numbers + legend); camera angles changed for the narrow frame.
- Not done: no in-between breakpoint tuning between 900px and 1440px.

## Needs real content later
- The model is an approximate reconstruction (see `/facility-modelling/HANDOFF.md`); the pages say "Ölçüler yaklaşık". Zone descriptions are short placeholder copy; "Çay-kahve barı" text in v1 is Lorem ipsum.
- GLB is 8.4 MB uncompressed; for production, compress it (meshopt; the bundle already exports MeshoptDecoder). Mobile load time and frame rate were not tested on a real device.
- Mercedes and Golf car models inside the GLB are CC BY 4.0 and need a credit line if published (HANDOFF.md).

## Integration (picked: v1 Kat sekmeleri)
- Files: `tesis/fragment.html`, `assets/css/anasayfa/tesis.css` (all under `.s-tesis`), `assets/js/anasayfa/tesis.js` (tabs, arrow keys, legend/pin hover; does nothing without `.s-tesis`).
- Assets: `assets/img/anasayfa/tesis-kat-ust.webp`, `tesis-kat-ana.webp`, `tesis-kat-alt.webp` (+ `.json`). They are pre-cropped renders, so the CSS crop maths from the mock is gone; pin positions are unchanged (percent of the crop).
- Changes from the mock: IDs prefixed `tesis-`; pins are `aria-hidden` (the legend carries the text); the seal has `data-stamp` and presses in when the car passes; on phones the seal sits 8px inside the page so it stays out of the road. Section padding is the base 128/96px.
- Checked at true 1440 and 390 (`shots/final-1440.png`, `final-390.png`): the page ends at about x 1270 at 1440 (the road starts at about 1288); on phones the content stops 77px from the right edge (the road is 9–63px from it).
- `_check.html` is a copy of `_kit/harness.html` with `<base href="/gc-volan-1/">`: in the original harness the page-relative asset URLs (`assets/img/...`) resolve under `_kit/` and the images do not load. Its `?next=N` parameter clicks "next" N times (used to check the yorumlar deck).
