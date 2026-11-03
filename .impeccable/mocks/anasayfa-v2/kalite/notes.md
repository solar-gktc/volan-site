# Kalite — notes

Five steps (titles kept: Doğru teşhis, Teknik yetkinlik, Şeffaf süreç, Aracınıza özen, İşimizin arkasında durmak); body text is Lorem ipsum. The road enters on the right lane (from Kampanya), crosses at the top of the section and runs down the left lane. `?shot` renders the end state; reduced motion shows the end state with no motion.

## v1 — Kaşe sayfası (stamp page)
- Idea: the stamp page at the back of a service booklet: six printed boxes, five steps plus the dealer seal; each box gets its own rubber stamp ("Teşhis edildi", "Usta onayı", "Bilgi verildi", "Özenle teslim", "Arkasındayız") and its typed date.
- Layout: heading on columns 3–7, a tipped-in pencil plate on 9–12; the page (4px double navy frame) on columns 3–12, 3×2 boxes with dashed stamp fields and dotted form fields.
- Assets: `/general-assets/gorseller/nesne-karakalem/xc90-liftte-1600.webp`; kit stamp, seal and ink filter.
- Interaction: when the page is 45% in view, the boxes are stamped one after another (300ms apart), the seal last. On phones each box is stamped when it reaches the car's height.
- Mobile: boxes stack in one column; 60px pad on the road side.
- Road/car: the calmest variant; nothing enters the lane.
- Real content later: step texts; the stamp wording should be checked with Volan.

## v2 — Yol kenarı durakları (stops by the road) — boldest
- Idea: the five steps are five stops along the road. Each stop has a big number and a tick box tied to the road edge by a dashed lead, a large pencil plate of that stage of work, and the text. When the car reaches a stop, the tick is pressed in and the drawing plays once: it draws itself, or washes into the real photo and back (for "Şeffaf süreç" that is the point: the drawing becomes the photo).
- Layout: large display heading; stops alternate (plate 6 columns / text 3 columns), 144px apart; the number column sits right beside the lane.
- Assets: `/general-assets/video/karakalem/kafa-lambali-usta-foto-loop`, `turbo-tezgahi-cizim-loop`, `lift-altinda-uc-usta-foto-loop`, `ekip-diz-coken-cizim-loop` (webm + mp4, posters), `/general-assets/gorseller/is-anlari-karakalem/pasta-cila-1600.webp`.
- Interaction: IntersectionObserver with a band at about 58% of the screen (the car's height). Draw clips start at 2.6s (blank paper) and stop on the finished drawing; photo clips play once from the start. Videos load only when reached (`preload="none"`). Checked in headless Chrome: the stop's video plays when scrolled to.
- Mobile: one column per stop: number + tick, plate, text.
- Road/car: plates sit right next to the lane, so the car runs past each stop; nothing is in the lane.
- Real content later: step texts. The section is long (about 3400px at 1440); if it is too long, stops 4 and 5 could share a row.

## v3 — İş emri nüshası (work-order copy)
- Idea: the customer copy of a work order, torn from the pad, with the cream carbon sheet showing underneath. A mechanic (transparent cut-out) stands behind it like behind a counter. Each of the five lines is initialled by hand and ticked; then the Volan seal closes the order.
- Layout: the slip and mechanic on columns 3–8 (beside the road), heading and text on 9–12. Slip: logo, "İş emri · müşteri nüshası", typed carbon fields (No 2026/ÖRNEK, plate, car, date), five lines (No / step / Paraf / Tamam), signature lines, seal.
- Assets: `/general-assets/gorseller/kesik-ustalar/usta-tornavida-eldiven.webp`, `/gc-volan-1/brand/logo-horizontal.svg`; five authored SVG initials (one stroke, drawn with `stroke-dashoffset`).
- Interaction: when the lines are half in view, each paraf writes itself (700ms) and its tick presses in, 560ms apart; the seal presses in last. On phones each line is signed when it reaches the car's height.
- Mobile: the text first, then the mechanic (300px) and the slip; paraf moves under each line's text.
- Road/car: the mechanic and slip are next to the lane, so the car passes beside/behind them.
- Real content later: step texts; the order number and plate are placeholders marked as sample.

## Integration (chosen: v3) — 2026-11-03
- Part: `kalite/fragment.html`, `assets/css/anasayfa/kalite.css` (scoped `.s-kalite`). No JS: each `.line` and the `.slip__foot` carry `data-stamp`; the stage adds `is-stamped` as the car passes, so the paraf writes itself, the tick presses in, and the seal presses in at the foot.
- User change: the mechanic cut-out is gone. Two photo plates are clipped (authored paperclip SVG) to the top edge of the work order and overlap it: the facility (`assets/img/anasayfa/kalite-bina.webp`, from `general-assets/gorseller/bina-varyant/bina-gunesli-2560.webp`, no people) and a Volvo XC90 in the workshop (`assets/img/hakkimizda-xc90-atolye.webp`, already in the site, no people).
- Real lane: the slip stays on columns 3–8 (starts ≈310px at 1440; the lane ends ≈152px). Narrow: content padded 52px on the left (lane ends ≈63px at 390).
- Checked at true 1440 and 390 in the stamped state: `shots/final-1440.png`, `shots/final-390.png`.
