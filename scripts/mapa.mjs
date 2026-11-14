// Mapa de la sección «Cómo llegar»: una imagen fija (no un mapa interactivo), plana, clara y en los tonos de cada
// hotel, con las calles y sus nombres, los edificios dibujados, los parques y los lugares cercanos que le sirven a un
// huésped (dónde comer, la plaza, los museos, la farmacia, los abarrotes), cada uno con su icono.
// Historia (10 y 11 de noviembre de 2026): el dueño pidió «3D», se probó una vista con la sierra en relieve y otra
// oscura con los edificios en volumen (las dos en respaldo/2026-11-10/), y al verlas pidió volver al mapa «normalito,
// sin el 3D», pero con más calidad, más sitios registrados cerca y más bonito. Este es ese mapa.
// Salen dos imágenes por hotel, con el hotel siempre en el mismo punto (PIN, igual que en src/data/hoteles.ts):
//   · mapa-garcia.jpg          apaisada (2 a 1), para computadoras y tabletas;
//   · mapa-garcia-celular.jpg  vertical, para celulares: mismo mapa, más lejos y con la letra a su tamaño.
// El hotel va arriba y el centro del pueblo abajo, porque todo lo que hay que ver queda al sur (la plaza está a 400 m).
// De dónde sale cada cosa (solo se descarga al generar; el sitio no carga nada de fuera):
//   · calles, parques y nombres → OpenStreetMap, por las teselas de OpenFreeMap;
//   · edificios → Overture Maps (el mapa libre casi no tiene edificios dibujados en García);
//   · lugares → la lista hecha a mano de src/data/lugares.json (ahí dice de dónde salió cada uno).
// Uso: node scripts/mapa.mjs [prefijo-de-prueba] [--hotel=qa|la] [--formato=escritorio|celular] [--grueso=1.4]
//      Sin prefijo escribe en src/assets/<hotel>/; con prefijo, <prefijo>-<hotel>[-celular].jpg (no toca el sitio).
import { RAIZ } from './_raiz.mjs';
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
const { chromium } = await import('./_pw.mjs');
const arg = process.argv.slice(2), op = (n, d) => (arg.find((a) => a.startsWith('--' + n + '=')) || '').slice(n.length + 3) || d;
const R = RAIZ, PREFIJO = arg.find((a) => !a.startsWith('--')), GRUESO = +op('grueso', 1.4);
const HOTELES = { qa: [-100.5947355, 25.8153871], la: [-100.5971, 25.8147] };
// Tamaño de cada imagen en pixeles de pantalla (por «escala» en el archivo), acercamiento y punto donde cae el hotel (%).
const FORMATOS = {
  escritorio: { an: 2000, al: 1000, escala: 3, zoom: 16.35, pin: { qa: [66, 22], la: [34, 22] }, archivo: 'mapa-garcia.jpg' },
  celular: { an: 480, al: 680, escala: 5, zoom: 15.9, pin: { qa: [50, 22], la: [28, 22] }, archivo: 'mapa-garcia-celular.jpg' },
};
const EDIFICIOS = 'https://overturemaps-extras-us-west-2.s3.us-west-2.amazonaws.com/tiles/2026-10-21.0/buildings.pmtiles';
const LUGARES = JSON.parse(readFileSync(R + 'src/data/lugares.json', 'utf8')).lugares;
// Tonos por hotel, de su escala de marca (src/styles/marca-*.css). «campo» es el piso del mapa y también el fondo de la
// sección (--c-mapa en detalles.css). Marcadores: m1 referencias (plaza, iglesia, museos), m2 comer, m3 compras y salud.
const TONOS = {
  qa: { campo: '#DAE1F4', verde: '#C3DFCF', agua: '#A9C7F0', edificio: '#C1CBE9', borde: '#B0BCDF', calle: '#FFFFFF', orilla: '#ADB9DC', riel: '#9AA6CC', letraCalle: '#4C5884', colonia: '#8591B8', letraLugar: '#1D295A', m1: '#1D295A', m2: '#3B4E9C', m3: '#7483B2' },
  la: { campo: '#F2E4D6', verde: '#D6E2BE', agua: '#BCD4E8', edificio: '#E5CEBA', borde: '#D8BBA4', calle: '#FFFFFF', orilla: '#D4BCA7', riel: '#C4A790', letraCalle: '#74573F', colonia: '#A98C76', letraLugar: '#4C1E00', m1: '#4C1E00', m2: '#EA6C00', m3: '#A58468' },
};
// Iconos de los marcadores: trazos sencillos en una caja de 24 × 24, dibujados aquí para no depender de una fuente de iconos.
const GRUPO = { plaza: 'm1', iglesia: 'm1', museo: 'm1', cultura: 'm1', comer: 'm2', cafe: 'm2', pan: 'm2', helado: 'm2', tienda: 'm3', super: 'm3', farmacia: 'm3', hospital: 'm3' };
const ICONOS = {
  plaza: 'M12 21v-8 M12 14.5a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z M8 21h8',
  iglesia: 'M12 2.5v5 M10 4.5h4 M6.5 21v-8.5L12 7.5l5.5 5V21z M10.5 21v-4.5h3V21',
  museo: 'M3.5 9.5L12 4l8.5 5.5z M6 10v7 M10 10v7 M14 10v7 M18 10v7 M4 20h16',
  cultura: 'M9 18V5l10-2v13 M9 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z M19 16a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z',
  comer: 'M7.5 3v18 M4.5 3v5a3 3 0 0 0 6 0V3 M16.5 21V3c-2.4 1.6-3.4 5-3.4 8.5 0 1.4 1.3 2.5 3.4 2.5',
  cafe: 'M5 9h11v5.5a4.5 4.5 0 0 1-4.5 4.5h-2A4.5 4.5 0 0 1 5 14.5z M16 10.5h1.6a2.4 2.4 0 0 1 0 4.8H16 M8.5 3.5V6 M12.5 3.5V6',
  pan: 'M3.5 11.5A3.5 3.5 0 0 1 7 8h10a3.5 3.5 0 0 1 3.5 3.5c0 1.1-.7 2-1.7 2.3V19H5.2v-5.2c-1-.3-1.7-1.2-1.7-2.3z M9.8 10.2l-1 2.6 M14 10.2l-1 2.6',
  helado: 'M7.2 10.5a4.8 4.8 0 1 1 9.6 0 M6.5 10.5h11L12 21z',
  tienda: 'M5 9h14l-1.2 11H6.2z M9 9V7.5a3 3 0 0 1 6 0V9',
  super: 'M3 4h2.6l2.3 10.5h9.3L19 7.5H6.4 M9.5 19.5h.01 M16.5 19.5h.01',
  farmacia: 'M9.5 4h5v5.5H20v5h-5.5V20h-5v-5.5H4v-5h5.5z',
  hospital: 'M9.5 4h5v5.5H20v5h-5.5V20h-5v-5.5H4v-5h5.5z',
};
const vias = (clases) => ['match', ['get', 'class'], clases, true, false];
// los anchos están dados para el zoom 16.6 y cambian con el zoom, como en un mapa de verdad; «mas» suma la orilla
const ancho = (v, mas = 0) => { const w = v * GRUESO; return ['interpolate', ['exponential', 2], ['zoom'], 12, w * 0.045 + mas, 16.585, w + mas, 19, w * 5.3 + mas]; };
const linea = { 'line-cap': 'round', 'line-join': 'round' };
const CALLES = [['servicio', ['service', 'track'], 4], ['chica', ['minor'], 8.5], ['media', ['tertiary', 'secondary'], 11.5], ['grande', ['primary', 'trunk', 'motorway'], 15]];
const estilo = (T) => ({
  version: 8, glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  sources: { omt: { type: 'vector', url: 'https://tiles.openfreemap.org/planet' }, edif: { type: 'vector', url: 'pmtiles://' + EDIFICIOS } },
  layers: [
    { id: 'campo', type: 'background', paint: { 'background-color': T.campo } },
    { id: 'cubierta', type: 'fill', source: 'omt', 'source-layer': 'landcover', filter: ['match', ['get', 'class'], ['grass', 'wood', 'farmland'], true, false], paint: { 'fill-color': T.verde, 'fill-opacity': 0.55 } },
    { id: 'parques', type: 'fill', source: 'omt', 'source-layer': 'park', paint: { 'fill-color': T.verde } },
    { id: 'uso', type: 'fill', source: 'omt', 'source-layer': 'landuse', filter: ['match', ['get', 'class'], ['park', 'pitch', 'playground', 'cemetery', 'garden', 'stadium'], true, false], paint: { 'fill-color': T.verde } },
    { id: 'agua', type: 'fill', source: 'omt', 'source-layer': 'water', paint: { 'fill-color': T.agua } },
    { id: 'rios', type: 'line', source: 'omt', 'source-layer': 'waterway', layout: linea, paint: { 'line-color': T.agua, 'line-width': ancho(2.4) } },
    { id: 'edificios', type: 'fill', source: 'edif', 'source-layer': 'building', paint: { 'fill-color': T.edificio, 'fill-outline-color': T.borde } },
    ...CALLES.map(([n, c, w]) => ({ id: 'orilla-' + n, type: 'line', source: 'omt', 'source-layer': 'transportation', filter: vias(c), layout: linea, paint: { 'line-color': T.orilla, 'line-width': ancho(w, 2.2) } })),
    { id: 'andadores', type: 'line', source: 'omt', 'source-layer': 'transportation', filter: vias(['path']), paint: { 'line-color': T.calle, 'line-width': ancho(1.8), 'line-dasharray': [2, 1.4] } },
    ...CALLES.map(([n, c, w]) => ({ id: 'calle-' + n, type: 'line', source: 'omt', 'source-layer': 'transportation', filter: vias(c), layout: linea, paint: { 'line-color': T.calle, 'line-width': ancho(w) } })),
    { id: 'vias-tren', type: 'line', source: 'omt', 'source-layer': 'transportation', filter: vias(['rail']), paint: { 'line-color': T.riel, 'line-width': ancho(1.4), 'line-dasharray': [5, 3] } },
    { id: 'nombres-calles', type: 'symbol', source: 'omt', 'source-layer': 'transportation_name', layout: { 'symbol-placement': 'line', 'text-field': ['coalesce', ['get', 'name:es'], ['get', 'name']], 'text-font': ['Noto Sans Regular'], 'text-size': ['match', ['get', 'class'], ['primary', 'trunk', 'secondary', 'tertiary'], 14.5, 13], 'text-letter-spacing': 0.03, 'symbol-spacing': 420, 'text-max-angle': 30 }, paint: { 'text-color': T.letraCalle, 'text-halo-color': '#FFFFFF', 'text-halo-width': 1.5 } },
    { id: 'colonias', type: 'symbol', source: 'omt', 'source-layer': 'place', filter: ['match', ['get', 'class'], ['suburb', 'quarter', 'neighbourhood'], true, false], layout: { 'text-field': ['coalesce', ['get', 'name:es'], ['get', 'name']], 'text-font': ['Noto Sans Bold'], 'text-size': 10.5, 'text-transform': 'uppercase', 'text-letter-spacing': 0.2, 'text-max-width': 7, 'text-padding': 14 }, paint: { 'text-color': T.colonia, 'text-halo-color': T.campo, 'text-halo-width': 1.6 } },
  ],
});
// Lo que corre dentro del navegador: mueve el centro hasta que el hotel cae en su punto, dibuja los marcadores y avisa.
const pagina = (hotel, F) => { const T = TONOS[hotel]; return `<!doctype html><meta charset="utf8">
<link rel="stylesheet" href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css">
<style>html,body{margin:0;background:${T.campo}}#m{width:${F.an}px;height:${F.al}px}</style><div id="m"></div>
<script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
<script src="https://unpkg.com/pmtiles@3/dist/pmtiles.js"></script>
<script>
try {
  maplibregl.addProtocol('pmtiles', new pmtiles.Protocol().tile);
  const AN = ${F.an}, AL = ${F.al}, hotel = ${JSON.stringify(HOTELES[hotel])}, meta = [${F.an * F.pin[hotel][0] / 100}, ${F.al * F.pin[hotel][1] / 100}], T = ${JSON.stringify(T)};
  const mapa = new maplibregl.Map({ container: 'm', style: ${JSON.stringify(estilo(T))}, center: hotel, zoom: ${F.zoom}, interactive: false, attributionControl: false, fadeDuration: 0, pixelRatio: ${F.escala}, preserveDrawingBuffer: true });
  mapa.on('error', (e) => { window.__fallo = String(e.error && e.error.message || e.error || e); });
  for (let i = 0; i < 4; i++) { const p = mapa.project(hotel); mapa.setCenter(mapa.unproject([${F.an / 2} - (meta[0] - p.x), ${F.al / 2} - (meta[1] - p.y)])); }
  // marcador: círculo del color de su grupo con aro blanco, sombra corta y el icono en blanco
  const marcador = (d, color) => { const k = 4, t = 26, c = document.createElement('canvas'); c.width = c.height = t * k; const g = c.getContext('2d'); g.scale(k, k);
    g.save(); g.shadowColor = 'rgba(0,0,0,.28)'; g.shadowBlur = 1.5 * k; g.shadowOffsetY = 0.6 * k; g.beginPath(); g.arc(13, 12.6, 11.2, 0, 7); g.fillStyle = '#fff'; g.fill(); g.restore();
    g.beginPath(); g.arc(13, 12.6, 9.7, 0, 7); g.fillStyle = color; g.fill();
    g.translate(13 - 6.6, 12.6 - 6.6); g.scale(13.2 / 24, 13.2 / 24); g.strokeStyle = '#fff'; g.lineWidth = 2.5; g.lineCap = g.lineJoin = 'round'; g.stroke(new Path2D(d));
    return g.getImageData(0, 0, t * k, t * k); };
  const ICONOS = ${JSON.stringify(ICONOS)}, GRUPO = ${JSON.stringify(GRUPO)};
  mapa.once('load', () => {
    for (const c in ICONOS) mapa.addImage('m-' + c, marcador(ICONOS[c], T[GRUPO[c]]), { pixelRatio: 4 });
    // fuera los lugares que quedarían debajo del pin del hotel o de su etiqueta (los pone la página encima de la imagen)
    const libres = ${JSON.stringify(LUGARES)}.filter((l) => { const p = mapa.project(l.ll), x = p.x - meta[0], y = p.y - meta[1];
      return !(x > -40 && x < 40 && y > -80 && y < 16) && !(${F.an > 1000} && x >= 40 && x < 260 && y > -58 && y < -8) && p.x > 16 && p.x < ${F.an - 16} && p.y > 16 && p.y < ${F.al - 16}; });
    mapa.addSource('lugares', { type: 'geojson', data: { type: 'FeatureCollection', features: libres.map((l) => { const x = mapa.project(l.ll).x; return { type: 'Feature', properties: { n: AN < 1000 && l.corto || l.n, cat: l.cat, p: l.p, z: x > AN - 150 ? 'd' : x < 150 ? 'i' : 'c' }, geometry: { type: 'Point', coordinates: l.ll } }; }) } });
    // Orden en que se acomoda todo (lo que choca con algo ya puesto no sale): en la imagen de celular, donde el centro
    // queda muy apretado, primero las tres referencias (plaza, parroquia, museo) con su nombre y después lo demás; en la
    // apaisada caben todos los marcadores, así que van primero todos y luego los nombres en el sitio que quede libre.
    const hueco = (id, an, al, corre) => { mapa.addImage(id, { width: an, height: al, data: new Uint8Array(an * al * 4) });
      mapa.addLayer({ id, type: 'symbol', source: { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: hotel } } }, layout: { 'icon-image': id, 'icon-anchor': 'bottom-left', 'icon-offset': corre, 'icon-allow-overlap': true, 'icon-padding': 0 } }); };
    const P1 = ['<=', ['get', 'p'], 1], RESTO = ['>', ['get', 'p'], 1], TODAS = ['left', 'right', 'top', 'bottom'], PRIMERO = AN < 1000;
    const marcas = (id, filtro) => mapa.addLayer({ id, type: 'symbol', source: 'lugares', filter: filtro, layout: { 'icon-image': ['concat', 'm-', ['get', 'cat']], 'icon-size': 1.12, 'icon-allow-overlap': false, 'icon-padding': 0, 'symbol-sort-key': ['get', 'p'] } });
    const nombre = (id, filtro, anclas, antes) => mapa.addLayer({ id, type: 'symbol', source: 'lugares', filter: filtro,
      layout: { 'symbol-sort-key': ['get', 'p'], 'text-field': ['get', 'n'], 'text-font': ['case', P1, ['literal', ['Noto Sans Bold']], ['literal', ['Noto Sans Regular']]], 'text-size': ['match', ['get', 'p'], 1, 15, 14],
        'text-variable-anchor': anclas, 'text-radial-offset': 1.14, 'text-justify': 'auto', 'text-max-width': 6.5, 'text-line-height': 1.12, 'text-padding': 1, 'text-letter-spacing': 0.01 },
      paint: { 'text-color': T.letraLugar, 'text-halo-color': '#FFFFFF', 'text-halo-width': 1.8 } }, antes);
    const CAPAS = PRIMERO ? ['lugares-2', 'lugares-1'] : ['lugares-2'], NOMBRES = PRIMERO ? ['nombre-1'] : [];
    marcas('lugares-2', PRIMERO ? RESTO : ['has', 'n']); if (PRIMERO) { nombre('nombre-1', P1, TODAS); marcas('lugares-1', P1); }
    hueco('hueco-pin', 76, 84, [-38, 8]); if (!PRIMERO) hueco('hueco-etiqueta', 215, 46, [38, -12]);
    const quieto = (sigue) => { let q = 0; const mirar = () => { if (mapa.loaded() && mapa.areTilesLoaded()) { if (++q >= 4) return sigue(); } else q = 0; setTimeout(mirar, 500); }; setTimeout(mirar, 1500); };
    const nombres = () => { const puestos = [...new Set(mapa.queryRenderedFeatures({ layers: CAPAS }).map((f) => f.properties.n))];
      for (const [z, anclas] of [['c', TODAS], ['d', ['right', 'top', 'bottom']], ['i', ['left', 'top', 'bottom']]]) { NOMBRES.push('nombre-' + z);
        nombre('nombre-' + z, ['all', ['==', ['get', 'z'], z], ['in', ['get', 'n'], ['literal', puestos]], PRIMERO ? RESTO : ['has', 'n']], anclas, 'lugares-2'); }
      quieto(() => { const p = mapa.project(hotel), b = mapa.getBounds(), con = new Set(mapa.queryRenderedFeatures({ layers: NOMBRES }).map((f) => f.properties.n));
        window.__listo = { pin: [+(p.x / AN * 100).toFixed(2), +(p.y / AL * 100).toFixed(2)], lugares: puestos.map((n) => n + (con.has(n) ? '' : ' (sin nombre)')), fuera: libres.map((l) => AN < 1000 && l.corto || l.n).filter((n) => !puestos.includes(n)),
          edificios: mapa.queryRenderedFeatures({ layers: ['edificios'] }).length, metros: [Math.round((b.getEast() - b.getWest()) * 100230), Math.round((b.getNorth() - b.getSouth()) * 111320)] }; }); };
    quieto(nombres);
  });
} catch (e) { window.__fallo = String(e && e.stack || e); }
</script>`; };
const nav = await chromium.launch({ channel: 'msedge', args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11', '--enable-webgl'] });
for (const hotel of (op('hotel', '') ? [op('hotel', '')] : ['qa', 'la'])) for (const formato of (op('formato', '') ? [op('formato', '')] : ['escritorio', 'celular'])) {
  const F = FORMATOS[formato], p = await (await nav.newContext({ viewport: { width: F.an, height: F.al }, deviceScaleFactor: F.escala })).newPage();
  await p.setContent(pagina(hotel, F), { waitUntil: 'load' });
  const fin = await p.waitForFunction(() => window.__listo || window.__fallo, null, { timeout: 180000 }).then((h) => h.jsonValue());
  if (typeof fin === 'string') { console.error(`No se pudo dibujar el mapa de ${hotel} (${formato}):`, fin); await nav.close(); process.exit(1); }
  await p.waitForTimeout(2500);   // que terminen de asentarse los rótulos
  const png = await p.locator('#m').screenshot({ type: 'png' }); await p.context().close();
  const sal = PREFIJO ? `${PREFIJO}-${hotel}${formato === 'celular' ? '-celular' : ''}.jpg` : `${R}src/assets/${hotel}/${F.archivo}`;
  const info = await sharp(png).jpeg({ quality: 92, chromaSubsampling: '4:4:4', mozjpeg: true }).toFile(sal);
  console.log(`${hotel} ${formato}: ${info.width}×${info.height} · ${(info.size / 1024).toFixed(0)} KB · abarca ${fin.metros[0]} × ${fin.metros[1]} m · pin ${JSON.stringify(fin.pin)} · ${fin.edificios} edificios · ${fin.lugares.length} lugares → ${sal}`);
  console.log('   lugares: ' + fin.lugares.join(' · '));
  if (fin.fuera.length) console.log('   no caben (chocan con otro más importante): ' + fin.fuera.join(' · '));
}
await nav.close();
