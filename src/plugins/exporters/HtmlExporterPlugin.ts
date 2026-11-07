import { ExportPayload, IExporterPlugin } from '../contracts/IExporterPlugin';

/**
 * Escapes characters with special meaning in HTML to prevent XSS / broken markup.
 */
function escapeHtml(input: unknown): string {
  if (input === null || input === undefined) return '';
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export class HtmlExporterPlugin implements IExporterPlugin {
  readonly id = 'html-exporter';
  readonly name = 'HTML';
  readonly extension = 'html';
  readonly fileExtension = 'html';
  readonly mimeType = 'text/html;charset=utf-8;';
  readonly iconKey = 'html';

  async export(payload: ExportPayload): Promise<Blob> {
    const projectBreakdownRows = (payload.projectBreakdown ?? [])
      .map(
        (p) => `
        <tr>
          <td><strong>${escapeHtml(p.projectName)}</strong></td>
          <td style="text-align: right;">${p.seconds}s</td>
          <td style="text-align: right;">${p.percentage.toFixed(1)}%</td>
        </tr>`
      )
      .join('\n');

    const breakdownSection =
      payload.projectBreakdown && payload.projectBreakdown.length > 0
        ? `
      <h2>Project Breakdown</h2>
      <table>
        <thead>
          <tr>
            <th>Project</th>
            <th style="text-align: right;">Duration</th>
            <th style="text-align: right;">Share</th>
          </tr>
        </thead>
        <tbody>
          ${projectBreakdownRows}
        </tbody>
      </table>
      `
        : '';

    const entryRows = payload.rows
      .map(
        (row) => `
        <tr>
          <td>${escapeHtml(row.date)}</td>
          <td>${escapeHtml(row.projectName)}</td>
          <td>${escapeHtml(row.taskName)}</td>
          <td>${escapeHtml(row.subtaskName ?? '')}</td>
          <td>${escapeHtml(row.startTime)}</td>
          <td>${escapeHtml(row.endTime)}</td>
          <td style="text-align: right;">${escapeHtml(row.formattedDuration)}</td>
          <td>${escapeHtml(row.note ?? '')}</td>
        </tr>`
      )
      .join('\n');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(payload.title)} — ${escapeHtml(payload.period)}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 2rem;
      background: #f8fafc;
      color: #0f172a;
      line-height: 1.5;
    }
    @media (prefers-color-scheme: dark) {
      body {
        background: #0f172a;
        color: #f8fafc;
      }
      .card {
        background: #1e293b !important;
        border-color: #334155 !important;
      }
      th {
        background: #1e293b !important;
        color: #94a3b8 !important;
      }
      td, th {
        border-color: #334155 !important;
      }
      .badge {
        background: rgba(56, 189, 248, 0.2) !important;
        color: #38bdf8 !important;
      }
    }
    .container {
      max-width: 960px;
      margin: 0 auto;
    }
    .card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 1rem;
      margin-bottom: 1.5rem;
    }
    h1 {
      margin: 0;
      font-size: 1.5rem;
    }
    h2 {
      font-size: 1.15rem;
      margin-top: 2rem;
      margin-bottom: 0.75rem;
    }
    .badge {
      background: #e0f2fe;
      color: #0369a1;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.875rem;
      font-weight: 600;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .stat-box {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1rem;
    }
    .stat-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      opacity: 0.7;
    }
    .stat-value {
      font-size: 1.25rem;
      font-weight: 700;
      margin-top: 0.25rem;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }
    th, td {
      padding: 0.65rem 0.75rem;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }
    th {
      font-weight: 600;
      background: #f1f5f9;
      color: #475569;
    }
    footer {
      margin-top: 2rem;
      text-align: center;
      font-size: 0.75rem;
      opacity: 0.6;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <header>
        <h1>${escapeHtml(payload.title)}</h1>
        <span class="badge">${escapeHtml(payload.period)}</span>
      </header>

      <div class="summary-grid">
        <div class="stat-box">
          <div class="stat-label">Total Duration</div>
          <div class="stat-value">${escapeHtml(payload.formattedTotalDuration)}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Entries Recorded</div>
          <div class="stat-value">${payload.rows.length}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Generated At</div>
          <div class="stat-value" style="font-size: 0.9rem;">${escapeHtml(payload.generatedAt)}</div>
        </div>
      </div>

      ${breakdownSection}

      <h2>Activity Log</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Project</th>
            <th>Task</th>
            <th>Subtask</th>
            <th>Start</th>
            <th>End</th>
            <th style="text-align: right;">Duration</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          ${entryRows}
        </tbody>
      </table>

      <footer>
        Generated by TimeLog
      </footer>
    </div>
  </div>
</body>
</html>`;

    return new Blob([html], { type: this.mimeType });
  }
}
