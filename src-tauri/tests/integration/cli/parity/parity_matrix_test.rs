use crate::shared::builders::{ProjectBuilder, TaskBuilder};
use crate::shared::test_db::setup_persistence_test;
use clap::Parser;
use oxy_flow::cli::{handle_cli, CliArgs};
use oxy_flow::engine::Engine;
use oxy_flow::persistence::Persistence;
use rusqlite::Connection;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct ParityCase {
    id: String,
    #[serde(rename = "commandRust")]
    command_rust: Vec<String>,
    #[serde(rename = "initialActiveTaskId")]
    initial_active_task_id: Option<String>,
    #[serde(rename = "expectSuccess")]
    expect_success: bool,
    #[serde(rename = "expectedPatterns")]
    expected_patterns: Vec<String>,
}

fn setup_parity_persistence(
    db_name: &str,
) -> (Persistence, Connection, crate::shared::test_db::TempCsvDir) {
    let (conn, config, temp_dir) = setup_persistence_test(db_name);
    let persistence = Persistence::new(&config).expect("failed to create persistence layer");

    let project = ProjectBuilder::new()
        .with_id("p1")
        .with_name("Parity Project")
        .with_color("indigo")
        .build();
    let task = TaskBuilder::new()
        .with_id("t1")
        .with_project_id("p1")
        .with_name("Parity Task")
        .build();

    persistence.projects.create(project).unwrap();
    persistence.tasks.create(task).unwrap();

    (persistence, conn, temp_dir)
}

#[test]
fn test_given_shared_cli_parity_matrix_when_executed_in_rust_then_satisfies_cross_runtime_parity() {
    // Given
    let fixture_str = include_str!("../../../../../tests/shared/fixtures/cli-parity-cases.json");
    let cases: Vec<ParityCase> =
        serde_json::from_str(fixture_str).expect("Failed to parse parity matrix JSON");

    for case in cases {
        let db_name = format!("parity_{}", case.id.replace('-', "_"));
        let (persistence, _conn, _temp) = setup_parity_persistence(&db_name);
        let engine = Engine::new(&persistence);

        if let Some(ref task_id) = case.initial_active_task_id {
            engine
                .start_timer(task_id)
                .expect("Failed to start initial timer");
        }

        // When
        let mut full_args = vec!["oxytime-cli".to_string()];
        full_args.extend(case.command_rust.clone());

        match CliArgs::try_parse_from(&full_args) {
            Ok(cli_args) => {
                let result = handle_cli(cli_args, &persistence, &engine);

                // Then
                if case.expect_success {
                    assert!(
                        result.is_ok(),
                        "Expected success for case '{}', got error: {:?}",
                        case.id,
                        result.err()
                    );
                    let output_text = result.unwrap().to_string().to_lowercase();
                    let matches_any = case
                        .expected_patterns
                        .iter()
                        .any(|pat| output_text.contains(&pat.to_lowercase()));
                    assert!(
                        matches_any,
                        "Case '{}' output '{}' did not contain any expected pattern: {:?}",
                        case.id, output_text, case.expected_patterns
                    );
                } else {
                    assert!(
                        result.is_err(),
                        "Expected error for case '{}', but command succeeded",
                        case.id
                    );
                }
            }
            Err(parse_err) => {
                if case.expect_success {
                    panic!(
                        "Clap parse failed for valid case '{}': {}",
                        case.id, parse_err
                    );
                } else {
                    // Rejection of invalid command syntax by clap parser satisfies parity
                    assert!(
                        !case.expect_success,
                        "Expected syntax failure for invalid case '{}'",
                        case.id
                    );
                }
            }
        }
    }
}
