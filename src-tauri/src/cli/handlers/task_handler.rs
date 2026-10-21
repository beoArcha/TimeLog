use std::collections::{HashMap, HashSet};

use super::constants::{
    FORMAT_TASK_ORPHAN_ROW, FORMAT_TASK_ROOT_ROW, FORMAT_TASK_SUBTASK_ROW, HEADER_TASKS,
    LABEL_SUBTASK_BADGE, LABEL_UNKNOWN_PROJECT, MSG_NO_PROJECTS_EXIST, MSG_NO_TASKS_FOUND,
    MSG_TASK_ARCHIVED, MSG_TASK_COMPLETED, MSG_TASK_CREATED, MSG_TASK_RENAMED, SYMBOL_TASK_DONE,
    SYMBOL_TASK_TODO,
};
use crate::cli::error::CliError;
use crate::cli::parser::tier2_entities::{TaskArgs, TaskSubcommand};
use crate::cli::resolver::EntityResolver;
use crate::cli::shared::output::CliOutput;
use crate::cli::shared::utils::generate_id;
use crate::engine::Engine;
use crate::persistence::Persistence;
use crate::types::{Project, Task, TaskStatus};

pub fn handle(args: TaskArgs, persistence: &Persistence) -> Result<CliOutput, CliError> {
    match args.command {
        TaskSubcommand::List { project, all } => list_tasks(persistence, project, all),
        TaskSubcommand::Add {
            name,
            project,
            parent,
        } => add_task(persistence, name, project, parent),
        TaskSubcommand::Done { target } => complete_task(persistence, &target),
        TaskSubcommand::Rename { target, new_name } => rename_task(persistence, &target, new_name),
        TaskSubcommand::Archive { target } => archive_task(persistence, &target),
    }
}

fn list_tasks(
    persistence: &Persistence,
    project: Option<String>,
    all: bool,
) -> Result<CliOutput, CliError> {
    let filter_project_id = resolve_project_filter(persistence, project)?;
    let all_tasks = persistence.tasks.get_all()?;
    let projects = persistence.projects.get_all().unwrap_or_default();

    let filtered = filter_tasks(&all_tasks, filter_project_id.as_deref(), all);
    if filtered.is_empty() {
        return Ok(CliOutput::Success(MSG_NO_TASKS_FOUND.to_string()));
    }

    Ok(CliOutput::Success(render_task_hierarchy(
        &filtered, &projects,
    )))
}

fn resolve_project_filter(
    persistence: &Persistence,
    project: Option<String>,
) -> Result<Option<String>, CliError> {
    match project {
        Some(target) => {
            let resolver = EntityResolver::new(persistence);
            let p = resolver.resolve_project(&target)?;
            Ok(Some(p.id))
        }
        None => Ok(None),
    }
}

fn filter_tasks<'a>(
    tasks: &'a [Task],
    filter_project_id: Option<&str>,
    include_all: bool,
) -> Vec<&'a Task> {
    tasks
        .iter()
        .filter(|t| {
            if let Some(pid) = filter_project_id {
                if t.project_id != pid {
                    return false;
                }
            }
            if !include_all && (t.completed || t.archived == Some(true)) {
                return false;
            }
            true
        })
        .collect()
}

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

fn render_task_hierarchy(tasks: &[&Task], projects: &[Project]) -> String {
    let hierarchy = TaskHierarchy::partition(tasks);
    let project_names: HashMap<&str, &str> = projects
        .iter()
        .map(|p| (p.id.as_str(), p.name.as_str()))
        .collect();

    let mut out = String::from(HEADER_TASKS);

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

fn add_task(
    persistence: &Persistence,
    name: String,
    project: Option<String>,
    parent: Option<String>,
) -> Result<CliOutput, CliError> {
    let engine = Engine::new(persistence);
    let valid_name = engine.validate_task_name(&name)?;

    let parent_task = match parent {
        Some(target) => {
            let resolver = EntityResolver::new(persistence);
            let p_task = resolver.resolve_task(&target)?;
            engine.validate_task_hierarchy(None, Some(&p_task.id))?;
            Some(p_task)
        }
        None => None,
    };

    let project_id = match project {
        Some(target) => {
            let resolver = EntityResolver::new(persistence);
            let p = resolver.resolve_project(&target)?;
            if let Some(ref p_task) = parent_task {
                if p_task.project_id != p.id {
                    return Err(CliError::Business(
                        "Parent task belongs to a different project".to_string(),
                    ));
                }
            }
            p.id
        }
        None => match parent_task {
            Some(ref p_task) => p_task.project_id.clone(),
            None => resolve_default_project_id(persistence)?,
        },
    };

    let parent_task_id = parent_task.map(|p| p.id);
    let id = generate_id();
    let task = Task::new(id.clone(), project_id, parent_task_id, valid_name);

    persistence.tasks.create(task)?;
    Ok(CliOutput::Success(MSG_TASK_CREATED.replace("{}", &id)))
}

fn resolve_default_project_id(persistence: &Persistence) -> Result<String, CliError> {
    let all_projects = persistence.projects.get_all()?;
    let first = all_projects
        .into_iter()
        .find(|p| p.archived != Some(true))
        .ok_or_else(|| CliError::Business(MSG_NO_PROJECTS_EXIST.to_string()))?;
    Ok(first.id)
}

fn complete_task(persistence: &Persistence, target: &str) -> Result<CliOutput, CliError> {
    let resolver = EntityResolver::new(persistence);
    let mut task = resolver.resolve_task(target)?;
    task.completed = true;
    task.status = Some(TaskStatus::Done);
    persistence.tasks.patch(task.clone())?;
    Ok(CliOutput::Success(
        MSG_TASK_COMPLETED
            .replacen("{}", &task.name, 1)
            .replacen("{}", &task.id, 1),
    ))
}

fn rename_task(
    persistence: &Persistence,
    target: &str,
    new_name: String,
) -> Result<CliOutput, CliError> {
    let resolver = EntityResolver::new(persistence);
    let mut task = resolver.resolve_task(target)?;
    let engine = Engine::new(persistence);
    task.name = engine.validate_task_name(&new_name)?;
    persistence.tasks.patch(task.clone())?;
    Ok(CliOutput::Success(MSG_TASK_RENAMED.replace("{}", &task.id)))
}

fn archive_task(persistence: &Persistence, target: &str) -> Result<CliOutput, CliError> {
    let resolver = EntityResolver::new(persistence);
    let task = resolver.resolve_task(target)?;
    persistence
        .tasks
        .archive(task.id.clone(), task.project_id)?;
    Ok(CliOutput::Success(
        MSG_TASK_ARCHIVED.replace("{}", &task.id),
    ))
}
