// Perfil del scroll: mientras baja la página, ¿qué código y qué trabajo del navegador se llevan el tiempo?
// Uso: node scripts/perfil-scroll.mjs <url> [pantalla de scripts/pantallas.mjs] [segundos]
import { readFileSync } from 'node:fs';
import { pantallas } from './pantallas.mjs';
const { chromium } = await import('./_pw.mjs');
const [url, cual = 'celular-chico', segT = '8'] = process.argv.slice(2);
const pan = pantallas(cual)[0], seg = +segT;
const nav = await chromium.launch({ channel: 'msedge', headless: true, args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'] });
const ctx = await nav.newContext({ viewport: { width: pan.w, height: pan.h }, deviceScaleFactor: pan.dpr, isMobile: pan.w < 800, hasTouch: !!pan.tactil });
const p = await ctx.newPage();
const cdp = await ctx.newCDPSession(p);
await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(2500);
if (pan.freno > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: pan.freno });
await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 });
await nav.startTracing(p, { categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.invalidationTracking'] });
await cdp.send('Profiler.start');
await p.mouse.move(pan.w / 2, pan.h / 2);
const t0 = Date.now();
while (Date.now() - t0 < seg * 1000) {
  if (pan.tactil) { await p.evaluate((paso) => scrollBy({ top: paso, behavior: 'smooth' }), Math.round(pan.h * 0.8)); await p.waitForTimeout(380); }
  else { await p.mouse.wheel(0, 100); await p.waitForTimeout(40); }
}
const { profile } = await cdp.send('Profiler.stop');
const ev = JSON.parse((await nav.stopTracing()).toString()).traceEvents;
await nav.close();

// 1. Código: tiempo propio de cada función
const dt = (profile.endTime - profile.startTime) / 1000, porNodo = new Map(profile.nodes.map((n) => [n.id, n]));
const propio = new Map();
profile.samples.forEach((id, i) => { const n = porNodo.get(id), f = n.callFrame, k = `${f.functionName || '(anónima)'} @ ${(f.url || '').split('/').pop().slice(0, 34)}:${f.lineNumber}:${f.columnNumber}`; propio.set(k, (propio.get(k) || 0) + (profile.timeDeltas[i] || 0) / 1000); });
console.log(`\n${pan.nombre} · ${seg} s de scroll${pan.freno > 1 ? ' · procesador ' + pan.freno + ' veces más lento' : ''}`);
console.log('Código (tiempo propio, ms por segundo):');
for (const [k, v] of [...propio].sort((a, b) => b[1] - a[1]).slice(0, 14)) console.log(`  ${String((v / seg).toFixed(1)).padStart(7)}  ${k}`);

// 2. Navegador: en qué se va el hilo principal, y qué pinta
const x = ev.filter((e) => e.ph === 'X' && e.dur);
const suma = {}; for (const e of x) if (['Paint', 'PrePaint', 'Layerize', 'UpdateLayoutTree', 'Layout', 'FunctionCall', 'IntersectionObserverController::computeIntersections', 'HitTest', 'Commit', 'EventDispatch', 'FireAnimationFrame', 'RunMicrotasks', 'Animation', 'UpdateLayer', 'CompositeLayers'].includes(e.name)) { (suma[e.name] ||= { ms: 0, n: 0 }); suma[e.name].ms += e.dur / 1000; suma[e.name].n++; }
console.log('\nNavegador (ms por segundo · veces por segundo):');
for (const [k, v] of Object.entries(suma).sort((a, b) => b[1].ms - a[1].ms)) console.log(`  ${String((v.ms / seg).toFixed(1)).padStart(7)}  ${String(Math.round(v.n / seg)).padStart(5)}  ${k}`);
// 3. Qué se repinta: tamaño y capa de cada pintura
const pint = x.filter((e) => e.name === 'Paint' && e.args?.data?.clip);
const porNodoP = {};
for (const e of pint) { const c = e.args.data.clip, w = Math.round(Math.abs(c[2] - c[0])), h = Math.round(Math.abs(c[5] - c[1])); const k = `${e.args.data.nodeName || 'capa ' + e.args.data.layerId}  ${w}×${h}`; (porNodoP[k] ||= { ms: 0, n: 0 }); porNodoP[k].ms += e.dur / 1000; porNodoP[k].n++; }
console.log('\nLo que más se repinta:');
for (const [k, v] of Object.entries(porNodoP).sort((a, b) => b[1].ms - a[1].ms).slice(0, 10)) console.log(`  ${String((v.ms / seg).toFixed(1)).padStart(7)} ms/s  ${String(v.n).padStart(5)} veces  ${k}`);
// 4. Qué provocó recálculos de estilo
const inv = ev.filter((e) => e.name === 'StyleRecalcInvalidationTracking' || e.name === 'ScheduleStyleInvalidationTracking');
const porCausa = {}; for (const e of inv) { const d = e.args?.data || {}; const k = `${d.nodeName || '?'} · ${d.reason || d.invalidationSet || d.changedClass || d.changedAttribute || d.extraData || ''}`.slice(0, 90); porCausa[k] = (porCausa[k] || 0) + 1; }
console.log('\nLo que más obliga a recalcular estilo:');
for (const [k, v] of Object.entries(porCausa).sort((a, b) => b[1] - a[1]).slice(0, 10)) console.log(`  ${String(v).padStart(6)}  ${k}`);
void readFileSync;
