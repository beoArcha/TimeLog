/**
 * Drops `undefined` values so optional contract fields are omitted rather than serialized.
 * Spread the result in place to keep the key order of the Rust struct declaration.
 */
export function definedOnly<T extends object>(fields: T): Partial<T> {
  return Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined)) as Partial<T>;
}
