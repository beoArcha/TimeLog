use crate::shared::builders::{ProjectBuilder, TaskBuilder};
use crate::shared::test_db::setup_persistence_test;
use oxy_flow::cli::handlers::flow_handler::handle_start_interactive;
use oxy_flow::cli::parser::tier1_flow::StartArgs;
use oxy_flow::cli::resolver::{EntityResolver, MockPrompter, Prompter, ResolveError};
use oxy_flow::cli::CliOutput;
use oxy_flow::engine::Engine;
use oxy_flow::persistence::Persistence;

#[test]
fn test_given_non_terminal_when_prompt_selection_invoked_then_returns_none() {
    // Arrange
    let prompter = MockPrompter::new_non_terminal();

    // Act
    let result = prompter.prompt_selection("Choose:", 3);

    // Assert
    assert!(!prompter.is_terminal());
    assert_eq!(result, None);
}

#[test]
fn test_given_terminal_when_prompt_input_invoked_then_returns_queued_string() {
    // Arrange
    let prompter = MockPrompter::new_terminal(vec![], vec![Some("auth".to_string())]);

    // Act
    let result = prompter.prompt_input("Task:");

    // Assert
    assert!(prompter.is_terminal());
    assert_eq!(result, Some("auth".to_string()));
}

#[test]
fn test_given_ambiguous_matches_when_user_selects_option_in_terminal_then_resolves_selected_task() {
    // Arrange
    let (_conn, config, _temp) = setup_persistence_test("test_prompter_ambiguous_select");
    let persistence = Persistence::new(&config).unwrap();
    let p = ProjectBuilder::new()
        .with_id("p1")
        .with_name("Core")
        .build();
    let t1 = TaskBuilder::new()
        .with_id("t-auth-01")
        .with_project_id("p1")
        .with_name("Authentication UI")
        .build();
    let t2 = TaskBuilder::new()
        .with_id("t-auth-02")
        .with_project_id("p1")
        .with_name("Authentication API")
        .build();
    persistence.projects.create(p).unwrap();
    persistence.tasks.create(t1).unwrap();
    persistence.tasks.create(t2).unwrap();

    let resolver = EntityResolver::new(&persistence);
    let prompter = MockPrompter::new_terminal(vec![Some(1)], vec![]);

    // Act
    let resolved = resolver.resolve_task_interactive("auth", &prompter);

    // Assert
    assert!(resolved.is_ok());
    let task = resolved.unwrap();
    assert_eq!(task.id, "t-auth-02");
    assert_eq!(task.name, "Authentication API");
}

#[test]
fn test_given_ambiguous_matches_when_user_cancels_selection_then_returns_ambiguous_error() {
    // Arrange
    let (_conn, config, _temp) = setup_persistence_test("test_prompter_ambiguous_cancel");
    let persistence = Persistence::new(&config).unwrap();
    let p = ProjectBuilder::new()
        .with_id("p1")
        .with_name("Core")
        .build();
    let t1 = TaskBuilder::new()
        .with_id("t-auth-01")
        .with_project_id("p1")
        .with_name("Authentication UI")
        .build();
    let t2 = TaskBuilder::new()
        .with_id("t-auth-02")
        .with_project_id("p1")
        .with_name("Authentication API")
        .build();
    persistence.projects.create(p).unwrap();
    persistence.tasks.create(t1).unwrap();
    persistence.tasks.create(t2).unwrap();

    let resolver = EntityResolver::new(&persistence);
    let prompter = MockPrompter::new_terminal(vec![None], vec![]);

    // Act
    let resolved = resolver.resolve_task_interactive("auth", &prompter);

    // Assert
    assert!(matches!(resolved, Err(ResolveError::AmbiguousMatch { .. })));
}

#[test]
fn test_given_empty_target_when_prompter_provides_input_then_starts_timer() {
    // Arrange
    let (_conn, config, _temp) = setup_persistence_test("test_prompter_start_interactive");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);
    let p = ProjectBuilder::new()
        .with_id("p1")
        .with_name("Core")
        .build();
    let t1 = TaskBuilder::new()
        .with_id("t-auth-01")
        .with_project_id("p1")
        .with_name("Authentication UI")
        .build();
    persistence.projects.create(p).unwrap();
    persistence.tasks.create(t1).unwrap();

    let args = StartArgs { target: None };
    let prompter = MockPrompter::new_terminal(vec![], vec![Some("auth".to_string())]);

    // Act
    let result = handle_start_interactive(args, &persistence, &engine, &prompter);

    // Assert
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), CliOutput::Started("t-auth-01".to_string()));
    let active = engine.get_active_logs().unwrap();
    assert_eq!(active, vec!["t-auth-01".to_string()]);
}
