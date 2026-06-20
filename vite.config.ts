/// <reference types="vitest" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import {defineConfig} from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
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
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: ['**/src-tauri/**']
      },
    },
    test: {
      environment: 'jsdom',
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'json-summary', 'html'],
        thresholds: {
          global: {
            lines: 70,
            functions: 75,
            branches: 65,
            statements: 75,
          },
          'src/utils/**': {
            lines: 85,
            functions: 85,
            branches: 85,
            statements: 85,
          },
          'src/hooks/**': {
            lines: 80,
            functions: 80,
            branches: 80,
            statements: 80,
          },
          'src/components/ui/**': {
            lines: 65,
            functions: 65,
            branches: 65,
            statements: 65,
          },
          'src/components/features/**': {
            lines: 50,
            functions: 50,
            branches: 50,
            statements: 50,
          },
        },
      },
    },
  };
});
