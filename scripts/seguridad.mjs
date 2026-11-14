// Revisión de seguridad de un sitio servido (local o publicado). Comprueba, sin enviar nada a nadie:
//   1. que cada tipo de respuesta (página, 404, archivo, video, formulario) traiga las cabeceras de seguridad;
//   2. que la política de contenido no bloquee nada propio: abre TODAS las páginas en computadora y celular, usa el
//      menú, el calendario, el detalle de habitación, el visor de fotos y el video, y cuenta los bloqueos;
//   3. que las páginas no pidan nada a otros dominios, no pongan cookies y no mezclen contenido sin cifrar;
//   4. que el servicio del formulario rechace lo que debe (otro origen, otro método, otro formato).
// Uso: node scripts/seguridad.mjs <url-base> [url-base-2]
const { chromium } = await import('./_pw.mjs');
const bases = process.argv.slice(2).filter((a) => !a.startsWith('--'));
let fallas = 0;
const ok = (c, que, d = '') => { if (!c) fallas++; console.log((c ? '  ✓ ' : '  ✗ ') + que + (d ? ' · ' + d : '')); };
const NECESARIAS = ['x-content-type-options', 'x-frame-options', 'referrer-policy', 'permissions-policy'];
const nav = await chromium.launch({ channel: 'msedge' });

