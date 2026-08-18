# DESIGN.md — Parvalle

The design system actually shipped in `assets/styles.css`. Read with
[PRODUCT.md](PRODUCT.md).

## Visual world

**Quiet editorial modernism.** References: architecture publications, annual
reports, cultural-institution print, independent magazines. Explicitly *not*
SaaS templates, dashboard landing pages, startup gradients or card collections.

Three rules govern every page:

1. **Type carries the page.** Composition comes from scale contrast and rules,
   not from containers.
2. **A rule, not a box.** Grouping is expressed with 1px hairlines and generous
   vertical inset. Cards are not a layout system here.
3. **The chain is the brand asset.** The operating chain (Interessent → …→
   Analyse) is the one structure unique to Parvalle and gets the one authored
   motion on the site.

## Direction decision (refine vs. replace)

The incumbent **brand world was preserved** — palette, German copy, editorial
ambition and the Verkaufen/Betreiben/Verstehen frame are approved strategy.
The incumbent **layout and type systems were replaced**: they resolved to card
grids, eyebrow kickers, a fabricated dashboard mock, a marquee and
system-fallback fonts, none of which express Parvalle. This is a redesign of
execution inside a preserved brand frame.

## Colour

Fixed palette. Nothing outside this set ships.

| Token | Hex | Role |
|---|---|---|
| Papier | `#F5F3EE` | default ground, editorial warmth |
| Tiefenschwarz | `#14272B` | authority, typography, dark bands |
| Parvalle Teal | `#2F5C5A` | brand statement, links, primary buttons |
| Salbei | `#90A89B` | secondary tonal layer, scrollbar |
| Signal Amber | `#C98B38` | the operating chain + focus rings |
| Lemon | `#E9E77A` | one rare high-attention statement on dark |
| Risiko Rot | `#B65A52` | real warnings only (currently unused) |

**Measured contrast — every text role is ≥4.5:1 on its own ground:**

| Role | Value | On | Ratio |
|---|---|---|---|
| `--text` | `#14272B` | Papier | 13.98:1 |
| `--text-muted` | `#546260` | Papier | 5.75:1 |
| `--link` | Teal | Papier | 6.76:1 |
| `--text-on-ink` | Papier | Tiefenschwarz | 13.98:1 |
| `--muted-on-ink` | `#A8BDB2` | Tiefenschwarz | 7.81:1 |
| `--text-on-teal` | Papier | Teal | 6.76:1 |
| `--muted-on-teal` | `#D8E4DE` | Teal | 5.74:1 |
| Lemon | `#E9E77A` | Tiefenschwarz | 11.94:1 |

**Amber is never text on Papier** (2.62:1). On the light ground it is a rule,
a marker or a focus ring only. As text it appears only on ink (5.34:1).

Secondary text is tinted from the brand hue (`#546260`, `#A8BDB2`), never neutral grey.

## Typography

Two self-hosted variable faces. **No third-party font requests** — a brand that
markets DSGVO compliance must not hotline Google Fonts.

- **Newsreader** (400–700, optical size pinned at 40) — display. Editorial serif with real character; replaces the previous `Iowan Old Style → Times New Roman` fallback chain.
- **Archivo** (400–700) — UI, body, labels, tabular numerals. Replaces Inter.

Subset to Latin + Latin-Ext with German punctuation: **76 KB total**, of which a
German visitor loads **61 KB**.

Scale — three clean steps at the small end (ratio ≈1.25), fluid display above:

```
--t-marker 12px   --t-small 15px   --t-body 18.8px
--t-lead   clamp(21.6px … 27.2px)
--t-h3     clamp(21.6px … 29.6px)
--t-h2     clamp(32px   … 54.4px)
--t-h1     clamp(41.6px … 86.4px)   /* display ceiling 5.4rem */
```

Leading: body `1.62`, titles `1.12`, display `1.06`. Tight display leading is
intentional; body text never goes below 1.3. Measure 66ch (60ch under 620px).
Tracking floor −0.04em. German compounds break with `overflow-wrap: anywhere`
plus `hyphens: auto`.

