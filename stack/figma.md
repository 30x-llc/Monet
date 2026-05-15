# Stack: Figma

Inventario vivo de archivos Figma. Cuando recibo un pedido que se compone en Figma (story, post, design system), abro este archivo, identifico el archivo correcto, y opero vía MCP de Figma.

Workflow validado por Juan Diego: Figma MCP funciona ful smooth. Le paso link, abro vía connector, hago el trabajo.

---

## Librerías base

### Untitled UI Figma (PRO Variables v8) — librería customizada 30X

| Campo | Valor |
|---|---|
| File key | `UyUYzdQUugOZB52S9RDO6T` |
| URL | https://www.figma.com/design/UyUYzdQUugOZB52S9RDO6T/❖-Untitled-UI-Figma-–-PRO-VARIABLES--v8.0--KTWJ8mYFqVpN--Copy- |
| Node de referencia | `1480-0` |
| Cuándo uso | Foundation. Es la librería base de componentes 30X. Customizada con los tokens 30X (accent #E9FF7B, tipografía, etc.). Cualquier UI nueva debe ensamblar desde acá. |
| Repo de código equivalente | https://github.com/untitleduico/react |

---

## Plantillas / archivos de trabajo

### Story Claude Code (ejemplo de Figma)

| Campo | Valor |
|---|---|
| File key | `l1nF5yl84w3GVGPCZkHapZ` |
| URL | https://www.figma.com/design/l1nF5yl84w3GVGPCZkHapZ/Claude-Code-Curso?node-id=3-558 |
| Node específico | `3-558` |
| Cuándo uso | Story de evento Claude Code de 30X. Referencia de estilo para stories de eventos. |

### AI For Executives Brochure (del kit comercial)

| Campo | Valor |
|---|---|
| File key | `lI0qrm5xgEqPvGvb6IkJsw` |
| URL | https://www.figma.com/design/lI0qrm5xgEqPvGvb6IkJsw/AI-For-Executives-Brochure--Copy-?node-id=0-1 |
| Cuándo uso | Brochure del programa AI for Executives. Catalogado en 30x.com/comercial. |

### Figma Slides — Deck 1 (kit comercial)

| Campo | Valor |
|---|---|
| File key | `UZxWI8bavhvtHrBGgo0RPR` |
| Tipo | Figma Slides (no design) |
| URL | https://www.figma.com/slides/UZxWI8bavhvtHrBGgo0RPR |
| Cuándo uso | Pendiente: confirmar con JD qué deck es éste (aparece en /comercial). |

### Figma Slides — Deck 2 (kit comercial)

| Campo | Valor |
|---|---|
| File key | `Y3h99hkp8T10DONAKmXxuA` |
| Tipo | Figma Slides |
| URL | https://www.figma.com/slides/Y3h99hkp8T10DONAKmXxuA |
| Cuándo uso | Pendiente: confirmar con JD qué deck es éste. |

---

## References externas (repos de código)

Vinculadas a Figma pero viven como código:

| Recurso | URL | Uso |
|---|---|---|
| Untitled UI React (upstream) | https://github.com/untitleduico/react | Implementación React de la librería que también tenemos en Figma. |
| shadcn/ui | https://github.com/shadcn-ui/ui | Patterns reference. `pnpm dlx shadcn@latest init --preset b0 --template next` |
| shadcn quick init | https://ui.shadcn.com/create | Tool para arrancar proyectos shadcn rápido. |
| Lunor (dashboards) | https://www.lunor.design/library | Recurso visual de JD para diseños de dashboards. No tengo file key, es referencia visual externa. |

---

## Cómo se llena este archivo

Para cada archivo nuevo, JD me pasa el link de Figma. Yo extraigo el file key con regex `figma.com/(design|slides|file)/([A-Za-z0-9]+)`, lo agrego acá con su contexto.

JD documenta: cuándo usar el archivo, qué nodes son "plantilla base" vs "instancias entregadas", convenciones de naming de frames y components.
