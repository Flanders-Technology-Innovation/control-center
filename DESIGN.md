# elli — Design Language

> Where people health meets organizational readiness.

This is the **design specification** for elli: the rules, tokens, and patterns that make
something look and sound like elli. `README.md` describes *what is in this folder*;
this document describes *how to design with it*.

Read this before building any elli surface — marketing page, product screen, deck,
one-pager, or production component.

**Single source of truth for values:** `colors_and_type.css`. Every number in this
document exists there as a CSS variable. Link `styles.css` (which imports it) and use
the variables — never hardcode a hex.

---

## 1. Design principles

**1. Lead with the answer.**
The conclusion comes first, in plain language; the numbers support it. A screen that
opens with a chart has failed. A screen that opens with *"Engagement is on track —
Sales Commercial and Finance lead the company"* and puts the chart underneath has not.

**2. Calm, not decorative.**
elli is a serious instrument. Every surface earns its colour. The logo carries the
brand pop; the product stays quiet so the data can speak. No gradient surfaces, no
illustration libraries, no texture, no motion for its own sake.

**3. Trust borders over shadows.**
Hairline `1px solid var(--line)` defines almost every card. Shadows are a whisper, used
to separate layers — not to make things look "elevated" or "premium".

**4. One emphasis per screen.**
Exactly one Focus card (solid violet) per page. One pulsing dot per page. One human
touch per screen. Emphasis stops working when everything has it.

**5. Rigour is visible.**
Every page bearing a score ends with a Methodology note naming the validated
frameworks (BAT, JD-R, SDT, ADKAR, Bernerth). This is non-negotiable — it is *why* elli
is allowed to make claims.

**6. Suggest, don't prescribe.**
Recommendations are framed as options with an accept affordance, never as orders.
The UI never scolds. A low score is presented gently, with a next step attached.

---

## 2. Color

### 2.1 Brand identity — the five

Mapped to the logo tile and its three dots. Use these for identity, not for UI.

| Token | Value | Role |
|---|---|---|
| `--elli-indigo` | `#510CFF` | Deep electric violet — the logo tile |
| `--elli-mint` | `#20C279` | Signal mint — the **top-left** logo dot |
| `--elli-lavender` | `#C8C9FC` | Support — the **bottom-left** logo dot |
| `--elli-cream` | `#FAFAF4` | Support — the **top-right** logo dot |
| — | `#4F59EE` | The wordmark blue (`--indigo` in UI) |

The fourth (bottom-right) quadrant of the mark is **deliberately empty**.

> Retired: `#540CFF`, `#8188FF`, `#F1EDFF`, `#59EE83`. If you see these, they are from
> the pre-brand-book spec. Replace them.

### 2.2 UI palette

Everything in product. Tuned for AA contrast on white.

**Indigo — action, brand presence, key data**

| Token | Value | Use |
|---|---|---|
| `--indigo-deep` | `#510CFF` | Primary CTA, focus card fill, key numerals, focus ring source |
| `--indigo` | `#4F59EE` | Sidebar fill, eyebrow rule + text, link colour |
| `--indigo-ink` | `#3F18C1` | Hover/press of deep, data text, text on light indigo |
| `--indigo-50` | `#E3DDF7` | Selected-card fill, soft icon backdrop, rank chips |
| `--indigo-25` | `#EEEAFB` | Large surface wash, focus ring, quiet button fill |
| `--indigo-tint` | `#F5E4FF` | Tagged-pill background |
| `--lavender` | `#C8C9FC` | Benchmark "sector" bars, hover border, decorative |

**Status — the three signals**

| Meaning | Fill | Text | Base |
|---|---|---|---|
| On track / good | `--mint-soft #D5F3E5` | `--mint-ink #0E7D43` | `--mint #20C279` |
| Watch / developing | `--amber-soft #FEF3C7` | `--amber-ink #92400E` | `--amber #F59E0B` |
| Focus / at risk | `--rose-soft #FEE2E2` | `--rose-ink #991B1B` | `--rose #E11D48` |

Mint is the **only** green in the product, and it is the same green as the logo dot.
Rose is used sparingly and **never** as marketing decoration.

**Neutrals — calm, slightly warm**

