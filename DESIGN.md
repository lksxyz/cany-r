# DESIGN.md

## Visual Theme

**Tropical warmth** — light, airy, sunlit. Warm sand tones and tropical orange. Indonesia-inspired: sunset warmth, archipelago energy. Feels like a sunny terrace, not a sterile fintech app.

Light mode default. Dark mode uses warm dusk tones instead of cool midnight.

## Color Palette

### Light mode
| Token | Value | Usage |
|---|---|---|
| `--background` | `oklch(0.99 0.005 90)` | Warm off-white |
| `--foreground` | `oklch(0.18 0.015 90)` | Warm near-black |
| `--primary` | `oklch(0.62 0.16 150)` | Tropical green |
| `--primary-foreground` | `oklch(0.97 0.01 150)` | Light green tint |
| `--secondary` | `oklch(0.92 0.015 85)` | Sandy cream |
| `--muted` | `oklch(0.95 0.01 90)` | Warm muted bg |
| `--accent` | `oklch(0.72 0.12 220)` | Sky blue |
| `--border` | `oklch(0.88 0.01 90)` | Warm border |
| `--ring` | `oklch(0.62 0.16 150)` | Focus ring, matches primary |

### Dark mode
| Token | Value | Usage |
|---|---|---|
| `--background` | `oklch(0.18 0.015 90)` | Warm dark |
| `--foreground` | `oklch(0.97 0.01 90)` | Warm light |
| `--primary` | `oklch(0.7 0.17 150)` | Brighter tropical green for dark |
| `--primary-foreground` | `oklch(0.15 0.01 90)` | Dark green tint |
| `--secondary` | `oklch(0.25 0.02 85)` | Warm dark sand |
| `--muted` | `oklch(0.22 0.015 90)` | Warm dark muted |
| `--accent` | `oklch(0.65 0.12 220)` | Muted sky blue |
| `--border` | `oklch(0.3 0.01 90)` | Subtle warm border |

### Chart colors (shared)
| Token | Value |
|---|---|
| `--chart-1` | `oklch(0.62 0.16 150)` — tropical green |
| `--chart-2` | `oklch(0.72 0.12 220)` — sky blue |
| `--chart-3` | `oklch(0.8 0.1 80)` — sun gold |
| `--chart-4` | `oklch(0.7 0.14 45)` — coral |
| `--chart-5` | `oklch(0.55 0.12 170)` — teal foliage |

## Typography

| Role | Font | Weight | Size |
|---|---|---|---|
| Display | Open Runde | 700 | 3rem–5rem |
| Heading 1 | Open Runde | 600 | 2rem–2.5rem |
| Heading 2 | Open Runde | 600 | 1.5rem–2rem |
| Body | Open Runde | 400 | 0.938rem–1.125rem |
| Small / Caption | Open Runde | 400 | 0.75rem–0.875rem |
| Mono | Geist Mono | 400 | 0.875rem |

Line height: 1.1 for display, 1.3 for headings, 1.6 for body. Max body width: 70ch.

## Elevation & Borders

Subtle. No heavy shadows. Use warm-tinted borders instead.

- Card shadow: `0 1px 3px oklch(0 0 0 / 0.04), 0 1px 2px oklch(0 0 0 / 0.06)`
- Raised: `0 4px 12px oklch(0 0 0 / 0.08)`
- Border: 1px solid `--border`
- Border radius: `0.75rem` default cards, `9999px` for pills/buttons

## Components

- Buttons: `pill` shape (fully rounded), no box shadows, hover scale transform
- Cards: warm sand background, rounded, subtle border, no nested cards
- Form inputs: matching pills, focus ring in primary green
- Badge: pill shape with subtle background tint

## Layout & Spacing

- Content max-width: `64rem` (wide), `48rem` (narrow)
- Section padding: `5rem 1.5rem` vertically
- Grid gaps: `1.5rem` base, `2rem` at md+
- Consistent spacing scale: 0.25rem increments (Tailwind default)

## Motion

- Exit/enter: ease-out-expo (`cubic-bezier(0.16, 1, 0.3, 1)`)
- Hover: 150ms ease-out
- Page transitions: 300ms ease-out
- No bounce, no elastic, no CSS layout animation
