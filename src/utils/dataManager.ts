export class DataManager {
  static getNextId(items: { id: string }[], prefix: string = ''): string {
    let max = 0;
    for (const item of items) {
      const idStr = item.id;
      let numericPart = idStr;
      if (prefix && idStr.startsWith(prefix)) {
        numericPart = idStr.substring(prefix.length);
      } else if (!prefix) {
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
