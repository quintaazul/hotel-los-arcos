// ¿Cada foto llega del tamaño justo? Abre cada página en varios tamaños (los dos que usa PageSpeed y dos reales),
// baja toda la página y, por cada imagen que el navegador descargó, compara el archivo que eligió con el que de
// verdad hacía falta para el espacio que la foto ocupa en esa pantalla:
//   · DE MÁS: eligió un archivo mayor que el necesario (el atributo «sizes» promete más ancho del que ocupa);
//   · DE MENOS: eligió uno menor y la foto se estira (se vería borrosa);
//   · formato viejo (JPG o PNG pesado) habiendo AVIF/WebP, o un archivo muy pesado para una sola foto.
// Con object-fit:cover cuenta el tamaño al que la foto se amplía para llenar su caja, no el ancho de la caja.
// Uso: node scripts/imagenes-de-mas.mjs http://localhost:4321 [http://localhost:4322] [--pagina=/ruta] [--pesadas=330]
const { chromium } = await import('./_pw.mjs');
const args = process.argv.slice(2), bases = args.filter((a) => !a.startsWith('--'));
const solo = (args.find((a) => a.startsWith('--pagina=')) || '').slice(9);
const PESADA = +((args.find((a) => a.startsWith('--pesadas=')) || '').slice(10) || 330);
const TAM = [['PageSpeed celular', 412, 823, 1.75], ['PageSpeed computadora', 1350, 940, 1], ['iPhone', 390, 844, 3], ['Android', 360, 800, 2], ['Tablet', 820, 1180, 2], ['Laptop', 1905, 910, 1]];
const nav = await chromium.launch({ channel: 'msedge' }); let avisos = 0, revisadas = 0, topes = 0;
for (const base of bases) {
  const sm = await (await fetch(base + '/sitemap-0.xml')).text().catch(() => '');
  let rutas = [...sm.matchAll(/<loc>https?:\/\/[^/]+([^<]*)<\/loc>/g)].map((m) => m[1] || '/');
  if (solo) rutas = [solo];
  console.log('\n══ ' + base + ' · ' + rutas.length + ' páginas');
  const visto = new Map();
  for (const [nombre, w, h, dpr] of TAM) {
    for (const r of rutas) {
      // cada página con la memoria vacía: si no, el navegador aprovecha archivos más grandes de la página anterior
      const ctx = await nav.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, isMobile: w < 900, hasTouch: w < 900, bypassCSP: true });
      const p = await ctx.newPage();
      await p.goto(base + r, { waitUntil: 'load' });
      await p.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * 0.7) { scrollTo(0, y); await new Promise((s) => setTimeout(s, 90)); } scrollTo(0, 0); await new Promise((s) => setTimeout(s, 500)); });
      const fotos = await p.evaluate(() => {
        const peso = new Map(performance.getEntriesByType('resource').map((e) => [e.name, e.encodedBodySize || e.transferSize]));
        return [...document.images].filter((i) => i.currentSrc && i.naturalWidth && !i.closest('dialog') && !/\.svg|^data:/.test(i.currentSrc)).map((i) => {
          const c = i.getBoundingClientRect(), est = getComputedStyle(i), aqui = new URL(i.currentSrc).pathname;
          // el juego de archivos del que salió el elegido (el del <source> que aplicó o el de la propia imagen)
          const juegos = [...(i.closest('picture')?.querySelectorAll('source') || [])].map((s) => s.srcset).concat(i.srcset || '');
          const juego = juegos.find((s) => s.includes(aqui)) || '';
          const anchos = juego.split(',').map((e) => e.trim().split(/\s+/)).filter((e) => /w$/.test(e[1] || '')).map((e) => ({ u: e[0], w: parseInt(e[1]) }));
          const elegido = anchos.find((a) => a.u === aqui)?.w || 0;
          const razon = i.naturalWidth / i.naturalHeight;
          const visible = est.objectFit === 'cover' ? Math.max(c.width, c.height * razon) : c.width;   // ancho al que se pinta la foto
          return { u: aqui.split('/').pop(), kb: Math.round((peso.get(i.currentSrc) || 0) / 1024), elegido, anchos: anchos.map((a) => a.w).sort((a, b) => a - b), visible: Math.round(visible), cw: Math.round(c.width), ch: Math.round(c.height), alt: i.alt.slice(0, 40), sizes: i.sizes || i.closest('picture')?.querySelector('source')?.sizes || '' };
        });
      });
      // Un mismo archivo usado en dos sitios de la página se descarga una vez, para el uso más grande: los demás
      // usos lo aprovechan aunque les sobre (no es desperdicio). Solo se juzga el uso que justificó la descarga.
      const mayor = new Map(); for (const f of fotos) mayor.set(f.u, Math.max(mayor.get(f.u) || 0, f.visible));
      for (const f of fotos) {
        if (f.cw < 8 || f.visible < mayor.get(f.u)) continue; revisadas++;
        // de 2 puntos por píxel en adelante no se exige más: una foto a 2× ya se ve nítida en una pantalla de 3×
        const hace = Math.round(f.visible * Math.min(dpr, 2)), tipo = (f.u.match(/\.(\w+)$/) || [])[1], motivos = [];
        if (f.elegido && f.anchos.length > 1) {
          const justo = f.anchos.find((a) => a >= hace) || f.anchos[f.anchos.length - 1];
          if (f.elegido > justo && f.elegido > hace * 1.5 && f.kb > 20) motivos.push(`DE MÁS: bajó el de ${f.elegido} px y bastaba el de ${justo} (se pinta a ${hace} px)`);
          const pantalla = f.cw >= w * 0.95 && f.ch >= h * 0.9;   // llena la pantalla: portada
          if (f.elegido < justo && f.elegido < hace * (dpr > 1 ? 0.62 : 0.87)) { if (pantalla && w < 900 && f.elegido >= f.visible * 0.55) topes++; else motivos.push(`DE MENOS: bajó el de ${f.elegido} px y hacía falta el de ${justo} (se pinta a ${hace} px)`); }
        }
        if (/jpe?g|png/.test(tipo) && f.kb > 40) motivos.push('formato ' + tipo);
        if (f.kb > PESADA) motivos.push('pesa ' + f.kb + ' KB');
        if (!motivos.length) continue;
        const k = nombre + ' · ' + f.u.replace(/\.[\w-]{8}_[\w-]+(\.\w+)$/, '$1') + ' · ' + motivos.join('; ');
        const e = visto.get(k) || { pag: new Set(), f }; e.pag.add(r); visto.set(k, e);
      }
      await ctx.close();
    }
  }
  for (const [k, v] of [...visto].sort()) { avisos++; console.log(`  ${k}\n      ${v.f.kb} KB · caja ${v.f.cw}×${v.f.ch} · sizes="${v.f.sizes}" · «${v.f.alt}» · ${[...v.pag].slice(0, 4).join(' ')}${v.pag.size > 4 ? ' +' + (v.pag.size - 4) : ''}`); }
}
await nav.close();
console.log(`\n${revisadas} imágenes revisadas · ` + (avisos ? `${avisos} avisos` : 'todas llegan del tamaño justo') + (topes ? ` · ${topes} portadas apaisadas en celular con tope a propósito (se pintan a más de 2 pantallas de ancho)` : ''));
