use super::constants::{
    HTML_PAGE_TEMPLATE, HTML_ROW_PROJECT, HTML_ROW_SUBTASK, HTML_ROW_TASK, MSG_NO_REPORT_DATA,
};
use super::rows::flatten_project;
use super::sink_io_error;
use crate::cli::error::CliError;
use crate::cli::formatters::{ReportProjectDto, ReportTreeDto};
use std::io::Write;

pub fn write_html<W: Write>(tree: &ReportTreeDto, mut writer: W) -> Result<(), CliError> {
    let html = export_html(tree)?;
    writer
        .write_all(html.as_bytes())
        .map_err(|e| sink_io_error("Failed to write HTML report", e))?;
    Ok(())
}

/// Exports the report tree into a self-contained, responsive HTML5 document.
/// All user-controlled fields (`period`, `project.name`, `task.name`, `subtask.name`,
/// durations, notes) are sanitized and escaped against XSS (CWE-79).
pub fn export_html(tree: &ReportTreeDto) -> Result<String, CliError> {
    let mut project_sections = Vec::new();
    for project in &tree.projects {
        project_sections.push(render_project_section(project)?);
    }

    let rows = if project_sections.is_empty() {
        format!(
            r#"<tr class="empty-row"><td colspan="5" style="text-align: center; color: var(--muted); padding: 2rem;">{}</td></tr>"#,
            escape_html(MSG_NO_REPORT_DATA)
        )
    } else {
        project_sections.join("\n")
    };

    let total_tasks: usize = tree.projects.iter().map(|p| p.tasks.len()).sum();

    Ok(HTML_PAGE_TEMPLATE
        .replace("{period}", &escape_html(&tree.period))
        .replace("{total_time}", &escape_html(&tree.total_formatted))
        .replace("{project_count}", &tree.projects.len().to_string())
        .replace("{task_count}", &total_tasks.to_string())
        .replace("{rows}", &rows))
}

fn render_project_section(project: &ReportProjectDto) -> Result<String, CliError> {
    let project_row = render_project_row(project);
    let project_rows = flatten_project(project)?;

    if project_rows.is_empty() {
        return Ok(project_row);
    }

    let task_rows = project_rows
        .iter()
        .map(|row| match &row.subtask_name {
            None => render_task_row(&row.task_name, &row.duration_formatted, row.percentage),
            Some(subtask_name) => {
                render_subtask_row(subtask_name, &row.duration_formatted, row.percentage)
            }
        })
        .collect::<Vec<_>>()
        .join("\n");

    Ok(format!("{}\n{}", project_row, task_rows))
}

fn render_project_row(project: &ReportProjectDto) -> String {
    let (width_str, pct_str) = format_percentage(project.percentage);
    HTML_ROW_PROJECT
        .replacen("{}", &escape_html(&project.name), 1)
        .replacen("{}", &escape_html(&project.duration_formatted), 1)
        .replacen("{}", &width_str, 1)
        .replacen("{}", &pct_str, 1)
}

fn render_task_row(name: &str, duration_formatted: &str, percentage: f64) -> String {
    let (width_str, pct_str) = format_percentage(percentage);
    HTML_ROW_TASK
        .replacen("{}", &escape_html(name), 1)
        .replacen("{}", &escape_html(duration_formatted), 1)
        .replacen("{}", &width_str, 1)
        .replacen("{}", &pct_str, 1)
}

fn render_subtask_row(name: &str, duration_formatted: &str, percentage: f64) -> String {
    let (width_str, pct_str) = format_percentage(percentage);
    HTML_ROW_SUBTASK
        .replacen("{}", &escape_html(name), 1)
        .replacen("{}", &escape_html(duration_formatted), 1)
        .replacen("{}", &width_str, 1)
        .replacen("{}", &pct_str, 1)
}

fn format_percentage(pct: f64) -> (String, String) {
    if pct.is_finite() && pct >= 0.0 {
        let clamped = pct.clamp(0.0, 100.0);
        (format!("{:.1}", clamped), format!("{:.1}", pct))
    } else {
        ("0.0".to_string(), "0.0".to_string())
    }
}

/// Escapes standard HTML5 special characters (`&`, `<`, `>`, `"`, `'`) and filters out
/// disallowed ASCII/Unicode control characters to prevent XSS and DOM disruption,
/// while safely preserving multilingual characters, Polish diacritics, and Emoji.
pub fn escape_html(input: &str) -> String {
    let sanitized: String = input
        .chars()
        .filter(|&c| c != '\0' && (c == '\t' || c == '\n' || c == '\r' || !c.is_control()))
        .collect();
    sanitized
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&#39;")
}
