use crate::cli::error::CliError;
use crate::cli::handlers::constants::{ERR_MULTIPLE_TIMERS_SPECIFY_ALL, OUT_NOTHING_TO_STOP};
use crate::cli::parser::tier1_flow::StopArgs;
use crate::cli::shared::envelope::EnvelopeSchema;
use crate::cli::shared::output::CliOutput;
use crate::engine::Engine;
use crate::types::{FlowAction, StopPayload};

const SCHEMA_STOP: EnvelopeSchema = EnvelopeSchema::new("oxy.stop", 1);

pub fn handle_stop(
    args: StopArgs,
    is_machine: bool,
    engine: &Engine,
) -> Result<CliOutput, CliError> {
    let active = engine.get_active_logs()?;
    if active.is_empty() {
        if args.if_running {
            return nothing_to_stop_output(is_machine);
        }
        return Err(crate::engine::EngineError::NoActiveTimer.into());
    }
    if active.len() > 1 && !args.all {
        return Err(CliError::business_custom(
            ERR_MULTIPLE_TIMERS_SPECIFY_ALL.replace("{}", &active.len().to_string()),
        ));
    }

    let stopped_count = active.len();
    engine.stop_timer(None)?;
    if is_machine {
        return CliOutput::envelope(
            SCHEMA_STOP,
            &StopPayload {
                action: FlowAction::Stopped,
                stopped_count: stopped_count as u32,
            },
        );
    }
    Ok(CliOutput::Stopped)
}

fn nothing_to_stop_output(is_machine: bool) -> Result<CliOutput, CliError> {
    if is_machine {
        return CliOutput::envelope(
            SCHEMA_STOP,
            &StopPayload {
                action: FlowAction::Noop,
                stopped_count: 0,
            },
        );
    }
    Ok(CliOutput::Success(OUT_NOTHING_TO_STOP.to_string()))
}
