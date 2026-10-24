use crate::shared::builders::ProjectBuilder;
use crate::shared::test_db::setup_persistence_test;
use clap::Parser;
use oxy_flow::cli::{handle_cli, CliArgs};
use oxy_flow::engine::Engine;
use oxy_flow::persistence::Persistence;

#[test]
fn test_given_active_database_when_db_backup_invoked_then_creates_valid_sqlite_backup() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_db_backup");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let project = ProjectBuilder::new()
        .with_id("p_backup")
        .with_name("Backup Project")
        .build();
    persistence
        .projects
        .create(project)
        .expect("create project");

    let backup_path = std::env::temp_dir().join("oxy_test_backup.db");
    let backup_str = backup_path.to_str().unwrap();

    let args = CliArgs::try_parse_from(["oxy", "db", "backup", backup_str]).expect("Parse args");

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    assert!(backup_path.exists());

    // Verify backup integrity
    let test_conn = rusqlite::Connection::open(&backup_path).expect("open backup");
    let integrity: String = test_conn
        .query_row("PRAGMA integrity_check", [], |row| row.get(0))
        .expect("integrity check");
    assert_eq!(integrity, "ok");

    let proj_name: String = test_conn
        .query_row(
            "SELECT name FROM projects WHERE id = 'p_backup'",
            [],
            |row| row.get(0),
        )
        .expect("query project in backup");
    assert_eq!(proj_name, "Backup Project");
    let _ = std::fs::remove_file(backup_path);
}

#[test]
fn test_given_backup_file_when_db_restore_invoked_then_restores_data() {
    // Given
    let (_conn, _config, _temp) = setup_persistence_test("test_db_restore");
    let persistence = Persistence::new(&_config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let project = ProjectBuilder::new()
        .with_id("p_restore_target")
        .with_name("Original Project")
        .build();
    persistence
        .projects
        .create(project.clone())
        .expect("create project");

    let backup_path = std::env::temp_dir().join("oxy_test_restore_src.db");
    let backup_str = backup_path.to_str().unwrap();

    let backup_args =
        CliArgs::try_parse_from(["oxy", "db", "backup", backup_str]).expect("Parse backup args");
    handle_cli(backup_args, &persistence, &engine).expect("backup ok");

    // Mutate state: patch the project name
    let mut modified = project.clone();
    modified.name = "Modified Project Name".to_string();
    persistence.projects.patch(modified).expect("patch project");
    assert_eq!(
        persistence
            .projects
            .get("p_restore_target")
            .unwrap()
            .unwrap()
            .name,
        "Modified Project Name"
    );

    // When: restore database
    let restore_args =
        CliArgs::try_parse_from(["oxy", "db", "restore", backup_str]).expect("Parse restore args");
    let result = handle_cli(restore_args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    // Re-verify that project exists in database
    let restored_proj = persistence
        .projects
        .get("p_restore_target")
        .expect("get project")
        .expect("project exists after restore");
    assert_eq!(restored_proj.name, "Original Project");
    let _ = std::fs::remove_file(backup_path);
}

#[test]
fn test_given_nonexistent_backup_file_when_db_restore_invoked_then_returns_syntax_error() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_db_restore_nonexistent");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let nonexistent = "this_file_does_not_exist_at_all.db";
    let restore_args =
        CliArgs::try_parse_from(["oxy", "db", "restore", nonexistent]).expect("Parse restore args");

    // When
    let result = handle_cli(restore_args, &persistence, &engine);

    // Then
    assert!(result.is_err());
    let err = result.unwrap_err();
    assert_eq!(err.exit_code(), 2);
}
