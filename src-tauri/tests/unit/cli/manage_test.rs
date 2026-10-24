use oxy_flow::cli::error::CliErrorCode;
use oxy_flow::cli::manage::project::ProjectCommand;
use oxy_flow::cli::manage::subtask::SubtaskCommand;
use oxy_flow::cli::manage::task::TaskCommand;
use oxy_flow::cli::manage::ManageCommand;
use oxy_flow::persistence::Persistence;
use oxy_flow::types::Project;

use crate::shared::test_db::setup_persistence_test;

#[test]
fn test_manage_project_list_returns_syntax_error_with_exit_code_2() {
    // Arrange
    let (_conn, config, _temp) = setup_persistence_test("test_manage_proj_list");
    let persistence = Persistence::new(&config).expect("failed to create persistence");

    // Act
    let result =
        oxy_flow::cli::manage::handle(ManageCommand::Project(ProjectCommand::List), &persistence);

    // Assert
    assert!(result.is_err());
    let err = result.unwrap_err();
    assert_eq!(err.exit_code(), 2);
    assert_eq!(err.error_code(), CliErrorCode::CliSyntaxUnknownCommand);
}

#[test]
fn test_manage_project_create_with_empty_name_fails_domain_validation() {
    // Arrange
    let (_conn, config, _temp) = setup_persistence_test("test_manage_proj_empty_name");
    let persistence = Persistence::new(&config).expect("failed to create persistence");

    // Act
    let result = oxy_flow::cli::manage::handle(
        ManageCommand::Project(ProjectCommand::Create {
            name: "   ".to_string(),
            color: None,
        }),
        &persistence,
    );

    // Assert
    assert!(result.is_err());
    let err = result.unwrap_err();
    assert_eq!(err.exit_code(), 1);
    assert_eq!(err.error_code(), CliErrorCode::DomBusinessViolation);
}

#[test]
fn test_manage_task_create_with_empty_name_fails_domain_validation() {
    // Arrange
    let (_conn, config, _temp) = setup_persistence_test("test_manage_task_empty_name");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let proj = Project::new(
        "proj_manage_1".to_string(),
        "Manage Project".to_string(),
        "#ff0000".to_string(),
        None,
        None,
        None,
        None,
    );
    persistence.projects.create(proj).unwrap();

    // Act
    let result = oxy_flow::cli::manage::handle(
        ManageCommand::Task(TaskCommand::Create {
            project_id: "proj_manage_1".to_string(),
            name: " \t ".to_string(),
        }),
        &persistence,
    );

    // Assert
    assert!(result.is_err());
    let err = result.unwrap_err();
    assert_eq!(err.exit_code(), 1);
    assert_eq!(err.error_code(), CliErrorCode::DomBusinessViolation);
}

#[test]
fn test_manage_subtask_create_with_empty_name_fails_domain_validation() {
    // Arrange
    let (_conn, config, _temp) = setup_persistence_test("test_manage_subtask_empty_name");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let proj = Project::new(
        "proj_manage_2".to_string(),
        "Manage Project 2".to_string(),
        "#00ff00".to_string(),
        None,
        None,
        None,
        None,
    );
    persistence.projects.create(proj).unwrap();

    // Create a valid parent task first
    let parent_res = oxy_flow::cli::manage::handle(
        ManageCommand::Task(TaskCommand::Create {
            project_id: "proj_manage_2".to_string(),
            name: "Parent Task".to_string(),
        }),
        &persistence,
    )
    .unwrap();
    let tasks = persistence.tasks.get_all().unwrap();
    let parent_id = &tasks[0].id;
    assert!(!parent_res.to_string().is_empty());

    // Act
    let result = oxy_flow::cli::manage::handle(
        ManageCommand::Subtask(SubtaskCommand::Create {
            task_id: parent_id.clone(),
            name: "".to_string(),
        }),
        &persistence,
    );

    // Assert
    assert!(result.is_err());
    let err = result.unwrap_err();
    assert_eq!(err.exit_code(), 1);
    assert_eq!(err.error_code(), CliErrorCode::DomBusinessViolation);
}
