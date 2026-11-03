# Yorumlar — notes

Road: the crossing from the right lane runs across the top of the section, then the left lane (same lane maths as `main.js`, computed in px by an inline script). Text is on the right; plates and paper sit on the left, near the turn. Road width on phones is 56px. All three reviews are Lorem ipsum, signed with initials, each marked with a typed "örnek yorum"; car and service are sample values. The Google link is a placeholder (`href="#"`, "Bağlantı eklenecek").

## v1 — Karne notları (quiet)
- Idea: the "müşteri görüşü" column of a service-booklet ledger: one row per visit, the remark written on ruled lines, signed.
- Layout: plate (pencil drawing of the entrance) and a typed folio on cols 1–3 near the turn; heading, lead and the ledger on cols 5–12 (No · Araç ve işlem · Müşteri görüşü · İmza), a seal on the ledger's top rule, Google stamp button under it.
- Assets: `/general-assets/gorseller/nesne-karakalem/giris-since-1954-1600.webp`; authored SVG signatures.
- Interaction: none.
- Mobile: rows become blocks (car line, remark, signature on the right); the plate moves below the ledger.

## v2 — Teslim tutanakları
- Idea: a pile of signed delivery notes torn from a pad (white, yellow and blue copies), each with a pencil photo paper-clipped to it.
- Layout: the pile on cols 1–7 near the road; heading, an index of the three notes, "Sonraki tutanak" (primary) and Google buttons on cols 9–12. Each note: form fields (Araç, Teslim, Yapılan işlem, Plaka blank), "Müşterinin notu" on ruled lines, signature line with initials, "Teslim edildi" rubber stamp.
- Assets: `nesne-karakalem/xc90-on-1600.webp` (Volvo), `is-anlari-karakalem/kafa-lambali-usta-1600.webp` (arıza tespiti), `is-anlari-karakalem/pasta-cila-1600.webp` (kaporta/boya).
- Interaction: the top note slides off to the left and goes under the pile (380ms; instant with reduced motion); the index jumps to a note. All notes share one grid cell, so the height never changes.
- Mobile: text and index first, then the pile full width; fields in one column.

## v3 — Kartpostallar (boldest)
- Idea: postcards from customers on the navy cover board: one large card and two smaller ones, each with a pencil-drawing postage stamp, the round seal as the postmark, wavy cancellation lines and Volan's address; a picture postcard of the building ("Etimesgut'tan selamlar") hangs off the board over the road.
- Layout: navy board with the gold double foil rule starts right of the road lane and bleeds off the right edge; display heading in light foil gold top-right; picture card top-left; card table below (one base card 680×453, scaled 0.6 for the back slots).
- Assets: `nesne-karakalem/bina-cephe-1600.webp`, stamps cropped from `nesne-karakalem/volvo-izgara-1600.webp`, `is-anlari-karakalem/kafa-lambali-usta-1600.webp`, `nesne-karakalem/atolye-volan-tabela-1600.webp` (VW front).
- Interaction: click or Enter on a back card → it swaps into the large slot (520ms transform). Desktop only.
- Mobile: board full width minus the lane; cards stacked in flow, all readable, slightly turned; no swap.
- 900–1299px: the card table is zoomed to 0.8 (not screenshot-checked).

## Needs real content later
- Three real reviews with permission (name as initials, car, service), a real Google reviews URL, and a decision on whether to show a rating (none is shown).

## Integration (picked: v3 Kartpostallar, redesigned for many Google reviews)
- User change: "we need to place more customer reviews from Google". v3 is now a deck: one large postcard in front, the next two smaller behind it on the right, and the rest waiting in the deck. Previous/next stamp-box buttons with a typed counter ("4 / 9"), arrow keys, a swipe on phones, or a click on a card behind it moves the deck. Each card has authored SVG stars (outline row + filled row clipped to the rating, so 4,8 works), the quote (cut at 6 lines, 8 on phones), "— initials · date", the car and service when known, and a typed "Google yorumu · örnek" line. On the board: a summary box ("Google puanı", 4,8 ★, "127 yorum · örnek değerler") and the "Google'da tüm yorumlar" stamp-box link. No Google logo is used.
- Data: `REVIEWS` and `SUMMARY` at the top of `assets/js/anasayfa/yorumlar.js`, all sample (initials, Lorem text, sample ratings and dates). Works with 1 to any number of reviews (the nav hides with one; with 3 there is no "out" slot). The stamp drawing follows `brand` (volvo, vw), otherwise it cycles through three workshop drawings. The fragment holds one static sample card and sample summary values so the section reads without the script; the script replaces both.
- Files: `yorumlar/fragment.html`, `assets/css/anasayfa/yorumlar.css` (under `.s-yorumlar`), `assets/js/anasayfa/yorumlar.js`.
- Assets: `assets/img/anasayfa/yorumlar-bina-cephe.webp` (900×600), stamps `yorumlar-pul-volvo/-vw/-usta/-cila/-triger.webp` (240×300 crops), each with `.json`.
- Road: the section has 168px top padding (144px on phones), so the navy board starts below the crossing. The board's left edge is `max(176px, 0.8 × measure-left + 100px)`, about 177px at 1440 (road ≈ 2–152px), and 76px on phones (road ≈ 9–63px). Only the "Etimesgut'tan selamlar" postcard hangs over the road (z 2).
- Checked at true 1440 and 390 (`shots/final-1440.png`, `final-390.png`) and after three "next" clicks at 1440. Not checked: 900–1299px (the deck is zoomed to 0.8 there) and 20+ real reviews.
