// Prueba en el Edge de verdad: con ventana, sin los ajustes especiales que Playwright le pone a los navegadores de
// prueba (esos ajustes apagan el ahorro de recursos y otras cosas que sí tiene el navegador de una persona) y con un
// perfil limpio y temporal. Baja con la rueda como una persona y mide cuánto tarda cada pieza en aparecer.
//
// Uso: node scripts/edge-real.mjs http://localhost:4321 [--ruta=/hospedaje] [--navegar] [--fotos] [--nombre=antes]
//   --navegar  entra por el inicio, deja el ratón sobre el enlace (para que Edge prepare la página) y hace clic
//   --fotos    guarda capturas de lo que se ve en .capturas/edge-real/
import { RAIZ } from './_raiz.mjs';
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const { chromium } = await import('./_pw.mjs');

const arg = (n, d = '') => { const a = process.argv.find((x) => x.startsWith('--' + n + '=')); return a ? a.slice(n.length + 3) : d; };
const base = process.argv.slice(2).find((a) => !a.startsWith('--')) || 'http://localhost:4321';
const ruta = arg('ruta', '/'), navegar = process.argv.includes('--navegar'), fotos = process.argv.includes('--fotos'), nombre = arg('nombre', 'edge');
const PUERTO = 9377, espera = (ms) => new Promise((ok) => setTimeout(ok, ms));
const dirFotos = RAIZ + '.capturas/edge-real'; mkdirSync(dirFotos, { recursive: true });

const perfil = mkdtempSync(join(tmpdir(), 'edge-prueba-'));
const exe = (process.env['ProgramFiles(x86)'] || 'C:/Program Files (x86)') + '/Microsoft/Edge/Application/msedge.exe';
// --ext=carpeta1,carpeta2 carga extensiones sueltas (por ejemplo, una copia de un bloqueador de anuncios) para ver qué
// le hacen al sitio; --espera-ext=ms les da tiempo de preparar sus listas antes de abrir la página.
const ext = arg('ext'), esperaExt = +arg('espera-ext', ext ? '12000' : '0');
const extra = ext ? ['--load-extension=' + ext, '--disable-features=DisableLoadExtensionCommandLineSwitch,ExtensionManifestV2Unsupported,ExtensionManifestV2Disabled'] : [];
// --disable-sync: sin esto Edge inicia sesión solo con la cuenta de Windows y baja al perfil de prueba las extensiones
// y los datos de la persona. El perfil de prueba se borra al terminar.
const proc = spawn(exe, ['--remote-debugging-port=' + PUERTO, '--user-data-dir=' + perfil, '--no-first-run', '--no-default-browser-check', '--disable-sync', '--start-maximized', ...extra, 'about:blank'], { stdio: 'ignore' });
const cerrar = async () => {
  try { await nav.close(); } catch {}
  try { proc.kill(); } catch {}
  for (let i = 0; i < 20; i++) { try { rmSync(perfil, { recursive: true, force: true }); break; } catch { await espera(400); } }
};
for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://127.0.0.1:${PUERTO}/json/version`)).ok) break; } catch {} await espera(250); }
if (esperaExt) await espera(esperaExt);
let nav = await chromium.connectOverCDP(`http://127.0.0.1:${PUERTO}`);
// Las extensiones abren sus propias pestañas de bienvenida: la prueba usa una pestaña nueva y la trae al frente
let pag = ext ? await nav.contexts()[0].newPage() : (nav.contexts()[0].pages()[0] || await nav.contexts()[0].newPage());
await pag.bringToFront().catch(() => {});

const errores = [], lentas = [], fallidas = [];
const escuchar = (p) => {
  p.on('pageerror', (e) => errores.push('error: ' + String(e).slice(0, 200)));
  p.on('console', (m) => { if (m.type() === 'error') errores.push('consola: ' + m.text().slice(0, 200)); });
  p.on('requestfailed', (q) => fallidas.push(q.url().replace(base, '') + ' → ' + (q.failure()?.errorText || '')));
  p.on('response', (r) => { if (r.status() >= 400) fallidas.push(r.url().replace(base, '') + ' → ' + r.status()); });
  p.on('requestfinished', (q) => { const t = q.timing(); const total = t.responseEnd; if (total > 250) lentas.push(`${Math.round(total)} ms (conexión ${Math.round(Math.max(0, t.connectEnd - t.connectStart))} ms)  ${q.url().replace(base, '')}`); });
};
escuchar(pag);

