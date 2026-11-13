use crate::cli::error::CliError;
use crate::cli::handlers::billing_input::NormalizedBillingUpdate;
use crate::cli::handlers::constants::{MSG_TASK_ARCHIVED, MSG_TASK_COMPLETED, MSG_TASK_RENAMED};
use crate::cli::resolver::EntityResolver;
use crate::cli::shared::envelope::EnvelopeSchema;
use crate::cli::shared::output::CliOutput;
use crate::cli::shared::validation::validate_id;
use crate::engine::Engine;
use crate::persistence::Persistence;
use crate::types::{EntityAction, EntityActionPayload, TaskStatus};

const SCHEMA_TASK_DONE: EnvelopeSchema = EnvelopeSchema::new("oxy.task.done", 1);
const SCHEMA_TASK_RENAME: EnvelopeSchema = EnvelopeSchema::new("oxy.task.rename", 1);
const SCHEMA_TASK_RATE: EnvelopeSchema = EnvelopeSchema::new("oxy.task.rate", 1);
const SCHEMA_TASK_ARCHIVE: EnvelopeSchema = EnvelopeSchema::new("oxy.task.archive", 1);

pub struct TaskRateOptions {
    pub rate: String,
    pub currency: Option<String>,
    pub cents: bool,
}

pub(super) fn set_task_rate(
    persistence: &Persistence,
    target: &str,
    opts: TaskRateOptions,
    is_machine: bool,
    strict: bool,
    is_quiet: bool,
) -> Result<CliOutput, CliError> {
    let TaskRateOptions {
        rate,
        currency,
        cents,
    } = opts;
    validate_id(target)?;
    let resolver = EntityResolver::with_mode(persistence, strict);
    let mut task = resolver.resolve_task(target)?;

    let trimmed = rate.trim();
    let (rate_arg, rate_cents_arg) = if cents {
        if trimmed.eq_ignore_ascii_case("inherit")
            || trimmed.eq_ignore_ascii_case("none")
            || trimmed.eq_ignore_ascii_case("clear")
        {
            (Some(rate), None)
        } else {
            let stripped = trimmed
                .strip_suffix('c')
                .or_else(|| trimmed.strip_suffix('¢'))
                .unwrap_or(trimmed);
            let parsed_cents = stripped.trim().parse::<u64>().map_err(|_| {
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
        return CliOutput::envelope(SCHEMA_TASK_RATE, &task);
    }

    let rate_display = task.hourly_rate.as_deref().unwrap_or("inherited");
    let curr_display = task
        .currency
        .as_deref()
        .map(|c| format!(" ({})", c))
        .unwrap_or_default();
    Ok(CliOutput::mutation(
        is_quiet,
        &task.id,
        format!(
            "Updated billing rate for task '{}' ({}) to {}{}.",
            task.name, task.id, rate_display, curr_display
        ),
    ))
}

pub(super) fn complete_task(
    persistence: &Persistence,
    target: &str,
    is_machine: bool,
    strict: bool,
    is_quiet: bool,
) -> Result<CliOutput, CliError> {
    validate_id(target)?;
    let resolver = EntityResolver::with_mode(persistence, strict);
    let mut task = resolver.resolve_task(target)?;
    task.completed = true;
    task.status = Some(TaskStatus::Done);
    persistence.tasks.patch(task.clone())?;
    if is_machine {
        return CliOutput::envelope(SCHEMA_TASK_DONE, &task);
    }
    Ok(CliOutput::mutation(
        is_quiet,
        &task.id,
        MSG_TASK_COMPLETED
            .replacen("{}", &task.name, 1)
            .replacen("{}", &task.id, 1),
    ))
}

pub(super) fn rename_task(
    persistence: &Persistence,
    target: &str,
    new_name: String,
    is_machine: bool,
    strict: bool,
    is_quiet: bool,
) -> Result<CliOutput, CliError> {
    validate_id(target)?;
    let resolver = EntityResolver::with_mode(persistence, strict);
    let mut task = resolver.resolve_task(target)?;
    let engine = Engine::new(persistence);
    task.name = engine.validate_task_name(&new_name)?;
    persistence.tasks.patch(task.clone())?;
    if is_machine {
        return CliOutput::envelope(SCHEMA_TASK_RENAME, &task);
    }
    Ok(CliOutput::mutation(
        is_quiet,
        &task.id,
        MSG_TASK_RENAMED.replace("{}", &task.id),
    ))
}

pub(super) fn archive_task(
    persistence: &Persistence,
    target: &str,
    is_machine: bool,
    strict: bool,
    is_quiet: bool,
) -> Result<CliOutput, CliError> {
    validate_id(target)?;
    let resolver = EntityResolver::with_mode(persistence, strict);
    let task = resolver.resolve_task(target)?;
    persistence
        .tasks
        .archive(task.id.clone(), task.project_id)?;
    if is_machine {
        return CliOutput::envelope(
            SCHEMA_TASK_ARCHIVE,
            &EntityActionPayload {
                id: task.id,
                action: EntityAction::Archived,
            },
        );
    }
    Ok(CliOutput::mutation(
        is_quiet,
        &task.id,
        MSG_TASK_ARCHIVED.replace("{}", &task.id),
    ))
}
