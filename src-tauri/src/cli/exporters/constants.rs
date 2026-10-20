pub const CSV_HEADER_REPORT: &str =
    "Project,Task,Subtask,Duration_Seconds,Duration_Formatted,Percentage";

pub const FORMAT_CSV_ROW: &str = "\"{}\",\"{}\",\"{}\",{},\"{}\",{:.1}\n";
pub const FORMAT_CSV_ROW_NO_SUBTASK: &str = "\"{}\",\"{}\",\"\",{},\"{}\",{:.1}\n";

pub const MSG_EXPORT_SUCCESS: &str = "Exported report to '{}' ({})";
pub const MSG_NO_REPORT_DATA: &str = "No time logs recorded for the selected period.";
pub const ERR_UNSUPPORTED_FORMAT: &str =
    "Format '{}' is not supported. Supported formats are: html, csv, json.";

pub const HTML_ROW_PROJECT: &str = r#"<tr class="project-row">
    <td colspan="3"><strong>📦 {}</strong></td>
    <td>{}</td>
    <td><div class="progress"><div class="bar" style="width: {}%"></div></div> {}%</td>
</tr>"#;

pub const HTML_ROW_TASK: &str = r#"<tr class="task-row">
    <td></td>
    <td colspan="2">📋 {}</td>
    <td>{}</td>
    <td><div class="progress"><div class="bar bar-task" style="width: {}%"></div></div> {}%</td>
</tr>"#;

pub const HTML_ROW_SUBTASK: &str = r#"<tr class="subtask-row">
    <td></td>
    <td></td>
    <td>↳ {}</td>
    <td>{}</td>
    <td><div class="progress"><div class="bar bar-subtask" style="width: {}%"></div></div> {}%</td>
</tr>"#;

pub const HTML_PAGE_TEMPLATE: &str = r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>oXyFlow Work Report — {period}</title>
    <style>
        :root {
            --bg: #0f172a;
            --card: #1e293b;
            --border: #334155;
            --text: #f8fafc;
            --muted: #94a3b8;
            --accent: #38bdf8;
            --accent-task: #818cf8;
            --accent-subtask: #a78bfa;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: var(--bg);
            color: var(--text);
            margin: 0;
            padding: 2rem;
            line-height: 1.5;
        }
        .container {
            max-width: 960px;
            margin: 0 auto;
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 2rem;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
        }
        header {
            border-bottom: 1px solid var(--border);
            padding-bottom: 1.5rem;
            margin-bottom: 1.5rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        h1 {
            margin: 0;
            font-size: 1.5rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .badge {
            background: rgba(56, 189, 248, 0.15);
            color: var(--accent);
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.875rem;
            font-weight: 600;
        }
        .meta-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem;
            margin-bottom: 2rem;
        }
        .meta-card {
            background: rgba(15, 23, 42, 0.6);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 1rem;
        }
        .meta-label {
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--muted);
            margin-bottom: 0.25rem;
        }
        .meta-value {
            font-size: 1.25rem;
            font-weight: 700;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.9375rem;
        }
        th {
            text-align: left;
            padding: 0.75rem 1rem;
            border-bottom: 2px solid var(--border);
            color: var(--muted);
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.75rem;
            letter-spacing: 0.05em;
        }
        td {
            padding: 0.75rem 1rem;
            border-bottom: 1px solid rgba(51, 65, 85, 0.5);
        }
        .project-row {
            background: rgba(56, 189, 248, 0.05);
            font-weight: 600;
        }
        .task-row {
            color: var(--text);
        }
        .subtask-row {
            color: var(--muted);
            font-size: 0.875rem;
        }
        .progress {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 9999px;
            height: 6px;
            width: 80px;
            display: inline-block;
            vertical-align: middle;
            margin-right: 0.5rem;
            overflow: hidden;
        }
        .bar {
            background: var(--accent);
            height: 100%;
        }
        .bar-task {
            background: var(--accent-task);
        }
        .bar-subtask {
            background: var(--accent-subtask);
        }
        footer {
            margin-top: 2rem;
            padding-top: 1rem;
            border-top: 1px solid var(--border);
            text-align: center;
            font-size: 0.75rem;
            color: var(--muted);
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>⚡ oXyFlow Work Report</h1>
            <span class="badge">{period}</span>
        </header>
        <div class="meta-grid">
            <div class="meta-card">
                <div class="meta-label">Total Duration</div>
                <div class="meta-value">{total_time}</div>
            </div>
            <div class="meta-card">
                <div class="meta-label">Projects Tracked</div>
                <div class="meta-value">{project_count}</div>
            </div>
            <div class="meta-card">
                <div class="meta-label">Tasks Recorded</div>
                <div class="meta-value">{task_count}</div>
            </div>
        </div>
        <table>
            <thead>
                <tr>
                    <th colspan="3">Hierarchy</th>
                    <th>Time</th>
                    <th>Share</th>
                </tr>
            </thead>
            <tbody>
{rows}
            </tbody>
        </table>
        <footer>
            Generated automatically by oXyFlow CLI
        </footer>
    </div>
</body>
</html>"#;
