use super::constants::{HTML_PAGE_TEMPLATE, HTML_ROW_PROJECT, HTML_ROW_SUBTASK, HTML_ROW_TASK};
use super::rows::flatten_project;
use crate::cli::formatters::{ReportProjectDto, ReportTreeDto};

pub fn export_html(tree: &ReportTreeDto) -> String {
    let rows = tree
        .projects
        .iter()
        .map(render_project_section)
        .collect::<Vec<_>>()
        .join("\n");

    let total_tasks: usize = tree.projects.iter().map(|p| p.tasks.len()).sum();

    HTML_PAGE_TEMPLATE
        .replace("{period}", &tree.period)
        .replace("{total_time}", &tree.total_formatted)
        .replace("{project_count}", &tree.projects.len().to_string())
        .replace("{task_count}", &total_tasks.to_string())
        .replace("{rows}", &rows)
}

fn render_project_section(project: &ReportProjectDto) -> String {
    let project_row = render_project_row(project);
    let project_rows = flatten_project(project);

    if project_rows.is_empty() {
        return project_row;
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

    format!("{}\n{}", project_row, task_rows)
}

fn render_project_row(project: &ReportProjectDto) -> String {
    let pct_str = format!("{:.1}", project.percentage);
    HTML_ROW_PROJECT
        .replacen("{}", &escape_html(&project.name), 1)
        .replacen("{}", &project.duration_formatted, 1)
        .replacen("{}", &pct_str, 1)
        .replacen("{}", &pct_str, 1)
}

fn render_task_row(name: &str, duration_formatted: &str, percentage: f64) -> String {
    let pct_str = format!("{:.1}", percentage);
    HTML_ROW_TASK
        .replacen("{}", &escape_html(name), 1)
        .replacen("{}", duration_formatted, 1)
        .replacen("{}", &pct_str, 1)
        .replacen("{}", &pct_str, 1)
}

fn render_subtask_row(name: &str, duration_formatted: &str, percentage: f64) -> String {
    let pct_str = format!("{:.1}", percentage);
    HTML_ROW_SUBTASK
        .replacen("{}", &escape_html(name), 1)
        .replacen("{}", duration_formatted, 1)
        .replacen("{}", &pct_str, 1)
        .replacen("{}", &pct_str, 1)
}

fn escape_html(input: &str) -> String {
    input
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&#39;")
}
