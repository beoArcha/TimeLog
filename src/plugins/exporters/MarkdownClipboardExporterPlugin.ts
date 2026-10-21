import { ExportPayload, IExporterPlugin } from '../contracts/IExporterPlugin';

/**
 * Formats time log report into a Markdown table.
 * Ideal for pasting into Jira, GitHub, Slack, Notion, or project documentation.
 */
export class MarkdownClipboardExporterPlugin implements IExporterPlugin {
  readonly id = 'markdown-exporter';
  readonly name = 'Markdown (Table & Summary)';
  readonly fileExtension = 'md';
  readonly mimeType = 'text/markdown;charset=utf-8;';

  async export(payload: ExportPayload): Promise<string> {
    const lines: string[] = [];

    lines.push(`# ${payload.title}`);
    lines.push(`> **Period**: ${payload.period} | **Total Time**: ${payload.formattedTotalDuration} | **Generated**: ${payload.generatedAt}`);
    lines.push('');

    if (payload.projectBreakdown && payload.projectBreakdown.length > 0) {
      lines.push('### Project Breakdown');
      lines.push('| Project | Time | Share |');
      lines.push('| :--- | :--- | :--- |');
      for (const item of payload.projectBreakdown) {
        lines.push(`| ${item.projectName} | ${item.seconds}s | ${item.percentage.toFixed(1)}% |`);
      }
      lines.push('');
    }

    lines.push('### Activity Log');
    lines.push('| Date | Project | Task | Start | End | Duration | Note |');
    lines.push('| :--- | :--- | :--- | :--- | :--- | :--- | :--- |');

    for (const row of payload.rows) {
      // Escape pipe characters inside table cells
      const safeProject = row.projectName.replace(/\|/g, '\\|');
      const safeTask = row.taskName.replace(/\|/g, '\\|');
      const safeNote = (row.note ?? '-').replace(/\|/g, '\\|');

      lines.push(
        `| ${row.date} | ${safeProject} | ${safeTask} | ${row.startTime} | ${row.endTime} | ${row.formattedDuration} | ${safeNote} |`
      );
    }

    lines.push('');
    return lines.join('\n');
  }

  /**
   * Helper that copies the formatted markdown directly to the system clipboard.
   */
  async copyToClipboard(payload: ExportPayload): Promise<string> {
    const markdown = await this.export(payload);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(markdown);
    }
    return markdown;
  }
}
