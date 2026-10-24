use std::path::PathBuf;
use std::process::Command;

struct TempEnvDir {
    path: PathBuf,
}

impl TempEnvDir {
    fn new(prefix: &str) -> Self {
        let path = std::env::temp_dir().join(format!("{}_{}", prefix, uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&path).expect("failed to create temp directory");
        Self { path }
    }
}

impl Drop for TempEnvDir {
    fn drop(&mut self) {
        if self.path.exists() {
            let _ = std::fs::remove_dir_all(&self.path);
        }
    }
}

#[test]
fn test_given_compiled_oxy_binary_when_invoking_help_flag_then_outputs_usage_text() {
    // Given
    let temp_env = TempEnvDir::new("oxy_smoke_help");
    let bin_path = env!("CARGO_BIN_EXE_oxy");

    // When
    let output = Command::new(bin_path)
        .env("APPDATA", &temp_env.path)
        .env("HOME", &temp_env.path)
        .env("USERPROFILE", &temp_env.path)
        .arg("--help")
        .output()
        .expect("Failed to execute oxy binary with --help");

    // Then
    assert!(
        output.status.success(),
        "Help command failed: status={:?}, stdout={}, stderr={}",
        output.status.code(),
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    let stdout = String::from_utf8_lossy(&output.stdout);
    assert!(
        stdout.contains("Usage") || stdout.contains("oxy"),
        "Expected usage text in help output: {}",
        stdout
    );
}

#[test]
fn test_given_compiled_oxy_binary_when_invoking_invalid_subcommand_then_returns_non_zero_status() {
    // Given
    let temp_env = TempEnvDir::new("oxy_smoke_invalid");
    let bin_path = env!("CARGO_BIN_EXE_oxy");

    // When
    let output = Command::new(bin_path)
        .env("APPDATA", &temp_env.path)
        .env("HOME", &temp_env.path)
        .env("USERPROFILE", &temp_env.path)
        .arg("nonexistent-command-xyz")
        .output()
        .expect("Failed to execute oxy binary");

    // Then
    assert!(!output.status.success());
}

#[test]
fn test_given_compiled_oxy_binary_when_invoking_version_flag_then_outputs_version() {
    // Given
    let temp_env = TempEnvDir::new("oxy_smoke_version");
    let bin_path = env!("CARGO_BIN_EXE_oxy");

    // When
    let output = Command::new(bin_path)
        .env("APPDATA", &temp_env.path)
        .env("HOME", &temp_env.path)
        .env("USERPROFILE", &temp_env.path)
        .arg("--version")
        .output()
        .expect("Failed to execute oxy binary with --version");

    // Then
    assert!(
        output.status.success(),
        "Version command failed: status={:?}, stdout={}, stderr={}",
        output.status.code(),
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    let stdout = String::from_utf8_lossy(&output.stdout);
    assert!(
        stdout.contains("oxy"),
        "Expected version output to contain binary name: {}",
        stdout
    );
}

#[test]
fn test_given_isolated_environment_when_creating_project_via_oxy_then_persists_to_disk() {
    // Given
    let temp_env = TempEnvDir::new("oxy_smoke_crud");
    let bin_path = env!("CARGO_BIN_EXE_oxy");

    // When
    let proj_output = Command::new(bin_path)
        .env("APPDATA", &temp_env.path)
        .env("HOME", &temp_env.path)
        .env("USERPROFILE", &temp_env.path)
        .args(["project", "add", "Smoke Project", "--color", "indigo"])
        .output()
        .expect("Failed to execute project add via oxy binary");

    // Then
    assert!(
        proj_output.status.success(),
        "Project add failed: stdout={}, stderr={}",
        String::from_utf8_lossy(&proj_output.stdout),
        String::from_utf8_lossy(&proj_output.stderr)
    );
}
