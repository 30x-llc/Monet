# 30x Design System

> La red ejecutiva mas importante de Latinoamerica

Built on **Untitled UI** with **Next.js 16**, **React 19**, **Tailwind CSS v4.2**, and **React Aria**.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Design Philosophy

30x follows an **Apple/Linear-level** design approach:

- **Pure white canvas** (`#FFFFFF`) - No grays, no cream
- **Near-black text** (`#1A1A1A`) - Softer than pure black
- **Neutral-first brand** - Flexible accent system
- **Whisper borders** (`rgba(0,0,0,0.08)`) - Almost invisible
- **Multi-layer shadows** - Max opacity 0.08

## The Yellow Rule

The 30x Yellow (`#E9FF7B`) has insufficient contrast on light backgrounds.

**ONLY use it on black backgrounds:**

```tsx
// Correct - Yellow on black stack
<div className="bg-black p-3 rounded-lg">
  <span className="text-[#E9FF7B]">Premium</span>
</div>

// Incorrect - Yellow on white (DO NOT DO THIS)
<span className="text-[#E9FF7B]">Invisible text</span>
```

## Color Tokens

### Semantic Colors (use these)

```tsx
// Text
className="text-primary"      // #1A1A1A - Headings
className="text-secondary"    // #525252 - Body text
className="text-tertiary"     // #737373 - Muted text

// Backgrounds
className="bg-primary"        // #FFFFFF - Main canvas
className="bg-secondary"      // #FAFAFA - Alt sections

// Borders
className="border-secondary"  // rgba(0,0,0,0.08) - Whisper
className="border-primary"    // #E5E5E5 - Visible borders
```

### Brand Colors (30x Neutral Scale)

| Token | Value | Usage |
|-------|-------|-------|
| `brand-50` | `#FAFAFA` | Subtle backgrounds |
| `brand-100` | `#F5F5F7` | Alt section backgrounds |
| `brand-500` | `#737373` | Base neutral |
| `brand-600` | `#525252` | Secondary text |
| `brand-900` | `#1A1A1A` | Primary text, headings |

### Contextual Accents

```tsx
// Apple-style blue CTA
className="bg-[#0071E3] text-white"

// 30x Yellow (on black only)
<div className="bg-black">
  <span className="text-[#E9FF7B]">Highlighted</span>
</div>
```

## Typography

30x uses **Inter** with aggressive negative letter-spacing at display sizes:

| Size | Letter Spacing | Line Height | Usage |
|------|----------------|-------------|-------|
| Hero (64px) | `-0.05em` | 1.05 | Main headlines |
| Display 2XL (72px) | `-0.05em` | 1.05 | Hero sections |
| Display XL (60px) | `-0.04em` | 1.10 | Page titles |
| Display LG (48px) | `-0.03em` | 1.10 | Section titles |
| Body (16px) | `-0.01em` | 1.60 | Reading text |

### Weight Hierarchy

- `400` - Reading (body text)
- `500` - Interacting (UI elements)
- `600` - Emphasizing (labels, buttons)
- `700` - Announcing (headlines)

## Component Usage

```tsx
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Badge } from "@/components/base/badges/badges";

// Primary button
<Button color="primary" size="md">Get Started</Button>

// Secondary button (30x style)
<Button color="secondary" size="md">Learn More</Button>

// Input with label
<Input label="Email" placeholder="you@company.com" />

// Badge
<Badge color="gray" size="md">Executive</Badge>
```

## Section Alternation

30x uses alternating white/gray sections for visual rhythm:

```tsx
// White section
<section className="bg-primary py-20">...</section>

// Gray section
<section className="bg-secondary py-20">...</section>

// White section
<section className="bg-primary py-20">...</section>
```

Vertical padding: `80-120px` between major sections.

## Shadows

```tsx
// Whisper (cards)
className="shadow-lg"

// Elevated (modals, dropdowns)
className="shadow-xl"
```

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-md` | 8px | Buttons, inputs |
| `rounded-lg` | 12px | Cards |
| `rounded-xl` | 16px | Featured cards |
| `rounded-full` | 9999px | Pills, avatars |

## Figma Integration

This design system is synced with **Untitled UI PRO v8.0** via Code Connect.

### File Key
```
UyUYzdQUugOZB52S9RDO6T
```

## Architecture

```
src/
├── components/
│   ├── base/           # Button, Input, Badge, etc.
│   ├── application/    # Modal, Table, DatePicker
│   ├── foundations/    # Icons, social icons
│   └── marketing/      # Hero, Features, Pricing
├── styles/
│   ├── globals.css     # Tailwind imports
│   ├── theme.css       # 30x tokens
│   └── typography.css  # Prose styles
└── utils/
    └── cx.ts           # Class name utility
```

## Do's and Don'ts

### Do
- Use `text-primary` for headings (`#1A1A1A`)
- Use `text-secondary` for body (`#525252`)
- Use `bg-primary` for canvas (`#FFFFFF`)
- Alternate sections white/gray for rhythm
- Use whisper borders (`border-secondary`)
- Reserve yellow for black stacks only

### Don't
- Use pure black (`#000000`) for body text
- Use yellow on white/gray backgrounds
- Use positive letter-spacing on headlines
- Use heavy shadows (>0.1 opacity)
- Use multiple accent colors simultaneously

---

Built with Untitled UI + 30x Design Principles
