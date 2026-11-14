// Arranca el servidor local de un hotel: node scripts/dev.mjs qa | la
import { dev } from 'astro';
const hotel = process.argv[2] === 'la' ? 'la' : 'qa';
process.env.HOTEL = hotel;
await dev({ root: new URL('..', import.meta.url), server: { port: +(process.argv[3] || (hotel === 'la' ? 4312 : 4311)), host: '127.0.0.1' } });
