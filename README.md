# Monet

> AI designer del equipo de 30X. Genera, edita y exporta propuestas
> comerciales con un canvas estilo Figma.

Vive en **[monet.30x.com](https://monet.30x.com)** (alias activo:
[design.30x.com](https://design.30x.com)).

---

## Qué hace

- **Genera** propuestas comerciales de 30X a partir de un briefing
  corto, usando el sistema de diseño 30X (typography, colors, mentor
  database, logos curados).
- **Edita** las slides en un canvas estilo Figma — selección de
  elementos, drag/resize, snap a guías, multi-select, properties
  panel, layers panel, undo/redo, atajos de teclado.
- **Exporta** a PDF (alta fidelidad, web-renderer) y a Canva
  (templates + autofill).

## Stack

- Next.js (App Router, RSC, Cache Components)
- React 19
- TypeScript
- Tailwind
- Neon Postgres (decks + identity)
- Vercel Blob (image uploads)
- Anthropic Claude (generation + iteration)
- Perplexity / Exa (research)
- Canva Connect API (export pipeline)

## Local dev

```bash
pnpm install
cp .env.example .env.local  # fill in keys
pnpm dev
```

App corre en `http://localhost:3000`.

## Deploy

Auto-deploy a Vercel en cada `push` a `main`. Producción:
[monet.30x.com](https://monet.30x.com).

## Estructura

- `src/app` — Next.js App Router (pages + API routes)
- `src/components/editor` — chrome del editor (toolbar, rail, panels,
  chat bar, properties panel)
- `src/components/slides` — renderers de slides (structured + canvas)
- `src/lib` — auth, db, exports, prompts, text styles, AI clients

## Brand

- Wordmark: **Monet** con la "t" en lima (`#E9FF7B`) — visual rhyme
  con la X de 30X
- Tipografía canónica: Inter, 8 estilos (Title 96 / Header 1-3 /
  Body 1-3 / Note 20) — ver `src/lib/text-styles.ts`
- El mark "30X" que aparece DENTRO de los slides es la marca de
  partnership para los decks comerciales del cliente — sigue siendo
  30X. Monet es la herramienta; los decks son de 30X.

## Integración con 30X Hub

Monet acepta identidad del usuario vía headers:

```
x-30x-user-email: pepito@30x.com
x-30x-user-name: Pepito Pérez
```

Cuando el Hub embeba a Monet, debe pasar estos headers. En acceso
directo (sin Hub), Monet usa la identidad "anonymous@30x.com" como
fallback.
