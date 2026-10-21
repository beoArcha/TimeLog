use crate::shared::builders::{ProjectBuilder, TaskBuilder};
use crate::shared::test_db::setup_persistence_test;
use clap::Parser;
use oxy_flow::cli::{handle_cli, CliArgs};
use oxy_flow::engine::Engine;
use oxy_flow::persistence::Persistence;

#[test]
fn test_given_project_when_task_add_invoked_then_persists_task_under_project() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_entity_task_add");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let proj = ProjectBuilder::new()
        .with_id("p-t-01")
        .with_name("Main App")
        .build();
    persistence.projects.create(proj).unwrap();

    let args =
        CliArgs::try_parse_from(["oxy", "task", "add", "Build API", "-p", "Main App"]).unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let tasks = persistence.tasks.get_all().unwrap();
    assert_eq!(tasks.len(), 1);
    assert_eq!(tasks[0].name, "Build API");
    assert_eq!(tasks[0].project_id, "p-t-01");
}

#[test]
fn test_given_parent_task_when_subtask_added_via_cli_then_persisted_under_parent() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_entity_subtask_add");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let proj = ProjectBuilder::new()
        .with_id("p-t-02")
        .with_name("Mobile App")
        .build();
    let parent = TaskBuilder::new()
        .with_id("t-parent-01")
        .with_project_id("p-t-02")
        .with_name("Authentication Screen")
        .build();
    persistence.projects.create(proj).unwrap();
    persistence.tasks.create(parent).unwrap();

    let args = CliArgs::try_parse_from([
        "oxy",
        "t",
        "add",
        "Biometric FaceID",
        "-p",
        "Mobile App",
        "--parent",
        "Authentication Screen",
    ])
    .unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let subtasks = persistence.tasks.get_subtasks("t-parent-01").unwrap();
    assert_eq!(subtasks.len(), 1);
    assert_eq!(subtasks[0].name, "Biometric FaceID");
}

#[test]
fn test_given_incomplete_task_when_done_invoked_then_marks_task_completed() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_entity_task_done");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let proj = ProjectBuilder::new()
        .with_id("p-t-03")
        .with_name("Done Proj")
        .build();
    let task = TaskBuilder::new()
        .with_id("t-done-01")
        .with_project_id("p-t-03")
        .with_name("Finish Migration")
        .build();
    persistence.projects.create(proj).unwrap();
    persistence.tasks.create(task).unwrap();

    let args = CliArgs::try_parse_from(["oxy", "t", "done", "Finish Migration"]).unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let task_in_db = persistence.tasks.get("t-done-01").unwrap().unwrap();
    assert!(task_in_db.completed);
}

#[test]
fn test_given_existing_task_when_renaming_via_cli_then_database_reflects_new_name() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_entity_task_ren");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let proj = ProjectBuilder::new()
        .with_id("p-t-04")
        .with_name("Ren Proj")
        .build();
    let task = TaskBuilder::new()
        .with_id("t-ren-01")
        .with_project_id("p-t-04")
        .with_name("Old Task Name")
        .build();
    persistence.projects.create(proj).unwrap();
    persistence.tasks.create(task).unwrap();

    let args =
        CliArgs::try_parse_from(["oxy", "t", "ren", "Old Task Name", "Refactored Task Name"])
            .unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let task_in_db = persistence.tasks.get("t-ren-01").unwrap().unwrap();
    assert_eq!(task_in_db.name, "Refactored Task Name");
}

#[test]
fn test_given_projects_and_tasks_when_task_list_invoked_then_displays_hierarchy_with_subtasks() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_entity_task_hierarchy_ls");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let proj = ProjectBuilder::new()
        .with_id("p-t-05")
        .with_name("List Proj")
        .build();
    let parent = TaskBuilder::new()
        .with_id("t-list-parent")
        .with_project_id("p-t-05")
        .with_name("Parent Container")
        .build();
    let subtask = TaskBuilder::new()
        .with_id("t-list-child")
        .with_project_id("p-t-05")
        .with_parent("t-list-parent")
        .with_name("Nested Child Task")
        .build();

    persistence.projects.create(proj).unwrap();
    persistence.tasks.create(parent).unwrap();
    persistence.tasks.create(subtask).unwrap();

    let args = CliArgs::try_parse_from(["oxy", "t", "ls", "--all"]).unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let output_str = format!("{}", result.unwrap());
    assert!(output_str.contains("Parent Container"));
    assert!(output_str.contains("Nested Child Task"));
}
