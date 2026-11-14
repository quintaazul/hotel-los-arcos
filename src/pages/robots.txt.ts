import type { APIRoute } from 'astro';

// Abierto a todos los buscadores. Los rastreadores de búsqueda de los asistentes de IA van además por su nombre: cada
// proveedor dice que, si se bloquea el suyo, el sitio deja de salir en sus respuestas (OpenAI, Anthropic, Perplexity,
// Apple, Google). También se permiten los de entrenamiento (GPTBot, ClaudeBot…): al hotel le conviene que lo conozcan.
// Ojo en el sitio publicado: en el panel de Cloudflare la opción de bloquear bots de IA debe quedar en «permitir»,
// y el robots.txt administrado por Cloudflare no debe sustituir a este.
const BUSQUEDA_IA = ['OAI-SearchBot', 'ChatGPT-User', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User', 'Applebot', 'Google-Extended', 'GPTBot', 'ClaudeBot', 'Applebot-Extended'];
export const GET: APIRoute = ({ site }) => new Response(
  'User-agent: *\nAllow: /\n\n' + BUSQUEDA_IA.map((b) => 'User-agent: ' + b + '\nAllow: /\n').join('\n') + '\nSitemap: ' + new URL('/sitemap-index.xml', site).href + '\n',
  { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
