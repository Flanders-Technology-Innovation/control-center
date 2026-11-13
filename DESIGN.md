---
version: alpha
name: elli
description: >
  Design system of the elli platform: employee well-being insights for HR
  managers and organisational leaders (assist), a personal well-being space
  for employees (SelfCare), and the internal platform console (manage). Calm,
  trustworthy and data-led: one typeface, an indigo brand, a single product
  green, hairline-bordered white cards on a warm off-white ground.

colors:
  # Brand
  primary: "#510CFF"            # indigo-deep: CTAs, focus, key data
  on-primary: "#FFFFFF"
  indigo: "#4F59EE"             # sidebar fill, brand chrome, focus ring
  indigo-ink: "#3F18C1"         # hover/press of primary, indigo text on tints
  indigo-50: "#E3DDF7"
  indigo-25: "#EEEAFB"          # quiet hover wash
  indigo-tint: "#F5E4FF"
  lavender: "#C8C9FC"           # support accent, decorative bars
  # Semantic accents (fill / soft tint / ink on the tint)
  mint: "#20C279"               # the only product green: success, growth
  mint-soft: "#D5F3E5"
  mint-ink: "#0E7D43"
  amber: "#F59E0B"              # watch, warning
  amber-soft: "#FEF3C7"
  amber-ink: "#92400E"
  rose: "#E11D48"               # critical, destructive, error
  rose-soft: "#FEE2E2"
  rose-ink: "#991B1B"
  # Neutrals
  ink: "#232730"                # primary text
  ink-muted: "#666B71"          # secondary text
  ink-faint: "#9CA1AB"          # decorative only, fails AA as text
  line: "#E1E2E6"               # hairline borders
  canvas: "#F1F2F6"             # inset / muted surfaces
  paper: "#FFFFFF"              # cards only
  paper-warm: "#FAFBFD"         # page background, never pure white
  cream: "#FAFAF4"              # SelfCare page ground
  # Semantic aliases (what components reference)
  background: "#FAFBFD"
  foreground: "#232730"
  card: "#FFFFFF"
  muted: "#F1F2F6"
  muted-foreground: "#666B71"
  secondary: "#C8C9FC"
  on-secondary: "#3F18C1"
  accent: "#EEEAFB"
  on-accent: "#3F18C1"
  destructive: "#E11D48"
  on-destructive: "#FFFFFF"
  border: "#E1E2E6"
  ring: "#4F59EE"
  sidebar: "#4F59EE"
  on-sidebar: "#FFFFFF"
  # Data: status scale (best to worst)
  status-thriving: "#20C279"
  status-healthy: "#4F59EE"
  status-watch: "#F59E0B"
  status-attention: "#EF6706"
  status-critical: "#E11D48"
  # Data: the four well-being domains
  domain-connection: "#4F59EE"
  domain-culture: "#C8C9FC"
  domain-work: "#20C279"
  domain-growth: "#510CFF"
  # Data: chart series, in order
  chart-1: "#4F59EE"
  chart-2: "#20C279"
  chart-3: "#C8C9FC"
  chart-4: "#510CFF"
  chart-5: "#0E7C43"

typography:
  display:
    fontFamily: Nunito
    fontSize: clamp(40px, 5vw, 56px)
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: -0.02em
  h1:
    fontFamily: Nunito
    fontSize: 34px
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: -0.022em
  h2:
    fontFamily: Nunito
    fontSize: 22px
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: -0.015em
  h3:
    fontFamily: Nunito
    fontSize: 18px
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: -0.01em
  h4:
    fontFamily: Nunito
    fontSize: 15px
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: -0.005em
  body:
    fontFamily: Nunito
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: Nunito
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.6
  meta:
    fontFamily: Nunito
    fontSize: 13px
    fontWeight: 600
    lineHeight: 1.5
  eyebrow:
    fontFamily: Nunito
    fontSize: 11px
    fontWeight: 700
    lineHeight: 1.6
    letterSpacing: 0.14em
  pill:
    fontFamily: Nunito
    fontSize: 12px
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: 0.02em
  data:
    fontFamily: Nunito
    fontSize: 36px
    fontWeight: 800
    lineHeight: 1
    letterSpacing: -0.02em

rounded:
  sm: 8px
  md: 12px
  lg: 18px
  xl: 24px
  full: 999px

spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
  page-mobile: 16px
  page-tablet: 24px
  page-desktop: 32px
  card-padding: 24px
  container-max: 1400px
  sidebar-width: 256px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    height: 40px
    padding: 8px 16px
  button-primary-hover:
    backgroundColor: "{colors.indigo-ink}"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-secondary}"
    rounded: "{rounded.md}"
    height: 40px
    padding: 8px 16px
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    height: 40px
    padding: 8px 16px
  button-outline-hover:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
  button-destructive:
    backgroundColor: "{colors.destructive}"
    textColor: "{colors.on-destructive}"
    rounded: "{rounded.md}"
    height: 40px
    padding: 8px 16px
  button-ghost:
    backgroundColor: transparent
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: 24px
  card-feature:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: 24px
  input:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    height: 40px
    padding: 8px 12px
  badge:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.pill}"
    rounded: "{rounded.full}"
    padding: 2px 10px
  pill-success:
    backgroundColor: "{colors.mint-soft}"
    textColor: "{colors.mint-ink}"
    typography: "{typography.pill}"
    rounded: "{rounded.full}"
  pill-warning:
    backgroundColor: "{colors.amber-soft}"
    textColor: "{colors.amber-ink}"
    typography: "{typography.pill}"
    rounded: "{rounded.full}"
  pill-danger:
    backgroundColor: "{colors.rose-soft}"
    textColor: "{colors.rose-ink}"
    typography: "{typography.pill}"
    rounded: "{rounded.full}"
  sidebar:
    backgroundColor: "{colors.sidebar}"
    textColor: "{colors.on-sidebar}"
    width: 256px
  tooltip:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: 6px 12px
  tooltip-selfcare:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.md}"
---

# elli Design System

This file is the single entry point for anyone, human or AI agent, who designs
or builds elli UI. The front matter holds the tokens in machine-readable form;
the prose below explains how to use them. It is derived from the code, which
stays the source of truth:

| What | Where |
|---|---|
| Tokens (CSS variables, light + dark) | `libs/frontend/theme/src/theme.css` |
| Tailwind theme (type scale, radii, shadows, animations) | `libs/frontend/theme/src/tailwind.config.ts` |
| JS mirror of tokens (charts, SVG) | `apps/frontends/app/src/styles/theme.ts` |
| shadcn/ui components | `apps/frontends/app/src/components/assist/ui/` |
| SelfCare primitives | `apps/frontends/app/src/features/selfcare/primitives/` |
| Cross-frontend components | `libs/frontend/ui` (`@elli/ui`) |
| Manage theme constants | `apps/frontends/manage/src/theme/theme.ts` |
| Long-form reference | `docs/design-system/` |

When a value here and a value in those files disagree, the code wins and this
file needs an update. Change tokens in `@elli/theme`, never per app.

## Overview

elli helps organisations understand and improve employee well-being. Its users
handle sensitive information about people, so the interface has to earn trust
before it does anything else.

**Personality.** Professional and trustworthy, modern, data-driven and clear,
supportive and actionable. Never playful at the expense of clarity, never
alarming, never punitive.

**Three surfaces, one brand.**

| Surface | Who | Character |
|---|---|---|
| **Assist** (`/insights`, surveys, partner-admin) | HR managers, leaders, team leads | Dense, efficient, dashboard-like. shadcn/ui components on the global tokens. |
| **SelfCare** (`/self-care`) | Every employee | Warmer and softer: cream ground with indigo and mint washes, pill-shaped controls, generous white space. Scoped token layer on top of the global one. |
| **Manage** (`/manage`) | elli staff | Utilitarian console. Same palette, radii and shadows through `theme.ts`, written as inline styles. |

**Principles.**

1. **Trust first.** Consistent, calm, predictable. Sensitive data is presented plainly.
2. **Clarity over cleverness.** Obvious interactions, plain language, no hidden features.
3. **Insight, not raw data.** Every screen says what the numbers mean and what to do next.
4. **Efficiency.** Few clicks, the most important thing first, bulk actions where lists are long.
5. **Consistent recognition.** A domain, a status or a band always has the same colour, everywhere.
6. **Accessible by default.** WCAG AA in light and dark, full keyboard access, colour never the only signal.

**Stack.** React + Vite, Tailwind CSS v4, shadcn/ui on Radix primitives,
`lucide-react` icons, CSS-variable tokens, Nunito from Google Fonts. Three
languages: English, Dutch, French.

