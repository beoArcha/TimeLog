import { TerminalLine } from '../types';

export interface TableHeader {
  label: string;
  width: number;
}

export interface TableRow {
  cells: string[];
  type?: TerminalLine['type'];
}

export interface BarChartItem {
  name: string;
  seconds: number;
  formattedDuration: string;
}

/**
 * Standardized terminal output builder for CLI commands.
 * Provides fluent helpers for status lines, tables, dividers, and ASCII charts.
 */
export class TerminalOutput {
  private readonly lines: TerminalLine[] = [];

  constructor(initialLines: TerminalLine[] = []) {
    this.lines = [...initialLines];
  }

  push(line: TerminalLine): this {
    this.lines.push(line);
    return this;
  }

  info(text: string): this {
    this.lines.push({ text, type: 'info' });
    return this;
  }

  success(text: string): this {
    this.lines.push({ text, type: 'success' });
    return this;
  }

  error(text: string, errorCode?: string, exitCode?: number): this {
    this.lines.push({ text, type: 'error', errorCode, exitCode });
    return this;
  }

  output(text: string): this {
    this.lines.push({ text, type: 'output' });
    return this;
  }

  input(text: string): this {
    this.lines.push({ text, type: 'input' });
    return this;
  }

  empty(): this {
    this.lines.push({ text: '', type: 'output' });
    return this;
  }

  divider(title?: string): this {
    const dividerText = title
      ? `================ ${title} ================`
      : '=======================================================';
    this.lines.push({ text: dividerText, type: 'info' });
    return this;
  }

  table(headers: TableHeader[], rows: TableRow[]): this {
    const topBorder = '┌' + headers.map(h => '─'.repeat(h.width + 2)).join('┬') + '┐';
    const headerRow = '│ ' + headers.map(h => h.label.padEnd(h.width).substring(0, h.width)).join(' │ ') + ' │';
    const midBorder = '├' + headers.map(h => '─'.repeat(h.width + 2)).join('┼') + '┤';
    const bottomBorder = '└' + headers.map(h => '─'.repeat(h.width + 2)).join('┴') + '┘';

    this.lines.push({ text: topBorder, type: 'info' });
    this.lines.push({ text: headerRow, type: 'info' });
    this.lines.push({ text: midBorder, type: 'info' });

    for (const row of rows) {
      const formattedRow = '│ ' + row.cells.map((cell, i) => {
        const w = headers[i]?.width ?? cell.length;
        return cell.padEnd(w).substring(0, w);
      }).join(' │ ') + ' │';
      this.lines.push({ text: formattedRow, type: row.type || 'output' });
    }

    this.lines.push({ text: bottomBorder, type: 'info' });
    return this;
  }

  barChart(items: BarChartItem[], nameWidth = 28, barWidth = 20): this {
    const maxSec = Math.max(...items.map(x => x.seconds), 1);
    for (const item of items) {
      const squaresCount = Math.round((item.seconds / maxSec) * barWidth);
      const bar = '█'.repeat(squaresCount) + '░'.repeat(barWidth - squaresCount);
      const label = item.name.padEnd(nameWidth).substring(0, nameWidth);
      this.lines.push({
        text: `${label} [${bar}] ${item.formattedDuration}`,
        type: 'success'
      });
    }
    return this;
  }

  mergeInto(target: TerminalLine[]): void {
    target.push(...this.lines);
  }

  getLines(): TerminalLine[] {
    return [...this.lines];
  }
}
