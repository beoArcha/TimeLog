export class DataManager {
  /**
   * Generates next sequential ID based on existing items.
   * Eliminates the bug with huge timestamp-based IDs.
   * If prefix is active, searches for numbers following the prefix.
   */
  static getNextId(items: { id: string }[], prefix: string = ''): string {
    let max = 0;
    for (const item of items) {
      const idStr = item.id;
      // Strip prefix if exists and matches
      let numericPart = idStr;
      if (prefix && idStr.startsWith(prefix)) {
        numericPart = idStr.substring(prefix.length);
      } else if (!prefix) {
        // If no prefix, let's just try to match digits
        const match = idStr.match(/\d+/);
        if (match) {
          numericPart = match[0];
        }
      }
      
      const num = parseInt(numericPart, 10);
      if (!isNaN(num) && num > max) {
        max = num;
      }
    }
    return `${prefix}${max + 1}`;
  }
}
