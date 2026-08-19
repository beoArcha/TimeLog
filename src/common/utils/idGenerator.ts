export function getNextId(items: { id: string }[], prefix: string = ''): string {
  let max = 0;
  for (const item of items) {
    if (item.id && item.id.startsWith(prefix)) {
      const numPart = item.id.slice(prefix.length);
      const parsed = parseInt(numPart, 10);
      if (!isNaN(parsed) && parsed > max) {
        max = parsed;
      }
    }
  }
  return `${prefix}${max + 1}`;
}
