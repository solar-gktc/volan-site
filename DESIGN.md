---
name: Volan Otomotiv
description: The car's service booklet. A navy cover with gold foil, pale ruled card stock, and violet-blue stamp ink.
colors:
  navy: "#323277"
  navy-deep: "#27275f"
  gold: "#857244"
  gold-ink: "#cdb585"
  silver: "#cfd0d0"
  ink: "#2b2a29"
  ink-soft: "#4d4c5c"
  stock: "#e6e9f0"
  stock-deep: "#dde1ea"
  rule: "rgba(110, 120, 160, 0.22)"
  rule-strong: "rgba(50, 50, 119, 0.32)"
  stamp-ink: "#3b3f8f"
  paper: "#fbfbfd"
  tone-2017: "#eeede9"
  tone-volvo: "#efe9dd"
  tone-1954: "#efe5d0"
  endpaper: "#d8dde8"
  aged: "#fff5df"
typography:
  display:
    fontFamily: "Besley, Georgia, serif"
    fontSize: "clamp(2.5rem, 4.3vw, 3.875rem)"
    fontWeight: 400
    lineHeight: 1.04
    letterSpacing: "-0.012em"
  headline:
    fontFamily: "Besley, Georgia, serif"
    fontSize: "2.5rem"
    fontWeight: 600
    lineHeight: "48px"
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Besley, Georgia, serif"
    fontSize: "2rem"
    fontWeight: 600
    lineHeight: 1.2
  body:
    fontFamily: "Besley, Georgia, serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: "32px"
  lead:
    fontFamily: "Besley, Georgia, serif"
    fontSize: "clamp(1.125rem, 1.55vw, 1.4rem)"
    fontWeight: 400
    lineHeight: 1.42
  typed:
    fontFamily: "Courier Prime, Courier New, monospace"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "tnum"
  label:
    fontFamily: "Archivo Narrow, Arial Narrow, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.14em"
  label-small:
    fontFamily: "Archivo Narrow, Arial Narrow, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.14em"
  button:
    fontFamily: "Archivo Narrow, Arial Narrow, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.12em"
rounded:
  none: "0px"
spacing:
  line: "32px"
  gutter: "clamp(20px, 6.6vw, 96px)"
  measure: "1248px"
  column-gap: "32px"
  page-pad: "128px"
  page-pad-narrow: "96px"
components:
  button-stamp-primary:
    backgroundColor: "{colors.gold-ink}"
    textColor: "{colors.navy}"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    padding: "0 22px"
    height: "52px"
  button-stamp:
    backgroundColor: "transparent"
    textColor: "{colors.stock}"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    padding: "0 22px"
    height: "52px"
  button-stamp-ink-primary:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.stock}"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    padding: "0 18px"
    height: "48px"
  button-stamp-ink-primary-hover:
    backgroundColor: "{colors.navy-deep}"
  button-stamp-ink:
    backgroundColor: "transparent"
    textColor: "{colors.navy}"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    padding: "0 18px"
    height: "48px"
  plate:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.none}"
    padding: "10px"
  dealer-block:
    backgroundColor: "{colors.stock}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "32px 32px 40px"
  stamp-box:
    backgroundColor: "transparent"
    rounded: "{rounded.none}"
    width: "232px"
    height: "128px"
  index-tab:
    backgroundColor: "{colors.stock-deep}"
    textColor: "{colors.navy}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    height: "48px"
  index-tab-open-on-navy:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.gold-ink}"
  index-tab-open-on-paper:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.navy}"
  navy-board:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.stock}"
    rounded: "{rounded.none}"
  postcard:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "34px 30px 28px"
    width: "680px"
    height: "453px"
---

# Design System: Volan Otomotiv

## Overview

**Creative North Star: "The Service Booklet"**

The site is a car's service booklet, printed and handled. A navy cover with a gold-foil frame opens onto pale blue-grey card stock ruled every 32px. Archive and current photos are tipped in as white-bordered plates. Violet-blue rubber stamps mark each page. A faint printed road runs down the stock, and the 3D cars drive it. Every surface is a physical booklet material: cover board, ruled stock, photo plate, stamp ink, foil. Nothing is a screen panel.

Density is that of a filled-in booklet: generous ruled pages, one entry per page, text on one side and a plate on the other, sides alternating with the road. The type is a working document's mix: a Clarendon-style serif for titles and running text, a typewriter face for typed-in record data, and a condensed grotesk for printed form labels. Colour is few and flat: navy, gold, stock, ink, and stamp violet.

The world refuses the dark showroom hero and the row of rounded service cards. Depth comes from paper on paper (a plate lying on stock) and from the 3D stage, never from glass, glow, or gradient.

**Key Characteristics:**
- Navy cover board framed by a double gold-foil rule.
- Pale ruled card stock; vertical rhythm locked to the 32px ruling.
- Photos as tipped-in plates: white border, slight rotation, soft paper shadow.
- Rubber stamps in violet-blue ink with a noise-roughened edge, slightly rotated, multiplied onto the paper.
- Double-ruled stamp-box buttons with a small tilt; square corners everywhere.
- A faint navy-ink road that the 3D vehicles follow on scroll.

## Colors

A flat, printed palette: brand navy and gold from the logo, plus card stock, ink, and stamp violet as supporting design decisions.

### Primary
- **Volan Navy** (navy): brand colour from LOGO_2026.pdf. The cover board, entry headings, dealer frame, ink-variant buttons, focus outlines, the printed road, and selection. The dominant ink on the stock.
- **Deep Cover Navy** (navy-deep): hover state of navy-filled buttons only.

### Secondary
- **Foil Gold** (gold): brand colour from LOGO_2026.pdf (the oval ring). Used only as rules on navy: the cover's outer foil line and its inner hairline (the hairline at 70% opacity). Never as text: it reaches only 2.4:1 on navy.
- **Light Foil Gold** (gold-ink): the readable gold. Cover title, the cover's primary stamp-box button fill, and focus outlines on navy (5.7:1 on navy).

### Tertiary
- **Stamp Violet** (stamp-ink): rubber-stamp ink only. Entry stamps and the round seals. Always applied with multiply blending and the ink filter.

