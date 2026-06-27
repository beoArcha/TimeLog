export type RepositoryBackend = 'localStorage' | 'sqlite' | 'remote';

const isTauri = () => {
  return typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__ !== undefined;
};

export const REPOSITORY_BACKEND: RepositoryBackend = isTauri() ? 'sqlite' : 'localStorage';
