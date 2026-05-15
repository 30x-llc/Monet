# Juan Diego 30x Design

> El sistema de diseno del equipo 30x. Este repo existe para que cualquier miembro del team pueda crear apps con Claude Code que se vean y se sientan como si Juan Diego las hubiera disenado personalmente.

---

## Quick Start para el Team

```bash
# 1. Clona este repo
git clone https://github.com/juandelaossa-30x/juan-diego-30x-design.git

# 2. En tu nuevo proyecto, apunta Claude Code a este CLAUDE.md
# Abre Claude Code y dile: "Usa el design system de juan-diego-30x-design"

# 3. Copia los componentes base en tu proyecto
cp -R juan-diego-30x-design/design-system/components mi-app/src/
cp -R juan-diego-30x-design/design-system/styles mi-app/src/
cp -R juan-diego-30x-design/design-system/utils mi-app/src/

# 4. Instala dependencias
npm install react-aria react-aria-components @heroicons/react motion tailwindcss-animate tailwind-merge next-themes
```

---

## Estructura del Repo

```
juan-diego-30x-design/
├── CLAUDE.md            # Todas las reglas de diseno 30x (la biblia)
├── design-system/       # 267 componentes Untitled UI + tokens
├── skills/              # 27 skills de AI para polish & design
├── references/          # Repos de referencia (Untitled UI, shadcn, gstack, heroicons)
└── README.md            # Este archivo
```

---

## Skills Documentadas

Aqui esta la guia completa de cada skill — cuando usar cada una segun la necesidad del proyecto.

### Skills de Diseno Fundacional (usar SIEMPRE)

| Skill | Cuando usar |
|-------|-------------|
| **impeccable** | Al empezar CUALQUIER proyecto. Crea la base del design system y genera componentes de alta calidad que evitan la estetica generica de AI. Llama con `craft` para construir, `teach` para setup, `extract` para extraer tokens. |
| **emil-design-eng** | Cuando quieras ese polish de siguiente nivel. Encoda la filosofia de Emil Kowalski sobre UI polish, decisiones de animacion, y los detalles invisibles que hacen que el software se sienta increible. |
| **taste-skill** | Para entrenar al AI a disenar como una agencia de alta gama. Define fuentes, spacing, shadows, cards, y animaciones que hacen que un sitio se vea "caro". Bloquea defaults genericos. |

### Skills de Estetica / Direccion Visual

Elige UNA de estas segun el tipo de producto:

| Skill | Cuando usar |
|-------|-------------|
| **minimalist-skill** | Para interfaces editoriales tipo Notion/Linear. Monocromatico calido, contraste tipografico, bento grids planos, pasteles sutiles. Sin gradientes ni shadows pesados. |
| **brutalist-skill** | Para dashboards data-heavy, portfolios o sitios editoriales que necesitan sentirse como blueprints desclasificados. Swiss typography + CRT terminal aesthetics. Grids rigidos. |
| **soft-skill** | Para UI luxury/expensive. Fuentes premium, mucho whitespace, depth sutil, spring animations suaves. |
| **stitch-skill** | Para generar un DESIGN.md compatible con Google Stitch. Reglas semanticas anti-genericas para premium UI generation. |

### Skills de Ajuste Fino (usar segun necesidad)

**Tipografia y Layout:**
| Skill | Cuando usar |
|-------|-------------|
| **typeset** | Fonts se ven off, problemas de readability, hierarchy de texto debil, sizing raro. Mejora fuentes, hierarchy, weight, readability. |
| **layout** | Layout se siente off, problemas de spacing, hierarchy visual debil, UI crowded, alignment problems. Mejora composicion y ritmo. |
| **shape** | Para planear UX/UI de una feature ANTES de escribir codigo. Hace discovery interview estructurado y produce un design brief. |

**Color y Estilo:**
| Skill | Cuando usar |
|-------|-------------|
| **colorize** | El diseno se ve muy monocromatico, gris, dull. Anade color estrategicamente sin perder refinamiento. |
| **quieter** | El diseno esta muy loud, muy bold, abrumador. Tona down la intensidad preservando calidad. |
| **bolder** | El diseno se ve muy safe, bland, generico. Amplifica impacto visual y personalidad. |

