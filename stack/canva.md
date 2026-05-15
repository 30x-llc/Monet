# Stack: Canva

Inventario vivo de archivos Canva. Cuando recibo un pedido (ej. "propuesta para Mastercard"), abro este archivo, identifico la plantilla correcta, y opero vía MCP de Canva.

Workflow validado por Juan Diego: Canva MCP funciona ful smooth dentro de Claude chat. Le paso link, abro vía connector, duplico, reemplazo, exporto.

---

## Plantillas (templates base, lo que duplico)

### Propuesta comercial — base genérica

| Campo | Valor |
|---|---|
| Nombre | Plantilla propuestas comerciales |
| Alias corto | https://canva.link/44dyj1zasgqud4a |
| Design ID | `DAHJeGfEHOk` |
| Share token | `zrdVa8oytZGofqI5QoIB7w` |
| URL editor | https://www.canva.com/design/DAHJeGfEHOk/zrdVa8oytZGofqI5QoIB7w/edit |
| Cuándo uso | Base para propuestas comerciales a empresas (tipo Mastercard, Colsubsidio, BMS, etc.). Esta es la plantilla maestra que duplico y customizo. |
| Variables a reemplazar | Logo cliente, imagen fondo del cliente, nombre del cliente, sector, ángulo específico de la propuesta |

### Deck Inmersivo (programa flagship presencial)

| Campo | Valor |
|---|---|
| Nombre | Deck del Inmersivo Ejecutivo Presencial |
| Alias corto | https://canva.link/qrnj0rnrjirbiz0 |
| Design ID | `DAHJskagfmw` |
| Share token | `IcraYyzLoUTVVB_VgYJGaA` |
| Cuándo uso | Cuando alguien pide info del Inmersivo (programa de 3 días en Bogotá/Caracas). Base del pitch presencial. |
| Notas | Programa real: https://30x.com/inmersion-ejecutiva-presencial — próx. Bogotá 3-5 jun, Caracas 8-10 jun. Mentores Andrés Bilbao, Daniel Bilbao, Dylan Rosemberg. |

### Itinerario inmersivo (versión A)

| Campo | Valor |
|---|---|
| Alias corto | https://canva.link/fz75qmylk82ll32 |
| Design ID | `DAHJFu2f6pM` |
| Share token | `MlNghAZZSXG5nN_yed9i5A` |
| Cuándo uso | Programa día a día del Inmersivo. Variante A. |

### Itinerario inmersivo (versión B)

| Campo | Valor |
|---|---|
| Alias corto | https://canva.link/mbilihpktj2sag4 |
| Design ID | `DAHJFsSrvT0` |
| Share token | `Pqf2dy7gV6iSvmvrzGUfJQ` |
| Cuándo uso | Variante B del itinerario. Pendiente: confirmar con JD qué diferencia con A y cuándo usar cuál. |

---

## Ejemplos de propuestas ya entregadas (referencia, NO duplicar como base)

### Propuesta Colsubsidio (caso real cerrado)

| Campo | Valor |
|---|---|
| Alias corto | https://canva.link/xhn1rgeql7pxy8o |
| Design ID | `DAHHQd08OSk` |
| Share token | `Zb-w6kvdOJrd06fQdA6LPA` |
| Para qué sirve | Referencia de cómo se ve una propuesta terminada y enviada. Aprender estilo y tono. **NO duplicar esto, duplicar la plantilla base.** |

---

## Kit comercial completo (de 30x.com/comercial)

Listado oficial publicado en la web. Estos 8 piezas son el "kit comercial" visible para el público.

| Pieza | Design ID | Alias | Notas |
|---|---|---|---|
| Propuesta 30X × Colsubsidio | `DAHHQd08OSk` | https://canva.link/xhn1rgeql7pxy8o | Ya catalogada arriba |
| Brochure Template | (pdte mapear) | — | Posiblemente Figma "AI For Executives Brochure" |
| 30x General Deck | `DAHBJT_60ww` | https://canva.link/kf824uqmhurvwwk | Pitch general 30X |
| Inmersivo Webinar | (pdte mapear) | — | |
| Caribe Exponencial × Xtreme Sales | `DAHGdW1ogao` | https://canva.link/s45ivhjejqonj7b | Evento Caribe |
| Multipliers Deck | `DAHGdc7NQb8` | https://canva.link/ujj1thd2rvxucdu | Programa Multipliers |
| BMS Proposal | `DAHEhaMA79U` | https://canva.link/xenwx54hgiby861 | Ejemplo BMS |
| Next Steps Inmersivo | `DAHGdXziqF8` | https://canva.link/xqgiwh0hm3mr3cx | Follow-up post-inmersivo |

(Pendiente: pedirle a JD que confirme el mapping pieza→ID y cuáles son plantillas base vs ejemplos cerrados.)

---

## Workflow base (MVP de SOUL.md)

Pedido tipo: "necesito una propuesta para [Cliente]".

1. Identifico que la plantilla correcta es `DAHJeGfEHOk` (propuesta comercial base).
2. Vía MCP Canva, abro el design, lo duplico.
3. Reemplazo slots:
   - Logo cliente (research o lo recibo de JD).
   - Imagen de fondo del cliente.
   - Copy: nombre, sector, ángulo.
4. Exporto PDF.
5. Devuelvo link Canva + PDF a JD en Slack.

Si falta alguna variable o el cliente requiere algo no estándar (ej. logo en formato raro, ángulo nuevo no documentado), escalo.

---

## Cómo se llena este archivo

Para cada plantilla nueva, JD me pasa el link de canva.link o canva.com. Yo extraigo el design ID con `curl -sI link | grep location`, lo agrego acá con su contexto.

JD documenta: cuándo usar la plantilla, qué slots se reemplazan, qué convenciones hay en los nombres de capas dentro del diseño.
