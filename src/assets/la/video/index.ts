// Videos de Los Arcos Inn. Cada hotel solo publica los suyos (ver el alias @videos en astro.config.mjs).
import alberca from './alberca.mp4?url';
import comoLlegar from './como-llegar.mp4?url';
import xenpal from './xenpal.mp4?url';
export default { alberca, 'como-llegar': comoLlegar, xenpal } as Record<string, string>;
