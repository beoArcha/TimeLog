const memoryFallback = new Map<string, string>();

function getBrowserStorage(): Storage | null {
  try {
    if (typeof window === 'undefined') {
      return null;
    }
    return window.localStorage;
  } catch {
    return null;
  }
}

export function safeStorageGetItem(key: string): string | null {
  const storage = getBrowserStorage();
  if (!storage) {
    return memoryFallback.get(key) ?? null;
  }
  try {
    return storage.getItem(key);
  } catch {
    return memoryFallback.get(key) ?? null;
  }
}

export function safeStorageSetItem(key: string, value: string): void {
  const storage = getBrowserStorage();
  if (!storage) {
    memoryFallback.set(key, value);
    return;
  }
  storage.setItem(key, value);
}

export function safeStorageRemoveItem(key: string): void {
  const storage = getBrowserStorage();
  if (!storage) {
    memoryFallback.delete(key);
    return;
  }
  try {
    storage.removeItem(key);
  } catch {
    memoryFallback.delete(key);
  }
}
