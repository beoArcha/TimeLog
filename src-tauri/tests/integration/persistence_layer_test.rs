use crate::shared::test_db::setup_persistence_test;
use oxy_flow::persistence::PersistenceLayer;
use oxy_flow::types::{Project, Task};

#[test]
fn test_persistence_layer_integration_flow() {
    let (_conn, config, _temp_dir) = setup_persistence_test("persistence_integration");
    let persistence = PersistenceLayer::new(&config).unwrap();

    let project = Project {
        id: "p-int-1".to_string(),
        name: "IntProject".to_string(),
        color: "indigo".to_string(),
        created_at: "2026-06-22T20:00:00Z".to_string(),
        archived: Some(false),
        original_name: None,
        original_color: None,
        edit_history: None,
    };
    persistence.create_project(project).unwrap();

    let p_opt = persistence.get_project("p-int-1").unwrap();
    assert!(p_opt.is_some());
    let p = p_opt.unwrap();
    assert_eq!(p.name, "IntProject");

    let expected_csv_file = config.csv_directory.join("timelog_p-int-1.csv");
    assert!(
        expected_csv_file.exists(),
        "CSV audit file should be created"
    );

    let task = Task {
        id: "t-int-1".to_string(),
        project_id: "p-int-1".to_string(),
        parent_task_id: None,
        name: "IntTask".to_string(),
        completed: false,
        created_at: "2026-06-22T20:00:00Z".to_string(),
        original_name: None,
        original_completed: None,
        edit_history: None,
        archived: Some(false),
    };
    persistence.create_task(task).unwrap();

    let t_opt = persistence.get_task("t-int-1").unwrap();
    assert!(t_opt.is_some());
}

#[test]
fn test_persistence_layer_csv_sink_failure_handling() {
    let (_conn, config, _temp_dir) = setup_persistence_test("persistence_csv_fail");

    let blocked_path = config.csv_directory.join("timelog_p-err.csv");
    std::fs::create_dir(&blocked_path).unwrap();

    let persistence = PersistenceLayer::new(&config).unwrap();

    let project = Project {
        id: "p-err".to_string(),
        name: "ErrorProneProject".to_string(),
        color: "yellow".to_string(),
        created_at: "2026-06-22T20:00:00Z".to_string(),
        archived: Some(false),
        original_name: None,
        original_color: None,
        edit_history: None,
    };

    let result = persistence.create_project(project);
    assert!(
        result.is_ok(),
        "CsvSink failure should not break persistence execution"
    );

    let p_opt = persistence.get_project("p-err").unwrap();
    assert!(p_opt.is_some(), "Project must still be saved to SQLite");
}
