// admin/vite.config.ts
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig(({ mode }) => {
  return {
    base: '/admin/',
    plugins: [react(), tailwindcss()],
    // 移除 define 區塊
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: './_entry.html'
      }
    }
  };
});