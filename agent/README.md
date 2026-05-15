# agent/ — Monet runtime (Python)

Cliente directo a Canva Connect API y Figma REST API, sin MCP. Diseñado para
correr headless en Hermes / Hostinger sin browser, sin OAuth interactivo, sin
túneles SSH.

Esto es lo que ejecuta Monet detrás de cada pedido en Slack tipo "propuesta
para Mastercard".

---

## Por qué no MCP

MCP de Canva requiere OAuth con redirect a localhost. Hermes corre en un server
headless en Hostinger, sin browser y sin acceso al `127.0.0.1` desde tu Mac.

Solución: usar Canva Connect API directamente con un service-account refresh
token. Mismo patrón que ya usaba `legacy/monet-app/src/lib/canva/service-token.ts`.
Sin browser, sin túneles, funciona 24/7 desde el server.

---

## Setup (5 minutos, una sola vez)

### Pre-requisitos

Vos ya tenés:

1. Una Canva Integration en https://www.canva.com/developers/ (creada para el
   legacy app, status "approved" o al menos "owner-only" sirve).
2. Las env vars en Vercel del deploy de `monet.30x.com`:
   - `CANVA_CLIENT_ID`
   - `CANVA_CLIENT_SECRET`
   - `CANVA_REFRESH_TOKEN` (si no, instrucciones abajo).

### Paso 1: extraer credenciales de Vercel

Desde tu Mac, en la carpeta del legacy app (`legacy/monet-app/` o tu copia
local):

```bash
vercel env pull .env.canva.local
# o desde el dashboard de Vercel → Settings → Environment Variables → reveal
```

Esto te genera un archivo con todas las env vars de producción.

Si **no** existe `CANVA_REFRESH_TOKEN` en Vercel:

1. Asegurate que `CANVA_OAUTH_ENABLED=true` está en el env.
2. Conectate una vez a Canva via el legacy app: `https://monet.30x.com/api/canva/connect`.
3. Visitá `https://monet.30x.com/api/canva/bootstrap-bot` (admin only). Esto
   imprime el refresh token. Copialo.
4. Setealo en Vercel como `CANVA_REFRESH_TOKEN` y como variable local.

### Paso 2: pasarme las credenciales por SSH

Desde tu Mac (no por chat), corré este comando reemplazando los valores reales:

```bash
ssh hermes@TU_HOSTINGER_HOST << 'EOF'
mkdir -p /opt/data/.hermes/secrets
chmod 700 /opt/data/.hermes/secrets
cat > /opt/data/.hermes/secrets/canva.env <<'INNER'
CANVA_CLIENT_ID=PEGA_CLIENT_ID_ACA
CANVA_CLIENT_SECRET=PEGA_CLIENT_SECRET_ACA
CANVA_REFRESH_TOKEN=PEGA_REFRESH_TOKEN_ACA
INNER
chmod 600 /opt/data/.hermes/secrets/canva.env
echo "✓ Canva creds guardados"
ls -la /opt/data/.hermes/secrets/canva.env
EOF
```

Después de esto, yo (Monet) puedo operar Canva 24/7 sin más intervención tuya.

### Paso 3: Figma token

Generalo en https://www.figma.com/settings → "Personal access tokens" →
"Generate new token" → nombre "Hermes Monet Agent" → copiá el `fpat_...`.

Mismo patrón para guardarlo:

```bash
ssh hermes@TU_HOSTINGER_HOST << 'EOF'
cat > /opt/data/.hermes/secrets/figma.env <<'INNER'
FIGMA_TOKEN=fpat_PEGA_AQUI
INNER
chmod 600 /opt/data/.hermes/secrets/figma.env
echo "✓ Figma token guardado"
EOF
```

### Paso 4: smoke test

Ya en mi terreno. Cuando termines los pasos 2 y 3, decime "listo" y yo corro:

```bash
python3 /opt/data/workspace/Monet/agent/canva_client.py
python3 /opt/data/workspace/Monet/agent/figma_client.py
```

Si imprimen "✓ ... auth OK" estamos.

---

## Qué hace cada archivo

| File | Qué es |
|---|---|
| `canva_client.py` | Cliente Python a Canva Connect API. Refresh token → access token automático. Operaciones: brand templates list, autofill, export PDF, upload assets. |
| `figma_client.py` | Cliente Python a Figma REST API. Operaciones: get file, get nodes, export images. |
| `canva.env.example` | Plantilla de credenciales Canva. |
| `figma.env.example` | Plantilla de credenciales Figma. |

---

## Operaciones que Canva Connect soporta (relevantes para nosotros)

- **Brand Templates**: listar y leer el schema de campos editables. Es la base
  de la skill `propuesta-comercial`: la plantilla maestra debe estar marcada
  como brand template en Canva.
- **Autofill**: clonar un brand template y llenar sus campos (texto, imagen)
  con datos del cliente. Esto crea un design nuevo, automáticamente.
- **Asset upload**: subir un logo o foto al workspace de Canva. Devuelve un
  `asset_id` que después se referencia en autofill.
- **Export**: pedir PDF (o PNG/JPG) de un design ya creado. Devuelve URL del PDF.

Lo que NO soporta Canva Connect (limitaciones conocidas):

- Editar un design existente arbitrario (sólo brand templates con campos
  marcados como editables).
- Reemplazar elementos de un design "regular" que no fue marcado como
  brand template.

Implicación operativa: la plantilla `DAHJeGfEHOk` (propuesta comercial) tiene
que estar configurada como **brand template** con sus slots marcados (logo,
fondo, nombre, sector). Si no lo está, hay que hacerlo una vez en Canva web.
Más detalle en `skills/operativas/propuesta-comercial/SKILL.md`.

---

## Roadmap del módulo

- [x] Service-account token resolver con refresh automático.
- [x] CRUD básico de designs.
- [x] Autofill flow + polling.
- [x] Export PDF + polling.
- [x] Figma read-only client.
- [ ] Pruebas end-to-end con plantilla real (post-credenciales).
- [ ] Helper `propuesta_para_cliente(nombre, sector, ...)` que orquesta todo.
- [ ] Webhook receiver para Slack files (cuando el cliente nos manda el logo
      por DM, lo descargamos y lo subimos a Canva como asset).
