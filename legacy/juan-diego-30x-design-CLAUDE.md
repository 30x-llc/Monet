# Juan Diego 30x Design

> El sistema de diseno del equipo 30x. Este repo existe para que cualquier miembro del team pueda crear apps con Claude Code que se vean y se sientan como si Juan Diego las hubiera disenado personalmente.

## Who Is Juan Diego

Juan Diego is the Head of Design at 30x — la red ejecutiva mas importante de Latinoamerica. His design quality IS the standard. If the output doesn't look like it was designed by Juan Diego, don't build it at all. Generic AI-looking output is worse than no output because it damages the brand and requires more work to fix than starting from scratch.

---

## MANDATORY RULES — READ BEFORE WRITING ANY CODE

### Rule 0: Never Build Generic UI

**NEVER** produce generic, template-looking, "AI slop" interfaces. Before building ANY visual component:

1. Study the components in `design-system/` — these are the actual 30x components
2. Read `design-system/30X-DESIGN-SYSTEM.md` for the complete design language
3. Reference `design-system/UNTITLED-UI-CLAUDE.md` for component API docs
4. Use the Untitled UI component library in `references/untitled-ui-react/` as the foundation
5. If you can't match the 30x aesthetic, say so — don't fake it with generic Tailwind

### Rule 1: The 30x Color System

#### Accent Yellow: `#E9FF7B`

This is the **ONLY** accent yellow allowed. Non-negotiable.

**You may ONLY adjust this color using:**
- Brightness (e.g., `brightness-90`, `brightness-110`)
- Opacity/Transparency (e.g., `#E9FF7B/50`, `bg-[#E9FF7B]/30`)

**You must NEVER:**
- Change the hue or saturation
- Use alternative yellow/green shades (`#B0C259`, `#D4F542`, `#DEFF5C`)
- Use Tailwind's built-in yellow colors (`yellow-400`, etc.)

#### The Yellow Rule — CRITICAL

The 30x Yellow (`#E9FF7B`) has **insufficient contrast on light backgrounds**. 

**ONLY use yellow on black/dark backgrounds:**

```tsx
// CORRECT — Yellow on black
<div className="bg-black p-3 rounded-lg">
  <span className="text-[#E9FF7B]">Premium</span>
</div>

// WRONG — Yellow on white (invisible, DO NOT DO THIS)
<span className="text-[#E9FF7B]">Invisible text</span>
```

#### 30x Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Accent Yellow | `#E9FF7B` | Buttons, highlights, brand elements (on dark BG only) |
| Dark | `#262626` | Dark backgrounds, dark buttons |
| Near Black | `#1A1A1A` | Primary text (NOT pure `#000000`) |
| Black | `#0A0A0A` | Deep backgrounds |
| Logo Black | `#010101` | Logo on light backgrounds |
| Light Gray | `#F2F2F2` | Logo on dark backgrounds |
| White | `#FFFFFF` | Main canvas, cards, light buttons |
| Apple Blue | `#0071E3` | CTA buttons (Apple-style) |

#### Semantic Color Classes — ALWAYS Use These

**NEVER use raw Tailwind grays** (`text-gray-900`, `bg-gray-50`). **ALWAYS** use the semantic tokens:

```tsx
// TEXT
text-primary        // #1A1A1A — Headings
text-secondary      // #525252 — Body, labels
text-tertiary       // #737373 — Muted, supporting
text-placeholder    // Placeholder text

// BACKGROUNDS
bg-primary          // #FFFFFF — Main canvas
bg-secondary        // #FAFAFA — Alt sections
bg-brand-solid      // Brand solid fills

// BORDERS
border-primary      // #E5E5E5 — Visible borders
border-secondary    // rgba(0,0,0,0.08) — Whisper borders (DEFAULT)
border-tertiary     // Very subtle dividers

// FOREGROUND (icons)
fg-primary          // Highest contrast icons
fg-secondary        // Standard icons
fg-tertiary         // Muted icons
```

### Rule 2: Typography — Inter, Heavy Weights, Tight Tracking

30x uses **Inter** exclusively. The key to making Inter NOT look generic: **push weights heavier than default** and **tighten letter-spacing aggressively**.

