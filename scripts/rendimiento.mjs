// Banco de rendimiento: mide lo que se SIENTE al usar el sitio, no solo cuánto tarda en cargar.
// Abre el sitio compilado en Edge sin ventana (con la tarjeta de video real) y mide, en cada tamaño de pantalla:
//   1. Carga      → cuándo pinta, cuándo termina de acomodarse la portada, cuánto se traba el hilo principal
//                   y cuánto trabaja la página cuando nadie la toca.
//   2. Scroll     → cuadros que el navegador sí dibujó y cuadros que perdió, qué secciones pesan, cuánto ocupa
//                   al procesador y cuánto tarda la página en frenar al soltar la rueda.
//   3. Navegación → del clic en el menú a que la página nueva esté quieta.
//   4. Toques     → cuánto tarda en responder cada control (menú, calendario, huéspedes, panel, visor).
// Uso:  node scripts/rendimiento.mjs <url> <nombre> [pantallas] [--ruta=/hospedaje]
//       pantallas: nombres de scripts/pantallas.mjs separados por comas (4k,2k,1080p,720p,tablet-grande,tablet-chica,
//       celular-grande,celular-chico). Sin ese dato se prueban TODAS, que es la regla.
//       node scripts/rendimiento.mjs --comparar <antes> <despues>
// Los resultados quedan en .capturas/rendimiento/<nombre>.json
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { pantallas } from './pantallas.mjs';
const { chromium } = await import('./_pw.mjs');

const DIR = new URL('../.capturas/rendimiento/', import.meta.url);
mkdirSync(DIR, { recursive: true });
const ms = (n) => (n == null || Number.isNaN(n) ? '—' : Math.round(n) + ' ms');
const pct = (n) => (n == null || Number.isNaN(n) ? '—' : n.toFixed(1) + ' %');

if (process.argv[2] === '--comparar') {
  const [a, b] = [3, 4].map((i) => JSON.parse(readFileSync(new URL(process.argv[i] + '.json', DIR), 'utf8')));
  const fila = (n, x, y, u = 'ms', menosEsMejor = true) => {
    if (x == null || y == null) return;
    const d = y - x, mejor = menosEsMejor ? d < 0 : d > 0, rel = x ? Math.abs(d / x * 100) : 0;
    console.log(`  ${n.padEnd(44)} ${String(Math.round(x * 10) / 10).padStart(8)} → ${String(Math.round(y * 10) / 10).padStart(8)} ${u.padEnd(3)} ${rel < 4 ? '  igual' : (mejor ? '  mejor ' : '  PEOR  ') + rel.toFixed(0) + ' %'}`);
  };
  for (const k of Object.keys(a.pantallas)) {
    const x = a.pantallas[k], y = b.pantallas[k]; if (!y) continue;
    console.log(`\n${k}  (${process.argv[3]} → ${process.argv[4]})`);
    fila('Carga · primera pintura', x.carga.fcp, y.carga.fcp);
    fila('Carga · portada quieta', x.carga.quieta, y.carga.quieta);
    fila('Carga · hilo trabado', x.carga.trabado, y.carga.trabado);
    fila('Carga · JavaScript', x.carga.script, y.carga.script);
    fila('En reposo · procesador ocupado', x.carga.reposo, y.carga.reposo, '%');
    fila('Scroll · cuadros perdidos', x.scroll.perdidos, y.scroll.perdidos, '%');
    fila('Scroll · peor cuadro', x.scroll.peor, y.scroll.peor);
    fila('Scroll · procesador ocupado', x.scroll.ocupado, y.scroll.ocupado, '%');
    fila('Scroll · tarda en frenar', x.scroll.frenado, y.scroll.frenado);
    fila('Scroll · vueltas de rueda para bajar todo', x.scroll.vueltas, y.scroll.vueltas, '');
    fila('Navegación · clic a página quieta', x.nav.quieta, y.nav.quieta);
    fila('Toques · el más lento', x.toques.peor, y.toques.peor);
  }
  process.exit(0);
}

const [url, nombre = 'medida', pantallasT = ''] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const ruta = (process.argv.find((a) => a.startsWith('--ruta=')) || '--ruta=/').slice(7);
if (!url) { console.error('Falta la dirección. Ejemplo: node scripts/rendimiento.mjs http://127.0.0.1:4321 antes'); process.exit(1); }

