mod shared;

use clap::Parser;
use oxy_flow::cli::shared::parser::CliArgs;
use oxy_flow::engine::Engine;
use oxy_flow::persistence::Persistence;
use shared::test_db::setup_persistence_test;

#[test]
fn smoke_backend_core_lifecycle() {
    // 1. Initialize in-memory SQLite persistence and Engine
    let (_conn, config, _temp_dir) = setup_persistence_test("smoke_backend_core");
    let persistence = Persistence::new(&config).expect("Persistence initialization failed");
    let engine = Engine::new(&persistence);

    // 2. Create project and task using test data builders
    let project = shared::builders::ProjectBuilder::new()
        .with_id("p_smoke")
        .with_name("Smoke Project")
        .with_color("teal")
        .build();
    persistence
        .projects
        .create(project)
        .expect("Failed to create project");

    let task = shared::builders::TaskBuilder::new()
        .with_id("t_smoke")
        .with_project_id("p_smoke")
        .with_name("Smoke Task")
        .build();
    persistence
        .tasks
        .create(task)
        .expect("Failed to create task");

    // 3. Compute engine metrics
    let metrics = engine
        .get_computed_metrics(None)
        .expect("Failed to compute metrics");
    assert!(metrics.tasks.contains_key("t_smoke"));

    // 4. Verify CLI argument parser works (parsing help / command)
    let parsed = CliArgs::try_parse_from(["oxytime-cli", "--help"]);
    match parsed {
        Err(err) => {
            assert_eq!(err.kind(), clap::error::ErrorKind::DisplayHelp);
        }
        Ok(_) => panic!("Expected CLI help display error"),
    }
}