for (const base of bases) {
  console.log('\n══ ' + base);
  const local = /127\.0\.0\.1|localhost/.test(base), https = base.startsWith('https:');
  const sm = await (await fetch(base + '/sitemap-0.xml')).text().catch(() => '');
  let rutas = [...sm.matchAll(/<loc>https?:\/\/[^/]+([^<]*)<\/loc>/g)].map((m) => m[1] || '/');
  if (!rutas.length) { const inicio = await (await fetch(base + '/')).text(); rutas = [...new Set(['/', ...[...inicio.matchAll(/href="(\/[a-z0-9/-]*)"/g)].map((m) => m[1])])].filter((r) => !/^\/(_astro|video)\//.test(r)); }
  const inicio = await (await fetch(base + '/')).text();
  const unArchivo = (inicio.match(/\/_astro\/[^"' )]+\.(?:js|woff2|avif|webp|png|jpg)/) || [])[0];
  const pagVideo = rutas.find((r) => /ubicacion/.test(r)) || '/';
  const unVideo = ((await (await fetch(base + pagVideo)).text()).match(/\/video\/[^"']+\.mp4/) || [])[0];

  // 1. Cabeceras por tipo de respuesta
  console.log('— Cabeceras');
  const mira = async (nombre, url, opciones = {}, conCsp = true) => {
    const r = await fetch(base + url, { redirect: 'manual', ...opciones }); await r.body?.cancel();
    const faltan = NECESARIAS.filter((c) => !r.headers.get(c)); if (https && !local && !r.headers.get('strict-transport-security')) faltan.push('strict-transport-security');
    const csp = r.headers.get('content-security-policy') || ''; if (conCsp && !csp) faltan.push('content-security-policy');
    ok(!faltan.length, `${nombre} (${r.status})`, faltan.length ? 'faltan: ' + faltan.join(', ') : ''); return { r, csp };
  };
  const { csp } = await mira('Página de inicio', '/');
  await mira('Página interior', rutas.find((r) => r !== '/') || '/');
  await mira('Página que no existe', '/no-existe-' + Date.now());
  if (unArchivo) await mira('Archivo (' + unArchivo.split('.').pop() + ')', unArchivo);
  if (unVideo) await mira('Video, por tramo', unVideo, { headers: { Range: 'bytes=0-99' } }, false);
  ok(/default-src 'self'/.test(csp) && /object-src 'none'/.test(csp) && /frame-ancestors 'none'/.test(csp) && /base-uri 'self'/.test(csp) && /form-action 'self'/.test(csp), 'La política de contenido cierra lo básico (solo el propio sitio, sin objetos, sin marcos ajenos, formularios solo al sitio)');
  const guiones = (csp.match(/script-src([^;]*)/) || [])[1] || '';
  ok(!/unsafe-inline|unsafe-eval|\*|data:|http:/.test(guiones), 'Para código no hay comodines ni permisos abiertos', guiones.trim().replace(/'sha256-[^']+'/g, '(huella)'));

  // 2. Servicio del formulario
  console.log('— Formulario');
  const api = base + '/api/contacto';
  const g = await fetch(api); await g.body?.cancel();
  if (g.status === 404 && local) console.log('    (el servidor local no tiene servicio de formulario: estas pruebas valen en la copia publicada)');
  else {
    ok(g.status === 405, 'Solo acepta envíos (un pedido de lectura da 405)', 'dio ' + g.status);
    const fd = () => { const d = new FormData(); d.set('nombre', 'Prueba de seguridad'); d.set('contacto', '8100000000'); d.set('fechas', 'Por definir'); d.set('mensaje', 'prueba'); d.set('privacidad', 'si'); return d; };
    const ajeno = await fetch(api, { method: 'POST', body: fd(), headers: { Origin: 'https://sitio-ajeno.example', 'Sec-Fetch-Site': 'cross-site' } }); const ja = await ajeno.json().catch(() => ({}));
    ok(ajeno.status === 403 || ja.prueba === true, 'Un envío desde otro sitio se rechaza', ajeno.status + (ja.prueba ? ' (servicio de prueba: no guarda ni envía nada)' : ''));
    const raro = await fetch(api, { method: 'POST', body: '{"nombre":"x"}', headers: { 'Content-Type': 'application/json' } }); await raro.body?.cancel();
    ok(raro.status >= 400 && raro.status < 500, 'Un envío en otro formato se rechaza', 'dio ' + raro.status);
    ok(!!g.headers.get('x-content-type-options') && /default-src 'none'/.test(g.headers.get('content-security-policy') || ''), 'Sus respuestas traen cabeceras de seguridad y no pueden pintarse como página');
  }

  // 3. Las páginas en el navegador: bloqueos de la política, pedidos a otros dominios, cookies
  console.log('— Páginas en el navegador');
  const host = new URL(base).host; const bloqueos = new Map(), ajenos = new Map(), sinCifrar = new Set(); let cookies = 0, paginas = 0;
  for (const [w, h] of [[1905, 910], [430, 932]]) {
    const ctx = await nav.newContext({ viewport: { width: w, height: h }, isMobile: w < 800, hasTouch: w < 800 });
    await ctx.addInitScript(() => { window.__csp = []; document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(e.violatedDirective + ' ← ' + (e.blockedURI || 'en línea') + (e.sourceFile ? ' @ ' + e.sourceFile.split('/').pop() + ':' + e.lineNumber : ''))); window.open = () => null; });
    const p = await ctx.newPage();
    p.on('request', (q) => { const u = new URL(q.url()); if (u.protocol === 'data:' || u.protocol === 'blob:') return; if (u.host !== host) ajenos.set(u.host, (ajenos.get(u.host) || 0) + 1); if (https && u.protocol === 'http:') sinCifrar.add(q.url()); });
    p.on('console', (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) bloqueos.set(m.text().slice(0, 200), 1); });
    const junta = async (r) => { for (const b of await p.evaluate(() => window.__csp.splice(0))) bloqueos.set(b, r); };
    for (const r of [...rutas, '/no-existe']) {
      await p.goto(base + r, { waitUntil: 'load' }); await p.waitForTimeout(250); paginas++;
      // bajar toda la página (carga diferida, animaciones) y usar lo que haya
      await p.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * 0.8) { scrollTo(0, y); await new Promise((s) => setTimeout(s, 60)); } scrollTo(0, 0); });
      const toca = async (sel) => { const e = p.locator(sel).first(); if (await e.count() && await e.isVisible().catch(() => false)) { await e.click({ timeout: 1500 }).catch(() => {}); await p.waitForTimeout(250); return true; } return false; };
      if (await toca('.menu-btn')) await toca('.menu-btn, [data-cerrar-menu]');
      if (await toca('[data-fechas]')) await p.keyboard.press('Escape');
      if (await toca('.habs-lista [data-detalle], .hab-movil [data-detalle]')) { await p.keyboard.press('Escape'); await toca('[data-cerrar-cajon]'); }
      if (await toca('.foto-btn')) await p.keyboard.press('Escape');
      if (await toca('[data-v="iniciar"]')) { await p.waitForTimeout(700); await toca('[data-v="pausa"]'); }
      await toca('.segmento button[data-personas="3"]');
      await junta(r);
      cookies += (await ctx.cookies()).length + (await p.evaluate(() => document.cookie.length ? 1 : 0));
    }
    await ctx.close();
  }
  ok(bloqueos.size === 0, `La política de contenido no bloquea nada propio (${paginas} páginas abiertas y usadas)`, [...bloqueos.keys()].slice(0, 6).join(' | '));
  ok(ajenos.size === 0, 'Las páginas no piden nada a otros dominios', [...ajenos].map(([k, v]) => k + ' ×' + v).join(', '));
  ok(cookies === 0, 'No se pone ninguna cookie');
  ok(sinCifrar.size === 0, 'Nada se pide sin cifrar', [...sinCifrar].slice(0, 3).join(', '));
  if (https && !local) { const r = await fetch(base.replace('https:', 'http:') + '/', { redirect: 'manual' }).catch(() => null); if (r) { await r.body?.cancel(); ok(r.status >= 300 && r.status < 400 && /^https:/.test(r.headers.get('location') || ''), 'Entrar sin cifrar (http) manda a la versión segura', 'dio ' + r.status); } }
}
await nav.close();
console.log(fallas ? `\n${fallas} comprobaciones de seguridad fallaron` : '\nSeguridad: todo bien');