## Colors

Colours are HSL CSS variables (`--primary: 257 100% 52%`) consumed as
`hsl(var(--primary))`, so dark mode is a swap of the variable set under the
`.dark` class. Raw hex is available as `--elli-*` variables and as the
`elli-*` Tailwind palette for contexts that cannot use a semantic token
(inline SVG, pseudo-elements, third-party widgets).

### Brand

- **Indigo-deep `#510CFF`** (`primary`) is the action colour: primary buttons,
  links, key data points. Use it sparingly so it keeps meaning "act here".
- **Indigo `#4F59EE`** is brand chrome: the solid sidebar, the focus ring, the
  "healthy" status.
- **Lavender `#C8C9FC`** and the indigo tints (`indigo-50`, `indigo-25`,
  `indigo-tint`) are support: secondary buttons, hover washes, decorative bars.
- **Mint `#20C279`** is the only product green. It means success, growth,
  thriving. Do not introduce a second green.
- **Amber** and **rose** are reserved for meaning: watch and warning, critical
  and destructive.

Each accent comes as a triple: the fill (`mint`), a soft tint (`mint-soft`)
and an ink (`mint-ink`) that is legible on the tint. Pills and chips always
use the tint with its own ink, never the fill with white text at small sizes.

### Surfaces and text

| Role | Token | Light | Dark |
|---|---|---|---|
| Page background | `background` | `#FAFBFD` paper-warm | `hsl(224 24% 10%)` |
| Card, popover | `card`, `popover` | `#FFFFFF` | `hsl(224 24% 14%)` |
| Inset / muted surface | `muted` | `#F1F2F6` canvas | `hsl(224 24% 20%)` |
| Hover wash | `accent` | `#EEEAFB` | `hsl(254 30% 22%)` |
| Hairline | `border`, `input` | `#E1E2E6` | `hsl(224 24% 22%)` |
| Primary text | `foreground` | `#232730` | `hsl(0 0% 95%)` |
| Secondary text | `muted-foreground` | `#666B71` | `hsl(220 14% 60%)` |
| Primary action | `primary` | `#510CFF` | `hsl(257 100% 58%)` |
| Destructive | `destructive` | `#E11D48` | `hsl(347 77% 55%)` |
| Focus ring | `ring` | `#4F59EE` | `hsl(236 82% 68%)` |
| Sidebar | `sidebar` | `#4F59EE` | `hsl(236 82% 55%)` |

The page is never pure white. Pure white is reserved for cards sitting on the
paper-warm ground; that contrast, plus a hairline, is what defines a card.

**Text has two tiers and no more:** `text-foreground` for titles and body,
`text-muted-foreground` for secondary, meta, helper and disabled copy. Never
write `text-gray-*` or `text-slate-*` for copy. `ink-faint` measures 2.59:1
on white and is decorative only.

### Data colours

**Status scale**, five ordered levels for scores and health indicators:

| Level | Token | Colour |
|---|---|---|
| Thriving | `status-thriving` | mint `#20C279` |
| Healthy | `status-healthy` | indigo `#4F59EE` |
| Watch | `status-watch` | amber `#F59E0B` |
| Attention | `status-attention` | orange `#EF6706` |
| Critical | `status-critical` | rose `#E11D48` |

**Risk scale** (`risk-low`, `risk-moderate`, `risk-elevated`, `risk-high`)
follows the same mint, indigo, amber, deep-orange order.

**Domains.** The four well-being domains keep one colour each across every
chart, card and legend: Connection indigo `#4F59EE`, Culture lavender
`#C8C9FC`, Work mint `#20C279`, Growth indigo-deep `#510CFF`.

**Charts.** Series use `chart-1` to `chart-5` in order: indigo, mint,
lavender, indigo-deep, deep green. Status colours appear in a chart only when
status is the message.

**SelfCare score bands.** SelfCare shows scores as four bands on a single
green ramp (`--g-strong`, `--g-solid`, `--g-dev`, `--g-watch`) rather than the
traffic-light status scale: an employee's own result should never read as an
alarm. The ramp runs dark to pale in light mode
(`#05502F`, `#20C279`, `#92E0B5`, `#DBF2E4`) and inverts in dark mode
(`#2CDD90`, `#29AE72`, `#2E704C`, `#2C4E39`). Order is meaning: do not reorder
or flatten it.

