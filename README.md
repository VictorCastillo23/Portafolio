# Portafolio

Hola, mucho gusto. Este es mi portafolio profesional de una sola página
construido con Next.js App Router, que tiene el contenido de mi CV y mis
proyectos de GitHub 

## Stack

- [Next.js 16](https://nextjs.org) (App Router) + React 19 + TypeScript
- Tailwind CSS v4 (tokens `@theme` CSS-first, sin `tailwind.config.ts`)
- Vitest, Testing Library y vitest-axe para testing

## Datos del proyecto

Tres capas tipadas y versionadas se combinan por nombre de repositorio en tiempo
de build — no se hacen llamadas en vivo a GitHub durante `next build`:

1. `data/content.ts` — contenido estático del CV (nav, hero, about, experience, credentials, contact)
2. `data/projects.ts` — lista de curaduría; gana ante cualquier conflicto con el snapshot
3. `data/github-repos.json` — snapshot versionado de la API de GitHub, actualizado manualmente

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

El límite de mensajes ya no lo maneja la app: se controla directamente desde
la consola de Anthropic (a nivel de cuenta/API key), así que no hay ninguna
variable de entorno adicional para configurar eso acá.

### Checklist de pruebas manuales

La suite automatizada cubre lógica y contratos, pero antes de un deploy con
el chat habilitado conviene probar esto a mano:

- [ ] Hacer una pregunta en español (ej: "¿en qué trabajaste en Juventudes?")
      y confirmar que responde en español, citando la sección de la que sacó
      la info.
- [ ] Hacer la misma pregunta en inglés y confirmar que responde en inglés
      (el contexto interno sigue en español, pero la respuesta debe reflejar
      el idioma de la pregunta).
- [ ] Preguntar por pretensión salarial, disponibilidad actual, o pedir
      opinión sobre un empleador anterior (Juventudes, Emerald Digital,
      Corvuz) y confirmar que el asistente lo rechaza de forma breve y no
      defensiva, sin inventar una respuesta.
- [ ] Preguntar específicamente sobre "Juventudes" y confirmar que la
      respuesta trae experiencia relevante de ese puesto (spot-check de
      retrieval).
- [ ] Encadenar una segunda pregunta de seguimiento en el mismo hilo y
      confirmar que el asistente mantiene el contexto de la conversación.
- [ ] Confirmar que un error real del lado de Claude durante el streaming
      (por ejemplo, cortando la conexión) se muestra como un mensaje de
      error genérico en el widget, no como un estado especial.
- [ ] Con las variables de entorno del chat SIN configurar, correr
      `npm run build` y confirmar que: (a) el build termina sin errores,
      (b) `/` sigue siendo completamente estático, y (c) el HTML generado
      para `/` no incluye el botón/widget del chat.