**CRITICAL:** Default `font-normal` (400) makes Inter look like every other app. Bump everything up one weight level. Use `font-medium` (500) where you'd normally use regular, `font-semibold` (600) where you'd use medium, and `font-bold` (700) for headings.

| Size | Weight | Letter Spacing | Line Height | Usage |
|------|--------|----------------|-------------|-------|
| Hero (64px) | `700` bold | `-0.05em` | 1.05 | Main headlines |
| Display 2XL (72px) | `700` bold | `-0.05em` | 1.05 | Hero sections |
| Display XL (60px) | `700` bold | `-0.04em` | 1.10 | Page titles |
| Display LG (48px) | `700` bold | `-0.03em` | 1.10 | Section titles |
| Display MD (36px) | `700` bold | `-0.025em` | 1.15 | Card titles |
| Card heading (18px) | `700` bold | `-0.02em` | 1.30 | Card/section headings |
| Big numbers | `700` bold | `-0.03em` | 1.00 | Metric values, KPIs |
| Labels (14px) | `600` semibold | `-0.01em` | 1.40 | Nav items, table headers, form labels |
| Body (16px) | `500` medium | `-0.01em` | 1.60 | Paragraphs, descriptions |
| Small (14px) | `500` medium | `-0.01em` | 1.50 | Supporting text |
| Caption (12px) | `500` medium | `0` | 1.40 | Timestamps, metadata |

**Weight Hierarchy (30x-specific):**
- `500` medium — Default body text, descriptions, supporting content
- `600` semibold — Navigation items, table headers, form labels, badges, sidebar items
- `700` bold — Headlines, card headings, metric values, section titles
- `400` regular — ONLY for long-form prose (blog posts, documentation paragraphs)

**The letter-spacing trick:** Even at body sizes, use `-0.01em`. At heading sizes, go to `-0.02em` or `-0.03em`. This is what separates "premium" Inter from "generic" Inter.

### Rule 3: The 30x Visual Language

**Apple/Linear-level design** — clean, quiet, premium:

- **Pure white canvas** (`#FFFFFF`) — No grays, no cream for main backgrounds
- **Near-black text** (`#1A1A1A`) — Softer than pure black, never use `#000000` for body
- **Whisper borders** — `rgba(0,0,0,0.08)` or `border-secondary` — Almost invisible
- **Multi-layer shadows** — Max opacity 0.08, never heavy drop shadows
- **Section alternation** — White/Gray rhythm for visual flow

```tsx
// Section rhythm
<section className="bg-primary py-20">...</section>   // White
<section className="bg-secondary py-20">...</section>  // Gray (#FAFAFA)
<section className="bg-primary py-20">...</section>    // White
```

**Vertical padding:** `80-120px` between major sections.

**Shadows (whisper-level):**
```css
/* Card shadow */
box-shadow: 0px 1px 2px rgba(0,0,0,0.01), 0px 2px 6px rgba(0,0,0,0.02), 0px 4px 16px rgba(0,0,0,0.04);
```

**Border radius:**
| Token | Value | Usage |
|-------|-------|-------|
| `rounded-md` | 8px | Buttons, inputs |
| `rounded-lg` | 12px | Cards |
| `rounded-xl` | 16px | Featured cards |
| `rounded-full` | 9999px | Pills, avatars |

### Rule 4: 30x Logo Usage

The official 30x logos are in `design-system/` (SVG). Use the correct variant per background:

```tsx
{/* Light mode: dark logo on white bg */}
<img src="/30x-logo-dark.svg" alt="30x" className="h-5 w-auto dark:hidden" />
{/* Dark mode: light logo on dark bg */}
<img src="/30x-logo-light.svg" alt="30x" className="hidden h-5 w-auto dark:block" />
```

| Logo file | Fill color | Use on |
|-----------|-----------|--------|
| `30x-logo-dark.svg` | `#010101` | Light backgrounds |
| `30x-logo-light.svg` | `#F2F2F2` | Dark backgrounds |
| `30x-logo-accent.svg` | `#E9FF7B` | Hero sections on black |

**NEVER** recreate the 30x logo with text/CSS. Always use the official SVG files.

### Rule 5: Light/Dark Mode Toggle — MANDATORY in Every App

**Every 30x app MUST include a light/dark mode toggle.** The 30x accent yellow (`#E9FF7B`) looks incredible on dark backgrounds — dark mode IS the 30x signature look.

