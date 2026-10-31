pub mod billing_input;
pub mod config_handler;
pub mod constants;
pub mod db_handler;
pub mod doctor_handler;
pub mod flow_handler;
pub mod log_handler;
pub mod mask_handler;
pub mod project_handler;
pub mod report_handler;
pub mod sink_handler;
pub mod task_handler;

use crate::cli::error::CliError;
use crate::cli::parser::{CliArgs, CliCommand};
use crate::cli::shared::output::CliOutput;
use crate::engine::Engine;
use crate::persistence::Persistence;

pub fn dispatch_command(
    args: CliArgs,
    persistence: &Persistence,
    engine: &Engine,
) -> Result<CliOutput, CliError> {
    let is_machine = args.machine || args.json;
    let is_quiet = args.quiet;
    match args.command {
        None => flow_handler::handle_glance(is_machine, persistence, engine),
        Some(CliCommand::Start(cmd_args)) => {
            flow_handler::handle_start(cmd_args, is_machine, persistence, engine)
        }
        Some(CliCommand::Stop(cmd_args)) => flow_handler::handle_stop(cmd_args, is_machine, engine),
        Some(CliCommand::Switch(cmd_args)) => {
            flow_handler::handle_switch(cmd_args, is_machine, persistence, engine)
        }
        Some(CliCommand::Status) => flow_handler::handle_status(is_machine, engine),
        Some(CliCommand::Today) => flow_handler::handle_today(is_machine, persistence),
        Some(CliCommand::Project(cmd_args)) => {
            project_handler::handle(cmd_args, is_machine, is_quiet, persistence)
        }
        Some(CliCommand::Task(cmd_args)) => {
            task_handler::handle(cmd_args, is_machine, is_quiet, persistence)
        }
        Some(CliCommand::Log(cmd_args)) => {
            log_handler::handle(cmd_args, is_machine, is_quiet, persistence)
        }
        Some(CliCommand::Report(cmd_args)) => {
            report_handler::handle(cmd_args, is_machine, persistence, engine)
        }
        Some(CliCommand::Sink(cmd_args)) => sink_handler::handle(cmd_args, is_machine, persistence),
        Some(CliCommand::Mask(cmd_args)) => mask_handler::handle(cmd_args, is_machine, persistence),
        Some(CliCommand::Config(cmd_args)) => {
            config_handler::handle(cmd_args, is_machine, persistence)
        }
        Some(CliCommand::Doctor(cmd_args)) => {
            doctor_handler::handle(cmd_args, is_machine, persistence, engine)
        }
        Some(CliCommand::Db(cmd_args)) => db_handler::handle(cmd_args, is_machine, persistence),
    }
}
