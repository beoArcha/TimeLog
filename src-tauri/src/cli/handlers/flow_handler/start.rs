use super::status::status_envelope;
use crate::cli::error::{CliError, CliSyntaxError};
use crate::cli::handlers::constants::{
    LABEL_UNKNOWN_TASK, OUT_ALREADY_TRACKING, OUT_STARTED, OUT_STOPPED_TASK_LINE,
};
use crate::cli::parser::tier1_flow::StartArgs;
use crate::cli::resolver::{
    constants::PROMPT_ENTER_TASK_TARGET, EntityResolver, Prompter, TerminalPrompter,
};
use crate::cli::shared::envelope::EnvelopeSchema;
use crate::cli::shared::output::CliOutput;
use crate::cli::shared::validation::validate_id;
use crate::engine::{Engine, StartOutcome};
use crate::persistence::Persistence;
use crate::types::{FlowAction, StartPayload, Task};

const SCHEMA_START: EnvelopeSchema = EnvelopeSchema::new("oxy.start", 1);

pub fn handle_start(
    args: StartArgs,
    is_machine: bool,
    is_quiet: bool,
    strict: bool,
    persistence: &Persistence,
    engine: &Engine,
) -> Result<CliOutput, CliError> {
    handle_start_with_prompter(
        args,
        is_machine,
        is_quiet,
        strict,
        persistence,
        engine,
        &TerminalPrompter::new(strict),
    )
}

pub fn handle_start_interactive(
    args: StartArgs,
    persistence: &Persistence,
    engine: &Engine,
    prompter: &dyn Prompter,
) -> Result<CliOutput, CliError> {
    handle_start_with_prompter(args, false, false, false, persistence, engine, prompter)
}

pub fn handle_start_with_prompter(
    args: StartArgs,
    is_machine: bool,
    is_quiet: bool,
    strict: bool,
    persistence: &Persistence,
    engine: &Engine,
    prompter: &dyn Prompter,
) -> Result<CliOutput, CliError> {
    let target = match args.target {
        Some(t) => {
            validate_id(&t)?;
            t
        }
        None => {
            let active = engine.get_active_logs()?;
            if !active.is_empty() {
                if is_machine {
                    return status_envelope(persistence);
                }
                return Ok(CliOutput::Status(active));
            }

            if !prompter.is_terminal() {
                return Err(CliError::Syntax(CliSyntaxError::MissingTarget));
            }

            prompter
                .prompt_input(PROMPT_ENTER_TASK_TARGET)
                .filter(|s| !s.trim().is_empty())
                .ok_or(CliError::Syntax(CliSyntaxError::MissingTarget))?
        }
    };

    let resolver = EntityResolver::with_mode(persistence, strict);
    let task = resolver.resolve_task_interactive(&target, prompter)?;

    let outcome = engine.start_timer(&task.id)?;
    render_start_outcome(outcome, &task, is_machine, is_quiet, persistence)
}

fn render_start_outcome(
    outcome: StartOutcome,
    task: &Task,
    is_machine: bool,
    is_quiet: bool,
    persistence: &Persistence,
) -> Result<CliOutput, CliError> {
    match outcome {
        StartOutcome::AlreadyRunning if is_machine => CliOutput::envelope(
            SCHEMA_START,
            &StartPayload {
                action: FlowAction::AlreadyRunning,
                task_id: task.id.clone(),
                time_log_id: None,
                stopped_task_ids: Vec::new(),
            },
        ),
        // No entity is created, so a quiet caller capturing an identifier gets nothing to capture.
        StartOutcome::AlreadyRunning if is_quiet => Ok(CliOutput::Raw(String::new())),
        StartOutcome::AlreadyRunning => Ok(CliOutput::Raw(
            OUT_ALREADY_TRACKING
                .replacen("{}", &task.name, 1)
                .replacen("{}", &task.id, 1),
        )),
        StartOutcome::Started {
            stopped_task_ids,
            time_log_id,
        } if is_machine => CliOutput::envelope(
            SCHEMA_START,
            &StartPayload {
                action: FlowAction::Started,
                task_id: task.id.clone(),
                time_log_id: Some(time_log_id),
                stopped_task_ids,
            },
        ),
        StartOutcome::Started { time_log_id, .. } if is_quiet => Ok(CliOutput::Id(time_log_id)),
        StartOutcome::Started {
            stopped_task_ids, ..
        } if stopped_task_ids.is_empty() => Ok(CliOutput::Started(task.id.clone())),
        StartOutcome::Started {
            stopped_task_ids, ..
        } => {
            let mut text = OUT_STARTED.replace("{}", &task.id);
            for stopped_id in &stopped_task_ids {
                let name = persistence
                    .tasks
                    .get(stopped_id)?
                    .map(|t| t.name)
                    .unwrap_or_else(|| LABEL_UNKNOWN_TASK.to_string());
                text.push('\n');
                text.push_str(
                    &OUT_STOPPED_TASK_LINE
                        .replacen("{}", &name, 1)
                        .replacen("{}", stopped_id, 1),
                );
            }
            Ok(CliOutput::Raw(text))
        }
    }
}
