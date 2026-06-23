pub mod manage;
pub mod settings;
pub mod shared;
pub mod timer;

pub use shared::output::CliOutput;
pub use shared::parser::CliArgs;

use crate::engine::Engine;
use crate::persistence::PersistenceLayer;

pub fn handle_cli(
    args: CliArgs,
    persistence: &PersistenceLayer,
    engine: &Engine,
) -> Result<CliOutput, String> {
    match args.command {
        shared::parser::CliCommands::Manage(cmd) => manage::handle(cmd, persistence),
        shared::parser::CliCommands::Settings(cmd) => settings::handle(cmd, persistence),
        shared::parser::CliCommands::Timer(cmd) => timer::handle(cmd, engine),
    }
}
