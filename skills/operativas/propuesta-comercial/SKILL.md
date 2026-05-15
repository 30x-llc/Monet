---
name: propuesta-comercial
description: Compongo una propuesta comercial de 30X para un cliente específico, duplicando la plantilla maestra en Canva, reemplazando slots (logo, fondo, copy del cliente), y exportando PDF.
trigger: "propuesta para [cliente]", "armame una propuesta para [cliente]", "necesito propuesta de [cliente]"
inputs:
  - Nombre del cliente (obligatorio).
  - Sector del cliente (opcional, si no lo sé hago research básico).
  - Ángulo específico de la propuesta (opcional, si no lo sé uso el genérico de la plantilla).
  - Assets del cliente: logo, imagen de fondo (opcional, si no me los pasan los busco).
outputs:
  - Link al diseño Canva duplicado y editado.
  - PDF descargado y enviado en el canal.
  - Resumen corto de qué reemplacé y dónde.
escalation:
  - Si la plantilla maestra (Design ID DAHJeGfEHOk) no responde o cambió.
  - Si no encuentro logo del cliente con calidad suficiente (resolución < 500px o fondo no transparente).
  - Si el cliente requiere ángulo nuevo no documentado.
  - Si confianza < 8/10 en el output.
version: 0.1.0
status: draft — pendiente material de JD para llenar slots
---

# Propuesta comercial

Skill operativa central. Esta es la primera. Si esta funciona, el patrón se replica para deck-comercial, carrusel-30x, landing-30x, etc.

---

## Filosofía

Composición sobre generación. No diseño la propuesta. Duplico la plantilla maestra que JD ya diseñó, cambio lo mínimo necesario, devuelvo.

Si lo que me piden requiere salir de la plantilla (ángulo nuevo, formato no estándar, contenido que no encaja en los slots), escalo a JD antes de improvisar.

---

## Pre-requisitos (estado al crear esta skill)

- [x] Plantilla maestra catalogada: Canva `DAHJeGfEHOk` (`stack/canva.md`).
- [x] Reglas de marca cargadas: `brand/30x-rules.md` y `soul/SOUL.md`.
- [ ] MCP Canva conectado a esta instancia de Hermes. **Pendiente: setup MCP.**
- [ ] Inventario de slots de la plantilla. **Pendiente: JD abre la plantilla y me lista qué elementos son reemplazables y su naming.**
- [ ] Convención de assets del cliente (dónde busco logo: web oficial, brand assets pages, Clearbit Logo API; dónde busco imagen de fondo: Unsplash con filtro de calidad, sitio del cliente). **Pendiente: definir con JD.**

---

## Workflow (versión 0 — borrador, falta validación)

### 1. Recibo el pedido

Formato típico en Slack:
```
@Monet propuesta para [Cliente]
```

Variantes que también acepto:
- "armame propuesta para [Cliente]"
- "necesito propuesta de [Cliente], sector [sector], ángulo [ángulo]"

Si el pedido viene sin más contexto: asumo ángulo genérico (educación ejecutiva 30X para empresa).

### 2. Confirmo y arranco

Respondo en el canal:
```
Recibido. Armando propuesta para [Cliente]. Estimado: ~3 minutos.
Voy a usar la plantilla DAHJeGfEHOk. Si querés algo diferente, frename.
```

(15 segundos de ventana de cancelación. Si no me frenan, ejecuto.)

### 3. Research mínimo del cliente

Solo lo necesario:
- Logo del cliente (versión vectorial preferida, transparente).
- Sector (si JD no me lo dio).
- Una imagen de fondo representativa (oficina, producto, contexto sectorial).

Fuentes en orden:
1. Sitio oficial del cliente (extraer logo SVG/PNG de `/brand`, `/press`, `/media`).
2. Clearbit Logo API: `https://logo.clearbit.com/[dominio].com`.
3. Búsqueda directa con filtro de calidad.

Si nada da resultado limpio: escalo a JD pidiéndole los assets.

### 4. Operación en Canva (vía MCP)

> **Pendiente:** detalle exacto del flujo MCP. Se llena cuando MCP Canva esté conectado a Hermes y JD valide el primer end-to-end. Por ahora documento la intención.

Pasos esperados:

1. `canva.designs.get({ designId: "DAHJeGfEHOk" })` — leer plantilla maestra.
2. `canva.designs.duplicate(...)` — duplicar.
3. Identificar slots de reemplazo (ver sección "Slots", pendiente de llenar).
4. Para cada slot:
   - `logo_cliente`: reemplazar imagen.
   - `fondo_cliente`: reemplazar imagen.
   - `nombre_cliente`: reemplazar texto.
   - `sector` (si aplica): reemplazar texto.
   - `angulo` (si aplica): reemplazar texto.
5. Validar que todos los slots quedaron con contenido (no dejé un placeholder vacío).
6. `canva.designs.export({ format: "pdf" })` — exportar PDF.
7. Subir PDF a Slack como archivo.

### 5. Entrega

Mensaje en Slack:
```
Listo, [Cliente].

Canva: [link]
PDF adjunto.

Slots reemplazados: logo, fondo, nombre, sector.
Slots con contenido genérico de la plantilla: [si quedó alguno].

Tiempo total: [X] segundos.
```

### 6. Iteración (si JD pide cambios)

Si JD responde con cambios:
- "cambiá el fondo" → research nueva imagen, reemplazar slot, re-exportar.
- "el sector está mal, es banca" → reemplazar texto, re-exportar.
- "no me gusta el ángulo" → escalo: "¿qué ángulo querés en su lugar?".

No re-genero desde cero. Edito el duplicado existente.

---

## Slots de reemplazo en la plantilla maestra

> **PENDIENTE:** JD abre el design `DAHJeGfEHOk` y me dicta:
> - Qué frames/elementos son reemplazables.
> - Cómo se llama cada uno en el panel de capas (naming convention).
> - Qué tipo es cada uno (imagen, texto, fill, etc.).
>
> Esto se completa en sesión de catalogación de la plantilla. Hasta entonces, trabajo "a ojo" duplicando y reemplazando lo obvio, pero el output no es production-grade.

Estructura esperada (a confirmar):

| Slot | Tipo | Convención | Notas |
|---|---|---|---|
| `logo_cliente` | image | ? | Versión transparente, idealmente vectorial |
| `fondo_cliente` | image | ? | Full-bleed, alta resolución |
| `nombre_cliente` | text | ? | Plain text, sin formato |
| `sector_cliente` | text | ? | Plain text |
| `angulo_propuesta` | text | ? | Una frase, declarativo |
| `fecha` | text | ? | Mes y año actual |

---

## Reglas de copy aplicables (heredadas de SOUL.md)

- "30X" siempre en mayúsculas.
- Andrés Bilbao Y Dylan Rosemberg juntos cuando se nombren cofundadores.
- Nunca em dashes ni guiones conectores.
- Declarativo y calmo. Específico le gana a genérico.
- Sin "premium", "quiet", "silence", lenguaje motivacional, urgencia falsa, lenguaje de gurú.

---

## Reglas de diseño aplicables (heredadas de brand/30x-rules.md)

- Color accent `#E9FF7B` exacto.
- Logos solo desde `brand/logos/` (versiones aprobadas).
- Tipografía Inter (Medium 40px headlines, Regular 24px body, line-height 100%, letter-spacing -5% para decks).
- Nunca recrear logo del cliente: usar siempre el oficial.

---

## Pitfalls conocidos

(Vacío. Se llena después del primer end-to-end real.)

---

## Histórico de uso

(Vacío. Se llena con cada ejecución exitosa o fallida.)
