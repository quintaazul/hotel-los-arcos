// Comportamiento de la interfaz: cabecera, menú, panel de detalle, comparador, copiar enlace, filtros.
const $ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T | null;
const $$ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll(s)] as T[];
import { hayFlota } from './controles';
import { ponerEstancia } from './whatsapp';
const raiz = document.documentElement;

/* Visitas (Cloudflare Web Analytics, sin cookies): solo en el dominio real, nunca en las copias de prueba */
if (raiz.dataset.analitica && /(^|\.)(hotelquintaazul|hotelarcosinn)\.com$/.test(location.hostname)) {
  const s = document.createElement('script'); s.defer = true; s.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  s.setAttribute('data-cf-beacon', JSON.stringify({ token: raiz.dataset.analitica })); document.head.appendChild(s);
}
const lenis = () => (window as any).__lenis as { stop(): void; start(): void } | undefined;

/* Puntos sobre la foto: se abre uno a la vez, con el ratón, con el teclado o al tocarlo; el índice de al lado hace lo mismo */
$$('[data-puntos]').forEach((caja) => {
  const puntos = $$('.punto', caja), filas = $$('[data-ir-punto]', caja);
  const abrir = (li: Element | null) => puntos.forEach((p, i) => { const si = p === li; p.classList.toggle('abierto', si); $('button', p)?.setAttribute('aria-expanded', String(si)); filas[i]?.classList.toggle('activo', si); });
  const de = (e: Event) => { const t = e.target as Element, f = t.closest?.('[data-ir-punto]') as HTMLElement | null; return f ? puntos[+(f.dataset.irPunto || 0)] : t.closest?.('.punto button')?.parentElement || null; };
  caja.addEventListener('click', (e) => { const li = de(e); if (li) abrir(li.classList.contains('abierto') && (e as PointerEvent).pointerType !== 'mouse' ? null : li); });
  caja.addEventListener('pointerover', (e) => { if ((e as PointerEvent).pointerType !== 'mouse') return; const li = de(e); if (li) abrir(li); });
  caja.addEventListener('focusin', (e) => { const li = de(e); if (li && (e.target as Element).matches(':focus-visible')) abrir(li); });
  caja.addEventListener('keydown', (e) => { if ((e as KeyboardEvent).key === 'Escape') abrir(null); });
});

/* Blog: al abrir un artículo, la foto de su tarjeta viaja y se convierte en la foto de la portada (efectos.css) */
document.addEventListener('click', (e) => {
  const a = (e.target as Element).closest?.('a[href^="/blog/"]'); if (!a || /^\/blog\/(tema|pagina)\//.test(a.getAttribute('href') || '')) return;
  $$('.va').forEach((x) => x.classList.remove('va'));
  (a.querySelector('.esencial-foto') || a.closest('.art')?.querySelector('.art-foto') || (a.matches('.pc-in') ? a : null))?.classList.add('va');
});

/* Cabecera: sólida al bajar, se esconde al bajar y vuelve al subir */
const cab = $('#cabecera');
let ultimaY = scrollY;
let tCab = 0, colaCab = 0;
function revisarCabecera() {
  tCab = performance.now();
  if (!cab) return;
  const y = scrollY;
  if (!cab.classList.contains('fija')) cab.classList.toggle('solida', y > 40);
  const abierto = hayFlota() || raiz.classList.contains('con-cajon') || raiz.classList.contains('con-menu');
  if (y > 520 && y > ultimaY + 6 && !abierto) cab.classList.add('oculta');
  else if (y < ultimaY - 6 || y <= 520) cab.classList.remove('oculta');
  ultimaY = y;
}
// Se revisa con el propio aviso de scroll (como mucho cada 60 ms), sin esperar a que el navegador avise de un cuadro
addEventListener('scroll', () => {
  if (performance.now() - tCab > 60) revisarCabecera();
  else if (!colaCab) colaCab = window.setTimeout(() => { colaCab = 0; revisarCabecera(); }, 70);
}, { passive: true });
revisarCabecera();

/* Menú móvil */
const hoja = $('#hoja-menu');
function abrirMenu() {
  hoja?.classList.add('abierta'); raiz.classList.add('con-menu');
  $('#menu-abrir')?.setAttribute('aria-expanded', 'true');
  lenis()?.stop(); raiz.style.overflow = 'hidden';
  setTimeout(() => $('#menu-cerrar')?.focus(), 120);
}
function cerrarMenu(devolver = false) {
  if (!hoja?.classList.contains('abierta')) return;
  hoja.classList.remove('abierta'); raiz.classList.remove('con-menu');
  $('#menu-abrir')?.setAttribute('aria-expanded', 'false');
  lenis()?.start(); raiz.style.overflow = '';
  if (devolver) $('#menu-abrir')?.focus();
}
$('#menu-abrir')?.addEventListener('click', abrirMenu);
$('#menu-cerrar')?.addEventListener('click', () => cerrarMenu(true));
$$('#hoja-menu nav a').forEach((a) => a.addEventListener('click', () => cerrarMenu()));

/* El WhatsApp flotante se esconde donde ya hay un botón grande de reservar: lo decide movimiento.ts, que ya mide
   en cada pasada qué hay en pantalla. */

/* Cinta: botón de pausa */
$$('.cinta-pausa').forEach((b) => b.addEventListener('click', () => {
  const c = b.closest('.cinta')!;
  const p = c.classList.toggle('pausada');
  b.setAttribute('aria-pressed', String(p));
  b.setAttribute('aria-label', p ? 'Reanudar la cinta' : 'Pausar la cinta');
}));

/* Comparador: marca la habitación que conviene */
$$('.segmento[data-sugerencias]').forEach((seg) => {
  const sug = JSON.parse(seg.dataset.sugerencias!) as Record<string, { ids: string[]; texto: string }>;
  const frase = seg.parentElement?.querySelector<HTMLElement>('[data-sugerencia]');
  seg.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest('button[data-personas]') as HTMLElement | null;
    if (!b) return;
    $$('button', seg).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    const s = sug[b.dataset.personas!]; if (!s) return;
    $$('.tabla [data-col]').forEach((c) => c.classList.toggle('sugerida', s.ids.includes(c.dataset.col!)));
    if (frase) frase.textContent = s.texto;
    ponerEstancia({ ad: +b.dataset.personas!, ni: 0, mas: (b.textContent || '').includes('+') }, 'comparador');
  });
});

