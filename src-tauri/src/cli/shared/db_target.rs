use std::path::Path;

use crate::cli::error::CliError;
use crate::cli::parser::{CliArgs, CliCommand, DbSubcommand};
use crate::cli::shared::constants::ERR_EXPLICIT_DB_NOT_FOUND;
use crate::persistence::error::PersistenceError;

/// An explicit `--db` path must point to an existing file to prevent silent creation of an empty
/// database on typos (which would otherwise produce an empty report and exit code 0).
/// `db restore` is exempt because it is explicitly intended to populate a new target database.
pub fn requires_existing_db(parsed_args: Option<&CliArgs>, explicit_db: Option<&str>) -> bool {
    let Some(raw_path) = explicit_db else {
        return false;
    };
    let trimmed = raw_path.trim();
    if trimmed.is_empty() {
        return false;
    }

    let is_restore = match parsed_args.and_then(|args| args.command.as_ref()) {
        Some(CliCommand::Db(db_args)) => matches!(db_args.command, DbSubcommand::Restore { .. }),
        _ => false,
    };

    !is_restore
}

/// Validates target database existence before opening or creating parent directories.
pub fn validate_db_target(
    parsed_args: Option<&CliArgs>,
    explicit_db: Option<&str>,
) -> Result<(), CliError> {
    validate_db_target_with(parsed_args, explicit_db, |p| p.exists())
}

pub fn validate_db_target_with<F>(
    parsed_args: Option<&CliArgs>,
    explicit_db: Option<&str>,
    exists_check: F,
) -> Result<(), CliError>
where
    F: Fn(&Path) -> bool,
{
    if !requires_existing_db(parsed_args, explicit_db) {
        return Ok(());
    }

    if let Some(db_path) = explicit_db {
        let trimmed = db_path.trim();
        let path = Path::new(trimmed);
        if !exists_check(path) {
            let msg = ERR_EXPLICIT_DB_NOT_FOUND.replacen("{}", trimmed, 1);
            return Err(CliError::Storage(PersistenceError::Initialization(msg)));
        }
    }

    Ok(())
}
