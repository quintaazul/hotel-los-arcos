// Sustituye en todo el sitio las fotos viejas por las ajustadas del diseñador (misma escena, mejor luz y tamaño).
// Antes de tocar nada guarda una copia de los archivos que cambia en respaldo/<fecha>/.
// Uso: node scripts/cambiar-fotos.mjs [--probar]   (con --probar solo dice qué cambiaría)
import { RAIZ } from './_raiz.mjs';
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
const probar = process.argv.includes('--probar');
const QA = 'hotel-quinta-azul', LA = 'hotel-los-arcos-inn';
// foto vieja → foto nueva
const CAMBIOS = {
  // Quinta Azul
  'patio-atardecer-hotel-quinta-azul-garcia.webp': `edificio-escalera-atardecer-${QA}.jpg`,
  'alberca-agua-turquesa-hotel-quinta-azul.webp': `alberca-sierra-atardecer-${QA}.jpg`,
  'alberca-con-montana-hotel-quinta-azul-garcia-nuevo-leon.webp': `alberca-sierra-cielo-rosa-${QA}.jpg`,
  'alberca-flotadores-familias-hotel-quinta-azul.webp': `alberca-flotadores-camastro-${QA}.jpg`,
  'pasillo-vista-sierra-hotel-quinta-azul-garcia.webp': `pasillo-vista-sierra-atardecer-${QA}.jpg`,
  'vista-sierra-garcia-desde-hotel-quinta-azul.webp': `terraza-vista-sierra-atardecer-${QA}.jpg`,
  'estacionamiento-privado-hotel-quinta-azul-garcia.webp': `estacionamiento-con-autos-${QA}.jpg`,
  'patio-vista-aerea-hotel-quinta-azul-garcia.jpg': `patio-habitaciones-desde-arriba-${QA}.jpg`,
  'hotel-quinta-azul-garcia-exterior-cielo-azul.webp': `patio-edificio-palmas-cielo-azul-${QA}.jpg`,
  'detalle-cama-orquidea-hotel-quinta-azul.webp': `cama-cojines-orquidea-detalle-${QA}.jpg`,
  'escritorio-espejo-zona-de-trabajo-hotel-quinta-azul.jpg': `escritorio-espejo-orquidea-${QA}.jpg`,
  'escritorio-silla-cortina-hotel-quinta-azul.jpg': `escritorio-laptop-luz-de-tarde-${QA}.jpg`,
  'habitacion-dos-camas-queen-de-frente-hotel-quinta-azul.jpg': `habitacion-dos-camas-queen-abanico-${QA}.jpg`,
  'habitacion-dos-camas-queen-amplia-hotel-quinta-azul.jpg': `habitacion-doble-dos-camas-${QA}.jpg`,
  'habitacion-camas-queen-pantalla-closet-hotel-quinta-azul.jpg': `habitacion-dos-camas-queen-pantalla-${QA}.jpg`,
  'habitacion-closet-pantalla-frigobar-hotel-quinta-azul.jpg': `mueble-pantalla-microondas-frigobar-${QA}.jpg`,
  'bano-privado-regadera-hotel-quinta-azul.jpg': `bano-regadera-cancel-${QA}.jpg`,
  // Los Arcos Inn
  'fachada-naranja-alberca-atardecer-hotel-los-arcos-inn-garcia.webp': `fachada-arcos-alberca-reflejo-atardecer-${LA}.jpg`,
  'alberca-jardin-fachada-hotel-los-arcos-inn-garcia.webp': `jardin-alberca-desde-un-arco-atardecer-${LA}.jpg`,
  'hotel-los-arcos-inn-garcia-vista-jardin.webp': `alberca-jardin-desde-arriba-atardecer-${LA}.jpg`,
  'arcos-palmas-dos-niveles-hotel-los-arcos-inn-garcia.webp': `arcos-dos-niveles-palmas-patio-${LA}.jpg`,
  'patio-arcos-jardin-hotel-los-arcos-inn-garcia.webp': `arcos-palmas-patio-de-dia-${LA}.jpg`,
  'jardin-atardecer-hotel-los-arcos-inn-garcia.webp': `jardin-palmas-atardecer-${LA}.jpg`,
  'jardin-alberca-eventos-hotel-los-arcos-inn-garcia.webp': `jardin-alberca-entre-palmas-${LA}.jpg`,
  'alberca-muro-verde-cascada-hotel-los-arcos-inn.webp': `alberca-cascada-muro-verde-de-dia-${LA}.jpg`,
  'palapa-alberca-atardecer-hotel-los-arcos-inn-garcia.webp': `alberca-palapa-arcos-atardecer-${LA}.jpg`,
  'alberca-chapoteadero-hotel-los-arcos-inn-garcia.webp': `alberca-flotadores-camastros-atardecer-${LA}.jpg`,
  'escritorio-trabajar-wifi-hotel-los-arcos-inn-garcia.webp': `departamento-escritorio-para-trabajar-${LA}.jpg`,
  'sala-vista-alberca-departamento-hotel-los-arcos-inn.webp': `departamento-sala-vista-al-jardin-${LA}.jpg`,
  'cocineta-equipada-departamento-hotel-los-arcos-inn.webp': `departamento-cocina-equipada-${LA}.jpg`,
  'departamento-cocina-barra-desayunador-hotel-los-arcos-inn.jpg': `departamento-cocina-barra-bancos-${LA}.jpg`,
  'departamento-recamara-cama-queen-hotel-los-arcos-inn.jpg': `recamara-cama-queen-detalle-${LA}.jpg`,
  'departamento-recamara-dos-camas-hotel-los-arcos-inn.jpg': `recamara-dos-camas-${LA}.jpg`,
  'departamento-dos-recamaras-puertas-hotel-los-arcos-inn.jpg': `departamento-dos-recamaras-${LA}.jpg`,
  'departamento-sala-sofa-pantalla-hotel-los-arcos-inn.jpg': `departamento-sala-sofa-pantalla-grande-${LA}.jpg`,
  'departamento-sala-lila-pantalla-hotel-los-arcos-inn.jpg': `departamento-sala-pantalla-luz-de-tarde-${LA}.jpg`,
  'departamento-closet-comoda-hotel-los-arcos-inn.jpg': `departamento-closet-con-equipaje-${LA}.jpg`,
  'departamento-cocina-comedor-hotel-los-arcos-inn.jpg': `departamento-cocina-luz-de-tarde-${LA}.jpg`,
  // Retocadas con IA (10 nov 2026): sustituyen a las fotos reales sin acabado
  'palapa-eventos-hotel-quinta-azul-garcia.webp': `palapa-asador-barra-atardecer-${QA}.jpg`,
  'palapa-con-vista-alberca-hotel-quinta-azul.webp': `palapa-barra-bancos-alberca-al-fondo-${QA}.jpg`,
  'palapa-asador-bar-hotel-quinta-azul.webp': `palapa-barra-bancos-luz-de-tarde-${QA}.jpg`,
  'palapa-celebraciones-hotel-quinta-azul-garcia.webp': `palapa-asador-columnas-atardecer-${QA}.jpg`,
  'habitacion-cabecera-cojines-hotel-quinta-azul.jpg': `habitacion-camas-cojines-lampara-${QA}.jpg`,
  'habitacion-frigobar-microondas-hotel-quinta-azul.jpg': `habitacion-camas-frigobar-pantalla-${QA}.jpg`,
  'habitacion-cama-queen-de-frente-hotel-los-arcos-inn.jpg': `habitacion-sencilla-cama-queen-${LA}.jpg`,
  'habitacion-dos-camas-de-lado-hotel-los-arcos-inn.jpg': `habitacion-doble-dos-camas-${LA}.jpg`,
  'departamento-recamara-camas-rosas-hotel-los-arcos-inn.jpg': `departamento-recamara-dos-camas-rosa-${LA}.jpg`,
  'bano-lavabo-negro-hotel-los-arcos-inn.jpg': `bano-lavabo-negro-toallas-${LA}.jpg`,
  'departamento-bano-regadera-hotel-los-arcos-inn.jpg': `departamento-bano-regadera-cancel-${LA}.jpg`,
  'departamento-escritorio-puertas-hotel-los-arcos-inn.jpg': `departamento-escritorio-recamaras-${LA}.jpg`,
  'entrada-barda-naranja-logo-hotel-los-arcos-inn.jpg': `entrada-barda-naranja-letrero-${LA}.jpg`,
  // Segunda ronda del retoque: las del sitio viejo que seguían a 1080 px, ahora en alta
  'alberca-atardecer-palmas-hotel-quinta-azul-garcia.webp': `alberca-atardecer-palmas-${QA}.jpg`,
  'patio-eventos-hotel-quinta-azul-garcia.webp': `patio-edificio-arbol-palma-${QA}.jpg`,
  'sierra-de-garcia-camino-desde-monterrey.webp': `sierra-de-garcia-panoramica-cerca-${QA}.jpg`,
  [`contacto: 'patio-edificio-palmas-cielo-azul-${QA}.jpg'`]: `contacto: 'edificio-azul-patio-de-dia-${QA}.jpg'`,
  'alberca-vista-aerea-hotel-los-arcos-inn-garcia.webp': `alberca-vista-aerea-${LA}.jpg`,
  'cocinar-departamento-estancias-largas-hotel-los-arcos-inn.webp': `cocinando-en-la-estufa-del-departamento-${LA}.jpg`,
  'sierra-de-garcia-cerca-hotel-los-arcos-inn.webp': `sierra-de-garcia-paredes-de-roca-cerca-${LA}.jpg`,
  // Xenpal: la palapa vacía de la entrada sale; entran los animales, que son las fotos del diseñador
  [`["xenpal-palapa-mirador-cerca-${QA}.jpg", "La palapa de la entrada, con vista al valle"]`]: `["xenpal-llamas-atardecer-cerca-${QA}.jpg", "Las llamas de Xenpal, al caer la tarde"]`,
  [`["xenpal-palapa-mirador-cerca-${LA}.jpg", "La palapa de la entrada, con vista al valle"]`]: `["xenpal-llamas-atardecer-cerca-${LA}.jpg", "Las llamas de Xenpal, al caer la tarde"]`,
  // Tercera ronda: las que pasaron de día a luz de tarde y cambiaron de nombre
  'edificio-azul-patio-de-dia-hotel-quinta-azul.jpg': `edificio-azul-patio-atardecer-${QA}.jpg`,
  'alberca-cascada-muro-verde-de-dia-hotel-los-arcos-inn.jpg': `alberca-cascada-muro-verde-atardecer-${LA}.jpg`,
  'arcos-palmas-patio-de-dia-hotel-los-arcos-inn.jpg': `arcos-palmas-patio-atardecer-${LA}.jpg`,
  // Lugares cerca (los dos hoteles)
  [`sierra-canon-camino-a-xenpal-cerca-${QA}.jpg`]: `sierra-camino-a-xenpal-cerca-${QA}.jpg`,
  [`sierra-canon-camino-a-xenpal-cerca-${LA}.jpg`]: `sierra-camino-a-xenpal-cerca-${LA}.jpg`,
  [`xenpal-entrada-letrero-sierra-cerca-${QA}.jpg`]: `xenpal-entrada-arco-letrero-cerca-${QA}.jpg`,
  [`xenpal-entrada-letrero-sierra-cerca-${LA}.jpg`]: `xenpal-entrada-arco-letrero-cerca-${LA}.jpg`,
};
const raiz = RAIZ, hoy = new Date().toISOString().slice(0, 10);
const archivos = []; (function andar(d) { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) { if (f !== 'assets') andar(p); } else if (/\.(ts|astro|md|mdx|json)$/.test(f)) archivos.push(p); } })(raiz + 'src');
// El plan de las Grutas usaba una foto de la sierra: ahora tiene la suya
const grutas = (t) => t.replace(/(grutas: ')sierra-canon-camino-a-xenpal-cerca-(hotel-[a-z-]+)\.jpg'/g, "$1grutas-de-garcia-interior-cerca-$2.jpg'");
let total = 0;
for (const a of archivos) {
  const antes = readFileSync(a, 'utf8'); let t = grutas(antes), n = t === antes ? 0 : 1;
  for (const [v, nueva] of Object.entries(CAMBIOS)) { const partes = t.split(v); if (partes.length > 1) { n += partes.length - 1; t = partes.join(nueva); } }
  if (!n) continue;
  for (const nueva of new Set(Object.values(CAMBIOS).map((x) => (x.match(/[a-z0-9-]+\.(?:jpg|webp)/) || [x])[0]))) if (t.includes(nueva)) { const h = nueva.includes(LA) ? 'la' : 'qa'; if (!existsSync(`${raiz}src/assets/${h}/${nueva}`)) throw new Error('Falta la foto ' + nueva); }
  total += n; console.log(`${String(n).padStart(3)} cambios  ${a.slice(raiz.length).replace(/\\/g, '/')}`);
  if (probar) continue;
  const copia = join(raiz, 'respaldo', hoy, a.slice(raiz.length)); mkdirSync(dirname(copia), { recursive: true });
  if (!existsSync(copia)) copyFileSync(a, copia);
  writeFileSync(a, t);
}
console.log(`${total} referencias ${probar ? 'por cambiar' : 'cambiadas'}${probar ? '' : '. Copia de lo anterior en respaldo/' + hoy + '/'}`);