// Medidor dentro de la página: usa un reloj propio (no depende de avisos del navegador) y anota, por pieza, cuándo
// entró a la pantalla y cuándo quedó marcada como vista.
const MEDIDOR = () => {
  if (window.__med) return;
  const sel = '[data-titulo],[data-aparece],[data-revela],[data-nombre-serie],.habs-lista .hab';
  const els = [...document.querySelectorAll(sel)], reg = els.map(() => ({ entra: 0, visto: 0 }));
  const m = window.__med = { reg, cuadros: 0, t0: performance.now(), io: -1, prerender: (performance.getEntriesByType('navigation')[0] || {}).activationStart || 0 };
  const paso = () => {
    const h = innerHeight, w = innerWidth, t = performance.now();
    els.forEach((e, i) => {
      const g = reg[i];
      if (!g.visto && e.classList.contains('visto')) g.visto = t;
      if (!g.entra) { const r = e.getBoundingClientRect(); if ((r.width || r.height) && r.top < h * 0.85 && r.bottom > 0 && r.left < w && r.right > 0) g.entra = t; }
    });
  };
  paso(); setInterval(paso, 25);
  const f = () => { m.cuadros++; requestAnimationFrame(f); }; requestAnimationFrame(f);
  const ti = performance.now(); new IntersectionObserver((_, o) => { m.io = performance.now() - ti; o.disconnect(); }).observe(document.body);
};
const LEER = () => {
  const m = window.__med, t = performance.now(), n = performance.getEntriesByType('navigation')[0] || {};
  const d = m.reg.filter((g) => g.entra).map((g) => (g.visto ? Math.max(0, g.visto - g.entra) : -1));
  const ok = d.filter((x) => x >= 0).sort((a, b) => a - b);
  // lo que una persona tiene delante ahora mismo y sigue escondido
  const h = innerHeight, sel = '[data-titulo],[data-aparece],[data-revela],[data-nombre-serie]';
  const tapados = [...document.querySelectorAll(sel)].filter((e) => { const r = e.getBoundingClientRect(); return (r.width || r.height) && r.top < h * 0.85 && r.bottom > 0 && !e.classList.contains('visto'); }).length;
  // lo que una extensión escondió a la fuerza (display:none sobre algo que el sitio sí muestra) y las hojas de estilo que metió
  const borradas = [...document.querySelectorAll('body *')].filter((e) => !e.closest('[hidden],dialog,template,script,style,noscript') && getComputedStyle(e).display === 'none' && e.parentElement && getComputedStyle(e.parentElement).display !== 'none')
    .map((e) => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).join('.') : '')).slice(0, 40);
  return {
    escondidasALaFuerza: borradas, extrasEnElDocumento: [...document.querySelectorAll('html > :not(head):not(body), body > [id*="adguard" i], body > [class*="ublock" i]')].map((e) => e.tagName).join(','),
    piezas: m.reg.length, entraron: d.length, nuncaVistas: d.filter((x) => x < 0).length, tapadosAhora: tapados,
    mediana: ok.length ? Math.round(ok[ok.length >> 1]) : 0, p95: ok.length ? Math.round(ok[Math.floor(ok.length * 0.95)]) : 0, max: ok.length ? Math.round(ok[ok.length - 1]) : 0,
    cuadrosPorSeg: Math.round(m.cuadros / ((t - m.t0) / 1000)), avisoIO: Math.round(m.io), clases: document.documentElement.className, visible: document.visibilityState,
    preparada: Math.round(m.prerender), respuesta: Math.round(n.responseStart || 0), dom: Math.round(n.domContentLoadedEventEnd || 0), carga: Math.round(n.loadEventEnd || 0),
    alto: document.documentElement.scrollHeight, y: Math.round(scrollY), pantalla: innerWidth + '×' + innerHeight + ' @' + devicePixelRatio,
  };
};
// Si Edge cambió la página por una que ya tenía preparada, la conexión de prueba puede quedar apuntando a la vieja:
// se vuelve a conectar y se toma la pestaña que está abierta.
const enPagina = async (f) => {
  // Antes de leer se comprueba que el medidor siga puesto (una extensión puede recargar la pestaña)
  if (f === LEER) f = `(${MEDIDOR})(), (${LEER})()`;
  try { return await pag.evaluate(f); } catch {
    try { await nav.close(); } catch {}
    nav = await chromium.connectOverCDP(`http://127.0.0.1:${PUERTO}`);
    pag = nav.contexts()[0].pages().find((p) => p.url().startsWith(base)) || nav.contexts()[0].pages()[0];
    escuchar(pag);
    return await pag.evaluate(f);
  }
};

