mod create;
mod hierarchy;
mod list;
mod render;
mod update;

pub use create::AddTaskOptions;
pub use update::TaskRateOptions;

use create::add_task;
use hierarchy::{move_task, reparent_task};
use list::list_tasks;
use update::{archive_task, complete_task, rename_task, set_task_rate};

use crate::cli::error::CliError;
use crate::cli::parser::tier2_entities::{TaskArgs, TaskSubcommand};
use crate::cli::shared::output::CliOutput;
use crate::persistence::Persistence;

pub fn handle(
    args: TaskArgs,
    is_machine: bool,
    strict: bool,
    is_quiet: bool,
    persistence: &Persistence,
) -> Result<CliOutput, CliError> {
    match args.command {
        TaskSubcommand::List { project, all } => {
            list_tasks(persistence, project, all, is_machine, strict, is_quiet)
        }
        TaskSubcommand::Add {
            name,
            project,
            parent,
            rate,
            rate_cents,
        } => add_task(
            persistence,
            AddTaskOptions {
                name,
                project,
                parent,
                rate,
                rate_cents,
            },
            is_machine,
            strict,
            is_quiet,
        ),
        TaskSubcommand::Done { target } => {
            complete_task(persistence, &target, is_machine, strict, is_quiet)
        }
        TaskSubcommand::Rename { target, new_name } => {
            rename_task(persistence, &target, new_name, is_machine, strict, is_quiet)
        }
        TaskSubcommand::Rate {
            target,
            rate,
            currency,
            cents,
        } => set_task_rate(
            persistence,
            &target,
            TaskRateOptions {
                rate,
                currency,
                cents,
            },
            is_machine,
            strict,
            is_quiet,
        ),
        TaskSubcommand::Reparent { target, new_parent } => reparent_task(
            persistence,
            &target,
            &new_parent,
            is_machine,
            strict,
            is_quiet,
        ),
        TaskSubcommand::Move {
            target,
            new_project,
        } => move_task(
            persistence,
            &target,
            &new_project,
            is_machine,
            strict,
            is_quiet,
        ),
        TaskSubcommand::Archive { target } => {
            archive_task(persistence, &target, is_machine, strict, is_quiet)
        }
    }
}
