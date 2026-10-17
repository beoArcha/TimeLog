use crate::shared::test_db::setup_persistence_test;
use oxy_flow::persistence::Persistence;
use oxy_flow::types::{
    ExternalApiSettings, HolidayLeave, HolidayType, PatchLog, Project, Task, TaskStatus, TimeLog,
};

#[test]
fn test_persistence_layer_integration_flow() {
    let (_conn, config, _temp_dir) = setup_persistence_test("persistence_integration");
    let persistence = Persistence::new(&config).unwrap();

    let project = Project {
        id: "p-int-1".to_string(),
        name: "IntProject".to_string(),
        color: "indigo".to_string(),
        created_at: "2026-06-22T20:00:00Z".to_string(),
        archived: Some(false),
        original_name: None,
        original_color: None,
        edit_history: None,
        description: None,
        icon: None,
        tags: None,
    };
    persistence.projects.create(project).unwrap();

    let p_opt = persistence.projects.get("p-int-1").unwrap();
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
        status: Some(oxy_flow::types::TaskStatus::Todo),
    };
    persistence.tasks.create(task).unwrap();

    let t_opt = persistence.tasks.get("t-int-1").unwrap();
    assert!(t_opt.is_some());
}

#[test]
fn test_persistence_layer_csv_sink_failure_handling() {
    let (_conn, config, _temp_dir) = setup_persistence_test("persistence_csv_fail");

    let blocked_path = config.csv_directory.join("timelog_p-err.csv");
    std::fs::create_dir(&blocked_path).unwrap();

    let persistence = Persistence::new(&config).unwrap();

    let project = Project {
        id: "p-err".to_string(),
        name: "ErrorProneProject".to_string(),
        color: "yellow".to_string(),
        created_at: "2026-06-22T20:00:00Z".to_string(),
        archived: Some(false),
        original_name: None,
        original_color: None,
        edit_history: None,
        description: None,
        icon: None,
        tags: None,
    };

    let result = persistence.projects.create(project);
    assert!(
        result.is_ok(),
        "CsvSink failure should not break persistence execution"
    );

    let p_opt = persistence.projects.get("p-err").unwrap();
    assert!(p_opt.is_some(), "Project must still be saved to SQLite");
}

#[test]
fn test_persistence_layer_get_all_and_clear() {
    let (_conn, config, _temp_dir) = setup_persistence_test("persistence_get_all");
    let persistence = Persistence::new(&config).unwrap();

    let project = Project {
        id: "p-all-1".to_string(),
        name: "AllProject".to_string(),
        color: "green".to_string(),
        created_at: "2026-06-22T20:00:00Z".to_string(),
        archived: Some(false),
        original_name: None,
        original_color: None,
        edit_history: None,
        description: None,
        icon: None,
        tags: None,
    };
    persistence.projects.create(project).unwrap();

    let task = Task {
        id: "t-all-1".to_string(),
        project_id: "p-all-1".to_string(),
        parent_task_id: None,
        name: "AllTask".to_string(),
        completed: false,
        created_at: "2026-06-22T20:00:00Z".to_string(),
        original_name: None,
        original_completed: None,
        edit_history: None,
        archived: Some(false),
        status: Some(oxy_flow::types::TaskStatus::Todo),
    };
    persistence.tasks.create(task).unwrap();

    let projects = persistence.projects.get_all().unwrap();
    assert_eq!(projects.len(), 1);

    let tasks = persistence.tasks.get_all().unwrap();
    assert_eq!(tasks.len(), 1);

    // Patch project and task
    let mut proj_to_patch = projects[0].clone();
    proj_to_patch.name = "PatchedAllProject".to_string();
    persistence.projects.patch(proj_to_patch).unwrap();

    let mut task_to_patch = tasks[0].clone();
    task_to_patch.name = "PatchedAllTask".to_string();
    persistence.tasks.patch(task_to_patch).unwrap();

    // Create, patch, and archive subtask
    let subtask = Task {
        id: "st-all-1".to_string(),
        project_id: "p-all-1".to_string(),
        parent_task_id: Some("t-all-1".to_string()),
        name: "SubTaskAll".to_string(),
        completed: false,
        created_at: "2026-06-22T20:00:00Z".to_string(),
        original_name: None,
        original_completed: None,
        edit_history: None,
        archived: Some(false),
        status: Some(oxy_flow::types::TaskStatus::Todo),
    };
    persistence.tasks.create_subtask(subtask.clone()).unwrap();

    let mut subtask_to_patch = subtask;
    subtask_to_patch.name = "SubTaskAllPatched".to_string();
    persistence.tasks.patch_subtask(subtask_to_patch).unwrap();

    persistence
        .tasks
        .archive_subtask("st-all-1".to_string(), "p-all-1".to_string())
        .unwrap();

    // Settings runtime config methods
    persistence
        .settings
        .save_runtime_config(oxy_flow::types::RuntimeConfig {
            id: "cfg_1".to_string(),
            runtime: "test_runtime".to_string(),
            config: "{\"mode\":\"test\"}".to_string(),
            created_at: "2026-06-22T20:00:00Z".to_string(),
        })
        .unwrap();
    let configs = persistence.settings.get_runtime_configs().unwrap();
    assert_eq!(
        configs
            .iter()
            .find(|c| c.runtime == "test_runtime")
            .map(|c| c.config.as_str()),
        Some("{\"mode\":\"test\"}")
    );

    persistence.core.clear_all_data().unwrap();

    assert_eq!(persistence.projects.get_all().unwrap().len(), 0);
    assert_eq!(persistence.tasks.get_all().unwrap().len(), 0);
}

