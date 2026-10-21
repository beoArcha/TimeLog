use super::constants::{HTML_PAGE_TEMPLATE, HTML_ROW_PROJECT, HTML_ROW_SUBTASK, HTML_ROW_TASK};
use crate::cli::formatters::{ReportProjectDto, ReportSubtaskDto, ReportTaskDto, ReportTreeDto};

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
    let task_rows = project
        .tasks
        .iter()
        .map(render_task_section)
        .collect::<Vec<_>>()
        .join("\n");

    if task_rows.is_empty() {
        project_row
    } else {
        format!("{}\n{}", project_row, task_rows)
    }
}

fn render_task_section(task: &ReportTaskDto) -> String {
    let task_row = render_task_row(task);
    let subtask_rows = task
        .subtasks
        .iter()
        .map(render_subtask_row)
        .collect::<Vec<_>>()
        .join("\n");

    if subtask_rows.is_empty() {
        task_row
    } else {
        format!("{}\n{}", task_row, subtask_rows)
    }
}

fn render_project_row(project: &ReportProjectDto) -> String {
    let pct_str = format!("{:.1}", project.percentage);
    HTML_ROW_PROJECT
        .replacen("{}", &escape_html(&project.name), 1)
        .replacen("{}", &project.duration_formatted, 1)
        .replacen("{}", &pct_str, 1)
        .replacen("{}", &pct_str, 1)
}

fn render_task_row(task: &ReportTaskDto) -> String {
    let pct_str = format!("{:.1}", task.percentage);
    HTML_ROW_TASK
        .replacen("{}", &escape_html(&task.name), 1)
        .replacen("{}", &task.duration_formatted, 1)
        .replacen("{}", &pct_str, 1)
        .replacen("{}", &pct_str, 1)
}

fn render_subtask_row(subtask: &ReportSubtaskDto) -> String {
    let pct_str = format!("{:.1}", subtask.percentage);
    HTML_ROW_SUBTASK
        .replacen("{}", &escape_html(&subtask.name), 1)
        .replacen("{}", &subtask.duration_formatted, 1)
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