/* Panel de detalle de habitación */
const cajon = $('#cajon');
let origenCajon: HTMLElement | null = null;
function abrirCajon(id: string, desde: HTMLElement) {
  const tpl = $('#detalle-' + id) as HTMLTemplateElement | null;
  if (!cajon || !tpl) return;
  cajon.replaceChildren(tpl.content.cloneNode(true));
  origenCajon = desde;
  $('#velo')?.classList.add('visible');
  raiz.classList.add('con-cajon');
  lenis()?.stop(); raiz.style.overflow = 'hidden';
  // Se obliga al navegador a tomar nota del estado cerrado y enseguida se abre: la transición corre sin esperar avisos
  void cajon.offsetWidth;
  cajon.classList.add('abierto');
  setTimeout(() => $('[data-cerrar-cajon]', cajon)?.focus(), 90);
  const pista = $('.carrusel-pista', cajon);
  const cuenta = $('[data-car-cuenta]', cajon);
  if (pista && cuenta) {
    const total = pista.children.length;
    pista.addEventListener('scroll', () => { cuenta.textContent = (Math.round(pista.scrollLeft / pista.clientWidth) + 1) + ' de ' + total; }, { passive: true });
  }
}
function cerrarCajon() {
  if (!cajon?.classList.contains('abierto')) return;
  cajon.classList.remove('abierto');
  raiz.classList.remove('con-cajon');
  $('#velo')?.classList.remove('visible');
  lenis()?.start(); raiz.style.overflow = '';
  origenCajon?.focus();
}
document.addEventListener('click', (e) => {
  const t = e.target as HTMLElement;
  const det = t.closest('[data-detalle]') as HTMLElement | null;
  if (det) { abrirCajon(det.dataset.detalle!, det); return; }
  if (t.closest('[data-cerrar-cajon]') || (t.id === 'velo' && cajon?.classList.contains('abierto'))) { cerrarCajon(); return; }
  const car = t.closest('[data-car]') as HTMLElement | null;
  if (car && cajon) { const p = $('.carrusel-pista', cajon)!; p.scrollBy({ left: +car.dataset.car! * p.clientWidth, behavior: 'smooth' }); }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { if (cajon?.classList.contains('abierto')) cerrarCajon(); else cerrarMenu(true); }
  if (e.key === 'Tab' && cajon?.classList.contains('abierto')) {
    const focos = $$('button, a, [tabindex="0"]', cajon);
    const pri = focos[0], ult = focos[focos.length - 1];
    if (e.shiftKey && document.activeElement === pri) { e.preventDefault(); ult.focus(); }
    else if (!e.shiftKey && document.activeElement === ult) { e.preventDefault(); pri.focus(); }
  }
});

/* Copiar enlace de Google Maps */
$$('[data-copiar]').forEach((b) => b.addEventListener('click', async () => {
  const txt = $('[data-copiar-txt]', b);
  try {
    await navigator.clipboard.writeText(b.dataset.copiar!);
    b.classList.add('hecho'); if (txt) txt.textContent = 'Enlace copiado';
    setTimeout(() => { b.classList.remove('hecho'); if (txt) txt.textContent = 'Copiar enlace'; }, 2400);
  } catch { if (txt) txt.textContent = 'No se pudo copiar'; }
}));

/* Filtros del blog */
$$('[data-filtro]').forEach((b) => b.addEventListener('click', () => {
  $$('[data-filtro]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  const cat = b.dataset.filtro!;
  $$('.indice-lista > li').forEach((li) => { li.hidden = !(cat === 'Todo' || li.dataset.cat === cat); });
  (window as any).__refrescarScroll?.();
}));


