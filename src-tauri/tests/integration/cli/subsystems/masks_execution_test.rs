use crate::shared::builders::{ProjectBuilder, TaskBuilder};
use crate::shared::test_db::setup_persistence_test;
use oxy_flow::cli::preprocess_args;
use oxy_flow::cli::shared::utils::current_timestamp;
use oxy_flow::engine::Engine;
use oxy_flow::persistence::Persistence;
use oxy_flow::types::CliAlias;

#[test]
fn test_given_configured_alias_when_preprocessing_invoked_then_expands_to_target_subcommand() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_mask_exec_basic");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let alias = CliAlias {
        name: "standup".to_string(),
        template: "start task-standup".to_string(),
        created_at: current_timestamp(),
    };
    persistence.cli.save_alias(&alias).expect("save alias");

    let raw_args = vec!["oxy".to_string(), "standup".to_string()];

    // When
    let expanded = preprocess_args(&raw_args, &persistence, &engine).expect("preprocess ok");

    // Then
    assert_eq!(
        expanded,
        vec![
            "oxy".to_string(),
            "start".to_string(),
            "task-standup".to_string()
        ]
    );
}

#[test]
fn test_given_alias_with_positional_args_when_preprocessing_then_substitutes_positional_parameters()
{
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_mask_exec_positional");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let alias = CliAlias {
        name: "quicklog".to_string(),
        template: "log add $1 15m \"$2\"".to_string(),
        created_at: current_timestamp(),
    };
    persistence.cli.save_alias(&alias).expect("save alias");

    let raw_args = vec![
        "oxy".to_string(),
        "quicklog".to_string(),
        "task-auth".to_string(),
        "Daily sync".to_string(),
    ];

    // When
    let expanded = preprocess_args(&raw_args, &persistence, &engine).expect("preprocess ok");

    // Then
    assert_eq!(
        expanded,
        vec![
            "oxy".to_string(),
            "log".to_string(),
            "add".to_string(),
            "task-auth".to_string(),
            "15m".to_string(),
            "Daily sync".to_string()
        ]
    );
}

#[test]
fn test_given_alias_with_last_task_when_preprocessing_then_substitutes_recent_task_id() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_mask_exec_last_task");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let project = ProjectBuilder::new().with_id("p_macro").build();
    persistence.projects.create(project).expect("create proj");

    let task = TaskBuilder::new()
        .with_id("task-target-99")
        .with_project_id("p_macro")
        .build();
    persistence.tasks.create(task).expect("create task");

    let new_log = oxy_flow::types::NewTimeLog {
        id: "log_target".to_string(),
        task_id: "task-target-99".to_string(),
        start_time: "2026-10-24T12:00:00Z".to_string(),
        end_time: Some("2026-10-24T12:30:00Z".to_string()),
        note: None,
    };
    persistence
        .time_logs
        .insert_full(&new_log)
        .expect("create log");

    let alias = CliAlias {
        name: "resume".to_string(),
        template: "start $LAST_TASK".to_string(),
        created_at: current_timestamp(),
    };
    persistence.cli.save_alias(&alias).expect("save alias");

    let raw_args = vec!["oxy".to_string(), "resume".to_string()];

    // When
    let expanded = preprocess_args(&raw_args, &persistence, &engine).expect("preprocess ok");

    // Then
    assert_eq!(
        expanded,
        vec![
            "oxy".to_string(),
            "start".to_string(),
            "task-target-99".to_string()
        ]
    );
}

#[test]
fn test_given_circular_aliases_when_preprocessing_then_returns_syntax_error() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_mask_exec_circular");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let alias1 = CliAlias {
        name: "loop1".to_string(),
        template: "loop2".to_string(),
        created_at: current_timestamp(),
    };
    let alias2 = CliAlias {
        name: "loop2".to_string(),
        template: "loop1".to_string(),
        created_at: current_timestamp(),
    };
    persistence.cli.save_alias(&alias1).expect("save loop1");
    persistence.cli.save_alias(&alias2).expect("save loop2");

    let raw_args = vec!["oxy".to_string(), "loop1".to_string()];

    // When
    let result = preprocess_args(&raw_args, &persistence, &engine);

    // Then
    assert!(result.is_err());
    let err = result.unwrap_err();
    assert_eq!(err.exit_code(), 2);
}
