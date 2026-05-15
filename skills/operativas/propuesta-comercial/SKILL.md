---
name: propuesta-comercial
description: Compongo una propuesta comercial de 30X para un cliente específico, usando Canva Connect API directa para clonar la plantilla brand template, autofill los slots (logo, fondo, nombre, sector), y exportar PDF.
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
  - Si la plantilla maestra (Design ID DAHJeGfEHOk) no está marcada como brand template en Canva.
  - Si no encuentro logo del cliente con calidad suficiente (resolución < 500px o fondo no transparente).
  - Si el cliente requiere ángulo nuevo no documentado.
  - Si confianza < 8/10 en el output.
version: 0.2.0
status: draft — pendiente Juan Diego pegue credenciales Canva y marque la plantilla como brand template
---

# Propuesta comercial

Skill operativa central. Esta es la primera. Si esta funciona, el patrón se replica para deck-comercial, carrusel-30x, landing-30x, etc.

---

## Filosofía

Composición sobre generación. No diseño la propuesta. Uso Canva Connect API para clonar la plantilla maestra que JD ya diseñó (configurada como brand template), autofill los slots con datos del cliente, exporto PDF, devuelvo.

Si lo que me piden requiere salir de la plantilla (ángulo nuevo, formato no estándar, contenido que no encaja en los slots), escalo a JD antes de improvisar.

---

## Arquitectura técnica

- **No usamos MCP.** El MCP de Canva requiere OAuth con browser callback a localhost. Hermes corre headless en Hostinger sin browser. Inviable.
- **Usamos Canva Connect API directa.** Cliente Python en `agent/canva_client.py` con service-account refresh token. Sin browser, sin túneles, funciona desde el server.
- **Auth: long-lived refresh token + access tokens de 4h auto-refrescados.**
- **Capacidad clave: Brand Template Autofill.** La plantilla maestra debe estar configurada como brand template en Canva con sus slots editables (logo, fondo, nombre, sector). Una vez configurada, podemos clonarla y autofill por API.

---

## Pre-requisitos (estado al crear v0.2.0)

- [x] Plantilla maestra catalogada: Canva `DAHJeGfEHOk` (`stack/canva.md`).
- [x] Reglas de marca cargadas: `brand/30x-rules.md` y `soul/SOUL.md`.
- [x] Cliente Python Canva listo en `agent/canva_client.py`.
- [x] Cliente Python Figma listo en `agent/figma_client.py`.
- [ ] Credenciales Canva en `/opt/data/.hermes/secrets/canva.env`. **Pendiente JD via SSH.** Setup: `agent/README.md`.
- [ ] Plantilla `DAHJeGfEHOk` configurada como **Brand Template** en Canva, con slots marcados. **Pendiente JD en Canva web.**
- [ ] Inventario de slots de la plantilla. Se llena automáticamente vía `canva_client.get_brand_template_dataset(template_id)` una vez que la plantilla esté como brand template.

---

## Workflow (versión 0.2 — sobre API directa)

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
