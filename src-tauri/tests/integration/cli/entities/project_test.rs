use crate::shared::test_db::setup_persistence_test;
use clap::Parser;
use oxy_flow::cli::{handle_cli, CliArgs};
use oxy_flow::engine::Engine;
use oxy_flow::persistence::Persistence;

#[test]
fn test_given_configured_persistence_when_creating_project_via_cli_then_project_is_persisted() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_entity_project_add");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let args = CliArgs::try_parse_from([
        "oxy",
        "project",
        "add",
        "Client Portal",
        "--color",
        "emerald",
    ])
    .unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let projects = persistence.projects.get_all().unwrap();
    assert_eq!(projects.len(), 1);
    assert_eq!(projects[0].name, "Client Portal");
    assert_eq!(projects[0].color, "emerald");
}

#[test]
fn test_given_existing_project_when_renaming_via_cli_then_database_reflects_new_name() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_entity_project_ren");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let add_args = CliArgs::try_parse_from(["oxy", "p", "add", "Old Project Name"]).unwrap();
    handle_cli(add_args, &persistence, &engine).unwrap();

    let ren_args =
        CliArgs::try_parse_from(["oxy", "p", "ren", "Old Project Name", "New Project Name"])
            .unwrap();

    // When
    let result = handle_cli(ren_args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let projects = persistence.projects.get_all().unwrap();
    assert_eq!(projects.len(), 1);
    assert_eq!(projects[0].name, "New Project Name");
}

#[test]
fn test_given_existing_project_when_listing_projects_then_outputs_project_table() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_entity_project_ls");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let add_args = CliArgs::try_parse_from(["oxy", "p", "add", "Listing Project"]).unwrap();
    handle_cli(add_args, &persistence, &engine).unwrap();

    let list_args = CliArgs::try_parse_from(["oxy", "p", "ls"]).unwrap();

    // When
    let result = handle_cli(list_args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let output_str = format!("{}", result.unwrap());
    assert!(output_str.contains("Listing Project"));
}

#[test]
fn test_given_existing_project_when_archiving_via_cli_then_archive_succeeds() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_entity_project_rm");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let add_args = CliArgs::try_parse_from(["oxy", "p", "add", "To Remove"]).unwrap();
    handle_cli(add_args, &persistence, &engine).unwrap();

    let rm_args = CliArgs::try_parse_from(["oxy", "p", "rm", "To Remove"]).unwrap();

    // When
    let result = handle_cli(rm_args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let projects = persistence.projects.get_all().unwrap();
    assert!(projects.is_empty() || projects.iter().all(|p| p.archived.unwrap_or(false)));
}

#[test]
fn test_given_existing_projects_when_listing_in_machine_mode_then_returns_clean_json_array() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_entity_project_ls_machine");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let add_args = CliArgs::try_parse_from(["oxy", "project", "add", "Machine Project"]).unwrap();
    handle_cli(add_args, &persistence, &engine).unwrap();

    let list_args = CliArgs::try_parse_from(["oxy", "--machine", "project", "ls"]).unwrap();

    // When
    let result = handle_cli(list_args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let rendered = format!("{}", result.unwrap());
    assert!(!rendered.contains('✅'));
    let parsed: serde_json::Value = serde_json::from_str(&rendered).expect("valid JSON array");
    assert!(parsed.is_array());
    assert_eq!(parsed[0]["name"], "Machine Project");
}

#[test]
fn test_given_existing_projects_when_listing_with_quiet_flag_then_omits_table_header() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_entity_project_ls_quiet");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let add_args = CliArgs::try_parse_from(["oxy", "project", "add", "Quiet Project"]).unwrap();
    handle_cli(add_args, &persistence, &engine).unwrap();

    let list_args = CliArgs::try_parse_from(["oxy", "--quiet", "project", "ls"]).unwrap();

    // When
    let result = handle_cli(list_args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let rendered = format!("{}", result.unwrap());
    assert!(!rendered.contains("PROJECTS"));
    assert!(rendered.contains("Quiet Project"));
}

#[test]
fn test_given_configured_persistence_when_creating_project_in_machine_mode_then_returns_json_envelope(
) {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_entity_project_add_machine");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let add_args = CliArgs::try_parse_from([
        "oxy",
        "--json",
        "project",
        "add",
        "Json Project",
        "--color",
        "blue",
    ])
    .unwrap();

    // When
    let result = handle_cli(add_args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let rendered = format!("{}", result.unwrap());
    assert!(!rendered.contains('✅'));
    let parsed: serde_json::Value = serde_json::from_str(&rendered).expect("valid JSON envelope");
    assert_eq!(parsed["status"], "ok");
    assert_eq!(parsed["action"], "created");
    assert!(parsed["id"].is_string());
}

#[test]
fn test_given_existing_project_when_renaming_in_machine_mode_then_returns_json_envelope() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_entity_project_ren_machine");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let add_args = CliArgs::try_parse_from(["oxy", "project", "add", "Initial Name"]).unwrap();
    handle_cli(add_args, &persistence, &engine).unwrap();

    let ren_args = CliArgs::try_parse_from([
        "oxy",
        "--machine",
        "project",
        "ren",
        "Initial Name",
        "Updated Name",
    ])
    .unwrap();

    // When
    let result = handle_cli(ren_args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let rendered = format!("{}", result.unwrap());
    assert!(!rendered.contains('✅'));
    let parsed: serde_json::Value = serde_json::from_str(&rendered).expect("valid JSON envelope");
    assert_eq!(parsed["status"], "ok");
    assert_eq!(parsed["action"], "renamed");
}

#[test]
fn test_given_existing_project_when_archiving_in_machine_mode_then_returns_json_envelope() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_entity_project_rm_machine");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let add_args = CliArgs::try_parse_from(["oxy", "project", "add", "To Archive"]).unwrap();
    handle_cli(add_args, &persistence, &engine).unwrap();

    let rm_args =
        CliArgs::try_parse_from(["oxy", "--machine", "project", "rm", "To Archive"]).unwrap();

    // When
    let result = handle_cli(rm_args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let rendered = format!("{}", result.unwrap());
    assert!(!rendered.contains('✅'));
    let parsed: serde_json::Value = serde_json::from_str(&rendered).expect("valid JSON envelope");
    assert_eq!(parsed["status"], "ok");
    assert_eq!(parsed["action"], "archived");
}
