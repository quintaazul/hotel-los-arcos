# Hotel Los Arcos Inn · sitio anterior (rama main)

Contexto para quien llegue a este repositorio, sea una persona o un asistente. Actualizado el 19 de noviembre de 2026.

## Qué hay en cada rama

- **`rediseno`: el sitio que está publicado hoy** en https://www.hotelarcosinn.com, desde el 19 de noviembre de 2026. Es el rediseño completo: un solo código que produce los dos hoteles (Quinta Azul y Los Arcos Inn). El mismo contenido está en la rama `rediseno` de `quintaazul/hotel-quinta-azul`, y las dos se mantienen idénticas.
- **`main` (esta rama): el sitio anterior**, la migración de Webflow a Astro. Se conserva para consultarlo o para volver atrás, pero **ya no se publica desde aquí**: si alguien corre `npx wrangler deploy` desde esta rama, reemplaza el sitio nuevo por el viejo.

## Reglas

- **Para cambiar algo del sitio**: `git switch rediseno` y leer el `CLAUDE.md` de esa rama. Dice dónde está cada dato, cómo se hacen los cambios comunes, qué revisar antes de terminar y cómo se publica (`node scripts/publicar-produccion.mjs la`).
- **Subir cambios a GitHub no publica nada.** No hay publicación automática: el sitio solo cambia cuando alguien publica a mano.
- **`main` y `rediseno` no se mezclan.** No comparten historial: nada de merge ni rebase entre ellas.
- **Volver al sitio anterior** en segundos, si hiciera falta: `npx --yes wrangler@4 rollback --name hotel-los-arcos 9e7875ff-e770-41ab-8cd7-bb8defbc8391` (es la última versión publicada desde esta rama).
- El repositorio es público: nunca lleva datos personales de huéspedes ni claves.