**Setup (next-themes + Untitled UI):**

```tsx
// app/components/theme-provider.tsx
"use client";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    return (
        <NextThemesProvider
            attribute="class"
            defaultTheme="light"
            value={{ light: "light", dark: "dark-mode" }}
        >
            {children}
        </NextThemesProvider>
    );
}
```

```tsx
// app/layout.tsx — wrap body with ThemeProvider
<html suppressHydrationWarning>
  <body>
    <ThemeProvider>{children}</ThemeProvider>
  </body>
</html>
```

**Toggle button** — place in the top-right of the header, use `MoonIcon`/`SunIcon` from Heroicons Solid:
```tsx
import { useTheme } from "next-themes";
import { SunIcon, MoonIcon } from "@heroicons/react/24/solid";

const { theme, setTheme } = useTheme();
<button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
  {theme === "dark" ? <SunIcon /> : <MoonIcon />}
</button>
```

The Untitled UI theme.css already defines all dark mode variables under `.dark-mode` class. The `value` map in next-themes maps `"dark"` to the `"dark-mode"` class that Untitled UI expects.

### Rule 5: Animations — Snappy, Not Flashy

Default CSS transition for hover/color changes:
```tsx
className="transition duration-100 ease-linear"
```

For complex animations, use `motion` (Framer Motion). Keep it subtle — this is a premium executive network, not a gaming site.

**Disabled states:** Always `opacity-50`, never custom disabled tokens:
```tsx
"disabled:cursor-not-allowed disabled:opacity-50"
```

---

## Tech Stack

All 30x apps are built with:

- **React 19** + TypeScript
- **Next.js 16** (App Router, Server Components by default)
- **Tailwind CSS v4.2**
- **React Aria Components** (accessibility foundation)
- **Untitled UI** (component library)
- **@heroicons/react** (Heroicons Solid — the ONLY icon library allowed)
- **motion** (Framer Motion) for animations
- **tailwindcss-animate** for utility animations

### Icon Library — MANDATORY: Heroicons Solid ONLY

**NEVER** use Lucide, Phosphor, Radix Icons, or any other icon library. **ONLY** Heroicons from `@heroicons/react/24/solid`.

**Icon Colors:**
- Inactive/default: `text-[#999]`
- Active/selected: `text-[#1A1A1A]`
- Hover: transition from `#999` to `#1A1A1A`

Reference: `references/heroicons/` contains the full Heroicons repo.

### Import Conventions

**CRITICAL**: All React Aria imports MUST be prefixed with `Aria*`:

```typescript
// CORRECT
import { Button as AriaButton, TextField as AriaTextField } from "react-aria-components";

// WRONG
import { Button, TextField } from "react-aria-components";
```

### File Naming

**ALL files in kebab-case:**
```
date-picker.tsx      // Correct
DatePicker.tsx       // WRONG
user-profile.tsx     // Correct
userProfile.tsx      // WRONG
```

### Icon Usage — Heroicons Solid

```typescript
// CORRECT — Always import from @heroicons/react/24/solid
import { HomeIcon, Cog6ToothIcon, ChevronDownIcon } from "@heroicons/react/24/solid";

// Standalone icon — inactive state
<HomeIcon className="size-5 text-[#999]" aria-hidden="true" />

// Active state
<HomeIcon className="size-5 text-[#1A1A1A]" aria-hidden="true" />

// With hover transition
<HomeIcon className="size-5 text-[#999] transition duration-100 ease-linear hover:text-[#1A1A1A]" />

// WRONG — Never use these
import { Home } from "lucide-react";           // BANNED
import { House } from "@phosphor-icons/react";  // BANNED
import { HomeIcon } from "@radix-ui/react-icons"; // BANNED
```

Icon sizes: `size-4` (16px), `size-5` (20px), `size-6` (24px).

When using icons inside Untitled UI components (Button, Badge, etc.), pass them via `iconLeading`/`iconTrailing` props with `data-icon` attribute:
```typescript
import { ChevronDownIcon } from "@heroicons/react/24/solid";
<Button iconLeading={<ChevronDownIcon data-icon className="size-4" />}>Options</Button>
```

---

## Component Architecture

### Style Pattern — sortCx

