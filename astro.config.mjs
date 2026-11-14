import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { fileURLToPath } from 'node:url';
import { statSync, readFileSync, readdirSync, existsSync } from 'node:fs';

// Un solo código para los dos hoteles. HOTEL=qa | la (lo ponen scripts/dev.mjs y scripts/build.mjs).
const hotel = process.env.HOTEL === 'la' ? 'la' : 'qa';
const sitios = { qa: 'https://hotelquintaazul.com', la: 'https://www.hotelarcosinn.com' };

// Navegadores para los que se prepara el código: todo lo publicado desde 2021 (Chrome, Edge, Firefox, Safari de
// iPhone y Mac, Samsung, Opera). El compilador baja la sintaxis nueva y agrega los prefijos que estos necesiten.
// Lo que un navegador no tenga (animaciones atadas al scroll, cambio de página animado) simplemente no se usa ahí.
const NAVEGADORES = ['chrome90', 'edge90', 'firefox90', 'safari14'];

// Las medidas de alto «svh / dvh / lvh» (el alto real de la pantalla del celular, con o sin barras) solo existen desde
// 2022. Para los navegadores anteriores cada regla que las usa queda primero con «vh» y, envuelta en una consulta,
// la versión exacta para los que sí las entienden.
function alturasConRespaldo() {
  const hay = /(\d)[sdl]vh\b/;
  return {
    postcssPlugin: 'alturas-con-respaldo',
    Once(css, { AtRule }) {
      css.walkRules((regla) => {
        const padre = regla.parent;
        if (padre && padre.type === 'atrule' && (/keyframes$/i.test(padre.name) || (padre.name === 'supports' && padre.params === '(height:1svh)'))) return;
        const con = regla.nodes.filter((d) => d.type === 'decl' && hay.test(d.value));
        if (!con.length) return;
        const exacta = regla.clone({ nodes: [] });
        con.forEach((d) => { exacta.append(d.clone()); d.value = d.value.replace(/(\d)[sdl]vh\b/g, '$1vh'); });
        const consulta = new AtRule({ name: 'supports', params: '(height:1svh)' });
        consulta.append(exacta);
        regla.after(consulta);
      });
    },
  };
}
alturasConRespaldo.postcss = true;

const aqui = (r) => fileURLToPath(new URL(r, import.meta.url));
const cambio = (...rutas) => new Date(Math.max(...rutas.map((r) => { try { return statSync(aqui(r)).mtimeMs; } catch { return 0; } })));
const articulos = existsSync(aqui('./src/content/blog/' + hotel)) ? readdirSync(aqui('./src/content/blog/' + hotel)).filter((f) => f.endsWith('.md')).map((f) => {
  const t = readFileSync(aqui('./src/content/blog/' + hotel + '/' + f), 'utf8'), d = (k) => (t.match(new RegExp('^' + k + ':\\s*"?([^"\\n]+)"?', 'm')) || [])[1];
  return { slug: d('slug'), tema: d('tema'), fecha: new Date(d('actualizado')) };
}) : [];
const ultimo = (lista) => new Date(Math.max(...lista.map((a) => +a.fecha), 0));
// Un tema del blog con menos de tres artículos no entra al mapa del sitio (va con noindex: src/data/blog.ts, TEMA_MINIMO)
const temaDelgado = (pagina) => { const m = new URL(pagina).pathname.match(/^\/blog\/tema\/([^/]+)\/?$/); return !!m && articulos.filter((a) => a.tema === m[1]).length < 3; };
function fechaDePagina(item) {
  const ruta = new URL(item.url).pathname.replace(/\/$/, '') || '/';
  const datos = ['./src/data/hoteles.ts', './src/data/textos.ts'];
  let fecha;
  if (ruta.startsWith('/blog/tema/')) fecha = ultimo(articulos.filter((a) => a.tema === ruta.split('/').pop()));
  else if (ruta === '/blog' || ruta.startsWith('/blog/pagina/')) fecha = ultimo(articulos);
  else if (ruta.startsWith('/blog/')) fecha = (articulos.find((a) => a.slug === ruta.split('/').pop()) || {}).fecha;
  else if (ruta === '/') fecha = cambio('./src/pages/index.astro', ...datos);
  else if (['/hospedaje', '/habitaciones'].includes(ruta)) fecha = cambio('./src/pages/[habs].astro', ...datos);
  else if (['/departamentos', '/empresas'].includes(ruta)) fecha = cambio('./src/pages/[solo].astro', ...datos);
  else if (['/aviso-de-privacidad', '/politicas', '/terminos'].includes(ruta)) fecha = cambio('./src/pages' + ruta + '.astro');
  else fecha = cambio('./src/pages' + ruta + '.astro', ...datos);
  if (fecha && +fecha > 0) item.lastmod = fecha.toISOString();
  return item;
}

export default defineConfig({
  site: sitios[hotel],
  trailingSlash: 'never',
  // El CSS va dentro del HTML: la página pinta sin esperar otro archivo.
  build: { format: 'file', inlineStylesheets: 'always' },
  // Al pasar el ratón por un enlace interno, la página siguiente se descarga antes del clic (en todos los navegadores).
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  integrations: [sitemap({ filter: (pagina) => !/\/(estandar|404)\/?$/.test(pagina) && !temaDelgado(pagina), serialize: fechaDePagina })],
  devToolbar: { enabled: false },
  vite: {
    define: { __HOTEL__: JSON.stringify(hotel) },
    // Cada sitio solo lleva la paleta, los videos y las fotos de su hotel. Las fotos importan por dos razones: el
    // sitio no procesa las del otro hotel, y las fotos que comparten los dos («…-cerca-…», idénticas byte a byte) salen
    // con el nombre de ESTE hotel. Si se importaran las dos carpetas, Vite las junta por contenido y se queda con el
    // primer nombre: el sitio de Los Arcos publicaba fotos llamadas «…-hotel-quinta-azul».
    resolve: { alias: {
      '@marca': fileURLToPath(new URL(`./src/styles/marca-${hotel}.css`, import.meta.url)),
      '@videos': fileURLToPath(new URL(`./src/assets/${hotel}/video/index.ts`, import.meta.url)),
      '@fotos': fileURLToPath(new URL(`./src/assets/${hotel}`, import.meta.url)),
    } },
    css: { postcss: { plugins: [alturasConRespaldo()] } },
    build: {
      target: NAVEGADORES,
      cssTarget: NAVEGADORES,
      // El código de movimiento (components/Movimiento.astro) va escrito dentro de cada página, pese lo que pese:
      // de él depende que el contenido aparezca, así que no puede esperar una descarga. Lo demás sigue la regla de siempre.
      assetsInlineLimit: (archivo) => (/Movimiento\.astro/.test(archivo) ? true : undefined),
      // Los videos se publican en /video/ (lo demás, en /_astro/): así una sola regla los manda al servicio que los
      // entrega por tramos (servicio/tramos.ts). El servicio de archivos de Cloudflare no sabe entregar tramos.
      rollupOptions: { output: { assetFileNames: (a) => (/\.(mp4|webm)$/i.test((a.names && a.names[0]) || a.name || '') ? 'video/[name].[hash][extname]' : '_astro/[name].[hash][extname]') } },
    },
    server: { watch: { ignored: ['**/.capturas/**', '**/dist-*/**', '**/docs/**'] } },
  },
});
