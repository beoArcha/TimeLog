use crate::cli::error::CliError;
use crate::cli::parser::tier1_flow::SwitchArgs;
use crate::cli::resolver::{EntityResolver, Prompter, TerminalPrompter};
use crate::cli::shared::envelope::EnvelopeSchema;
use crate::cli::shared::output::CliOutput;
use crate::cli::shared::validation::validate_id;
use crate::engine::Engine;
use crate::persistence::Persistence;
use crate::types::{FlowAction, SwitchPayload};

const SCHEMA_SWITCH: EnvelopeSchema = EnvelopeSchema::new("oxy.switch", 1);

pub fn handle_switch(
    args: SwitchArgs,
    is_machine: bool,
    is_quiet: bool,
    strict: bool,
    persistence: &Persistence,
    engine: &Engine,
) -> Result<CliOutput, CliError> {
    handle_switch_with_prompter(
        args,
        is_machine,
        is_quiet,
        strict,
        persistence,
        engine,
        &TerminalPrompter::new(strict),
    )
}

pub fn handle_switch_interactive(
    args: SwitchArgs,
    persistence: &Persistence,
    engine: &Engine,
    prompter: &dyn Prompter,
) -> Result<CliOutput, CliError> {
    handle_switch_with_prompter(args, false, false, false, persistence, engine, prompter)
}

pub fn handle_switch_with_prompter(
    args: SwitchArgs,
    is_machine: bool,
    is_quiet: bool,
    strict: bool,
    persistence: &Persistence,
    engine: &Engine,
    prompter: &dyn Prompter,
) -> Result<CliOutput, CliError> {
    validate_id(&args.target)?;
    let resolver = EntityResolver::with_mode(persistence, strict);
    let task = resolver.resolve_task_interactive(&args.target, prompter)?;

    let time_log_id = engine.switch_timer(&task.id)?;
    if is_machine {
        return CliOutput::envelope(
            SCHEMA_SWITCH,
            &SwitchPayload {
                action: FlowAction::Switched,
                task_id: task.id,
                time_log_id,
            },
        );
    }
    if is_quiet {
        return Ok(CliOutput::Id(time_log_id));
    }
    Ok(CliOutput::Started(task.id))
}