Every component uses `sortCx` for organized style objects:

```typescript
import { cx, sortCx } from "@/utils/cx";

export const styles = sortCx({
    common: {
        root: "base-classes-here",
        icon: "icon-classes-here",
    },
    sizes: {
        sm: { root: "small-size-classes" },
        md: { root: "medium-size-classes" },
        lg: { root: "large-size-classes" },
    },
    colors: {
        primary: { root: "primary-color-classes" },
        secondary: { root: "secondary-color-classes" },
    },
});
```

### Component Props Pattern

```typescript
interface CommonProps {
    size?: "sm" | "md" | "lg";
    isDisabled?: boolean;
    isLoading?: boolean;
    isInvalid?: boolean;
    isRequired?: boolean;
}
```

### Compound Components

```typescript
const Select = SelectComponent as typeof SelectComponent & {
    Item: typeof SelectItem;
    ComboBox: typeof ComboBox;
};
Select.Item = SelectItem;
Select.ComboBox = ComboBox;
```

### Key Components Quick Reference

```typescript
// Button
import { Button } from "@/components/base/buttons/button";
<Button size="md" color="primary" iconLeading={Check}>Save</Button>

// Input
import { Input } from "@/components/base/input/input";
<Input label="Email" placeholder="you@company.com" icon={Mail01} />

// Select
import { Select } from "@/components/base/select/select";
<Select label="Team" items={users}>
  {(item) => <Select.Item id={item.id}>{item.name}</Select.Item>}
</Select>

// Badge
import { Badge } from "@/components/base/badges/badges";
<Badge color="brand" size="md">Executive</Badge>

// Avatar
import { Avatar } from "@/components/base/avatar/avatar";
<Avatar src="/avatar.jpg" size="md" status="online" />

// FeaturedIcon
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
<FeaturedIcon icon={CheckCircle} color="success" theme="light" size="lg" />
```

Button colors: `primary`, `secondary`, `tertiary`, `link-gray`, `link-color`, `primary-destructive`, `secondary-destructive`, `tertiary-destructive`, `link-destructive`.

**Links:** There is no Link component. Use `<Button href="/path" color="link-color">`.

---

## Repository Structure

```
juan-diego-30x-design/
├── CLAUDE.md                          # THIS FILE — Master design rules
├── design-system/                     # 30x Design System (source of truth)
│   ├── 30X-DESIGN-SYSTEM.md          # Complete design spec
│   ├── UNTITLED-UI-CLAUDE.md         # Full component API reference
│   ├── package.json                   # Dependencies
│   ├── components/                    # All React components
│   │   ├── base/                      # Button, Input, Select, Checkbox...
│   │   ├── application/               # Modal, Table, DatePicker, Tabs...
│   │   ├── foundations/               # FeaturedIcon, Logo, SocialIcons...
│   │   ├── marketing/                 # Header navigation, hero sections
│   │   └── shared-assets/             # Illustrations, patterns
│   ├── styles/
│   │   ├── theme.css                  # ALL design tokens (500+ variables)
│   │   ├── globals.css                # Global styles, Tailwind config
│   │   └── typography.css             # Prose/typography system
│   ├── utils/
│   │   └── cx.ts                      # Class name utility (twMerge)
│   └── hooks/                         # Custom React hooks
├── skills/                            # AI Design Skills
│   ├── taste-skill/                   # Premium frontend patterns (Leonxlnx)
│   ├── soft-skill/                    # Soft/luxury UI patterns
│   ├── minimalist-skill/              # Notion/Linear-style clean UI
│   ├── output-skill/                  # Anti-lazy AI output rules
│   ├── redesign-skill/                # Upgrading existing projects
│   ├── brutalist-skill/               # Swiss + CRT aesthetics
│   ├── stitch-skill/                  # Google Stitch compatibility
│   ├── emil-design-eng/               # Emil Kowalski's polish philosophy
│   ├── impeccable/                    # Impeccable design (pbakaus) + references
│   ├── animate/                       # Animation patterns
│   ├── layout/                        # Layout engineering
│   ├── typeset/                       # Typography rules
│   ├── colorize/                      # Color system rules
│   ├── polish/                        # Final polish pass
│   ├── critique/                      # Design critique framework
│   ├── audit/                         # Design audit checklist
│   ├── delight/                       # Micro-interactions & delight
│   ├── adapt/                         # Responsive adaptation
│   ├── shape/                         # Shape & form rules
│   ├── bolder/                        # Making designs more impactful
│   ├── clarify/                       # Information hierarchy
│   ├── distill/                       # Simplification rules
│   ├── harden/                        # Robustness & edge cases
│   ├── optimize/                      # Performance optimization
│   ├── overdrive/                     # Maximum impact mode
│   └── quieter/                       # Calming/reducing noise
├── references/                        # External reference repos
│   ├── untitled-ui-react/             # Untitled UI React (upstream)
│   ├── heroicons/                     # Heroicons (ONLY icon library)
│   ├── shadcn-ui/                     # shadcn/ui (patterns reference)
│   └── gstack/                        # gstack (QA, review, ship skills)
└── .gitignore
```

