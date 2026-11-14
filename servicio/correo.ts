// El correo que recibe el hotel por cada solicitud del formulario de reserva.
//
// Antes era una lista de texto plano con los campos alineados a espacios. Ahora es un correo pensado para leerse en
// tres segundos en el celular de recepción: quién, cuándo y cuántos arriba y en grande; un botón para contestar por
// WhatsApp o llamar con un toque; el mensaje de la persona, y al final el detalle y el folio. Sale en dos versiones
// dentro del mismo correo (con formato y solo texto), para que se lea bien en cualquier programa.
//
// Este archivo solo ARMA el correo (asunto, texto y HTML): no manda nada, y por eso se puede ver sin enviarlo con
// `node scripts/correo-vista.mjs`. Lo manda servicio/worker.ts.
// Todo lo que escribió la persona se escapa antes de ponerlo en el HTML.

export interface Hotel { id: 'qa' | 'la'; nombre: string; dominio: string; color: string; hondo: string; fondo: string; texto: string; texto2: string; borde: string; palapa: string }
export const HOTELES: Record<'qa' | 'la', Hotel> = {
  qa: { id: 'qa', nombre: 'Hotel Quinta Azul', dominio: 'hotelquintaazul.com', color: '#3B4E9C', hondo: '#1D295A', fondo: '#F8F5F0', texto: '#151527', texto2: '#4A4755', borde: '#E1DCD1', palapa: 'Fiesta en la palapa' },
  la: { id: 'la', nombre: 'Hotel Los Arcos Inn', dominio: 'www.hotelarcosinn.com', color: '#EA6C00', hondo: '#4C1E00', fondo: '#F9F5F0', texto: '#20160F', texto2: '#56473D', borde: '#E5DBCE', palapa: 'Reunión en la palapa' },
};

export interface Solicitud {
  id?: number | null; nombre: string; contacto: string;
  fechas: string;                       // como la escribió el formulario («Del viernes… al domingo…» o «Por definir»)
  llegada?: string; salida?: string;    // AAAA-MM-DD, si el formulario las mandó aparte
  personas?: number | null; habitacion?: string; motivo?: string; mensaje?: string;
  recibida_en: string;                  // fecha y hora en ISO
}
export interface Correo { asunto: string; texto: string; html: string; responderA?: string }

const HABITACION: Record<string, string> = { sencilla: 'Habitación sencilla', doble: 'Habitación doble', triple: 'Habitación triple', departamento: 'Departamento con cocina' };
const HAB_CORTA: Record<string, string> = { sencilla: 'Sencilla', doble: 'Doble', triple: 'Triple', departamento: 'Depto.' };
const motivoDe = (h: Hotel): Record<string, string> => ({ hospedaje: 'Descanso', celebracion: h.palapa, negocios: 'Trabajo', consulta: 'Consulta', otro: 'Otro', 'otro-motivo': 'Otro' });

// Un correo no admite renglones de más de 998 caracteres: el texto largo se parte en los espacios (y, si alguien
// pega una tira sin espacios, cada 400).
const partir = (s: string, n = 110) => s.replace(/(\S{400})(?=\S)/g, '$1 ').split('\n').map((l) => l.replace(new RegExp('(.{1,' + n + '})(\\s+|$)', 'g'), '$1\n').trimEnd()).join('\n');
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const unaLinea = (s: string) => s.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
export const esCorreo = (v: string) => /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(v) && v.length <= 254;

