use oxy_flow::cli::shared::constants::EXIT_CODE_ENTITY_ERROR;
use oxy_flow::cli::CliErrorEnvelope;
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

fn execute_oxy(env_dir: &TempEnvDir, args: &[&str]) -> std::process::Output {
    let bin_path = env!("CARGO_BIN_EXE_oxy");
    Command::new(bin_path)
        .env("APPDATA", &env_dir.path)
        .env("HOME", &env_dir.path)
        .env("USERPROFILE", &env_dir.path)
        .args(args)
        .output()
        .expect("failed to execute oxy CLI binary")
}

#[test]
fn test_given_isolated_environment_when_executing_full_user_journey_then_all_commands_succeed_and_state_persists(
) {
    // Given
    let temp_env = TempEnvDir::new("oxy_e2e_journey1");

    // When - 1. Add project
    let p_add = execute_oxy(&temp_env, &["p", "add", "Core Engine", "--color", "blue"]);
    // When - 2. Add tasks under project
    let t_auth = execute_oxy(&temp_env, &["t", "add", "Authentication", "-p", "Core"]);
    let t_docs = execute_oxy(&temp_env, &["t", "add", "Documentation", "-p", "Core"]);
    // When - 3. Start timer on Auth
    let start_res = execute_oxy(&temp_env, &["start", "Auth"]);
    // When - 4. Status check
    let st_res = execute_oxy(&temp_env, &["st"]);
    // When - 5. Switch to Documentation (via substring "Doc")
    let sw_res = execute_oxy(&temp_env, &["sw", "Doc"]);
    // When - 6. Stop timer
    let stop_res = execute_oxy(&temp_env, &["stop"]);
    // When - 7. View today summary
    let today_res = execute_oxy(&temp_env, &["today"]);

    // Then
    assert!(
        p_add.status.success(),
        "p add failed: {}",
        String::from_utf8_lossy(&p_add.stderr)
    );
    assert!(
        t_auth.status.success(),
        "t add Auth failed: {}",
        String::from_utf8_lossy(&t_auth.stderr)
    );
    assert!(
        t_docs.status.success(),
        "t add Docs failed: {}",
        String::from_utf8_lossy(&t_docs.stderr)
    );
    assert!(
        start_res.status.success(),
        "start failed: {}",
        String::from_utf8_lossy(&start_res.stderr)
    );
    assert!(
        st_res.status.success(),
        "status failed: {}",
        String::from_utf8_lossy(&st_res.stderr)
    );
    assert!(
        sw_res.status.success(),
        "switch failed: {}",
        String::from_utf8_lossy(&sw_res.stderr)
    );
    assert!(
        stop_res.status.success(),
        "stop failed: {}",
        String::from_utf8_lossy(&stop_res.stderr)
    );
    assert!(
        today_res.status.success(),
        "today failed: {}",
        String::from_utf8_lossy(&today_res.stderr)
    );

    let today_stdout = String::from_utf8_lossy(&today_res.stdout);
    assert!(
        today_stdout.contains("Today")
            || today_stdout.contains("Summary")
            || today_stdout.contains("Core Engine"),
        "Today output should contain summary info: {}",
        today_stdout
    );
}

#[test]
fn test_given_running_timer_when_executing_machine_status_then_outputs_valid_json_on_stdout() {
    // Given
    let temp_env = TempEnvDir::new("oxy_e2e_journey2");
    let _ = execute_oxy(&temp_env, &["p", "add", "Pipeline Project"]);
    let _ = execute_oxy(
        &temp_env,
        &["t", "add", "Pipeline Task", "-p", "Pipeline Project"],
    );
    let _ = execute_oxy(&temp_env, &["start", "Pipeline Task"]);

    // When - Machine pipeline status
    let output = execute_oxy(&temp_env, &["st", "-m", "-j"]);

    // Then
    assert!(
        output.status.success(),
        "Machine status command should succeed: {}",
        String::from_utf8_lossy(&output.stderr)
    );

    let stdout_str = String::from_utf8_lossy(&output.stdout);
    let parsed: serde_json::Value = serde_json::from_str(stdout_str.trim())
        .expect("Machine output on stdout must be valid JSON");

    assert_eq!(parsed.get("running"), Some(&serde_json::json!(true)));
    assert!(
        parsed.get("active_tasks").is_some(),
        "active_tasks should be present in status JSON: {:?}",
        parsed
    );
}

#[test]
fn test_given_nonexistent_target_when_executing_machine_start_then_emits_stderr_json_envelope_and_fails(
) {
    // Given
    let temp_env = TempEnvDir::new("oxy_e2e_journey3");

    // When
    let output = execute_oxy(&temp_env, &["-m", "start", "non_existent_target_xyz_123"]);

    // Then
    assert!(
        !output.status.success(),
        "Command targeting non-existent entity must fail with non-zero exit code"
    );

    let exit_code = output.status.code().unwrap_or(-1);
    assert_eq!(
        exit_code, EXIT_CODE_ENTITY_ERROR as i32,
        "Exit code should map to EXIT_CODE_ENTITY_ERROR (4)"
    );

    let stderr_str = String::from_utf8_lossy(&output.stderr);
    let envelope: CliErrorEnvelope = serde_json::from_str(stderr_str.trim())
        .expect("Stderr output in machine mode must parse into CliErrorEnvelope");

    assert_eq!(envelope.exit_code, EXIT_CODE_ENTITY_ERROR);
    assert_eq!(envelope.category, "entity");
}
