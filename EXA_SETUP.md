# Exa Deep Research — Activation Guide

30x Design viene con **deep research vía Exa.ai** listo detrás de una env var. Cuando `EXA_API_KEY` está seteado, `/api/research` cambia automáticamente de "Claude web_search (5 snippets)" a "Exa (20+ páginas de texto completo + síntesis Claude Opus con voz 30x)".

## Qué cambia con Exa activo

| Dimensión | Claude web_search (default) | Exa deep research |
|---|---|---|
| Páginas consultadas | 5 snippets | 20+ páginas, texto completo |
| Fuentes típicas | Wikipedia + top 3 hits genéricos | Annual reports, earnings calls, entrevistas al CEO, press releases, LinkedIn públicos |
| Filtros | Ninguno | Categoría (news, financial report, company) + rango de fechas |
| Estructura | Un único LLM call | 6 queries paralelas → corpus agregado → síntesis Claude con voz 30x |
| Auditable | No (snippets invisibles) | Sí — lista de URLs consultadas se muestra en el review screen |
| Costo por research | ~$0.15 | ~$0.50 |
| Tiempo | ~45s | ~60-90s |

La UI muestra un badge en la pantalla de review:
- **"Deep research vía Exa · 18 fuentes"** (con checkmark) cuando corre Exa
- **"Web search baseline · activá EXA_API_KEY"** cuando corre el default

## Setup (5 minutos)

### 1. Crea cuenta en Exa

https://exa.ai/ → "Get API Key". Creditos de trial generosos (usualmente $10). Después del trial, pricing pay-as-you-go (~$0.005/search + $0.01/page text).

### 2. Copia la API key

Dashboard de Exa → API Keys → copiar. Empieza con `exa-`.

### 3. Configurala en Vercel

```bash
cd /path/to/30x-deck-engine
vercel env add EXA_API_KEY production
# paste la key cuando pregunte
vercel env add EXA_API_KEY preview
vercel env add EXA_API_KEY development
```

O en el dashboard de Vercel: **Settings → Environment Variables → Add New**.

### 4. Redeploy

```bash
vercel --prod
```

### 5. Verificar

1. Abre https://design.30x.com
2. Propuesta → empresa real (Aeroméxico, Bancolombia, Davivienda)
3. Después del spinner de research, el review screen debería mostrar **"Deep research vía Exa · N fuentes"** arriba y una lista "Fuentes consultadas" abajo.

## Cómo funciona por dentro

6 queries en paralelo cubren los ángulos clave de un briefing BD:

| Label | Query template | Category filter |
|---|---|---|
| `identity` | `{company} company overview strategy mission` | `company` |
| `financials` | `{company} annual report earnings revenue` | `financial report` |
| `leadership` | `{company} CEO executive leadership interview` | – |
| `recent_news` | `{company} news announcement 2026` (últimos 8 meses) | `news` |
| `pain_points` | `{company} challenges digital transformation AI` | – |
| `tech_posture` | `{company} AI artificial intelligence investment` | – |

Cada query trae 3-5 resultados con hasta 3000 chars de texto. Total corpus: ~30-60K chars (~15K tokens). Claude Opus sintetiza con el prompt de 30x research (positioning flattering, dolores reales verificables, liderazgo con cargos, "por qué ahora").

## Cuando Exa falla

Si Exa devuelve error (rate limit, timeout, 0 resultados), `/api/research` **cae automáticamente** al path de Claude web_search. El usuario no ve nada raro — sólo el badge cambia. Los logs del server muestran `[research] Exa deep research failed, falling back`.

## Cuándo NO usar Exa

- **Empresas muy pequeñas** (Exa requiere que haya contenido público que buscar — una startup sin prensa no se beneficia).
- **Research para decks internos** (speaker de Dylan, marca 30x, etc.) — ahí no hay cliente externo, el path de research ni se dispara.
- **Rate limit** del plan gratis de Exa (revisa dashboard — $10 de trial alcanza para ~20 researches).

## Costos estimados para 30x

70 vendedores × 2-3 propuestas/semana × ~$0.50/research = **~$70-105/mes** en Exa. Escala lineal con uso.

Si el costo arde, se puede:
- Bajar `numResults` en `src/lib/research/deep-research.ts` de 3-5 a 2-3
- Bajar `maxCharacters` del contents de 3000 a 1500
- Cachear research por empresa (hoy no se cachea — cada request paga)

## Referencias

- Archivos del módulo: `src/lib/research/exa.ts` + `src/lib/research/deep-research.ts`
- Endpoint wire-up: `src/app/api/research/route.ts`
- UI: `src/components/app/research-review.tsx` (badge + fuentes)
- Docs Exa: https://exa.ai/docs/reference/search