const informe = { base, ruta, navegar };
const t0 = Date.now();
if (navegar) {
  await pag.goto(base + '/', { waitUntil: 'load' });
  await espera(1500);
  const enlace = pag.locator(`a[href="${ruta}"]`).first();
  await enlace.scrollIntoViewIfNeeded();
  const caja = await enlace.boundingBox();
  await pag.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2, { steps: 12 });
  await espera(1200);                                   // el ratón se queda encima: Edge prepara la página
  const tClic = Date.now();
  await pag.mouse.down(); await pag.mouse.up();
  for (let i = 0; i < 80; i++) { await espera(50); try { if (new URL(pag.url()).pathname === ruta && await pag.evaluate(() => document.readyState !== 'loading')) break; } catch { break; } }
  informe.msHastaPagina = Date.now() - tClic;
} else {
  await pag.goto(base + ruta, { waitUntil: 'commit' });
}
await enPagina(MEDIDOR);
informe.msAbrir = Date.now() - t0;
await espera(1200);
informe.alAbrir = await enPagina(LEER);
if (fotos) await pag.screenshot({ path: `${dirFotos}/${nombre}-0.jpg`, type: 'jpeg', quality: 70 }).catch(() => {});

// Bajar con la rueda como una persona: ráfagas de 6 muescas y una pausa para mirar
const tam = pag.viewportSize() || await enPagina(() => ({ width: innerWidth, height: innerHeight }));
await pag.mouse.move(tam.width / 2, tam.height / 2);
let peor = 0, n = 0;
for (let r = 0; r < 90; r++) {
  for (let k = 0; k < 6; k++) { await pag.mouse.wheel(0, 100); await espera(35); }
  await espera(450);
  const s = await enPagina(LEER);
  peor = Math.max(peor, s.tapadosAhora);
  if (fotos && r % 3 === 1 && n < 14) await pag.screenshot({ path: `${dirFotos}/${nombre}-${++n}.jpg`, type: 'jpeg', quality: 70 }).catch(() => {});
  if (s.y + parseInt(s.pantalla.split('×')[1]) >= s.alto - 4) break;
}
await espera(800);
informe.alBajar = await enPagina(LEER);
informe.piezasTapadasEnUnaPausa = peor;
informe.errores = [...new Set(errores)]; informe.fallidas = [...new Set(fallidas)]; informe.lentas = lentas.slice(0, 12);
// Qué extensiones quedaron de verdad cargadas (cada una deja un proceso de fondo con su dirección propia)
try { informe.extensiones = [...new Set((await (await fetch(`http://127.0.0.1:${PUERTO}/json/list`)).json()).filter((t) => /^(chrome-)?extension:/.test(t.url)).map((t) => t.title || t.url.split('/')[2]))]; } catch { informe.extensiones = []; }
writeFileSync(`${dirFotos}/${nombre}.json`, JSON.stringify(informe, null, 2));
const linea = (s) => `piezas ${s.entraron}/${s.piezas}, nunca vistas ${s.nuncaVistas}, tapadas ahora ${s.tapadosAhora}, espera mediana ${s.mediana} ms, p95 ${s.p95}, máx ${s.max}, ${s.cuadrosPorSeg} cuadros/s, clases «${s.clases}», carga ${s.carga} ms${s.preparada ? ', preparada por adelantado' : ''}`;
console.log(`[${nombre}] ${base}${ruta}${navegar ? ' (con clic)' : ''}  pantalla ${informe.alAbrir.pantalla}`);
console.log('  extensiones: ' + (informe.extensiones.join(' | ') || 'ninguna'));
console.log('  al abrir: ' + linea(informe.alAbrir));
console.log('  al bajar: ' + linea(informe.alBajar));
console.log('  piezas tapadas en alguna pausa: ' + informe.piezasTapadasEnUnaPausa + (informe.msHastaPagina ? `, del clic a la página ${informe.msHastaPagina} ms` : ''));
console.log('  escondidas a la fuerza: ' + informe.alBajar.escondidasALaFuerza.join(', '));
if (informe.errores.length) console.log('  errores: ' + informe.errores.join(' || '));
if (informe.fallidas.length) console.log('  no cargaron: ' + informe.fallidas.join(' || '));
if (lentas.length) console.log('  respuestas de más de 250 ms: ' + lentas.length + ' (la peor: ' + lentas.sort((a, b) => parseInt(b) - parseInt(a))[0] + ')');
await cerrar();
process.exit(0);
