# Monet

Mano derecha de Juan Diego De La Ossa Serrano, Head of Design de 30X.

Este repo es el cerebro de Monet. No es una app. Es la identidad, las reglas, las skills, el design system y los workflows que ejecuta un agente conversacional viviendo en Slack 24/7, con acceso a Figma, Canva, Framer y todo el stack de diseño de Juan Diego.

El agente toma plantillas y diseños existentes (que Juan Diego ya produjo), las duplica vía MCP, reemplaza variables (cliente, copy, assets) y devuelve el output terminado. Composición sobre generación.

---

## Estructura

```
Monet/
├── soul/
│   └── SOUL.md                   Identidad del agente (Monet)
├── brand/
│   ├── 30x-rules.md              Reglas operativas destiladas
│   ├── 30x-design-system/        Design system completo (Untitled UI customizada 30X)
│   └── logos/                    SVGs oficiales (dark, light, accent)
├── skills/
│   ├── operativas/               Workflows end-to-end (propuesta-comercial, etc.)
│   └── craft/                    27 skills de filosofía de diseño
├── stack/
│   ├── figma.md                  Inventario de archivos Figma
│   ├── canva.md                  Inventario de plantillas Canva
│   └── otros.md                  Framer, Notion, Slack, Drive, Tally, Calendar
├── references/                   untitled-ui-react, heroicons, shadcn, gstack, taste
├── projects/                     Estado vivo de proyectos en curso
├── templates/                    Plantillas markdown para outputs
└── legacy/
    ├── monet-app/                App Next.js anterior (monet.30x.com)
    └── juan-diego-30x-design-*   CLAUDE.md y README originales
```

---

## Historia

Este repo pasó por dos iteraciones antes de su forma actual.

1. **Monet-app** (`legacy/monet-app/`). App Next.js que generaba decks desde brief, deployada en `monet.30x.com`. Buen prototipo, pero la generación pura no llegaba al estándar de Juan Diego.

2. **juan-diego-30x-design** (repo separado, ahora absorbido aquí). Design system + 27 skills + references. Era el cerebro de marca.

3. **Monet (este)**. Hermes Agent con SOUL.md, skills operativas, todo el design system absorbido, MCP de Figma y Canva. Vive en Slack. Compone sobre el trabajo ya hecho.

El repo `juandiegodlo/juan-diego-30x-design` queda archivado tras la migración.

---

## Cómo opera Monet

1. Alguien del equipo escribe en Slack: "Monet, necesito una propuesta para Mastercard".
2. Monet identifica la skill operativa (`skills/operativas/propuesta-comercial/`).
3. Lee `stack/canva.md` o `stack/figma.md` para encontrar la plantilla correcta.
4. Abre la plantilla via MCP (Canva o Figma), duplica.
5. Reemplaza variables (logo cliente, fondo, copy).
6. Exporta PDF.
7. Devuelve link Canva/Figma + PDF en Slack.

Si falla en cualquier paso, escala a Juan Diego con la pregunta específica.

---

## Contribución

Solo Juan Diego mergea a `main`. Monet trabaja en branches `feat/*` y abre PRs.

Cambios al brand, a las skills, o al stack quedan versionados aquí. La memoria del agente vive en el repo, no en la sesión.
