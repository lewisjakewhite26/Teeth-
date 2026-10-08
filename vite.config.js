import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// One self-contained index.html: photos, styles and code all inside. Works offline.
export default defineConfig({
  plugins: [viteSingleFile()],
  base: './',
  build: { assetsInlineLimit: 100000000, cssCodeSplit: false },
});
