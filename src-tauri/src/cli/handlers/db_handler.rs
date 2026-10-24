use super::constants::{
    ERR_DB_BACKUP_PATH_EMPTY, ERR_DB_RESTORE_NOT_FOUND, ERR_DB_RESTORE_PATH_EMPTY,
    MSG_DB_BACKUP_SUCCESS, MSG_DB_RESTORE_SUCCESS,
};
use crate::cli::error::{CliError, CliSyntaxError};
use crate::cli::parser::{DbArgs, DbSubcommand};
use crate::cli::shared::output::CliOutput;
use crate::persistence::Persistence;
use std::path::Path;

pub fn handle(
    args: DbArgs,
    is_machine: bool,
    persistence: &Persistence,
) -> Result<CliOutput, CliError> {
    match args.command {
        DbSubcommand::Backup { path } => handle_backup(path, is_machine, persistence),
        DbSubcommand::Restore { path } => handle_restore(path, is_machine, persistence),
    }
}

fn handle_backup(
    path: String,
    is_machine: bool,
    persistence: &Persistence,
) -> Result<CliOutput, CliError> {
    let trimmed = path.trim();
    if trimmed.is_empty() {
        return Err(CliError::Syntax(CliSyntaxError::InvalidArgs(
            ERR_DB_BACKUP_PATH_EMPTY.to_string(),
        )));
    }

    let target_path = Path::new(trimmed);
    if let Some(parent) = target_path.parent() {
        if !parent.as_os_str().is_empty() {
            std::fs::create_dir_all(parent).map_err(|e| {
                CliError::Storage(crate::persistence::PersistenceError::Storage(format!(
                    "Failed to create backup directory: {e}"
                )))
            })?;
        }
    }

    persistence.core.backup_database(target_path)?;

    if is_machine {
        let json = serde_json::json!({
            "status": "ok",
            "action": "backup",
            "destination": trimmed
        });
        return Ok(CliOutput::Json(json.to_string()));
    }

    Ok(CliOutput::Success(
        MSG_DB_BACKUP_SUCCESS.replace("{}", trimmed),
    ))
}

fn handle_restore(
    path: String,
    is_machine: bool,
    persistence: &Persistence,
) -> Result<CliOutput, CliError> {
    let trimmed = path.trim();
    if trimmed.is_empty() {
        return Err(CliError::Syntax(CliSyntaxError::InvalidArgs(
            ERR_DB_RESTORE_PATH_EMPTY.to_string(),
        )));
    }

    let source_path = Path::new(trimmed);
    if !source_path.exists() {
        return Err(CliError::Syntax(CliSyntaxError::InvalidArgs(
            ERR_DB_RESTORE_NOT_FOUND.replace("{}", trimmed),
        )));
    }

    persistence.core.restore_database(source_path)?;

    if is_machine {
        let json = serde_json::json!({
            "status": "ok",
            "action": "restore",
            "source": trimmed
        });
        return Ok(CliOutput::Json(json.to_string()));
    }

    Ok(CliOutput::Success(
        MSG_DB_RESTORE_SUCCESS.replace("{}", trimmed),
    ))
}
