/**
 * Shared constants and configuration tokens for CI test reporting.
 */

export const SUMMARY_MARKER = '<!-- oxyflow-test-coverage-summary -->';

export const COVERAGE_THRESHOLDS = {
  pass: 80,
  warn: 60
};

export const FRONTEND_MODULES = [
  { name: 'src/features/', prefix: 'src/features' },
  { name: 'src/common/', prefix: 'src/common' },
  { name: 'src/plugins/', prefix: 'src/plugins' },
  { name: 'src/components/', prefix: 'src/components' },
  { name: 'src/layouts/', prefix: 'src/layouts' }
];

export const RUST_MODULES = [
  { name: 'src-tauri/src/engine/', token: '/engine/' },
  { name: 'src-tauri/src/repositories/', token: '/repositories/' },
  { name: 'src-tauri/src/persistence/', token: '/persistence/' },
  { name: 'src-tauri/src/cli/', token: '/cli/' },
  { name: 'src-tauri/src/sinks/', token: '/sinks/' },
  { name: 'src-tauri/src/tray/', token: '/tray/' },
  { name: 'src-tauri/src/commands/', token: '/commands/' }
];
