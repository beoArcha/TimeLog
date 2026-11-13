use crate::cli::error::{BusinessRuleViolation, CliError, CliSyntaxError};
use crate::cli::handlers::billing_input::NormalizedBillingCreation;
use crate::cli::handlers::constants::MSG_TASK_CREATED;
use crate::cli::resolver::EntityResolver;
use crate::cli::shared::envelope::EnvelopeSchema;
use crate::cli::shared::output::CliOutput;
use crate::cli::shared::utils::generate_id;
use crate::engine::Engine;
use crate::persistence::Persistence;
use crate::types::Task;

const SCHEMA_TASK_ADD: EnvelopeSchema = EnvelopeSchema::new("oxy.task.add", 1);

pub struct AddTaskOptions {
    pub name: String,
    pub project: Option<String>,
    pub parent: Option<String>,
    pub rate: Option<String>,
    pub rate_cents: Option<u64>,
}

pub(super) fn add_task(
    persistence: &Persistence,
    opts: AddTaskOptions,
    is_machine: bool,
    strict: bool,
    is_quiet: bool,
) -> Result<CliOutput, CliError> {
    let AddTaskOptions {
        name,
        project,
        parent,
        rate,
        rate_cents,
    } = opts;
    if rate.is_some() && rate_cents.is_some() {
        return Err(CliError::Syntax(CliSyntaxError::InvalidArgs(
            "Cannot specify both --rate and --rate-cents".to_string(),
        )));
    }
    let engine = Engine::new(persistence);
    let valid_name = engine.validate_task_name(&name)?;

    let parent_task = match parent {
        Some(target) => {
            let resolver = EntityResolver::with_mode(persistence, strict);
            let p_task = resolver.resolve_task(&target)?;
            engine.validate_task_hierarchy(None, Some(&p_task.id))?;
            Some(p_task)
        }
        None => None,
    };

    let project_id = match project {
        Some(target) => {
            let resolver = EntityResolver::with_mode(persistence, strict);
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

    persistence.tasks.create(task.clone())?;
    if is_machine {
        return CliOutput::envelope(SCHEMA_TASK_ADD, &task);
    }
    Ok(CliOutput::mutation(
        is_quiet,
        &id,
        MSG_TASK_CREATED.replace("{}", &id),
    ))
}

fn resolve_default_project_id(persistence: &Persistence) -> Result<String, CliError> {
    let all_projects = persistence.projects.get_all()?;
    let first = all_projects
        .into_iter()
        .find(|p| p.archived != Some(true))
        .ok_or(CliError::Business(BusinessRuleViolation::NoProjectsExist))?;
    Ok(first.id)
}
