use crate::shared::builders::{PatchLogBuilder, ProjectBuilder, TaskBuilder, TimeLogBuilder};
use chrono::{DateTime, Duration, SecondsFormat, Utc};
use oxyflow_timelog::engine::reports::{build_report_at, ReportSnapshot};
use oxyflow_timelog::types::{
    PatchLog, Project, RangeRequest, ReportDocument, ReportRequest, ReportVariant, ResolvedRange,
    Task, TimeLog,
};

pub const GENERATED_AT: &str = "2026-06-20T12:00:00Z";
pub const DAY_START: &str = "2026-06-15T10:00:00Z";

pub fn generated_at() -> DateTime<Utc> {
    DateTime::parse_from_rfc3339(GENERATED_AT)
        .unwrap()
        .with_timezone(&Utc)
}

pub fn utc_range(from: &str, to: &str) -> ResolvedRange {
    resolved_range(Some(from), Some(to), "UTC")
}

pub fn resolved_range(from: Option<&str>, to: Option<&str>, timezone: &str) -> ResolvedRange {
    ResolvedRange {
        from: from.map(str::to_string),
        to: to.map(str::to_string),
        timezone: timezone.to_string(),
        preset: None,
    }
}

/// The whole of 2026-06-15 in UTC.
pub fn june_15() -> ResolvedRange {
    utc_range("2026-06-15T00:00:00Z", "2026-06-16T00:00:00Z")
}

pub fn request(variant: ReportVariant) -> ReportRequest {
    ReportRequest {
        range: RangeRequest {
            preset: None,
            from: None,
            to: None,
            timezone: None,
        },
        project_id: None,
        task_id: None,
        variant,
        include_patches: None,
    }
}

pub fn project(id: &str) -> Project {
    ProjectBuilder::new()
        .with_id(id)
        .with_name(format!("Project {id}"))
        .build()
}

pub fn root_task(id: &str, project_id: &str) -> Task {
    TaskBuilder::new()
        .with_id(id)
        .with_project_id(project_id)
        .with_name(format!("Task {id}"))
        .build()
}

pub fn subtask(id: &str, parent: &Task) -> Task {
    TaskBuilder::new()
        .with_id(id)
        .with_project_id(&parent.project_id)
        .with_parent(&parent.id)
        .with_name(format!("Task {id}"))
        .build()
}

pub fn log(task: &Task, id: &str, start: &str, end: &str) -> TimeLog {
    TimeLogBuilder::new()
        .with_id(id)
        .with_project_id(&task.project_id)
        .with_task_id(&task.id)
        .with_start_time(start)
        .with_end_time(Some(end.to_string()))
        .build()
}

pub fn running_log(task: &Task, id: &str, start: &str) -> TimeLog {
    TimeLogBuilder::new()
        .with_id(id)
        .with_project_id(&task.project_id)
        .with_task_id(&task.id)
        .with_start_time(start)
        .running()
        .build()
}

/// A log starting at `DAY_START` and lasting exactly `seconds`.
pub fn log_lasting(task: &Task, id: &str, seconds: i64) -> TimeLog {
    let start = DateTime::parse_from_rfc3339(DAY_START).unwrap();
    let end = (start + Duration::seconds(seconds)).to_rfc3339_opts(SecondsFormat::Secs, true);
    log(task, id, DAY_START, &end)
}

pub fn project_patch(project: &Project, id: &str, start: &str, end: &str) -> PatchLog {
    PatchLogBuilder::new()
        .with_id(id)
        .with_project_id(&project.id)
        .with_start_time(start)
        .with_end_time(end)
        .build()
}

pub fn task_patch(task: &Task, id: &str, start: &str, end: &str) -> PatchLog {
    PatchLogBuilder::new()
        .with_id(id)
        .with_project_id(&task.project_id)
        .with_task_id(&task.id)
        .with_start_time(start)
        .with_end_time(end)
        .build()
}

pub fn snapshot(
    projects: Vec<Project>,
    tasks: Vec<Task>,
    logs: Vec<TimeLog>,
    patches: Vec<PatchLog>,
) -> ReportSnapshot {
    ReportSnapshot {
        projects,
        tasks,
        logs,
        patches,
    }
}

pub fn build(
    snapshot: &ReportSnapshot,
    request: &ReportRequest,
    range: &ResolvedRange,
) -> ReportDocument {
    build_report_at(snapshot, request, range, generated_at()).unwrap()
}

/// One project `p1` with a root task `r`, a child `c` and a grandchild `g`.
pub struct ThreeLevels {
    pub project: Project,
    pub root: Task,
    pub child: Task,
    pub grandchild: Task,
}

impl ThreeLevels {
    pub fn new() -> Self {
        let project = project("p1");
        let root = root_task("r", "p1");
        let child = subtask("c", &root);
        let grandchild = subtask("g", &child);
        Self {
            project,
            root,
            child,
            grandchild,
        }
    }

    pub fn tasks(&self) -> Vec<Task> {
        vec![
            self.root.clone(),
            self.child.clone(),
            self.grandchild.clone(),
        ]
    }
}
