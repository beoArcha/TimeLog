// @ts-check
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  testRunner: 'vitest',
  vitest: {
    configFile: 'vite.config.ts',
  },
  plugins: ['@stryker-mutator/vitest-runner'],
  reporters: ['progress', 'clear-text', 'html'],
  coverageAnalysis: 'perTest',
  tempDirName: '.stryker-sandbox',
  cleanTempDir: 'always',
  ignorePatterns: [
    '.stryker-tmp/**',
    '.stryker-sandbox/**',
    'src-tauri/target/**',
    'dist/**',
    'build/**',
    'coverage/**',
    'reports/**',
  ],
  mutate: [
    'src/features/**/*.ts',
    'src/features/**/*.tsx',
    '!src/features/**/*.d.ts',
    '!src/features/**/types.ts',
  ],
  concurrency: 2,
};