---

## How to Use This Repo

### For 30x Team Members

1. Clone this repo alongside your project
2. Point your Claude Code CLAUDE.md to reference this design system
3. When building any UI, tell CC: "Use the 30x design system from juan-diego-30x-design"

### For New Apps

When creating a new 30x app:

```bash
# Start with Next.js 16
npx create-next-app@latest my-30x-app --typescript --tailwind --app

# Copy the design system core
cp -R juan-diego-30x-design/design-system/components my-30x-app/src/
cp -R juan-diego-30x-design/design-system/styles my-30x-app/src/
cp -R juan-diego-30x-design/design-system/utils my-30x-app/src/

# Install required dependencies
cd my-30x-app
npm install react-aria react-aria-components @heroicons/react motion tailwindcss-animate tailwind-merge next-themes
```

### Skills Hierarchy

When building, apply skills in this order of priority:

1. **30x Brand Rules** (this CLAUDE.md) — Always highest priority
2. **Untitled UI Components** (`design-system/`) — Use these components
3. **impeccable** / **emil-design-eng** — Craft & polish philosophy
4. **taste-skill** — Premium frontend patterns (adapt DESIGN_VARIANCE to 30x)
5. **animate** / **delight** — Subtle motion & micro-interactions
6. **layout** / **typeset** / **colorize** — Specific domain rules

**30x-specific overrides to taste-skill defaults:**
- `DESIGN_VARIANCE`: 6 (structured but not rigid — 30x is premium, not experimental)
- `MOTION_INTENSITY`: 4 (subtle, executive-feel — not flashy)
- `VISUAL_DENSITY`: 5 (balanced — not sparse, not cramped)

---

## Color in Data Visualization

The grayscale palette is for **structural UI** (borders, backgrounds, text). But charts, badges, pipeline bars, and trend indicators should use **real color** from Untitled UI's palette:

| Color | Hex | Use For |
|-------|-----|---------|
| Green | `#22C55E` | Revenue, success, closed won, positive trends |
| Blue | `#3B82F6` | Info, qualification, contacts |
| Indigo | `#6366F1` | Brand accent, proposals, deals |
| Orange | `#F97316` | Warning, negotiation, attention |
| Red | `#EF4444` | Error, negative trends, destructive |
| Pink | `#EC4899` | Accent variety (avatars, secondary data) |

### Badge Border Rule — MANDATORY

**ALL badges MUST have `ring-1 ring-inset`**. This is the Untitled UI pattern from Figma. A badge without the ring border looks unfinished and cheap. The ring adds the subtle depth that makes badges feel polished.

**Light mode:**
```tsx
<span className="rounded-full bg-[#F0FDF4] px-2.5 py-0.5 text-xs font-semibold text-[#22C55E] ring-1 ring-inset ring-[#22C55E]/20">
  Closed Won
</span>
```

