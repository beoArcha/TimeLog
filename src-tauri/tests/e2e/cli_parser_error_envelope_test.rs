use std::path::PathBuf;
use std::process::{Command, Output, Stdio};
use std::time::{Duration, Instant};

struct TempEnvDir {
    path: PathBuf,
}

impl TempEnvDir {
    fn new(prefix: &str) -> Self {
        let path = std::env::temp_dir().join(format!("{}_{}", prefix, uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&path).expect("failed to create temp directory");
        Self { path }
    }

    fn db_path(&self) -> PathBuf {
        self.path.join("test.db")
    }
}

impl Drop for TempEnvDir {
    fn drop(&mut self) {
        if self.path.exists() {
            let _ = std::fs::remove_dir_all(&self.path);
        }
    }
}

fn execute_oxy_with_timeout(env_dir: &TempEnvDir, args: &[&str], timeout: Duration) -> Output {
    let bin_path = env!("CARGO_BIN_EXE_oxy");
    let mut cmd = Command::new(bin_path);
    cmd.env("APPDATA", &env_dir.path)
        .env("HOME", &env_dir.path)
        .env("USERPROFILE", &env_dir.path)
        .args(args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    let mut child = cmd.spawn().expect("failed to spawn oxy CLI binary");
    let start = Instant::now();

    loop {
        match child.try_wait().expect("failed to check child status") {
            Some(_status) => {
                return child
                    .wait_with_output()
                    .expect("failed to read child output");
            }
            None => {
                if start.elapsed() > timeout {
                    let _ = child.kill();
                    panic!("oxy process timed out after {:?}", timeout);
                }
                std::thread::sleep(Duration::from_millis(10));
            }
        }
    }
}

#[test]
fn test_given_invalid_subcommand_in_machine_mode_when_parsing_then_returns_exit_2_with_unknown_command_envelope(
) {
    // Given
    let temp_env = TempEnvDir::new("oxy_e2e_invalid_subcommand");
    let db = temp_env.db_path();
    let db_str = db.to_string_lossy();

    // When
    let output = execute_oxy_with_timeout(
        &temp_env,
        &["--db", &db_str, "frobnicate", "--json"],
        Duration::from_secs(10),
    );

    // Then
    assert_eq!(output.status.code(), Some(2));
    assert!(
        output.stdout.is_empty(),
        "stdout must stay completely empty in machine mode syntax error, got: {}",
        String::from_utf8_lossy(&output.stdout)
    );
    let stderr_str = String::from_utf8_lossy(&output.stderr);
    let json_val: serde_json::Value = serde_json::from_str(&stderr_str)
        .unwrap_or_else(|e| panic!("stderr failed to parse as JSON: {e}\nstderr: {stderr_str}"));
    assert_eq!(json_val["code"], "CLI_SYNTAX_UNKNOWN_COMMAND");
    assert_eq!(json_val["exit_code"], 2);
}

#[test]
fn test_given_unknown_flag_in_machine_mode_when_parsing_then_returns_exit_2_with_invalid_args_envelope(
) {
    // Given
    let temp_env = TempEnvDir::new("oxy_e2e_bogus_flag");
    let db = temp_env.db_path();
    let db_str = db.to_string_lossy();

    // When
    let output = execute_oxy_with_timeout(
        &temp_env,
        &["--db", &db_str, "report", "--bogus-flag", "--json"],
        Duration::from_secs(10),
    );

    // Then
    assert_eq!(output.status.code(), Some(2));
    assert!(
        output.stdout.is_empty(),
        "stdout must stay completely empty in machine mode syntax error, got: {}",
        String::from_utf8_lossy(&output.stdout)
    );
    let stderr_str = String::from_utf8_lossy(&output.stderr);
    let json_val: serde_json::Value = serde_json::from_str(&stderr_str)
        .unwrap_or_else(|e| panic!("stderr failed to parse as JSON: {e}\nstderr: {stderr_str}"));
    assert_eq!(json_val["code"], "CLI_SYNTAX_INVALID_ARGS");
    assert_eq!(json_val["exit_code"], 2);
}

#[test]
fn test_given_invalid_subcommand_in_human_mode_when_parsing_then_returns_exit_2_with_non_json_stderr(
) {
    // Given
    let temp_env = TempEnvDir::new("oxy_e2e_human_subcommand");
    let db = temp_env.db_path();
    let db_str = db.to_string_lossy();

    // When
    let output = execute_oxy_with_timeout(
        &temp_env,
        &["--db", &db_str, "frobnicate"],
        Duration::from_secs(10),
    );

    // Then
    assert_eq!(output.status.code(), Some(2));
    let stderr_str = String::from_utf8_lossy(&output.stderr);
    let parse_result: Result<serde_json::Value, _> = serde_json::from_str(&stderr_str);
    assert!(
        parse_result.is_err(),
        "human mode stderr should not parse as JSON: {}",
        stderr_str
    );
    assert!(
        stderr_str.contains("frobnicate"),
        "human mode stderr should contain subcommand name: {}",
        stderr_str
    );
}

#[test]
fn test_given_help_flag_with_json_when_invoking_then_outputs_help_text_with_exit_0() {
    // Given
    let temp_env = TempEnvDir::new("oxy_e2e_help_json");

    // When
    let output =
        execute_oxy_with_timeout(&temp_env, &["--help", "--json"], Duration::from_secs(10));

    // Then
    assert_eq!(output.status.code(), Some(0));
    let stdout = String::from_utf8_lossy(&output.stdout);
    assert!(
        stdout.contains("Usage") || stdout.contains("oxy"),
        "expected usage text in help output: {}",
        stdout
    );
}
