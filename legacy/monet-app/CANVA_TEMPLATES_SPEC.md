# Canva Templates Spec — 30x Design Autofill

Cómo armar los 6 templates en Canva para que 30x Design los rellene automáticamente vía la **Autofill API**.

## Por qué este approach

Templates React tienen techo. Lo que vos diseñás a mano en Canva (la portada de Aeroméxico de Andrés es el ejemplo) NO es generable con templates de código. Tenés que hacer los templates UNA VEZ con tu calidad, y después la app rellena copias infinitas con el contenido de cada cliente. Cada deck queda EXACTAMENTE con tu mano.

## Cómo funciona Autofill API

1. Vos diseñás un template en Canva con **Brand Templates**
2. Cada text frame y image placeholder lo nombrás con un `data field name` (ej: `headline`, `partner_logo`, `body_paragraph_1`)
3. 30x Design genera el deck JSON con esos field names mapeados
4. Llamamos `POST /v1/autofills` con `template_id` + un objeto `{ field_name: value }`
5. Canva devuelve un design ID + edit URL → el vendedor abre y manda

Docs: https://www.canva.com/developers/docs/connect-api/api-reference/autofills/

---

## Los 6 templates a diseñar

### 1. `recognition-cover` — La portada Andrés Bilbao

Esta es THE portada. Clona el patrón exacto de Aeroméxico × 30X que mostraste:

**Layout objetivo:**
- Foto cinematográfica full-bleed con overlay oscuro
- Logo del partner GIGANTE arriba a la izquierda (blanco, ~50px alto)
- Logo 30X arriba a la derecha (lima/blanco, ~40px alto)
- Headline center-left (~64px, blanco) con UNA frase final en lima
- 1-2 párrafos de body abajo del headline (~20px, blanco 78% opacity)

**Data fields a marcar para autofill:**

| Field name | Tipo | Cómo lo llena 30x Design |
|---|---|---|
| `partner_logo` | image | Logo del cliente (deep research o picker) |
| `hero_background` | image | Foto del mundo del cliente (avión, banco, gym) |
| `headline_main` | text | "30X reconoce a [X] como [POSITIONING] y quiere" |
| `headline_accent` | text | "construir una relación de largo plazo." (parte en lima) |
| `body_paragraph_1` | text | Párrafo "alianza estratégica de largo aliento..." |
| `body_paragraph_2` | text | Párrafo "arrancar con proyectos pequeños..." |

### 2. `intro-mentors` — Quién enseña

**Layout:** texto izquierda con angles + 3-4 mentor cards a la derecha

| Field name | Tipo |
|---|---|
| `partner_logo` | image (esquina, todas las slides la llevan) |
| `section_title` | text |
| `section_description` | text |
| `angle_1_title` | text |
| `angle_1_desc` | text |
| `angle_2_title` | text |
| `angle_2_desc` | text |
| `angle_3_title` | text |
| `angle_3_desc` | text |
| `mentor_1_photo` | image |
| `mentor_1_name` | text |
| `mentor_1_role` | text |
| `mentor_2_photo`, `mentor_2_name`, `mentor_2_role` | (igual) |
| `mentor_3_photo`, `mentor_3_name`, `mentor_3_role` | (igual) |

### 3. `curriculum-grid` — Currículum del programa

**Layout:** headline + grid 2x4 de módulos numerados

| Field name | Tipo |
|---|---|
| `partner_logo` | image |
| `headline` | text |
| `subtitle` | text |
| `module_1_number`, `module_1_name`, `module_1_desc` | text × 3 |
| `module_2_*` ... `module_8_*` | (mismo patrón × 8) |

### 4. `mentor-grid` — Mentores destacados

**Layout:** headline centrado + grid 2x3 o 3x2 de retratos grandes

| Field name | Tipo |
|---|---|
| `partner_logo` | image |
| `headline` | text |
| `subtitle` | text |
| `mentor_1_photo`, `mentor_1_name`, `mentor_1_role`, `mentor_1_company` | × 4 |
| (mismo patrón hasta `mentor_6_*`) | |

### 5. `impact` — Métricas / impacto

**Layout:** headline + UN número gigante + 3 stats abajo (la variante hero-number que ya armamos)

| Field name | Tipo |
|---|---|
| `partner_logo` | image |
| `headline` | text |
| `eyebrow` | text |
| `hero_value` | text (ej: "3,100+") |
| `hero_label` | text (ej: "ejecutivos alumni") |
| `hero_context` | text |
| `stat_1_value`, `stat_1_label` | text × 2 |
| `stat_2_value`, `stat_2_label` | text × 2 |
| `stat_3_value`, `stat_3_label` | text × 2 |

### 6. `pricing-cta` — Inversión + siguiente paso

**Layout:** dos paquetes side-by-side O un layout split (vos elegís según diseño)