**Dark mode — badges use color/10 bg + lighter text + color/30 ring:**
```tsx
// CORRECT — Badge with dark mode support
<span className="bg-[#F0FDF4] dark:bg-[#22C55E]/10 text-[#22C55E] dark:text-[#4ADE80] ring-1 ring-inset ring-[#22C55E]/20 dark:ring-[#22C55E]/30 ...">
  Closed Won
</span>

// All variants — light | dark
// Green:  bg-[#F0FDF4] dark:bg-[#22C55E]/10 | text-[#22C55E] dark:text-[#4ADE80] | ring-[#22C55E]/20 dark:ring-[#22C55E]/30
// Blue:   bg-[#EFF6FF] dark:bg-[#3B82F6]/10 | text-[#3B82F6] dark:text-[#93C5FD] | ring-[#3B82F6]/20 dark:ring-[#3B82F6]/30
// Indigo: bg-[#EEF2FF] dark:bg-[#6366F1]/10 | text-[#6366F1] dark:text-[#A5B4FC] | ring-[#6366F1]/20 dark:ring-[#6366F1]/30
// Orange: bg-[#FFF7ED] dark:bg-[#F97316]/10 | text-[#F97316] dark:text-[#FB923C] | ring-[#F97316]/20 dark:ring-[#F97316]/30
// Red:    bg-[#FEF2F2] dark:bg-[#EF4444]/10 | text-[#EF4444] dark:text-[#FCA5A5] | ring-[#EF4444]/20 dark:ring-[#EF4444]/30
// Neutral: bg-secondary text-tertiary ring-1 ring-inset ring-secondary (works both modes)

// WRONG — No ring border
<span className="rounded-full bg-[#F0FDF4] px-2.5 py-0.5 text-xs font-semibold text-[#22C55E]">
  Closed Won
</span>
```

### Charts in Dark Mode — Use 30x Accent `#E9FF7B`

In dark mode, the main chart line should switch from green (`#22C55E`) to the 30x accent yellow (`#E9FF7B`). The yellow looks incredible on dark backgrounds and reinforces the 30x brand:

```tsx
const isDark = theme === "dark";
const revenueColor = isDark ? "#E9FF7B" : "#22C55E";
const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
```

The pattern is always: `bg-[tinted-light] text-[color] ring-1 ring-inset ring-[color]/20`

### Metric Cards with Mini Sparkline Charts

Metric cards should include a mini sparkline chart (56px tall, 112px wide) aligned to the bottom-right of the card. This is the Untitled UI "Metric item > Chart 01" pattern:

```
┌─────────────────────────────────┐
│ Revenue Total                   │
│                                 │
│ $2.4M              ╭──╮  ╭───  │
│ ↑ 12%  vs last Q   ╯  ╰──╯    │
└─────────────────────────────────┘
```

Layout: Title (top) → Number + Change (bottom-left) + Sparkline (bottom-right, `items-end` alignment).

Sparkline colors match the trend: green (`#22C55E`) for positive, red (`#EF4444`) for negative. Use a gradient fill with 12% opacity at top fading to 0.

**What stays `#1A1A1A`:** Structural icons (sidebar nav, toolbar icons). These are NOT data — they're UI chrome.

**What gets color:** Chart lines/fills, pipeline bars, deal stage badges, trend arrows (green up / red down), avatar backgrounds for people, sparkline charts.

---

## Do's and Don'ts

### DO
- Use `text-primary` for headings (`#1A1A1A`)
- Use `text-secondary` for body text (`#525252`)
- Use `bg-primary` for main canvas (`#FFFFFF`)
- Alternate sections white/gray for visual rhythm
- Use whisper borders (`border-secondary`)
- Reserve yellow for black/dark stacks only
- Use Inter with tight tracking on display text
- Use React Aria Components as the accessibility foundation
- Use Untitled UI components from the design system
- Keep shadows extremely subtle (max 0.08 opacity)
- Use `rounded-lg` (12px) for cards, `rounded-md` (8px) for buttons
- Use semantic colors for data: green=money/success, blue=info, red=error
- Keep structural icons in `#1A1A1A` — color is for DATA, not chrome

### DON'T
- Use pure black (`#000000`) for body text
- Use yellow on white/gray backgrounds
- Use positive letter-spacing on headlines
- Use heavy shadows (>0.1 opacity)
- Use multiple accent colors simultaneously
- Use raw Tailwind gray classes (`text-gray-900`, `bg-gray-50`)
- Color structural icons (sidebar, toolbar) — keep those `#1A1A1A` / `#999`
- Make everything colorful — color is intentional, for data meaning only
- Use generic AI templates or bootstrap-looking layouts
- Skip the design system and freestyle components
- Use emojis in UI (use Untitled UI icons instead)
- Center everything — use asymmetric layouts for premium feel
