import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import fs from 'fs';

// Product photos are referenced by URL (/src/assets/images/...), so copy them into
// the production build too. Without this they only show up in `npm run dev`.
const copyProductImages = () => ({
  name: 'copy-product-images',
  apply: 'build' as const,
  closeBundle() {
    const from = path.resolve(__dirname, 'src/assets/images');
    const to = path.resolve(__dirname, 'dist/src/assets/images');
    if (fs.existsSync(from)) fs.cpSync(from, to, {recursive: true});
  },
});

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), copyProductImages()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
