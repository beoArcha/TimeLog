use super::constants::{CSV_HEADER_REPORT, FORMAT_CSV_ROW, FORMAT_CSV_ROW_NO_SUBTASK};
use crate::cli::formatters::{format_duration, ReportProjectDto, ReportTaskDto, ReportTreeDto};

pub fn export_csv(tree: &ReportTreeDto) -> String {
    let mut rows = vec![CSV_HEADER_REPORT.to_string()];
    let project_rows: Vec<String> = tree.projects.iter().flat_map(render_project_csv).collect();
    rows.extend(project_rows);
    rows.join("\n") + "\n"
}

fn render_project_csv(project: &ReportProjectDto) -> Vec<String> {
    let p_name = sanitize_csv(&project.name);
    project
        .tasks
        .iter()
        .flat_map(|task| render_task_csv(&p_name, task))
        .collect()
}

fn render_task_csv(project_name: &str, task: &ReportTaskDto) -> Vec<String> {
    let t_name = sanitize_csv(&task.name);
    let subtasks_secs: u64 = task.subtasks.iter().map(|s| s.duration_seconds).sum();
    let direct_secs = task.duration_seconds.saturating_sub(subtasks_secs);
    let direct_pct = if task.duration_seconds > 0 {
        (direct_secs as f64 / task.duration_seconds as f64) * task.percentage
    } else {
        0.0
    };

    if task.subtasks.is_empty() {
        let row = FORMAT_CSV_ROW_NO_SUBTASK
            .replacen("{}", project_name, 1)
            .replacen("{}", &t_name, 1)
            .replacen("{}", &task.duration_seconds.to_string(), 1)
            .replacen("{}", &task.duration_formatted, 1)
            .replacen("{:.1}", &format!("{:.1}", task.percentage), 1)
            .trim_end_matches('\n')
            .to_string();
        return vec![row];
    }

    let mut rows = Vec::new();

    if direct_secs > 0 {
        let row = FORMAT_CSV_ROW_NO_SUBTASK
            .replacen("{}", project_name, 1)
            .replacen("{}", &t_name, 1)
            .replacen("{}", &direct_secs.to_string(), 1)
            .replacen("{}", &format_duration(direct_secs), 1)
            .replacen("{:.1}", &format!("{:.1}", direct_pct), 1)
            .trim_end_matches('\n')
            .to_string();
        rows.push(row);
    }

    for subtask in &task.subtasks {
        let s_name = sanitize_csv(&subtask.name);
        let row = FORMAT_CSV_ROW
            .replacen("{}", project_name, 1)
            .replacen("{}", &t_name, 1)
            .replacen("{}", &s_name, 1)
            .replacen("{}", &subtask.duration_seconds.to_string(), 1)
            .replacen("{}", &subtask.duration_formatted, 1)
            .replacen("{:.1}", &format!("{:.1}", subtask.percentage), 1)
            .trim_end_matches('\n')
            .to_string();
        rows.push(row);
    }

    rows
}

fn sanitize_csv(val: &str) -> String {
    val.replace('"', "\"\"")
}
