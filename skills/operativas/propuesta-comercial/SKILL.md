---
name: propuesta-comercial
description: Compongo una propuesta comercial de 30X para un cliente específico, usando Canva Connect API para clonar el brand template, autofill los componentes (logo, headline, body, hero), y exportar PDF.
trigger: "propuesta para [cliente]", "armame una propuesta para [cliente]", "necesito propuesta de [cliente]"
inputs:
  - Nombre del cliente (obligatorio).
  - Sector del cliente (opcional, si no lo sé hago research básico).
  - Ángulo específico de la propuesta (opcional, si no lo sé uso el genérico de la plantilla).
  - Assets del cliente: logo, imagen de fondo (opcional, si no me los pasan los busco).
outputs:
  - Link al diseño Canva clonado y autofilled.
  - PDF descargado y enviado en el canal.
  - Resumen corto de qué reemplacé y dónde.
escalation:
  - Si la plantilla maestra no tiene componentes marcados (autofill devuelve "design_not_fillable").
  - Si no encuentro logo del cliente con calidad suficiente (resolución < 500px o fondo no transparente).
  - Si el cliente requiere ángulo nuevo no documentado.
  - Si confianza < 8/10 en el output.
version: 0.3.0
status: ready — auth OAuth completada, API conectada con scopes correctos. Pendiente paso manual una vez: convertir elementos del brand template Aeroméxico (EAHH5r6KZD8) en componentes nombrados.
---

# Propuesta comercial

Skill operativa central. Esta es la primera. Si esta funciona, el patrón se replica para deck-comercial, carrusel-30x, landing-30x, etc.

---

## Filosofía

Composición sobre generación. No diseño la propuesta. Uso Canva Connect API para clonar la plantilla maestra que JD ya diseñó (configurada como brand template), autofill los componentes con datos del cliente, exporto PDF, devuelvo.

Si lo que me piden requiere salir de la plantilla (ángulo nuevo, formato no estándar, contenido que no encaja en los componentes), escalo a JD antes de improvisar.

---

## Arquitectura técnica (validada end-to-end)

- **NO usamos MCP.** El MCP de Canva requiere OAuth con browser callback a localhost. Hermes corre headless en Hostinger sin browser. Inviable.
- **Usamos Canva Connect API directa.** Cliente Python en `agent/canva_client.py` con service-account refresh token. Sin browser, sin túneles, funciona desde el server.
- **Auth: long-lived refresh token + access tokens de 4h auto-refrescados.** Canva rota el refresh token en cada exchange, el cliente lo persiste automáticamente en `/opt/data/.hermes/secrets/canva.env`.
- **Capacidad clave: Brand Template Autofill vía componentes.** En la UI moderna de Canva (2025+), los slots autofillables se llaman "componentes". Se crean en el editor del template marcando un elemento → botón derecho → "Crea un componente" (atajo `Opt+Cmd+K`). Cada componente recibe un nombre snake_case que aparece como key en `get_brand_template_dataset()`.

---

## Estado actual (al cierre de bootstrap, 15 mayo 2026)

- [x] Plantilla maestra de propuestas catalogada: Canva `EAHH5r6KZD8` ("Plantilla de Propuestas Comerciales Aeroméxico | 30X | Andrés Bilbao"), 7 páginas.
- [x] Templates adicionales descubiertos en el team workspace 30X (team_id `oBYi_2N8nLUIydcWtFP6sc`):
  - `EAHH5r6KZD8` — Plantilla de Propuestas Comerciales (Aeroméxico)
  - `EAHH5XMNYhY` — 30x Plantilla Presentaciones
  - `EAHH5JU6Fgg` — 30x BMS Proposal
  - `EAHH5LEW30w` — Speaking Engagements 30X Andrés Bilbao
- [x] Reglas de marca cargadas: `brand/30x-rules.md` y `/opt/data/.hermes/SOUL.md`.
- [x] Cliente Python Canva listo y validado: `agent/canva_client.py` (con auto-persistencia de refresh token rotado).
- [x] Cliente Python Figma listo: `agent/figma_client.py`.
- [x] Credenciales Canva en `/opt/data/.hermes/secrets/canva.env`. Permisos 600, owner hermes.
- [x] OAuth Canva probado end-to-end: `/api/canva/connect` → consent screen con 7 scopes → callback → bootstrap-bot devuelve refresh token.
- [x] Scopes correctos en código (legacy/monet-app/src/lib/canva/config.ts) y en el developer portal de Canva: design:meta:read, design:content:write, design:content:read, asset:write, brandtemplate:meta:read, brandtemplate:content:read, profile:read.
- [x] `list_brand_templates()` funcional, retorna 4 templates del team.
- [x] `get_brand_template_dataset()` funcional pero retorna `{}` para los 4 templates — ninguno tiene componentes marcados todavía.
- [ ] **Bloqueo único restante:** convertir elementos del template `EAHH5r6KZD8` en componentes nombrados (paso manual en Canva web, una vez por template). Sin esto, `create_autofill()` falla con `design_not_fillable: Design does not have any autofill capable elements`.

---

## Cómo marcar componentes en Canva (paso manual, una vez por template)

Abre el brand template en Canva web (ejemplo: `https://www.canva.com/brand/brand-templates/EAHH5r6KZD8`).

