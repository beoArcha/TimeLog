use std::collections::{HashMap, HashSet};

use super::billing_input::{NormalizedBillingCreation, NormalizedBillingUpdate};
use super::constants::{
    ERR_REPARENT_DIFFERENT_PROJECT, ERR_REPARENT_SELF, FORMAT_TASK_ORPHAN_ROW,
    FORMAT_TASK_ROOT_ROW, FORMAT_TASK_SUBTASK_ROW, HEADER_TASKS, LABEL_SUBTASK_BADGE,
    LABEL_UNKNOWN_PROJECT, MSG_NO_TASKS_FOUND, MSG_TASK_ARCHIVED, MSG_TASK_COMPLETED,
    MSG_TASK_CREATED, MSG_TASK_DETACHED, MSG_TASK_MOVED, MSG_TASK_RENAMED, MSG_TASK_REPARENTED,
    SYMBOL_TASK_DONE, SYMBOL_TASK_TODO,
};
use crate::cli::error::{BusinessRuleViolation, CliError, CliSyntaxError};
use crate::cli::parser::tier2_entities::{TaskArgs, TaskSubcommand};
use crate::cli::resolver::EntityResolver;
use crate::cli::shared::output::CliOutput;
use crate::cli::shared::utils::generate_id;
use crate::cli::shared::validation::validate_id;
use crate::engine::Engine;
use crate::persistence::Persistence;
use crate::types::{Project, Task, TaskStatus};

pub fn handle(
    args: TaskArgs,
    is_machine: bool,
    is_quiet: bool,
    persistence: &Persistence,
) -> Result<CliOutput, CliError> {
    match args.command {
        TaskSubcommand::List { project, all } => {
            list_tasks(persistence, project, all, is_machine, is_quiet)
        }
        TaskSubcommand::Add {
            name,
            project,
            parent,
            rate,
            rate_cents,
        } => add_task(
            persistence,
            name,
            project,
            parent,
            rate,
            rate_cents,
            is_machine,
        ),
        TaskSubcommand::Done { target } => complete_task(persistence, &target, is_machine),
        TaskSubcommand::Rename { target, new_name } => {
            rename_task(persistence, &target, new_name, is_machine)
        }
        TaskSubcommand::Rate {
            target,
            rate,
            currency,
            cents,
        } => set_task_rate(persistence, &target, rate, currency, cents, is_machine),
        TaskSubcommand::Reparent { target, new_parent } => {
            reparent_task(persistence, &target, &new_parent, is_machine)
        }
        TaskSubcommand::Move {
            target,
            new_project,
        } => move_task(persistence, &target, &new_project, is_machine),
        TaskSubcommand::Archive { target } => archive_task(persistence, &target, is_machine),
    }
}

