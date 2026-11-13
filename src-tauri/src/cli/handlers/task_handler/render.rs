use std::collections::{HashMap, HashSet};

use crate::cli::handlers::constants::{
    FORMAT_TASK_ORPHAN_ROW, FORMAT_TASK_ROOT_ROW, FORMAT_TASK_SUBTASK_ROW, LABEL_SUBTASK_BADGE,
    LABEL_UNKNOWN_PROJECT, SYMBOL_TASK_DONE, SYMBOL_TASK_TODO,
};
use crate::types::{Project, Task};

struct TaskHierarchy<'a> {
    roots: Vec<&'a Task>,
    subtasks_by_parent: HashMap<&'a str, Vec<&'a Task>>,
    orphans: Vec<&'a Task>,
}

impl<'a> TaskHierarchy<'a> {
    fn partition(tasks: &[&'a Task]) -> Self {
        let task_ids: HashSet<&str> = tasks.iter().map(|t| t.id.as_str()).collect();
        let mut roots = Vec::new();
        let mut subtasks_by_parent: HashMap<&str, Vec<&Task>> = HashMap::new();
        let mut orphans = Vec::new();

        for task in tasks {
            match task.parent_task_id.as_deref() {
                None => roots.push(*task),
                Some(parent_id) => {
                    if task_ids.contains(parent_id) {
                        subtasks_by_parent.entry(parent_id).or_default().push(*task);
                    } else {
                        orphans.push(*task);
                    }
                }
            }
        }

        Self {
            roots,
            subtasks_by_parent,
            orphans,
        }
    }
}

pub(super) fn render_task_rows(tasks: &[&Task], projects: &[Project]) -> String {
    let hierarchy = TaskHierarchy::partition(tasks);
    let project_names: HashMap<&str, &str> = projects
        .iter()
        .map(|p| (p.id.as_str(), p.name.as_str()))
        .collect();

    let mut out = String::new();

    for root in hierarchy.roots {
        let proj_name = project_names
            .get(root.project_id.as_str())
            .copied()
            .unwrap_or(LABEL_UNKNOWN_PROJECT);

        out.push_str(&format_root_row(root, proj_name));

        if let Some(subtasks) = hierarchy.subtasks_by_parent.get(root.id.as_str()) {
            for sub in subtasks {
                out.push_str(&format_subtask_row(sub));
            }
        }
    }

    for orphan in hierarchy.orphans {
        out.push_str(&format_orphan_row(orphan));
    }

    out
}

fn format_root_row(task: &Task, proj_name: &str) -> String {
    let status_icon = if task.completed {
        SYMBOL_TASK_DONE
    } else {
        SYMBOL_TASK_TODO
    };
    FORMAT_TASK_ROOT_ROW
        .replacen("{}", status_icon, 1)
        .replacen("{}", &task.name, 1)
        .replacen("{}", &task.id, 1)
        .replacen("{}", proj_name, 1)
}

fn format_subtask_row(sub: &Task) -> String {
    let sub_icon = if sub.completed {
        SYMBOL_TASK_DONE
    } else {
        SYMBOL_TASK_TODO
    };
    FORMAT_TASK_SUBTASK_ROW
        .replacen("{}", sub_icon, 1)
        .replacen("{}", &sub.name, 1)
        .replacen("{}", &sub.id, 1)
}

fn format_orphan_row(orphan: &Task) -> String {
    let icon = if orphan.completed {
        SYMBOL_TASK_DONE
    } else {
        SYMBOL_TASK_TODO
    };
    FORMAT_TASK_ORPHAN_ROW
        .replacen("{}", icon, 1)
        .replacen("{}", &orphan.name, 1)
        .replacen("{}", &orphan.id, 1)
        .replacen("{}", LABEL_SUBTASK_BADGE, 1)
}
