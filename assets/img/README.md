# Imagery — brief, licence rules and pipeline

Photography on this site is **not decoration**. It exists in four places where a
picture does work type cannot: showing what a course actually looks like. See
DESIGN.md for the visual world it has to sit inside.

## How to add photos

1. Put the original in `assets/img/src/<slot>.jpg` — full resolution, at least
   **1600px** on the long edge. Sources are gitignored; the built derivatives
   are committed.
2. `node tools/build-images.mjs --check` — validates sources without writing.
3. `node tools/build-images.mjs` — writes AVIF + WebP + JPEG at three widths
   each, plus `manifest.json`.
4. `node tools/build-images.mjs --markup` — prints the exact `<picture>` block
   to paste into the page named for each slot.

The build crops to each slot's ratio using saliency detection, so hand-cropping
first is unnecessary. Budget is 260KB per derivative; the build fails loudly if
a file exceeds it.

## The four placements

| Slot | Page | Placement | Crop | What it has to show |
|---|---|---|---|---|
| `kursraum` | index | full-bleed band after the Kursprozess section | 21:9 | A course room just before it starts. Empty or near-empty chairs, daylight. The pause between two dense text sections. |
| `werkstatt` | produkt | beside "Ein Kurs bleibt ein Kurs" | 3:2 | A prepared worktable. Grounds the abstract talk about Kurs / Termin / Buchung / Teilnehmer in a real room. |
| `weitergeben` | ueber-parvalle | beside the Vision copy | 3:2 | One person showing another how something is done. Hands and attention, not faces to camera. |
| `yoga` `toepfern` `outdoor` `musik` | fuer-wen | row under the "Beispiele" display type | 4:5 | Four course worlds. These make "für wen" concrete in one glance. |

## What to look for

- **Real rooms, real materials.** Clay, wood, mats, instruments, daylight. The
  brand is DACH, independent and grown-up; the picture should look like a room
  someone actually teaches in.
- **Muted, warm, low contrast.** The ground is Papier `#F5F3EE`. Photographs
  with cool blue casts or heavy saturation fight it. Slightly desaturated,
  warm-neutral images sit down next to Teal `#2F5C5A` without arguing.
- **Off-moment over posed moment.** Setting up, tidying, demonstrating,
  concentrating. Not a group grinning at the lens.
- **Hands and objects over faces.** This is the important one — see below.
- **Room for the crop.** Subject not jammed against an edge; `kursraum` in
  particular loses a lot of height at 21:9.

## What to reject

- Anyone smiling at the camera, thumbs up, high-fives, applause.
- Laptops, dashboards, screens, sticky notes, whiteboards, "team meeting",
  handshakes, headsets, coworking spaces. This is a course business, not a SaaS
  office.
- Purple/blue gradient lighting, neon, lens flare, heavy bokeh, tilt-shift.
- Obvious stock-set styling: matching outfits, empty branded mugs, models who
  look cast rather than present.
- Anything where a brand, logo, or a minor is identifiable.
- AI-generated imagery. It reads as such next to real typography, and the
  licence position is unsettled.

## Licence rules

Only images that are free for commercial use **without attribution** may ship:

- Unsplash Licence, Pexels Licence, Pixabay Content Licence — all fine.
- CC0 / Public Domain — fine.
- CC BY / CC BY-SA — only with the attribution rendered on the page. Prefer to
  avoid; there is currently no credits surface.
- Anything "editorial use only", or with an identifiable person and no model
  release — **do not ship**. This site is commercial.

Record what you used in `assets/img/CREDITS.md` (source URL, photographer,
licence, date retrieved) even when attribution is not required. If the licence
is ever questioned, that file is the answer.

## Accessibility

Each slot has German `alt` text defined in `tools/build-images.mjs`. If a chosen
photo shows something different from what the alt text describes, **change the
alt text** — it describes the image that ships, not the image that was planned.

The four `Beispiele` images sit under display type that already names each
world ("Yoga. Tanz. Töpfern…"). If a caption would only repeat that word, leave
the caption out and keep the alt text descriptive.

## Why the derivatives are committed

The site is static and has no build step in deployment. Committing the built
AVIF/WebP/JPEG keeps `index.html` a file you can open. Sources stay out of git
because they are large and never served.
