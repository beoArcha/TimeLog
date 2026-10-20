use super::constants::{
    ERR_SINK_INVALID_DIR, ERR_SINK_INVALID_URL, FORMAT_SINK_LIST_ITEM, FORMAT_SINK_TEST_RESULT,
    HEADER_SINKS, MSG_NO_SINKS_CONFIGURED, MSG_SINK_CSV_CONFIGURED, MSG_SINK_TEST_HEADER,
    MSG_SINK_WEBHOOK_CONFIGURED,
};
use crate::cli::error::CliError;
use crate::cli::parser::{SinkArgs, SinkSubcommand};
use crate::cli::shared::output::CliOutput;
use crate::cli::shared::utils::current_timestamp;
use crate::persistence::Persistence;
use crate::types::CliSink;
use serde_json::json;
use std::path::Path;

pub fn handle(
    args: SinkArgs,
    is_machine: bool,
    persistence: &Persistence,
) -> Result<CliOutput, CliError> {
    match args.command {
        SinkSubcommand::List => list_sinks(is_machine, persistence),
        SinkSubcommand::SetCsv { dir } => set_csv_sink(dir, is_machine, persistence),
        SinkSubcommand::SetWebhook { url, token } => {
            set_webhook_sink(url, token, is_machine, persistence)
        }
        SinkSubcommand::Test => test_sinks(is_machine, persistence),
    }
}

fn list_sinks(is_machine: bool, persistence: &Persistence) -> Result<CliOutput, CliError> {
    let sinks = persistence
        .cli
        .get_all_sinks()
        .map_err(|e| CliError::Storage(e.to_string()))?;

    if is_machine {
        let json_str = serde_json::to_string_pretty(&sinks).unwrap_or_else(|_| "[]".to_string());
        return Ok(CliOutput::Success(json_str));
    }

    if sinks.is_empty() {
        return Ok(CliOutput::Success(MSG_NO_SINKS_CONFIGURED.to_string()));
    }

    let mut out = String::from(HEADER_SINKS);
    for sink in &sinks {
        let status = if sink.enabled { "Enabled" } else { "Disabled" };
        out.push_str(
            &FORMAT_SINK_LIST_ITEM
                .replacen("{}", &sink.sink_type, 1)
                .replacen("{}", &sink.name, 1)
                .replacen("{}", &sink.target, 1)
                .replacen("{}", status, 1),
        );
    }

    Ok(CliOutput::Success(out))
}

fn set_csv_sink(
    dir: String,
    is_machine: bool,
    persistence: &Persistence,
) -> Result<CliOutput, CliError> {
    if dir.trim().is_empty() {
        return Err(CliError::Syntax(ERR_SINK_INVALID_DIR.to_string()));
    }

    let path = Path::new(&dir);
    if !path.exists() {
        std::fs::create_dir_all(path)
            .map_err(|e| CliError::Storage(format!("Cannot create target directory: {}", e)))?;
    }

    let sink = CliSink {
        name: "csv".to_string(),
        sink_type: "csv".to_string(),
        target: dir.clone(),
        config: None,
        enabled: true,
        created_at: current_timestamp(),
    };

    persistence
        .cli
        .save_sink(&sink)
        .map_err(|e| CliError::Storage(e.to_string()))?;

    if is_machine {
        return Ok(CliOutput::Success(
            json!({ "status": "ok", "sink": "csv", "target": dir }).to_string(),
        ));
    }

    Ok(CliOutput::Success(
        MSG_SINK_CSV_CONFIGURED.replacen("{}", &dir, 1),
    ))
}

fn set_webhook_sink(
    url: String,
    token: Option<String>,
    is_machine: bool,
    persistence: &Persistence,
) -> Result<CliOutput, CliError> {
    if !url.starts_with("http://") && !url.starts_with("https://") {
        return Err(CliError::Syntax(ERR_SINK_INVALID_URL.to_string()));
    }

    let config = token.map(|t| json!({ "token": t }).to_string());
    let sink = CliSink {
        name: "webhook".to_string(),
        sink_type: "webhook".to_string(),
        target: url.clone(),
        config,
        enabled: true,
        created_at: current_timestamp(),
    };

    persistence
        .cli
        .save_sink(&sink)
        .map_err(|e| CliError::Storage(e.to_string()))?;

    if is_machine {
        return Ok(CliOutput::Success(
            json!({ "status": "ok", "sink": "webhook", "target": url }).to_string(),
        ));
    }

    Ok(CliOutput::Success(
        MSG_SINK_WEBHOOK_CONFIGURED.replacen("{}", &url, 1),
    ))
}

fn test_sinks(is_machine: bool, persistence: &Persistence) -> Result<CliOutput, CliError> {
    let sinks = persistence
        .cli
        .get_all_sinks()
        .map_err(|e| CliError::Storage(e.to_string()))?;

    if sinks.is_empty() {
        if is_machine {
            return Ok(CliOutput::Success(json!([]).to_string()));
        }
        return Ok(CliOutput::Success(MSG_NO_SINKS_CONFIGURED.to_string()));
    }

    let mut results = Vec::new();
    let mut out = String::from(MSG_SINK_TEST_HEADER);

    for sink in &sinks {
        let (passed, detail) = test_single_sink(sink);
        let icon = if passed { "✅" } else { "❌" };
        let status_text = if passed { "healthy" } else { "unreachable" };

        results.push(json!({
            "name": sink.name,
            "type": sink.sink_type,
            "target": sink.target,
            "passed": passed,
            "detail": detail
        }));

        out.push_str(
            &FORMAT_SINK_TEST_RESULT
                .replacen("{}", icon, 1)
                .replacen("{}", &sink.sink_type, 1)
                .replacen("{}", &sink.name, 1)
                .replacen("{}", &format!("{status_text} ({detail})"), 1),
        );
    }

    if is_machine {
        return Ok(CliOutput::Success(
            serde_json::to_string_pretty(&results).unwrap_or_else(|_| "[]".to_string()),
        ));
    }

    Ok(CliOutput::Success(out))
}

fn test_single_sink(sink: &CliSink) -> (bool, String) {
    if sink.sink_type == "csv" {
        let path = Path::new(&sink.target);
        if !path.exists() {
            if let Err(e) = std::fs::create_dir_all(path) {
                return (false, format!("directory cannot be created: {}", e));
            }
        }
        let test_file = path.join(".oxy_sink_test");
        if let Err(e) = std::fs::write(&test_file, b"test") {
            return (false, format!("directory not writable: {}", e));
        }
        let _ = std::fs::remove_file(&test_file);
        return (true, "write permission verified".to_string());
    }

    if sink.sink_type == "webhook" {
        if sink.target.starts_with("http://") || sink.target.starts_with("https://") {
            return (true, "URL endpoint syntax verified".to_string());
        }
        return (false, "invalid protocol scheme".to_string());
    }

    (false, format!("unknown sink type: {}", sink.sink_type))
}
