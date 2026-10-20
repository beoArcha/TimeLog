pub mod flow_handler;
pub mod log_handler;
pub mod project_handler;
pub mod task_handler;

use crate::cli::parser::{CliCommand, ConfigArgs, MaskArgs, ReportArgs, SinkArgs};
use crate::cli::shared::constants::{
    MSG_STUB_CONFIG, MSG_STUB_MASK, MSG_STUB_REPORT, MSG_STUB_SINK,
};
use crate::cli::error::CliError;
use crate::cli::shared::output::CliOutput;
use crate::engine::Engine;
use crate::persistence::Persistence;

pub fn dispatch_command(
    command: Option<CliCommand>,
    persistence: &Persistence,
    engine: &Engine,
) -> Result<CliOutput, CliError> {
    match command {
        None => flow_handler::handle_glance(persistence, engine),
        Some(CliCommand::Start(args)) => flow_handler::handle_start(args, persistence, engine),
        Some(CliCommand::Stop(args)) => flow_handler::handle_stop(args, engine),
        Some(CliCommand::Switch(args)) => flow_handler::handle_switch(args, persistence, engine),
        Some(CliCommand::Status) => flow_handler::handle_status(engine),
        Some(CliCommand::Today) => flow_handler::handle_today(persistence),
        Some(CliCommand::Project(args)) => project_handler::handle(args, persistence),
        Some(CliCommand::Task(args)) => task_handler::handle(args, persistence),
        Some(CliCommand::Log(args)) => log_handler::handle(args, persistence),
        Some(CliCommand::Report(args)) => handle_report_stub(args),
        Some(CliCommand::Sink(args)) => handle_sink_stub(args),
        Some(CliCommand::Mask(args)) => handle_mask_stub(args),
        Some(CliCommand::Config(args)) => handle_config_stub(args),
        Some(CliCommand::Manage(cmd)) => crate::cli::manage::handle(cmd, persistence),
        Some(CliCommand::Timer(cmd)) => crate::cli::timer::handle(cmd, engine),
        Some(CliCommand::Settings(cmd)) => crate::cli::settings::handle(cmd, persistence),
    }
}

// TODO: Implement in Phase 10.4 by rendering Unicode hierarchy trees (--tree)
// and streaming multi-format exports (HTML, CSV, JSON) via report engine.
fn handle_report_stub(_args: ReportArgs) -> Result<CliOutput, CliError> {
    Ok(CliOutput::Success(MSG_STUB_REPORT.to_string()))
}

// TODO: Implement in Phase 10.6 by connecting local append-only CSV audit writers
// and HTTP POST dispatchers on time log lifecycle events.
fn handle_sink_stub(_args: SinkArgs) -> Result<CliOutput, CliError> {
    Ok(CliOutput::Success(MSG_STUB_SINK.to_string()))
}

// TODO: Implement in Phase 10.6 by querying stored action macros from SQLite
// and expanding templated arguments into CLI command invocations.
fn handle_mask_stub(_args: MaskArgs) -> Result<CliOutput, CliError> {
    Ok(CliOutput::Success(MSG_STUB_MASK.to_string()))
}

// TODO: Implement in Phase 10.6 by binding key-value schema inspection
// and modification directly to SQLite app settings tables.
fn handle_config_stub(_args: ConfigArgs) -> Result<CliOutput, CliError> {
    Ok(CliOutput::Success(MSG_STUB_CONFIG.to_string()))
}
