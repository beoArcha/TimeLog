use super::constants::{CSV_HEADER_REPORT, FORMAT_CSV_ROW, FORMAT_CSV_ROW_NO_SUBTASK};
use crate::cli::formatters::{ReportProjectDto, ReportTaskDto, ReportTreeDto};

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

    task.subtasks
        .iter()
        .map(|subtask| {
            let s_name = sanitize_csv(&subtask.name);
            FORMAT_CSV_ROW
                .replacen("{}", project_name, 1)
                .replacen("{}", &t_name, 1)
                .replacen("{}", &s_name, 1)
                .replacen("{}", &subtask.duration_seconds.to_string(), 1)
                .replacen("{}", &subtask.duration_formatted, 1)
                .replacen("{:.1}", &format!("{:.1}", subtask.percentage), 1)
                .trim_end_matches('\n')
                .to_string()
        })
        .collect()
}

fn sanitize_csv(val: &str) -> String {
    val.replace('"', "\"\"")
}
