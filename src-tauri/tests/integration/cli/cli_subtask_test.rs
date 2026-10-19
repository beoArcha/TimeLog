use crate::shared::builders::{ProjectBuilder, TaskBuilder};
use crate::shared::test_db::setup_persistence_test;
use oxy_flow::cli::manage::subtask::{handle as handle_subtask, SubtaskCommand};
use oxy_flow::cli::shared::output::CliOutput;
use oxy_flow::persistence::Persistence;

#[test]
fn test_given_parent_task_when_subtask_created_via_cli_then_subtask_is_persisted_under_parent() {
    // Given
    let (_conn, config, _temp_dir) = setup_persistence_test("cli_subtask_create");
    let persistence = Persistence::new(&config).unwrap();
    let proj = ProjectBuilder::new().with_id("p_cli_sub").build();
    let task = TaskBuilder::new()
        .with_id("t_cli_parent")
        .with_project_id("p_cli_sub")
        .build();
    persistence.projects.create(proj).unwrap();
    persistence.tasks.create(task).unwrap();

    let create_cmd = SubtaskCommand::Create {
        task_id: "t_cli_parent".to_string(),
        name: "Subtask 1".to_string(),
    };

    // When
    let result = handle_subtask(create_cmd, &persistence);

    // Then
    assert!(result.is_ok());
    if let Ok(CliOutput::Success(msg)) = result {
        assert!(msg.contains("Created subtask with ID:"));
    } else {
        panic!("Expected CliOutput::Success");
    }

    let subtasks = persistence.tasks.get_subtasks("t_cli_parent").unwrap();
    assert_eq!(subtasks.len(), 1);
    assert_eq!(subtasks[0].name, "Subtask 1");
}

#[test]
fn test_given_existing_subtask_when_subtask_archived_via_cli_then_archive_operation_succeeds() {
    // Given
    let (_conn, config, _temp_dir) = setup_persistence_test("cli_subtask_archive");
    let persistence = Persistence::new(&config).unwrap();
    let proj = ProjectBuilder::new().with_id("p_cli_sub2").build();
    let parent = TaskBuilder::new()
        .with_id("t_cli_parent2")
        .with_project_id("p_cli_sub2")
        .build();
    let subtask = TaskBuilder::new()
        .with_id("t_cli_child2")
        .with_project_id("p_cli_sub2")
        .with_parent("t_cli_parent2")
        .build();
    persistence.projects.create(proj).unwrap();
    persistence.tasks.create(parent).unwrap();
    persistence.tasks.create(subtask).unwrap();

    let archive_cmd = SubtaskCommand::Archive {
        id: "t_cli_child2".to_string(),
        task_id: "t_cli_parent2".to_string(),
    };

    // When
    let archive_result = handle_subtask(archive_cmd, &persistence);

    // Then
    assert!(archive_result.is_ok());
}

#[test]
fn test_given_nonexistent_parent_task_when_creating_subtask_via_cli_then_returns_error() {
    // Given
    let (_conn, config, _temp_dir) = setup_persistence_test("cli_subtask_err");
    let persistence = Persistence::new(&config).unwrap();
    let fail_cmd = SubtaskCommand::Create {
        task_id: "non_existent_task".to_string(),
        name: "Orphan subtask".to_string(),
    };

    // When
    let fail_res = handle_subtask(fail_cmd, &persistence);

    // Then
    assert!(fail_res.is_err());
}
