# Stack: Web (30x.com)

Páginas vivas en 30x.com que necesito consultar y, eventualmente, auditar diariamente para reporte de conversión.

Construido en Framer (último publish detectado: 15 may 2026).

---

## Páginas catalogadas

### `/comercial` — Kit comercial

| Campo | Valor |
|---|---|
| URL | https://30x.com/comercial |
| Propósito | Hub público de materiales comerciales: propuestas, decks de programas, templates, brochures. |
| Contenido catalogado | 8 piezas (Propuesta Colsubsidio, Brochure Template, 30x General Deck, Inmersivo Webinar, Caribe Exponencial × Xtreme Sales, Multipliers Deck, BMS Proposal, Next Steps Inmersivo) |
| Cross-ref | Las piezas mapeadas a IDs viven en `stack/canva.md` y `stack/figma.md`. |

### `/inmersion-ejecutiva-presencial` — Inmersivo (flagship)

| Campo | Valor |
|---|---|
| URL | https://30x.com/inmersion-ejecutiva-presencial |
| Propósito | Landing del programa Inmersivo Ejecutivo Presencial. 3 días. |
| Próximas ediciones (al snapshot) | Bogotá 3-5 junio, Caracas 8-10 junio |
| Tagline activo | "Donde los founders se encuentran para escalar" |
| Mentores destacados | Andrés Bilbao (Rappi co-founder), Daniel Bilbao (Truora founder), Dylan Rosemberg (Growth Rockstar founder, 30X co-founder) |
| Métrica destacada | +3100 alumnos ejecutivos |

---

## Programas (catálogo público, de /inmersion)

- Inmersivo (flagship presencial)
- Ventas
- Inteligencia Artificial
- Growth
- Fundraising School
- Achievers
- Next
- Multipliers

---

## Roadmap de skill `audit-30x-web`

Skill operativa pendiente. Workflow esperado:

1. Cron diario: bajar HTML de páginas clave (`/`, `/comercial`, `/inmersion-ejecutiva-presencial`, `/programas`).
2. Comparar contra snapshot anterior.
3. Detectar:
   - Cambios de copy (intencionales o accidentales).
   - Links rotos.
   - Performance (LCP, CLS, peso total).
   - Conversión (CTAs visibles, jerarquía de pantalla).
4. Reporte diario en Slack `#monet-ai` con secciones:
   - Qué cambió.
   - Qué romper.
   - Qué mejorar.
   - Qué optimizar para conversión.

Esto se materializa cuando MCP de Figma/Canva y MCP de un browser (para Lighthouse) estén conectados a Hermes.

---

## Cómo se llena este archivo

JD me pasa URLs de páginas. Yo bajo el HTML (curl), extraigo título, descripción, tono, métricas declaradas. Lo cataloga acá. Cuando una página cambia significativamente, actualizo el snapshot.
