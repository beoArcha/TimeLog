use chrono::Utc;
use oxy_flow::persistence::Persistence;
use oxy_flow::workflows::WorkflowDaemon;
use std::sync::Arc;

use crate::shared::builders::WorkflowConfigBuilder;
use crate::shared::test_db::setup_persistence_test;

#[test]
fn test_workflow_daemon_initial_state_is_idle() {
    // Arrange
    let daemon = WorkflowDaemon::new(None);

    // Act
    let is_running = daemon.is_running();
    let status = daemon.get_status();

    // Assert
    assert!(!is_running);
    assert!(!status.is_daemon_running);
}

#[test]
fn test_workflow_daemon_start_sets_running_state() {
    // Arrange
    let (_conn, config, _temp_dir) = setup_persistence_test("test_daemon_start");
    let persistence = Arc::new(Persistence::new(&config).unwrap());
    let daemon = WorkflowDaemon::new(None);

    // Act
    daemon.start(persistence);

    // Assert
    assert!(daemon.is_running());
    assert!(daemon.get_status().is_daemon_running);

    // Teardown background daemon worker thread
    daemon.stop();
}

#[test]
fn test_workflow_daemon_stop_sets_stopped_state() {
    // Arrange
    let (_conn, config, _temp_dir) = setup_persistence_test("test_daemon_stop");
    let persistence = Arc::new(Persistence::new(&config).unwrap());
    let daemon = WorkflowDaemon::new(None);
    daemon.start(persistence);

    // Act
    daemon.stop();

    // Assert
    assert!(!daemon.is_running());
    assert!(!daemon.get_status().is_daemon_running);
}

#[test]
fn test_workflow_daemon_check_rules_now_updates_status() {
    // Arrange
    let (_conn, config, _temp_dir) = setup_persistence_test("test_daemon_check_status");
    let persistence = Arc::new(Persistence::new(&config).unwrap());
    let daemon = WorkflowDaemon::new(None);
    let cfg = WorkflowConfigBuilder::new().build();
    let check_time = Utc::now();

    // Act
    let check_res = daemon
        .check_rules_now(&persistence, &cfg, Some(check_time))
        .unwrap();

    // Assert
    assert!(!check_res.stopped);
    let post_status = daemon.get_status();
    assert_eq!(post_status.last_check_iso, Some(check_time.to_rfc3339()));
}

#[test]
fn test_workflow_status_tracks_last_error_fields() {
    // Arrange
    let daemon = WorkflowDaemon::new(None);

    // Act
    let initial_status = daemon.get_status();

    // Assert
    assert!(initial_status.last_error.is_none());
    assert!(initial_status.last_error_time_iso.is_none());
}

#[test]
fn test_parse_now_iso_accepts_valid_rfc3339() {
    // Arrange
    let valid_iso = Some("2026-10-24T12:00:00Z".to_string());

    // Act
    let res = oxy_flow::commands::workflow::parse_now_iso(valid_iso);

    // Assert
    assert!(res.is_ok());
    assert!(res.unwrap().is_some());
}

#[test]
fn test_parse_now_iso_none_returns_ok_none() {
    // Arrange
    let no_iso = None;

    // Act
    let res = oxy_flow::commands::workflow::parse_now_iso(no_iso);

    // Assert
    assert!(res.is_ok());
    assert!(res.unwrap().is_none());
}

#[test]
fn test_parse_now_iso_rejects_invalid_rfc3339_with_parse_time_error() {
    // Arrange
    let invalid_iso = Some("not-a-valid-timestamp".to_string());

    // Act
    let res = oxy_flow::commands::workflow::parse_now_iso(invalid_iso);

    // Assert
    assert!(res.is_err());
    let err = res.unwrap_err();
    let payload = err.to_payload();
    assert_eq!(payload.code, "DOM_INVALID_TIMESTAMP");
}