### Dark mode

Enabled by the `dark` class on `<html>`, stored in `localStorage['theme']`,
applied before first paint by a boot script in `index.html` and at runtime by
`useThemePreference()`. Every colour token has a dark value; a new token
without one is incomplete. Dark values keep each token's role and its
relationship to its neighbours rather than a fixed colour: surfaces step
10% / 14% / 20% / 22% lightness, tints darken, their inks brighten. The sidebar
stays indigo in dark mode: it is the brand surface, not a neutral one.

## Typography

**One typeface: Nunito.** Headings, body, labels and numerals all use it.
There is no separate display face. Weights 300 to 900 are loaded, with italics
at 400 and 700. Monospace uses the system stack and appears only for code and
technical identifiers.

The brand's defining contrast is **800 headings against 400 body**. Weights
500 and 600 are for UI chrome only (buttons, meta, table headers).

| Role | Utility | Size | Weight | Line height | Tracking | Use |
|---|---|---|---|---|---|---|
| Display | `text-display` | 40 to 56px | 800 | 1.05 | -0.02em | Marketing-style hero |
| H1 | `text-h1` | 34px | 800 | 1.1 | -0.022em | Page title |
| H2 | `text-h2` | 22px | 800 | 1.25 | -0.015em | Section title |
| H3 | `text-h3` | 18px | 700 | 1.15 | -0.01em | Card title |
| H4 | `text-h4` | 15px | 700 | 1.15 | -0.005em | Small heading |
| Body | `text-body` | 16px | 400 | 1.6 | none | Default copy |
| Body small | `text-body-sm` | 14px | 400 | 1.6 | none | Tables, secondary copy |
| Meta | `text-meta` | 13px | 600 | 1.5 | none | Captions, footers |
| Eyebrow | `text-eyebrow` | 11px | 700, uppercase | 1.6 | 0.14em | Tracked section label |
| Pill | `text-pill` | 12px | 700 | 1.15 | 0.02em | Status pills |
| Data | `text-data` | 36px | 800 | 1 | -0.02em | Large numerals in stat cards |

Rules:

- The size utilities carry line height and tracking but **not weight**. Pair
  each with its weight utility explicitly.
- 14px is the floor for running copy. 11 to 13px is for labels, pills and meta.
- Eyebrows may track wider, up to 0.24em; SelfCare uses 0.18em
  (`tracking-eyebrow-wide`).
- Keep line length between 50 and 75 characters for prose.
- Headings step down in order. Do not pick a heading level for its size.
- Tailwind's default `text-xs` to `text-9xl` remain available and are used by
  the shadcn components; prefer the named scale for new design-system work.

## Layout

**Spacing** is a 4-point grid, identical to Tailwind's default scale
(`1` = 4px ... `16` = 64px). Prefer multiples of 8 for anything structural;
4 and 12 are for tight, in-component gaps.

| Pattern | Value |
|---|---|
| Icon to label gap | 8px |
| Between form fields | 16px |
| Card padding | 24px (32px for large feature cards) |
| Between cards in a grid | 16 to 24px |
| Between page sections | 48 to 64px |
| Page padding | 16px mobile, 24px tablet, 32px desktop |

**Shell.** Assist uses a fixed left sidebar (256px, solid indigo, white text)
with the content area on the paper-warm background. On mobile the sidebar
becomes a slide-out sheet; there is no bottom navigation bar. Content is
centred in a container capped at 1400px.

SelfCare has its own shell: sidebar 248px, top bar 62px, content capped at
1280px.

**Breakpoints** are Tailwind's: `sm` 640, `md` 768, `lg` 1024, `xl` 1280,
`2xl` 1536. Design mobile-first:

- Below 768px: single column, sheet navigation, tables become cards.
- 768 to 1024px: two columns where content allows.
- 1024px and up: fixed sidebar, multi-column grids, hover enhancements.

Never hide a critical feature on mobile, and never make hover the only way to
reach information.

**Page widths are per page.** Flows built from mockups carry their own widths
(the onboarding wizard uses 880, 980 and 1080px on consecutive steps). Read
the width from the mockup of that page; do not assume siblings match.

## Elevation & Depth

Depth is carried by **hairline borders and surface contrast first, shadow
second.** Shadows are neutral, low and soft.

