use crate::shared::builders::{ProjectBuilder, TaskBuilder};
use crate::shared::test_db::setup_persistence_test;
use clap::Parser;
use oxyflow_timelog::cli::{handle_cli, CliArgs};
use oxyflow_timelog::engine::Engine;
use oxyflow_timelog::persistence::Persistence;

#[test]
fn test_given_project_name_fragment_when_listing_logs_in_json_mode_then_fails_with_dom_entity_not_found(
) {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_strict_fragment_json");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let proj_id = "p-acme-prod-001";
    let project = ProjectBuilder::new()
        .with_id(proj_id)
        .with_name("Klient ACME")
        .build();
    let task = TaskBuilder::new()
        .with_id("t-acme-01")
        .with_project_id(proj_id)
        .with_name("System Integration")
        .build();

    persistence.projects.create(project).unwrap();
    persistence.tasks.create(task).unwrap();

    let add_log = CliArgs::try_parse_from([
        "oxy",
        "log",
        "add",
        "System Integration",
        "45m",
        "ACME sync",
    ])
    .unwrap();
    handle_cli(add_log, &persistence, &engine).unwrap();

    let args = CliArgs::try_parse_from(["oxy", "log", "ls", "-p", "ACME", "--json"]).unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_err());
    let err = result.unwrap_err();
    assert_eq!(err.exit_code(), 4);
    let envelope = err.to_envelope(None);
    assert_eq!(envelope.code, "DOM_ENTITY_NOT_FOUND");
    assert_eq!(envelope.exit_code, 4);
}

#[test]
fn test_given_exact_project_name_when_listing_logs_in_json_mode_then_succeeds() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_strict_full_name_json");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let proj_id = "p-acme-prod-002";
    let project = ProjectBuilder::new()
        .with_id(proj_id)
        .with_name("Klient ACME")
        .build();
    let task = TaskBuilder::new()
        .with_id("t-acme-02")
        .with_project_id(proj_id)
        .with_name("System Integration")
        .build();

    persistence.projects.create(project).unwrap();
    persistence.tasks.create(task).unwrap();

    let add_log = CliArgs::try_parse_from([
        "oxy",
        "log",
        "add",
        "System Integration",
        "45m",
        "ACME sync",
    ])
    .unwrap();
    handle_cli(add_log, &persistence, &engine).unwrap();

    let args =
        CliArgs::try_parse_from(["oxy", "log", "ls", "-p", "Klient ACME", "--json"]).unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let rendered = format!("{}", result.unwrap());
    let parsed: serde_json::Value = serde_json::from_str(&rendered).expect("valid JSON envelope");
    let items = parsed["data"]["items"].as_array().unwrap();
    assert_eq!(items.len(), 1);
    assert_eq!(items[0]["taskId"], "t-acme-02");
}

#[test]
fn test_given_full_project_id_when_listing_logs_in_json_mode_then_succeeds() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_strict_full_id_json");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let proj_id = "p-acme-prod-003";
    let project = ProjectBuilder::new()
        .with_id(proj_id)
        .with_name("Klient ACME")
        .build();
    let task = TaskBuilder::new()
        .with_id("t-acme-03")
        .with_project_id(proj_id)
        .with_name("System Integration")
        .build();

    persistence.projects.create(project).unwrap();
    persistence.tasks.create(task).unwrap();

    let add_log = CliArgs::try_parse_from([
        "oxy",
        "log",
        "add",
        "System Integration",
        "45m",
        "ACME sync",
    ])
    .unwrap();
    handle_cli(add_log, &persistence, &engine).unwrap();

    let args = CliArgs::try_parse_from(["oxy", "log", "ls", "-p", proj_id, "--json"]).unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let rendered = format!("{}", result.unwrap());
    let parsed: serde_json::Value = serde_json::from_str(&rendered).expect("valid JSON envelope");
    let items = parsed["data"]["items"].as_array().unwrap();
    assert_eq!(items.len(), 1);
    assert_eq!(items[0]["taskId"], "t-acme-03");
}

#[test]
fn test_given_project_name_fragment_when_listing_logs_in_human_mode_then_resolves_successfully() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_human_fragment_resolves");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let proj_id = "p-acme-prod-004";
    let project = ProjectBuilder::new()
        .with_id(proj_id)
        .with_name("Klient ACME")
        .build();
    let task = TaskBuilder::new()
        .with_id("t-acme-04")
        .with_project_id(proj_id)
        .with_name("System Integration")
        .build();

    persistence.projects.create(project).unwrap();
    persistence.tasks.create(task).unwrap();

    let add_log = CliArgs::try_parse_from([
        "oxy",
        "log",
        "add",
        "System Integration",
        "45m",
        "ACME sync",
    ])
    .unwrap();
    handle_cli(add_log, &persistence, &engine).unwrap();

    let args = CliArgs::try_parse_from(["oxy", "log", "ls", "-p", "ACME"]).unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let rendered = format!("{}", result.unwrap());
    assert!(rendered.contains("System Integration") || rendered.contains("ACME sync"));
}