Para cada elemento que cambie entre clientes (logos, textos del cliente, hero image, números customizados), repite:

1. **Click sobre el elemento** para seleccionarlo (queda con borde de selección).
2. **Click derecho** → menú contextual.
3. **"Crea un componente"** (atajo `Opt + Cmd + K` en Mac, `Alt + Ctrl + K` en Windows).
4. Canva pide un nombre. **Usar snake_case descriptivo**. La key que pongas aquí es exactamente la que aparece en el dataset y la que el cliente Python usa como parámetro en autofill.

### Naming convention obligatorio para Plantilla Propuestas Comerciales (EAHH5r6KZD8)

Estos son los nombres que el orquestador espera. Mantenerlos exactos:

**Página 1 (portada):**
- `logo_cliente` (image) — el logo del cliente (donde está "AEROMEXICO" en la versión actual)
- `headline_principal` (text) — el bloque "30X reconoce a la aerolínea..."
- `headline_accent` (text) — la parte amarilla "construir una..."
- `body_propuesta` (text) — el párrafo "Buscamos una alianza..."
- `hero_image` (image) — la imagen de fondo (el avión)

**Página 2 ("Lo que cada uno pone sobre la mesa"):**
- `mesa_titulo` (text)
- `mesa_subtitulo` (text)

**Página 3 (KPIs "5M USD / 25% / 80%"):**
- `kpi_1_valor` (text), `kpi_1_label` (text)
- `kpi_2_valor` (text), `kpi_2_label` (text)
- `kpi_3_valor` (text), `kpi_3_label` (text)

**Páginas 4-7:** Estructura fija (mentores, audiencia, cierre). NO marcar como componentes — quedan iguales para todas las propuestas. El header/logo 30X y el footer no se tocan nunca.

### Importante:
- Los componentes son por elemento, no por slide. Una sola página puede tener múltiples componentes.
- El nombre del componente NO debe cambiar después de marcarlo, o se rompen las llamadas a la API.
- Si Canva te pide elegir entre "componente local" y "componente compartido", elige el que persista a nivel de brand template (es decir, que sí aparezca cuando otros editen el template).

---

## Workflow operativo (una vez marcados los componentes)

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
Recibido. Armando propuesta para [Cliente]. ~3 minutos.
Voy a clonar la plantilla DAHJeGfEHOk. Si querés algo diferente, frename.
```

### 3. Research del cliente

Necesario:
- Logo (vector preferido, transparente, ≥500px).
- Sector.
- Imagen de fondo representativa.

Fuentes en orden:
1. Sitio oficial: `/brand`, `/press`, `/media`.
2. Clearbit Logo API: `https://logo.clearbit.com/[dominio].com`.
3. Búsqueda directa con filtro de calidad.

Si nada da resultado limpio: escalo a JD pidiéndole los assets.

### 4. Operación Canva (Python)

```python
from agent import canva_client as canva

# 1. Subir assets del cliente (logo, fondo) a Canva
logo_asset = canva.upload_asset_from_url(logo_url, name=f"{cliente}-logo")
fondo_asset = canva.upload_asset_from_url(fondo_url, name=f"{cliente}-fondo")

# 2. Leer schema de la brand template (qué slots tiene)
schema = canva.get_brand_template_dataset(TEMPLATE_ID)
# slots típicos esperados: "logo_cliente", "fondo_cliente",
#                          "nombre_cliente", "sector_cliente"

# 3. Crear autofill con los datos
job = canva.create_autofill(TEMPLATE_ID, data={
    "logo_cliente": {"type": "image", "asset_id": logo_asset["asset"]["id"]},
    "fondo_cliente": {"type": "image", "asset_id": fondo_asset["asset"]["id"]},
    "nombre_cliente": {"type": "text", "text": cliente_nombre},
    "sector_cliente": {"type": "text", "text": cliente_sector},
})

# 4. Esperar a que termine el autofill
done = canva.poll_autofill(job["job"]["id"])
design_id = done["job"]["result"]["design"]["id"]
edit_url = done["job"]["result"]["design"]["url"]

# 5. Exportar a PDF
pdf_urls = canva.export_design_to_pdf_url(design_id)
```

### 5. Entrega

Mensaje en Slack con PDF adjunto (vía descarga + upload a Slack):
```
Listo, [Cliente].

Canva: [edit_url]
PDF: [adjunto]

Slots llenados: logo, fondo, nombre, sector.
Tiempo total: [X] segundos.
```

### 6. Iteración

Si JD pide cambios:
- "cambiá el fondo" → research nueva imagen, subir a Canva, re-autofill (genera nuevo design), re-exportar.
- "el sector está mal, es banca" → re-autofill con sector corregido.
- "no me gusta el ángulo" → escalo: "¿qué ángulo querés?".

Cada autofill crea un design nuevo. La plantilla maestra `DAHJeGfEHOk` nunca se modifica.

---

## Slots de reemplazo (auto-descubierto via API)

Una vez que `DAHJeGfEHOk` esté como brand template, el código corre:

```python
print(canva.get_brand_template_dataset("DAHJeGfEHOk"))
```

Y obtiene el schema real. Se documenta acá después de la primera ejecución.

Esquema esperado (a confirmar):

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
