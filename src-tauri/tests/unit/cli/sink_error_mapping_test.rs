use oxyflow_timelog::cli::error::{CliErrorCode, CliErrorEnvelope, SinkError};
use oxyflow_timelog::cli::exporters::{export_csv, export_to_file, flatten_report};
use oxyflow_timelog::cli::formatters::{
    ReportProjectDto, ReportSubtaskDto, ReportTaskDto, ReportTreeDto,
};
use oxyflow_timelog::cli::parser::ExportFormat;
use oxyflow_timelog::cli::shared::constants::{
    EXIT_CODE_GENERIC_FAILURE, MSG_ERR_REMEDIATION_SERIALIZATION, MSG_ERR_REMEDIATION_SINK,
};
use oxyflow_timelog::cli::CliError;
use std::fs;
use tempfile::tempdir;

#[test]
fn test_given_sink_serialization_error_when_converting_to_envelope_then_maps_to_snk_serialization_and_exit_code_1(
) {
    // Arrange
    let error = CliError::Sink(SinkError::Serialization(
        "Corrupted report row structure".to_string(),
    ));

    // Act
    let envelope = error.to_envelope(None);

    // Assert
    assert_eq!(error.error_code(), CliErrorCode::SnkSerialization);
    assert_eq!(error.exit_code(), EXIT_CODE_GENERIC_FAILURE);
    assert_eq!(envelope.code, "SNK_SERIALIZATION");
    assert_eq!(envelope.category, "sink");
    assert_eq!(envelope.exit_code, 1);
    assert_eq!(
        envelope.technical,
        "Sink serialization error: Corrupted report row structure"
    );

    let user_msg = envelope.user.expect("expected user message in envelope");
    assert_eq!(user_msg.locale, "en");
    assert_eq!(
        user_msg.remediation.as_deref(),
        Some(MSG_ERR_REMEDIATION_SERIALIZATION)
    );
    assert_eq!(user_msg.suggestion, None);
}

#[test]
fn test_given_sink_io_error_when_converting_to_envelope_then_maps_to_snk_external_io_and_exit_code_1(
) {
    // Arrange
    let error = CliError::Sink(SinkError::Io("Permission denied (os error 13)".to_string()));

    // Act
    let envelope = error.to_envelope(None);

    // Assert
    assert_eq!(error.error_code(), CliErrorCode::SnkExternalIo);
    assert_eq!(error.exit_code(), EXIT_CODE_GENERIC_FAILURE);
    assert_eq!(envelope.code, "SNK_EXTERNAL_IO");
    assert_eq!(envelope.category, "sink");
    assert_eq!(envelope.exit_code, 1);
    assert_eq!(
        envelope.technical,
        "Sink I/O error: Permission denied (os error 13)"
    );

    let user_msg = envelope.user.expect("expected user message in envelope");
    assert_eq!(user_msg.locale, "en");
    assert_eq!(
        user_msg.remediation.as_deref(),
        Some(MSG_ERR_REMEDIATION_SINK)
    );
    assert_eq!(user_msg.suggestion, None);
}

#[test]
fn test_given_sink_test_failed_when_converting_to_envelope_then_maps_to_snk_external_io_and_exit_code_1(
) {
    // Arrange
    let error = CliError::Sink(SinkError::TestFailed(
        "Webhook sink unreachable at https://example.com/api".to_string(),
    ));

    // Act
    let envelope = error.to_envelope(None);

    // Assert
    assert_eq!(error.error_code(), CliErrorCode::SnkExternalIo);
    assert_eq!(error.exit_code(), EXIT_CODE_GENERIC_FAILURE);
    assert_eq!(envelope.code, "SNK_EXTERNAL_IO");
    assert_eq!(envelope.category, "sink");
    assert_eq!(envelope.exit_code, 1);
    assert_eq!(
        envelope.technical,
        "Sink verification failed: Webhook sink unreachable at https://example.com/api"
    );

    let user_msg = envelope.user.expect("expected user message in envelope");
    assert_eq!(
        user_msg.remediation.as_deref(),
        Some(MSG_ERR_REMEDIATION_SINK)
    );
}

#[test]
fn test_given_sink_errors_when_rendered_to_human_string_then_formats_banner_and_distinct_remediation(
) {
    // Arrange
    let serialization_err =
        CliError::Sink(SinkError::Serialization("Invalid XML payload".to_string()));
    let io_err = CliError::Sink(SinkError::Io("Disk quota exceeded".to_string()));

    // Act
    let human_ser = serialization_err.to_envelope(None).render_to_string(false);
    let human_io = io_err.to_envelope(None).render_to_string(false);

    // Assert serialization formatting
    assert!(human_ser
        .starts_with("Error [SNK_SERIALIZATION]: Sink serialization error: Invalid XML payload"));
    assert!(human_ser.contains(
        "Remediation: Verify report data integrity or try exporting to an alternative format."
    ));
    assert!(!human_ser.contains("Verify target file path permissions"));

    // Assert I/O formatting
    assert!(human_io.starts_with("Error [SNK_EXTERNAL_IO]: Sink I/O error: Disk quota exceeded"));
    assert!(human_io.contains(
        "Remediation: Verify target file path permissions and available storage for output export."
    ));
    assert!(!human_io.contains("Verify report data integrity"));
}