### Neutral
- **Card Stock** (stock): page background of every leaf, entry, and the finale; also the cover subhead and light text on navy.
- **Deep Stock** (stock-deep): scrollbar track.
- **Plate White** (paper): the border of tipped-in photo plates.
- **Body Ink** (ink): brand near-black; running text on stock (11.8:1).
- **Soft Ink** (ink-soft): captions and the colophon (6.9:1 on stock).
- **Ruling** (rule): the 1px line at the foot of every 32px line.
- **Strong Rule** (rule-strong): page-break rules between entries, the stamp-box dashed outline, link underlines in the dealer block.
- **Logo Silver** (silver): brand colour carried by the logo artwork only. Not used as a surface or text colour.

### Aged Stock (reverse-turned leaves, Hakkımızda)
One flat stock tone per leaf, warming from today's blue-grey toward the cream of the 1954 prints. Today's leaf uses card stock itself.
- **Faded Stock** (tone-2017): the 2017 leaf. Body ink 12.2:1, soft ink 7.2:1, navy 9.7:1.
- **Yellowed Stock** (tone-volvo): the undated Volvo-years leaf. Body ink 11.9:1, soft ink 6.9:1, navy 9.4:1.
- **Archive Cream** (tone-1954): the 1954 leaf, the warmest. Body ink 11.5:1, soft ink 6.7:1, navy 9.0:1.

### Endpaper and Aged Paper (homepage v2; also in site.css)
- **Endpaper** (endpaper): the bed of the road. On anasayfa-v2.html (and in site.css) the road is cut through the pages down to the endpaper: a strong-rule edge 3px wider than the road, the endpaper bed 8px narrower, three thin cut-edge shading strokes (`#c3c9d8`, `#cbd1de`, `#d2d7e3`, local values, not tokens), a printed wavy net (navy at 16%, 0.7px) and the dashed centre line (navy at 26%, 2px, 14 on, 12 off).
- **Aged Cream** (aged): the 1954 cream the paper turns to from the truck page on (a page-level layer, multiplied over the stock and the road), and the carbon copy under the work-order slip.

### 3D stage colours (shader, not CSS)
- **Dissolve Edge Gold** (`#d9bd7a`): the glowing edge of the noise dissolve from car to truck.
- **Garage Dark** (`#75624e`): sampled from the doorway of the 1954 archive photo; the truck darkens toward it once past the door threshold.

### Named Rules
**The Brand Record Rule.** Navy, gold, silver, near-black, and white come from LOGO_2026.pdf and are not retuned. Stock, rules, stamp violet, and the lighter gold are design decisions and may be adjusted; brand values may not.

**The Foil Is Not Ink Rule.** Foil gold draws lines on navy. Text on navy uses light foil gold or stock.

**The Aged Stock Rule.** On a page that turns back through time, each leaf is one flat stock tone, and older leaves are warmer: card stock, then faded stock, yellowed stock, archive cream. The tone changes only at a leaf's cut edge, never as a gradient inside a leaf. Aged tones are for dated leaves only; they are not a general surface palette.

## Typography

**Display Font:** Besley (with Georgia, serif)
**Body Font:** Besley (with Georgia, serif)
**Label Font:** Archivo Narrow (with Arial Narrow, sans-serif)
**Typed Font:** Courier Prime (with Courier New, monospace)

All three families are self-hosted (latin and latin-ext subsets, for Turkish).

**Character:** A Clarendon-style serif carries the booklet's printed voice. Archivo Narrow is the pre-printed form label. Courier Prime is what was typed into the form.

**Weight note:** the stylesheet asks for weight 600 on headings, buttons, labels, and stamps. Besley and Archivo Narrow are self-hosted as variable fonts: the 400/600 (Besley) and 500/600 (Archivo Narrow) @font-face rules share one file each, and the browser sets the weight axis from the requested weight, so 600 renders a true semibold (measured in Chrome: Besley 40px "Hamburgefonstiv ĞŞİ" is 434.8px at 400 and 458.1px at 600). Weights above 600 clamp to 600; do not request them, and do not let the browser synthesize bold.

### Hierarchy
- **Display** (Besley Regular, clamp 40px to 62px, line-height 1.04, -0.012em): the cover title only, in light foil gold.
- **Lead** (Besley, clamp 18px to 22.4px, line-height 1.42): the cover subhead, in stock, max about 28rem.
- **Headline** (Besley 600; 40px on 48px lines, -0.01em): entry page headings in navy. On narrow screens, 28px on 32px lines.
- **Title** (Besley 600; 32px, line-height 1.2): the dealer block heading.
- **Body** (Besley Regular, 18px on 32px lines): entry text, max 62ch. Each line sits on a rule of the stock.
- **Typed** (Courier Prime Regular): record data. Dealer values at 16px/1.5 with tabular numerals; plate captions at 15px/1.4; colophon at 14px/1.5.
- **Label** (Archivo Narrow 600; 12px, 0.12 to 0.14em, uppercase): form labels in the dealer list and the stamp boxes.
- **Button** (Archivo Narrow 600; 15px, 0.12em, uppercase): stamp-box buttons and stamp text (17px, with a 12px small line at 0.22em).

### Ceremonial Ramp (Miras only)
The heritage page extends the ramp upward. These sizes belong to that page; they are not frontmatter tokens.
- **Page title** (Besley Regular, clamp 64px to 96px, line-height 0.95, -0.025em): "Miras" on the navy cover, in light foil gold. 64px on narrow screens.
- **Chapter heading** (Besley Regular, clamp 44px to 72px, line-height 1, -0.015em): navy on stock, light foil gold on the navy leaf. 40px on narrow screens. Regular, not 600: at this size the weight comes from scale.
- **Typed period** (Courier Prime, 16px/1.4, tabular numerals, soft ink): the year line under each chapter heading (1954, 2017, the current year), or the blank year.
- **Chapter lead** (Besley, clamp 18px to 22.4px, line-height 1.42): the first paragraph of each chapter, in body ink.
- **Owner quote** (Besley Italic, 24px/1.4; the wide variant clamp 28px to 36px, line-height 1.32, max 36ch): see Owner Quote.
- **Chapter strip** (Archivo Narrow 600, 13px, 0.14em, uppercase): the chapter links at the foot of the cover.

