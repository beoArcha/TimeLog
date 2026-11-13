use clap::Parser;
use oxyflow_timelog::cli::error::map_clap_error;
use oxyflow_timelog::cli::{CliArgs, CliSyntaxError};

#[test]
fn test_given_invalid_subcommand_when_mapping_clap_error_then_returns_unknown_command() {
    // Arrange
    let clap_err = CliArgs::try_parse_from(["oxy", "frobnicate"]).unwrap_err();
    assert_eq!(clap_err.kind(), clap::error::ErrorKind::InvalidSubcommand);

    // Act
    let syntax_err = map_clap_error(&clap_err);

    // Assert
    match syntax_err {
        CliSyntaxError::UnknownCommand(msg) => {
            assert!(!msg.starts_with("error:"));
            assert!(!msg.contains('\n'));
            assert!(!msg.contains('\r'));
            assert!(msg.contains("frobnicate"));
        }
        other => panic!("Expected UnknownCommand, got {:?}", other),
    }
}

#[test]
fn test_given_unknown_argument_when_mapping_clap_error_then_returns_invalid_argument_with_field() {
    // Arrange
    let clap_err = CliArgs::try_parse_from(["oxy", "--bogus-flag"]).unwrap_err();
    assert_eq!(clap_err.kind(), clap::error::ErrorKind::UnknownArgument);

    // Act
    let syntax_err = map_clap_error(&clap_err);

    // Assert
    match syntax_err {
        CliSyntaxError::InvalidArgument {
            message: msg,
            field,
            value,
        } => {
            assert!(!msg.starts_with("error:"));
            assert!(!msg.contains('\n'));
            assert!(!msg.contains('\r'));
            assert!(msg.contains("--bogus-flag"));
            assert_eq!(field.as_deref(), Some("--bogus-flag"));
            assert_eq!(value, None);
        }
        other => panic!("Expected InvalidArgument, got {:?}", other),
    }
}

#[test]
fn test_given_invalid_value_when_mapping_clap_error_then_returns_invalid_argument_with_field_and_value(
) {
    // Arrange
    let clap_err = CliArgs::try_parse_from([
        "oxy",
        "report",
        "export",
        "-f",
        "invalid_format",
        "-o",
        "out.txt",
    ])
    .unwrap_err();
    assert_eq!(clap_err.kind(), clap::error::ErrorKind::InvalidValue);

    // Act
    let syntax_err = map_clap_error(&clap_err);

    // Assert
    match syntax_err {
        CliSyntaxError::InvalidArgument {
            message: msg,
            field,
            value,
        } => {
            assert!(!msg.starts_with("error:"));
            assert!(!msg.contains('\n'));
            assert!(!msg.contains('\r'));
            assert!(msg.contains("invalid_format"));
            assert_eq!(field.as_deref(), Some("--format"));
            assert_eq!(value.as_deref(), Some("invalid_format"));
        }
        other => panic!("Expected InvalidArgument, got {:?}", other),
    }
}

#[test]
fn test_given_missing_required_argument_when_mapping_clap_error_then_returns_invalid_args() {
    // Arrange
    let clap_err = CliArgs::try_parse_from(["oxy", "project", "add"]).unwrap_err();
    assert_eq!(
        clap_err.kind(),
        clap::error::ErrorKind::MissingRequiredArgument
    );

    // Act
    let syntax_err = map_clap_error(&clap_err);

    // Assert
    match syntax_err {
        CliSyntaxError::InvalidArgument { message: msg, .. } | CliSyntaxError::InvalidArgs(msg) => {
            assert!(!msg.starts_with("error:"));
            assert!(!msg.contains('\n'));
            assert!(!msg.contains('\r'));
        }
        other => panic!("Expected InvalidArgs or InvalidArgument, got {:?}", other),
    }
}
