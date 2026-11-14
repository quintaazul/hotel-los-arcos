// Diagnóstico de la carga: graba lo que hace el navegador mientras abre una página y dice
// en qué se le fue el tiempo (estilo, acomodo, pintura, JavaScript) y qué lo obligó a acomodar de nuevo.
// Uso: node scripts/traza-carga.mjs <url> [ANCHOxALTO] [freno de CPU]
const { chromium } = await import('./_pw.mjs');
const [url, tam = '1920x1080', cpuT = '1'] = process.argv.slice(2);
const [w, h] = tam.split('x').map(Number), cpu = +cpuT;
const nav = await chromium.launch({ channel: 'msedge', headless: true, args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'] });
const ctx = await nav.newContext({ viewport: { width: w, height: h }, isMobile: w < 800, hasTouch: w < 800, deviceScaleFactor: w < 800 ? 3 : 1 });
const p = await ctx.newPage();
await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(800);   // primera visita: calienta el servidor y la caché
const cdp = await ctx.newCDPSession(p);
if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
await nav.startTracing(p, { categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.stack', 'blink.user_timing', 'loading', 'v8.execute'] });
await p.goto('about:blank'); await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(3000);
const ev = JSON.parse((await nav.stopTracing()).toString()).traceEvents;
await nav.close();

// El proceso de la página es el que tiene la navegación a nuestra dirección
const ini = ev.filter((e) => e.name === 'navigationStart' && e.args?.data?.documentLoaderURL?.startsWith(url.split('?')[0])).pop();
if (!ini) { console.log('No encontré el inicio de la navegación en la traza.'); process.exit(1); }
const pid = ini.pid, t0 = ini.ts;
const hilos = Object.fromEntries(ev.filter((e) => e.ph === 'M' && e.name === 'thread_name' && e.pid === pid).map((e) => [e.tid, e.args.name]));
const principal = +Object.keys(hilos).find((t) => hilos[t] === 'CrRendererMain');
const mios = ev.filter((e) => e.pid === pid && e.tid === principal && e.ph === 'X' && e.ts >= t0);
const total = (n) => mios.filter((e) => e.name === n).reduce((t, e) => t + e.dur, 0) / 1000;
const cuenta = (n) => mios.filter((e) => e.name === n).length;
console.log(`\n${url}  ·  ${w}×${h}${cpu > 1 ? ' · equipo ' + cpu + ' veces más lento' : ''}`);
console.log('Tiempo del hilo principal en los primeros 3 s, por tipo de trabajo:');
for (const n of ['EvaluateScript', 'v8.compile', 'FunctionCall', 'UpdateLayoutTree', 'Layout', 'PrePaint', 'Paint', 'Layerize', 'ParseHTML', 'ParseAuthorStyleSheet', 'Decode Image', 'EventDispatch', 'TimerFire', 'FireAnimationFrame', 'RunMicrotasks']) {
  const t = total(n); if (t >= 1) console.log(`  ${n.padEnd(22)} ${String(Math.round(t)).padStart(5)} ms   en ${cuenta(n)} veces`);
}
// Tareas largas: bloques de más de 50 ms
const tareas = mios.filter((e) => e.name === 'RunTask' && e.dur > 50000).map((e) => ({ en: Math.round((e.ts - t0) / 1000), dura: Math.round(e.dur / 1000), e }));
console.log(`\nTareas de más de 50 ms: ${tareas.length}`);
for (const t of tareas) {
  const dentro = mios.filter((e) => e.ts >= t.e.ts && e.ts + e.dur <= t.e.ts + t.e.dur && e !== t.e && ['EvaluateScript', 'FunctionCall', 'UpdateLayoutTree', 'Layout', 'Paint', 'PrePaint', 'Layerize', 'ParseHTML', 'TimerFire', 'FireAnimationFrame', 'EventDispatch'].includes(e.name));
  const por = {}; for (const e of dentro) por[e.name] = (por[e.name] || 0) + e.dur / 1000;
  const que = dentro.find((e) => e.name === 'EvaluateScript' || e.name === 'FunctionCall');
  const donde = que?.args?.data?.url ? que.args.data.url.split('/').pop().slice(0, 44) + (que.args.data.functionName ? ' · ' + que.args.data.functionName : '') : '';
  console.log(`  a los ${String(t.en).padStart(5)} ms  dura ${String(t.dura).padStart(4)} ms   ${Object.entries(por).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => k + ' ' + Math.round(v)).join(' · ')}   ${donde}`);
}
// Acomodos forzados: el código preguntó una medida y obligó al navegador a acomodar la página en ese instante
const forz = mios.filter((e) => (e.name === 'Layout' || e.name === 'UpdateLayoutTree') && (e.args?.beginData?.stackTrace?.length || e.args?.beginData?.frame && mios.some((f) => (f.name === 'FunctionCall' || f.name === 'EvaluateScript') && f.ts <= e.ts && f.ts + f.dur >= e.ts + e.dur)));
const porSitio = {};
for (const e of forz) {
  const pila = e.args?.beginData?.stackTrace?.[0];
  const sitio = pila ? `${(pila.url || '(en la página)').split('/').pop().slice(0, 40)}:${pila.lineNumber}:${pila.columnNumber} ${pila.functionName || ''}` : 'dentro de un script (sin pila)';
  (porSitio[sitio] ||= { n: 0, ms: 0 }); porSitio[sitio].n++; porSitio[sitio].ms += e.dur / 1000;
}
console.log(`\nAcomodos forzados por el código: ${forz.length} veces, ${Math.round(forz.reduce((t, e) => t + e.dur, 0) / 1000)} ms en total. Los que más pesan:`);
for (const [s, v] of Object.entries(porSitio).sort((a, b) => b[1].ms - a[1].ms).slice(0, 12)) console.log(`  ${String(Math.round(v.ms)).padStart(5)} ms  ${String(v.n).padStart(4)} veces  ${s}`);
// Los acomodos más caros, uno por uno
console.log('\nLos 8 acomodos y recálculos de estilo más caros:');
for (const e of mios.filter((x) => x.name === 'Layout' || x.name === 'UpdateLayoutTree').sort((a, b) => b.dur - a.dur).slice(0, 8)) {
  const d = e.args?.beginData || {}, f = e.args?.endData || {};
  console.log(`  ${e.name.padEnd(17)} ${String((e.dur / 1000).toFixed(1)).padStart(6)} ms  a los ${Math.round((e.ts - t0) / 1000)} ms  ${e.name === 'Layout' ? `sucios ${d.dirtyObjects ?? '?'} de ${d.totalObjects ?? '?'}` : `elementos ${e.args?.elementCount ?? '?'}`}  ${d.stackTrace?.[0] ? '← ' + (d.stackTrace[0].url || 'página').split('/').pop().slice(0, 30) + ':' + d.stackTrace[0].lineNumber : ''}`);
}