fn list_tasks(
    persistence: &Persistence,
    project: Option<String>,
    all: bool,
    is_machine: bool,
    is_quiet: bool,
) -> Result<CliOutput, CliError> {
    let filter_project_id = resolve_project_filter(persistence, project)?;
    let all_tasks = persistence.tasks.get_all()?;
    let projects = persistence.projects.get_all()?;

    let filtered = filter_tasks(&all_tasks, filter_project_id.as_deref(), all);
    if is_machine {
        let json = serde_json::to_string_pretty(&filtered)?;
        return Ok(CliOutput::Json(json));
    }

    if filtered.is_empty() {
        return Ok(CliOutput::Success(MSG_NO_TASKS_FOUND.to_string()));
    }

    Ok(CliOutput::Success(render_task_hierarchy(
        &filtered, &projects, is_quiet,
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

fn render_task_hierarchy(tasks: &[&Task], projects: &[Project], is_quiet: bool) -> String {
    let hierarchy = TaskHierarchy::partition(tasks);
    let project_names: HashMap<&str, &str> = projects
        .iter()
        .map(|p| (p.id.as_str(), p.name.as_str()))
        .collect();

    let mut out = if is_quiet {
        String::new()
    } else {
        String::from(HEADER_TASKS)
    };

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
    rate: Option<String>,
    rate_cents: Option<u64>,
    is_machine: bool,
) -> Result<CliOutput, CliError> {
    if rate.is_some() && rate_cents.is_some() {
        return Err(CliError::Syntax(CliSyntaxError::InvalidArgs(
            "Cannot specify both --rate and --rate-cents".to_string(),
        )));
    }
    let engine = Engine::new(persistence);
    let valid_name = engine.validate_task_name(&name)?;

    let parent_task = match parent {
        Some(target) => {
            let resolver = EntityResolver::with_mode(persistence, is_machine);
            let p_task = resolver.resolve_task(&target)?;
            engine.validate_task_hierarchy(None, Some(&p_task.id))?;
            Some(p_task)
        }
        None => None,
    };

    let project_id = match project {
        Some(target) => {
            let resolver = EntityResolver::with_mode(persistence, is_machine);
            let p = resolver.resolve_project(&target)?;
            if let Some(ref p_task) = parent_task {
                if p_task.project_id != p.id {
                    return Err(CliError::Business(BusinessRuleViolation::Constraint(
                        "Parent task belongs to a different project".to_string(),
                    )));
                }
            }
            p.id
        }
        None => match parent_task {
            Some(ref p_task) => p_task.project_id.clone(),
            None => resolve_default_project_id(persistence)?,
        },
    };

    let billing = NormalizedBillingCreation::parse(rate, rate_cents, None)?;
    let parent_task_id = parent_task.map(|p| p.id);
    let id = generate_id();
    let mut task = Task::new(id.clone(), project_id, parent_task_id, valid_name);
    task.hourly_rate = billing.hourly_rate;
    task.billing_rate_cents = billing.billing_rate_cents;

    persistence.tasks.create(task)?;
    if is_machine {
        return Ok(CliOutput::Json(
            serde_json::json!({
                "status": "ok",
                "id": id,
                "action": "created"
            })
            .to_string(),
        ));
    }
    Ok(CliOutput::Success(MSG_TASK_CREATED.replace("{}", &id)))
}

fn set_task_rate(
    persistence: &Persistence,
    target: &str,
    rate: String,
    currency: Option<String>,
    cents: bool,
    is_machine: bool,
) -> Result<CliOutput, CliError> {
    validate_id(target)?;
    let resolver = EntityResolver::with_mode(persistence, is_machine);
    let mut task = resolver.resolve_task(target)?;

    let trimmed = rate.trim();
    let (rate_arg, rate_cents_arg) = if cents {
        if trimmed.eq_ignore_ascii_case("inherit")
            || trimmed.eq_ignore_ascii_case("none")
            || trimmed.eq_ignore_ascii_case("clear")
        {
            (Some(rate), None)
        } else {
            let parsed_cents = trimmed.parse::<u64>().map_err(|_| {
                crate::engine::EngineError::Validation(format!("Invalid cents rate: '{}'", rate))
            })?;
            (None, Some(parsed_cents))
        }
    } else {
        (Some(rate), None)
    };

    let billing_update = NormalizedBillingUpdate::parse(rate_arg, rate_cents_arg, currency)?;
    billing_update.apply_to_task(&mut task);

    persistence.tasks.patch(task.clone())?;

    if is_machine {
        return Ok(CliOutput::Json(
            serde_json::json!({
                "status": "ok",
                "id": task.id,
                "hourly_rate": task.hourly_rate,
                "billing_rate_cents": task.billing_rate_cents,
                "currency": task.currency,
                "billing_currency": task.billing_currency,
                "action": "rate_updated"
            })
            .to_string(),
        ));
    }

    let rate_display = task.hourly_rate.as_deref().unwrap_or("inherited");
    let curr_display = task
        .currency
        .as_deref()
        .map(|c| format!(" ({})", c))
        .unwrap_or_default();
    Ok(CliOutput::Success(format!(
        "Updated billing rate for task '{}' ({}) to {}{}.",
        task.name, task.id, rate_display, curr_display
    )))
}

fn resolve_default_project_id(persistence: &Persistence) -> Result<String, CliError> {
    let all_projects = persistence.projects.get_all()?;
    let first = all_projects
        .into_iter()
        .find(|p| p.archived != Some(true))
        .ok_or(CliError::Business(BusinessRuleViolation::NoProjectsExist))?;
    Ok(first.id)
}

fn complete_task(
    persistence: &Persistence,
    target: &str,
    is_machine: bool,
) -> Result<CliOutput, CliError> {
    validate_id(target)?;
    let resolver = EntityResolver::with_mode(persistence, is_machine);
    let mut task = resolver.resolve_task(target)?;
    task.completed = true;
    task.status = Some(TaskStatus::Done);
    persistence.tasks.patch(task.clone())?;
    if is_machine {
        return Ok(CliOutput::Json(
            serde_json::json!({
                "status": "ok",
                "id": task.id,
                "action": "completed"
            })
            .to_string(),
        ));
    }
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
    is_machine: bool,
) -> Result<CliOutput, CliError> {
    validate_id(target)?;
    let resolver = EntityResolver::with_mode(persistence, is_machine);
    let mut task = resolver.resolve_task(target)?;
    let engine = Engine::new(persistence);
    task.name = engine.validate_task_name(&new_name)?;
    persistence.tasks.patch(task.clone())?;
    if is_machine {
        return Ok(CliOutput::Json(
            serde_json::json!({
                "status": "ok",
                "id": task.id,
                "action": "renamed"
            })
            .to_string(),
        ));
    }
    Ok(CliOutput::Success(MSG_TASK_RENAMED.replace("{}", &task.id)))
}

fn archive_task(
    persistence: &Persistence,
    target: &str,
    is_machine: bool,
) -> Result<CliOutput, CliError> {
    validate_id(target)?;
    let resolver = EntityResolver::with_mode(persistence, is_machine);
    let task = resolver.resolve_task(target)?;
    persistence
        .tasks
        .archive(task.id.clone(), task.project_id)?;
    if is_machine {
        return Ok(CliOutput::Json(
            serde_json::json!({
                "status": "ok",
                "id": task.id,
                "action": "archived"
            })
            .to_string(),
        ));
    }
    Ok(CliOutput::Success(
        MSG_TASK_ARCHIVED.replace("{}", &task.id),
    ))
}

fn reparent_task(
    persistence: &Persistence,
    target: &str,
    new_parent: &str,
    is_machine: bool,
) -> Result<CliOutput, CliError> {
    validate_id(target)?;
    let resolver = EntityResolver::with_mode(persistence, is_machine);
    let mut task = resolver.resolve_task(target)?;

    let is_detaching =
        new_parent.eq_ignore_ascii_case("none") || new_parent.eq_ignore_ascii_case("root");

    if is_detaching {
        task.parent_task_id = None;
        persistence.tasks.patch(task.clone())?;

        if is_machine {
            return Ok(CliOutput::Json(
                serde_json::json!({
                    "status": "ok",
                    "id": task.id,
                    "parent_id": null,
                    "action": "reparented"
                })
                .to_string(),
            ));
        }

        return Ok(CliOutput::Success(
            MSG_TASK_DETACHED.replace("{}", &task.name),
        ));
    }

    validate_id(new_parent)?;
    let parent_task = resolver.resolve_task(new_parent)?;

    if task.id == parent_task.id {
        return Err(CliError::Business(BusinessRuleViolation::Constraint(
            ERR_REPARENT_SELF.to_string(),
        )));
    }

    if task.project_id != parent_task.project_id {
        return Err(CliError::Business(BusinessRuleViolation::Constraint(
            ERR_REPARENT_DIFFERENT_PROJECT.to_string(),
        )));
    }

    let engine = Engine::new(persistence);
    engine.validate_task_hierarchy(Some(&task.id), Some(&parent_task.id))?;

    task.parent_task_id = Some(parent_task.id.clone());
    persistence.tasks.patch(task.clone())?;

    if is_machine {
        return Ok(CliOutput::Json(
            serde_json::json!({
                "status": "ok",
                "id": task.id,
                "parent_id": parent_task.id,
                "action": "reparented"
            })
            .to_string(),
        ));
    }

    Ok(CliOutput::Success(
        MSG_TASK_REPARENTED
            .replacen("{}", &task.name, 1)
            .replacen("{}", &parent_task.name, 1),
    ))
}

fn move_task(
    persistence: &Persistence,
    target: &str,
    new_project: &str,
    is_machine: bool,
) -> Result<CliOutput, CliError> {
    validate_id(target)?;
    let resolver = EntityResolver::with_mode(persistence, is_machine);
    let mut task = resolver.resolve_task(target)?;
    let target_project = resolver.resolve_project(new_project)?;

    if task.project_id == target_project.id {
        if is_machine {
            return Ok(CliOutput::Json(
                serde_json::json!({
                    "status": "ok",
                    "id": task.id,
                    "project_id": target_project.id,
                    "action": "moved"
                })
                .to_string(),
            ));
        }
        return Ok(CliOutput::Success(
            MSG_TASK_MOVED
                .replacen("{}", &task.name, 1)
                .replacen("{}", &target_project.name, 1),
        ));
    }

    task.parent_task_id = None;
    task.project_id = target_project.id.clone();
    persistence.tasks.patch(task.clone())?;

    cascade_move_descendants(persistence, &task.id, &target_project.id)?;

    if is_machine {
        return Ok(CliOutput::Json(
            serde_json::json!({
                "status": "ok",
                "id": task.id,
                "project_id": target_project.id,
                "action": "moved"
            })
            .to_string(),
        ));
    }

    Ok(CliOutput::Success(
        MSG_TASK_MOVED
            .replacen("{}", &task.name, 1)
            .replacen("{}", &target_project.name, 1),
    ))
}

fn cascade_move_descendants(
    persistence: &Persistence,
    root_task_id: &str,
    new_project_id: &str,
) -> Result<(), CliError> {
    let all_tasks = persistence.tasks.get_all()?;
    let mut child_map: HashMap<String, Vec<Task>> = HashMap::new();
    for t in all_tasks {
        if let Some(ref pid) = t.parent_task_id {
            child_map.entry(pid.clone()).or_default().push(t);
        }
    }

    let mut queue = vec![root_task_id.to_string()];
    while let Some(current_id) = queue.pop() {
        if let Some(children) = child_map.remove(&current_id) {
            for mut child in children {
                queue.push(child.id.clone());
                child.project_id = new_project_id.to_string();
                persistence.tasks.patch(child)?;
            }
        }
    }

    Ok(())
}
