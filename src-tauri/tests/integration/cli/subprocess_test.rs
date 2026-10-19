use std::process::Command;

#[test]
fn test_cli_subprocess_help_flag() {
    let bin_path = env!("CARGO_BIN_EXE_oxy-flow");
    let output = Command::new(bin_path)
        .arg("--help")
        .output()
        .expect("Failed to execute oxy-flow binary with --help");

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);
    let combined = format!("{}\n{}", stdout, stderr);

    assert!(
        combined.contains("Usage") || combined.contains("manage") || combined.contains("oxytime-cli"),
        "Expected clap help text in CLI output, got: {}",
        combined
    );
}

#[test]
fn test_cli_subprocess_invalid_command() {
    let bin_path = env!("CARGO_BIN_EXE_oxy-flow");
    let output = Command::new(bin_path)
        .arg("nonexistent-command-xyz")
        .output()
        .expect("Failed to execute oxy-flow binary");

    assert!(!output.status.success() || !output.stderr.is_empty());
}
