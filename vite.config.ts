/// <reference types="vitest" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import tsconfigPaths from 'vite-tsconfig-paths';
import { resolveDevServerConfig } from './config/devServer.ts';

export default defineConfig(() => {
  const devConfig = resolveDevServerConfig();
  const base = process.env.VITE_BASE_URL || '/';

  return {
    base,
    plugins: [
      react(),
      tailwindcss(),
      tsconfigPaths(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'icons/*.png'],
        manifest: {
          name: 'LogTime by OxyFlow',
          short_name: 'TimeLog',
          description: 'Lightweight, local-first work timer and task tracker',
          theme_color: '#090d16',
          background_color: '#090d16',
          display: 'standalone',
          orientation: 'any',
          icons: [
            {
              src: 'icons/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: 'icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        },
      }),
    ],

    server: {
      host: devConfig.host,
      port: devConfig.port,
      strictPort: true,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: ['**/src-tauri/**']
      },
    },
    test: {
      environment: 'jsdom',
      environmentMatchGlobs: [
        ['scripts/**', 'node'],
        ['tests/architecture/**', 'node'],
        ['tests/unit/workflows/rules/**', 'node'],
        ['tests/unit/features/reports/reportCalculator*', 'node'],
      ],
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
