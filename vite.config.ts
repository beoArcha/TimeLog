/// <reference types="vitest" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), tsconfigPaths()],

    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: ['**/src-tauri/**']
      },
    },
    test: {
      environment: 'jsdom',
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        'tests/e2e/**',
        '**/.{idea,git,cache,output,temp}/**',
        '**/{karma,rollup,webpack,vite,vitest}.config.*',
        '**/.stryker-tmp/**',
        '**/.stryker-sandbox/**'
      ],
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
