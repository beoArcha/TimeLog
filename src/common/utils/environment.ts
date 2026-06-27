export const isDesktopEnvironment = (): boolean => {
  // Tauri sets window.__TAURI_INTERNALS__ in its webview environment.
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
};
