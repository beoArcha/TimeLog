use super::catalog::Catalog;
use super::entries::MeasuredEntry;
use super::ordering::{seconds_desc_then_id, share_basis_points};
use crate::engine::EngineError;
use crate::types::{ReportProject, ReportRateStatus, ReportSubtask, ReportTask, Task};
use std::collections::{BTreeSet, HashMap};

/// Direct and cumulative seconds per task, plus project-level time without a task.
pub(super) struct Aggregate<'a> {
    project_direct: HashMap<&'a str, u64>,
    task_direct: HashMap<&'a str, u64>,
    task_total: HashMap<&'a str, u64>,
}

impl<'a> Aggregate<'a> {
    pub(super) fn from_entries(entries: &[MeasuredEntry<'a>]) -> Self {
        let mut aggregate = Self {
            project_direct: HashMap::new(),
            task_direct: HashMap::new(),
            task_total: HashMap::new(),
        };
        for entry in entries {
            aggregate.add(entry);
        }
        aggregate
    }

    fn add(&mut self, entry: &MeasuredEntry<'a>) {
        let Some(own_task) = entry.chain.first() else {
            *self.project_direct.entry(entry.project_id).or_default() += entry.seconds;
            return;
        };
        *self.task_direct.entry(own_task.id.as_str()).or_default() += entry.seconds;
        for task in &entry.chain {
            *self.task_total.entry(task.id.as_str()).or_default() += entry.seconds;
        }
    }

    fn direct(&self, task_id: &str) -> u64 {
        self.task_direct.get(task_id).copied().unwrap_or_default()
    }

    fn total(&self, task_id: &str) -> u64 {
        self.task_total.get(task_id).copied().unwrap_or_default()
    }
}

struct TreeContext<'a> {
    aggregate: &'a Aggregate<'a>,
    total_seconds: u64,
    /// Only tasks with time in range, siblings already ordered.
    children: HashMap<&'a str, Vec<&'a Task>>,
}

impl TreeContext<'_> {
    fn share(&self, seconds: u64) -> u32 {
        share_basis_points(seconds, self.total_seconds)
    }
}

pub(super) fn build_projects(
    catalog: &Catalog<'_>,
    aggregate: &Aggregate<'_>,
    total_seconds: u64,
) -> Result<Vec<ReportProject>, EngineError> {
    let (roots_by_project, children) = group_tasks(catalog, aggregate);
    let context = TreeContext {
        aggregate,
        total_seconds,
        children,
    };

    let project_ids: BTreeSet<&str> = aggregate
        .project_direct
        .keys()
        .chain(roots_by_project.keys())
        .copied()
        .collect();

    let mut projects = Vec::with_capacity(project_ids.len());
    for project_id in project_ids {
        let roots = roots_by_project
            .get(project_id)
            .map_or(&[][..], Vec::as_slice);
        projects.push(build_project(catalog, &context, project_id, roots)?);
    }
    projects.sort_by(|a, b| seconds_desc_then_id((a.seconds, &a.id), (b.seconds, &b.id)));
    Ok(projects)
}

type RootsByProject<'a> = HashMap<&'a str, Vec<&'a Task>>;

fn group_tasks<'a>(
    catalog: &Catalog<'a>,
    aggregate: &Aggregate<'a>,
) -> (RootsByProject<'a>, RootsByProject<'a>) {
    let mut roots: RootsByProject<'a> = HashMap::new();
    let mut children: RootsByProject<'a> = HashMap::new();
    for task in catalog.all_tasks() {
        if aggregate.total(&task.id) == 0 {
            continue;
        }
        match task.parent_task_id.as_deref() {
            Some(parent_id) => children.entry(parent_id).or_default().push(task),
            None => roots
                .entry(task.project_id.as_str())
                .or_default()
                .push(task),
        }
    }
    for siblings in children.values_mut() {
        sort_siblings(siblings, aggregate);
    }
    (roots, children)
}

fn sort_siblings(siblings: &mut [&Task], aggregate: &Aggregate<'_>) {
    siblings.sort_by(|a, b| {
        seconds_desc_then_id(
            (aggregate.total(&a.id), &a.id),
            (aggregate.total(&b.id), &b.id),
        )
    });
}

fn build_project(
    catalog: &Catalog<'_>,
    context: &TreeContext<'_>,
    project_id: &str,
    roots: &[&Task],
) -> Result<ReportProject, EngineError> {
    let project = catalog.project(project_id)?;
    let aggregate = context.aggregate;
    let direct_seconds = aggregate
        .project_direct
        .get(project_id)
        .copied()
        .unwrap_or_default();

    let mut ordered_roots = roots.to_vec();
    sort_siblings(&mut ordered_roots, aggregate);
    let tasks: Vec<ReportTask> = ordered_roots
        .iter()
        .map(|root| build_task(context, root))
        .collect();
    let seconds = direct_seconds + tasks.iter().map(|task| task.seconds).sum::<u64>();

    // TODO(PR-13): fill project.billing and each task/subtask rate, currency and amount from billing.
    Ok(ReportProject {
        id: project.id.clone(),
        name: project.name.clone(),
        direct_seconds,
        seconds,
        share_basis_points: context.share(seconds),
        billing: Vec::new(),
        tasks,
    })
}

fn build_task(context: &TreeContext<'_>, root: &Task) -> ReportTask {
    let seconds = context.aggregate.total(&root.id);
    ReportTask {
        id: root.id.clone(),
        name: root.name.clone(),
        direct_seconds: context.aggregate.direct(&root.id),
        seconds,
        share_basis_points: context.share(seconds),
        rate_minor: None,
        currency: None,
        rate_status: ReportRateStatus::Unconfigured,
        amount_minor: None,
        subtasks: flatten_descendants(context, &root.id),
    }
}

/// Depth-first pre-order without recursion, so a very deep hierarchy cannot overflow the stack.
fn flatten_descendants(context: &TreeContext<'_>, root_id: &str) -> Vec<ReportSubtask> {
    let mut subtasks = Vec::new();
    let mut stack = children_reversed(context, root_id);
    while let Some((task, parent_id)) = stack.pop() {
        let seconds = context.aggregate.total(&task.id);
        subtasks.push(ReportSubtask {
            id: task.id.clone(),
            name: task.name.clone(),
            parent_task_id: parent_id.to_string(),
            direct_seconds: context.aggregate.direct(&task.id),
            seconds,
            share_basis_points: context.share(seconds),
            rate_minor: None,
            currency: None,
            rate_status: ReportRateStatus::Unconfigured,
            amount_minor: None,
        });
        stack.extend(children_reversed(context, &task.id));
    }
    subtasks
}

/// Pushing siblings in reverse makes the stack pop the first-ordered sibling first.
fn children_reversed<'a>(context: &TreeContext<'a>, parent_id: &str) -> Vec<(&'a Task, &'a str)> {
    context
        .children
        .get_key_value(parent_id)
        .map(|(parent, kids)| kids.iter().rev().map(|kid| (*kid, *parent)).collect())
        .unwrap_or_default()
}
