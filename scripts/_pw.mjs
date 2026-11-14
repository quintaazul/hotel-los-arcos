// Playwright para los guiones de revisión.
// Lo normal: instalarlo una vez en el proyecto con  npm i -D playwright  (los guiones abren el Edge o el Chrome ya
// instalado; Firefox y Safari piden además  npx playwright install firefox webkit).
// Si ya lo tienes en otra carpeta del equipo, escribe su dirección en un archivo .playwright-local en la raíz
// (no se sube al repositorio), por ejemplo:  file:///C:/otra/carpeta/node_modules/playwright/index.mjs
import { existsSync, readFileSync } from 'node:fs';
let pw;
try { pw = await import('playwright'); }
catch {
  const nota = new URL('../.playwright-local', import.meta.url);
  const ruta = process.env.PLAYWRIGHT_RUTA || (existsSync(nota) ? readFileSync(nota, 'utf8').trim() : '');
  if (!ruta) throw new Error('Falta Playwright. Instálalo con «npm i -D playwright» o apunta a una copia en el archivo .playwright-local (ver scripts/_pw.mjs).');
  pw = await import(ruta);
}
const m = pw.chromium ? pw : pw.default;
export const chromium = m.chromium, firefox = m.firefox, webkit = m.webkit, devices = m.devices;
export default m;
