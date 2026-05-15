# Skills operativas

Skills que ejecuto end-to-end para Juan Diego y el equipo de 30X. Cada una es un workflow blindado.

Diferencia con `skills/craft/`:
- `craft/`: skills de filosofía y técnica de diseño (impeccable, emil-design-eng, audit, critique, etc.). Las uso como lentes cuando produzco output.
- `operativas/`: workflows end-to-end (recibo pedido → ejecuto → entrego). Esta carpeta.

---

## Activas

_(en construcción)_

## Roadmap (en orden de prioridad)

1. `propuesta-comercial/` — Pedido de propuesta → plantilla Canva o Figma → reemplazo de variables → exportar PDF → devolver link.
2. `carrusel-30x/` — Pedido de carrusel Instagram → plantilla → reemplazo → exportar imágenes.
3. `deck-comercial/` — Deck completo desde brief estructurado.
4. `landing-30x/` — Landing en Framer desde brief.
5. `audit-30x-web/` — Audit diario automático de 30x.com con reporte.
6. `brief-cliente/` — Estructurar input de Slack en formato consumible por otras skills.

---

## Cómo se crea una skill operativa

Cada skill tiene su carpeta con `SKILL.md` siguiendo este esqueleto:

```
skills/operativas/[nombre]/
├── SKILL.md          obligatorio: frontmatter + workflow + reglas + pitfalls
├── templates/        opcional: plantillas markdown específicas
└── examples/         opcional: outputs anteriores como referencia
```

Frontmatter mínimo:
```yaml
---
name: nombre-skill
description: una frase. Cuándo se activa.
trigger: patrón de pedido típico (ej. "propuesta para X")
inputs: qué necesito del usuario
outputs: qué devuelvo
escalation: cuándo paro y escalo
---
```