| Token | Value | Use |
|---|---|---|
| `--ink` | `#232730` | Primary text; also the dark section background |
| `--ink-muted` | `#666B71` | Secondary text, leads, table meta |
| `--ink-faint` | `#9CA1AB` | Tertiary text, units, column headers |
| `--line` | `#E1E2E6` | Hairline borders, table separators |
| `--canvas` | `#F1F2F6` | Inset surfaces, code, explainer blocks, neutral pills |
| `--paper` | `#FFFFFF` | Card background — cards only |
| `--paper-warm` | `#FAFBFD` | **App** background — never pure white |
| `--warm-white` | `#FAFAF4` | **Marketing** background — subtly warm |

### 2.3 Colour rules

- **RULE 03 — tints, not gradients.** Soften violet with a flat tint (`--indigo-25`,
  `--indigo-50`), never a linear gradient between two hues. A single-hue radial
  *highlight* over a solid fill is allowed (that is how the Focus card is built).
- **Colour by meaning, not by direction.** A falling burnout number is mint, not rose.
  Trend tone is a separate decision from arrow direction (`trendTone` on `KpiCard`).
- **Never pure white as a page background.** App = `--paper-warm`, marketing =
  `--warm-white`. `#FFFFFF` is reserved for cards sitting on top.
- **One coloured shadow exists**: the CTA's `rgba(81,12,255,.28)`. Nowhere else.

---

## 3. Typography

**Nunito** (Google Fonts, 300–900) for everything. One typeface, no display face, no
brand mono — system mono only for code. Loaded via `@import` in `colors_and_type.css`;
`fonts/` holds Nunito Sans as an offline fallback only.

### 3.1 The weight system

The single contrast that defines elli's typography is **800 headings ↔ 400 body**.

| Weight | Use |
|---|---|
| **800** extrabold | Wordmark, display, all headings, statistics, buttons, tags |
| **700** bold | Card titles, inline emphasis, pills, table names, nav active |
| **400** regular | Every body sentence |
| 500–600 | Captions and UI chrome only (nav items, labels, meta) — **never body** |

### 3.2 Scale

| Token | Size | Line | Weight | Use |
|---|---|---|---|---|
| `--t-display` | `clamp(40px, 5vw, 56px)` | 1.05 | 800 | Marketing hero (`.elli-display`) |
| `--t-h1` | `34px` | 1.1 | 800 | App page title (`.elli-h1`) |
| `--t-h2` | `22px` | 1.25 | 800 | Section / card section title |
| `--t-h3` | `18px` | 1.35 | 700 | Card title |
| `--t-h4` | `15px` | — | 700 | Small heading |
| `--t-body` | `16px` | 1.6 | 400 | Body |
| `--t-body-sm` | `14px` | 1.6 | 400 | Table cells, secondary copy — **the floor** |
| `--t-meta` | `13px` | 1.5 | 600 | Captions, table footers |
| `--t-eyebrow` | `11px` | — | 700 | Uppercase tracked label |
| `--t-pill` | `12px` | — | 700 | Pills |

Data numerals: `36px / 800 / -0.02em`, `--indigo-ink`, with the unit at `0.5em / 700 /
--ink-faint` (`.elli-data`). Marketing hero scales larger via `clamp()`.

### 3.3 Tracking

- Headings sit **tight**: `-0.015em` (`--tr-heading`) to `-0.03em`. The wordmark is
  tightest at `-0.04em`.
- Eyebrows sit **wide**: `0.14em` (`--tr-eyebrow`) uppercase in product; marketing
  section eyebrows open up to `0.18–0.22em`. The larger the label, the wider the track.

> Note: the token `--tr-eyebrow` is `0.14em`, the `Eyebrow` component ships `0.16em`,
> and the UI kits use `0.18em`. Anywhere in `0.14–0.22em` is on-brand; prefer the token
> in product chrome and the wider end for marketing.

### 3.4 Semantic classes

`colors_and_type.css` ships ready-made classes — use them instead of restyling:
`.elli-display` · `.elli-h1` · `.elli-h2` · `.elli-h3` · `.elli-h4` · `.elli-eyebrow` ·
`.elli-body` · `.elli-prose` · `.elli-muted` · `.elli-meta` · `.elli-data` · `.elli-mono`.

`.elli-display .accent` and `.elli-prose strong` both resolve to violet — that is the
sanctioned way to highlight a word.

---

## 4. Space, shape, depth

### 4.1 Spacing — 4pt grid, with intent