| Level | Token | Value | Use |
|---|---|---|---|
| Flat | none | 1px `border` | Default card on the page |
| Soft | `shadow-soft` | `0 1px 2px rgba(35,39,48,.06)` | Subtle lift, inputs, small controls |
| Card | `shadow-card` | `0 1px 2px rgba(35,39,48,.04), 0 6px 24px rgba(35,39,48,.06)` | Primary cards |
| Elevated | `shadow-elevated` | `0 8px 28px rgba(35,39,48,.08)` | Popovers, menus, dialogs |
| CTA | `shadow-cta`, `shadow-cta-hover` | `0 4px 14px rgba(81,12,255,.28)`, hover `0 8px 20px rgba(81,12,255,.32)` | The primary call to action only |
| Focus | `shadow-focus-ring` | `0 0 0 3px` ring | Keyboard focus in SelfCare |

- **A coloured shadow belongs to the primary CTA and nothing else.**
  (`shadow-glow` is an older variant of the CTA shadow still used in assist;
  do not use it in new work.)
- In dark mode shadows barely read. A card separates from the page by its fill
  and its border.
- Overlays stack in this order: page, sticky chrome, sheet and drawer, dialog,
  toast, tooltip. Dialogs dim the page behind them.

## Shapes

Corners are consistently rounded, never sharp and never fully circular except
for pills and avatars.

| Token | Radius | Tailwind | Use |
|---|---|---|---|
| `sm` | 8px | `rounded-sm` | Tooltips, small chips, inner elements |
| `md` | 12px | `rounded-lg` | Buttons, inputs, standard cards |
| `lg` | 18px | `rounded-xl` | Primary and feature cards |
| `xl` | 24px | `rounded-2xl` | Large panels, hero blocks |
| `full` | pill | `rounded-full` | Pills, badges, avatars, SelfCare buttons |

Note the name shift: the design scale's `md` is Tailwind's `rounded-lg`.
Tailwind's `rounded-md` resolves to 10px, which is off the scale; avoid it on
new surfaces. A nested element takes a radius one step smaller than its
container.

**Icons** come from `lucide-react`: outline style, default stroke. Sizes are
16px inline with text, 20px standard, 24px in navigation and buttons, 32px for
feature icons. Icons inherit text colour. Pair an icon with a label unless the
meaning is universal, and give icon-only buttons an `aria-label`. Do not add
Material or Font Awesome icons.

## Components

Assist components follow the shadcn/ui pattern: a Radix primitive styled with
Tailwind utilities that read the semantic tokens, with variants declared
through `class-variance-authority`. Reuse what exists in
`components/assist/ui/` before building anything new.

### Buttons

Height 40px (36px small, 44px large), radius 12px, 14px medium-weight label,
8px gap to a 16px icon. Disabled is 50% opacity and not clickable.

| Variant | Look | Use |
|---|---|---|
| `default` | Solid primary, white text, darkens on hover | The one main action of a view |
| `secondary` | Lavender fill, indigo-ink text | Supporting actions |
| `outline` | Hairline border on background, accent wash on hover | Neutral actions, Cancel |
| `primary-outline` | 2px primary border, primary text | A second action of near-equal weight |
| `ghost` | No fill until hover | Toolbar and row actions |
| `destructive` | Solid rose, white text | Delete, remove, archive |
| `link` | Primary text, underline on hover | Inline navigation |

One primary button per view. Primary action on the right, cancel on the left;
destructive actions sit apart and ask for confirmation. Labels are a verb and
an object: "Generate report", "Send invite", never "Submit" or "Click here".

**SelfCare buttons** (`SelfcareButton`) are pill-shaped, bold and smaller
(12 to 12.5px): `primary` (solid indigo-deep), `secondary` (white with a 1.5px
hairline, the common case), `segment` (inside a segmented group), `wash`
(full-width indigo-25 disclosure) and `link`.

### Cards

White (`bg-card`) on the page ground, 1px border, 24px padding. Standard cards
use 12px radius and `shadow-soft`; primary and feature cards use 18px and
`shadow-card`. A card that navigates on click may lift on hover (`hover-lift`);
a static card never does. Structure: optional eyebrow, title (H3), short
description in muted text, content, then actions bottom-right.

### Form inputs

