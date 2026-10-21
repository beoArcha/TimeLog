use super::constants::{
    DIVIDER_LINE, FORMAT_REPORT_TOTAL, FORMAT_TREE_PROJECT, FORMAT_TREE_SUBTASK, FORMAT_TREE_TASK,
    HEADER_REPORT_TREE, MSG_NO_REPORT_DATA, PROGRESS_BAR_EMPTY, PROGRESS_BAR_FILLED,
    TREE_BRANCH_LAST, TREE_BRANCH_MID, TREE_INDENT_PIPE, TREE_INDENT_SPACE,
};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ReportSubtaskDto {
    pub id: String,
    pub name: String,
    pub duration_seconds: u64,
    pub duration_formatted: String,
    pub percentage: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ReportTaskDto {
    pub id: String,
    pub name: String,
    pub duration_seconds: u64,
    pub duration_formatted: String,
    pub percentage: f64,
    pub subtasks: Vec<ReportSubtaskDto>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ReportProjectDto {
    pub id: String,
    pub name: String,
    pub duration_seconds: u64,
    pub duration_formatted: String,
    pub percentage: f64,
    pub tasks: Vec<ReportTaskDto>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ReportTreeDto {
    pub period: String,
    pub total_seconds: u64,
    pub total_formatted: String,
    pub projects: Vec<ReportProjectDto>,
}

pub fn format_duration(seconds: u64) -> String {
    let hours = seconds / 3600;
    let mins = (seconds % 3600) / 60;
    let secs = seconds % 60;

    match hours {
        0 => format!("{:02}m {:02}s", mins, secs),
        _ => format!("{:02}h {:02}m", hours, mins),
    }
}

pub fn render_progress_bar(pct: f64, width: usize) -> String {
    let clamped_pct = pct.clamp(0.0, 100.0);
    let filled = ((clamped_pct / 100.0) * width as f64).round() as usize;
    let empty = width.saturating_sub(filled);
    format!(
        "{}{}",
        PROGRESS_BAR_FILLED.repeat(filled),
        PROGRESS_BAR_EMPTY.repeat(empty)
    )
}

pub fn render_tree_string(tree: &ReportTreeDto) -> String {
    if tree.projects.is_empty() || tree.total_seconds == 0 {
        return MSG_NO_REPORT_DATA.to_string();
    }

    let header = HEADER_REPORT_TREE.replacen("{}", &tree.period, 1);
    let branches = tree
        .projects
        .iter()
        .map(render_project_branch)
        .collect::<Vec<_>>()
        .join("");

    let total_tasks: usize = tree.projects.iter().map(|p| p.tasks.len()).sum();
    let total_row = FORMAT_REPORT_TOTAL
        .replacen("{}", &tree.total_formatted, 1)
        .replacen("{}", &total_tasks.to_string(), 1);

    format!("{}{}{}{}", header, branches, DIVIDER_LINE, total_row)
}

fn render_project_branch(project: &ReportProjectDto) -> String {
    let bar = render_progress_bar(project.percentage, 10);
    let project_row = FORMAT_TREE_PROJECT
        .replacen("{}", &project.name, 1)
        .replacen("{}", &project.duration_formatted, 1)
        .replacen("{}", &format!("{:.1}", project.percentage), 1)
        .replacen("{}", &bar, 1);

    let tasks_len = project.tasks.len();
    let task_branches = project
        .tasks
        .iter()
        .enumerate()
        .map(|(idx, task)| render_task_branch(task, idx + 1 == tasks_len))
        .collect::<Vec<_>>()
        .join("");

    format!("{}{}", project_row, task_branches)
}

fn render_task_branch(task: &ReportTaskDto, is_last: bool) -> String {
    let branch = determine_branch(is_last);
    let bar = render_progress_bar(task.percentage, 10);
    let task_row = FORMAT_TREE_TASK
        .replacen("{}", &task.name, 1)
        .replacen("{}", &task.duration_formatted, 1)
        .replacen("{}", &format!("{:.1}", task.percentage), 1)
        .replacen("{}", &bar, 1);

    let parent_indent = determine_indent(is_last);
    let sub_len = task.subtasks.len();
    let sub_branches = task
        .subtasks
        .iter()
        .enumerate()
        .map(|(idx, subtask)| render_subtask_branch(subtask, idx + 1 == sub_len, parent_indent))
        .collect::<Vec<_>>()
        .join("");

    format!("{}{}{}", branch, task_row, sub_branches)
}

fn render_subtask_branch(subtask: &ReportSubtaskDto, is_last: bool, parent_indent: &str) -> String {
    let sub_branch = determine_branch(is_last);
    let bar = render_progress_bar(subtask.percentage, 10);
    let subtask_row = FORMAT_TREE_SUBTASK
        .replacen("{}", &subtask.name, 1)
        .replacen("{}", &subtask.duration_formatted, 1)
        .replacen("{}", &format!("{:.1}", subtask.percentage), 1)
        .replacen("{}", &bar, 1);

    format!("{}{}{}", parent_indent, sub_branch, subtask_row)
}

fn determine_branch(is_last: bool) -> &'static str {
    match is_last {
        true => TREE_BRANCH_LAST,
        false => TREE_BRANCH_MID,
    }
}

fn determine_indent(is_last: bool) -> &'static str {
    match is_last {
        true => TREE_INDENT_SPACE,
        false => TREE_INDENT_PIPE,
    }
}
