use crate::shared::builders::{ProjectBuilder, TaskBuilder};
use crate::shared::test_db::setup_persistence_test;
use clap::Parser;
use oxy_flow::cli::handlers::flow_handler::{handle_glance, handle_start_interactive};
use oxy_flow::cli::parser::tier1_flow::StartArgs;
use oxy_flow::cli::resolver::MockPrompter;
use oxy_flow::cli::{handle_cli, CliArgs, CliOutput};
use oxy_flow::engine::Engine;
use oxy_flow::persistence::Persistence;
use rusqlite::Connection;

fn setup(db_name: &str) -> (Persistence, Connection, crate::shared::test_db::TempCsvDir) {
    let (conn, config, temp_dir) = setup_persistence_test(db_name);
    let persistence = Persistence::new(&config).expect("failed to create persistence layer");

    let project = ProjectBuilder::new()
        .with_id("p-interactive-01")
        .with_name("Core API")
        .build();
    let task1 = TaskBuilder::new()
        .with_id("t-oauth-01")
        .with_project_id("p-interactive-01")
        .with_name("OAuth2 Login Flow")
        .build();
    let task2 = TaskBuilder::new()
        .with_id("t-oauth-02")
        .with_project_id("p-interactive-01")
        .with_name("OAuth2 Token Refresh")
        .build();

    persistence.projects.create(project).unwrap();
    persistence.tasks.create(task1).unwrap();
    persistence.tasks.create(task2).unwrap();

    (persistence, conn, temp_dir)
}

#[test]
fn test_given_multiple_matching_tasks_when_user_interactively_selects_option_then_starts_selected_task(
) {
    // Given
    let (persistence, _conn, _temp) = setup("test_interactive_select");
    let engine = Engine::new(&persistence);
    let args = StartArgs {
        target: Some("oauth".to_string()),
    };
    let prompter = MockPrompter::new_terminal(vec![Some(1)], vec![]);

    // When
    let result = handle_start_interactive(args, &persistence, &engine, &prompter);

    // Then
    assert!(result.is_ok());
    assert_eq!(
        result.unwrap(),
        CliOutput::Started("t-oauth-02".to_string())
    );
    let active = engine.get_active_logs().unwrap();
    assert_eq!(active, vec!["t-oauth-02".to_string()]);
}

#[test]
fn test_given_missing_start_target_when_prompter_cancels_then_returns_syntax_error() {
    // Given
    let (persistence, _conn, _temp) = setup("test_interactive_cancel");
    let engine = Engine::new(&persistence);
    let args = StartArgs { target: None };
    let prompter = MockPrompter::new_terminal(vec![], vec![None]);

    // When
    let result = handle_start_interactive(args, &persistence, &engine, &prompter);

    // Then
    assert!(result.is_err());
    let err = result.unwrap_err();
    assert!(matches!(err, oxy_flow::cli::CliError::Syntax(_)));
}

#[test]
fn test_given_running_timer_when_glance_dashboard_invoked_then_outputs_active_session_card() {
    // Given
    let (persistence, _conn, _temp) = setup("test_interactive_glance");
    let engine = Engine::new(&persistence);
    engine.start_timer("t-oauth-01").unwrap();

    // When
    let result = handle_glance(false, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    if let CliOutput::Success(text) = result.unwrap() {
        assert!(text.contains("Quick Status Dashboard"));
        assert!(text.contains("Active Tracking Session"));
        assert!(text.contains("OAuth2 Login Flow"));
        assert!(text.contains("Core API"));
        assert!(text.contains("Today's Progress"));
        assert!(text.contains("Recent Activity"));
        assert!(text.contains("Tip:"));
    } else {
        panic!("Expected Success output variant");
    }
}

#[test]
fn test_given_today_command_with_machine_flag_then_returns_structured_json_with_entries() {
    // Given
    let (persistence, _conn, _temp) = setup("test_interactive_today_json");
    let engine = Engine::new(&persistence);
    let args = CliArgs::try_parse_from(["oxy", "today", "--json"]).unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    if let CliOutput::Json(json_str) = result.unwrap() {
        let parsed: serde_json::Value = serde_json::from_str(&json_str).unwrap();
        assert!(parsed.get("date").is_some());
        assert!(parsed.get("total_seconds").is_some());
        assert!(parsed.get("entries").is_some());
    } else {
        panic!("Expected Json output variant");
    }
}
