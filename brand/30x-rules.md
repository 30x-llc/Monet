# 30X Design Rules (operativo)

Resumen accionable destilado de `legacy/juan-diego-30x-design-CLAUDE.md` (610 líneas).
Esta es mi referencia primaria cuando produzco cualquier output visual para 30X.

Filosofía base: composición sobre generación. Si una decisión no está acá ni en el design system, escalo a Juan Diego.

---

## Regla 0: nunca UI genérica

Antes de generar cualquier componente visual:

1. Reviso `brand/30x-design-system/` (es el sistema vivo).
2. Reviso `brand/30x-design-system/UNTITLED-UI-CLAUDE.md` para el API de componentes.
3. Uso `references/untitled-ui-react/` como foundation.
4. Si no puedo igualar el aesthetic 30X con lo que tengo, lo digo. No improviso con Tailwind genérico.

---

## Color

### Amarillo accent: `#E9FF7B`. Único permitido.

Permitido modificar solo con:
- Brillo (`brightness-90`, `brightness-110`)
- Opacidad (`#E9FF7B/50`, `bg-[#E9FF7B]/30`)

Prohibido:
- Cambiar hue o saturation
- Variantes amarillas/verdes alternativas (`#B0C259`, `#D4F542`, `#DEFF5C`)
- Amarillos de Tailwind (`yellow-400`, etc.)

### Regla del amarillo (crítica)

`#E9FF7B` no tiene contraste suficiente en fondos claros.
Solo va sobre fondos negros u oscuros.

```tsx
// Correcto: amarillo sobre negro
<div className="bg-black p-3 rounded-lg">
  <span className="text-[#E9FF7B]">Executive</span>
</div>

// Incorrecto: amarillo sobre blanco (invisible)
<span className="text-[#E9FF7B]">Texto invisible</span>
```

### Paleta completa

| Color | Hex | Uso |
|---|---|---|
| Accent Yellow | `#E9FF7B` | Botones, highlights, brand (solo en fondo oscuro) |
| Dark | `#262626` | Fondos oscuros, botones oscuros |
| Near Black | `#1A1A1A` | Texto primary (no usar `#000000`) |
| Black | `#0A0A0A` | Fondos profundos |
| Logo Black | `#010101` | Logo sobre fondos claros |
| Light Gray | `#F2F2F2` | Logo sobre fondos oscuros |
| White | `#FFFFFF` | Canvas principal |
| Apple Blue | `#0071E3` | CTA estilo Apple |

### Tokens semánticos (en código siempre)

Nunca uso grises crudos de Tailwind. Siempre tokens semánticos.

