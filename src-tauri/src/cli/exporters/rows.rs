use crate::cli::formatters::{format_duration, ReportProjectDto, ReportTaskDto, ReportTreeDto};

#[derive(Debug, Clone, PartialEq)]
pub struct ReportRow {
    pub project_id: String,
    pub project_name: String,
    pub task_id: String,
    pub task_name: String,
    pub subtask_id: Option<String>,
    pub subtask_name: Option<String>,
    pub duration_seconds: u64,
    pub duration_formatted: String,
    pub percentage: f64,
}

pub fn flatten_report(tree: &ReportTreeDto) -> Vec<ReportRow> {
    tree.projects.iter().flat_map(flatten_project).collect()
}

pub fn flatten_project(project: &ReportProjectDto) -> Vec<ReportRow> {
    project
        .tasks
        .iter()
        .flat_map(|task| flatten_task(&project.id, &project.name, task))
        .collect()
}

pub fn flatten_task(project_id: &str, project_name: &str, task: &ReportTaskDto) -> Vec<ReportRow> {
    let subtasks_secs: u64 = task.subtasks.iter().map(|s| s.duration_seconds).sum();
    let direct_secs = task.duration_seconds.saturating_sub(subtasks_secs);
    let direct_pct = if task.duration_seconds > 0 {
        (direct_secs as f64 / task.duration_seconds as f64) * task.percentage
    } else {
        0.0
    };

    if task.subtasks.is_empty() {
        return vec![ReportRow {
            project_id: project_id.to_string(),
            project_name: project_name.to_string(),
            task_id: task.id.clone(),
            task_name: task.name.clone(),
            subtask_id: None,
            subtask_name: None,
            duration_seconds: task.duration_seconds,
            duration_formatted: task.duration_formatted.clone(),
            percentage: task.percentage,
        }];
    }

    let mut rows = Vec::new();

    if direct_secs > 0 {
        rows.push(ReportRow {
            project_id: project_id.to_string(),
            project_name: project_name.to_string(),
            task_id: task.id.clone(),
            task_name: task.name.clone(),
            subtask_id: None,
            subtask_name: None,
            duration_seconds: direct_secs,
            duration_formatted: format_duration(direct_secs),
            percentage: direct_pct,
        });
    }

    for subtask in &task.subtasks {
        rows.push(ReportRow {
            project_id: project_id.to_string(),
            project_name: project_name.to_string(),
            task_id: task.id.clone(),
            task_name: task.name.clone(),
            subtask_id: Some(subtask.id.clone()),
            subtask_name: Some(subtask.name.clone()),
            duration_seconds: subtask.duration_seconds,
            duration_formatted: subtask.duration_formatted.clone(),
            percentage: subtask.percentage,
        });
    }

    rows
}
