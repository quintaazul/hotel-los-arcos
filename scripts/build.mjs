// Construye el sitio estático de un hotel en dist-qa/ o dist-la/ y le escribe sus cabeceras de seguridad (_headers)
import { build } from 'astro';
const hotel = process.argv[2] === 'la' ? 'la' : 'qa';
process.env.HOTEL = hotel;
await build({ root: new URL('..', import.meta.url), outDir: `./dist-${hotel}` });
// cabeceras de seguridad del sitio recién compilado (política de contenido con las huellas de sus guiones)
await import('./cabeceras.mjs');