// Edge real, sin ventana y con la tarjeta de video: el Chromium de pruebas dibuja por software y no reproduce video.
const nav = await chromium.launch({ channel: 'msedge', headless: true, args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11', '--disable-features=CalculateNativeWinOcclusion', '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding'] });
const resultado = { url: url + ruta, fecha: new Date().toISOString(), pantallas: {} };

// Se inyecta antes de que cargue la página: anota pinturas, saltos, tareas largas y la respuesta a cada toque.
const SONDA = () => {
  const s = (window.__sonda = { lcp: 0, cls: 0, largas: [], toques: [] });
  const ver = (tipo, f, extra = {}) => { try { new PerformanceObserver((l) => l.getEntries().forEach(f)).observe({ type: tipo, buffered: true, ...extra }); } catch {} };
  ver('largest-contentful-paint', (e) => { s.lcp = e.startTime; });
  ver('layout-shift', (e) => { if (!e.hadRecentInput) s.cls += e.value; });
  ver('longtask', (e) => s.largas.push([e.startTime, e.duration]));
  ver('event', (e) => { if (!e.interactionId) return; const t = e.target; s.toques.push([e.name, Math.round(e.duration), Math.round(e.processingStart - e.startTime), Math.round(e.processingEnd - e.processingStart), t && t.nodeType === 1 ? (t.closest('[class]')?.className?.toString().split(' ')[0] || t.tagName) : '']); }, { durationThreshold: 16 });
};
// Cuándo termina la última animación de entrada (las que no acaban, como la cinta, y las atadas al scroll no cuentan)
const QUIETA = () => Math.max(0, ...document.getAnimations().map((a) => { const t = a.effect?.getComputedTiming(); return t && Number.isFinite(t.endTime) && a.timeline === document.timeline ? (a.startTime ?? 0) + t.endTime : 0; }));
const metricas = async (cdp) => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));

// Primera visita fuera de la cuenta: el servidor local comprime cada archivo la primera vez que se lo piden
{ const c0 = await nav.newContext(); const p0 = await c0.newPage(); await p0.goto(url + ruta, { waitUntil: 'load' }); await p0.goto(url + '/', { waitUntil: 'load' }); await c0.close(); }

