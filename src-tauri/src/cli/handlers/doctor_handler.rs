use super::constants::{
    ERR_DOCTOR_FAILED, FORMAT_DOCTOR_DB_INFO, FORMAT_DOCTOR_ITEM, HEADER_DOCTOR, MSG_DOCTOR_SUCCESS,
};
use crate::cli::error::CliError;
use crate::cli::parser::DoctorArgs;
use crate::cli::shared::envelope::EnvelopeSchema;
use crate::cli::shared::output::CliOutput;
use crate::engine::Engine;
use crate::persistence::Persistence;
use crate::types::{DoctorCheck, DoctorPayload, HealthStatus};

const SCHEMA_DOCTOR: EnvelopeSchema = EnvelopeSchema::new("oxy.doctor", 1);

fn check(name: &str, status: HealthStatus, message: impl Into<String>) -> DoctorCheck {
    DoctorCheck {
        name: name.to_string(),
        status,
        message: message.into(),
    }
}

pub fn handle(
    _args: DoctorArgs,
    is_machine: bool,
    persistence: &Persistence,
    _engine: &Engine,
) -> Result<CliOutput, CliError> {
    let db_path = persistence.core.get_db_path();
    let db_path_str = db_path.display().to_string();

    let mut checks = Vec::new();

    let is_memory_uri = db_path_str.starts_with("file:") || db_path_str.contains(":memory:");
    let (db_exists, db_size) = if is_memory_uri {
        (true, 0)
    } else {
        match std::fs::metadata(db_path) {
            Ok(meta) => (true, meta.len()),
            Err(_) => (false, 0),
        }
    };

    if db_exists {
        let msg = if is_memory_uri {
            "Accessible (in-memory SQLite)".to_string()
        } else {
            format!("Accessible, size: {} bytes", db_size)
        };
        checks.push(check("database_file", HealthStatus::Ok, msg));
    } else {
        checks.push(check(
            "database_file",
            HealthStatus::Error,
            "Database file does not exist on disk",
        ));
    }

    match persistence.core.check_integrity() {
        Ok(res) if res == "ok" => {
            checks.push(check(
                "sqlite_integrity",
                HealthStatus::Ok,
                "PRAGMA integrity_check passed",
            ));
        }
        Ok(other) => {
            checks.push(check(
                "sqlite_integrity",
                HealthStatus::Error,
                format!("Integrity check warning: {other}"),
            ));
        }
        Err(e) => {
            checks.push(check(
                "sqlite_integrity",
                HealthStatus::Error,
                format!("Integrity check execution failed: {e}"),
            ));
        }
    }

    match persistence.debug.get_tables() {
        Ok(tables) => {
            let required = [
                "projects",
                "tasks",
                "time_logs",
                "config",
                "cli_aliases",
                "cli_sinks",
            ];
            let missing: Vec<_> = required
                .iter()
                .filter(|req| !tables.iter().any(|t| t == *req))
                .copied()
                .collect();

            if missing.is_empty() {
                checks.push(check(
                    "schema_tables",
                    HealthStatus::Ok,
                    format!("All core tables verified ({} total)", tables.len()),
                ));
            } else {
                checks.push(check(
                    "schema_tables",
                    HealthStatus::Error,
                    format!("Missing required tables: {:?}", missing),
                ));
            }
        }
        Err(e) => {
            checks.push(check(
                "schema_tables",
                HealthStatus::Error,
                format!("Failed to read schema tables: {e}"),
            ));
        }
    }

    match persistence.cli.get_all_sinks() {
        Ok(sinks) => {
            let mut sinks_ok = true;
            for sink in &sinks {
                if sink.sink_type == "csv" && sink.target.trim().is_empty() {
                    sinks_ok = false;
                }
                if sink.sink_type == "webhook"
                    && !sink.target.starts_with("http://")
                    && !sink.target.starts_with("https://")
                {
                    sinks_ok = false;
                }
            }
            if sinks_ok {
                checks.push(check(
                    "external_sinks",
                    HealthStatus::Ok,
                    format!("{} configured sink(s) verified", sinks.len()),
                ));
            } else {
                checks.push(check(
                    "external_sinks",
                    HealthStatus::Error,
                    "One or more sinks have invalid destination configuration",
                ));
            }
        }
        Err(e) => {
            checks.push(check(
                "external_sinks",
                HealthStatus::Error,
                format!("Failed to inspect sinks: {e}"),
            ));
        }
    }

    let all_ok = checks.iter().all(|c| c.status == HealthStatus::Ok);
    let overall_status = if all_ok {
        HealthStatus::Ok
    } else {
        HealthStatus::Error
    };

    let report = DoctorPayload {
        overall_status,
        db_path: db_path_str.clone(),
        db_size_bytes: db_size,
        checks,
    };

    if is_machine {
        if !all_ok {
            let json_str = serde_json::to_string_pretty(&report)?;
            return Err(CliError::business_custom(format!(
                "{}: {}",
                ERR_DOCTOR_FAILED, json_str
            )));
        }
        return CliOutput::envelope(SCHEMA_DOCTOR, &report);
    }

    let mut out = String::from(HEADER_DOCTOR);
    out.push_str(
        &FORMAT_DOCTOR_DB_INFO
            .replacen("{}", &db_path_str, 1)
            .replacen("{}", &db_size.to_string(), 1),
    );

    for c in &report.checks {
        let badge = if c.status == HealthStatus::Ok {
            "OK"
        } else {
            "FAIL"
        };
        out.push_str(
            &FORMAT_DOCTOR_ITEM
                .replacen("{}", badge, 1)
                .replacen("{}", &c.name, 1)
                .replacen("{}", &c.message, 1),
        );
    }

    if !all_ok {
        return Err(CliError::business_custom(format!(
            "{}\n{}",
            ERR_DOCTOR_FAILED, out
        )));
    }

    out.push('\n');
    out.push_str(MSG_DOCTOR_SUCCESS);
    Ok(CliOutput::Success(out))
}
