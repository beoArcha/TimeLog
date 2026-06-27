/// <reference types="vitest" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        '@features': path.resolve(__dirname, './src/features'),
        '@layouts': path.resolve(__dirname, './src/layouts'),
        '@plugins': path.resolve(__dirname, './src/plugins'),
        '@components': path.resolve(__dirname, './src/components'),
        '@common': path.resolve(__dirname, './src/common'),
        '@bindings': path.resolve(__dirname, './src/bindings'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('scheduler')) {
                return 'react-core';
              }
              if (id.includes('lucide-react')) {
                return 'lucide';
              }
              if (id.includes('motion') || id.includes('framer-motion')) {
                return 'motion';
              }
              if (id.includes('@google/genai')) {
                return 'genai';
              }
              return 'vendor';
            }
          }
        }
      }
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: ['**/src-tauri/**']
      },
    },
    test: {
      environment: 'jsdom',
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'json-summary', 'html'],
        exclude: [
          'node_modules/**',
          'dist/**',
          '.git/**',
          '.vscode/**',
          'src/bindings/**',
          'src-tauri/**',
          'src/App.tsx',
          'src/components/ui/**',
          'src/common/i18n/dictionaries'
        ],
        thresholds: {
          global: {
            lines: 40,
            functions: 60,
            branches: 50,
            statements: 60,
          },
          './src/features/**': {
            lines: 60,
            functions: 60,
            branches: 50,
            statements: 60,
          },
          './src/plugins/**': {
            lines: 40,
            functions: 40,
            branches: 40,
            statements: 40,
          },
          './src/common/**': {
            lines: 40,
            functions: 50,
            branches: 40,
            statements: 50,
          },
          './src/layouts/**': {
            lines: 50,
            functions: 40,
            branches: 40,
            statements: 50,
          },
          './src/components/**': {
            lines: 60,
            functions: 45,
            branches: 40,
            statements: 65,
          },
        },
      },
    },
  };
});
