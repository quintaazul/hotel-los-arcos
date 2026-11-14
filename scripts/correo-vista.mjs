// Vista previa del correo que recibe el hotel por cada solicitud de reserva. NO manda nada: arma el correo con datos
// de ejemplo (servicio/correo.ts), lo guarda como página en .capturas/correo/ y le toma una foto como se vería en
// computadora y en celular. Uso: node scripts/correo-vista.mjs [carpeta-para-las-fotos]
import { mkdirSync, writeFileSync } from 'node:fs';
import { armarCorreo, HOTELES } from '../servicio/correo.ts';
const { chromium } = await import('./_pw.mjs');
const DIR = new URL('../.capturas/correo/', import.meta.url), FOTOS = process.argv[2];
mkdirSync(DIR, { recursive: true }); if (FOTOS) mkdirSync(FOTOS, { recursive: true });
const CASOS = [
  ['quinta-azul-telefono', 'qa', { id: 128, nombre: 'Mariana Treviño', contacto: '81 1234 5678', fechas: 'Del viernes 13 de noviembre al domingo 15 de noviembre', llegada: '2026-11-13', salida: '2026-11-15', personas: 2, habitacion: 'doble', motivo: 'hospedaje', mensaje: 'Llegamos como a las 9 de la noche. ¿Hay problema con la entrada a esa hora?', recibida_en: '2026-11-11T16:42:00.000Z' }],
  ['los-arcos-correo', 'la', { id: 57, nombre: 'Jorge Garza', contacto: 'jorge.garza@example.com', fechas: 'Del lunes 30 de noviembre al miércoles 2 de diciembre', llegada: '2026-11-30', salida: '2026-12-02', personas: 5, habitacion: 'departamento', motivo: 'negocios', mensaje: 'Somos un equipo de trabajo, necesitamos factura.\nSi hay tarifa por semana, me interesa.', recibida_en: '2026-11-11T22:05:00.000Z' }],
  ['quinta-azul-sin-fechas', 'qa', { id: 129, nombre: 'Lupita', contacto: 'por whats', fechas: 'Por definir', personas: 4, habitacion: '', motivo: 'celebracion', mensaje: '(sin mensaje)', recibida_en: '2026-11-11T19:10:00.000Z' }],
];
const nav = await chromium.launch({ channel: 'msedge' });
for (const [nombre, hotel, solicitud] of CASOS) {
  const c = armarCorreo(solicitud, HOTELES[hotel]);
  writeFileSync(new URL(nombre + '.html', DIR), c.html); writeFileSync(new URL(nombre + '.txt', DIR), 'Asunto: ' + c.asunto + (c.responderA ? '\nResponder a: ' + c.responderA : '') + '\n\n' + c.texto);
  console.log('\n' + nombre + '\n  Asunto: ' + c.asunto + (c.responderA ? '\n  Responder a: ' + c.responderA : ''));
  for (const [w, sufijo] of [[680, 'computadora'], [390, 'celular']]) {
    const p = await (await nav.newContext({ viewport: { width: w, height: 600 }, deviceScaleFactor: 2 })).newPage();
    await p.setContent(c.html, { waitUntil: 'load' });
    const desborde = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    const archivo = (FOTOS ? FOTOS.replace(/[\\/]$/, '') + '/' : new URL('.', DIR).pathname.replace(/^\/([A-Za-z]:)/, '$1')) + 'correo-' + nombre + '-' + sufijo + '.png';
    await p.screenshot({ path: decodeURIComponent(archivo), fullPage: true });
    console.log('  ' + sufijo + (desborde > 0 ? ' · SE DESBORDA ' + desborde + ' px' : ' · bien') + ' → ' + decodeURIComponent(archivo));
    await p.context().close();
  }
}
await nav.close();
