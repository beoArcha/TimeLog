pub mod constants;
pub mod flow_handler;
pub mod log_handler;
pub mod project_handler;
pub mod report_handler;
pub mod task_handler;

use self::constants::{MSG_STUB_CONFIG, MSG_STUB_MASK, MSG_STUB_SINK};
use crate::cli::error::CliError;
use crate::cli::parser::{CliArgs, CliCommand, ConfigArgs, MaskArgs, SinkArgs};
use crate::cli::shared::output::CliOutput;
use crate::engine::Engine;
use crate::persistence::Persistence;

pub fn dispatch_command(
    args: CliArgs,
    persistence: &Persistence,
    engine: &Engine,
) -> Result<CliOutput, CliError> {
    let is_machine = args.machine || args.json;
    match args.command {
        None => flow_handler::handle_glance(is_machine, persistence, engine),
        Some(CliCommand::Start(cmd_args)) => {
            flow_handler::handle_start(cmd_args, persistence, engine)
        }
        Some(CliCommand::Stop(cmd_args)) => flow_handler::handle_stop(cmd_args, engine),
        Some(CliCommand::Switch(cmd_args)) => {
            flow_handler::handle_switch(cmd_args, persistence, engine)
        }
        Some(CliCommand::Status) => flow_handler::handle_status(is_machine, engine),
        Some(CliCommand::Today) => flow_handler::handle_today(is_machine, persistence),
        Some(CliCommand::Project(cmd_args)) => {
            project_handler::handle(cmd_args, is_machine, persistence)
        }
        Some(CliCommand::Task(cmd_args)) => task_handler::handle(cmd_args, persistence),
        Some(CliCommand::Log(cmd_args)) => log_handler::handle(cmd_args, persistence),
        Some(CliCommand::Report(cmd_args)) => {
            report_handler::handle(cmd_args, is_machine, persistence, engine)
        }
        Some(CliCommand::Sink(cmd_args)) => handle_sink_stub(cmd_args),
        Some(CliCommand::Mask(cmd_args)) => handle_mask_stub(cmd_args),
        Some(CliCommand::Config(cmd_args)) => handle_config_stub(cmd_args),
        Some(CliCommand::Manage(cmd)) => crate::cli::manage::handle(cmd, persistence),
        Some(CliCommand::Timer(cmd)) => crate::cli::timer::handle(cmd, engine),
        Some(CliCommand::Settings(cmd)) => crate::cli::settings::handle(cmd, persistence),
    }
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