**The Ceremonial Edition Rule.** The 72px chapter headings and the 96px title are the heritage page's edition of the booklet, led by navy board. Other pages keep the base ramp (headline at 40px, 600).

### Booklet Pages Ramp (homepage v2)
anasayfa-v2.html extends the ramp for its navy boards, figures, and forms. These sizes belong to that page; only label-small is a frontmatter token, because it recurs across six sections.
- **Board display** (Besley Regular, light foil gold on navy): the hero band title, clamp 40px to 60px, line-height 1, -0.02em, one line (at 1180px and below it may wrap, clamp 36px to 52px; narrow clamp 30px to 40px, 1.04); the review board heading, clamp 40px to 60px, 1.04, -0.012em (36px narrow); the service board title, 44px/1, -0.015em (32px narrow); the open service's name, clamp 36px to 52px, 1.05 (32px narrow).
- **Back-cover title** (Besley Regular, clamp 56px to 96px, line-height 0.98, -0.025em, light foil gold): "Kapımız 1954'ten beri açık." 52px on narrow screens.
- **Offer figure** (Besley Regular, clamp 64px to 96px, line-height 0.95, -0.025em, light foil gold): the first line of a campaign heading. 56px narrow. The rest of the heading is Besley 600, 36px/1.15 in stock (26px narrow).
- **Heritage heading** (Besley Regular, clamp 44px to 72px, line-height 1, -0.015em, navy on stock): the darkroom section heading (40px narrow); the lineage names, clamp 28px to 38px, 1.05, -0.012em.
- **Section headline** (Besley 600, 40px on 48px lines, navy): the base headline, kept for the work-order, brand, type-plate, and floor sections; 28px on 32px lines on narrow screens.
- **Form titles** (Besley 600, navy): quote form 28px/1.15; floor page and brand note 24px (1.2 and 32px lines); work-order line 18px/1.3; floor legend 17px/1.3.
- **Step numeral** (Besley Regular, 48px/0.9, navy): the quote form's step numbers. 36px narrow.
- **Figures** (Courier Prime Bold, tabular numerals): type-plate cells 28px/1, 0.02em (22px narrow); the type plate's large value clamp 64px to 104px, -0.02em (52px narrow); the car count clamp 48px to 76px (40px narrow); the Google score 36px/1, -0.02em (30px narrow); the offer's last day 24px/1. Unit text inside a figure is Regular at 0.3 to 0.5em.
- **Postcard message** (Besley Italic, 24px/1.34, body ink, six lines at most): the review text. 19px narrow (eight lines).
- **Board text** (Besley Regular): the hero subhead clamp 17px to 20px, 1.42; board leads 19px (1.4 on the service board, 1.5 on the review board); the service body 18px/1.6; form and step text 16px on 28px and 26px lines; work-order line text 15px/1.5.
- **Typed** (Courier Prime Regular): 13px for the photo tag, plate and slip notes, frame numbers, and the type plate's foot; 14px and 15px for meta, scope lines, cites, and notes; 17px/1.5 for the back cover's contact values; 18px for the deck counter; 20px for the floor card values.
- **Label small** (label-small; Archivo Narrow 600, 11px, uppercase, 0.14 to 0.16em; 0.3em on the postcard's head line): type-plate cell labels, work-order meta and column heads, the last-day label, the blueprint title block, the postcard head and car line.
- **Tab label** (Archivo Narrow 600, 13px, uppercase, 0.12 to 0.14em): campaign and floor tabs, the type plate's navy band (0.2em). Service tabs use the 12px label. Quote-form step titles 14px, 0.14em.

**The Booklet Pages Edition Rule.** The 60px to 104px sizes belong to navy boards, the back cover, and printed figures on anasayfa-v2.html. A section heading set on stock keeps the base headline (40px, 600) unless it opens the heritage part of the page.

### Named Rules
**The Typed Data Rule.** Addresses, phone numbers, hours, captions, and the colophon are typed record data and use Courier Prime. Running prose stays in Besley.

**The Form Label Rule.** Archivo Narrow appears only as short uppercase labels, button text, and stamp text, never as running copy.

## Layout

**The ruling.** The stock carries a 1px rule at the foot of every 32px line, restarting at the top of each page. Body line-height is 32px. Paragraph gaps, the space under headings, and stamp-box height (four lines) are multiples of 32px. Page padding is 128px on desktop (four lines) and 96px on narrow screens (three lines).

**Heading snap.** Desktop entry headings use 48px lines, which do not sit on the ruling. The heading is offset 15px down so its first baseline lands on a rule. The stage script then adds to the heading's bottom margin until the paragraphs start on a rule, and shifts the vertically centred text column onto the ruling. New ruled pages must keep this: either use 32px multiples or run the same snap.

**Banner.** Two columns at 53fr / 47fr, height clamp(640px, 100svh, 1040px). Left: the navy cover with padding clamp(48px, 6.6vw, 96px). Right: a ruled leaf with the building plate (80% of the leaf width, top right, rotated 1.1deg) and a round seal overlapping its lower right. Parking spots for the Volvo and the small cars are positioned as percentages of the leaf.

**Entry pages.** A 12-column grid, 32px column gap, max width 1248px inside a fluid gutter clamp(20px, 6.6vw, 96px). The plate takes 4 columns (portrait) or 6 (landscape) on the road side; the text takes 5 columns on the far side. Sides alternate with the road lane (left lane: plate left; right lane: plate right). Each page starts with a 2px strong rule.

**Finale.** The archive store plate on columns 1 to 6, the dealer block on columns 9 to 12, top-aligned.

**Responsive.** One breakpoint at 900px. Below it: the cover stacks above the leaf (leaf aspect 390/430); entries become one column with 64px row gaps; the text column takes a 44px pad on the road side so the car has room; portrait plates go to 78% width, centred; the store plate gets 160px below it for the truck's run.

**Reverse-turned leaves (Hakkımızda).** A 150px margin rail runs down the left edge of the whole page, past every leaf. Each leaf is padded 64px top and 128px bottom, with the rail width on the left, and holds a 12-column grid (32px gap, max width 1180px inside the fluid gutter). Today's leaf fills the first screen (min height 100svh minus 120px, centred). Plates and text alternate sides from leaf to leaf; a sticky plate or a sticky text column (top 64px) holds while the other side scrolls. The page ends on the navy front cover with the same 12-column grid. Below 900px the rail becomes a sticky 56px bar at the top, leaves drop the rail padding (48px top, 96px bottom), and every grid becomes one column with 64px row gaps.

**Ceremonial edition (Miras).** The page opens on a navy cover board (min height clamp(640px, 100svh minus the menu, 1000px)) holding a 12-column grid inside the measure: text on columns 1 to 5, the then/now plate on columns 6 to 12 (rotated 1.1deg), and the chapter strip across the foot with the typed span "1954 — current year" at the right. Five chapters follow as leaves, each the same template (heading, typed period, lead, body, plates, optional owner quote) in its own composition on the 12-column grid: a large plate on 7 columns beside 4 columns of text; an album spread of four tipped-in plates at mixed angles (-1.6 to 1.2deg) and staggered drops; a navy leaf; text beside a portrait then/now plate; today's team photo on 7 columns beside 4 columns of text, then a full-width film (up to 1400px) to close. Chapters are spaced clamp(112px, 12vw, 176px). The page ends on the navy cover with a 1180px grid. Below 900px every grid becomes one column with 48px row gaps; the album keeps two columns for its two portrait plates. Miras stock is unruled and its spacing does not follow the 32px ruling or the heading snap.

**Homepage v2 (anasayfa-v2.html).** Every section is an entry on the 12-column grid (32px gap, 1248px measure inside the fluid gutter), named for its road lane (`data-lane`), with its own composition: the hero is a band over a full-bleed photo; service, campaign, and review boards bleed to a screen edge through the side gap (`(100vw - measure) / 2`) and stop short of the road lane; work order, quote form, type plate, and floor page sit on the far side of the lane from the text or straddle it under the car. Section padding varies by the road's crossings (64px to 216px); the stock is unruled and, as on Miras, spacing does not follow the 32px ruling or the heading snap. The hero is clamp(640px, 100svh minus the menu, 1000px) tall. Below 900px every grid becomes one column (48px to 72px row gaps), and content on the lane side takes 48px to 80px of padding so the narrow road (centre 36px from the edge, about 54px wide) stays clear. Between 900px and 1299px the postcard deck is zoomed to 0.8 as one piece.

## Elevation & Depth

Flat paper with one exception. The cover and the stock are flat and depth-free. Tipped-in plates lie on the stock with a soft paper shadow. Stamps and seals have no shadow; they are ink, multiplied into the paper. Real depth belongs to the 3D stage: the vehicles render in a fixed full-viewport canvas above the stock and below plates and text, so the car passes under the plates.

### Shadow Vocabulary
- **Plate on stock** (`box-shadow: 0 1px 1px rgba(43, 42, 41, 0.1), 0 10px 22px -10px rgba(43, 42, 41, 0.38)`): every tipped-in photo plate. Nothing else.

### Layering
- Road SVG: z 1, document-sized, under everything.
- 3D stage canvas: z 1, fixed, pointer-events none.
- Cover, plates, entry text, dealer block: z 2.
- Seals: z 3.
- The 1954 store photo sits under the stage so the truck drives over it. A second copy of the photo, clipped to the walls around the open door, appears above the stage once the truck reaches the threshold, so the truck goes in through the door.

### Named Rules
**The Paper On Paper Rule.** The only shadow is a plate resting on stock. Buttons, stamps, and the dealer block stay flat.

### Page-Block Edge
At the top of each older leaf, the edge of the remaining page block shows as flat strips: a 2px strong-rule line, then one 6px band per leaf still to turn (4.5px of plate white at 80% over a 1.5px navy cut line at 40%). The 2017 leaf shows three edges, the Volvo-years leaf two, the 1954 leaf one, so the stack thins toward the cover. Today's leaf has none.

**The Cut Edge Rule.** The page-block edge is drawn, not cast: flat strips and lines only, no shadow and no gradient. It is a printed edge, so it does not break the Paper On Paper Rule.

### Navy Board (Miras)
On Miras the plates also lie on navy board (the cover and the Volvo leaf) and keep the same plate shadow. The then/now handle, the viewing-board close button, and the film control are flat. The viewing board darkens the page with a flat navy-deep backdrop at 94%, not a blur or glow.

### Homepage v2
The plate shadow is reused unchanged on every paper object lying on stock or board: the type plate, the floor page, the postcards and the picture postcard, the carbon copy under the work-order slip, the quote form and blueprint plate (both are plates). Layering: the hero photo has no z-index, so the parked cars stand on its forecourt, and the navy band (z 2) sits over them; the clipped photo plates on the work order, the team plate on the type plate, and the postcard deck are z 3; the picture postcard and the darkroom easel are z 2 over the lane, so the car passes under them; the garage section creates no stacking context, so the truck drives over its photo and the walls copy closes around it.

## Shapes

Square corners throughout (0px). Form comes from rules, not radius: double rules (4px double) on buttons and the dealer block; a 2px plus 1px pair of gold foil lines on the cover; dashed 1.5px rules for stamp boxes; 2px solid rules for page breaks. Paper objects are slightly rotated: plates about 1 to 1.2deg, alternating direction by lane; buttons -1.2deg, 0.8deg, and -0.5deg in order; entry stamps -6deg at rest; seals -12 to -16deg. The only circle is the round seal.

Homepage v2 adds printed and punched edges, all hard-stop patterns with no colour blend: the coupon band's perforated edge (6px wide, 8px of board then 6px of stock showing through), the slip's row of punched holes (4px tall, 6px clear then 5px of stock), the contact sheet's film perforations, and the blueprint's 32px grid (light foil gold at 12%). Bolts at the type plate's corners are each turned differently (0, 20, -12, 35deg). Crop blades are 2px navy corner brackets, 44px, set 26px outside the easel print. Floor pins are 30px squares. Rotations stay small: boards and pages 0.5 to 0.7deg, plates up to 2.4deg, the picture postcard -5deg, the last-day box -2deg.

## Components

### Stamp-Box Buttons
Rubber-stamped boxes, slightly crooked, that straighten when touched.
- **Shape:** square, 4px double border in the text colour, min height 52px (48px in the dealer block), padding 0 22px (0 18px in the dealer block and on narrow screens).
- **On the cover:** primary is light foil gold fill with navy text and a navy double border; secondary is transparent with stock text and border. Primary hover lightens the fill to `#dac596`; secondary hover adds a 8% stock wash.
- **On stock (dealer block):** primary is navy fill with stock text and border, hover navy-deep; secondary is transparent with navy text and border, hover a 7% navy wash.
- **States:** hover rotates to 0deg and lifts 1px; active rotates to 0deg and drops 1px (180ms, ease-out). Focus: 2px outline, offset 5px, in light foil gold on navy and navy on stock.
- **Sets:** cover: Randevu al (primary), Ara, WhatsApp. Dealer block: Randevu al (primary), Ara, Yol tarifi.

### Plates
Photographs tipped into the booklet.
- **Style:** 10px plate-white border, the plate shadow, square corners, rotated by lane.
- **Caption:** typed, soft ink, inside the plate border above the photo.
- **Archive captions:** an undated archive plate is captioned "Arşivden, tarihsiz: …". Where a whole album of undated plates shares a leaf, one typed note beside the text states that the dates are not recorded, and the plate captions describe the scene only. Never invent a year for an archive photo.

### Stamps and Seals
- **Entry stamp:** rectangular. A 3px solid border plus a 1.5px outline offset 3px, Archivo Narrow uppercase text with a small second line, stamp violet, ink filter (turbulence-displaced edge and uneven coverage), multiply blend, rest rotation -6deg, opacity 0.92.
- **Stamp box:** the field the stamp lands in. 232px by 128px, dashed strong-rule outline, a form label at the lower left.
- **Seal:** round. Two outer rings and an inner ring, curved text around the ring, "1954" in Besley at the centre. Stamp violet, ink filter, multiply. Used on the banner plate and the dealer block.
- **Press-in:** stamps start at scale 1.35, rotation -14deg, blur 3px, opacity 0, and settle to their rest pose (260 to 340ms, ease-out) when the car passes. The dealer seal presses in from scale 1.4, -30deg.
- **Foil seal (on navy):** the same round seal, pressed into the front cover in light foil gold, with no ink filter and no multiply blend; opacity 0.95, rest rotation -14deg. It presses in from scale 1.4, -30deg (260ms opacity, 340ms transform) when the cover arrives.

**The Foil Seal Rule.** On navy the seal is foil, not ink: light foil gold, crisp, unblended. Stamp violet with the ink filter and multiply stays on stock.

### Entry Pages
A ruled page with a heading, two paragraphs, and a stamp box on the text side; a plate on the road side. The text column snaps to the ruling (see Layout).

### Dealer Block
The contact record, styled as a dealer stamp block.
- **Style:** stock fill, 4px double navy border, padding 32px 32px 40px (28px 24px 36px on narrow screens).
- **Content:** a definition list. Form labels (Archivo Narrow, uppercase, navy) over typed values (Courier Prime, tabular numerals). Links underline in the strong rule colour, full colour on hover.
- **Seal:** a round seal overlaps the top right corner and presses in at the end of the drive.

### Road
A printed route on the stock: a wide band of navy at 7% opacity (width scaled to the car, about 92px by default) with round caps and joins, plus a 2px dashed centre line (14 on, 12 off) in navy at 26%. Straight lanes run near the page margins, joined by rounded corners. It starts under the parked Volvo and ends at the forecourt of the 1954 garage.

### 3D Stage
- **Camera:** orthographic, fixed to the viewport. A shallower banner view while parked; a steeper drive view once on the road.
- **Drive:** scroll maps to distance along the road. The vehicle sits at 58% of the viewport height. Sideways and uphill road costs less scroll, so the car lags on crossings and catches up going down. Progress eases toward the target (exponential, rate 7 per second); heading eases at rate 14.
- **Lighting:** room environment, one white directional light, a cool hemisphere fill (`#f2f4fa` over `#8d93aa`), ACES filmic tone mapping at 1.05 exposure. Soft contact shadows under each vehicle.
- **Car to truck:** a noise dissolve, not a shape morph. The car's surface is eaten away by 3D noise while the truck fills in, with the dissolve edge in dissolve-edge gold.
- **Into the garage:** the truck shrinks along the forecourt and again in the doorway. Past the door threshold its pixels darken toward garage dark, then it dissolves into that dark.
- **Reduced motion and no WebGL:** cars hold fixed poses; the truck waits in front of the door; every stamp and seal is already applied. Without WebGL the canvas is removed and the road still prints.
- **Page attributes (read by assets/js/main.js):** `data-lane="left|right"` on each entry sets the road's lane; `data-stamp` marks anything stamped when the vehicle draws level (stamp boxes, work-order lines, ticks, seals); `data-bay` and `data-podium` mark the brand turntable spot, and `data-brands` the picker whose choice becomes the driven car; `data-truck` marks the page the truck carries (the car becomes the truck on the crossing onto it).
- **Garage attributes (opt-in, on `.finale`):** `data-door="left right top bottom"` gives the door opening as fractions of the garage photo (default 0.17 0.47 0.365 0.845, the arsiv-eski-dukkan scan; anasayfa-v2.html uses 0.162 0.474 0.37 0.86, matching its walls clip). `data-truck-lane="left|right"` names the lane the truck comes down (default: between the photo and the dealer block on wide screens, the right lane on narrow). `data-door-at` (anasayfa-v2.html: 0.42) is a fraction of the viewport height: when the garage is not at the very end of the page, the last stretch of the drive is compressed so the truck reaches the door while the door stands at that height on screen.
- **Turntable podium (wide screens only):** drawn into the road layer at the foot of the bay: a plate-white top with a strong-rule edge, a light-foil-gold edge line, foil gold rings (2px, and 1px at 70%), and a navy side. Below 900px the bay is hidden and the car does not stop.

### Margin Rail (Hakkımızda)
The booklet's margin, with a ruler and the year of the page being read.
- **Rail:** 150px wide, a 2px strong-rule line on its right edge, above the leaves (z 3). The logo at the top (104px wide) is the home link.
- **Ruler:** printed ticks in navy at 55% opacity, starting 236px down: a long tick (22px by 1.5px) every 60px and short ticks (9px by 1px, 70%) every 12px.
- **Year readout:** sticky at the top of the rail. A form label ("Karne yılı"), the year in Courier Prime Bold (40px, -0.02em, navy), and a typed note in soft ink (14px). The readout background takes the tone of the leaf under it (400ms), so leaf labels on the ruler slide beneath it.
- **Rolling digits:** each digit is a 1em window over a strip of 0 to 9 plus a blank cell. When a leaf reaches the reading line, each strip rolls to its digit (720ms, ease-out, 70ms stagger per digit).
- **Blank year:** an undated period shows four separate short underlines (3px, current colour, inset 16% each side), one per digit, like an unfilled form field; never one continuous rule and never a guessed year.
- **Leaf labels:** each older leaf writes its year (Courier Prime Bold, 18px) on the ruler beside its first line; the label fades out once the readout has taken it. Today's label is for screen readers only.
- **Narrow screens:** the rail becomes a sticky 56px top bar with a 2px strong-rule bottom line and the current leaf tone; logo at 96px on the left, label and year (24px) inline on the right; ruler, note, and leaf labels hidden.
- **Reduced motion:** the year jumps and the tone changes without transition; every stamp is already applied.

### Leaves (Hakkımızda)
Reverse-turned booklet pages, newest first, each on its own aged-stock tone with the page-block edge at its top. Each leaf carries a heading, text, a stamp box, and one or more plates.
- **Class-name note:** in hakkimizda.css a leaf is `.sayfa`, because site.css already owns `.leaf` (the right half of the homepage banner). Do not reuse `.leaf` for page leaves.

### Miras (ceremonial edition)
The heritage page (miras.html, miras.css, miras.js). All Miras copy, owner quotes, and cite names are Lorem Ipsum placeholders by the user's choice (2026-11-03); the layout holds longer or shorter text. Only 1954, 2017, and the current year are shown; other periods use the blank year.
- **Navy cover board:** navy with stock text and the cover's double foil frame (2px foil gold, inset clamp(16px, 2.2vw, 32px), then a 1px foil gold hairline at 70% another 7px in). Selection on navy is light foil gold with navy text.
- **Navy leaf:** the Volvo Yetkili Servisi chapter is a navy leaf in the same double foil frame. Heading and typed period in light foil gold, text in stock. Plates on it keep their white border and shadow.
- **Blank year:** an undated chapter's typed period is four separate 3px underlines (0.75em each, 6px apart, current colour), marked `role="img"` with the label "Tarih bilinmiyor". Same rule as the margin rail's blank year.
- **Menu:** Miras is a row under Hakkımızda in the menu.

### Then/Now Plate (Miras)
One plate, two photographs of the same place, and a seam the visitor drags.
- **Plate:** a normal plate (white border, plate shadow, slight rotation). Typed captions above the photo, "Dün · …" at the left and "Bugün · …" at the right. Photo box 3:2 (4:5 for the portrait lift pair).
- **Seam:** the archive photo sits on top inside a window (`.karsilastir__dun`) that slides left while the photo inside slides back by the same amount, so the photo stays still. The seam is a 3px plate-white line on a full-width layer moved by `translateX(var(--ayrim))`. Only transforms change, so dragging and the sweep do not repaint the photos; the sweep runs as Web Animations on those transforms and hands back to `--ayrim` when it ends. Do not go back to animating `clip-path` or `left`: it stutters on large photos.
- **Control:** a native range input (0 to 100) covers the photo, invisible, with an `ew-resize` cursor and `touch-action: pan-y` so the page still scrolls on touch. The script sets `aria-valuetext` to "Dün %N, bugün %M". Without the script the seam rests at its mark.
- **Handle:** a 60px round navy disc with a 4px double light-foil-gold ring and a light-foil-gold double chevron. No shadow. Hover scales it to 1.06 (180ms). Keyboard focus draws a 2px plate-white outline, offset 3px.
- **Sweep:** the cover's plate starts with the seam at 100% (all archive). Once the archive photo has loaded and half the plate is in view, the seam sweeps once to its rest mark of 52% (2200ms, ease-out cubic, after a 300ms pause). Any touch of the control stops the sweep. Reduced motion: no sweep, the seam rests at 52%. The other plates rest at 50%.

**The Handle Is A Seal Rule.** The then/now handle is a small foil seal on navy: round, flat, double-ringed in light foil gold. It is the second circle in the system, after the round seal.

### Owner Quote (Miras)
A slot for the owners' words.
- **Style:** italic Besley, 24px/1.4, body ink. A hanging opening quote mark (Besley 72px) sits outside the left edge of the text: navy on stock, light foil gold on navy. On narrow screens the text is 22px and the mark sits above it instead of hanging.
- **Cite:** typed (Courier Prime, 15px, soft ink; light foil gold on navy), preceded by "— ", in the form "Ad Soyad, kurucu aileden".
- **Wide variant:** a quote set across the page under a chapter, indented two columns, clamp 28px to 36px, max 36ch, with a 96px quote mark. 24px on narrow screens.

### Archive Plates and the Viewing Board (Miras)
- **No captions under photos (user decision, 2026-11-03):** on Miras, plates carry no explanatory caption below the picture; the photo is described only in its `alt` text, which keeps "Arşivden, tarihsiz: …" for undated archive photos. This overrides the archive-caption rule for this page only. The "Dün · … / Bugün · …" side labels above then/now photos and the quote cites stay.
- **Develop on entry:** archive plates marked `data-gelis` start pale and soft (opacity 0.6, brightened, low contrast, sepia, 4px blur) and develop to the full print when 35% is in view (filter 1800ms, opacity 1200ms, ease-out). The pale state applies only after the script adds its class, so without the script or with reduced motion plates are shown developed.
- **Open full size:** each archive plate's photo is a button. On hover or focus a 40px plate-white square with a navy magnifier (inline SVG) rises in at the lower right; the cursor is `zoom-in`.
- **Viewing board:** a native `<dialog>` opened with `showModal()`. The plate is shown full size (up to 1180px wide and the viewport height minus 120px), without a caption, on a navy-deep backdrop at 94%. It opens with a 320ms fade and a small turn (from scale 0.97, -0.6deg). The close button is a 52px stamp box: navy fill, 4px double light-foil-gold border, light-foil-gold cross, rotated -1.2deg, straightening on hover, fixed at the top right. Escape, the close button, or a click on the backdrop closes it, and focus returns to the plate that opened it. Without dialog support the plate buttons are disabled.

### Facade Film (Miras)
The building at blue hour as a muted, looping video in a plate (aspect 1920/824, navy-deep while loading, with a poster). It has no caption; under the picture, at the right, sits a small stamp-box control: Archivo Narrow 600, 13px, uppercase, 4px double navy border, min height 40px, rotated -0.8deg, straightening with a 7% navy wash on hover. It reads "Durdur" while playing and "Oynat" when held. The film also pauses whenever it is off-screen and resumes only if the visitor has not held it. Reduced motion: the film does not autoplay and the control reads "Oynat". The control is hidden until the script runs.

### Index Tabs (homepage v2)
Thumb-index tabs cut into the edge of a board or page; one tab per choice in a section.
- **Shape:** square, 1px or 1.5px strong-rule border, open on the side that meets the board, min height 48px (60px on the service board's fore-edge).
- **At rest:** deep stock with navy label text. Closed tabs rest 6px down into the edge and rise 4px on hover; the service tabs slide out 3px and lighten instead.
- **Open:** on a navy board, navy fill with light-foil-gold text (the service tab adds a 14px light-foil-gold tick); on a paper page, plate white with a navy border.
- **Behaviour:** ARIA tabs with click, arrow keys, Home and End. A single campaign hides its tab row. Reduced motion: no slide or wipe.
- **Uses:** service board (eight tabs down the fore-edge, a scrolling row above the board on narrow screens), campaign band (two or three tabs on the top edge, with a typed date), floor page (tabs on the top edge with a small floor-stack mark, current floor filled).

**The Index Tab Rule.** Choices inside a section are square index tabs on the edge of the board or page they open.

### Hero Band (homepage v2)
- **Print:** the sunny facade film fills the hero (object-fit cover); it plays only while on screen and never with reduced motion (the poster stays). A typed tag on plate white (13px, soft ink) names the place at the lower left of the measure. Parking spots for the Volvo and the two small cars are percentages of the print.
- **Band:** a full-width navy band 56px below the top, over the print: 2px foil gold plus a 1px foil gold hairline at 70%, 7px apart, 14px inside its top and bottom edges. On the 12-column grid: the oval logo (columns 1 to 2, 188px at most), the one-line title in light foil gold (columns 3 to 12), the subhead in stock (columns 3 to 7) and the three cover stamp-box buttons, right-aligned (columns 8 to 12). Below 900px the band stacks above a 460px print.

### Service Board (homepage v2)
A navy board (columns 3 to 11) with the cover's double foil frame inset 24px and 31px, a heading row over a foil hairline, and the index tabs on its fore-edge. The open leaf has two columns: a navy-line blueprint sheet of the part (16:10, 0.6deg) with a workshop plate tipped over the board's left edge toward the road (74% wide, -1.6deg); and the name, body, a typed scope list with light-foil-gold dash leaders between foil hairlines, and stamp-box buttons. A new leaf slides in 18px from the fore-edge (340ms; text 40ms later).

### Coupon Band (homepage v2)
A cover band from the left screen edge to about 16px before the right lane, the foil frame running off the left edge, the perforated edge beside the lane. Inside (7fr / 5fr): the offer (offer figure, heading, lead, terms as foil labels over typed values under a foil rule, stamp-box buttons, and the last day in a 4px double light-foil-gold box rotated -2deg) and the part photo breaking out of the band over its blueprint line drawing masked in light foil gold at 75%. On a tab change the offer rises 10px (380ms) and the part slides in from 28px, 4deg (520ms).

### Work-Order Slip (homepage v2)
The customer copy of a work order beside the left lane.
- **Sheet:** plate white, -0.7deg, punched holes along the top, the aged-cream carbon copy under it (offset 14px, 12px, rotated 1.6deg, plate shadow).
- **Head:** logo, the form label "İş emri · müşteri nüshası" and the carbon number (typed, stamp violet), over a 2px navy rule; three meta fields as small labels over dotted fill-in lines in carbon type.
- **Lines:** number (typed bold, stamp violet), title and text, a paraf field, a tick box. When the car draws level (`data-stamp`) the paraf, a hand signature in stamp violet (1.8px stroke), writes itself in 700ms, then the tick presses in 520ms later.
- **Foot:** two signature lines (label over a 1.5px navy rule); the round seal presses in 600ms after the foot is reached (0.88, -12deg).
- **Clipped plates:** two photo plates held at the top edge by a navy wire clip, overlapping the slip by 64px (58% wide at -2.4deg; 44% at 2.2deg).

### Quote Form and Turntable (homepage v2)
- **Brand picker:** radio inputs dressed as ink stamp-box buttons; the checked brand is navy with stock text and border, straightened. It swaps the engine drawing, the brand note, and the car on the turntable.
- **Engine blueprint plate:** a plate (-1.4deg) holding a navy ground (5:4) with a 32px light-foil-gold grid and a 1px light-foil-gold frame inset 10px; the drawings cross-fade in 260ms; a title block at the lower right (small label and typed text, light foil gold, hairline cells).
- **Quote form:** a plate (0.6deg) raised 64px into the row above, beside the turntable. A form label and typed copy mark over a 2px navy rule, the title, three steps (Besley numeral, tick box and step title, text, a typed field with a dotted fill-in line), and a signature line with an X. Its stamp box drops the dashed outline and overhangs the lower right corner (248px wide); the stamp reads "Onayınız olmadan işlem yok".
- **Tick box:** 18px (20px in the work order), 1.5px navy border, plate white; the tick is stamp violet with the ink filter and multiply, pressing in from scale 1.4, -8deg (200ms opacity, 260ms transform).
- **Ink arrow:** a stamp-violet 3.4px stroke with the ink filter from the bay toward the form.

### Type Plate (homepage v2)
The facility's maker's plate. Pale steel fill (`#e2e5ec`), 1.5px navy border, an inner 1px navy line at 45% inset 6px, the plate shadow, -0.5deg, a bolt in each corner. A navy band at the top carries tab-label text in light foil gold. Below, a 4-column grid ruled in 1.5px navy: small labels over figures; one 2-by-2 cell holds the large value, a full-width row on a deeper tint (`#d9dde7`) holds the car count, and a typed foot closes the plate. Two plates (the building, the team) stand beside the right lane, the team plate overlapping at z 3. Two columns on narrow screens.

### Floor Page (homepage v2)
- **Kat dizini card:** a 4px double navy record box on stock (360px at most): label title over a strong rule, then rows of label, dotted leader, and typed value, and a typed note.
- **Page:** plate white, 1.5px navy border, the plate shadow, 0.6deg, with the floor index tabs on its top edge. All floors share one grid cell, so the height never changes; on a tab change the drawing wipes in from the left (520ms).
- **Pins and legend:** 30px navy square pins with typed bold stock numerals, a 2px plate-white border and a 1.5px navy outline; the matching legend has 26px outlined number squares. Pins and legend rows light each other on hover (pin to stamp violet and scale 1.18, legend number to navy fill). A seal presses in at the page's lower right.

### Postcard Deck (homepage v2)
Google reviews as postcards on a navy board.
- **Board:** starts right of the left lane and bleeds off the right edge; the foil frame is open on the right.
- **Summary:** heading, lead, and the Google tally in a 4px double foil gold box (label, score figure, light-foil-gold stars, typed count), then a stamp-box link to all reviews.
- **Stars:** an outline row with a filled row clipped to the rating (`--r`), SVG, navy on cards (18px), light foil gold on the board (22px).
- **Picture postcard:** the building, hanging off the board over the road, -5deg, with an italic Besley caption tag on plate white.
- **Postcard:** plate white, the plate shadow, 680 by 453px, split 58/42 by a strong-rule line. Message side: stars, the review in Besley italic, typed name, car line under a dashed rule, typed source. Address side: a postage stamp (96px, dashed border, 2deg), the round seal as postmark (104px, -16deg), stamp-violet wavy cancel lines with the ink filter, typed address lines.
- **Deck:** one front card, two smaller behind it (scale 0.6, clickable), the rest waiting unseen; cards move between slots (520ms transform, 360ms opacity). The pager is two 52px stamp-box arrow buttons (4px double stock, inline SVG chevrons) around a typed counter, plus arrow keys and a swipe. On narrow screens one card shows with the next peeking behind.

### Darkroom (homepage v2)
- **Easel:** the enlargement on a plate (14px border, -0.9deg) with four crop blades, columns 1 to 7, over the lane. A typed caption row runs across the top. Picking a frame develops the print (from opacity 0.25, blur 6px, sepia, brightened; 700ms and 900ms).
- **Contact sheet:** a navy-deep film strip with perforations, three columns of square frames (slight grayscale, full colour on hover) with typed numbers in light foil gold. The picked frame is ringed by a light-foil-gold grease-pencil mark (`aria-pressed`).
- **Lineage band:** four entries across columns 3 to 12 between a 2px navy rule and a strong rule, navy arrows between: typed year (or the blank year), name, note; today's entry carries a seal. The car turns into the truck on the crossing onto this page (`data-truck`).

### Garage Leaf and Back Cover (homepage v2)
- **Garage leaf:** the 1954 garage plate on columns 6 to 12 (0.5deg) on aged cream, with typed captions at both ends; no stacking context, so the truck drives over the photo, and the walls copy (clipped around the door) closes over it. The truck comes down the left lane (`data-truck-lane="left"`).
- **Back cover:** a full-bleed navy cover 264px below the photo (room for the truck's run). The back-cover title, lead, and cover stamp-box buttons on columns 1 to 7; the contact list on columns 8 to 12 under a 1px light-foil-gold rule at 50%: light-foil-gold labels over typed stock values, links underlined in light foil gold. A 208px foil seal presses in 200ms after 30% of the cover is in view. The imprint (logo, typed 14px stock at 78%) sits over a foil hairline. Selection on navy is light foil gold with navy text.

## Do's and Don'ts

### Do:
- **Do** keep every vertical measure on the stock a multiple of the 32px ruling, and snap any off-grid heading back onto it.
- **Do** tip photos in as plates: 10px white border, the plate shadow, a small lane-matched rotation.
- **Do** apply stamps in stamp violet with the ink filter and multiply blending, slightly rotated.
- **Do** use double-ruled, square stamp boxes for calls to action, with one primary per set.
- **Do** keep record data (address, phone, hours, captions) in Courier Prime and form labels in uppercase Archivo Narrow.
- **Do** use foil gold only as lines on navy, and light foil gold for text and fills on navy.
- **Do** give every motion a reduced-motion end state where stamps are already applied and vehicles stand still.
- **Do** give each leaf of a reverse-turned page one flat aged-stock tone, warmer as it gets older.
- **Do** show an undated year as four separate blank underlines and caption undated archive plates "Arşivden, tarihsiz: …".
- **Do** press the seal in light foil gold, without the ink filter or multiply, when it sits on navy.
- **Do** give every then/now plate a native range input with `aria-valuetext`, and let reduced motion rest the seam at its mark.
- **Do** give every moving film a stop control and pause it off-screen.
- **Do** keep boards, plates, and text clear of the road lane; on narrow screens give the lane side 48px to 80px of padding.
- **Do** set large figures (plate values, scores, dates) in Courier Prime Bold with tabular numerals.
- **Do** offer choices inside a section as square index tabs on the edge of the board or page, as ARIA tabs with arrow keys, Home and End.

### Don't:
- **Don't** round corners. The booklet is cut square.
- **Don't** add shadows to buttons, stamps, or the dealer block; the only shadow is a plate resting on stock.
- **Don't** use gradients, glass, glow, or a dark showroom backdrop behind the cover or the stage.
- **Don't** retune the brand navy, gold, silver, near-black, or white from LOGO_2026.pdf.
- **Don't** set foil gold text on navy; it fails contrast.
- **Don't** set running copy in Archivo Narrow or Courier Prime.
- **Don't** let the browser synthesize bold for Besley or Archivo Narrow.
- **Don't** morph vehicle shapes into each other; vehicle changes are noise dissolves.
- **Don't** draw the page-block edge with a shadow or a gradient; it is flat strips and cut lines.
