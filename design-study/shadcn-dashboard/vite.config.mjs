import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/postcss';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  plugins: [react()],
  css: { postcss: { plugins: [tailwind()] } },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      cn: fileURLToPath(new URL('./src/cn.ts', import.meta.url)),
    },
  },
  build: {
    license: true,
    rolldownOptions: { input: { dashboard: 'index.html', research: 'research.html' } },
  },
});