Texto: `text-primary` (#1A1A1A), `text-secondary` (#525252), `text-tertiary` (#737373), `text-placeholder`.
Fondos: `bg-primary` (#FFFFFF), `bg-secondary` (#FAFAFA), `bg-brand-solid`.
Bordes: `border-primary` (#E5E5E5), `border-secondary` (rgba(0,0,0,0.08) default).
Iconos: `fg-primary`, `fg-secondary`, `fg-tertiary`.

---

## Tipografía

Solo Inter. La regla que evita que parezca AI genérico: subo pesos un nivel y aprieto letter-spacing fuerte.

| Tamaño | Peso | Letter spacing | Line height | Uso |
|---|---|---|---|---|
| Hero 64px | 700 bold | -0.05em | 1.05 | Headlines principales |
| Display 2XL 72px | 700 bold | -0.05em | 1.05 | Hero sections |
| Display XL 60px | 700 bold | -0.04em | 1.10 | Títulos de página |
| Display LG 48px | 700 bold | -0.03em | 1.10 | Títulos de sección |
| Display MD 36px | 700 bold | -0.025em | 1.15 | Títulos de card |
| Card heading 18px | 700 bold | -0.02em | 1.30 | Headings de card |
| Big numbers | 700 bold | -0.03em | 1.00 | KPIs, métricas |
| Labels 14px | 600 semibold | -0.01em | 1.40 | Nav, table headers, form labels |
| Body 16px | 500 medium | -0.01em | 1.60 | Párrafos |
| Small 14px | 500 medium | -0.01em | 1.50 | Supporting text |
| Caption 12px | 500 medium | 0 | 1.40 | Timestamps, metadata |

Jerarquía de pesos:
- 500 medium: body, descriptions
- 600 semibold: nav, table headers, labels, badges
- 700 bold: headlines, card headings, métricas
- 400 regular: solo prose larga (blog, docs)

Truco del letter-spacing: incluso en body, `-0.01em`. En headings, `-0.02em` a `-0.03em`. Esto separa Inter "premium" de Inter "genérico".

**Para decks de propuestas comerciales (SOUL.md):** Inter Medium 40px headlines, Inter Regular 24px body, line-height 100%, letter-spacing -5%.

---

## Visual language

Estilo: Apple/Linear. Clean, quiet, premium.

- Canvas blanco puro `#FFFFFF`. No grises crudos, no cream.
- Texto near-black `#1A1A1A`. Nunca `#000000`.
- Whisper borders: `rgba(0,0,0,0.08)` o `border-secondary`. Casi invisibles.
- Sombras multicapa, opacidad máx 0.08.
- Section alternation: blanco / gris (#FAFAFA) / blanco. Rítmo visual.

Padding vertical entre secciones grandes: 80-120px.

Sombras (whisper):
```css
box-shadow: 0px 1px 2px rgba(0,0,0,0.01),
            0px 2px 6px rgba(0,0,0,0.02),
            0px 4px 16px rgba(0,0,0,0.04);
```

Border radius:
- `rounded-md` 8px: botones, inputs
- `rounded-lg` 12px: cards
- `rounded-xl` 16px: featured cards
- `rounded-full`: pills, avatars

---

## Logos

En `brand/logos/`:

| Archivo | Fill | Uso |
|---|---|---|
| `30x-logo-dark.svg` | `#010101` | Fondos claros |
| `30x-logo-light.svg` | `#F2F2F2` | Fondos oscuros |
| `30x-logo-accent.svg` | `#E9FF7B` | Hero sobre negro |

Nunca recreo el logo con texto ni CSS. Siempre SVG oficial.

---

## Dark mode

Obligatorio en toda app 30X. El amarillo `#E9FF7B` brilla en dark mode, es la firma visual.

Setup: `next-themes` + Untitled UI theme.css (define todas las variables bajo `.dark-mode`).
Toggle: top-right del header, iconos `MoonIcon`/`SunIcon` de Heroicons Solid.

---

## Animaciones

Snappy, no flashy. Es una red ejecutiva, no un gaming site.

Default para hover/colores:
```tsx
className="transition duration-100 ease-linear"
```

Complejas: `motion` (Framer Motion). Subtle.

Disabled siempre: `disabled:cursor-not-allowed disabled:opacity-50`. Nunca tokens custom.

---

## Stack técnico (cuando produzca código)

- React 19 + TypeScript
- Next.js 16 (App Router, RSC por defecto)
- Tailwind CSS v4.2
- React Aria Components (foundation de accesibilidad)
- Untitled UI (librería de componentes)
- `@heroicons/react/24/solid` — única librería de iconos permitida
- `motion` (Framer Motion) para animaciones
- `tailwindcss-animate`

### Iconos

Solo Heroicons Solid de `@heroicons/react/24/solid`. Prohibidos: Lucide, Phosphor, Radix Icons.

Tamaños: `size-4` (16px), `size-5` (20px), `size-6` (24px).
Colores: inactivo `text-[#999]`, activo `text-[#1A1A1A]`, hover transition entre los dos.

### Imports

React Aria siempre con prefijo `Aria*`:
```ts
import { Button as AriaButton } from "react-aria-components";
```

### Naming

Archivos en kebab-case siempre: `date-picker.tsx`, nunca `DatePicker.tsx`.

---

## Jerarquía de skills (cuando aplico craft)

En orden de prioridad:

1. **30x brand rules** (este archivo + SOUL.md). Siempre top.
2. **Untitled UI components** (`brand/30x-design-system/`). Estos componentes existen, los uso.
3. **impeccable / emil-design-eng** (`skills/craft/`). Filosofía de craft y polish.
4. **taste-skill** (`skills/craft/`). Premium frontend patterns con overrides 30X:
   - `DESIGN_VARIANCE`: 6 (estructurado pero no rígido)
   - `MOTION_INTENSITY`: 4 (subtle, executive)
   - `VISUAL_DENSITY`: 5 (balanced)
5. **animate / delight** (`skills/craft/`). Motion sutil.
6. **layout / typeset / colorize** (`skills/craft/`). Dominio específico.

---

## Reglas inmutables (de SOUL.md, recordatorio)

- "30X" siempre en mayúsculas. Nunca "30x".
- Andrés Bilbao Y Dylan Rosemberg juntos. Nunca uno solo.
- Nunca describo 30X como "intensa", "pequeña", "premium", "exclusiva", "élite".
- Nunca em dashes ni guiones conectores en copy.

---

## Cuándo escalo

Escalo a Juan Diego antes de producir output si:

1. El componente que necesito no existe en `brand/30x-design-system/`.
2. El cliente o el contexto requiere un asset que no está en el repo.
3. La regla parece chocar con lo que el cliente pide (ej. necesita amarillo sobre blanco).
4. Confianza < 8/10 en el output.

Nunca improviso para tapar. Nunca recreo logos. Nunca invento componentes.
