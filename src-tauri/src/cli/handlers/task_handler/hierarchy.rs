use std::collections::HashMap;

use crate::cli::error::{BusinessRuleViolation, CliError};
use crate::cli::handlers::constants::{
    ERR_REPARENT_DIFFERENT_PROJECT, ERR_REPARENT_SELF, MSG_TASK_DETACHED, MSG_TASK_MOVED,
    MSG_TASK_REPARENTED,
};
use crate::cli::resolver::EntityResolver;
use crate::cli::shared::envelope::EnvelopeSchema;
use crate::cli::shared::output::CliOutput;
use crate::cli::shared::validation::validate_id;
use crate::engine::Engine;
use crate::persistence::Persistence;
use crate::types::Task;

const SCHEMA_TASK_REPARENT: EnvelopeSchema = EnvelopeSchema::new("oxy.task.reparent", 1);
const SCHEMA_TASK_MOVE: EnvelopeSchema = EnvelopeSchema::new("oxy.task.move", 1);

pub(super) fn reparent_task(
    persistence: &Persistence,
    target: &str,
    new_parent: &str,
    is_machine: bool,
    strict: bool,
    is_quiet: bool,
) -> Result<CliOutput, CliError> {
    validate_id(target)?;
    let resolver = EntityResolver::with_mode(persistence, strict);
    let mut task = resolver.resolve_task(target)?;

    let is_detaching =
        new_parent.eq_ignore_ascii_case("none") || new_parent.eq_ignore_ascii_case("root");

    if is_detaching {
        task.parent_task_id = None;
        persistence.tasks.patch(task.clone())?;

        if is_machine {
            return CliOutput::envelope(SCHEMA_TASK_REPARENT, &task);
        }

        return Ok(CliOutput::mutation(
            is_quiet,
            &task.id,
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
        return CliOutput::envelope(SCHEMA_TASK_REPARENT, &task);
    }

    Ok(CliOutput::mutation(
        is_quiet,
        &task.id,
        MSG_TASK_REPARENTED
            .replacen("{}", &task.name, 1)
            .replacen("{}", &parent_task.name, 1),
    ))
}

pub(super) fn move_task(
    persistence: &Persistence,
    target: &str,
    new_project: &str,
    is_machine: bool,
    strict: bool,
    is_quiet: bool,
) -> Result<CliOutput, CliError> {
    validate_id(target)?;
    let resolver = EntityResolver::with_mode(persistence, strict);
    let mut task = resolver.resolve_task(target)?;
    let target_project = resolver.resolve_project(new_project)?;

    if task.project_id == target_project.id {
        if is_machine {
            return CliOutput::envelope(SCHEMA_TASK_MOVE, &task);
        }
        return Ok(CliOutput::mutation(
            is_quiet,
            &task.id,
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
        return CliOutput::envelope(SCHEMA_TASK_MOVE, &task);
    }

    Ok(CliOutput::mutation(
        is_quiet,
        &task.id,
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
