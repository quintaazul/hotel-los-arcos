import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// El sitio vive en www: el apex hace 301 hacia aqui. Los canonical de Webflow
// apuntaban al apex, o sea a una URL que redirige (defecto 4 de la auditoria).
export default defineConfig({
  site: 'https://www.hotelarcosinn.com',
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [sitemap()],
});
