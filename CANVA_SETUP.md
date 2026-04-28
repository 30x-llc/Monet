# Canva Integration — Activation Guide

El 30x Deck Engine ya tiene toda la infraestructura OAuth + import direct a Canva armada. Lo único que falta para activar el botón **"Abrir directamente en Canva"** es registrar una integración con Canva Partners y configurar 5 variables de entorno.

Mientras tanto, el botón **"Descargar PDF y arrastrar a Canva"** funciona para todo el equipo, sin dependencias.

---

## Qué pasa hoy (sin setup)

- El botón **"Abrir en Canva…"** aparece en el menú Exportar.
- Muestra un modal con una sola opción: **Descargar PDF + abrir Canva**.
- El vendedor descarga el PDF, una nueva pestaña abre Canva, arrastra el PDF → listo.

## Qué pasa después del setup

- El modal muestra **dos opciones**.
- La primera: **Abrir directamente en Canva**. El server genera el PDF, lo sube a Vercel Blob, llama a la Canva Import API, y abre el editor de Canva directamente en la cuenta del vendedor.
- Un click, cero drag-and-drop.

---

## Setup (paso a paso)

### 1. Registrar una integración en Canva Partners

1. Ve a https://www.canva.com/developers/ y crea una cuenta de developer.
2. Crea una **Integration** → tipo **Connect API**.
3. Pide los siguientes **scopes**: `design:meta:read`, `design:content:write`, `design:content:read`, `asset:write`.
4. Agrega como **Redirect URL**:
   - Producción: `https://design.30x.com/api/canva/callback`
   - Dev local: `http://127.0.0.1:3000/api/canva/callback` (Canva es estricto con `127.0.0.1` vs `localhost` — usa `127.0.0.1`).
5. Anota el **Client ID** y **Client Secret**.
6. Envía la integración a review. Aprobación toma entre 3 y 10 días hábiles. Mientras tanto, funciona sólo para la cuenta del dueño del app.

### 2. Generar `SESSION_SECRET`

Una clave aleatoria de 32+ bytes para firmar las cookies de sesión:

```bash
openssl rand -base64 32
```

### 3. Configurar variables en Vercel

```bash
vercel env add CANVA_CLIENT_ID production
vercel env add CANVA_CLIENT_SECRET production
vercel env add CANVA_REDIRECT_URI production   # → https://design.30x.com/api/canva/callback
vercel env add SESSION_SECRET production
vercel env add CANVA_OAUTH_ENABLED production  # → true
```

Repite para `preview` y `development` si quieres probar en esos entornos.

### 4. (Opcional pero recomendado) Instalar Vercel KV

La v1 de este módulo usa un `Map` en memoria para los tokens. Funciona, pero se pierden en cold starts — cada cold start fuerza a los usuarios a reconectar.

Para persistencia real:

1. En el dashboard de Vercel → **Storage** → **Browse Marketplace** → **KV**.
2. Instala la integración. Auto-provisioniona `KV_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`.
3. Swap del archivo `src/lib/canva/token-store.ts`: reemplaza las llamadas al `Map` por `kv.get()` / `kv.set()` con TTL de 90 días. La API pública del módulo (`getFreshAccessToken`, `putTokenRecord`) queda igual.
4. Redeploy.

### 5. Verificar en producción

1. `vercel --prod`
2. Abre https://design.30x.com, crea un deck, click **Exportar → Abrir en Canva…**.
3. Deberías ver las dos opciones. Click la primera.
4. Popup de autorización de Canva → aprueba.
5. La pestaña devuelve a `design.30x.com/?canva=connected`.
6. Reintenta el export → el deck aparece en tu Canva.

---

## Troubleshooting

**"Canva OAuth no habilitado"** — verifica que las 5 env vars estén en el environment correcto (`vercel env ls`) y redeploy.

**"state no coincide — posible CSRF"** — la cookie de sesión se perdió entre `/connect` y `/callback`. Pasa si abres Canva en un browser distinto. Cierra todas las ventanas y reintenta.

**"Canva import demoró más de 120s"** — Canva está lento. El job sigue procesándose de su lado; el diseño aparecerá en tu Canva dashboard en unos minutos. En el deck engine, reintenta.

**"El deck genera un PDF > 25MB"** — pasa con decks de 15+ slides con muchas fotos. Reduce slides o usa la opción manual (Canva permite arrastrar archivos más grandes desde el cliente).

**Tokens perdidos tras deploy** — esperado mientras se use el store en memoria (step 4 no completado). Es el mismo session cookie, pero el `Map` se vacía. Reconecta una vez.

---

## Roadmap

- **v1 (ya)**: OAuth + PDF import. Este setup.
- **v2**: Autofill API. El diseñador de 30x arma 6 templates en Canva (corporate-cover, intro-mentors, curriculum-grid, mentor-grid, impact, pricing-cta) con campos dinámicos. El export manda el JSON de los campos directo al template → máxima fidelidad.
- **v3**: Two-way sync. "Traer copy actualizado desde Canva al deck" y "carpeta por cliente en Canva".

Cualquier cosa, ping a Juan Diego.
