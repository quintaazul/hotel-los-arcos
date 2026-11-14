// Canal RSS del blog (/blog/rss.xml): los artículos del hotel, del más nuevo al más viejo.
import type { APIRoute } from 'astro';
import { H } from '../../data/hoteles';
import { BLOG, articulos, urlArt } from '../../data/blog';
const x = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const GET: APIRoute = async () => {
  const todos = await articulos();
  const cuerpo = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${x(BLOG.titulo + ' | ' + H.nombre)}</title>
<link>${H.sitio}/blog</link>
<description>${x(BLOG.descripcion)}</description>
<language>es-MX</language>
<atom:link href="${H.sitio}/blog/rss.xml" rel="self" type="application/rss+xml" />
${todos.map((a) => `<item><title>${x(a.data.titulo)}</title><link>${H.sitio}${urlArt(a)}</link><guid isPermaLink="true">${H.sitio}${urlArt(a)}</guid><description>${x(a.data.descripcion)}</description><pubDate>${a.data.publicado.toUTCString()}</pubDate></item>`).join('\n')}
</channel>
</rss>
`;
  return new Response(cuerpo, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
