use crate::cli::error::CliError;
use crate::cli::parser::CliArgs;
use crate::cli::shared::utils::split_shell_args;
use crate::cli::{build_error_envelope, extract_early_db_flag, handle_cli, preprocess_args};
use crate::engine::Engine;
use crate::persistence::Persistence;
use crate::types::cli::CliExecutionResult;
use crate::AppState;
use clap::Parser;
use tauri::State;

fn normalize_command_tokens(command_line: &str) -> Vec<String> {
    let mut tokens = split_shell_args(command_line.trim());
    if tokens.is_empty() {
        tokens.push("oxy".to_string());
        return tokens;
    }

    if tokens[0].eq_ignore_ascii_case("oxy") || tokens[0].eq_ignore_ascii_case("oxytime") {
        tokens[0] = "oxy".to_string();
    } else {
        tokens.insert(0, "oxy".to_string());
    }

    tokens
}

/// Executes a raw CLI command string against persistence and engine without requiring Tauri runtime state.
pub fn execute_command_string(
    command_line: &str,
    persistence: &Persistence,
) -> Result<CliExecutionResult, CliExecutionResult> {
    let tokens = normalize_command_tokens(command_line);
    let is_machine_flag = tokens
        .iter()
        .any(|t| t == "--machine" || t == "-m" || t == "--json" || t == "-j");

    let early_db = extract_early_db_flag(&tokens);
    let custom_persistence = if let Some(ref db_flag) = early_db {
        let db_path = match crate::common::paths::resolve_db_path(Some(db_flag)) {
            Ok(p) => p,
            Err(e) => {
                let err = CliError::Storage(crate::persistence::PersistenceError::Storage(
                    format!("Failed to resolve database path: {e}"),
                ));
                let envelope = build_error_envelope(&err, is_machine_flag, None);
                let stdout = envelope.render_to_string(is_machine_flag);
                return Err(CliExecutionResult {
                    success: false,
                    stdout,
                    exit_code: envelope.exit_code,
                    envelope: Some(Box::new(envelope)),
                });
            }
        };
        let csv_directory = crate::common::paths::get_default_csv_dir(&db_path);
        match Persistence::new(&crate::persistence::PersistenceConfig {
            db_path,
            csv_directory,
        }) {
            Ok(p) => Some(p),
            Err(e) => {
                let err = CliError::from(e);
                let envelope = build_error_envelope(&err, is_machine_flag, None);
                let stdout = envelope.render_to_string(is_machine_flag);
                return Err(CliExecutionResult {
                    success: false,
                    stdout,
                    exit_code: envelope.exit_code,
                    envelope: Some(Box::new(envelope)),
                });
            }
        }
    } else {
        None
    };

    let active_persistence = custom_persistence.as_ref().unwrap_or(persistence);
    let engine = Engine::new(active_persistence);

    // Expand macros and aliases before Clap argument parsing.
    let preprocessed = match preprocess_args(&tokens, active_persistence, &engine) {
        Ok(args) => args,
        Err(err) => {
            let envelope = build_error_envelope(&err, is_machine_flag, Some(active_persistence));
            let stdout = envelope.render_to_string(is_machine_flag);
            return Err(CliExecutionResult {
                success: false,
                stdout,
                exit_code: envelope.exit_code,
                envelope: Some(Box::new(envelope)),
            });
        }
    };

    let cli_args = match CliArgs::try_parse_from(&preprocessed) {
        Ok(args) => args,
        Err(clap_err) => {
            let rendered = clap_err.render().to_string();
            let exit_code = clap_err.exit_code() as u8;

            // Clap returns exit code 0 for informational flags such as --help or --version.
            if exit_code == 0 {
                return Ok(CliExecutionResult {
                    success: true,
                    stdout: rendered,
                    exit_code: 0,
                    envelope: None,
                });
            }

            let envelope = build_error_envelope(
                &CliError::syntax_invalid_args(rendered.clone()),
                is_machine_flag,
                Some(active_persistence),
            );

            return Err(CliExecutionResult {
                success: false,
                stdout: rendered,
                exit_code: envelope.exit_code,
                envelope: Some(Box::new(envelope)),
            });
        }
    };

    let is_machine = cli_args.machine || cli_args.json;
    match handle_cli(cli_args, active_persistence, &engine) {
        Ok(output) => Ok(CliExecutionResult {
            success: true,
            stdout: output.to_string(),
            exit_code: 0,
            envelope: None,
        }),
        Err(err) => {
            let envelope = build_error_envelope(&err, is_machine, Some(active_persistence));
            let stdout = envelope.render_to_string(is_machine);
            Err(CliExecutionResult {
                success: false,
                stdout,
                exit_code: envelope.exit_code,
                envelope: Some(Box::new(envelope)),
            })
        }
    }
}

#[tauri::command]
pub fn cli_execute(
    command_line: String,
    state: State<'_, AppState>,
) -> Result<CliExecutionResult, CliExecutionResult> {
    execute_command_string(&command_line, &state.persistence)
}