## Layout

- Containers: `76rem` default, `88rem` wide; gutter `clamp(1.25rem, 4vw, 3.5rem)`.
- **`.spread`** is the structural unit: a narrow margin column carrying a section
  marker beside a wide content column. This replaces stacked kickers.
- **`.ledger`** — ruled rows, the default for any list of items. Replaces cards.
- **`.chain`** — the operating chain with its amber rail.
- **`.triptych` / `.index-grid` / `.commitments` / `.values`** — ruled column sets.
- Every grid track is `minmax(0, …)`. Bare `1fr` allows min-content blowout and
  is a bug, not a shortcut.

Section rhythm alternates ground rather than repeating a module: Papier →
Papier → **Ink band** → Papier → **Teal band** → closing. No two adjacent pages
use the same cadence.

## Motion

**One authored moment:** the chain's amber rail fills against the reading line
as the visitor scrolls, and each stage's dot fills as it is passed. That is the
whole motion budget.

There are **no scroll-reveal entrances**. Content is visible, readable and
navigable before JavaScript runs; JS is never a precondition for reading the
page. Removed for cause: fade-up reveals on every section, kinetic headline
splitting, the auto-scrolling marquee, magnetic cursor buttons.

`prefers-reduced-motion`: the chain renders complete (state preserved) and
travel is removed. Deliberately **not** a global `0.01ms` kill — hover, focus
and link transitions survive.

## Interaction

- Buttons ≥48px tall; links ≥44px. Full-width buttons under 620px.
- Focus ring: 3px Amber (Lemon on dark), 3px offset — never removed.
- Mobile navigation is a `<details>` disclosure: it works with **zero
  JavaScript**. JS only adds Escape, outside-click and resize housekeeping.
- Browser surfaces are themed: selection, scrollbar, `accent-color`,
  underline offset, tabular numerals.
- `@media (hover: none)` drops hover-dependent affordances.

## Accessibility rules

WCAG 2.2 AA. Skip link on every page. One `h1`, no skipped levels. Landmarks
(`header`/`nav`/`main`/`footer`) with `aria-label` on each nav. `aria-current="page"`.
Meaning is never carried by colour alone. Content must survive 200% page zoom
and 200% text-only zoom without horizontal scrolling, and 320px width.
Decorative glyphs are `aria-hidden`.

## Parvalle-specific anti-patterns

Never ship, on this brand:

- Eyebrow/kicker labels stacked above a heading — use a `.spread` margin marker.
- Same-size cards of label + heading + text as page structure; nested cards.
- Decorative section numbering. Numbers appear **only** on the operating chain,
  where the sequence is the information.
- Fabricated product UI, dashboards, charts, sparklines or metric tiles. The
  previous hero mock invented booking data and was removed.
- Auto-scrolling marquees, magnetic cursor buttons, scroll-jacking.
- Purple/blue SaaS gradients, gradient text, neon, cyan-on-dark, glass as decoration.
- Thick coloured side tabs (>1px) on cards, callouts or list items.
- Unicode glyphs or emoji as an icon system.
- Grey text on coloured grounds; Amber text on Papier.
- System fallback fonts as the display voice.
- Any claim from the "forbidden" list in PRODUCT.md.

## Verification

`node .claude/skills/impeccable/scripts/detector/detect-antipatterns.mjs *.html assets/styles.css`

Known standing false positives, each verified in a real browser:

- **`cramped-padding`** — the analyser does not resolve `padding-block` with
  `var()`/`clamp()`. Flagged elements measure 24–89.6px of real inset.
- **`low-contrast`** — the analyser assumes a white ground for `.on-ink`
  descendants. Composited measurement gives **0** failures.
- **`tight-leading`** — display type only (≥24px). Zero multi-line body text
  below 1.3.
- **`flat-type-hierarchy`** — the analyser cannot resolve `clamp()`, so it sees
  only the three small steps and none of the display range up to 86px.
- **`cream-palette`** (if it returns) — Papier `#F5F3EE` is a pinned brand
  colour. The brief wins.
