// /llms.txt: un resumen en texto del hotel y de sus páginas, para los asistentes de IA que lo lean. Es una propuesta
// todavía experimental (Google dice que no la usa); se agrega porque no cuesta y solo repite datos confirmados del sitio.
import type { APIRoute } from 'astro';
import { H, dinero } from '../data/hoteles';
import { SEO, FAQ } from '../data/textos';
import { BLOG, articulos, urlArt } from '../data/blog';
export const GET: APIRoute = async () => {
  const u = (r: string) => H.sitio + r, la = H.id === 'la';
  const paginas: [string, string, string][] = [
    ['/', 'Inicio', SEO.inicio.description], ['/' + H.rutaHabs, 'Habitaciones', SEO.habitaciones.description],
    ...(la ? [['/departamentos', 'Departamentos', SEO.departamentos.description], ['/empresas', 'Empresas', SEO.empresas.description]] as [string, string, string][] : []),
    ['/celebraciones', la ? 'Palapa techada' : 'Palapa para fiestas', SEO.celebraciones.description], ['/ubicacion', 'Ubicación', SEO.ubicacion.description],
    ['/preguntas-frecuentes', 'Preguntas frecuentes', SEO.faq.description], ['/contacto', 'Contacto y reservas', SEO.contacto.description], ['/blog', 'Blog', BLOG.descripcion],
  ];
  const arts = await articulos();
  const texto = [
    '# ' + H.nombre, '', '> ' + H.descripcion, '',
    '## Datos del hotel', '',
    '- Dirección: ' + H.dir1 + ', ' + H.dir2 + ', México',
    '- Teléfono y WhatsApp: ' + H.telLink + ' (atención todos los días, de 7:00 a 23:00)',
    '- Reservas: directas, por WhatsApp, teléfono o formulario; no hay motor de reservas en línea',
    '- Precios por noche: ' + H.habs.filter((x) => x.precio).map((x) => x.nombre + ' ' + dinero(x.precio as number) + ' MXN').join('; '),
    '- Entrada 14:00, salida 11:00. Alberca abierta hasta las 22:00. Estacionamiento gratis dentro del hotel',
    '- ' + (la ? 'Palapa techada' : 'Palapa para fiestas') + ' para hasta 60 personas; el precio se cotiza por WhatsApp',
    '- No se admiten mascotas', '',
    '## Páginas', '', ...paginas.map(([r, t, d]) => '- [' + t + '](' + u(r) + '): ' + d), '',
    '## Artículos del blog', '', ...arts.map((a) => '- [' + a.data.titulo + '](' + u(urlArt(a)) + '): ' + a.data.resumen), '',
    '## Preguntas frecuentes', '', ...FAQ.flatMap((g) => g.items).map((p) => '- ' + p.q + ' ' + p.a), '',
  ].join('\n');
  return new Response(texto, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
