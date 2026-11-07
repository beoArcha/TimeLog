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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::cli::formatters::ReportSubtaskDto;

    #[test]
    fn test_given_empty_tree_when_flatten_then_returns_empty_vec() {
        let tree = ReportTreeDto {
            period: "Today".to_string(),
            total_seconds: 0,
            total_formatted: "00m 00s".to_string(),
            projects: vec![],
        };
        let rows = flatten_report(&tree);
        assert!(rows.is_empty());
    }

    #[test]
    fn test_given_task_without_subtasks_when_flatten_then_returns_single_row_with_none_subtask() {
        let task = ReportTaskDto {
            id: "t1".to_string(),
            name: "Coding".to_string(),
            duration_seconds: 3600,
            duration_formatted: "01h 00m".to_string(),
            percentage: 100.0,
            subtasks: vec![],
        };
        let rows = flatten_task("p1", "Project A", &task);
        assert_eq!(rows.len(), 1);
        assert_eq!(rows[0].project_id, "p1");
        assert_eq!(rows[0].project_name, "Project A");
        assert_eq!(rows[0].task_id, "t1");
        assert_eq!(rows[0].task_name, "Coding");
        assert_eq!(rows[0].subtask_id, None);
        assert_eq!(rows[0].subtask_name, None);
        assert_eq!(rows[0].duration_seconds, 3600);
        assert_eq!(rows[0].duration_formatted, "01h 00m");
        assert_eq!(rows[0].percentage, 100.0);
    }

    #[test]
    fn test_given_task_with_subtasks_and_direct_time_when_flatten_then_returns_direct_and_subtasks()
    {
        let task = ReportTaskDto {
            id: "t1".to_string(),
            name: "Feature".to_string(),
            duration_seconds: 3600,
            duration_formatted: "01h 00m".to_string(),
            percentage: 80.0,
            subtasks: vec![
                ReportSubtaskDto {
                    id: "s1".to_string(),
                    name: "Sub A".to_string(),
                    duration_seconds: 1200,
                    duration_formatted: "20m 00s".to_string(),
                    percentage: 26.7,
                },
                ReportSubtaskDto {
                    id: "s2".to_string(),
                    name: "Sub B".to_string(),
                    duration_seconds: 600,
                    duration_formatted: "10m 00s".to_string(),
                    percentage: 13.3,
                },
            ],
        };
        let rows = flatten_task("p1", "Project A", &task);
        assert_eq!(rows.len(), 3);

        // Row 1: Direct time (3600 - 1800 = 1800s, 50% of 80% = 40%)
        assert_eq!(rows[0].task_name, "Feature");
        assert_eq!(rows[0].subtask_id, None);
        assert_eq!(rows[0].subtask_name, None);
        assert_eq!(rows[0].duration_seconds, 1800);
        assert_eq!(rows[0].duration_formatted, "30m 00s");
        assert!((rows[0].percentage - 40.0).abs() < 1e-6);

        // Row 2: Subtask A
        assert_eq!(rows[1].task_name, "Feature");
        assert_eq!(rows[1].subtask_id, Some("s1".to_string()));
        assert_eq!(rows[1].subtask_name, Some("Sub A".to_string()));
        assert_eq!(rows[1].duration_seconds, 1200);
        assert_eq!(rows[1].duration_formatted, "20m 00s");
        assert_eq!(rows[1].percentage, 26.7);

        // Row 3: Subtask B
        assert_eq!(rows[2].task_name, "Feature");
        assert_eq!(rows[2].subtask_id, Some("s2".to_string()));
        assert_eq!(rows[2].subtask_name, Some("Sub B".to_string()));
        assert_eq!(rows[2].duration_seconds, 600);
        assert_eq!(rows[2].duration_formatted, "10m 00s");
        assert_eq!(rows[2].percentage, 13.3);
    }

    #[test]
    fn test_given_task_with_subtasks_and_zero_direct_time_when_flatten_then_skips_direct_row() {
        let task = ReportTaskDto {
            id: "t1".to_string(),
            name: "Feature".to_string(),
            duration_seconds: 1800,
            duration_formatted: "30m 00s".to_string(),
            percentage: 50.0,
            subtasks: vec![ReportSubtaskDto {
                id: "s1".to_string(),
                name: "Sub A".to_string(),
                duration_seconds: 1800,
                duration_formatted: "30m 00s".to_string(),
                percentage: 50.0,
            }],
        };
        let rows = flatten_task("p1", "Project A", &task);
        assert_eq!(rows.len(), 1);
        assert_eq!(rows[0].subtask_id, Some("s1".to_string()));
        assert_eq!(rows[0].subtask_name, Some("Sub A".to_string()));
        assert_eq!(rows[0].duration_seconds, 1800);
    }

    #[test]
    fn test_given_task_with_zero_duration_when_flatten_then_percentage_is_zero() {
        let task = ReportTaskDto {
            id: "t0".to_string(),
            name: "Empty Task".to_string(),
            duration_seconds: 0,
            duration_formatted: "00m 00s".to_string(),
            percentage: 0.0,
            subtasks: vec![],
        };
        let rows = flatten_task("p1", "Project A", &task);
        assert_eq!(rows.len(), 1);
        assert_eq!(rows[0].duration_seconds, 0);
        assert_eq!(rows[0].percentage, 0.0);
    }
}
