# Portafolio

Hola, mucho gusto. Este es mi portafolio profesional de una sola página
construido con Next.js App Router, que tiene el contenido de mi CV y mis
proyectos de GitHub 

## Stack

- [Next.js 16](https://nextjs.org) (App Router) + React 19 + TypeScript
- Tailwind CSS v4 (tokens `@theme` CSS-first, sin `tailwind.config.ts`)
- Vitest, Testing Library y vitest-axe para testing
- [Vercel Analytics](https://vercel.com/docs/analytics) y [Speed Insights](https://vercel.com/docs/speed-insights) para métricas de visitas y rendimiento

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` / `npm run build` / `npm run start` | Servidor de desarrollo, build de producción y servidor de producción |
| `npm test` / `npm run test:watch` | Suite de tests (una corrida / modo watch) |
| `npm run lint` | ESLint |
| `npm run fetch:github` | Actualiza el snapshot `data/github-repos.json` desde la API de GitHub |
| `npm run lint:content` | Revisa huecos de contenido con `scripts/check-content.ts` |
| `npm run build:search-index` | Regenera el índice de búsqueda del chat (ver más abajo) |

## Datos del proyecto

Tres capas tipadas y versionadas se combinan por nombre de repositorio en tiempo
de build — no se hacen llamadas en vivo a GitHub durante `next build`:

1. `data/content.ts` — contenido estático del CV (nav, hero, about, experience, credentials, contact)
2. `data/projects.ts` — lista de curaduría; gana ante cualquier conflicto con el snapshot
3. `data/github-repos.json` — snapshot versionado de la API de GitHub, actualizado manualmente con `npm run fetch:github`

## Comportamiento de la interfaz

- **Texto justificado:** los párrafos (`<p>`) se justifican con `text-align: justify`
  y guionado automático (`hyphens: auto`, apoyado en `<html lang="es">`). La regla
  vive en la capa `base` de `app/globals.css`, así que utilidades explícitas como
  `text-center` (por ejemplo en el Footer) siguen teniendo prioridad.
- **Tarjetas de credenciales:** toda la tarjeta es un link a la URL de la
  credencial (se abre en una pestaña nueva). Al pasar el cursor, o al enfocarla con
  el teclado, el título y el borde cambian a color de acento. Una credencial sin
  `url` no es clicable.
- **Tarjetas de proyectos:** toda la tarjeta lleva a la demo (`demoUrl`) y, si el
  proyecto no tiene demo, a su repositorio de GitHub. Los botones de iconos (GitHub
  y demo) siguen funcionando por separado, y al pasar el cursor por la tarjeta se
  resalta el botón al que llevaría el click.

Ambos casos usan el patrón de *stretched link*: el link del título cubre toda la
tarjeta con un `::after` absoluto, así no hay elementos interactivos anidados y
lectores de pantalla leen solo el título como nombre del link.

## Analítica y métricas

`app/layout.tsx` monta `<Analytics />` (`@vercel/analytics`) y `<SpeedInsights />`
(`@vercel/speed-insights`). No requieren variables de entorno: solo registran datos
en un despliegue de Vercel que tenga Web Analytics y Speed Insights activados en el
proyecto. En desarrollo (`npm run dev`) los paquetes cargan la versión `debug` del
script de Vercel en lugar de la de producción.

## Chat con IA (opcional)

El sitio incluye un asistente de chat con RAG (retrieval-augmented generation)
que responde preguntas sobre mi experiencia, proyectos y stack usando Claude
de Anthropic. Es completamente opcional: si las variables de entorno no están
configuradas, el widget simplemente no se monta y el sitio queda 100% estático
(nada se rompe en `next build` ni en producción).

La retrieval usa un índice de búsqueda pregenerado (`data/search-index.json`,
committeado al repo) en vez de embeddings en vivo, así que no hace falta
ningún modelo pesado corriendo en producción. Para regenerar ese índice
después de tocar `data/content.ts` o `data/projects.ts`:

```bash
npm run build:search-index
```

Este script es un wrapper: la primera vez que corre, instala y compila el
sub-paquete aislado en `tools/search-index-builder/` (tiene su propio
`package.json`/lockfile, separado de la raíz, porque su dependencia de
embeddings locales es pesada y no hace falta en el deploy). Después de eso,
sobrescribe `data/search-index.json` con el índice actualizado.

Para habilitar el chat en un entorno propio, copiá `.env.example` a
`.env.local` y completá:

| Variable | Para qué sirve |
|---|---|
| `ANTHROPIC_API_KEY` | Habilita el chat. Si falta, el widget no se monta (chequeado server-side en `app/page.tsx`, nunca expuesto al cliente). |
| `ANTHROPIC_MODEL` | Modelo de Claude a usar. Si no se define, usa un default razonable (ver `lib/chat/`). |