#[test]
fn test_persistence_auxiliary_and_aux_domains() {
    let (_conn, config, _temp_dir) = setup_persistence_test("persistence_aux_domains");
    let persistence = Persistence::new(&config).unwrap();

    // Auxiliary UI State
    assert_eq!(
        persistence.auxiliary.get_current_project_id().unwrap(),
        None
    );
    persistence
        .auxiliary
        .save_current_project_id(Some("proj-123".to_string()))
        .unwrap();
    assert_eq!(
        persistence.auxiliary.get_current_project_id().unwrap(),
        Some("proj-123".to_string())
    );

    assert_eq!(
        persistence
            .auxiliary
            .get_last_non_compact_variant()
            .unwrap(),
        "full"
    );
    persistence
        .auxiliary
        .save_last_non_compact_variant("compact".to_string())
        .unwrap();
    assert_eq!(
        persistence
            .auxiliary
            .get_last_non_compact_variant()
            .unwrap(),
        "compact"
    );

    // Auxiliary External API Settings
    let default_api = persistence.auxiliary.get_external_api_settings().unwrap();
    assert!(!default_api.log_to_api);

    let custom_api = ExternalApiSettings {
        log_to_api: true,
        api_token: "tok_abc".to_string(),
        api_url: "https://api.test/webhook".to_string(),
        api_method: "POST".to_string(),
        api_headers: "X-Auth: tok".to_string(),
    };
    persistence
        .auxiliary
        .save_external_api_settings(custom_api.clone())
        .unwrap();
    assert_eq!(
        persistence.auxiliary.get_external_api_settings().unwrap(),
        custom_api
    );

    // Holidays persistence
    let holidays = vec![HolidayLeave {
        id: "hol_1".to_string(),
        date: "2026-07-04".to_string(),
        r#type: HolidayType::Holiday,
        name: "Independence Day".to_string(),
        note: None,
        original_name: None,
        original_date: None,
        original_type: None,
        edit_history: None,
    }];
    persistence.holidays.save(holidays.clone()).unwrap();
    assert_eq!(persistence.holidays.get_all().unwrap().len(), 1);

    // Patches persistence
    let project = Project {
        id: "proj_patch_int".to_string(),
        name: "Patch Int".to_string(),
        color: "teal".to_string(),
        created_at: "2026-06-22T20:00:00Z".to_string(),
        archived: Some(false),
        original_name: None,
        original_color: None,
        edit_history: None,
        description: None,
        icon: None,
        tags: None,
    };
    persistence.projects.create(project).unwrap();

    let patches = vec![PatchLog {
        id: "patch_int_1".to_string(),
        project_id: "proj_patch_int".to_string(),
        task_id: None,
        start_time: "2026-06-22T08:00:00Z".to_string(),
        end_time: "2026-06-22T08:30:00Z".to_string(),
        patch_note: "Integration patch".to_string(),
        is_system_event: Some(false),
    }];
    persistence.patches.save(patches.clone()).unwrap();
    assert_eq!(persistence.patches.get_all().unwrap().len(), 1);

    // TimeLog delete
    let task = Task {
        id: "task_log_del".to_string(),
        project_id: "proj_patch_int".to_string(),
        parent_task_id: None,
        name: "Task For Log Delete".to_string(),
        completed: false,
        created_at: "2026-06-22T20:00:00Z".to_string(),
        original_name: None,
        original_completed: None,
        edit_history: None,
        archived: Some(false),
        status: Some(TaskStatus::Todo),
    };
    persistence.tasks.create(task).unwrap();

    persistence
        .time_logs
        .insert("log_to_del", "task_log_del", "2026-06-22T08:00:00Z")
        .unwrap();
    assert_eq!(persistence.time_logs.get_all().unwrap().len(), 1);

    persistence.time_logs.delete("log_to_del").unwrap();
    assert_eq!(persistence.time_logs.get_all().unwrap().len(), 0);

    // Core override_state integration
    let override_projs = vec![Project {
        id: "p_over".to_string(),
        name: "Overridden Project".to_string(),
        color: "purple".to_string(),
        created_at: "2026-06-23T00:00:00Z".to_string(),
        archived: Some(false),
        original_name: None,
        original_color: None,
        edit_history: None,
        description: None,
        icon: None,
        tags: None,
    }];
    let override_tasks = vec![Task {
        id: "t_over".to_string(),
        project_id: "p_over".to_string(),
        parent_task_id: None,
        name: "Overridden Task".to_string(),
        completed: true,
        created_at: "2026-06-23T00:01:00Z".to_string(),
        original_name: None,
        original_completed: None,
        edit_history: None,
        archived: Some(false),
        status: Some(TaskStatus::Done),
    }];
    let override_logs = vec![TimeLog {
        id: "l_over".to_string(),
        task_id: "t_over".to_string(),
        project_id: "p_over".to_string(),
        start_time: "2026-06-23T01:00:00Z".to_string(),
        end_time: Some("2026-06-23T02:00:00Z".to_string()),
        note: Some("Override note".to_string()),
        edit_history: None,
    }];

    persistence
        .core
        .override_state(
            Some(override_projs),
            Some(override_tasks),
            Some(override_logs),
        )
        .unwrap();

    assert_eq!(persistence.projects.get_all().unwrap().len(), 1);
    assert_eq!(persistence.projects.get_all().unwrap()[0].id, "p_over");
    assert_eq!(persistence.tasks.get_all().unwrap().len(), 1);
    assert_eq!(persistence.tasks.get_all().unwrap()[0].id, "t_over");
    assert_eq!(persistence.time_logs.get_all().unwrap().len(), 1);
    assert_eq!(persistence.time_logs.get_all().unwrap()[0].id, "l_over");
}
