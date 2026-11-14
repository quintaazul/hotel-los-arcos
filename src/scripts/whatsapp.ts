// WhatsApp: lo que la persona ya eligió en la página viaja en todos los mensajes.
//
// Hay dos selecciones y las dos duran lo que dura la visita (sessionStorage), de una página a otra:
//   · la estancia: llegada, salida y huéspedes (barra de reservas de la portada, comparador de habitaciones y
//     formulario de Contacto);
//   · la fiesta: fecha, personas y motivo (formulario «Cotiza» de Celebraciones).
// Todo enlace que escribe por WhatsApp lleva lo elegido debajo de su frase, en renglones cortos que el hotel lee de un
// vistazo: quien eligió fechas en la portada y después toca «Reservar esta» en una habitación, el botón del menú o el
// flotante, manda las mismas fechas. Lo que no eligió no se inventa: las fechas de muestra con que arranca la barra no
// cuentan hasta que las toca o consulta con ellas.
//
// Qué lleva cada enlace se decide por su frase, no por una marca en la plantilla (así un enlace nuevo ya queda cubierto):
// si habla de la palapa, los datos de la fiesta; si reserva o cotiza hospedaje, los de la estancia; una duda, nada.
export interface Estancia { ll?: number; sa?: number; ad?: number; ni?: number; mas?: boolean }
export interface Fiesta { f?: number; p?: number; tipo?: string }

const leer = <T>(k: string): T => { try { return JSON.parse(sessionStorage.getItem(k) || '{}') as T; } catch { return {} as T; } };
const guardar = (k: string, v: unknown) => { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento: vale solo en esta página */ } };
const limpia = <T extends object>(o: T): T => { for (const k of Object.keys(o) as (keyof T)[]) if (o[k] === undefined || o[k] === null || o[k] === '') delete o[k]; return o; };
const HOY = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return +d; })();

let est = leer<Estancia>('estancia'), fie = leer<Fiesta>('fiesta');
if (est.ll && est.ll < HOY) { delete est.ll; delete est.sa; }   // una fecha que ya pasó no se manda
if (fie.f && fie.f < HOY) delete fie.f;

export const estancia = () => est;
export const fiesta = () => fie;
/** Guarda lo que la persona acaba de elegir de su estancia. `origen` dice quién avisa, para que no se conteste a sí mismo. */
export function ponerEstancia(cambio: Estancia, origen = '') {
  est = limpia({ ...est, ...cambio }); if (!est.ll) delete est.sa;
  guardar('estancia', est); refrescar();
  document.dispatchEvent(new CustomEvent('estancia', { detail: { estancia: est, origen } }));
}
export function ponerFiesta(cambio: Fiesta, origen = '') {
  fie = limpia({ ...fie, ...cambio });
  guardar('fiesta', fie); refrescar();
  document.dispatchEvent(new CustomEvent('fiesta', { detail: { fiesta: fie, origen } }));
}

const fmt = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
/** «viernes 13 de noviembre» */
export const diaLargo = (t: number) => fmt.format(new Date(t)).replace(',', '');
export const txtHuespedes = (ad: number, ni = 0, mas = false) =>
  mas ? ad + ' personas o más' : ad + (ad === 1 ? ' adulto' : ' adultos') + (ni ? ' y ' + ni + (ni === 1 ? ' niño' : ' niños') : '');

/** Los renglones de la estancia: solo lo que se eligió. */
export function renglonesEstancia(e: Estancia = est): string[] {
  const l: string[] = [];
  if (e.ll) l.push('Llegada: ' + diaLargo(e.ll));
  if (e.ll && e.sa) { const n = Math.round((e.sa - e.ll) / 864e5); l.push('Salida: ' + diaLargo(e.sa) + ' (' + n + (n === 1 ? ' noche' : ' noches') + ')'); }
  if (e.ad) l.push('Huéspedes: ' + txtHuespedes(e.ad, e.ni, e.mas));
  return l;
}
export function renglonesFiesta(f: Fiesta = fie, conMotivo = true): string[] {
  const l: string[] = [];
  if (f.f) l.push('Fecha: ' + diaLargo(f.f));
  if (f.p) l.push('Personas: ' + f.p);
  if (conMotivo && f.tipo) l.push('Motivo: ' + f.tipo);
  return l;
}
/** Una frase y, debajo, sus renglones. */
export const conRenglones = (frase: string, renglones: string[]) => (renglones.length ? frase.replace(/[\s.]+$/, '') + (/[?!]$/.test(frase.trim()) ? '' : '.') + '\n' + renglones.join('\n') : frase);
/** El mensaje completo de un enlace a partir de su frase. */
export function mensaje(frase: string): string {
  if (/palapa/i.test(frase)) return conRenglones(frase, renglonesFiesta(fie, /cotizar (una fiesta|una reunión|la palapa)/i.test(frase)));   // si la frase ya dice qué se celebra, el motivo no se repite
  if (/reservar|cotizar/i.test(frase)) return conRenglones(frase, renglonesEstancia());
  return frase;
}
export const enlace = (numero: string, texto: string) => 'https://wa.me/' + numero + '?text=' + encodeURIComponent(texto);
export const abrir = (numero: string, texto: string) => window.open(enlace(numero, texto), '_blank', 'noopener');

const SEL = 'a[href*="wa.me/"]:not([data-form-wa])';
function poner(a: HTMLAnchorElement) {
  const u = new URL(a.href), frase = (a.dataset.waFrase ??= u.searchParams.get('text') || '');
  a.href = enlace(u.pathname.replace(/\D/g, ''), mensaje(frase));
}
/** Pone al día todos los enlaces de la página. */
export function refrescar(raiz: ParentNode = document) { raiz.querySelectorAll<HTMLAnchorElement>(SEL).forEach(poner); }

if (Object.keys(est).length || Object.keys(fie).length) refrescar();
// Los enlaces que nacen después (el detalle de una habitación se arma al abrirlo) se ponen al día al tocarlos
document.addEventListener('click', (e) => { const a = (e.target as Element | null)?.closest?.(SEL) as HTMLAnchorElement | null; if (a) poner(a); }, true);