`--s-1 4` · `--s-2 8` · `--s-3 12` · `--s-4 16` · `--s-5 20` · `--s-6 24` · `--s-8 32` ·
`--s-10 40` · `--s-12 48` · `--s-16 64`

Rhythm in practice: section breaks **32px**, intra-card **18–24px**, intra-row **14px**,
card internal padding **24–28px**, marketing section padding **80px**. The app never
feels crammed.

### 4.2 Radii

| Token | Value | Use |
|---|---|---|
| `--r-sm` | `8px` | Rank chips, dense inputs, inset explainers |
| `--r-md` | `12px` | Metric cards, inputs, small cards, avatars |
| `--r-lg` | `18px` | **Primary cards — the workhorse** |
| `--r-xl` | `24px` | Marketing form cards, large containers |
| `--r-pill` | `999px` | CTAs, status pills, nav highlights, language switcher |

### 4.3 Shadows

| Token | Use |
|---|---|
| `--shadow-tight` | Inset / secondary cards |
| `--shadow` | Primary cards on paper |
| `--shadow-lift` | Floating elements — modals, dropdowns |
| `--shadow-cta` / `--shadow-cta-hover` | The violet CTA only |
| `--shadow-focus-ring` | `0 0 0 3px var(--indigo-25)` — every focusable control |

No inner shadows. No glows. Never the default browser focus ring.

### 4.4 Layout

- `--sidebar-w 248px` fixed, sticky full-height, solid `--indigo`.
- `--topbar-h 62px`, `18px 36px` padding, hairline bottom border, `--paper-warm` fill.
- `--content-max 1280px` in app (`36px` padding); marketing sections cap at `1200px`
  (`80px 32px` padding).
- Standard app column splits: `1.1fr 1fr` (focus + summary), `1.25fr 1fr` (main +
  side), `repeat(3,1fr)` (KPI strip). Collapse to one column at `1100px` / `880px`.

---

## 5. Surfaces

Three background treatments and three card patterns cover ~90% of elli.

### 5.1 Backgrounds

- **Marketing** — `--warm-white` plus two soft radial halos:
  ```css
  background-image:
    radial-gradient(900px 600px at -10% -10%, var(--indigo-tint) 0%, transparent 55%),
    radial-gradient(700px 500px at 110% 30%, var(--indigo-25) 0%, transparent 60%);
  ```
  Atmosphere, not a "hero gradient".
- **App** — flat `--paper-warm`. Nothing else.
- **Dark sections** (marketing principles strip) — solid `--ink`, cards at
  `rgba(255,255,255,.05)` with `rgba(255,255,255,.12)` borders, eyebrows in `--lavender`,
  numerals in `--mint`.

### 5.2 The three cards

**Paper card** — the default.
`background: var(--paper)` · `border: 1px solid var(--line)` · `border-radius: var(--r-lg)`
· `padding: 24px 26px` · `box-shadow: var(--shadow-tight)`.
Holds tables, stats, neutral content.

**Wash card** — supporting/contextual content.
`background: var(--indigo-25)` · `border: 1px solid var(--indigo-50)` · same radius.
**Flat fill. No gradient.**

**Focus card** — one per page, the single most important thing.
`background: var(--indigo-deep)` solid, white text, white pill CTA,
`box-shadow: 0 8px 28px rgba(81,12,255,.18)`, and a radial white highlight inside:
```css
.focus-card::before {
  content: ''; position: absolute; top: -80px; right: -80px;
  width: 260px; height: 260px; border-radius: 50%;
  background: radial-gradient(circle, rgba(255,255,255,.12), transparent 70%);
}
```
Buttons on violet: solid white fill with `--indigo-ink` text (primary), or transparent
with a `1.5px rgba(255,255,255,.32)` border (ghost).

**Anti-pattern:** a card with a coloured left-border accent over a warm-tinted
background. Never build this.

---

## 6. Components

Four primitives are exported React components in `components/`, bundled into
`_ds_bundle.js` on `window.ElliDesignSystem_3b4b08`. Each injects its own styles once and
falls back to literal brand values when the CSS vars are missing, so they survive being
dropped into any page.

