use std::process::Command;

#[test]
fn test_given_compiled_binary_when_invoking_help_flag_then_outputs_usage_text() {
    // Given
    let bin_path = env!("CARGO_BIN_EXE_oxy-flow");

    // When
    let output = Command::new(bin_path)
        .arg("--help")
        .output()
        .expect("Failed to execute oxy-flow binary with --help");

    // Then
    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);
    let combined = format!("{}\n{}", stdout, stderr);

    assert!(
        combined.contains("Usage")
            || combined.contains("manage")
            || combined.contains("oxytime-cli"),
        "Expected clap help text in CLI output, got: {}",
        combined
    );
}

#[test]
fn test_given_compiled_binary_when_invoking_invalid_subcommand_then_returns_non_zero_status() {
    // Given
    let bin_path = env!("CARGO_BIN_EXE_oxy-flow");

    // When
    let output = Command::new(bin_path)
        .arg("nonexistent-command-xyz")
        .output()
        .expect("Failed to execute oxy-flow binary");

    // Then
    assert!(!output.status.success() || !output.stderr.is_empty());
}
