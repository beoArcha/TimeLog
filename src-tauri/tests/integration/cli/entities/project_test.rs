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
