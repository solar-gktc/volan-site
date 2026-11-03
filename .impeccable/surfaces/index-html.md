---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: []
---

# Homepage (index.html)

## Scope and mode
The Volan Otomotiv homepage. Mode: Persuade. Layout source: `sketches/anasayfa-eskiz.png` (user sketch). Turkish only.

## Audience, job, action
Post-warranty Volvo owners in Ankara (see PRODUCT.md). They decide whether Volan matches the dealer, then call, message on WhatsApp, or ask for an appointment. The primary action is "Randevu". Calling and WhatsApp stay one tap away.

## Pinned by the user
- Banner: the Volan building photo and the logo, the slogan "Aracınız bizim sorumluluğumuzda", the subheader "Garanti süreniz bittiği için servis kalitenizi düşürmek zorunda değilsiniz.", three contact buttons at the top left, a large 3D Volvo, and small Mercedes and Volkswagen cars.
- On scroll the Volvo drives an S-route down the page: left, then right, and so on, sometimes passing behind content. The route shows as a faint road the whole time.
- Three or more content sections (four in the first build). In each, the text sits on the side away from the car's turn, and the image sits near the turn so the car can pass behind it. Sides alternate. Copy is Lorem Ipsum; images are placeholders.
- At the bottom the Volvo turns smoothly into an old Volvo F-series truck (the J.M. Keith cab in `photos/arsiv-06`) and drives into the old store photo (`photos/arsiv-08`, the Anadolu Volvo Yetkili garage with its door open). The contact details sit beside the truck.
- Vehicles are 3D. Volvo: `../3d-indirilen/xc60.glb` (Volan holds the usage rights). Mercedes, VW and the truck are placeholders until real models arrive. The car→truck change is a dissolve, not a shape morph.

## Direction contract
THESIS: The homepage is the car's service booklet. After the warranty, Volan keeps stamping it, page by page, back to its first page in 1954. It refuses the dark showroom hero with a row of service cards.

OWN-WORLD:
- Navy cover `#323277` with gold foil rules (`#857244` for lines; a lighter gold tint for text on navy).
- Pale blue-grey ruled card stock `#E6E9F0` with `#B9BFD0` rules. Body ink `#2B2A29`.
- Violet-blue stamp ink `#3B3F8F`: round and rectangular rubber stamps, slightly rotated.
- Photos as tipped-in plates with white borders. The route is printed in faint navy ink.
- Buttons are double-ruled stamp boxes.
- Type: Clarendon-style serif titles, typewriter entry text, condensed grotesk form labels.

STORY: The owner sees their own booklet and understands that the record continues after the warranty. Each entry page gets stamped as the car passes. On the last page (1954, the Anadolu Volvo garage) the car becomes the truck and drives in. The visitor then books, calls, or messages from the dealer stamp block.

FIRST VIEWPORT (1440×900):
- Left 760px: the navy cover, full height, with a gold frame inset 48px. The oval logo sits at the top of the cover as its emblem.
- At about y300: the slogan as the cover title, about 62px, in light gold.
- Below it: the subheader, about 24px, in stock color.
- At about y640: three stamp-box buttons: Randevu (primary), Ara, WhatsApp.
- Right side: ruled stock.
  - The building photo is tipped in as a white-bordered plate, about 540×360, at the top right.
  - A round VOLAN stamp overlaps the plate's lower right corner.
  - The 3D Volvo, about 520px wide, sits at the lower right on the rules, with the small Mercedes and VW behind it.
  - The faint route starts under the Volvo.

FORM: Service Booklet, #1 of my seven grounded candidates (IMPECCABLE'S PICK, chosen over the assigned Workshop Floor). seed:2b51b3ae67aaba49

SIGNATURE: The 3D Volvo follows the printed route, driven by scroll. It turns at each margin and passes under the tipped-in plates. Each entry's stamp presses in when the car passes it. At the end: the dissolve into the truck, which drives into the garage door of the arsiv-08 plate. Reduced motion: the cars hold fixed poses and every stamp is already applied.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved
- Final section copy and images (Lorem Ipsum and placeholders until provided).
- Mercedes, VW and truck 3D models (placeholders).
- Booking request mechanism (no backend yet).
- Hosting.
