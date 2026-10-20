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
use crate::cli::shared::utils::{current_timestamp, generate_id};
use crate::persistence::Persistence;
use crate::types::{Task, TaskStatus};

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
    let all_tasks = persistence
        .tasks
        .get_all()
        .map_err(|e| CliError::Storage(e.to_string()))?;
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

fn render_task_hierarchy(tasks: &[&Task], projects: &[crate::types::Project]) -> String {
    let mut out = String::from(HEADER_TASKS);
    let root_tasks: Vec<_> = tasks
        .iter()
        .filter(|t| t.parent_task_id.is_none())
        .collect();

    for root in root_tasks {
        let status_icon = if root.completed {
            SYMBOL_TASK_DONE
        } else {
            SYMBOL_TASK_TODO
        };
        let proj_name = projects
            .iter()
            .find(|p| p.id == root.project_id)
            .map(|p| p.name.as_str())
            .unwrap_or(LABEL_UNKNOWN_PROJECT);

        out.push_str(
            &FORMAT_TASK_ROOT_ROW
                .replacen("{}", status_icon, 1)
                .replacen("{}", &root.name, 1)
                .replacen("{}", &root.id, 1)
                .replacen("{}", proj_name, 1),
        );

        let subtasks = tasks
            .iter()
            .filter(|t| t.parent_task_id.as_deref() == Some(&root.id));

        for sub in subtasks {
            let sub_icon = if sub.completed {
                SYMBOL_TASK_DONE
            } else {
                SYMBOL_TASK_TODO
            };
            out.push_str(
                &FORMAT_TASK_SUBTASK_ROW
                    .replacen("{}", sub_icon, 1)
                    .replacen("{}", &sub.name, 1)
                    .replacen("{}", &sub.id, 1),
            );
        }
    }

    let orphan_subtasks = tasks.iter().filter(|t| {
        if let Some(ref parent_id) = t.parent_task_id {
            !tasks.iter().any(|r| r.id == *parent_id)
        } else {
            false
        }
    });

    for orphan in orphan_subtasks {
        let icon = if orphan.completed {
            SYMBOL_TASK_DONE
        } else {
            SYMBOL_TASK_TODO
        };
        out.push_str(
            &FORMAT_TASK_ORPHAN_ROW
                .replacen("{}", icon, 1)
                .replacen("{}", &orphan.name, 1)
                .replacen("{}", &orphan.id, 1)
                .replacen("{}", LABEL_SUBTASK_BADGE, 1),
        );
    }

    out
}

fn add_task(
    persistence: &Persistence,
    name: String,
    project: Option<String>,
    parent: Option<String>,
) -> Result<CliOutput, CliError> {
    let project_id = resolve_target_project_id(persistence, project)?;
    let parent_task_id = resolve_parent_task_id(persistence, parent)?;
    let id = generate_id();
    let task = build_task(id.clone(), project_id, parent_task_id, name);

    persistence
        .tasks
        .create(task)
        .map_err(|e| CliError::Storage(e.to_string()))?;
    Ok(CliOutput::Success(MSG_TASK_CREATED.replace("{}", &id)))
}

fn resolve_target_project_id(
    persistence: &Persistence,
    project: Option<String>,
) -> Result<String, CliError> {
    let resolver = EntityResolver::new(persistence);
    match project {
        Some(target) => {
            let p = resolver.resolve_project(&target)?;
            Ok(p.id)
        }
        None => {
            let all_projects = persistence
                .projects
                .get_all()
                .map_err(|e| CliError::Storage(e.to_string()))?;
            let first = all_projects
                .into_iter()
                .find(|p| p.archived != Some(true))
                .ok_or_else(|| CliError::Business(MSG_NO_PROJECTS_EXIST.to_string()))?;
            Ok(first.id)
        }
    }
}

fn resolve_parent_task_id(
    persistence: &Persistence,
    parent: Option<String>,
) -> Result<Option<String>, CliError> {
    match parent {
        Some(target) => {
            let resolver = EntityResolver::new(persistence);
            let parent_task = resolver.resolve_task(&target)?;
            Ok(Some(parent_task.id))
        }
        None => Ok(None),
    }
}

fn build_task(
    id: String,
    project_id: String,
    parent_task_id: Option<String>,
    name: String,
) -> Task {
    Task {
        id,
        project_id,
        parent_task_id,
        name: name.clone(),
        created_at: current_timestamp(),
        completed: false,
        original_name: Some(name),
        original_completed: Some(false),
        edit_history: Some(vec![]),
        archived: Some(false),
        status: Some(TaskStatus::Todo),
    }
}

fn complete_task(persistence: &Persistence, target: &str) -> Result<CliOutput, CliError> {
    let resolver = EntityResolver::new(persistence);
    let mut task = resolver.resolve_task(target)?;
    task.completed = true;
    task.status = Some(TaskStatus::Done);
    persistence
        .tasks
        .patch(task.clone())
        .map_err(|e| CliError::Storage(e.to_string()))?;
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
    task.name = new_name;
    persistence
        .tasks
        .patch(task.clone())
        .map_err(|e| CliError::Storage(e.to_string()))?;
    Ok(CliOutput::Success(MSG_TASK_RENAMED.replace("{}", &task.id)))
}

fn archive_task(persistence: &Persistence, target: &str) -> Result<CliOutput, CliError> {
    let resolver = EntityResolver::new(persistence);
    let task = resolver.resolve_task(target)?;
    persistence
        .tasks
        .archive(task.id.clone(), task.project_id)
        .map_err(|e| CliError::Storage(e.to_string()))?;
    Ok(CliOutput::Success(
        MSG_TASK_ARCHIVED.replace("{}", &task.id),
    ))
}
