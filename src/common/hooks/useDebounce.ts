import { useState, useEffect } from 'react';

/**
 * Universal hook that debounces a rapidly-changing value by a specified delay in milliseconds.
 *
 * @param value The value to debounce.
 * @param delay Debounce delay in milliseconds. If <= 0, returns value immediately.
 * @returns The debounced value.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    if (delay <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return delay <= 0 ? value : debouncedValue;
}

export default useDebounce;