| Component | Key props | Spec |
|---|---|---|
| `Button` | `variant` primary·secondary·ghost·link · `size` md·sm · `as` | Pill, `800/14px`, `12px 22px`. Primary carries `--shadow-cta` and lifts 1px on hover. Secondary is white with a `1.5px --indigo-50` border. Ghost is `--r-sm`, weight 600. Link is `13px`, indigo, no chrome. |
| `StatusPill` | `status` ontrack·watch·focus·neutral·tag · `dot` | `11.5px/700`, `5px 12px`, pill. Sentence case — **never all-caps**. `tag` is the exception: uppercase, `--indigo-tint`, no dot. |
| `Eyebrow` | `rule` | `11px/700` uppercase indigo, with a leading `22px × 2px` rule. |
| `KpiCard` | `label` `icon` `value` `unit` `selected` `trend` `trendTone` | Label `13px/700 --ink-muted`, value `32–36px/800`, footer holds a `StatusPill` + trend. `selected` paints `--indigo-50` + `1.5px --indigo` border. `trendTone` is decoupled from arrow direction. |

The UI kits under `ui_kits/` are global-scope Babel prototypes to lift wholesale — not
part of the exported API.

### 6.1 Recurring patterns (from the kits)

- **Sidebar nav item** — `13.5px/600`, `9px 12px`, `10px` radius, `rgba(255,255,255,.78)`.
  Hover `rgba(255,255,255,.08)`; active `rgba(255,255,255,.18)` + weight 700.
- **Page header** — eyebrow → `34px/800` title → `15px --ink-muted` sub (max 580px),
  with an optional right-aligned meta card (`--paper`, `--r-md`, `14px 18px`).
- **Breadcrumb** — `13px/600 --ink-muted`, `·`-style separators in `--ink-faint`,
  current crumb `--ink/700`.
- **Language switcher** — pill track in `--canvas`, active chip white with
  `--shadow-tight` and `--indigo-ink` text. EN / NL / FR on every screen.
- **Benchmark row** — `180px 1fr 90px` grid; "you" bar `--indigo`, "sector" bar
  `--lavender`, both `9px` tall, `5px` radius, stacked 11px apart.
- **Action item** — rank chip (`--indigo-50` / `--indigo-ink`, `--r-sm`), title `700`,
  meta row of uppercase source pills, accept button in `--indigo-25`→`--mint-soft` once
  accepted.
- **Methodology note** — `--canvas` block, `--r-md`, `18px 20px`, `12.5px --ink-muted`,
  bolding the framework names. Bottom of every score-bearing page.
- **Privacy pill** (selfcare) — `--mint-soft` / `--mint-ink` pill with a lock icon,
  above the page title. The trust signal that anchors every employee screen.

---

## 7. Motion & interaction

- **Easing** `cubic-bezier(.2,.7,.2,1)` for transforms; `ease-in-out` for opacity.
- **Duration** 120–250ms for affordances; 800ms for screen cross-fades.
- **Cards lift** `translateY(-2px)` in app, `-4px` to `-6px` in marketing, with the
  shadow deepening. Border darkens to `--lavender`. **Never scale, never colour-flip.**
- **CTAs lift 1px** on hover with a deeper shadow. **Press = darker, not smaller.**
  Press is commitment, not a toy.
- **Focus** always `box-shadow: var(--shadow-focus-ring)`.
- **Pulse** — a mint status dot may `pulse` (opacity + scale, 2.4s). One per page.
- No bounces, no springs, no parallax, no scroll-jacking.

**Blur appears in exactly two places**: the floating language/atmospheric badges
(`backdrop-filter: blur(8px)` over `rgba(255,255,255,.7)`) and the marketing sticky
topbar (`blur(12px)`). Never in product app surfaces.

---

## 8. Iconography & logo

**Icons — Lucide (`lucide.dev`), inlined as SVG.**
Stroke `1.75` at 18×18 for nav and inline; `2.4–2.5` for emphasised icons inside
coloured circles. Always `stroke-linecap="round"`, `stroke-linejoin="round"`, coloured
by `currentColor`. No icon fonts, no filled/duotone sets, no emoji-as-icon.
The only sanctioned unicode marks are `▲ ▼` in trends and `→ ←` in CTA links.

**Logo — use the supplied assets, pick by background:**

| Background | Asset | Construction |
|---|---|---|
| Light | `assets/elli-lockup-white-bg.png` | Violet tile, cream top-right dot, `#4F59EE` wordmark |
| Brand violet | `assets/elli-lockup-violet-bg.png` | `#510CFF` tile, cream dot, white wordmark |
| Ink / dark | `assets/elli-lockup-dark-bg.png` | **White tile**, top-right dot flips to `#4F59EE`, white wordmark |

