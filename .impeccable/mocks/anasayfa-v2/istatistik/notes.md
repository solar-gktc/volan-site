# istatistik — notes

Rules shared by all three variants:

- **Road.** The road runs straight down the right lane, drawn by inline JS at the section's own size. Content stays on the left, and plates sit nearest the road. Below 900px the road keeps to the right edge, with a 72px pad on that side for text.
- **Figures.** Only real figures are used: 1954, 70+ yıl, 1.800 m², 25 çalışan, 5 lift, 3 marka, 8 hizmet alanı, plus the address and hours from PRODUCT.md. Any other number is marked "örnek".

## v1: Tip plakası (calm)
- **Idea:** the facility gets a vehicle-style type plate. It is a flat metal-grey plate with hex bolts, a navy band and an engraved cell grid. The figures are in Courier Prime Bold, and 1954 is the largest cell.
- **Layout:** the heading is top left. The plate takes cols 1–7. The cutaway render plate takes cols 8–12 and slightly overlaps the road, so the car passes under it. A pencil plate of the entrance is tipped in below it.
- **Assets:**
  - `/facility-modelling/assets/renders/cutaway.jpg`, captioned "yaklaşık" because the model is an estimate
  - `/general-assets/gorseller/nesne-karakalem/giris-since-1954-1600.webp`
- **Interaction:** none.
- **Mobile:** the plate grid drops to 2 columns, and the two plates are stacked and overlapped.
- **Later:** none needed; every value is real. The `tesis` section may reuse the same render, so pick a different view if both sections are chosen.

## v2: Kontrol çizelgesi (medium)
- **Idea:** the figures are a typed inspection ledger. Each row has a number, a dotted leader to its value, and a stamped tick box. Row 8 is a sample row ("Yıllık servis kaydı 0.000 ÖRNEK") with an empty tick box. The foot has a "Kontrol eden" line, the round seal and a "Kayıtlarımızdan" stamp.
- **Layout:** the ledger page takes cols 1–8, with a double margin rule. The team pencil drawing is tipped in over the ledger's top-right corner and the road. A typed footnote explains the sample row.
- **Assets:** `/general-assets/gorseller/ekip-karakalem/ekip-diz-coken-1600.webp`
- **Interaction:** none.
- **Mobile:** the drawing comes first and the ledger fills the width. Units drop under the values.
- **Later:** a real figure for row 8, or delete the row.

## v3: Sayaç (boldest)
- **Idea:** a large odometer. Four paper digit drums sit in a navy, foil-framed housing, and the whole team cut-out stands on top of it. Below it is a typed log of seven readings. Picking one rolls the drums to that figure, with leading zeros greyed, and changes the unit window, title and line.
- **Layout:** the large heading is at cols 1–4. The team stands on cols 5–10. The meter and the log take cols 1–10, clear of the road.
- **Assets:** `/general-assets/gorseller/kesik-ustalar/ekip-tum-kadro.webp`. It shows 18 people, so the caption says "Ekibimizden bir bölümü" and does not claim all 25.
- **Interaction:**
  - The drums roll in 900ms, ease-out, with a 70ms stagger per drum.
  - The first reading is set without a roll, so the resting state is the visible one. Reduced motion jumps straight to the value.
  - `?r=25` (or any reading's value) preselects a reading, for checking.
- **Mobile:** small drums, with the unit row under them. The log is a 2-column grid.
- **Later:** none needed; every value is real.

## Integration (picked: v1, with the user's changes)
- Files: `istatistik/fragment.html` and `assets/css/anasayfa/istatistik.css` (everything under `.s-istatistik`). There is no JS.
- New figure: "Bakımını üstlendiğimiz araç 100.000+ ARAÇ" is a full-width cell across the type plate. It sits under the 1954 block, uses the large typed figure style, and is not marked örnek (the user provided it).
- The facility model render is removed.
- The pencil entrance drawing is replaced by the pencil facade: `assets/img/anasayfa/istatistik-bina-karakalem.webp`, from `general-assets/gorseller/nesne-karakalem/bina-cephe-1600.webp`, resized to 1200×800.
- The team is now the original photo: `assets/img/anasayfa/istatistik-ekip.webp`, from `general-assets/Photos-1-001/0Y7B2539.JPG` (the whole team standing at Mekanik 1). The full 3:2 frame is kept, resized to 1400×933. Both images have `.json` sidecars.
- Placement: the plates sit on cols 8–12 next to the real right lane (centre ≈1363px at 1440). The team plate overlaps the lane at z 3, so the car passes under it. The type plate and the text stay clear of the lane.
- Mobile: the type plate ends 46px before the right edge, so its text stays out of the 54px lane. The two plates stack and may overlap the lane.
- Check shots: `shots/final-1440.png` and `shots/final-390.png`.
