use crate::shared::builders::{ProjectBuilder, TaskBuilder};
use crate::shared::test_db::setup_persistence_test;
use oxy_flow::engine::Engine;
use oxy_flow::persistence::Persistence;
use oxy_flow::types::{AuditSource, ElapsedRangeFilter, Settings};

#[test]
fn test_settings_lifecycle_save_and_retrieve() {
    // Arrange
    let (_conn, config, _temp_dir) = setup_persistence_test("unit_settings_lifecycle");
    let persistence = Persistence::new(&config).unwrap();
    let settings = Settings {
        minimize_to_tray: Some(true),
        gui_variant: Some("compact".to_string()),
        ..Default::default()
    };

    // Act
    persistence.settings.save(settings).unwrap();
    let loaded = persistence.settings.get().unwrap();

    // Assert
    assert_eq!(loaded.gui_variant, Some("compact".to_string()));
    assert_eq!(loaded.minimize_to_tray, Some(true));
}

#[test]
fn test_project_lifecycle_create_and_patch() {
    // Arrange
    let (_conn, config, _temp_dir) = setup_persistence_test("unit_project_lifecycle");
    let persistence = Persistence::new(&config).unwrap();
    let project = ProjectBuilder::new()
        .with_id("proj_flow_1")
        .with_name("DirectProj")
        .with_color("blue")
        .build();

    // Act
    persistence.projects.create(project).unwrap();
    let mut fetched_proj = persistence.projects.get("proj_flow_1").unwrap().unwrap();
    fetched_proj.name = "DirectProjUpdated".to_string();
    fetched_proj.archived = Some(true);
    persistence.projects.patch(fetched_proj).unwrap();
    let all_projs = persistence.projects.get_all().unwrap();

    // Assert
    assert_eq!(all_projs.len(), 1);
    assert_eq!(all_projs[0].name, "DirectProjUpdated");
    assert_eq!(all_projs[0].archived, Some(true));
}

#[test]
fn test_task_and_subtask_hierarchy_creation() {
    // Arrange
    let (_conn, config, _temp_dir) = setup_persistence_test("unit_task_hierarchy");
    let persistence = Persistence::new(&config).unwrap();
    let project = ProjectBuilder::new().with_id("proj_flow_1").build();
    persistence.projects.create(project).unwrap();
    let task = TaskBuilder::new()
        .with_id("task_flow_1")
        .with_project_id("proj_flow_1")
        .with_name("Parent Task")
        .build();
    let subtask = TaskBuilder::new()
        .with_id("subtask_flow_1")
        .with_project_id("proj_flow_1")
        .with_parent("task_flow_1")
        .with_name("Child Subtask")
        .build();

    // Act
    persistence.tasks.create(task).unwrap();
    persistence.tasks.create_subtask(subtask).unwrap();
    let subtasks = persistence.tasks.get_subtasks("task_flow_1").unwrap();

    // Assert
    assert_eq!(subtasks.len(), 1);
    assert_eq!(subtasks[0].id, "subtask_flow_1");
    assert_eq!(subtasks[0].name, "Child Subtask");
}

#[test]
fn test_engine_timer_start_and_metrics_calculation() {
    // Arrange
    let (_conn, config, _temp_dir) = setup_persistence_test("unit_timer_metrics");
    let persistence = Persistence::new(&config).unwrap();
    let project = ProjectBuilder::new().with_id("proj_flow_1").build();
    persistence.projects.create(project).unwrap();
    let task = TaskBuilder::new()
        .with_id("task_flow_1")
        .with_project_id("proj_flow_1")
        .build();
    persistence.tasks.create(task).unwrap();
    let engine = Engine::new(&persistence);

    // Act
    engine.start_timer("task_flow_1").unwrap();
    let active = engine.get_active_logs().unwrap();
    let metrics = engine.get_computed_metrics(None).unwrap();
    let duration = engine.calculate_task_elapsed("task_flow_1").unwrap();
    let proj_duration = engine.calculate_project_elapsed("proj_flow_1").unwrap();
    let range = engine
        .calculate_elapsed_range(&ElapsedRangeFilter::default())
        .unwrap();
    let stats = engine.get_project_statistics("proj_flow_1").unwrap();

    // Assert
    assert_eq!(active.len(), 1);
    assert_eq!(active[0], "task_flow_1");
    assert!(metrics.tasks.contains_key("task_flow_1"));
    assert_eq!(duration.as_secs(), 0);
    assert_eq!(proj_duration.as_secs(), 0);
    assert_eq!(range.as_secs(), 0);
    assert_eq!(stats.total_tasks, 1);
}

#[test]
fn test_engine_timer_stop_and_log_editing() {
    // Arrange
    let (_conn, config, _temp_dir) = setup_persistence_test("unit_stop_edit_log");
    let persistence = Persistence::new(&config).unwrap();
    let project = ProjectBuilder::new().with_id("proj_flow_1").build();
    persistence.projects.create(project).unwrap();
    let task = TaskBuilder::new()
        .with_id("task_flow_1")
        .with_project_id("proj_flow_1")
        .build();
    persistence.tasks.create(task).unwrap();
    let engine = Engine::new(&persistence);
    engine.start_timer("task_flow_1").unwrap();
    engine.stop_timer(None).unwrap();
    let all_logs = persistence.time_logs.get_all().unwrap();
    let log_id = &all_logs[0].id;

    // Act
    engine
        .edit_log(
            log_id,
            "task_flow_1",
            "2025-01-01T10:00:00Z",
            Some("2025-01-01T11:00:00Z"),
            Some("Edited Note"),
            Some(AuditSource::ManualAdjustment),
        )
        .unwrap();
    let edited = persistence.time_logs.get_by_id(log_id).unwrap();

    // Assert
    assert_eq!(edited.note.as_deref(), Some("Edited Note"));
    assert_eq!(engine.get_active_logs().unwrap().len(), 0);
}

#[test]
fn test_persistence_cleanup_and_clear_all_data() {
    // Arrange
    let (_conn, config, _temp_dir) = setup_persistence_test("unit_clear_all");
    let persistence = Persistence::new(&config).unwrap();
    let project = ProjectBuilder::new().with_id("proj_flow_1").build();
    persistence.projects.create(project).unwrap();
    let task = TaskBuilder::new()
        .with_id("task_flow_1")
        .with_project_id("proj_flow_1")
        .build();
    persistence.tasks.create(task).unwrap();
    persistence
        .time_logs
        .insert("log_1", "task_flow_1", "2025-01-01T10:00:00Z")
        .unwrap();

    // Act
    persistence.core.clear_all_data().unwrap();

    // Assert
    assert_eq!(persistence.projects.get_all().unwrap().len(), 0);
    assert_eq!(persistence.tasks.get_all().unwrap().len(), 0);
    assert_eq!(persistence.time_logs.get_all().unwrap().len(), 0);
}
