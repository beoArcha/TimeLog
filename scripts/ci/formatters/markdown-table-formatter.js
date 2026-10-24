/**
 * Reusable Markdown table generator providing aligned columns and deterministic rendering.
 */
export class MarkdownTableFormatter {
  /**
   * @param {string[]} headers Column header titles.
   * @param {Array<':---' | ':---:' | '---:'>} alignments Column text alignments.
   */
  constructor(headers, alignments) {
    this.headers = headers;
    this.alignments = alignments;
    this.rows = [];
  }

  /**
   * Adds a row of cells to the table.
   *
   * @param {Array<string | number>} cells Row values.
   * @returns {this}
   */
  addRow(cells) {
    this.rows.push(cells.map((val) => (val === undefined || val === null ? '' : String(val))));
    return this;
  }

  /**
   * Renders the complete markdown table string.
   *
   * @returns {string} Formatted markdown table lines.
   */
  render() {
    const lines = [];
    lines.push(`| ${this.headers.join(' | ')} |`);
    lines.push(`| ${this.alignments.join(' | ')} |`);

    for (const row of this.rows) {
      lines.push(`| ${row.join(' | ')} |`);
    }

    return lines.join('\n');
  }
}
