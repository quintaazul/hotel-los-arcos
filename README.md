# Rediseño de las webs de Hotel Quinta Azul y Hotel Los Arcos Inn

Un solo proyecto (Astro, sitio estático) que produce los dos sitios, en García, Nuevo León.

**Esta es la rama `rediseno`.** Contiene el rediseño completo de los dos hoteles. **Los dos hoteles están publicados** con él desde el 19 de noviembre de 2026: www.hotelarcosinn.com y hotelquintaazul.com. El mismo contenido está en la rama `rediseno` de `quintaazul/hotel-quinta-azul` y de `quintaazul/hotel-los-arcos`. Subir cambios a GitHub no publica nada: se publica con `node scripts/publicar-produccion.mjs`.

Para verlo sin instalar nada: https://prueba-quinta-azul.bijuu-nexo.workers.dev y https://prueba-los-arcos.bijuu-nexo.workers.dev (copias de prueba, cerradas a buscadores).

## Arrancar

```
npm install
npm run dev:qa     Quinta Azul con recarga al guardar   http://127.0.0.1:4311
npm run dev:la     Los Arcos Inn                         http://127.0.0.1:4312
npm run build:qa   compila a dist-qa/   (build:la → dist-la/)
npm run ver:qa     sirve lo compilado   http://127.0.0.1:4321   (ver:la → 4322)
```

## Antes de cambiar algo

Lee [CLAUDE.md](CLAUDE.md): dice dónde está cada dato, cómo se hacen los cambios más comunes (un precio, un horario, una pregunta, un artículo), qué revisar antes de dar algo por terminado y qué decisiones de diseño no se reabren.

## Documentos

| Documento | Para qué |
|---|---|
| [CLAUDE.md](CLAUDE.md) | Cómo trabajar en el proyecto sin romper nada |
| [docs/ESTANDAR-QUINTA-AZUL.md](docs/ESTANDAR-QUINTA-AZUL.md) y [docs/ESTANDAR-LOS-ARCOS.md](docs/ESTANDAR-LOS-ARCOS.md) | El sistema de diseño de cada hotel y sus reglas |
| [docs/LISTA-DEL-BRIEF.md](docs/LISTA-DEL-BRIEF.md) | Todo lo hecho y lo pendiente |
| [docs/PREGUNTAS-Y-CONTENIDO-PENDIENTE.md](docs/PREGUNTAS-Y-CONTENIDO-PENDIENTE.md) | Preguntas para el hotel, fotos que faltan y textos por escribir |
| [docs/ANALISIS-DEL-BRIEF.md](docs/ANALISIS-DEL-BRIEF.md) | Lectura del documento de rediseño original |
| [docs/MATERIAL-AUDIOVISUAL.md](docs/MATERIAL-AUDIOVISUAL.md) | De dónde salen las fotos y los videos |
| [servicio/LEEME.md](servicio/LEEME.md) | El servicio del formulario y los pasos para pasar a producción |

El material original de fotos y video (unos 3 GB) no está en el repositorio; aquí van solo las fotos ya ajustadas que usa el sitio.
