use crate::shared::test_db::setup_persistence_test;
use oxy_flow::cli::manage::subtask::{handle as handle_subtask, SubtaskCommand};
use oxy_flow::cli::shared::output::CliOutput;
use oxy_flow::persistence::Persistence;
use oxy_flow::types::{Project, Task};

#[test]
fn test_cli_manage_subtask_create_and_archive() {
    let (_conn, config, _temp_dir) = setup_persistence_test("cli_subtask_test");
    let persistence = Persistence::new(&config).unwrap();

    let proj = Project {
        id: "p_cli_sub".to_string(),
        name: "CliSubProject".to_string(),
        color: "blue".to_string(),
        created_at: "2025-01-01T00:00:00Z".to_string(),
        archived: Some(false),
        original_name: None,
        original_color: None,
        edit_history: None,
        description: None,
        icon: None,
        tags: None,
    };
    persistence.projects.create(proj).unwrap();

    let task = Task {
        id: "t_cli_parent".to_string(),
        project_id: "p_cli_sub".to_string(),
        parent_task_id: None,
        name: "CliParentTask".to_string(),
        created_at: "2025-01-01T00:00:00Z".to_string(),
        completed: false,
        status: None,
        original_name: None,
        original_completed: None,
        edit_history: None,
        archived: Some(false),
    };
    persistence.tasks.create(task).unwrap();

    // Create subtask via CLI
    let create_cmd = SubtaskCommand::Create {
        task_id: "t_cli_parent".to_string(),
        name: "Subtask 1".to_string(),
    };
    let result = handle_subtask(create_cmd, &persistence);
    assert!(result.is_ok());
    if let Ok(CliOutput::Success(msg)) = result {
        assert!(msg.contains("Created subtask with ID:"));
    } else {
        panic!("Expected CliOutput::Success");
    }

    let subtasks = persistence.tasks.get_subtasks("t_cli_parent").unwrap();
    assert_eq!(subtasks.len(), 1);
    assert_eq!(subtasks[0].name, "Subtask 1");
    let subtask_id = subtasks[0].id.clone();

    // Archive subtask via CLI
    let archive_cmd = SubtaskCommand::Archive {
        id: subtask_id,
        task_id: "t_cli_parent".to_string(),
    };
    let archive_result = handle_subtask(archive_cmd, &persistence);
    assert!(archive_result.is_ok());

    // Creating subtask for non-existent parent task fails
    let fail_cmd = SubtaskCommand::Create {
        task_id: "non_existent_task".to_string(),
        name: "Orphan subtask".to_string(),
    };
    let fail_res = handle_subtask(fail_cmd, &persistence);
    assert!(fail_res.is_err());
}
