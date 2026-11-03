# final — the end of the page

All three: the page is fully aged (stock × `#fff5df` multiply, the existing `.aging` colour), the 1954 garage is `/general-assets/gorseller/arsiv-restore/arsiv-08-anadolu-volvo-yetkili-servis-cephe-tir-sb-restore-1600.webp` (sharper than `assets/img/arsiv-eski-dukkan.webp`) with a second copy `.store__walls` clipped to the walls around the door (polygon re-measured for this crop: door 15.6–47.4% × 37.4–86%; shown with `.store.is-shut` like the live site). A script draws the road: down the left lane, right under the plate, then up into the door (`[data-door]` marker at 31.4% / 86%). A dashed paper-white centre line continues over the forecourt into the door with an arrowhead — the sketch's "arrow going in". The plate is `z-index: auto` so the truck can drive over it. Contact data is the full real set (address, both phones, WhatsApp, e-mail, hours, Instagram) and the buttons Randevu al (primary, WhatsApp with text), Ara, Yol tarifi (Google Maps). `?shot` or reduced motion shows the end state.

## v1 — Son sayfa, koçanlı
- Idea: the booklet's last page: the garage plate beside a dealer record whose bottom is a perforated tear-off "Randevu fişi" holding the buttons.
- Layout: plate cols 2–8; dealer record cols 9–12 (4px double rule, ledger rows label | typed value), dashed perforation with an authored scissors mark, the slip with buttons and a typed line on how booking works; round seal on the corner. Colophon: double rule, horizontal logo, © line and 3D credits, centred.
- Assets: arsiv-08 restore; `/gc-volan-1/brand/logo-horizontal.svg`.
- Interaction: the dealer seal presses in when the record comes into view.
- Mobile: plate, the road's U-turn under it (176px), then the record (labels stacked over values).
- Real content later: confirm the booking line ("WhatsApp ile gelir; size geri döneriz").

## v2 — Arka kapak (boldest)
- Idea: the booklet closes on its navy back cover: the garage is the last leaf, large, and the full-bleed cover below carries "Kapımız 1954’ten beri açık." at 96px in light foil gold.
- Layout: cream leaf with the garage plate on cols 3–10 (door ~250px wide) and the road U into it; navy cover with the foil double rule: display heading + lead + cover button set (gold primary) on the left, a two-column typed contact card on the right (gold-ink labels, stock values), a 208px foil seal between, and the imprint (oval logo, ©, credits) inside the frame at the foot.
- Assets: arsiv-08 restore; `/gc-volan-1/brand/logo-oval.svg`.
- Interaction: the foil seal presses into the cover when it arrives.
- Mobile: plate, road U, cover stacks heading → buttons → contact list → imprint; seal sits top right of the cover.
- Real content later: the heading is a line of copy, not a sourced claim; owner may prefer "Kapımız açık."

## v3 — Dün / Bugün ve yol kartı
- Idea: two doors, then and now (the 1954 garage and today's front at night), and a route card that reads the address as a strip map from city to door, plus a live "Şu an açık / kapalı" stamp.
- Layout: night facade plate cols 1–4 (over the lane, the road passes under it), garage plate cols 5–12; below, a double-ruled route card cols 3–12: heading + short text, the strip map (Ankara → Etimesgut → Şaşmaz Oto Sanayi Sitesi → Bahçekapı Mah. 2547. Sokak → No:3, with an authored garage icon at the end; only address parts, no invented geography), a 4-column contact row, buttons. Colophon: rule, logo left, text right.
- Assets: arsiv-08 restore; `/general-assets/gorseller/bina-varyant/bina-gece-1600.webp` (AI-relit, see its README); `logo-horizontal.svg`.
- Interaction: the hours carry a rubber stamp computed from Europe/Istanbul time (open Mon–Sat 08:30–18:00): "Şu an açık · 18:00’e kadar" or "Şu an kapalı · Bugün/Yarın/Pazartesi 08:30’da"; hidden without JS; screen-reader text included.
- Mobile: today plate (78%, right), garage plate, road U, route card with the strip map turned vertical, contact list stacked.
- Real content later: public holidays are not handled by the live stamp.

## Integration (chosen: v2 Arka kapak, plate moved right)
- Files: `final/fragment.html`, `assets/css/anasayfa/final.css`, `assets/js/anasayfa/final.js`; asset `assets/img/anasayfa/final-arsiv-08.webp` (1430×927 from arsiv-08 restore-1600) + `.json`.
- Root: `<section class="finale s-final" id="iletisim" data-truck-lane="left" data-door="0.162 0.474 0.37 0.86">`. Door re-measured on the copied file (left jamb ≈0.162–0.178, lintel slopes 0.358→0.377); walls clip on `.s-final .store__walls`.
- User change: the garage plate now sits on columns 6–12, so the truck runs from the left lane under the photo to the door at ≈x 860 (1440). 267px of clear paper between the photo and the navy cover at 1440 (truck runs at photo.bottom + 116). On mobile the plate has a 48px left margin so the narrow lane runs beside it.
- `.s-final .finale__inner` gets `z-index: auto` so the photo stays under the 3D stage (the base gives `.finale__inner` z 2, which would lift the photo above the truck).
- Contact block is `<address class="dealer">` inside the cover; the foil seal (`.seal--back`) presses in via a small IntersectionObserver in final.js. The cover clips the seal's pre-press scale (no horizontal overflow at 390).
- Removed from the mock: the dashed arrow drawn over the forecourt (the stage draws the route now); `?shot` switch.
