use chrono::DateTime;
use oxy_flow::cli::shared::constants::MSG_ID_EMPTY;
use oxy_flow::cli::shared::output::CliOutput;
use oxy_flow::cli::shared::utils::{current_timestamp, generate_id};
use oxy_flow::cli::shared::validation::validate_id;
use uuid::Uuid;

#[test]
fn test_validate_id_valid() {
    assert_eq!(validate_id("  my-id-123  "), Ok("my-id-123".to_string()));
    assert_eq!(validate_id("abc"), Ok("abc".to_string()));
}

#[test]
fn test_validate_id_empty() {
    assert_eq!(validate_id(""), Err(MSG_ID_EMPTY.to_string()));
    assert_eq!(validate_id("   "), Err(MSG_ID_EMPTY.to_string()));
    assert_eq!(validate_id("\n\t"), Err(MSG_ID_EMPTY.to_string()));
}

#[test]
fn test_generate_id() {
    let id = generate_id();
    assert!(
        Uuid::parse_str(&id).is_ok(),
        "Generated ID should be a valid UUID"
    );
}

#[test]
fn test_current_timestamp() {
    let ts = current_timestamp();
    assert!(
        DateTime::parse_from_rfc3339(&ts).is_ok(),
        "Generated timestamp should be a valid RFC3339 string"
    );
}

#[test]
fn test_cli_output_started() {
    let out = CliOutput::Started("t-abc-123".to_string());
    let formatted = out.to_string();
    assert!(formatted.contains("t-abc-123"));
    assert!(formatted.contains("Started tracking task"));
}

#[test]
fn test_cli_output_stopped() {
    let out = CliOutput::Stopped;
    let formatted = out.to_string();
    assert!(formatted.contains("Stopped all active projects"));
}

#[test]
fn test_cli_output_status_empty() {
    let out = CliOutput::Status(vec![]);
    let formatted = out.to_string();
    assert!(formatted.contains("Count of Concurrent Tracking Threads: 0"));
}

#[test]
fn test_cli_output_status_multiple() {
    let out = CliOutput::Status(vec!["task-1".to_string(), "task-2".to_string()]);
    let formatted = out.to_string();
    assert!(formatted.contains("Count of Concurrent Tracking Threads: 2"));
    assert!(formatted.contains("task-1"));
    assert!(formatted.contains("task-2"));
}

#[test]
fn test_cli_output_success() {
    let out = CliOutput::Success("Some successful operation".to_string());
    let formatted = out.to_string();
    assert!(formatted.contains("Some successful operation"));
    assert!(formatted.contains("✅"));
}

#[test]
fn test_cli_output_json() {
    let out = CliOutput::Json(r#"{"status":"ok"}"#.to_string());
    let formatted = out.to_string();
    assert_eq!(formatted, r#"{"status":"ok"}"#);
}
