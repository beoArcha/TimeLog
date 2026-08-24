use crate::shared::test_db::setup_persistence_test;
use oxy_flow::engine::Engine;
use oxy_flow::persistence::Persistence;
use oxy_flow::types::{ElapsedRangeFilter, Project, Settings, Task};

#[test]
fn test_persistence_and_engine_command_flows() {
    let (_conn, config, _temp_dir) = setup_persistence_test("commands_direct_flow");
    let persistence = Persistence::new(&config).unwrap();

    // 1. Settings lifecycle
    let mut settings = Settings::default();
    settings.minimize_to_tray = Some(true);
    settings.gui_variant = Some("compact".to_string());
    persistence.settings.save(settings).unwrap();

    let loaded = persistence.settings.get().unwrap();
    assert_eq!(loaded.gui_variant, Some("compact".to_string()));

    // 2. Project lifecycle
    let project = Project {
        id: "proj_direct_1".to_string(),
        name: "DirectProj".to_string(),
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
    persistence.projects.create(project).unwrap();

    let mut fetched_proj = persistence.projects.get("proj_direct_1").unwrap().unwrap();
    assert_eq!(fetched_proj.name, "DirectProj");

    fetched_proj.name = "DirectProjUpdated".to_string();
    fetched_proj.archived = Some(true);
    persistence.projects.patch(fetched_proj).unwrap();

    let all_projs = persistence.projects.get_all().unwrap();
    assert_eq!(all_projs.len(), 1);
    assert_eq!(all_projs[0].name, "DirectProjUpdated");
    assert_eq!(all_projs[0].archived, Some(true));

    // 3. Task & subtask lifecycle
    let task = Task {
        id: "task_direct_1".to_string(),
        project_id: "proj_direct_1".to_string(),
        parent_task_id: None,
        name: "DirectTask".to_string(),
        created_at: "2025-01-01T00:00:00Z".to_string(),
        completed: false,
        status: None,
        original_name: None,
        original_completed: None,
        edit_history: None,
        archived: Some(false),
    };
    persistence.tasks.create(task).unwrap();

    let subtask = Task {
        id: "subtask_direct_1".to_string(),
        project_id: "proj_direct_1".to_string(),
        parent_task_id: Some("task_direct_1".to_string()),
        name: "DirectSubTask".to_string(),
        created_at: "2025-01-01T00:00:00Z".to_string(),
        completed: false,
        status: None,
        original_name: None,
        original_completed: None,
        edit_history: None,
        archived: Some(false),
    };
    persistence.tasks.create_subtask(subtask).unwrap();

    let subtasks = persistence.tasks.get_subtasks("task_direct_1").unwrap();
    assert_eq!(subtasks.len(), 1);

    // 4. Engine timer operations
    let engine = Engine::new(&persistence);
    engine.start_timer("task_direct_1").unwrap();
    let active = engine.get_active_logs().unwrap();
    assert_eq!(active.len(), 1);
    assert_eq!(active[0], "task_direct_1");

    let metrics = engine.get_computed_metrics(None).unwrap();
    assert!(metrics.tasks.contains_key("task_direct_1"));

    let duration = engine.calculate_task_elapsed("task_direct_1").unwrap();
    assert_eq!(duration.as_secs(), 0);

    let proj_duration = engine.calculate_project_elapsed("proj_direct_1").unwrap();
    assert_eq!(proj_duration.as_secs(), 0);

    let range = engine
        .calculate_elapsed_range(&ElapsedRangeFilter::default())
        .unwrap();
    assert_eq!(range.as_secs(), 0);

    let stats = engine.get_project_statistics("proj_direct_1").unwrap();
    assert_eq!(stats.total_tasks, 2);

    engine.stop_timer(None).unwrap();
    assert_eq!(engine.get_active_logs().unwrap().len(), 0);

    // 5. Time log editing and query
    let all_logs = persistence.time_logs.get_all().unwrap();
    assert!(!all_logs.is_empty());
    let log_id = &all_logs[0].id;

    engine
        .edit_log(
            log_id,
            "task_direct_1",
            "2025-01-01T10:00:00Z",
            Some("2025-01-01T11:00:00Z"),
            Some("Edited Note"),
            Some("Test Reason"),
        )
        .unwrap();

    let edited = persistence.time_logs.get_by_id(log_id).unwrap();
    assert_eq!(edited.note.as_deref(), Some("Edited Note"));

    // 6. Deletion & Cleanup
    persistence
        .tasks
        .archive("task_direct_1".to_string(), "proj_direct_1".to_string())
        .unwrap();
    persistence
        .tasks
        .archive_subtask("subtask_direct_1".to_string(), "proj_direct_1".to_string())
        .unwrap();

    let active_tasks = persistence
        .tasks
        .get_all()
        .unwrap()
        .into_iter()
        .filter(|t| !t.archived.unwrap_or(false))
        .collect::<Vec<_>>();
    assert_eq!(active_tasks.len(), 0);

    persistence.core.clear_all_data().unwrap();
    assert_eq!(persistence.projects.get_all().unwrap().len(), 0);
    assert_eq!(persistence.tasks.get_all().unwrap().len(), 0);
    assert_eq!(persistence.time_logs.get_all().unwrap().len(), 0);
}
