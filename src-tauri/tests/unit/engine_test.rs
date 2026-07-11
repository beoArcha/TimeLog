use crate::shared::test_db::setup_persistence_test;
use chrono::{Duration as ChronoDuration, Utc};
use oxy_flow::engine::Engine;
use oxy_flow::persistence::Persistence;
use oxy_flow::types::{Project, Task};

#[test]
fn test_engine_elapsed_time_calculations() {
    let (conn, config, _temp_dir) = setup_persistence_test("engine_elapsed");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let project = Project {
        id: "p1".to_string(),
        name: "EngineProj".to_string(),
        color: "green".to_string(),
        created_at: Utc::now().to_rfc3339(),
        archived: Some(false),
        original_name: None,
        original_color: None,
        edit_history: None,
    };
    persistence.projects.create(project).unwrap();

    let task = Task {
        id: "t1".to_string(),
        project_id: "p1".to_string(),
        parent_task_id: None,
        name: "ParentTask".to_string(),
        completed: false,
        created_at: Utc::now().to_rfc3339(),
        original_name: None,
        original_completed: None,
        edit_history: None,
        archived: Some(false),
    };
    persistence.tasks.create(task).unwrap();

    let subtask = Task {
        id: "t1-sub".to_string(),
        project_id: "p1".to_string(),
        parent_task_id: Some("t1".to_string()),
        name: "Subtask".to_string(),
        completed: false,
        created_at: Utc::now().to_rfc3339(),
        original_name: None,
        original_completed: None,
        edit_history: None,
        archived: Some(false),
    };
    persistence.tasks.create_subtask(subtask).unwrap();

    let now = Utc::now();
    let start_10m_ago = (now - ChronoDuration::minutes(10)).to_rfc3339();
    let end_5m_ago = (now - ChronoDuration::minutes(5)).to_rfc3339();

    conn.execute(
        "INSERT INTO time_logs (id, task_id, start_time, end_time) VALUES (?, ?, ?, ?)",
        ["l1", "t1", &start_10m_ago, &end_5m_ago],
    )
    .unwrap();

    conn.execute(
        "INSERT INTO time_logs (id, task_id, start_time, end_time) VALUES (?, ?, ?, NULL)",
        ["l2", "t1-sub", &start_10m_ago],
    )
    .unwrap();

    let subtask_elapsed = engine.calculate_subtask_elapsed("t1-sub").unwrap();
    assert!(
        subtask_elapsed.as_secs() >= 598 && subtask_elapsed.as_secs() <= 602,
        "subtask elapsed: {:?}",
        subtask_elapsed
    );

    let task_elapsed = engine.calculate_task_elapsed("t1").unwrap();
    assert!(
        task_elapsed.as_secs() >= 898 && task_elapsed.as_secs() <= 902,
        "task elapsed: {:?}",
        task_elapsed
    );

    let proj_elapsed = engine.calculate_project_elapsed("p1").unwrap();
    assert!(
        proj_elapsed.as_secs() >= 898 && proj_elapsed.as_secs() <= 902,
        "project elapsed: {:?}",
        proj_elapsed
    );
}