Mark only: `elli-mark.png/.svg` (light) and `elli-mark-on-dark.png` / `elli-mark-dark.svg`.
Minimum 32×32. Clear space = ¼ × mark height on every side.

The wordmark is a **custom logotype**, not Nunito — use `elli-wordmark-{violet,white}.png`
for true logo placement. (In-product chrome may approximate it in Nunito 800 at
`-0.04em`; the kit sidebars do this.)

**Never** swap, recolour, rearrange, rotate, skew, outline, drop-shadow or gradient the
mark. `assets/elli-logo-repo.png` is legacy — do not use it.

---

## 9. Voice in the interface

Design and copy are one system here — a correctly-styled screen with the wrong words is
off-brand. elli is a **strategic assistant**: confident enough to give a direct answer,
warm enough that nobody dreads the data. It may speak first person ("I'm Elli").

1. **Lead with the answer, not the data.** Conclusion in plain language; numbers after.
2. **Warm, but not chatty.** One human touch per screen — usually the greeting — then
   precision.
3. **Plain words for technical ideas.** "Workload pressure", not "cognitive load
   distribution".
4. **Suggest, don't prescribe.** "Want to dig into the team scores first?" not "You must
   escalate."

**Register shifts by context** — warmest in onboarding, neutral and precise on
dashboards, slower and gentler when wellbeing signals are low. Never alarmist, never
dismissive.

**Casing** — sentence case everywhere (headlines, page titles, card titles, status
pills). `UPPERCASE TRACKED` is reserved for eyebrows and tags. The wordmark is always
lowercase `elli`; the assistant is capitalised `Elli` when speaking in first person.

**People** — say employees, team leads, HR. Never "users" or "resources". Address the
reader as *you*; first name in selfcare ("Good afternoon, Sarah.").

**Numbers** — always contextualised. `64/100 · +3.2 vs last quarter · sector average 58`,
never a bare `64`. Units are labels: smaller, `--ink-faint`. Separate facts with `·`.
Colour change by what it *means*.

**Devices in the toolkit** — *substance over sentiment*; the *"not X — Y"* contrast
headline; precise terms (BAT, JD-R, SDT, ADKAR) used only when they're the right word.

---

## 10. Checklist

Before shipping any elli surface:

- [ ] `colors_and_type.css` (or `styles.css`) is linked; no hardcoded hexes
- [ ] Background is `--paper-warm` (app) or `--warm-white` + halos (marketing), not white
- [ ] Exactly **one** Focus card, and it is a solid fill with a radial highlight
- [ ] Every card is `--r-lg` with a `--line` hairline
- [ ] Headings are 800, body is 400, nothing body-sized is 500/600
- [ ] Nothing is below 14px except meta (13), eyebrows (11), pills (11.5–12)
- [ ] Status pills are sentence case with the right semantic colour
- [ ] Trend colours reflect meaning, not arrow direction
- [ ] Focus ring is `--shadow-focus-ring` on every interactive control
- [ ] Score-bearing page ends with the Methodology note
- [ ] EN / NL / FR switcher present on product screens
- [ ] Copy leads with the conclusion, sentence case, lowercase `elli`

### Never

- Two-hue gradient surfaces of any kind (RULE 03 — tints, not gradients)
- Emoji as decoration — ✨ 🚀 🎉 are anti-brand
- Cards with a coloured left border over a warm-tinted background
- Stock illustration, hand-drawn doodles, repeating patterns, grain/noise
- Title Case in marketing copy; ALL-CAPS status pills
- Coloured shadows on anything but the violet CTA
- The legacy logo, or a re-typeset wordmark used as the actual logo
- "Holistic" · "synergy" · "journey" · "empower" · "unlock"

---

## 11. Where things live

| Need | Go to |
|---|---|
| Token values | `colors_and_type.css` |
| Single stylesheet entry point | `styles.css` |
| Rendered token/type/colour cards | `preview/` |
| Exported components + types | `components/` |
| Employer surface prototype | `ui_kits/workforce-dashboard/` |
| Employee surface prototype | `ui_kits/selfcare/` |
| Marketing prototype | `ui_kits/marketing/` |
| Logos, marks, lockups | `assets/` |
| Official 2026 brand book | `reference/elli-brandbook.html` |
| Agent skill manifest | `SKILL.md` |
| Folder index + product context | `README.md` |
