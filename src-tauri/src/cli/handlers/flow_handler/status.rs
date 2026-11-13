use crate::cli::error::CliError;
use crate::cli::shared::envelope::EnvelopeSchema;
use crate::cli::shared::output::CliOutput;
use crate::engine::Engine;
use crate::types::StatusPayload;

const SCHEMA_STATUS: EnvelopeSchema = EnvelopeSchema::new("oxy.status", 1);

pub fn handle_status(is_machine: bool, engine: &Engine) -> Result<CliOutput, CliError> {
    let active = engine.get_active_logs()?;
    if is_machine {
        return status_envelope(active);
    }
    Ok(CliOutput::Status(active))
}

pub(super) fn status_envelope(active_task_ids: Vec<String>) -> Result<CliOutput, CliError> {
    CliOutput::envelope(
        SCHEMA_STATUS,
        &StatusPayload {
            count: active_task_ids.len() as u32,
            running: !active_task_ids.is_empty(),
            active_task_ids,
        },
    )
}
