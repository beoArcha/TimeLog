use crate::shared::builders::{ProjectBuilder, TaskBuilder};
use crate::shared::test_db::setup_persistence_test;
use chrono::{Duration as ChronoDuration, Utc};
use oxy_flow::engine::Engine;
use oxy_flow::persistence::Persistence;

#[test]
fn test_engine_elapsed_time_calculations() {
    // Arrange
    let (conn, config, _temp_dir) = setup_persistence_test("engine_elapsed");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let project = ProjectBuilder::new()
        .with_id("p1")
        .with_name("EngineProj")
        .with_color("green")
        .with_created_at(Utc::now().to_rfc3339())
        .build();
    persistence.projects.create(project).unwrap();

    let task = TaskBuilder::new()
        .with_id("t1")
        .with_project_id("p1")
        .with_name("ParentTask")
        .with_created_at(Utc::now().to_rfc3339())
        .build();
    persistence.tasks.create(task).unwrap();

    let subtask = TaskBuilder::new()
        .with_id("t1-sub")
        .with_project_id("p1")
        .with_parent("t1")
        .with_name("Subtask")
        .with_created_at(Utc::now().to_rfc3339())
        .build();
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

    let start_20m_ago = (now - ChronoDuration::minutes(20)).to_rfc3339();
    let end_15m_ago = (now - ChronoDuration::minutes(15)).to_rfc3339();
    conn.execute(
        "INSERT INTO time_logs (id, task_id, start_time, end_time) VALUES (?, ?, ?, ?)",
        ["l3", "t1-sub", &start_20m_ago, &end_15m_ago],
    )
    .unwrap();

    // Act
    let subtask_elapsed = engine.calculate_subtask_elapsed("t1-sub").unwrap();
    let task_elapsed = engine.calculate_task_elapsed("t1").unwrap();
    let proj_elapsed = engine.calculate_project_elapsed("p1").unwrap();

    // Assert
    assert!(subtask_elapsed.as_secs() >= 898 && subtask_elapsed.as_secs() <= 902);
    assert!(task_elapsed.as_secs() >= 1198 && task_elapsed.as_secs() <= 1202);
    assert!(proj_elapsed.as_secs() >= 1198 && proj_elapsed.as_secs() <= 1202);
}

#[test]
fn test_project_statistics() {
    // Arrange
    let (_conn, config, _temp_dir) = setup_persistence_test("engine_stats");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let project = ProjectBuilder::new()
        .with_id("p_stats")
        .with_name("StatsProj")
        .with_color("blue")
        .with_created_at(Utc::now().to_rfc3339())
        .build();
    persistence.projects.create(project).unwrap();

    let task1 = TaskBuilder::new()
        .with_id("t_stats1")
        .with_project_id("p_stats")
        .with_name("Task 1")
        .completed(true)
        .with_created_at(Utc::now().to_rfc3339())
        .build();
    persistence.tasks.create(task1).unwrap();

    let task2 = TaskBuilder::new()
        .with_id("t_stats2")
        .with_project_id("p_stats")
        .with_name("Task 2")
        .completed(false)
        .with_created_at(Utc::now().to_rfc3339())
        .build();
    persistence.tasks.create(task2).unwrap();

    // Act
    let stats = engine.get_project_statistics("p_stats").unwrap();

    // Assert
    assert_eq!(stats.total_tasks, 2);
    assert_eq!(stats.completed_tasks, 1);
}