40px tall, hairline border, background fill, 12px horizontal padding, muted
placeholder. Text is 16px on mobile (prevents zoom on iOS) and 14px from `md`.
Focus shows a 2px ring in `ring` with a 2px offset. Errors turn the border
rose and place a message directly below the field. Labels sit above the field
and are always visible; a placeholder is never the label. Mark optional
fields, not required ones. Validate on blur, not per keystroke. Pre-filled
default values select their content on focus.

### Badges and pills

Pill-shaped, 12px bold, 2px by 10px padding. Status pills pair a soft tint
with its matching ink: mint-soft with mint-ink for positive, amber-soft with
amber-ink for watch, rose-soft with rose-ink for critical, canvas with
ink-muted for neutral. Always include a text label; colour alone never carries
the state.

### Navigation

- **Sidebar:** solid indigo, white text and icons, grouped by task. The
  current item is clearly marked. No more than three levels deep.
- **Tabs** switch views within a page; **breadcrumbs** appear in deep
  hierarchies; sequential flows have a Back control and a stepper showing
  done, current and pending steps (`aria-current` on the current step).

### Dialogs, sheets and toasts

- **Dialog:** centred, up to 512px wide, 12px radius, 24px padding, elevated
  shadow over a dimmed page. Title, short body, actions bottom-right. Every dialog answers
  the same keys: `Esc` cancels, `Cmd/Ctrl+Enter` confirms, `Cmd/Ctrl+Backspace`
  triggers the marked destructive action, `Tab` cycles inside. Use `Modal` and
  `ConfirmDialog` from `@elli/ui`; mark destructive buttons with
  `data-dialog-action="destructive"`.
- **Sheet / drawer:** slides in from the right for secondary tasks that keep
  the page in context (support drawer, mobile navigation).
- **Toast:** brief confirmation or error, bottom-right, auto-dismissing.
  Success is short and positive; errors say what happened and how to fix it.
- **Tooltip:** in assist a small popover-coloured panel with a hairline and
  14px text. In SelfCare the tooltip panel is near-black `ink` with white text
  in both themes. Supplementary information only, never the only place a fact
  lives.

### Tables and lists

Header row in muted, semibold 13 to 14px text; rows separated by hairlines and
highlighted on hover; numerals right-aligned. Sortable columns show a sort
indicator; long data sets paginate and show the total. Row actions live in a
trailing three-dot menu. Clickable rows are reachable by `Tab` and fire on
`Enter` and `Space`. On mobile a table becomes a stack of cards.

### Data visualisation

- Colours come from the domain, status, band and chart tokens above, never
  picked ad hoc.
- Every chart has labelled axes with units, a legend when there is more than
  one series, and a tooltip with exact values on hover and focus.
- Large numerals use the `data` style, with a muted label beneath or above.
- Score rings and bars animate once on entry (`animate-score-ring`).
- Small groups are never shown: results below the anonymity threshold are
  replaced by an explanatory state, not a zero.

### States

Every data-bearing view designs all four:

- **Loading:** skeletons in `muted` that match the final layout, for anything
  over 300ms. Spinners only inside buttons and small inline areas.
- **Empty:** a heading that says what is missing, one sentence on what will
  appear, and one action to get there.
- **Error:** what happened, why, and how to fix it, with a retry. Never a raw
  code or stack trace.
- **Success:** confirm the action briefly and offer the next step.

### Motion

Motion is short, eased-out and functional: 200ms for small changes (accordion,
scale-in), 300ms for fades and slides, 400 to 500ms for an entrance. Sequential
reveals stagger by 100ms (`stagger-1` to `stagger-6`). Respect
`prefers-reduced-motion`: transitions collapse, looping animations stop at
their final frame, and only a small busy spinner keeps turning.

### Voice and content

- Professional, supportive, concise, action-oriented. Plain language; explain
  an acronym on first use.
- Say what the data means: "Your team's Connection score improved by 12% this
  month", not "Wellness data has been updated".
- Error template: what happened, why, how to fix it.
- Use one term for one thing across the product.
- All copy exists in English, Dutch and French. Dutch and French are genuine
  translations, never English left in place. Any string with a count has
  singular and plural forms in all three languages. Leave room: Dutch and
  French run 20 to 30% longer than English.

### Accessibility

- Text contrast at least 4.5:1, large text and graphics at least 3:1, checked
  in both themes.
- Colour is never the only signal: pair it with a label or an icon.
- Everything works by keyboard, in a logical tab order, with a visible focus
  indicator. A focus ring must clear 3:1 on its ground: indigo on light
  surfaces, white on the indigo sidebar.