#[test]
fn test_given_sink_errors_when_rendered_to_machine_mode_then_outputs_deterministic_json_without_user_field(
) {
    // Arrange
    let err = CliError::Sink(SinkError::Serialization("JSON cycle detected".to_string()));

    // Act
    let envelope = err.to_machine_envelope();
    let rendered_json = envelope.render_to_string(true);
    let parsed: CliErrorEnvelope =
        serde_json::from_str(&rendered_json).expect("valid JSON envelope");

    // Assert
    assert_eq!(parsed.code, "SNK_SERIALIZATION");
    assert_eq!(parsed.category, "sink");
    assert_eq!(parsed.exit_code, 1);
    assert_eq!(
        parsed.technical,
        "Sink serialization error: JSON cycle detected"
    );
    assert!(parsed.user.is_none());
    assert!(!rendered_json.contains("\"user\":"));
}

#[test]
fn test_given_serialization_and_io_errors_when_cross_checked_then_guarantees_strict_separation_and_no_regression(
) {
    // Arrange
    let ser_err = CliError::Sink(SinkError::Serialization("Encoding error".to_string()));
    let io_err = CliError::Sink(SinkError::Io("Read-only filesystem".to_string()));

    // Act & Assert code separation
    assert_ne!(ser_err.error_code(), io_err.error_code());
    assert_eq!(ser_err.error_code().as_str(), "SNK_SERIALIZATION");
    assert_eq!(io_err.error_code().as_str(), "SNK_EXTERNAL_IO");

    // Act & Assert remediation separation
    let ser_env = ser_err.to_envelope(None);
    let io_env = io_err.to_envelope(None);
    let ser_rem = ser_env.user.unwrap().remediation.unwrap();
    let io_rem = io_env.user.unwrap().remediation.unwrap();

    assert_ne!(ser_rem, io_rem);
    assert_eq!(ser_rem, MSG_ERR_REMEDIATION_SERIALIZATION);
    assert_eq!(io_rem, MSG_ERR_REMEDIATION_SINK);
}

#[test]
fn test_given_export_to_file_when_filesystem_write_fails_then_returns_sink_io_error_mapped_to_snk_external_io(
) {
    // Arrange: Create a read-only destination directory or invalid path
    let tree = ReportTreeDto {
        period: "Today".to_string(),
        total_seconds: 3600,
        total_formatted: "01h 00m".to_string(),
        projects: vec![],
        entries: vec![],
    };

    let temp = tempdir().expect("tempdir creation");
    let invalid_path = temp.path().join("directory_acting_as_file");
    fs::create_dir(&invalid_path).expect("create dir");

    // Act: Attempt to write a file over an existing directory path (triggers OS I/O error)
    let result = export_to_file(&tree, ExportFormat::Csv, invalid_path.to_str().unwrap());

    // Assert
    assert!(result.is_err());
    let err = result.unwrap_err();
    assert_eq!(err.error_code(), CliErrorCode::SnkExternalIo);
    assert_eq!(err.exit_code(), 1);

    match err {
        CliError::Sink(SinkError::Io(msg)) => {
            assert!(msg.contains("Failed to write export file"));
        }
        other => panic!("expected CliError::Sink(SinkError::Io), got {:?}", other),
    }
}

#[test]
fn test_given_domain_time_anomaly_when_exporting_then_returns_sink_serialization_error() {
    // Arrange: Invariant violation: task duration (1000s) < subtask duration (2000s)
    let invalid_tree = ReportTreeDto {
        period: "Anomaly Sprint".to_string(),
        total_seconds: 1000,
        total_formatted: "16m 40s".to_string(),
        projects: vec![ReportProjectDto {
            id: "p1".to_string(),
            name: "Faulty Project".to_string(),
            duration_seconds: 1000,
            duration_formatted: "16m 40s".to_string(),
            percentage: 100.0,
            tasks: vec![ReportTaskDto {
                id: "t1".to_string(),
                name: "Parent Task".to_string(),
                duration_seconds: 1000,
                duration_formatted: "16m 40s".to_string(),
                percentage: 100.0,
                subtasks: vec![ReportSubtaskDto {
                    id: "st1".to_string(),
                    name: "Overlong Subtask".to_string(),
                    duration_seconds: 2000,
                    duration_formatted: "33m 20s".to_string(),
                    percentage: 200.0,
                }],
            }],
        }],
        entries: vec![],
    };

    // Act 1: flatten_report returns RowsError
    let flatten_err = flatten_report(&invalid_tree).unwrap_err();
    let cli_err_from_rows: CliError = flatten_err.into();
    assert_eq!(
        cli_err_from_rows.error_code(),
        CliErrorCode::SnkSerialization
    );
    assert_eq!(cli_err_from_rows.exit_code(), 1);

    // Act 2: Exporter export_csv propagates it as CliError::Sink(SinkError::Serialization)
    let export_result = export_csv(&invalid_tree);

    // Assert
    assert!(export_result.is_err());
    let err = export_result.unwrap_err();
    assert_eq!(err.error_code(), CliErrorCode::SnkSerialization);
    assert_eq!(err.exit_code(), 1);

    match err {
        CliError::Sink(SinkError::Serialization(msg)) => {
            assert!(msg.contains("exceeds parent task duration"));
        }
        other => panic!(
            "expected CliError::Sink(SinkError::Serialization), got {:?}",
            other
        ),
    }
}
