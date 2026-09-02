import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const rootDir = fileURLToPath(new URL('.', import.meta.url));
const include = (name) => readFileSync(resolve(rootDir, `partials/${name}.html`), 'utf8');

const htmlIncludes = () => ({
  name: 'connect-html-includes',
  transformIndexHtml: {
    order: 'pre',
    handler(html) {
      return html.replace(/<!-- @include:([\w-]+) -->/g, (_, name) => include(name));
    },
  },
});

export default defineConfig({
  plugins: [htmlIncludes()],
  base: '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        home: resolve(rootDir, 'index.html'),
        about: resolve(rootDir, 'about/index.html'),
        service: resolve(rootDir, 'service/index.html'),
        facility: resolve(rootDir, 'service/facility/index.html'),
        energy: resolve(rootDir, 'service/energy/index.html'),
        solar: resolve(rootDir, 'service/solar/index.html'),
        support: resolve(rootDir, 'service/support/index.html'),
        humanResources: resolve(rootDir, 'service/human-resources/index.html'),
        lifestyle: resolve(rootDir, 'service/lifestyle/index.html'),
        company: resolve(rootDir, 'company/index.html'),
        news: resolve(rootDir, 'news/index.html'),
        contact: resolve(rootDir, 'contact/index.html'),
        privacy: resolve(rootDir, 'privacy/index.html'),
      },
    },
  },
});