/** Una fecha AAAA-MM-DD válida, a mediodía universal para que ningún huso la corra de día. */
const fecha = (iso?: string) => { const m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(iso || ''); if (!m) return null; const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], 12)); return Number.isNaN(+d) || d.getUTCDate() !== +m[3] ? null : d; };
const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('es-MX', { timeZone: 'UTC', ...o });
const F = { larga: f({ weekday: 'long', day: 'numeric', month: 'long' }), mini: f({ day: 'numeric', month: 'short' }), semana: f({ weekday: 'long' }) };
const limpio = (s: string) => s.replace(/[.,]/g, '');
/** «13 nov»: corto para que quepa en una tarjeta del celular (el día de la semana va debajo) */
const diaCorto = (d: Date) => limpio(F.mini.format(d));
const recibida = (iso: string) => { const d = new Date(iso); return Number.isNaN(+d) ? iso : new Intl.DateTimeFormat('es-MX', { timeZone: 'America/Monterrey', weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit', hour12: true }).format(d).replace(',', ''); };

/** Si el contacto es un teléfono, cómo marcarlo, cómo escribirle por WhatsApp y cómo mostrarlo. */
export function telefono(contacto: string): { wa: string; tel: string; bonito: string } | null {
  if (esCorreo(contacto.trim())) return null;
  const d = contacto.replace(/\D/g, '');
  const nac = d.length === 10 ? d : d.length === 12 && d.startsWith('52') ? d.slice(2) : d.length === 13 && d.startsWith('521') ? d.slice(3) : '';
  if (nac) return { wa: '52' + nac, tel: '+52' + nac, bonito: nac.slice(0, 2) + ' ' + nac.slice(2, 6) + ' ' + nac.slice(6) };
  return d.length >= 11 && d.length <= 15 ? { wa: d, tel: '+' + d, bonito: '+' + d } : null;
}

export function armarCorreo(s: Solicitud, h: Hotel): Correo {
  const nombre = unaLinea(s.nombre), contacto = unaLinea(s.contacto), mensaje = (s.mensaje || '').trim(), hayMensaje = !!mensaje && mensaje !== '(sin mensaje)';
  const ll = fecha(s.llegada), sa = fecha(s.salida), noches = ll && sa ? Math.round((+sa - +ll) / 864e5) : 0;
  const personas = s.personas && s.personas > 0 ? s.personas : null;
  const hab = HABITACION[s.habitacion || ''] || '', motivo = motivoDe(h)[s.motivo || ''] || '';
  const tel = telefono(contacto), correo = esCorreo(contacto) ? contacto : '';
  const txtPersonas = personas ? personas + (personas === 1 ? ' persona' : ' personas') : '';
  const txtNoches = noches > 0 ? noches + (noches === 1 ? ' noche' : ' noches') : '';
  // «13 al 15 nov» · «30 nov al 2 dic»
  const rango = ll && sa ? (ll.getUTCMonth() === sa.getUTCMonth() ? ll.getUTCDate() + ' al ' + limpio(F.mini.format(sa)) : limpio(F.mini.format(ll)) + ' al ' + limpio(F.mini.format(sa))) : ll ? 'desde el ' + limpio(F.mini.format(ll)) : '';
  const cuando = ll && sa ? 'Del ' + limpio(F.larga.format(ll)) + ' al ' + limpio(F.larga.format(sa)) : ll ? 'Llegada el ' + limpio(F.larga.format(ll)) : unaLinea(s.fechas || 'Fechas por definir');

  const asunto = unaLinea(['Solicitud de reserva', nombre, rango, txtPersonas].filter(Boolean).join(' · ')).slice(0, 150);
  const folio = s.id ? '#' + s.id : '';
  const primerNombre = nombre.split(' ')[0];
  const saludo = 'Hola ' + primerNombre + ', te escribimos del ' + h.nombre + ' por tu solicitud' + (ll && sa ? ' del ' + limpio(F.larga.format(ll)) + ' al ' + limpio(F.larga.format(sa)) : '') + (txtPersonas ? ' para ' + txtPersonas : '') + '.';
  const urlWa = tel ? 'https://wa.me/' + tel.wa + '?text=' + encodeURIComponent(saludo) : '';
  const urlCorreo = correo ? 'mailto:' + correo + '?subject=' + encodeURIComponent('Tu solicitud de reserva en ' + h.nombre) + '&body=' + encodeURIComponent(saludo + '\n\n') : '';

  // ── Solo texto
  const fila = (a: string, b: string) => (b ? (a + ':').padEnd(12) + b : '');
  const texto = [
    'NUEVA SOLICITUD DE RESERVA · ' + h.nombre, '',
    nombre, fila(tel ? 'Teléfono' : correo ? 'Correo' : 'Contacto', tel ? tel.bonito : contacto), '',
    ll ? fila('Llegada', limpio(F.larga.format(ll))) : fila('Fechas', unaLinea(s.fechas || 'por definir')),
    sa ? fila('Salida', limpio(F.larga.format(sa)) + (txtNoches ? ' (' + txtNoches + ')' : '')) : '',
    fila('Personas', personas ? String(personas) : ''), fila('Habitación', hab), fila('Motivo', motivo),
    hayMensaje ? '\nMensaje:\n' + partir(mensaje, 76) : '', '',
    urlWa ? 'Responder por WhatsApp: ' + urlWa : '', tel ? 'Llamar: ' + tel.tel : '', correo ? 'Responder por correo: ' + correo : '', '',
    '—', ['Recibida el ' + recibida(s.recibida_en), folio && 'folio ' + folio, 'formulario de ' + h.dominio].filter(Boolean).join(' · '),
  ].filter((l, i, a) => l !== '' || (i > 0 && a[i - 1] !== '')).join('\n').trim() + '\n';

  // ── Con formato (tablas y estilos en línea: es lo que entienden los programas de correo)
  const sans = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif", serif = "Georgia,'Times New Roman',serif";
  const dato = (rotulo: string, valor: string, sub = '', ancho = '') => `<td valign="top"${ancho ? ' width="' + ancho + '"' : ''} style="padding:13px 12px 12px;border:1px solid ${h.borde};border-radius:12px;background:${h.fondo};">
          <div style="font:600 11px/1.2 ${sans};letter-spacing:.08em;text-transform:uppercase;color:${h.texto2};">${rotulo}</div>
          <div style="margin-top:6px;font:400 22px/1.15 ${serif};color:${h.texto};">${esc(valor)}</div>${sub ? `
          <div style="margin-top:3px;font:400 13px/1.3 ${sans};color:${h.texto2};">${esc(sub)}</div>` : ''}
        </td>`;
  const hueco = '<td width="10" style="font-size:0;line-height:0;">&nbsp;</td>';
  // las tarjetas de fecha miden lo mismo (si no, la más angosta parte «13 nov» en dos renglones)
  const celdas: [string, string, string][] = [
    ll ? ['Llegada', diaCorto(ll), F.semana.format(ll)] : ['Fechas', unaLinea(s.fechas || 'Por definir').slice(0, 60), ''],
    ...(sa ? [['Salida', diaCorto(sa), F.semana.format(sa) + (txtNoches ? ' · ' + txtNoches : '')] as [string, string, string]] : []),
    ...(personas ? [['Personas', String(personas), HAB_CORTA[s.habitacion || ''] || ''] as [string, string, string]] : []),
  ];
  const datos = celdas.map(([a, b, c]) => dato(a, b, c, ll && sa && celdas.length === 3 ? '31%' : '')).join(hueco);
  const boton = (href: string, t: string, lleno: boolean) => `<a href="${esc(href)}" style="display:inline-block;margin:0 8px 8px 0;padding:13px 22px;border-radius:999px;font:600 15px/1 ${sans};text-decoration:none;${lleno ? `background:${h.color};color:#FFFFFF;border:1px solid ${h.color};` : `background:#FFFFFF;color:${h.texto};border:1px solid ${h.borde};`}">${esc(t)}</a>`;
  const botones = [urlWa && boton(urlWa, 'Responder por WhatsApp', true), tel && boton('tel:' + tel.tel, 'Llamar al ' + tel.bonito, false), urlCorreo && boton(urlCorreo, 'Responder por correo', true)].filter(Boolean).join('');
  const linea = (a: string, b: string) => (b ? `<tr><td style="padding:9px 0;border-top:1px solid ${h.borde};font:400 13px/1.4 ${sans};color:${h.texto2};" width="34%">${a}</td><td style="padding:9px 0;border-top:1px solid ${h.borde};font:500 14px/1.4 ${sans};color:${h.texto};">${esc(b)}</td></tr>` : '');
  const previa = unaLinea([cuando, txtPersonas, hab, hayMensaje ? '«' + mensaje.slice(0, 90) + '»' : ''].filter(Boolean).join(' · '));

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only">
<title>${esc(asunto)}</title>
</head>
<body style="margin:0;padding:0;background:${h.fondo};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(previa)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${h.fondo};">
  <tr><td align="center" style="padding:24px 12px 32px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#FFFFFF;border:1px solid ${h.borde};border-radius:18px;overflow:hidden;">
      <tr><td style="padding:16px 28px;background:${h.hondo};font:600 12px/1.3 ${sans};letter-spacing:.12em;text-transform:uppercase;color:#FFFFFF;">${esc(h.nombre)} <span style="opacity:.72;">· Nueva solicitud</span></td></tr>
      <tr><td style="padding:28px 28px 4px;">
        <div style="font:400 14px/1.4 ${sans};color:${h.texto2};">Quiere reservar</div>
        <h1 style="margin:4px 0 0;font:400 30px/1.15 ${serif};color:${h.texto};">${esc(nombre)}</h1>
      </td></tr>
      <tr><td style="padding:18px 28px 2px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr>
        ${datos}
        </tr></table>
      </td></tr>${botones ? `
      <tr><td style="padding:18px 28px 0;">${botones}</td></tr>` : ''}${hayMensaje ? `
      <tr><td style="padding:14px 28px 0;">
        <div style="font:600 11px/1.2 ${sans};letter-spacing:.08em;text-transform:uppercase;color:${h.texto2};">Su mensaje</div>
        <div style="margin-top:8px;padding:14px 16px;background:${h.fondo};border-radius:12px;font:400 15px/1.55 ${sans};color:${h.texto};">${mensaje.split('\n').map((l) => esc(partir(l))).join('<br>\n')}</div>
      </td></tr>` : ''}
      <tr><td style="padding:22px 28px 6px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          ${linea(tel ? 'Teléfono' : correo ? 'Correo' : 'Contacto', tel ? tel.bonito : contacto)}${linea('Fechas', ll ? cuando + ' de ' + (sa || ll).getUTCFullYear() : '')}${linea('Habitación', hab)}${linea('Motivo', motivo)}${linea('Recibida', recibida(s.recibida_en))}${linea('Folio', folio)}
        </table>
      </td></tr>
      <tr><td style="padding:14px 28px 26px;font:400 12px/1.5 ${sans};color:${h.texto2};">Llegó por el formulario de ${esc(h.dominio)}${folio ? ' y quedó guardada con el folio ' + folio : ''}.${correo ? ' Si respondes a este correo, le llega directo a la persona.' : ''}</td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>
`;
  // cada etiqueta en su renglón: ningún renglón del HTML se acerca al límite del correo
  return { asunto, texto, html: html.replace(/></g, '>\n<'), ...(correo ? { responderA: correo } : {}) };
}
