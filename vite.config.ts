import { defineConfig, type UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api/booru/konachan': {
        target: 'https://konachan.net',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/booru\/konachan/, ''),
      },
      '/api/booru/safebooru': {
        target: 'https://safebooru.org',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/booru\/safebooru/, ''),
      },
      '/api/booru/yande': {
        target: 'https://yande.re',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/booru\/yande/, ''),
      },
    },
  },
  preview: {
    port: 4173,
    host: true,
    proxy: {
      '/api/booru/konachan': {
        target: 'https://konachan.net',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/booru\/konachan/, ''),
      },
      '/api/booru/safebooru': {
        target: 'https://safebooru.org',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/booru\/safebooru/, ''),
      },
      '/api/booru/yande': {
        target: 'https://yande.re',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/booru\/yande/, ''),
      },
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
} as UserConfig & { test: Record<string, unknown> });