**Interactividad:**
| Skill | Cuando usar |
|-------|-------------|
| **animate** | Anadir animaciones, transitions, micro-interactions, motion design, hover effects. Hace la UI sentirse viva. |
| **delight** | Para anadir moments of joy, personalidad, touches inesperados. Eleva lo funcional a lo deleitable. |
| **overdrive** | Cuando quieras hacer algo extraordinario. Interfaces tecnicamente ambiciosas con shaders, spring physics, scroll-driven reveals, 60fps animations. |

**Clarity y Simplicidad:**
| Skill | Cuando usar |
|-------|-------------|
| **distill** | Stripping del diseno a su esencia. Quita complejidad innecesaria. Simplifica, declutter, reduce noise. |
| **clarify** | Texto confuso, labels unclear, error messages malos, instrucciones dificiles. Mejora UX writing. |
| **adapt** | Responsive design, mobile layouts, breakpoints, viewport adaptation, cross-device compatibility. |

**Production Readiness:**
| Skill | Cuando usar |
|-------|-------------|
| **harden** | Para hacer una app production-ready. Error handling, empty states, onboarding flows, i18n, text overflow, edge cases. |
| **optimize** | Performance issues. Slow, laggy, janky. Mejora loading speed, rendering, animations, images, bundle size. |
| **polish** | Final pass antes de shippear. Fixa alignment, spacing, consistency, micro-detail issues. De good a great. |

**Review y QA:**
| Skill | Cuando usar |
|-------|-------------|
| **critique** | Review de diseno desde perspectiva UX. Evalua visual hierarchy, IA, emotional resonance, cognitive load con scoring cuantitativo. |
| **audit** | Technical quality check. Accessibility, performance, theming, responsive design, anti-patterns. Genera reporte con severity P0-P3. |
| **redesign-skill** | Para upgrade de websites/apps existentes a premium quality. Audita diseno actual, identifica AI patterns genericos, aplica high-end standards sin romper funcionalidad. |

**Utilidad:**
| Skill | Cuando usar |
|-------|-------------|
| **output-skill** | Cuando necesites que el AI genere codigo completo sin placeholders, sin truncaciones, sin comentarios "// rest of the code". |

---

## Flujo Recomendado para Empezar un Proyecto Nuevo

### 1. Planeacion (antes de codigo)
```
Usa: shape → critique
```
- `shape` hace discovery del feature y produce design brief
- `critique` valida la direccion antes de construir

### 2. Setup del Design System
```
Usa: impeccable (con comando "teach")
```
- Establece tokens, fuentes, spacing, palette del proyecto

### 3. Eleccion de Estetica
```
Elige UNA: minimalist-skill | brutalist-skill | soft-skill | taste-skill
```
- Segun el producto: dashboards tech → brutalist, luxury SaaS → soft, editorial → minimalist, general premium → taste

### 4. Build
```
Usa: impeccable (con comando "craft") + emil-design-eng
```
- `impeccable craft` construye los componentes
- `emil-design-eng` mete el polish de siguiente nivel

### 5. Refinamiento
```
Usa segun necesidad: typeset | layout | colorize | animate | delight
```
- Ajusta lo que falte — tipografia, layout, color, motion, personality

### 6. Production
```
Usa en orden: harden → optimize → polish → audit
```
- `harden` cubre edge cases, `optimize` arregla performance, `polish` final pass, `audit` technical review

---

## Reglas 30x (lee `CLAUDE.md` para el detalle completo)

- **Color accent**: `#E9FF7B` — SOLO sobre fondos oscuros
- **Typography**: Inter con weights heavy (semibold/bold) + letter-spacing negativo agresivo (`-0.01em` a `-0.03em`)
- **Icons**: Heroicons Solid UNICAMENTE (`#999` inactive, `#1A1A1A` active) — banned Lucide, Phosphor, Radix
- **Badges**: SIEMPRE con `ring-1 ring-inset ring-[color]/20`
- **Dark mode**: OBLIGATORIO en toda app (`#000000` bg, `#0A0A0A` cards, `#292A2B` borders)
- **Logos**: Usar SVG oficiales de `design-system/` — NUNCA recrear con CSS/texto
- **Component library**: Untitled UI React (basada en React Aria)

---

## Repo Links

- **GitHub**: https://github.com/juandelaossa-30x/juan-diego-30x-design
- **Reglas completas**: [CLAUDE.md](./CLAUDE.md)
- **Design tokens**: [design-system/styles/theme.css](./design-system/styles/theme.css)
- **Componentes**: [design-system/components/](./design-system/components/)
- **Skills**: [skills/](./skills/)

---

Built with Untitled UI + 30x Design Principles — by Juan Diego, Head of Design @ 30x
