use super::render::render_task_rows;
use crate::cli::error::CliError;
use crate::cli::handlers::constants::{HEADER_TASKS, MSG_NO_TASKS_FOUND};
use crate::cli::resolver::EntityResolver;
use crate::cli::shared::envelope::EnvelopeSchema;
use crate::cli::shared::output::CliOutput;
use crate::persistence::Persistence;
use crate::types::{Task, TaskListPayload};

const SCHEMA_TASK_LIST: EnvelopeSchema = EnvelopeSchema::new("oxy.task.list", 1);

pub(super) fn list_tasks(
    persistence: &Persistence,
    project: Option<String>,
    all: bool,
    is_machine: bool,
    strict: bool,
    is_quiet: bool,
) -> Result<CliOutput, CliError> {
    let filter_project_id = resolve_project_filter(persistence, project, strict)?;
    let all_tasks = persistence.tasks.get_all()?;
    let projects = persistence.projects.get_all()?;

    let filtered = filter_tasks(&all_tasks, filter_project_id.as_deref(), all);
    if is_machine {
        let items: Vec<Task> = filtered.into_iter().cloned().collect();
        return CliOutput::envelope(SCHEMA_TASK_LIST, &TaskListPayload { items });
    }

    if filtered.is_empty() {
        return Ok(CliOutput::empty_list(is_quiet, MSG_NO_TASKS_FOUND));
    }

    let rows = render_task_rows(&filtered, &projects);
    Ok(CliOutput::list(is_quiet, HEADER_TASKS, &rows))
}

fn resolve_project_filter(
    persistence: &Persistence,
    project: Option<String>,
    strict: bool,
) -> Result<Option<String>, CliError> {
    match project {
        Some(target) => {
            let resolver = EntityResolver::with_mode(persistence, strict);
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
        .filter(|t| filter_project_id.is_none_or(|pid| t.project_id == pid))
        .filter(|t| include_all || !(t.completed || t.archived == Some(true)))
        .collect()
}