- Touch targets are at least 44 by 44px.
- Semantic HTML first; expose state with `aria-current` (steppers),
  `aria-pressed` (toggle cards) and `aria-expanded` (accordions).

### SelfCare token layer

SelfCare pages are wrapped in `.selfcare-surface`, which re-exports the palette
under short names (`--indigo-deep`, `--ink-muted`, `--paper`, ...) and scopes
the values that differ from the global system:

| Token | SelfCare | Why |
|---|---|---|
| `--bg` | Cream `#FAFAF4` with an indigo and a mint radial wash | Warmer personal ground |
| `--line` | `#E5E7EB` | Slightly lighter hairline |
| `--shadow` | `0 1px 2px rgba(35,39,48,.04), 0 10px 30px rgba(35,39,48,.08)` | Softer, deeper card lift |
| `--ink-faint` | `#6D7380` | Carries real text here, so it clears AA |
| `--mint-ink` | `#0E7941` | Clears 4.5:1 on mint-soft |
| `--g-*` | The four-step band ramp | Score bands |
| `--lime-*`, `--orange-*` | Soft and ink pairs | Trends heatmap steps |
| `--indigo-fg`, `--indigo-deep-fg` | Indigo as text, brightens in dark | Use for indigo text; fills keep `--indigo-deep` |
| `--*-on-ink` | Pale tints for the tooltip panel | The panel stays near-black in both themes |
| `--focus-ring`, `--sb-focus-ring` | `#4F59EE`, and white on the sidebar | Visible focus on every ground |

Build SelfCare screens from the `Selfcare*` primitives (card, button, pill,
eyebrow, section heading, status card, tooltip, delta badge). Nothing outside
`/self-care` should carry the `.selfcare-surface` class.

### Manage

Manage's own pages use inline styles reading
`apps/frontends/manage/src/theme/theme.ts`, which mirrors this system: primary
`#4f0fff`, secondary indigo `#4F59EE`, mint accent, the same neutrals, radii
8 / 12 / 18 / 24 and the same three neutral shadows, Nunito throughout. Keep
manage pages inline-styled. Tailwind is loaded there only so the survey pages
shared with the app render identically.

## Do's and Don'ts

**Do**

- Use semantic tokens (`bg-primary`, `text-foreground`, `border-border`) and
  extend the token layer when a new colour is truly needed, with a dark value.
- Keep one primary action per view and let indigo-deep mean "act here".
- Put white cards on the paper-warm ground and define them with a hairline.
- Pair 800 headings with 400 body, and pair every size utility with its weight.
- Keep a domain, status or band on its own colour everywhere.
- Design loading, empty, error and success states for every data view.
- Check both themes, keyboard access and all three languages before calling
  a screen done.
- Treat a mockup as the spec: match its structure, copy, widths, states and
  interactions, using real data in place of its sample data.

**Don't**

- Don't hardcode hex values or use `text-gray-*` / `text-slate-*` for copy.
- Don't use a pure white page background.
- Don't add a second typeface, a second green, or a new icon library.
- Don't put a coloured shadow on anything but the primary CTA.
- Don't use `rounded-md` (10px) on design-system surfaces.
- Don't use `ink-faint` for readable text outside SelfCare.
- Don't use the red and amber status scale for an employee's own SelfCare
  scores; use the green band ramp.
- Don't rely on colour or hover alone to convey information.
- Don't show raw errors, internal codes or untranslated strings.
- Don't write Tailwind class names in comments under `src/`: Tailwind v4 scans
  comments and emits the class into the bundle.

## Known gaps

Recorded so nobody designs around them by accident:

- `risk-absenteeism`, `risk-attrition` and `risk-engagement` are mapped in the
  Tailwind config but their CSS variables are not defined; those utilities
  resolve to nothing.
- Some assist `Badge` variants (`advisory`, `insight`, `focus`, `success`,
  `danger`, `caution`) use raw Tailwind palette colours instead of the
  soft/ink token pairs and have no dark values.
- The shadcn `Input` uses `rounded-md` (10px) and `CardTitle` uses Tailwind's
  default 24px semibold rather than the named scale.
- Two CTA shadows coexist (`shadow-glow` in assist, `shadow-cta` in the design
  scale).
- Three app files still import `@mui/icons-material` instead of `lucide-react`.