for (const pan of pantallas(pantallasT)) {
  const { id, w, h, dpr, freno: cpu } = pan, tactil = !!pan.tactil;
  const ctx = await nav.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, isMobile: w < 800, hasTouch: tactil });
  await ctx.addInitScript(SONDA);
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Performance.enable');
  if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  const R = { carga: {}, scroll: {}, nav: {}, toques: {} };

  /* ── 1. Carga y reposo ── */
  await p.goto(url + ruta, { waitUntil: 'load' });
  await p.waitForTimeout(3200);
  const c = await p.evaluate((q) => {
    const s = window.__sonda, fcp = performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0;
    return { fcp, lcp: s.lcp, cls: s.cls, trabado: s.largas.reduce((t, [, d]) => t + Math.max(0, d - 50), 0), quieta: (0, eval)('(' + q + ')')(), nodos: document.querySelectorAll('*').length, alto: document.documentElement.scrollHeight };
  }, QUIETA.toString());
  const m0 = await metricas(cdp);
  await p.waitForTimeout(2000);   // dos segundos sin tocar nada
  const mR = await metricas(cdp);
  R.carga = { ...c, script: m0.ScriptDuration * 1000, estilo: (m0.RecalcStyleDuration + m0.LayoutDuration) * 1000, reposo: +((mR.TaskDuration - m0.TaskDuration) / 2 * 100).toFixed(1) };

  /* ── 2. Scroll: baja toda la página como una persona con prisa (rueda en compu, deslizadas en táctil) ── */
  const secciones = await p.evaluate(() => [...document.querySelectorAll('main > section, main > a, footer')].map((e) => { const r = e.getBoundingClientRect(); return [(e.className || e.tagName).toString().split(' ')[0] || e.tagName, Math.round(r.top + scrollY), Math.round(r.bottom + scrollY)]; }).filter((x) => x[2] - x[1] > 40));
  // La posición se anota en cada aviso de scroll (no pide cuadros de más); la marca casa el reloj de la página con el de la traza
  await p.evaluate(() => { const c = (window.__pos = []); addEventListener('scroll', () => c.push([performance.now(), scrollY]), { passive: true }); });
  await nav.startTracing(p, { categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline.frame', 'blink.user_timing', 'cc', 'benchmark', 'gpu'] });
  await p.evaluate(() => performance.mark('banco-traza'));
  const m1 = await metricas(cdp), t1 = Date.now();
  await p.mouse.move(w / 2, h / 2);
  let vueltas = 0, quieto = 0, ultimaY = -1;
  if (tactil) {
    for (; vueltas < 400; vueltas++) {
      const y = await p.evaluate((paso) => { scrollBy({ top: paso, behavior: 'smooth' }); return [scrollY, document.documentElement.scrollHeight - innerHeight]; }, Math.round(h * 0.8));
      await p.waitForTimeout(380);
      if (y[0] >= y[1] - 2) break;
    }
  } else {
    for (; vueltas < 1500; vueltas++) {
      await p.mouse.wheel(0, 100); await p.waitForTimeout(40);
      if (vueltas % 5 === 4) { const y = await p.evaluate(() => [scrollY, document.documentElement.scrollHeight - innerHeight]); if (y[0] >= y[1] - 2) break; quieto = y[0] === ultimaY ? quieto + 1 : 0; ultimaY = y[0]; if (quieto > 12) break; }
    }
  }
  const tFin = Date.now(), m2 = await metricas(cdp);
  const ev = JSON.parse((await nav.stopTracing()).toString()).traceEvents;
  const pos = await p.evaluate(() => ({ pos: window.__pos, marca: performance.getEntriesByName('banco-traza')[0]?.startTime }));
  // De la traza: los cuadros que el navegador dibujó de verdad, los que perdió y en qué se le fue el tiempo
  const marca = ev.find((e) => e.name === 'banco-traza');
  const pidP = marca?.pid, aPagina = (ts) => (ts - marca.ts) / 1000 + pos.marca;
  const suma = {};
  let principales = 0;
  for (const e of ev) {
    if (e.pid !== pidP && e.name !== 'GPUTask') continue;
    if (e.ph === 'X' && e.dur && ['Paint', 'PrePaint', 'Layerize', 'Commit', 'RasterTask', 'ImageDecodeTask', 'GPUTask', 'Layout', 'UpdateLayoutTree', 'FunctionCall', 'HitTest'].includes(e.name)) suma[e.name] = (suma[e.name] || 0) + e.dur / 1000;
    if (e.name === 'BeginMainThreadFrame') principales++;
  }
  const ini = pos.pos[0]?.[0] ?? 0, fin = pos.pos[pos.pos.length - 1]?.[0] ?? 0;
  const dib = marca ? ev.filter((e) => e.name === 'DrawFrame' && e.pid === pidP).map((e) => aPagina(e.ts)).filter((t) => t >= ini && t <= fin).sort((a, b) => a - b) : [];
  const ints = dib.slice(1).map((t, i) => [t - dib[i], t]), ord = ints.map((x) => x[0]).sort((a, b) => a - b), ideal = ord[Math.floor(ord.length / 2)] || 16.7;
  const activos = ints.filter((x) => x[0] < 250);   // un hueco de más de un cuarto de segundo es una pausa entre deslizadas
  const yEn = (t) => { let a = 0, b = pos.pos.length - 1; while (a < b) { const m = (a + b) >> 1; if (pos.pos[m][0] < t) a = m + 1; else b = m; } return pos.pos[a]?.[1] ?? 0; };
  // El navegador lleva la cuenta de cada cuadro: si salió completo, a medias (se movió pero el código no alcanzó a actualizar) o se perdió.
  const cuadros = marca ? ev.filter((e) => e.name === 'PipelineReporter' && e.ph === 'b' && e.pid === pidP).map((e) => { const r = e.args?.frame_reporter || e.args?.chrome_frame_reporter; return r && r.frame_type !== 'FORKED' ? [aPagina(e.ts), r.state] : null; }).filter((x) => x && x[0] >= ini && x[0] <= fin && x[1] !== 'STATE_NO_UPDATE_DESIRED') : [];
  const perd = (l) => l.filter((x) => x[1] === 'STATE_DROPPED').length, parc = (l) => l.filter((x) => x[1] === 'STATE_PRESENTED_PARTIAL').length;
  const porSeccion = secciones.map(([n, a, b]) => { const f = cuadros.filter((x) => { const y = yEn(x[0]) + h * 0.5; return y >= a && y < b; }); if (f.length < 8) return null; const fi = activos.filter((x) => { const y = yEn(x[1]) + h * 0.5; return y >= a && y < b; }); return { seccion: n, cuadros: f.length, lentos: +(perd(f) / f.length * 100).toFixed(1), parciales: +(parc(f) / f.length * 100).toFixed(1), peor: fi.length ? Math.round(Math.max(...fi.map((x) => x[0]))) : 0 }; }).filter(Boolean);
  const seg = (tFin - t1) / 1000, perdidosN = perd(cuadros);
  // Frenado: tres vueltas de rueda a media página y cuánto tarda la página en quedarse quieta después de la última
  let frenado = null;
  if (!tactil) {
    await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight * 0.62));
    await p.waitForTimeout(700);
    const pr = p.evaluate(() => new Promise((ok) => { let u = scrollY, t0 = performance.now(), tU = t0, movio = false; const f = () => { const y = scrollY, ahora = performance.now(); if (Math.abs(y - u) > 0.4) { u = y; tU = ahora; movio = true; } if ((movio && ahora - tU > 350) || ahora - t0 > 6000) ok(Math.round(tU - t0)); else requestAnimationFrame(f); }; requestAnimationFrame(f); }));
    for (let k = 0; k < 3; k++) { await p.mouse.wheel(0, 100); await p.waitForTimeout(16); }
    frenado = Math.max(0, (await pr) - 48);
  }
  R.scroll = {
    vueltas, segundos: +seg.toFixed(1), hz: +(1000 / ideal).toFixed(0), dibujados: dib.length,
    perdidos: cuadros.length ? +(perdidosN / cuadros.length * 100).toFixed(1) : null,
    parciales: cuadros.length ? +(parc(cuadros) / cuadros.length * 100).toFixed(1) : null,
    p95: activos.length ? +(ord[Math.floor(activos.length * 0.95)] ?? 0).toFixed(1) : null, peor: activos.length ? Math.round(Math.max(...activos.map((x) => x[0]))) : null,
    ocupado: +((m2.TaskDuration - m1.TaskDuration) / seg * 100).toFixed(1),
    script: +((m2.ScriptDuration - m1.ScriptDuration) / seg * 100).toFixed(1),
    estilo: +(((m2.RecalcStyleDuration + m2.LayoutDuration) - (m1.RecalcStyleDuration + m1.LayoutDuration)) / seg * 100).toFixed(1),
    cuadrosPrincipales: +(principales / seg).toFixed(0), frenado,
    navegador: Object.fromEntries(Object.entries(suma).map(([k, v]) => [k, +(v / seg).toFixed(1)]).sort((a, b) => b[1] - a[1])),
    porSeccion
  };

  /* ── 3. Navegación: del clic en el menú a que la página nueva esté quieta ── */
  if (!tactil) {
    await p.goto(url + '/', { waitUntil: 'load' }); await p.waitForTimeout(2200);
    const enlace = p.locator('.nav a, header nav a').first();
    await enlace.hover(); await p.waitForTimeout(600);   // el ratón llega antes del clic: ahí empieza a prepararse la página
    const clic = Date.now();
    await Promise.all([p.waitForNavigation({ waitUntil: 'load' }), enlace.click()]);
    await p.waitForTimeout(3000);
    const n = await p.evaluate((q) => ({ origen: performance.timeOrigin, activ: performance.getEntriesByType('navigation')[0]?.activationStart || 0, fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0, quieta: (0, eval)('(' + q + ')')() }), QUIETA.toString());
    // Si la página venía preparada (prerender), su reloj arrancó antes del clic: se cuenta desde que se activa
    const base = n.origen + n.activ - clic;
    R.nav = { fcp: Math.max(0, base + Math.max(0, n.fcp - n.activ)), quieta: Math.max(0, base + Math.max(0, n.quieta - n.activ)), preparada: n.activ > 0 };
  }

  /* ── 4. Toques: cada control, y cuánto tarda en responder ── */
  await p.goto(url + '/', { waitUntil: 'load' }); await p.waitForTimeout(2200);
  const toca = async (sel, espera = 500) => { const l = p.locator(sel).first(); try { if (await l.count() && await l.isVisible()) { await l.click({ timeout: 2500 }); await p.waitForTimeout(espera); return true; } } catch {} return false; };
  const hechos = [];
  if (await toca('#menu-abrir', 700)) { hechos.push('menú'); await toca('#menu-cerrar', 600); }
  if (await toca('.reserva .campo-btn')) { hechos.push('calendario'); await toca('.flota.abierta .dia:not(:disabled) >> nth=12', 300); await toca('.flota.abierta .dia:not(:disabled) >> nth=15', 300); await p.keyboard.press('Escape'); await p.waitForTimeout(600); }
  if (await toca('.reserva .campo-btn >> nth=2')) { hechos.push('huéspedes'); await toca('.flota.abierta .icono-btn >> nth=1', 250); await p.keyboard.press('Escape'); await p.waitForTimeout(600); }
  await p.evaluate(() => document.querySelector('#habitaciones')?.scrollIntoView()); await p.waitForTimeout(900);
  const chico = await p.evaluate(() => matchMedia('(max-width: 1024px)').matches);
  if (await toca(chico ? '.hab-movil [data-detalle]' : '.habs-lista [data-detalle]', 900)) { hechos.push('panel de habitación'); await toca('[data-cerrar-cajon]', 700); }
  if (await toca(chico ? '.hab-movil [data-visor]' : '.habs-media .capa.activa [data-visor-abre]', 900)) { hechos.push('visor'); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(500); await p.keyboard.press('Escape'); await p.waitForTimeout(500); }
  const tq = (await p.evaluate(() => window.__sonda.toques)).filter((t) => t[0] === 'click' || t[0] === 'keydown' || t[0] === 'pointerup');
  R.toques = { probados: hechos, peor: Math.max(0, ...tq.map((t) => t[1])), lentos: tq.filter((t) => t[0] === 'click' && t[1] > 100).length, detalle: tq.sort((a, b) => b[1] - a[1]).slice(0, 10) };

  resultado.pantallas[id] = R;
  await ctx.close();

  /* ── Informe ── */
  console.log(`\n══ ${pan.nombre} · ${w}×${h}${dpr > 1 ? ' @' + dpr + 'x' : ''}${cpu > 1 ? ' · procesador ' + cpu + ' veces más lento' : ''}`);
  console.log(`Carga      primera pintura ${ms(R.carga.fcp)} · portada quieta ${ms(R.carga.quieta)} · hilo trabado ${ms(R.carga.trabado)} · JavaScript ${ms(R.carga.script)} · estilo y acomodo ${ms(R.carga.estilo)} · en reposo ocupa ${pct(R.carga.reposo)} · saltos ${R.carga.cls.toFixed(3)}`);
  console.log(`Scroll     ${R.scroll.dibujados} cuadros a ${R.scroll.hz} Hz · perdidos ${pct(R.scroll.perdidos)} · a medias ${pct(R.scroll.parciales)} · peor ${ms(R.scroll.peor)} · procesador ${pct(R.scroll.ocupado)} (JS ${pct(R.scroll.script)}, estilo ${pct(R.scroll.estilo)}) · ${R.scroll.cuadrosPrincipales} cuadros/s pasan por el código`);
  console.log(`           ${R.scroll.vueltas} ${tactil ? 'deslizadas' : 'vueltas de rueda'} para bajar ${R.carga.alto} px en ${R.scroll.segundos} s${tactil ? '' : ' · tarda ' + ms(R.scroll.frenado) + ' en frenar'}`);
  console.log(`           navegador, ms por segundo: ${Object.entries(R.scroll.navegador).slice(0, 7).map(([k, v]) => k + ' ' + v).join(' · ')}`);
  const pes = [...R.scroll.porSeccion].sort((a, b) => b.lentos - a.lentos || b.peor - a.peor).slice(0, 4);
  console.log(`           secciones más pesadas: ${pes.map((s) => `${s.seccion} (${s.lentos} % perdidos, ${s.parciales} % a medias, peor ${s.peor} ms)`).join(' · ') || '—'}`);
  if (!tactil) console.log(`Navegación del clic a la primera pintura ${ms(R.nav.fcp)} · a la página quieta ${ms(R.nav.quieta)}${R.nav.preparada ? ' (venía preparada)' : ''}`);
  console.log(`Toques     ${R.toques.probados.join(', ')} · el más lento ${ms(R.toques.peor)} · ${R.toques.lentos} sobre 100 ms · ${R.toques.detalle.filter((t) => t[0] !== 'pointerup').slice(0, 4).map((t) => t[4] + ' ' + t[1] + ' (código ' + t[3] + ')').join(' · ')}`);
}
await nav.close();
writeFileSync(new URL(nombre + '.json', DIR), JSON.stringify(resultado, null, 1));
console.log(`\nGuardado en .capturas/rendimiento/${nombre}.json`);