| Field name | Tipo |
|---|---|
| `partner_logo` | image |
| `headline` | text |
| `package_1_name`, `package_1_tagline`, `package_1_price`, `package_1_price_note` | text × 4 |
| `package_1_feature_1` ... `package_1_feature_5` | text × 5 |
| `package_2_*` (igual estructura) | |
| `contact_name`, `contact_role`, `contact_details` | text × 3 |

---

## Specs de diseño (las reglas de 30x)

**Tipografía:** Inter Display (o lo que vos pongas en el Brand Kit de Canva — Autofill respeta el font del template).

**Colores:**
- Lima accent: `#E9FF7B` (para frases destacadas, dots, badges)
- Texto sobre dark: `#FFFFFF` (cuerpo) / `rgba(255,255,255,0.78)` (secundario)
- Texto sobre light: `#0A0A0A` (cuerpo) / `rgba(10,10,10,0.55)` (secundario)
- Cards: borde 1px en `rgba(0,0,0,0.08)` light o `#222` dark, radius 8-12px

**Imágenes:**
- Mentor portraits: aspect 4:5, crop centrado en cara, top-aligned
- Hero images: aspect 16:9, sin crop, dark overlay top-to-bottom para contraste
- Logos partner: white via Canva color override (Canva permite invertir colores en templates)

**Variantes light vs dark:**
- Empezá haciendo TODOS los templates en LIGHT (es el default de 30x Design ahora)
- Después clonás cada uno y haces la versión DARK (para clientes que pidan estilo cinematográfico)
- Naming: `recognition-cover-light`, `recognition-cover-dark`

---

## Setup en Canva

**Paso 1.** En Canva → **Brand Hub** → **Brand Templates** → crea un nuevo template
**Paso 2.** Diseñá el slide. Cada elemento de texto/imagen que quieras hacer fillable:
- Click el elemento → **More** → **Add data field**
- Pone el `field name` exactamente como aparece en la tabla de arriba (case-sensitive, snake_case)
**Paso 3.** Una vez hecho, el template aparece en la lista de Brand Templates con un ID
**Paso 4.** Pasame los IDs de los 6 templates y yo los registro en el código

---

## Workflow final (cuando esté todo armado)

```
Vendedor abre 30x Design
  → llena form (cliente + briefing)
  → Exa hace deep research (60s)
  → Review screen con clientLanguage + logo + hero (todo de Exa)
  → Click "Generar" 
  → Claude Opus produce JSON con cada field mapeado a tus templates
  → POST /v1/autofills con template_id + data fields
  → Canva devuelve design URL para cada slide
  → Vendedor abre el deck en Canva (ya armado, con tu diseño exacto)
  → Edita lo que quiera y manda al cliente
```

Visualmente cada deck va a verse como las propuestas que vos hacés a mano hoy. Sin diferencia.

---

## Env vars — cómo se conectan los template IDs al código

Cada template tiene su propio env var. Cuando termines uno, agregalo y la app lo usa automáticamente:

| Slide type 30x | Env var | Cómo lo seteás |
|---|---|---|
| corporate-cover | `CANVA_TPL_RECOGNITION_COVER` | `printf "DAFXXXX" \| vercel env add CANVA_TPL_RECOGNITION_COVER production "" --yes` |
| intro-mentors | `CANVA_TPL_INTRO_MENTORS` | igual |
| curriculum-grid | `CANVA_TPL_CURRICULUM_GRID` | igual |
| mentor-grid + mentor-duo | `CANVA_TPL_MENTOR_GRID` | igual |
| impact | `CANVA_TPL_IMPACT` | igual |
| pricing-cta | `CANVA_TPL_PRICING_CTA` | igual |

Después de cada nuevo env var: `vercel --prod`. La app detecta cuáles tiene y muestra "Generar con tus templates" en el modal de Canva sólo cuando hay al menos 1.

## Próximos pasos concretos

1. **Vos** — abrí tu master de 70 slides en Canva, agarrá el mejor `recognition-cover` (el que más se parezca a Aeroméxico). "Make a copy" → renombrá "30x Recognition Cover" → marcá los 6 data fields del spec.
2. **Vos** — pasame el `template_id` (URL: `canva.com/design/DAFXXXXX/edit` → `DAFXXXXX`).
3. **Yo** — seteo `CANVA_TPL_RECOGNITION_COVER` en Vercel + redeploy. La opción "Generar con tus templates" se prende sola en el modal Canva.
4. **Probamos** — generás un deck Aeroméxico real, click "Generar en Canva", el slide 1 sale con tu template exacto. Si funciona → vas por los otros 5 con tranquilidad.
5. **Paralelo** — yo aplico a Canva Partners para producción.

## Cómo verificar qué tenés configurado

```bash
curl -sS https://design.30x.com/api/export/canva-autofill | python3 -m json.tool
```

Te devuelve:
```json
{
  "configured": 1,
  "oauthEnabled": true,
  "templates": [
    { "key": "recognition-cover", "displayName": "Portada de Reconocimiento (estilo Andrés Bilbao)", ... }
  ]
}
```

`configured: 0` = ningún template setteado todavía. `configured: 6` = todos listos, ya sos 10/10.
