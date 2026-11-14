// Videos de Quinta Azul. Cada hotel solo publica los suyos (ver el alias @videos en astro.config.mjs).
import comoLlegar from './como-llegar.mp4?url';
import xenpal from './xenpal.mp4?url';
export default { 'como-llegar': comoLlegar, xenpal } as Record<string, string>;
